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
  // Up and down: the legs', the trunk's and the head's stretch, each easing into the next (over the top of the
  // thighs, and down the neck below the jaw) so that nothing has a crease where one stretch meets the next.
  const slope = (y) => {
    const a = legs + (torso - legs) * step(HIP - 0.02, HIP + 0.02, y);
    return a + (head - a) * step(NECK - 0.055, NECK - 0.015, y);
  };
  // Where each height goes, and back, in tables fine enough to read straight off.
  const Y0 = -0.4, Y1 = 1.8, N = 4400, dy = (Y1 - Y0) / N;
  const U = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) U[i] = U[i - 1] + ((slope(Y0 + (i - 1) * dy) + slope(Y0 + i * dy)) / 2) * dy;
  const zero = (() => { const f = -Y0 / dy, i = Math.floor(f); return U[i] + (U[i + 1] - U[i]) * (f - i); })();
  for (let i = 0; i <= N; i++) U[i] -= zero;
  const up = (y) => {
    if (y <= Y0) return U[0] + (y - Y0) * slope(Y0);
    if (y >= Y1) return U[N] + (y - Y1) * slope(Y1);
    const f = (y - Y0) / dy, i = Math.min(N - 1, Math.floor(f));
    return U[i] + (U[i + 1] - U[i]) * (f - i);
  };
  const V0 = U[0], dv = (U[N] - U[0]) / N, D = new Float64Array(N + 1);
  for (let i = 0, j = 0; i <= N; i++) {
    const v = V0 + i * dv;
    while (j < N - 1 && U[j + 1] < v) j++;
    D[i] = Y0 + (j + Math.max(0, Math.min(1, (v - U[j]) / (U[j + 1] - U[j])))) * dy;
  }
  const down = (v) => {
    if (v <= V0) return Y0 + (v - V0) / slope(Y0);
    if (v >= U[N]) return Y1 + (v - U[N]) / slope(Y1);
    const f = (v - V0) / dv, i = Math.min(N - 1, Math.floor(f));
    return D[i] + (D[i + 1] - D[i]) * (f - i);
  };
  // Across: the legs' spread, then the trunk's, then (up the neck) the head's, each easing into the next.
  const wide = (y) => {
    const trunk = hips + (girth - hips) * step(0.25, 0.36, y);
    return trunk + (head - trunk) * step(NECK - 0.065, NECK - 0.015, y);
  };
  return {
    scale: ([, y]) => Math.min(wide(y), slope(y)),
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
 * middle is, how square it is (2 round, higher squarer)]. The pelvis is as
 * wide as the tops of the thighs, so a hip runs on down into its leg in one
 * line rather than standing out of the side in a point.
 */
const TRUNK = [
  [0.258, 0.06, 0.044, -0.006, 2.2],
  [0.29, 0.088, 0.059, -0.008, 2.4],
  [0.322, 0.089, 0.06, -0.007, 2.5],
  [0.372, 0.075, 0.057, 0.003, 2.5],
  [0.43, 0.086, 0.064, 0.008, 2.6],
  [0.472, 0.094, 0.07, 0.009, 2.7],
  [0.505, 0.09, 0.057, 0.001, 2.6],
  [0.53, 0.056, 0.038, -0.006, 2.2],
  [0.548, 0.03, 0.028, -0.006, 2],
];

/**
 * The trunk's section at height y, for breadth `b` and `belly`: a smooth
 * curve through TRUNK (each measure on a Catmull-Rom spline, so the profile
 * has no kinks or flats), the belly carried out in front of the waist, round
 * from the ribs to the belt rather than a ring round the middle.
 */
export function trunk(b, belly) {
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
    // The belly: a round swell forward of the waist, from under the ribs down over the belt, as tall as it is
    // deep; the bigger it is, the lower it hangs. Not a ring round the middle: the sides and the back only fill
    // out, and that gently, over the whole trunk from the chest to the seat, so the waist goes and the chest and
    // the hips come with it. A broad build is deeper through the body too.
    const mid = 0.375 - belly * 0.01, half = 0.085 + belly * 0.018, u = (y - mid) / half;
    const g = belly * Math.exp(-u * u * 1.7);
    const f = belly * Math.exp(-(((y - 0.39) / 0.15) ** 2));
    return [w * b + f * 0.0075 * b, d * (1 + (b - 1) * 0.6) + g * 0.022 + f * 0.005, zc + g * 0.022, Math.max(2, e - g * 0.25)];
  };
}

/**
 * A piece of a lofted body from height `y0` to `y1`, its section at each
 * height `at(y)` ([half width, half depth, middle, squareness]), flat at
 * either end (the pieces overlap and meet there). `grow` makes it that much
 * bigger all round at its bottom and not at all at its top: a shirt's tail
 * standing out over the trousers. `round` rounds its bottom edge.
 */
export function loft(s, at, y0, y1, o, grow = 0, round = 0, clip = null) {
  let wide = 0, deep = 0;
  for (let y = y0; y <= y1 + 1e-9; y += 0.005) {
    const [w, d, zc] = at(y);
    wide = Math.max(wide, w + grow);
    deep = Math.max(deep, d + grow + Math.abs(zc));
  }
  const field = (p) => {
    const y = Math.max(y0, Math.min(y1, p[1]));
    const g = grow * Math.max(0, 1 - (y - y0) / Math.min(y1 - y0, 0.05)) ** 1.5;
    const [w0, d0, zc, e] = at(y), w = w0 + g, d = d0 + g;
    const x = Math.abs(p[0]) / w, z = Math.abs(p[2] - zc) / d;
    const around = ((x ** e + z ** e) ** (1 / e) - 1) * Math.min(w, d) * 0.9;
    if (!round) return Math.max(around, y0 - p[1], p[1] - y1);
    // A rolled hem: the bottom edge rounded off rather than cut.
    const a = around + round, u = y0 + round - p[1];
    return Math.max(Math.hypot(Math.max(a, 0), Math.max(u, 0)) + Math.min(Math.max(a, u), 0) - round, p[1] - y1);
  };
  // `clip(p)`, if given, keeps only where it is negative (half of it, say).
  s.shape(clip ? (p) => Math.max(field(p), clip(p)) : field, [[-wide, y0, -deep], [wide, y1, deep]], o);
}

/**
 * Where a band round the trunk at height `y` (as sculpted) sits: the middle
 * and half sizes of the oval the surface so far makes there, found by
 * looking out from the middle each way until out of the body.
 */
export function girdle(s, y) {
  const w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
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
  return { c: [(right + left) / 2, y, (front + rear) / 2], rx: (right - left) / 2, rz: (front - rear) / 2 };
}

/**
 * A band of `o`'s leather (a belt) round the trunk at height `y`, `r` high
 * and `thick` thick, fitted to the surface as sculpted so far and standing
 * on it, its front lower than its back by `tilt`. Returns where its front is.
 */
export function band(s, y, r, thick, o, tilt = 0.03) {
  const g = girdle(s, y);
  const c = g.c, rx = g.rx + thick * 0.55, rz = g.rz + thick * 0.55;
  s.shape((p) => {
    const x = p[0] - c[0], z = p[2] - c[2];
    const around = Math.abs((Math.hypot(x / rx, z / rz) - 1) * Math.min(rx, rz)) - thick * 0.5;
    const up = Math.abs(p[1] - c[1] + tilt * z) - r;
    // A strap: flat faced, its edges just rounded.
    const q = 0.0012;
    return Math.hypot(Math.max(around + q, 0), Math.max(up + q, 0)) + Math.min(Math.max(around + q, up + q), 0) - q;
  }, [[c[0] - rx - thick, y - r - tilt * rz - 0.01, c[2] - rz - thick], [c[0] + rx + thick, y + r + tilt * rz + 0.01, c[2] + rz + thick]], { ...o, k: 0.001 });
  return c[2] + rz + thick * 0.5;
}

/** A belt buckle on the front of a belt at `front`: a frame round an open middle, and the tongue across it. */
export function buckle(s, y, front, color, bone) {
  const B = { color, mat: 'metal', bone, k: 0.001 };
  s.box([0, y, front + 0.0015], [0.0135, 0.0105, 0.0022], 0.0016, B);
  s.box([0, y, front + 0.0035], [0.0085, 0.0058, 0.004], 0.001, { op: 'sub', k: 0.0008 });
  s.box([0.002, y, front + 0.0018], [0.0062, 0.0016, 0.0016], 0.0008, B);
}

/** Skin: warm, rosier where it faces forward and down a little. */
export function skinTone(hex = '#e9b48f') {
  const base = coat({ over: hex, under: hex, vary: 0.06, freq: 14, grain: 0.03 });
  const rose = rgb('#d9826e');
  return (p, n) => mix(base(p, n), rose, Math.max(0, n[2]) * 0.12);
}

/** Distance to a capsule from a (radius r1) to b (radius r2): Quilez's round cone. */
function roundCone(p, a, b, r1, r2) {
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l2 = ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const y = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2], z = y - l2;
  const xv = [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y];
  const x2 = xv[0] ** 2 + xv[1] ** 2 + xv[2] ** 2, y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/**
 * A tube of cloth from `a` (radius r1, round) to `b` (r2), its end at b cut
 * square across, its rim just rounded: a short sleeve, a cuff, the leg of
 * a pair of shorts or of a boot. What it is worn over comes out of the end.
 */
