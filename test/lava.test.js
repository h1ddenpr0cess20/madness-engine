import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createLavaFloorMaterial, createLavaMaterial } from '../src/textures/lava.js';

function pixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return Array.from(data.slice(i, i + 4));
}

test('world lava restores the original single-pass shader while Slimey keeps its local material', () => {
  const world = createLavaFloorMaterial(GFX);
  assert.equal(world.name, 'lava');
  assert.equal(world.type, 'ShaderMaterial');
  assert.equal(world.uniforms.uTime.value, 0);
  assert.equal(world.uniforms.uBright.value, 1);
  assert.equal(world.side, GFX.DoubleSide);
  assert.equal(world.hotMaterial, undefined);
  assert.match(world.glsl.vertex, /vWorld = world\.xyz/);
  assert.match(world.glsl.fragment, /vec2 p = vWorld\.xz/);
  assert.match(world.glsl.fragment, /float crack =/);
  assert.match(world.glsl.fragment, /float pool =/);
  assert.match(world.glsl.fragment, /float bulge =/);
  assert.match(world.glsl.fragment, /for \(int y = -2; y <= 2; y\+\+\)/);
  assert.match(world.glsl.fragment, /for \(int x = -2; x <= 2; x\+\+\)/);
  assert.match(world.wgsl, /let p = in\.world\.xz/);
  assert.match(world.wgsl, /for \(var y = -2; y <= 2; y\+\+\)/);
  assert.match(world.wgsl, /for \(var x = -2; x <= 2; x\+\+\)/);

  const local = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  assert.equal(local.name, 'lava-basalt');
  assert.equal(local.type, 'MeshPhysicalMaterial');
  assert.equal(local.mapping, 'local');
  assert.equal(local.hotMaterial.type, 'ShaderMaterial');
  assert.equal(local.hotMaterial.uniforms.uLocal.value, 1);
  assert.equal(local.textures.width, 1024);
  assert.equal(local.textures.height, 512);
});

test('spherical lava textures have identical longitude borders and pole rows', () => {
  const material = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  const maps = material.textures;
  const width = maps.width, height = maps.height;
  for (const texture of [maps.map, maps.bump]) {
    const data = texture.image.data;
    for (let y = 0; y < height; y++) {
      assert.deepEqual(pixel(data, width, 0, y), pixel(data, width, width - 1, y), 'UV border row ' + y);
    }
    for (const y of [0, height - 1]) {
      const first = pixel(data, width, 0, y);
      for (let x = 1; x < width; x++) assert.deepEqual(pixel(data, width, x, y), first, 'pole row ' + y);
    }
  }
  assert.equal(maps.map.wrapS, GFX.RepeatWrapping);
  assert.equal(maps.map.wrapT, GFX.ClampToEdgeWrapping);
});



test('lava time and brightness controls animate the molten layer while keeping local basalt anchored', () => {
  const material = createLavaMaterial(GFX, { mapping: 'local' });
  material.uniforms.uTime.value = 24;
  assert.equal(material.uniforms.uTime.value, 24);
  assert.equal(material.textures.map.offset.x, 0);
  assert.equal(material.textures.bump.offset.x, 0);
  assert.equal(material.hotMaterial.uniforms.uTime.value, 24);
  assert.match(material.hotMaterial.glsl.fragment, /activity/);
  assert.match(material.hotMaterial.wgsl, /activity/);
  material.uniforms.uBright.value = 0.8;
  assert.equal(material.uniforms.uBright.value, 0.8);
  assert.equal(material.color.r, 0.8);
  material.update(36);
  assert.equal(material.uniforms.uTime.value, 36);
  assert.equal(material.hotMaterial.uniforms.uTime.value, 36);
});

