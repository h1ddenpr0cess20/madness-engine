import { noise, rgb, rotation, Sculpt } from '../models/sdf.js';
import { coat, mix } from '../models/skins.js';

/**
 * What the four heroes have in common: a stylised body about 0.8 tiles
 * tall and three and a half heads high, its skeleton, its face, and how it
 * moves. Each hero (hero.js, warrior.js, mage.js, healer.js) dresses it
 * and arms it.
 *
 * Faces +z, feet on y = 0. Arms hang a little out from the sides; the
 * right hand (−x) holds the weapon.
 */

export const side = (m) => (m > 0 ? 'L' : 'R');

/** Where the legs end and the head begins, as sculpted. */
const HIP = 0.32, NECK = 0.585;

const step = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * A build: how one person's body differs from the sculpt everyone shares,
 * as a warp of it (see `Sculpt.setWarp`). `legs` and `torso` stretch those
 * up and down; `head` grows the head about the top of the neck; `girth`
 * widens and deepens the trunk (and the shoulders, and so the arms) and
 * `hips` the legs' spread. 1 is as sculpted; null if it is all 1.
 */
export function build({ legs = 1, torso = 1, head = 1, girth = 1, hips = Math.sqrt(girth) } = {}) {
  if (legs === 1 && torso === 1 && head === 1 && girth === 1 && hips === 1) return null;
  const neckAt = HIP * legs + (NECK - HIP) * torso;
  const up = (y) => (y <= HIP ? y * legs : y <= NECK ? HIP * legs + (y - HIP) * torso : neckAt + (y - NECK) * head);
  const down = (y) => (y <= HIP * legs ? y / legs : y <= neckAt ? HIP + (y - HIP * legs) / torso : NECK + (y - neckAt) / head);
  // Across: the legs' spread, then the trunk's, then (up the neck) the head's, each easing into the next.
  const wide = (y) => {
    const trunk = hips + (girth - hips) * step(0.25, 0.36, y);
    return trunk + (head - trunk) * step(0.52, 0.575, y);
  };
  const tall = (y) => (y <= HIP ? legs : y <= NECK ? torso : head);
  return {
    scale: ([, y]) => Math.min(wide(y), tall(y)),
    to: ([x, y, z]) => { const w = wide(y); return [x * w, up(y), z * w]; },
    from: ([x, y, z]) => { const r = down(y), w = wide(r); return [x / w, r, z / w]; },
  };
}

/** The skeleton. `b` widens the shoulders and hips (1 as drawn; the Warrior is broader); `warp` is a build's. */
export function bones(b = 1, warp = null) {
  if (warp) return bones(b).map(([name, parent, at]) => [name, parent, warp.to(at)]);
  const list = [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', [0, 0.32, 0]],
    ['spine', 'hips', [0, 0.37, 0]],
    ['chest', 'spine', [0, 0.45, 0]],
    ['neck', 'chest', [0, 0.53, 0]],
    ['head', 'neck', [0, 0.58, 0.005]],
  ];
  for (const m of [1, -1]) {
    const s = side(m);
    list.push(
      [`arm${s}`, 'chest', [m * 0.105 * b, 0.5, 0]],
      [`fore${s}`, `arm${s}`, [m * 0.135 * b, 0.395, 0]],
      [`hand${s}`, `fore${s}`, [m * 0.15 * b, 0.292, 0.018]],
      [`thigh${s}`, 'hips', [m * 0.055 * b, 0.31, 0]],
      [`shin${s}`, `thigh${s}`, [m * 0.06 * b, 0.172, 0.006]],
      [`foot${s}`, `shin${s}`, [m * 0.06 * b, 0.05, 0]],
    );
  }
  return list;
}

/** Where the joints are at rest, for building clothes and gear round them. */
export function joints(b = 1) {
  const J = {};
  for (const m of [1, -1]) {
    const s = side(m);
    J[`shoulder${s}`] = [m * 0.105 * b, 0.5, 0];
    J[`elbow${s}`] = [m * 0.135 * b, 0.395, 0];
    J[`wrist${s}`] = [m * 0.15 * b, 0.292, 0.018];
    J[`hand${s}`] = [m * 0.153 * b, 0.262, 0.024];
    J[`hip${s}`] = [m * 0.055 * b, 0.31, 0];
    J[`knee${s}`] = [m * 0.06 * b, 0.172, 0.006];
    J[`ankle${s}`] = [m * 0.06 * b, 0.05, 0];
  }
  return J;
}

/** A colour (or a colour function) darkened, for a sole that wasn't given one. */
const darker = (color) => (typeof color === 'function' ? (p, n) => color(p, n).map((v) => v * 0.42) : rgb(color).map((v) => v * 0.42));

/** A slab of sole: flat top and bottom, straight sides round an oval of radii `r`[0] by `r`[2], `r`[1] either side of `c` up and down, its edges rounded. */
function sole(s, c, r, o) {
  const round = 0.0028;
  s.shape((p) => {
    const across = (Math.hypot((p[0] - c[0]) / r[0], (p[2] - c[2]) / r[2]) - 1) * Math.min(r[0], r[2]) + round;
    const up = Math.abs(p[1] - c[1]) - r[1] + round;
    return Math.hypot(Math.max(across, 0), Math.max(up, 0)) + Math.min(Math.max(across, up), 0) - round;
  }, [[c[0] - r[0], c[1] - r[1], c[2] - r[2]], [c[0] + r[0], c[1] + r[1], c[2] + r[2]]], { ...o, k: 0.003 });
}

/** A bare foot at the ankle `a` on side `m`: the heel, the instep, the ball and five toes, the big one inside; flat on the floor. */
function bareFoot(s, a, m, o) {
  s.ellipsoid([a[0], 0.024, a[2] - 0.004], [0.022, 0.024, 0.026], { ...o, k: 0.016 });
  s.ellipsoid([a[0] + m * 0.002, 0.022, a[2] + 0.03], [0.025, 0.02, 0.04], { ...o, k: 0.016 });
  s.ellipsoid([a[0] + m * 0.002, 0.014, a[2] + 0.06], [0.029, 0.013, 0.02], { ...o, k: 0.012 });
  [[-0.018, 0.0088, 0.088], [-0.005, 0.0068, 0.086], [0.0055, 0.0062, 0.083], [0.0155, 0.0057, 0.078], [0.024, 0.0052, 0.071]].forEach(([x, r, z]) => {
    s.limb([a[0] + m * x, r + 0.001, a[2] + z - 0.012], [a[0] + m * x, r + 0.001, a[2] + z], r, r * 0.95, { ...o, k: 0.004 });
  });
  s.box([0, 1, 0], [2, 1, 2], 0, { op: 'inter', k: 0.002 });
}

/**
 * The trunk's sections, up from the crotch to the base of the neck: [height,
 * half its width (times the breadth), half its depth, how far forward its
 * middle is, how square it is (2 round, higher squarer)].
 */
