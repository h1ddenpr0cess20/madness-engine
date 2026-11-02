import { rgb, shingles } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

/**
 * The birds, as one skeleton in different feathers: a body like an egg
 * lying on its side, the neck, a round head with its beak (the upper half
 * on the head, the lower on a jaw of its own), eyes set into the sides of
 * the head, two wings and a tail of real flight feathers, and the feet
 * tucked up under the tail. They are all flyers: the origin is the middle
 * of the body, the wings out in the rest pose, and every clip flaps.
 *
 * A wing is built the way a bird's is: the arm, the forearm and the hand
 * (three bones, so it folds on the upstroke), the leading edge along them,
 * then rows of feathers back from it — the long primaries fanning off the
 * hand, the secondaries off the forearm, the tertials by the body, the
 * coverts in rows over their roots and the small feathers along the front.
 * Each is a feather of its own, so the trailing edge is scalloped and the
 * tips can spread into fingers.
 *
 * `bird({ ... })` gives a model definition (sculpt units, +z the beak end):
 *
 *   body     { r: [half width, half height, half length] }
 *   head     { r, at: its middle }
 *   beak     { len, depth, width, tilt, curve, power, upper, lower, low: {len, depth, curve}, cere, nostrils }
 *   eye      { r, iris, pupil (0–1 of the iris), ring: colour of the bare ring round it, ringW, look: [x, y, z] }
 *   wing     { arm (how far out the hand reaches), chord (the secondaries' length), primary (the longest
 *              primary), nP, nS, fingers (0 tight, 1 spread at the tips), round (0 pointed, 1 round),
 *              dihedral, pattern (colour, p, n, [out, back], t) over every feather of it, colors: { leading, lesser, median, greater, tertials, secondaries, coverts
 *              (over the primaries), primaries } }
 *   tail     { len, width, count, spread, shape (fn of −1…1 across: its length, as a share), color }
 *   feet     { color, claw, zygo (two toes forward and two back, as a parrot's) }
 *   plumage  (p, n) the colour of the body, neck and head
 *   style    { rate, amp, fold, after(k, state, T) }
 *
 * A colour anywhere may be '#rrggbb', (p, n), or for a feather (p, n, t)
 * with t from its root (0) to its tip (1).
 */

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const C = (c) => (typeof c === 'string' ? rgb(c) : c);
const side = (m) => (m > 0 ? 'L' : 'R');

/** A colour, whatever it was given as, at p (n its normal, t along a feather). */
export function hue(c, p, n, t = 0, w = null) {
  return typeof c === 'function' ? c(p, n, t, w) : C(c);
}

/** Feathers' own shading: each feather a little lighter or darker, its edge picked out. */
export function plumed(fn, { size = 0.011, edge = 0.18, vary = 0.08 } = {}) {
  const cell = { height: 0, id: 0, edge: 0 };
  return (p, n) => {
    const c = hue(fn, p, n);
    shingles(p, size, 2, 1.5, cell);
    const k = 1 - edge * (1 - cell.edge) ** 2 + (cell.id - 0.5) * vary;
    return [c[0] * k, c[1] * k, c[2] * k];
  };
}

/** Blue-black to purple as the light catches it: the gloss on a crow, or a pigeon's neck (`a` and `b` the two). */
export function iridescent(a, b, base = null) {
  const A = C(a), B = C(b);
  return (p, n) => {
    const t = 0.5 + 0.5 * Math.sin(n[0] * 3.1 + n[2] * 2.3 + n[1] * 1.7 + p[1] * 30);
    const c = mix(A, B, t);
    return base ? mix(hue(base, p, n), c, 0.85) : c;
  };
}

