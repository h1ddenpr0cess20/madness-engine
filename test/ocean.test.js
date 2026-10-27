import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { programSources } from '../src/gfx/shaders/glsl.js';
import { moduleSource } from '../src/gfx/shaders/wgsl.js';
import { createOcean, waterGrid } from '../src/ocean.js';
import { COUNT, createSea, SEAS, waveSet } from '../src/ocean/waves.js';
import { mixSky, SKIES, skyColour, skyLight, sunDirection } from '../src/ocean/sky.js';

const TAU = Math.PI * 2;
const points = (n, spread = 300) => Array.from({ length: n }, (_, i) => [((i * 7919) % 1000) / 1000 * spread - spread / 2, ((i * 104729) % 1000) / 1000 * spread - spread / 2]);

test('every sea has its waves, the longest first, carried less than a fold', () => {
  for (const [name, sea] of Object.entries(SEAS)) {
    const set = waveSet(sea);
    for (const key of ['A', 'Q', 'k', 'angle', 'phi']) assert.equal(set[key].length, COUNT, `${name}.${key}`);
    const carry = set.Q.reduce((s, q, i) => s + q * set.k[i], 0);
    assert.ok(carry <= 0.96, `${name} folds over (${carry})`);
    assert.ok(set.k[0] < set.k[COUNT - 2], `${name}: the waves run from long to short`);
  }
});

test('the water sampled at a point is the water carried there', () => {
  for (const [name, start] of Object.entries(SEAS)) {
    const sea = createSea(start);
    sea.step(7.3);
    for (const [x0, z0] of points(60)) {
      const at = sea.displace(x0, z0);
      const s = sea.sample(at.x, at.z);
      assert.ok(Math.abs(s.height - at.y) < 0.03, `${name}: ${s.height} against ${at.y}`);
      assert.ok(Math.abs(Math.hypot(...s.normal) - 1) < 1e-9 && s.normal[1] > 0, `${name}: the normal points up`);
    }
  }
});

test('the big seas are big', () => {
  const crest = (name) => {
    const sea = createSea(SEAS[name]);
    sea.step(3);
    return Math.max(...points(400, 600).map(([x, z]) => sea.displace(x, z).y));
  };
  assert.ok(crest('storm') > 6, 'a storm stands tall');
  assert.ok(crest('swell') > 4, 'so does a big swell');
  assert.ok(crest('glass') < 0.5, 'glass is flat');
});

test('moving the anchor leaves the water where it is, and the phases are taken from it', () => {
  const sea = createSea(SEAS.breeze);
  sea.step(12.5);
  const before = points(20).map(([x, z]) => sea.displace(x, z).y);
  sea.anchorAt(5321.25, -871.5);
  const after = points(20).map(([x, z]) => sea.displace(x, z).y);
  before.forEach((y, i) => assert.ok(Math.abs(y - after[i]) < 1e-6));
  // What the shaders get: each phase at the origin, in [0, 2π), with the rest measured from there.
  const origin = [103.5, -47.25];
  const phase = sea.phases(origin);
  const w = sea.waves;
  for (let i = 0; i < COUNT; i++) assert.ok(phase[i] >= 0 && phase[i] < TAU);
  const [x, z] = [origin[0] + 3.5, origin[1] - 2];
  let y = 0;
  for (let i = 0; i < COUNT; i++) y += w.A[i] * Math.sin(w.k[i] * (w.dx[i] * (x - origin[0]) + w.dz[i] * (z - origin[1])) + phase[i]);
  assert.ok(Math.abs(y - sea.displace(x, z).y) < 1e-6);
});

test('a sea turns smoothly into another, and ends as that sea', () => {
  const sea = createSea(SEAS.calm);
  sea.step(1);
  const y0 = sea.displace(2, 3).y;
  sea.to(SEAS.storm, 4);
  // The first moment of the change hardly moves the water.
  assert.ok(Math.abs(sea.displace(2, 3).y - y0) < 1e-9);
  for (let t = 0; t < 4.2; t += 0.1) sea.step(0.1);
  const storm = waveSet(SEAS.storm);
  for (let i = 0; i < COUNT; i++) {
    assert.ok(Math.abs(sea.waves.k[i] - storm.k[i]) < 1e-9);
    assert.ok(Math.abs(sea.waves.A[i] - storm.A[i]) < 1e-9);
  }
  assert.equal(sea.foam, SEAS.storm.foam);
});

