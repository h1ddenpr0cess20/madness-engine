import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHARACTERS } from '../src/characters/index.js';
import { Skeleton } from '../src/models/rig.js';
import { Sculpt } from '../src/models/sdf.js';

const MEN = ['oldman', 'fatman', 'baldguy', 'hoodieguy', 'officeguy'];
const WOMEN = ['oldwoman', 'fatwoman', 'beauty', 'casualwoman', 'officewoman'];

const sculpted = (def) => {
  const s = new Sculpt();
  def.sculpt(s);
  return s;
};

test('ten ordinary people are in the library, five men and five women', () => {
  for (const name of [...MEN, ...WOMEN]) assert.ok(CHARACTERS[name], name);
  assert.equal(new Set([...MEN, ...WOMEN]).size, 10);
});

test('the ordinary people carry nothing: no shape of theirs is held in a hand', () => {
  for (const name of [...MEN, ...WOMEN]) {
    const held = sculpted(CHARACTERS[name]).shapes.filter((x) => x.held);
    assert.equal(held.length, 0, `${name} holds ${held.length} shapes`);
  }
});

/** How far out to the side the sculpt reaches at the trunk (its bounds, across). */
const across = (def) => {
  const s = new Sculpt();
  s.shapes = sculpted(def).shapes.filter((x) => x.op === 'add' && (x.part === 'top' || x.part === 'body'));
  const [lo, hi] = s.bounds(0);
  return hi[0] - lo[0];
};

test('the heavy ones are broader than their slimmer counterparts', () => {
  for (const [big, slim] of [['fatman', 'officeguy'], ['fatwoman', 'casualwoman']]) {
    assert.ok(across(CHARACTERS[big]) > across(CHARACTERS[slim]) * 1.1, `${big} is broader than ${slim}`);
  }
});

test('the old ones stoop: their head is further forward than a young person\'s', () => {
  const lean = (name) => {
    const def = CHARACTERS[name];
    const k = new Skeleton(def.bones);
    def.animate(k, { clip: 'idle', t: 0, time: 0, seed: 0, speed: 1 });
    k.compute();
    return def.warp.from(k.point('head', def.warp.to([0, 0.67, 0.0])))[2];
  };
  assert.ok(lean('oldman') > lean('officeguy') + 0.01);
  assert.ok(lean('oldwoman') > lean('officewoman') + 0.01);
});

test('Santa has one wide belt on the body, not a second one floating over it', () => {
  const belts = sculpted(CHARACTERS.santa).shapes.filter((x) => x.part === 'belt' && x.op === 'add' && x.mat === 'leather');
  assert.equal(belts.length, 1);
});
