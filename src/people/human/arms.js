import { add, clamp, cross, dot, frames, len, norm, Part, profile, scale, smooth, spline, sub } from './kit.js';
import { armWeights, FINGER_NAMES, FINGERS, fingerJoints, JOINTS, leanHand, mirror, sideOf } from './skeleton.js';

/**
 * The arms and hands. Each arm is one loft from inside the sleeve to the
 * knuckles: the deltoid and biceps, the elbow's knobs, the forearm's bulk
 * thinning to a flat wrist, the palm broad and thin. The fingers and thumb
 * are their own tubes, three bones each, with knuckles, pads and nails.
 *
 * The hand hangs with its palm toward the thigh (−x on the left) and the
 * thumb forward; "front" below is +z, "out" the side away from the body.
 */

const G = (t) => Math.exp(-t * t);
/** The angle from `b` to `a`, the short way round. */
const ad = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Points `n` + 1 at even arc length along a dense polyline. */
function resample(pts, n) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + len(sub(pts[i], pts[i - 1])));
  const total = acc[acc.length - 1];
  const out = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const target = (i / n) * total;
    while (k < acc.length - 2 && acc[k + 1] < target) k++;
    const t = (target - acc[k]) / (acc[k + 1] - acc[k] || 1);
    out.push([0, 1, 2].map((a) => pts[k][a] + (pts[k + 1][a] - pts[k][a]) * t));
  }
  return { pts: out, total };
}

// Half-widths of the arm, front-to-back (`fore`) and side-to-side (`side`), by distance from the shoulder joint.
const START = 0.0;
const FRONT = profile([[0.035, 0.05], [0.12, 0.047], [0.2, 0.043], [0.27, 0.037], [0.31, 0.036], [0.36, 0.041], [0.43, 0.035], [0.52, 0.029], [0.57, 0.028], [0.6, 0.032], [0.635, 0.041], [0.66, 0.0425], [0.672, 0.041]]);
const SIDE = profile([[0.035, 0.051], [0.12, 0.044], [0.2, 0.041], [0.27, 0.04], [0.31, 0.042], [0.36, 0.043], [0.43, 0.034], [0.52, 0.0215], [0.57, 0.0185], [0.6, 0.0175], [0.635, 0.0155], [0.66, 0.0142], [0.672, 0.0135]]);
const END = 0.684;

/**
 * One arm, `m` 1 left, −1 right: a loft along shoulder, elbow, wrist and
 * knuckles. Its cross-section is a rounded rectangle-ish oval with the
 * muscles and bones laid on: biceps in front, triceps behind, the elbow's
 * point, the forearm's swell on the thumb side, the wrist bone on the
 * little-finger side, and the back of the hand's knuckles.
 */
