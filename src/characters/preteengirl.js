import { cloth, cuffBand } from './person.js';
import { child } from './kids.js';

/**
 * The Preteen Girl: the Preteen Boy's build in a teal T-shirt, jeans turned
 * up at the bottom, white trainers and a high ponytail with a band. Carries
 * nothing. About 0.7 of a grown person's height.
 */

const TEE = cloth('#3aa8a0', '#26807a');
const JEANS = cloth('#4a72a8', '#34568a');
const HAIR = cloth('#2a1a12', '#140a06');
const SKIN = '#c4906a';

export default child('preteen', {
  name: 'preteengirl',
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#f4f4f4', sole: '#d8d8d4' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a2616', brow: '#1e120a', blush: 0.4, jaw: 1.0 },
  hair: { color: HAIR, cap: [0.108, 0.098, 0.11], front: 0.075 },
  extras(s, J) {
    // The ponytail high at the back of the head, a band round its root.
    s.part('hair', () => s.chain([[0, 0.775, -0.07], [0, 0.78, -0.12], [0, 0.73, -0.15], [0, 0.66, -0.145], [0, 0.6, -0.13]], [0.024, 0.026, 0.022, 0.018, 0.01], { color: HAIR, mat: 'hair', bone: 'head', k: 0.007 }));
    s.part('kit', () => s.torus([0, 0.772, -0.074], 0.02, 0.008, { color: '#f4d040', mat: 'cloth', bone: 'head', k: 0.002, rot: [1.0, 0, 0] }));
    for (const S of ['L', 'R']) cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.84, { width: 0.026, thick: 0.0045, color: cloth('#7aa0d0', '#5a80b0'), mat: 'denim', bone: `shin${S}` });
  },
});
