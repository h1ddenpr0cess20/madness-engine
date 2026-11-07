import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createBananaDagger, createDagger, BANANA_DAGGER_SPEC, DAGGER_SPEC } from '../src/weapons/index.js';

const names = (weapon) => {
  const found = [];
  weapon.group.traverse((part) => found.push(part.name));
  return found;
};

test('banana dagger keeps the dagger blade profile, slimmer and bowed like the grip, on a longer grip', () => {
  const banana = createBananaDagger(GFX);
  const dagger = createDagger(GFX);

  assert.equal(banana.name, 'Banana Dagger');
  assert.equal(BANANA_DAGGER_SPEC.bladeLength, DAGGER_SPEC.bladeLength);
  assert.equal(banana.dimensions.bladeLength, dagger.dimensions.bladeLength);
  assert.equal(banana.dimensions.bladeWidth, 0.038);
  assert.ok(banana.dimensions.bladeWidth < dagger.dimensions.bladeWidth, 'the banana blade is slimmer than the dagger blade');
  assert.equal(banana.dimensions.gripLength, 0.135);
  assert.ok(banana.dimensions.gripLength > dagger.dimensions.gripLength, 'the banana grip is longer than the dagger grip');

  // The root ring is the dagger's, untouched; only the rest of the blade is bowed.
  const bent = banana.blade.geometry.attributes.position, straight = dagger.blade.geometry.attributes.position;
  const ringSize = 20;
  const yShift = banana.dimensions.overallLength - dagger.dimensions.overallLength;
  assert.ok(Number.isFinite(yShift));
  for (let i = 0; i < ringSize; i++) {
    assert.ok(Math.abs(bent.getX(i) - straight.getX(i)) < 1e-9, 'the root ring keeps its width');
    assert.ok(Math.abs(bent.getZ(i) - straight.getZ(i)) < 1e-9, 'the root ring keeps its thickness');
  }
  let tipX = 0, tipY = -Infinity;
  const tip = banana.bladeTip.geometry.attributes.position;
  for (let i = 0; i < tip.count; i++) if (tip.getY(i) > tipY) { tipY = tip.getY(i); tipX = tip.getX(i); }
  assert.ok(tipX < -0.02, 'the point leans back by more than 20 mm, so the blade is bowed');
  assert.ok(banana.dimensions.overallLength >= 0.30 && banana.dimensions.overallLength <= 0.45,
    'overall length stays within the dagger range');
});

test('banana dagger has no metal ball and none of the old crossguard parts', () => {
  const banana = createBananaDagger(GFX);
  const all = names(banana);

  assert.equal(banana.pommelAsset.kind, 'banana-tip');
  assert.equal(banana.dimensions.pommelStyle, 'banana-tip');
  for (const old of ['metal ball pommel', 'continuous swept crossguard', 'quillon rounded terminal',
    'guard central boss', 'leather wrap ridge', 'leather grip']) {
    assert.ok(!all.some((name) => name.includes(old)), `no part called "${old}"`);
  }
  assert.ok(all.includes('banana grip'));
  assert.ok(all.includes('banana tip'));
});

test('the dark ends of the banana are chrome: the grip tip and the blade tip', () => {
  const banana = createBananaDagger(GFX);

  assert.equal(banana.pommel.material.color.getHexString(), 'fbfbfb', 'the grip tip is chrome');
  assert.equal(banana.bladeTip.material.color.getHexString(), 'fbfbfb', 'the blade tip is chrome');
  assert.equal(banana.blade.material.color.getHexString(), 'f3f1ec', 'the rest of the blade is silver');
  assert.ok(banana.pommel.position.x < -0.02, 'the grip tip sits at the bowed end of the grip');

  const body = banana.blade.geometry.index.count, end = banana.bladeTip.geometry.index.count;
  assert.ok(end > 0 && end < body * 0.2, 'only the last part of the blade is chrome');
});

test('banana grip is a ridged brass tube bowed back along an arc', () => {
  const banana = createBananaDagger(GFX);
  const grip = banana.handle.geometry.attributes.position;

  assert.equal(banana.handle.material.color.getHexString(), 'e0b84e', 'the grip is brass by default');
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < grip.count; i++) {
    minX = Math.min(minX, grip.getX(i));
    maxX = Math.max(maxX, grip.getX(i));
  }
  assert.ok(minX < -0.03, 'the lower grip sweeps back by more than 30 mm');
  assert.ok(maxX < 0.03, 'the bow is one way');
});

test('the guard is four peel flaps: chrome inside facing up, brass skin below', () => {
  const banana = createBananaDagger(GFX);
  const [inside, outside] = banana.guard.children;

  assert.equal(banana.guard.children.length, 2);
  assert.equal(inside.material.color.getHexString(), 'fbfbfb', 'the upper faces are chrome');
  assert.equal(outside.material.color.getHexString(), 'e0b84e', 'the lower faces are brass');
  const perFace = 4 * 41 * 13;
  assert.equal(inside.geometry.attributes.position.count, perFace, 'four flaps');
  assert.equal(outside.geometry.attributes.position.count, perFace);

  const mean = (geometry) => {
    const normal = geometry.attributes.normal;
    let sum = 0;
    for (let i = 0; i < normal.count; i++) sum += normal.getY(i);
    return sum / normal.count;
  };
  assert.ok(mean(inside.geometry) > 0.2, 'the chrome faces look up, toward the blade');
  assert.ok(mean(outside.geometry) < -0.2, 'the brass faces look down, toward the grip');

  const reach = Math.max(...Array.from({ length: inside.geometry.attributes.position.count },
    (_, i) => Math.hypot(inside.geometry.attributes.position.getX(i), inside.geometry.attributes.position.getZ(i))));
  assert.ok(reach > 0.07, 'the flaps open wide enough to guard the hand');
});

test('banana finishes change independently and the grip is not dyed', () => {
  const banana = createBananaDagger(GFX);

  banana.setHiltMetal('gold');
  assert.equal(banana.handle.material.color.getHexString(), 'ffd264',
    'the grip, collar and peel skin follow the hilt metal');
  assert.equal(banana.guard.children[1].material.color.getHexString(), 'ffd264');
  assert.equal(banana.guard.children[0].material.color.getHexString(), 'fbfbfb',
    'the chrome parts are not changed by the hilt metal');

  banana.setAccentMetal('platinum');
  assert.equal(banana.accentMetal, 'platinum');
  for (const part of [banana.guard.children[0], banana.pommel, banana.bladeTip]) {
    assert.equal(part.material.color.getHexString(), 'e6e5e1', 'inside of the peel and both tips take the accent');
  }

  banana.setBladeMetal('chrome');
  assert.equal(banana.bladeMetal, 'chrome');
  assert.doesNotThrow(() => banana.setGripColor('#ff0000'),
    'a grip colour is accepted by the shared API but has no leather to dye');
  assert.throws(() => banana.setAccentMetal('unobtainium'), /no metal called/);
});