function arm(part, m, detail) {
  const J = JOINTS;
  const sh = mirror(J.shoulder, m), el = mirror(J.elbow, m), wr = mirror(J.wrist, m);
  const handDir = norm(sub(wr, el));
  const kn = add(wr, scale(handDir, 0.105));
  const dense = spline([sh, el, wr, kn], 120);
  // The spline's length to the knuckles is a little more than the bones'; stretch the profile to fit.
  const { pts } = resample(dense, 600);
  const along = (d) => pts[Math.min(600, Math.round((d / END) * 600))];
  const F = frames(pts, [0, 0, 1]);
  const frameAt = (d) => F[Math.min(600, Math.round((d / END) * 600))];
  const rows = Math.round(70 * detail), around = Math.round(28 * detail);
  part.grid(rows, around, (i, j) => {
    const d = START + (END - START) * (i / rows);
    const { u: fwd } = frameAt(d);
    const c = along(d);
    const t = frameAt(d).t;
    // Out: away from the body, made square to the arm.
    let out = sub([m, 0, 0], scale(t, dot([m, 0, 0], t)));
    out = sub(out, scale(fwd, dot(out, fwd)));
    out = norm(out);
    const th = (j / around) * Math.PI * 2;
    const cf = Math.cos(th), so = Math.sin(th);
    // A squarish oval: flatter sides on the forearm and the hand.
    const sq = 2.2 + 1.6 * smooth(0.45, 0.62, d);
    const k = Math.pow(Math.pow(Math.abs(cf), sq) + Math.pow(Math.abs(so), sq), -1 / sq);
    const thick = 1 + 0.1 * smooth(0.5, 0.42, d);
    let rf = FRONT(d) * thick, rs = SIDE(d) * thick;
    // Close the end round over the knuckles, which run back toward the little finger.
    const end = END - 0.013 * smooth(0.3, -0.9, cf), c0 = 0.02;
    const cap = d > end - c0 ? Math.sqrt(clamp(1 - ((d - (end - c0)) / c0) ** 2)) : 1;
    rf *= 0.55 + 0.45 * cap; rs *= cap;
    // The top rounds over into the shoulder, out of the trunk.
    const dome = Math.sqrt(clamp(1 - ((0.07 - Math.min(d, 0.07)) / 0.074) ** 2));
    rf *= dome; rs *= dome;
    let bump = 0;
    bump += 0.0045 * G((d - 0.17) / 0.06) * Math.max(0, cf) ** 2;
    bump += 0.0035 * G((d - 0.14) / 0.07) * Math.max(0, -cf) ** 2;
    bump += 0.0055 * G((d - 0.315) / 0.012) * G(ad(th, Math.PI) / 0.35);
    bump += 0.004 * G((d - 0.37) / 0.035) * G(ad(th, 0.7) / 0.6);
    bump += 0.0025 * G((d - 0.565) / 0.01) * G(ad(th, 3.9) / 0.4);
    // The back of the hand: the knuckles stand up in a row.
    bump += 0.0018 * G((d - 0.667) / 0.006) * Math.max(0, so) * (0.6 + 0.4 * Math.cos(cf * 12));
    // The palm's heel and the pad under the little finger are fuller; its middle a little hollow.
    bump += 0.003 * G((d - 0.6) / 0.015) * Math.max(0, -so) - 0.002 * G((d - 0.64) / 0.015) * G(cf / 0.4) * Math.max(0, -so);
    // The ball of the thumb, on the palm's front, that the thumb grows out of.
    bump += 0.008 * G((d - 0.618) / 0.022) * G(ad(th, 5.5) / 0.7) * cap;
    const p = add(c, add(scale(fwd, cf * (rf * k + bump)), scale(out, so * (rs * k + bump))));
    const tint = clamp(1 - 0.18 * G((d - 0.315) / 0.03) * G(cf / 0.6) * Math.max(0, cf), 0.7, 1);
    return { p, uv: [j / around, d / END], w: armWeights(p), tint, zone: { zone: d > 0.58 ? 'hand' : 'arm', y: p[1], d } };
  }, { flip: m < 0 });
  return { kn, handDir };
}

