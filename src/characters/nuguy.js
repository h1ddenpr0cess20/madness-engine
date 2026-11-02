import { cloth, cord, hold, onBody, person } from './person.js';
import { baseballCap, chestPrint } from './metalwear.js';

/**
 * The Nu Guy: a red cap on backwards, a goatee, an XXXL orange jersey, cargo
 * shorts down to the shins with a chain hanging off them, white trainers,
 * and a gaze of absolute, unfocused menace. Rolls his shoulders. Hates
 * everybody equally, and most of all himself, in a way he will be
 * explaining to you at length. Wants to break stuff. Would like to be
 * asked what. About 1.0 tiles tall, and wide.
 */

const JERSEY = cloth('#ff7a1a', '#c85a10');

export default person({
  name: 'nuguy',
  scale: 1.54,
  b: 1.1,
  shape: { legs: 0.96, torso: 1.1, girth: 1.18 },
  belly: 0.5,
  skin: '#e0a888',
  look: { torso: JERSEY, sleeve: JERSEY, cuff: '#e0a888', legs: cloth('#8a8660', '#5c5a40'), boot: '#f4f2ee', sole: '#d8d8dc', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a3a3a', brow: '#2a1c12', mood: -1, blush: 0.4 },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.sin(T * 5);
      // Fists balled, arms out from the sides, rolling the shoulders on the beat, the head bobbing and the chin down.
      hold(k, 'armR', -0.3, 0, -0.7 + b * 0.1); hold(k, 'foreR', -0.8, 0, 0);
      hold(k, 'armL', -0.3, 0, 0.7 - b * 0.1); hold(k, 'foreL', -0.8, 0, 0);
      k.turn('chest', 0, b * 0.18, 0);
      k.turn('head', 0.2 + Math.abs(b) * 0.1, -b * 0.15, 0);
      k.turn('thighL', 0, 0, 0.12); k.turn('thighR', 0, 0, -0.12);
    },
  },
  extras(s) {
    baseballCap(s, { color: '#d8202a', back: true });
    chestPrint(s, 'x', '#16161a', { y: 0.46, size: 0.05 });
    // The goatee.
    const chin = onBody(s, [0, 0.592, 0.1], ['head']);
    s.part('hair', () => s.ellipsoid(chin.p.map((v, i) => v + chin.n[i] * 0.004), [0.02, 0.022, 0.01], { color: '#2a1c12', mat: 'hair', bone: 'head', k: 0.004 }));
    // The wallet chain: from a belt loop at the front, down the side of the leg in a loop, up to the back pocket.
    const pts = onBody(s, [[0.075, 0.335, 0.075], [0.11, 0.27, 0.04], [0.118, 0.235, -0.005], [0.105, 0.26, -0.05], [0.075, 0.32, -0.075]], ['bottoms', 'belt']);
    s.part('kit', () => cord(s, pts.map((h) => h.p.map((v, i) => v + h.n[i] * 0.006)), 0.0032, { color: '#c8ccd4', mat: 'metal', bone: 'hips', bump: [0.0012, 400] }));
  },
});
