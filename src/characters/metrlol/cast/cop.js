import { cloth, person } from './person.js';
import { cap, moustache } from './wardrobe.js';

/**
 * The Flatfoot: a beat cop of the old school on Broadway, in a
 * double-breasted blue coat with two rows of brass buttons, a peaked cap
 * with a badge, a star on his chest, a belt and a nightstick he taps in
 * his palm. Has a hunch. About 0.95 tiles tall and stout.
 */

const blue = cloth('#1e2a4e', '#101830');

export default person({
  name: 'cop',
  scale: 1.48,
  b: 1.18,
  shape: { legs: 0.96, girth: 1.12 },
  belly: 1.0,
  skin: '#e4b090',
  look: { torso: blue, sleeve: blue, cuff: blue, legs: blue, boot: '#0c0c0e', belt: '#101014', buckle: '#d8b850' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#6a3a1a', mood: 1, jaw: 1.15, blush: 0.7 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The nightstick, tapped into the other palm.
      const tap = Math.max(0, Math.sin(T * 3)) ** 3;
      k.turn('armR', -0.8 - tap * 0.25, 0.25, -0.1);
      k.turn('foreR', -1.0, 0, 0);
      k.turn('handR', -0.5 - tap * 0.4, 0, 0);
      k.turn('armL', -0.7, -0.4, -0.1);
      k.turn('foreL', -1.3, 0, 0);
      k.turn('head', 0, Math.sin(T * 0.5) * 0.35, 0);
    },
  },
  extras(s, J) {
    cap(s, { color: '#1e2a4e', peak: '#0c0c0e', badge: '#d8b850' });
    moustache(s, { color: '#6a3a1a', wide: 1.1 });
    s.part('kit', () => {
      // Two rows of brass buttons down the coat, a star on the chest.
      for (const y of [0.47, 0.42, 0.37]) for (const m of [1, -1]) s.sphere([m * 0.035, y, 0.082 + (0.47 - y) * 0.2], 0.007, { color: '#d8b850', mat: 'metal', bone: 'chest', k: 0.001 });
      s.cylinder([0.062, 0.48, 0.072], 0.014, 0.003, { color: '#d8b850', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      // The coat's skirt, to the thigh.
      s.ellipsoid([0, 0.29, 0.0], [0.1, 0.07, 0.08], { color: blue, mat: 'cloth', bone: 'hips', k: 0.025 });
      // The nightstick.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.02, r[2]], [r[0], r[1] + 0.02, r[2] + 0.2], 0.012, 0.014, { color: '#4a2a14', mat: 'leather', bone: 'handR', k: 0.002 });
    });
  },
});