export const FEATHERED = {
  feather: { roughness: 0.78, sheen: 0.3, sheenColor: '#9a9a9a', sheenRoughness: 0.5 },
  gloss: { roughness: 0.42, sheen: 1, sheenColor: '#6a7ad8', sheenRoughness: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  beak: { roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 },
  skin: { roughness: 0.62 },
  eye: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
  claw: { roughness: 0.3, clearcoat: 0.6 },
};

/** The rest-pose points a bird is built on, worked out from its numbers. */
export function birdFrame({ body = {}, head = {}, beak = {}, wing = {} } = {}) {
  const B = { r: [0.044, 0.046, 0.078], ...body };
  const Hd = { r: 0.026, at: [0, 0.058, 0.086], ...head };
  const Bk = { len: 0.04, depth: 0.016, width: 0.012, tilt: 0.12, ...beak };
  const W = { arm: 0.155, dihedral: 0.12, ...wing };
  // The base of the beak, where the mouth line meets the face.
  const base = add(Hd.at, [0, Hd.r * (Bk.y ?? -0.06), Hd.r * 0.84]);
  const wings = {};
  for (const m of [1, -1]) {
    const y = (x) => 0.024 + Math.max(0, x - 0.026) * W.dihedral;
    const at = (f, z) => { const x = 0.026 + (W.arm - 0.026) * f; return [m * x, y(x), z]; };
    wings[m] = { S: at(0, 0.026), E: at(0.3, 0.004), W: at(0.66, 0.02), H: at(1, 0.006) };
  }
  return { B, Hd, Bk, W, base, wings, neck: [0, 0.018, 0.046], tail: [0, -0.002, -B.r[2] * 0.86], hip: (m) => [m * 0.017, -B.r[1] * 0.62, -0.012] };
}

/**
 * One feather from its root `a` to its tip `b`, `w` across (half), `thick`
 * through, lying flat across `up`.
 */
function featherOf(s, a, b, w, thick, color, { up = [0, 1, 0], root = 0.62, tip = 1, bone, k = 0.0012, mat = 'feather' } = {}) {
  const ax = sub(b, a), l2 = dot(ax, ax);
  const col = typeof color === 'function' && color.length >= 3 ? (p, n) => color(p, n, clamp(dot(sub(p, a), ax) / l2)) : color;
  s.flake(a, b, up, w * root, w * tip, thick / (2 * w * Math.max(root, tip)), { color: col, mat, bone, k });
}

/** An eye's colour: the pupil in the middle of the iris, the iris brighter toward it and dark at its rim. */
function eyeColor(c, d, { iris, pupil = 0.42, size = 0.9 }) {
  const I = C(iris), deep = I.map((v) => v * 0.35), bright = I.map((v) => Math.min(1, v * 1.5 + 0.03)), black = C('#040304'), rim = C('#100c0c');
  return (p) => {
    const v = unit(sub(p, c));
    const a = Math.acos(clamp(dot(v, d), -1, 1));
    if (a > size) return rim;
    const r = a / size;
    let col = mix(bright, I, smooth(pupil, pupil + 0.3, r));
    col = mix(col, deep, smooth(0.8, 1, r));
    return mix(col, black, smooth(pupil + 0.04, pupil - 0.04, r));
  };
}

/** The Euler turn that stands a shape's y axis along d. */
const standAlong = (d) => [Math.acos(clamp(d[1], -1, 1)), Math.atan2(d[0], d[2]), 0];

/** Along a beak: from its base, bending down by `curve` over its length as s^power does. */
function beakPath(base, { len, tilt, curve, power = 1.5 }, n = 12) {
  const pts = [base], dirs = [];
  let p = base;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n, a = tilt + curve * s ** power;
    const d = [0, -Math.sin(a), Math.cos(a)];
    dirs.push(d);
    p = add(p, d, len / n);
    pts.push(p);
  }
  return { pts, dirs };
}

