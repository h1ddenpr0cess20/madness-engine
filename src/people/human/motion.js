import { JOINTS } from './skeleton.js';

/**
 * How the human moves: the engine's movement clips (idle, walk, run, jump,
 * leap, attack, cast, hit, ko, win, sit, talk), driven the same way the
 * cast is driven ({ clip, t, time, seed, speed }) and with the same
 * cadences, so a game that moves one moves the other in step, but worked
 * out for a man of real size: every rise, fall and step is in metres, the
 * shoulders swing against the hips, the head stays level as he goes, the
 * foot rolls off its toes.
 *
 * `style`: `armed` ('R' or 'L', the hand that holds a weapon ready),
 * `attack` ('slash', 'chop', 'thrust', 'smite', 'punch', 'shove'),
 * `heavy` (0..1, slower and deeper).
 */

export const CLIPS = Object.freeze(['idle', 'walk', 'run', 'jump', 'leap', 'attack', 'cast', 'hit', 'ko', 'win', 'sit', 'talk']);

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const win = (t, a, b) => ease((t - a) / (b - a));
/** The legs' length: what every rise and fall is measured against. */
const THIGH = JOINTS.hip[1] - JOINTS.knee[1], SHIN = JOINTS.knee[1] - JOINTS.ankle[1];
const LEG = THIGH + SHIN;

/** How far the hips drop when both knees bend by these (thigh forward, knee bent) angles. */
const drop = (thigh, knee) => THIGH * (1 - Math.cos(thigh)) + SHIN * (1 - Math.cos(knee - thigh));

/** Arms down from the rest pose's A to hanging easy by the sides, elbows soft. */
function hangArms(k, out = 0) {
  k.turn('armL', 0.02, 0, -0.13 + out);
  k.turn('armR', 0.02, 0, 0.13 - out);
  k.turn('foreL', -0.16, 0.25, 0);
  k.turn('foreR', -0.16, -0.25, 0);
}

/** A weapon held ready in the hand on side `S`: the arm forward, the elbow bent, the blade up and out. */
function ready(k, S, amount = 1) {
  const m = S === 'L' ? 1 : -1;
  k.turn(`arm${S}`, -0.42 * amount, 0, m * 0.04 * amount);
  k.turn(`fore${S}`, -0.85 * amount, m * -0.35 * amount, 0);
  k.turn(`hand${S}`, 0.25 * amount, 0, 0);
}

function breathe(k, T, heavy) {
  const b = Math.sin(T * (2.2 - heavy * 0.6));
  k.scale('chest', 1 + b * 0.01, 1 + b * 0.012, 1 + b * 0.014);
  k.turn('clavicleL', 0, 0, b * 0.012);
  k.turn('clavicleR', 0, 0, -b * 0.012);
  return b;
}

function idle(k, T, armed) {
  // Weight shifting from foot to foot, the head looking round now and then.
  const sway = Math.sin(T * 0.6);
  k.move('hips', sway * 0.012, -0.004, 0);
  k.turn('hips', 0, Math.sin(T * 0.45) * 0.04, -sway * 0.025);
  k.turn('spine', 0, 0, sway * 0.012);
  k.turn('chest', 0, 0, sway * 0.012);
  k.turn('thighL', 0.03, 0, sway * 0.025 + 0.02);
  k.turn('thighR', 0.03, 0, sway * 0.025 - 0.02);
  k.turn('shinL', 0.05 + Math.max(0, -sway) * 0.05, 0, 0);
  k.turn('shinR', 0.05 + Math.max(0, sway) * 0.05, 0, 0);
  k.turn('footL', -0.02, 0, -sway * 0.025);
  k.turn('footR', -0.02, 0, -sway * 0.025);
  k.turn('neck', Math.sin(T * 0.5) * 0.03, Math.sin(T * 0.31) * 0.12, 0);
  k.turn('head', Math.sin(T * 0.43) * 0.04, Math.sin(T * 0.37) * 0.1, 0);
  if (armed) ready(k, armed);
}

