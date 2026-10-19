import { coat } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';

/**
 * The Angry Neighbour: a pink-faced man in a terry-cloth bathrobe and
 * slippers, a grey comb-over and a mighty moustache, who has come round at
 * eleven at night with a broom. About 0.9 tiles tall, and cross about it.
 */

const robe = coat({ over: '#9bd4c8', under: '#6aa89c', vary: 0.12, freq: 30, grain: 0.1 });
const hairy = cloth('#9a9a9a', '#6a6a6a');

export default person({
  name: 'neighbour',
  scale: 1.4,
  b: 1.12,
  shape: { legs: 0.9, girth: 1.12, head: 0.98 },
  belly: 0.7,
  skin: '#f0a58a',
  look: { torso: robe, sleeve: robe, cuff: robe, legs: '#f0a58a', boot: '#f0a58a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'skin', boot: 'skin' },
  face: { eyeColor: '#4a6a8a', brow: '#8a8a8a', blush: 0.7, mood: 1 },
  style: { attack: 'smite', heavy: 0.4, twist: 0 },
  extras(s, J) {
    const R = { color: robe, mat: 'cloth', bone: 'hips', k: 0.03 };
    // The robe: a skirt down to the shins, a rolled collar, a belt.
    s.limb([0, 0.37, 0.004], [0, 0.1, 0.01], 0.118, 0.158, R);
    s.torus([0, 0.35, 0.004], 0.115, 0.016, { color: '#ffffff', mat: 'cloth', bone: 'hips', k: 0.006 });
    s.part('kit', () => {
      s.torus([0, 0.505, 0.015], 0.062, 0.022, { color: '#ffffff', mat: 'cloth', bone: 'chest', k: 0.01, rot: [0.25, 0, 0] });
      // A tuft of grey chest hair in the V.
      s.sphere([0, 0.48, 0.07], 0.016, { color: hairy, mat: 'hair', bone: 'chest', k: 0.01 });
      // Slippers: shaggy pink.
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        s.ellipsoid([a[0], 0.032, a[2] + 0.03], [0.045, 0.036, 0.07], { color: '#ee7aa8', mat: 'cloth', bone: m > 0 ? 'footL' : 'footR', k: 0.01 });
      }
      // A comb-over, and a moustache like a pair of wings.
      s.limb([-0.05, 0.768, -0.01], [0.05, 0.76, 0.03], 0.016, 0.012, { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.03, 0.627, 0.102], [0.034, 0.012, 0.016], { color: hairy, mat: 'hair', bone: 'head', k: 0.008, rot: [0, 0, m * -0.45] });
      }
      for (const m of [1, -1]) s.ellipsoid([m * 0.11, 0.7, -0.01], [0.012, 0.03, 0.024], { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
    });
    // The broom: a long wooden handle through the right hand, a fan of straw at the end.
    const h = J.handR;
    s.part('kit', () => {
      s.limb([h[0], h[1] - 0.06, h[2] - 0.12], [h[0], h[1] + 0.02, h[2] + 0.4], 0.011, 0.011, { color: '#a07a48', mat: 'cloth', bone: 'handR', k: 0.002 });
      s.cone([h[0], h[1] + 0.02 + 0.0, h[2] + 0.4], 0.048, 0.2, { color: '#d9b45a', mat: 'cloth', bone: 'handR', k: 0.004, rot: [Math.PI / 2, 0, 0] });
      s.torus([h[0], h[1] + 0.02, h[2] + 0.395], 0.026, 0.008, { color: '#c85a3a', mat: 'cloth', bone: 'handR', k: 0.003, rot: [Math.PI / 2, 0, 0] });
    });
  },
});
