import { linearRGB } from './color.js';

/**
 * The geometry builder everything solid is drawn with. A model is a function
 * that calls `box`, `gable`, `cylinder` and the like on a `Mesher`, naming a
 * material for each part; the result is a template of vertex arrays (position,
 * normal, uv, colour) per material, which is stamped into a chunk's buffers
 * wherever the model stands. A chunk then draws in one call per material.
 *
 * Every shape is in the model's own frame: y up, the front toward +z, standing
 * on y = 0 with its middle at the origin.
 */

/** How many texture repeats a world unit is, by material: the bigger the number, the finer the weave. */
export const UV_SCALE = Object.freeze({
  plaster: 0.7, stone: 0.85, timber: 1, wood: 0.9, thatch: 1.1, tile: 1.25, slate: 1.25, metal: 1, dirt: 0.7, cloth: 1, brick: 0.9, bark: 1, hedge: 1.2,
});

const colorCache = new Map();
/** A colour as the linear RGB the vertex colours are in, from a hex string or an [r, g, b] already linear. */
export function rgb(c) {
  if (Array.isArray(c)) return c;
  let v = colorCache.get(c);
  if (!v) { v = linearRGB(c); colorCache.set(c, v); }
  return v;
}

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

/** m ∘ n: apply n first, then m. Matrices are [a b c / d e f / g h i] and a translation. */
function mul(m, n) {
  return [
    m[0] * n[0] + m[1] * n[3] + m[2] * n[6], m[0] * n[1] + m[1] * n[4] + m[2] * n[7], m[0] * n[2] + m[1] * n[5] + m[2] * n[8],
    m[3] * n[0] + m[4] * n[3] + m[5] * n[6], m[3] * n[1] + m[4] * n[4] + m[5] * n[7], m[3] * n[2] + m[4] * n[5] + m[5] * n[8],
    m[6] * n[0] + m[7] * n[3] + m[8] * n[6], m[6] * n[1] + m[7] * n[4] + m[8] * n[7], m[6] * n[2] + m[7] * n[5] + m[8] * n[8],
    m[0] * n[9] + m[1] * n[10] + m[2] * n[11] + m[9], m[3] * n[9] + m[4] * n[10] + m[5] * n[11] + m[10], m[6] * n[9] + m[7] * n[10] + m[8] * n[11] + m[11],
  ];
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };

/** Smooth 3D value noise, 0..1: broad rolling lumps, not a different number at each point. */
function vn(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (i, j, k) => hash(xi + i + s, yi + j - s * 0.7, zi + k + s * 1.9);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v), l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
}

export class Mesher {
  constructor() {
    this.parts = {};
    this.m = IDENTITY;
    this.stack = [];
  }

  // ---------------------------------------------------------------- transforms

