import { cloth, person, strap } from './person.js';
import { glasses, suitFront } from './wardrobe.js';

/**
 * The Bouncer: huge, in a black suit that has given up, a white shirt, a
 * thin tie, a shaved head, sunglasses and a coiled wire to his ear. Arms
 * folded. Opinion: no. About 1.2 tiles tall and nearly as wide.
 */

const suit = cloth('#17171c', '#0a0a0e');

export default person({
  name: 'bouncer',
  scale: 1.7,
  b: 1.55,
  shape: { torso: 1.14, girth: 1.32, hips: 1.0, head: 0.84, legs: 1.04 },
  skin: '#b8805e',
  look: { torso: suit, sleeve: suit, cuff: suit, legs: suit, boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#160d07', mood: 1, jaw: 1.25, ears: true },
  style: {
    attack: 'punch', heavy: 1, twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip !== 'idle' && clip !== 'walk') return;
      const T = time + seed;
      if (clip === 'idle') {
        // Hands clasped in front, one over the other, feet apart: nobody gets in.
        reach?.(k, 'R', 'hips', [-0.012, 0.268, 0.135]);
        reach?.(k, 'L', 'hips', [0.016, 0.262, 0.142]);
        k.turn('thighL', 0, 0, 0.06); k.turn('thighR', 0, 0, -0.06);
      }
      k.turn('head', 0, Math.sin(T * 0.4) * 0.25, 0);
    },
  },
  extras(s) {
    // The shirt and a thin black tie in the V of the jacket.
    suitFront(s, { shirt: '#f2f0ec', tie: '#101014', lapel: cloth('#16161c', '#0a0a0e'), b: 1.55, low: 0.4 });
    // Sunglasses, indoors, at night.
    glasses(s, { rim: '#08080a', round: false, dark: true, size: 0.026 });
    // The earpiece: a bud in the left ear, its curl of clear wire down the neck into the collar.
    s.part('kit', () => s.sphere([0.1, 0.656, 0.004], 0.0075, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.002 }));
    strap(s, [[0.1, 0.65, 0.0], [0.094, 0.6, -0.02], [0.07, 0.56, -0.035], [0.05, 0.545, -0.045]], { round: true, thick: 0.0032, lift: 0.001, color: '#d0d4dc', mat: 'plastic', over: ['head', 'top'], bone: 'neck' });
  },
});
