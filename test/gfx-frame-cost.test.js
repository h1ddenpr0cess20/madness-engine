import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { Renderer } from '../src/gfx/renderer.js';
import { Uniforms } from '../src/gfx/webgl.js';

/** A backend that draws nothing and remembers what it was asked to: each pass, its scissor, and the draws in it. */
const W = 1200, H = 900;

function recorder(width = W, height = H) {
  const passes = [];
  const backend = {
    setSize() {}, beginFrame() {}, endFrame() {}, syncGeometry() {}, syncAttribute() {},
    beginPass({ target, scissor = null }) { passes.push({ target, scissor, draws: [] }); },
    beginShadowPass() { passes.push({ target: 'shadow', scissor: null, draws: [] }); return {}; },
    endPass() {},
    draw(call) { passes.at(-1).draws.push(call.geometry); },
    drawDepth(call) { passes.at(-1).draws.push(call.geometry); },
  };
  const renderer = new Renderer(backend, { width, height, style: {} });
  renderer.setSize(width, height);
  return { renderer, passes, pass: (target) => passes.find((p) => p.target === target) };
}

const camera = () => {
  const c = new GFX.PerspectiveCamera(50, 4 / 3, 0.1, 1000);
  c.position.set(0, 0, 10);
  c.lookAt(0, 0, 0);
  c.updateMatrixWorld();
  return c;
};
const box = (x, y, z, s = 1) => {
  const m = new GFX.Mesh(new GFX.BoxGeometry(s, s, s), new GFX.MeshStandardMaterial());
  m.position.set(x, y, z);
  return m;
};
const glass = (roughness = 0.02) => new GFX.Mesh(new GFX.SphereGeometry(0.5, 16, 8), new GFX.MeshPhysicalMaterial({ transmission: 1, thickness: 0.25, roughness, ior: 1.5 }));

test('behind glass, only the part of the picture its rays can reach is drawn, with what is in it', () => {
  const { renderer, pass } = recorder();
  const scene = new GFX.Scene();
  const behind = box(0, 0, -5, 4), aside = box(5, 0, 0);
  scene.add(glass(), behind, aside);
  renderer.render(scene, camera());

  const cut = pass('transmission').scissor;
  assert.ok(cut, 'the transmission pass is cut to a rectangle');
  const [x, y, w, h] = cut;
  // The glass is in the middle of the picture, and small: the rectangle is around the middle, and a small part of it.
  assert.ok(x < W / 2 && x + w > W / 2 && y < H / 2 && y + h > H / 2);
  assert.ok(w * h < 0.1 * W * H, `a small part of the picture (${w}x${h})`);
  // What is behind the glass is drawn behind it; what is off to the side is not, but is drawn on the canvas.
  assert.ok(pass('transmission').draws.includes(behind.geometry));
  assert.ok(!pass('transmission').draws.includes(aside.geometry));
  assert.ok(pass('canvas').draws.includes(aside.geometry) && pass('canvas').draws.includes(behind.geometry));
});

test('where the glass reads the map, it reads inside what was drawn', () => {
  const { renderer, pass, passes } = recorder();
  const scene = new GFX.Scene();
  scene.add(glass(), box(0, 0, -5, 4));
  const bounds = [];
  const backend = renderer.backend, beginPass = backend.beginPass;
  backend.beginPass = (args) => { if (args.target === 'canvas') bounds.push(args.frame.transmission.bounds); beginPass(args); };
  renderer.render(scene, camera());
  assert.equal(passes.length, 2);
  const [x, y, w, h] = pass('transmission').scissor;
  const [u0, v0, u1, v1] = bounds[0];
  assert.ok(u1 > u0 && v1 > v0, 'the bounds are a rectangle');
  // Inside the scissor, with the room the blur needs all round.
  assert.ok(u0 * W >= x + 60 && u1 * W <= x + w - 60 && v0 * H >= y + 60 && v1 * H <= y + h - 60);
});

