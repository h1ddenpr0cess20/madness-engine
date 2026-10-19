import * as GFX from '../gfx/index.js';
import { WebGLBackend } from '../gfx/webgl.js';
import { createView } from '../views/arcade.js';
import { FIXTURE_LIGHTS, KEY, LENS, createRenderer, paintRoom } from './core.js';
export { FIXTURE_LIGHTS, LENS, createRenderer, paintRoom };

/** The dark round the venue: the colours it is given, top to bottom, and the glow of a crowd or a city if it has one. */
function paintBackdrop({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  if (stars) {
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 220; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
      const r = rnd() * 1.4 + 0.3;
      ctx.fillRect(rnd() * width, rnd() * height * 0.5, r, r);
    }
  }
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

    /** Dresses the stage for a venue: its sky, its wash of light, the colours its chrome reflects. */
    setVenue(venue) {
      const look = venue.look ?? {};
      const palette = venue.palette ?? {};
      const sky = paintBackdrop({ sky: look.skyColors, stars: look.stars });
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
