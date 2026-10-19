import { rgb } from '../models/sdf.js';

/**
 * What the scene wears, shared the way the hats of wardrobe.js are: hair
 * down to the shoulders, a denim battle vest with its patches, a bullet
 * belt, spiked cuffs, corpse paint, a band T-shirt's print, a guitar. Each
 * adds its shapes to the sculpt `s` (the 'kit' part unless it says); the
 * body is about 0.8 tiles tall and faces +z, with its head about (0, 0.67,
 * 0.006) and its chest about (0, 0.46, 0).
 */

const HEAD = { bone: 'head' };

/** A tiny repeatable random, so a vest has the same patches every bake. */
function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280);
}

/**
 * The `hair` option for `person()`: long, straight, down the back and in
 * front of the ears. `length` 1 is to the shoulder blades, 0.5 to the neck;
 * `fringe` brings a lock down over the forehead.
 */
export function longHair(color, { length = 1, fringe = false, thick = 1 } = {}) {
  const end = 0.7 - length * 0.3;
  const locks = [
    [[0, 0.77, -0.05], [0, end, -0.135], 0.05 * thick, 0.5],
    [[0.05, 0.76, -0.05], [0.08, end + 0.02, -0.125], 0.04 * thick, 0.5],
    [[-0.05, 0.76, -0.05], [-0.08, end + 0.02, -0.125], 0.04 * thick, 0.5],
    [[0.085, 0.73, 0.0], [0.105, end + 0.1, -0.05], 0.034 * thick, 0.5],
    [[-0.085, 0.73, 0.0], [-0.105, end + 0.1, -0.05], 0.034 * thick, 0.5],
  ];
  if (fringe) locks.push([[0.03, 0.77, 0.06], [0.05, 0.71, 0.1], 0.036, 0.5], [[-0.03, 0.77, 0.06], [-0.05, 0.71, 0.1], 0.036, 0.5]);
  return { color, locks, cap: [0.108, 0.1, 0.108] };
}

/** Hair teased up and out: a cloud of it round the head, as wide as `size` times the head. */
export function bigHair(s, color, { size = 1.5, drop = 0.1 } = {}) {
  s.part('hair', () => {
    // Lumpy all over, so it reads as teased curls and not as a helmet.
    const H = { color, mat: 'hair', bone: 'head', k: 0.05, bump: [0.007, 48] };
    s.ellipsoid([0, 0.75, -0.02], [0.12 * size, 0.1 * size, 0.12 * size], H);
    for (const m of [1, -1]) {
      s.ellipsoid([m * 0.1 * size, 0.72, -0.03], [0.07 * size, 0.09 * size, 0.08 * size], H);
      s.ellipsoid([m * 0.08, 0.7 - drop, -0.09], [0.06, 0.1 + drop, 0.05], H);
    }
    s.ellipsoid([0, 0.74, -0.1 * size], [0.1 * size, 0.1 * size, 0.07 * size], H);
    // Off the face and out of the eyes.
    s.box([0, 0.64, 0.14], [0.13, 0.08, 0.06], 0.03, { op: 'sub', k: 0.025 });
  });
}

