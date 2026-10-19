import { cloth, hold, person } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * Nonna: somebody's grandmother, everybody's, small and round and in black
 * from the headscarf to the shoes, a cardigan over the dress, glasses on a
 * chain, a grey bun, and the wooden spoon held up and shaking at you. You
 * are too thin. You are a rock. You are still too thin. Sit. Eat. About
 * 0.75 tiles tall.
 */

const BLACK = cloth('#1e1c20', '#0e0c10');
const CARDIGAN = cloth('#3a3438', '#24202a');

export default person({
  name: 'nonna',
  scale: 1.24,
  b: 1.1,
  shape: { legs: 0.84, girth: 1.22, head: 1.06, hips: 1.2 },
  belly: 0.9,
  skin: '#e8b898',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: '#c8a890', boot: '#0e0c10', sole: '#060508' },
  mats: { legs: 'skin', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#8a8a8a', mood: 1, jaw: 1.04, blush: 0.6 },
  style: {
    attack: 'smite', twist: 0, heavy: 0.3,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The spoon up and shaking; the other hand on the hip.
      hold(k, 'armR', -1.6, 0, -0.2);
      hold(k, 'foreR', -0.9 + Math.sin(T * 9) * 0.25, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.55);
      hold(k, 'foreL', -1.3, 0.9, 0);
      k.turn('head', 0.05, Math.sin(T * 9) * 0.06, 0);
    },
  },
  extras(s, J) {
    glasses(s, { rim: '#6a5a4a' });
    s.part('kit', () => {
      // The dress, black to the ankles, under the cardigan.
      s.cone([0, 0.5, 0.01], 0.15, 0.44, { color: BLACK, mat: 'cloth', bone: 'hips', k: 0.02 });
      // The headscarf, tied under the chin; the bun pushing it out behind.
      s.ellipsoid([0, 0.71, -0.006], [0.114, 0.1, 0.112], { color: BLACK, mat: 'cloth', bone: 'head', k: 0.012 });
      s.ellipsoid([0, 0.66, 0.06], [0.13, 0.09, 0.08], { op: 'sub', k: 0.02 });
      s.sphere([0, 0.7, -0.11], 0.04, { color: BLACK, mat: 'cloth', bone: 'head', k: 0.02 });
      for (const m of [1, -1]) s.limb([m * 0.08, 0.64, 0.04], [m * 0.01, 0.57, 0.08], 0.012, 0.01, { color: BLACK, mat: 'cloth', bone: 'head', k: 0.006 });
      // The glasses' chain.
      for (const m of [1, -1]) s.limb([m * 0.1, 0.666, 0.02], [m * 0.06, 0.5, 0.06], 0.002, 0.002, { color: '#d8c080', mat: 'metal', bone: 'head', k: 0 });
      // The wooden spoon.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.03, h[2] + 0.01], [h[0], h[1] + 0.14, h[2] + 0.01], 0.006, 0.006, { color: '#c8a060', mat: 'leather', bone: 'handR', k: 0.002 });
      s.ellipsoid([h[0], h[1] + 0.17, h[2] + 0.01], [0.022, 0.032, 0.008], { color: '#c8a060', mat: 'leather', bone: 'handR', k: 0.004 });
    });
  },
});
