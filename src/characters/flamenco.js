import { cloth, hold, person } from './person.js';

/**
 * The Flamenco Dancer: out of a tablao in Seville, in the traje de
 * flamenca: red with white spots, tight to the hips and then flaring in
 * three tiers of ruffles to the floor, a fringed black shawl round the
 * shoulders, the hair back in a bun with a big red rose in it and a comb
 * standing up behind, castanets in both hands, the arms curving up over
 * the head. Stamps. Clicks. Stares. Stamps. About 1.0 tiles tall.
 */

/** Red, with white spots. */
const SPOTS = (p, n) => {
  const u = p[0] * 22, v = p[1] * 22, w = p[2] * 22;
  const d = Math.hypot(u - Math.round(u), v - Math.round(v), w - Math.round(w));
  return d < 0.3 ? [0.95, 0.93, 0.9] : cloth('#c8141e', '#8a0a14')(p, n);
};

export default person({
  name: 'flamenco',
  scale: 1.46,
  b: 0.92,
  shape: { legs: 1.06, girth: 0.86, hips: 1.0 },
  skin: '#e0a880',
  look: { torso: SPOTS, sleeve: SPOTS, cuff: '#e0a880', legs: SPOTS, boot: '#14100a', sole: '#0a0806' },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', mood: 1, jaw: 0.9 },
  hair: { color: cloth('#14100a', '#0a0806'), cap: [0.106, 0.09, 0.106] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The arms up and curving over the head, the wrists turning; the heels stamping.
      hold(k, 'armL', -0.3, 0, 2.5 + Math.sin(T * 2) * 0.1);
      hold(k, 'foreL', 0, 0, 0.9);
      hold(k, 'handL', 0, Math.sin(T * 4) * 0.8, 0);
      hold(k, 'armR', -0.3, 0, -2.5 + Math.sin(T * 2) * 0.1);
      hold(k, 'foreR', 0, 0, -0.9);
      hold(k, 'handR', 0, -Math.sin(T * 4) * 0.8, 0);
      if (clip === 'idle') {
        const stamp = Math.max(0, Math.sin(T * 8));
        k.turn(Math.sin(T * 2) > 0 ? 'thighL' : 'thighR', -0.3 * stamp, 0, 0);
        k.turn('head', -0.1, Math.sin(T * 0.5) * 0.3, 0);
      }
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The skirt: tight over the hips, then three tiers of ruffles flaring to the floor.
      s.cone([0, 0.52, 0.0], 0.13, 0.4, { color: SPOTS, mat: 'cloth', bone: 'hips', k: 0.02 });
      for (const [y, r] of [[0.2, 0.1], [0.12, 0.135], [0.04, 0.17]]) s.torus([0, y, 0], r, 0.026, { color: SPOTS, mat: 'cloth', bone: 'hips', k: 0.02, bump: [0.004, 40] });
      // The shawl: black, round the shoulders, the fringe down.
      s.torus([0, 0.5, 0.0], 0.09, 0.024, { color: '#14100a', mat: 'cloth', bone: 'chest', k: 0.01, rot: [0.15, 0, 0] });
      for (let i = 0; i < 12; i++) {
        const a = -1.4 + (i / 11) * 2.8;
        s.limb([Math.sin(a) * 0.1, 0.48, Math.cos(a) * 0.08], [Math.sin(a) * 0.11, 0.42, Math.cos(a) * 0.09], 0.003, 0.002, { color: '#14100a', mat: 'cloth', bone: 'chest', k: 0 });
      }
      // The bun, the comb up behind it, and the rose.
      s.sphere([0, 0.7, -0.1], 0.038, { color: '#14100a', mat: 'hair', bone: 'head', k: 0.01 });
      s.flake([0, 0.72, -0.12], [0, 0.82, -0.11], [0, 0, 1], 0.05, 0.03, 0.15, { color: '#3a2010', mat: 'plastic', bone: 'head', k: 0.004 });
      s.sphere([0.08, 0.74, -0.03], 0.03, { color: '#e8141e', mat: 'cloth', bone: 'head', k: 0.006, bump: [0.004, 90] });
      // Castanets on the thumbs.
      for (const S of ['L', 'R']) {
        const h = J[`hand${S}`];
        s.ellipsoid([h[0], h[1] - 0.012, h[2] + 0.02], [0.016, 0.02, 0.008], { color: '#3a1a0a', mat: 'plastic', bone: `hand${S}`, k: 0.002 });
      }
    });
  },
});
