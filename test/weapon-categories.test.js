import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import * as W from '../src/weapons/index.js';
import { WEAPON_ASSETS, weaponShelf } from '../examples/asset-viewer/src/weapon-assets.js';

test('a melee striking range is short, medium or long by the bands, and a reach that is not positive is refused', () => {
  assert.equal(W.strikingRange(0.3), W.RANGE.SHORT);
  assert.equal(W.strikingRange(0.5999), W.RANGE.SHORT);
  assert.equal(W.strikingRange(0.6), W.RANGE.MEDIUM);
  assert.equal(W.strikingRange(1.0999), W.RANGE.MEDIUM);
  assert.equal(W.strikingRange(1.1), W.RANGE.LONG);
  for (const bad of [0, -0.2, Number.NaN]) assert.throws(() => W.strikingRange(bad), RangeError);
});

test('handling needs a known number of hands, a boolean ranged flag, and a reach unless it is ranged', () => {
  assert.throws(() => W.handlingOf({ reach: 0.9 }), TypeError);
  assert.throws(() => W.handlingOf({ hands: 'three-handed', reach: 0.9 }), TypeError);
  assert.throws(() => W.handlingOf({ hands: W.HANDS.ONE, ranged: 'yes', reach: 0.9 }), TypeError);
  assert.throws(() => W.handlingOf({ hands: W.HANDS.ONE }), RangeError, 'a melee weapon with no reach has no range');
  assert.deepEqual({ ...W.handlingOf({ hands: W.HANDS.TWO, ranged: true }) }, { hands: 'two-handed', range: 'ranged' });
  assert.ok(Object.isFrozen(W.handlingOf({ hands: W.HANDS.ONE, reach: 0.9 })));
});

test('a striking reach is the overall length less the grip', () => {
  assert.equal(W.reachOf({ overallLength: 1.524, gripLength: 0.28 }).toFixed(3), '1.244');
});

test('a weapon spec must say how many hands hold it, before any geometry is built', () => {
  assert.throws(() => W.buildWeapon(GFX, { ...W.DAGGER_SPEC, hands: undefined }), TypeError);
  assert.throws(() => W.buildWeapon(GFX, { ...W.DAGGER_SPEC, hands: 'three-handed' }), TypeError);
});

test('a future ranged weapon is declared ranged, and needs no melee range', () => {
  const bow = W.buildWeapon(GFX, { ...W.DAGGER_SPEC, name: 'bow-test', hands: W.HANDS.TWO, ranged: true });
  assert.deepEqual({ ...bow.handling }, { hands: 'two-handed', range: 'ranged' });
  assert.equal(bow.info.Range, 'Ranged');
  assert.equal(bow.info.Hands, 'Two-handed');
});

// The hands and range each weapon is built with, and the range its reach gives.
const CASES = [
  ['createDagger', 'one-handed', 'short'],
  ['createBroadsword', 'one-handed', 'medium'],
  ['createGreatsword', 'two-handed', 'long'],
  ['createMorningstar', 'one-handed', 'medium'],
  ['createStaff', 'one-handed', 'ranged'],
  ['createBananaDagger', 'one-handed', 'short'],
  ['createBananaBroadsword', 'one-handed', 'medium'],
  ['createKrystalDagger', 'one-handed', 'short'],
  ['createGraniteSword', 'one-handed', 'medium'],
  ['createMagicEggGreatsword', 'two-handed', 'long'],
  ['createMarcsMorningstar', 'one-handed', 'medium'],
  ['createRegularGreatsword', 'two-handed', 'long'],
];

for (const [factory, hands, range] of CASES) {
  test(`${factory} is ${hands}, ${range}`, () => {
    const made = W[factory](GFX);
    assert.deepEqual({ ...made.handling }, { hands, range });
    assert.equal(made.info.Hands, W.HAND_LABELS[hands]);
    if (range === W.RANGE.RANGED) {
      assert.equal(made.info.Range, 'Ranged');
    } else {
      assert.equal(W.strikingRange(W.reachOf(made.dimensions)), range, 'the band follows the measured reach');
      assert.match(made.info.Range, new RegExp(`^${W.RANGE_LABELS[range]}, \\d+\\.\\d{2} m reach$`));
    }
  });
}

test('every catalog weapon is built with the hands its shelf entry says, and is shelved by them', () => {
  for (const entry of WEAPON_ASSETS) {
    const made = W[entry.factory](GFX);
    assert.equal(made.handling.hands, entry.hands, entry.name);
    assert.equal(weaponShelf(made.handling), weaponShelf({ hands: entry.hands }), entry.name);
  }
  const shelves = [...new Set(WEAPON_ASSETS.map((entry) => weaponShelf({ hands: entry.hands })))].sort();
  assert.deepEqual(shelves, ['One-handed', 'Two-handed']);
  assert.equal(weaponShelf({ range: W.RANGE.RANGED }), 'Ranged');
});
