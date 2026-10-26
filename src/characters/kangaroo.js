import { bands, coat } from '../models/skins.js';

/**
 * The Kangaroo: a big red, up on its haunches on the tail, the thighs like
 * hams, the feet as long as its arms, ears up, in green-and-gold boxing
 * shorts and a pair of red boxing gloves somebody has laced on it. Boxes.
 * Seriously. Bounces on the spot with its guard up, jabs, and when that
 * does not do it, leans back on the tail and kicks with both feet. About
 * 0.95 tiles tall.
 */

const FUR = coat({ over: '#b0603a', under: '#e8cfa8', vary: 0.12, freq: 14, edge: [-0.2, 0.3] });
const PALE = coat({ over: '#ecdcc0', under: '#d8c4a0', vary: 0.08, freq: 18 });
const SHORTS = bands(1, 0.05, '#1a8a3a', '#f0c020', 0.18, 0.1);
const GLOVE = { color: '#c81c24', mat: 'leather', k: 0.004 };

export default {
  name: 'kangaroo',
  scale: 1.5,
  cell: 0.0075,
  cells: { kit: 0.0042, eyes: 0.0024, fine: 0.0025, highlights: 0.0006, ears: 0.0024, nose: 0.0016 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', [0, 0.24, -0.02]],
    ['chest', 'hips', [0, 0.38, 0.0]],
    ['neck', 'chest', [0, 0.5, 0.04]],
    ['head', 'neck', [0, 0.56, 0.06]],
    ['tail', 'hips', [0, 0.19, -0.1]],
    ['tail2', 'tail', [0, 0.08, -0.27]],
    ...[1, -1].flatMap((m) => {
      const S = m > 0 ? 'L' : 'R';
      return [
        [`arm${S}`, 'chest', [m * 0.055, 0.45, 0.06]],
        [`fore${S}`, `arm${S}`, [m * 0.065, 0.39, 0.1]],
        [`hand${S}`, `fore${S}`, [m * 0.065, 0.35, 0.15]],
        [`thigh${S}`, 'hips', [m * 0.06, 0.24, -0.01]],
        [`shin${S}`, `thigh${S}`, [m * 0.07, 0.13, 0.08]],
        [`foot${S}`, `shin${S}`, [m * 0.07, 0.03, -0.05]],
      ];
    }),
  ],
  materials: {
    fur: { roughness: 0.9, sheen: 0.5, sheenColor: '#e8b080' },
    nose: { roughness: 0.3, clearcoat: 0.6 },
    eye: { roughness: 0.1, clearcoat: 1 },
    cloth: { roughness: 0.6, sheen: 0.4, sheenColor: '#ffffff' },
    leather: { roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 },
  },
  sculpt(s) {
    const F = { color: FUR, mat: 'fur' };
    // The pear of a body: the hips and the belly big, the chest narrow, the pale front.
    s.ellipsoid([0, 0.24, 0.0], [0.08, 0.1, 0.08], { ...F, bone: 'hips', k: 0.04 });
    s.ellipsoid([0, 0.39, 0.03], [0.055, 0.085, 0.055], { ...F, bone: 'chest', k: 0.04 });
    s.ellipsoid([0, 0.3, 0.05], [0.055, 0.12, 0.04], { color: PALE, mat: 'fur', bone: 'hips', k: 0.04 });
    // The neck and head: a long face, a dark nose, the ears up.
    s.limb([0, 0.46, 0.04], [0, 0.56, 0.06], 0.035, 0.03, { ...F, bone: 'neck', k: 0.03 });
    s.ellipsoid([0, 0.585, 0.065], [0.036, 0.038, 0.042], { ...F, bone: 'head', k: 0.02 });
    s.limb([0, 0.578, 0.09], [0, 0.565, 0.145], 0.026, 0.018, { ...F, bone: 'head', k: 0.015 });
    s.part('nose', () => {
      s.sphere([0, 0.572, 0.158], 0.012, { color: '#1a1210', mat: 'nose', bone: 'head', k: 0 });
      for (const m of [1, -1]) s.ellipsoid([m * 0.005, 0.57, 0.168], [0.0026, 0.002, 0.004], { op: 'sub', k: 0.0016 });
    });
    s.part('ears', () => {
      for (const m of [1, -1]) s.flake([m * 0.018, 0.61, 0.05], [m * 0.036, 0.675, 0.035], [0, 0, 1], 0.017, 0.008, 0.35, { ...F, bone: 'head', k: 0.008 });
    });
    // The tail, thick at the root and resting on the ground: the third leg.
    s.limb([0, 0.2, -0.07], [0, 0.085, -0.27], 0.05, 0.032, { ...F, bone: 'tail', k: 0.03 });
    s.limb([0, 0.085, -0.27], [0, 0.025, -0.42], 0.032, 0.012, { ...F, bone: 'tail2', k: 0.02 });
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R';
      // The haunch, the shin forward to the knee, the heel back, and the long foot along the ground.
      s.ellipsoid([m * 0.065, 0.19, 0.02], [0.045, 0.075, 0.07], { ...F, bone: `thigh${S}`, k: 0.035, rot: [0.5, 0, 0] });
      s.limb([m * 0.07, 0.13, 0.08], [m * 0.07, 0.03, -0.05], 0.03, 0.018, { ...F, bone: `shin${S}`, k: 0.02 });
      s.limb([m * 0.07, 0.02, -0.05], [m * 0.072, 0.014, 0.12], 0.018, 0.013, { ...F, bone: `foot${S}`, k: 0.012 });
      // The short arms.
      s.limb([m * 0.055, 0.45, 0.06], [m * 0.065, 0.39, 0.1], 0.02, 0.016, { ...F, bone: `arm${S}`, k: 0.015 });
      s.limb([m * 0.065, 0.39, 0.1], [m * 0.065, 0.355, 0.145], 0.016, 0.014, { ...F, bone: `fore${S}`, k: 0.01 });
    }
    s.part('kit', () => {
      // Boxing shorts, green and gold, a gold waistband.
      s.ellipsoid([0, 0.235, -0.005], [0.092, 0.078, 0.092], { color: SHORTS, mat: 'cloth', bone: 'hips', k: 0.01 });
      s.torus([0, 0.29, 0.0], 0.074, 0.01, { color: '#f0c020', mat: 'cloth', bone: 'hips', k: 0.004 });
      for (const m of [1, -1]) s.limb([m * 0.065, 0.215, 0.0], [m * 0.068, 0.165, 0.035], 0.054, 0.05, { color: SHORTS, mat: 'cloth', bone: `thigh${m > 0 ? 'L' : 'R'}`, k: 0.01 });
      s.box([0, 0.12, 0.0], [0.2, 0.05, 0.2], 0.01, { op: 'sub', k: 0.004 });
      // The gloves: big and red, a white cuff, laced.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.ellipsoid([m * 0.066, 0.35, 0.175], [0.032, 0.034, 0.04], { ...GLOVE, bone: `hand${S}` });
        s.sphere([m * 0.045, 0.358, 0.17], 0.014, { ...GLOVE, bone: `hand${S}` });
        s.cylinder([m * 0.066, 0.354, 0.142], 0.024, 0.01, { color: '#f4f2ec', mat: 'cloth', bone: `hand${S}`, k: 0.003, round: 0.004, rot: [Math.PI / 2 - 0.6, 0, 0] });
      }
    });
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.026, 0.598, 0.093], 0.008, { color: '#120c0a', mat: 'eye', bone: 'head', k: 0 });
    });
    // A catch-light in each.
    for (const m of [1, -1]) s.part('highlights', () => s.sphere([m * 0.029, 0.602, 0.1], 0.0018, { color: '#ffffff', mat: 'eye', bone: 'head', k: 0 }));
  },
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const guard = (bob) => {
      // Guard up: both gloves at the chin, bouncing.
      for (const [S, m] of [['L', 1], ['R', -1]]) {
        k.turn(`arm${S}`, -0.5 + bob * 0.1, 0, m * -0.1);
        k.turn(`fore${S}`, -0.6, 0, 0);
      }
    };
    if (clip === 'ko') {
      // Over backwards onto the tail and down, the feet up, the gloves out.
      const f = Math.min(1, t / 0.6);
      k.turn('root', -1.35 * f, 0, 0);
      k.move('root', 0, 0.07 * f, 0.02 * f);
      k.turn('tail', 1.0 * f, 0, 0);
      k.turn('armL', -0.4 * f, 0, -0.8 * f);
      k.turn('armR', -0.4 * f, 0, 0.8 * f);
      k.turn('head', 0.4 * f, 0.5 * f, 0);
      return;
    }
    if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.turn('chest', -0.3 * h, 0.2 * h, 0);
      k.turn('head', -0.4 * h, 0, 0);
      guard(0);
      return;
    }
    if (clip === 'attack') {
      const a = Math.min(1, t / 0.9);
      if (a < 0.45) {
        // A left, a right.
        const jab = (a / 0.45) * 2, side = jab < 1 ? 'L' : 'R', p = Math.sin((jab % 1) * Math.PI);
        guard(0);
        k.turn(`arm${side}`, -0.9 * p, 0, 0);
        k.turn(`fore${side}`, 0.6 * p, 0, 0);
        k.turn('chest', 0, (side === 'L' ? -0.3 : 0.3) * p, 0);
        k.move('root', 0, Math.abs(Math.sin(T * 10)) * 0.01, 0);
      } else {
        // Back on the tail, and both feet.
        const p = Math.sin(((a - 0.45) / 0.55) * Math.PI);
        k.turn('hips', -0.55 * p, 0, 0);
        k.move('hips', 0, 0.05 * p, -0.04 * p);
        k.turn('chest', 0.3 * p, 0, 0);
        k.turn('tail', 0.55 * p, 0, 0);
        for (const S of ['L', 'R']) {
          k.turn(`thigh${S}`, -1.2 * p, 0, 0);
          k.turn(`shin${S}`, -0.4 * p, 0, 0);
          k.turn(`foot${S}`, 0.6 * p, 0, 0);
        }
        guard(0);
      }
      return;
    }
    if (clip === 'walk') {
      // Hopping: both feet together, up and forward, the tail swinging to balance.
      const ph = T * 7 * Math.max(0.6, speed), up = Math.max(0, Math.sin(ph));
      k.move('root', 0, up * 0.06, 0);
      k.turn('hips', 0.35, 0, 0);
      k.turn('chest', 0.1, 0, 0);
      k.turn('neck', -0.3, 0, 0);
      for (const S of ['L', 'R']) {
        k.turn(`thigh${S}`, -0.2 + Math.cos(ph) * 0.45, 0, 0);
        k.turn(`foot${S}`, Math.cos(ph) * -0.35, 0, 0);
        k.turn(`arm${S}`, -0.3, 0, 0);
      }
      k.turn('tail', -0.25 + Math.cos(ph) * 0.3, 0, 0);
      return;
    }
    // Bouncing on the spot, guard up, head bobbing, the ears going round.
    const bob = Math.sin(T * 6);
    k.move('root', 0, Math.max(0, bob) * 0.012, 0);
    guard(bob);
    k.turn('head', Math.sin(T * 1.1) * 0.08, Math.sin(T * 0.6) * 0.25, 0);
    k.turn('tail', Math.sin(T * 6 + 1) * 0.04, 0, 0);
  },
};
