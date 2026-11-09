/**
 * The modelling kit the human is built with: small vector helpers, a quad
 * grid builder that every surface (lofts, ray-cast shells, caps) is made of,
 * smooth normals welded across UV seams and poles, and the assembly of all
 * the parts into one skinned geometry with a draw group per material.
 *
 * Everything is in metres, y up, the figure facing +z, its left toward +x.
 */

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => scale(a, 1 / (len(a) || 1));
/** `a` + `x`·u + `y`·v + `z`·w: a point in a local frame. */
export const frameAt = (o, u, v, w, x, y, z) => [
  o[0] + u[0] * x + v[0] * y + w[0] * z,
  o[1] + u[1] * x + v[1] * y + w[1] * z,
  o[2] + u[2] * x + v[2] * y + w[2] * z,
];

/** A cheap, smooth, deterministic 3D value noise in [-1, 1]. */
function hash(x, y, z) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) & 0xffff) / 32767.5 - 1;
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let c = 0; c < 8; c++) {
    const dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
    r += hash(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return r;
}
export function fbm(x, y, z, octaves = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { s += noise3(x * f, y * f, z * f) * a; f *= 2.03; a *= 0.5; }
  return s;
}

/** Points along a Catmull-Rom curve through `pts`, `n` + 1 of them, evenly by parameter. */
export function spline(pts, n) {
  const out = [];
  const seg = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const g = (i / n) * seg, k = Math.min(seg - 1, Math.floor(g)), t = g - k;
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(seg, k + 2)];
    const t2 = t * t, t3 = t2 * t;
    out.push([0, 1, 2].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)));
  }
  return out;
}

/**
 * Rotation-minimising frames along a polyline: for each point its tangent
 * `t` and two normals `u`, `v`, starting from `ref` (made perpendicular).
 */
export function frames(pts, ref) {
  const out = [];
  let u = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const t = norm(sub(b, a));
    if (!u) u = norm(sub(ref, scale(t, dot(ref, t))));
    else u = norm(sub(u, scale(t, dot(u, t))));
    out.push({ p: pts[i], t, u, v: cross(t, u) });
  }
  return out;
}

/**
 * One surface of the figure, drawn with one material. Vertices carry a rest
 * position, a UV, an ambient-occlusion tint and up to four bone weights.
 */
export class Part {
  constructor(name, material) {
    this.name = name;
    this.material = material;
    this.pos = [];
    this.uv = [];
    this.tint = [];
    this.weights = [];
    this.idx = [];
    this.given = [];
  }

  get count() { return this.pos.length / 3; }

  vertex(p, uv = [0, 0], weights = { root: 1 }, tint = 1, normal = null) {
    this.given.push(normal);
    this.pos.push(p[0], p[1], p[2]);
    this.uv.push(uv[0], uv[1]);
    this.tint.push(tint);
    this.weights.push(weights);
    return this.count - 1;
  }

  /**
   * A (rows + 1) × (cols + 1) grid of vertices from `fn(i, j)` → { p, uv, w, tint },
   * stitched into quads. `flip` turns the faces round.
   */
  grid(rows, cols, fn, { flip = false } = {}) {
    const base = this.count;
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const v = fn(i, j);
        this.vertex(v.p, v.uv ?? [j / cols, i / rows], v.w, v.tint ?? 1, v.n ?? null);
      }
    }
    const row = cols + 1;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = base + i * row + j, b = a + 1, c = a + row, d = c + 1;
        if (flip) this.idx.push(a, b, c, b, d, c);
        else this.idx.push(a, c, b, b, c, d);
      }
    }
    return base;
  }

  /** Vertex normals, area weighted, then made the same wherever two vertices share a place (seams, poles). */
  normals() {
    const P = this.pos, n = new Float32Array(P.length);
    for (let t = 0; t < this.idx.length; t += 3) {
      const a = this.idx[t] * 3, b = this.idx[t + 1] * 3, c = this.idx[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const o of [a, b, c]) { n[o] += nx; n[o + 1] += ny; n[o + 2] += nz; }
    }
    const key = (o) => `${Math.round(P[o] * 2e5)},${Math.round(P[o + 1] * 2e5)},${Math.round(P[o + 2] * 2e5)}`;
    const groups = new Map();
    for (let o = 0; o < P.length; o += 3) {
      const k = key(o);
      const g = groups.get(k);
      if (g) g.push(o); else groups.set(k, [o]);
    }
    for (const g of groups.values()) {
      if (g.length < 2) continue;
      let x = 0, y = 0, z = 0;
      for (const o of g) { x += n[o]; y += n[o + 1]; z += n[o + 2]; }
      for (const o of g) { n[o] = x; n[o + 1] = y; n[o + 2] = z; }
    }
    // A normal given with the vertex (worked out from the shape itself, not its facets) wins.
    this.given.forEach((g, v) => { if (g) { n[v * 3] = g[0]; n[v * 3 + 1] = g[1]; n[v * 3 + 2] = g[2]; } });
    for (let o = 0; o < n.length; o += 3) {
      const l = Math.hypot(n[o], n[o + 1], n[o + 2]) || 1;
      n[o] /= l; n[o + 1] /= l; n[o + 2] /= l;
    }
    return n;
  }
}

/** Normalised, at most four, as [index, weight] pairs by bone name. */
function resolveWeights(w, boneIndex) {
  const list = Object.entries(w)
    .filter(([, v]) => v > 1e-4)
    .map(([name, v]) => {
      const i = boneIndex.get(name);
      if (i === undefined) throw new Error(`human: no bone called ${name}`);
      return [i, v];
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const total = list.reduce((s, [, v]) => s + v, 0) || 1;
  return list.map(([i, v]) => [i, v / total]);
}

/**
 * Every part as one set of rest arrays (what `skin` in models/rig.js moves),
 * triangles grouped by material in `materialOrder`.
 */
export function assemble(parts, boneNames, materialOrder) {
  const boneIndex = new Map(boneNames.map((n, i) => [n, i]));
  const total = parts.reduce((s, p) => s + p.count, 0);
  const position = new Float32Array(total * 3), normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2), color = new Float32Array(total * 3);
  const skinIndex = new Uint16Array(total * 4), skinWeight = new Float32Array(total * 4);
  const buckets = materialOrder.map(() => []);
  let base = 0;
  for (const part of parts) {
    const mi = materialOrder.indexOf(part.material);
    if (mi < 0) throw new Error(`human: part ${part.name} uses unknown material ${part.material}`);
    position.set(part.pos, base * 3);
    normal.set(part.normals(), base * 3);
    uv.set(part.uv, base * 2);
    for (let v = 0; v < part.count; v++) {
      const t = part.tint[v];
      color[(base + v) * 3] = color[(base + v) * 3 + 1] = color[(base + v) * 3 + 2] = t;
      resolveWeights(part.weights[v], boneIndex).forEach(([i, w], k) => {
        skinIndex[(base + v) * 4 + k] = i;
        skinWeight[(base + v) * 4 + k] = w;
      });
    }
    for (const i of part.idx) buckets[mi].push(i + base);
    base += part.count;
  }
  const index = new Uint32Array(buckets.reduce((s, b) => s + b.length, 0));
  const groups = [];
  let start = 0;
  buckets.forEach((b, materialIndex) => {
    if (!b.length) return;
    index.set(b, start);
    groups.push({ start, count: b.length, materialIndex });
    start += b.length;
  });
  return { position, normal, uv, color, skinIndex, skinWeight, index, groups, count: total };
}