/** A headband round the forehead, the ends tied behind. */
export function headband(s, { color = '#e8202a' } = {}) {
  s.part('kit', () => {
    s.torus([0, 0.715, 0.0], 0.1, 0.012, { ...HEAD, color, mat: 'cloth', k: 0.004, rot: [0.15, 0, 0] });
    for (const m of [1, -1]) s.flake([m * 0.01, 0.715, -0.1], [m * 0.07, 0.66, -0.15], [0, 0, 1], 0.012, 0.018, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
}

/** A knitted beanie pulled down to the brows. */
export function beanie(s, { color = '#16161a', fold = null } = {}) {
  s.part('kit', () => {
    s.ellipsoid([0, 0.735, -0.008], [0.107, 0.075, 0.108], { ...HEAD, color, mat: 'cloth', k: 0.012 });
    s.box([0, 0.62, 0.1], [0.13, 0.07, 0.04], 0.02, { op: 'sub', k: 0.01 });
    if (fold) s.torus([0, 0.7, -0.005], 0.104, 0.016, { ...HEAD, color: fold, mat: 'cloth', k: 0.004, rot: [0.1, 0, 0] });
  });
}

/** A flat-peaked baseball cap, turned round to the back if `back`. */
export function baseballCap(s, { color = '#1a1a1e', back = false } = {}) {
  s.part('kit', () => {
    s.ellipsoid([0, 0.745, -0.005], [0.108, 0.052, 0.108], { ...HEAD, color, mat: 'cloth', k: 0.01 });
    const z0 = back ? -0.08 : 0.08, z1 = back ? -0.16 : 0.16;
    s.flake([0, 0.74, z0], [0, 0.73, z1], [0, 1, 0], 0.07, 0.056, 0.12, { ...HEAD, color, mat: 'cloth', k: 0.005 });
  });
}

/** A horned helmet: a steel cap, a nose guard and a long horn out of each side. */
export function hornHelmet(s, { horn = '#f0e8d0' } = {}) {
  s.part('kit', () => {
    const steel = { ...HEAD, color: '#9aa0aa', mat: 'metal' };
    s.ellipsoid([0, 0.74, -0.005], [0.108, 0.07, 0.108], { ...steel, k: 0.01 });
    s.torus([0, 0.7, -0.005], 0.104, 0.008, { ...steel, k: 0.003, rot: [0.08, 0, 0] });
    s.limb([0, 0.72, 0.1], [0, 0.65, 0.115], 0.008, 0.012, { ...steel, k: 0.004 });
    for (const m of [1, -1]) {
      s.limb([m * 0.1, 0.72, 0], [m * 0.19, 0.75, 0.01], 0.022, 0.014, { ...HEAD, color: horn, mat: 'bone', k: 0.006 });
      s.limb([m * 0.19, 0.75, 0.01], [m * 0.25, 0.86, 0.03], 0.014, 0.004, { ...HEAD, color: horn, mat: 'bone', k: 0.004 });
    }
  });
}

/**
 * The battle vest: sleeveless denim over everything, studded at the
 * shoulders, the back covered in patches. `patches` of them, in colours
 * that were each somebody's favourite, a big one in the middle.
 */
export function battleVest(s, { color = '#34445e', patches = 10, seed = 1, studs = true, big = '#e8e4d8' } = {}) {
  const rnd = seeded(seed);
  const colours = ['#d81c2a', '#f0c040', '#e8e4d8', '#2a2a30', '#3ae88a', '#8a4be8', '#ff7a1a', '#2ad0ff'];
  s.part('kit', () => {
    const V = { color, mat: 'denim', bone: 'chest', k: 0.006 };
    // The back, and the two panels of the front with the shirt showing between them.
    s.box([0, 0.455, -0.068], [0.1, 0.075, 0.012], 0.006, V);
    for (const m of [1, -1]) s.box([m * 0.07, 0.455, 0.07], [0.034, 0.075, 0.012], 0.006, V);
    // Sleeves cut off: a lump of denim over each shoulder.
    for (const m of [1, -1]) s.ellipsoid([m * 0.098, 0.5, -0.002], [0.034, 0.03, 0.05], V);
    for (let i = 0; i < patches; i++) {
      const x = (rnd() - 0.5) * 0.15, y = 0.41 + rnd() * 0.12;
      const w = 0.016 + rnd() * 0.02, h = 0.014 + rnd() * 0.02;
      s.paint((p) => Math.max(Math.abs(p[0] - x) - w, Math.abs(p[1] - y) - h, 0.058 + p[2]), colours[Math.floor(rnd() * colours.length)], 0.002);
    }
    // The big one, centred: a banner across the back with a dark stripe through it.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.06, Math.abs(p[1] - 0.46) - 0.034, 0.058 + p[2]), big, 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.05, Math.abs(p[1] - 0.46) - 0.01, 0.058 + p[2]), '#101014', 0.002);
    if (studs) {
      for (const m of [1, -1]) for (let i = 0; i < 4; i++) s.cone([m * (0.086 + i * 0.011), 0.536 - i * 0.004, 0.0], 0.005, 0.012, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0 });
    }
  });
}

/** A bullet belt across the chest, from one shoulder to the opposite hip. */
export function bulletBelt(s, { brass = '#d8b050' } = {}) {
  s.part('kit', () => {
    s.limb([-0.088, 0.53, 0.07], [0.088, 0.39, 0.078], 0.011, 0.011, { color: '#2a1a10', mat: 'leather', bone: 'chest', k: 0.003 });
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const c = [-0.085 + t * 0.17, 0.527 - t * 0.135, 0.08 + t * 0.008];
      s.limb([c[0], c[1] - 0.012, c[2]], [c[0], c[1] + 0.012, c[2]], 0.0085, 0.0065, { color: brass, mat: 'metal', bone: 'chest', k: 0.0015 });
    }
  });
}

/** Spiked wristbands on both forearms. */
export function spikedCuffs(s, J, { spikes = 5 } = {}) {
  s.part('kit', () => {
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R';
      const e = J[`elbow${S}`], w = J[`wrist${S}`];
      const at = (t) => [e[0] + (w[0] - e[0]) * t, e[1] + (w[1] - e[1]) * t, e[2] + (w[2] - e[2]) * t];
      const mid = at(0.72);
      s.cylinder(mid, 0.03, 0.022, { color: '#1a1a1e', mat: 'leather', bone: `fore${S}`, k: 0.003, round: 0.004 });
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const dir = [Math.cos(a), 0, Math.sin(a)];
        s.limb([mid[0] + dir[0] * 0.028, mid[1], mid[2] + dir[2] * 0.028], [mid[0] + dir[0] * 0.052, mid[1] + 0.002, mid[2] + dir[2] * 0.052], 0.006, 0.0015, { color: '#d6d9e0', mat: 'metal', bone: `fore${S}`, k: 0.001 });
      }
    }
  });
}

