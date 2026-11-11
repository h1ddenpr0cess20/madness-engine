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

test('the heavy build is stouter than the standard one, on the same skeleton, and keeps its finish', () => {
  const widest = (bot) => {
    const p = bot.garment('robot').geometry.attributes.position;
    let lo = Infinity, hi = -Infinity, zlo = Infinity, zhi = -Infinity;
    for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getX(i)); hi = Math.max(hi, p.getX(i)); zlo = Math.min(zlo, p.getZ(i)); zhi = Math.max(zhi, p.getZ(i)); }
    return { w: hi - lo, d: zhi - zlo, n: p.count };
  };
  const slim = createRobot(GFX, { detail: 0.5, color: 'blue' });
  const heavy = createRobot(GFX, { detail: 0.5, build: 'heavy', color: 'blue' });
  const a = widest(slim), b = widest(heavy);
  assert.ok(b.w > a.w + 0.02, `broader: ${b.w} against ${a.w}`);
  assert.ok(b.d > a.d, 'deeper');
  assert.ok(b.n > a.n, 'more parts (the plating)');
  assert.equal(heavy.finish.build, 'heavy');
  // Changing build live keeps the finish and the clips work.
  slim.setShell('metal', { metal: 'gold' }).setBuild('heavy');
  assert.equal(slim.finish.build, 'heavy');
  assert.equal(slim.materials.plate.metalness, 1);
  assert.ok(widest(slim).w > a.w + 0.02);
  slim.setBuild('standard');
  assert.ok(Math.abs(widest(slim).w - a.w) < 1e-6);
  slim.pose({ clip: 'walk', t: 0.3, time: 0.3 });
  assert.throws(() => slim.setBuild('tiny'), /build/);
});

test('by default the robot is white resin with black trim', () => {
  const bot = createRobot(GFX, { detail: 0.5 });
  assert.equal(bot.finish.shell, 'resin');
  assert.equal(bot.finish.color, 'white');
  assert.equal(bot.finish.trim, 'black');
  assert.equal(bot.materials.plate.color.getHexString(), RESIN_COLORS.white.slice(1));
  assert.equal(bot.materials.trim.color.getHexString(), RESIN_COLORS.black.slice(1));
});
