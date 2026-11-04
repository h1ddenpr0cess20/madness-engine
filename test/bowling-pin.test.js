import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { BOWLING_PIN_DESIGNS, BOWLING_PIN_HEIGHT, BOWLING_PIN_RADIUS, BOWLING_PIN_PROFILE, createBowlingPin } from '../src/props/bowling-pin.js';

test('builds a dense continuous resin shell with vertex-painted surface detail', () => {
  const pin = createBowlingPin(GFX);
  assert.equal(pin.group.name, 'bowling_pin');
  assert.equal(pin.shell.geometry.getAttribute('position').count, 513 * 769 + 1);
  assert.equal(pin.shell.geometry.getAttribute('color').count, pin.shell.geometry.getAttribute('position').count);
  assert.ok(pin.shell.geometry.getIndex().count > 1_000_000);
  assert.equal(pin.shell.material.vertexColors, true);
  assert.equal(pin.shell.material.clearcoat, 0.98);
  assert.equal(pin.shell.material.roughness, 0.17);
  assert.equal(BOWLING_PIN_HEIGHT, 1.2);
  assert.equal(BOWLING_PIN_RADIUS, 0.19);
  pin.dispose();
});

test('supports runtime palette and design changes without replacing geometry', () => {
  const pin = createBowlingPin(GFX);
  const geometry = pin.shell.geometry;
  const colors = geometry.getAttribute('color');
  const initial = colors.array.slice();
  pin.setColors({ base: '#182b50', swirl: '#d93b7b', accent: '#f3bc66', stripe: '#22aa88' });
  assert.equal(pin.shell.geometry, geometry);
  assert.notDeepEqual(colors.array, initial);
  assert.equal(pin.colors.base.getHexString(), '182b50');
  assert.equal(pin.colors.stripe.getHexString(), '22aa88');
  const before = colors.array.slice();
  for (const design of BOWLING_PIN_DESIGNS) pin.setDesign(design);
  assert.equal(pin.design, 'swirl');
  assert.notDeepEqual(colors.array, before);
  assert.throws(() => pin.setDesign('polka-dot'), /unknown design/);
  pin.dispose();
});

test('accepts lower mesh resolutions and custom physical dimensions', () => {
  const pin = createBowlingPin(GFX, { widthSegments: 128, heightSegments: 192, height: 1.5, radius: 0.24, roughness: 0.3 });
  assert.equal(pin.shell.geometry.getAttribute('position').count, 129 * 193 + 1);
  assert.equal(pin.shell.material.roughness, 0.3);
  pin.dispose();
});

test('rejects invalid dimensions and unknown designs', () => {
  assert.throws(() => createBowlingPin(GFX, { height: 0 }), /height must be a finite positive number/);
  assert.throws(() => createBowlingPin(GFX, { radius: Infinity }), /radius must be a finite positive number/);
  assert.throws(() => createBowlingPin(GFX, { design: 'invalid' }), /unknown design/);
});

test('uses regulation ten-pin dimensional stations for the silhouette', () => {
  const station = (height) => BOWLING_PIN_PROFILE.find(([h]) => h === height)?.[1];
  assert.equal(BOWLING_PIN_PROFILE[0][0], 0);
  assert.equal(station(4.5), 2.383);
  assert.equal(station(7.25), 1.8515);
  assert.equal(station(10), 0.8985);
  assert.equal(station(13.5), 1.2735);
  assert.equal(BOWLING_PIN_PROFILE.at(-1)[0], 15);
  assert.equal(BOWLING_PIN_PROFILE.at(-1)[1], 0);

  const pin = createBowlingPin(GFX);
  const position = pin.shell.geometry.getAttribute('position');
  let minY = Infinity, maxY = -Infinity, maxRadius = 0;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    maxRadius = Math.max(maxRadius, Math.hypot(x, z));
  }
  assert.ok(Math.abs(minY) < 1e-7);
  assert.ok(Math.abs(maxY - BOWLING_PIN_HEIGHT) < 1e-6);
  assert.ok(Math.abs(maxRadius - BOWLING_PIN_RADIUS) < 1e-5);
  pin.dispose();
});
