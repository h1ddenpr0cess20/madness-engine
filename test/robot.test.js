import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createRobot, METALS } from '../src/people/index.js';

test('the robot is a taller, broader, narrower-waisted edit of the man, and moves to his clips', () => {
  const bot = createRobot(GFX, { detail: 0.5 });
  assert.ok(bot.height > 1.95 && bot.height < 2.1, `height ${bot.height}`);
  bot.pose({ clip: 'walk', t: 0.3, time: 0.3 });
  assert.equal(bot.finish, 'brushed steel');
  assert.equal(bot.materials.skin.metalness, 1);
});

test('finishes: every metal, and resin cast like the dice', () => {
  const bot = createRobot(GFX, { detail: 0.5 });
  for (const f of Object.keys(METALS)) assert.equal(bot.setFinish(f).materials.skin.metalness, 1);
  bot.setFinish('resin', { color: '#2040c0' });
  const m = bot.materials.skin;
  assert.equal(m.metalness, 0);
  assert.equal(m.clearcoat, 0.9);
  assert.equal(m.color.getHexString(), '2040c0');
  assert.throws(() => bot.setFinish('wood'), /finish/);
});
