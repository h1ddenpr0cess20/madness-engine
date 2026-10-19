import { grime } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';

/**
 * The Zombie Extra: in make-up since four. Grey-green skin, dark round the
 * eyes, a torn shirt and a tie still on, trousers in rags at the knee, one
 * shoe; arms out in front, as the director asked, and shuffling. Hungry,
 * for craft services. About 0.9 tiles tall.
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
  look: { torso: shirt, sleeve: shirt, cuff: flesh, legs: slacks, boot: '#2a2420' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#c8c070', brow: '#3a3a30', mood: 1, blush: 0, jaw: 1.1 },
  hair: { color: cloth('#4a4436', '#2a261c'), cap: [0.1, 0.09, 0.104], locks: [[[0.06, 0.76, 0.02], [0.1, 0.68, 0.06], 0.022], [[-0.07, 0.74, -0.03], [-0.1, 0.64, -0.06], 0.022], [[0.02, 0.78, -0.07], [0.04, 0.66, -0.11], 0.025]] },
  style: {
    attack: 'hug', heavy: 0.5, twist: 0,
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
    s.part('kit', () => {
      // The tie, loose and askew, and the shirt torn open at the hem.
      s.limb([0, 0.52, 0.074], [0.02, 0.42, 0.086], 0.01, 0.015, { color: '#6a2a2a', mat: 'cloth', bone: 'chest', k: 0.003 });
      s.ellipsoid([0.04, 0.36, 0.07], [0.03, 0.025, 0.02], { color: flesh, mat: 'skin', bone: 'spine', k: 0.006 });
      // Rags at the knees.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        const kn = J[`knee${S}`];
        for (let i = 0; i < 3; i++) s.flake([kn[0] + (i - 1) * 0.02, kn[1] + 0.01, kn[2] + 0.02], [kn[0] + (i - 1) * 0.025, kn[1] - 0.04, kn[2] + 0.03], [0, 0, 1], 0.012, 0.006, 0.4, { color: '#3a3a40', mat: 'cloth', bone: `shin${S}`, k: 0.004 });
      }
    });
    // One shoe gone: a grey sock on the left foot.
    s.part('fine', () => {
      const a = J.ankleL;
      s.ellipsoid([a[0], 0.034, a[2] + 0.04], [0.034, 0.034, 0.066], { color: '#8a8a90', mat: 'cloth', bone: 'footL', k: 0.008 });
    });
  },
});
