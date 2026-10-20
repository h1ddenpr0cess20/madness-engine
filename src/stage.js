import { createFilm } from './film.js';
import * as GFX from './gfx/index.js';
import { Renderer } from './gfx/renderer.js';
import { WebGLBackend } from './gfx/webgl.js';
import { WebGPUBackend } from './gfx/webgpu.js';
import { createView } from './views/arcade.js';

/**
 * The screen: the renderer, the scene, the lights, the sky and the camera,
 * set up the way every one of the rolling games does it, with what differs
 * from game to game as options.
 *
 *     const stage = await createStage(document.querySelector('#game'), {
 *       sky: paintSky(),     // textures/skies/*: what is round the scene
 *       room: paintRoom(),   // textures/rooms/*: what shiny things reflect
 *     });
 *     stage.setMood(noir);  // moods/*: a set's light, sky, reflections and film at once
 *     // every frame:
 *     stage.target.set(ball.x, ball.y, ball.z);
 *     stage.view.step(dt);
 *     stage.look();
 *     stage.render();
 *
 * The renderer is WebGPU where the browser has it and WebGL 2 where it
 * doesn't; `?renderer=webgl` (or `webgpu`) in the page's address pins it. If
 * the GPU goes away under WebGPU, the stage carries on in WebGL 2.
 */

/** How far back the camera sits at zoom 1, in tiles, and its lens. */
export const LENS = Object.freeze({ distance: 10, fov: 36 });

/** Where the key light comes from: high, behind the camera's left shoulder. */
export const KEY = Object.freeze(new GFX.Vector3(-0.3, 1, 0.6).normalize());

/** The light every game starts from: a soft wash, a warm key that casts the shadows, a dim fill from behind. */
export const LIGHTS = Object.freeze({
  hemisphere: { sky: '#dfe4ff', ground: '#2a2630', intensity: 0.9 },
  key: { color: '#fff4e8', intensity: 2.4, from: KEY },
  fill: { color: '#fff4e6', intensity: 0.5, offset: [6, 3, -5] },
});

/** Round the sky dome (a SphereGeometry's u) and round the reflections (equirectangular): where direction (dx, dz) lands across a painted sky. */
export const domeU = (dx, dz) => ((Math.atan2(dz, -dx) / (Math.PI * 2)) % 1 + 1) % 1;

/** The renderer the address asks for: 'webgl', 'webgpu', or null for whichever is best. */
export const preferredRenderer = () => new URLSearchParams(globalThis.location?.search ?? '').get('renderer');

/**
 * A renderer on a canvas of its own: WebGPU unless `preference` is 'webgl'
 * or the browser has none, WebGL 2 otherwise. `label` names the game in
 * what it says on the console.
 */