export function tube(s, a, b, r1, r2, o) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d), u = d.map((v) => v / l);
  // Run on past the cut, so the end is the cut and not the round cap.
  const far = b.map((v, i) => v + u[i] * r2);
  const q = 0.0018, m = Math.max(r1, r2);
  return s.shape((p) => {
    const e1 = roundCone(p, a, far, r1, r2) + q, e2 = (p[0] - b[0]) * u[0] + (p[1] - b[1]) * u[1] + (p[2] - b[2]) * u[2] + q;
    return Math.hypot(Math.max(e1, 0), Math.max(e2, 0)) + Math.min(Math.max(e1, e2), 0) - q;
  }, [[0, 1, 2].map((i) => Math.min(a[i], b[i]) - m), [0, 1, 2].map((i) => Math.max(a[i], b[i]) + m)], o);
}

/**
 * The parts a person's own body and clothes are meshed in, each on its own
 * so that where one garment meets another, or the skin, there is a clean
 * edge and no colour bleeding across it: the skin ('body'), the head, the
 * hands (with a bare forearm, or a glove), the shirt or jacket ('top'), its
 * sleeves where they are another colour ('sleeves', 'cuffs'), the trousers,
 * shorts or skirt ('bottoms'), socks or tights ('hose'), the belt and the
 * shoes; and what is worn over them, fitted to them as it is made: a coat,
 * a vest, an apron, a cape ('outer', and 'outer2' over that) and straps,
 * cords and chains ('straps'). What is worn on top of all these (`fit`) is
 * put on them; they are not moved.
 */
export const CORE = ['body', 'head', 'hands', 'shoes', 'soles', 'top', 'sleeves', 'cuffs', 'bottoms', 'hose', 'belt', 'outer', 'outer2', 'straps'];

/**
 * Whether a part is the body's own (CORE), or a rigid piece of something it
 * rides or carries ('rigid:…': a bicycle's wheel, a skateboard), meshed on
 * its own and moving with its one bone; neither is moved by `fit`.
 */
export const isCore = (part, core = CORE) => core.includes(part) || part.startsWith('rigid');

/**
 * A skirt (or a robe, to the floor) in part 'bottoms': a bell from the
 * waist at `top` to the hem at `hem`, `flare` times as wide at the hem as a
 * straight drop from the hips, with a rolled hem. Each half moves with its
 * leg as well as the hips, so a stride swings it rather than coming through
 * it. `slit` opens it down the front (a coat's skirts). `at` is the trunk's
 * section at a height.
 */
export function skirt(s, at, { top = 0.372, hem = 0.16, flare = 1.25, color, mat = 'cloth', b = 1, k = 0.004, part = 'bottoms', slit = 0, bump = null }) {
  // Over the hips, clear of the tops of the thighs (which stand out past the hips a little), then out to the hem:
  // wide enough there to hold the legs (at ±0.06, about 0.035 round) with room to stride.
  const hip = at(0.3), hw = Math.max(hip[0], 0.1 * Math.sqrt(b)) + 0.008, hd = Math.max(hip[1], 0.064) + 0.008;
  const hx = Math.max(hw, 0.105 * Math.sqrt(b)) * flare, hz = Math.max(hd, 0.07) * (1 + (flare - 1) * 0.8);
  const waist = Math.min(top, 0.36), at0 = at(waist);
  const section = (y) => {
    if (y >= waist) {
      // From the waist up, just clear of the body.
      const [w, d, zc, e] = at(y);
      return [w + 0.005, d + 0.005, zc, e];
    }
    if (y >= 0.3) {
      // Over the hips.
      const t = (waist - y) / (waist - 0.3), f = t * t * (3 - 2 * t);
      return [at0[0] + 0.005 + (hw - at0[0] - 0.005) * f, at0[1] + 0.005 + (hd - at0[1] - 0.005) * f, at0[2] * (1 - f) + hip[2] * f, 2.3];
    }
    // Below the hips, out toward the hem along a soft curve.
    const t = Math.min(1, (0.3 - y) / Math.max(0.01, 0.3 - hem)), f = Math.sin((t * Math.PI) / 2) ** 0.8;
    return [hw + (hx - hw) * f, hd + (hz - hd) * f, hip[2] * (1 - f), 2.2];
  };
  for (const m of [1, -1]) {
    const S = side(m);
    const bone = [['hips', 0.55], [`thigh${S}`, 0.45]];
    // This half only (the other is the other leg's), meeting it down the middle.
    // This half only, and (a coat's skirts) open down the front by `slit` either side of the middle.
    s.part(part, () => loft(s, section, hem, top, { color, mat, bone, k, bump }, 0, 0.004, (p) => Math.max(-m * p[0], slit ? Math.min(slit - Math.abs(p[0]), p[2] - 0.02) : -1)));
  }
}

/**
 * The body, dressed: `look` gives the colours (functions or hex) of `skin`,
 * `torso`, `sleeve` (upper arm), `cuff` (forearm), `hand`, `legs`, `boot`,
 * and if they have them a `belt` (and its `buckle`) and a `sole` under the
 * shoes; and `mats` the materials of the same (default 'cloth', 'skin' for
 * skin). Each garment is meshed on its own (see CORE): the shirt over the
 * trousers with a hem that stands out over them (or tucked into a belt,
 * `tuck`), sleeves to the wrist with a cuff, or short with the arm coming
 * out of them, or none; a glove where a bare arm meets a covered hand.
 * The calf is the trousers (`legs`) down to the shoe unless `shin` says
 * otherwise: a colour (socks, tights) or 'skin', under shorts that end
 * above the knee, or under a `skirt` ({ hem, flare }: see `skirt`). `boots`
 * pulls a boot (in `boot`) up over the calf, to just under the knee or to
 * the height given; `shoeless` ('L' or 'R') leaves a foot bare of its shoe.
 * `b` is the breadth; `belly` (0 to 2 or so) how far a belly sticks out.
 */
