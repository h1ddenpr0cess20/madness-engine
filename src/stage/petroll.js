import * as GFX from '../gfx/index.js';
import { Renderer } from '../gfx/renderer.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { WebGPUBackend } from '../gfx/webgpu.js';
import { createView } from '../views/town.js';
import { MOON, SKY, domeU } from './core.js';
export { MOON };

/** How far back the camera sits at zoom 1, and its lens. Where round the marble it is, is the view's (`view.js`). */
export const LENS = Object.freeze({ distance: 10, fov: 36 });

async function createRenderer(preference) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn('petroll: WebGPU unavailable, falling back to WebGL 2.', err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

/** How many of the town's lamps get a real light at once (the nearest the hamster). The count is fixed, so no shader ever changes. */
export const LAMP_LIGHTS = 6;

/**
 * The night over Petroleum Springs, as an equirectangular canvas: stars, a
 * moon, a sky going to a dirty orange at the horizon where the refineries
 * light it from below, and on the horizon the silhouettes of cracking
 * towers and flare stacks burning, derricks with red lights on top, and
 * the lights of the next town.
 */
function paintSky(u, { width = 2048, ridge = true } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  for (const [t, col] of SKY) g.addColorStop(t, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const horizon = height / 2;
  let s = 11;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // The glow off the refineries, low along the horizon, strongest in two places.
  for (const [cx, w, a] of [[0.15, 0.25, 0.32], [0.62, 0.2, 0.26], [0.88, 0.12, 0.16]]) {
    for (const ox of [-width, 0, width]) {
      const glow = ctx.createRadialGradient(cx * width + ox, horizon, 0, cx * width + ox, horizon, w * width);
      glow.addColorStop(0, `rgba(255,140,60,${a})`);
      glow.addColorStop(0.4, `rgba(200,90,50,${a * 0.4})`);
      glow.addColorStop(1, 'rgba(120,60,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizon - height * 0.3, width, height * 0.35);
    }
  }
  for (let k = 0; k < 900; k++) {
    const y = r() * horizon * 0.92;
    ctx.fillStyle = `rgba(255,255,255,${(0.15 + r() * 0.6) * (1 - y / horizon)})`;
    const sz = r() < 0.04 ? 2 : 1.1;
    ctx.fillRect(r() * width, y, sz, sz);
  }
  // The moon.
  const mx = u(MOON.x, MOON.z) * width, my = horizon - (Math.asin(MOON.y * 0.45) / Math.PI) * height;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, height * 0.12);
  halo.addColorStop(0, 'rgba(220,230,255,0.35)');
  halo.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - height * 0.12, my - height * 0.12, height * 0.24, height * 0.24);
  ctx.fillStyle = '#eef0f6';
  ctx.beginPath(); ctx.arc(mx, my, height * 0.018, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(180,186,200,0.6)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [0.05, 0.35, 0.12]]) {
    ctx.beginPath(); ctx.arc(mx + dx * height * 0.018, my + dy * height * 0.018, rr * height * 0.018, 0, Math.PI * 2); ctx.fill();
  }
  if (!ridge) return c;
  const ink = '#08070c';
  // Low hills all round.
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 6);
  for (let x = 0; x <= width; x += 6) ctx.lineTo(x, horizon - 4 - 6 * (0.5 + 0.5 * Math.sin(x / 70)) - 4 * Math.sin(x / 19 + 1) ** 2);
  ctx.lineTo(width, height); ctx.lineTo(0, height);
  ctx.fill();
  // Refineries: towers, columns, stacks with flames, and their lights.
  const refinery = (x0, w) => {
    ctx.fillStyle = ink;
    for (let x = x0; x < x0 + w; x += 4 + r() * 8) {
      const h = 6 + r() * 26, bw = 3 + r() * 6;
      ctx.fillRect(x, horizon - 8 - h, bw, h + 10);
      if (r() < 0.3) { ctx.beginPath(); ctx.arc(x + bw / 2, horizon - 8, 6 + r() * 6, Math.PI, 0); ctx.fill(); }
    }
    for (let k = 0; k < 3; k++) {
      const x = x0 + r() * w, h = 36 + r() * 30;
      ctx.fillStyle = ink;
      ctx.fillRect(x, horizon - 8 - h, 3, h);
      const f = ctx.createRadialGradient(x + 1.5, horizon - 12 - h, 0, x + 1.5, horizon - 12 - h, 14);
      f.addColorStop(0, 'rgba(255,230,160,1)'); f.addColorStop(0.3, 'rgba(255,140,40,0.8)'); f.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = f;
      ctx.fillRect(x - 14, horizon - 30 - h, 32, 32);
    }
    for (let k = 0; k < w * 0.6; k++) {
      ctx.fillStyle = `rgba(255,${190 + r() * 60},${110 + r() * 80},${0.5 + r() * 0.5})`;
      ctx.fillRect(x0 + r() * w, horizon - 10 - r() * 34, 1.5, 1.5);
    }
  };
  refinery(width * 0.08, width * 0.14);
  refinery(width * 0.56, width * 0.12);
  // Derricks across the fields, each with a red light on top.
  for (let k = 0; k < 22; k++) {
    const x = r() * width, h = 14 + r() * 16, base = horizon - 6;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x - 5, base); ctx.lineTo(x, base - h); ctx.lineTo(x + 5, base); ctx.stroke();
    ctx.fillStyle = 'rgba(255,40,30,0.95)';
    ctx.fillRect(x - 1, base - h - 2, 2, 2);
  }
  // A town's lights in the distance.
  for (let k = 0; k < 260; k++) {
    ctx.fillStyle = `rgba(255,${200 + r() * 55},${130 + r() * 90},${0.3 + r() * 0.6})`;
    ctx.fillRect(width * 0.3 + r() * width * 0.14, horizon - 4 - r() * 8, 1.2, 1.2);
  }
  return c;
}

