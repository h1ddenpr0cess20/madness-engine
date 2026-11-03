import { cloth, person } from './person.js';
import { beard, moustache } from './wardrobe.js';

/**
 * The Bald Guy: no hair on top and plenty on his chin, a charcoal T-shirt,
 * blue jeans and tan work boots. The sort of man who is helping you move
 * house. Carries nothing, so he will do for any game. About 0.95 tiles tall.
 */

const TEE = cloth('#3a3d44', '#24262c');
const JEANS = cloth('#40608c', '#2c4468');
const SKIN = '#d6a07a';

export default person({
  name: 'baldguy',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 1.0, torso: 1.02, girth: 1.1 },
  belly: 0.5,
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#8a6a44', sole: '#2a2018', tuck: false },
  mats: { cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#4a3220', brow: '#2e2016', jaw: 1.06, blush: 0.4 },
  style: { attack: 'punch' },
  extras(s) {
    const HAIR = '#2e2016';
    beard(s, { color: HAIR, long: 0.3, thick: 0.008 });
    moustache(s, { color: HAIR, wide: 1.1 });
  },
});
