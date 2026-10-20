import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Skeleton } from '../src/models/rig.js';
import { build, Sculpt } from '../src/models/sdf.js';

test('a sculpted ball meshes into a closed ball of the right size, its normals pointing out', () => {
  const s = new Sculpt().sphere([0, 0, 0], 0.2);
  const m = build(s, { cell: 0.02 });
  for (let v = 0; v < m.count; v++) {
    const p = [m.position[v * 3], m.position[v * 3 + 1], m.position[v * 3 + 2]];
    const r = Math.hypot(...p);
    assert.ok(Math.abs(r - 0.2) < 0.002, `vertex ${v} at radius ${r}`);
    const n = [m.normal[v * 3], m.normal[v * 3 + 1], m.normal[v * 3 + 2]];
    assert.ok((p[0] * n[0] + p[1] * n[1] + p[2] * n[2]) / r > 0.98);
  }
  // Closed: every edge is shared by exactly two triangles.
  const edges = new Map();
  for (let t = 0; t < m.index.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = m.index[t + e], b = m.index[t + (e + 1) % 3];
      const k = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  }
  for (const [k, n] of edges) assert.equal(n, 2, `edge ${k}`);
});

test('a bone turned about its pivot carries its skin round with it', () => {
  const k = new Skeleton([['root', null, [0, 0, 0]], ['arm', 'root', [1, 0, 0]]]);
  k.turn('arm', 0, 0, Math.PI / 2);
  k.compute();
  const p = k.point('arm', [2, 0, 0]);
  assert.ok(Math.hypot(p[0] - 1, p[1] - 1, p[2]) < 1e-6, `got ${p}`);
});

test('a warp stretches what is sculpted after it, and leaves what was sculpted before alone', () => {
  const stretch = { to: (p) => [p[0], p[1] * 2, p[2]], from: (p) => [p[0], p[1] / 2, p[2]], scale: () => 1 };
  const height = (sculpt) => {
    const m = build(sculpt, { cell: 0.02 });
    let top = -Infinity;
    for (let v = 0; v < m.count; v++) top = Math.max(top, m.position[v * 3 + 1]);
    return top;
  };
  const plain = height(new Sculpt().sphere([0, 0, 0], 0.2));
  const warped = height(new Sculpt().setWarp(stretch).sphere([0, 0, 0], 0.2));
  assert.ok(Math.abs(plain - 0.2) < 0.01, `${plain}`);
  assert.ok(Math.abs(warped - 0.4) < 0.02, `${warped}`);
});

/** Every edge of a mesh shared by exactly two of its triangles. */
const closed = (m) => {
  const edges = new Map();
  for (let t = 0; t < m.index.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = m.index[t + e], b = m.index[t + (e + 1) % 3];
      const k = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  }
  return [...edges.values()].every((n) => n === 2);
};

test('the mesh is made finer where the grid is too coarse for the detail, and only there', () => {
  // A ball with a small knob on it: the knob is a few grid steps across.
  const knob = () => new Sculpt().sphere([0, 0, 0], 0.2).sphere([0, 0.2, 0], 0.025, { k: 0.004 });
  const plain = build(knob(), { cell: 0.02, refine: 0 });
  const fine = build(knob(), { cell: 0.02 });
  assert.ok(fine.count > plain.count && fine.count <= plain.count * 1.3, `${plain.count} -> ${fine.count}`);
  assert.ok(closed(fine));
  const s = knob();
  for (let v = 0; v < fine.count; v++) {
    const d = s.field([fine.position[v * 3], fine.position[v * 3 + 1], fine.position[v * 3 + 2]]);
    assert.ok(Math.abs(d) < 0.002, `vertex ${v} is ${d} off the surface`);
  }
  // The new vertices are round the knob, not over the plain ball.
  for (let v = plain.count; v < fine.count; v++) assert.ok(fine.position[v * 3 + 1] > 0.12, `vertex ${v} at y ${fine.position[v * 3 + 1]}`);
});

test('a line of paint narrower than the grid is followed by finer mesh', () => {
  const striped = () => new Sculpt().sphere([0, 0, 0], 0.2, { color: '#ffffff' }).paint((p) => Math.abs(p[1]) - 0.004, '#000000', 0.002);
  const plain = build(striped(), { cell: 0.02, refine: 0 });
  const fine = build(striped(), { cell: 0.02 });
  assert.ok(fine.count > plain.count, `${plain.count} -> ${fine.count}`);
  assert.ok(closed(fine));
});
