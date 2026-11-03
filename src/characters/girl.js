import { cloth } from './person.js';
import { child } from './kids.js';

/**
 * The Girl: five or six, in a purple top, a denim skirt over white tights, pink
 * trainers and a ponytail on each side. Carries nothing. About 0.56 of a grown
 * person's height.
 */

const TOP = cloth('#8a5ac0', '#6a3a9a');
const SKIRT = cloth('#4a6a9a', '#34507a');
const HAIR = cloth('#8a5a2a', '#5a3a14');
const SKIN = '#f0c4a0';

export default child('child', {
  name: 'girl',
  skin: SKIN,
  belly: 0,
  look: { torso: TOP, sleeve: TOP, cuff: SKIN, legs: SKIRT, shin: '#f4f4f0', skirt: { hem: 0.17, flare: 1.15 }, boot: '#f088b0', sole: '#f4f4f0' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a6a4a', brow: '#5a3a14', blush: 0.6 },
  hair: { color: HAIR, cap: [0.108, 0.098, 0.108], front: 0.075 },
  extras(s) {
    // A bunch each side, a band round its root.
    for (const m of [1, -1]) {
      s.part('hair', () => s.chain([[m * 0.09, 0.755, -0.02], [m * 0.13, 0.735, -0.03], [m * 0.145, 0.67, -0.03], [m * 0.14, 0.62, -0.025]], [0.026, 0.026, 0.022, 0.012], { color: HAIR, mat: 'hair', bone: 'head', k: 0.008 }));
      s.part('kit', () => s.torus([m * 0.098, 0.752, -0.022], 0.014, 0.006, { color: '#f4e04a', mat: 'cloth', bone: 'head', k: 0.002, rot: [0, 0, 1.2 * m] }));
    }
  },
});