  push() { this.stack.push(this.m); return this; }
  pop() { this.m = this.stack.pop(); return this; }
  translate(x, y, z) { this.m = mul(this.m, [1, 0, 0, 0, 1, 0, 0, 0, 1, x, y, z]); return this; }
  rotateY(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, 0, s, 0, 1, 0, -s, 0, c, 0, 0, 0]); return this; }
  rotateX(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [1, 0, 0, 0, c, -s, 0, s, c, 0, 0, 0]); return this; }
  rotateZ(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, -s, 0, s, c, 0, 0, 0, 1, 0, 0, 0]); return this; }
  scale(x, y = x, z = x) { this.m = mul(this.m, [x, 0, 0, 0, y, 0, 0, 0, z, 0, 0, 0]); return this; }
  /** Runs `fn` with a transform, and puts the transform back after. */
  at(x, y, z, fn, yaw = 0) { this.push().translate(x, y, z); if (yaw) this.rotateY(yaw); fn(this); return this.pop(); }

  tp(p) {
    const m = this.m;
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[9], m[3] * p[0] + m[4] * p[1] + m[5] * p[2] + m[10], m[6] * p[0] + m[7] * p[1] + m[8] * p[2] + m[11]];
  }

  tn(n) {
    const m = this.m;
    return norm([m[0] * n[0] + m[1] * n[1] + m[2] * n[2], m[3] * n[0] + m[4] * n[1] + m[5] * n[2], m[6] * n[0] + m[7] * n[1] + m[8] * n[2]]);
  }

  part(mat) {
    return (this.parts[mat] ??= { pos: [], nor: [], uv: [], col: [] });
  }

  // ---------------------------------------------------------------- primitives

  /**
   * A triangle, a b c counter-clockwise seen from outside. `o`: `normals` (per
   * vertex, for smooth shading), `uv` (per vertex), `colors` (per vertex),
   * `shade` (a brightness to multiply the colour by).
   */
  tri(mat, a, b, c, col, o = {}) {
    const A = this.tp(a), B = this.tp(b), C = this.tp(c);
    const raw = cross(sub(B, A), sub(C, A));
    if (Math.hypot(raw[0], raw[1], raw[2]) < 1e-9) return this;
    const n = norm(raw);
    const p = this.part(mat);
    const normals = o.normals ? o.normals.map((v) => this.tn(v)) : [n, n, n];
    let uvs = o.uv;
    if (!uvs) {
      const s = o.uvScale ?? UV_SCALE[mat] ?? 1;
      const e1 = norm(sub(B, A));
      let e2 = norm(cross(n, e1));
      if (e2[1] < 0 && Math.abs(n[1]) < 0.9) e2 = [-e2[0], -e2[1], -e2[2]];
      const ox = hash(A[0], A[1], A[2]), oy = hash(A[2], A[0], A[1]);
      uvs = [A, B, C].map((P) => { const d = sub(P, A); return [dot(d, e1) * s + ox * 4, dot(d, e2) * s + oy * 4]; });
    }
    const k = o.shade ?? 1;
    [A, B, C].forEach((P, i) => {
      const cc = o.colors ? rgb(o.colors[i]) : rgb(col);
      p.pos.push(P[0], P[1], P[2]);
      p.nor.push(normals[i][0], normals[i][1], normals[i][2]);
      p.uv.push(uvs[i][0], uvs[i][1]);
      p.col.push(cc[0] * k, cc[1] * k, cc[2] * k);
    });
    return this;
  }

  /** A quad a b c d counter-clockwise seen from outside, as two triangles. */
  quad(mat, a, b, c, d, col, o = {}) {
    const A = this.tp(a), B = this.tp(b), D = this.tp(d);
    // One set of texture coordinates for the whole quad, from its own edges.
    let uv = o.uv;
    if (!uv) {
      const s = o.uvScale ?? UV_SCALE[mat] ?? 1;
      const n = norm(cross(sub(B, A), sub(D, A)));
      const e1 = norm(sub(B, A));
      let e2 = norm(cross(n, e1));
      if (e2[1] < 0 && Math.abs(n[1]) < 0.9) e2 = [-e2[0], -e2[1], -e2[2]];
      const ox = hash(A[0], A[1], A[2]), oy = hash(A[2], A[0], A[1]);
      uv = [a, b, c, d].map((P) => { const d2 = sub(this.tp(P), A); return [dot(d2, e1) * s + ox * 4, dot(d2, e2) * s + oy * 4]; });
    }
    const cs = o.colors;
    const nr = o.normals;
    this.tri(mat, a, b, c, col, { ...o, uv: [uv[0], uv[1], uv[2]], colors: cs && [cs[0], cs[1], cs[2]], normals: nr && [nr[0], nr[1], nr[2]] });
    this.tri(mat, a, c, d, col, { ...o, uv: [uv[0], uv[2], uv[3]], colors: cs && [cs[0], cs[2], cs[3]], normals: nr && [nr[0], nr[2], nr[3]] });
    return this;
  }

  /** A box from (x0, y0, z0) to (x1, y1, z1). `o.skip` names faces to leave out (bottom is left out unless asked for). */
  box(mat, x0, y0, z0, x1, y1, z1, col, o = {}) {
    const skip = new Set(o.skip ?? ['bottom']);
    const c = (f) => o[f] ?? col;
    if (!skip.has('front')) this.quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c('front'), o);
    if (!skip.has('back')) this.quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], c('back'), o);
    if (!skip.has('right')) this.quad(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], c('right'), o);
    if (!skip.has('left')) this.quad(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c('left'), o);
    if (!skip.has('top')) this.quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], c('top'), o);
    if (!skip.has('bottom')) this.quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c('bottom'), o);
    return this;
  }

  /** A box about a middle point. */
  block(mat, cx, y0, cz, w, h, d, col, o) {
    return this.box(mat, cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, col, o);
  }

  /**
   * A roof slope with some thickness: the top quad a b c d (counter-clockwise
   * seen from above), its underside `thick` below, and an edge face along each
   * of the edges named in `edges` (0 is a-b, 1 is b-c, 2 is c-d, 3 is d-a). A
   * bare sheet is drawn from one side only, so from the other the slope
   * vanishes, and the overhang at a gable end has nothing to show.
   */
  slab(mat, a, b, c, d, col, thick, edges, o = {}) {
    const top = [a, b, c, d];
    const down = ([x, y, z]) => [x, y - thick, z];
    const under = top.map(down);
    this.quad(mat, top[0], top[1], top[2], top[3], o.topCol ?? col, o);
    this.quad(mat, under[3], under[2], under[1], under[0], col, { ...o, shade: 0.75 });
    const mid = [0, 1, 2].map((i) => (a[i] + b[i] + c[i] + d[i]) / 4);
    for (const e of edges) {
      const p = top[e], q = top[(e + 1) % 4], p2 = under[e], q2 = under[(e + 1) % 4];
      const n = cross(sub(q, p), sub(p2, p));
      const out = sub([(p[0] + q[0]) / 2, 0, (p[2] + q[2]) / 2], [mid[0], 0, mid[2]]);
      if (dot(n, out) < 0) this.quad(mat, p, p2, q2, q, col, { ...o, shade: 0.85 });
      else this.quad(mat, q, q2, p2, p, col, { ...o, shade: 0.85 });
    }
    return this;
  }

  /**
   * A gabled roof over (x0, z0) to (x1, z1), its eaves at `yEave` and its ridge
   * at `yRidge`, running along x (or z, with `axis: 'z'`). It overhangs by `over`
   * and is `thick` through (0.06). Gable ends are filled in with `o.gable` (a
   * material) in `o.gableColor`.
   */
  gable(mat, x0, z0, x1, z1, yEave, yRidge, col, o = {}) {
    const over = o.over ?? 0.1;
    const alongZ = o.axis === 'z';
    const [a0, a1, b0, b1] = alongZ ? [z0, z1, x0, x1] : [x0, x1, z0, z1];
    const mid = (b0 + b1) / 2;
    const rise = (yRidge - yEave) / ((b1 - b0) / 2);
    const yo = yEave - rise * over;
    const P = (a, b, y) => (alongZ ? [b, y, a] : [a, y, b]);
    const A0 = a0 - over, A1 = a1 + over, B0 = b0 - over, B1 = b1 + over;
    // The two slopes (normals up and out), each with its underside and the edges at the eaves and the gable ends.
    const thick = o.thick ?? 0.06;
    const side = [0, 1, 3];
    if (alongZ) {
      this.slab(mat, P(A1, B1, yo), P(A0, B1, yo), P(A0, mid, yRidge), P(A1, mid, yRidge), col, thick, side, o);
      this.slab(mat, P(A0, B0, yo), P(A1, B0, yo), P(A1, mid, yRidge), P(A0, mid, yRidge), col, thick, side, o);
    } else {
      this.slab(mat, P(A0, B1, yo), P(A1, B1, yo), P(A1, mid, yRidge), P(A0, mid, yRidge), col, thick, side, o);
      this.slab(mat, P(A1, B0, yo), P(A0, B0, yo), P(A0, mid, yRidge), P(A1, mid, yRidge), col, thick, side, o);
    }
    // The gable ends, flush with the walls.
    if (o.gable) {
      const gc = o.gableColor ?? col;
      const E0 = a0 + (o.gableIn ?? 0), E1 = a1 - (o.gableIn ?? 0);
      const apex = yRidge;
      const base = yEave;
      if (alongZ) {
        this.tri(o.gable, P(E1, b1, base), P(E1, mid, apex), P(E1, b0, base), gc, { uvScale: o.gableScale });
        this.tri(o.gable, P(E0, b0, base), P(E0, mid, apex), P(E0, b1, base), gc, { uvScale: o.gableScale });
      } else {
        this.tri(o.gable, P(E1, b0, base), P(E1, mid, apex), P(E1, b1, base), gc, { uvScale: o.gableScale });
        this.tri(o.gable, P(E0, b1, base), P(E0, mid, apex), P(E0, b0, base), gc, { uvScale: o.gableScale });
      }
    }
    if (o.ridge) {
      const r = o.ridge;
      const hr = 0.035;
      if (alongZ) this.box(r.mat ?? 'wood', mid - hr, yRidge - 0.01, A0 - 0.01, mid + hr, yRidge + 0.05, A1 + 0.01, r.col ?? col, { skip: ['bottom'] });
      else this.box(r.mat ?? 'wood', A0 - 0.01, yRidge - 0.01, mid - hr, A1 + 0.01, yRidge + 0.05, mid + hr, r.col ?? col, { skip: ['bottom'] });
    }
    return this;
  }

  /** A hipped roof: four slopes meeting at a ridge as long as the building is longer than it is wide. */
  hip(mat, x0, z0, x1, z1, yEave, yRidge, col, o = {}) {
    const over = o.over ?? 0.1;
    const w = x1 - x0, d = z1 - z0;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const half = Math.min(w, d) / 2;
    const rise = (yRidge - yEave) / half;
    const yo = yEave - rise * over;
    const X0 = x0 - over, X1 = x1 + over, Z0 = z0 - over, Z1 = z1 + over;
    const along = Math.max(w, d) / 2 - half;
    const wide = w >= d;
    const Ra = wide ? [cx - along, yRidge, cz] : [cx, yRidge, cz - along];
    const Rb = wide ? [cx + along, yRidge, cz] : [cx, yRidge, cz + along];
    // Each face is a quad up to the ridge; where the ridge ends in a point the quad is a triangle.
    const thick = o.thick ?? 0.06;
    this.slab(mat, [X0, yo, Z1], [X1, yo, Z1], Rb, wide ? Ra : Rb, col, thick, [0], o);
    this.slab(mat, [X1, yo, Z0], [X0, yo, Z0], Ra, wide ? Rb : Ra, col, thick, [0], o);
    this.slab(mat, [X1, yo, Z1], [X1, yo, Z0], wide ? Rb : Ra, wide ? Rb : Rb, col, thick, [0], o);
    this.slab(mat, [X0, yo, Z0], [X0, yo, Z1], wide ? Ra : Rb, wide ? Ra : Ra, col, thick, [0], o);
    return this;
  }

  /** A cone or a pyramid (few sides) on a base of radius r, from y0 to y1. */
  cone(mat, cx, y0, cz, r, y1, sides, col, o = {}) {
    return this.cylinder(mat, cx, y0, cz, o.top ?? 0, r, y1 - y0, sides, col, { ...o, caps: false });
  }

  /**
   * An upright cylinder (or a cone, with rTop 0, or a cone frustum) from y0 up h.
   * `smooth` shades it round; `caps` closes the top and the bottom.
   */
  cylinder(mat, cx, y0, cz, rTop, rBot, h, sides, col, o = {}) {
    const smooth = o.smooth ?? sides > 6;
    const rot = o.rot ?? 0;
    const ang = (i) => rot + (i / sides) * Math.PI * 2;
    const slope = (rBot - rTop) / (h || 1);
    for (let i = 0; i < sides; i++) {
      const a0 = ang(i), a1 = ang(i + 1);
      const p = (a, r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      const nrm = (a) => norm([Math.cos(a), slope, Math.sin(a)]);
      const am = (a0 + a1) / 2;
      const nm = nrm(am);
      const normalsAt = smooth ? [nrm(a1), nrm(a0)] : [nm, nm];
      // Wound so the outside faces out.
      if (rTop > 1e-6) {
        this.quad(mat, p(a1, rBot, y0), p(a0, rBot, y0), p(a0, rTop, y0 + h), p(a1, rTop, y0 + h), col, {
          ...o, normals: smooth ? [normalsAt[0], normalsAt[1], normalsAt[1], normalsAt[0]] : undefined,
        });
      } else {
        this.tri(mat, p(a1, rBot, y0), p(a0, rBot, y0), [cx, y0 + h, cz], col, { ...o, normals: smooth ? [normalsAt[0], normalsAt[1], nrm(am)] : undefined });
      }
      if (o.caps !== false) {
        if (rTop > 1e-6) this.tri(o.capMat ?? mat, [cx, y0 + h, cz], p(a1, rTop, y0 + h), p(a0, rTop, y0 + h), o.capCol ?? col, { ...o, normals: [[0, 1, 0], [0, 1, 0], [0, 1, 0]] });
        if (o.bottom) this.tri(mat, [cx, y0, cz], p(a0, rBot, y0), p(a1, rBot, y0), col, { ...o, normals: [[0, -1, 0], [0, -1, 0], [0, -1, 0]] });
      }
    }
    return this;
  }

  /** An ellipsoid: an icosphere's worth of triangles, shaded round. `detail` 0 is 20 triangles, 1 is 80. */
  sphere(mat, cx, cy, cz, rx, ry, rz, col, o = {}) {
    const g = icosphere(o.detail ?? 1);
    const jit = o.jitter ?? 0;
    const seed = o.seed ?? 0;
    for (const [a, b, c] of g.faces) {
      const v = [a, b, c].map((i) => g.verts[i]);
      const colors = [a, b, c].map((i) => {
        const base = rgb(o.colorFn ? o.colorFn(g.verts[i]) : col);
        const f = 1 + (hash(g.verts[i][0] * 9 + seed, g.verts[i][1] * 9, g.verts[i][2] * 9) - 0.5) * jit;
        const up = o.light ? 1 + g.verts[i][1] * o.light : 1;
        return [base[0] * f * up, base[1] * f * up, base[2] * f * up];
      });
      this.tri(mat, [cx + v[0][0] * rx, cy + v[0][1] * ry, cz + v[0][2] * rz], [cx + v[1][0] * rx, cy + v[1][1] * ry, cz + v[1][2] * rz], [cx + v[2][0] * rx, cy + v[2][1] * ry, cz + v[2][2] * rz], col, {
        ...o, colors, normals: o.flat ? undefined : v.map((p) => norm([p[0] / rx, p[1] / ry, p[2] / rz])),
      });
    }
    return this;
  }

  /**
   * A rock: an icosphere pushed out of shape by layered noise (broad lumps, a
   * ridged layer for the crags and a fine one for the pitting), a few flat
   * faces knocked off it where it broke (`cuts`) with their edges worn a little
   * round, and a flat base (`base`, how far down it is cut as a share of `ry`)
   * to sit in the ground. It is shaded smooth and its texture is projected from
   * the side it faces, so the grain runs on across the triangles. It is coloured
   * in tilted bands of strata, darker in its hollows and underneath, paler on its
   * shoulders, with lichen and a little moss on top (`lichen`, 0..1).
   * Its detail is a step finer than `detail` says. `o.seed` makes another rock of
   * the same size; `o.colorFn(dir, lump, grain, y)` may return a colour for a
   * point of the surface, for veins and stains.
   */
  rock(mat, cx, cy, cz, rx, ry, rz, col, o = {}) {
    const g = icosphere(Math.min(4, (o.detail ?? 1) + 1));
    const seed = o.seed ?? 0, rough = o.rough ?? 0.3, base = o.base ?? 0.45, lichen = o.lichen ?? 0.5;
    const base3 = rgb(col);
    const cuts = [];
    for (let k = 0; k < (o.cuts ?? 4); k++) {
      const a = hash(seed + k * 1.7, 2.1, k) * Math.PI * 2, e = (hash(seed, k * 3.3, 5.7) - 0.2) * 1.4;
      cuts.push({ n: [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)], d: 0.7 + hash(k, seed * 1.3, 8.1) * 0.2 });
    }
    const pts = [], cols = [];
    for (const d of g.verts) {
      // Warp the point first, so the crags wander and are not a lattice's grain.
      const wx = d[0] + (vn(d[0] * 2 + 9, d[1] * 2, d[2] * 2, seed + 13) - 0.5) * 0.5, wy = d[1] + (vn(d[0] * 2, d[1] * 2 + 9, d[2] * 2, seed + 17) - 0.5) * 0.5, wz = d[2] + (vn(d[0] * 2, d[1] * 2, d[2] * 2 + 9, seed + 19) - 0.5) * 0.5;
      const lump = vn(wx * 1.4 + 5, wy * 1.4 + 5, wz * 1.4 + 5, seed);
      const ridge = 1 - Math.abs(vn(wx * 3.2, wy * 3.2, wz * 3.2, seed + 3) * 2 - 1);
      const pit = vn(wx * 9, wy * 9, wz * 9, seed + 7);
      let r = 1 + rough * ((lump - 0.5) * 1.8 + (ridge - 0.5) * 0.9 + (pit - 0.5) * 0.25);
      // Past a cut plane the surface is the plane, but the edge is eased so it is worn and not a blade.
      for (const c of cuts) {
        const dp = d[0] * c.n[0] + d[1] * c.n[1] + d[2] * c.n[2];
        if (dp > 0.01) {
          const over = r * dp - c.d;
          if (over > -0.08) r = (c.d + (over > 0.08 ? 0 : over - (over + 0.08) * (over + 0.08) / 0.32)) / dp;
        }
      }
      const y = Math.max(d[1] * r, -base);
      pts.push([cx + d[0] * r * rx, cy + y * ry, cz + d[2] * r * rz]);
      const cavity = Math.max(0, Math.min(1, (lump - 0.3) * 1.6 + (ridge - 0.4) * 0.9));
      const strata = Math.sin((y * 5 + d[0] * 1.4 + seed) * 2.4 + lump * 3) * 0.5 + 0.5;
      const grain = vn(d[0] * 11 + seed, d[1] * 11, d[2] * 11, seed + 11);
      const low = Math.min(1, (y + base) / (1 + base));
      const k = (0.62 + 0.2 * strata + 0.28 * (grain - 0.5) + 0.34 * cavity + 0.12 * Math.max(0, d[1])) * (0.7 + 0.4 * low);
      let c = o.colorFn ? rgb(o.colorFn(d, lump, grain, y) ?? col) : base3;
      c = [c[0] * k, c[1] * k, c[2] * k];
      // Lichen sits on the upward shoulders in patches, a dull yellow-green; moss in the damp low hollows.
      const top = Math.max(0, d[1] - 0.15);
      const patch = Math.max(0, vn(d[0] * 4 + seed * 2, d[1] * 4, d[2] * 4, seed + 23) - 0.55) * 3;
      const lw = Math.min(0.6, patch * top * lichen * 1.4);
      const mw = Math.min(0.7, Math.max(0, 0.28 - low * 0.5) * lichen * 2 * (1.3 - cavity));
      if (lw > 0) c = [c[0] + (0.62 * k - c[0]) * lw, c[1] + (0.66 * k - c[1]) * lw, c[2] + (0.36 * k - c[2]) * lw];
      if (mw > 0) c = [c[0] + (0.26 * k - c[0]) * mw, c[1] + (0.34 * k - c[1]) * mw, c[2] + (0.14 * k - c[2]) * mw];
      cols.push(c);
    }
    return this.smoothSurface(mat, pts, cols, g.faces, col, o, true);
  }

  /**
   * Emits an indexed surface shaded smooth: each vertex takes the average of the
   * faces round it, and the texture is projected along each face's main axis so
   * the grain runs on across triangles. `skipDown` leaves out faces that look
   * straight down (the flat base of something set in the ground).
   */
  smoothSurface(mat, pts, cols, faces, col, o, skipDown) {
    const nor = pts.map(() => [0, 0, 0]);
    const drawn = [];
    for (const f of faces) {
      const [A, B, C] = f.map((i) => pts[i]);
      const n = cross(sub(B, A), sub(C, A));
      const len = Math.hypot(n[0], n[1], n[2]);
      if (len < 1e-12 || (skipDown && n[1] / len < -0.95)) continue;
      drawn.push(f);
      for (const i of f) { nor[i][0] += n[0]; nor[i][1] += n[1]; nor[i][2] += n[2]; }
    }
    const s = o.uvScale ?? UV_SCALE[mat] ?? 1;
    for (const f of drawn) {
      const [a, b, c] = f;
      const fn = cross(sub(pts[b], pts[a]), sub(pts[c], pts[a]));
      const ax = Math.abs(fn[0]), ay = Math.abs(fn[1]), az = Math.abs(fn[2]);
      const uvOf = (P) => (ay >= ax && ay >= az ? [P[0] * s, P[2] * s] : ax >= az ? [P[2] * s, P[1] * s] : [P[0] * s, P[1] * s]);
      this.tri(mat, pts[a], pts[b], pts[c], col, { ...o, colors: [cols[a], cols[b], cols[c]], normals: [norm(nor[a]), norm(nor[b]), norm(nor[c])], uv: [uvOf(pts[a]), uvOf(pts[b]), uvOf(pts[c])] });
    }
    return this;
  }

  /**
   * A crown of foliage: an ellipsoid made lumpy with clumps of leaves (`lump`,
   * how deep), shaded smooth, lit from above in its vertex colours: pale on top
   * and outermost, dark underneath and inside, a clump here and there lighter
   * or darker. `col` is near-white where a material colours the leaves.
   * `detail` is the icosphere's own (0 is 20 triangles, 1 is 80, 2 is 320).
   */
  crown(mat, cx, cy, cz, rx, ry, rz, col, o = {}) {
    const g = icosphere(o.detail ?? 1);
    const seed = o.seed ?? 0, lump = o.lump ?? 0.22;
    const c0 = rgb(col);
    const pts = [], cols = [];
    for (const d of g.verts) {
      const big = vn(d[0] * 1.8 + 3, d[1] * 1.8 + 3, d[2] * 1.8 + 3, seed);
      const clump = vn(d[0] * 5.6, d[1] * 5.6, d[2] * 5.6, seed + 5);
      const r = 1 + lump * ((big - 0.5) * 1.1 + (clump - 0.5) * 1.3);
      pts.push([cx + d[0] * r * rx, cy + d[1] * r * ry, cz + d[2] * r * rz]);
      const k = (0.6 + 0.55 * Math.max(-0.5, d[1]) + 0.8 * (clump - 0.5) + 0.25 * (big - 0.5)) * (0.78 + 0.3 * r);
      cols.push([c0[0] * k, c0[1] * k, c0[2] * k]);
    }
    return this.smoothSurface(mat, pts, cols, g.faces, col, o, false);
  }

  /**
   * One tier of a conifer: a cone of radius `r` from its tip at `y0 + h` down to
   * its drooping, ragged skirt at `y0`, with the underside tucked back in
   * toward the trunk and dark. `sides` is how many boughs round the edge.
   */
  bough(mat, cx, y0, cz, r, h, sides, col, o = {}) {
    const seed = o.seed ?? 0, c0 = rgb(col);
    const pts = [[cx, y0 + h, cz]], cols = [[c0[0] * 1.05, c0[1] * 1.05, c0[2] * 1.05]];
    const rings = 3;
    for (let q = 1; q <= rings; q++) {
      const f = q / rings;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 + (o.rot ?? 0);
        // Boughs alternate long and short and hang below the line of the cone; the skirt is ragged.
        const bough = f === 1 ? (i % 2 ? 1 : 0.8) * (0.88 + 0.24 * hash(i, seed, 2.5)) : 1;
        const rr = r * f * bough;
        const droop = f === 1 ? -h * 0.1 * (i % 2 ? 1 : 0.3) : 0;
        const wob = 1 + (vn(Math.cos(a) * 2 + f, f * 3, Math.sin(a) * 2, seed) - 0.5) * 0.12;
        pts.push([cx + Math.cos(a) * rr * wob, y0 + h * (1 - f) + droop, cz + Math.sin(a) * rr * wob]);
        const k = 0.88 + 0.42 * (1 - f) + 0.3 * (hash(i, q, seed) - 0.5);
        cols.push([c0[0] * k, c0[1] * k, c0[2] * k]);
      }
    }
    const faces = [];
    const ring = (q, i) => 1 + (q - 1) * sides + (i % sides);
    for (let i = 0; i < sides; i++) faces.push([0, ring(1, i + 1), ring(1, i)]);
    for (let q = 1; q < rings; q++) for (let i = 0; i < sides; i++) faces.push([ring(q, i), ring(q, i + 1), ring(q + 1, i)], [ring(q, i + 1), ring(q + 1, i + 1), ring(q + 1, i)]);
    // The underside: back in from the skirt to the trunk, dark.
    const inner = pts.length;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (o.rot ?? 0);
      pts.push([cx + Math.cos(a) * r * 0.12, y0 + h * 0.12, cz + Math.sin(a) * r * 0.12]);
      cols.push([c0[0] * 0.45, c0[1] * 0.45, c0[2] * 0.45]);
    }
    for (let i = 0; i < sides; i++) {
      const o0 = ring(rings, i), o1 = ring(rings, i + 1);
      cols[o0] = cols[o0].slice();
      faces.push([o0, o1, inner + ((i + 1) % sides)], [o0, inner + ((i + 1) % sides), inner + i]);
    }
    return this.smoothSurface(mat, pts, cols, faces, col, o, false);
  }

  /** A square beam from point a to point b, `t` thick. */
  beam(mat, a, b, t, col, o = {}) {
    const d = sub(b, a);
    const len = Math.hypot(...d);
    if (len < 1e-6) return this;
    const dir = [d[0] / len, d[1] / len, d[2] / len];
    const up = Math.abs(dir[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(dir, up)), v = cross(u, dir);
    const h = t / 2;
    const corner = (p, su, sv) => [p[0] + u[0] * h * su + v[0] * h * sv, p[1] + u[1] * h * su + v[1] * h * sv, p[2] + u[2] * h * su + v[2] * h * sv];
    // u × v runs against the beam, so this order goes counter-clockwise seen from its far end, which keeps the faces turned outward.
    const ring = (p) => [corner(p, -1, -1), corner(p, -1, 1), corner(p, 1, 1), corner(p, 1, -1)];
    const r0 = ring(a), r1 = ring(b);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      this.quad(mat, r0[i], r0[j], r1[j], r1[i], col, o);
    }
    this.quad(mat, r1[0], r1[1], r1[2], r1[3], col, o);
    this.quad(mat, r0[3], r0[2], r0[1], r0[0], col, o);
    return this;
  }

  /** A flat disc lying on y. */
  disc(mat, cx, y, cz, r, sides, col, o = {}) {
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2;
      this.tri(mat, [cx, y, cz], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r], [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], col, o);
    }
    return this;
  }

  /** A flat ring lying on y between two radii, its top facing up. */
  ring(mat, cx, y, cz, rIn, rOut, sides, col, o = {}) {
    const p = (a, r) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2;
      this.quad(mat, p(a1, rIn), p(a1, rOut), p(a0, rOut), p(a0, rIn), col, o);
    }
    return this;
  }

  /** The finished template: typed arrays per material. */
  finish() {
    const out = {};
    for (const [mat, p] of Object.entries(this.parts)) {
      if (!p.pos.length) continue;
      out[mat] = { pos: Float32Array.from(p.pos), nor: Float32Array.from(p.nor), uv: Float32Array.from(p.uv), col: Float32Array.from(p.col), count: p.pos.length / 3 };
    }
    return out;
  }
}

