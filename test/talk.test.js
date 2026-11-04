import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHARACTERS } from '../src/characters/index.js';
import { talking } from '../src/characters/humanoid.js';
import { Skeleton } from '../src/models/rig.js';

/** People with their hands free, and heroes holding something ready in the right. */
const PEOPLE = ['officeguy', 'officewoman', 'oldman', 'fatwoman', 'baldguy', 'casualwoman', 'hoodieguy', 'beauty', 'oldwoman', 'fatman'];
/**
 * The suit is left out of the arm checks: its own hands are full, of a phone and a briefcase.
 * Heroes are what `moveHumanoid` moves: the robot. The dungeon's monsters (the skeleton and the rest) have the
 * older body of `humanoid.dungeon-roller`, which does not talk.
 */
const HEROES = ['robot'];

/** Every bone's turn, move and scale after `state` is played on `name`. */
function played(name, state) {
  const def = CHARACTERS[name], k = new Skeleton(def.bones);
  def.animate(k, { time: 1.3, t: 1.3, seed: 0, speed: 1, ...state });
  return Object.fromEntries(def.bones.map(([bone]) => {
    const b = k.bone(bone);
    return [bone, { rot: [...b.rot], move: [...b.move], scale: [...b.scale] }];
  }));
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const turned = (a, b, bone) => a[bone].rot.some((v, i) => Math.abs(v - b[bone].rot[i]) > 1e-9);

test('with nothing said, the talk clip is the idle clip exactly, so a quiet person is at rest', () => {
  for (const name of [...PEOPLE, 'suit', ...HEROES]) {
    assert.ok(same(played(name, { clip: 'talk', talk: 0 }), played(name, { clip: 'idle' })), name);
  }
});

test('the talk clip talks by default: the hands move and the head moves with the words', () => {
  for (const name of PEOPLE) {
    const idle = played(name, { clip: 'idle' }), talk = played(name, { clip: 'talk' });
    for (const bone of ['armR', 'foreR', 'armL', 'foreL', 'head', 'chest']) assert.ok(turned(talk, idle, bone), `${name}: ${bone}`);
  }
});

test('a person talks with the right arm forward and the forearm bent up', () => {
  for (const name of PEOPLE) {
    const idle = played(name, { clip: 'idle' }), talk = played(name, { clip: 'talk', talk: 1 });
    assert.ok(talk.armR.rot[0] <= idle.armR.rot[0] + 1e-9, `${name}: the arm went back`);
    assert.ok(talk.foreR.rot[0] <= idle.foreR.rot[0] + 1e-9, `${name}: the forearm straightened`);
  }
});

test('a hero keeps the weapon where it is and talks with the free hand', () => {
  for (const name of HEROES) {
    const idle = played(name, { clip: 'idle' }), talk = played(name, { clip: 'talk', talk: 1, beat: 1, think: 1 });
    assert.ok(!turned(talk, idle, 'armR'), `${name}: the weapon arm moved`);
    assert.ok(!turned(talk, idle, 'foreR'), `${name}: the weapon forearm moved`);
    assert.ok(turned(talk, idle, 'armL'), `${name}: the free hand did not talk`);
    assert.ok(turned(talk, idle, 'head'), `${name}: the head did not move`);
  }
});

test('it moves more the more it is meant to talk', () => {
  const idle = played('officeguy', { clip: 'idle' });
  const amount = (talk) => Math.abs(played('officeguy', { clip: 'talk', talk }).armR.rot[0] - idle.armR.rot[0]);
  assert.ok(amount(0.2) < amount(0.6) && amount(0.6) < amount(1));
});

test('a beat nods the head and a firmer gesture lands', () => {
  const calm = played('officeguy', { clip: 'talk', talk: 0.5 });
  const beat = played('officeguy', { clip: 'talk', talk: 0.5, beat: 1 });
  assert.ok(beat.head.rot[0] > calm.head.rot[0], 'no nod');
  assert.ok(beat.armR.rot[0] < calm.armR.rot[0], 'no firmer gesture');
});

test('thinking puts a hand up to the chin', () => {
  const idle = played('officeguy', { clip: 'idle' });
  const think = played('officeguy', { clip: 'talk', talk: 0, think: 1 });
  assert.ok(think.armR.rot[0] < idle.armR.rot[0] - 0.5, 'the arm did not come up');
  assert.ok(think.foreR.rot[0] < idle.foreR.rot[0] - 1, 'the forearm did not bend');
});

test('listening only moves the head', () => {
  const idle = played('officeguy', { clip: 'idle' });
  const listen = played('officeguy', { clip: 'talk', talk: 0, listen: 1 });
  const moved = Object.keys(idle).filter((bone) => turned(listen, idle, bone));
  assert.ok(moved.every((bone) => bone === 'head'), moved.join());
});

test('it never gives NaN or a runaway turn, whatever it is handed', () => {
  for (const name of [...PEOPLE, ...HEROES]) {
    for (const state of [{ talk: 0 }, { talk: 1, beat: 1, think: 1, listen: 1 }, { talk: 1, time: 1e4 }, {}]) {
      const pose = played(name, { clip: 'talk', ...state });
      for (const [bone, p] of Object.entries(pose)) {
        for (const v of [...p.rot, ...p.move, ...p.scale]) assert.ok(Number.isFinite(v) && Math.abs(v) < 10, `${name} ${bone}`);
      }
    }
  }
});

test('the gestures are a function of their own, for a body that is not a character’s', () => {
  const k = new Skeleton(CHARACTERS.officeguy.bones);
  talking(k, { time: 0.5, talk: 1 });
  assert.ok(k.bone('armR').rot[0] < 0);
  const quiet = new Skeleton(CHARACTERS.officeguy.bones);
  talking(quiet, { time: 0.5, talk: 0 });
  assert.ok(quiet.bones === undefined || Object.values(CHARACTERS.officeguy.bones).length > 0);
  assert.deepEqual([...quiet.bone('armR').rot], [0, 0, 0]);
});
