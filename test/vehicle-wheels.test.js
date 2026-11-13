import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as GFX from '../src/gfx/index.js';
import { wheelKit } from '../src/vehicles/parts.js';
import { createElectricCar } from '../src/vehicles/electric-car.js';
import { createFreighter, FREIGHTER } from '../src/vehicles/freighter.js';

const M = { tire: new GFX.MeshStandardMaterial(), rim: new GFX.MeshStandardMaterial(), trim: new GFX.MeshStandardMaterial() };
const trianglesOf = (mesh) => mesh.geometry.attributes.position.count / 3;
const boxOf = (o) => { o.updateMatrixWorld(true); return new GFX.Box3().setFromObject(o); };
const close = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-5, `${what}: ${a} vs ${b}`);

test('the treaded wheel is three meshes: the tire, the rim and the lug holes', () => {
  const kit = wheelKit(GFX, M, { radius: 0.6, width: 0.345 });
  const w = kit.make('x', 1);
  assert.deepEqual(w.children.map((c) => c.name), ['tire_x', 'rim_x', 'lugs_x']);
  assert.equal(kit.style, 'treaded');
  assert.throws(() => wheelKit(GFX, M, { radius: 0.6, width: 0.345, style: 'square' }), /unknown wheel style/);
});

test('the tire is round-shouldered and treaded, not a bald cylinder with square edges', () => {
  const { make, tread } = wheelKit(GFX, M, { radius: 0.6, width: 0.345 });
  const tire = make('x', 1).children[0];
  // Hundreds of tread blocks and a lathed profile: a plain cylinder is a few dozen triangles.
  assert.ok(trianglesOf(tire) > 2000, `${trianglesOf(tire)} triangles`);
  // It stays inside the wheel's size, so it still stands on the ground and fits its arch and its neighbor.
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

test('the rim is the one the freighter was drawn with: the same disc, hub cap and lug holes as the classic wheel', () => {
  for (const [radius, width] of [[0.6, 0.345], [0.34, 0.235]]) {
    for (const face of [1, -1]) {
      const a = wheelKit(GFX, M, { radius, width }).make('a', face);
      const b = wheelKit(GFX, M, { radius, width, style: 'classic' }).make('b', face);
      // The classic wheel's rim is its barrel, face and hub cap; its lug holes the eight lugs.
      const union = (meshes) => meshes.reduce((box, m) => box.union(boxOf(m)), new GFX.Box3());
      const classicRim = b.children.filter((c) => /^(barrel|alloy_face|hub_cap)_/.test(c.name));
      const classicLugs = b.children.filter((c) => c.name.startsWith('lug_'));
      assert.equal(classicLugs.length, 8);
      const [rim, lugs] = [boxOf(a.children[1]), boxOf(a.children[2])];
      const [wantRim, wantLugs] = [union(classicRim), union(classicLugs)];
      for (const axis of ['x', 'y', 'z']) {
        close(rim.min[axis], wantRim.min[axis], `rim min ${axis}`); close(rim.max[axis], wantRim.max[axis], `rim max ${axis}`);
        close(lugs.min[axis], wantLugs.min[axis], `lugs min ${axis}`); close(lugs.max[axis], wantLugs.max[axis], `lugs max ${axis}`);
      }
      // The face is on the side it is told: +x for the right wheel, −x for the left.
      assert.ok(face > 0 ? rim.max.x > rim.min.x + 0.1 * width && rim.max.x > width / 2 - 0.03 * (radius / 0.6) : rim.min.x < -width / 2 + 0.03 * (radius / 0.6));
    }
  }
  // Eight lug holes and a plain disc: not spokes. (The rim has a few hundred triangles at most.)
  const w = wheelKit(GFX, M, { radius: 0.6, width: 0.345 }).make('x', 1);
  assert.ok(trianglesOf(w.children[1]) < 400 && trianglesOf(w.children[2]) === 8 * 14 * 4);
});

test('both vehicles take the treaded tire by default and the classic one on request', () => {
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
