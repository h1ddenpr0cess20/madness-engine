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
import { MARBLE_POMMEL_RADIUS } from '../src/weapons/common.js';

test('broadsword is modelled at real-world scale with the spark marble as its pommel', () => {
  const sword = createBroadsword(GFX);
  assert.equal(WORLD_UNITS_PER_METRE, 1);
  assert.equal(BROADSWORD_DIMENSIONS.bladeLength, 0.786);
  assert.equal(BROADSWORD_SPEC.bladeLength, 0.786);
  assert.equal(BROADSWORD_SPEC.overallLength, 0.99);
  assert.equal(sword.dimensions.unit, 'm');
  assert.ok(Math.abs(sword.dimensions.overallLength - 0.99) < 0.015, 'overall length is close to one metre');
  assert.equal(sword.dimensions.bladeLength, 0.786);
  assert.equal(sword.dimensions.gripLength, 0.14);
  assert.ok(sword.dimensions.guardSpan > sword.dimensions.bladeWidth * 4);
  assert.equal(sword.pommel.name, 'marble');
  assert.equal(sword.marble.radius, MARBLE_POMMEL_RADIUS);
  assert.equal(sword.marble.asset.spark.name, 'spark');
  assert.equal(sword.marble.asset.glass.name, 'glass');
  assert.equal(sword.pommel.parent, sword.group);
  assert.equal(sword.handle.parent, sword.hilt);
  assert.equal(sword.handle.geometry.parameters.height, 0.14, 'leather core remains the actual 140 mm length');
  assert.equal(sword.handleBounds.bottom, sword.gripBounds.bottom);
  assert.equal(sword.handleBounds.top, sword.gripBounds.top);
  const bossBottom = sword.guardBoss.position.y - sword.guardBoss.scale.y;
  assert.ok(sword.handleBounds.top > bossBottom, 'handle slightly intersects the guard boss to close the joint');
  assert.ok(sword.handleBounds.top - bossBottom <= 0.004, 'handle does not penetrate deeply into the guard boss');
  assert.equal(sword.bezel.name, 'marble-to-leather metal bezel');
  assert.ok(sword.bezelBounds.bottom < sword.marble.height, 'bezel collar seats on the marble shoulder');
  assert.equal(sword.bezelBounds.top, sword.handleBounds.bottom, 'bezel meets the handle at its lower end');
  const sleeve = sword.bezel.children.find((part) => part.name === 'pommel bezel hollow sleeve');
  assert.ok(sleeve.geometry.parameters.openEnded, 'bezel is hollow and does not cap the marble');
  assert.equal(sleeve.material.name, 'hilt metal', 'bezel uses the independently selected hilt metal');
  assert.equal(sword.dimensions.marbleDiameter, 0.054);
  assert.equal(sword.blade.name, 'solid double-edged blade with 75% fuller');
  assert.ok(sword.blade.geometry.attributes.position.count > 800);
  assert.ok(sword.blade.geometry.index.count > 4000);
  assert.equal(sword.blade.material.metalness, 1);
  assert.equal(sword.blade.material.name, 'blade metal');
  assert.ok(sword.blade.geometry.attributes.normal.getZ(64) > 0.7, 'upper blade skin normals face outward');
  assert.equal(sword.hilt.name, 'connected hilt assembly');
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
  const ring = 20;
  for (let i = 0; i < 64 * ring; i += ring) {
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


test('blade is a watertight solid with a fuller that ends at 75 percent', () => {
  const sword = createBroadsword(GFX);
  const geometry = sword.blade.geometry;
  const position = geometry.attributes.position;
  const indices = geometry.index.array;
  const ringSize = 20;
  const ringCount = 64;
  assert.equal(position.count, ringCount * ringSize + 2);
  assert.equal(indices.length, 60 + (63 * ringSize * 6) + 60);
  assert.equal(sword.dimensions.fullerLength, sword.dimensions.bladeLength * 0.75);

  // Every undirected mesh edge belongs to exactly two triangles. This catches
  // open face sheets, missing core walls, and an uncapped root or blade point.
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = a < b ? a + ':' + b : b + ':' + a;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  assert.ok([...edges.values()].every((count) => count === 2), 'all edges are shared by exactly two faces');

  // The fuller profile must be present before the final quarter, then fade
  // cleanly to the undepressed full-thickness point section.
  const thicknessAt = (ringIndex) => {
    const start = ringIndex * ringSize;
    return position.getZ(start + 5) - position.getZ(start + 15);
  };
  const atHalf = thicknessAt(32);
  const nearThreeQuarter = thicknessAt(47);
  const afterFuller = thicknessAt(49);
  assert.ok(atHalf < thicknessAt(8) * 0.9, 'fuller visibly depresses the central section');
  assert.ok(afterFuller > nearThreeQuarter, 'fuller fades away at 75 percent');
});


test('handle is not buried in either the spark marble or the guard', () => {
  const sword = createBroadsword(GFX);
  const glassTop = sword.marble.height;
  assert.ok(sword.handleBounds.bottom > glassTop, 'leather begins above the glass surface');
  assert.equal(sword.handleBounds.length, BROADSWORD_DIMENSIONS.gripLength);
  const bossBottom = sword.guardBoss.position.y - sword.guardBoss.scale.y;
  assert.ok(sword.handleBounds.top > bossBottom, 'handle has a small positive overlap into the guard boss');
  assert.ok(sword.handleBounds.top - bossBottom <= 0.004, 'handle remains outside the deeper guard centre');
  assert.ok(sword.bezelBounds.outerRadius > sword.handle.geometry.parameters.radiusTop,
    'bezel gives the leather-to-marble joint a visible metal shoulder');
});
