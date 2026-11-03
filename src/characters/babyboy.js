import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Baby Boy: a year old, in a pale blue romper with short sleeves and legs,
 * bare feet, big eyes, a wisp of hair, and a wobble. Carries nothing. About 0.4
 * of a grown person's height.
 */

const ROMPER = cloth('#8ab8e4', '#6a98c4');
const SKIN = '#f2c8a8';

export default child('baby', {
  name: 'babyboy',
  skin: SKIN,
  look: { torso: ROMPER, sleeve: ROMPER, cuff: SKIN, legs: ROMPER, shin: 'skin', shorts: 0.5, boot: SKIN },
  mats: { cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#5a7a9a', brow: '#d8b890', blush: 0.9 },
  hair: { color: cloth('#d8b070', '#a88040'), at: [0, 0.76, 0.01], cap: [0.05, 0.026, 0.05], locks: [] },
});
