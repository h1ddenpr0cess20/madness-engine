import { bodyLevel } from './basemesh.js';
import { BONES } from './data/base.js';
import { armDistance, JOINTS, mirror } from './skeleton.js';

/**
 * The bare body's surface, to measure clothes against: where a ray from
 * inside the trunk, a leg or an arm leaves the skin, which part of the body
 * each place is (for a garment to say what it covers), and how the skin
 * there is weighted to the bones (so cloth over it moves with it).
 *
 * All of it is read off the real anatomy in data/base.js, at rest.
 */

const GROUP = (name) => {
  const n = name.replace(/[LR]$/, '');
  if (['head', 'jaw', 'tongue', 'eye', 'lidUp', 'lidLow', 'brow', 'lipCorner'].includes(n)) return 'head';
  if (n === 'neck') return 'neck';
  if (['root', 'hips', 'spine', 'chest', 'clavicle'].includes(n)) return 'trunk';
  if (n === 'arm' || n === 'fore') return 'arm';
  if (n === 'thigh' || n === 'shin') return 'leg';
  if (n === 'foot' || n === 'toes') return 'foot';
  return 'hand';
};
const GROUPS = BONES.map(GROUP);

/** Which part of the body a vertex with weights `w` ({ boneIndex: weight }) at `p` is: { zone, y, d, x } (x: how far from the middle line). */
export function zoneOf(w, p) {
  const sum = {};
  for (const [b, v] of Object.entries(w)) sum[GROUPS[b]] = (sum[GROUPS[b]] ?? 0) + v;
  let zone = 'trunk', best = -1;
  for (const [g, v] of Object.entries(sum)) if (v > best) { best = v; zone = g; }
  const m = p[0] >= 0 ? 1 : -1;
  let d = 0;
  if (zone === 'arm' || zone === 'hand') d = armDistance(p, m);
  if (zone === 'foot') d = p[2] - mirror(JOINTS.ankle, m)[2];
  return { zone, y: p[1], d, x: Math.abs(p[0]) };
}

let S = null;
/** The body at rest, ready to be measured: its triangles by zone, a grid over them, and its vertices hashed. */
function surface() {
  if (S) return S;
  const mesh = bodyLevel(0);
  const P = mesh.pos, faces = mesh.faces;
  const used = new Uint8Array(P.length / 3);
  for (const v of faces) used[v] = 1;
  const zones = mesh.weights.map((w, i) => zoneOf(w, [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]));
  const tris = [];
  for (let f = 0; f < faces.length; f += 4) {
    const q = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    tris.push([q[0], q[1], q[2]], [q[0], q[2], q[3]]);
  }
  const CELL = 0.025;
  const lo = [-0.8, -0.05, -0.4];
  const dims = [64, 76, 32];
  const cellOf = (x, y, z) => {
    const i = Math.floor((x - lo[0]) / CELL), j = Math.floor((y - lo[1]) / CELL), k = Math.floor((z - lo[2]) / CELL);
    if (i < 0 || j < 0 || k < 0 || i >= dims[0] || j >= dims[1] || k >= dims[2]) return -1;
    return (i * dims[1] + j) * dims[2] + k;
  };
  const cells = new Map();
  tris.forEach(([a, b, c], t) => {
    const mn = [0, 1, 2].map((k) => Math.min(P[a * 3 + k], P[b * 3 + k], P[c * 3 + k]));
    const mx = [0, 1, 2].map((k) => Math.max(P[a * 3 + k], P[b * 3 + k], P[c * 3 + k]));
    for (let x = mn[0]; x <= mx[0] + CELL; x += CELL) for (let y = mn[1]; y <= mx[1] + CELL; y += CELL) for (let z = mn[2]; z <= mx[2] + CELL; z += CELL) {
      const k = cellOf(Math.min(x, mx[0]), Math.min(y, mx[1]), Math.min(z, mx[2]));
      if (k < 0) continue;
      let list = cells.get(k);
      if (!list) cells.set(k, (list = []));
      if (list[list.length - 1] !== t) list.push(t);
    }
  });
  // Each triangle's zone: the zone most of its corners are in.
  const triZone = tris.map(([a, b, c]) => (zones[b].zone === zones[c].zone ? zones[b].zone : zones[a].zone));
  // Vertices hashed for nearest lookups.
  const H = 0.03, hash = new Map();
  const hkey = (x, y, z) => `${Math.floor(x / H)},${Math.floor(y / H)},${Math.floor(z / H)}`;
  for (let i = 0; i < used.length; i++) {
    if (!used[i]) continue;
    const k = hkey(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    if (!hash.has(k)) hash.set(k, []);
    hash.get(k).push(i);
  }
  S = { P, tris, triZone, cells, cellOf, CELL, zones, weights: mesh.weights, hash, H };
  return S;
}

/**
 * How far from `o` along unit `d` the ray first crosses the skin, counting
 * only the zones `only` allows (or all); null if it doesn't within `far`.
 */
export function castBody(o, d, { far = 0.45, only = null } = {}) {
  const s = surface();
  const { P, tris, cells, cellOf, CELL } = s;
  let best = Infinity;
  const seen = new Set();
  for (let r = 0; r <= far + CELL; r += CELL * 0.5) {
    if (r > best + CELL) break;
    const k = cellOf(o[0] + d[0] * r, o[1] + d[1] * r, o[2] + d[2] * r);
    if (k < 0) continue;
    const list = cells.get(k);
    if (!list) continue;
    for (const t of list) {
      if (seen.has(t)) continue;
      seen.add(t);
      if (only && !only(s.triZone[t])) continue;
      const [a, b, c] = tris[t];
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      const e1x = P[b * 3] - ax, e1y = P[b * 3 + 1] - ay, e1z = P[b * 3 + 2] - az;
      const e2x = P[c * 3] - ax, e2y = P[c * 3 + 1] - ay, e2z = P[c * 3 + 2] - az;
      const hx = d[1] * e2z - d[2] * e2y, hy = d[2] * e2x - d[0] * e2z, hz = d[0] * e2y - d[1] * e2x;
      const det = e1x * hx + e1y * hy + e1z * hz;
      if (Math.abs(det) < 1e-14) continue;
      const f = 1 / det, sx = o[0] - ax, sy = o[1] - ay, sz = o[2] - az;
      const u = f * (sx * hx + sy * hy + sz * hz);
      if (u < 0 || u > 1) continue;
      const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
      const v = f * (d[0] * qx + d[1] * qy + d[2] * qz);
      if (v < 0 || u + v > 1) continue;
      const dist = f * (e2x * qx + e2y * qy + e2z * qz);
      if (dist > 1e-5 && dist < best) best = dist;
    }
  }
  return best <= far ? best : null;
}

/** The skin's bone weights near `p` ({ boneName: weight }), blended from the nearest few vertices of the body. */
export function skinWeightsAt(p, { only = null } = {}) {
  const s = surface();
  const { P, hash, H } = s;
  const near = [];
  for (let reach = 1; reach <= 4 && near.length < 4; reach++) {
    near.length = 0;
    const cx = Math.floor(p[0] / H), cy = Math.floor(p[1] / H), cz = Math.floor(p[2] / H);
    for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) for (let k = -reach; k <= reach; k++) {
      for (const v of hash.get(`${cx + i},${cy + j},${cz + k}`) ?? []) {
        if (only && !only(s.zones[v].zone)) continue;
        near.push([v, Math.hypot(P[v * 3] - p[0], P[v * 3 + 1] - p[1], P[v * 3 + 2] - p[2])]);
      }
    }
  }
  near.sort((a, b) => a[1] - b[1]);
  const pick = near.slice(0, 4);
  const out = {};
  let total = 0;
  for (const [v, dist] of pick) {
    const k = 1 / (dist * dist + 1e-6);
    total += k;
    for (const [b, w] of Object.entries(s.weights[v])) out[BONES[b]] = (out[BONES[b]] ?? 0) + w * k;
  }
  for (const b of Object.keys(out)) out[b] /= total || 1;
  return pick.length ? out : { hips: 1 };
}