export async function createRenderer(preference = preferredRenderer(), { label = 'madness-engine' } = {}) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn(`${label}: WebGPU unavailable, falling back to WebGL 2.`, err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

/** A painted canvas, or nothing, as a texture in sRGB. */
const canvasTexture = (canvas) => {
  if (!canvas) return null;
  const map = new GFX.CanvasTexture(canvas);
  map.colorSpace = GFX.SRGBColorSpace;
  return map;
};

/**
 * @param host  the element the canvas goes in; the stage fills it and follows its size
 * @param options
 *   - `lens`: { distance, fov } (LENS)
 *   - `view`: where the camera is round the target (views/*; the arcade's by default)
 *   - `sky`: a painted canvas round everything, or a colour (`backdrop`)
 *   - `room`: a painted canvas the reflections come from, or null for none
 *   - `lights`: any of LIGHTS' parts to change; `fill: null` for no fill
 *   - `fixtures`: how many real lights a light show (scenery/lightshow) may set at once (0).
 *     The count is fixed, so no shader ever has to change; hand `stage.fixtureLights` to the show's `update`
 *   - `shadows`: whether the key casts them (true); `shadowSize`, the map's size (2048)
 *   - `pixelRatio`: the most device pixels a CSS pixel gets (2)
 *   - `ui`: elements shot on the same film as the picture where a film says so (film.js)
 *   - `label`: the game's name, for the console
 * @returns the stage: { GFX, renderer, scene, camera, view, target, key, hemi, fill,
 *   film, lantern, fixtureLights, shake, look(), render(), setSky(canvas), setRoom(canvas), setMood(mood) }
 */
export async function createStage(host, {
  lens = LENS,
  view = createView(),
  sky = null,
  backdrop = '#0b0e1d',
  room = null,
  lights = {},
  fixtures = 0,
  shadows = true,
  shadowSize = 2048,
  pixelRatio = 2,
  ui = [],
  preference = preferredRenderer(),
  label = 'madness-engine',
} = {}) {
  const renderer = await createRenderer(preference, { label });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, pixelRatio));
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = GFX.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const film = createFilm(host, { canvas: () => renderer.domElement, ui });

  const scene = new GFX.Scene();
  const camera = new GFX.PerspectiveCamera(lens.fov, 1, 0.3, 400);

  if (renderer.isWebGPU && preference !== 'webgpu') {
    renderer.backend.onLost = () => {
      const old = renderer.domElement;
      const canvas = document.createElement('canvas');
      try {
        renderer.setBackend(new WebGLBackend(canvas), canvas);
        old.replaceWith(canvas);
        film.set(film.current);
        console.warn(`${label}: the GPU went away; carrying on with WebGL 2.`);
      } catch (err) {
        console.error(`${label}: the GPU went away and WebGL 2 is not available.`, err);
      }
    };
  }

  const rig = {
    hemisphere: { ...LIGHTS.hemisphere, ...lights.hemisphere },
    key: { ...LIGHTS.key, ...lights.key },
    fill: lights.fill === null ? null : { ...LIGHTS.fill, ...lights.fill },
  };
  const hemi = new GFX.HemisphereLight(new GFX.Color(rig.hemisphere.sky), new GFX.Color(rig.hemisphere.ground), rig.hemisphere.intensity);
  scene.add(hemi);
  const key = new GFX.DirectionalLight(new GFX.Color(rig.key.color), rig.key.intensity);
  key.castShadow = shadows;
  key.shadow.mapSize.set(shadowSize, shadowSize);
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
  let fill = null;
  if (rig.fill) {
    fill = new GFX.DirectionalLight(new GFX.Color(rig.fill.color), rig.fill.intensity);
    scene.add(fill, fill.target);
  }

  // Opaque all round: glass refracts whatever is behind it, and over nothing at all it would bend the renderer's stand-in grey.
  const backdropMaterial = new GFX.MeshBasicMaterial({ name: 'backdrop', color: new GFX.Color(backdrop), side: GFX.BackSide, depthWrite: false });
  const dome = new GFX.Mesh(new GFX.SphereGeometry(300, 64, 32), backdropMaterial);
  dome.renderOrder = -1;
  dome.frustumCulled = false;
  dome.onBeforeRender = (r, s, cam) => {
    dome.position.copy(cam.position);
    dome.updateMatrixWorld();
  };
  scene.add(dome);

  // The fixtures nearest the ball: a light show sets where they are, what colour and how bright.
  const fixtureLights = Array.from({ length: fixtures }, () => {
    const light = new GFX.PointLight(0xffffff, 0, 7, 1.1);
    scene.add(light);
    return light;
  });

  const pmrem = new GFX.PMREMGenerator(renderer);
  let lanternHeight = 0;

  const stage = {
    GFX, renderer, scene, camera, view, key, hemi, fill, film, fixtureLights,
    /** The light a mood hangs over the target, or null. */
    lantern: null,
    /** What the camera looks at; set it every frame (the ball, usually). */
    target: new GFX.Vector3(),
    /** How hard the camera is being shaken, in tiles. The game sets it and lets it die away. */
    shake: 0,

    /** Paints the sky round everything with `canvas` (or the backdrop colour if null). */
    setSky(canvas) {
      const map = canvasTexture(canvas);
      backdropMaterial.map = map;
      backdropMaterial.color.set(map ? '#ffffff' : backdrop);
      backdropMaterial.needsUpdate = true;
    },

    /** What shiny things reflect: an equirectangular `canvas`, or null for nothing. */
    setRoom(canvas) {
      if (!canvas) { scene.environment = null; return; }
      const texture = new GFX.Texture(canvas);
      texture.mapping = GFX.EquirectangularReflectionMapping;
      texture.colorSpace = GFX.SRGBColorSpace;
      texture.needsUpdate = true;
      scene.environment = pmrem.fromEquirectangular(texture).texture;
    },

    /**
     * Dresses the stage in a mood (moods/*): its light, its sky, what its
     * chrome reflects and the film it is shot on, whichever of them the
     * mood has. Its light is the whole light of its set: the wash, the key,
     * and a lantern hung over `target` (the rock games hang one over Rock),
     * and no fill, which those games don't have. Its weather and its music
     * are the game's to start (`effects.setWeather(mood.weather)`, and
     * `mood.music.theme` at `mood.music.tempo` on the band in
     * `mood.music.band`).
     */
    setMood(mood) {
      if (mood.light) {
        const { hemisphere, key: k, lantern: l } = mood.light;
        hemi.color.set(hemisphere.sky);
        hemi.groundColor.set(hemisphere.ground);
        hemi.intensity = hemisphere.intensity;
        key.color.set(k.color);
        key.intensity = k.intensity;
        if (fill) fill.visible = false;
        if (l && !stage.lantern) {
          stage.lantern = new GFX.PointLight(new GFX.Color(l.color));
          scene.add(stage.lantern);
        }
        if (stage.lantern) {
          stage.lantern.visible = Boolean(l);
          if (l) {
            stage.lantern.color.set(l.color);
            Object.assign(stage.lantern, { intensity: l.intensity, distance: l.distance, decay: l.decay });
            lanternHeight = l.height;
          }
        }
      }
      if (mood.paintSky) stage.setSky(mood.paintSky());
      if (mood.paintRoom) stage.setRoom(mood.paintRoom());
      if ('film' in mood) film.set(mood.film);
    },
  };
  stage.setSky(sky);
  stage.setRoom(room);

  const direction = new GFX.Vector3();
  const offset = new GFX.Vector3(...(rig.fill?.offset ?? [0, 0, 0]));

  /** Point the camera and the lights at `stage.target`, from where the view is; once a frame. */
  stage.look = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    camera.aspect = w / h;
    // An upright phone sees as much across as a wide screen does.
    camera.fov = lens.fov * Math.max(1, Math.min(1.75, 0.8 * h / w));
    camera.updateProjectionMatrix();
    direction.set(...stage.view.direction());
    camera.position.copy(stage.target).addScaledVector(direction, lens.distance * stage.view.zoom);
    shadowSpan(stage.view.zoom);
    if (stage.shake > 0.002) {
      camera.position.x += (Math.random() - 0.5) * stage.shake;
      camera.position.y += (Math.random() - 0.5) * stage.shake;
      camera.position.z += (Math.random() - 0.5) * stage.shake;
    }
    camera.lookAt(stage.target);
    camera.updateMatrixWorld();
    key.position.copy(stage.target).addScaledVector(rig.key.from, 45 + span);
    key.target.position.copy(stage.target);
    key.target.updateMatrixWorld();
    if (fill) {
      fill.position.copy(stage.target).add(offset);
      fill.target.position.copy(stage.target);
      fill.target.updateMatrixWorld();
    }
    if (stage.lantern) stage.lantern.position.set(stage.target.x, stage.target.y + lanternHeight, stage.target.z);
  };

  const fit = () => renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  fit();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(host);

  stage.render = () => renderer.render(scene, camera);

  /**
   * The game's loop: `update(dt)` once a frame (dt in seconds, never more
   * than `most`, so a tab coming back from the background doesn't throw
   * everything across the board), then the camera and the picture. Returns
   * a function that stops it.
   */
  stage.run = (update, { most = 0.1 } = {}) => {
    let last = null;
    renderer.setAnimationLoop((now) => {
      const dt = last === null ? 0 : Math.min(most, Math.max(0, (now - last) / 1000));
      last = now;
      update(dt);
      stage.look();
      stage.render();
    });
    return () => renderer.setAnimationLoop(null);
  };
  return stage;
}
