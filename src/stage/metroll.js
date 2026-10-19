import * as GFX from '../gfx/index.js';
import { Renderer } from '../gfx/renderer.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { WebGPUBackend } from '../gfx/webgpu.js';
import { createView } from '../views/arcade.js';
import { paintBackdrop } from '../horizons/metroll.js';
import { FIXTURE_LIGHTS, KEY, LENS, withAlpha } from './core.js';
export { FIXTURE_LIGHTS, LENS };

export async function createRenderer(preference) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn('metroll: WebGPU unavailable, falling back to WebGL 2.', err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

/**
 * The room the reflections come from, as an equirectangular canvas: a dark
 * ceiling, the venue's colours in a ring of lights round the walls, and a
 * bright rig overhead. Only ever seen in reflections.
 */
export function paintRoom({ colors = ['#ff9a3a'], ceiling = '#2a2a38', width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, ceiling);
  wall.addColorStop(0.32, '#16161c');
  wall.addColorStop(0.55, '#0c0b0d');
  wall.addColorStop(1, '#040404');
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
  glow(width * 0.25, height * 0.12, height * 0.2, 'rgba(210, 220, 255, 0.55)');
  // Strip lights overhead and a ring of the stop's colours round the walls: what the chrome catches.
  for (let k = 0; k < 6; k++) glow(width * (0.08 + k * 0.17), height * (0.2 + (k % 2) * 0.05), height * 0.13, 'rgba(235, 240, 255, 0.5)');
  for (let k = 0; k < 8; k++) glow(width * (0.06 + k * 0.125), height * (0.3 + (k % 2) * 0.1), height * 0.1, withAlpha(colors[k % colors.length], 0.9));
  ctx.globalCompositeOperation = 'source-over';
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
        console.warn('metroll: the GPU went away; carrying on with WebGL 2.');
      } catch (err) {
        console.error('metroll: the GPU went away and WebGL 2 is not available.', err);
      }
    };
  }

  const hemi = new GFX.HemisphereLight(0x8a96c0, 0x1a1210, 0.55);
  scene.add(hemi);
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

  // Metroll's own light, high over it, faint and wide: enough to find it in the dark, a wash over the floor round it rather than a spot under it.
  const lantern = new GFX.PointLight(0xffe2b8, 1.1, 22, 0.9);
  scene.add(lantern);
  // The fixtures nearest it: the light show sets where they are, what colour and how bright.
  const fixtureLights = Array.from({ length: FIXTURE_LIGHTS }, () => {
    const light = new GFX.PointLight(0xffffff, 0, 7, 1.1);
    scene.add(light);
    return light;
  });

  const backdropMaterial = new GFX.MeshBasicMaterial({ name: 'backdrop', color: new GFX.Color('#050407'), side: GFX.BackSide, depthWrite: false });
  const backdrop = new GFX.Mesh(new GFX.SphereGeometry(300, 64, 32), backdropMaterial);
  backdrop.renderOrder = -1;
  backdrop.frustumCulled = false;
  backdrop.onBeforeRender = (r, s, cam) => {
    backdrop.position.copy(cam.position);
    backdrop.updateMatrixWorld();
  };
  scene.add(backdrop);

  const pmrem = new GFX.PMREMGenerator(renderer);

  const stage = {
    GFX, renderer, scene, camera, key, hemi, lantern, fixtureLights,
    view: createView(),
    target: new GFX.Vector3(),
    /** Where Metroll is, for the lantern; set every frame. */
    troll: new GFX.Vector3(),
    time: 0,
    /** How much extra light the strobes are throwing right now, 0 to 1: the page can flash with it. */
    flash: 0,
    /** How hard the camera is being shaken, in tiles; it dies away by itself. */
    shake: 0,

    /**
     * Dresses the stage for a stop: its sky and horizon, its wash of light,
     * the colours its chrome reflects, and its light (`look.grade`: 'fog'
     * for London, 'dusk' for Venice, 'alpine' for the glare off the snow,
     * 'warm' for the south, 'neon' for Tokyo, 'tropical' for Rio), which the
     * page's stylesheet applies to the picture and nothing else; and a haze
     * over everything in a sandstorm.
     */
    setVenue(venue) {
      const look = venue.look ?? {};
      host.dataset.grade = look.grade ?? '';
      document.body.classList.toggle('sandstorm', look.weather === 'sand');
      const palette = venue.palette ?? {};
      const sky = paintBackdrop({ sky: look.skyColors, stars: look.stars, skyline: look.skyline, horizon: look.horizon, glow: look.glow });
      if (sky) {
        const map = new GFX.CanvasTexture(sky);
        map.colorSpace = GFX.SRGBColorSpace;
        backdropMaterial.map = map;
        backdropMaterial.color.set('#ffffff');
        backdropMaterial.needsUpdate = true;
      }
      const [skyHex, groundHex, hemiK] = look.hemi ?? ['#8a96c0', '#1a1210', 0.55];
      hemi.color.set(skyHex);
      hemi.groundColor.set(groundHex);
      hemi.intensity = hemiK;
      key.color.set(look.key ?? '#c8d2ff');
      key.intensity = look.keyK ?? 0.9;
      lantern.color.set(look.lantern ?? '#ffe2b8');
      const room = paintRoom({ colors: look.reflect ?? [palette.lamp ?? '#ffa04a'], ceiling: look.ceiling });
      if (room) {
        const texture = new GFX.Texture(room);
        texture.mapping = GFX.EquirectangularReflectionMapping;
        texture.colorSpace = GFX.SRGBColorSpace;
        texture.needsUpdate = true;
        scene.environment = pmrem.fromEquirectangular(texture).texture;
      }
    },
  };

  const direction = new GFX.Vector3();

  /** Point the camera and the lights at `stage.target`, from where the view is; called every frame. */
  stage.look = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    camera.aspect = w / h;
    // An upright phone sees as much venue across as a wide screen does.
    camera.fov = LENS.fov * Math.max(1, Math.min(1.75, 0.8 * h / w));
    camera.updateProjectionMatrix();
    direction.set(...stage.view.direction());
    camera.position.copy(stage.target).addScaledVector(direction, LENS.distance * stage.view.zoom);
    shadowSpan(stage.view.zoom);
    if (stage.shake > 0.002) {
      camera.position.x += (Math.random() - 0.5) * stage.shake;
      camera.position.y += (Math.random() - 0.5) * stage.shake;
      camera.position.z += (Math.random() - 0.5) * stage.shake;
    }
    camera.lookAt(stage.target);
    camera.updateMatrixWorld();
    key.position.copy(stage.target).addScaledVector(KEY, 45 + span);
    key.target.position.copy(stage.target);
    key.target.updateMatrixWorld();
    lantern.position.set(stage.troll.x, stage.troll.y + 7, stage.troll.z);
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);
  return stage;
}
