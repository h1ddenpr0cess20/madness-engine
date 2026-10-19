import { cloth, hold, person } from './person.js';

/**
 * The Samba Dancer: off a float in the Sambódromo and not stopping for
 * anybody, in gold sequins and not a lot else, a headdress of feathers
 * twice her height, a back-piece of feathers fanned out behind like a
 * peacock's, gold at the wrists and ankles, the hips going on every beat
 * and the arms up. Feathers, sequins and a samba that does not stop for
 * anybody. About 1.6 tiles tall to the top of the feathers.
 */

const SKIN = '#b87850';
const SEQUINS = (p) => {
  const g = 0.75 + 0.25 * Math.sin(p[0] * 300 + p[1] * 260 + p[2] * 280);
  return [0.95 * g, 0.72 * g, 0.2 * g];
};
const PLUMES = ['#ff3a8a', '#f0c020', '#3ac8e8', '#ff8a2a', '#8a3ad8'];

export default person({
  name: 'sambista',
  scale: 1.44,
  b: 0.92,
  cells: { kit: 0.0065 },
  shape: { legs: 1.1, girth: 0.86, hips: 1.04 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: SKIN, boot: '#e8b040', sole: '#c89020' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'skin', boot: 'metal' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', jaw: 0.9, blush: 0.6 },
  hair: { color: cloth('#14100a', '#0a0806'), locks: [[[0.08, 0.68, -0.04], [0.11, 0.5, -0.07], 0.035], [[-0.08, 0.68, -0.04], [-0.11, 0.5, -0.07], 0.035], [[0, 0.66, -0.1], [0, 0.48, -0.12], 0.045]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, beat = Math.sin(T * 10);
      // Samba: the hips going on every beat, the feet quick under them, the arms up and out.
      k.turn('hips', 0, beat * 0.2, beat * 0.08);
      k.turn('chest', 0, -beat * 0.1, 0);
      hold(k, 'armL', -0.3, 0, 2.2 + Math.sin(T * 2) * 0.2);
      hold(k, 'foreL', 0, 0, 0.4);
      hold(k, 'armR', -0.3, 0, -2.2 + Math.sin(T * 2) * 0.2);
      hold(k, 'foreR', 0, 0, -0.4);
      if (clip === 'idle') {
        hold(k, 'thighL', -Math.max(0, beat) * 0.3, 0, 0); hold(k, 'shinL', Math.max(0, beat) * 0.5, 0, 0);
        hold(k, 'thighR', -Math.max(0, -beat) * 0.3, 0, 0); hold(k, 'shinR', Math.max(0, -beat) * 0.5, 0, 0);
      }
    },
  },
  extras(s) {
    s.part('kit', () => {
      const G = { color: SEQUINS, mat: 'metal' };
      // Sequins: the top, the belt and the fringe of beads off it, the cuffs and anklets.
      for (const m of [1, -1]) s.ellipsoid([m * 0.04, 0.46, 0.05], [0.04, 0.035, 0.03], { ...G, bone: 'chest', k: 0.008 });
      s.torus([0, 0.32, 0.0], 0.085, 0.02, { ...G, bone: 'hips', k: 0.006 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        s.limb([Math.sin(a) * 0.088, 0.31, Math.cos(a) * 0.075], [Math.sin(a) * 0.095, 0.24, Math.cos(a) * 0.08], 0.004, 0.006, { ...G, bone: 'hips', k: 0 });
      }
      // The headdress: a gold band, a jewel, plumes fanned up and out.
      s.torus([0, 0.74, 0.0], 0.104, 0.016, { ...G, bone: 'head', k: 0.004 });
      s.sphere([0, 0.76, 0.105], 0.018, { color: '#3ac8e8', mat: 'glass', bone: 'head', k: 0.002 });
      for (let i = 0; i < 9; i++) {
        const a = -1.1 + (i / 8) * 2.2;
        s.flake([Math.sin(a) * 0.06, 0.78, 0.02], [Math.sin(a) * 0.32, 0.78 + Math.cos(a) * 0.45, -0.04], [0, 0, 1], 0.02, 0.055, 0.2, { color: PLUMES[i % 5], mat: 'cloth', bone: 'head', k: 0.004 });
      }
      // The back-piece: a fan of feathers off the shoulders.
      for (let i = 0; i < 11; i++) {
        const a = -1.35 + (i / 10) * 2.7;
        s.flake([Math.sin(a) * 0.05, 0.42, -0.08], [Math.sin(a) * 0.42, 0.42 + Math.cos(a) * 0.5, -0.16], [0, 0, 1], 0.02, 0.06, 0.2, { color: PLUMES[(i + 2) % 5], mat: 'cloth', bone: 'chest', k: 0.004 });
      }
    });
  },
});
