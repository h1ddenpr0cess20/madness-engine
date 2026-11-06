import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createLavaMaterial } from '../src/textures/lava.js';

function pixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return Array.from(data.slice(i, i + 4));
}

test('lava is a physically based basalt material with an optional emissive hot layer', () => {
  const world = createLavaMaterial(GFX);
  assert.equal(world.name, 'lava-basalt');
  assert.equal(world.type, 'MeshPhysicalMaterial');
  assert.equal(world.mapping, 'world');
  assert.equal(world.uniforms.uTime.value, 0);
  assert.equal(world.uniforms.uBright.value, 1);
  assert.equal(world.metalness, 0.025);
  assert.equal(world.roughness, 0.62);
  assert.equal(world.clearcoat, 0.14);
  assert.equal(world.bumpScale, 0.02);
  assert.equal(world.hotMaterial.type, 'ShaderMaterial');
  assert.equal(world.hotMaterial.uniforms.uLocal.value, 0);
  assert.match(world.hotMaterial.glsl.fragment, /broadFlow/);
  assert.match(world.hotMaterial.glsl.fragment, /bubbleField/);
  assert.match(world.hotMaterial.wgsl, /broadFlow/);
  assert.match(world.hotMaterial.wgsl, /bubbleField/);

  const local = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  assert.equal(local.type, 'MeshPhysicalMaterial');
  assert.equal(local.mapping, 'local');
  assert.equal(local.hotMaterial.type, 'ShaderMaterial');
  assert.equal(local.hotMaterial.blending, GFX.AdditiveBlending);
  assert.equal(local.hotMaterial.uniforms.uLocal.value, 1);
  assert.match(local.hotMaterial.glsl.fragment, /fwidth\(distance\)/);
  assert.match(local.hotMaterial.glsl.fragment, /lifeAA/);
  assert.match(local.hotMaterial.wgsl, /fwidth\(distance\)/);
  assert.match(local.hotMaterial.wgsl, /lifeAA/);
  assert.equal(local.bumpScale, 0.014);
  assert.equal(local.roughness, 0.62);
  assert.equal(local.textures.width, 1024);
  assert.equal(local.textures.height, 512);
  for (const texture of [local.textures.map, local.textures.bump]) {
    assert.equal(texture.generateMipmaps, true);
    assert.equal(texture.minFilter, GFX.LinearMipmapLinearFilter);
  }
  assert.throws(() => createLavaMaterial(GFX, { mapping: 'uv' }), /unknown lava mapping/);
  assert.throws(() => createLavaMaterial(GFX, { scale: 0 }), /positive finite/);
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

test('world lava textures tile in both directions without an image frame', () => {
  const material = createLavaMaterial(GFX);
  const maps = material.textures;
  for (const texture of [maps.map, maps.bump]) {
    const data = texture.image.data;
    for (let y = 0; y < maps.height; y++) {
      assert.deepEqual(pixel(data, maps.width, 0, y), pixel(data, maps.width, maps.width - 1, y));
    }
    for (let x = 0; x < maps.width; x++) {
      assert.deepEqual(pixel(data, maps.width, x, 0), pixel(data, maps.width, x, maps.height - 1));
    }
    assert.equal(texture.wrapS, GFX.RepeatWrapping);
    assert.equal(texture.wrapT, GFX.RepeatWrapping);
  }
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
  assert.match(material.hotMaterial.glsl.fragment, /smoothstep\(0\.32 - lifeAA, 0\.68 \+ lifeAA, life\)/);
  assert.match(material.hotMaterial.wgsl, /smoothstep\(0\.32 - lifeAA, 0\.68 \+ lifeAA, life\)/);
});

test('world lava keeps its basalt map anchored while the procedural molten layer advances', () => {
  const material = createLavaMaterial(GFX, { mapping: 'world' });
  material.uniforms.uTime.value = 24;
  assert.equal(material.textures.map.offset.x, 0, 'floor crust does not merely scroll');
  assert.equal(material.textures.map.offset.y, 0, 'floor crust does not merely scroll');
  assert.equal(material.hotMaterial.uniforms.uTime.value, 24, 'floor molten field is animated');
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


test('floor lava geometry is subdivided and physically bubbles in localized patches', async () => {
  const { createLavaBubbler } = await import('../src/textures/lava.js');
  const source = new GFX.BufferGeometry();
  source.setAttribute('position', new GFX.BufferAttribute(new Float32Array([
    0, 0, 0,  4, 0, 0,  0, 0, 4,
    4, 0, 0,  4, 0, 4,  0, 0, 4,
  ]), 3));
  source.setAttribute('normal', new GFX.BufferAttribute(new Float32Array([
    0, 1, 0,  0, 1, 0,  0, 1, 0,
    0, 1, 0,  0, 1, 0,  0, 1, 0,
  ]), 3));
  source.setAttribute('uv', new GFX.BufferAttribute(new Float32Array([
    0, 0,  1, 0,  0, 1,
    1, 0,  1, 1,  0, 1,
  ]), 2));

  const bubbler = createLavaBubbler(GFX, source, { segments: 6, spacing: 1.05 });
  assert.ok(
    bubbler.geometry.attributes.position.count > source.attributes.position.count * 10,
    'floor mesh is subdivided enough to make rounded swells',
  );

  const positions = bubbler.geometry.attributes.position;
  const normals = bubbler.geometry.attributes.normal;
  bubbler.update(0);
  const firstPositions = positions.array.slice();

  let peak = 0;
  let minimum = Infinity;
  let maxSlope = 0;
  let displaced = 0;
  for (let i = 0; i < positions.count; i++) {
    const k = i * 3;
    const height = positions.array[k + 1];
    peak = Math.max(peak, height);
    minimum = Math.min(minimum, height);
    maxSlope = Math.max(maxSlope, Math.abs(normals.array[k]), Math.abs(normals.array[k + 2]));
    if (height > 0.015) displaced++;
  }
  assert.ok(peak > 0.04, 'bubbles rise visibly above the floor');
  assert.ok(peak - minimum > 0.03, 'bubble displacement is localized rather than uniform');
  assert.ok(maxSlope > 0.005, 'bubble slopes update the surface normals');
  assert.ok(displaced > 0 && displaced < positions.count, 'only local patches of the floor are lifted');

  bubbler.update(2.4);
  let changed = 0;
  for (let i = 0; i < positions.array.length; i++) {
    changed = Math.max(changed, Math.abs(positions.array[i] - firstPositions[i]));
  }
  assert.ok(changed > 0.01, 'each bubble swells and subsides independently over time');

  bubbler.update(2.4);
  const secondPositions = positions.array.slice();
  bubbler.update(2.4);
  assert.deepEqual(Array.from(positions.array), Array.from(secondPositions),
    'the same time value yields the same surface');
});

test('dungeon floor integrates the bubbling lava geometry and time-driven molten layer', async () => {
  const { createDungeonMeshes } = await import('../src/scenery/dungeon.js');
  const parts = (position, normal) => ({
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    color: new Float32Array(Array.from({ length: position.length }, (_, i) => i % 3 === 0 ? 0.4 : 0.4)),
    uv: new Float32Array(Array.from({ length: position.length / 3 * 2 }, () => 0)),
  });
  const floor = parts([
    0, 0, 0,  4, 0, 0,  0, 0, 4,
    4, 0, 0,  4, 0, 4,  0, 0, 4,
  ], [
    0, 1, 0,  0, 1, 0,  0, 1, 0,
    0, 1, 0,  0, 1, 0,  0, 1, 0,
  ]);
  const dungeon = createDungeonMeshes(GFX, { tops: floor, walls: floor, lava: floor });
  const basalt = dungeon.group.children.find((mesh) => mesh.name === 'lava-basalt-floor');
  const molten = dungeon.group.children.find((mesh) => mesh.name === 'lava-molten-flow-floor');
  assert.ok(basalt && molten, 'both crust and animated molten layer are present');
  assert.equal(basalt.geometry, molten.geometry, 'both layers share the same deformed vertices');
  assert.ok(basalt.geometry.attributes.position.count > floor.position.length / 3 * 10);
  dungeon.update(0);
  const t0 = basalt.geometry.attributes.position.array.slice();
  dungeon.update(2.4);
  const t1 = basalt.geometry.attributes.position.array;
  let displacement = 0;
  for (let i = 0; i < t1.length; i++) displacement = Math.max(displacement, Math.abs(t1[i] - t0[i]));
  assert.ok(displacement > 0.01, 'the dungeon update physically moves the lava surface');
  assert.equal(basalt.material.hotMaterial.uniforms.uTime.value, 2.4);
});