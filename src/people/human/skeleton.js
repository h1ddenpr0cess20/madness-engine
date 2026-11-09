import { add, dot, norm, smooth, sub } from './kit.js';

/**
 * The human's skeleton, at real size: an adult man 1.78 m tall, in metres,
 * standing on y = 0, facing +z, his left toward +x, arms hanging with the
 * palms toward the thighs. The bone names are the engine's movement
 * vocabulary (root, hips, spine, chest, neck, head, arm/fore/hand,
 * thigh/shin/foot, with L and R), so a clip written for that rig poses this
 * one; it adds three bones a finger, toes, and nothing else.
 *
 * Every pivot is given for the left side; the right is its mirror in x.
 */

export const HEIGHT = 1.76;

/**
 * Proportions (a stylised, game-ready adult man): 176 cm tall, a 22 cm head
 * (about 7.75 heads), 46 cm across the shoulders, chest, waist and hips 100,
 * 78 and 94 cm round, an 80 cm inseam, 62 cm from shoulder to wrist, a 19 cm
 * hand and a 27 cm foot. At rest the arms hang 12° out from the sides (an
 * A-pose), the elbows a little bent.
 */
export const JOINTS = Object.freeze({
  hips: [0, 0.95, 0],
  spine: [0, 1.07, -0.01],
  chest: [0, 1.24, -0.02],
  neck: [0, 1.45, -0.03],
  head: [0, 1.565, -0.015],
  shoulder: [0.185, 1.43, -0.03],
  elbow: [0.249, 1.127, -0.052],
  wrist: [0.296, 0.861, -0.02],
  hip: [0.09, 0.9, 0],
  knee: [0.095, 0.48, 0.012],
  ankle: [0.098, 0.08, -0.03],
  ball: [0.1, 0.022, 0.128],
});

/**
 * The fingers of the left hand, from the wrist: the knuckle (MCP) each
 * starts from, which way it points, and its three bone lengths. The hand
 * hangs with its palm toward −x and its thumb forward (+z).
 */
export const FINGERS = Object.freeze({
  index: { knuckle: [0.003, -0.094, 0.03], dir: [0, -1, 0.07], lengths: [0.041, 0.024, 0.021], width: 0.0185, depth: 0.016 },
  middle: { knuckle: [0.005, -0.098, 0.0105], dir: [0, -1, 0.0], lengths: [0.046, 0.028, 0.022], width: 0.0185, depth: 0.0165 },
  ring: { knuckle: [0.004, -0.093, -0.0085], dir: [0, -1, -0.06], lengths: [0.043, 0.026, 0.021], width: 0.0172, depth: 0.0155 },
  pinky: { knuckle: [0.001, -0.083, -0.0255], dir: [0, -1, -0.14], lengths: [0.033, 0.02, 0.019], width: 0.0152, depth: 0.0138 },
  thumb: { knuckle: [-0.009, -0.024, 0.021], dir: [-0.42, -0.5, 0.76], lengths: [0.044, 0.033, 0.028], width: 0.021, depth: 0.0185 },
});
export const FINGER_NAMES = Object.freeze(Object.keys(FINGERS));

export const mirror = (p, m) => [p[0] * m, p[1], p[2]];
export const sideOf = (m) => (m > 0 ? 'L' : 'R');

/** Where the joints of one finger are, at rest, for the side `m` (1 left, −1 right): [knuckle, middle, end, tip]. */
/** The hand's lean: its fingers point the way the forearm does, so the knuckles are turned by this about z. */
const HAND_LEAN = Math.atan2(JOINTS.wrist[0] - JOINTS.elbow[0], JOINTS.elbow[1] - JOINTS.wrist[1]);
export const leanHand = (v) => {
  const c = Math.cos(HAND_LEAN), s = Math.sin(HAND_LEAN);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
};

export function fingerJoints(name, m) {
  const f = FINGERS[name];
  const d = norm(leanHand(f.dir));
  const points = [add(JOINTS.wrist, leanHand(f.knuckle))];
  for (const l of f.lengths) points.push(add(points[points.length - 1], [d[0] * l, d[1] * l, d[2] * l]));
  return points.map((p) => mirror(p, m));
}

