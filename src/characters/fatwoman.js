import { cloth, person } from './person.js';
import { longHair } from './metalwear.js';
import { suitFront } from './wardrobe.js';

/**
 * The Big Woman: warm and solid, in a teal short-sleeved top with the collar
 * open, dark stretch trousers, flat brown shoes and brown hair to the
 * shoulder with a fringe. Carries nothing, so she will do for any game.
 * About 0.9 tiles tall, and round.
 */

const TOP = cloth('#2f8f8a', '#1f6a66');
const TROUSERS = cloth('#2c3244', '#1a1e2c');
const SKIN = '#bf8458';

export default person({
  name: 'fatwoman',
  scale: 1.4,
  b: 1.1,
  shape: { legs: 0.94, girth: 1.3, hips: 1.38, head: 1.02 },
  belly: 1.3,
  skin: SKIN,
  look: { torso: TOP, sleeve: TOP, cuff: SKIN, legs: TROUSERS, boot: '#4a3022', sole: '#22140c', tuck: false },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#3e2a1a', brow: '#2a1a10', jaw: 1.12, blush: 0.7 },
  hair: longHair(cloth('#4a2e1a', '#2c1a0c'), { length: 0.6, fringe: true, thick: 1.1 }),
  style: { attack: 'shove', heavy: 0.3 },
  extras(s) {
    suitFront(s, { shirt: '#3aa09a', tie: null, low: 0.5, belly: 1.3, b: 1.1 });
  },
});