export function body(s, { look, mats = {}, b = 1, k = 0.03, belly = 0 }) {
  const J = joints(b);
  const m = (part) => mats[part] ?? (part === 'skin' || part === 'hand' ? 'skin' : 'cloth');
  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') }, L = { color: c('legs'), mat: m('legs') };
  const bare = (part) => m(part) === 'skin';
  const at = trunk(b, belly);
  // What is under the shorts or the skirt (or below the trousers): the calf is the trousers unless it is bare or in socks.
  const skirted = Boolean(look.skirt);
  const shin = look.shin ?? (skirted ? c('skin') : c('legs'));
  const shinMat = mats.shin ?? (look.shin === undefined ? (skirted ? 'skin' : m('legs')) : look.shin === look.skin || look.shin === c('skin') ? 'skin' : 'cloth');
  const legsBare = bare('legs');
  // Shorts or a skirt: the trousers stop above the knee, and the leg below is the shin's.
  const short = !legsBare && (skirted || (look.shin !== undefined && shin !== c('legs')));
  const legPart = (mat, color) => (mat === 'skin' ? 'body' : color === c('legs') && !legsBare ? 'bottoms' : 'hose');
  const lower = legsBare ? 'body' : 'bottoms';

  // Where one garment goes under another (a shirt into the trousers, the trousers up under a shirt's tail),
  // the one underneath is taken in a little, so the two never lie in the same place.
  const topBare = bare('torso');
  const tucked = look.tuck ?? Boolean(look.belt);
  const inside = topBare || tucked || skirted;
  const under = (lo, hi, by, rising) => (y) => {
    const [w, d, zc, e] = at(y), t = Math.max(0, Math.min(1, (y - lo) / (hi - lo))), g = by * (rising ? t : 1 - t);
    return [w - g, d - g, zc, e];
  };

  // The trousers (or shorts, or what is under a skirt): the trunk from the crotch to the waist, lofted, in
  // one with the legs, on the hips.
  s.part(skirted ? legPart(shinMat, shin) : lower, () => loft(s, inside ? at : under(0.334, 0.348, 0.002, true), 0.258, 0.37, { ...(skirted ? { color: shin, mat: shinMat } : L), bone: 'hips', k: k * 0.15 }));
  if (skirted) skirt(s, at, { ...look.skirt, color: c('legs'), mat: m('legs'), b });

  // The shirt, from its hem to the neck, in two pieces (the belly, the chest) so that it bends. Bare, it is the
  // skin, in one with the arms. Loose, its tail stands out over the trousers; tucked (under a belt), it goes
  // into them. A bare chest above trousers meets them at their waistband.
  const topPart = topBare ? 'body' : 'top';
  const hem = inside ? 0.35 : 0.326;
  s.part(topPart, () => {
    loft(s, inside ? under(0.372, 0.386, 0.002, false) : at, hem, 0.445, { ...T, bone: inside ? 'spine' : [['spine', 0.6], ['hips', 0.4]], k: 0.003 }, inside ? 0 : 0.0055, inside ? 0 : 0.003);
    loft(s, at, 0.425, 0.548, { ...T, bone: 'chest', k: 0.003 });
  });
  // The trousers' waistband, under a bare chest.
  if (topBare && !legsBare && !skirted) s.part(lower, () => band(s, 0.364, 0.0072, 0.0032, { ...L, bone: 'hips' }));
  // A belt, if they wear one: a strap round the top of the trousers, on them, and a buckle.
  if (look.belt) {
    s.part('belt', () => {
      const front = band(s, 0.352, 0.0078, 0.0036, { color: look.belt, mat: 'leather', bone: 'hips' });
      if (look.buckle) buckle(s, 0.352, front, look.buckle, 'hips');
    });
  }

  for (const mm of [1, -1]) {
    const S = side(mm), sh = J[`shoulder${S}`], el = J[`elbow${S}`], wr = J[`wrist${S}`];
    const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    // The arm: a round shoulder grown out of the top of the trunk, the upper arm tapering to the elbow. In a
    // long sleeve it is the shirt's (or, another colour, a sleeve of its own); in a short one it is bare under a
    // tube of cloth open halfway to the elbow; bare, it is the skin's.
    const sleeved = !bare('sleeve'), cuffed = !bare('cuff');
    const shortSleeve = sleeved && !cuffed;
    // Bare skin of an arm is one mesh, so the elbow bends without a seam: with a bare chest, the body's; under a top,
    // the hands' (its shoulder hidden in the armhole or under a short sleeve).
    const armPart = !sleeved || shortSleeve ? (topBare ? 'body' : 'hands') : c('sleeve') === c('torso') && !topBare ? 'top' : 'sleeves';
    const U = shortSleeve ? { color: c('skin'), mat: 'skin', bone: `arm${S}` } : { color: c('sleeve'), mat: m('sleeve'), bone: `arm${S}` };
    // (Under a short sleeve only the part of the arm that shows: no bare shoulder to come up through it.)
    s.part(armPart, () => s.limb(shortSleeve ? along(sh, el, 0.3) : [sh[0] - mm * 0.006, sh[1] + 0.004, sh[2]], el, shortSleeve ? 0.031 : sleeved ? 0.036 : 0.0345, 0.0245, { ...U, k: 0.016 }));
    if (shortSleeve) {
      s.part(c('sleeve') === c('torso') && !topBare ? 'top' : 'sleeves', () => {
        // Grown out of the shirt's shoulder, open halfway to the elbow, the arm coming out of it.
        tube(s, [sh[0] - mm * 0.008, sh[1] + 0.006, sh[2]], along(sh, el, 0.56), 0.0395, 0.0355, { color: c('sleeve'), mat: m('sleeve'), bone: `arm${S}`, k: 0.012 });
      });
    }
    // The forearm, tapering to the wrist. Bare, it goes with the hand, so there is no seam at the wrist. In a long
    // sleeve it is the sleeve's, ending in a cuff the hand comes out of; a glove (a covered forearm under a bare
    // arm) goes with the hand, its top a little flared.
    const glove = cuffed && !sleeved;
    const forePart = glove ? 'hands' : !cuffed ? (topBare && !sleeved ? 'body' : 'hands') : c('cuff') === c('sleeve') ? armPart : 'cuffs';
    s.part(forePart, () => {
      const F = { color: c('cuff'), mat: m('cuff'), bone: `fore${S}` };
      s.limb(el, wr, cuffed && !glove ? 0.026 : 0.0245, cuffed && !glove ? 0.021 : 0.0185, { ...F, k: 0.006 });
      // A cuff at the wrist, a little proud of the sleeve, the hand coming out of it.
      if (cuffed && !glove && c('hand') !== c('cuff')) tube(s, along(el, wr, 0.74), along(el, wr, 1.04), 0.0228, 0.0222, { ...F, k: 0.002 });
      if (glove) s.cylinder(along(el, wr, 0.08), 0.0275, 0.006, { ...F, k: 0.004, round: 0.003, rot: [-0.17, 0, mm * 0.145] });
    });
    // A hand, a mesh of its own: open and loosely curled, or a fist round what it holds (`grip`).
    hand(s, J, S, { color: c('hand'), mat: m('hand') });

    // The leg: the thigh full at the hip and tapering to the knee, the shin with the gentle swell of the calf,
    // narrowing to the ankle. The trousers' thigh is the trousers'; under shorts or a skirt, the shin's.
    const hip = J[`hip${S}`], kn = J[`knee${S}`], a = J[`ankle${S}`];
    const thighColor = short ? shin : c('legs'), thighMat = short ? shinMat : m('legs');
    s.part(short ? legPart(shinMat, shin) : lower, () => {
      s.limb([hip[0] * 0.92, hip[1] - 0.008, hip[2]], kn, 0.046 * Math.sqrt(b), 0.0335, { color: thighColor, mat: thighMat, bone: `thigh${S}`, k: 0.014 });
    });
    // Shorts: a leg of cloth a little wider than the thigh, open above the knee.
    if (short && !skirted) {
      s.part('bottoms', () => tube(s, [hip[0] * 1.02, 0.3, hip[2]], along(hip, kn, look.shorts ?? 0.62), 0.054 * Math.sqrt(b), 0.0465 * Math.sqrt(b), { ...L, bone: `thigh${S}`, k: 0.01 }));
    }
    const calf = { color: shin, mat: shinMat, bone: `shin${S}` };
    s.part(legPart(shinMat, shin), () => {
      s.limb(kn, [a[0], a[1] + 0.07, a[2] - 0.004], 0.0325, 0.0305, { ...calf, k: 0.006 });
      s.limb([a[0], a[1] + 0.07, a[2] - 0.004], [a[0], a[1] + 0.012, a[2]], 0.0305, 0.0245, { ...calf, k: 0.006 });
    });
    // Trousers hang straight from the knee to the shoe, rather than wrap the calf like tights, and stop on it.
    if (!short && !look.boots && !legsBare && shinMat !== 'skin' && look.shoeless !== S) {
      s.part('bottoms', () => {
        // (Flares, `flare` times as wide at the hem.)
        s.limb([kn[0], kn[1] - 0.008, kn[2]], [a[0], 0.072, a[2] - 0.002], 0.0362, 0.0372 * (look.flare ?? 1), { ...L, bone: `shin${S}`, k: 0.006 });
        // The hem, cut level just over the shoe.
        s.box([a[0], 0.04, a[2]], [0.06, 0.018, 0.06], 0, { op: 'sub', k: 0.003 });
      });
    }
    if (look.shoeless === S) continue;
    // Bare feet: a foot, melted into the leg, with its toes; no shoe. In sandals (`sandals`, their colour), the
    // bare foot on a flat sole, a thong from between the first two toes over the top of the foot to either side.
    if (bare('boot') && (look.sandals || (!look.sole && !look.boots))) {
      s.part(legPart(shinMat, shin) === 'body' ? 'body' : 'shoes', () => bareFoot(s, a, mm, { color: c('boot'), mat: 'skin', bone: `foot${S}` }));
      if (look.sandals) {
        s.part('shoes', () => {
          const SA = { color: look.sole ?? look.sandals, mat: 'rubber', bone: `foot${S}` };
          sole(s, [a[0] + mm * 0.002, 0.0045, a[2] + 0.036], [0.033, 0.0045, 0.068], SA);
          const toe = [a[0] - mm * 0.0115, 0.011, a[2] + 0.076];
          for (const [x, z] of [[-0.027, 0.036], [0.029, 0.04]]) {
            const end = [a[0] + mm * x, 0.009, a[2] + z], mid = [a[0] + mm * x * 0.45, 0.03, a[2] + (z + 0.076) / 2 - 0.004];
            s.limb(toe, mid, 0.0042, 0.0042, { ...SA, color: look.sandals, k: 0.003 });
            s.limb(mid, end, 0.0042, 0.0042, { ...SA, color: look.sandals, k: 0.003 });
          }
          s.sphere(toe, 0.005, { ...SA, color: look.sandals, k: 0.002 });
        });
      }
      continue;
    }
    // A shoe, a mesh of its own so the trousers go into it on a clean edge: flat underneath, round at the heel and
    // the toe, and a sole just proud of it.
    s.part('shoes', () => {
      const F = { color: c('boot'), mat: m('boot'), bone: `foot${S}` };
      // A boot's leg over the calf, the trousers tucked in, and a band round its top.
      if (look.boots) {
        const top = look.boots === true ? 0.15 : look.boots;
        s.limb([a[0], 0.05, a[2]], [a[0], top, a[2] - 0.004], 0.034, 0.0398, { ...F, bone: `shin${S}`, k: 0.012 });
        s.torus([a[0], top, a[2] - 0.004], 0.0398, 0.0055, { ...F, bone: `shin${S}`, k: 0.003 });
        s.cylinder([a[0], top + 0.004, a[2] - 0.004], 0.033, 0.006, { op: 'sub', k: 0.002 });
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

// ——————————————————————————————————————————————— fitted to the body

/**
 * What has been sculpted so far of the parts `parts` (the body and what is
 * worn as part of it, by default), as a field of its own to fit things to,
 * in the space it is built in (after the build's warp). `keep(shape)` can
 * leave shapes out: an arm, when a vest is fitted to the trunk.
 */
export function bodyField(s, parts = CORE, keep = () => true) {
  const x = new Sculpt();
  x.shapes = s.shapes.filter((sh) => parts.includes(sh.part) && keep(sh));
  const [lo, hi] = x.bounds(0.06);
  x.prepare(lo, hi, 0.07);
  return x;
}

/** p (built space) moved onto the surface of `field`, and the surface's normal there. */
export function onto(field, p) {
  let q = p, n = [0, 1, 0];
  for (let i = 0; i < 6; i++) {
    const d = field.field(q);
    n = field.gradient(q, 0.0015);
    q = [q[0] - n[0] * d, q[1] - n[1] * d, q[2] - n[2] * d];
    if (Math.abs(d) < 1e-5) break;
  }
  return { p: q, n };
}

/** The bone of the shape of `field` nearest p: what something lying on it there moves with. */
function boneAt(field, p) {
  let best = Infinity, bone = 'root';
  for (const sh of field.near(p)) {
    if (sh.op !== 'add') continue;
    const d = sh.d(p);
    if (d < best) { best = d; bone = typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]; }
  }
  return bone;
}

/** Points along a smooth curve (Catmull-Rom) through `pts`, about `step` apart; round and back to the start if `closed`. */
function curve(pts, step = 0.01, closed = false) {
  const n = pts.length, out = [];
  const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]), m = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < m; k++) {
      const t = k / m;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

/** Distance from p to the polyline `pts` (closed if `closed`). */
function toLine(p, pts, closed) {
  let best = Infinity;
  const n = pts.length, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const ab0 = b[0] - a[0], ab1 = b[1] - a[1], ab2 = b[2] - a[2], ap0 = p[0] - a[0], ap1 = p[1] - a[1], ap2 = p[2] - a[2];
    const t = Math.max(0, Math.min(1, (ab0 * ap0 + ab1 * ap1 + ab2 * ap2) / (ab0 * ab0 + ab1 * ab1 + ab2 * ab2 || 1)));
    const d = Math.hypot(ap0 - ab0 * t, ap1 - ab1 * t, ap2 - ab2 * t);
    if (d < best) best = d;
  }
  return best;
}

/** The larger of a and b, rounded off over k: an edge cut by a region comes out round, not ragged. */
const roundMax = (a, b, k) => {
  const h = Math.max(0, Math.min(1, 0.5 - (0.5 * (b - a)) / k));
  return b + (a - b) * h + k * h * (1 - h);
};

/** Runs the shapes `fn` adds in the built space as given, unwarped (they are made to fit what is there already). */
function built(s, fn) {
  const w = s.warp;
  s.warp = null;
  try { fn(w); } finally { s.warp = w; }
}

/**
 * Where the body (and what is worn as part of it, `over`) is nearest the
 * point p (as sculpted): that point on it, and the way out of it there, as
 * sculpted; and the bone it moves with. For putting something flush on it.
 */
export function onBody(s, p, over = CORE, keep = () => true) {
  const field = bodyField(s, over, keep), w = s.warp;
  const one = (q) => {
    const hit = onto(field, w ? w.to(q) : q);
    return { p: w ? w.from(hit.p) : hit.p, n: hit.n, bone: boneAt(field, hit.p) };
  };
  // A list of points, each found on it.
  return Array.isArray(p[0]) ? p.map(one) : one(p);
}

/**
 * A bag against the body at p (as sculpted): its back flat on the body
 * there, `size` [wide, tall, deep] (half sizes), its top `up`, a flap over
 * its front and a buckle on it. Returns its middle and the way out of it.
 */
export function bag(s, p, { size = [0.04, 0.035, 0.015], color = '#6a4a2a', flap = null, buckle: metal = '#c8b070', over = CORE, keep = () => true, bone = null, part = 'kit' } = {}) {
  const at = onBody(s, p, over, keep);
  const n = at.n, up0 = [0, 1, 0], d = up0[0] * n[0] + up0[1] * n[1] + up0[2] * n[2];
  let up = up0.map((v, i) => v - n[i] * d);
  const ul = Math.hypot(...up) || 1;
  up = up.map((v) => v / ul);
  const across = [up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]];
  const c = at.p.map((v, i) => v + n[i] * (size[2] + 0.001));
  // The bag's own axes: across, up, out.
  const local = (q) => { const v = [q[0] - c[0], q[1] - c[1], q[2] - c[2]]; return [v[0] * across[0] + v[1] * across[1] + v[2] * across[2], v[0] * up[0] + v[1] * up[1] + v[2] * up[2], v[0] * n[0] + v[1] * n[1] + v[2] * n[2]]; };
  const rbox = (q, b, r) => { const [x, y, z] = local(q).map((v, i) => Math.abs(v) - b[i] + r); return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0) - r; };
  const m = Math.hypot(...size) + 0.01, box = [c.map((v) => v - m), c.map((v) => v + m)];
  const B = { color, mat: 'leather', bone: bone ?? at.bone, k: 0.002 };
  s.part(part, () => {
    s.shape((q) => rbox(q, size, Math.min(size[2] * 0.8, 0.008)), box, B);
    if (flap !== false) {
      // The flap: over the top and two thirds down the front, its edge rounded.
      s.shape((q) => {
        const [x, y, z] = local(q);
        const e1 = Math.abs(x) - size[0] - 0.0015, e2 = Math.max(-(y - size[1] * 0.25), y - size[1] - 0.002), e3 = Math.abs(z - size[2]) - 0.0022;
        return Math.max(e1, e2, e3, Math.hypot(Math.max(0, Math.abs(x) - size[0] * 0.6), Math.max(0, size[1] * 0.25 - y + 0.01)) - size[0] * 0.4 - 0.01);
      }, box, { ...B, color: flap ?? color });
      if (metal) s.shape((q) => { const [x, y, z] = local(q); return Math.max(Math.abs(x) - 0.006, Math.abs(y - size[1] * 0.25) - 0.005, Math.abs(z - size[2] - 0.003) - 0.0016) - 0.0008; }, box, { ...B, color: metal, mat: 'metal', k: 0.0006 });
    }
  });
  return { c, n, up, across };
}

