import assert from 'node:assert/strict';
import { test } from 'node:test';

import { colorAt, cloudAt, GRS, JUPITER_STOPS, RADIUS_KM, SIZE_VS_EARTH } from '../src/textures/jupiter/map.js';

test('Jupiter is 11.2 of the Earth across', () => {
  assert.equal(RADIUS_KM, 69911);
  assert.ok(Math.abs(SIZE_VS_EARTH - 10.97) < 0.01);
});

test('the scale runs from the darkest belt to the white of the zones', () => {
  assert.deepEqual(colorAt(0), [84, 46, 26]);
  assert.deepEqual(colorAt(1), [255, 255, 250]);
  assert.deepEqual(colorAt(-5), colorAt(0), 'held at the ends');
  assert.deepEqual(colorAt(0.2), JUPITER_STOPS[1][1]);
});

test('the Great Red Spot is the reddest thing on the planet', () => {
  const [r, g, b] = colorAt(cloudAt(GRS.lat, GRS.lon));
  assert.ok(r - b > 90, 'red well above blue');
  assert.ok(r > g && g > b, 'red over orange over blue');
  assert.ok(cloudAt(GRS.lat, GRS.lon) < cloudAt(GRS.lat, GRS.lon + 90), 'darker at the spot than away from it');
});

test('the belts and zones alternate across the planet', () => {
  const values = Array.from({ length: 161 }, (_, i) => cloudAt(i - 80, 45));
  assert.ok(Math.min(...values) < 0.2, 'a dark belt');
  assert.ok(Math.max(...values) > 0.8, 'a white zone');
});

test('the deck is 0 to 1 everywhere, including the poles', () => {
  for (const lat of [-90, -45, 0, 45, 90]) {
    for (const lon of [-180, -90, 0, 90, 179.9]) {
      const v = cloudAt(lat, lon, 0.37);
      assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, `${lat}, ${lon}: ${v}`);
    }
  }
});

test('longitude wraps at the date line, and the eddies drift with time', () => {
  assert.ok(Math.abs(cloudAt(10, 179.9) - cloudAt(10, -180.1)) < 1e-9);
  assert.notEqual(cloudAt(20, 30, 0), cloudAt(20, 30, 0.25));
  assert.equal(cloudAt(20, 30, 0), cloudAt(20, 30, 0));
});
