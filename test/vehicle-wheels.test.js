import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { wheelKit } from '../src/vehicles/parts.js';
import { createElectricCar } from '../src/vehicles/electric-car.js';
import { createFreighter, FREIGHTER } from '../src/vehicles/freighter.js';

const M = { tire: new GFX.MeshStandardMaterial(), rim: new GFX.MeshStandardMaterial(), trim: new GFX.MeshStandardMaterial() };
const trianglesOf = (mesh) => mesh.geometry.attributes.position.count / 3;
const boxOf = (o) => { o.updateMatrixWorld(true); return new GFX.Box3().setFromObject(o); };

test('the alloy wheel is three meshes: a tire, a rim and the dark face behind the spokes', () => {
  const kit = wheelKit(GFX, M, { radius: 0.6, width: 0.345 });
  const w = kit.make('x', 1);
  assert.deepEqual(w.children.map((c) => c.name), ['tire_x', 'rim_x', 'hardware_x']);
  assert.equal(kit.style, 'alloy');
  assert.throws(() => wheelKit(GFX, M, { radius: 0.6, width: 0.345, style: 'square' }), /unknown wheel style/);
});

test('the tire is round-shouldered and treaded, not a bald cylinder with square edges', () => {
  const { make, tread } = wheelKit(GFX, M, { radius: 0.6, width: 0.345 });
  const tire = make('x', 1).children[0];
  // Hundreds of tread blocks and a lathed profile: a plain cylinder is a few dozen triangles.
  assert.ok(trianglesOf(tire) > 3000, `${trianglesOf(tire)} triangles`);
  // It stays inside the wheel's size, so it still stands on the ground and fits its arch.
  const box = boxOf(tire);
  assert.ok(box.max.y <= 0.6 + tread + 1e-6 && box.max.z <= 0.6 + tread + 1e-6, 'no taller than its tread');
  assert.ok(box.max.x - box.min.x <= 0.345 + 1e-6, 'no wider than the wheel');
  // The shoulder is rounded: at the very edge of the tire's width the radius has fallen away from the tread's.
  const p = tire.geometry.attributes.position;
  let edgeRadius = 0;
  for (let i = 0; i < p.count; i++) if (Math.abs(Math.abs(p.getX(i)) - 0.345 / 2) < 0.01) edgeRadius = Math.max(edgeRadius, Math.hypot(p.getY(i), p.getZ(i)));
  assert.ok(edgeRadius < 0.6 * 0.9, `the edge of the sidewall reaches ${edgeRadius.toFixed(3)} of 0.6 m`);
  // The tread is cut: grooves and blocks make a ragged outline, so the radius varies round the tire.
  const radii = new Set();
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i)) < 0.1) radii.add(Math.hypot(p.getY(i), p.getZ(i)).toFixed(3));
  assert.ok(radii.size > 3, 'the tread has depth');
});

test('the rim has spokes over a dark recessed face, and the face of the left and the right wheel point outward', () => {
  const kit = wheelKit(GFX, M, { radius: 0.34, width: 0.235 });
  const right = kit.make('r', 1), left = kit.make('l', -1);
  const rim = (w) => w.children[1].geometry.attributes.position;
  const xs = (p) => { let hi = -Infinity, lo = Infinity; for (let i = 0; i < p.count; i++) { hi = Math.max(hi, p.getX(i)); lo = Math.min(lo, p.getX(i)); } return [lo, hi]; };
  const [rlo, rhi] = xs(rim(right)), [llo, lhi] = xs(rim(left));
  assert.ok(rhi > 0.1 && rlo > -0.12 && rlo < -0.05, 'the right wheel\'s lip is on +x');
  assert.ok(llo < -0.1 && lhi < 0.12 && lhi > 0.05, 'the left wheel\'s lip is on −x');
  assert.ok(trianglesOf(right.children[1]) > 400, 'ten spokes, a lip, a hub and nuts');
});

test('both vehicles take the alloy wheel by default and the classic one on request', () => {
  const car = createElectricCar(GFX), classic = createElectricCar(GFX, { wheels: 'classic' });
  assert.equal(car.wheels[0].children.length, 3);
  assert.equal(classic.wheels[0].children.length, 13);
  const truck = createFreighter(GFX);
  assert.equal(truck.wheels.length, 12);
  assert.ok(truck.wheels.every((w) => w.children.length === 3));
  // Either way it stands on the ground and is the same size.
  for (const v of [car, classic, truck, createFreighter(GFX, { wheels: 'classic' })]) {
    assert.ok(Math.abs(boxOf(v.group).min.y) < 1e-6, 'tires touch');
  }
  const a = boxOf(truck.group), b = boxOf(createFreighter(GFX, { wheels: 'classic' }).group);
  assert.ok(Math.abs(a.max.z - b.max.z) < 1e-6 && Math.abs(a.min.z - b.min.z) < 0.02 && Math.abs(a.max.x - b.max.x) < 1e-6);
  assert.equal(FREIGHTER.tireRadius, 0.6);
});