const spheres = new Map();
/** The unit sphere as an icosahedron, split `detail` times. */
function icosphere(detail) {
  if (spheres.has(detail)) return spheres.get(detail);
  const t = (1 + Math.sqrt(5)) / 2;
  let verts = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let d = 0; d < detail; d++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (cache.has(key)) return cache.get(key);
      const m = norm([(verts[a][0] + verts[b][0]) / 2, (verts[a][1] + verts[b][1]) / 2, (verts[a][2] + verts[b][2]) / 2]);
      verts.push(m);
      cache.set(key, verts.length - 1);
      return verts.length - 1;
    };
    const next = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }
  verts = verts.map((v) => v.slice());
  const out = { verts, faces };
  spheres.set(detail, out);
  return out;
}

// ---------------------------------------------------------------------- merging

/** A growing set of vertex arrays for one material: what a chunk's buildings are stamped into. */
export class Acc {
  constructor() { this.n = 0; this.pos = new Float32Array(3 * 4096); this.nor = new Float32Array(3 * 4096); this.uv = new Float32Array(2 * 4096); this.col = new Float32Array(3 * 4096); }

  reserve(extra) {
    const need = this.n + extra;
    if (need * 3 <= this.pos.length) return;
    let cap = this.pos.length / 3;
    while (cap < need) cap *= 2;
    const grow = (a, k) => { const b = new Float32Array(cap * k); b.set(a.subarray(0, this.n * k)); return b; };
    this.pos = grow(this.pos, 3); this.nor = grow(this.nor, 3); this.uv = grow(this.uv, 2); this.col = grow(this.col, 3);
  }

