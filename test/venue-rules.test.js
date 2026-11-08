import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { COMBO_WINDOW, comboAt, createHype, earn, MAX_MULTIPLIER, smashed, windowLeft } from '../src/venue/hype.js';
import { createIntegrity, cracked, heal, hurt, revive, shattered } from '../src/venue/integrity.js';
import { closingSpeed, CRIT, GRADES, resolveImpact } from '../src/venue/smash.js';
import { BALL_RADIUS, createRoll, stepRoll } from '../src/venue/roll.js';
import { BELT, createGig, PICKUPS, resultOf, STEP, stepGig } from '../src/venue/gig.js';
import { Venue, buildVenue } from '../src/venue/venue.js';
import { digger } from '../src/venue/dig.js';
import { createExit, createVenueMeshes } from '../src/venue/scenery.js';

const foe = { toughness: 6, power: 5 };

test('a hit is graded by how fast it was: tap, bonk, smash, crit', () => {
  assert.equal(resolveImpact({ speed: 0.5, foe }).grade, 'tap');
  assert.equal(resolveImpact({ speed: foe.toughness * 0.6, foe }).grade, 'bonk');
  assert.equal(resolveImpact({ speed: foe.toughness, foe }).grade, 'smash');
  assert.equal(resolveImpact({ speed: Math.max(foe.toughness * CRIT.times, CRIT.least) + 1, foe }).grade, 'crit');
  for (const grade of ['crit', 'smash', 'bonk', 'tap']) assert.ok(GRADES[grade].title);
});

test('a smash costs the hero nothing, a tap the foe\'s whole power, and a bonk less the closer it was to a smash', () => {
  assert.equal(resolveImpact({ speed: foe.toughness, foe }).damage, 0);
  assert.equal(resolveImpact({ speed: 0, foe }).damage, foe.power);
  const slow = resolveImpact({ speed: foe.toughness * 0.55, foe }).damage;
  const fast = resolveImpact({ speed: foe.toughness * 0.95, foe }).damage;
  assert.ok(fast < slow && slow < foe.power);
});

test('the closing speed is along the line between them, and a drop onto someone counts too', () => {
  const hero = { x: 0, y: 0, z: 0, vx: 4, vy: 0, vz: 0, r: 0.45 };
  assert.equal(closingSpeed(hero, { x: 2, y: 0, z: 0 }), 4);
  assert.equal(closingSpeed(hero, { x: -2, y: 0, z: 0 }), 0);
  assert.equal(closingSpeed(hero, { x: 2, y: 0, z: 0 }, [-3, 0, 0]), 7);
  const falling = { ...hero, vx: 0, vy: -5, y: 3 };
  assert.ok(closingSpeed(falling, { x: 0.1, y: 0, z: 0, height: 0.5 }) > 3);
});

test('hype: smashes in a row build a combo that multiplies, up to the cap, and it drops after the window', () => {
  const hype = createHype();
  assert.equal(smashed(hype, 100, 0).gain, 100);
  assert.equal(smashed(hype, 100, 1).gain, 200);
  assert.equal(smashed(hype, 100, 2).multiplier, 3);
  for (let t = 3; t < 12; t++) smashed(hype, 100, t);
  assert.equal(comboAt(hype, 11.5), 12);
  assert.equal(smashed(hype, 100, 12).multiplier, MAX_MULTIPLIER);
  assert.equal(comboAt(hype, 12 + COMBO_WINDOW + 0.1), 0);
  assert.equal(smashed(hype, 100, 30).gain, 100);
  assert.ok(windowLeft(hype, 30.2) > 0.9 && windowLeft(hype, 40) === 0);
  assert.equal(earn(hype, 25), 25);
  assert.equal(createHype().pickups, 0);
});

test('integrity: hurt, heal up to the best and no more, shatter, and get up again on a spare', () => {
  const hero = createIntegrity();
  assert.equal(hurt(hero, 30), 30);
  assert.equal(hero.hp, 70);
  assert.equal(heal(hero, 25), 25);
  assert.equal(heal(hero, 25), 5);
  assert.equal(cracked(hero), 0);
  hurt(hero, 150);
  assert.ok(shattered(hero));
  assert.equal(revive(hero), false);
  hero.revives = 1;
  assert.equal(revive(hero), true);
  assert.equal(hero.hp, 50);
  assert.equal(hero.revives, 0);
  assert.equal(heal({ hp: 0, max: 100 }, 10), 0, 'no healing the dead');
});