function walk(k, T, speed, heavy, armed) {
  const ph = T * (9 - heavy * 2) * Math.max(0.5, speed), g = Math.sin(ph), c = Math.cos(ph);
  // The hips: lowest as the feet pass, highest over the planted leg; swaying over it, turning with the stride.
  k.move('hips', 0, Math.abs(c) * 0.02 - 0.014, 0);
  k.turn('hips', 0, g * 0.11, Math.sin(ph * 2) * 0.02);
  k.turn('spine', 0.03, -g * 0.05, 0);
  k.turn('chest', 0.03, -g * 0.1, 0);
  k.turn('neck', 0, g * 0.06, 0);
  k.turn('head', 0, g * 0.04, 0);
  for (const [S, m] of [['L', 1], ['R', -1]]) {
    const a = m * g, swing = Math.max(0, m * c);
    k.turn(`thigh${S}`, -a * 0.5 - swing * 0.12, 0, 0);
    k.turn(`shin${S}`, 0.08 + swing * 0.75 + Math.max(0, -a) * 0.15, 0, 0);
    // Heel down in front, rolling up onto the toes behind.
    k.turn(`foot${S}`, -a * 0.22 + swing * 0.15, 0, 0);
    k.turn(`toes${S}`, Math.max(0, -a) * Math.max(0, -m * c) * -0.5, 0, 0);
  }
  // The arms against the legs.
  k.turn('armL', g * 0.38, 0, 0);
  k.turn('foreL', -0.12 - Math.max(0, g) * 0.35, 0, 0);
  if (armed === 'R') { ready(k, 'R', 0.8); k.turn('armR', -g * 0.08, 0, 0); } else {
    k.turn('armR', -g * 0.38, 0, 0);
    k.turn('foreR', -0.12 - Math.max(0, -g) * 0.35, 0, 0);
  }
  k.turn('clavicleL', 0, -g * 0.05, 0);
  k.turn('clavicleR', 0, -g * 0.05, 0);
}

function run(k, T, speed, heavy, armed) {
  const ph = T * (15 - heavy * 3) * Math.max(0.5, speed), g = Math.sin(ph), c = Math.cos(ph);
  k.move('hips', 0, 0.035 - Math.abs(c) * 0.05, 0.0);
  k.turn('hips', 0, g * 0.14, 0);
  k.turn('spine', 0.14, -g * 0.06, 0);
  k.turn('chest', 0.08, -g * 0.2, 0);
  k.turn('neck', -0.08, g * 0.08, 0);
  k.turn('head', -0.1, g * 0.06, 0);
  for (const [S, m] of [['L', 1], ['R', -1]]) {
    const a = m * g, swing = Math.max(0, m * c);
    k.turn(`thigh${S}`, -a * 0.85 - swing * 0.3, 0, 0);
    k.turn(`shin${S}`, 0.3 + swing * 1.55, 0, 0);
    k.turn(`foot${S}`, -a * 0.2 + swing * 0.25, 0, 0);
    k.turn(`toes${S}`, Math.max(0, -a) * -0.5, 0, 0);
  }
  // Elbows at a right angle, hands pumping from the hip to the chest.
  k.turn('armL', g * 0.85, 0, 0.04);
  k.turn('foreL', -1.35 + g * 0.2, 0.2, 0);
  if (armed === 'R') { ready(k, 'R', 0.9); k.turn('armR', -g * 0.2, 0, 0); } else {
    k.turn('armR', -g * 0.85, 0, -0.04);
    k.turn('foreR', -1.35 - g * 0.2, -0.2, 0);
  }
}

