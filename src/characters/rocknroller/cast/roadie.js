import { cloth, person } from './person.js';

/**
 * The Roadie: black shirt, cargo trousers, a red bandana, a headset with
 * the little microphone, a roll of gaff tape on the belt and a big torch
 * in his hand. He has seen worse. He has taped worse. About 0.95 tiles.
 */

const black = cloth('#1c1c22', '#0a0a0e');
const cargo = cloth('#4a4a3a', '#2e2e22');

export default person({
  name: 'roadie',
  scale: 1.45,
  b: 1.2,
  shape: { legs: 0.92, girth: 1.18 },
  belly: 1.1,
  skin: '#c88c6a',
  look: { torso: black, sleeve: black, cuff: '#c88c6a', legs: cargo, boot: black },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#1e1209', mood: 1 },
  style: { attack: 'smite', heavy: 0.5, twist: 0 },
  extras(s, J) {
    s.part('kit', () => {
      // The bandana, knotted at the back, and the headset round it.
      s.ellipsoid([0, 0.715, 0.0], [0.108, 0.058, 0.108], { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.7, -0.1], [0.03, 0.64, -0.17], [0, 1, 0], 0.03, 0.02, 0.2, { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.006 });
      s.torus([0, 0.68, 0], 0.108, 0.006, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.003, rot: [0, 0, Math.PI / 2], arc: 0.5 });
      s.limb([0.1, 0.66, 0.0], [0.05, 0.615, 0.095], 0.005, 0.005, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.003 });
      s.sphere([0.05, 0.615, 0.098], 0.009, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.003 });
      // A roll of gaff tape and a ring of keys on the belt.
      s.torus([-0.1, 0.33, 0.04], 0.026, 0.014, { color: '#b8bcc4', mat: 'metal', bone: 'hips', k: 0.004, rot: [0, 0, Math.PI / 2] });
      s.torus([0.1, 0.32, 0.05], 0.016, 0.004, { color: '#d6d9e0', mat: 'metal', bone: 'hips', k: 0.002 });
      // A lanyard and pass.
      s.box([0, 0.43, 0.082], [0.02, 0.026, 0.003], 0.003, { color: '#ff2d95', mat: 'plastic', bone: 'chest', k: 0.002 });
      // The torch: a long black cylinder in the right hand.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.01, h[2] - 0.05], [h[0], h[1] + 0.0, h[2] + 0.17], 0.02, 0.026, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.cylinder([h[0], h[1] + 0.0, h[2] + 0.18], 0.032, 0.012, { color: '#2a2a30', mat: 'metal', bone: 'handR', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    });
  },
});
