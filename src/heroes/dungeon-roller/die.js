import { createDie } from './nat/geometry.js';
import { rollSpin, turn } from '../../physics.js';

/**
 * The party rolls through the dungeon as Nat's d20 (`nat/geometry.js`): the
 * same purple resin, the same inked edges, the same numbers, scaled down to
 * a little under a tile across.
 *
 * It is pushed about as a ball — a d20 is round enough — but it turns as the
 * die it is, and whatever face is nearest the ceiling is the number showing.
 * That is the roll: run into a monster and the number on top is what the
 * party fights with. When the die comes to rest it tips over onto its nearest
 * face, as Nat does, so a die that has stopped always reads one clean number.
 *
 * The turning is done here, on plain arrays, at the physics rate, so the
 * tests roll the same numbers the screen shows.
 */

/** The ball the physics pushes about, in tiles. */
export const DIE_RADIUS = 0.36;

/** Nat's die is 1 from the middle to a corner; this one is 0.4. */
export const DIE_SCALE = 0.4;

/** Slower than this along the ground and the die tips over onto a face. */
const SETTLE_SPEED = 0.45;

/** How quickly it tips over, per second. */
const SETTLE_RATE = 9;

/** How far it rolls from one face to the next, near enough: an edge of the die, in tiles. */
const EDGE = 0.42;

/** How hard it is nudged off its line at each tip: radians a second of twist, per tile a second. */
const TWIST = 1.2;

let made = null;

/**
 * Nat's die, made once: the meshes to draw (`group`, with `body` the part that
 * turns, and `glyphs` the numbers on it), and its faces and corners in its own
 * frame — each face's normal and number — for working out what's on top.
 */
export function dieModel(GFX) {
  if (made) return made;
  const model = createDie(GFX);
  const p = new GFX.IcosahedronGeometry(1, 0).attributes.position;
  const corners = [];
  for (let i = 0; i < p.count; i++) {
    const v = [p.getX(i), p.getY(i), p.getZ(i)];
    if (!corners.some((c) => Math.hypot(c[0] - v[0], c[1] - v[1], c[2] - v[2]) < 1e-4)) corners.push(v);
  }
  const faces = model.faces.map((f) => ({ normal: [f.normal.x, f.normal.y, f.normal.z], number: f.number }));
  made = { ...model, glyphs: model.faces, faces, corners };
  return made;
}

/** `v` turned by the quaternion `q` ([x, y, z, w]). */
export function rotate(q, v, out = [0, 0, 0]) {
  const [qx, qy, qz, qw] = q;
  const [x, y, z] = v;
  // t = 2 (q × v); v' = v + w t + q × t
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  out[0] = x + qw * tx + (qy * tz - qz * ty);
  out[1] = y + qw * ty + (qz * tx - qx * tz);
  out[2] = z + qw * tz + (qx * ty - qy * tx);
  return out;
}

const _n = [0, 0, 0];

/**
 * The face nearest the ceiling with the die turned by `q`, and how square to
 * it it is (1 when flat). With `sign` −1, the face nearest the floor instead.
 */
export function topFace(model, q, sign = 1) {
  let best = -2, face = model.faces[0];
  for (const f of model.faces) {
    const up = rotate(q, f.normal, _n)[1] * sign;
    if (up > best) { best = up; face = f; }
  }
  return { number: face.number, normal: face.normal, up: best };
}

/** How far the die reaches below its middle, turned by `q`: from a face flat on the ground to a corner straight down. */
export function reachBelow(model, q) {
  let low = 0;
  for (const c of model.corners) low = Math.max(low, -rotate(q, c, _n)[1]);
  return low * DIE_SCALE;
}

