import { cloth, person } from './person.js';

/**
 * The Scalper: a long tan trench coat, a flat cap pulled down, dark
 * glasses, and a fan of tickets in his hand. Tickets. Tickets. Why are
 * you a boulder. About 0.95 tiles tall.
 */

const coat = cloth('#b89a62', '#7a6238');

export default person({
  name: 'scalper',
  scale: 1.42,
  b: 1.05,
  shape: { legs: 1.06, girth: 0.86, head: 0.96, torso: 1.06 },
  skin: '#d4a07c',
  look: { torso: coat, sleeve: coat, cuff: coat, legs: coat, boot: '#2a1c12' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', mood: 1 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // Holding the tickets out, a little hunched; looking about.
      if (clip !== 'attack') {
        k.turn('armR', -1.0, 0, -0.15);
        k.turn('foreR', -1.0, 0, 0);
      }
      k.turn('chest', 0.12, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 1.3) * 0.5, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      const R = { color: coat, mat: 'cloth', bone: 'hips', k: 0.03 };
      s.limb([0, 0.38, 0.004], [0, 0.08, 0.01], 0.116, 0.15, R);
      // The lapels, and the collar turned up.
      for (const m of [1, -1]) {
        s.flake([m * 0.07, 0.53, 0.03], [m * 0.025, 0.4, 0.08], [m, 0.2, 0.3], 0.03, 0.02, 0.2, { color: coat, mat: 'cloth', bone: 'chest', k: 0.008 });
      }
      s.torus([0, 0.512, 0.0], 0.06, 0.016, { color: coat, mat: 'cloth', bone: 'chest', k: 0.008 });
      // A flat cap.
      s.ellipsoid([0, 0.738, 0.0], [0.114, 0.045, 0.112], { color: '#3a3a40', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.715, 0.09], [0, 0.705, 0.17], [0, 1, 0], 0.07, 0.05, 0.12, { color: '#3a3a40', mat: 'cloth', bone: 'head', k: 0.006 });
      // Dark glasses.
      s.box([0, 0.668, 0.1], [0.075, 0.018, 0.01], 0.008, { color: '#08080a', mat: 'glass', bone: 'head', k: 0.003 });
      // A fan of tickets: five slips of coloured card.
      const h = J.handR;
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.2;
        s.box([h[0] + Math.sin(a) * 0.04, h[1] + 0.045, h[2] + 0.02 + Math.cos(a) * 0.03], [0.012, 0.045, 0.0035], 0.002, { color: ['#ff2d95', '#2de2ff', '#ffd23a', '#3ae88a', '#ff7a1a'][i], mat: 'paper', bone: 'handR', k: 0.002, rot: [0, 0, a] });
      }
    });
  },
});
