import { cloth, hold, person } from './person.js';
import { battleVest, longHair } from './metalwear.js';

/**
 * The Crowd Surfer: on his back across the hands of the crowd, arms spread,
 * eyes shut, denim vest, one sneaker gone. Carried round the room over
 * everyone's heads, and a flyer for it. About 0.9 tiles long.
 */

export default person({
  name: 'crowdsurfer',
  scale: 1.4,
  b: 1.04,
  shape: { legs: 1.04, girth: 0.96, head: 1.0 },
  skin: '#e0b090',
  look: { torso: cloth('#16161a'), sleeve: '#e0b090', cuff: '#e0b090', legs: cloth('#2a3050', '#1a2038'), boot: '#f4f2ee', sole: '#d8d4cc' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 0, blush: 0.5 },
  hair: longHair(cloth('#2a1c12', '#160e08'), { length: 1.1 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // On his back, head toward the way he is going, his middle where the model's is, rocking as the hands pass him along.
      k.turn('root', -1.4 - Math.sin(T * 1.3) * 0.06, Math.PI, Math.sin(T * 0.9) * 0.12);
      k.move('root', 0, 0.08, -0.36);
      hold(k, 'armR', -2.9, 0, -0.5); hold(k, 'armL', -2.9, 0, 0.5);
      hold(k, 'foreR', -0.2, 0, 0); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('head', -0.3, 0, 0);
    },
  },
  extras(s) {
    // A battle vest over the T-shirt, its patches on the back, on the hands below him.
    battleVest(s, { color: '#2a3650', patches: 7, seed: 4 });
  },
});