// ———————————————————————————————————————————————— the legs and the feet

/** Where the leg's middle is at height `y` (side `m`): down the line of hip, knee and ankle. */
export function legAxis(y, m) {
  const [hip, knee, ankle] = [JOINTS.hip, JOINTS.knee, JOINTS.ankle].map((p) => mirror(p, m));
  const [a, b] = y >= knee[1] ? [knee, hip] : [ankle, knee];
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];
}

/**
 * A foot's measure (side `m`), for a shoe: how far back its heel and forward
 * its toes are, and along it (by z) its middle across, half-width and top.
 */
export function footProfile(m) {
  const s = surface();
  const pts = [];
  for (let i = 0; i < s.zones.length; i++) {
    const p = [s.P[i * 3], s.P[i * 3 + 1], s.P[i * 3 + 2]];
    if (p[0] * m <= 0.02 || p[1] > 0.13 || !['foot', 'leg'].includes(s.zones[i].zone)) continue;
    if (!s.weights[i] || !Object.keys(s.weights[i]).length) continue;
    pts.push(p);
  }
  let back = Infinity, front = -Infinity;
  for (const p of pts) { back = Math.min(back, p[2]); front = Math.max(front, p[2]); }
  const N = 40, bins = Array.from({ length: N + 1 }, () => ({ lo: Infinity, hi: -Infinity, top: 0 }));
  for (const p of pts) {
    // Only the foot below the ankle's top counts toward its height.
    const b = bins[Math.round(((p[2] - back) / (front - back)) * N)];
    b.lo = Math.min(b.lo, p[0]); b.hi = Math.max(b.hi, p[0]);
    if (p[1] < 0.12) b.top = Math.max(b.top, p[1]);
  }
  for (let i = 0; i <= N; i++) if (!Number.isFinite(bins[i].lo)) bins[i] = { ...bins[i - 1 >= 0 ? i - 1 : i + 1] };
  const at = (z) => {
    const f = Math.max(0, Math.min(N, ((z - back) / (front - back)) * N));
    const i = Math.min(N - 1, Math.floor(f)), t = f - i;
    // Smoothed over the neighbouring bins.
    const pick = (k) => bins[Math.max(0, Math.min(N, k))];
    const avg = (key, k) => (pick(k - 1)[key] + 2 * pick(k)[key] + pick(k + 1)[key]) / 4;
    const lerp = (key) => avg(key, i) * (1 - t) + avg(key, i + 1) * t;
    const lo = lerp('lo'), hi = lerp('hi');
    return { x: (lo + hi) / 2, hw: (hi - lo) / 2, top: lerp('top') };
  };
  return { back, front, at };
}
