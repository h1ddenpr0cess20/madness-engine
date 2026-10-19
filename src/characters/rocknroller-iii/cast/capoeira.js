import { cloth, hold, person } from './person.js';

/**
 * The Capoeirista: from the roda on the beach at Ipanema, bare to the
 * waist, in the white abadá trousers and the coloured cord of his grade
 * knotted at the hip, the ginga swaying side to side, low, the arms
 * guarding the face, and then out of nowhere a cartwheel or a kick round
 * over his own head. Is it a dance? Is it a fight? It is a kick. At you.
 * About 0.95 tiles tall.
 */

const SKIN = '#8a5a3a';

export default person({
  name: 'capoeira',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.08, girth: 0.94 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: cloth('#f6f4f0', '#d8d4cc'), boot: SKIN },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#2a1a0a', brow: '#0a0806', jaw: 1.04, mood: 1 },
  hair: { color: cloth('#0a0806', '#050403'), cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, t, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      if (clip === 'attack') {
        // Meia lua: the leg round in a half moon at head height.
        const a = Math.min(1, t / 0.8), p = Math.sin(a * Math.PI);
        hold(k, 'thighR', -0.3 * p, 0, -1.6 * p);
        hold(k, 'shinR', 0, 0, 0);
        k.turn('hips', 0, (a - 0.5) * 2.5, 0.3 * p);
        k.turn('spine', 0, 0, 0.4 * p);
        return;
      }
      // The ginga: stepping back side to side, low, the opposite arm across the face.
      const g = Math.sin(T * 3);
      k.move('hips', 0, -0.04, 0);
      hold(k, 'thighL', -0.4 + Math.max(0, g) * 0.6, 0, 0.15); hold(k, 'shinL', 0.6, 0, 0);
      hold(k, 'thighR', -0.4 + Math.max(0, -g) * 0.6, 0, -0.15); hold(k, 'shinR', 0.6, 0, 0);
      k.turn('spine', 0.2, g * 0.3, 0);
      hold(k, 'armL', -1.0 - Math.max(0, -g) * 0.6, 0, 0.3);
      hold(k, 'foreL', -1.2, 0, 0);
      hold(k, 'armR', -1.0 - Math.max(0, g) * 0.6, 0, -0.3);
      hold(k, 'foreR', -1.2, 0, 0);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // The waistband, and the cord of his grade knotted at the left hip, its ends down.
      s.torus([0, 0.335, 0.0], 0.08, 0.012, { color: '#f6f4f0', mat: 'cloth', bone: 'hips', k: 0.004 });
      s.torus([0, 0.33, 0.0], 0.083, 0.006, { color: '#2a8a3a', mat: 'cloth', bone: 'hips', k: 0.002 });
      s.sphere([0.07, 0.325, 0.04], 0.012, { color: '#f0c020', mat: 'cloth', bone: 'hips', k: 0.002 });
      for (const [dz, c] of [[0.03, '#2a8a3a'], [0.05, '#f0c020']]) s.limb([0.075, 0.32, dz], [0.085, 0.22, dz + 0.01], 0.005, 0.005, { color: c, mat: 'cloth', bone: 'hips', k: 0.001 });
      // Muscle: pecs and the line down the middle.
      for (const m of [1, -1]) s.ellipsoid([m * 0.04, 0.47, 0.055], [0.04, 0.03, 0.025], { color: SKIN, mat: 'skin', bone: 'chest', k: 0.02 });
    });
  },
});
