import { plant } from './martial.js';

/**
 * Dances: the `dance` clip, `style.dance` (or `state.dance`) naming one. Each is a loop of exactly
 * `period` seconds of the clip's `time` (a `speed` in the state plays it faster or slower), driven by one
 * beat `b` that goes round 0..2π once in the loop, so it begins again where it ended. The feet are kept
 * on the floor as in the fighting stances (`plant`).
 *
 * Bones are turned as the rig's own (x forward −, y turns to his left +, z swings the left limb out +),
 * on top of the arms hanging easy.
 */

const TAU = Math.PI * 2;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Both arms, from the rest A-pose: set to `L` and `R` ([arm, fore] each of [x, y, z]), the right the left's mirror unless given. */
function arms(k, L, R = null) {
  const mirrored = (v) => [v[0], -v[1], -v[2]];
  const r = R ?? L.map(mirrored);
  for (const [S, [a, f]] of [['L', L], ['R', r]]) {
    for (let i = 0; i < 3; i++) { k.bone(`arm${S}`).rot[i] = a[i]; k.bone(`fore${S}`).rot[i] = f[i]; }
  }
}
/** A leg: thigh forward `c`, knee bent `knee`, spread `out`, the foot kept flat (or tipped `toe`, toes down). */
function leg(k, S, { c = 0, knee = 0.1, out = 0, toe = 0, yaw = 0 }) {
  const m = S === 'L' ? 1 : -1;
  k.bone(`thigh${S}`).rot.splice(0, 3, -c, m * yaw, m * out);
  k.bone(`shin${S}`).rot.splice(0, 3, knee, 0, 0);
  k.bone(`foot${S}`).rot.splice(0, 3, c - knee + toe, 0, 0);
}