test('the hero turns as it rolls, and tumbles in the air', () => {
  const roll = createRoll();
  const ball = { grounded: true, vx: 3, vy: 0, vz: 0, nx: 0, ny: 1, nz: 0, r: BALL_RADIUS };
  for (let i = 0; i < 60; i++) stepRoll(roll, ball, STEP);
  assert.ok(roll.spin.some((v) => Math.abs(v) > 0));
  assert.ok(Math.abs(Math.hypot(...roll.q) - 1) < 1e-6, 'still a unit turn');
});

/** A flat floor to a ring, with a pickup of each kind on the way. */
function game() {
  const make = () => {
    const venue = new Venue({ name: 'T', cols: 20, rows: 8, palette: { tiles: ['#808080'], zapHue: 2.9 } });
    const d = digger(venue, { x: 1, z: 3, h: 1, heading: '+x' });
    d.hall(12, { width: 3 });
    d.exit(2);
    venue.start = { x: 2, z: 3 };
    venue.pickup('pick', 3, 3, 10).pickup('stash', 4, 3, 60).pickup('repair', 5, 3, 25).pickup('spare', 6, 3).pickup('pass', 7, 3).pickup('token', 8, 3, 100);
    return venue;
  };
  // The part of a game's actors that the gig reads: what it puts on the floor, and what it does each step.
  const createActors = (_GFX, venue) => ({
    pickups: venue.pickups.map((p) => ({ ...p, y: venue.heightAt(p.x, p.z), taken: false })),
    props: [], doors: [], spikes: [], bumpers: [],
    place() {}, step: () => null, drain: () => [], velocityOf: () => [0, 0, 0],
    hurt() { return 0; }, smashProp() {}, breakDoor() {}, open() {},
  });
  return { loadVenue: make, createActors };
}

test('a gig plays a venue the game gives it, and a pickup does what the game\'s table says', () => {
  assert.throws(() => createGig(GFX, 0), /loadVenue and createActors/);
  const gig = createGig(GFX, 0, game());
  assert.equal(gig.hero.hp, 100);
  assert.equal(gig.pickups, PICKUPS);
  assert.equal(gig.stats.tokens, 0);
  gig.hero.hp = 40;
  const kinds = { pick: 'pick', stash: 'stash', repair: 'repair', spare: 'spare', pass: 'pass', token: 'token' };
  // Roll the length of the hall, so everything in the way is picked up.
  for (let i = 0; i < 120 * 10; i++) {
    const out = stepGig(gig, [1, 0]);
    if (out.outcome) break;
  }
  assert.ok(gig.hero.hp > 40, 'repaired');
  assert.equal(gig.hero.revives, 1);
  assert.equal(gig.passes, 1);
  assert.equal(gig.stats.pickups, 1 + 5);
  assert.equal(gig.hype.pickups, 1 + 5);
  assert.equal(gig.stats.tokens, 1);
  assert.equal(gig.hype.score, 10 + 60 + 100);
  assert.deepEqual(resultOf(gig), { smashed: 0, foes: 0, tokens: 1 });
  assert.equal(Object.keys(kinds).length, Object.keys(PICKUPS).length);
});

test('a game with its own names for pickups passes its own table', () => {
  const gig = createGig(GFX, 0, { ...game(), pickups: { pick: { score: 1 } } });
  for (let i = 0; i < 120 * 4; i++) stepGig(gig, [1, 0]);
  assert.equal(gig.stats.pickups, 1);
  assert.equal(gig.stats.tokens, 0, 'kinds the table does not know are left alone');
});

test('a built venue is drawn: the electrified floor is the lava pit turned blue, and the exit has its sign', () => {
  const venue = game().loadVenue();
  venue.zap(1, 2, 2, 1, 1);
  const built = buildVenue(venue);
  const meshes = createVenueMeshes(GFX, built, venue);
  const zap = meshes.group.children.find((c) => c.name === 'lava');
  assert.ok(zap, 'the zap floor');
  assert.equal(zap.material.name, 'lava-pit');
  assert.equal(zap.material.uniforms.uHue.value, 2.9);
  meshes.update(1.5);
  assert.equal(zap.material.uniforms.uTime.value, 1.5);
  assert.ok(BELT.speed > 0);
  const exit = createExit(GFX, venue, { signs: { exit: 'CUT', last: 'THE END' } });
  assert.ok(exit && exit.at[1] === 1);
});
