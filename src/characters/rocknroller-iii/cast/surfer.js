import { cloth, hold, person } from './person.js';

/**
 * The Surfer: up the beach from Bondi with the board under one arm, brown
 * as a nut, the hair bleached by the sun into a mop, a stripe of white
 * zinc down the nose, a string of shells at the throat, boardshorts with
 * hibiscus on them, and the other hand on his hip, looking out past you
 * to the break. Waiting for the wave. Found you instead. About
 * 0.95 tiles tall.
 */

const SKIN = '#c8885a';
/** Boardshorts: teal, with big orange flowers. */
const SHORTS = (p, n) => {
  const f = Math.sin(p[0] * 60) * Math.sin(p[1] * 60) * Math.sin(p[2] * 60 + 1);
  return f > 0.35 ? [0.95, 0.45, 0.15] : cloth('#1aa8a8', '#0e7878')(p, n);
};

export default person({
  name: 'surfer',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.06, girth: 0.92 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: (p, n) => (p[1] > 0.2 ? SHORTS(p, n) : cloth(SKIN)(p, n)), boot: SKIN },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#3a7aa8', brow: '#d8b878', blush: 0.4, jaw: 1.04 },
  hair: { color: cloth('#f0d898', '#c8a860'), cap: [0.112, 0.1, 0.112], locks: [[[0.06, 0.75, 0.07], [0.1, 0.68, 0.1], 0.035], [[-0.05, 0.76, 0.07], [-0.09, 0.69, 0.1], 0.035], [[0.09, 0.7, -0.04], [0.12, 0.6, -0.06], 0.035], [[-0.09, 0.7, -0.04], [-0.12, 0.6, -0.06], 0.035], [[0, 0.72, -0.1], [0, 0.6, -0.12], 0.045]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The board under the right arm, the other hand on the hip, looking out past you to the break.
      hold(k, 'armR', 0.05, 0, -0.3);
      hold(k, 'foreR', -0.4, 0, 0);
      if (clip === 'idle') {
        hold(k, 'armL', 0.1, 0, 0.5);
        hold(k, 'foreL', -1.3, 0.9, 0);
        k.turn('head', -0.1, 0.4 + Math.sin(T * 0.4) * 0.3, 0);
      }
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // A stripe of zinc down the nose, the shells at the throat.
      s.ellipsoid([0, 0.66, 0.112], [0.012, 0.02, 0.008], { color: '#f8f8f8', mat: 'plastic', bone: 'head', k: 0.003 });
      for (let i = 0; i < 9; i++) {
        const a = -1.3 + (i / 8) * 2.6;
        s.sphere([Math.sin(a) * 0.06, 0.515 - Math.cos(a) * 0.02, 0.01 + Math.cos(a) * 0.05], 0.007, { color: '#f4ecd8', mat: 'plastic', bone: 'chest', k: 0.001 });
      }
      // The board: long, white, a red stripe down it, under the arm on its edge.
      const r = J.handR;
      s.box([r[0] - 0.035, r[1] + 0.08, r[2] + 0.03], [0.008, 0.075, 0.36], 0.05, { color: '#f6f4ee', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.box([r[0] - 0.044, r[1] + 0.08, r[2] + 0.03], [0.002, 0.012, 0.32], 0.002, { color: '#d8301a', mat: 'plastic', bone: 'handR', k: 0 });
      s.flake([r[0] - 0.035, r[1] + 0.02, r[2] - 0.3], [r[0] - 0.035, r[1] - 0.03, r[2] - 0.32], [1, 0, 0], 0.02, 0.008, 0.2, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.002 });
    });
  },
});
