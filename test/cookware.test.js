import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COOKWARE_FINISHES, COOKWARE_PIECES, lidProfile, potProfile } from '../src/props/cookware.js';
import { METALS } from '../src/props/metal-finish.js';

test('the cookware library defines two complete five-piece lines', () => {
  assert.deepEqual(Object.keys(COOKWARE_FINISHES), ['steel', 'nonstick']);
  assert.equal(COOKWARE_PIECES.length, 5);
  assert.deepEqual(COOKWARE_PIECES.map((piece) => piece.id), ['small-skillet', 'large-skillet', 'saucepan', 'large-pot', 'stockpot']);
  assert.equal(COOKWARE_PIECES.filter((piece) => piece.kind === 'skillet').length, 2);
  assert.equal(COOKWARE_PIECES.filter((piece) => piece.kind === 'pot').length, 3);
});

test('stainless cookware uses the existing steel metal definition unchanged', () => {
  assert.equal(COOKWARE_FINISHES.steel.metal, METALS.steel);
  assert.equal(COOKWARE_FINISHES.steel.bodyColor, METALS.steel.color);
  assert.equal(COOKWARE_FINISHES.steel.roughness, METALS.steel.roughness);
  assert.equal(COOKWARE_FINISHES.steel.metalness, 1);
});

test('the nonstick finish has a separate dark, low-metalness coating', () => {
  assert.notEqual(COOKWARE_FINISHES.nonstick.bodyColor, COOKWARE_FINISHES.steel.bodyColor);
  assert.ok(COOKWARE_FINISHES.nonstick.metalness < COOKWARE_FINISHES.steel.metalness);
  assert.ok(COOKWARE_FINISHES.nonstick.roughness > COOKWARE_FINISHES.steel.roughness);
});

test('pot profiles have a rolled rim, hollow wall section and base on y = 0', () => {
  for (const piece of COOKWARE_PIECES.filter((item) => item.kind === 'pot')) {
    const profile = potProfile(piece);
    const xs = profile.map(([x]) => x), ys = profile.map(([, y]) => y);
    assert.deepEqual(profile[0], [0, piece.wall]);
    assert.deepEqual(profile.at(-1), [0, 0]);
    assert.ok(Math.abs(Math.max(...xs) - piece.radius) < 1e-9);
    assert.ok(Math.abs(Math.max(...ys) - piece.height) < 1e-9);
    assert.ok(Math.min(...ys) >= 0);
    assert.ok(profile.length > 20);
  }
});

test('the lids fit inside the vessel rim and rise into a shallow dome', () => {
  for (const piece of COOKWARE_PIECES.filter((item) => item.kind === 'pot')) {
    const profile = lidProfile(piece);
    const xs = profile.map(([x]) => x), ys = profile.map(([, y]) => y);
    assert.equal(profile[0][0], 0);
    assert.equal(profile.at(-1)[0], 0);
    assert.ok(Math.max(...xs) < piece.radius);
    assert.ok(Math.max(...ys) > piece.wall * 0.6);
  }
});

test('invalid vessel dimensions are rejected before geometry creation', () => {
  assert.throws(() => potProfile({ radius: 0.01, height: 0.3, wall: 0.02 }), RangeError);
  assert.throws(() => potProfile({ radius: 0.3, height: 0.01, wall: 0.02 }), RangeError);
  assert.throws(() => lidProfile({ radius: 0.01, wall: 0.02 }), RangeError);
});
