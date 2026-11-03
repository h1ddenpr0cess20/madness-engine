import { cloth, person } from './person.js';
import { hoodDown } from './metalwear.js';

/**
 * The Hoodie Guy: twenty-something, in a gray hooded top with the hood down,
 * dark jeans and white trainers, messy brown hair that has not met a comb
 * today. Carries nothing, so he will do for any game. About 0.95 tiles tall.
 */

const HOODIE = cloth('#8c9098', '#5e626a');
const JEANS = cloth('#2e3c5a', '#1e2840');

export default person({
  name: 'hoodieguy',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.04, girth: 0.98 },
  skin: '#f0c4a4',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: JEANS, boot: '#f2f2ee', sole: '#c4c4c0', tuck: false },
  mats: { legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#6a5a2a', brow: '#4a3020', jaw: 0.98, blush: 0.35 },
  hair: {
    color: cloth('#5a3a20', '#35200f'),
    cap: [0.108, 0.1, 0.108],
    locks: [[[0.03, 0.78, 0.04], [0.05, 0.74, 0.11], 0.034, 0.5], [[-0.04, 0.78, 0.03], [-0.07, 0.74, 0.1], 0.03, 0.5], [[0.09, 0.73, 0.0], [0.108, 0.66, -0.02], 0.03, 0.5], [[-0.09, 0.73, 0.0], [-0.108, 0.66, -0.02], 0.03, 0.5]],
  },
  style: { attack: 'punch' },
  extras(s) {
    hoodDown(s, { color: HOODIE });
  },
});
