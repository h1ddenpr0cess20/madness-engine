import { cloth, hold, person } from './person.js';
import { beanie } from './metalwear.js';

/**
 * The Pause Protester: a woolly hat, a hi-vis vest over a hoodie, a
 * cardboard sign on a stick held up high with a big red PAUSE across it.
 * Has been in doubt since 2023. When in doubt, pause. About 0.9 tiles tall.
 */

const hoodie = cloth('#5a6a8a', '#3c4862');
const vest = cloth('#e8f04a', '#b8c02a');

export default person({
  name: 'pauser',
  scale: 1.44,
  b: 1.0,
  shape: { legs: 1.04, girth: 0.9, head: 1.02 },
  skin: '#e2b08c',
  look: { torso: vest, sleeve: hoodie, cuff: '#e2b08c', legs: cloth('#2a3040'), boot: '#e8e4d8', sole: '#c8c4b8' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#4a3220', mood: 1, blush: 0.3 },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sign up, bobbing to the chant.
      hold(k, 'armR', -2.6 + Math.sin(T * 5) * 0.12, 0, -0.3); hold(k, 'foreR', -0.3, 0, 0);
      k.turn('head', -0.08, Math.sin(T * 1.1) * 0.15, 0);
    },
  },
  extras(s, J) {
    beanie(s, { color: '#d85a2a' });
    s.part('kit', () => {
      // Reflective bands on the vest.
      s.torus([0, 0.4, 0.002], 0.085, 0.007, { color: '#e8e8e4', mat: 'cloth', bone: 'spine', k: 0.002 });
      // The sign: a board on a stick, PAUSE as two red bars.
      const h = J.handR;
      const at = [h[0], h[1] + 0.3, h[2]];
      s.limb([h[0], h[1] - 0.03, h[2]], [at[0], at[1] + 0.08, at[2]], 0.005, 0.005, { color: '#8a6a42', mat: 'leather', bone: 'handR', k: 0.002 });
      s.box(at, [0.13, 0.095, 0.006], 0.003, { color: '#f4f0e6', mat: 'paper', bone: 'handR', k: 0.002 });
      s.paint((p) => Math.max(Math.abs(Math.abs(p[0] - at[0]) - 0.036) - 0.02, Math.abs(p[1] - at[1]) - 0.06, Math.abs(p[2] - at[2]) - 0.03), '#d81c2a', 0.004);
    });
  },
});