  /** Stamps a part of a template here: moved to (x, y, z), turned by `yaw` and made `scale` times the size, its colours multiplied by `tint`. */
  stamp(part, x, y, z, yaw = 0, scale = 1, tint = null) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    this.reserve(part.count);
    let o = this.n;
    for (let i = 0; i < part.count; i++, o++) {
      const px = part.pos[i * 3] * scale, py = part.pos[i * 3 + 1] * scale, pz = part.pos[i * 3 + 2] * scale;
      this.pos[o * 3] = px * c + pz * s + x;
      this.pos[o * 3 + 1] = py + y;
      this.pos[o * 3 + 2] = -px * s + pz * c + z;
      const nx = part.nor[i * 3], ny = part.nor[i * 3 + 1], nz = part.nor[i * 3 + 2];
      this.nor[o * 3] = nx * c + nz * s;
      this.nor[o * 3 + 1] = ny;
      this.nor[o * 3 + 2] = -nx * s + nz * c;
      this.uv[o * 2] = part.uv[i * 2];
      this.uv[o * 2 + 1] = part.uv[i * 2 + 1];
      this.col[o * 3] = part.col[i * 3] * (tint ? tint[0] : 1);
      this.col[o * 3 + 1] = part.col[i * 3 + 1] * (tint ? tint[1] : 1);
      this.col[o * 3 + 2] = part.col[i * 3 + 2] * (tint ? tint[2] : 1);
    }
    this.n = o;
  }

  get empty() { return this.n === 0; }

  /** A BufferGeometry of what is here (null if nothing is). */
  geometry(GFX) {
    if (!this.n) return null;
    const g = new GFX.BufferGeometry();
    g.setAttribute('position', new GFX.BufferAttribute(this.pos.slice(0, this.n * 3), 3));
    g.setAttribute('normal', new GFX.BufferAttribute(this.nor.slice(0, this.n * 3), 3));
    g.setAttribute('uv', new GFX.BufferAttribute(this.uv.slice(0, this.n * 2), 2));
    g.setAttribute('color', new GFX.BufferAttribute(this.col.slice(0, this.n * 3), 3));
    g.computeBoundingSphere();
    return g;
  }
}

