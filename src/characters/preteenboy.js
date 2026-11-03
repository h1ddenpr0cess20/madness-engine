import { bands } from '../models/skins.js';
import { cloth, cuffBand } from './person.js';
import { child } from './kids.js';

/**
 * The Preteen Boy: the Little Brother's build and clothes (a striped shirt,
 * turned-up jeans, white trainers with a red toe cap, a mop of brown hair) with
 * nothing in his hands, and a little taller. About 0.7 of a grown person's
 * height.
 */

const stripes = bands(1, 0.05, '#d9433a', '#f2eee4', 0.5, 0.15);

export default child('preteen', {
  name: 'preteenboy',
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
  extras(s, J) {
    // Trainers: white, a red toe cap on each.
    s.paint((p) => Math.max(p[1] - 0.045, Math.abs(Math.abs(p[0]) - 0.06) - 0.034, 0.058 - p[2]), '#d9433a', 0.004);
    // The jeans turned up at the bottom.
    for (const S of ['L', 'R']) cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.84, { width: 0.026, thick: 0.0045, color: cloth('#5a86c8', '#3a66a8'), mat: 'denim', bone: `shin${S}` });
  },
});
