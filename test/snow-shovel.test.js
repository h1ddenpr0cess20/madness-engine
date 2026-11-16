import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { METALS } from '../src/props/metalglobe.js';
import * as Props from '../src/props/index.js';
import { createRobot } from '../src/people/robot.js';
import { HANDS, RANGE } from '../src/weapons/categories.js';
import {
  SNOW_SHOVEL_DIMENSIONS, SNOW_SHOVEL_SPEC, assetViewer, createSnowShovel,
} from '../src/props/snow-shovel.js';

const boxOf = (object) => { object.updateMatrixWorld(true); return new GFX.Box3().setFromObject(object); };

test('a snow shovel is built at real size, standing on the butt of its D-handle with the scoop at the far end', () => {
  const shovel = createSnowShovel(GFX);
  assert.equal(SNOW_SHOVEL_DIMENSIONS.unit, 'm');
  assert.equal(shovel.dimensions.unit, 'm');
  assert.equal(SNOW_SHOVEL_SPEC.hands, HANDS.TWO);
  const box = boxOf(shovel.group);
  assert.ok(Math.abs(box.min.y) < 0.002, 'the butt of the D-handle is at the origin');
  assert.ok(shovel.dimensions.overallLength > 1.4 && shovel.dimensions.overallLength < 1.65, `a shovel's length: ${shovel.dimensions.overallLength}`);
  assert.ok(Math.abs(box.max.y - shovel.dimensions.overallLength) < 0.02, 'the scoop is what stands highest');
  const scoop = boxOf(shovel.scoop);
  assert.ok(Math.abs(scoop.max.x - scoop.min.x - SNOW_SHOVEL_DIMENSIONS.bladeWidth) < 0.012, 'the scoop is 460 mm across');
  assert.ok(scoop.min.y > 1.0, 'and stands at the far end of the shaft');
  const handle = boxOf(shovel.crossbar);
  assert.ok(handle.max.x - handle.min.x >= 0.16, 'the crossbar of the D-handle is a hand and a half wide');
});

test('the scoop is hollow: a floor with rolled walls that run out towards the lip, and a lip bent forward', () => {
  const shovel = createSnowShovel(GFX);
  const floor = shovel.scoopAt(0.5, 0), back = shovel.scoopAt(0.02, 0), lip = shovel.scoopAt(1, 0);
  assert.ok(floor.normal[2] > 0.5, 'the hollow faces +z');
  assert.ok(lip.point[2] > back.point[2] + 0.04, 'the lip is bent forward of the plate at the socket');
  // The wall at each side, at the back and at the front.
  const wallBack = shovel.scoopAt(0.02, 1), wallFront = shovel.scoopAt(0.98, 1);
  const rise = (w, c) => Math.hypot(w.point[1] - c.point[1], w.point[2] - c.point[2]);
  assert.ok(rise(wallBack, shovel.scoopAt(0.02, 0)) > rise(wallFront, shovel.scoopAt(0.98, 0)) + 0.03, 'the walls are taller at the back than at the lip');
  const wall = shovel.scoopAt(0.3, 1);
  assert.ok(wall.normal[0] < -0.8, 'a wall faces in across the hollow');
});

test('every face of the pressed sheet is wound the way its normal faces, so none is culled', () => {
  const shovel = createSnowShovel(GFX);
  for (const mesh of [shovel.wear, shovel.fittings, shovel.wrap]) {
    const g = mesh.geometry, p = g.attributes.position, n = g.attributes.normal, idx = g.index;
    let wrong = 0, total = 0;
    for (let t = 0; t < idx.count; t += 3) {
      const ids = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
      const [a, b, c] = ids.map((i) => [p.getX(i), p.getY(i), p.getZ(i)]);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const gn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (Math.hypot(...gn) < 1e-12) continue;
      const vn = ids.reduce((s, i) => [s[0] + n.getX(i), s[1] + n.getY(i), s[2] + n.getZ(i)], [0, 0, 0]);
      total++;
      if (gn[0] * vn[0] + gn[1] * vn[1] + gn[2] * vn[2] < 0) wrong++;
    }
    assert.ok(total > 100 && wrong / total < 0.005, `${mesh.name}: ${wrong} of ${total} faces wound against their normals`);
  }
});