/**
 * The stretch `M` (a 3×3 matrix) made a similarity: the same size change every way (its volume's) and only the
 * turn in it, so a round thing stays round. If `axis` is given, the turn is the one that takes `axis` where `M`
 * takes it (a held stick still lies along the fist it is in); otherwise the turn nearest `M`.
 */
export function similar(M, axis = null) {
  const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const k = Math.cbrt(Math.abs(det)) || 1;
  let R;
  if (axis) {
    const a = axis.map((v) => v / Math.hypot(...axis)), m = M.map((r) => r[0] * a[0] + r[1] * a[1] + r[2] * a[2]), ml = Math.hypot(...m), b = m.map((v) => v / ml);
    const v = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const K = [[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]], f = 1 / (1 + c);
    R = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 1 : 0) + K[i][j] + f * (K[i][0] * K[0][j] + K[i][1] * K[1][j] + K[i][2] * K[2][j])));
  } else {
    // The nearest turn: the polar part of M, by averaging it with its inverse transpose until it settles.
    R = M.map((r) => r.slice());
    for (let it = 0; it < 12; it++) {
      const [[a, b, c], [d, e, f], [g, h, i]] = R, dt = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      const IT = [[(e * i - f * h) / dt, (f * g - d * i) / dt, (d * h - e * g) / dt], [(c * h - b * i) / dt, (a * i - c * g) / dt, (b * g - a * h) / dt], [(b * f - c * e) / dt, (c * d - a * f) / dt, (a * e - b * d) / dt]];
      R = R.map((r, x) => r.map((v, y) => (v + IT[x][y]) / 2));
    }
  }
  const S = R.map((r) => r.map((v) => v * k)), Si = [0, 1, 2].map((i) => [0, 1, 2].map((j) => R[j][i] / k));
  return [S, Si];
}

/**
 * What `fn` adds is rigid: the build's stretch (longer legs, a deeper chest, a bigger head) is taken as it is at
 * `c` (as sculpted) and the same all through it, so something long and straight (a sword on the back, a pole)
 * stays straight where it crosses from one stretch to the next instead of kinking there.
 */
export function rigid(s, c, fn) {
  const base = s.warp;
  if (!base) return fn();
  const t0 = base.to(c), M = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let j = 0; j < 3; j++) {
    const e = c.slice();
    e[j] += 0.002;
    const t = base.to(e);
    for (let i = 0; i < 3; i++) M[i][j] = (t[i] - t0[i]) / 0.002;
  }
  const [S, Si] = similar(M);
  const mul = (A, v) => A.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const sc = base.scale(c);
  s.setWarp({
    to: (p) => { const v = mul(S, [p[0] - c[0], p[1] - c[1], p[2] - c[2]]); return [t0[0] + v[0], t0[1] + v[1], t0[2] + v[2]]; },
    from: (q) => { const v = mul(Si, [q[0] - t0[0], q[1] - t0[1], q[2] - t0[2]]); return [c[0] + v[0], c[1] + v[1], c[2] + v[2]]; },
    scale: () => sc,
  });
  try { return fn(); } finally { s.setWarp(base); }
}

