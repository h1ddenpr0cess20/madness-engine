import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Teen Boy: fifteen and all arms and legs, in a navy T-shirt, black
 * jeans, white trainers and a long fringe he keeps flicking out of his eyes.
 * Carries nothing. About 0.88 of a grown person's height.
 */

const TEE = cloth('#2e3e72', '#1e2850');
const JEANS = cloth('#26262c', '#141418');
const SKIN = '#e0aa84';

export default child('teen', {
  name: 'teenboy',
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#f4f4f0', sole: '#c8c8c4' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#4a3a22', brow: '#3a2414', blush: 0.3 },
  hair: {
    color: cloth('#3a2414', '#1e1008'),
    cap: [0.11, 0.1, 0.11],
    // A long side-swept fringe, and the sides and back grown out over the ears and the collar.
    locks: [[[0.04, 0.79, 0.03], [0.08, 0.72, 0.1], 0.04, 0.5], [[-0.01, 0.8, 0.04], [0.03, 0.735, 0.108], 0.036, 0.5], [[0.09, 0.75, -0.01], [0.108, 0.66, -0.03], 0.03, 0.5], [[-0.09, 0.75, -0.01], [-0.108, 0.66, -0.03], 0.03, 0.5], [[0, 0.78, -0.07], [0, 0.66, -0.12], 0.05, 0.5]],
  },
});