function jump(k, t, leap, armed) {
  const t0 = leap ? 0.18 : 0.24, drive = 0.1, air = leap ? 0.56 : 0.44, land = leap ? 0.36 : 0.3;
  const liftoff = t0 + drive, touchdown = liftoff + air;
  const down = win(t, 0, t0) * (1 - win(t, t0, liftoff));
  const flight = win(t, t0 + 0.02, liftoff + 0.08) * (1 - win(t, touchdown - 0.1, touchdown));
  const arc = Math.sin(Math.max(0, Math.min(1, (t - liftoff) / air)) * Math.PI);
  const give = win(t, touchdown - 0.04, touchdown + 0.08) * (1 - win(t, touchdown + 0.08, touchdown + land));
  const bent = Math.max(down, give * 0.75);
  k.move('root', 0, (leap ? 0.32 : 0.45) * arc, 0);
  k.move('hips', 0, -drop(1.0 * bent, 1.9 * bent), 0);
  const tuck = flight * (1 - bent);
  for (const [S, lead] of [['L', 1], ['R', 0]]) {
    k.turn(`thigh${S}`, -1.0 * bent + (leap ? (lead ? -1.2 : 0.7) : -0.65) * tuck, 0, 0);
    k.turn(`shin${S}`, 1.9 * bent + (leap ? (lead ? 0.2 : 1.4) : 1.2) * tuck, 0, 0);
    k.turn(`foot${S}`, -0.9 * bent + 0.4 * tuck, 0, 0);
  }
  k.turn('spine', 0.35 * bent + (leap ? 0.18 : -0.05) * tuck, 0, 0);
  k.turn('chest', 0.12 * bent - 0.08 * tuck, 0, 0);
  k.turn('head', -0.25 * bent - 0.1 * tuck, 0, 0);
  const back = bent * (1 - give), fwd = give * 0.75;
  k.turn('armL', 0.9 * back - 0.55 * fwd + (leap ? -1.4 : -2.4) * tuck, 0, 0.3 * tuck);
  k.turn('foreL', -0.3 * back - 0.5 * fwd - 0.2 * tuck, 0, 0);
  if (armed === 'R') ready(k, 'R');
  else {
    k.turn('armR', 0.9 * back - 0.55 * fwd + (leap ? 0.9 : -2.4) * tuck, 0, -0.3 * tuck);
    k.turn('foreR', -0.3 * back - 0.5 * fwd - 0.2 * tuck, 0, 0);
  }
}

/** The weapon held ready (right hand), as a keyed pose: where every swing starts and ends. */
const READY_R = { armR: [-0.42, 0, -0.04], foreR: [-0.85, 0.35, 0], handR: [0.25, 0, 0] };

/**
 * Poses at times, eased from one to the next: `keys` is [[t, { bone: [x, y, z] }], ...]
 * (a bone missing from a key is at 0 there). Added onto what the bones already have.
 */
function keyed(k, t, keys) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, a] = keys[i], [tb, b] = keys[i + 1];
  const f = ease((t - ta) / (tb - ta));
  const bones = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const bone of bones) {
    const p = a[bone] ?? [0, 0, 0], q = b[bone] ?? [0, 0, 0];
    k.turn(bone, p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f);
  }
}