/** The turn that takes unit vector `a` to unit vector `b`, as [x, y, z, w]. */
function between(a, b) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (d < -0.999999) {
    // Opposite: half a turn about anything square to `a`.
    const axis = Math.abs(a[0]) < 0.9 ? [0, -a[2], a[1]] : [a[2], 0, -a[0]];
    const l = Math.hypot(...axis);
    return [axis[0] / l, axis[1] / l, axis[2] / l, 0];
  }
  const x = a[1] * b[2] - a[2] * b[1], y = a[2] * b[0] - a[0] * b[2], z = a[0] * b[1] - a[1] * b[0];
  const w = 1 + d;
  const l = Math.hypot(x, y, z, w);
  return [x / l, y / l, z / l, w / l];
}

function multiply(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/** `q` moved `t` of the way toward `to`, the short way round, in place. */
export function slerp(q, to, t) {
  let [bx, by, bz, bw] = to;
  let cos = q[0] * bx + q[1] * by + q[2] * bz + q[3] * bw;
  if (cos < 0) { cos = -cos; bx = -bx; by = -by; bz = -bz; bw = -bw; }
  let k0 = 1 - t, k1 = t;
  if (cos < 0.9995) {
    const angle = Math.acos(cos), s = Math.sin(angle);
    k0 = Math.sin((1 - t) * angle) / s;
    k1 = Math.sin(t * angle) / s;
  }
  const x = q[0] * k0 + bx * k1, y = q[1] * k0 + by * k1, z = q[2] * k0 + bz * k1, w = q[3] * k0 + bw * k1;
  const l = Math.hypot(x, y, z, w) || 1;
  q[0] = x / l; q[1] = y / l; q[2] = z / l; q[3] = w / l;
  return q;
}

/** The die's turn: which way up it is, and how fast it spins. */
export function createDieState() {
  return { q: [0, 0, 0, 1], spin: [0, 0, 0], settled: false, rolled: 0, tip: 0, seed: 20, nudge: 0 };
}

/**
 * One step of the die's turning, after the ball has moved: rolling along
 * the ground, tumbling slower and slower in the air, and tipping over onto
 * its nearest face once it has all but stopped.
 */
export function stepDie(die, ball, model, dt) {
  const speed = Math.hypot(ball.vx, ball.vz);
  if (ball.grounded && speed < SETTLE_SPEED) {
    const top = topFace(model, die.q);
    const turnUp = between(rotate(die.q, top.normal), [0, 1, 0]);
    slerp(die.q, multiply(turnUp, die.q), Math.min(1, SETTLE_RATE * dt));
    die.spin[0] = die.spin[1] = die.spin[2] = 0;
    die.settled = top.up > 0.999;
    return die;
  }
  die.settled = false;
  if (ball.grounded) {
    rollSpin(ball, die.spin);
    // A d20 doesn't roll true: it tips from face to face over its edges, and
    // which way it goes over each one is a little off the line it is rolled
    // along. A nudge about the vertical at every tip, one way or the other,
    // stands in for that, so even a long straight roll turns up every number.
    // The nudges come from the die's own seeded sequence: the same roll
    // turns up the same numbers, in a test as on the screen.
    die.rolled += speed * dt;
    if (die.rolled > die.tip) {
      die.tip = die.rolled + EDGE;
      die.seed = (die.seed * 16807) % 2147483647;
      die.nudge = ((die.seed - 1) / 2147483646 - 0.5) * 2;
    }
    die.spin[1] += speed * TWIST * die.nudge;
  } else {
    for (let i = 0; i < 3; i++) die.spin[i] *= Math.max(0, 1 - 0.3 * dt);
  }
  turn(die.q, die.spin, dt);
  return die;
}

/** Turns the die so `number` is on top, keeping the way it faces round the vertical as near as it can. */
export function showNumber(die, model, number) {
  const face = model.faces.find((f) => f.number === number);
  if (!face) return die;
  const turnUp = between(rotate(die.q, face.normal), [0, 1, 0]);
  const q = multiply(turnUp, die.q);
  const l = Math.hypot(...q);
  for (let i = 0; i < 4; i++) die.q[i] = q[i] / l;
  die.spin[0] = die.spin[1] = die.spin[2] = 0;
  return die;
}
