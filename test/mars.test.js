import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CAPS, FEATURES, RADIUS_KM, SIZE_VS_EARTH, VALLES_MARINERIS } from '../src/textures/mars/map.js';

test('Mars is 0.532 of the Earth across, and its features are on the map', () => {
  assert.equal(RADIUS_KM, 3389.5);
  assert.ok(Math.abs(SIZE_VS_EARTH - 0.532) < 0.001);
  for (const [name, lat, lon, r] of FEATURES) {
    assert.ok(Math.abs(lat) < 90 && lon >= -180 && lon <= 180 && r > 0 && r < 30, name);
  }
  for (const [lat, lon] of VALLES_MARINERIS) assert.ok(Math.abs(lat) < 20 && lon > -100 && lon < -40, 'the canyon is near the equator, west of Chryse');
  assert.ok(CAPS.north > 60 && CAPS.south < -60);
  const olympus = FEATURES.find((f) => f[0] === 'Olympus Mons');
  assert.deepEqual(olympus.slice(1, 3), [18.65, -133.8]);
});
