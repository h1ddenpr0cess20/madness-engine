import { bands } from '../models/skins.js';
import { cloth, cuffBand, person } from './person.js';

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
  look: { torso: stripes, sleeve: stripes, cuff: '#f0bd98', legs: cloth('#2e5fa8'), boot: '#f4f4f4', sole: '#f4f4f4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#4a7a3a', brow: '#5a3a1e', blush: 0.4, jaw: 1.08 },
  hair: {
    color: cloth('#6b4423', '#4a2e16'),
    // A mop, tousled forward over the brow and down over the ears.
    locks: [
      [[0.03, 0.78, 0.02], [0.065, 0.735, 0.09], 0.032], [[-0.04, 0.78, 0.03], [-0.07, 0.732, 0.095], 0.03], [[0.0, 0.79, 0.04], [0.012, 0.742, 0.104], 0.034],
      [[0.08, 0.75, -0.02], [0.104, 0.69, -0.035], 0.028], [[-0.08, 0.75, -0.02], [-0.104, 0.69, -0.035], 0.028], [[0, 0.78, -0.07], [0, 0.69, -0.11], 0.04],
    ],
  },
  style: { attack: 'thrust', twist: 0 },
  extras(s, J, { pose }) {
    // Trainers: white, a red toe cap on each.
    s.paint((p) => Math.max(p[1] - 0.045, Math.abs(Math.abs(p[0]) - 0.06) - 0.034, 0.058 - p[2] + Math.abs(p[0]) * 0), '#d9433a', 0.004);
    // The jeans turned up at the bottom.
    for (const S of ['L', 'R']) cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.84, { width: 0.026, thick: 0.0045, color: cloth('#5a86c8', '#3a66a8'), mat: 'denim', bone: `shin${S}` });
    // The recorder: brown plastic, through the fist, its mouthpiece up past the thumb and its holes down the front.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.11), G.at(0.09), 0.0105, 0.0125, { color: '#6a3e1e', mat: 'plastic', k: 0.002 });
      s.limb(G.at(0.09), G.at(0.115), 0.0125, 0.009, { color: '#e8e0d0', mat: 'plastic', k: 0.002 });
      s.limb(G.at(-0.115), G.at(-0.13), 0.0118, 0.0135, { color: '#6a3e1e', mat: 'plastic', k: 0.002 });
    }));
    for (let i = 0; i < 5; i++) {
      const c = G.at(-0.035 - i * 0.016, 0, 0.011);
      pose.hold(s, 'handR', () => s.part('fine', () => s.sphere(c, 0.0036, { color: '#1a0e06', mat: 'plastic', k: 0.001 })));
    }
  },
});
