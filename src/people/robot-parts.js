import { add, cross, dot, norm, scale, sub } from './human/kit.js';
import { Part } from './human/kit.js';

/**
 * A builder for rigid machine parts on the man's rig: chamfered boxes, and
 * lathed cylinders, cones, domes and rings, each bound whole to one bone, so
 * it moves with that bone and does not bend. Everything is placed in the man's
 * rest pose (metres), taking his joints and surface as the guide.
 *
 * Edges are real geometry (a chamfer strip between faces, with normals given
 * for each flat), so they catch light as a machined edge does. Texture
 * coordinates are planar in metres, so a brushed grain keeps its scale.
 */

const IDENTITY = Object.freeze({ x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] });

/** A frame whose y runs from `a` to `b`, its x as near `ref` as it can be. */
export function along(a, b, ref = [1, 0, 0]) {
  const y = norm(sub(b, a));
  let x = sub(ref, scale(y, dot(ref, y)));
  if (dot(x, x) < 1e-6) x = sub([0, 0, 1], scale(y, y[2]));
  x = norm(x);
  return { x, y, z: cross(x, y) };
}

export class Mech {
  constructor() { this.byMaterial = new Map(); }

  part(material) {
    if (!this.byMaterial.has(material)) this.byMaterial.set(material, new Part(`robot ${material}`, material));
    return this.byMaterial.get(material);
  }

  get parts() { return [...this.byMaterial.values()]; }

  /** A flat quad (corners P00 P01 P10 P11, as a grid's) facing `n`. */
  quad(material, bone, P00, P01, P10, P11, n) {
    const part = this.part(material);
    const flip = dot(cross(sub(P10, P00), sub(P01, P00)), n) < 0;
    const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const t1 = norm(cross(up, n)), t2 = cross(n, t1);
    const P = [[P00, P01], [P10, P11]];
    part.grid(1, 1, (i, j) => ({ p: P[i][j], w: { [bone]: 1 }, n, uv: [dot(P[i][j], t1) * 3, dot(P[i][j], t2) * 3] }), { flip });
  }

  tri(material, bone, A, B, C, n) {
    const part = this.part(material);
    const flip = dot(cross(sub(B, A), sub(C, A)), n) < 0;
    const ids = [A, B, C].map((p) => part.vertex(p, [p[0] * 3, p[1] * 3], { [bone]: 1 }, 1, n));
    part.idx.push(...(flip ? [ids[0], ids[2], ids[1]] : ids));
  }

