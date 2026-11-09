import { bodyLevel } from './basemesh.js';
import { BONES } from './data/base.js';
import { zoneOf } from './body.js';
import { Part } from './kit.js';

/**
 * A garment made from the body's own skin: the part of the skin it covers,
 * cut out along a clean line, lifted off the body and hung as cloth hangs.
 *
 * Because every point of it is a point of the skin moved outward, it has the
 * skin's own bone weights, so however he moves it moves as the skin under it
 * does: it never tears at a seam, and the skin never comes through it. Its
 * UVs are the skin's, so it is painted, as the skin is, by where each texel
 * is on the body.
 *
 * `spec`:
 * - `level`: the body's level of detail to cut from (0 or 1).
 * - `field(p, zone)`: how far inside the garment's outline the skin at `p`
 *   (zone { zone, y, d, x }) is, in metres; ≤ 0 outside, and -1 where it
 *   never goes (the hands, say). The cut follows where it is 0.
 * - `ease(p, zone)`: how far off the skin the cloth sits.
 * - `drape(p, q, zone, weights)`: where the cloth at `q` (lifted off skin point `p`, whose bone weights are `weights`, by name)
 *   hangs instead, if it hangs loose (across a hollow, off the chest); or `q`.
 * - `folds(p, zone)`: a little more off the skin, for creases.
 * - `edge(p, zone)`: the turned edge at a cut there: { thick, turn } (the
 *   cloth's doubled thickness, and how far the turn-up goes inside).
 * - `smooth`: passes of smoothing over how far the cloth stands off the skin.
 */
