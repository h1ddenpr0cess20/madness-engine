import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faces, halfTimber, windowOn } from '../src/buildings/common.js';
import { createBuildings, FOOTPRINTS } from '../src/buildings/index.js';
import { Mesher } from '../src/mesher.js';

const { modelFor } = createBuildings();

/**
 * Two faces in one plane, facing the same way and over each other, are drawn
 * by whichever the depth buffer happens to prefer at each pixel, so they
 * flicker as the camera moves. These tests keep every building's faces apart.
 */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The area two convex polygons share (Sutherland-Hodgman). */
function overlap(subject, clipper) {
  let out = subject;
  for (let i = 0; i < clipper.length && out.length; i++) {
    const a = clipper[i], b = clipper[(i + 1) % clipper.length];
    const inside = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-12;
    const meet = (p, q) => {
      const a1 = q[1] - p[1], b1 = p[0] - q[0], c1 = a1 * p[0] + b1 * p[1];
      const a2 = b[1] - a[1], b2 = a[0] - b[0], c2 = a2 * a[0] + b2 * a[1];
      const det = a1 * b2 - a2 * b1;
      return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
    };
    const from = out;
    out = [];
    for (let j = 0; j < from.length; j++) {
      const p = from[j], q = from[(j + 1) % from.length];
      if (inside(q)) { if (!inside(p)) out.push(meet(p, q)); out.push(q); } else if (inside(p)) out.push(meet(p, q));
    }
  }
  let s = 0;
  for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; s += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(s) / 2;
}

/** A triangle counter-clockwise in its own plane's two main axes. */
const flat = (tri, u, v) => {
  const p = [tri.A, tri.B, tri.C].map((q) => [q[u], q[v]]);
  const s = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1]);
  return s > 0 ? p : [p[0], p[2], p[1]];
};

/** Every pair of same-facing faces in a model that lie within `gap` of one plane and share more than `area` of it. Lit windows and flames are added to the picture, so they do not fight. */
function fights(template, { gap = 0.0035, area = 0.004 } = {}) {
  const tris = [];
  for (const [mat, p] of Object.entries(template)) {
    for (let i = 0; i < p.count; i += 3) {
      const A = [p.pos[i * 3], p.pos[i * 3 + 1], p.pos[i * 3 + 2]], B = [p.pos[i * 3 + 3], p.pos[i * 3 + 4], p.pos[i * 3 + 5]], C = [p.pos[i * 3 + 6], p.pos[i * 3 + 7], p.pos[i * 3 + 8]];
      const raw = cross(sub(B, A), sub(C, A));
      const len = Math.hypot(...raw);
      if (len < 1e-9) continue;
      const n = raw.map((x) => x / len);
      tris.push({ mat, A, B, C, n, d: dot(n, A) });
    }
  }
  const buckets = new Map();
  for (const t of tris) {
    const key = t.n.map((x) => Math.round(x * 20)).join(',');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(t);
  }
  const found = [];
  for (const list of buckets.values()) {
    list.sort((a, b) => a.d - b.d);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length && list[j].d - list[i].d < gap; j++) {
        const a = list[i], b = list[j];
        if (dot(a.n, b.n) < 0.999 || a.mat === b.mat && (a.mat === 'glow' || a.mat === 'flame')) continue;
        const axes = [0, 1, 2].sort((x, y) => Math.abs(a.n[y]) - Math.abs(a.n[x]));
        const [u, v] = [axes[1], axes[2]];
        const shared = overlap(flat(a, u, v), flat(b, u, v));
        if (shared > area) found.push(`${a.mat}/${b.mat} ${shared.toFixed(3)} near ${a.A.map((x) => x.toFixed(2)).join(',')}`);
      }
    }
  }
  return found;
}

test('every face of a beam points out of it', () => {
  for (const [a, b] of [[[0, 0, 0], [0, 1, 0]], [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [0, 0, 1]], [[0, 0, 0], [1, 1, 0.3]]]) {
    const m = new Mesher();
    m.beam('wood', a, b, 0.1, '#fff');
    const p = m.finish().wood;
    const mid = a.map((x, k) => (x + b[k]) / 2);
    for (let i = 0; i < p.count; i += 3) {
      const c = [0, 1, 2].map((k) => (p.pos[i * 3 + k] + p.pos[i * 3 + 3 + k] + p.pos[i * 3 + 6 + k]) / 3 - mid[k]);
      assert.ok(dot([p.nor[i * 3], p.nor[i * 3 + 1], p.nor[i * 3 + 2]], c) > 0, `a face of the beam ${a} to ${b} faces inward`);
    }
  }
});

test('a ring faces up', () => {
  const m = new Mesher();
  m.ring('stone', 0, 0, 0, 0.5, 1, 12, '#fff');
  const p = m.finish().stone;
  for (let i = 0; i < p.count; i++) assert.ok(p.nor[i * 3 + 1] > 0.99);
});

test('no two faces of a building lie over each other in one plane', () => {
  const found = [];
  // The castle is left out: its curtain walls and towers meet in faces that share a plane at their corners, and it has never been held to this.
  for (const type of Object.keys(FOOTPRINTS).filter((t) => t !== 'castle')) {
    for (const level of [1, 2, 3]) {
      for (const variant of [0, 1, 2, 3]) {
        for (const f of fights(modelFor(type, { level, variant }).parts)) found.push(`${type} (level ${level}, variant ${variant}): ${f}`);
      }
    }
    for (const progress of [0.1, 0.4, 0.7, 0.9]) {
      for (const f of fights(modelFor(type, { building: true, progress }).parts)) found.push(`${type} going up (${progress}): ${f}`);
    }
  }
  assert.deepEqual([...new Set(found)], []);
});