/**
 * One part of a template (`Mesher.finish()[material]`) as an indexed
 * BufferGeometry, every corner the triangles share kept once: what an
 * InstancedMesh draws a model with. A smooth crown shares most of its
 * corners, so it is a fraction of the vertices the triangle list was.
 */
export function partGeometry(GFX, part) {
  const seen = new Map();
  const pos = [], nor = [], uv = [], col = [];
  const index = new Uint32Array(part.count);
  const q = (v) => Math.round(v * 1e5);
  for (let i = 0; i < part.count; i++) {
    const p = i * 3, t = i * 2;
    const key = `${q(part.pos[p])},${q(part.pos[p + 1])},${q(part.pos[p + 2])},${q(part.nor[p])},${q(part.nor[p + 1])},${q(part.nor[p + 2])},`
      + `${q(part.uv[t])},${q(part.uv[t + 1])},${q(part.col[p])},${q(part.col[p + 1])},${q(part.col[p + 2])}`;
    let k = seen.get(key);
    if (k === undefined) {
      k = pos.length / 3;
      seen.set(key, k);
      pos.push(part.pos[p], part.pos[p + 1], part.pos[p + 2]);
      nor.push(part.nor[p], part.nor[p + 1], part.nor[p + 2]);
      uv.push(part.uv[t], part.uv[t + 1]);
      col.push(part.col[p], part.col[p + 1], part.col[p + 2]);
    }
    index[i] = k;
  }
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
  g.setAttribute('color', new GFX.BufferAttribute(new Float32Array(col), 3));
  const n = pos.length / 3;
  g.setIndex(new GFX.BufferAttribute(n < 65536 ? Uint16Array.from(index) : index, 1));
  g.computeBoundingSphere();
  return g;
}

/** A set of accumulators, one per material. */
export class Batch {
  constructor() { this.accs = new Map(); }
  acc(mat) { let a = this.accs.get(mat); if (!a) { a = new Acc(); this.accs.set(mat, a); } return a; }
  /** Stamps a whole template. */
  stamp(template, x, y, z, yaw = 0, scale = 1, tint = null) {
    for (const [mat, part] of Object.entries(template)) this.acc(mat).stamp(part, x, y, z, yaw, scale, tint);
  }
  get empty() { return [...this.accs.values()].every((a) => a.empty); }
}
