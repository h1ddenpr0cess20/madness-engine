import { cloth, person } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Big Guy: a heavy, friendly man in a short-sleeved blue shirt hanging
 * out over charcoal trousers, white trainers, a short thinning brown crop, a
 * round face and a belly that arrives first. Carries nothing, so he will do
 * for any game. About 0.97 tiles tall, and round.
 */

const SHIRT = cloth('#4d7aa8', '#34567e');
const TROUSERS = cloth('#44464e', '#2e3036');
const SKIN = '#e4ac88';

export default person({
  name: 'fatman',
  scale: 1.46,
  b: 1.12,
  shape: { legs: 0.92, torso: 1.06, girth: 1.32, head: 1.02 },
  belly: 1.7,
  skin: SKIN,
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SKIN, legs: TROUSERS, boot: '#f0f0ec', sole: '#b8b8b4', tuck: false },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#5a3e24', brow: '#4a3220', jaw: 1.18, blush: 0.9 },
  hair: { color: cloth('#5a3c22', '#37230f'), cap: [0.106, 0.085, 0.106], locks: [] },
  style: { attack: 'shove', heavy: 0.4 },
  extras(s) {
    // The shirt's open collar.
    suitFront(s, { shirt: '#5a86b4', tie: null, low: 0.5, belly: 1.7, b: 1.12 });
  },
});