/** A round cord (a handle, a wire, a loop) along a smooth curve through `pts` (as sculpted), `r` thick: not laid on anything. */
export function cord(s, pts, r, o, closed = false) {
  const line = curve(pts, Math.max(0.004, r * 1.2), closed);
  const n = closed ? line.length : line.length - 1;
  for (let i = 0; i < n; i++) s.limb(line[i], line[(i + 1) % line.length], r, r, { k: Math.min(0.002, r * 0.4), ...o });
}

/**
 * A rounded box at `c` (as sculpted) lying along the directions `x` and `y`
 * (unit, at right angles; its depth is along the third), `size` its half
 * sizes along them and `round` its corners: a clipboard, a phone, a book, a
 * tray, a card, a sign.
 */
export function plate(s, c, x, y, size, round, o) {
  const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  const m = Math.hypot(...size);
  return s.shape((p) => {
    const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const q = [x, y, z].map((a, i) => Math.abs(v[0] * a[0] + v[1] * a[1] + v[2] * a[2]) - size[i] + round);
    return Math.hypot(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)) + Math.min(Math.max(q[0], q[1], q[2]), 0) - round;
  }, [c.map((v) => v - m), c.map((v) => v + m)], o);
}

/** The turn (Euler, as `rotation` takes it) that points a shape's own y axis (a cylinder's, a torus's) along `v`. */
export function axisRot(v) {
  const l = Math.hypot(...v) || 1, x = v[0] / l, y = v[1] / l, z = v[2] / l;
  return [Math.atan2(Math.hypot(x, z), y), Math.atan2(x, z), 0];
}

/**
 * Buttons (studs, rivets, a badge's pin) at `points` (as sculpted), each
 * sat flush on whatever is under it: a dome `r` across, `dome` as high.
 */
export function buttons(s, points, { r = 0.0065, dome = 0.55, color = '#c8ccd4', mat = 'metal', over = CORE, keep = () => true, part = 'outer2', bone = null } = {}) {
  const field = bodyField(s, over, keep);
  built(s, (w) => {
    for (const p of points) {
      const { p: q, n } = onto(field, w ? w.to(p) : p);
      s.part(part, () => s.ellipsoid(q.map((v, i) => v + n[i] * r * dome * 0.35), [r, r * dome, r], { color, mat, bone: bone ?? boneAt(field, q), k: 0.001, rot: axisRot(n) }));
    }
  });
}

/**
 * A strap lying on the body (and on what is worn over it, `over`) along a
 * path through `path` (as sculpted), from end to end or round and back to
 * the start (`closed`): flat, `width` wide and `thick` thick, lying on the
 * surface (a shoulder strap, a sash, braces, a bandolier, a guitar's strap,
 * a lanyard); or `round`, a cord or a chain of that thickness. It moves
 * with whatever it lies on, there. Returns the points it lies along (built
 * space), and the surface's normal at each, for what hangs on it.
 */
export function strap(s, path, { width = 0.014, thick = 0.004, lift = 0.0008, color, mat = 'leather', part = 'straps', round = false, closed = false, over = CORE, keep = () => true, bone = null, k = 0.0015 } = {}) {
  const field = bodyField(s, over, keep);
  const line = [];
  built(s, (w) => {
    const to = (p) => (w ? w.to(p) : p);
    // On the surface, then smoothed along its length (so a lump under it doesn't kink it) and put back on.
    let pts = curve(path.map(to), 0.008, closed).map((p) => onto(field, p));
    for (let pass = 0; pass < 3; pass++) {
      pts = pts.map((x, i) => {
        if (!closed && (i === 0 || i === pts.length - 1)) return x;
        const a = pts[(i - 1 + pts.length) % pts.length].p, b = pts[(i + 1) % pts.length].p;
        return onto(field, x.p.map((v, j) => (a[j] + 2 * v + b[j]) / 4));
      });
    }
    // Over a lump rather than into the hollow beside it: never inside what it lies on.
    pts = pts.map(({ p, n }) => ({ p, n }));
    // Laid on the surface, its middle a half-thickness (and `lift`) off it.
    const mid = pts.map(({ p, n }) => p.map((v, i) => v + n[i] * (lift + thick / 2)));
    pts.forEach(({ n }, i) => line.push({ p: mid[i], n }));
    // In runs, each moving with the bone under it.
    const bones = pts.map(({ p }) => bone ?? boneAt(field, p));
    const runs = [];
    let start = 0;
    for (let i = 1; i <= mid.length; i++) {
      if (i === mid.length || bones[i] !== bones[start]) {
        runs.push([Math.max(0, start - 1), Math.min(mid.length - 1, i), bones[start]]);
        start = i;
      }
    }
    if (closed && runs.length > 1 && runs[0][2] === runs[runs.length - 1][2]) {
      const last = runs.pop();
      runs[0] = [last[0] - mid.length, runs[0][1], runs[0][2]];
    }
    const off = lift + thick / 2;
    for (const [a, b, bn] of runs) {
      const seg = [];
      for (let i = a; i <= b; i++) seg.push(mid[(i + mid.length) % mid.length]);
      const whole = closed && runs.length === 1;
      const lo = [0, 1, 2].map((i) => Math.min(...seg.map((p) => p[i])) - width - thick), hi = [0, 1, 2].map((i) => Math.max(...seg.map((p) => p[i])) + width + thick);
      const o = { color, mat, bone: bn, k };
      s.part(part, () => {
        if (round) s.shape((p) => toLine(p, seg, whole) - thick / 2, [lo, hi], o);
        else {
          s.shape((p) => {
            const across = toLine(p, seg, whole) - width / 2;
            if (across > thick * 2) return across;
            const d = Math.abs(field.field(p) - off) - thick / 2;
            return roundMax(d, across, thick * 0.45);
          }, [lo, hi], o);
        }
      });
    }
  });
  return line;
}

/**
 * A garment fitted over the body (the parts `over`, less what `keep`
 * refuses: the arms, for a vest) as a shell `thick` thick standing `lift`
 * off it, wherever `region(p)` is negative (p as sculpted, before the build:
 * a distance, or near enough): a vest, a waistcoat, a coat's body, a bib,
 * an apron, a tabard. Below `hang` it hangs straight down from the most
 * that stands out above it, rather than following the legs in. In part
 * `part`, on the bones of what it lies on (or `bone`).
 */
export function shell(s, region, { thick = 0.006, lift = 0.001, color, mat = 'cloth', part = 'outer', over = CORE, keep = () => true, bone = null, k = 0.003, bones = null } = {}) {
  const field = bodyField(s, over, keep);
  built(s, (w) => {
    const from = (p) => (w ? w.from(p) : p);
    const [lo, hi] = field.bounds(thick + lift + 0.01);
    const d = (p) => roundMax(field.field(p) - lift - thick, region(from(p)), Math.min(0.004, thick * 0.6));
    if (bones) {
      // One shape for each bone it moves with, each where `bones[name](p)` (as sculpted) is negative.
      for (const [bn, where] of Object.entries(bones)) s.part(part, () => s.shape((p) => Math.max(d(p), where(from(p))), [lo, hi], { color, mat, bone: bn, k }));
    } else s.part(part, () => s.shape(d, [lo, hi], { color, mat, bone: bone ?? 'chest', k }));
  });
}

/**
 * Cloth that hangs: on the back (`side` -1: a cape, a coat's tails) or the
 * front (1: an apron, a tabard), lying on the body where `region` says
 * (p as sculpted), and falling straight down from whatever stands out most
 * above it rather than following the body in (over the seat, down past the
 * calves), `flare` further out for each tile it falls below `from`. `thick`
 * thick, in `part`, moving with `bones` ({ name: where(p) negative }) or `bone`.
 */
