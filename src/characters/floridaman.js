import { cloth, hold, person } from './person.metroll.js';
import { longHair, shades } from './metalwear.js';
import { rgb } from '../models/sdf.js';

/**
 * Florida Man: a sunburn that is mostly a rumour on the front and a fact on the
 * back, a Hawaiian shirt open to show it, a mullet, wraparound shades,
 * cargo shorts, flip-flops, and a beer held up to the sky. Has a story. It
 * is not a good story. It is about you. About 0.95 tiles tall.
 */

const HAWAII = (p) => {
  const f = Math.sin(p[0] * 110 + Math.sin(p[1] * 80) * 2) * Math.sin(p[1] * 100 + p[2] * 60);
  return f > 0.45 ? [0.9, 0.2, 0.3] : f < -0.55 ? [0.95, 0.75, 0.1] : [0.05, 0.4, 0.45];
};

/** The shirt, open all the way down the front: the sunburn in a V that widens to the belly. */
const BURN = rgb('#e88a6a');
const OPEN = (p) => (p[2] > 0.02 && Math.abs(p[0]) < 0.03 + Math.max(0, 0.53 - p[1]) * 0.3 ? BURN : HAWAII(p));

export default person({
  name: 'floridaman',
  scale: 1.48,
  b: 1.1,
  shape: { legs: 0.96, girth: 1.1, head: 1.0 },
  belly: 1.0,
  skin: '#e88a6a',
  look: { torso: OPEN, sleeve: HAWAII, cuff: '#e88a6a', legs: cloth('#8a8660', '#5c5a40'), boot: '#e88a6a', sole: '#2a6ab8', shin: 'skin' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'skin' },
  face: { eyeColor: '#3a5a8a', brow: '#d8b050', mood: 0, blush: 1.0 },
  hair: { ...longHair(cloth('#d8b050', '#a88020'), { length: 1.0 }), cap: [0.106, 0.07, 0.106] },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The beer up in the air, a toast to nobody, a sway, the other arm waving: hold my beer.
      hold(k, 'armR', -2.6 + Math.sin(T * 2.1) * 0.1, 0, -0.3); hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'armL', -0.6, 0, 0.6 + Math.sin(T * 3) * 0.3); hold(k, 'foreL', -0.4, 0, 0);
      k.turn('hips', 0, 0, Math.sin(T * 1.3) * 0.05);
      k.turn('head', -0.2, Math.sin(T * 0.7) * 0.4, 0.1);
    },
  },
  extras(s, J) {
    shades(s, { color: '#101014' });
    s.part('kit', () => {
      // The shirt's front hanging open either side, and the can in the hand.
      // The can stands up out of the raised fist: sculpted along `up`, which is straight up once the arm is.
      const h = J.handR, up = [-0.296, -0.928, 0.229];
      const at = (t) => [h[0] + up[0] * t, h[1] + up[1] * t, h[2] + up[2] * t + 0.006];
      s.limb(at(0.0), at(0.022), 0.0165, 0.0165, { color: '#d8d8dc', mat: 'metal', bone: 'handR', k: 0.002 });
      s.limb(at(0.022), at(0.06), 0.017, 0.017, { color: '#d81c2a', mat: 'metal', bone: 'handR', k: 0.002 });
      s.limb(at(0.06), at(0.08), 0.0165, 0.014, { color: '#d8d8dc', mat: 'metal', bone: 'handR', k: 0.002 });
    });
  },
});
