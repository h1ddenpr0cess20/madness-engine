import * as GFX from '../gfx/index.js';
import { Renderer } from '../gfx/renderer.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { WebGPUBackend } from '../gfx/webgpu.js';
import { createView } from '../views/catroller.js';
import { KEY } from './core.js';

/** How far back the camera sits at zoom 1, and its lens. */
export const LENS = Object.freeze({ distance: 13, fov: 36 });

/** How many lamps near the ball get a real light. The count is fixed, so the shaders never change. */
const LAMP_LIGHTS = 4;

export async function createRenderer(preference) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn('catroller: WebGPU unavailable, falling back to WebGL 2.', err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

/**
 * A room, as an equirectangular canvas: cream walls warm with lamplight,
 * a dark window with the moon in it, a wooden floor. Only ever seen in
 * reflections — the cats' eyes, the vacuum's lid, the varnish.
 */
export function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#5a4c44');
  wall.addColorStop(0.3, '#8a7058');
  wall.addColorStop(0.5, '#b08a64');
  wall.addColorStop(0.52, '#6a4a30');
  wall.addColorStop(1, '#2a1c14');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  // The window: night, and the moon.
  ctx.fillStyle = '#1a2440';
  ctx.fillRect(width * 0.62, height * 0.18, width * 0.14, height * 0.24);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(width * 0.7, height * 0.24, height * 0.05, 'rgba(210, 225, 255, 0.9)');
  for (let k = 0; k < 4; k++) glow(width * (0.1 + k * 0.24), height * 0.38, height * 0.12, 'rgba(255, 190, 110, 0.75)');
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/** Outside the house: night, deep blue above, a little warmer toward the bottom. */
function paintBackdrop(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#05060f');
  g.addColorStop(0.45, '#0d1024');
  g.addColorStop(0.62, '#171530');
  g.addColorStop(0.85, '#231a2c');
  g.addColorStop(1, '#2c1d26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  return c;
}

export async function createStage(host) {
  const preference = new URLSearchParams(globalThis.location?.search ?? '').get('renderer');
  const renderer = await createRenderer(preference);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = GFX.PCFShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new GFX.Scene();
  const camera = new GFX.PerspectiveCamera(LENS.fov, 1, 0.3, 400);

  if (renderer.isWebGPU && preference !== 'webgpu') {
    renderer.backend.onLost = () => {
      const old = renderer.domElement;
      const canvas = document.createElement('canvas');
      try {
        renderer.setBackend(new WebGLBackend(canvas), canvas);
        old.replaceWith(canvas);
        console.warn('catroller: the GPU went away; carrying on with WebGL 2.');
      } catch (err) {
        console.error('catroller: the GPU went away and WebGL 2 is not available.', err);
      }
    };
  }

  const sky = new GFX.HemisphereLight(0xffe2c4, 0x3a2a22, 0.75);
  scene.add(sky);
  const key = new GFX.DirectionalLight(0xfff0dc, 1.15);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  let span = 0;
  const shadowSpan = (zoom) => {
    const want = Math.ceil(14 * Math.max(1, zoom));
    if (want === span) return;
    span = want;
    Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 100 + span * 2 });
    key.shadow.camera.updateProjectionMatrix();
  };
  shadowSpan(1);
  scene.add(key, key.target);

  // The lamps nearest the ball.
  const lampLights = Array.from({ length: LAMP_LIGHTS }, () => {
    const light = new GFX.PointLight(0xffc27a, 0, 8, 1.6);
    scene.add(light);
    return light;
  });
  let lamps = [];

  const night = paintBackdrop();
  const nightMap = night ? new GFX.CanvasTexture(night) : null;
  if (nightMap) nightMap.colorSpace = GFX.SRGBColorSpace;
  const backdrop = new GFX.Mesh(
    new GFX.SphereGeometry(300, 64, 32),
    new GFX.MeshBasicMaterial({ name: 'backdrop', map: nightMap, color: new GFX.Color(nightMap ? '#ffffff' : '#0d1024'), side: GFX.BackSide, depthWrite: false }),
  );
  backdrop.renderOrder = -1;
  backdrop.frustumCulled = false;
  backdrop.onBeforeRender = (r, s, cam) => {
    backdrop.position.copy(cam.position);
    backdrop.updateMatrixWorld();
  };
  scene.add(backdrop);

  const room = paintRoom();
  if (room) {
    const texture = new GFX.Texture(room);
    texture.mapping = GFX.EquirectangularReflectionMapping;
    texture.colorSpace = GFX.SRGBColorSpace;
    texture.needsUpdate = true;
    const pmrem = new GFX.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
  }

  const stage = {
    GFX, renderer, scene, camera, key, sky,
    view: createView(),
    target: new GFX.Vector3(),
    /** Where the ball is, for its glow; set every frame. */
    ball: new GFX.Vector3(),
    time: 0,
    /** The lamps of the level being played, as [x, y, z] bulbs. */
    setLamps(list) { lamps = list.map((at) => ({ at })); },
    /** How bright the house is: lower in the cellar. */
    setMood({ sky: s = 0.75, key: k = 1.15 } = {}) { sky.intensity = s; key.intensity = k; },
  };

  const direction = new GFX.Vector3();

  /** Point the camera and the lights at `stage.target`, from where the view is; called every frame. */
  stage.look = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    camera.aspect = w / h;
    // An upright phone sees as much house across as a wide screen does.
    camera.fov = LENS.fov * Math.max(1, Math.min(1.75, 0.8 * h / w));
    camera.updateProjectionMatrix();
    direction.set(...stage.view.direction());
    camera.position.copy(stage.target).addScaledVector(direction, LENS.distance * stage.view.zoom);
    shadowSpan(stage.view.zoom);
    camera.lookAt(stage.target);
    camera.updateMatrixWorld();
    key.position.copy(stage.target).addScaledVector(KEY, 45 + span);
    key.target.position.copy(stage.target);
    key.target.updateMatrixWorld();

    // The nearest lamps get the real lights. There are only so many, so the furthest of them dims to nothing as
    // the next lamp out comes as near: when the two change places, the light goes over at no brightness at all,
    // and nothing flickers.
    const near = lamps
      .map((t) => ({ t, d: Math.hypot(t.at[0] - stage.ball.x, t.at[2] - stage.ball.z) }))
      .sort((a, b) => a.d - b.d);
    const next = near[LAMP_LIGHTS]?.d ?? Infinity;
    lampLights.forEach((light, i) => {
      const n = near[i];
      if (!n) { light.intensity = 0; return; }
      light.position.set(...n.t.at);
      const reach = Math.max(0, Math.min(1, (18 - n.d) / 6));
      const handover = Math.max(0, Math.min(1, (next - n.d) / 3));
      light.intensity = 9 * reach * handover;
    });
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);
  return stage;
}
