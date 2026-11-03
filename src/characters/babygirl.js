import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Baby Girl: a year old, in a pink dress with short sleeves, bare feet, big
 * eyes, a wisp of dark hair, and a wobble. Carries nothing. About 0.4 of a
 * grown person's height.
 */

const DRESS = cloth('#f0a0c0', '#c87898');
const SKIN = '#e8b896';

export default child('baby', {
  name: 'babygirl',
  skin: SKIN,
  belly: 0,
  look: { torso: DRESS, sleeve: DRESS, cuff: SKIN, legs: DRESS, skirt: { hem: 0.2, flare: 1.25 }, boot: SKIN },
  mats: { cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#4a3220', brow: '#3a2414', blush: 0.9 },
  hair: { color: cloth('#4a3020', '#2a1a10'), at: [0, 0.76, 0.01], cap: [0.052, 0.028, 0.052], locks: [] },
});
