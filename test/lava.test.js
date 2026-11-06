import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createLavaMaterial } from '../src/textures/lava.js';

test('lava material keeps the legacy world-space API and supports local object mapping', () => {
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

test('lava uses domain-warped 3D flow with layered molten veins and studio highlights', () => {
  const lava = createLavaMaterial(GFX);
  const glsl = lava.glsl.fragment;
  const wgsl = lava.wgsl;

  assert.match(glsl, /noise3/);
  assert.match(glsl, /fbm3/);
  assert.match(glsl, /centreA/);
  assert.match(glsl, /riverCore/);
  assert.match(glsl, /heatRamp/);
  assert.match(glsl, /specular/);
  assert.match(wgsl, /fn noise3/);
  assert.match(wgsl, /fn fbm3/);
  assert.match(wgsl, /centreA/);
  assert.match(wgsl, /riverCore/);
  assert.match(wgsl, /fn heatRamp/);
  assert.match(wgsl, /specular/);

  // There is no UV lookup, cellular/Voronoi tiling, or old 2D plate grid.
  assert.doesNotMatch(glsl, /vUv|uvMap|texture2D|voronoi|plates\(/i);
  assert.doesNotMatch(wgsl, /uvMap|textureSample|voronoi|plates\(/i);
  assert.match(glsl, /vWorld/);
  assert.match(glsl, /vLocal/);
});