export function bird({
  name, scale = 1.5, cell = 0.0028, cells = {}, budget = 32000,
  body = {}, head = {}, beak = {}, eye = {}, wing = {}, tail = {}, feet = {},
  plumage = '#808080', mats = {}, materials = {}, extras = null, style = {},
}) {
  const F = birdFrame({ body, head, beak, wing });
  const { B, Hd, Bk, W, base } = F;
  const E = { r: Hd.r * 0.27, iris: '#2a1a12', pupil: 0.42, size: 0.95, ring: null, ringW: 0.22, look: [0.8, 0.14, 0.58], ...eye };
  const Wg = { chord: 0.066, primary: 0.1, nP: 9, nS: 9, fingers: 0, round: 0.4, thick: 0.0052, colors: {}, ...W };
  const Tl = { len: 0.08, width: 0.011, count: 12, spread: 0.42, shape: (f) => 1 - 0.25 * f * f, droop: 0.12, color: '#606060', ...tail };
  const Ft = { color: '#3a3a3e', claw: '#141214', zygo: false, ...feet };
  const M = { body: 'feather', head: 'feather', wing: 'feather', tail: 'feather', ...mats };
  const col = { leading: plumage, lesser: plumage, median: plumage, greater: plumage, tertials: plumage, secondaries: plumage, coverts: plumage, primaries: plumage, alula: null, ...Wg.colors };
  col.alula ??= col.coverts;
  const pl = (p, n) => hue(plumage, p, n);

  const bones = [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ['neck', 'body', F.neck],
    ['head', 'neck', add(Hd.at, [0, -Hd.r * 0.45, -Hd.r * 0.45])],
    ['jaw', 'head', base],
    ...[1, -1].flatMap((m) => {
      const w = F.wings[m], S = side(m);
      return [[`arm${S}`, 'body', w.S], [`fore${S}`, `arm${S}`, w.E], [`hand${S}`, `fore${S}`, w.W]];
    }),
    ['tail', 'body', F.tail],
    ['legL', 'body', F.hip(1)],
    ['legR', 'body', F.hip(-1)],
  ];

  return {
    name,
    scale,
    cell,
    cells: { beak: 0.0015, eyes: 0.0011, wings: 0.0024, feet: 0.0016, kit: 0.002, fine: 0.0016, ...cells },
    budget,
    blend: 0.2,
    bones,
    materials: { ...FEATHERED, ...materials },
    sculpt(s) {
      const P = { color: pl, mat: M.body };
      // ——— the body: an egg on its side, full in the breast, tapering to the tail.
      s.ellipsoid([0, 0, -0.004], B.r, { ...P, bone: 'body', k: 0.03 });
      s.ellipsoid([0, -B.r[1] * 0.12, B.r[2] * 0.42], [B.r[0] * 0.94, B.r[1] * 0.92, B.r[2] * 0.55], { ...P, bone: 'body', k: 0.03 });
      s.ellipsoid([0, B.r[1] * 0.1, -B.r[2] * 0.62], [B.r[0] * 0.66, B.r[1] * 0.56, B.r[2] * 0.5], { ...P, bone: 'body', k: 0.03 });
      // The shoulders, where the wings come out.
      s.mirror((m) => s.ellipsoid([m * B.r[0] * 0.62, B.r[1] * 0.42, B.r[2] * 0.3], [B.r[0] * 0.42, B.r[1] * 0.38, B.r[2] * 0.4], { ...P, bone: 'body', k: 0.025 }));
      // The coverts over the root of the tail, going with it.
      s.flake([0, B.r[1] * 0.18, -B.r[2] * 0.6], add(F.tail, [0, 0.002, -Tl.len * 0.3]), [0, 1, 0], B.r[0] * 0.55, Tl.width * 1.6, 0.45, { ...P, bone: [['body', 0.4], ['tail', 0.6]], k: 0.018 });
      s.flake([0, -B.r[1] * 0.4, -B.r[2] * 0.55], add(F.tail, [0, -0.004, -Tl.len * 0.25]), [0, 1, 0], B.r[0] * 0.5, Tl.width * 1.4, 0.4, { ...P, bone: [['body', 0.4], ['tail', 0.6]], k: 0.018 });
      // The neck, up and forward to the head.
      s.limb(add(F.neck, [0, -0.004, -0.006]), add(Hd.at, [0, -Hd.r * 0.35, -Hd.r * 0.4]), B.r[0] * 0.66, Hd.r * 0.82, { ...P, bone: 'neck', k: 0.024 });

      // ——— the head (on the same grid as the body, small as it is, so the neck has no seam): the crown, the brow
      // down to the beak, the face narrowing into it, the cheeks, the throat.
      {
        const Hc = { color: pl, mat: M.head, bone: 'head' };
        s.ellipsoid(Hd.at, [Hd.r * 0.9, Hd.r * (Hd.crown ?? 0.84), Hd.r * 1.06], { ...Hc, k: 0.012 });
        // The brow, sloping down into the top of the beak.
        s.ellipsoid(add(Hd.at, [0, Hd.r * 0.08, Hd.r * 0.56]), [Hd.r * 0.58, Hd.r * 0.56, Hd.r * 0.6], { ...Hc, k: 0.012 });
        s.mirror((m) => s.ellipsoid(add(Hd.at, [m * Hd.r * 0.42, -Hd.r * 0.28, Hd.r * 0.42]), [Hd.r * 0.5, Hd.r * 0.52, Hd.r * 0.58], { ...Hc, k: 0.01 }));
        s.ellipsoid(add(Hd.at, [0, -Hd.r * 0.55, Hd.r * 0.42]), [Hd.r * 0.5, Hd.r * 0.42, Hd.r * 0.6], { ...Hc, k: 0.01 });
        s.limb(add(Hd.at, [0, -Hd.r * 0.05, Hd.r * 0.3]), add(base, [0, Bk.depth * 0.42, -Bk.len * 0.06]), Hd.r * 0.6, Bk.depth * 0.52, { ...Hc, k: 0.008 });
      }

      // ——— the beak: the upper half on the head, curving down to its tip; the lower on the jaw.
      const up = beakPath(add(base, [0, Bk.depth * 0.02, 0]), Bk);
      const lo = { len: 0.86, depth: 0.42, curve: Bk.curve * 0.4, tilt: Bk.tilt, ...Bk.low };
      const down = beakPath(base, { len: Bk.len * lo.len, tilt: lo.tilt, curve: lo.curve, power: 1.2 });
      const nU = up.pts.length - 1;
      s.part('beak', () => {
        for (let i = 0; i < nU; i++) {
          const s0 = i / nU, s1 = (i + 1) / nU;
          const h = (q) => Bk.depth * 0.5 * (1 - q) ** 0.85 + 0.0009, w = (q) => Bk.width * 0.5 * (1 - q) ** 0.75 + 0.0009;
          // Above the mouth line by its own half depth: the line is its lower edge.
          const n0 = [0, up.dirs[i][2], up.dirs[i][1] * -1], n1 = [0, up.dirs[Math.min(i + 1, nU - 1)][2], -up.dirs[Math.min(i + 1, nU - 1)][1]];
          const a = add(up.pts[i], n0, h(s0) * 0.92), b = add(up.pts[i + 1], n1, h(s1) * 0.92);
          s.flake(a, b, [1, 0, 0], h(s0), h(s1), (w(s0) + w(s1)) / (h(s0) + h(s1)), { color: (p, n) => hue(Bk.upper, p, n, s0), mat: 'beak', bone: 'head', k: i === 0 ? 0.004 : 0.0015 });
        }
        // A parrot's beak is heavy at the base: the top of it swells over the mouth line.
        if (Bk.bulk) {
          const d0 = up.dirs[2], nn = [0, d0[2], -d0[1]];
          s.ellipsoid(add(up.pts[3], nn, Bk.depth * 0.5), [Bk.width * 0.5, Bk.depth * 0.5 * Bk.bulk, Bk.len * 0.3], { color: (p, n) => hue(Bk.upper, p, n, 0.2), mat: 'beak', bone: 'head', k: 0.004, rot: [-Bk.tilt * 0.5, 0, 0] });
        }
        const nL = down.pts.length - 1;
        for (let i = 0; i < nL; i++) {
          const s0 = i / nL, s1 = (i + 1) / nL;
          const h = (q) => Bk.depth * lo.depth * 0.5 * (1 - q) ** 0.8 + 0.0008, w = (q) => Bk.width * 0.46 * (1 - q) ** 0.7 + 0.0008;
          const n0 = [0, down.dirs[i][2], -down.dirs[i][1]];
          const a = add(down.pts[i], n0, -h(s0) * 0.95), b = add(down.pts[i + 1], n0, -h(s1) * 0.95);
          s.flake(a, b, [1, 0, 0], h(s0), h(s1), (w(s0) + w(s1)) / (h(s0) + h(s1)), { color: (p, n) => hue(Bk.lower ?? Bk.upper, p, n, s0), mat: 'beak', bone: 'jaw', k: i === 0 ? 0.004 : 0.0015 });
        }
        // The mouth line, a crease between the two halves.
        for (let i = 0; i < Math.min(nU, nL) - 1; i++) s.limb(add(down.pts[i], [0, 0.0004, 0]), add(down.pts[i + 1], [0, 0.0004, 0]), 0.0007, 0.0006, { op: 'sub', k: 0.0004 });
        // The nostrils, near the base on top.
        if (Bk.nostrils !== false) s.mirror((m) => s.ellipsoid(add(up.pts[2], [m * Bk.width * 0.28, Bk.depth * 0.78, 0]), [Bk.width * 0.07, Bk.depth * 0.07, Bk.len * 0.06], { op: 'sub', k: 0.0008 }));
      });
      // The cere: bare skin over the base of the beak (a pigeon's white blob, a parrot's grey band).
      if (Bk.cere) {
        const { color, size = 1 } = Bk.cere;
        s.part('beak', () => s.ellipsoid(add(up.pts[Bk.cere.at ?? 3], [0, Bk.depth * 0.8, 0]), [Bk.width * 0.5 * size, Bk.depth * 0.3 * size, Bk.len * 0.16 * size], { color, mat: 'skin', bone: 'head', k: 0.002 }));
      }

      // ——— the eyes, set into the sides of the head and looking out to the side, each in its ring of bare skin or feathers.
      s.mirror((m) => {
        const d = unit([m * E.look[0], E.look[1], E.look[2]]);
        const aim = add(Hd.at, [m * Hd.r * 0.6, Hd.r * 0.16, Hd.r * 0.45]);
        const hit = s.cast(add(aim, d, Hd.r * 2), d.map((v) => -v), Hd.r * 3);
        const c = add(hit ? hit.p : aim, d, -E.r * 0.55);
        {
          s.sphere(add(c, d, E.r * 0.3), E.r * 1.02, { op: 'sub', k: 0.001 });
          // The lids: a ring of bare skin if it has one, else a fold of the head's own feathers.
          s.torus(add(c, d, E.r * (E.ring ? 0.5 : 0.36)), E.r * 0.94, E.r * (E.ring ? E.ringW : 0.13), { color: E.ring ?? pl, mat: E.ring ? 'skin' : M.head, bone: 'head', k: 0.0012, rot: standAlong(d) });
        }
        s.part('eyes', () => s.sphere(c, E.r, { color: eyeColor(c, d, { iris: E.iris, pupil: E.pupil, size: E.size }), mat: 'eye', bone: 'head', k: 0 }));
        // The catch-light, up and forward of the pupil.
        const hl = add(c, unit(add(d, [m * -0.25, 0.45, 0.3])), E.r);
        s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - E.r * 0.16, '#ffffff', E.r * 0.06);
      });

      // ——— the wings.
      s.part('wings', () => s.mirror((m) => wingOn(s, m, F.wings[m], Wg, col, M.wing)));

      // ——— the tail: a fan of feathers, the middle pair on top.
      s.part('wings', () => {
        const n = Tl.count;
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, a = f * Tl.spread;
          const L = Tl.len * Tl.shape(f);
          const root = add(F.tail, [f * B.r[0] * 0.35, -Math.abs(f) * 0.003, 0.012]);
          const d = unit([Math.sin(a), -Tl.droop, -Math.cos(a)]);
          const c = Tl.color;
          featherOf(s, root, add(root, d, L), Tl.width, Wg.thick, typeof c === 'function' && c.length >= 3 ? (p, nn, t) => c(p, nn, t, f) : c, { bone: 'tail', root: 0.7, tip: Tl.tip ?? 1, mat: M.tail });
        }
      });

      // ——— the feet, tucked up under the tail: a scaly leg, the toes curled shut, the claws.
      s.part('feet', () => s.mirror((m) => {
        const bone = `leg${side(m)}`, hip = F.hip(m);
        const ankle = add(hip, [m * 0.002, -0.014, -0.036]);
        s.limb(add(hip, [0, 0.004, 0.004]), hip, 0.009, 0.0062, { color: pl, mat: M.body, bone, k: 0.003 });
        s.limb(hip, ankle, 0.0042, 0.0036, { color: Ft.color, mat: 'skin', bone, k: 0.002 });
        const toes = Ft.zygo ? [[-0.5, -1], [0.5, -1], [-0.35, 1], [0.35, 1]] : [[-0.5, -1], [0, -1], [0.5, -1], [0, 1]];
        for (const [a, dir] of toes) {
          // Forward toes go back along the body (the foot is tucked); the hind toe forward under it.
          const t1 = add(ankle, [m * a * 0.006, -0.003, dir * -0.011]);
          const t2 = add(t1, [m * a * 0.002, 0.004, dir * -0.004]);
          s.limb(ankle, t1, 0.0028, 0.0024, { color: Ft.color, mat: 'skin', bone, k: 0.0015 });
          s.limb(t1, t2, 0.0024, 0.0018, { color: Ft.color, mat: 'skin', bone, k: 0.001 });
          s.limb(t2, add(t2, [0, 0.003, dir * 0.002]), 0.0016, 0.0005, { color: Ft.claw, mat: 'claw', bone, k: 0.0006 });
        }
      }));

      extras?.(s, F, { E, Wg, Tl, Ft, Bk, up, down, pl });
    },
    animate(k, state) {
      flap(k, state, style);
    },
  };
}

