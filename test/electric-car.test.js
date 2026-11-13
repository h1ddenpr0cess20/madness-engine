import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { createElectricCar, ELECTRIC_CAR, ELECTRIC_CAR_DRIVE } from '../src/vehicles/electric-car.js';
import { createFreighter, FREIGHTER_DRIVE } from '../src/vehicles/freighter.js';
import * as vehicles from '../src/vehicles/index.js';

const near = (a, b, eps, what) => assert.ok(Math.abs(a - b) <= eps, `${what}: ${a} vs ${b}`);
const boxOf = (object) => { object.updateMatrixWorld(true); return new GFX.Box3().setFromObject(object); };

test('the electric car stands on the ground facing +z, with its origin at the back wheels', () => {
  const car = createElectricCar(GFX);
  const box = boxOf(car.group);
  near(box.min.y, 0, 1e-6, 'on the ground');
  near(box.max.y - box.min.y, ELECTRIC_CAR.height, 0.01, 'height');
  near(box.max.x - box.min.x, ELECTRIC_CAR.width, 0.01, 'width');
  near(box.max.z - box.min.z, ELECTRIC_CAR.length, 0.01, 'length');
  near((box.max.x + box.min.x) / 2, 0, 0.01, 'centered across');
  const at = new GFX.Vector3();
  assert.ok(car.parts.led_bar_centre.getWorldPosition(at).z > 3, 'the light bar is at the nose');
  assert.ok(car.parts.tail_bar.getWorldPosition(at).z < 0, 'the tail bar is behind the back wheels');
});

test('two axles: the front two wheels steer, the back two do not, and every wheel is on the ground', () => {
  const car = createElectricCar(GFX);
  assert.equal(car.wheels.length, 4);
  assert.equal(car.steeredWheels.length, 2);
  const at = new GFX.Vector3();
  for (const w of car.wheels) {
    w.getWorldPosition(at);
    near(at.y, ELECTRIC_CAR.tireRadius + 0.006 * (ELECTRIC_CAR.tireRadius / 0.6), 1e-6, `${w.name} on the ground`);
    near(Math.abs(at.x), 0.76, 1e-9, `${w.name} stands out to the side`);
    assert.ok(ELECTRIC_CAR.axles.some((z) => Math.abs(at.z - z) < 1e-9), `${w.name} is on an axle`);
  }
  for (const w of car.steeredWheels) assert.ok(w.getWorldPosition(at).z > 2);
});

test('the glass canopy shows on the sides: it is wider than the body above the beltline', () => {
  const car = createElectricCar(GFX);
  const glass = boxOf(car.parts.glass_canopy), body = boxOf(car.parts.body_shell);
  assert.ok(glass.max.y > body.max.y, 'the canopy rises above the body');
  assert.ok(glass.max.x - glass.min.x > 1.7 && body.max.y < 1.1, 'the body stops at the beltline, so the cabin is glass');
});

test('it drives through the shared model on its own numbers', () => {
  const car = createElectricCar(GFX);
  for (let i = 0; i < 60 * 15; i++) car.update(1 / 60, { throttle: 1 });
  near(car.speed, ELECTRIC_CAR_DRIVE.maxForward, 1e-9, 'top speed');
  near(car.kmh, 136.8, 1e-6, 'km/h');
  assert.ok(ELECTRIC_CAR_DRIVE.maxForward > FREIGHTER_DRIVE.maxForward && ELECTRIC_CAR_DRIVE.wheelbase < FREIGHTER_DRIVE.wheelbase);
  assert.equal(ELECTRIC_CAR_DRIVE.wheelbase, ELECTRIC_CAR.axles[0] - ELECTRIC_CAR.axles[1], 'it turns about its back wheels, the front ones a wheelbase ahead');
  for (let i = 0; i < 60 * 4; i++) car.update(1 / 60, { handbrake: true });
  assert.equal(car.speed, 0);
  for (let i = 0; i < 60 * 10; i++) car.update(1 / 60, { brake: 1 });
  near(car.speed, -ELECTRIC_CAR_DRIVE.maxReverse, 1e-9, 'reverse');
});

test('left is +x, the wheels steer and roll, and it turns tighter than the freighter', () => {
  const car = createElectricCar(GFX);
  for (let i = 0; i < 60; i++) car.update(1 / 60, { throttle: 1, steer: 1 });
  assert.ok(car.heading > 0 && car.group.position.x > 0, 'left');
  for (const w of car.steeredWheels) assert.equal(w.rotation.y, car.steerAngle);
  for (const w of car.wheels.filter((q) => !car.steeredWheels.includes(q))) assert.equal(w.rotation.y, 0);
  const g = createElectricCar(GFX);
  let far = 0;
  for (let i = 0; i < 120; i++) { g.update(1 / 60, { throttle: 1 }); far += g.speed / 60; }
  for (const w of g.wheels) near(-w.rotation.x * ELECTRIC_CAR.tireRadius, far, 1e-9, `${w.name} rolls`);
  // A turning circle: at the lock it is a wheelbase over tan(lock).
  const radius = (create, drive) => {
    const v = create(GFX);
    v.update(0.05, { throttle: 1 }); // a crawl
    for (let i = 0; i < 90; i++) v.update(1 / 60, { throttle: 0, steer: 1 });
    const speed = Math.abs(v.speed) || 1e-9;
    return { r: drive.wheelbase / Math.tan(v.steerAngle), speed };
  };
  assert.ok(radius(createElectricCar, ELECTRIC_CAR_DRIVE).r < radius(createFreighter, FREIGHTER_DRIVE).r / 2);
});

test('scale, paint and reset work as they do on the freighter', () => {
  const a = createElectricCar(GFX), b = createElectricCar(GFX, { scale: 0.41, paint: '#2c5fc8' });
  for (let i = 0; i < 200; i++) { const input = { throttle: 1, steer: i > 50 ? 1 : 0 }; a.update(1 / 60, input); b.update(1 / 60, input); }
  near(a.heading, b.heading, 1e-12, 'the same turn');
  near(b.group.position.x, a.group.position.x * 0.41, 1e-9, 'x');
  near(b.group.position.z, a.group.position.z * 0.41, 1e-9, 'z');
  near(b.materials.white.color.b, new GFX.Color('#2c5fc8').b, 1e-6, 'painted');
  b.reset({ position: [1, 0, 2], heading: 0.5 });
  assert.equal(b.speed, 0);
  assert.deepEqual(b.group.position.toArray(), [1, 0, 2]);
  assert.equal(b.heading, 0.5);
});

test('the vehicles index has the freighter and the car', () => {
  assert.equal(typeof vehicles.createFreighter, 'function');
  assert.equal(typeof vehicles.createElectricCar, 'function');
});