/** A spiked collar round the neck. */
export function spikedCollar(s, { spikes = 8 } = {}) {
  s.part('kit', () => {
    s.torus([0, 0.558, 0.004], 0.037, 0.011, { color: '#1a1a1e', mat: 'leather', bone: 'neck', k: 0.003 });
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + 0.2;
      s.limb([Math.sin(a) * 0.04, 0.558, Math.cos(a) * 0.04 + 0.004], [Math.sin(a) * 0.062, 0.558, Math.cos(a) * 0.062 + 0.004], 0.006, 0.0015, { color: '#d6d9e0', mat: 'metal', bone: 'neck', k: 0.001 });
    }
  });
}

/**
 * Corpse paint: the face white with black rings round the eyes, a black
 * mouth drawn wide and pulled down, a black nose, black cheeks and brow
 * hollowed, all painted on the skin. `white` and `black` can be changed.
 */
export function corpsePaint(s, { white = '#e8e8e4', black = '#0a0a0c' } = {}) {
  const face = (p) => Math.max(Math.hypot(p[0] * 1.02, (p[1] - 0.655) * 0.95, p[2] - 0.0) - 0.112, 0.012 - p[2]);
  const eye = (p, m) => Math.hypot(p[0] - m * 0.041, (p[1] - 0.668) * 1.05, (p[2] - 0.095) * 0.8);
  s.paint((p) => Math.max(face(p), -Math.min(eye(p, 1), eye(p, -1)) + 0.027), white, 0.006);
  for (const m of [1, -1]) {
    // A thick black ring round each eye, and the cheek under it hollowed.
    s.paint((p) => Math.max(Math.abs(eye(p, m) - 0.036) - 0.014, 0.03 - p[2]), black, 0.004);
    s.paint((p) => Math.max(Math.hypot(p[0] - m * 0.055, (p[1] - 0.62) * 1.8, p[2] - 0.07) - 0.026, 0.03 - p[2]), black, 0.008);
  }
  // The mouth: wide, black, turned right down at the corners.
  s.paint((p) => Math.max(Math.abs(p[1] - (0.606 - p[0] * p[0] * 5)) - 0.007, Math.abs(p[0]) - 0.055, 0.07 - p[2]), black, 0.003);
  s.paint((p) => Math.max(Math.hypot(p[0], (p[1] - 0.655) * 1.2, p[2] - 0.11) - 0.014, 0.05 - p[2]), black, 0.003);
}

/**
 * A print on the chest of a T-shirt (or anything with a front): `design` is
 * 'skull', 'logo' (a ragged blocky band name), 'cross', 'smile', 'x' or
 * 'stripe'; `color` is the ink.
 */
