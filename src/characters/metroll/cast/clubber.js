import { cloth, hold, person } from './person.js';
import { shades } from './metalwear.js';

/**
 * The Clubber: black, all of it: a black tee, black jeans, black boots, a
 * leather harness over the tee for no reason anybody has explained, a
 * shaved head, a shaved everything else, a face the colour of a basement
 * and sunglasses, at night, indoors, with the lights off. Has been in this
 * queue since Thursday and does not mean to leave it. About 0.95 tiles
 * tall, and swaying to a beat only it can hear.
 */

const BLACK = cloth('#16161a', '#08080a');

export default person({
  name: 'clubber',
  scale: 1.5,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.86 },
  skin: '#e0d4cc',
  look: { torso: BLACK, sleeve: BLACK, cuff: '#e0d4cc', legs: BLACK, boot: '#0c0c10', sole: '#2a2a30', belt: '#1a1a1e', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a2a30', brow: '#2a2a2a', mood: -1, blush: 0 },
  style: {
    attack: 'slash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.sin(T * 4);
      // The beat from somewhere else: a slow nod, the shoulders going, one hand on the chest and the other hanging.
      hold(k, 'armR', -0.7, 0.2, -0.2); hold(k, 'foreR', -1.4, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.15); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('head', 0.1 + b * 0.08, Math.sin(T * 0.4) * 0.1, 0);
      k.turn('chest', 0, 0, b * 0.05);
    },
  },
  extras(s) {
    shades(s, { color: '#08080a' });
    s.part('kit', () => {
      // The harness: straps over each shoulder crossing in a ring in the middle, a strap round the waist.
      const L = { color: '#1e1e22', mat: 'leather', bone: 'chest', k: 0.003 };
      s.limb([0.075, 0.54, 0.02], [0, 0.44, 0.08], 0.01, 0.01, L);
      s.limb([-0.075, 0.54, 0.02], [0, 0.44, 0.08], 0.01, 0.01, L);
      s.limb([0, 0.44, 0.08], [0, 0.36, 0.076], 0.009, 0.009, L);
      s.torus([0, 0.44, 0.088], 0.02, 0.004, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
      s.torus([0, 0.34, 0.0], 0.09, 0.008, { color: '#1e1e22', mat: 'leather', bone: 'hips', k: 0.003 });
    });
  },
});