/** [name, parent, pivot], parents first. */
export function bones() {
  const J = JOINTS;
  const list = [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', J.hips],
    ['spine', 'hips', J.spine],
    ['chest', 'spine', J.chest],
    ['neck', 'chest', J.neck],
    ['head', 'neck', J.head],
  ];
  for (const m of [1, -1]) {
    const S = sideOf(m);
    list.push(
      [`arm${S}`, 'chest', mirror(J.shoulder, m)],
      [`fore${S}`, `arm${S}`, mirror(J.elbow, m)],
      [`hand${S}`, `fore${S}`, mirror(J.wrist, m)],
    );
    for (const name of FINGER_NAMES) {
      const j = fingerJoints(name, m);
      list.push([`${name}1${S}`, `hand${S}`, j[0]], [`${name}2${S}`, `${name}1${S}`, j[1]], [`${name}3${S}`, `${name}2${S}`, j[2]]);
    }
    list.push(
      [`thigh${S}`, 'hips', mirror(J.hip, m)],
      [`shin${S}`, `thigh${S}`, mirror(J.knee, m)],
      [`foot${S}`, `shin${S}`, mirror(J.ankle, m)],
      [`toes${S}`, `foot${S}`, mirror(J.ball, m)],
    );
  }
  return list;
}

/** How a trunk point is shared between hips, spine, chest, neck and head, by height. */
export function trunkWeights(p) {
  const y = p[1];
  const a = smooth(0.97, 1.09, y), b = smooth(1.15, 1.28, y), c = smooth(1.41, 1.48, y), d = smooth(1.525, 1.58, y + 0.25 * Math.max(0, p[2] - 0.02));
  return { hips: 1 - a, spine: a * (1 - b), chest: a * b * (1 - c), neck: a * b * c * (1 - d), head: a * b * c * d };
}

/** A leg point (side `S`): the hips at the top, the thigh, the shin, the foot and the toes. */
export function legWeights(p) {
  const S = p[0] >= 0 ? 'L' : 'R';
  const y = p[1];
  const leg = smooth(0.98, 0.78, y + 0.12 * Math.max(0, -p[2]) - 0.25 * Math.max(0, Math.abs(p[0]) - 0.1));
  const knee = smooth(0.43, 0.54, y), ankle = smooth(0.05, 0.14, y);
  const toes = smooth(0.105, 0.15, p[2]) * (1 - smooth(0.07, 0.1, y));
  const w = { hips: 1 - leg };
  w[`thigh${S}`] = leg * knee;
  w[`shin${S}`] = leg * (1 - knee) * ankle;
  w[`foot${S}`] = leg * (1 - knee) * (1 - ankle) * (1 - toes);
  w[`toes${S}`] = leg * (1 - knee) * (1 - ankle) * toes;
  return w;
}

/** An arm point: the chest round the shoulder, the upper arm, the forearm, the hand. */
export function armWeights(p) {
  const m = p[0] >= 0 ? 1 : -1, S = sideOf(m);
  const sh = mirror(JOINTS.shoulder, m), el = mirror(JOINTS.elbow, m), wr = mirror(JOINTS.wrist, m);
  const up = norm(sub(el, sh)), fo = norm(sub(wr, el));
  const arm = smooth(-0.045, 0.05, dot(sub(p, sh), up) + 0.35 * Math.max(0, Math.abs(p[0]) - Math.abs(sh[0])));
  const fore = smooth(-0.03, 0.035, dot(sub(p, el), fo));
  const hand = smooth(-0.012, 0.022, dot(sub(p, wr), fo));
  return {
    chest: 1 - arm,
    [`arm${S}`]: arm * (1 - fore),
    [`fore${S}`]: arm * fore * (1 - hand),
    [`hand${S}`]: arm * fore * hand,
  };
}

/** A blend of two weightings. */
export function blendWeights(a, b, t) {
  const out = {};
  for (const [k, v] of Object.entries(a)) out[k] = (out[k] ?? 0) + v * (1 - t);
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v * t;
  return out;
}

/** The trunk, with the shoulders handed over to the arms toward the armholes. */
export function torsoWeights(p) {
  const t = trunkWeights(p);
  const s = smooth(0.11, 0.19, Math.abs(p[0])) * smooth(1.25, 1.36, p[1]);
  return s > 0 ? blendWeights(t, armWeights(p), s) : t;
}
