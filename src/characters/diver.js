import { cloth, hold, person } from './person.js';

/**
 * The Stage Diver: flat out across the air, head first, arms out in front like
 * Superman, off the stage and into a crowd that has stepped aside. A flyer.
 * About 0.9 tiles long.
 */

export default person({
  name: 'diver',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 1.0, girth: 0.96, head: 1.0 },
  skin: '#e0b090',
  look: { torso: cloth('#c8302a', '#8a1c18'), sleeve: '#e0b090', cuff: '#e0b090', legs: cloth('#26304a'), boot: '#f4f2ee', sole: '#d8d4cc' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 0, blush: 0.5 },
  hair: { color: cloth('#2a1c12', '#160e08'), locks: [[[0.09, 0.7, 0.0], [0.11, 0.62, -0.05], 0.03], [[-0.09, 0.7, 0.0], [-0.11, 0.62, -0.05], 0.03]], cap: [0.108, 0.098, 0.108] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // Head first, flat out, arms ahead, legs trailing behind, a wobble as he goes.
      k.turn('root', -1.45 + Math.sin(T * 1.7) * 0.05, 0, Math.sin(T * 1.2) * 0.08);
      k.move('root', 0, 0.08, -0.36);
      hold(k, 'armR', -3.0, 0, -0.1); hold(k, 'armL', -3.0, 0, 0.1);
      hold(k, 'foreR', -0.05, 0, 0); hold(k, 'foreL', -0.05, 0, 0);
      k.turn('head', 0.5, 0, 0);
      k.turn('thighL', 0.2, 0, 0.1); k.turn('thighR', 0.2, 0, -0.1);
    },
  },
});
