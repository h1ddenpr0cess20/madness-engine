import { cloth, person } from './person.js';

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
    after(k, { clip, time, seed }) {
      if (clip !== 'idle' && clip !== 'walk') return;
      const T = time + seed;
      // Arms folded across the chest.
      k.turn('armR', -0.9, -0.2, 0.55);
      k.turn('foreR', -2.0, 0.4, 0);
      k.turn('armL', -0.9, 0.2, -0.55);
      k.turn('foreL', -2.0, -0.4, 0);
      k.turn('head', 0, Math.sin(T * 0.4) * 0.25, 0);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // The shirt and tie in the V of the jacket.
      s.box([0, 0.47, 0.067], [0.03, 0.07, 0.014], 0.006, { color: '#f2f0ec', mat: 'cloth', bone: 'chest', k: 0.004 });
      s.limb([0, 0.5, 0.082], [0, 0.4, 0.088], 0.011, 0.016, { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.003 });
      // Sunglasses: a black bar and two lenses, and arms back to the ears.
      s.box([0, 0.67, 0.103], [0.085, 0.022, 0.01], 0.01, { color: '#08080a', mat: 'glass', bone: 'head', k: 0.004 });
      s.limb([0.082, 0.672, 0.095], [0.1, 0.665, 0.01], 0.004, 0.004, { color: '#08080a', mat: 'plastic', bone: 'head', k: 0.002 });
      s.limb([-0.082, 0.672, 0.095], [-0.1, 0.665, 0.01], 0.004, 0.004, { color: '#08080a', mat: 'plastic', bone: 'head', k: 0.002 });
      // The earpiece: a curl of clear wire down into the collar.
      s.limb([0.098, 0.655, 0.0], [0.1, 0.56, -0.02], 0.004, 0.004, { color: '#d0d4dc', mat: 'plastic', bone: 'head', k: 0.002 });
      s.sphere([0.1, 0.655, 0.0], 0.008, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.002 });
    });
  },
});
