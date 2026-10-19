import { cloth, hold, person } from './person.js';
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
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const s = Math.sin(T * 7);
      // Both hands over the decks and scratching: back and forth, the head nodding hard to a beat of its own.
      hold(k, 'armR', -0.7, 0, -0.15); hold(k, 'foreR', -0.9, 0.8 + s * 0.2, 0);
      hold(k, 'armL', -0.7, 0, 0.15); hold(k, 'foreL', -0.9, -0.8 + s * 0.2, 0);
      k.turn('head', 0.2 + Math.abs(s) * 0.1, 0, Math.sin(T * 3.5) * 0.1);
    },
  },
  extras(s) {
    beanie(s, { color: '#16161a', fold: '#e8202a' });
    s.part('kit', () => {
      // The headphones: a band over the top, one cup on the ear, the other pushed back.
      s.torus([0, 0.7, 0], 0.112, 0.008, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.003, rot: [0, 0, Math.PI / 2] });
      s.cylinder([0.108, 0.665, 0.0], 0.034, 0.02, { color: '#2a2a30', mat: 'plastic', bone: 'head', k: 0.005, rot: [0, 0, Math.PI / 2] });
      s.cylinder([-0.108, 0.72, -0.03], 0.034, 0.02, { color: '#2a2a30', mat: 'plastic', bone: 'head', k: 0.005, rot: [0, 0, Math.PI / 2] });
      // The decks, on a strap: a slab, two platters, a mixer in the middle.
      // Slung on the chest, just under the hands.
      s.box([0, 0.385, 0.165], [0.125, 0.016, 0.07], 0.006, { color: '#1a1a1e', mat: 'plastic', bone: 'chest', k: 0.003 });
      for (const m of [1, -1]) s.cylinder([m * 0.072, 0.403, 0.165], 0.042, 0.004, { color: '#08080a', mat: 'plastic', bone: 'chest', k: 0.001 });
      for (const m of [1, -1]) s.cylinder([m * 0.072, 0.408, 0.165], 0.012, 0.002, { color: '#e8202a', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.box([0, 0.402, 0.165], [0.016, 0.005, 0.05], 0.002, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001 });
      for (const m of [1, -1]) s.limb([m * 0.1, 0.39, 0.1], [m * 0.09, 0.53, 0.0], 0.005, 0.005, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.002 });
    });
  },
});