export const DANCE_DATA = {
  // Disco: one arm thrown up to point at the ceiling and swung down across to the floor, the other hand on the hip, the hips swaying with it.
  disco: {
    period: 2, hands: 'point',
    move(k, b) {
      const s = Math.sin(b), c = Math.cos(b * 2);
      arms(k, [[-0.1, 0.25, 0.55], [-1.75, -0.3, 0]], [[-0.3 - 0.4 * (1 - s) / 2, 0.5 * s, -1.0 - 1.45 * s], [-0.15, 0, 0]]);
      k.bone('handR').rot.splice(0, 3, 0, 0, 0);
      k.move('hips', 0.05 * s, 0, 0);
      k.turn('hips', 0, 0.15 * s, -0.12 * s);
      k.turn('spine', 0, -0.1 * s, 0.1 * s);
      k.turn('chest', 0, -0.12 * s, 0.08 * s);
      k.turn('head', -0.05, 0.25 * s, 0);
      leg(k, 'L', { c: 0.1, knee: 0.3 + 0.2 * Math.max(0, -s) + 0.05 * c, out: 0.05 });
      leg(k, 'R', { c: -0.05, knee: 0.3 + 0.2 * Math.max(0, s) + 0.05 * c, out: 0.05 });
    },
  },
  // The twist: down low on bent knees, the hips wrung one way and the shoulders the other, the hands out front and swinging.
  twist: {
    period: 1, hands: 'open',
    move(k, b) {
      const s = Math.sin(b), dip = 0.5 + 0.12 * Math.sin(b * 2);
      leg(k, 'L', { c: 0.25, knee: dip + 0.1, out: 0.12 });
      leg(k, 'R', { c: 0.25, knee: dip + 0.1, out: 0.12 });
      k.turn('hips', 0.1, 0.55 * s, 0);
      k.turn('spine', 0.05, -0.2 * s, 0);
      k.turn('chest', 0.05, -0.35 * s, 0);
      k.turn('head', -0.1, -0.2 * s, 0);
      arms(k, [[-0.8, 0.1, 0.4], [-1.3, -0.5, 0]], [[-0.8, -0.1, -0.4], [-1.3, 0.5, 0]]);
      k.turn('armL', 0, -0.3 * s, 0); k.turn('armR', 0, -0.3 * s, 0);
    },
  },
  // The robot: stiff, and in jerks from one square pose to the next, the head turning in quarter steps, the knees locked.
  robot: {
    period: 4, hands: 'open',
    move(k, b) {
      const POSES = [
        { L: [[0, 0, 1.45], [-1.57, 0, 0]], R: [[0, 0, -0.1], [0, 0, 0]], head: 0.6 },
        { L: [[-1.57, 0, 0.1], [0, 0, 0]], R: [[-1.57, 0, -0.1], [-1.57, 0, 0]], head: 0 },
        { L: [[0, 0, 0.1], [0, 0, 0]], R: [[0, 0, -1.45], [-1.57, 0, 0]], head: -0.6 },
        { L: [[-1.57, 0, 0.1], [-1.57, 0, 0]], R: [[-1.57, 0, -0.1], [0, 0, 0]], head: 0 },
      ];
      const u = (b / TAU) * 4, i = Math.floor(u) % 4, f = ease((u - Math.floor(u)) / 0.12), A = POSES[i], B = POSES[(i + 1) % 4];
      const mix = (p, q) => p.map((v, j) => v + (q[j] - v) * f);
      // Each half-turn the pose snaps on, not slides.
      for (const S of ['L', 'R']) {
        const a = mix(A[S][0], B[S][0]), fo = mix(A[S][1], B[S][1]);
        for (let j = 0; j < 3; j++) { k.bone(`arm${S}`).rot[j] = a[j]; k.bone(`fore${S}`).rot[j] = fo[j]; }
      }
      k.turn('head', 0, A.head + (B.head - A.head) * f, 0);
      k.turn('chest', 0, 0.12 * (B.head - A.head) * f, 0);
      leg(k, 'L', { c: 0, knee: 0.04 }); leg(k, 'R', { c: 0, knee: 0.04 });
      // A step in place on the beat, the leg locked straight.
      const step = Math.floor(u * 2) % 2 ? 1 : 0;
      leg(k, step ? 'L' : 'R', { c: -0.35 * ease(((u * 2) % 1) / 0.12), knee: 0.04 });
    },
  },
  // The moonwalk: the feet glide back flat while the heels lift to carry each across in turn, the body easy and leaning back a little, one hand to the hat.
  moonwalk: {
    period: 1.6, hands: 'relaxed',
    move(k, b) {
      for (const [S, off] of [['L', 0], ['R', Math.PI]]) {
        const u = (((b + off) / TAU) % 1 + 1) % 1;
        // 0..0.5 gliding back on the flat foot; 0.5..1 the heel up, the toes dragging forward.
        const glide = u < 0.5, f = glide ? u / 0.5 : (u - 0.5) / 0.5;
        const c = glide ? -0.25 + 0.5 * f * 1 - 0.5 * 0 : 0.25 - 0.5 * ease(f);
        const lift = glide ? 0 : Math.sin(Math.PI * f);
        leg(k, S, { c: -c, knee: 0.12 + 0.28 * lift, toe: 0.55 * lift });
      }
      k.turn('spine', -0.06, 0, 0); k.turn('chest', -0.04, 0, 0);
      k.turn('hips', 0, 0.06 * Math.sin(b), 0);
      arms(k, [[0.12, 0, 0.2], [-0.3, 0, 0]], [[-0.7, 0.3, -0.25], [-2.1, 0.5, 0]]);
      k.turn('head', 0, 0.05 * Math.sin(b), 0);
    },
  },
  // A step-touch: a step out to one side and the other foot brought to it, then back, the hips swinging with it, the arms loose and bent, swinging the way he steps.
  sidestep: {
    period: 2, hands: 'relaxed',
    move(k, b) {
      const s = Math.sin(b), out = Math.max(0, s), back = Math.max(0, -s);
      // Stepping to his left on one half, to his right on the other: the leading foot out, the other brought up beside it.
      leg(k, 'L', { c: 0.05, knee: 0.3 + 0.12 * back, out: 0.28 * out });
      leg(k, 'R', { c: 0.05, knee: 0.3 + 0.12 * out, out: 0.28 * back });
      k.move('hips', 0.1 * s, 0, 0);
      k.turn('hips', 0, 0.12 * s, -0.1 * s);
      k.turn('spine', 0, -0.08 * s, 0.1 * s); k.turn('chest', 0, -0.1 * s, 0.06 * s);
      k.turn('head', 0, 0.12 * s, 0);
      arms(k, [[-0.35 + 0.2 * s, 0.15, 0.3], [-1.3 + 0.2 * s, -0.3, 0]], [[-0.35 - 0.2 * s, -0.15, -0.3], [-1.3 - 0.2 * s, 0.3, 0]]);
    },
  },
  // The bounce: down on the beat and up off it on loose knees, the shoulders rolling, the fists pumping, the head nodding.
  bounce: {
    period: 1, hands: 'fist',
    move(k, b) {
      const s = Math.sin(b), d = 0.5 + 0.5 * Math.cos(b * 2);
      leg(k, 'L', { c: 0.15, knee: 0.25 + 0.4 * d, out: 0.12 }); leg(k, 'R', { c: 0.15, knee: 0.25 + 0.4 * d, out: 0.12 });
      k.turn('hips', 0, 0.1 * s, 0.05 * s);
      k.turn('spine', 0.08 + 0.06 * d, -0.06 * s, 0); k.turn('chest', 0.05, -0.12 * s, 0);
      k.turn('head', 0.1 * d - 0.05, 0.1 * s, 0);
      arms(k, [[-0.5 - 0.35 * Math.max(0, s), 0, 0.3], [-1.4, -0.4, 0]], [[-0.5 - 0.35 * Math.max(0, -s), 0, -0.3], [-1.4, 0.4, 0]]);
    },
  },
};

export const DANCES = Object.freeze(Object.keys(DANCE_DATA));

/** Poses `name` at clip time `T` (seconds). */
export function dance(k, name, T, speed = 1) {
  const data = DANCE_DATA[name] ?? DANCE_DATA.bounce;
  data.move(k, (T * Math.max(0, speed) * TAU) / data.period % TAU + (T < 0 ? TAU : 0));
  plant(k);
}