export function chestPrint(s, design, color = '#e8e4d8', { y = 0.45, size = 0.04 } = {}) {
  const front = (p) => 0.05 - p[2];
  if (design === 'skull') {
    s.paint((p) => Math.max(Math.hypot(p[0], (p[1] - y - size * 0.2) * 1.1) - size, front(p)), color, 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.4, Math.abs(p[1] - y + size * 0.9) - size * 0.28, front(p)), color, 0.002);
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.hypot(p[0] - m * size * 0.4, p[1] - y - size * 0.15) - size * 0.26, front(p)), '#101014', 0.002);
  } else if (design === 'logo') {
    // Jagged letters: a row of pointed bars, as a band's name looks from a distance.
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * size * 0.4, h = size * (0.45 + ((i * 7) % 5) * 0.12);
      s.paint((p) => Math.max(Math.abs(p[0] - x) - size * 0.1 + Math.abs(p[1] - y) * 0.06, Math.abs(p[1] - y) - h, front(p)), color, 0.0015);
    }
  } else if (design === 'cross') {
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.14, Math.abs(p[1] - y) - size, front(p)), color, 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.55, Math.abs(p[1] - y - size * 0.25) - size * 0.14, front(p)), color, 0.002);
  } else if (design === 'smile') {
    s.paint((p) => Math.max(Math.hypot(p[0], p[1] - y) - size, front(p)), color, 0.002);
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.hypot(p[0] - m * size * 0.35, p[1] - y - size * 0.3) - size * 0.12, front(p)), '#101014', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[1] - (y - size * 0.25 - p[0] * p[0] * 5)) - size * 0.08, Math.abs(p[0]) - size * 0.55, front(p)), '#101014', 0.0015);
  } else if (design === 'x') {
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.abs((p[0] - (p[1] - y) * m) * 0.7) - size * 0.14, Math.abs(p[1] - y) - size, front(p)), color, 0.002);
  } else if (design === 'stripe') {
    s.paint((p) => Math.max(Math.abs(p[1] - y) - size * 0.3, front(p)), color, 0.002);
  }
}

/**
 * A guitar, slung across the front: a body at the hip, a neck up to the
 * left hand and a headstock. `style` 'strat', 'v' (flying V), 'acoustic' or 'bass'; `body` the colour.
 */
export function guitar(s, { body = '#d81c2a', style = 'strat', neck = '#c8a060' } = {}) {
  s.part('kit', () => {
    const B = { color: body, mat: 'plastic', bone: 'spine', k: 0.006 };
    const N = { color: neck, mat: 'leather', bone: 'spine', k: 0.004 };
    if (style === 'v') {
      for (const m of [1, -1]) s.limb([0, 0.33, 0.1], [m * 0.075, 0.25, 0.1], 0.018, 0.014, B);
      s.ellipsoid([0, 0.34, 0.1], [0.03, 0.03, 0.012], B);
    } else if (style === 'acoustic') {
      s.ellipsoid([0, 0.31, 0.1], [0.06, 0.075, 0.025], { color: '#a8662a', mat: 'plastic', bone: 'spine', k: 0.008 });
      s.ellipsoid([0, 0.355, 0.1], [0.04, 0.045, 0.026], { color: '#a8662a', mat: 'plastic', bone: 'spine', k: 0.008 });
      s.cylinder([0, 0.325, 0.122], 0.02, 0.004, { color: '#101014', mat: 'plastic', bone: 'spine', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    } else {
      s.ellipsoid([0, 0.31, 0.1], [0.06, 0.06, 0.016], B);
      s.ellipsoid([0.035, 0.35, 0.1], [0.032, 0.04, 0.016], B);
      s.ellipsoid([-0.03, 0.27, 0.1], [0.035, 0.03, 0.016], B);
    }
    // The neck, up and across to the left, and the headstock.
    const tip = style === 'bass' ? [0.2, 0.52, 0.13] : [0.17, 0.5, 0.12];
    s.limb([0.02, 0.34, 0.112], tip, 0.012, 0.011, N);
    s.box([tip[0] + 0.012, tip[1] + 0.03, tip[2]], [0.014, 0.03, 0.008], 0.003, { ...N, rot: [0, 0, -0.45] });
    // The strap over the shoulder.
    s.limb([-0.084, 0.52, 0.06], [-0.02, 0.35, 0.098], 0.006, 0.006, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.002 });
    s.limb([-0.084, 0.52, 0.06], [-0.09, 0.52, -0.06], 0.006, 0.006, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.002 });
  });
}