const TRUNK = [
  [0.268, 0.05, 0.04, -0.004, 2.2],
  [0.295, 0.072, 0.054, -0.006, 2.4],
  [0.33, 0.079, 0.059, -0.008, 2.5],
  [0.372, 0.072, 0.058, 0.004, 2.5],
  [0.43, 0.086, 0.065, 0.008, 2.6],
  [0.472, 0.094, 0.07, 0.009, 2.7],
  [0.505, 0.09, 0.057, 0.001, 2.6],
  [0.53, 0.056, 0.038, -0.006, 2.2],
  [0.548, 0.03, 0.028, -0.006, 2],
];

/**
 * The trunk's section at height y, for breadth `b` and `belly`: a smooth
 * curve through TRUNK (each measure on a Catmull-Rom spline, so the profile
 * has no kinks or flats), the belly carried out in front of the waist.
 */
function trunk(b, belly) {
  const n = TRUNK.length;
  return (y) => {
    let i = 0;
    while (i < n - 2 && y > TRUNK[i + 1][0]) i++;
    const t = Math.max(0, Math.min(1, (y - TRUNK[i][0]) / (TRUNK[i + 1][0] - TRUNK[i][0])));
    const P = [TRUNK[Math.max(0, i - 1)], TRUNK[i], TRUNK[i + 1], TRUNK[Math.min(n - 1, i + 2)]];
    const [w, d, zc, e] = [1, 2, 3, 4].map((j) => {
      const [p0, p1, p2, p3] = P.map((s) => s[j]);
      return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
    });
    // The belly: forward of the waist and over the belt, round in profile; the bigger it is, the lower and
    // taller. A broad build is deeper through the body too.
    const g = belly * Math.exp(-(((y - 0.372 + belly * 0.008) / (0.05 + belly * 0.014)) ** 2));
    return [w * b + g * 0.018 * b, d * (1 + (b - 1) * 0.6) + g * 0.04, zc + g * 0.04, Math.max(2, e - g * 0.35)];
  };
}

/**
 * A piece of a lofted body from height `y0` to `y1`, its section at each
 * height `at(y)` ([half width, half depth, middle, squareness]), flat at
 * either end (the pieces overlap and meet there). `grow` makes it that much
 * bigger all round at its bottom and not at all at its top: a shirt's tail
 * standing out over the trousers.
 */
function loft(s, at, y0, y1, o, grow = 0) {
  let wide = 0, deep = 0;
  for (let y = y0; y <= y1 + 1e-9; y += 0.005) {
    const [w, d, zc] = at(y);
    wide = Math.max(wide, w + grow);
    deep = Math.max(deep, d + grow + Math.abs(zc));
  }
  s.shape((p) => {
    const y = Math.max(y0, Math.min(y1, p[1]));
    const g = grow * (1 - (y - y0) / (y1 - y0));
    const [w0, d0, zc, e] = at(y), w = w0 + g, d = d0 + g;
    const x = Math.abs(p[0]) / w, z = Math.abs(p[2] - zc) / d;
    const around = ((x ** e + z ** e) ** (1 / e) - 1) * Math.min(w, d) * 0.9;
    return Math.max(around, y0 - p[1], p[1] - y1);
  }, [[-wide, y0, -deep], [wide, y1, deep]], o);
}

/**
 * A band of `o`'s leather (a belt) round the trunk at height `y`, `r` high
 * and `thick` thick, fitted to the surface as sculpted so far, its front
 * lower than its back by `tilt`. Returns where its front is.
 */
function band(s, y, r, thick, o, tilt = 0.04) {
  const w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
  // Out from the middle each way until out of the body.
  const reach = (dir) => {
    const from = to([0, y, 0]);
    const at = (t) => from.map((v, i) => v + dir[i] * t);
    let lo = 0, hi = 0.01;
    while (s.field(at(hi)) < 0 && hi < 0.4) { lo = hi; hi += 0.01; }
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (s.field(at(mid)) < 0) lo = mid; else hi = mid;
    }
    return back(at(hi));
  };
  const right = reach([1, 0, 0])[0], left = reach([-1, 0, 0])[0], front = reach([0, 0, 1])[2], rear = reach([0, 0, -1])[2];
  const c = [(right + left) / 2, y, (front + rear) / 2], rx = (right - left) / 2 + thick * 0.3, rz = (front - rear) / 2 + thick * 0.3;
  s.shape((p) => {
    const x = p[0] - c[0], z = p[2] - c[2];
    const around = (Math.hypot(x / rx, z / rz) - 1) * Math.min(rx, rz);
    return (Math.hypot(around / thick, (p[1] - c[1] + tilt * z) / r) - 1) * Math.min(r, thick);
  }, [[c[0] - rx - thick, y - r - tilt * rz, c[2] - rz - thick], [c[0] + rx + thick, y + r + tilt * rz, c[2] + rz + thick]], { ...o, k: 0.003 });
  return c[2] + rz + thick;
}

/** Skin: warm, rosier where it faces forward and down a little. */
export function skinTone(hex = '#e9b48f') {
  const base = coat({ over: hex, under: hex, vary: 0.06, freq: 14, grain: 0.03 });
  const rose = rgb('#d9826e');
  return (p, n) => mix(base(p, n), rose, Math.max(0, n[2]) * 0.12);
}

/**
 * The body, painted in its clothes: `look` gives the colours (functions or
 * hex) of `skin`, `torso`, `sleeve` (upper arm), `cuff` (forearm), `hand`,
 * `legs`, `boot`, and if they have them a `belt` (and its `buckle`) and a
 * `sole` under the shoes; and `mats` the materials of the same (default
 * 'cloth', 'skin' for skin). The calf is the trousers (`legs`) down to the
 * shoe unless `shin` says otherwise (a colour, or 'skin' under shorts or a
 * skirt); `boots` pulls a boot (in `boot`) up over it, to just under the
 * knee or to the height given; `shoeless` ('L' or 'R') leaves a foot bare
 * of its shoe. `b` is the breadth; `belly` (0 to 2 or so) how far a belly
 * sticks out.
 */