/**
 * One wing (`m` 1 the left, −1 the right) on its points `w` (shoulder S,
 * elbow E, wrist W, the end of the hand H).
 */
function wingOn(s, m, w, Wg, col, mat) {
  const S = side(m), arm = `arm${S}`, fore = `fore${S}`, hand = `hand${S}`;
  const T = Wg.thick, back = (p, z, y = 0) => add(p, [0, y, -z]);
  // Where a point is on the wing: [how far out along it (0 at the shoulder, 1 at the end of the hand), how far back
  // from the leading edge]. Patterns across a wing (a pigeon's bars) go by it, so every feather under a bar agrees.
  const xs = [w.S, w.E, w.W, w.H].map((q) => Math.abs(q[0])), zs = [w.S, w.E, w.W, w.H].map((q) => q[2]);
  const uv = (p) => {
    const x = Math.abs(p[0]);
    let z = zs[3];
    for (let i = 0; i < 3; i++) if (x <= xs[i + 1]) { z = zs[i] + (zs[i + 1] - zs[i]) * clamp((x - xs[i]) / (xs[i + 1] - xs[i])); break; }
    return [clamp((x - xs[0]) / (xs[3] - xs[0]), 0, 2), z - p[2]];
  };
  const f = (c) => (p, n, t) => {
    const at = uv(p), col = hue(c, p, n, t, at);
    return Wg.pattern ? Wg.pattern(col, p, n, at, t) : col;
  };
  const feather = (s0, a, b, wd, th, c, o) => featherOf(s0, a, b, wd, th, c, { mat, ...o });
  // The leading edge: thick at the shoulder, thinning out along the hand, flat across.
  s.flake(w.S, w.E, [0, 1, 0], 0.0115, 0.0092, 0.5, { color: f(col.leading), mat, bone: arm, k: 0.004 });
  s.flake(w.E, w.W, [0, 1, 0], 0.0092, 0.0068, 0.5, { color: f(col.leading), mat, bone: fore, k: 0.003 });
  s.flake(w.W, w.H, [0, 1, 0], 0.0068, 0.0036, 0.5, { color: f(col.leading), mat, bone: hand, k: 0.0025 });
  // The small feathers behind it, in a flat pad over the arm and forearm.
  s.flake(back(w.S, 0.012, 0.001), back(w.W, 0.008, 0.001), [0, 1, 0], 0.013, 0.008, 0.36, { color: f(col.lesser), mat, bone: [[arm, 0.5], [fore, 0.5]], k: 0.004 });

  // The secondaries, back from the forearm, and the greater and median coverts in rows over them.
  const E0 = lerp(w.S, w.E, 0.5);
  for (let i = 0; i < Wg.nS; i++) {
    const u = i / (Wg.nS - 1);
    const root = back(lerp(E0, w.W, u), 0.007, -0.0015);
    const d = unit([m * (0.04 + 0.14 * u), -0.05, -1]);
    const L = Wg.chord * (1 - 0.06 * u);
    const bone = u < 0.2 ? [[arm, 0.5], [fore, 0.5]] : fore;
    feather(s, root, add(root, d, L), 0.0108, T, f(col.secondaries), { bone });
    const g = add(root, [0, 0.0032, 0.003]);
    feather(s, g, add(g, d, L * 0.44), 0.011, T, f(col.greater), { bone, root: 0.8 });
    const md = add(root, [0, 0.0058, 0.0055]);
    feather(s, md, add(md, d, L * 0.24), 0.0105, T, f(col.median), { bone, root: 0.85 });
  }
  // The tertials, by the body, to close the gap behind the arm.
  for (let i = 0; i < 3; i++) {
    const u = 0.15 + i * 0.25;
    const root = back(lerp(w.S, w.E, u), 0.006, 0.0005);
    const d = unit([m * -0.06, -0.06, -1]);
    feather(s, root, add(root, d, Wg.chord * (0.86 - i * 0.05)), 0.0095, T, f(col.tertials), { bone: i < 2 ? arm : [[arm, 0.5], [fore, 0.5]] });
  }
  // The primaries, fanning off the hand from back to out along it, the longest near the tip;
  // spread into fingers at their ends if `fingers`.
  for (let i = 0; i < Wg.nP; i++) {
    const u = i / (Wg.nP - 1);
    const a = 0.18 + u * (1.05 + Wg.fingers * 0.2);
    const d = unit([m * Math.sin(a), -0.04 + u * 0.03, -Math.cos(a)]);
    const reach = Wg.chord + (Wg.primary - Wg.chord) * Math.min(1, u / 0.72) ** 0.8;
    const L = reach * (1 - Wg.round * 0.42 * Math.max(0, (u - 0.72) / 0.28) ** 1.6);
    const root = back(lerp(w.W, w.H, Math.min(1, u * 1.12)), 0.004, -0.0015 - u * 0.0008);
    const wd = 0.0092 - u * 0.0012;
    feather(s, root, add(root, d, L), wd, T, f(col.primaries), { bone: hand, root: 0.75, tip: 1 - Wg.fingers * 0.42 * u });
    // The primary coverts over their roots.
    if (i < Wg.nP - 1) {
      const c = add(root, [0, 0.0032, 0.002]);
      feather(s, c, add(c, d, L * 0.36), 0.0095, T, f(col.coverts), { bone: hand, root: 0.85 });
    }
  }
  // The alula: the little thumb of feathers at the wrist.
  feather(s, add(w.W, [0, 0.004, 0.002]), add(w.W, [m * 0.026, 0.0045, -0.012]), 0.005, T, f(col.alula), { bone: hand, root: 0.8 });
}

