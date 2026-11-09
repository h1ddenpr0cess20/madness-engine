import { FACE as BAKED_FACE, FINGERS as BAKED_FINGERS, JOINTS as BAKED_JOINTS } from './data/base.js';

/**
 * The human's skeleton, at real size: an adult man 1.76 m tall, in metres,
 * standing on y = 0, facing +z, his left toward +x, arms 12° out from his
 * sides with the palms toward the thighs. Its joints are where the real
 * anatomy he is built on (data/base.js) bends. The bone names are the
 * engine's movement vocabulary (root, hips, spine, chest, neck, head,
 * arm/fore/hand, thigh/shin/foot, with L and R), so a clip written for that
 * rig poses this one, and it adds everything else on a person that moves:
 * collarbones, three bones a finger, toes, the jaw and tongue, each eye and
 * its lids, the brows and the mouth's corners.
 *
 * Every pivot is given for the left side; the right is its mirror in x.
 */

export const HEIGHT = 1.76;

/** The body's joints (left side). */
export const JOINTS = Object.freeze(Object.fromEntries(Object.entries(BAKED_JOINTS).map(([k, v]) => [k, Object.freeze(v)])));

/** The face's moving parts (left side): where each turns, the eye (centre, radius), the mouth's middle. */
export const FACE = Object.freeze(BAKED_FACE);
export const EYE = Object.freeze(BAKED_FACE.eye);

/** The fingers (left hand), thumb first: each one's joints from its root to its tip, and the axis it curls about. */
export const FINGER_NAMES = Object.freeze(['thumb', 'index', 'middle', 'ring', 'pinky']);
export const FINGERS = Object.freeze(BAKED_FINGERS);

export const mirror = (p, m) => [p[0] * m, p[1], p[2]];
export const sideOf = (m) => (m > 0 ? 'L' : 'R');

/** Where the joints of one finger are, at rest, for the side `m` (1 left, −1 right): [root, middle, end, tip]. */
export const fingerJoints = (name, m) => FINGERS[name].joints.map((p) => mirror(p, m));

/**
 * [name, parent, pivot], parents first. Beyond the engine's movement
 * vocabulary: the jaw (and the tongue on it), each eye and its two lids,
 * the brows and the mouth's corners; a collarbone over each arm; three bones
 * a finger; the toes.
 */
export function bones() {
  const J = JOINTS;
  const list = [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', J.hips],
    ['spine', 'hips', J.spine],
    ['chest', 'spine', J.chest],
    ['neck', 'chest', J.neck],
    ['head', 'neck', J.head],
    ['jaw', 'head', FACE.jaw],
    ['tongue', 'jaw', FACE.tongue],
  ];
  for (const m of [1, -1]) {
    const S = sideOf(m);
    list.push(
      [`eye${S}`, 'head', mirror(EYE.center, m)],
      [`lidUp${S}`, 'head', mirror(EYE.center, m)],
      [`lidLow${S}`, 'head', mirror(EYE.center, m)],
      [`brow${S}`, 'head', mirror(FACE.brow, m)],
      [`lipCorner${S}`, 'head', mirror(FACE.lipCorner, m)],
    );
  }
  for (const m of [1, -1]) {
    const S = sideOf(m);
    list.push(
      [`clavicle${S}`, 'chest', mirror(J.clavicle, m)],
      [`arm${S}`, `clavicle${S}`, mirror(J.shoulder, m)],
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

/** Distance along the arm of side `m` from the shoulder joint, for a point `p` (down the upper arm, then the forearm). */
export function armDistance(p, m) {
  const sh = mirror(JOINTS.shoulder, m), el = mirror(JOINTS.elbow, m), wr = mirror(JOINTS.wrist, m);
  const seg = (a, b) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const L = Math.hypot(...ab);
    return { t: ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / L, L };
  };
  const u = seg(sh, el);
  if (u.t <= u.L) return u.t;
  return u.L + Math.max(0, seg(el, wr).t);
}