/** The swings, each from ready to ready: wind up, strike, follow through, recover. Times are of the clip's 0..1. */
const SWINGS = {
  // From high over the right shoulder, across and down to the left hip.
  slash: [
    [0, READY_R],
    [0.24, { chest: [-0.08, 0.45, 0.05], spine: [0, 0.15, 0], armR: [-2.5, 0, -0.35], foreR: [-0.75, 0.3, 0], handR: [0.2, 0, 0], armL: [-0.25, 0, 0.25], foreL: [-0.4, 0, 0], head: [0, -0.2, 0] }],
    [0.36, { chest: [0.15, -0.45, -0.05], spine: [0.08, -0.15, 0], armR: [-1.35, 0, 0.7], foreR: [-0.15, 0.25, 0], handR: [0.95, 0, 0], armL: [0.25, 0, 0.15], foreL: [-0.3, 0, 0], head: [0.05, 0.2, 0] }],
    [0.52, { chest: [0.22, -0.75, -0.05], spine: [0.1, -0.22, 0], armR: [-0.75, 0, 1.15], foreR: [-0.15, 0.1, 0], handR: [1.1, 0, 0], armL: [0.3, 0, 0.15], foreL: [-0.3, 0, 0], head: [0.05, 0.25, 0] }],
    [0.92, READY_R],
    [1, READY_R],
  ],
  // Straight down from overhead, both hands, the body folding into it.
  chop: [
    [0, READY_R],
    [0.24, { chest: [-0.22, 0.1, 0], spine: [-0.08, 0, 0], armR: [-2.85, 0, 0.15], foreR: [-1.1, 0.2, 0], handR: [-0.5, 0, 0], armL: [-2.75, 0, -0.35], foreL: [-1.1, -0.4, 0], handL: [-0.4, 0, 0], head: [-0.15, 0, 0] }],
    [0.36, { chest: [0.3, 0, 0], spine: [0.15, 0, 0], armR: [-1.45, 0, 0.35], foreR: [-0.2, 0.2, 0], handR: [0.85, 0, 0], armL: [-1.3, 0, -0.45], foreL: [-0.4, -0.3, 0], handL: [0.7, 0, 0], head: [0.15, 0, 0] }],
    [0.52, { chest: [0.38, 0, 0], spine: [0.2, 0, 0], armR: [-0.95, 0, 0.35], foreR: [-0.15, 0.2, 0], handR: [1.0, 0, 0], armL: [-0.85, 0, -0.45], foreL: [-0.35, -0.3, 0], handL: [0.85, 0, 0], head: [0.2, 0, 0] }],
    [0.92, READY_R],
    [1, READY_R],
  ],
  // Drawn back by the hip, then driven straight out, the point first.
  thrust: [
    [0, READY_R],
    [0.24, { chest: [0, 0.45, 0], armR: [0.25, 0, -0.15], foreR: [-1.5, 0.5, 0], handR: [1.0, 0, 0], armL: [-0.6, 0, 0.35], foreL: [-0.6, 0, 0] }],
    [0.36, { chest: [0.08, -0.35, 0], spine: [0.06, -0.1, 0], armR: [-1.45, 0, 0.3], foreR: [-0.05, 0.15, 0], handR: [1.25, 0, 0], armL: [0.35, 0, 0.25], foreL: [-0.3, 0, 0] }],
    [0.5, { chest: [0.1, -0.4, 0], spine: [0.08, -0.12, 0], armR: [-1.5, 0, 0.3], foreR: [-0.02, 0.15, 0], handR: [1.25, 0, 0], armL: [0.35, 0, 0.25], foreL: [-0.3, 0, 0] }],
    [0.92, READY_R],
    [1, READY_R],
  ],
  // Overhand and heavy: right up behind the head and all the way down.
  smite: [
    [0, READY_R],
    [0.26, { chest: [-0.25, 0.3, 0], spine: [-0.08, 0.1, 0], armR: [-3.0, 0, -0.1], foreR: [-1.6, 0.3, 0], handR: [-0.6, 0, 0], armL: [-0.6, 0, 0.4], foreL: [-0.5, 0, 0], head: [-0.1, -0.1, 0] }],
    [0.38, { chest: [0.35, -0.2, 0], spine: [0.15, -0.05, 0], armR: [-1.3, 0, 0.45], foreR: [-0.1, 0.2, 0], handR: [1.0, 0, 0], armL: [0.3, 0, 0.2], foreL: [-0.3, 0, 0], head: [0.15, 0.05, 0] }],
    [0.55, { chest: [0.45, -0.3, 0], spine: [0.22, -0.08, 0], armR: [-0.75, 0, 0.55], foreR: [-0.1, 0.15, 0], handR: [1.15, 0, 0], armL: [0.3, 0, 0.2], foreL: [-0.3, 0, 0], head: [0.2, 0.05, 0] }],
    [0.92, READY_R],
    [1, READY_R],
  ],
  // A straight right: the hip and shoulder turning through it.
  punch: [
    [0, { armR: [-0.35, 0, 0.2], foreR: [-1.9, 0.4, 0], armL: [-0.45, 0, -0.2], foreL: [-1.9, -0.4, 0] }],
    [0.22, { chest: [0, 0.4, 0], armR: [-0.15, 0, 0.1], foreR: [-2.0, 0.4, 0], armL: [-0.5, 0, -0.2], foreL: [-1.9, -0.4, 0] }],
    [0.34, { chest: [0.05, -0.55, 0], spine: [0, -0.15, 0], armR: [-1.45, 0, 0.4], foreR: [-0.08, 0.6, 0], armL: [-0.3, 0, -0.1], foreL: [-1.9, -0.4, 0] }],
    [0.48, { chest: [0.05, -0.55, 0], spine: [0, -0.15, 0], armR: [-1.45, 0, 0.4], foreR: [-0.08, 0.6, 0], armL: [-0.3, 0, -0.1], foreL: [-1.9, -0.4, 0] }],
    [0.9, { armR: [-0.35, 0, 0.2], foreR: [-1.9, 0.4, 0], armL: [-0.45, 0, -0.2], foreL: [-1.9, -0.4, 0] }],
    [1, { armR: [-0.35, 0, 0.2], foreR: [-1.9, 0.4, 0], armL: [-0.45, 0, -0.2], foreL: [-1.9, -0.4, 0] }],
  ],
  // Both hands drawn in to the chest, then pushed out.
  shove: [
    [0, {}],
    [0.24, { chest: [-0.08, 0, 0], armR: [-0.35, 0, 0.1], foreR: [-1.8, 0.5, 0], handR: [0, 0, -0.9], armL: [-0.35, 0, -0.1], foreL: [-1.8, -0.5, 0], handL: [0, 0, 0.9] }],
    [0.36, { chest: [0.15, 0, 0], spine: [0.08, 0, 0], armR: [-1.4, 0, 0.35], foreR: [-0.15, 0.3, 0], handR: [-0.4, 0, -1.0], armL: [-1.4, 0, -0.35], foreL: [-0.15, -0.3, 0], handL: [-0.4, 0, 1.0] }],
    [0.52, { chest: [0.15, 0, 0], spine: [0.08, 0, 0], armR: [-1.4, 0, 0.35], foreR: [-0.15, 0.3, 0], handR: [-0.4, 0, -1.0], armL: [-1.4, 0, -0.35], foreL: [-0.15, -0.3, 0], handL: [-0.4, 0, 1.0] }],
    [0.92, {}],
    [1, {}],
  ],
};

