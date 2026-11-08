/**
 * A turntable for the models (a game's models.html): one or a row of them on
 * a floor under stage light, to look at while sculpting. Not part of a game.
 * ?m=rat,orc&clip=walk&yaw=0.6&pitch=0.3&dist=1.4&time=0
 * (time fixed for a still, t how far into the clip; no time and it plays;
 * detail=0.5 for the board's mesh; ty=0.6 to look at that height). A model
 * not in the game's `definitions` is taken from the engine's library.
 *
 * The page needs `#view` and `#bar`. `startViewer({ definitions })` takes the
 * game's cast and props, as a list of objects by name; `paintRoom` is the
 * room the models are lit by, and `createRenderer` the renderer, if the game
 * wants another.
 */

import { CHARACTERS } from '../characters/index.js';
import * as GFX from '../gfx/index.js';
import { PROPS as ALL_PROPS } from '../props/index.js';
import { createRenderer as engineRenderer } from '../stage.js';
import { paintRoom as venueRoom } from '../textures/rooms/venue.js';
import { createModel } from './model.js';

export async function startViewer({ definitions = [], paintRoom = venueRoom, createRenderer = engineRenderer } = {}) {
  const params = new URLSearchParams(location.search);
  const host = document.getElementById('view');
  const renderer = await createRenderer(params.get('renderer') ?? 'webgl');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = GFX.PCFShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new GFX.Scene();
  const camera = new GFX.PerspectiveCamera(30, 1, 0.05, 100);
  scene.add(new GFX.HemisphereLight(0x8a96c0, 0x1a1210, 0.55));
  const key = new GFX.DirectionalLight(0xc8d2ff, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.01;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 100 });
  key.shadow.camera.updateProjectionMatrix();
  key.position.set(-6, 20, 12);
  scene.add(key, key.target);
  const lantern = new GFX.PointLight(0xffd9a0, 9, 7.5, 1.6);
  lantern.position.set(1.2, 1.6, 1.8);
  scene.add(lantern);
  const torch = new GFX.PointLight(0xff9a4a, 5, 6, 1.7);
  torch.position.set(-1.8, 1.1, -0.8);
  scene.add(torch);
  const room = paintRoom();
  const texture = new GFX.Texture(room);
  texture.mapping = GFX.EquirectangularReflectionMapping;
  texture.colorSpace = GFX.SRGBColorSpace;
  texture.needsUpdate = true;
  const pmrem = new GFX.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(texture).texture;

  const floor = new GFX.Mesh(new GFX.CircleGeometry(6, 64), new GFX.MeshStandardMaterial({ color: new GFX.Color('#3a3530'), roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.background = null;

  let models = [];
  const state = { look: params.has('ty') ? Number(params.get('ty')) : null, clip: params.get('clip') ?? 'idle', t: Number(params.get('t') ?? 0), yaw: Number(params.get('yaw') ?? 0.6), pitch: Number(params.get('pitch') ?? 0.32), dist: Number(params.get('dist') ?? 1), time: params.has('time') ? Number(params.get('time')) : null, playing: !params.has('time') };

  /** A definition by name: from the game's, or from the engine's library. */
  const load = (name) => definitions.map((d) => d[name]).find(Boolean) ?? CHARACTERS[name] ?? ALL_PROPS[name];

  async function place(names, detail = 1) {
    const list = names.map(load);
    for (const m of models) scene.remove(m.group);
    models = list.map((def) => createModel(GFX, def, { detail }));
    let x = 0;
    const box = new GFX.Box3();
    const sizeOf = (m) => {
      m.pose({ clip: 'idle', t: 0, time: 0, seed: 0 });
      m.group.updateMatrixWorld(true);
      box.setFromObject(m.group);
      return box;
    };
    const boxes = models.map((m) => sizeOf(m).clone());
    const widths = boxes.map((b) => Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2);
    const total = widths.reduce((s, w) => s + w * 2.2, 0);
    x = -total / 2;
    models.forEach((m, i) => {
      m.group.position.x = x + widths[i] * 1.1;
      // A flyer's middle is its origin: lift it clear of the floor.
      if (boxes[i].min.y < -0.01) m.group.position.y = -boxes[i].min.y + 0.15;
      x += widths[i] * 2.2;
      scene.add(m.group);
    });
    state.radius = Math.max(total / 2, ...widths, ...boxes.map((b) => (b.max.y - b.min.y) * 0.62));
    state.height = Math.max(...boxes.map((b, i) => (b.max.y + b.min.y) / 2 + models[i].group.position.y));
  }

  const bar = document.getElementById('bar');
  for (const clip of ['idle', 'walk', 'attack', 'hit', 'cast', 'ko', 'win']) {
    const b = document.createElement('button');
    b.textContent = clip;
    b.onclick = () => { state.clip = clip; state.t = 0; };
    bar.append(b);
  }

  let clock = 0;
  function frame(dt) {
    clock += dt;
    if (!params.has('t')) state.t += dt;
    const time = state.time ?? clock;
    const t = state.playing ? state.t % 1.6 : state.t;
    models.forEach((m, i) => {
      // A still is played up to its moment, so anything on springs has settled where it would be.
      if (!state.playing) for (let x = 0; x < t; x += 1 / 60) m.pose({ clip: state.clip, t: x, time: time - t + x, seed: i * 1.7, speed: 1 });
      m.pose({ clip: state.clip, t, time, seed: i * 1.7, speed: 1 });
    });
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const r = state.radius * 3.2 * state.dist;
    const ty = state.look ?? state.height * 0.9;
    camera.position.set(Math.sin(state.yaw) * Math.cos(state.pitch) * r, ty + Math.sin(state.pitch) * r, Math.cos(state.yaw) * Math.cos(state.pitch) * r);
    camera.lookAt(new GFX.Vector3(0, ty, 0));
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
  }

  await place((params.get('m') ?? 'rat').split(','), params.has('detail') ? Number(params.get('detail')) : 1);
  let last = performance.now();
  function loop(now) {
    frame(Math.min(0.05, (now - last) / 1000));
    last = now;
    if (state.playing) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  globalThis.viewer = {
    state,
    place,
    /** Renders one still: `set` some of the state, then draw. */
    async still(next = {}) {
      Object.assign(state, next, { playing: false });
      if (next.models) await place(next.models, next.detail);
      frame(0);
      return true;
    },
  };
}
