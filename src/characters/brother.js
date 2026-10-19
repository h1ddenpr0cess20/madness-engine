import { bands } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';

/**
 * Little Brother: eight years old, a striped shirt, shorts, scuffed trainers,
 * and a plastic recorder he knows two notes on. Small and quick, and very
 * annoying. About 0.55 tiles tall.
 */

const stripes = bands(1, 0.05, '#d9433a', '#f2eee4', 0.5, 0.15);

export default person({
  name: 'brother',
  scale: 1.0,
  b: 0.92,
  shape: { head: 1.12, legs: 0.86, torso: 0.94 },
  skin: '#f0bd98',
  look: { torso: stripes, sleeve: stripes, cuff: '#f0bd98', legs: cloth('#2e5fa8'), boot: '#f0bd98' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'skin' },
  face: { eyeColor: '#4a7a3a', brow: '#5a3a1e', blush: 0.4, jaw: 1.08 },
  hair: {
    color: cloth('#6b4423', '#4a2e16'),
    locks: [
      [[0.03, 0.78, 0.0], [0.07, 0.8, 0.07], 0.03], [[-0.04, 0.78, 0.02], [-0.08, 0.81, 0.08], 0.03],
      [[0.0, 0.79, -0.04], [0.02, 0.83, -0.02], 0.028], [[-0.06, 0.76, -0.02], [-0.1, 0.79, 0.01], 0.026],
    ],
  },
  style: { attack: 'thrust', twist: 0 },
  extras(s, J) {
    // Trainers over the boots: white, with a red toe cap.
    for (const m of [1, -1]) {
      const a = J[m > 0 ? 'ankleL' : 'ankleR'];
      s.part('kit', () => {
        s.ellipsoid([a[0], 0.028, a[2] + 0.032], [0.036, 0.034, 0.066], { color: '#f4f4f4', mat: 'rubber', bone: m > 0 ? 'footL' : 'footR', k: 0.01 });
        s.ellipsoid([a[0], 0.022, a[2] + 0.075], [0.028, 0.024, 0.03], { color: '#d9433a', mat: 'rubber', bone: m > 0 ? 'footL' : 'footR', k: 0.006 });
      });
    }
    // The recorder: a brown plastic pipe in the right hand, with holes down it.
    const h = J.handR;
    s.part('kit', () => {
      s.limb([h[0], h[1] + 0.02, h[2] - 0.05], [h[0], h[1] + 0.01, h[2] + 0.2], 0.014, 0.011, { color: '#6a3e1e', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.limb([h[0], h[1] + 0.02, h[2] + 0.2], [h[0], h[1] + 0.012, h[2] + 0.215], 0.011, 0.014, { color: '#e8e0d0', mat: 'plastic', bone: 'handR', k: 0.002 });
    });
    for (let i = 0; i < 5; i++) s.paint((p) => Math.hypot(p[0] - h[0], p[1] - (h[1] + 0.025), p[2] - (h[2] + 0.04 + i * 0.026)) - 0.0065, '#1a0e06', 0.002);
  },
});