/** What the chrome, the paint and the puddles reflect: the night, and the sodium and neon of the town round them. */
function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#141a30');
  wall.addColorStop(0.45, '#0e0e18');
  wall.addColorStop(0.55, '#1a120c');
  wall.addColorStop(1, '#060504');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, rr, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  };
  glow(width * 0.3, height * 0.1, height * 0.18, 'rgba(200,210,255,0.35)');
  const colours = ['rgba(255,170,80,0.8)', 'rgba(255,60,60,0.6)', 'rgba(255,200,120,0.7)', 'rgba(80,200,255,0.5)', 'rgba(255,170,80,0.8)', 'rgba(255,120,40,0.7)'];
  for (let k = 0; k < 12; k++) glow(width * (0.04 + k * 0.083), height * (0.38 + (k % 3) * 0.05), height * 0.06, colours[k % colours.length]);
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
        console.warn('petroll: the GPU went away; carrying on with WebGL 2.');
      } catch (err) {
        console.error('petroll: the GPU went away and WebGL 2 is not available.', err);
      }
    };
  }

  // Night: a dim blue wash, the moon for the shadows, a lantern over the hamster, and the lamps nearest it lit for real.
  const hemi = new GFX.HemisphereLight(0x7a88c0, 0x2a1c14, 0.55);
  scene.add(hemi);
  const key = new GFX.DirectionalLight(0xb8c6ff, 0.75);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  // The shadows cover what's in view: further out, a wider square.
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
  const lantern = new GFX.PointLight(0xffe2b8, 2.2, 12, 1.1);
  scene.add(lantern);
  const lampLights = Array.from({ length: LAMP_LIGHTS }, () => {
    const light = new GFX.PointLight(0xffffff, 0, 8, 1.2);
    scene.add(light);
    return light;
  });

  // Opaque all round: the glass refracts whatever is behind it, and over
  // nothing at all it would bend the renderer's stand-in grey.
  const sky = paintSky(domeU);
  const skyMap = sky ? new GFX.CanvasTexture(sky) : null;
  if (skyMap) skyMap.colorSpace = GFX.SRGBColorSpace;
  const backdrop = new GFX.Mesh(
    new GFX.SphereGeometry(300, 64, 32),
    new GFX.MeshBasicMaterial({ name: 'backdrop', map: skyMap, color: new GFX.Color(skyMap ? '#ffffff' : '#070a1c'), side: GFX.BackSide, depthWrite: false }),
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
    GFX, renderer, scene, camera, key, hemi, lantern, lampLights,
    /** Where the hamster is, for the lantern; set every frame. */
    hamster: new GFX.Vector3(),
    view: createView(),
    target: new GFX.Vector3(),
  };

  const direction = new GFX.Vector3();

  /** Point the camera and the lights at `stage.target`, from where the view is; called every frame. */
  stage.look = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    camera.aspect = w / h;
    // An upright phone sees as much course across as a wide screen does.
    camera.fov = LENS.fov * Math.max(1, Math.min(1.75, 0.8 * h / w));
    camera.updateProjectionMatrix();
    direction.set(...stage.view.direction());
    camera.position.copy(stage.target).addScaledVector(direction, LENS.distance * stage.view.zoom);
    shadowSpan(stage.view.zoom);
    camera.lookAt(stage.target);
    camera.updateMatrixWorld();
    key.position.copy(stage.target).addScaledVector(MOON, 45 + span);
    key.target.position.copy(stage.target);
    key.target.updateMatrixWorld();
    lantern.position.set(stage.hamster.x + 0.6, stage.hamster.y + 3.5, stage.hamster.z + 0.6);
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);
  return stage;
}
