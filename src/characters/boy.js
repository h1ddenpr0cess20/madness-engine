import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Boy: five or six, in a red T-shirt, jeans, white trainers and spiky
 * brown hair. Carries nothing. About 0.56 of a grown person's height.
 */

const TEE = cloth('#d84a3a', '#a8301f');
const JEANS = cloth('#40608c', '#2c4468');
const SKIN = '#e8b490';

export default child('child', {
  name: 'boy',
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#f4f4f0', sole: '#c0c0bc' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#4a6a3a', brow: '#4a2e18', blush: 0.6 },
  hair: {
    color: cloth('#5a3a1e', '#3a220e'),
    cap: [0.108, 0.098, 0.108],
    // A short crop, a forelock brushed across the brow, the sides and back kept short.
    locks: [[[0.03, 0.79, 0.04], [0.065, 0.745, 0.1], 0.034, 0.5], [[0.08, 0.76, 0.0], [0.1, 0.7, -0.02], 0.028, 0.5], [[-0.08, 0.76, 0.0], [-0.1, 0.7, -0.02], 0.028, 0.5]],
  },
});
