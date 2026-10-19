import { hold, person } from './person.js';
import { headband, longHair } from './metalwear.js';
import { glasses } from './wardrobe.js';

/**
 * The Hippie: waist-length hair, a headband, a tie-dye shirt with a
 * peace sign on a cord, flared jeans with the hems dragging, round pink
 * glasses, a daisy. Peace, love, and a complaint about the volume.
 * About 0.9 tiles tall.
 */

const RINGS = [[1, 0.2, 0.55], [1, 0.8, 0.2], [0.3, 0.8, 0.4], [0.15, 0.7, 1], [0.6, 0.3, 0.9], [1, 0.4, 0.7]];
const dye = (p) => {
  const r = Math.hypot(p[0] * 1.1, (p[1] - 0.45) * 1.3 + Math.sin(p[0] * 40) * 0.015) * 36;
  const c = RINGS[Math.floor(r) % RINGS.length];
  return c.map((v) => Math.pow(v, 2.2));
};

export default person({
  name: 'hippie',
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.12, girth: 0.86, head: 1.02 },
  skin: '#e6b490',
  look: { torso: dye, sleeve: dye, cuff: '#e6b490', legs: '#2c5a8a', boot: '#8a5a32', sole: '#4a3018' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a6a4a', brow: '#6a4a2a', mood: 0, blush: 0.4 },
  hair: longHair('#7a5a34', { length: 1.25 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Swaying to music that isn't playing, a hand up with the flower.
      k.turn('hips', 0, 0, Math.sin(T * 1.7) * 0.06);
      k.turn('chest', 0, Math.sin(T * 1.7) * 0.12, -Math.sin(T * 1.7) * 0.08);
      hold(k, 'armR', -2.5, 0, -0.35); hold(k, 'foreR', -0.3, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.9) * 0.25, 0.12);
    },
  },
  extras(s, J) {
    headband(s, { color: '#f0c040' });
    glasses(s, { rim: '#e86aa0', round: true, dark: true, size: 0.022 });
    s.part('kit', () => {
      // Flared jeans: a flare at each ankle.
      for (const m of [1, -1]) s.cone([m * 0.06, 0.2, 0.0], 0.05, 0.16, { color: '#2c5a8a', mat: 'denim', bone: m > 0 ? 'shinL' : 'shinR', k: 0.01 });
      // The peace sign on its cord.
      s.limb([-0.03, 0.55, 0.04], [0, 0.43, 0.082], 0.003, 0.003, { color: '#8a5a32', mat: 'leather', bone: 'chest', k: 0.001 });
      s.torus([0, 0.42, 0.086], 0.016, 0.003, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      // The daisy in the hand.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.02, h[2]], [h[0], h[1] + 0.07, h[2]], 0.003, 0.003, { color: '#3a9a4a', mat: 'cloth', bone: 'handR', k: 0.001 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        s.ellipsoid([h[0] + Math.cos(a) * 0.016, h[1] + 0.08, h[2] + Math.sin(a) * 0.016], [0.009, 0.004, 0.009], { color: '#f8f4ec', mat: 'cloth', bone: 'handR', k: 0.002 });
      }
      s.sphere([h[0], h[1] + 0.08, h[2]], 0.008, { color: '#f0c040', mat: 'cloth', bone: 'handR', k: 0.002 });
    });
  },
});
