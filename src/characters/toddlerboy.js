import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Toddler Boy: two, in a green T-shirt, jeans and little white trainers,
 * a short brown crop, and always about to fall over or run off. Carries
 * nothing. About 0.47 of a grown person's height.
 */

const TEE = cloth('#6cae6c', '#4a8a4a');
const JEANS = cloth('#4a6a9a', '#34507a');
const SKIN = '#ecb892';

export default child('toddler', {
  name: 'toddlerboy',
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#f4f4f0', sole: '#c8c8c4' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#6a4a2a', brow: '#5a3a1e', blush: 0.8 },
  hair: { color: cloth('#6a4424', '#46280f'), cap: [0.108, 0.09, 0.108], locks: [[[0.03, 0.78, 0.04], [0.05, 0.75, 0.1], 0.03, 0.5], [[-0.04, 0.78, 0.03], [-0.06, 0.75, 0.1], 0.03, 0.5]] },
});