export function body(s, { look, mats = {}, b = 1, k = 0.03, belly = 0 }) {
  const J = joints(b);
  const m = (part) => mats[part] ?? (part === 'skin' || part === 'hand' ? 'skin' : 'cloth');
  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') }, L = { color: c('legs'), mat: m('legs') };
  // The calf: trousers to the shoe, a boot to the knee, or bare.
  const shin = look.shin ?? c('legs');
  const shinMat = mats.shin ?? (look.shin === undefined ? m('legs') : look.shin === look.skin ? 'skin' : 'cloth');
  // The trunk: one form, lofted through its sections from the crotch to the base of the neck, so its outline
  // runs clean from the seat in at the waist and out over the ribs to the shoulders. In three pieces on three
  // bones (the hips, the belly, the chest), so that it bends; the trousers below the waistline, the top above.
  const at = trunk(b, belly);
  const paint = (o) => (typeof o.color === 'function' ? o.color : () => rgb(o.color));
  const dress = (p, n) => {
    const t = Math.max(0, Math.min(1, (p[1] - 0.344) / 0.008));
    const lo = paint(L)(p, n), hi = paint(T)(p, n);
    return lo.map((v, i) => v + (hi[i] - v) * t);
  };
  loft(s, at, 0.268, 0.362, { color: dress, mat: m('legs'), bone: 'hips', k: k * 0.15 });
  loft(s, at, 0.34, 0.445, { color: dress, mat: m('torso'), bone: 'spine', k: 0.003 });
  loft(s, at, 0.425, 0.548, { ...T, bone: 'chest', k: 0.003 });
  // A shirt worn loose stands out over the trousers at its tail, and stops there.
  if (m('torso') !== 'skin' && c('torso') !== c('legs') && !look.belt) loft(s, at, 0.336, 0.39, { ...T, bone: 'spine', k: 0.002 }, 0.0065);
  // A belt, if they wear one: a band fitted round the top of the trousers, and a buckle.
  if (look.belt) {
    const front = band(s, 0.338, 0.0085, 0.0035, { color: look.belt, mat: 'leather', bone: 'hips' });
    if (look.buckle) s.box([0, 0.338, front + 0.002], [0.014, 0.011, 0.004], 0.002, { color: look.buckle, mat: 'metal', bone: 'hips', k: 0.002 });
  }
  for (const mm of [1, -1]) {
    const S = side(mm), sh = J[`shoulder${S}`], el = J[`elbow${S}`], wr = J[`wrist${S}`];
    const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    const U = { color: c('sleeve'), mat: m('sleeve'), bone: `arm${S}` };
    // The arm: a round shoulder grown out of the top of the trunk, the upper arm tapering to the elbow; a
    // short sleeve is a tube of cloth over it, open just above the elbow.
    s.limb([sh[0] - mm * 0.006, sh[1] + 0.004, sh[2]], el, 0.0345, 0.0245, { ...U, k: 0.016 });
    if (m('sleeve') !== 'skin' && c('sleeve') !== c('cuff')) s.cylinder(along(sh, el, 0.48), 0.036, 0.046, { ...U, k: 0.004, round: 0.005, rot: [0, 0, mm * 0.28] });
    // The forearm, tapering to the wrist; a bare one goes with the hand, so there is no seam at the wrist. A
    // long sleeve ends in a cuff the hand comes out of.
    s.part(m('cuff') === 'skin' && m('hand') === 'skin' ? 'hands' : s.current, () => {
      const F = { color: c('cuff'), mat: m('cuff'), bone: `fore${S}` };
      s.limb(el, wr, 0.0245, 0.0185, { ...F, k: 0.006 });
      if (m('cuff') !== 'skin' && c('hand') !== c('cuff')) s.cylinder(along(el, wr, 0.87), 0.0226, 0.0105, { ...F, k: 0.003, round: 0.004, rot: [-0.17, 0, mm * 0.145] });
    });
    // A hand, a mesh of its own: open and loosely curled, or a fist round what it holds (`grip`).
    hand(s, J, S, { color: c('hand'), mat: m('hand') });
    // The leg: the thigh tapering to the knee, the shin with the gentle swell of the calf, narrowing to the ankle.
    s.limb(J[`hip${S}`], J[`knee${S}`], 0.046 * Math.sqrt(b), 0.0335, { ...L, bone: `thigh${S}`, k: 0.012 });
    const kn = J[`knee${S}`], a = J[`ankle${S}`];
    const calf = { color: shin, mat: shinMat, bone: `shin${S}` };
    s.limb(kn, [a[0], a[1] + 0.07, a[2] - 0.004], 0.0325, 0.0305, { ...calf, k: 0.006 });
    s.limb([a[0], a[1] + 0.07, a[2] - 0.004], [a[0], a[1] + 0.012, a[2]], 0.0305, 0.0245, { ...calf, k: 0.006 });
    // Trousers hang straight from the knee to the shoe, rather than wrap the calf like tights.
    if (look.shin === undefined && !look.boots && m('legs') !== 'skin' && look.shoeless !== S) {
      s.limb([kn[0], kn[1] - 0.008, kn[2]], [a[0], 0.08, a[2] - 0.002], 0.036, 0.036, { ...calf, k: 0.006 });
    }
    // Shorts: a leg of cloth a little wider than the thigh, ending above the knee.
    if (look.shin !== undefined && shinMat === 'skin' && m('legs') !== 'skin') {
      s.cylinder([J[`hip${S}`][0] * 1.06, 0.256, 0], 0.049 * Math.sqrt(b), 0.048, { ...L, bone: `thigh${S}`, k: 0.006, round: 0.006 });
    }
    if (look.shoeless === S) continue;
    // Bare feet: a foot, melted into the leg, with its toes; no shoe.
    if (m('boot') === 'skin' && !look.sole && !look.boots) {
      bareFoot(s, a, mm, { color: c('boot'), mat: 'skin', bone: `foot${S}` });
      continue;
    }
    // A shoe, a mesh of its own so the trousers go into it on a clean edge: flat underneath, round at the heel and the toe, and a sole just proud of it.
    s.part('shoes', () => {
      const F = { color: c('boot'), mat: m('boot'), bone: `foot${S}` };
      // A boot's leg over the calf, the trousers tucked in, and a band round its top.
      if (look.boots) {
        const top = look.boots === true ? 0.15 : look.boots;
        s.limb([a[0], 0.05, a[2]], [a[0], top, a[2] - 0.004], 0.033, 0.0395, { ...F, bone: `shin${S}`, k: 0.012 });
        s.torus([a[0], top, a[2] - 0.004], 0.0395, 0.0065, { ...F, bone: `shin${S}`, k: 0.004 });
      }
      s.box([a[0], 0.034, a[2] + 0.02], [0.028, 0.024, 0.046], 0.02, { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.03, a[2] + 0.061], [0.0285, 0.021, 0.034], { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.056, a[2] + 0.004], [0.029, 0.027, 0.031], { ...F, k: 0.014 });
      // The sole: the heel and the tread, just proud of the upper all round (a welt), and flat underneath.
      const SO = { color: look.sole ?? darker(c('boot')), mat: look.sole ? 'rubber' : m('boot'), bone: `foot${S}` };
      sole(s, [a[0], 0.007, a[2] + 0.003], [0.0305, 0.007, 0.034], SO);
      sole(s, [a[0], 0.007, a[2] + 0.054], [0.032, 0.007, 0.045], SO);
    });
  }
  // Neck.
  s.part('head', () => s.limb([0, 0.51, 0], [0, 0.585, 0.008], 0.03, 0.028, { color: c('skin'), mat: m('skin'), bone: 'neck', k: 0.02 }));
  return J;
}

/**
 * Where an eye of depth 0.014 goes, looking along `n` from about `c`: as
 * deep in the head as puts its front just proud of the face (where the
 * face is, after the build's warp), so that how much of it shows is the
 * sculpt's doing and not the mesh's. If no face is found, `c`.
 */
