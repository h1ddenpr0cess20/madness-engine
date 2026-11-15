import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { createElectricBus, ELECTRIC_BUS, ELECTRIC_BUS_DRIVE } from '../src/vehicles/electric-bus.js';
import { FREIGHTER, FREIGHTER_DRIVE } from '../src/vehicles/freighter.js';
import * as vehicles from '../src/vehicles/index.js';

const near = (a, b, eps, what) => assert.ok(Math.abs(a - b) <= eps, what + ': ' + a + ' vs ' + b);
const boxOf = (object) => { object.updateMatrixWorld(true); return new GFX.Box3().setFromObject(object); };

test('the electric bus keeps the freighter proportions and wheel layout', () => {
  const bus = createElectricBus(GFX);
  const bounds = boxOf(bus.group);
  near(bounds.min.y, 0, 1e-6, 'tires touch the ground');
  near(bounds.max.y - bounds.min.y, ELECTRIC_BUS.height, 0.01, 'overall height');
  near(bounds.max.x - bounds.min.x, ELECTRIC_BUS.width, 0.02, 'overall width');
  near(bounds.max.z - bounds.min.z, ELECTRIC_BUS.length, 0.15, 'overall length');
  assert.equal(bus.wheels.length, 12);
  assert.equal(bus.steeredWheels.length, 4);
  assert.equal(ELECTRIC_BUS.tireRadius, FREIGHTER.tireRadius);
  assert.equal(ELECTRIC_BUS.tireWidth, FREIGHTER.tireWidth);
});

test('the cargo box is replaced by coach glazing and a passenger rear window', () => {
  const bus = createElectricBus(GFX);
  for (const name of ['coach_body', 'front_windshield', 'passenger_windows_l', 'passenger_windows_r',
    'window_pillar_l_0', 'window_pillar_r_0', 'rear_window', 'front_valance', 'bolt_badge',
    'leaf_badge_left', 'leaf_badge_right']) assert.ok(bus.parts[name], name);
  assert.equal('cargo_body' in bus.parts, false);
  assert.equal('rear_doors' in bus.parts, false);
  const at = new GFX.Vector3();
  bus.parts.front_windshield.getWorldPosition(at);
  const front = at.z;
  bus.parts.rear_window.getWorldPosition(at);
  assert.ok(front > at.z, 'windshield is ahead of rear window');
});

test('paint, accents and lights retain the electric freighter palette', () => {
  const bus = createElectricBus(GFX);
  const palette = {
    white: new GFX.Color(0xf4f5f6), green: new GFX.Color(0x36a05a),
    cyan: new GFX.Color(0x86ecff), trim: new GFX.Color(0x22262a),
  };
  near(bus.materials.white.color.r, palette.white.r, 1e-6, 'white body');
  near(bus.materials.green.color.g, palette.green.g, 1e-6, 'green accent');
  near(bus.materials.led.emissive.g, palette.cyan.g, 1e-6, 'cyan LED');
  near(bus.materials.trim.color.r, palette.trim.r, 1e-6, 'charcoal trim');
  assert.equal(ELECTRIC_BUS_DRIVE, FREIGHTER_DRIVE);
});

test('the bus drives and retains scale, customization and reset behavior', () => {
  const bus = createElectricBus(GFX, { scale: 0.41, paint: '#c8382c', accent: 0x123456, light: 0xabcdef, wheels: 'classic' });
  for (let i = 0; i < 120; i++) bus.update(1 / 60, { throttle: 1, steer: i > 50 ? 1 : 0 });
  assert.ok(bus.speed > 0);
  assert.ok(bus.heading > 0 && bus.group.position.x > 0);
  for (const wheel of bus.steeredWheels) assert.equal(wheel.rotation.y, bus.steerAngle);
  near(bus.materials.white.color.r, new GFX.Color('#c8382c').r, 1e-6, 'custom paint');
  bus.reset({ position: [2, 0, -3], heading: 0.5 });
  assert.deepEqual(bus.group.position.toArray(), [2, 0, -3]);
  assert.equal(bus.speed, 0);
  assert.equal(bus.heading, 0.5);
});

test('the vehicles package exports the electric bus', () => {
  assert.equal(typeof vehicles.createElectricBus, 'function');
});