  /** A box of half-extents `H` at `c`, oriented by `f` ({x, y, z}), its edges chamfered `bevel`. */
  box(material, bone, c, H, { f = IDENTITY, bevel = 0.005 } = {}) {
    const E = [f.x, f.y, f.z];
    const bv = Math.min(bevel, ...H.map((h) => h * 0.45));
    const pt = (q) => add(c, add(scale(E[0], q[0]), add(scale(E[1], q[1]), scale(E[2], q[2]))));
    for (let a = 0; a < 3; a++) {
      for (const s of [1, -1]) {
        const t1 = (a + 1) % 3, t2 = (a + 2) % 3;
        const at = (u1, u2, depth = H[a]) => { const q = [0, 0, 0]; q[a] = s * depth; q[t1] = u1; q[t2] = u2; return pt(q); };
        const h1 = H[t1] - bv, h2 = H[t2] - bv;
        this.quad(material, bone, at(-h1, -h2), at(-h1, h2), at(h1, -h2), at(h1, h2), scale(E[a], s));
        for (const b of [t1, t2]) {
          if (a > b) continue;
          const o = b === t1 ? t2 : t1, ho = H[o] - bv;
          for (const e of [1, -1]) {
            const mk = (axB, depthA, uo) => { const q = [0, 0, 0]; q[a] = s * depthA; q[b] = e * axB; q[o] = uo; return pt(q); };
            this.quad(material, bone, mk(H[b] - bv, H[a], -ho), mk(H[b] - bv, H[a], ho), mk(H[b], H[a] - bv, -ho), mk(H[b], H[a] - bv, ho), norm(add(scale(E[a], s), scale(E[b], e))));
          }
        }
      }
    }
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
      const X = pt([sx * H[0], sy * (H[1] - bv), sz * (H[2] - bv)]);
      const Y = pt([sx * (H[0] - bv), sy * H[1], sz * (H[2] - bv)]);
      const Z = pt([sx * (H[0] - bv), sy * (H[1] - bv), sz * H[2]]);
      this.tri(material, bone, X, Y, Z, norm(add(add(scale(E[0], sx), scale(E[1], sy)), scale(E[2], sz))));
    }
  }

  /**
   * A solid of revolution about the line `p0` to `p1`: `profile` is [[s, r], ...], s along it (metres from
   * `p0`), r the radius there. A cylinder is [[0,0],[0,r],[L,r],[L,0]]; chamfers and domes are more points.
   */
  lathe(material, bone, p0, p1, profile, { segs = 18, ref = [1, 0, 0], squash = 1, arc = [0, Math.PI * 2] } = {}) {
    const a = norm(sub(p1, p0));
    const u = norm(sub(ref, scale(a, dot(ref, a))));
    const v = cross(a, u);
    const part = this.part(material);
    const n = profile.length;
    const ds = (i) => { const p = profile[Math.max(0, i - 1)], q = profile[Math.min(n - 1, i + 1)]; return [q[0] - p[0], q[1] - p[1]]; };
    part.grid(n - 1, segs, (i, j) => {
      const th = arc[0] + (j / segs) * (arc[1] - arc[0]);
      const [s, r] = profile[i];
      const [dS, dR] = ds(i), l = Math.hypot(dS, dR) || 1;
      const p = add(add(p0, scale(a, s)), scale(add(scale(u, Math.cos(th)), scale(v, Math.sin(th) * squash)), r));
      const radN = add(scale(u, Math.cos(th)), scale(v, Math.sin(th) / squash));
      return { p, w: { [bone]: 1 }, n: norm(add(scale(radN, dS / l), scale(a, -dR / l))), uv: [(dot(p, u) + dot(p, v)) * 3, s * 3] };
    }, { flip: true });
  }

  /**
   * A shell lofted through cross-sections up the y axis: `rings` is [{ y, w, d, cx, cz, n }, ...] (bottom to top), each a
   * superellipse of half-width `w` and half-depth `d` about (cx, cz); `n` is its squareness (2 an ellipse, 4 a rounded
   * square, higher boxier). Closed at either end by default.
   */
  loft(material, bone, rings, { segs = 28, capTop = true, capBottom = true } = {}) {
    const part = this.part(material);
    const sg = (x) => (x < 0 ? -1 : 1);
    const at = (r, j) => {
      const th = (j / segs) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), e = 2 / (r.n ?? 2);
      return [(r.cx ?? 0) + r.w * sg(c) * Math.abs(c) ** e, r.y, (r.cz ?? 0) + r.d * sg(sn) * Math.abs(sn) ** e];
    };
    part.grid(rings.length - 1, segs, (i, j) => {
      const p = at(rings[i], j);
      return { p, w: { [bone]: 1 }, uv: [p[0] * 3 + p[2] * 3, p[1] * 3] };
    });
    const cap = (r, up) => {
      const c = [r.cx ?? 0, r.y, r.cz ?? 0];
      for (let j = 0; j < segs; j++) this.tri(material, bone, c, at(r, j), at(r, j + 1), [0, up, 0]);
    };
    if (capTop) cap(rings[rings.length - 1], 1);
    if (capBottom) cap(rings[0], -1);
  }

  /** A cylinder from `p0` to `p1`, radius `r` (to `r1` if given), the ends chamfered `ch`. */
  cylinder(material, bone, p0, p1, r, { r1 = r, ch = 0.003, segs = 18, ref, squash = 1, rm = null } = {}) {
    const L = Math.hypot(...sub(p1, p0));
    const c = Math.min(ch, r * 0.4, r1 * 0.4, L * 0.3);
    const rounded = [[0, 0], [0, r - c], [c * 0.3, r - c * 0.1], [c, r]];
    if (rm != null) rounded.push([L * 0.5, rm]);
    this.lathe(material, bone, p0, p1, [...rounded, [L - c, r1], [L - c * 0.3, r1 - c * 0.1], [L, r1 - c], [L, 0]], { segs, ref, squash });
  }

  /** A ball (or a dome: `cut` of the way up). */
  sphere(material, bone, c, r, { segs = 18, rings = 9, axis = [0, 1, 0], ref } = {}) {
    const prof = [];
    for (let i = 0; i <= rings; i++) { const t = (i / rings) * Math.PI; prof.push([r - r * Math.cos(t), r * Math.sin(t)]); }
    const a = norm(axis);
    this.lathe(material, bone, sub(c, scale(a, r)), add(c, scale(a, r)), prof, { segs, ref });
  }

  /** A hex bolt head standing `h` off a surface at `p` facing `n`. */
  bolt(material, bone, p, n, r = 0.007, h = 0.004) {
    this.lathe(material, bone, p, add(p, scale(n, h)), [[0, 0], [0, r], [h * 0.7, r], [h, r * 0.75], [h, 0]], { segs: 6 });
  }

  /** A row of `count` slots (vents) across a face: dark recesses, as thin boxes. */
  vents(material, bone, c, f, count, { gap = 0.012, half = [0.03, 0.0025, 0.002] } = {}) {
    for (let i = 0; i < count; i++) this.box(material, bone, add(c, scale(f.y, (i - (count - 1) / 2) * gap)), half, { f, bevel: 0.0008 });
  }
}