test('it is a two-handed tool: the lead hand takes the leather on the shaft, the rear hand the D-handle', () => {
  const shovel = createSnowShovel(GFX);
  assert.equal(shovel.handling.hands, HANDS.TWO);
  assert.equal(shovel.handling.range, RANGE.LONG);
  const grip = shovel.gripBounds;
  assert.ok(grip.top - grip.bottom >= 0.25, 'room on the sleeve for a hand');
  assert.equal(shovel.handle.parent, shovel.tool);
  assert.equal(shovel.handle.material, shovel.leatherMaterial);
  const sleeve = boxOf(shovel.handle);
  assert.ok(Math.abs(sleeve.min.y - grip.bottom) < 1e-3 && Math.abs(sleeve.max.y - grip.top) < 1e-3);
  // The second hand closes across the crossbar, on its middle, along x.
  const bar = boxOf(shovel.crossbar), mid = (bar.min.y + bar.max.y) / 2;
  assert.deepEqual([...shovel.secondGrip.axis], [1, 0, 0]);
  assert.ok(Math.abs(shovel.secondGrip.at[1] - mid) < 1e-3 && shovel.secondGrip.at[0] === 0, 'at the crossbar');
});

test('the metals, the leather and the turn are each changed on their own', () => {
  const shovel = createSnowShovel(GFX, { bladeMetal: 'silver', wearMetal: 'iron', gripColor: '#c0392b' });
  assert.equal(shovel.bladeMetal, 'silver');
  assert.equal(shovel.bladeMaterial.color.getHexString(), METALS.silver.color.slice(1));
  shovel.setBladeMetal('copper').setShaftMetal('steel').setFittingsMetal('gold').setWearMetal('pewter');
  assert.deepEqual([shovel.bladeMetal, shovel.shaftMetal, shovel.fittingsMetal, shovel.wearMetal], ['copper', 'steel', 'gold', 'pewter']);
  assert.equal(shovel.bladeMaterial.roughness, METALS.copper.roughness);
  assert.equal(shovel.wearMaterial.color.getHexString(), METALS.pewter.color.slice(1));
  shovel.setGripColor('#112233');
  assert.equal(shovel.gripColor, '#112233');
  assert.equal(shovel.leatherMaterial.color.getHexString(), '112233');
  shovel.setThreadColor('#ffcc00');
  assert.equal(shovel.threadColor, '#ffcc00');
  shovel.setTurn(Math.PI / 2);
  assert.equal(shovel.tool.rotation.y, Math.PI / 2);
  assert.throws(() => createSnowShovel(GFX, { bladeMetal: 'unobtainium' }), /no metal called unobtainium/);
  assert.throws(() => shovel.setWearMetal('mud'), /no metal called mud/);
  assert.throws(() => createSnowShovel(GFX, { gripColor: 'red' }), /six-digit hex colour/);
  assert.throws(() => createSnowShovel({}), /requires the Madness Engine GFX module/);
});

