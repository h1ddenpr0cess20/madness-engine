import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createGlassGlobe, surfacePoint } from '../src/props/glassglobe.js';
import { isLand, landMask, landRings } from '../src/textures/earth/map.js';

test('the land is real coordinates: places are on it, and the seas are not', () => {
  const land = {
    kansas: [38.5, -98], cairo: [30, 31], london: [51.5, -0.1], sahara: [23, 12], australia: [-25, 134],
    antarctica: [-80, 0], greenland: [72, -40], tokyo: [35.7, 139.7], amazon: [-5, -60], moscow: [55.75, 37.6],
  };
  const sea = {
    pacific: [0, -150], atlantic: [30, -40], indian: [-20, 80], northSea: [56, 3], caspian: [41, 51],
    michigan: [43.5, -87], superior: [48, -88], victoria: [-1, 33], arctic: [85, 0],
  };
  for (const [name, [lat, lon]] of Object.entries(land)) assert.ok(isLand(lat, lon), `${name} is land`);
  for (const [name, [lat, lon]] of Object.entries(sea)) assert.ok(!isLand(lat, lon), `${name} is not`);
});

test('the mask agrees with the outlines, row for row', () => {
  const W = 720, H = 360;
  const mask = landMask(W, H);
  let wrong = 0, total = 0;
  for (let row = 2; row < H; row += 7) for (let col = 1; col < W; col += 5) {
    const lon = (col + 0.5) / W * 360 - 180, lat = 90 - (row + 0.5) / H * 180;
    total++;
    if ((mask[row * W + col] > 0) !== isLand(lat, lon)) wrong++;
  }
  // Only pixels a coast passes through may differ.
  assert.ok(wrong / total < 0.004, `${wrong} of ${total} differ`);
  const land = mask.reduce((n, v) => n + (v ? 1 : 0), 0) / mask.length;
  assert.ok(land > 0.28 && land < 0.38, `${land} of the map is land`);
});

test('the outlines come out as degrees in range', () => {
  const rings = landRings();
  assert.ok(rings.length > 1000);
  for (const ring of rings) for (let i = 0; i < ring.length; i += 2) {
    assert.ok(ring[i] >= -180 && ring[i] <= 180 && ring[i + 1] >= -90 && ring[i + 1] <= 90);
  }
});

test('orient brings a place to the front of the globe, north up', () => {
  const globe = createGlassGlobe(GFX, { radius: 1 });
  for (const [lat, lon] of [[40, -95], [0, 0], [-33.9, 18.4], [51.5, -0.1], [35.7, 139.7]]) {
    globe.orient(lat, lon);
    globe.group.updateMatrixWorld(true);
    const [x, y, z] = surfacePoint(lat, lon, 1);
    const p = globe.spin.localToWorld(new GFX.Vector3(x, y, z));
    assert.ok(Math.abs(p.x) < 1e-6 && Math.abs(p.y) < 1e-6 && Math.abs(p.z - 1) < 1e-6, `${lat}, ${lon} at ${p.toArray()}`);
    // The north pole is on the upper half of the screen.
    const [nx, ny, nz] = surfacePoint(90, 0, 1);
    const n = globe.spin.localToWorld(new GFX.Vector3(nx, ny, nz));
    assert.ok(n.y > 0 && Math.abs(n.x) < 1e-6, `north at ${n.toArray()}`);
  }
});

test('east is to the right, as on any globe seen from outside', () => {
  const globe = createGlassGlobe(GFX, { radius: 1 });
  globe.orient(0, 20);
  globe.group.updateMatrixWorld(true);
  const [x, y, z] = surfacePoint(0, 30, 1);
  assert.ok(globe.spin.localToWorld(new GFX.Vector3(x, y, z)).x > 0.1);
});

test('the globe is clear glass with an etching on each side of it, and the mist and field are optional', () => {
  const globe = createGlassGlobe(GFX, { radius: 1 });
  assert.equal(globe.glass.material.transmission, 1);
  assert.equal(globe.mist.visible, false);
  assert.equal(globe.field, null);
  globe.setMist({ hue: 0.6 });
  assert.equal(globe.mist.visible, true);
  globe.update(0.1);
  assert.equal(globe.mistMaterial.uniforms.uHue.value, 0.6);
  assert.ok(globe.mistMaterial.uniforms.uFlow.value > 0);
});