function seat(s, c, n, proud = 0.004) {
  const w = s.warp;
  const toWorld = (p) => (w ? w.to(p) : p);
  const from = toWorld(c.map((v, i) => v + n[i] * 0.05)), to = toWorld(c);
  const dir = to.map((v, i) => v - from[i]), dl = Math.hypot(...dir);
  const hit = s.cast(from, dir.map((v) => v / dl), dl * 1.5);
  if (!hit) return c;
  const p = w ? w.from(hit.p) : hit.p;
  const depth = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1] + (p[2] - c[2]) * n[2];
  if (depth < 0.004 || depth > 0.03) return c;
  return c.map((v, i) => v + n[i] * (depth - 0.014 + proud));
}

/** Where the face is at (x, y), as sculpted, looking straight at it from the front; `z` if it isn't found. */
function faceAt(s, x, y, z) {
  const w = s.warp;
  const toWorld = (p) => (w ? w.to(p) : p);
  const from = toWorld([x, y, 0.2]), to = toWorld([x, y, 0]);
  const dir = to.map((v, i) => v - from[i]), dl = Math.hypot(...dir);
  const hit = s.cast(from, dir.map((v) => v / dl), dl);
  if (!hit) return z;
  return (w ? w.from(hit.p) : hit.p)[2];
}

/** How far p is outside an ellipsoid of radii `r` at `c` turned by `R` (rows, as `rotation` gives), near enough: for paint. */
function outside(p, c, R, r) {
  const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const q = [0, 1, 2].map((j) => (R[0][j] * v[0] + R[1][j] * v[1] + R[2][j] * v[2]) / r[j]);
  return (Math.hypot(...q) - 1) * Math.min(...r);
}

/**
 * A head: skull and cheeks, a nose, ears, big eyes (white, a coloured iris,
 * a black pupil and a catch-light) under lids, a mouth, brows. `brow` is
 * the brows' colour; `ears` false hides them (under a hood or a helmet);
 * `mood` 1 sets the brows in a frown and the mouth firm. The head and the
 * neck are a mesh of their own, finer than the body's, so the face is
 * crisp, and the neck goes into the collar on a clean line.
 */
