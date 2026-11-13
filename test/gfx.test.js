import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as GFX from '../src/gfx/index.js';

const shaders = join(dirname(fileURLToPath(import.meta.url)), '../src/gfx/shaders');

test('the scene API a rig is built with loads without a renderer', () => {
  const scene = new GFX.Scene();
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(1, 16, 8), new GFX.MeshStandardMaterial({ color: 0xff0000 }));
  scene.add(mesh);
  mesh.position.set(1, 2, 3);
  scene.updateMatrixWorld(true);
  assert.deepEqual(new GFX.Vector3().setFromMatrixPosition(mesh.matrixWorld).toArray(), [1, 2, 3]);
});

test('textures clamp unless they ask to repeat', () => {
  const t = new GFX.Texture();
  assert.equal(t.wrapS, GFX.ClampToEdgeWrapping);
  assert.notEqual(GFX.RepeatWrapping, GFX.ClampToEdgeWrapping);
});

test('the camera is centred unless its lens is shifted', () => {
  const cam = new GFX.PerspectiveCamera(50, 1, 0.1, 100);
  assert.equal(cam.lensShift, 0);
});

for (const file of ['glsl.js', 'wgsl.js']) {
  test(`every shader ${file} puts together is there, and is text`, async () => {
    const source = readFileSync(join(shaders, file), 'utf8');
    const paths = [...source.matchAll(/from '(\.\/[^']+\.(?:glsl|wgsl)\.js)'/g)].map((m) => m[1]);
    assert.ok(paths.length > 10, `${paths.length} shader imports`);
    assert.ok(!source.includes('?raw'), 'no bundler-specific imports');
    for (const p of paths) {
      const { default: text } = await import(pathToFileURL(join(shaders, p)));
      assert.equal(typeof text, 'string');
      assert.ok(text.length > 20, p);
    }
  });
}

