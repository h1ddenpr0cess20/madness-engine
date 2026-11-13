import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { createFreighter, FREIGHTER, FREIGHTER_DRIVE } from '../src/vehicles/freighter.js';
import { VEHICLES } from '../src/scenery/vehicles.js';

const near = (a, b, eps, what) => assert.ok(Math.abs(a - b) <= eps, `${what}: ${a} vs ${b}`);
const boxOf = (object) => { object.updateMatrixWorld(true); return new GFX.Box3().setFromObject(object); };

test('the freighter stands on the ground facing +z, with its origin at the back wheels', () => {
  const f = createFreighter(GFX);
  const box = boxOf(f.group);
  near(box.min.y, 0, 1e-6, 'on the ground');
  near(box.max.y - box.min.y, FREIGHTER.height, 0.01, 'height');
  near(box.max.x - box.min.x, FREIGHTER.width, 0.01, 'width');
  near(box.max.z - box.min.z, FREIGHTER.length, 0.01, 'length');
  near((box.max.x + box.min.x) / 2, 0, 0.01, 'centered across');
  // The nose is at +z: the light bar is in front of the rear doors.
  assert.ok(f.parts.led_bar_centre.getWorldPosition(new GFX.Vector3()).z > 8);
  assert.ok(f.parts.rear_doors.getWorldPosition(new GFX.Vector3()).z < -0.9);
  // It pivots about the back wheels: the origin is between the last two axles.
  assert.ok(FREIGHTER.axles[3] < 0 && FREIGHTER.axles[2] > 0);
});

test('four axles: two steer at the front, two on duals behind, every wheel on the ground', () => {
  const f = createFreighter(GFX);
  assert.equal(f.wheels.length, 12, 'two singles on each front axle, two pairs on each rear one');
  assert.equal(f.steeredWheels.length, 4);
  const at = new GFX.Vector3();
  const z = new Set();
  for (const w of f.wheels) {
    w.getWorldPosition(at);
    near(at.y, FREIGHTER.tireRadius + 0.006, 1e-6, `${w.name} rolls on the ground`);
    z.add(+at.z.toFixed(3));
  }
  assert.deepEqual([...z].sort((a, b) => b - a), [...FREIGHTER.axles].sort((a, b) => b - a));
  for (const w of f.steeredWheels) { w.getWorldPosition(at); assert.ok(at.z > 6, `${w.name} is at the front`); }
  // The bottom of the lowest tire is the ground (the truck is a vehicle that is on its wheels, not floating over them).
  near(boxOf(f.group).min.y, 0, 1e-6, 'tires touch');
});

test('it is built from the freighter\'s own parts: every mesh is named once, and the scale and paint are options', () => {
  const f = createFreighter(GFX, { scale: 0.41, paint: '#c8382c', accent: 0x123456 });
  const names = [];
  f.group.traverse((o) => { if (o.geometry) names.push(o.name); });
  assert.equal(new Set(names).size, names.length, 'no two parts share a name');
  assert.equal(names.length, 197);
  for (const n of ['cab_shell', 'glass_canopy', 'cargo_body', 'rear_doors', 'battery_pack', 'bolt_badge', 'leaf_badge_left', 'fender_3_r', 'mudflap_r', 'axle_beam_0']) assert.ok(n in f.parts, n);
  near(f.materials.white.color.r, new GFX.Color('#c8382c').r, 1e-6, 'painted');
  near(f.materials.green.color.b, new GFX.Color(0x123456).b, 1e-6, 'accent');
  near(boxOf(f.group).max.y, FREIGHTER.height * 0.41, 0.01, 'scaled');
  // Its parts are cheap to draw and cast shadows.
  assert.ok(f.parts.cab_shell.castShadow && f.wheels[0].children[0].castShadow);
});

/** The numbers and the loop the freighter was made with, as the page it came from has them (metres, seconds, the truck nosed toward −z). */
function original() {
  const s = { speed: 0, steer: 0, heading: 0, x: 0, z: 0, spin: 0 };
  return Object.assign(s, {
    tick(keys, dt) {
      dt = Math.min(dt, 0.05);
      if (keys.up) s.speed += 6.5 * dt;
      else if (keys.down) s.speed -= 7.5 * dt;
      else s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), 2.2 * dt);
      if (keys.space) s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), 12 * dt);
      s.speed = Math.max(-6, Math.min(22, s.speed));
      const want = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      const limit = 0.46 * (1 - Math.min(Math.abs(s.speed) / 26, 0.62));
      s.steer += (want * limit - s.steer) * Math.min(1, 7 * dt);
      if (Math.abs(s.speed) > 0.01) {
        s.heading += (s.speed / 7.28) * Math.tan(s.steer) * dt;
        s.x += Math.sin(s.heading) * -s.speed * dt;
        s.z += Math.cos(s.heading) * -s.speed * dt;
      }
      s.spin -= (s.speed / 0.6) * dt;
    },
  });
}

