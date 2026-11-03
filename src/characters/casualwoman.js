import { cloth, person } from './person.js';

/**
 * The Casual Woman: a coral T-shirt, light blue jeans, white trainers, dark
 * hair in a ponytail with a band round it. Out and about, nothing in
 * particular on her mind. Carries nothing, so she will do for any game. About
 * 0.92 tiles tall.
 */

const TEE = cloth('#d8685c', '#a8453c');
const JEANS = cloth('#5c7eac', '#3e5c88');
const HAIR = cloth('#2a1a12', '#140a06');
const SKIN = '#d4a07c';

export default person({
  name: 'casualwoman',
  scale: 1.42,
  b: 0.94,
  shape: { legs: 1.04, girth: 0.9, hips: 0.98 },
  skin: SKIN,
  look: { torso: TEE, sleeve: TEE, cuff: SKIN, legs: JEANS, boot: '#f2f2ee', sole: '#d0d0cc', tuck: false },
  mats: { cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2616', brow: '#1e120a', jaw: 0.94, blush: 0.45 },
  hair: { color: HAIR, cap: [0.108, 0.096, 0.11], front: 0.075 },
  style: { attack: 'shove' },
  extras(s) {
    // The ponytail out of the back of the head and down, a band round its root.
    s.part('hair', () => s.chain([[0, 0.735, -0.1], [0, 0.71, -0.135], [0, 0.65, -0.15], [0, 0.6, -0.14]], [0.02, 0.022, 0.018, 0.01], { color: HAIR, mat: 'hair', bone: 'head', k: 0.006 }));
    s.part('kit', () => s.torus([0, 0.728, -0.108], 0.019, 0.008, { color: '#e8e4dc', mat: 'cloth', bone: 'head', k: 0.002, rot: [1.1, 0, 0] }));
  },
});
