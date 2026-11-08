import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { GRANITES } from '../src/heroes/rock-granite.js';
import { METALS } from '../src/props/metalglobe.js';
import { createGraniteKitchen } from '../src/props/granite-kitchen.js';
import { rawLumber, finishedWood, WOOD_SPECIES } from '../src/textures/wood.js';

test('hardwood texture exposes raw and finished variants over the same species palette', () => {
  for (const species of Object.keys(WOOD_SPECIES)) {
    assert.ok(rawLumber(GFX, species));
    assert.ok(finishedWood(GFX, species));
    assert.notEqual(rawLumber(GFX, species), finishedWood(GFX, species));
  }
});

test('granite kitchen reuses the engine granite and metal palettes', () => {
  assert.deepEqual(Object.keys(GRANITES), ['grey', 'pink', 'black', 'white', 'green']);
  assert.equal(METALS.copper.color, '#f08a68');
  assert.equal(METALS.brass.color, '#e0b84e');
  const kitchen = createGraniteKitchen(GFX);
  assert.equal(kitchen.group.name, 'granite countertop and finished hardwood cabinetry');
  assert.equal(kitchen.group.userData.materials.granite.name, 'polished granite countertop');
  assert.equal(kitchen.group.userData.materials.finishedWood.name, 'finished walnut hardwood');
  assert.equal(kitchen.group.userData.materials.rawLumber.name, 'raw walnut lumber');
  assert.equal(kitchen.group.userData.materials.brass.color.getHexString(), 'e0b84e');
  assert.equal(kitchen.group.userData.materials.copper.color.getHexString(), 'f08a68');
  assert.ok(kitchen.group.getObjectByName('formed copper bowl'));
  assert.ok(kitchen.group.getObjectByName('solid brass kitchen faucet'));
  assert.ok(kitchen.group.getObjectByName('granite countertop left wing'));
});

test('granite kitchen validates material selectors and dimensions', () => {
  assert.throws(() => createGraniteKitchen(GFX, { granite: 'blue' }), /unknown granite/);
  assert.throws(() => createGraniteKitchen(GFX, { wood: 'pine' }), /unknown hardwood/);
  assert.throws(() => createGraniteKitchen(GFX, { basinMetal: 'steel' }), /invalid basin metal/);
  assert.throws(() => createGraniteKitchen(GFX, { width: 5 }), /dimensions/);
});