export function head(s, { skin, brow = '#3a2a20', ears = true, eyeColor = '#3a5a8a', jaw = 1, mood = 0, blush = 0.25 }) {
  const H = { color: skin, mat: 'skin', bone: 'head' };
  const tone = (p, n) => (typeof skin === 'function' ? skin(p, n) : rgb(skin));
  const eyes = [];
  const curve = mood ? -2.5 : 3;
  s.part('head', () => {
    s.ellipsoid([0, 0.67, 0.006], [0.098, 0.104, 0.098], { ...H, k: 0.03 });
    s.ellipsoid([0, 0.63, 0.03], [0.082 * jaw, 0.064, 0.076], { ...H, k: 0.05 });
    // Cheekbones under the eyes, and the point of the chin.
    for (const m of [1, -1]) s.ellipsoid([m * 0.05 * jaw, 0.642, 0.066], [0.03, 0.022, 0.026], { ...H, k: 0.03 });
    s.ellipsoid([0, 0.586, 0.072], [0.024 * jaw, 0.015, 0.016], { ...H, k: 0.03 });
    // Brow ridge.
    s.ellipsoid([0, 0.702, 0.075], [0.07, 0.018, 0.026], { ...H, k: 0.03 });
    // The nose: the bridge, a round tip, the wings either side, and the nostrils under them.
    s.limb([0, 0.68, 0.096], [0, 0.652, 0.111], 0.0075, 0.0105, { ...H, k: 0.014 });
    s.sphere([0, 0.647, 0.113], 0.0118, { ...H, k: 0.008 });
    for (const m of [1, -1]) s.sphere([m * 0.0112, 0.6425, 0.105], 0.0074, { ...H, k: 0.007 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.0062, 0.6365, 0.1085], [0.0034, 0.0022, 0.0042], { op: 'sub', k: 0.0016, rot: [0.5, 0, 0] });
    if (ears) {
      for (const m of [1, -1]) {
        // Each ear a shell standing off the side of the head, turned a little forward: its rim rolled over,
        // the bowl inside it, and a lobe.
        const rot = [0, m * 0.45, 0], R = rotation(rot);
        const c = [m * 0.096, 0.66, -0.004];
        const on = (x, y, z) => [0, 1, 2].map((i) => c[i] + R[i][0] * x * m + R[i][1] * y + R[i][2] * z);
        s.ellipsoid(c, [0.011, 0.03, 0.021], { ...H, k: 0.014, rot });
        s.ellipsoid(on(0.0095, 0.001, 0.001), [0.0068, 0.0205, 0.0135], { op: 'sub', k: 0.004, rot });
        const rim = [];
        for (let i = 0; i <= 8; i++) {
          // Round the back and over the top, from the lobe to where it meets the face.
          const a = -1.2 + (i / 8) * 3.6;
          rim.push(on(0.0078, Math.sin(a) * 0.026, -Math.cos(a) * 0.017 + 0.002));
        }
        for (let i = 0; i < 8; i++) s.limb(rim[i], rim[i + 1], 0.0038, 0.0038, { ...H, k: 0.004 });
        s.ellipsoid(on(0.002, -0.025, 0.004), [0.0065, 0.009, 0.0085], { ...H, k: 0.008, rot });
      }
    }
    // The mouth: a crease along the face, a corner at each end, a fuller lower lip and a thin upper one.
    const mouth = (x) => [x, 0.611 + x * x * curve, faceAt(s, x, 0.611 + x * x * curve, 0.1)];
    const line = [-0.021, -0.0105, 0, 0.0105, 0.021].map(mouth);
    for (let i = 0; i < 4; i++) s.limb(line[i], line[i + 1], 0.0016, 0.0016, { op: 'sub', k: 0.0014 });
    for (const p of [line[0], line[4]]) s.sphere(p, 0.0024, { op: 'sub', k: 0.002 });
    const mid = line[2];
    s.ellipsoid([0, mid[1] + 0.0042, mid[2] - 0.0032], [0.017, 0.0036, 0.0045], { ...H, k: 0.005 });
    s.ellipsoid([0, mid[1] - 0.0072, mid[2] - 0.0048], [0.0145, 0.0056, 0.0062], { ...H, k: 0.007 });
  });
  // The lips a little rosier than the face, and the line between them dark.
  const lips = rgb('#b25a52');
  s.paint((p) => Math.max(Math.hypot(p[0] / 1.6, (p[1] - 0.6085 - p[0] * p[0] * curve) * 1.4) - 0.0125, 0.08 - p[2]), (p, n) => mix(tone(p, n), lips, 0.32), 0.004);
  s.paint((p) => Math.max(Math.abs(p[1] - (0.611 + p[0] * p[0] * curve)) - 0.0014, Math.abs(p[0]) - 0.0215, 0.08 - p[2]), '#4a1e1c', 0.0012);
  // Rosy cheeks: a warm flush in the skin, not a disc painted on it.
  const rose = rgb('#e07a6e');
  if (blush) s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.056, (p[1] - 0.634) * 1.3, Math.max(0, 0.06 - p[2])) - 0.019, (p, n) => mix(tone(p, n), rose, Math.min(0.55, blush * 1.6)), 0.016);
  // Eyes, set into the face.
  for (const m of [1, -1]) {
    const d = [m * 0.3, 0.02, 0.95];
    const l = Math.hypot(...d);
    const n = d.map((v) => v / l);
    const c = seat(s, [m * 0.041, 0.668, 0.088], n);
    const at = (t) => c.map((v, i) => v + n[i] * t);
    const rot = [-Math.asin(n[1]), Math.atan2(n[0], n[2]), 0], R = rotation(rot);
    const eyeAt = (x, y, z) => [0, 1, 2].map((i) => c[i] + R[i][0] * x + R[i][1] * y + R[i][2] * z);
    // A socket just the size of the eye, so it sits snug with no dark rim.
    // Big and bright: a white, a wide iris, a pupil, two catch-lights.
    const E = [0.0205, 0.027, 0.0148];
    s.part('head', () => s.ellipsoid(c, [0.02, 0.0265, 0.0143], { op: 'sub', k: 0.003, rot }));
    s.part('eyes', () => s.ellipsoid(c, E, { color: '#f6f2ec', mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('irises', () => s.ellipsoid(at(0.0095), [0.0145, 0.0185, 0.0068], { color: eyeColor, mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('pupils', () => s.ellipsoid(at(0.0142), [0.0068, 0.0092, 0.0032], { color: '#08080c', mat: 'eye', bone: 'head', k: 0, rot }));
    // The iris darker round its rim.
    const iris = at(0.0095), rim = rgb(eyeColor).map((v) => v * 0.4);
    s.paint((p) => {
      const v = [p[0] - iris[0], p[1] - iris[1], p[2] - iris[2]];
      const x = (R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2]) / 0.0145, y = (R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2]) / 0.0185;
      const r = Math.hypot(x, y);
      // Only on the iris: a ring from three quarters of the way out to its edge.
      return Math.max((0.76 - r) * 0.0145, (r - 1.05) * 0.0145, Math.abs(outside(p, iris, R, [0.0145, 0.0185, 0.0068])) - 0.0015);
    }, rim, 0.0012);
    // The upper lid over the top of the eye (lower in a frown), and a softer lower one.
    const lid = eyeAt(0, 0.0245 - mood * 0.002, -0.0008), lidR = [0.0222, 0.011, 0.0165];
    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
    s.part('head', () => s.ellipsoid(eyeAt(0, -0.0255, -0.0008), [0.0215, 0.0065, 0.016], { ...H, k: 0.004, rot }));
    // The lashes: a bold dark line along the lid's edge, thickening to the outer corner.
    s.paint((p) => {
      const out = Math.max(0, (p[0] - c[0]) * m) / E[0];
      return Math.max(Math.abs(outside(p, lid, R, lidR)) - 0.0011 - out * 0.0016, Math.abs(outside(p, c, R, E)) - 0.002 - out * 0.0016);
    }, '#140e0c', 0.0006);
    // Catch-lights: a big one up toward the light, a little one below.
    const hl = at(0.0172).map((v, i) => v + [m * -0.004, 0.0055, 0][i]), lo = at(0.0168).map((v, i) => v + [m * 0.0042, -0.0058, 0][i]);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - 0.0042, '#ffffff', 0.0011);
    s.paint((p) => Math.hypot(p[0] - lo[0], p[1] - lo[1], p[2] - lo[2]) - 0.0017, '#ffffff', 0.0008);
    eyes.push(c);
  }
  // Brows: arched strokes of hair, thick at the inner end and tapering out; pulled down at the middle in a frown.
  for (const m of [1, -1]) {
    const on = (x, y) => [m * x, y, faceAt(s, m * x, y, 0.095) + 0.0005];
    const inner = on(0.02, 0.704 - mood * 0.008), peak = on(0.045, 0.711 - mood * 0.002), outer = on(0.069, 0.703);
    s.part('brows', () => {
      s.flake(inner, peak, [0, 1, 0.45], 0.0058, 0.005, 0.55, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
      s.flake(peak, outer, [0, 1, 0.3], 0.005, 0.0026, 0.55, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
    });
  }
  return eyes;
}

/**
 * Hair's colour (a function or hex) in strands: lighter and darker streaks
 * running down from the crown `at`, fine ones over broad ones.
 */
function strands(color, at) {
  const base = typeof color === 'function' ? color : () => rgb(color);
  return (p, n) => {
    const a = Math.atan2(p[0] - at[0], p[2] - at[2]), x = Math.cos(a), z = Math.sin(a);
    const v = noise(x * 5.5, z * 5.5, p[1] * 4) * 0.5 + noise(x * 10 + 40, z * 10, p[1] * 6) * 0.5;
    return base(p, n).map((c) => c * (0.66 + v * 0.62));
  };
}

/**
 * Hair, in a part of its own so it sits crisp on the skin: a cap over the
 * skull, then locks ([from, to, radius, flat]) swept from the crown down
 * and back. `color` a function or hex.
 */
export function hair(s, { color, locks = [], cap = [0.108, 0.1, 0.108], at = [0, 0.695, -0.006], k = 0.02, front = 0.07 }) {
  const Hh = { color: strands(color, at), mat: 'hair', bone: 'head' };
  s.part('hair', () => {
    s.ellipsoid(at, cap, { ...Hh, k });
    // Off the forehead and the face.
    s.box([0, 0.62, 0.11 + front - 0.07], [0.12, 0.07, 0.05], 0.03, { op: 'sub', k: 0.02 });
    for (const [a, b, r, flat = 0.55] of locks) {
      const up = [a[0] * 4, 1, a[2] * 4];
      s.flake(a, b, up, r, r * 0.22, flat, { ...Hh, k: 0.016 });
    }
  });
}

/**
 * A hand on side `S`, a mesh of its own: the wrist into the cuff, the palm,
 * four fingers each a little longer or shorter, and the thumb. Open, they
 * curl in loosely toward the palm; `closed`, they roll right under it into a
 * fist, the thumb across them, round where the old fists held things.
 */
export function hand(s, J, S, o, closed = false) {
  const mm = S === 'L' ? 1 : -1, h = J[`hand${S}`], wr = J[`wrist${S}`];
  const H = { ...o, bone: `hand${S}` };
  const at = (x, y, z) => [h[0] + mm * x, h[1] + y, h[2] + z];
  const from = s.shapes.length;
  s.part('hands', () => {
    s.limb([wr[0], wr[1] + 0.006, wr[2]], at(0, 0.014, -0.001), 0.0165, 0.0145, { ...H, bone: [[`fore${S}`, 0.5], [`hand${S}`, 0.5]], k: 0.008 });
    if (!closed) {
      s.ellipsoid(at(0.001, 0.004, 0), [0.0108, 0.0175, 0.0192], { ...H, k: 0.008 });
      [[0.0135, 0.84], [0.0046, 1], [-0.0044, 0.96], [-0.0132, 0.8]].forEach(([z, l]) => {
        const knuckle = at(0.0015, -0.011, z), mid = at(-0.003, -0.011 - 0.015 * l, z * 0.96), tip = at(-0.011, -0.016 - 0.021 * l, z * 0.9);
        s.limb(knuckle, mid, 0.0056, 0.005, { ...H, k: 0.003 });
        s.limb(mid, tip, 0.005, 0.0043, { ...H, k: 0.002 });
      });
      s.limb(at(-0.004, 0.006, 0.014), at(-0.008, -0.005, 0.024), 0.0072, 0.006, { ...H, k: 0.005 });
      s.limb(at(-0.008, -0.005, 0.024), at(-0.0105, -0.0145, 0.0265), 0.006, 0.0048, { ...H, k: 0.002 });
    } else {
      s.ellipsoid(at(0.003, 0.006, 0), [0.0125, 0.017, 0.0198], { ...H, k: 0.008 });
      [[0.0135, 0.92], [0.0046, 1], [-0.0044, 0.97], [-0.0132, 0.86]].forEach(([z, l]) => {
        const knuckle = at(0.006, -0.009, z), mid = at(0.003, -0.009 - 0.016 * l, z), tip = at(-0.01, -0.012 - 0.012 * l, z);
        s.limb(knuckle, mid, 0.0062, 0.0058, { ...H, k: 0.003 });
        s.limb(mid, tip, 0.0058, 0.005, { ...H, k: 0.003 });
      });
      s.limb(at(-0.006, 0.006, 0.016), at(-0.012, -0.004, 0.016), 0.0074, 0.0064, { ...H, k: 0.004 });
      s.limb(at(-0.012, -0.004, 0.016), at(-0.013, -0.012, 0.006), 0.0064, 0.0052, { ...H, k: 0.003 });
    }
  });
  for (const x of s.shapes.slice(from)) x.hand = { S, o };
}

/**
 * Each hand that holds something (anything worn on its bone: a cigar, a
 * stick, a bag's handle) closed into a fist round it, as the old fists held
 * it, rather than left open beside it.
 */
export function grip(s, J, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows'] } = {}) {
  for (const S of ['L', 'R']) {
    const name = `hand${S}`, on = (bone) => (typeof bone === 'string' ? bone === name : bone.some(([b]) => b === name));
    if (!s.shapes.some((x) => !core.includes(x.part) && !skip.includes(x.part) && on(x.bone))) continue;
    const open = s.shapes.filter((x) => x.hand?.S === S);
    if (!open.length) continue;
    s.shapes = s.shapes.filter((x) => x.hand?.S !== S);
    hand(s, J, S, open[0].hand.o, true);
  }
}

/**
 * The thin pieces of what is worn (a brim, a peak, a sheet of paper),
 * meshed on the finer grid of the `fine` part, so they don't tear.
 */
export function thin(s, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows'] } = {}) {
  for (const x of s.shapes) {
    if (x.op !== 'add' || core.includes(x.part) || skip.includes(x.part)) continue;
    const c = [0, 1, 2].map((i) => (x.box[0][i] + x.box[1][i]) / 2), span = Math.max(...[0, 1, 2].map((i) => x.box[1][i] - x.box[0][i]));
    const depth = -x.d(c);
    if (depth > 0 && depth < 0.0045 && span > 0.05) x.part = 'fine';
  }
}

/**
 * The pieces a person wears put on them: everything sculpted onto the body
 * in parts of its own (badges, buttons, chains, hats, a bag) that, at rest,
 * stands just off what it is worn on (the body, or another piece: a button
 * on a coat) instead of on it, up to `reach` away, is moved onto it, and a
 * small piece sunk out of sight in it is brought up to show.
 * A piece is a lump of shapes of one part that touch; it moves whole. What
 * is held out from the body (further than `reach`) stays where it is.
 */
export function fit(s, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows'], reach = 0.035 } = {}) {
  const body = new Sculpt();
  body.shapes = s.shapes.filter((x) => core.includes(x.part));
  const [lo, hi] = body.bounds(0.06);
  body.prepare(lo, hi, reach + 0.03);
  const worn = s.shapes.filter((x) => !core.includes(x.part) && !skip.includes(x.part));
  const DIRS = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) DIRS.push([x, y, z].map((v) => v / Math.hypot(x, y, z)));
  // Points on each shape's surface: from round its middle in, to where it begins.
  const surface = (x) => {
    const c = [0, 1, 2].map((i) => (x.box[0][i] + x.box[1][i]) / 2), half = Math.hypot(...[0, 1, 2].map((i) => x.box[1][i] - x.box[0][i])) / 2;
    const points = [];
    for (const d of DIRS) {
      let t = half;
      for (let k = 0; k < 24; k++) {
        const v = x.d([c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t]);
        if (Math.abs(v) < 0.0004) break;
        t = Math.max(0, t - v);
      }
      const p = [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
      if (Math.abs(x.d(p)) < 0.002) { points.push(p); rims.push([p, d]); }
    }
    return points;
  };
  let rims = [];
  const under_rim = [];
  const points = worn.map((x, i) => {
    rims = [];
    const found = x.op === 'add' ? surface(x) : [];
    under_rim[i] = rims;
    return found;
  });
  // The brows: no hat comes down past them.
  const brows = Math.max(...s.shapes.filter((x) => x.part === 'brows').map((x) => x.box[1][1]), -Infinity);
  // Lumps: shapes of one part that touch (or a carving and what it carves).
  const up = worn.map((_, i) => i);
  const find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
  const meet = (a, b) => [0, 1, 2].every((i) => a.box[0][i] - 0.002 <= b.box[1][i] && b.box[0][i] - 0.002 <= a.box[1][i]);
  const touch = (i, j) => {
    const a = worn[i], b = worn[j];
    if (a.op !== 'add' || b.op !== 'add') return true;
    return points[i].some((p) => b.d(p) < a.k + b.k + 0.0015) || points[j].some((p) => a.d(p) < a.k + b.k + 0.0015);
  };
  for (let i = 0; i < worn.length; i++) for (let j = 0; j < i; j++) if (worn[i].part === worn[j].part && meet(worn[i], worn[j]) && find(i) !== find(j) && touch(i, j)) up[find(i)] = find(j);
  const lumps = new Map();
  worn.forEach((x, i) => { const r = find(i); if (!lumps.has(r)) lumps.set(r, []); lumps.get(r).push(i); });
  // What a lump sits on: the body, and everything else they wear.
  const under = (p, mine) => {
    let d = body.field(p);
    for (let j = 0; j < worn.length; j++) {
      const x = worn[j];
      if (x.op !== 'add' || mine.has(j)) continue;
      if (p[0] < x.box[0][0] - d || p[0] > x.box[1][0] + d || p[1] < x.box[0][1] - d || p[1] > x.box[1][1] + d || p[2] < x.box[0][2] - d || p[2] > x.box[1][2] + d) continue;
      d = Math.min(d, x.d(p));
    }
    return d;
  };
  for (const lump of lumps.values()) {
    const mine = new Set(lump);
    let near = Infinity, nearest = null, far = -Infinity, farthest = null;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const i of lump) {
      for (const p of points[i]) {
        const g = under(p, mine);
        if (g < near) { near = g; nearest = p; }
        if (g > far) { far = g; farthest = p; }
      }
      if (worn[i].op === 'add') for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], worn[i].box[0][a]); hi[a] = Math.max(hi[a], worn[i].box[1][a]); }
    }
    if (!nearest) continue;
    // A hat (a wide piece on the head, above the eyes) that rests on the crown with a gap under its rim is
    // lowered until the rim sits on the head, though never down over the brows.
    const ps = lump.flatMap((i) => points[i]);
    const bottom = Math.min(...ps.map((p) => p[1])), across = Math.max(...ps.map((p) => p[0])) - Math.min(...ps.map((p) => p[0]));
    if (lump.every((i) => worn[i].bone === 'head') && across > 0.12 && bottom > brows) {
      const gaps = [];
      for (const i of lump) for (const [p, d] of under_rim[i] ?? []) if (d[1] < -0.4) { const g = under(p, mine); if (g > 0.002 && g < 0.04) gaps.push(g); }
      if (gaps.length >= 3) {
        gaps.sort((a, b) => a - b);
        const drop = Math.min(gaps[Math.floor(gaps.length / 2)], Math.max(0, bottom - brows - 0.004));
        if (drop > 0.002) {
          for (const i of lump) {
            const x = worn[i], d = x.d, color = x.color;
            x.d = (p) => d([p[0], p[1] + drop, p[2]]);
            x.box = [[x.box[0][0], x.box[0][1] - drop, x.box[0][2]], [x.box[1][0], x.box[1][1] - drop, x.box[1][2]]];
            if (typeof color === 'function') x.color = (p, nn) => color([p[0], p[1] + drop, p[2]], nn);
          }
          continue;
        }
      }
    }
    const size = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), thin = Math.min(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    let by = 0, from = null;
    if (near > 0.0025 && near < reach) { by = -(near + 0.0012); from = nearest; }
    // Sunk out of sight, or sunk deeper than a third of its own thickness: brought out until it sits on the surface.
    else if (far < 0 && far > -0.05 && size < 0.06) { by = 0.0025 - far; from = farthest; }
    else if (size < 0.06 && near < -thin * 0.35 && near > -0.05) { by = -near - thin * 0.3; from = nearest; }
    if (!by) continue;
    const e = 0.002, grad = [0, 1, 2].map((a) => {
      const q0 = [...from], q1 = [...from];
      q0[a] -= e; q1[a] += e;
      return under(q1, mine) - under(q0, mine);
    });
    const gl = Math.hypot(...grad) || 1, o = grad.map((v) => (v / gl) * by);
    for (const i of lump) {
      const x = worn[i], d = x.d, color = x.color;
      x.d = (p) => d([p[0] - o[0], p[1] - o[1], p[2] - o[2]]);
      x.box = [x.box[0].map((v, i) => v + o[i]), x.box[1].map((v, i) => v + o[i])];
      if (typeof color === 'function') x.color = (p, nn) => color([p[0] - o[0], p[1] - o[1], p[2] - o[2]], nn);
    }
  }
}

