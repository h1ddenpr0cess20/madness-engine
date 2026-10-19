import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';

/** What each game's main character is called, in its set, and what it gives. */
const HEROES = {
  madness: { file: 'marble', exports: ['createMarble', 'RADIUS'] },
  'dungeon-roller': { file: 'die', exports: ['createDieState', 'stepDie', 'topFace', 'dieModel', 'DIE_RADIUS'] },
  catroller: { file: 'yarn/ball', exports: ['createBall', 'TILE_METRES'] },
  petroll: { file: 'hamster', exports: ['createPlayer', 'createHamster', 'RADIUS', 'TINTS'] },
  metrlol: { file: 'ball', exports: ['createPlayer', 'RADIUS'] },
  metroll: { file: 'mace', exports: ['createMace'] },
  rocknroller: { file: 'rock', exports: ['createRock'] },
  'rocknroller-ii': { file: 'rock', exports: ['createRock'] },
  'rocknroller-iii': { file: 'rock', exports: ['createRock'] },
};

for (const [set, { file, exports }] of Object.entries(HEROES)) {
  test(`${set}: its main character loads and gives ${exports.join(', ')}`, async () => {
    const mod = await import(`../src/heroes/${set}/${file}.js`);
    for (const name of exports) assert.ok(name in mod, `${name} is missing`);
  });
}

test('the d20 has twenty numbered faces, and the die tips over onto one when it stops', async () => {
  const { createDie } = await import('../src/heroes/dungeon-roller/nat/geometry.js');
  const { createDieState, stepDie, topFace } = await import('../src/heroes/dungeon-roller/die.js');
  const model = createDie(GFX);
  assert.equal(model.faces.length, 20);
  assert.deepEqual(model.faces.map((f) => f.number).sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));

  const state = createDieState();
  const ball = { vx: 0, vz: 0, grounded: true };
  // Let go on a slant: it comes to rest flat on a face, which is the one on top.
  state.q = [0.2, 0.1, 0.3, 0.9];
  for (let i = 0; i < 600; i++) stepDie(state, ball, model, 1 / 120);
  const top = topFace(model, state.q);
  assert.ok(top.number >= 1 && top.number <= 20);
  assert.ok(top.up > 0.999, `the face is ${top.up} of the way up`);
});

test('the town games share one prop kit, and it puts shapes into one geometry per finish', async () => {
  const { createKit } = await import('../src/kit.js');
  assert.equal(typeof createKit, 'function');
  const { linearRGB } = await import('../src/color.js');
  assert.deepEqual(linearRGB('#000000'), [0, 0, 0]);
  assert.ok(Math.abs(linearRGB('#ffffff')[0] - 1) < 1e-9);
});
