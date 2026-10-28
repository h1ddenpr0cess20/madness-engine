import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { bakeData } from '../src/models/legacy-bake.js';
import { mountWheels, VEHICLES, wheel, truckwheel } from '../src/scenery/vehicles.js';
import { VEHICLES as METRLOL } from '../src/scenery/vehicles.metrlol.js';

const WHEELS = { wheel, truckwheel };
const bounds = (p) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i++) { lo[i % 3] = Math.min(lo[i % 3], p[i]); hi[i % 3] = Math.max(hi[i % 3], p[i]); }
  return { lo, hi };
};

test('every vehicle stands on its wheels, and its body is the same without them', () => {
  for (const def of Object.values(VEHICLES)) {
    assert.ok(WHEELS[def.wheel], `${def.name} rolls on a wheel there is`);
    assert.ok(def.wheels.length >= 4, def.name);
    assert.ok(def.wheels.some((w) => w.steer) && def.wheels.some((w) => !w.steer), `${def.name}: the front steers, the back doesn't`);
    for (const w of def.wheels) {
      assert.equal(w.at[1], w.r, `${def.name}: a wheel on the ground`);
      assert.equal(Math.sign(w.at[0]), w.side, `${def.name}: a wheel faces out`);
    }
    const whole = bounds(bakeData({ ...def, coarse: 2.2 }).position), body = bounds(bakeData({ ...def.body, coarse: 2.2 }).position);
    assert.ok(whole.lo[1] < 0.01, `${def.name} touches the ground`);
    assert.ok(body.lo[1] > 0.05, `${def.name}-body has no wheels to touch it with`);
    assert.ok(Math.abs(whole.hi[1] - body.hi[1]) < 0.02 && Math.abs(whole.hi[2] - body.hi[2]) < 0.02, `${def.name}-body is the same car`);
  }
  assert.deepEqual(Object.keys(METRLOL), ['sedan', 'hatchback', 'pickup', 'junker', 'boxtruck']);
});

test('mounted wheels roll as far as the car goes and the front ones steer into a turn', () => {
  const { sedan, tanker } = VEHICLES;
  const mesh = { geometry: new GFX.BufferGeometry(), material: new GFX.MeshBasicMaterial() };
  const wheels = mountWheels(GFX, sedan, mesh);
  assert.equal(wheels.group.children.length, 4);
  const spin = (i) => wheels.group.children[i].children[0].children[0].rotation.x;
  wheels.drive(Math.PI * 2 * sedan.wheels[0].r, 0);
  // Once round: the right wheels one way about their own axis, the left the other, so both roll forward.
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(Math.abs(spin(i)) - Math.PI * 2) < 1e-9);
  assert.equal(Math.sign(spin(0)), -Math.sign(spin(1)));
  for (let i = 0; i < 40; i++) wheels.drive(0.05, 0.02);
  const front = wheels.group.children.filter((_, i) => sedan.wheels[i].steer), back = wheels.group.children.filter((_, i) => !sedan.wheels[i].steer);
  for (const h of front) assert.ok(h.rotation.y > 0.2 && h.rotation.y < 0.6, 'turned to the left');
  for (const h of back) assert.equal(h.rotation.y, 0);
  assert.equal(mountWheels(GFX, tanker, mesh).group.children.length, 10, 'a tanker: two at the front, doubled on both axles behind');
});
