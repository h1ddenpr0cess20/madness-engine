import { cloth, hold, person } from './person.js';
import { topHat } from './metalwear.js';

/**
 * The Pallbearer: a black suit, a black tie, white gloves, a top hat with
 * a band on it and, on the left shoulder, one corner of a coffin. The
 * others are not there. It is a jazz funeral: they will be along in a
 * minute, with the brass. Walks as if it were being paid by the hour.
 * About 1.0 tiles tall.
 */

const SUIT = cloth('#14141a', '#08080c');

export default person({
  name: 'pallbearer',
  scale: 1.52,
  b: 1.04,
  shape: { legs: 1.06, torso: 1.04, girth: 0.96 },
  skin: '#8a5a3a',
  look: { torso: SUIT, sleeve: SUIT, cuff: SUIT, hand: '#f4f2ee', legs: SUIT, boot: '#0c0c10', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#14100c', mood: -1 },
  style: {
    attack: 'smash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The coffin up on the left shoulder, the hand steadying it; the other arm at the side; a measured, rolling step.
      hold(k, 'armL', -2, 0, -0.05); hold(k, 'foreL', -1.35, 0, 0);
      hold(k, 'armR', 0.05, 0, -0.1); hold(k, 'foreR', -0.15, 0, 0);
      k.turn('chest', 0, 0, Math.sin(T * 1.5) * 0.04);
      k.turn('head', 0.1, 0, -0.1);
    },
  },
  extras(s) {
    topHat(s);
    s.part('kit', () => {
      // The coffin: a long hexagonal box, the near end resting on the shoulder.
      s.box([0.165, 0.6, -0.03], [0.05, 0.035, 0.2], 0.012, { color: '#6a3a1e', mat: 'leather', bone: 'chest', k: 0.006 });
      s.box([0.165, 0.636, -0.03], [0.035, 0.008, 0.19], 0.004, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.002 });
      for (const z of [-0.17, 0.11]) s.limb([0.112, 0.6, z], [0.218, 0.6, z], 0.006, 0.006, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.002 });
      // A white shirt front and a black tie.
      s.box([0, 0.47, 0.067], [0.03, 0.07, 0.006], 0.003, { color: '#f4f2ee', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([0, 0.46, 0.074], [0.008, 0.06, 0.004], 0.002, { color: '#08080c', mat: 'cloth', bone: 'chest', k: 0.001 });
    });
  },
});
