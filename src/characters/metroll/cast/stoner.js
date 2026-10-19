import { cloth, hold, person } from './person.js';
import { beanie } from './metalwear.js';

/**
 * The Stoner: a hooded top the colour of a swamp, a beanie, jeans with the
 * knees gone, bare feet in sandals, red eyes at half mast, a beard that
 * has not been told, and a joint the size of a carrot. Has been on this
 * couch since the last record, and is going to get up in a minute. About
 * 0.95 tiles tall, and slow to turn round.
 */

const HOODIE = cloth('#4a5a3a', '#2e3a24');

export default person({
  name: 'stoner',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 0.96, girth: 1.1 },
  belly: 0.5,
  skin: '#d8a888',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: cloth('#4a68a0', '#2e4470'), boot: '#d8a888', sole: '#6a4a2a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'skin' },
  face: { eyeColor: '#b84a3a', brow: '#3a2a18', mood: -1, blush: 0.4 },
  hair: { color: cloth('#4a3418', '#2a1c0c'), locks: [[[0.08, 0.7, -0.02], [0.1, 0.6, -0.06], 0.03, 0.5], [[-0.08, 0.7, -0.02], [-0.1, 0.6, -0.06], 0.03, 0.5]], cap: [0.104, 0.05, 0.104] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A slow sway, one hand up at the mouth with the joint in it, the head heavy, the other hand dangling.
      hold(k, 'armR', -1.55, 0.3, -0.25); hold(k, 'foreR', -2.0, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.1); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('hips', 0, Math.sin(T * 0.7) * 0.1, Math.sin(T * 0.5) * 0.04);
      k.turn('head', 0.25 + Math.sin(T * 0.9) * 0.06, Math.sin(T * 0.4) * 0.2, Math.sin(T * 0.6) * 0.08);
    },
  },
  extras(s, J) {
    beanie(s, { color: '#6a3a2a', fold: '#d8b050' });
    s.part('kit', () => {
      // The beard, and the joint: a white tube with a glowing end.
      s.ellipsoid([0, 0.6, 0.08], [0.07, 0.05, 0.045], { color: '#4a3418', mat: 'hair', bone: 'head', k: 0.02 });
      const h = J.handR;
      s.limb([h[0], h[1] + 0.03, h[2] + 0.01], [h[0] + 0.01, h[1] + 0.09, h[2] + 0.05], 0.007, 0.006, { color: '#f4f0e0', mat: 'cloth', bone: 'handR', k: 0.002 });
      s.sphere([h[0] + 0.012, h[1] + 0.093, h[2] + 0.053], 0.007, { color: '#ff6a2a', mat: 'glow', bone: 'handR', k: 0.001 });
    });
  },
});
