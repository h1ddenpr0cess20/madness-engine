import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { METALS } from '../src/props/metalglobe.js';
import {
  BROADSWORD_DIMENSIONS,
  BROADSWORD_SPEC,
  WORLD_UNITS_PER_METRE,
  createBroadsword,
} from '../src/weapons/broadsword.js';
import { MARBLE_DISPLAY_BASE } from '../src/weapons/common.js';

test('broadsword is modelled at real-world scale with a separate marble plinth', () => {
  const sword = createBroadsword(GFX);
  assert.equal(WORLD_UNITS_PER_METRE, 1);
  assert.equal(BROADSWORD_SPEC.bladeLength, 0.78);
  assert.equal(BROADSWORD_SPEC.overallLength, 0.99);
  assert.equal(sword.dimensions.unit, 'm');
  assert.ok(sword.dimensions.overallLength > 0.95 && sword.dimensions.overallLength < 1.04);
  assert.equal(sword.dimensions.bladeLength, 0.786);
  assert.equal(sword.dimensions.gripLength, 0.14);
  assert.ok(sword.dimensions.guardSpan > sword.dimensions.bladeWidth * 4);
  assert.equal(sword.displayBase.name, 'marble display base');
  assert.equal(sword.displayBase.children.length, 2);
  assert.ok(MARBLE_DISPLAY_BASE.width > sword.dimensions.guardSpan * 2);
  assert.equal(sword.blade.name, 'double-edged blade with central fuller');
  assert.ok(sword.blade.geometry.attributes.position.count > 800);
  assert.ok(sword.blade.geometry.index.count > 4000);
  assert.equal(sword.blade.material.metalness, 1);
  assert.equal(sword.blade.material.name, 'blade metal');
  assert.equal(sword.hilt.name, 'leather grip assembly');
});

test('blade and hilt finishes switch independently using the shared twelve-metal palette', () => {
  const sword = createBroadsword(GFX, { bladeMetal: 'chrome', hiltMetal: 'brass' });
  const bladeColor = sword.blade.material.color.getHexString();
  const hiltMaterial = sword.hilt.children.find((part) => part.material?.name === 'hilt metal').material;
  const hiltColor = hiltMaterial.color.getHexString();
  assert.equal(sword.bladeMetal, 'chrome');
  assert.equal(sword.hiltMetal, 'brass');
  assert.equal(bladeColor, METALS.chrome.color.slice(1));
  assert.equal(hiltColor, METALS.brass.color.slice(1));
  sword.setBladeMetal('iron');
  assert.equal(sword.blade.material.color.getHexString(), METALS.iron.color.slice(1));
  assert.equal(sword.bladeMetal, 'iron');
  assert.equal(sword.hiltMetal, 'brass', 'changing blade finish must not change the hilt');
  assert.equal(hiltMaterial.color.getHexString(), hiltColor);
  sword.setHiltMetal('silver');
  assert.equal(sword.hiltMetal, 'silver');
  assert.equal(sword.blade.material.color.getHexString(), METALS.iron.color.slice(1));
  assert.throws(() => sword.setBladeMetal('unobtainium'), /no metal/);
  assert.throws(() => sword.setHiltMetal('unobtainium'), /no metal/);
});

test('leather grip colour is independent and validated', () => {
  const sword = createBroadsword(GFX, { gripColor: '#78452e' });
  assert.equal(sword.gripColor, '#78452e');
  const leather = sword.hilt.children.find((part) => part.name === 'leather grip');
  const oldBlade = sword.blade.material.color.getHexString();
  sword.setGripColor('#292d36');
  assert.equal(sword.gripColor, '#292d36');
  assert.equal(leather.material.color.getHexString(), '292d36');
  assert.equal(sword.blade.material.color.getHexString(), oldBlade);
  assert.throws(() => sword.setGripColor('red'), /six-digit hex/);
});

test('rejects unknown metals and invalid grip colours at construction', () => {
  assert.throws(() => createBroadsword(GFX, { bladeMetal: 'unobtainium' }), /no metal/);
  assert.throws(() => createBroadsword(GFX, { hiltMetal: 'unobtainium' }), /no metal/);
  assert.throws(() => createBroadsword(GFX, { gripColor: '#123' }), /six-digit hex/);
});

test('blade has a broad shoulder, a long taper and a pointed tip', () => {
  const sword = createBroadsword(GFX);
  const p = sword.blade.geometry.attributes.position;
  const widths = [];
  const ring = 16;
  for (let i = 0; i < p.count; i += ring) {
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < ring; j++) {
      lo = Math.min(lo, p.getX(i + j));
      hi = Math.max(hi, p.getX(i + j));
    }
    widths.push(hi - lo);
  }
  assert.ok(Math.max(...widths) > widths[0] * 1.02, 'blade broadens from the ricasso');
  assert.ok(widths.at(-1) < widths[0] * 0.03, 'blade tapers to a point');
});