function attack(k, t, style) {
  const heavy = style.heavy ?? 0;
  // Heavier is slower into the swing (the same shape, later).
  const tt = heavy ? Math.min(1, t / (1 + heavy * 0.25)) : t;
  const kind = SWINGS[style.attack] ? style.attack : 'slash';
  // A step into it with the left foot, the weight going onto it as the blow lands, then back.
  const s = win(tt, 0.2, 0.36) * (1 - win(tt, 0.6, 0.92));
  k.move('root', 0, 0, 0.1 * s);
  k.move('hips', 0, -drop(0.4 * s, 0.55 * s), 0);
  k.turn('hips', 0, -0.12 * s, 0);
  k.turn('thighL', -0.4 * s, 0, 0); k.turn('shinL', 0.5 * s, 0, 0); k.turn('footL', -0.1 * s, 0, 0);
  k.turn('thighR', 0.3 * s, 0, 0); k.turn('shinR', 0.2 * s, 0, 0); k.turn('footR', 0.15 * s, 0, 0); k.turn('toesR', -0.35 * s, 0, 0);
  keyed(k, tt, SWINGS[kind]);
}

function talking(k, T, { talk = 1, think = 0, listen = 0, beat = 0 } = {}, armed) {
  const free = armed === 'R' ? ['L'] : ['L', 'R'];
  for (const S of free) {
    const m = S === 'L' ? 1 : -1, ph = T * (S === 'L' ? 1.7 : 1.3) + (S === 'L' ? 0 : 2);
    const g = (Math.sin(ph) * 0.5 + 0.5) * talk;
    k.turn(`arm${S}`, -0.35 * g - 0.15 * beat, 0, m * 0.08 * g);
    k.turn(`fore${S}`, -0.9 * g - 0.2 * beat, -m * 0.4 * g, 0);
    k.turn(`hand${S}`, 0, 0, m * 0.5 * g);
  }
  k.turn('head', Math.sin(T * 3.1) * 0.03 * talk + 0.1 * beat - 0.1 * think, Math.sin(T * 0.9) * 0.08 * talk, 0.1 * think);
  if (listen) k.turn('head', 0.06 * listen, 0, 0.06 * listen);
}