/** A cape from the shoulders to the heels, a high collar and a lining that shows at the edge. */
export function cape(s, { color = '#10101a', lining = '#8a0a1c', collar = true } = {}) {
  s.part('kit', () => {
    for (const m of [-0.075, -0.035, 0, 0.035, 0.075]) {
      s.flake([m, 0.52, -0.06], [m * 2.2, 0.06, -0.15], [0, 0, -1], 0.032, 0.05, 0.14, { color, mat: 'cloth', bone: 'chest', k: 0.012 });
    }
    s.flake([0.1, 0.5, -0.04], [0.19, 0.08, -0.12], [0, 0, -1], 0.02, 0.04, 0.14, { color: lining, mat: 'cloth', bone: 'chest', k: 0.008 });
    s.flake([-0.1, 0.5, -0.04], [-0.19, 0.08, -0.12], [0, 0, -1], 0.02, 0.04, 0.14, { color: lining, mat: 'cloth', bone: 'chest', k: 0.008 });
    if (collar) {
      for (const m of [1, -1]) s.flake([m * 0.04, 0.52, -0.02], [m * 0.09, 0.64, -0.06], [0, 0, 1], 0.03, 0.05, 0.12, { color: lining, mat: 'cloth', bone: 'neck', k: 0.006 });
    }
    // A clasp at the throat.
    s.sphere([0, 0.525, 0.04], 0.009, { color: '#d8b050', mat: 'metal', bone: 'chest', k: 0.002 });
  });
}

/** A hood: a cowl over the top and sides of the head, the face left in the shade of it. */
export function hood(s, { color = '#1a1418', lining = '#0a0608' } = {}) {
  s.part('kit', () => {
    s.ellipsoid([0, 0.715, -0.025], [0.125, 0.105, 0.13], { ...HEAD, color, mat: 'cloth', k: 0.02 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.092, 0.65, -0.015], [0.04, 0.08, 0.09], { ...HEAD, color, mat: 'cloth', k: 0.02 });
    // The deep of it, over the brow, and the point at the back.
    s.ellipsoid([0, 0.7, 0.07], [0.082, 0.052, 0.04], { ...HEAD, color: lining, mat: 'cloth', k: 0.01 });
    s.flake([0, 0.7, -0.09], [0, 0.6, -0.17], [1, 0, 0], 0.07, 0.03, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.01 });
  });
}

/** A long robe from the hips to the ground, flared at the hem, with a band of `trim` round it. */
export function robe(s, { color = '#1a1418', trim = null, flare = 1 } = {}) {
  // A cone from up under the chest (hidden in it) to a flat hem on the floor.
  const hem = 0.15 + 0.03 * flare, top = 0.62, foot = 0.015;
  s.part('kit', () => {
    s.cone([0, top, 0], hem, top - foot, { color, mat: 'cloth', bone: 'hips', k: 0.015 });
    if (trim) s.torus([0, 0.04, 0], hem * (top - 0.04) / (top - foot) + 0.002, 0.01, { color: trim, mat: 'cloth', bone: 'hips', k: 0.004 });
  });
}

/** A top hat: a tall black crown with a band, a narrow brim. */
export function topHat(s, { color = '#0c0c10', band = '#8a1c2a' } = {}) {
  s.part('kit', () => {
    s.cylinder([0, 0.8, -0.005], 0.062, 0.09, { ...HEAD, color, mat: 'cloth', k: 0.006, round: 0.008 });
    s.torus([0, 0.72, -0.005], 0.1, 0.01, { ...HEAD, color, mat: 'cloth', k: 0.004 });
    s.torus([0, 0.74, -0.005], 0.064, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003 });
  });
}

/** Two fangs, dropped from the top lip. */
export function fangs(s) {
  s.part('kit', () => {
    for (const m of [1, -1]) s.limb([m * 0.012, 0.614, 0.1], [m * 0.012, 0.598, 0.103], 0.0035, 0.0008, { ...HEAD, color: '#f8f4ec', mat: 'bone', k: 0.0006 });
  });
}

/** Wraparound shades: a single black bar across the eyes. */
export function shades(s, { color = '#08080a' } = {}) {
  s.part('kit', () => {
    s.box([0, 0.67, 0.103], [0.085, 0.02, 0.01], 0.008, { ...HEAD, color, mat: 'glass', k: 0.003 });
    for (const m of [1, -1]) s.limb([m * 0.082, 0.672, 0.095], [m * 0.1, 0.665, 0.01], 0.004, 0.004, { ...HEAD, color, mat: 'plastic', k: 0.002 });
  });
}

/** Rock-and-roll studs on a belt or collar: `n` of them in a row along a limb from a to b. */
export function studRow(s, a, b, n, bone = 'chest') {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    s.cone([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], 0.005, 0.012, { color: '#d6d9e0', mat: 'metal', bone, k: 0 });
  }
}

export const hex = rgb;
