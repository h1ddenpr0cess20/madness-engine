import { rgb } from '../models/sdf.js';
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

/** The skeleton. `b` widens the shoulders and hips (1 as drawn; the Warrior is broader). */
export function bones(b = 1) {
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

/** Skin: warm, rosier where it faces forward and down a little. */
export function skinTone(hex = '#e9b48f') {
  const base = coat({ over: hex, under: hex, vary: 0.06, freq: 14, grain: 0.03 });
  const rose = rgb('#d9826e');
  return (p, n) => mix(base(p, n), rose, Math.max(0, n[2]) * 0.12);
}

/**
 * The body, painted in its clothes: `look` gives the colours (functions or
 * hex) of `skin`, `torso`, `sleeve` (upper arm), `cuff` (forearm), `hand`,
 * `legs`, `boot`; and `mats` the materials of the same (default 'cloth',
 * 'skin' for skin). `b` is the breadth.
 */
export function body(s, { look, mats = {}, b = 1, k = 0.03 }) {
  const J = joints(b);
  const m = (part) => mats[part] ?? (part === 'skin' || part === 'hand' ? 'skin' : 'cloth');
  const c = (part) => look[part] ?? look.torso;
  // Pelvis, belly, chest, shoulders.
  s.ellipsoid([0, 0.318, 0], [0.083 * b, 0.056, 0.06], { color: c('legs'), mat: m('legs'), bone: 'hips', k });
  s.limb([0, 0.33, 0.002], [0, 0.42, 0.004], 0.068 * b, 0.078 * b, { color: c('torso'), mat: m('torso'), bone: 'spine', k: 0.04 });
  s.ellipsoid([0, 0.455, 0.006], [0.1 * b, 0.074, 0.068], { color: c('torso'), mat: m('torso'), bone: 'chest', k: 0.04 });
  for (const mm of [1, -1]) {
    const S = side(mm);
    s.sphere([mm * 0.098 * b, 0.494, 0], 0.04, { color: c('sleeve'), mat: m('sleeve'), bone: `arm${S}`, k: 0.035 });
    // Arms.
    s.limb(J[`shoulder${S}`], J[`elbow${S}`], 0.034, 0.028, { color: c('sleeve'), mat: m('sleeve'), bone: `arm${S}`, k: 0.012 });
    s.limb(J[`elbow${S}`], J[`wrist${S}`], 0.027, 0.022, { color: c('cuff'), mat: m('cuff'), bone: `fore${S}`, k: 0.012 });
    // A hand, a mitten of a fist with a thumb.
    const h = J[`hand${S}`];
    s.ellipsoid(h, [0.022, 0.03, 0.026], { color: c('hand'), mat: m('hand'), bone: `hand${S}`, k: 0.012 });
    s.limb([h[0] - mm * 0.012, h[1] + 0.008, h[2] + 0.016], [h[0] - mm * 0.016, h[1] - 0.006, h[2] + 0.026], 0.0085, 0.008, { color: c('hand'), mat: m('hand'), bone: `hand${S}`, k: 0.006 });
    // Legs and boots.
    s.limb(J[`hip${S}`], J[`knee${S}`], 0.047 * Math.sqrt(b), 0.035, { color: c('legs'), mat: m('legs'), bone: `thigh${S}`, k: 0.02 });
    s.limb(J[`knee${S}`], J[`ankle${S}`], 0.034, 0.027, { color: c('boot'), mat: m('boot'), bone: `shin${S}`, k: 0.012 });
    const a = J[`ankle${S}`];
    s.ellipsoid([a[0], 0.03, a[2] + 0.028], [0.033, 0.031, 0.058], { color: c('boot'), mat: m('boot'), bone: `foot${S}`, k: 0.02 });
  }
  // Neck.
  s.limb([0, 0.51, 0], [0, 0.585, 0.008], 0.03, 0.029, { color: c('skin'), mat: m('skin'), bone: 'neck', k: 0.02 });
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

/**
 * A head: skull and cheeks, a nose, ears, big eyes (white, a coloured iris,
 * a black pupil and a catch-light), brows. `brow` is the brows' colour;
 * `ears` false hides them (under a hood or a helmet); `mood` 1 sets the
 * brows in a frown and the mouth firm.
 */
export function head(s, { skin, brow = '#3a2a20', ears = true, eyeColor = '#3a5a8a', jaw = 1, mood = 0, blush = 0.25 }) {
  const H = { color: skin, mat: 'skin', bone: 'head' };
  s.ellipsoid([0, 0.67, 0.006], [0.098, 0.104, 0.098], { ...H, k: 0.03 });
  s.ellipsoid([0, 0.63, 0.03], [0.082 * jaw, 0.064, 0.076], { ...H, k: 0.05 });
  // Brow ridge, nose, ears.
  s.ellipsoid([0, 0.702, 0.075], [0.07, 0.018, 0.026], { ...H, k: 0.03 });
  s.limb([0, 0.672, 0.1], [0, 0.645, 0.112], 0.011, 0.016, { ...H, k: 0.016 });
  if (ears) {
    for (const m of [1, -1]) {
      s.ellipsoid([m * 0.095, 0.66, -0.004], [0.017, 0.031, 0.022], { ...H, k: 0.016, rot: [0, m * 0.45, 0] });
      s.ellipsoid([m * 0.103, 0.66, 0.0], [0.006, 0.018, 0.012], { op: 'sub', k: 0.006, rot: [0, m * 0.45, 0] });
    }
  }
  // The mouth: a short dark line, a little lower lip.
  s.paint((p) => Math.max(Math.abs(p[1] - (0.611 + p[0] * p[0] * (mood ? -2.5 : 3))) - 0.003, Math.abs(p[0]) - 0.022, 0.08 - p[2]), '#6a2e28', 0.0025);
  s.ellipsoid([0, 0.603, 0.093], [0.016, 0.006, 0.008], { ...H, k: 0.008 });
  // Rosy cheeks.
  if (blush) s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.058, (p[1] - 0.636) * 1.3, Math.max(0, 0.06 - p[2])) - 0.022, '#e08a7a', 0.02);
  // Eyes, set into the face.
  const eyes = [];
  for (const m of [1, -1]) {
    const d = [m * 0.3, 0.02, 0.95];
    const l = Math.hypot(...d);
    const n = d.map((v) => v / l);
    const c = seat(s, [m * 0.041, 0.668, 0.088], n);
    const at = (t) => c.map((v, i) => v + n[i] * t);
    const rot = [-Math.asin(n[1]), Math.atan2(n[0], n[2]), 0];
    // A socket just the size of the eye, so it sits snug with no dark rim.
    s.ellipsoid(c, [0.0185, 0.0245, 0.0135], { op: 'sub', k: 0.003, rot });
    s.part('eyes', () => s.ellipsoid(c, [0.019, 0.025, 0.014], { color: '#f4efe8', mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('irises', () => s.ellipsoid(at(0.009), [0.012, 0.016, 0.0065], { color: eyeColor, mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('pupils', () => s.ellipsoid(at(0.0135), [0.0062, 0.0085, 0.0032], { color: '#08080c', mat: 'eye', bone: 'head', k: 0, rot }));
    // A catch-light.
    const hl = at(0.016).map((v, i) => v + [m * -0.003, 0.006, 0][i]);
    s.part('highlights', () => s.sphere(hl, 0.0032, { color: '#ffffff', mat: 'eye', bone: 'head', k: 0 }));
    eyes.push(c);
    // Brows: a firm stroke of hair over each eye.
    s.part('brows', () => s.flake([m * 0.066, 0.702 - mood * 0.005, 0.088], [m * 0.019, 0.706 + mood * 0.008, 0.106], [0, 1, 0.45], 0.0085, 0.0065, 0.6, { color: brow, mat: 'hair', bone: 'head', k: 0.003 }));
  }
  return eyes;
}

/**
 * Hair, in a part of its own so it sits crisp on the skin: a cap over the
 * skull, then locks ([from, to, radius, flat]) swept from the crown down
 * and back. `color` a function or hex.
 */
export function hair(s, { color, locks = [], cap = [0.108, 0.1, 0.108], at = [0, 0.695, -0.006], k = 0.02, front = 0.07 }) {
  const Hh = { color, mat: 'hair', bone: 'head' };
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
