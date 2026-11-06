import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createLavaMaterial } from '../src/textures/lava.js';

test('lava material provides continuous world mapping and deform-following local mapping', () => {
  const world = createLavaMaterial(GFX);
  assert.equal(world.name, 'lava');
  assert.equal(world.uniforms.uTime.value, 0);
  assert.equal(world.uniforms.uBright.value, 1);
  assert.equal(world.uniforms.uLocal.value, 0);
  assert.equal(world.uniforms.uScale.value, 1.6);

  const local = createLavaMaterial(GFX, { mapping: 'local', scale: 4.35 });
  assert.equal(local.uniforms.uLocal.value, 1);
  assert.equal(local.uniforms.uScale.value, 4.35);
  assert.throws(() => createLavaMaterial(GFX, { mapping: 'uv' }), /unknown lava mapping/);
  assert.throws(() => createLavaMaterial(GFX, { scale: 0 }), /positive finite/);
});

test('lava is a borderless procedural 3D material with matching GLSL and WGSL implementations', () => {
  const lava = createLavaMaterial(GFX);
  const glsl = lava.glsl.fragment;
  const wgsl = lava.wgsl;

  assert.match(glsl, /voronoi3/);
  assert.match(glsl, /fbm3/);
  assert.match(glsl, /heatColour/);
  assert.match(wgsl, /fn voronoi3/);
  assert.match(wgsl, /fn fbm3/);
  assert.match(wgsl, /fn heatColour/);
  assert.doesNotMatch(glsl, /vUv|uvMap|texture2D/);
  assert.doesNotMatch(wgsl, /uvMap|textureSample/);
  assert.match(glsl, /vWorld/);
  assert.match(glsl, /vLocal/);
});