/**
 * How a bird moves. It is always flying: idle is a hover, walk flying on,
 * attack a dive and a strike with the feet, hit a jolt back, ko a tumble,
 * win a loop, cast wings up and the beak open.
 */
export function flap(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }, style = {}) {
  const { rate = 9, amp = 0.85, fold: foldBy = 0.75 } = style;
  const T = time + seed;
  const wings = (lift, fold, sweep = 0, twist = 0) => {
    for (const m of [1, -1]) {
      const S = side(m);
      k.turn(`arm${S}`, twist * 0.3, m * (sweep * 0.35 + fold * 0.3), m * lift);
      k.turn(`fore${S}`, 0, m * (sweep * 0.35 + fold * 0.85), m * -fold * 0.3);
      k.turn(`hand${S}`, twist, m * (sweep * 0.3 + fold * 1.0), m * -fold * 0.45);
    }
  };
  const beat = (ph, a = amp) => {
    const w = Math.sin(ph), u = Math.cos(ph);
    // Up on the upstroke with the wing folded in; down on the downstroke spread wide; the body rises as they go down.
    wings(0.1 + a * w, Math.max(0, u) * foldBy, 0, -u * 0.12);
    k.move('root', 0, -u * 0.006, 0);
    k.turn('tail', Math.sin(ph + 1) * 0.06, 0, 0);
    return w;
  };
  if (clip === 'ko') {
    // Winded: tumbling over, the wings out and limp, the head lolling, the feet in the air.
    const f = Math.min(1, t / 0.5);
    k.turn('body', 0.5 * f, 0, 1.6 * f);
    wings(-0.3 * f, 0.15, -0.2 * f);
    k.turn('armR', 0, 0, 0.6 * f);
    k.turn('neck', 0.4 * f, 0, 0.3 * f);
    k.turn('head', 0.3 * f, 0.2 * f, 0);
    k.turn('jaw', 0.35 * f, 0, 0);
    k.turn('legL', -1.6 * f, 0, 0.2 * f);
    k.turn('legR', -1.4 * f, 0, -0.2 * f);
    k.turn('tail', 0.3 * f, 0, 0);
  } else if (clip === 'hit') {
    const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
    k.turn('body', -0.55 * h, 0, 0.2 * h);
    wings(0.1 + 0.9 * h, 0, -0.4 * h);
    k.turn('neck', -0.3 * h, 0, 0);
    k.turn('head', 0.25 * h, 0.3 * h, 0);
    k.turn('jaw', 0.3 * h, 0, 0);
    k.turn('tail', -0.4 * h, 0, 0);
    k.turn('legL', -0.6 * h, 0, 0); k.turn('legR', -0.6 * h, 0, 0);
  } else if (clip === 'attack') {
    // In with the wings swept back, nose down; then up on its tail, the wings thrown forward, the feet and the beak out.
    const a = Math.min(1, t / 0.7);
    const dive = smooth(0, 0.3, a) * (1 - smooth(0.5, 0.65, a)), strike = smooth(0.5, 0.68, a) * (1 - smooth(0.9, 1, a));
    k.turn('body', 0.5 * dive - 0.55 * strike, 0, 0);
    k.move('root', 0, -0.03 * dive, 0.05 * dive + 0.03 * strike);
    if (dive > 0.01 || strike > 0.01) wings(-0.05 * dive + 0.7 * strike, 0.85 * dive, -0.55 * strike, 0);
    else beat(T * rate * 1.2);
    k.turn('neck', -0.1 * dive + 0.45 * strike, 0, 0);
    k.turn('head', 0.2 * strike, 0, 0);
    k.turn('jaw', 0.5 * strike, 0, 0);
    k.turn('legL', -1.9 * strike, 0, 0); k.turn('legR', -1.9 * strike, 0, 0);
    k.turn('tail', -0.2 * dive + 0.4 * strike, 0, 0);
  } else if (clip === 'win') {
    // A loop, for joy, flapping all the way round.
    const u = smooth(0, 1, Math.min(1, t / 1.1));
    k.turn('body', -Math.PI * 2 * u, 0, 0);
    beat(T * rate * 1.3, amp * 1.1);
    k.turn('jaw', Math.max(0, Math.sin(T * 9)) * 0.35, 0, 0);
  } else if (clip === 'cast') {
    // Up on its tail, the wings high and held, the beak open: a shriek.
    const u = smooth(0, 0.3, t);
    k.turn('body', -0.35 * u, 0, 0);
    wings(0.9 + Math.sin(T * 14) * 0.08, 0.1, -0.15);
    k.turn('neck', -0.2 * u, 0, 0);
    k.turn('jaw', 0.5 * u, 0, 0);
    k.turn('tail', 0.3 * u, 0, 0);
  } else {
    const on = clip === 'walk';
    beat(T * rate * (on ? 1.15 * Math.max(0.7, Math.min(1.4, speed)) : 1), amp * (on ? 1.05 : 1));
    k.turn('body', on ? 0.16 : 0.03, 0, Math.sin(T * 1.1) * 0.06);
    // The head held steady while the rest of it bobs, looking about in jerks.
    k.turn('neck', on ? -0.12 : 0, 0, 0);
    k.turn('head', Math.sin(T * 0.9) * 0.06, Math.round(Math.sin(T * 0.7) * 2) * 0.22, 0);
  }
  style.after?.(k, { clip, t, time, seed, speed }, T);
}
