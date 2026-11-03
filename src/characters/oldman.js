import { cloth, person } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Old Man: nobody in particular, just old. A green knitted cardigan over
 * a cream shirt, grey slacks on a brown belt, polished brown shoes, thin
 * white hair round the sides and back of a bald crown, a little stooped and
 * slow on his feet. Carries nothing, so he will do for any game. About 0.88
 * tiles tall.
 */

const CARDIGAN = cloth('#5a6e5c', '#3e4e40', { freq: 30, grain: 0.06 });
const SLACKS = cloth('#85807a', '#66625c');
const WHITE = cloth('#e4e4e0', '#bcbcb8');

export default person({
  name: 'oldman',
  scale: 1.32,
  b: 0.96,
  shape: { legs: 0.96, girth: 0.98, head: 1.02 },
  belly: 0.6,
  skin: '#e6b79a',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: SLACKS, boot: '#4a2e18', sole: '#221208', belt: '#2a1a10', buckle: '#a8a8a8' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#6a8aa8', brow: '#d8d8d4', jaw: 0.98, blush: 0.25 },
  // A bald crown with a ring of white round the sides and back, and a lock over each ear.
  hair: {
    color: WHITE,
    at: [0, 0.665, -0.03],
    cap: [0.108, 0.05, 0.104],
    locks: [[[0.095, 0.68, 0.0], [0.105, 0.63, -0.03], 0.026, 0.5], [[-0.095, 0.68, 0.0], [-0.105, 0.63, -0.03], 0.026, 0.5]],
  },
  style: {
    attack: 'shove', heavy: 0.5,
    after(k, { clip }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      // Stooped, the head held up out of it.
      k.turn('spine', 0.1, 0, 0);
      k.turn('chest', 0.07, 0, 0);
      k.turn('head', -0.14, 0, 0);
    },
  },
  extras(s) {
    // The cardigan open over a cream shirt and its collar.
    suitFront(s, { shirt: '#ece6d6', tie: null, low: 0.44, belly: 0.6, b: 0.96 });
  },
});
