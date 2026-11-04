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


test('all bicycle variants have a visible saddle and exposed seatpost geometry', () => {
  for (const name of ['bikeman', 'bikewoman', 'bmxrider']) {
    const s = sculpt(CHARACTERS[name]);
    const kit = s.shapes.filter((shape) => shape.part === 'kit');
    assert.ok(kit.length > 0, `${name}: saddle and seatpost are in the visible kit part`);
    const saddle = kit.some((shape) =>
      shape.box[0][1] > 0.3 && shape.box[1][1] > 0.32
      && shape.box[0][2] < -0.08 && shape.box[1][2] < -0.04
    );
    assert.ok(saddle, `${name}: padded saddle is behind the seat tube`);
    const post = kit.some((shape) =>
      shape.box[0][1] < 0.34 && shape.box[1][1] > 0.36
      && shape.box[0][2] < -0.04 && shape.box[1][2] > -0.1
    );
    assert.ok(post, `${name}: seatpost rises visibly from the frame`);
  }
});

test('BMX has compact BMX wheelbase, twin fork blades and axle pegs', () => {
  const s = sculpt(CHARACTERS.bmxrider);
  const metal = s.shapes.filter((shape) => shape.part === 'rigid:frame' || shape.part === 'kit');
  assert.ok(metal.length > 0);
  const pegs = metal.filter((shape) =>
    shape.box[0][0] < -0.09 || shape.box[1][0] > 0.09
  );
  assert.ok(pegs.length >= 4, 'four projecting axle pegs');
  assert.ok(CHARACTERS.bmxrider.bones.some(([name]) => name === 'wheelF'));
  assert.ok(CHARACTERS.bmxrider.bones.some(([name]) => name === 'wheelB'));
});