export function moveHuman(k, state = {}, style = {}) {
  const { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 } = state;
  const T = time + seed;
  const heavy = style.heavy ?? 0;
  const armed = style.armed ?? null;
  breathe(k, T, heavy);
  hangArms(k);
  switch (clip) {
    case 'talk':
      idle(k, T, armed);
      talking(k, T, state, armed);
      break;
    case 'walk': walk(k, T, speed, heavy, armed); break;
    case 'run': run(k, T, speed, heavy, armed); break;
    case 'jump': case 'leap': jump(k, t, clip === 'leap', armed); break;
    case 'attack': attack(k, t, style); break;
    case 'cast': {
      const up = win(t, 0, 0.3), go = win(t, 0.3, 0.42), back = win(t, 0.65, 1), lift = up * (1 - back);
      k.turn('chest', -0.12 * lift + 0.08 * go * (1 - back), 0, 0);
      k.turn('head', -0.15 * lift, 0, 0);
      k.turn('armR', -1.9 * lift, 0, -0.25 * lift);
      k.turn('foreR', -0.3 * lift, 0, 0);
      k.turn('armL', -1.2 * lift - 0.5 * go * (1 - back), 0, 0.5 * lift);
      k.turn('foreL', -0.5 * lift, 0, 0);
      k.move('hips', 0, 0.02 * lift, 0);
      break;
    }
    case 'hit': {
      // Struck: snapped back from the waist, a step back to catch it, the free arm up to guard; then square again.
      const keys = [
        [0, {}],
        [0.08, { spine: [-0.3, 0.12, 0.08], chest: [-0.15, 0.1, 0], neck: [-0.15, 0, 0], head: [-0.3, 0.25, 0.1], armL: [-0.9, 0, 0.15], foreL: [-1.7, -0.3, 0], thighR: [0.25, 0, 0], shinR: [0.3, 0, 0], thighL: [-0.12, 0, 0], shinL: [0.25, 0, 0], ...(armed ? {} : { armR: [-0.7, 0, -0.1], foreR: [-1.6, 0.3, 0] }) }],
        [0.3, { spine: [-0.12, 0.05, 0.03], chest: [-0.05, 0.05, 0], head: [-0.1, 0.1, 0.05], armL: [-0.45, 0, 0.1], foreL: [-1.0, -0.2, 0], thighR: [0.12, 0, 0], shinR: [0.2, 0, 0], shinL: [0.12, 0, 0], ...(armed ? {} : { armR: [-0.3, 0, 0], foreR: [-0.8, 0.2, 0] }) }],
        [0.7, {}],
        [1, {}],
      ];
      keyed(k, t, keys);
      const back = win(t, 0, 0.08) * (1 - win(t, 0.3, 0.7));
      k.move('root', 0, 0, -0.08 * back);
      k.move('hips', 0, -0.025 * back, 0);
      if (armed) ready(k, armed, 1 - 0.3 * back);
      break;
    }
    case 'ko': {
      // The knees go, down onto them; then over backward onto his back, one knee up.
      const keys = [
        [0, {}],
        [0.3, { thighL: [-0.25, 0, 0.05], shinL: [1.6, 0, 0], footL: [0.5, 0, 0], thighR: [-0.1, 0, -0.05], shinR: [1.75, 0, 0], footR: [0.5, 0, 0], spine: [0.35, 0, 0.05], chest: [0.15, 0, 0], head: [0.45, 0.1, 0], armL: [-0.15, 0, 0.05], armR: [-0.15, 0, -0.05], foreL: [-0.3, 0, 0], foreR: [-0.3, 0, 0] }],
        [0.75, { hips: [-1.52, 0, 0], thighL: [-0.08, 0, 0.08], shinL: [0.12, 0, 0], footL: [0.35, 0, 0], thighR: [-0.75, 0, -0.06], shinR: [1.3, 0, 0], footR: [-0.2, 0, 0], spine: [0.05, 0, 0], head: [-0.15, 0.6, 0], armL: [0.2, 0, 1.05], foreL: [-0.05, 0, 0], armR: [0.2, 0, -0.95], foreR: [-0.1, 0, 0] }],
        [1, { hips: [-1.52, 0, 0], thighL: [-0.08, 0, 0.08], shinL: [0.12, 0, 0], footL: [0.35, 0, 0], thighR: [-0.75, 0, -0.06], shinR: [1.3, 0, 0], footR: [-0.2, 0, 0], spine: [0.05, 0, 0], head: [-0.15, 0.6, 0], armL: [0.2, 0, 1.05], foreL: [-0.05, 0, 0], armR: [0.2, 0, -0.95], foreR: [-0.1, 0, 0] }],
      ];
      keyed(k, t, keys);
      // Kneeling: the hips down as far as the shins are long; lying: the back of the pelvis on the ground.
      const kneel = win(t, 0, 0.3), fall = win(t, 0.3, 0.75);
      const kneelDrop = THIGH + 0.02;
      k.move('hips', 0, -kneelDrop * kneel * (1 - fall) - (JOINTS.hips[1] - 0.11) * fall, -0.06 * kneel * (1 - fall) - 0.35 * fall);
      break;
    }
    case 'sit': {
      // Onto a seat as high as the knee: the thighs level, the shins straight down, the hands on the thighs.
      const s = win(t, 0, 0.45);
      k.move('hips', 0, -drop(1.52 * s, 1.52 * s) * 0.92, -0.06 * s);
      k.turn('thighL', -1.52 * s, 0, 0.06 * s); k.turn('shinL', 1.52 * s, 0, 0);
      k.turn('thighR', -1.52 * s, 0, -0.06 * s); k.turn('shinR', 1.52 * s, 0, 0);
      k.turn('spine', -0.05 * s, 0, 0);
      k.turn('armL', -0.5 * s, 0, 0); k.turn('foreL', -0.6 * s, 0, 0);
      k.turn('armR', -0.5 * s, 0, 0); k.turn('foreR', -0.6 * s, 0, 0);
      k.turn('head', Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.37) * 0.2, 0);
      break;
    }
    case 'win': {
      const up = win(t, 0, 0.3);
      const hop = Math.max(0, Math.sin(Math.min(1, t / 0.5) * Math.PI)) * 0.08;
      k.move('root', 0, hop, 0);
      k.turn('armR', -2.7 * up, 0, -0.25 * up);
      k.turn('foreR', -0.2 * up, 0, 0);
      k.turn('armL', 0, 0, 0.5 * up);
      k.turn('foreL', -0.9 * up, 0, 0);
      k.turn('chest', -0.1 * up, 0, 0);
      k.turn('head', -0.2 * up, 0, 0);
      break;
    }
    case 'idle':
    default: idle(k, T, armed);
  }
  style.after?.(k, state, T);
  return LEG;
}