export function hang(s, region, { side = -1, thick = 0.006, lift = 0.002, flare = 0, from = 0.5, color, mat = 'cloth', part = 'outer', over = CORE, keep = () => true, bone = 'chest', bones = null, k = 0.003, step = 0.006, smooth = 2, x = [-0.3, 0.3], y = [0, 0.62] } = {}) {
  const field = bodyField(s, over, keep);
  built(s, (w) => {
    const to = (p) => (w ? w.to(p) : p), from_ = (p) => (w ? w.from(p) : p);
    // The body's outline seen from that side: how far out it stands at each (x, y), as built.
    const A = to([x[0], y[0], 0]), B = to([x[1], y[1], 0]);
    const nx = Math.ceil((B[0] - A[0]) / step) + 1, ny = Math.ceil((B[1] - A[1]) / step) + 1;
    const out = new Float32Array(nx * ny).fill(-Infinity);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const px = A[0] + i * step, py = A[1] + j * step;
        const hit = field.cast([px, py, side * 0.5], [0, 0, -side], 1);
        if (hit) out[i + nx * j] = hit.p[2] * side;
      }
    }
    // Falling: never in under what is above it.
    for (let i = 0; i < nx; i++) for (let j = ny - 2; j >= 0; j--) out[i + nx * j] = Math.max(out[i + nx * j], out[i + nx * (j + 1)]);
    // Across, a little smoothed, so it drapes rather than follows every fold.
    for (let pass = 0; pass < smooth; pass++) {
      for (let j = 0; j < ny; j++) for (let i = 1; i < nx - 1; i++) {
        const a = out[i - 1 + nx * j], b = out[i + nx * j], c = out[i + 1 + nx * j];
        if (a > -1 && c > -1) out[i + nx * j] = Math.max(b, (a + 2 * b + c) / 4);
      }
    }
    const surf = (px, py) => {
      const fi = Math.max(0, Math.min(nx - 1.001, (px - A[0]) / step)), fj = Math.max(0, Math.min(ny - 1.001, (py - A[1]) / step));
      const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
      const g = (a, b) => { const val = out[a + nx * b]; return val === -Infinity ? -0.2 : val; };
      return (g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - v) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * v;
    };
    const fromY = to([0, from, 0])[1];
    const d = (p) => {
      const o = surf(p[0], p[1]) + lift + Math.max(0, fromY - p[1]) * flare;
      return roundMax(Math.abs(p[2] * side - o - thick / 2) - thick / 2, region(from_(p)), Math.min(0.004, thick * 0.6));
    };
    const lo = [A[0], A[1], side > 0 ? -0.05 : -0.4], hi = [B[0], B[1], side > 0 ? 0.4 : 0.05];
    if (bones) for (const [bn, where] of Object.entries(bones)) s.part(part, () => s.shape((p) => Math.max(d(p), where(from_(p))), [lo, hi], { color, mat, bone: bn, k }));
    else s.part(part, () => s.shape(d, [lo, hi], { color, mat, bone, k }));
  });
}

/**
 * A band round a limb (a wristband, an armband, a cuff, a garter): `t` of
 * the way from joint `a` to joint `b` (as sculpted), `width` along it,
 * standing `thick` off what is there, moving with `bone`.
 */
export function cuffBand(s, a, b, t, { width = 0.03, thick = 0.005, color, mat = 'leather', part = 'straps', bone, over = CORE } = {}) {
  const field = bodyField(s, over);
  built(s, (w) => {
    const to = (p) => (w ? w.to(p) : p);
    const A = to(a), B = to(b), d = B.map((v, i) => v - A[i]), L = Math.hypot(...d), u = d.map((v) => v / L);
    const c = A.map((v, i) => v + d[i] * t);
    const r = Math.max(0.01, -field.field(c));
    // A ring as wide as the limb there and standing off it, its edges rounded.
    const ring = (p) => {
      const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], along = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
      const rad = Math.hypot(v[0] - u[0] * along, v[1] - u[1] * along, v[2] - u[2] * along);
      const e1 = Math.abs(rad - r - thick / 2) - thick / 2 + 0.0012, e2 = Math.abs(along) - width / 2 + 0.0012;
      return Math.hypot(Math.max(e1, 0), Math.max(e2, 0)) + Math.min(Math.max(e1, e2), 0) - 0.0012;
    };
    const m = r + thick + width;
    s.part(part, () => s.shape(ring, [c.map((v) => v - m), c.map((v) => v + m)], { color, mat, bone, k: 0.001 }));
  });
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
    // A shallow groove, wider than it is deep, so the face's grid can follow it (a hairline cut comes out ragged,
    // like a scar); the dark line between the lips is painted on.
    const fwd = (p) => [p[0], p[1], p[2] + 0.0013];
    for (let i = 0; i < 4; i++) s.limb(fwd(line[i]), fwd(line[i + 1]), 0.0027, 0.0027, { op: 'sub', k: 0.002 });
    for (const p of [line[0], line[4]]) s.sphere(fwd(p), 0.0028, { op: 'sub', k: 0.002 });
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
  // Where the eyes are (as sculpted), for what is worn in front of them.
  s.eyes = eyes;
  return eyes;
}

/**
 * Hair's colour (a function or hex) in strands: lighter and darker streaks
 * running down from the crown `at`, fine ones over broad ones.
 */
