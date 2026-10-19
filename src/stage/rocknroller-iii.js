import * as GFX from '../gfx/index.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { createView } from '../views/arcade.js';
import { mix } from '../textures/rocknroller-iii.js';
import { FIXTURE_LIGHTS, KEY, LENS, createRenderer, paintRoom } from './core.js';
export { FIXTURE_LIGHTS, LENS, createRenderer, paintRoom };

/**
 * The sky round the stop, painted on a canvas: a gradient from `sky`,
 * stars if it is night, and along the horizon (`horizon`, in `skyline`'s
 * colour): rolling `hills` with a town's lights on them, a `city` of
 * towers and lit windows, snow-capped `peaks`, `dunes` with the pyramids
 * on them, the flat `sea` with the moon's path on it, or a city at the foot
 * of Mount Fuji (`fuji`).
 */
function paintBackdrop({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, horizon = 'hills', width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  if (stars) {
    for (let k = 0; k < 220; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
      const r = rnd() * 1.4 + 0.3;
      ctx.fillRect(rnd() * width, rnd() * height * 0.5, r, r);
    }
  }
  if (!skyline) return c;
  const base = height * 0.5;
  const ridge = (f, colour) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 4) ctx.lineTo(x, f(x));
    ctx.lineTo(width, height);
    ctx.fill();
  };
  const windows = (n, top, depth) => {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.3 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * width, top + rnd() * depth, 1.4, 1.4);
    }
  };
  if (horizon === 'peaks') {
    // Two ranges of jagged peaks, the far one paler; snow on every summit.
    const peak = (x, seed, tall) => {
      let y = 0;
      for (const [f, a] of [[0.006, 1], [0.017, 0.45], [0.043, 0.2], [0.11, 0.08]]) y += a * Math.abs(Math.sin(x * f + seed));
      return base - tall * y;
    };
    for (const [seed, tall, shade] of [[2, 150, 0.55], [5, 105, 1]]) {
      ridge((x) => peak(x, seed, tall), shade < 1 ? mix(skyline, '#c8d4ec', 0.45) : skyline);
      ctx.fillStyle = shade < 1 ? 'rgba(236,242,255,0.85)' : 'rgba(244,248,255,0.95)';
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = peak(x, seed, tall), snowline = base - tall * 0.95;
        if (y < snowline) { ctx.moveTo(x, y); ctx.lineTo(x, Math.min(snowline + 8 * Math.sin(x * 0.2), y + 30)); }
      }
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    }
    return c;
  }
  if (horizon === 'city' || horizon === 'fuji') {
    if (horizon === 'fuji') {
      // The mountain, alone and enormous, a cap of snow.
      const cx = width * 0.62, top = base - 150;
      ctx.fillStyle = mix(skyline, '#6a7aa8', 0.4);
      ctx.beginPath(); ctx.moveTo(cx - 330, base + 10); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + 330, base + 10); ctx.fill();
      ctx.fillStyle = '#eef2ff';
      ctx.beginPath(); ctx.moveTo(cx - 100, top + 50); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + 100, top + 50);
      for (let k = 0; k < 6; k++) ctx.lineTo(cx + 100 - k * 40, top + 50 + (k % 2 ? 14 : 2));
      ctx.fill();
    }
    // Towers, blocks and spires, their windows lit.
    let x = 0;
    ctx.fillStyle = skyline;
    while (x < width) {
      const w = 14 + rnd() * 34, h = 20 + rnd() * (horizon === 'fuji' ? 40 : 90);
      ctx.fillRect(x, base - h, w, h + height);
      if (rnd() < 0.15) { ctx.beginPath(); ctx.moveTo(x + w * 0.3, base - h); ctx.lineTo(x + w / 2, base - h - 26); ctx.lineTo(x + w * 0.7, base - h); ctx.fill(); }
      x += w + rnd() * 4;
    }
    windows(900, base - 100, 110);
    return c;
  }
  if (horizon === 'dunes') {
    ridge((x) => base - 12 - 14 * Math.sin(x * 0.007) - 6 * Math.sin(x * 0.023 + 2), skyline);
    // The three pyramids, the middle one biggest.
    for (const [cx, r] of [[width * 0.3, 70], [width * 0.4, 90], [width * 0.48, 46]]) {
      ctx.fillStyle = skyline;
      ctx.beginPath(); ctx.moveTo(cx - r, base); ctx.lineTo(cx, base - r * 0.95); ctx.lineTo(cx + r, base); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,160,0.18)';
      ctx.beginPath(); ctx.moveTo(cx, base - r * 0.95); ctx.lineTo(cx + r, base); ctx.lineTo(cx + r * 0.2, base); ctx.fill();
    }
    return c;
  }
  if (horizon === 'sea') {
    ctx.fillStyle = skyline;
    ctx.fillRect(0, base, width, height - base);
    for (let k = 0; k < 160; k++) {
      ctx.fillStyle = `rgba(255,248,220,${0.15 + rnd() * 0.4})`;
      ctx.fillRect(width * 0.55 + (rnd() - 0.5) * 60 * (1 + k / 60), base + 3 + k * 0.8, 6 + rnd() * 14, 1);
    }
    return c;
  }
  // Hills along the horizon, and a town's lights scattered over them.
  ridge((x) => base - 18 - 22 * Math.sin(x * 0.011) - 12 * Math.sin(x * 0.031 + 1) - 6 * Math.sin(x * 0.09), skyline);
  windows(500, base - 10, 26);
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
        console.warn('rocknroller: the GPU went away; carrying on with WebGL 2.');
      } catch (err) {
        console.error('rocknroller: the GPU went away and WebGL 2 is not available.', err);
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

  // Rock's own light, high over him, faint and wide: enough to find him in the dark, a wash over the floor round him rather than a spot under him.
  const lantern = new GFX.PointLight(0xffe2b8, 1.1, 22, 0.9);
  scene.add(lantern);
  // The fixtures nearest him: the light show sets where they are, what colour and how bright.
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
    /** Where Rock is, for the lantern; set every frame. */
    rock: new GFX.Vector3(),
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
      const sky = paintBackdrop({ sky: look.skyColors, stars: look.stars, skyline: look.skyline, horizon: look.horizon });
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
    lantern.position.set(stage.rock.x, stage.rock.y + 7, stage.rock.z);
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);
  return stage;
}