test('the whole map is drawn for rough glass, glass that moves itself, glass around the camera, or when asked', () => {
  const cases = {
    'asked for': (r) => { r.cropTransmission = false; return glass(); },
    'rough glass': () => glass(0.9),
    'glass that moves itself just before it draws': () => { const g = glass(); g.onBeforeRender = () => {}; return g; },
    'glass reaching behind the camera': () => { const g = glass(); g.position.set(0, 0, 9.8); return g; },
  };
  for (const [name, make] of Object.entries(cases)) {
    const { renderer, pass } = recorder();
    const scene = new GFX.Scene();
    const aside = box(5, 0, 0);
    scene.add(make(renderer), aside);
    renderer.render(scene, camera());
    assert.equal(pass('transmission').scissor, null, name);
    assert.ok(pass('transmission').draws.includes(aside.geometry), name);
  }
});

test('a group with a bounding sphere out of view is left out whole, and drawn whole when in it', () => {
  const { renderer, pass } = recorder();
  const scene = new GFX.Scene();
  const place = new GFX.Group(), inside = box(0, 0, 0);
  place.add(inside);
  place.boundingSphere = new GFX.Sphere(new GFX.Vector3(0, 0, 0), 1);
  scene.add(place);
  renderer.render(scene, camera());
  assert.ok(pass('canvas').draws.includes(inside.geometry));

  // Moved out of view: neither it nor what is in it is looked at.
  place.position.set(0, 0, 50);
  const { renderer: r2, pass: pass2 } = recorder();
  r2.render(scene, camera());
  assert.equal(pass2('canvas').draws.length, 0);
  // A group without a sphere is not culled itself (its meshes are, one by one).
  place.boundingSphere = null;
  place.position.set(0, 0, 0);
  const { renderer: r3, pass: pass3 } = recorder();
  r3.render(scene, camera());
  assert.ok(pass3('canvas').draws.includes(inside.geometry));
});

test('a child that keeps its own world matrix is not walked every frame, unless what it hangs from moves', () => {
  const scene = new GFX.Scene();
  const root = new GFX.Group(), still = new GFX.Group(), leaf = new GFX.Object3D();
  scene.add(root);
  root.add(still);
  still.add(leaf);
  still.matrixWorldAutoUpdate = false;
  leaf.position.set(1, 0, 0);
  scene.updateMatrixWorld(true);
  assert.equal(leaf.matrixWorld.elements[12], 1, 'forced, it is worked out');
  // Left alone, what is under it is not looked at...
  leaf.position.set(2, 0, 0);
  root.matrixAutoUpdate = false;
  scene.matrixAutoUpdate = false;
  scene.updateMatrixWorld();
  assert.equal(leaf.matrixWorld.elements[12], 1);
  // ...until something above it moves: then what is under it is worked out again, from the world matrix it keeps
  // (its own, set by whoever made it so, as three.js has it).
  still.matrixWorld.makeTranslation(10, 0, 0);
  root.position.set(10, 0, 0);
  root.updateMatrix();
  scene.updateMatrixWorld();
  assert.equal(leaf.matrixWorld.elements[12], 12);
});

test('WebGL uniforms are sent only when they change', () => {
  const sent = [];
  const gl = {
    getUniformLocation: (_, name) => ({ name }),
    uniform1f: (l, v) => sent.push([l.name, v]), uniform1i: (l, v) => sent.push([l.name, v]),
    uniform3fv: (l, v) => sent.push([l.name, [...v]]), uniformMatrix4fv: (l, _, v) => sent.push([l.name, [...v]]),
  };
  const u = new Uniforms(gl, {});
  u.set('roughness', 0.5, 'f');
  u.set('roughness', 0.5, 'f');
  const color = [1, 0.5, 0.25];
  u.set('diffuse', color, 'v3');
  u.set('diffuse', [1, 0.5, 0.25], 'v3');
  // An array changed in place is still seen to change.
  color[2] = 0;
  u.set('diffuse', color, 'v3');
  u.set('roughness', 0.75, 'f');
  assert.deepEqual(sent, [['roughness', 0.5], ['diffuse', [1, 0.5, 0.25]], ['diffuse', [1, 0.5, 0]], ['roughness', 0.75]]);
});
