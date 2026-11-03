import { cloth } from './person.js';
import { child } from './kids.js';
import { hoodDown, longHair } from './metalwear.js';

/**
 * The Teen Girl: fifteen, in a lavender hooded top with the hood down, blue
 * jeans, white trainers and long brown hair worn loose. Carries nothing. About
 * 0.88 of a grown person's height.
 */

const HOODIE = cloth('#a890d0', '#7c64a8');
const JEANS = cloth('#34548a', '#243a66');

export default child('teen', {
  name: 'teengirl',
  skin: '#f0c8a8',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: JEANS, boot: '#f4f4f0', sole: '#c8c8c4', tuck: false },
  mats: { legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#4a8a5a', brow: '#4a2e18', blush: 0.35, jaw: 0.92 },
  hair: longHair(cloth('#6a4424', '#46280f'), { length: 1, fringe: true }),
  extras(s) {
    hoodDown(s, { color: HOODIE });
  },
});
