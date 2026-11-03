import { cloth, person } from './person.js';
import { longHair } from './metalwear.js';
import { infant } from './nursery.js';

/**
 * The Mother Holding a Baby: a soft green sweater, jeans, flat shoes, brown
 * hair to the shoulder, a sleeping baby in a yellow blanket cradled in her
 * arms, and her head bent to it. About 0.92 tiles tall.
 */

const SWEATER = cloth('#86a888', '#628464', { freq: 30, grain: 0.05 });
const JEANS = cloth('#44649a', '#2e4a78');

export default person({
  name: 'motherholding',
  scale: 1.42,
  b: 0.94,
  shape: { legs: 1.04, girth: 0.92, hips: 1.0 },
  skin: '#e6b394',
  look: { torso: SWEATER, sleeve: SWEATER, cuff: SWEATER, legs: JEANS, boot: '#6a4a34', sole: '#2a1a10', tuck: false },
  mats: { legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#6a4a2a', brow: '#4a2e1a', blush: 0.5, jaw: 0.94 },
  hair: longHair(cloth('#6a4428', '#442810'), { length: 0.7, fringe: false }),
  style: {
    attack: 'shove',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Both arms round the baby: the right under its bottom, the left behind its head and back.
      reach?.(k, 'R', 'chest', [-0.03, 0.315, 0.15]);
      reach?.(k, 'L', 'chest', [0.075, 0.45, 0.125]);
      // A gentle rock, her head bent to the baby.
      k.turn('hips', 0, 0, Math.sin(T * 1.6) * 0.03);
      k.turn('head', 0.22 + Math.sin(T * 0.8) * 0.03, 0.1, 0.06);
    },
  },
  extras(s) {
    // The baby lies across her arms, its head by her left shoulder, its face turned up and out.
    infant(s, { head: [0.06, 0.5, 0.15], foot: [-0.03, 0.375, 0.175], face: [0.15, 0.5, 0.85], bone: 'chest' });
  },
});
