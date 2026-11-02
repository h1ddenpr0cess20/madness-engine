import { cloth, hold, person, plate } from './person.js';
import { cap, glasses, moustache } from './wardrobe.js';

/**
 * The Old-Timer: been going to the same corner shop since it sold
 * everything loose, and tells them so. A tweed flat cap, round glasses, a
 * white moustache, a brown cardigan buttoned over a checked shirt, grey
 * flannels, polished brown shoes; a little stooped, leaning on a walking
 * stick, the shopping in a paper bag in the crook of the other arm with a
 * loaf and a bunch of celery up out of it. About 0.88 tiles tall.
 */

const CARDIGAN = cloth('#7a5a3a', '#5a4028', { freq: 30, grain: 0.06 });
const FLANNEL = cloth('#8a8a88', '#6a6a68');
const TWEED = cloth('#6a5a44', '#4a3e2e', { freq: 40, grain: 0.1 });

export default person({
  name: 'oldtimer',
  scale: 1.32,
  b: 0.96,
  budget: 90000,
  shape: { legs: 0.96, girth: 0.96, head: 1.02 },
  belly: 0.5,
  skin: '#e8b89a',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: FLANNEL, boot: '#5a3018', sole: '#2a1608', belt: '#3a2010', buckle: '#a8a8a8' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#6a7a8a', brow: '#d8d8d4', mood: 1, jaw: 0.98 },
  hair: { color: cloth('#d8d8d4', '#b8b8b4'), cap: [0.1, 0.07, 0.104] },
  style: {
    attack: 'thrust', twist: 0, heavy: 0.6,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A stoop; the stick's tip on the pavement ahead; the bag held to the chest in the left arm.
      k.turn('spine', 0.12, 0, 0);
      k.turn('chest', 0.08, 0, 0);
      hold(k, 'armR', -0.15, 0, -0.18);
      hold(k, 'foreR', -0.35, 0, 0);
      aim?.(k, 'R', 'root', [-0.2, -0.6, 0.2]);
      hold(k, 'armL', -0.4, 0, 0.12);
      hold(k, 'foreL', -1.55, -0.3, 0);
      k.turn('head', -0.2, Math.sin(T * 0.35) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    cap(s, { color: TWEED, peak: '#5a4a36', flat: true });
    glasses(s, { rim: '#8a7a5a', round: true, size: 0.024 });
    moustache(s, { color: '#e8e8e4', wide: 1.1, droop: 0.3 });
    // The cardigan's buttons down the front, and the checked collar of the shirt at the neck.
    s.part('kit', () => {
      for (let i = 0; i < 5; i++) s.sphere([0, 0.53 - i * 0.045, 0.098 - Math.abs(i - 2) * 0.004 + (i === 4 ? 0.006 : 0)], 0.006, { color: '#2a1a10', mat: 'plastic', bone: i < 2 ? 'chest' : 'spine', k: 0.001 });
    });
    s.paint((p) => Math.max(Math.abs(p[1] - 0.57) - 0.012, 0.04 - Math.abs(p[2] - 0.06)), (p) => ((((p[0] * 90) % 1) + 1) % 1 < 0.5 !== ((((p[1] * 90) % 1) + 1) % 1 < 0.5) ? [0.7, 0.2, 0.18] : [0.9, 0.86, 0.8]), 0.002);

    // The stick: a crook in the fist, the shaft down to a rubber ferrule.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const W = { color: '#6a3e1e', mat: 'leather', k: 0.002 };
      s.limb(R.at(-0.035), R.at(0.035), 0.0068, 0.0068, W);
      s.limb(R.at(-0.035), R.at(-0.05, 0, 0.02), 0.0068, 0.0066, W);
      s.limb(R.at(-0.05, 0, 0.02), R.at(-0.04, 0, 0.042), 0.0066, 0.0062, W);
      s.limb(R.at(0.035), R.at(0.52), 0.0062, 0.0055, W);
      s.limb(R.at(0.51), R.at(0.545), 0.0072, 0.0072, { color: '#1a1a1a', mat: 'rubber', k: 0.001 });
    }));
    // The bag of shopping in the crook of the left arm: brown paper, folded over at the top, a loaf and celery up out of it.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const up = L.up, c = L.at(0, 0.06, -0.035);
      plate(s, c, L.along, up, [0.05, 0.075, 0.035], 0.004, { color: (p) => (Math.abs(((p[1] * 140) % 1)) < 0.08 ? [0.6, 0.45, 0.3] : [0.78, 0.62, 0.42]), mat: 'paper', k: 0.002 });
      const top = c.map((v, i) => v + up[i] * 0.075);
      s.limb(top.map((v, i) => v - L.along[i] * 0.02), top.map((v, i) => v - L.along[i] * 0.03 + up[i] * 0.08), 0.016, 0.014, { color: '#d8a050', mat: 'skin', k: 0.004, bump: [0.0012, 160] });
      for (let i = 0; i < 4; i++) {
        const b = top.map((v, j) => v + L.along[j] * (0.012 + i * 0.006) + L.out[j] * (i % 2 ? 0.006 : -0.006));
        s.limb(b, b.map((v, j) => v + up[j] * 0.09 + L.along[j] * 0.01), 0.0045, 0.004, { color: '#9ac85a', mat: 'skin', k: 0.002 });
        s.sphere(b.map((v, j) => v + up[j] * 0.095 + L.along[j] * 0.01), 0.011, { color: '#6aa840', mat: 'cloth', k: 0.004, bump: [0.002, 200] });
      }
    }));
  },
});
