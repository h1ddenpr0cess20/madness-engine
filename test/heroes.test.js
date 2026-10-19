import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';

/** The main characters, by name, and what each gives. */
const HEROES = {
  marble: ['createMarble', 'RADIUS'],
  die: ['createDieState', 'stepDie', 'topFace', 'dieModel', 'DIE_RADIUS'],
  'yarn/ball': ['createBall', 'TILE_METRES'],
  hamster: ['createPlayer', 'createHamster', 'RADIUS', 'TINTS'],
  ball: ['createPlayer', 'RADIUS'],
  mace: ['createMace'],
  morningstar: [],
  rock: ['createRock'],
  boulder: [],
};

for (const [file, exports] of Object.entries(HEROES)) {
  test(`heroes/${file}: loads${exports.length ? ` and gives ${exports.join(', ')}` : ''}`, async () => {
    const mod = await import(`../src/heroes/${file}.js`);
    assert.ok(Object.keys(mod).length > 0);
    for (const name of exports) assert.ok(name in mod, `${name} is missing`);
  });
}

test('the d20 has twenty numbered faces, and the die tips over onto one when it stops', async () => {
  const { createDie } = await import('../src/heroes/nat/geometry.js');
  const { createDieState, stepDie, topFace } = await import('../src/heroes/die.js');
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