test('the skies: the sun where it is said to be, and a mix between two skies that ends at each', () => {
  assert.deepEqual(sunDirection([90, 0]).map((v) => Math.round(v * 1e9) / 1e9), [0, 1, 0]);
  for (const sky of Object.values(SKIES)) {
    const light = skyLight(sky);
    assert.ok(Math.abs(Math.hypot(...light.sun) - 1) < 1e-9);
    assert.ok(skyColour(light, [0, 1, 0]).every((c) => c >= 0 && Number.isFinite(c)));
  }
  assert.equal(mixSky(SKIES.dawn, SKIES.noon, 0).zenith, SKIES.dawn.zenith);
  assert.equal(mixSky(SKIES.dawn, SKIES.noon, 1).horizon, SKIES.noon.horizon);
  const at = (azimuth) => ({ ...SKIES.noon, sun: { ...SKIES.noon.sun, at: [20, azimuth] } });
  assert.equal(mixSky(at(350), at(10), 0.5).sun.at[1] % 360, 0, 'the sun goes the short way round');
});

test('the ocean: a grid round the camera, set for each camera before it is drawn', () => {
  const ocean = createOcean(GFX, { sea: 'swell', sky: 'dusk', rings: 40, segments: 64 });
  assert.equal(ocean.water.geometry.attributes.position.count, 41 * 64);
  const camera = new GFX.PerspectiveCamera(40, 1, 0.3, 400);
  camera.position.set(12345.5, 6, -678.25);
  ocean.update(0.5);
  ocean.dome.onBeforeRender({ domElement: { height: 720 } }, null, camera);
  assert.ok(camera.far >= 1400, 'the camera sees to the horizon');
  assert.equal(ocean.water.position.x, camera.position.x);
  // The phases at the camera are the sea's, mod 2π, so the shaders never see a large number.
  const phase = ocean.sea.phases([camera.position.x, camera.position.z]);
  const m = ocean.water.material.uniforms.uPhase.value.elements;
  for (let i = 0; i < COUNT; i++) assert.ok(Math.abs(m[i] - phase[i]) < 1e-5);
  for (const name of ['uR1', 'uR2', 'uR3']) {
    for (let c = 0; c < 4; c++) assert.ok(ocean.water.material.uniforms[name].value.elements[c * 4 + 3] < TAU);
  }
  // The grid is finest underfoot.
  const grid = waterGrid(GFX, 1400, 200, 256);
  const spacing = grid.attributes.position.array;
  assert.ok(spacing[256 * 3 + 1] < 0.4 && spacing[200 * 256 * 3 + 1] > 20);
});

test('the shaders declare every uniform the ocean hands them, in both languages', () => {
  const ocean = createOcean(GFX);
  for (const mesh of [ocean.water, ocean.dome]) {
    const names = Object.keys(mesh.material.uniforms);
    for (const output of ['srgb', 'linear']) {
      const [vs, fs] = programSources({ kind: 'custom', output }, mesh.material);
      for (const name of names) assert.match(vs + fs, new RegExp(`uniform \\w+ ${name};`));
      assert.match(fs, new RegExp(`const bool OUTPUT_SRGB = ${output === 'srgb'};`));
      const wgsl = moduleSource({ kind: 'custom', output }, mesh.material);
      for (const name of names) assert.match(wgsl, new RegExp(`  ${name}: \\w+,`));
      // Every field the WGSL reads is one it is given.
      for (const [, used] of wgsl.matchAll(/material\.(\w+)/g)) assert.ok(names.includes(used), used);
    }
  }
});

test('on WebGPU a hand-written material\'s uniforms are bound whole, however many there are', async () => {
  // The backend reads WebGPU's flags as it loads; enough of them to load it here.
  globalThis.GPUBufferUsage ??= { UNIFORM: 64, COPY_DST: 8, VERTEX: 32, INDEX: 16, COPY_SRC: 4, STORAGE: 128 };
  globalThis.GPUShaderStage ??= { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };
  globalThis.GPUTextureUsage ??= { COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16 };
  const { WebGPUBackend, customWindow, structSize } = await import('../src/gfx/webgpu.js');
  const { customFields } = await import('../src/gfx/shaders/wgsl.js');
  const ocean = createOcean(GFX);
  const size = structSize(customFields(ocean.water.material));
  assert.ok(size > 256, 'the ocean has more than a small material\'s uniforms');
  assert.ok(customWindow(size) >= size && customWindow(size) % 256 === 0);
  assert.equal(customWindow(48), 256);
  // The bind group is made with that window, and kept for the next material of the size.
  const made = [];
  const backend = { device: { createBindGroup: (d) => (made.push(d), { d }) }, arena: {}, customLayout: {} };
  const group = WebGPUBackend.prototype._customGroup.call(backend, customWindow(size));
  assert.equal(group.d.entries[1].resource.size, customWindow(size));
  assert.equal(WebGPUBackend.prototype._customGroup.call(backend, customWindow(size)), group);
  WebGPUBackend.prototype._customGroup.call(backend, 256);
  assert.equal(made.length, 2);
});