test('world lava retains time and brightness controls on the original shader', () => {
  const material = createLavaFloorMaterial(GFX);
  material.uniforms.uTime.value = 24;
  material.uniforms.uBright.value = 0.8;
  assert.equal(material.uniforms.uTime.value, 24);
  assert.equal(material.uniforms.uBright.value, 0.8);
  assert.match(material.glsl.fragment, /float phase = fract\(t \*/);
  assert.match(material.glsl.fragment, /float ring =/);
  assert.match(material.glsl.fragment, /float bulge =/);
});


test('lava bubbling adds smooth, localized surface inflation without changing other Slimey variants', async () => {
  const { createDeformer } = await import('../src/heroes/slimey/deform.js');
  const { createLobes } = await import('../src/heroes/slimey/lobes.js');
  const geometryA = new GFX.SphereGeometry(1, 24, 16);
  const geometryB = new GFX.SphereGeometry(1, 24, 16);
  const baseA = geometryA.attributes.position.array.slice();
  const baseB = geometryB.attributes.position.array.slice();
  const lobes = createLobes(GFX);
  const deform = createDeformer(GFX);
  const settings = {
    wobble: 1.15, phase: 1.7, scale: 1, ampScale: 1, freqScale: 2.35, phaseScale: 2.2,
  };
  deform(geometryA, baseA, lobes, settings);
  deform(geometryB, baseB, lobes, { ...settings, bubbling: 0.08 });

  const plain = geometryA.attributes.position.array;
  const bubbled = geometryB.attributes.position.array;
  let largestDelta = 0;
  for (let i = 0; i < plain.length; i++) largestDelta = Math.max(largestDelta, Math.abs(plain[i] - bubbled[i]));
  assert.ok(largestDelta > 0.005, 'bubbling should visibly inflate local patches');
});


test('the lava pit material is one program per backend with the same controls as the old floor lava', async () => {
  const { createLavaPitMaterial, createLavaPit, lavaFlicker } = await import('../src/textures/lavapit.js');
  const material = createLavaPitMaterial(GFX);
  assert.equal(material.name, 'lava-pit');
  assert.equal(material.type, 'ShaderMaterial');
  assert.equal(material.side, GFX.DoubleSide);
  assert.equal(material.uniforms.uTime.value, 0);
  assert.equal(material.uniforms.uBright.value, 1);
  // Reserved words in GLSL ES (half, ...) would fail to compile on a real driver.
  assert.doesNotMatch(material.glsl.fragment, /\b(half|sample|common|filter)\b\s*[=;,)]/);
  for (const part of ['crack', 'lake', 'spec', 'spark', 'ring', 'bulge', 'flash']) {
    assert.match(material.glsl.fragment, new RegExp(`float ${part}\\b`), `GLSL has ${part}`);
    assert.match(material.wgsl, new RegExp(`let ${part}\\b`), `WGSL has ${part}`);
  }
  assert.match(material.glsl.fragment, /cameraPosition/);
  assert.match(material.wgsl, /object\.cameraPosition/);

  const pit = createLavaPit(GFX, { width: 3, depth: 2, sink: 0.5 });
  assert.equal(pit.surface.position.y, -0.5);
  assert.equal(pit.group.children.filter((c) => c.name.startsWith('pit_wall_')).length, 4);
  assert.ok(pit.light, 'a warm light hangs over the melt');
  pit.update(3);
  assert.equal(pit.material.uniforms.uTime.value, 3);
  const f = lavaFlicker(3);
  assert.ok(f > 0.5 && f < 1.1);
  assert.ok(Math.abs(pit.light.intensity - 5 * f) < 1e-9);
});

test('the dungeon draws its lava with the pit shader', async () => {
  const { createDungeonMeshes } = await import('../src/scenery/dungeon.js');
  const quad = { position: new Float32Array([0, -1, 0, 0, -1, 1, 1, -1, 0]), normal: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), color: new Float32Array(9), uv: new Float32Array(6) };
  const empty = { position: new Float32Array(0), normal: new Float32Array(0), color: new Float32Array(0), uv: new Float32Array(0) };
  const meshes = createDungeonMeshes(GFX, { tops: empty, walls: empty, lava: quad });
  const lava = meshes.group.children.find((c) => c.material?.name === 'lava-pit');
  assert.ok(lava, 'lava uses lava-pit');
  meshes.update(2.5);
  assert.equal(lava.material.uniforms.uTime.value, 2.5);
});
