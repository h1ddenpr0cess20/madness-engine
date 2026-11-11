import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { FINISHES, createTrackLight } from '../src/props/track-light.js';

/** Where can `can`'s lens points, in the track's coordinates. */
const lensDirection = (can) => new GFX.Vector3(0, -1, 0).applyQuaternion(can.quaternion);

test('a track has a rail, the cans asked for, and one light unless told not to', () => {
  const track = createTrackLight(GFX, { cans: 3, length: 3 });
  assert.equal(track.cans.length, 3);
  assert.ok(track.rail.isMesh);
  assert.ok(track.light?.isPointLight);
  assert.equal(createTrackLight(GFX, { light: false }).light, null);
  for (const finish of Object.keys(FINISHES)) createTrackLight(GFX, { finish });
});

test('the cans are spread evenly along the rail and hang below it', () => {
  const { cans } = createTrackLight(GFX, { cans: 3, length: 3, drop: 0.2 });
  const xs = cans.map((c) => c.position.x);
  assert.ok(Math.abs((xs[1] - xs[0]) - (xs[2] - xs[1])) < 1e-9);
  assert.ok(Math.abs(xs[1]) < 1e-9);
  for (const can of cans) assert.ok(Math.abs(can.position.y + 0.2) < 1e-9);
});

test('aim turns every can to face the point, and aimAt does it from the world once the track is placed', () => {
  const track = createTrackLight(GFX, { cans: 2, length: 2 });
  const target = [0.5, -2, 1.5];
  track.aim(target);
  for (const can of track.cans) {
    const want = new GFX.Vector3(target[0] - can.position.x, target[1] - can.position.y, target[2] - can.position.z).normalize();
    assert.ok(lensDirection(can).dot(want) > 0.9999);
  }
  track.group.position.set(2, 4, -1);
  track.group.rotation.y = Math.PI / 2;
  const world = new GFX.Vector3(0, 1, 0);
  track.aimAt(world);
  track.group.updateMatrixWorld(true);
  for (const can of track.cans) {
    const from = can.getWorldPosition(new GFX.Vector3());
    const dir = new GFX.Vector3(0, -1, 0).applyQuaternion(can.getWorldQuaternion(new GFX.Quaternion()));
    assert.ok(dir.dot(world.clone().sub(from).normalize()) > 0.9999);
  }
});

test('what is asked is checked', () => {
  assert.throws(() => createTrackLight(GFX, { finish: 'gold' }), /unknown finish/);
  assert.throws(() => createTrackLight(GFX, { cans: 0 }), /cans/);
  assert.throws(() => createTrackLight(GFX, { length: 0 }), /positive/);
  assert.throws(() => createTrackLight(GFX).aimCan(5, [0, 0, 0]), /no can/);
});
