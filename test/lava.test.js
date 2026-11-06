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
  assert.equal(world.metalness, 0.28);
  assert.equal(world.clearcoat, 0.92);
  assert.equal(world.hotMaterial, null);

  const local = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  assert.equal(local.type, 'MeshPhysicalMaterial');
  assert.equal(local.mapping, 'local');
  assert.equal(local.hotMaterial.type, 'MeshBasicMaterial');
  assert.equal(local.hotMaterial.blending, GFX.AdditiveBlending);
  assert.equal(local.bumpScale, 0.045);
  assert.throws(() => createLavaMaterial(GFX, { mapping: 'uv' }), /unknown lava mapping/);
  assert.throws(() => createLavaMaterial(GFX, { scale: 0 }), /positive finite/);
});

test('spherical lava textures have identical longitude borders and pole rows', () => {
  const material = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  const maps = material.textures;
  const width = maps.width, height = maps.height;
  for (const texture of [maps.map, maps.hot, maps.bump]) {
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
  for (const texture of [maps.map, maps.hot, maps.bump]) {
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

test('lava time and brightness controls keep their original public shape', () => {
  const material = createLavaMaterial(GFX, { mapping: 'local' });
  material.uniforms.uTime.value = 24;
  assert.equal(material.uniforms.uTime.value, 24);
  assert.ok(material.textures.map.offset.x > 0);
  assert.equal(material.textures.hot.offset.x, material.textures.map.offset.x);
  material.uniforms.uBright.value = 0.8;
  assert.equal(material.uniforms.uBright.value, 0.8);
  assert.equal(material.color.r, 0.8);
  material.update(36);
  assert.equal(material.uniforms.uTime.value, 36);
});
