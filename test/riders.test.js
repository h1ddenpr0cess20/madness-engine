import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHARACTERS } from '../src/characters/index.js';
import { Skeleton } from '../src/models/rig.js';
import { Sculpt } from '../src/models/sdf.js';

const NAMES = ['skaterRiding', 'bikeman', 'bikewoman', 'bmxrider'];
const sculpt = (def) => {
  const s = new Sculpt();
  def.sculpt(s);
  return s;
};

test('the riding skater, two ordinary bicycle riders and BMX rider are in the character library', () => {
  for (const name of NAMES) assert.ok(CHARACTERS[name], name);
  assert.equal(CHARACTERS.skaterRiding.name, 'skater-riding');
  for (const name of ['bikeman', 'bikewoman', 'bmxrider']) assert.equal(CHARACTERS[name].name, name);
});

test('the riding skater has a deck and four independent wheel assemblies', () => {
  const s = sculpt(CHARACTERS.skaterRiding);
  assert.ok(s.shapes.some((x) => x.part === 'rigid:board'), 'deck');
  for (const wheel of ['wheelBL', 'wheelBR', 'wheelFL', 'wheelFR']) {
    assert.ok(CHARACTERS.skaterRiding.bones.some(([name]) => name === wheel), `${wheel} axle`);
    assert.ok(s.shapes.some((x) => x.part === `rigid:${wheel}`), `${wheel} mesh`);
  }
});

test('bicycle and BMX riders have independent front and rear wheel axles and pedals', () => {
  for (const name of ['bikeman', 'bikewoman', 'bmxrider']) {
    const def = CHARACTERS[name];
    const s = sculpt(def);
    for (const bone of ['wheelF', 'wheelB', 'crank', 'pedalL', 'pedalR']) {
      assert.ok(def.bones.some(([n]) => n === bone), `${name}: ${bone} bone`);
    }
    assert.ok(s.shapes.some((x) => x.part === 'rigid:wheelF'), `${name}: front wheel mesh`);
    assert.ok(s.shapes.some((x) => x.part === 'rigid:wheelB'), `${name}: rear wheel mesh`);
  }
});

test('riding animations rotate every wheel about its axle', () => {
  for (const name of NAMES) {
    const def = CHARACTERS[name];
    const k = new Skeleton(def.bones);
    def.animate(k, { clip: 'ride', t: 1, time: 1, seed: 0, speed: 1 });
    const wheels = name === 'skaterRiding'
      ? ['wheelBL', 'wheelBR', 'wheelFL', 'wheelFR']
      : ['wheelF', 'wheelB'];
    for (const wheel of wheels) {
      assert.ok(Math.abs(k.bone(wheel).rot[0]) > 0.01, `${name}: ${wheel} spins`);
    }
  }
});