test('a robot holds it right: the right hand on the D-handle at the top, the left on the shaft, the scoop flat on the ground', () => {
  const bot = createRobot(GFX, { detail: 0.3 });
  const shovel = createSnowShovel(GFX);
  bot.hold(shovel, { hand: 'L', grip: 0.62 });
  shovel.setTurn(-Math.PI / 2);
  const set = (k, name, x, y = 0, z = 0) => { const r = k.bone(name).rot; r[0] = x; r[1] = y; r[2] = z; };
  const dig = { lean: 0.8, knee: 0.9, arm: -1.4, az: -0.45, twist: -0.3, fore: 0, wrist: 0.9 };
  bot.setStyle({
    attack: 'chop',
    after(k) {
      k.reset();
      k.move('hips', 0, -0.89 * (1 - Math.cos(dig.knee)), 0);
      set(k, 'thighL', -dig.knee, 0, 0.06); set(k, 'thighR', -dig.knee, 0, -0.06);
      set(k, 'shinL', dig.knee * 1.6); set(k, 'shinR', dig.knee * 1.6);
      set(k, 'chest', dig.lean * 0.45);
      set(k, 'neck', -dig.lean * 0.3); set(k, 'head', -dig.lean * 0.3);
      set(k, 'armR', dig.arm, 0, -0.05); set(k, 'armL', dig.arm, 0, dig.az); set(k, 'spine', dig.lean * 0.55, dig.twist);
      set(k, 'foreR', dig.fore, -0.1); set(k, 'foreL', dig.fore, 0.1);
      set(k, 'handR', dig.wrist); set(k, 'handL', dig.wrist);
    },
  });
  bot.pose({ clip: 'attack', t: 0.5, time: 0.5 });
  shovel.group.updateMatrixWorld(true);
  const world = (point) => new GFX.Vector3(...point).applyMatrix4(shovel.group.matrixWorld);

  // The scoop is on the ground, and flat on it: its floor faces up.
  const v = new GFX.Vector3(), p = shovel.scoop.geometry.attributes.position;
  let lowest = Infinity;
  for (let i = 0; i < p.count; i++) lowest = Math.min(lowest, v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(shovel.scoop.matrixWorld).y);
  assert.ok(lowest > -0.04 && lowest < 0.03, `the scoop is on the ground (its lowest point is ${lowest.toFixed(3)} m up)`);
  const floor = new GFX.Vector3(...shovel.scoopAt(0.75, 0).normal).transformDirection(shovel.scoop.matrixWorld);
  assert.ok(floor.y > 0.9, `the scoop lies flat (its floor faces up by ${floor.y.toFixed(2)})`);
  assert.ok(world([0, 1.2, 0]).z - world([0, 0, 0]).z > 0.4, 'and the scoop is ahead of him');

  // The rear hand is on the middle of the D-handle's crossbar; the lead hand on the leather of the shaft.
  const base = world([0, 0, 0]), axis = world([0, 1, 0]).sub(base).normalize();
  const along = (point) => point.clone().sub(base).dot(axis);
  const off = (point) => point.clone().sub(base).addScaledVector(axis, -along(point)).length();
  const lead = new GFX.Vector3(...bot.point('handL', [0.283, 0.79, 0.04]));
  const rear = new GFX.Vector3(...bot.point('handR', [-0.283, 0.79, 0.04]));
  assert.ok(off(lead) < 0.05, `the left hand is on the shaft (${off(lead).toFixed(3)} m off it)`);
  assert.ok(along(lead) > shovel.gripBounds.bottom - 0.03 && along(lead) < shovel.gripBounds.top + 0.03, `on the leather (at ${along(lead).toFixed(2)} m)`);
  assert.ok(rear.distanceTo(world([0, 0.0225, 0])) < 0.07, `the right hand is on the D-handle (${rear.distanceTo(world([0, 0.0225, 0])).toFixed(3)} m from the bar)`);
  assert.ok(along(lead) - along(rear) > 0.45, `the hands are well apart, not bunched (${(along(lead) - along(rear)).toFixed(2)} m)`);
  // And it is held in front of him, down the middle: the scoop, and both hands, are near the line he faces along, not off to one side.
  const middle = (point) => Math.abs(point.x);
  assert.ok(middle(world(shovel.scoopAt(0.5, 0).point)) < 0.2, 'the scoop is in front of him, not to a side');
  assert.ok(middle(lead) < 0.2 && middle(rear) < 0.2, `the hands are on the middle line (${lead.x.toFixed(2)}, ${rear.x.toFixed(2)})`);
  // Neither elbow bends the wrong way.
  for (const side of ['L', 'R']) assert.ok(bot.skeleton.bone(`fore${side}`).rot[0] < 0.1, `the ${side} elbow bends forward`);
});

test('it is in the props library and the asset viewer, and can be disposed', () => {
  assert.equal(Props.createSnowShovel, createSnowShovel);
  assert.equal(assetViewer.id, 'snow-shovel');
  assert.equal(assetViewer.category, 'Props');
  const shovel = createSnowShovel(GFX);
  assert.doesNotThrow(() => shovel.dispose());
});
