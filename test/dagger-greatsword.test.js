import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createBroadsword } from '../src/weapons/broadsword.js';
import { DAGGER_DIMENSIONS, createDagger } from '../src/weapons/dagger.js';
import { GREATSWORD_DIMENSIONS, createGreatsword } from '../src/weapons/greatsword.js';

function edgeUseCounts(geometry) {
  const indices = geometry.index.array;
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [
      [indices[i], indices[i + 1]],
      [indices[i + 1], indices[i + 2]],
      [indices[i + 2], indices[i]],
    ]) {
      const key = a < b ? a + ':' + b : b + ':' + a;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  return [...edges.values()];
}

function normalizedBladeProfile(weapon, section = 24) {
  const positions = weapon.blade.geometry.attributes.position;
  const ringSize = 20;
  const start = section * ringSize;
  const width = weapon.dimensions.bladeWidth;
  return Array.from({ length: ringSize }, (_, i) => [
    Number((positions.getX(start + i) / width).toFixed(6)),
    Number((positions.getZ(start + i) / 0.0032).toFixed(6)),
  ]);
}

test('dagger is a genuinely shorter broadsword-derived weapon at dagger scale', () => {
  const dagger = createDagger(GFX);
  const broadsword = createBroadsword(GFX);

  assert.equal(DAGGER_DIMENSIONS.bladeLength, 0.24);
  assert.equal(dagger.dimensions.bladeLength, 0.24);
  assert.equal(dagger.dimensions.bladeWidth, 0.047);
  assert.equal(dagger.dimensions.gripLength, 0.097);
  assert.equal(dagger.handle.geometry.parameters.height, 0.097);
  assert.ok(dagger.dimensions.gripLength < broadsword.dimensions.gripLength,
    'the dagger grip is shorter than the broadsword grip');
  const daggerWraps = dagger.hilt.children.filter((part) => part.name === 'leather wrap ridge')
    .map((part) => part.position.y).sort((a, b) => a - b);
  const broadswordWraps = broadsword.hilt.children.filter((part) => part.name === 'leather wrap ridge')
    .map((part) => part.position.y).sort((a, b) => a - b);
  assert.equal(daggerWraps.length, 8,
    'the dagger has four fewer wrap ridges than the 12-ridge broadsword grip');
  assert.equal(broadswordWraps.length, 12);
  const daggerPitch = daggerWraps[1] - daggerWraps[0];
  const broadswordPitch = broadswordWraps[1] - broadswordWraps[0];
  assert.ok(Math.abs(daggerPitch - broadswordPitch) < 0.0001,
    'the dagger preserves the broadsword wrap spacing');
  assert.equal(dagger.dimensions.overallLength, 0.401);
  assert.equal(dagger.dimensions.guardSpan, 0.112);
  assert.ok(dagger.dimensions.overallLength < broadsword.dimensions.overallLength);
  assert.ok(dagger.dimensions.overallLength >= 0.30 && dagger.dimensions.overallLength <= 0.45,
    'dagger overall length stays within the documented dagger range');
  assert.equal(dagger.dimensions.marbleDiameter, broadsword.dimensions.marbleDiameter);
  assert.equal(dagger.pommel.name, broadsword.pommel.name);
  assert.deepEqual(normalizedBladeProfile(dagger), normalizedBladeProfile(broadsword),
    'the normalized blade profile is unchanged from the broadsword');
  assert.ok(edgeUseCounts(dagger.blade.geometry).every((count) => count === 2),
    'the shorter dagger blade remains a closed solid');
  assert.equal(dagger.dimensions.fullerLength, dagger.dimensions.bladeLength * 0.75);
});

test('greatsword is longer and slightly wider with a thicker version of the same guard', () => {
  const greatsword = createGreatsword(GFX);
  const broadsword = createBroadsword(GFX);

  assert.equal(GREATSWORD_DIMENSIONS.bladeLength, 1.18);
  assert.equal(greatsword.dimensions.bladeLength, 1.18);
  assert.equal(greatsword.dimensions.bladeWidth, 0.088);
  assert.ok(greatsword.dimensions.bladeWidth > broadsword.dimensions.bladeWidth * 1.6,
    'the greatsword blade is substantially broader than the broadsword');
  assert.ok(greatsword.dimensions.overallLength > broadsword.dimensions.overallLength);
  assert.ok(greatsword.dimensions.overallLength >= 1.35 && greatsword.dimensions.overallLength <= 1.65,
    'greatsword overall length stays within the documented greatsword range');
  assert.equal(greatsword.dimensions.guardSpan, broadsword.dimensions.guardSpan,
    'the greatsword keeps the reference guard span');
  assert.equal(broadsword.dimensions.guardThickness, 0.0136);
  assert.equal(greatsword.dimensions.guardThickness, 0.0184);
  assert.ok(greatsword.dimensions.guardThickness > broadsword.dimensions.guardThickness);
  const guardRadius = (weapon) => {
    const p = weapon.guard.geometry.attributes.position;
    const x = -weapon.dimensions.guardSpan / 2;
    const y = weapon.guardY - 0.011;
    return Math.hypot(p.getX(0) - x, p.getY(0) - y, p.getZ(0));
  };
  assert.ok(Math.abs(guardRadius(broadsword) - 0.0068) < 1e-6);
  assert.ok(Math.abs(guardRadius(greatsword) - 0.0092) < 1e-6,
    'the greatsword guard bar is physically thicker, not just reported as such');
  assert.equal(greatsword.dimensions.gripLength, 0.28);
  assert.ok(greatsword.dimensions.gripLength > broadsword.dimensions.gripLength,
    'the greatsword grip is long enough for two hands');
  assert.equal(greatsword.dimensions.marbleDiameter, broadsword.dimensions.marbleDiameter);
  assert.equal(greatsword.pommel.name, broadsword.pommel.name);
  assert.deepEqual(normalizedBladeProfile(greatsword), normalizedBladeProfile(broadsword),
    'the normalized blade profile is unchanged from the broadsword');
  assert.ok(edgeUseCounts(greatsword.blade.geometry).every((count) => count === 2),
    'the longer greatsword blade remains a closed solid');
  assert.equal(greatsword.dimensions.fullerLength, greatsword.dimensions.bladeLength * 0.75);
});
