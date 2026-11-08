import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { WOOD_FINISHES, WOOD_SPECIES, woodTexture } from '../src/textures/wood.js';
import { createWoodBoard } from '../src/props/wood-board.js';

test('the wood library has every species and finish the boards and kitchens use', () => {
  assert.deepEqual(WOOD_FINISHES, ['raw', 'sanded', 'lacquered']);
  for (const species of ['walnut', 'oak', 'mahogany', 'maple', 'cherry', 'ash', 'pine', 'teak']) {
    assert.ok(WOOD_SPECIES[species], species);
  }
});

test('the species parameters are sane', () => {
  for (const [name, s] of Object.entries(WOOD_SPECIES)) {
    assert.ok(s.rings > 0 && s.late >= 0 && s.late <= 1 && s.pores >= 0 && s.pores <= 1, name);
    for (const k of ['heart', 'base', 'sap']) assert.equal(s[k].length, 3, `${name}.${k}`);
  }
});

test('a species and finish name an unknown value clearly', () => {
  assert.throws(() => woodTexture(GFX, 'balsa', 'raw'), /unknown species/);
  assert.throws(() => woodTexture(GFX, 'oak', 'varnished'), /unknown finish/);
});

test('every species and finish can be made into a board; the board checks its size', () => {
  for (const species of Object.keys(WOOD_SPECIES)) {
    for (const finish of WOOD_FINISHES) {
      const { group, material } = createWoodBoard(GFX, { species, finish });
      assert.equal(group.name, 'wood board');
      assert.ok(material.name.includes(species));
    }
  }
  assert.equal(createWoodBoard(GFX, { finish: 'lacquered' }).material.clearcoat, 1);
  assert.equal(createWoodBoard(GFX, { finish: 'raw' }).material.clearcoat, 0);
  assert.throws(() => createWoodBoard(GFX, { length: 9 }), /dimensions/);
});
