import { coat } from '../models/skins.js';

/**
 * The Scarab: the sacred beetle of the tombs, the size of a dog, its shell
 * lapis blue edged in gold like the ones in the museum cases, a head like a
 * rake, clubbed feelers, six spiny legs, and in front of it the ball it has
 * been rolling since the Old Kingdom. It rolls things. It has noticed that
 * Rock is a thing that rolls. About 0.25 tiles tall, the ball included.
 */

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const BLUE = coat({ over: '#1a3a9a', under: '#0e1e5a', vary: 0.14, freq: 18, grain: 0.06 });
const GOLD = [0.85, 0.6, 0.18];
/** Lapis, going to gold round the rim of the shell. */
const SHELL = (p, n) => {
  const b = BLUE(p, n), t = smooth(0.045, 0.03, p[1]);
  return b.map((v, i) => v + (GOLD[i] - v) * t);
};
const DUNG = coat({ over: '#6a4a2a', under: '#3a2814', vary: 0.25, freq: 40, grain: 0.15 });
const LEG = { color: '#1a1410', mat: 'shell' };
const LEGS = [[1, 0.07], [2, 0.01], [3, -0.06]];

export default {
  name: 'scarab',
  scale: 1.5,
  cell: 0.0055,
  cells: { kit: 0.0035, eyes: 0.0022, fine: 0.0022 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0.06, 0]],
    ['head', 'body', [0, 0.06, 0.09]],
    ['ball', 'root', [0, 0.065, 0.22]],
    ...[1, -1].flatMap((m) => LEGS.flatMap(([i, z]) => {
      const S = `${m > 0 ? 'L' : 'R'}${i}`;
      return [[`leg${S}`, 'body', [m * 0.055, 0.05, z]], [`tip${S}`, `leg${S}`, [m * 0.11, 0.07, z + (i - 2) * 0.03]]];
    })),
  ],
  materials: {
    shell: { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, metalness: 0.35 },
    gold: { roughness: 0.22, metalness: 1 },
    eye: { roughness: 0.1, clearcoat: 1 },
    dung: { roughness: 0.95 },
  },
  sculpt(s) {
    const B = { color: SHELL, mat: 'shell', bone: 'body' };
    // The wing cases, the shield behind the head, and the split down the middle.
    s.ellipsoid([0, 0.068, -0.03], [0.08, 0.055, 0.1], { ...B, k: 0.012 });
    s.ellipsoid([0, 0.064, 0.06], [0.07, 0.044, 0.045], { ...B, k: 0.012 });
    s.box([0, 0.12, -0.04], [0.0025, 0.01, 0.1], 0.002, { op: 'sub', k: 0.004 });
    s.box([0, 0.105, 0.03], [0.09, 0.004, 0.004], 0.002, { op: 'sub', k: 0.006 });
    // The head: flat, with the rake of teeth along its front.
    s.ellipsoid([0, 0.05, 0.11], [0.058, 0.02, 0.035], { color: '#c8901e', mat: 'gold', bone: 'head', k: 0.008 });
    for (let i = -2; i <= 2; i++) s.cone([i * 0.02, 0.048, 0.155 - Math.abs(i) * 0.008], 0.008, 0.016, { color: '#c8901e', mat: 'gold', bone: 'head', k: 0.003, rot: [Math.PI / 2, 0, 0] });
    s.part('kit', () => {
      // Six legs, spiny, the front pair reaching for the ball.
      for (const m of [1, -1]) {
        for (const [i, z] of LEGS) {
          const S = `${m > 0 ? 'L' : 'R'}${i}`, dz = (i - 2) * 0.03, front = i === 1;
          const hip = [m * 0.055, 0.05, z], knee = [m * 0.11, 0.07, z + dz], foot = front ? [m * 0.07, 0.03, 0.17] : [m * 0.15, 0.0, z + dz * 2];
          s.limb(hip, knee, 0.012, 0.009, { ...LEG, bone: `leg${S}`, k: 0.004 });
          s.limb(knee, foot, 0.009, 0.004, { ...LEG, bone: `tip${S}`, k: 0.003 });
          for (const t of [0.35, 0.65]) s.cone([knee[0] + (foot[0] - knee[0]) * t, knee[1] + (foot[1] - knee[1]) * t + 0.006, knee[2] + (foot[2] - knee[2]) * t], 0.0025, 0.01, { ...LEG, bone: `tip${S}`, k: 0 });
        }
        // The feelers, each with its club.
        s.limb([m * 0.025, 0.06, 0.13], [m * 0.05, 0.085, 0.16], 0.003, 0.003, { ...LEG, bone: 'head', k: 0.002 });
        s.ellipsoid([m * 0.055, 0.09, 0.165], [0.008, 0.012, 0.006], { color: '#c8901e', mat: 'gold', bone: 'head', k: 0.002, rot: [0, 0, m * 0.5] });
      }
      // The ball: dung, rolled round, with bits in it.
      s.sphere([0, 0.065, 0.22], 0.065, { color: DUNG, mat: 'dung', bone: 'ball', k: 0.01, bump: [0.004, 60] });
      for (const [x, y, z] of [[0.03, 0.11, 0.2], [-0.05, 0.08, 0.25], [0.01, 0.03, 0.28]]) s.limb([x, y, z], [x + 0.02, y + 0.01, z + 0.015], 0.003, 0.002, { color: '#c8a050', mat: 'dung', bone: 'ball', k: 0.001 });
    });
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.045, 0.058, 0.1], 0.009, { color: '#0a0806', mat: 'eye', bone: 'head', k: 0 });
    });
  },
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const legs = (fn) => {
      for (const m of [1, -1]) for (const [i] of LEGS) fn(`${m > 0 ? 'L' : 'R'}${i}`, m, i);
    };
    if (clip === 'ko') {
      // Over on its back, legs going.
      const f = Math.min(1, t / 0.4);
      k.turn('root', 0, 0, Math.PI * f);
      k.move('root', 0, 0.13 * f, 0);
      legs((S, m, i) => k.turn(`leg${S}`, Math.sin(T * 18 + i) * 0.3, 0, m * Math.sin(T * 15 + i * 2) * 0.3));
      k.move('ball', 0, 0, 0.1 * f);
      return;
    }
    if (clip === 'attack') {
      // Up on its back legs, the front ones waving, then down on whatever is in front.
      const a = Math.min(1, t / 0.7), up = Math.sin(a * Math.PI);
      k.turn('body', -0.6 * up, 0, 0);
      k.move('body', 0, 0.03 * up, -0.02 * up);
      k.turn('legL1', -0.6 * up + Math.sin(T * 20) * 0.2, 0, 0.4 * up);
      k.turn('legR1', -0.6 * up - Math.sin(T * 20) * 0.2, 0, -0.4 * up);
      k.move('ball', 0, 0, 0.08 * up);
      return;
    }
    if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.move('body', 0, 0.02 * h, -0.03 * h);
      k.turn('body', -0.2 * h, 0, 0);
      return;
    }
    const walk = clip === 'walk', ph = T * 14 * Math.max(0.5, speed);
    // Three legs down and three swinging, turn about; the ball rolled on ahead.
    legs((S, m, i) => {
      const set = (i + (m > 0 ? 0 : 1)) % 2 ? 1 : -1, g = walk ? Math.sin(ph) * set : Math.sin(T * 1.5 + i) * 0.08;
      k.turn(`leg${S}`, 0, g * 0.4 * m, m * Math.max(0, g) * 0.35);
    });
    if (walk) k.turn('ball', ph * 0.25, 0, 0);
    k.move('body', 0, walk ? Math.abs(Math.sin(ph)) * 0.004 : 0, 0);
    k.turn('head', Math.sin(T * 2) * 0.06, Math.sin(T * 0.8) * 0.15, 0);
  },
};
