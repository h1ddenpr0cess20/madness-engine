import * as GFX from '../gfx/index.js';
import { Renderer } from '../gfx/renderer.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { WebGPUBackend } from '../gfx/webgpu.js';
import { flicker } from '../scenery/dungeon-roller.js';
import { createView } from '../views/arcade.js';
import { KEY } from './core.js';

/** How far back the camera sits at zoom 1, and its lens. */
export const LENS = Object.freeze({ distance: 13, fov: 36 });

/** How many torches near the die get a real light. The count is fixed, so the shaders never change. */
const TORCH_LIGHTS = 4;

export async function createRenderer(preference) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn('dungeon-roller: WebGPU unavailable, falling back to WebGL 2.', err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

/**
 * The vault, as an equirectangular canvas: dark stone all round, a little
 * warm light low down from torches somewhere, a cold grey shaft from above.
 * Only ever seen in reflections.
 */
export function paintVault(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#3c4250');
  wall.addColorStop(0.3, '#1b1d24');
  wall.addColorStop(0.55, '#100d0c');
  wall.addColorStop(1, '#050404');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(width * 0.25, height * 0.1, height * 0.18, 'rgba(200, 215, 255, 0.55)');
  for (let k = 0; k < 6; k++) glow(width * (0.08 + k * 0.17), height * 0.48, height * 0.06, 'rgba(255, 150, 60, 0.7)');
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/** The dark round the dungeon: black above, a faint ember-red haze far below. */
function paintBackdrop(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#000000');
  g.addColorStop(0.45, '#050407');
  g.addColorStop(0.62, '#0d0708');
  g.addColorStop(0.85, '#1c0b07');
  g.addColorStop(1, '#2a0f06');
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
        console.warn('dungeon-roller: the GPU went away; carrying on with WebGL 2.');
      } catch (err) {
        console.error('dungeon-roller: the GPU went away and WebGL 2 is not available.', err);
      }
    };
  }

  scene.add(new GFX.HemisphereLight(0x8a96c0, 0x1a1210, 0.55));
  const key = new GFX.DirectionalLight(0xc8d2ff, 0.9);
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

  // The party's lantern, carried over the die.
  const lantern = new GFX.PointLight(0xffd9a0, 9, 7.5, 1.6);
  scene.add(lantern);
  // The torches nearest the die.
  const torchLights = Array.from({ length: TORCH_LIGHTS }, () => {
    const light = new GFX.PointLight(0xff9a4a, 0, 6, 1.7);
    scene.add(light);
    return light;
  });
  let torches = [];

  const sky = paintBackdrop();
  const skyMap = sky ? new GFX.CanvasTexture(sky) : null;
  if (skyMap) skyMap.colorSpace = GFX.SRGBColorSpace;
  const backdrop = new GFX.Mesh(
    new GFX.SphereGeometry(300, 64, 32),
    new GFX.MeshBasicMaterial({ name: 'backdrop', map: skyMap, color: new GFX.Color(skyMap ? '#ffffff' : '#050407'), side: GFX.BackSide, depthWrite: false }),
  );
  backdrop.renderOrder = -1;
  backdrop.frustumCulled = false;
  backdrop.onBeforeRender = (r, s, cam) => {
    backdrop.position.copy(cam.position);
    backdrop.updateMatrixWorld();
  };
  scene.add(backdrop);

  const room = paintVault();
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
    GFX, renderer, scene, camera, key,
    view: createView(),
    target: new GFX.Vector3(),
    /** Where the die is, for the lantern; set every frame. */
    die: new GFX.Vector3(),
    time: 0,
    /** The torches of the level now being played, as [x, y, z] flames. */
    setTorches(list) { torches = list.map((at, i) => ({ at, seed: i * 1.91 })); },
  };

  const direction = new GFX.Vector3();

  /** Point the camera and the lights at `stage.target`, from where the view is; called every frame. */
  stage.look = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    camera.aspect = w / h;
    // An upright phone sees as much dungeon across as a wide screen does.
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

    lantern.position.set(stage.die.x, stage.die.y + 1.6, stage.die.z);
    // The nearest torches get the real lights, each fading in as it comes into reach.
    const near = torches
      .map((t) => ({ t, d: Math.hypot(t.at[0] - stage.die.x, t.at[2] - stage.die.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, TORCH_LIGHTS);
    torchLights.forEach((light, i) => {
      const n = near[i];
      if (!n) { light.intensity = 0; return; }
      light.position.set(...n.t.at);
      light.position.y += 0.15;
      const fade = Math.max(0, Math.min(1, (16 - n.d) / 6));
      light.intensity = 7 * fade * flicker(stage.time, n.t.seed);
    });
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);
  return stage;
}
