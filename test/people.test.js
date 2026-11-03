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

const KIDS = [['babyboy', 'babygirl'], ['toddlerboy', 'toddlergirl'], ['boy', 'girl'], ['preteenboy', 'preteengirl'], ['teenboy', 'teengirl']];

/** The height of a person: the top of their head (as sculpted and built), times their scale. */
const tall = (def) => def.warp.to([0, 0.79, 0])[1] * def.scale;

test('children from a baby to a teenager, a boy and a girl at each age, each older one taller', () => {
  for (const pair of KIDS) for (const name of pair) assert.ok(CHARACTERS[name], name);
  for (let i = 1; i < KIDS.length; i++) for (const g of [0, 1]) assert.ok(tall(CHARACTERS[KIDS[i][g]]) > tall(CHARACTERS[KIDS[i - 1][g]]), `${KIDS[i][g]} is taller than ${KIDS[i - 1][g]}`);
  // And all of them smaller than a grown person.
  assert.ok(tall(CHARACTERS.teenboy) < tall(CHARACTERS.officeguy));
  assert.ok(tall(CHARACTERS.teengirl) < tall(CHARACTERS.officewoman));
  // A child's head is bigger for its body than a grown person's: the head's share of the height.
  const share = (def) => (def.warp.to([0, 0.79, 0])[1] - def.warp.to([0, 0.585, 0])[1]) / def.warp.to([0, 0.79, 0])[1];
  assert.ok(share(CHARACTERS.babyboy) > share(CHARACTERS.boy) && share(CHARACTERS.boy) > share(CHARACTERS.teenboy) && share(CHARACTERS.teenboy) >= share(CHARACTERS.officeguy) * 0.98);
});

test('the children carry nothing; the mothers carry a baby, and a stroller with a baby in it', () => {
  for (const pair of KIDS) for (const name of pair) assert.equal(sculpted(CHARACTERS[name]).shapes.filter((x) => x.held).length, 0, name);
  const held = (name) => sculpted(CHARACTERS[name]).shapes.filter((x) => x.held);
  assert.ok(held('motherholding').length > 5);
  assert.ok(held('motherstroller').length > held('motherholding').length);
  // The stroller rides on the root, the baby in the arms on the chest.
  assert.ok(held('motherstroller').some((x) => x.bone === 'root'));
  assert.ok(held('motherholding').every((x) => x.bone === 'chest'));
});

const ELVES = ['elfbabyboy', 'elfbabygirl', 'elftoddlerboy', 'elftoddlergirl', 'elfboy', 'elfgirl', 'elfpreteenboy', 'elfpreteengirl', 'elfteenboy', 'elfteengirl'];

test('Santa has an elf for each of the children: the same build and height, pointed ears, a long cap, and curled toes', () => {
  const same = { elfbabyboy: 'babyboy', elfbabygirl: 'babygirl', elftoddlerboy: 'toddlerboy', elftoddlergirl: 'toddlergirl', elfboy: 'boy', elfgirl: 'girl', elfpreteenboy: 'preteenboy', elfpreteengirl: 'preteengirl', elfteenboy: 'teenboy', elfteengirl: 'teengirl' };
  for (const name of ELVES) {
    const elf = CHARACTERS[name], kid = CHARACTERS[same[name]];
    assert.ok(elf && kid, name);
    assert.equal(elf.scale, kid.scale, `${name} is as tall as the ${same[name]}`);
    // Against the same child: the ears stand further out from the head, the cap rises above anything on the child's head,
    // and the toes reach further forward.
    const reach = (def, part, axis, hi = true) => Math.max(...sculpted(def).shapes.filter((x) => x.op === 'add' && x.part === part).map((x) => (hi ? x.box[1][axis] : -x.box[0][axis])));
    assert.ok(reach(elf, 'head', 0) > reach(kid, 'head', 0) + 0.02, `${name} has pointed ears`);
    assert.ok(reach(elf, 'outer2', 1) > Math.max(reach(kid, 'head', 1), reach(kid, 'hair', 1)) + 0.1, `${name} has a long cap`);
    assert.ok(reach(elf, 'shoes', 2) > reach(kid, 'shoes', 2) + 0.03, `${name} has curled toes`);
    assert.equal(sculpted(elf).shapes.filter((x) => x.held).length, 0, `${name} carries nothing`);
  }
});