/** A finger's tube, `name` on side `m`: three segments over its joints, knuckle bumps, pads and a rounded tip. */
function finger(part, nails, name, m, detail) {
  const f = FINGERS[name];
  const S = sideOf(m);
  const joints = fingerJoints(name, m);
  const dir = norm(sub(joints[3], joints[0]));
  const start = sub(joints[0], scale(dir, name === 'thumb' ? 0.018 : 0.014));
  const path = [start, ...joints];
  const total = len(sub(joints[3], start));
  const lengths = f.lengths;
  const at = (d) => add(start, scale(dir, d));
  // Bend the path a little: fingers at rest are never quite straight. (The bones do the real bending.)
  const rows = Math.round(20 * detail), around = Math.round(12 * detail);
  // Across the finger: "front" is toward the thumb side for fingers (z), out is the back of the hand.
  let out = name === 'thumb' ? norm(cross(dir, [0, m * 0.3, 1])) : [m, 0, 0];
  out = norm(sub(out, scale(dir, dot(out, dir))));
  if (name === 'thumb') out = norm(add(out, [m * 0.6, 0, 0]));
  out = norm(sub(out, scale(dir, dot(out, dir))));
  const side = norm(cross(dir, out));
  const b1 = len(sub(joints[0], start)), b2 = b1 + lengths[0], b3 = b2 + lengths[1];
  const tipCap = f.depth * 0.55;
  const segOf = (d) => {
    const w = {};
    const s1 = smooth(b2 - 0.004, b2 + 0.004, d), s2 = smooth(b3 - 0.003, b3 + 0.003, d);
    const base = smooth(b1 - 0.01, b1 + 0.004, d);
    w[`${name}1${S}`] = base * (1 - s1);
    w[`${name}2${S}`] = base * s1 * (1 - s2);
    w[`${name}3${S}`] = base * s1 * s2;
    w[`hand${S}`] = 1 - base;
    return w;
  };
  const shape = (d, th) => {
    const u = d / total;
    const taper = 1 - 0.2 * u;
    let rw = (f.width / 2) * taper, rd = (f.depth / 2) * taper;
    // Rounded at the tip; closed at the root too, inside the palm, so no open end can show.
    const cap = (d > total - tipCap ? Math.sqrt(clamp(1 - ((d - (total - tipCap)) / tipCap) ** 2)) : 1) * Math.sqrt(clamp(d / 0.006));
    if (name === 'thumb') { rw *= 1 + 0.25 * smooth(b2, b1, d); rd *= 1 + 0.15 * smooth(b2, b1, d); }
    const co = Math.cos(th), si = Math.sin(th);
    let bump = 0;
    // Knuckles on the back at each joint; the pads swell on the palm side between them.
    for (const bj of [b1, b2, b3]) bump += 0.0016 * G((d - bj) / 0.005) * Math.max(0, co) ** 2;
    for (const [a, b] of [[b1, b2], [b2, b3], [b3, total]]) bump += 0.0012 * G((d - (a + b) / 2) / ((b - a) * 0.35)) * Math.max(0, -co) ** 2;
    // Creases on the palm side at the joints.
    for (const bj of [b2, b3]) bump -= 0.0009 * G((d - bj) / 0.0018) * Math.max(0, -co);
    rw = (rw + bump * 0.4) * cap; rd = (rd + bump) * cap;
    return [co * rd, si * rw];
  };
  part.grid(rows, around, (i, j) => {
    const d = (i / rows) * total;
    const th = (j / around) * Math.PI * 2;
    const [o, s] = shape(d, th);
    const p = add(at(d), add(scale(out, o), scale(side, s)));
    return { p, uv: [j / around, d / total], w: segOf(d), tint: 1 - 0.2 * smooth(b1 + 0.008, b1 - 0.004, d), zone: { zone: 'hand', y: p[1], d: 1 } };
  }, { flip: true });
  // The nail: a slightly domed plate on the back of the last segment.
  const nl = lengths[2] * 0.62, nw = f.width * 0.36;
  nails.grid(4, 6, (i, j) => {
    const d = total - tipCap * 0.35 - nl + (i / 4) * nl;
    const a = (j / 6) * 2 - 1;
    const th = a * (nw / (f.depth / 2)) * 0.9;
    const [o, s] = shape(d, th);
    const lift = 0.00055 * (1 - a * a * 0.6) * smooth(0, 0.5, i / 4);
    const p = add(at(d), add(scale(out, o + lift), scale(side, s)));
    return { p, uv: [a * 0.5 + 0.5, i / 4], w: segOf(d), tint: 1 - 0.25 * (i === 0 ? 1 : 0), zone: { zone: 'hand', y: p[1], d: 1 } };
  }, { flip: true });
  return path;
}

export function buildArms(detail = 1) {
  const skin = new Part('arms', 'skin');
  const nails = new Part('nails', 'nail');
  for (const m of [1, -1]) {
    arm(skin, m, detail);
    for (const name of FINGER_NAMES) finger(skin, nails, name, m, detail);
  }
  return [skin, nails];
}

export { leanHand };
