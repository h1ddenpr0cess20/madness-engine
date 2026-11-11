import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createRobot, RESIN_COLORS, SHELLS } from '../src/people/index.js';
import { METALS } from '../src/props/metalglobe.js';
import { WOOD_SPECIES } from '../src/textures/wood.js';

test('the robot is built of components on the man\'s rig, his own body hidden, and moves to his clips', () => {
  const bot = createRobot(GFX, { detail: 0.5 });
  assert.equal(bot.human.body.visible, false);
  const mesh = bot.garment('robot');
  assert.ok(mesh, 'the robot garment is worn');
  assert.ok(mesh.geometry.attributes.position.count > 5000);
  for (const clip of ['idle', 'walk', 'attack']) bot.pose({ clip, t: 0.3, time: 0.3 });
});

test('outside resin, inside metal: the shell and trim are resin, the frame is metal', () => {
  const bot = createRobot(GFX, { detail: 0.5, color: 'blue', trim: 'white' });
  const m = bot.materials;
  assert.equal(m.plate.metalness, 0);
  assert.equal(m.plate.clearcoat, 0.9);
  assert.equal(m.plate.color.getHexString(), RESIN_COLORS.blue.slice(1));
  assert.equal(m.trim.color.getHexString(), RESIN_COLORS.white.slice(1));
  assert.equal(m.metal.metalness, 1);
});

test('the shell can be resin in any color, any of the engine\'s metals, or wood', () => {
  const bot = createRobot(GFX, { detail: 0.5 });
  assert.deepEqual([...SHELLS], ['resin', 'metal', 'wood']);
  bot.setShell('resin', { color: '#2040c0' });
  assert.equal(bot.materials.plate.color.getHexString(), '2040c0');
  for (const name of Object.keys(METALS)) {
    bot.setShell('metal', { metal: name });
    assert.equal(bot.materials.plate.metalness, 1, name);
    assert.equal(bot.finish.metal, name);
  }
  for (const species of Object.keys(WOOD_SPECIES)) {
    bot.setShell('wood', { wood: species });
    assert.equal(bot.materials.plate.metalness, 0, species);
    assert.equal(bot.finish.shell, 'wood');
  }
  bot.setFrame('gold');
  assert.equal(bot.materials.metal.color.getHexString(), METALS.gold.color.slice(1));
  assert.throws(() => bot.setShell('glass'), /shell/);
  assert.throws(() => bot.setShell('metal', { metal: 'unobtainium' }), /metal/);
  assert.throws(() => bot.setShell('wood', { wood: 'plastic' }), /wood/);
});

test('the robot dual wields, as the man does: a blade in each hand, held ready in both', async () => {
  const { createBroadsword, createDagger } = await import('../src/weapons/index.js');
  const bot = createRobot(GFX, { detail: 0.5 });
  bot.hold(createBroadsword(GFX), { hand: 'R' });
  bot.hold(createDagger(GFX), { hand: 'L' });
  assert.ok(bot.held('R') && bot.held('L'), 'both hands are full');
  for (const clip of ['idle', 'walk', 'attack']) bot.pose({ clip, t: 0.4, time: 0.4 });
  bot.release('L');
  assert.equal(bot.held('L'), null);
  assert.ok(bot.held('R'));
});
