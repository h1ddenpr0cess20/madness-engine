import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { METALS } from '../src/props/metalglobe.js';
import { createMetalMorningStar } from '../src/heroes/morningstar.js';
import { createBroadsword } from '../src/weapons/broadsword.js';
import { createGreatsword } from '../src/weapons/greatsword.js';
import { createMorningstar } from '../src/weapons/morningstar.js';

const sameAttribute = (a, b) => {
  assert.deepEqual([...a.array], [...b.array]);
};

test('morningstar reuses the exact original head geometry and joins it to a long shared-style handle', () => {
  const weapon = createMorningstar(GFX);
  const sourceHead = createMetalMorningStar(GFX, { metal: 'steel' });

  sameAttribute(weapon.core.geometry.attributes.position, sourceHead.core.geometry.attributes.position);
  sameAttribute(weapon.spikes.geometry.attributes.position, sourceHead.mesh.geometry.attributes.position);
  sameAttribute(weapon.spikes.geometry.attributes.color, sourceHead.mesh.geometry.attributes.color);

  assert.equal(weapon.head.metal, 'steel');
  assert.equal(weapon.handle.name, 'leather grip');
  assert.equal(weapon.shaft.name, 'polished metal haft');
  assert.equal(weapon.pommel.name, 'marble');
  assert.equal(weapon.marble.asset.spark.name, 'spark');
  assert.equal(weapon.dimensions.gripLength, 0.24);
  assert.ok(weapon.dimensions.gripLength > createBroadsword(GFX).dimensions.gripLength);
  assert.equal(weapon.dimensions.haftLength, 0.7);
  assert.ok(weapon.dimensions.overallLength > 1.1 && weapon.dimensions.overallLength < 1.25);
  assert.equal(weapon.shaft.geometry.parameters.height, 0.7);
  assert.equal(weapon.shaft.material.name, 'hilt metal');
  assert.equal(weapon.head.group.scale.x, 0.11);
});

test('morningstar metal selection updates the complete head and haft finish', () => {
  const weapon = createMorningstar(GFX, { metal: 'gold' });
  assert.equal(weapon.metal, 'gold');
  assert.equal(weapon.head.metal, 'gold');
  assert.equal(weapon.shaft.material.color.getHexString(), METALS.gold.color.slice(1));
  weapon.setMetal('chrome');
  assert.equal(weapon.metal, 'chrome');
  assert.equal(weapon.head.metal, 'chrome');
  assert.equal(weapon.core.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(weapon.spikes.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(weapon.shaft.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(weapon.hilt.children.find((part) => part.name === 'marble-to-leather metal bezel')
    .children[0].material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.throws(() => weapon.setMetal('unobtainium'), /no metal/);
});

test('morningstar leather grip colour is independent of its metal finish', () => {
  const weapon = createMorningstar(GFX, { gripColor: '#78452e' });
  const shaft = weapon.shaft.material.color.getHexString();
  weapon.setGripColor('#292d36');
  assert.equal(weapon.gripColor, '#292d36');
  assert.equal(weapon.handle.material.color.getHexString(), '292d36');
  assert.equal(weapon.shaft.material.color.getHexString(), shaft);
  assert.throws(() => weapon.setGripColor('red'), /six-digit hex/);
});

test('greatsword keeps a two-hand grip longer than the broadsword', () => {
  const sword = createGreatsword(GFX);
  const broadsword = createBroadsword(GFX);
  assert.equal(sword.dimensions.gripLength, 0.28);
  assert.equal(sword.handle.geometry.parameters.height, 0.28);
  assert.equal(broadsword.dimensions.gripLength, 0.14);
  assert.ok(sword.dimensions.overallLength > 1.45 && sword.dimensions.overallLength < 1.6);
});
