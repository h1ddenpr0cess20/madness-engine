import { cloth, hold, person } from './person.js';
import { baseballCap } from './metalwear.js';

/**
 * The Merch Guy: a hoodie, a lanyard with a laminated card he is very proud
 * of, a cap, and a stack of folded T-shirts held out in both arms. Fifty
 * quid. For a T-shirt. The band gets four. About 0.85 tiles tall.
 */

const SHIRTS = ['#e8202a', '#101014', '#f4f0e8', '#3a3a44', '#6a1fb8'];

export default person({
  name: 'merchguy',
  scale: 1.4,
  b: 1.02,
  shape: { legs: 0.98, girth: 1.0, head: 1.0 },
  belly: 0.4,
  skin: '#e0b090',
  look: { torso: cloth('#4a4e58', '#2c2e36'), sleeve: cloth('#4a4e58', '#2c2e36'), cuff: cloth('#4a4e58', '#2c2e36'), legs: cloth('#1e222c', '#12141a'), boot: '#d8d4cc', sole: '#f0ece4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#4a3a2a', brow: '#2a1c12', mood: 0, blush: 0.4 },
  hair: { color: cloth('#2a1c12', '#160e08'), locks: [], cap: [0.108, 0.098, 0.108] },
  style: {
    attack: 'shove',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The stack held out in front, offered, bobbing a little: buy one.
      hold(k, 'armR', -0.15, 0, 0.25); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -0.15, 0, -0.25); hold(k, 'foreL', -1.1, 0, 0);
      k.turn('head', Math.sin(T * 0.7) * 0.05, Math.sin(T * 0.4) * 0.2, 0);
      k.move('hips', 0, Math.abs(Math.sin(T * 3)) * 0.004, 0);
    },
  },
  extras(s) {
    baseballCap(s, { color: '#101014' });
    s.part('kit', () => {
      // The T-shirts, folded and stacked in front of him on both forearms.
      SHIRTS.forEach((c, i) => s.box([0, 0.39 + i * 0.019, 0.135], [0.085 - (i % 2) * 0.004, 0.0095, 0.06], 0.005, { color: c, mat: 'cloth', bone: 'chest', k: 0.002 }));
      // The lanyard, and the laminated card.
      s.limb([-0.03, 0.54, 0.04], [0, 0.44, 0.08], 0.004, 0.004, { color: '#e8202a', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.limb([0.03, 0.54, 0.04], [0, 0.44, 0.08], 0.004, 0.004, { color: '#e8202a', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([0, 0.425, 0.084], [0.018, 0.024, 0.003], 0.002, { color: '#f4f2ee', mat: 'plastic', bone: 'chest', k: 0.001 });
    });
  },
});
