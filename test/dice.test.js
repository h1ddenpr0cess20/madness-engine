import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createDie } from '../src/heroes/nat/geometry.js';
import { createDieProp, DICE, DICE_TYPES } from '../src/dice.js';


function labelsForType(type) {
  if (type === 'd10') return Array.from({ length: 10 }, (_, i) => String(i));
  if (type === 'd100') return Array.from({ length: 10 }, (_, i) => String(i * 10).padStart(2, '0'));
  return Array.from({ length: DICE_TYPES.find((entry) => entry.id === type).faceCount }, (_, i) => i + 1);
}

test('the standalone catalog has seven solids with both numbered and pip D6 styles', () => {
  assert.deepEqual(DICE_TYPES.map((die) => die.label), ['D4', 'D6 · numbered', 'D6 · pips', 'D8', 'D10', 'D% (00–90)', 'D12', 'D20']);
  assert.deepEqual(Object.keys(DICE), ['d4', 'd6', 'd6Pips', 'd8', 'd10', 'd%', 'd12', 'd20']);
});

test('every die has the expected number of closed, numbered faces', () => {
  for (const entry of DICE_TYPES) {
    const die = createDieProp(GFX, entry.id);
    assert.equal(die.faces.length, entry.faceCount, entry.label + ' face count');
    assert.deepEqual(die.numbers.map(String).sort(), labelsForType(entry.id).map(String).sort(), entry.label + ' label range');
    assert.equal(die.numbers.length, entry.faceCount, entry.label + ' labels');
    assert.equal(new Set(die.numbers.map(String)).size, entry.faceCount, entry.label + ' unique labels');
    assert.ok(die.faces.every((face) => face.normal.length() > 0.99), entry.label + ' face normals');
    assert.ok(die.faces.every((face) => face.mesh?.isMesh), entry.label + ' face glyph meshes');
  }
});

test('the standalone d20 copies Nat geometry and resin finish without sharing its character group', () => {
  const nat = createDie(GFX);
  const prop = createDieProp(GFX, 'd20');
  assert.notEqual(prop.group.name, nat.group.name);
  assert.equal(prop.group.name, 'rpg_dice_d20_prop');
  assert.deepEqual(prop.numbers, nat.numbers);
  const a = prop.die.geometry.attributes.position;
  const b = nat.die.geometry.attributes.position;
  assert.ok(a.count > b.count, 'the standalone d20 has extra chamfer facets');
  assert.equal(prop.faces.length, 20, 'the original twenty numbered faces are retained');
  assert.deepEqual(prop.numbers, nat.numbers, 'face numbers retain Nat d20 ordering');
  assert.equal(prop.dieMat.color.getHexString(), '3a3350');
  assert.equal(prop.dieMat.roughness, 0.28);
  assert.equal(prop.dieMat.clearcoat, 0.9);
});

test('a custom resin colour changes the die and its edge ink', () => {
  const prop = createDieProp(GFX, 'd20', { color: '#123456' });
  assert.equal(prop.dieMat.color.getHexString(), '123456');
  assert.notEqual(prop.edges.material.color.getHexString(), '8d80b8');
  assert.equal(createDieProp(GFX, 'd%', { color: '#aa3377' }).dieMat.color.getHexString(), 'aa3377');
});

test('D10 and percentile faces use their conventional printed ranges', () => {
  assert.deepEqual(createDieProp(GFX, 'd10').numbers.slice().sort(), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  assert.deepEqual(createDieProp(GFX, 'd%').numbers.slice().sort(), ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']);
  assert.deepEqual(createDieProp(GFX, 'd6-pips').numbers.slice().sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
  const pips = createDieProp(GFX, 'd6-pips');
  const numbered = createDieProp(GFX, 'd6');
  assert.equal(pips.die.geometry.attributes.position.count, numbered.die.geometry.attributes.position.count);
  assert.equal(pips.faces[0].mesh.geometry.parameters.width, 1.02, 'pip field fills most of the cube face');
});

test('unknown die types are rejected rather than silently creating a different solid', () => {
  assert.throws(() => createDieProp(GFX, 'd16'), /unsupported die type/);
});