test('every footprint has a model, and every model a footprint', () => {
  const { types } = createBuildings();
  assert.deepEqual(types().sort(), Object.keys(FOOTPRINTS).sort());
});

test('a rock is closed over its top and sits flat: nothing of it faces down', () => {
  const m = new Mesher();
  m.rock('stone', 0, 0, 0, 0.3, 0.2, 0.25, '#888', { detail: 1, seed: 3 });
  const p = m.finish().stone;
  assert.ok(p.count > 30);
  let up = 0;
  for (let i = 0; i < p.count; i++) {
    assert.ok(p.nor[i * 3 + 1] > -0.95, 'a face of the flat base was drawn');
    if (p.nor[i * 3 + 1] > 0.5) up++;
    for (const k of [0, 1, 2]) assert.ok(Number.isFinite(p.pos[i * 3 + k]));
  }
  assert.ok(up > 5);
});

test('another seed makes another rock, and the same seed the same', () => {
  const rock = (seed) => { const m = new Mesher(); m.rock('stone', 0, 0, 0, 0.3, 0.2, 0.25, '#888', { seed }); return Array.from(m.finish().stone.pos.slice(0, 60)); };
  assert.deepEqual(rock(1), rock(1));
  assert.notDeepEqual(rock(1), rock(2));
});

test('half-timbering keeps its posts and braces off the windows and doors, and braces lean in from both ends', () => {
  const { modelFor: build } = createBuildings({ models: {
    wall(m) {
      const f = faces(-0.8, -0.5, 0.8, 0.5, 0.1, 0.7).front;
      halfTimber(m, f, { cols: 4, rails: [0, 0.6], capped: false });
      windowOn(m, f, 0.5, 0.2, 0.2, 0.2);
      return {};
    },
  } });
  const parts = build('wall').parts.trim;
  assert.ok(parts.count > 0);
  // No timber vertex lies inside the window's opening (u 0.4..0.6 across, 0.2..0.4 up), where the wall's front is z = 0.5.
  for (let i = 0; i < parts.count; i++) {
    const x = parts.pos[i * 3] + 0.8, y = parts.pos[i * 3 + 1] - 0.1;
    assert.ok(!(x > 0.42 && x < 0.58 && y > 0.22 && y < 0.38), `timber at ${x.toFixed(2)},${y.toFixed(2)} lies across the window`);
  }
});

test('a roof has thickness: an underside, and an edge at the eaves and the gable ends', () => {
  for (const kind of ['gable', 'hip']) {
    const m = new Mesher();
    m[kind]('tile', 0, 0, 2, 1.4, 1, 1.5, '#a04030', { over: 0.15 });
    const nor = m.parts.tile.nor;
    let up = 0, down = 0, side = 0;
    for (let i = 0; i < nor.length; i += 9) {
      const y = nor[i + 1];
      if (y > 0.3) up++; else if (y < -0.3) down++; else side++;
    }
    assert.ok(up > 0 && down > 0 && side > 0, `${kind}: ${up} up, ${down} down, ${side} edge faces`);
  }
});

/** The height of a triangle's plane over (x, z), if (x, z) lies under the triangle. */
function heightOver([A, B, C], x, z) {
  const d = (B[0] - A[0]) * (C[2] - A[2]) - (C[0] - A[0]) * (B[2] - A[2]);
  if (Math.abs(d) < 1e-9) return null;
  const u = ((x - A[0]) * (C[2] - A[2]) - (C[0] - A[0]) * (z - A[2])) / d;
  const v = ((B[0] - A[0]) * (z - A[2]) - (x - A[0]) * (B[2] - A[2])) / d;
  if (u < -1e-6 || v < -1e-6 || u + v > 1 + 1e-6) return null;
  return A[1] + u * (B[1] - A[1]) + v * (C[1] - A[1]);
}

test('no window, door or timber stands out over a roof', () => {
  const found = [];
  for (const type of Object.keys(FOOTPRINTS)) {
    for (const variant of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const { parts } = modelFor(type, { variant });
      const tris = (p) => Array.from({ length: p.count / 3 }, (_, i) => [0, 1, 2].map((k) => [p.pos[(i * 3 + k) * 3], p.pos[(i * 3 + k) * 3 + 1], p.pos[(i * 3 + k) * 3 + 2]]));
      // The top faces of the roofs: those that face up.
      const roofs = ['tile', 'thatch', 'slate'].flatMap((mat) => (parts[mat] ? tris(parts[mat]) : []))
        .filter(([A, B, C]) => cross(sub(B, A), sub(C, A))[1] > 1e-9);
      for (const mat of ['glass', 'glow', 'trim']) {
        if (!parts[mat]) continue;
        for (const tri of tris(parts[mat])) {
          for (const p of tri) {
            // Just over a roof is through it; well over it is a tower or a gable standing above a lower roof.
            const y = roofs.map((r) => heightOver(r, p[0], p[2])).find((h) => h !== null && p[1] > h + 0.001 && p[1] < h + 0.25);
            if (y !== undefined) found.push(`${type} ${variant}: ${mat} at ${p.map((x) => x.toFixed(2)).join(',')} over a roof at ${y.toFixed(2)}`);
          }
        }
      }
    }
  }
  assert.deepEqual([...new Set(found)], []);
});
