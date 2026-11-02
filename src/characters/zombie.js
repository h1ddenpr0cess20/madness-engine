import { grime } from '../models/skins.js';
import { cloth, person, shell } from './person.js';

/**
 * The Zombie: up out of the swamp for the death-metal vocals. Grey-green skin, dark round the
 * eyes, a torn shirt and a tie still on, trousers in rags at the knee, one
 * shoe; arms out in front, as the director asked, and shuffling. Hungry,
 * for a very specific guitar tone. About 0.9 tiles tall.
 */

const flesh = '#9aaa86';
const shirt = grime(cloth('#c8c4b0', '#8a8670'), 0.25, 0.42, 0.5);
const slacks = grime(cloth('#4a4a52', '#2a2a30'), 0.0, 0.2, 0.5);

export default person({
  name: 'zombie',
  scale: 1.42,
  b: 1.0,
  shape: { legs: 0.98, girth: 0.94, head: 1.04 },
  skin: flesh,
  look: { torso: shirt, sleeve: shirt, cuff: flesh, legs: slacks, boot: '#2a2420', shoeless: 'L' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#c8c070', brow: '#3a3a30', mood: 1, blush: 0, jaw: 1.1 },
  hair: { color: cloth('#4a4436', '#2a261c'), cap: [0.1, 0.09, 0.104], locks: [[[0.06, 0.76, 0.02], [0.1, 0.68, 0.06], 0.022], [[-0.07, 0.74, -0.03], [-0.1, 0.64, -0.06], 0.022], [[0.02, 0.78, -0.07], [0.04, 0.66, -0.11], 0.025]] },
  style: {
    attack: 'hug', heavy: 0.5,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Arms straight out in front, a lurch, the head lolling.
      k.turn('armR', -1.45 + Math.sin(T * 1.3) * 0.08, 0, 0.1);
      k.turn('armL', -1.45 + Math.sin(T * 1.3 + 1) * 0.08, 0, -0.1);
      k.turn('foreR', -0.1, 0, 0); k.turn('foreL', -0.1, 0, 0);
      k.turn('head', 0.2, Math.sin(T * 0.6) * 0.2, 0.35 + Math.sin(T * 0.9) * 0.1);
      k.turn('chest', 0.12, 0, 0.06);
    },
  },
  extras(s, J) {
    // Dark rings round the eyes, and stitches across the cheek.
    s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.041, (p[1] - 0.668) * 0.9, Math.max(0, 0.07 - p[2])) - 0.03, '#4a4a5a', 0.012);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.64 + p[0] * 0.4) - 0.002, Math.abs(p[0] + 0.05) - 0.025, 0.07 - p[2]), '#3a1a1a', 0.002);
    for (let i = 0; i < 4; i++) { const x = -0.07 + i * 0.014; s.paint((p) => Math.max(Math.abs(p[0] - x) - 0.0015, Math.abs(p[1] - 0.64 + x * 0.4) - 0.007, 0.07 - p[2]), '#3a1a1a', 0.001); }
    // His office tie, still on, loosened and pulled askew; the knot slipped down.
    shell(s, (p) => { const c = (0.52 - p[1]) * 0.3; return Math.max(Math.abs(p[0] - c) - 0.008 - Math.max(0, 0.5 - p[1]) * 0.06, p[1] - 0.52, 0.4 - p[1], 0.02 - p[2]); }, { color: '#6a2a2a', mat: 'cloth', part: 'outer', thick: 0.004, lift: 0.001, over: ['top'], bone: 'chest', k: 0.002 });
    s.part('outer2', () => s.ellipsoid([0.0, 0.517, 0.083], [0.011, 0.01, 0.008], { color: '#6a2a2a', mat: 'cloth', bone: 'chest', k: 0.002 }));
    // The shirt torn open at the side and the trousers through at the knees, his grey skin showing, frayed.
    const tear = (c, r, sx, sy) => (p) => Math.hypot((p[0] - c[0]) * sx, (p[1] - c[1]) * sy) - r - Math.sin(p[0] * 700 + p[1] * 500) * 0.0025;
    const hole = tear([0.05, 0.36], 0.024, 1, 1.3);
    s.paint((p) => Math.max(hole(p), 0.02 - p[2]), flesh, 0.002);
    s.paint((p) => Math.max(Math.abs(hole(p) - 0.002) - 0.002, 0.02 - p[2]), '#e8e4d0', 0.0015);
    for (const S of ['L', 'R']) {
      const kn = J[`knee${S}`], k2 = tear(kn, 0.022, 1.3, 2.0);
      s.paint((p) => Math.max(k2(p), 0.01 - p[2]), flesh, 0.002);
    }
  },
});