test('an instanced mesh places its copies as Batch.stamp does, and is bounded round all of them', () => {
  const box = new GFX.BoxGeometry(1, 1, 1);
  const mesh = new GFX.InstancedMesh(box, new GFX.MeshStandardMaterial(), 1);
  assert.equal(mesh.isInstancedMesh, true);
  mesh.add(10, 0, 0, Math.PI / 2, 2, [0.5, 1, 1]);
  mesh.add(-10, 0, 0);
  mesh.add(0, 0, 4);
  assert.equal(mesh.count, 3);
  assert.ok(mesh.capacity >= 3, 'it made room as copies were added');
  assert.deepEqual([...mesh.instancePlace.array.slice(0, 4)].map((v) => +v.toFixed(4)), [10, 0, 0, +(Math.PI / 2).toFixed(4)]);
  assert.deepEqual([...mesh.instanceLook.array.slice(0, 4)], [2, 0.5, 1, 1]);
  const version = mesh.instancePlace.version;
  mesh.update();
  assert.ok(mesh.instancePlace.version > version, 'update sends the copies up again');
  const s = mesh.boundingSphere;
  // The scaled copy at x = 10 reaches past 10 + the box's half diagonal times its scale.
  assert.ok(s.radius + Math.abs(s.center.x) >= 10 + (Math.sqrt(3) / 2) * 2 - 1e-6, `radius ${s.radius}`);
  const frustum = new GFX.Frustum();
  const cam = new GFX.PerspectiveCamera(40, 1, 0.1, 100);
  cam.position.set(10, 0, 20);
  cam.lookAt(10, 0, 0);
  cam.updateMatrixWorld();
  frustum.setFromProjectionMatrix(new GFX.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  mesh.updateMatrixWorld();
  assert.ok(frustum.intersectsObject(mesh), 'a camera looking at one copy sees the mesh');
});

test('a template part becomes indexed geometry with its shared corners kept once', async () => {
  const { Mesher, partGeometry } = await import('../src/mesher.js');
  const m = new Mesher();
  m.crown('leaf', 0, 1, 0, 0.4, 0.3, 0.4, '#e8e8e8', { detail: 2, lump: 0.2, seed: 1 });
  const part = m.finish().leaf;
  const g = partGeometry(GFX, part);
  assert.equal(g.index.count, part.count, 'every corner of every triangle is still drawn');
  assert.ok(g.attributes.position.count < part.count / 2, `${g.attributes.position.count} of ${part.count} corners kept`);
  for (const name of ['position', 'normal', 'uv', 'color']) assert.ok(g.attributes[name], name);
});

test('instanced programs read the copies, and plain ones do not', async () => {
  const { programSources } = await import('../src/gfx/shaders/glsl.js');
  const { moduleSource, depthWGSL } = await import('../src/gfx/shaders/wgsl.js');
  const key = { kind: 'standard', output: 'srgb', opaque: true, hasNormal: true, vertexColors: true, numDir: 1, numPoint: 0, numHemi: 1, numDirShadows: 1 };
  const [vs] = programSources({ ...key, instanced: true });
  assert.match(vs, /#define USE_INSTANCING/);
  assert.match(vs, /in vec4 instancePlace;/);
  assert.match(moduleSource({ ...key, instanced: true }), /@location\(5\) instancePlace: vec4f/);
  assert.doesNotMatch(moduleSource(key), /instancePlace/);
  assert.match(moduleSource({ kind: 'basic', output: 'srgb', opaque: false, instanced: true }), /instanceTurn/);
  assert.match(depthWGSL(true), /instanceLook/);
  assert.doesNotMatch(depthWGSL(), /instanceLook/);
});

test('a material that hides its repeat samples its tiles through the anti-tiling lookup, in both languages', async () => {
  const { programSources } = await import('../src/gfx/shaders/glsl.js');
  const { moduleSource } = await import('../src/gfx/shaders/wgsl.js');
  const key = { kind: 'standard', output: 'srgb', opaque: true, hasNormal: true, vertexColors: true, map: true, bumpMap: true, numDir: 1, numPoint: 0, numHemi: 1, numDirShadows: 1 };
  const [, fs] = programSources({ ...key, antiTile: true });
  assert.match(fs, /#define USE_ANTITILE/);
  assert.match(fs, /vec4 untiled\(/);
  const wgsl = moduleSource({ ...key, antiTile: true });
  assert.match(wgsl, /fn untiled\(/);
  assert.match(wgsl, /untiled\(t_map, s_map, in\.mapUv/);
  assert.match(wgsl, /untiled\(t_bump, s_bump/);
  assert.doesNotMatch(moduleSource(key), /untiled/);
  assert.equal(new (await import('../src/gfx/index.js')).MeshStandardMaterial().antiTile, false);
});

test('a material with an emissive map glows only where the map says, over the colour map\'s layout, in both languages', async () => {
  const { programSources } = await import('../src/gfx/shaders/glsl.js');
  const { moduleSource } = await import('../src/gfx/shaders/wgsl.js');
  const gfx = await import('../src/gfx/index.js');
  const key = { kind: 'standard', output: 'srgb', opaque: true, hasNormal: true, vertexColors: true, map: true, bumpMap: false, numDir: 1, numPoint: 0, numHemi: 1, numDirShadows: 1 };
  const [, fs] = programSources({ ...key, emissiveMap: true });
  assert.match(fs, /uniform sampler2D emissiveMap/);
  assert.match(fs, /totalEmissiveRadiance \*= texture\( emissiveMap, vMapUv \)/);
  assert.match(moduleSource({ ...key, emissiveMap: true }), /totalEmissiveRadiance \*= textureSample\(t_emissive, s_emissive, in\.mapUv\)/);
  assert.doesNotMatch(programSources(key)[1], /#define USE_EMISSIVEMAP/);
  assert.match(fs, /#define USE_EMISSIVEMAP/);
  assert.equal(new gfx.MeshStandardMaterial().emissiveMap, null);
});

test('emissive scatter lights each repeat of the map by its own chance: a share of the windows, in both languages', async () => {
  const { programSources } = await import('../src/gfx/shaders/glsl.js');
  const { moduleSource } = await import('../src/gfx/shaders/wgsl.js');
  const gfx = await import('../src/gfx/index.js');
  const key = { kind: 'standard', output: 'srgb', opaque: true, hasNormal: true, vertexColors: true, map: true, numDir: 1, numPoint: 0, numHemi: 1, numDirShadows: 0 };
  assert.match(programSources({ ...key, emissiveScatter: 0.55 })[1], /#define EMISSIVE_SCATTER 0\.550/);
  assert.match(moduleSource({ ...key, emissiveScatter: 0.55 }), /step\(on, 0\.550\)/);
  assert.doesNotMatch(programSources(key)[1], /#define EMISSIVE_SCATTER/);
  assert.equal(new gfx.MeshStandardMaterial().emissiveScatter, 0);
});