export function strands(color, at = [0, 0.695, -0.006]) {
  const base = typeof color === 'function' ? color : (() => { const c = typeof color === 'string' ? rgb(color) : color; return () => c; })();
  const fn = (p, n) => {
    const a = Math.atan2(p[0] - at[0], p[2] - at[2]), x = Math.cos(a), z = Math.sin(a);
    const v = noise(x * 5.5, z * 5.5, p[1] * 4) * 0.5 + noise(x * 10 + 40, z * 10, p[1] * 6) * 0.5;
    return base(p, n).map((c) => c * (0.66 + v * 0.62));
  };
  // The same strands in another colour (see person.js `variant`).
  fn.retint = (other) => strands(other, at);
  return fn;
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
export function grip(s, J, { core = CORE, skip = ['eyes', 'irises', 'pupils', 'brows'] } = {}) {
  for (const S of ['L', 'R']) {
    const name = `hand${S}`, on = (bone) => (typeof bone === 'string' ? bone === name : bone.some(([b]) => b === name));
    if (!s.shapes.some((x) => !isCore(x.part, core) && !skip.includes(x.part) && on(x.bone))) continue;
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
export function thin(s, { core = CORE, skip = ['eyes', 'irises', 'pupils', 'brows', 'frames'] } = {}) {
  const moved = [];
  for (const x of s.shapes) {
    if (isCore(x.part, core) || skip.includes(x.part)) continue;
    // What carves a thin piece goes with it, or it would carve nothing.
    if (x.op !== 'add') {
      if (moved.some((m) => m.from === x.part && [0, 1, 2].every((i) => x.box[0][i] <= m.box[1][i] && m.box[0][i] <= x.box[1][i]))) x.part = 'fine';
      continue;
    }
    const c = [0, 1, 2].map((i) => (x.box[0][i] + x.box[1][i]) / 2), span = Math.max(...[0, 1, 2].map((i) => x.box[1][i] - x.box[0][i]));
    const depth = -x.d(c);
    if (depth > 0 && depth < 0.0045 && span > 0.05) {
      moved.push({ from: x.part, box: x.box });
      x.part = 'fine';
    }
  }
}

/**
 * The pieces a person wears put on them: everything sculpted onto the body
 * in parts of its own (badges, buttons, chains, hats, a bag) that, at rest,
 * stands just off what it is worn on (the body, or another piece: a button
 * on a coat) instead of on it, up to `reach` away, is moved onto it, and a
 * small piece sunk out of sight in it is brought up to show.
 * A piece is a lump of shapes of one part that touch; it moves whole. What
 * is held out from the body (further than `reach`) stays where it is, and so
 * does a veil, which stands off the face.
 */
export function fit(s, { core = CORE, skip = ['eyes', 'irises', 'pupils', 'brows', 'veil', 'frames'], reach = 0.035 } = {}) {
  const body = new Sculpt();
  body.shapes = s.shapes.filter((x) => isCore(x.part, core));
  const [lo, hi] = body.bounds(0.06);
  body.prepare(lo, hi, reach + 0.03);
  // What is held is where it was put, in the hand.
  const worn = s.shapes.filter((x) => !isCore(x.part, core) && !skip.includes(x.part) && !x.held);
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
      if (Math.abs(x.d(p)) < 0.002) points.push(p);
    }
    return points;
  };
  const points = worn.map((x) => (x.op === 'add' ? surface(x) : []));
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

/**
 * Hair under a hat stays under it: wherever a hat (a wide piece worn on the
 * head, above the brows) is over the hair, the hair above the hat's
 * underside is cut away, so it can show below a brim but never come up
 * through one, or through a crown.
 */
export function cover(s, { core = CORE, skip = ['eyes', 'irises', 'pupils', 'brows', 'hair', 'frames'], step = 0.003 } = {}) {
  if (!s.shapes.some((x) => x.part === 'hair' && x.op === 'add')) return;
  const skull = s.shapes.filter((x) => x.part === 'head' && x.op === 'add' && x.bone === 'head');
  const wide = Math.max(...skull.map((x) => x.box[1][0] - x.box[0][0]), 0);
  const eyes = Math.max(...s.shapes.filter((x) => x.part === 'eyes').map((x) => (x.box[0][1] + x.box[1][1]) / 2), -Infinity);
  const worn = s.shapes.filter((x) => x.op === 'add' && x.bone === 'head' && !isCore(x.part, core) && !skip.includes(x.part));
  // Hats: what is worn on the head that touches, in lumps, wide, and all above the brows.
  const up = worn.map((_, i) => i);
  const find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
  const meet = (a, b) => [0, 1, 2].every((i) => a.box[0][i] - 0.002 <= b.box[1][i] && b.box[0][i] - 0.002 <= a.box[1][i]);
  for (let i = 0; i < worn.length; i++) for (let j = 0; j < i; j++) if (meet(worn[i], worn[j])) up[find(i)] = find(j);
  const lumps = new Map();
  worn.forEach((x, i) => { const r = find(i); if (!lumps.has(r)) lumps.set(r, []); lumps.get(r).push(x); });
  for (const lump of lumps.values()) {
    const hat = new Sculpt();
    hat.shapes = lump;
    const [lo, hi] = hat.bounds(0.004);
    // Only a hat as wide as the head covers the hair; a small one (a pillbox) sits on top of it.
    if (hi[0] - lo[0] < wide * 0.95) continue;
    hat.prepare(lo, hi, 0.01);
    // The hat's underside over each column of a grid across it: the lowest point it has there.
    const nx = Math.ceil((hi[0] - lo[0]) / step) + 1, nz = Math.ceil((hi[2] - lo[2]) / step) + 1;
    const under = new Float32Array(nx * nz).fill(Infinity);
    // How low it comes over the forehead (a hood or a mask comes down over the eyes, and isn't a hat).
    let lowest = Infinity, front = Infinity;
    for (let i = 0; i < nx; i++) {
      for (let k = 0; k < nz; k++) {
        const x = lo[0] + i * step, z = lo[2] + k * step;
        for (let y = lo[1]; y < hi[1];) {
          const d = hat.field([x, y, z]);
          if (d < 0) {
            under[i + nx * k] = y;
            lowest = Math.min(lowest, y);
            if (Math.abs(x) < 0.03 && z > 0.04) front = Math.min(front, y);
            break;
          }
          y += Math.max(d * 0.9, 0.001);
        }
      }
    }
    if (front < eyes + 0.012) continue;
    // A band round the head (a headband, a hatband) isn't over the crown: only a hat is.
    const crown = s.warp ? s.warp.to([0, 0.7, 0]) : [0, 0.7, 0];
    if (crown[0] < lo[0] || crown[0] > hi[0] || crown[2] < lo[2] || crown[2] > hi[2]) continue;
    if (under[Math.round((crown[0] - lo[0]) / step) + nx * Math.round((crown[2] - lo[2]) / step)] === Infinity) continue;
    // Between the grid's columns, smoothly, so the hair's cut edge is clean.
    const at = (x, z) => {
      const fi = (x - lo[0]) / step, fk = (z - lo[2]) / step, i = Math.floor(fi), k = Math.floor(fk);
      if (i < 0 || k < 0 || i >= nx - 1 || k >= nz - 1) return Infinity;
      const a = under[i + nx * k], b = under[i + 1 + nx * k], c = under[i + nx * (k + 1)], d = under[i + 1 + nx * (k + 1)];
      if (a === Infinity || b === Infinity || c === Infinity || d === Infinity) return Math.min(a, b, c, d);
      const u = fi - i, v = fk - k;
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    };
    // Cut from the hair: above the underside wherever the hat is overhead. As made, not warped again.
    const warp = s.warp;
    s.warp = null;
    s.part('hair', () => s.shape((p) => {
      const u = at(p[0], p[2]);
      return u === Infinity ? 0.01 : u - 0.002 - p[1];
    }, [[lo[0], lowest - 0.004, lo[2]], [hi[0], hi[1] + 0.2, hi[2]]], { op: 'sub', k: 0.002 }));
    s.warp = warp;
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
  k.turn('foreL', -0.15, 0, 0);
  k.turn('foreR', -0.25, 0, 0);

  if (clip === 'idle') {
    k.turn('hips', 0, Math.sin(T * 0.7) * 0.04, Math.sin(T * 0.9) * 0.015);
    k.turn('head', Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.37) * 0.18, 0);
    k.move('hips', 0, breathe * 0.002 - 0.004, 0);
    k.turn('thighL', 0.04, 0, 0.02); k.turn('shinL', 0.08, 0, 0);
    k.turn('thighR', 0.04, 0, -0.02); k.turn('shinR', 0.08, 0, 0);
    // The weapon held ready.
    k.turn('armR', -0.35, 0, -0.1);
    k.turn('foreR', -0.75, 0, 0);
    // Twisted so a blade shows its face, not its edge.
    k.turn('handR', 0, 0, style.twist ?? -0.9);
  } else if (clip === 'walk') {
    const ph = T * (9 - heavy * 2) * Math.max(0.5, speed), g = Math.sin(ph);
    k.move('hips', 0, Math.abs(Math.cos(ph)) * 0.012 - 0.004, 0);
    k.turn('hips', 0, g * 0.12, 0);
    k.turn('chest', 0.06, -g * 0.16, 0);
    k.turn('thighL', -g * 0.55, 0, 0); k.turn('shinL', Math.max(0, g) * 0.8, 0, 0); k.turn('footL', -g * 0.2, 0, 0);
    k.turn('thighR', g * 0.55, 0, 0); k.turn('shinR', Math.max(0, -g) * 0.8, 0, 0); k.turn('footR', g * 0.2, 0, 0);
    k.turn('armL', g * 0.45, 0, 0);
    k.turn('armR', -0.35 - g * 0.2, 0, -0.1);
    k.turn('foreR', -0.6, 0, 0);
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

/** Where a posed point `q` was in the rest pose, as bone `name` carries it (the inverse of `Skeleton.point`). */
function unpose(k, name, q) {
  const o = (k.index.get(name) ?? 0) * 12, M = k.matrices;
  const a = M[o], b = M[o + 1], c = M[o + 2], d = M[o + 4], e = M[o + 5], f = M[o + 6], g = M[o + 8], h = M[o + 9], i = M[o + 10];
  const x = q[0] - M[o + 3], y = q[1] - M[o + 7], z = q[2] - M[o + 11];
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C;
  return [(A * x + (c * h - b * i) * y + (b * f - c * e) * z) / det, (B * x + (a * i - c * g) * y + (c * d - a * f) * z) / det, (C * x + (b * g - a * h) * y + (a * e - b * d) * z) / det];
}

/**
 * What a person's arms are to stay out of, measured from the sculpt as it is
 * baked: the head (with its hair, and whatever is worn on it) and the trunk
 * (with what is worn on it), each as a coarse grid of distances in the rest
 * pose, to read off as they move (`clearance`).
 */
export function measure(s) {
  const one = (x) => (typeof x.bone === 'string' ? x.bone : x.bone[0][0]);
  const grid = (keep, step) => {
    const x = new Sculpt();
    x.shapes = s.shapes.filter((sh) => sh.op === 'add' && keep(sh));
    if (!x.shapes.length) return null;
    const [lo, hi] = x.bounds(0.03);
    x.prepare(lo, hi, 0.04);
    const n = [0, 1, 2].map((i) => Math.max(2, Math.ceil((hi[i] - lo[i]) / step) + 1));
    const values = new Float32Array(n[0] * n[1] * n[2]);
    for (let k = 0; k < n[2]; k++) for (let j = 0; j < n[1]; j++) for (let i = 0; i < n[0]; i++) {
      values[i + n[0] * (j + n[1] * k)] = Math.min(0.08, x.field([lo[0] + i * step, lo[1] + j * step, lo[2] + k * step]));
    }
    return { lo, step, n, values };
  };
  // Near the head only: not a staff or a sign that happens to be carried on it.
  const headAt = s.warp ? s.warp.to([0, 0.67, 0.01]) : [0, 0.67, 0.01];
  const nearHead = (sh) => sh.box[0].every((v, i) => v > headAt[i] - 0.3) && sh.box[1].every((v, i) => v < headAt[i] + 0.3);
  return {
    head: grid((sh) => one(sh) === 'head' && sh.part !== 'eyes' && nearHead(sh), 0.012),
    trunk: grid((sh) => ['hips', 'spine', 'chest'].includes(one(sh)) && !sh.held, 0.012),
  };
}

/** A distance off a measured grid (`measure`) at p, trilinear; far (0.08) outside it. */
function sample(g, p) {
  const fx = (p[0] - g.lo[0]) / g.step, fy = (p[1] - g.lo[1]) / g.step, fz = (p[2] - g.lo[2]) / g.step;
  const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
  if (i < 0 || j < 0 || k < 0 || i >= g.n[0] - 1 || j >= g.n[1] - 1 || k >= g.n[2] - 1) return 0.08;
  const u = fx - i, v = fy - j, w = fz - k, nx = g.n[0], nxy = g.n[0] * g.n[1], o = i + nx * j + nxy * k, V = g.values;
  const x00 = V[o] + (V[o + 1] - V[o]) * u, x10 = V[o + nx] + (V[o + nx + 1] - V[o + nx]) * u;
  const x01 = V[o + nxy] + (V[o + nxy + 1] - V[o + nxy]) * u, x11 = V[o + nxy + nx] + (V[o + nxy + nx + 1] - V[o + nxy + nx]) * u;
  return (x00 + (x10 - x00) * v) * (1 - w) + (x01 + (x11 - x01) * v) * w;
}

/**
 * What keeps a person's arms out of their own head and body, whatever a clip
 * asks of them (`settle`): after each pose, a forearm or a hand inside the
 * head (or its hair), or inside the trunk, is eased out (the upper arm
 * turned out or forward and the elbow opened, as little as clears it) so
 * that it lies against it instead. `warp` is their build, `b` their breadth,
 * `belly` theirs; `head` the head's middle and half sizes as sculpted.
 */
export function clearance({ warp = null, b = 1, belly = 0, head = [[0, 0.668, 0.006], [0.107, 0.114, 0.108]] } = {}) {
  const J = joints(b), at = trunk(b, belly);
  const to = (p) => (warp ? warp.to(p) : p), from = (p) => (warp ? warp.from(p) : p);
  const lerp = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
  const [hc, hr] = head, hmin = Math.min(...hr);
  // Along each arm: [bone, rest point (as built), how far round it the arm reaches, whether the trunk counts].
  const arms = ['L', 'R'].map((S) => {
    const sh = J[`shoulder${S}`], el = J[`elbow${S}`], wr = J[`wrist${S}`], h = J[`hand${S}`];
    return {
      S,
      points: [
        [`arm${S}`, to(lerp(sh, el, 0.6)), 0.03, false],
        [`arm${S}`, to(el), 0.026, true],
        [`fore${S}`, to(lerp(el, wr, 0.5)), 0.024, true],
        [`fore${S}`, to(wr), 0.021, true],
        [`hand${S}`, to(h), 0.02, true],
        [`hand${S}`, to([h[0], h[1] - 0.03, h[2] + 0.004]), 0.014, true],
      ],
    };
  });
  // How far into the head or the trunk the arm on one side is, all told: off the measured grids if the bake
  // measured them, or else off an ellipsoid for the head and the trunk's sections.
  const into = (k, arm, m) => {
    let sum = 0;
    for (const [bone, p, r, body] of arm.points) {
      const q = k.point(bone, p);
      const hq = unpose(k, 'head', q);
      let dh;
      if (m?.head) dh = sample(m.head, hq) - r;
      else {
        const u = from(hq), n = Math.hypot((u[0] - hc[0]) / hr[0], (u[1] - hc[1]) / hr[1], (u[2] - hc[2]) / hr[2]);
        dh = (n - 1) * hmin - r;
      }
      if (dh < 0) sum += dh * dh;
      if (!body) continue;
      // The trunk: carried by the bone that carries that height.
      for (const bone2 of ['chest', 'spine']) {
        const tq = unpose(k, bone2, q), v = from(tq);
        if (bone2 === 'chest' ? v[1] < 0.43 || v[1] > 0.56 : v[1] < 0.3 || v[1] >= 0.43) continue;
        let dt;
        if (m?.trunk) dt = sample(m.trunk, tq) - r;
        else {
          const [w, d, zc, e] = at(v[1]);
          const x = Math.abs(v[0]) / (w + 0.007), z = Math.abs(v[2] - zc) / (d + 0.007);
          dt = ((x ** e + z ** e) ** (1 / e) - 1) * Math.min(w, d) * 0.9 - r;
        }
        if (dt < 0) sum += dt * dt;
      }
    }
    return sum;
  };
  return (k, state, data) => {
    const m = data?.measure;
    k.compute();
    for (const arm of arms) {
      let now = into(k, arm, m);
      if (now < 1e-7) continue;
      const out = arm.S === 'L' ? 1 : -1;
      const A = k.bone(`arm${arm.S}`).rot, F = k.bone(`fore${arm.S}`).rot;
      // The turns it may make: the upper arm forward or back and out or in, and the elbow.
      const knobs = [[A, 0], [A, 2], [F, 0]];
      for (let it = 0; it < 24 && now > 1e-7; it++) {
        const grad = knobs.map(([r, i]) => {
          const was = r[i];
          r[i] = was + 0.01;
          k.compute();
          const g = (into(k, arm, m) - now) / 0.01;
          r[i] = was;
          return g;
        });
        const gl = Math.hypot(...grad);
        if (gl < 1e-9) break;
        // A step that would take it clear, were the arm straight, but never more than a tenth of a turn.
        const stepBy = Math.min(0.12, (now / gl) * 1.5 + 0.01);
        knobs.forEach(([r, i], j) => {
          let dv = (-grad[j] / gl) * stepBy;
          // Out from the body rather than across it.
          if (r === A && i === 2) dv = out > 0 ? Math.max(dv, -0.02) : Math.min(dv, 0.02);
          r[i] += dv;
        });
        k.compute();
        now = into(k, arm, m);
      }
    }
  };
}

/**
 * Turns hand `S`'s wrist so that the way through its fist (out past the
 * thumb) points at `target` (posed, in the space it is built in): a
 * microphone at the mouth, a phone at the ear, a torch at the floor. `grip`
 * is the middle of the fist at rest (built space). A few small steps,
 * cheap enough to make every frame.
 */
export function aimHand(k, S, grip, target, steps = 10) {
  const bone = `hand${S}`, r = k.bone(bone).rot;
  const tip = [grip[0], grip[1], grip[2] + 0.05];
  const miss = () => {
    k.compute();
    const c = k.point(bone, grip), a = k.point(bone, tip);
    const d = [a[0] - c[0], a[1] - c[1], a[2] - c[2]], w = [target[0] - c[0], target[1] - c[1], target[2] - c[2]];
    return 1 - (d[0] * w[0] + d[1] * w[1] + d[2] * w[2]) / ((Math.hypot(...d) * Math.hypot(...w)) || 1);
  };
  let now = miss();
  for (let it = 0; it < steps && now > 2e-4; it++) {
    const g = [0, 1, 2].map((i) => {
      const was = r[i];
      r[i] = was + 0.01;
      const v = (miss() - now) / 0.01;
      r[i] = was;
      return v;
    });
    const gl = Math.hypot(...g) || 1;
    const by = Math.min(0.3, now / gl * 1.2);
    for (let i = 0; i < 3; i++) r[i] -= (g[i] / gl) * by;
    // A wrist turns only so far.
    r[0] = Math.max(-1.4, Math.min(1.4, r[0])); r[2] = Math.max(-1.2, Math.min(1.2, r[2]));
    now = miss();
  }
}

/**
 * Puts hand `S`'s fist (its middle, `grip`, at rest in built space) at
 * `target` (posed, built space), or as near as the arm reaches, by turning
 * the shoulder and the elbow from where the clip had them: a hand on a
 * handlebar, on a hip, on the strings. A few small steps, cheap enough to
 * make every frame.
 */
export function reachHand(k, S, grip, target, steps = 16) {
  const A = k.bone(`arm${S}`).rot, F = k.bone(`fore${S}`).rot, bone = `hand${S}`;
  const knobs = [[A, 0], [A, 1], [A, 2], [F, 0]];
  const far = () => {
    k.compute();
    const c = k.point(bone, grip);
    return Math.hypot(c[0] - target[0], c[1] - target[1], c[2] - target[2]);
  };
  let now = far();
  for (let it = 0; it < steps && now > 0.002; it++) {
    const g = knobs.map(([r, i]) => {
      const was = r[i];
      r[i] = was + 0.01;
      const v = (far() - now) / 0.01;
      r[i] = was;
      return v;
    });
    const gl = Math.hypot(...g) || 1;
    const by = Math.min(0.25, (now / gl) * 1.1);
    knobs.forEach(([r, i], j) => { r[i] -= (g[j] / gl) * by; });
    // An elbow bends one way only.
    F[0] = Math.max(-2.5, Math.min(0, F[0]));
    now = far();
  }
}

/**
 * Puts the ball of foot `S` (`sole`, at rest in built space) at `target`
 * (posed, built space), or as near as the leg reaches, by turning the hip
 * and the knee from where the clip had them, the foot kept as it was: a
 * foot on a pedal, on a step, on a skateboard.
 */
export function reachFoot(k, S, sole, target, steps = 16) {
  const T = k.bone(`thigh${S}`).rot, N = k.bone(`shin${S}`).rot, bone = `foot${S}`;
  const knobs = [[T, 0], [T, 2], [N, 0]];
  const far = () => {
    k.compute();
    const c = k.point(bone, sole);
    return Math.hypot(c[0] - target[0], c[1] - target[1], c[2] - target[2]);
  };
  let now = far();
  for (let it = 0; it < steps && now > 0.002; it++) {
    const g = knobs.map(([r, i]) => {
      const was = r[i];
      r[i] = was + 0.01;
      const v = (far() - now) / 0.01;
      r[i] = was;
      return v;
    });
    const gl = Math.hypot(...g) || 1;
    const by = Math.min(0.25, (now / gl) * 1.1);
    knobs.forEach(([r, i], j) => { r[i] -= (g[j] / gl) * by; });
    // A knee bends one way only.
    N[0] = Math.max(0, Math.min(2.6, N[0]));
    now = far();
  }
}

/**
 * How a person moves: as a hero does (`moveHumanoid`), but with nothing to
 * hold ready, so at rest the hands hang easy and a walk swings both arms.
 * Clips: idle, walk, attack, cast, hit, ko, win.
 */
export function movePerson(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1, aim = null, reach = null, step = null }, style = {}) {
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
  style.after?.(k, { clip, t, time, seed, speed, aim, reach, step }, T);
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