test('it drives exactly as the freighter it was made from did', () => {
  const f = createFreighter(GFX);
  const o = original();
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let keys = {};
  for (let i = 0; i < 3000; i++) {
    if (i % 40 === 0) keys = { up: rnd() < 0.6, down: rnd() < 0.2, left: rnd() < 0.4, right: rnd() < 0.3, space: rnd() < 0.1 };
    const dt = rnd() < 0.03 ? 0.2 : 1 / 60 + (rnd() - 0.5) * 0.006;
    o.tick(keys, dt);
    f.update(dt, { throttle: keys.up ? 1 : 0, brake: keys.down ? 1 : 0, steer: (keys.left ? 1 : 0) - (keys.right ? 1 : 0), handbrake: !!keys.space });
    // It faces +z where the original faced −z, so its x and z are the original's, turned half way round.
    near(f.group.position.x, -o.x, 1e-9, 'x');
    near(f.group.position.z, -o.z, 1e-9, 'z');
    near(f.heading, o.heading, 1e-12, 'heading');
    near(f.speed, o.speed, 1e-12, 'speed');
    near(f.steerAngle, o.steer, 1e-12, 'steer');
    near(f.wheels[7].rotation.x, o.spin, 1e-9, 'wheel roll');
  }
  assert.equal(FREIGHTER_DRIVE.wheelbase, 7.28);
});

test('it accelerates to 22 m/s, backs up to 6, and the handbrake and the coast bring it to rest', () => {
  const f = createFreighter(GFX);
  for (let i = 0; i < 60 * 10; i++) f.update(1 / 60, { throttle: 1 });
  near(f.speed, 22, 1e-9, 'top speed');
  near(f.kmh, 79.2, 1e-6, 'km/h');
  for (let i = 0; i < 60; i++) f.update(1 / 60, { throttle: 1, handbrake: false });
  assert.ok(f.group.position.z > 0 && Math.abs(f.group.position.x) < 1e-9, 'straight ahead along +z');
  for (let i = 0; i < 60 * 3; i++) f.update(1 / 60, { handbrake: true });
  assert.equal(f.speed, 0, 'the handbrake stops it');
  for (let i = 0; i < 60 * 10; i++) f.update(1 / 60, { brake: 1 });
  near(f.speed, -6, 1e-9, 'reverse speed');
  for (let i = 0; i < 60 * 10; i++) f.update(1 / 60, {});
  assert.equal(f.speed, 0, 'it coasts to a stop');
});

test('left is +x and positive heading; the lock is smaller at speed; the front wheels turn and every wheel rolls as far as it goes', () => {
  const f = createFreighter(GFX);
  for (let i = 0; i < 60; i++) f.update(1 / 60, { throttle: 1, steer: 1 });
  assert.ok(f.heading > 0, 'turned left');
  assert.ok(f.group.position.x > 0, 'and went left (it faces +z, so its left is +x)');
  assert.ok(f.steerAngle > 0 && f.steerAngle < FREIGHTER_DRIVE.steerLock, 'the lock has shrunk with speed');
  for (const w of f.steeredWheels) assert.equal(w.rotation.y, f.steerAngle);
  for (const w of f.wheels.filter((q) => !f.steeredWheels.includes(q))) assert.equal(w.rotation.y, 0);
  // Rolling: the distance covered is the roll times the radius, on every wheel.
  const g = createFreighter(GFX);
  let far = 0;
  for (let i = 0; i < 120; i++) { g.update(1 / 60, { throttle: 1 }); far += g.speed / 60; }
  for (const w of g.wheels) near(-w.rotation.x * FREIGHTER.tireRadius, far, 1e-9, `${w.name} rolls`);
  near(g.group.position.z, far, 1e-9, 'it went that far');
  // The other way.
  const h = createFreighter(GFX);
  for (let i = 0; i < 60; i++) h.update(1 / 60, { throttle: 1, steer: -1 });
  assert.ok(h.heading < 0 && h.group.position.x < 0, 'right');
});

test('scale changes how big it is in the game\'s units, not how it drives', () => {
  const a = createFreighter(GFX), b = createFreighter(GFX, { scale: 0.4 });
  for (let i = 0; i < 240; i++) {
    const input = { throttle: i < 150 ? 1 : 0, steer: i > 60 && i < 200 ? 1 : 0 };
    a.update(1 / 60, input); b.update(1 / 60, input);
  }
  near(a.heading, b.heading, 1e-12, 'the same turn');
  near(a.speed, b.speed, 1e-12, 'the same speed in metres a second');
  near(b.group.position.x, a.group.position.x * 0.4, 1e-9, 'x');
  near(b.group.position.z, a.group.position.z * 0.4, 1e-9, 'z');
});

test('reset stops it, straightens the wheels and puts it where it is told', () => {
  const f = createFreighter(GFX);
  for (let i = 0; i < 120; i++) f.update(1 / 60, { throttle: 1, steer: 1 });
  f.reset({ position: [3, 0, -4], heading: 1 });
  assert.equal(f.speed, 0);
  assert.equal(f.steerAngle, 0);
  assert.equal(f.heading, 1);
  assert.deepEqual(f.group.position.toArray(), [3, 0, -4]);
  assert.ok(f.wheels.every((w) => w.rotation.x === 0 && w.rotation.y === 0));
  f.reset();
  assert.deepEqual(f.group.position.toArray(), [0, 0, 0]);
  assert.equal(f.group.rotation.y, 0);
});

test('a hitch in the frame rate does not throw it, and nothing happens with no time', () => {
  const f = createFreighter(GFX);
  f.update(5, { throttle: 1 });
  near(f.speed, FREIGHTER_DRIVE.accel * FREIGHTER_DRIVE.maxStep, 1e-12, 'one step at most');
  f.update(-1, { throttle: 1 });
  near(f.speed, FREIGHTER_DRIVE.accel * FREIGHTER_DRIVE.maxStep, 1e-12, 'no time, no change');
});

test('it is a vehicle to drive, beside the sculpted traffic and not one of it', () => {
  assert.ok(!('freighter' in VEHICLES));
  assert.equal(FREIGHTER.unit, 'm');
});
