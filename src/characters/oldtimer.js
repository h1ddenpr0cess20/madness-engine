import { bodyField, cloth, hold, person, plate } from './person.js';
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
    // The cardigan's buttons down the front, each set on the cardigan where it is (it stands out over the belly).
    s.part('kit', () => {
      // Straight in from in front of him onto the cardigan at each button's height, so they keep their spacing.
      const field = bodyField(s), w = s.warp;
      for (let i = 0; i < 4; i++) {
        const y = 0.495 - i * 0.038, from = w ? w.to([0, y, 0.3]) : [0, y, 0.3];
        const hit = field.cast(from, [0, 0, -1], 0.4);
        if (!hit) continue;
        const p = w ? w.from(hit.p) : hit.p;
        s.sphere([p[0], p[1], p[2] + 0.003], 0.006, { color: '#2a1a10', mat: 'plastic', bone: i < 2 ? 'chest' : 'spine', k: 0.001 });
      }
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
    // The bag of shopping in the crook of the left arm: brown paper, folded over at the top, a loaf and celery up out of
    // it. Hugged to the chest: upright behind the raised forearm, the hand over its top edge, its top up (not toward
    // the wrist, whichever way the hand is turned).
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const W = [1, 0, 0], Y = [0, 1, 0], D = [0, 0, 1];
      const c = L.c.map((v, i) => v - Y[i] * 0.052 - D[i] * 0.042);
      const at = (w, y, d) => c.map((v, i) => v + W[i] * w + Y[i] * y + D[i] * d);
      plate(s, c, W, Y, [0.05, 0.07, 0.035], 0.004, { color: (p) => (Math.abs(((p[1] * 140) % 1)) < 0.08 ? [0.6, 0.45, 0.3] : [0.78, 0.62, 0.42]), mat: 'paper', k: 0.002 });
      // The fold at the top, a band of doubled paper.
      plate(s, at(0, 0.064, 0), W, Y, [0.0515, 0.008, 0.0365], 0.002, { color: [0.7, 0.54, 0.36], mat: 'paper', k: 0.001 });
      // The loaf, leaning out of one end; the celery out of the other, its leaves on top.
      s.limb(at(-0.025, 0.04, 0.005), at(-0.04, 0.15, 0.0), 0.016, 0.014, { color: '#d8a050', mat: 'skin', k: 0.004, bump: [0.0012, 160] });
      for (let i = 0; i < 4; i++) {
        const b0 = at(0.012 + i * 0.006, 0.05, i % 2 ? 0.006 : -0.006), b1 = at(0.02 + i * 0.006, 0.15, i % 2 ? 0.008 : -0.008);
        s.limb(b0, b1, 0.0045, 0.004, { color: '#9ac85a', mat: 'skin', k: 0.002 });
        s.sphere(at(0.02 + i * 0.006, 0.155, i % 2 ? 0.008 : -0.008), 0.011, { color: '#6aa840', mat: 'cloth', k: 0.004, bump: [0.002, 200] });
      }
    }));
  },
});
