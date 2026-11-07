import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createBananaDagger, createDagger, BANANA_DAGGER_SPEC, DAGGER_SPEC } from '../src/weapons/index.js';

test('banana dagger reuses the dagger blade, dimensions and metal-ball pommel', () => {
  const banana = createBananaDagger(GFX);
  const dagger = createDagger(GFX);

  assert.equal(banana.name, 'Banana Dagger');
  assert.equal(BANANA_DAGGER_SPEC.bladeLength, DAGGER_SPEC.bladeLength);
  assert.equal(banana.dimensions.bladeLength, dagger.dimensions.bladeLength);
  assert.equal(banana.dimensions.bladeWidth, dagger.dimensions.bladeWidth);
  assert.equal(banana.dimensions.guardSpan, dagger.dimensions.guardSpan);
  assert.equal(banana.dimensions.pommelStyle, 'metal-ball');
  assert.deepEqual(
    Array.from(banana.blade.geometry.attributes.position.array),
    Array.from(dagger.blade.geometry.attributes.position.array),
    'the blade geometry is the dagger blade, unchanged',
  );
  assert.ok(banana.dimensions.overallLength >= 0.30 && banana.dimensions.overallLength <= 0.45,
    'overall length stays within the dagger range');
});

test('banana grip is a fluted metal tube bowed back along an arc, not leather', () => {
  const banana = createBananaDagger(GFX);
  const grip = banana.handle.geometry.attributes.position;

  assert.equal(banana.handle.material.name, 'hilt metal');
  assert.equal(banana.handle.material.color.getHexString(), 'e0b84e', 'the grip is brass by default');
  assert.equal(banana.hilt.children.filter((part) => part.name === 'leather wrap ridge').length, 0);

  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < grip.count; i++) {
    minX = Math.min(minX, grip.getX(i));
    maxX = Math.max(maxX, grip.getX(i));
  }
  assert.ok(minX < -0.03, 'the lower grip sweeps back by more than 30 mm');
  assert.ok(maxX < 0.03, 'the bow is one way: the grip does not swing forward');

  const pommel = banana.pommel.position;
  assert.ok(pommel.x < -0.02, 'the pommel sits at the bowed end of the grip');
  assert.ok(pommel.y > 0, 'the pommel stays above the ground plane');
});

test('banana guard is a peel: brass outside, chrome inside, on the same swept construction', () => {
  const banana = createBananaDagger(GFX);
  const dagger = createDagger(GFX);

  assert.ok(Array.isArray(banana.guard.material), 'the guard takes two materials');
  const [top, bottom] = banana.guard.material;
  assert.equal(top.color.getHexString(), 'fbfbfb', 'the upper half is chrome');
  assert.equal(bottom.color.getHexString(), 'e0b84e', 'the lower half is brass');
  assert.equal(banana.guard.geometry.groups.length, 2);
  assert.equal(banana.guard.geometry.groups[0].materialIndex, 0);
  assert.equal(banana.guard.geometry.groups[1].materialIndex, 1);
  assert.equal(banana.guardTopMetal, 'chrome');
  assert.equal(banana.dimensions.guardSpan, dagger.dimensions.guardSpan,
    'the peel keeps the dagger guard span');
  // Nine peel points against the dagger's seven, each swept with the same 14-sided bar plus two cap centres.
  assert.equal(banana.guard.geometry.attributes.position.count, 9 * 14 + 2);
  assert.equal(dagger.guard.geometry.attributes.position.count, 7 * 14 + 2);
});

test('banana finishes change independently and the grip is not dyed', () => {
  const banana = createBananaDagger(GFX, { hiltMetal: 'brass' });

  banana.setHiltMetal('gold');
  assert.equal(banana.handle.material.color.getHexString(), 'ffd264',
    'the grip, boss and lower guard follow the hilt metal');
  assert.equal(banana.guard.material[1].color.getHexString(), 'ffd264');
  assert.equal(banana.guard.material[0].color.getHexString(), 'fbfbfb',
    'the chrome top is not changed by the hilt metal');

  banana.setGuardTopMetal('platinum');
  assert.equal(banana.guard.material[0].color.getHexString(), 'e6e5e1');
  assert.equal(banana.guardTopMetal, 'platinum');

  banana.setBladeMetal('chrome');
  assert.equal(banana.bladeMetal, 'chrome');

  assert.doesNotThrow(() => banana.setGripColor('#ff0000'),
    'a grip colour is accepted by the shared API but has no leather to dye');
  assert.throws(() => banana.setGuardTopMetal('unobtainium'), /no metal called/);
});