// ——————————————————————————————————————————————— moving

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const window_ = (t, a, b) => ease((t - a) / (b - a));

/**
 * How a hero moves. `style.attack` is 'slash' (a sword across), 'chop' (an
 * axe from over the head), 'thrust' (a staff jabbed forward) or 'smite' (a
 * mace or staff brought down); `style.heavy` slows and deepens it all.
 * Clips: idle, walk, attack, cast, hit, ko, win.
 */
export function moveHumanoid(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }, style = {}) {
  const T = time + seed;
  const heavy = style.heavy ?? 0;
  const breathe = Math.sin(T * (2.4 - heavy * 0.6));
  // Always: breathing, a little sway, the off hand relaxed.
  k.scale('chest', 1 + breathe * 0.012, 1 + breathe * 0.018, 1 + breathe * 0.012);
  k.turn('armL', 0, 0, 0.05 + breathe * 0.015);
  k.turn('armR', 0, 0, -0.05 - breathe * 0.015);
  k.turn('foreL', -0.2, 0, 0);
  k.turn('foreR', -0.2, 0, 0);

  if (clip === 'idle') {
    k.turn('hips', 0, Math.sin(T * 0.7) * 0.04, Math.sin(T * 0.9) * 0.015);
    k.turn('head', Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.37) * 0.18, 0);
    k.move('hips', 0, breathe * 0.002 - 0.004, 0);
    k.turn('thighL', 0.04, 0, 0.02); k.turn('shinL', 0.08, 0, 0);
    k.turn('thighR', 0.04, 0, -0.02); k.turn('shinR', 0.08, 0, 0);
    // The hands hanging easy, a little in front.
    k.turn('armL', -0.06, 0, 0.04); k.turn('armR', -0.06, 0, -0.04);
  } else if (clip === 'walk') {
    const ph = T * (9 - heavy * 2) * Math.max(0.5, speed), g = Math.sin(ph);
    k.move('hips', 0, Math.abs(Math.cos(ph)) * 0.012 - 0.004, 0);
    k.turn('hips', 0, g * 0.12, 0);
    k.turn('chest', 0.06, -g * 0.16, 0);
    k.turn('thighL', -g * 0.55, 0, 0); k.turn('shinL', Math.max(0, g) * 0.8, 0, 0); k.turn('footL', -g * 0.2, 0, 0);
    k.turn('thighR', g * 0.55, 0, 0); k.turn('shinR', Math.max(0, -g) * 0.8, 0, 0); k.turn('footR', g * 0.2, 0, 0);
    // The arms swinging against the legs.
    k.turn('armL', g * 0.4, 0, 0.04);
    k.turn('armR', -g * 0.4, 0, -0.04);
    k.turn('foreL', -0.2 + Math.min(0, g) * 0.3, 0, 0);
    k.turn('foreR', -0.2 - Math.max(0, g) * 0.3, 0, 0);
  } else if (clip === 'attack') {
    attack(k, t, style);
  } else if (clip === 'cast') {
    // Gather, then both hands up and out: the spell goes.
    const up = window_(t, 0, 0.3), go = window_(t, 0.3, 0.42), back = window_(t, 0.65, 1);
    const lift = up * (1 - back);
    k.turn('chest', -0.12 * lift + 0.08 * go * (1 - back), 0, 0);
    k.turn('head', -0.15 * lift, 0, 0);
    k.turn('armR', -1.9 * lift - 0.35 * (1 - lift), 0, -0.25 * lift - 0.1);
    k.turn('foreR', -0.3 * lift - 0.7 * (1 - lift), 0, 0);
    k.turn('armL', -1.2 * lift - 0.5 * go * (1 - back), 0, 0.5 * lift);
    k.turn('foreL', -0.5 * lift, 0, 0);
    k.move('hips', 0, 0.01 * lift, 0);
  } else if (clip === 'hit') {
    const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
    k.move('root', 0, 0, -0.05 * h);
    k.turn('spine', -0.25 * h, 0, 0.1 * h);
    k.turn('head', -0.3 * h, 0.2 * h, 0);
    k.turn('armL', -0.6 * h, 0, 0.5 * h);
    k.turn('armR', -0.6 * h, 0, -0.5 * h);
    k.turn('thighL', -0.2 * h, 0, 0); k.turn('shinL', 0.3 * h, 0, 0);
  } else if (clip === 'ko') {
    // Down on one knee, then over onto the back, legs out.
    const kneel = window_(t, 0, 0.3), fall = window_(t, 0.3, 0.75), up = kneel * (1 - fall);
    k.move('hips', 0, -0.13 * up - 0.27 * fall, -0.02 * up - 0.12 * fall);
    k.turn('hips', -1.45 * fall, 0, 0);
    k.turn('thighL', -1.2 * up + 0.25 * fall, 0, 0.12 * fall);
    k.turn('shinL', 1.5 * up + 0.15 * fall, 0, 0);
    k.turn('thighR', 0.2 * up + 0.2 * fall, 0, -0.18 * fall);
    k.turn('shinR', 2.0 * up + 0.35 * fall, 0, 0);
    k.turn('footL', 0.4 * fall, 0, 0);
    k.turn('footR', 0.4 * fall, 0, 0);
    k.turn('spine', 0.4 * up + 0.05 * fall, 0, 0);
    k.turn('head', 0.5 * up - 0.1 * fall, 0.5 * fall, 0);
    k.turn('armL', -0.4 * up, 0, 1.1 * fall);
    k.turn('armR', -0.4 * up, 0, -1.1 * fall);
    k.turn('foreL', -0.3 * fall, 0, 0);
  } else if (clip === 'win') {
    // The weapon up, a little hop.
    const up = window_(t, 0, 0.3);
    const hop = Math.max(0, Math.sin(Math.min(1, t / 0.5) * Math.PI)) * 0.03;
    k.move('root', 0, hop, 0);
    k.turn('armR', -2.6 * up - 0.35 * (1 - up), 0, -0.25 * up);
    k.turn('foreR', -0.2 * up, 0, 0);
    k.turn('armL', 0, 0, 0.5 * up);
    k.turn('foreL', -0.9 * up, 0, 0);
    k.turn('chest', -0.1 * up, 0, 0);
    k.turn('head', -0.2 * up, 0, 0);
  }
  // Whatever is particular to this one, on top of all that.
  style.after?.(k, { clip, t, time, seed, speed }, T);
}