export function skinShell(name, material, spec) {
  const { level = 1, field, ease, drape = (p, q) => q, folds = () => 0, edge = () => ({ thick: 0.003, turn: 0.015 }), smooth: passes = 4 } = spec;
  const mesh = bodyLevel(level);
  const { pos, uv, faces, uvFaces, weights, occ } = mesh;
  const V = pos.length / 3;
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];

  // The skin's normals and zones.
  const n = new Float32Array(pos.length);
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const e1 = [pos[c * 3] - pos[a * 3], pos[c * 3 + 1] - pos[a * 3 + 1], pos[c * 3 + 2] - pos[a * 3 + 2]];
    const e2 = [pos[d * 3] - pos[b * 3], pos[d * 3 + 1] - pos[b * 3 + 1], pos[d * 3 + 2] - pos[b * 3 + 2]];
    const q = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  for (let i = 0; i < V; i++) {
    const l = Math.hypot(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]) || 1;
    n[i * 3] /= l; n[i * 3 + 1] /= l; n[i * 3 + 2] /= l;
  }
  const N = (i) => [n[i * 3], n[i * 3 + 1], n[i * 3 + 2]];
  const zone = Array.from({ length: V }, (_, i) => zoneOf(weights[i], P(i)));
  const F = new Float32Array(V);
  for (let i = 0; i < V; i++) F[i] = Object.keys(weights[i]).length ? field(P(i), zone[i]) : -1;

  // The quads it keeps: any with a corner inside, and none where it never goes.
  const kept = [];
  for (let f = 0; f < faces.length; f += 4) {
    const q = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    if (q.some((v) => F[v] > 0.002) && q.every((v) => F[v] > -0.5)) kept.push(f);
  }

  // Corners outside are drawn in to the cut: each along the one edge the outline crosses most squarely.
  const snap = new Map(); // v → { u, t }
  for (const f of kept) {
    for (let k = 0; k < 4; k++) {
      const v = faces[f + k];
      if (F[v] > 0) continue;
      for (const u of [faces[f + ((k + 1) % 4)], faces[f + ((k + 3) % 4)], faces[f + ((k + 2) % 4)]]) {
        if (F[u] <= 0) continue;
        const a = P(v), b = P(u);
        const slope = (F[u] - F[v]) / (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) || 1);
        const s = snap.get(v);
        if (!s || slope > s.slope) snap.set(v, { u, t: F[v] / (F[v] - F[u]), slope });
      }
    }
  }
  const base = (v) => {
    const s = snap.get(v);
    if (!s) return { p: P(v), n: N(v), w: weights[v], occ: occ[v] };
    const { u, t } = s;
    const a = P(v), b = P(u), na = N(v), nb = N(u);
    const nn = [0, 1, 2].map((i) => na[i] + (nb[i] - na[i]) * t), l = Math.hypot(...nn) || 1;
    const w = {};
    for (const [bone, x] of Object.entries(weights[v])) w[bone] = (w[bone] ?? 0) + x * (1 - t);
    for (const [bone, x] of Object.entries(weights[u])) w[bone] = (w[bone] ?? 0) + x * t;
    return { p: [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t), n: nn.map((x) => x / l), w, occ: occ[v] + (occ[u] - occ[v]) * t };
  };

  // A vertex's weights by bone name.
  const named = (w) => {
    const out = {};
    for (const [b, x] of Object.entries(w)) out[BONES[b]] = (out[BONES[b]] ?? 0) + x;
    return out;
  };
  // Each vertex it uses: lifted off the skin, hung, and smoothed.
  const used = new Map();
  for (const f of kept) for (let k = 0; k < 4; k++) if (!used.has(faces[f + k])) used.set(faces[f + k], used.size);
  const verts = [...used.keys()];
  const B = verts.map(base);
  const lifted = verts.map((v, i) => {
    const b = B[i], z = zone[v];
    const e = ease(b.p, z);
    const q = [b.p[0] + b.n[0] * e, b.p[1] + b.n[1] * e, b.p[2] + b.n[2] * e];
    return drape(b.p, q, z, named(b.w));
  });
  // How far each stands off the skin, smoothed over its neighbours, never less than its ease.
  const nbr = verts.map(() => new Set());
  for (const f of kept) {
    for (let k = 0; k < 4; k++) {
      const a = used.get(faces[f + k]), b = used.get(faces[f + ((k + 1) % 4)]);
      nbr[a].add(b); nbr[b].add(a);
    }
  }
  let off = lifted.map((q, i) => [q[0] - B[i].p[0], q[1] - B[i].p[1], q[2] - B[i].p[2]]);
  for (let pass = 0; pass < passes; pass++) {
    off = off.map((o, i) => {
      const list = [...nbr[i]];
      const avg = [0, 0, 0];
      for (const j of list) for (let a = 0; a < 3; a++) avg[a] += off[j][a] / list.length;
      return list.length ? [0, 1, 2].map((a) => o[a] * 0.4 + avg[a] * 0.6) : o;
    });
  }
  const at = verts.map((v, i) => {
    const b = B[i], z = zone[v];
    const o = off[i];
    // Never closer to the skin than its ease, along the skin's normal.
    const along = o[0] * b.n[0] + o[1] * b.n[1] + o[2] * b.n[2];
    const want = ease(b.p, z) + folds(b.p, z);
    const k = Math.max(0, want - along);
    return [b.p[0] + o[0] + b.n[0] * k, b.p[1] + o[1] + b.n[1] * k, b.p[2] + o[2] + b.n[2] * k];
  });

  // The cut, made fair: each vertex on it eased toward the middle of its two neighbours along it.
  const cutEdges = new Map();
  for (const f of kept) {
    for (let k = 0; k < 4; k++) {
      const a = faces[f + k], b = faces[f + ((k + 1) % 4)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      cutEdges.set(key, (cutEdges.get(key) ?? 0) + 1);
    }
  }
  const along = new Map();
  for (const [key, count] of cutEdges) {
    if (count !== 1) continue;
    const [a, b] = key.split(',').map(Number);
    if (!along.has(a)) along.set(a, []);
    if (!along.has(b)) along.set(b, []);
    along.get(a).push(b); along.get(b).push(a);
  }
  for (let pass = 0; pass < 16; pass++) {
    const next = new Map();
    for (const [v, list] of along) {
      if (list.length !== 2) continue;
      const i = used.get(v), a = at[used.get(list[0])], b = at[used.get(list[1])];
      next.set(i, [0, 1, 2].map((k) => at[i][k] * 0.5 + (a[k] + b[k]) * 0.25));
    }
    for (const [i, p] of next) at[i] = p;
  }

  // The part: one vertex for each skin vertex and UV it uses.
  const part = new Part(name, material);
  const ids = new Map();
  const corner = (v, t) => {
    const key = v * 4194304 + t;
    let id = ids.get(key);
    if (id === undefined) {
      const i = used.get(v);
      id = part.vertex(at[i], [uv[t * 2], uv[t * 2 + 1]], named(B[i].w), 0.45 + 0.55 * Math.pow(B[i].occ, 0.6), null, zone[v]);
      ids.set(key, id);
    }
    return id;
  };
  // Each edge of a kept quad, and which way round its quad uses it (to find the cut).
  const edges = new Map();
  for (const f of kept) {
    const q = [0, 1, 2, 3].map((k) => corner(faces[f + k], uvFaces[f + k]));
    const at4 = [0, 1, 2, 3].map((k) => at[used.get(faces[f + k])]);
    const d02 = Math.hypot(...[0, 1, 2].map((a) => at4[0][a] - at4[2][a])), d13 = Math.hypot(...[0, 1, 2].map((a) => at4[1][a] - at4[3][a]));
    if (d02 <= d13) part.idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    else part.idx.push(q[0], q[1], q[3], q[1], q[2], q[3]);
    for (let k = 0; k < 4; k++) {
      const a = faces[f + k], b = faces[f + ((k + 1) % 4)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      const e = edges.get(key);
      if (e) e.count++;
      else edges.set(key, { a, b, ta: uvFaces[f + k], tb: uvFaces[f + ((k + 1) % 4)], count: 1 });
    }
  }

  // The cut's edges, turned under: out over a rounded lip, back along the inside.
  const cut = [...edges.values()].filter((e) => e.count === 1);
  // Every corner of every kept quad round each vertex (across the diagonals too).
  const round = verts.map(() => new Set());
  for (const f of kept) for (let k = 0; k < 4; k++) for (let j = 1; j < 4; j++) round[used.get(faces[f + k])].add(used.get(faces[f + ((k + j) % 4)]));
  const inward = new Map(); // v → the way into the garment along its surface: square to the cut and the skin, toward the garment
  for (const [v, list] of along) {
    const i = used.get(v);
    if (i === undefined) continue;
    const nn = B[i].n;
    // Up the outline's slope (deeper into the garment), flat along the skin.
    const c = [0, 0, 0];
    const depth = (j) => (snap.has(verts[j]) ? 0 : Math.max(0, F[verts[j]]));
    for (const j of round[i]) {
      const dF = depth(j) - depth(i);
      for (let k = 0; k < 3; k++) c[k] += (at[j][k] - at[i][k]) * dF;
    }
    // Along the cloth (which may hang off the skin at a slant), square to the cut where it runs plainly.
    let r = c.slice();
    let t = null;
    if (list.length === 2) {
      const a = at[used.get(list[0])], b = at[used.get(list[1])];
      t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const tt = t[0] * t[0] + t[1] * t[1] + t[2] * t[2] || 1, rt = (r[0] * t[0] + r[1] * t[1] + r[2] * t[2]) / tt;
      r = [r[0] - t[0] * rt, r[1] - t[1] * rt, r[2] - t[2] * rt];
    }
    const l = Math.hypot(...r);
    if (l < 1e-9) { inward.set(v, { into: [0, 0, 0], out: nn }); continue; }
    r = r.map((x) => x / l);
    // The cloth's own outward normal there: square to it and the cut, the same way out as the skin's.
    let o = t ? [t[1] * r[2] - t[2] * r[1], t[2] * r[0] - t[0] * r[2], t[0] * r[1] - t[1] * r[0]] : nn.slice();
    const on = o[0] * r[0] + o[1] * r[1] + o[2] * r[2];
    o = [o[0] - r[0] * on, o[1] - r[1] * on, o[2] - r[2] * on];
    if (o[0] * nn[0] + o[1] * nn[1] + o[2] * nn[2] < 0) o = o.map((x) => -x);
    const ol = Math.hypot(...o) || 1;
    inward.set(v, { into: r, out: o.map((x) => x / ol) });
  }
  const rim = new Map(); // `${v},${t}` → [lip, under, turned]
  const rimOf = (v, t) => {
    const key = `${v},${t}`;
    if (rim.has(key)) return rim.get(key);
    const i = used.get(v), p = at[i], { into, out: nn } = inward.get(v), z = zone[v];
    const { thick, turn } = edge(B[i].p, z);
    const w = named(B[i].w), u = [uv[t * 2], uv[t * 2 + 1]];
    const tint = 0.45 + 0.55 * Math.pow(B[i].occ, 0.6);
    const pt = (o, d) => [p[0] - into[0] * o - nn[0] * d, p[1] - into[1] * o - nn[1] * d, p[2] - into[2] * o - nn[2] * d];
    const ids3 = [
      part.vertex(pt(thick * 0.45, thick * 0.35), u, w, tint * 0.95, null, z),
      part.vertex(pt(0, thick), u, w, tint * 0.6, null, z),
      // Not far up, and well behind, so it never meets the cloth where the cloth curves.
      part.vertex(pt(-Math.min(turn, 0.009), thick * 1.6), u, w, tint * 0.5, null, z),
    ];
    rim.set(key, ids3);
    return ids3;
  };
  for (const e of cut) {
    // The kept quad runs a → b; the strip runs back b → a beyond it.
    const A0 = corner(e.a, e.ta), B0 = corner(e.b, e.tb);
    const ra = rimOf(e.a, e.ta), rb = rimOf(e.b, e.tb);
    const rows = [[A0, B0], [ra[0], rb[0]], [ra[1], rb[1]], [ra[2], rb[2]]];
    for (let r = 0; r < 3; r++) {
      const [a0, b0] = rows[r], [a1, b1] = rows[r + 1];
      part.idx.push(b0, a0, a1, b0, a1, b1);
    }
  }
  return part;
}
