import { cloth, person } from './person.js';

/**
 * The Stage Diver: a red tank top and shorts, flat out on the air over the
 * crowd's heads, belly down, arms spread, trusting them to catch him. The
 * crowd does not trust him. About 0.9 tiles long; a flyer, so its origin is
 * its middle.
 */

export default person({
  name: 'diver',
  scale: 1.4,
  b: 1.1,
  shape: { legs: 1.04, girth: 0.92 },
  skin: '#dca480',
  look: { torso: cloth('#ff2d4a', '#b81a30'), sleeve: '#dca480', cuff: '#dca480', legs: cloth('#1a1a20'), boot: '#f4f4f4' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  hair: { color: cloth('#2a1a10', '#120a04'), locks: [[[0.05, 0.77, 0.0], [0.09, 0.8, 0.07], 0.03], [[-0.05, 0.77, 0.0], [-0.09, 0.8, 0.07], 0.03]] },
  style: {
    attack: 'flail', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // Flat out, head first and belly down, with arms out and legs kicking.
      k.turn('root', Math.PI * 0.5 + Math.sin(T * 1.6) * 0.04, 0, 0);
      k.move('root', 0, 0.0, -0.4);
      k.turn('head', -0.7, 0, 0);
      k.turn('armL', -2.4, 0, 0.5);
      k.turn('armR', -2.4, 0, -0.5);
      k.turn('foreL', -0.1, 0, 0);
      k.turn('foreR', -0.1, 0, 0);
      k.turn('thighL', -0.2 + Math.sin(T * 7) * 0.2, 0, 0.1);
      k.turn('thighR', -0.2 - Math.sin(T * 7) * 0.2, 0, -0.1);
    },
  },
});