function attack(k, t, style) {
  const heavy = style.heavy ?? 0;
  const wind = window_(t, 0, 0.22 + heavy * 0.06), strike = window_(t, 0.24 + heavy * 0.05, 0.34 + heavy * 0.05), back = window_(t, 0.5, 0.85);
  const w = wind * (1 - strike), s = strike * (1 - back);
  // A step in with the strike.
  k.move('root', 0, 0, 0.06 * s);
  k.turn('thighL', -0.5 * s, 0, 0); k.turn('shinL', 0.35 * s, 0, 0);
  k.turn('thighR', 0.35 * s, 0, 0); k.turn('shinR', 0.25 * s, 0, 0);
  switch (style.attack ?? 'slash') {
    case 'slash':
      // From high on the right across and down to the left.
      k.turn('chest', -0.1 * w + 0.15 * s, 0.6 * w - 0.55 * s, 0);
      k.turn('armR', -2.1 * w - 1.1 * s - 0.35 * (1 - w - s), 0, -0.6 * w + 0.25 * s);
      k.turn('foreR', -0.4 * w - 0.2 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('handR', 0.3 * w - 0.5 * s, 0, 0);
      k.turn('armL', 0.3 * s, 0, 0.3 * w);
      break;
    case 'chop':
      // Both hands up over the head, and down.
      k.turn('chest', -0.25 * w + 0.35 * s, 0.2 * w, 0);
      k.turn('armR', -2.8 * w - 1.0 * s - 0.35 * (1 - w - s), 0, -0.1);
      k.turn('foreR', -0.5 * w - 0.2 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -2.6 * w - 0.9 * s, 0, -0.35 * (w + s));
      k.turn('foreL', -0.6 * w - 0.4 * s, 0, 0);
      k.turn('handR', 0.4 * w - 0.6 * s, 0, 0);
      break;
    case 'thrust':
      // The staff drawn back and jabbed out.
      k.turn('chest', 0.05 * s, 0.4 * w - 0.25 * s, 0);
      k.turn('armR', -0.2 * w - 1.35 * s - 0.35 * (1 - w - s), 0, -0.2 * w);
      k.turn('foreR', -1.3 * w - 0.1 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -0.9 * (w + s), 0, 0.2);
      k.turn('foreL', -0.6 * (w + s), 0, 0);
      break;
    case 'shove':
      // Both hands drawn back, then driven out together.
      k.turn('chest', 0.12 * s - 0.1 * w, 0, 0);
      k.turn('armR', 0.5 * w - 1.5 * s - 0.35 * (1 - w - s), 0, -0.1);
      k.turn('foreR', -0.2 * w - 0.1 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', 0.5 * w - 1.5 * s, 0, 0.1);
      k.turn('foreL', -0.2 * w - 0.1 * s - 0.15 * (1 - w - s), 0, 0);
      break;
    case 'punch':
      // A big right hook.
      k.turn('chest', 0, 0.6 * w - 0.8 * s, 0);
      k.turn('armR', -0.3 * w - 1.35 * s - 0.35 * (1 - w - s), 0, -0.5 * w);
      k.turn('foreR', -1.5 * w - 0.15 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', 0.3 * s, 0, 0.3);
      break;
    case 'flail': {
      // Both arms going round like windmills.
      const a = (t * 22) % (Math.PI * 2);
      k.turn('armR', -a, 0, -0.5);
      k.turn('armL', a, 0, 0.5);
      k.turn('foreR', -0.4, 0, 0);
      k.turn('foreL', -0.4, 0, 0);
      k.turn('chest', 0, Math.sin(a) * 0.3, 0);
      break;
    }
    case 'hug':
      // Arms wide, then closing round whoever it is.
      k.turn('armR', -0.9 * w - 0.4 * s - 0.35 * (1 - w - s), 0, -1.1 * w + 0.3 * s);
      k.turn('armL', -0.9 * w - 0.4 * s, 0, 1.1 * w - 0.3 * s);
      k.turn('foreR', -0.2 * w - 1.0 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('foreL', -0.2 * w - 1.0 * s, 0, 0);
      k.turn('chest', 0.15 * s, 0, 0);
      break;
    case 'smite':
    default:
      // Raised high on the right, brought straight down.
      k.turn('chest', -0.2 * w + 0.25 * s, 0.25 * w, 0);
      k.turn('armR', -2.9 * w - 0.9 * s - 0.35 * (1 - w - s), 0, -0.3 * w);
      k.turn('foreR', -0.2 * w - 0.3 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -0.5 * w, 0, 0.4 * w);
      break;
  }
}
