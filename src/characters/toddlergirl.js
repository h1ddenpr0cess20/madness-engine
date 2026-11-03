import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Toddler Girl: two, in a yellow dress, white tights and little pink
 * shoes, dark hair in two small bunches. Carries nothing. About 0.47 of a
 * grown person's height.
 */

const DRESS = cloth('#f2d058', '#c8a638');
const HAIR = cloth('#3a2418', '#1e1008');
const SKIN = '#c98d62';

export default child('toddler', {
  name: 'toddlergirl',
  skin: SKIN,
  belly: 0,
  look: { torso: DRESS, sleeve: DRESS, cuff: SKIN, legs: DRESS, shin: '#f4f4f0', skirt: { hem: 0.2, flare: 1.25 }, boot: '#f08ab0', sole: '#c8607e' },
  mats: { cuff: 'skin', boot: 'rubber' },
  face: { eyeColor: '#2e1c10', brow: '#1e1008', blush: 0.8 },
  hair: { color: HAIR, cap: [0.108, 0.092, 0.108], front: 0.075 },
  extras(s) {
    // Two small bunches, one each side of the head, a red band round each.
    for (const m of [1, -1]) {
      s.part('hair', () => s.chain([[m * 0.09, 0.76, -0.02], [m * 0.125, 0.745, -0.03], [m * 0.14, 0.7, -0.03]], [0.026, 0.024, 0.02], { color: HAIR, mat: 'hair', bone: 'head', k: 0.008 }));
      s.part('kit', () => s.torus([m * 0.098, 0.757, -0.022], 0.014, 0.006, { color: '#e04a5a', mat: 'cloth', bone: 'head', k: 0.002, rot: [0, 0, 1.2 * m] }));
    }
  },
});
