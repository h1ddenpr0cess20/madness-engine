import { bag, cloth, hold, person } from './person.js';
import { beanie, hoodDown } from './metalwear.js';
import { beard } from './wardrobe.js';

/**
 * The Stoner: a hooded top the colour of a swamp, a beanie, jeans with the
 * knees gone, bare feet in sandals, red eyes at half mast, a beard that
 * has not been told, and a joint the size of a carrot. Has been on this
 * couch since the last record, and is going to get up in a minute. About
 * 0.95 tiles tall, and slow to turn round.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const HOODIE = cloth('#4a5a3a', '#2e3a24');

export default person({
  name: 'stoner',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 0.96, girth: 1.1 },
  belly: 0.5,
  skin: '#d8a888',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: cloth('#4a68a0', '#2e4470'), boot: '#d8a888', sole: '#6a4a2a', sandals: '#3a2a1a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'skin' },
  face: { eyeColor: '#b84a3a', brow: '#3a2a18', mood: -1, blush: 0.4 },
  hair: { color: cloth('#4a3418', '#2a1c0c'), locks: [[[0.08, 0.7, -0.02], [0.1, 0.6, -0.06], 0.03, 0.5], [[-0.08, 0.7, -0.02], [-0.1, 0.6, -0.06], 0.03, 0.5]], cap: [0.104, 0.05, 0.104] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A slow sway, both hands deep in the hoodie's pocket, the joint in the corner of his mouth, the head heavy.
      hold(k, 'armR', -0.2, 0, 0.1); hold(k, 'foreR', -1.0, 0, 0);
      hold(k, 'armL', -0.2, 0, -0.1); hold(k, 'foreL', -1.0, 0, 0);
      reach?.(k, 'R', 'spine', [-0.03, 0.355, 0.1]);
      reach?.(k, 'L', 'spine', [0.03, 0.355, 0.1]);
      k.turn('hips', 0, Math.sin(T * 0.7) * 0.1, Math.sin(T * 0.5) * 0.04);
      k.turn('head', 0.25 + Math.sin(T * 0.9) * 0.06, Math.sin(T * 0.4) * 0.2, Math.sin(T * 0.6) * 0.08);
    },
  },
  extras(s) {
    beanie(s, { color: '#6a3a2a', fold: '#d8b050' });
    beard(s, { color: '#4a3418', long: 0.35 });
    hoodDown(s, { color: HOODIE });
    bag(s, [0, 0.355, 0.09], { size: [0.065, 0.032, 0.005], color: HOODIE, flap: false, over: ['top'], keep: TRUNK, bone: 'spine' });
    // The joint, hanging from the corner of his mouth, its end glowing.
    s.part('fine', () => {
      s.limb([-0.022, 0.607, 0.104], [-0.04, 0.592, 0.15], 0.0045, 0.004, { color: '#f4f0e0', mat: 'paper', bone: 'head', k: 0.001 });
      s.sphere([-0.0405, 0.5915, 0.1515], 0.0046, { color: '#ff6a2a', mat: 'glow', bone: 'head', k: 0.001 });
    });
  },
});
