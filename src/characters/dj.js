import { cloth, person, strap } from './person.js';
import { headphones } from './wardrobe.js';
import { beanie } from './metalwear.js';

/**
 * The DJ: a beanie, big headphones with one ear off, a hooded top, jeans,
 * a stubble that is a decision, and a pair of turntables carried at the
 * waist on a strap, scratched at all times. Was hired for a metal show
 * and is playing what he likes. It is going down about as well as it
 * sounds. About 0.95 tiles tall, and wanting a moment of your time.
 */

const HOOD = cloth('#4a4a58', '#2e2e3a');

export default person({
  name: 'dj',
  scale: 1.48,
  b: 1.02,
  shape: { legs: 1.0, girth: 1.0 },
  skin: '#c89070',
  look: { torso: HOOD, sleeve: HOOD, cuff: HOOD, legs: cloth('#3a5890', '#243a64'), boot: '#e8e4d8', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'plastic' },
  face: { eyeColor: '#2a1a10', brow: '#1a1008', mood: 1 },
  style: {
    attack: 'swing',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const s = Math.sin(T * 7);
      // Both hands over the decks and scratching: back and forth, the head nodding hard to a beat of its own.
      reach?.(k, 'R', 'chest', [-0.072 + s * 0.012, 0.432, 0.17]);
      reach?.(k, 'L', 'chest', [0.072, 0.432, 0.165 + s * 0.008]);
      k.turn('head', 0.2 + Math.abs(s) * 0.1, 0, Math.sin(T * 3.5) * 0.1);
    },
  },
  extras(s) {
    beanie(s, { color: '#16161a', fold: '#e8202a' });
    headphones(s, { color: '#1a1a1e', pad: '#2a2a30' });
    s.part('kit', () => {
      // The decks, slung on the chest just under the hands: a slab, two platters, a mixer in the middle.
      s.box([0, 0.385, 0.165], [0.125, 0.016, 0.07], 0.006, { color: '#1a1a1e', mat: 'plastic', bone: 'chest', k: 0.003 });
      for (const m of [1, -1]) s.cylinder([m * 0.072, 0.403, 0.165], 0.042, 0.004, { color: '#08080a', mat: 'plastic', bone: 'chest', k: 0.001 });
      for (const m of [1, -1]) s.cylinder([m * 0.072, 0.408, 0.165], 0.012, 0.002, { color: '#e8202a', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.box([0, 0.402, 0.165], [0.016, 0.005, 0.05], 0.002, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001 });
    });
    // Its strap: from each back corner up over the neck, lying on the hoodie.
    strap(s, [[0.11, 0.392, 0.1], [0.06, 0.47, 0.075], [0.03, 0.552, 0.02], [0, 0.556, -0.04], [-0.03, 0.552, 0.02], [-0.06, 0.47, 0.075], [-0.11, 0.392, 0.1]], { width: 0.012, thick: 0.0035, color: '#16161a', mat: 'cloth', over: ['top', 'head'], bone: 'chest' });
  },
});
