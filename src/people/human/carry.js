import { mirror } from './skeleton.js';

/**
 * Carrying things in the hands that are not held by a grip: a ball on the
 * palm, a coin between thumb and forefinger, a book open in both hands.
 *
 * Each is a place to bring a hand to, and ways to turn it, set relative to
 * the chest (so the hand follows the body, standing or sitting); `reach`
 * turns the arm, forearm and hand as little as gets the hand there, starting
 * from where it was a moment ago, so the arm moves smoothly from frame to
 * frame.
 */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * The hand of side `m` (1 left, −1 right) at rest, for a figure's `joints`
 * and `fingers`: the middle of the palm, the way the palm faces, the way
 * the fingers run, and the tips of the thumb and forefinger.
 */
export function handFrame(joints, fingers, m) {
  const wrist = mirror(joints.wrist, m);
  const root = (f) => mirror(fingers[f].joints[0], m);
  const knuckle = root('middle');
  const along = norm(sub(knuckle, wrist));
  // The palm faces across the knuckles from the back of the hand: toward the thigh at rest (−x for the left).
  let palm = norm(cross(along, sub(root('index'), root('pinky'))));
  if (palm[0] * m > 0) palm = palm.map((v) => -v);
  const centre = [0, 1, 2].map((a) => wrist[a] * 0.45 + knuckle[a] * 0.55 + palm[a] * 0.012);
  return { centre, palm, along, indexTip: mirror(fingers.index.joints[3], m), thumbTip: mirror(fingers.thumb.joints[3], m) };
}

/** One bone's local matrix (3×4 rows), as Skeleton.compute makes it with no move or squash: T(p)·R·T(−p). */
function local(rot, p, out) {
  const cx = Math.cos(rot[0]), sx = Math.sin(rot[0]), cy = Math.cos(rot[1]), sy = Math.sin(rot[1]), cz = Math.cos(rot[2]), sz = Math.sin(rot[2]);
  const r = [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
  for (let i = 0; i < 3; i++) {
    out[i * 4] = r[i * 3]; out[i * 4 + 1] = r[i * 3 + 1]; out[i * 4 + 2] = r[i * 3 + 2];
    out[i * 4 + 3] = p[i] - (r[i * 3] * p[0] + r[i * 3 + 1] * p[1] + r[i * 3 + 2] * p[2]);
  }
  return out;
}
/** A · B, both 3×4 rows. */
function compose(A, B, out) {
  for (let r = 0; r < 3; r++) {
    const a0 = A[r * 4], a1 = A[r * 4 + 1], a2 = A[r * 4 + 2], a3 = A[r * 4 + 3];
    out[r * 4] = a0 * B[0] + a1 * B[4] + a2 * B[8];
    out[r * 4 + 1] = a0 * B[1] + a1 * B[5] + a2 * B[9];
    out[r * 4 + 2] = a0 * B[2] + a1 * B[6] + a2 * B[10];
    out[r * 4 + 3] = a0 * B[3] + a1 * B[7] + a2 * B[11] + a3;
  }
  return out;
}
const at = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3], M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7], M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]];
const turned = (M, d) => [M[0] * d[0] + M[1] * d[1] + M[2] * d[2], M[4] * d[0] + M[5] * d[1] + M[6] * d[2], M[8] * d[0] + M[9] * d[1] + M[10] * d[2]];

/**
 * Turns side `S`'s arm, forearm and hand of `skeleton` (its matrices worked
 * out for the pose) so the hand's rest-pose point `point` comes to the
 * world point `to`, and each of `dirs` ([rest direction, world direction,
 * weight]) turns as near that way as it will, the arm kept near the pose it
 * had (and the elbow from bending backward). `from` is the turns found last
 * time (to start from them); returns the turns it found.
 */
export function reach(skeleton, S, { point, to, dirs = [] }, from = null) {
  const bones = [`arm${S}`, `fore${S}`, `hand${S}`].map((n) => skeleton.index.get(n));
  const parent = skeleton.parents[bones[0]];
  const M = skeleton.matrices, P = M.slice(parent * 12, parent * 12 + 12);
  const pivots = bones.map((b) => skeleton.pivots[b]);
  const start = bones.map((b) => skeleton.pose[b].rot.slice());
  const rots = from ? from.map((r) => r.slice()) : start.map((r) => r.slice());
  const L = [new Float64Array(12), new Float64Array(12), new Float64Array(12)], W = new Float64Array(12), T = new Float64Array(12);
  const handMatrix = () => {
    compose(P, local(rots[0], pivots[0], L[0]), W);
    compose(W, local(rots[1], pivots[1], L[1]), T);
    return compose(T, local(rots[2], pivots[2], L[2]), W);
  };
  const cost = () => {
    const H = handMatrix();
    const p = at(H, point);
    let c = (p[0] - to[0]) ** 2 + (p[1] - to[1]) ** 2 + (p[2] - to[2]) ** 2;
    for (const [d, want, w] of dirs) c += w * (1 - dot(norm(turned(H, d)), want));
    // Near the clip's pose; the elbow bends only one way (its x turn negative), and the wrist only so far.
    for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) c += 0.0004 * (rots[b][a] - start[b][a]) ** 2;
    c += 0.05 * Math.max(0, rots[1][0] - 0.05) ** 2 + 0.02 * Math.max(0, Math.hypot(...rots[2]) - 1.0) ** 2;
    return c;
  };
  let best = cost(), step = from ? 0.04 : 0.25;
  for (let it = 0; it < 60 && step > 0.0015; it++) {
    let moved = false;
    for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) {
      for (const d of [step, -step]) {
        rots[b][a] += d;
        const c = cost();
        if (c < best) { best = c; moved = true; break; }
        rots[b][a] -= d;
      }
    }
    if (!moved) step *= 0.5;
  }
  bones.forEach((b, i) => { const r = skeleton.pose[b].rot; r[0] = rots[i][0]; r[1] = rots[i][1]; r[2] = rots[i][2]; });
  return rots;
}

/** The world matrix (3×4 rows) of bone `name` in `skeleton`, and a rest point and direction through it. */
export const boneAt = (skeleton, name) => skeleton.matrices.slice(skeleton.index.get(name) * 12, skeleton.index.get(name) * 12 + 12);
export { at as apply, turned as turn, norm, cross, sub, dot };

/**
 * Where a book is held open to be read (its world matrix, columns: across,
 * its pages' face, up the page; and its middle), from the chest's matrix
 * `C` and the eyes' world point `eyes`: `ahead` in front of the chest at
 * `below` under the eyes (rest), its pages turned to face the eyes.
 */
export function bookPlace(C, eyesRest, eyes, { ahead = 0.3, below = 0.3 } = {}) {
  const middle = at(C, [0, eyesRest[1] - below, eyesRest[2] + ahead]);
  const face = norm(sub(eyes, middle));
  let across = norm(turned(C, [1, 0, 0]));
  across = norm(sub(across, face.map((v) => v * dot(across, face))));
  const up = cross(across, face);
  return { middle, across, face, up };
}
