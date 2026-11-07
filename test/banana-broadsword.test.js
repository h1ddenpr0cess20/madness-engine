import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import {
  BROADSWORD_DIMENSIONS,
  BANANA_DAGGER_SPEC,
  createBroadsword,
  createBananaDagger,
  createBananaBroadsword,
  BANANA_BROADSWORD_SPEC,
} from '../src/weapons/index.js';

function verticalExtent(geometry) {
  const position = geometry.attributes.position;
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < position.count; i++) {
    min = Math.min(min, position.getY(i));
    max = Math.max(max, position.getY(i));
  }
  return max - min;
}

test('banana broadsword uses broadsword proportions while retaining banana construction', () => {
  const banana = createBananaBroadsword(GFX);
  const sword = createBroadsword(GFX);

  assert.equal(banana.name, 'Banana Broadsword');
  assert.equal(BANANA_BROADSWORD_SPEC.bladeLength, BROADSWORD_DIMENSIONS.bladeLength);
  assert.equal(banana.dimensions.bladeLength, sword.dimensions.bladeLength);
  assert.equal(banana.dimensions.bladeWidth, sword.dimensions.bladeWidth);
  assert.equal(banana.dimensions.gripLength, sword.dimensions.gripLength);
  assert.equal(banana.dimensions.guardSpan, sword.dimensions.guardSpan);
  assert.equal(banana.dimensions.bladeWidth, 0.052);
  assert.equal(banana.dimensions.gripLength, 0.14);

  assert.equal(banana.pommelAsset.kind, 'banana-tip');
  assert.equal(banana.guard.name, 'peel flaps, blade metal inside and brass outside');
  assert.equal(banana.guard.children.length, 2);
  assert.ok(banana.group.children.includes(banana.blade));
  assert.equal(banana.bladeMetal, 'platinum');
  assert.equal(banana.hiltMetal, 'brass');
  assert.equal(banana.handle.name, 'banana grip');
  assert.equal(banana.bossSeat.name, 'banana neck');
  assert.equal(banana.bladeMist.visible, false);
});

test('banana broadsword keeps the dagger banana silhouette and extends the peel flaps slightly', () => {
  const banana = createBananaBroadsword(GFX);
  const dagger = createBananaDagger(GFX);
  const bananaPeel = banana.guard.children[1].geometry;
  const daggerPeel = dagger.guard.children[1].geometry;

  assert.equal(BANANA_BROADSWORD_SPEC.guardStyle, 'peel');
  assert.equal(BANANA_BROADSWORD_SPEC.gripCurve, BANANA_DAGGER_SPEC.gripCurve);
  assert.equal(BANANA_BROADSWORD_SPEC.bladeCurve, 0.4);
  assert.equal(BANANA_BROADSWORD_SPEC.bladeHook, 0.4);
  assert.equal(BANANA_BROADSWORD_SPEC.bladeTalon, 0.5);
  assert.equal(bananaPeel.attributes.position.count, daggerPeel.attributes.position.count);

  const peelLengthRatio = verticalExtent(bananaPeel) / verticalExtent(daggerPeel);
  assert.ok(peelLengthRatio > 1.14 && peelLengthRatio < 1.16,
    'the four existing peel flaps are 15% longer, without changing their width or construction');

  const grip = banana.handle.geometry.attributes.position;
  let minX = Infinity;
  for (let i = 0; i < grip.count; i++) minX = Math.min(minX, grip.getX(i));
  assert.ok(minX < -0.03, 'the banana grip retains its characteristic curve');
});

test('banana broadsword supports the same metal and optional mist controls as the banana dagger', () => {
  const custom = createBananaBroadsword(GFX, {
    bladeMetal: 'chrome',
    hiltMetal: 'gold',
    bladeMistVisible: true,
  });
  assert.equal(custom.bladeMetal, 'chrome');
  assert.equal(custom.hiltMetal, 'gold');
  assert.equal(custom.bladeMist.visible, true);
  assert.equal(custom.blade.material.color.getHexString(), 'fbfbfb');
  assert.equal(custom.handle.material.color.getHexString(), 'ffd264');

  custom.setBladeMetal('silver');
  custom.setHiltMetal('brass');
  custom.setBladeMist(false);
  assert.equal(custom.blade.material.color.getHexString(), 'c0c0c0');
  assert.equal(custom.handle.material.color.getHexString(), 'e0b84e');
  assert.equal(custom.bladeMist.visible, false);
});
