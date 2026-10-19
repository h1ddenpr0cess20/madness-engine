import { bands } from '../models/skins.js';
import { cloth, hold, person } from './person.js';

/**
 * The Snowboarder: a jacket three sizes too big in lime and purple, the
 * trousers hanging off the backside, a bobble hat, goggles pushed up on
 * it, a scarf over the chin, and the board under one arm, stickered all
 * over. Says "gnarly" without irony. Sits down in the middle of the run.
 * About 0.95 tiles tall.
 */

const JACKET = cloth('#a8e030', '#78a818');
const TROUSERS = cloth('#6a3aa8', '#4a2478');
const HAT = bands(1, 0.025, '#f4f2ec', '#e8301a', 0.5, 0.15);

export default person({
  name: 'snowboarder',
  scale: 1.44,
  b: 1.12,
  shape: { legs: 0.96, girth: 1.14, hips: 1.1 },
  skin: '#e8b898',
  look: { torso: JACKET, sleeve: JACKET, cuff: JACKET, hand: '#2a2a30', legs: TROUSERS, boot: '#2a2a30', sole: '#14141a' },
  mats: { hand: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a6a3a', brow: '#6a4a2a', blush: 0.8 },
  hair: { color: cloth('#7a5a3a', '#5a3a24'), locks: [[[0.08, 0.68, -0.02], [0.11, 0.58, -0.04], 0.03], [[-0.08, 0.68, -0.02], [-0.11, 0.58, -0.04], 0.03], [[0, 0.66, -0.09], [0, 0.56, -0.1], 0.04]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The board under the right arm; slouched, nodding to something only he can hear.
      hold(k, 'armR', 0.05, 0, -0.35);
      hold(k, 'foreR', -0.5, 0, 0);
      k.turn('spine', 0.1, 0, 0);
      k.turn('head', Math.max(0, Math.sin(T * 4)) * 0.15, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The bobble hat, the goggles pushed up on it, the bobble.
      s.ellipsoid([0, 0.74, -0.006], [0.108, 0.085, 0.108], { color: HAT, mat: 'cloth', bone: 'head', k: 0.01 });
      s.sphere([0, 0.84, -0.01], 0.032, { color: '#f4f2ec', mat: 'cloth', bone: 'head', k: 0.008, bump: [0.002, 120] });
      s.box([0, 0.755, 0.09], [0.07, 0.022, 0.02], 0.016, { color: '#3ac8e8', mat: 'glass', bone: 'head', k: 0.004, rot: [-0.4, 0, 0] });
      // The scarf, up over the chin.
      s.torus([0, 0.56, 0.01], 0.06, 0.025, { color: '#e8301a', mat: 'cloth', bone: 'neck', k: 0.006, rot: [0.2, 0, 0] });
      // The trousers' seat hanging low behind.
      s.ellipsoid([0, 0.24, -0.05], [0.09, 0.07, 0.06], { color: TROUSERS, mat: 'cloth', bone: 'hips', k: 0.03 });
      // The board, under the right arm, on its edge, stickered.
      const r = J.handR;
      s.box([r[0] - 0.035, r[1] + 0.06, r[2]], [0.008, 0.06, 0.3], 0.04, { color: '#1a1a24', mat: 'plastic', bone: 'handR', k: 0.003 });
      for (const [dz, c] of [[-0.15, '#ff3a8a'], [0.0, '#f0c020'], [0.14, '#3ac8e8']]) s.cylinder([r[0] - 0.044, r[1] + 0.06, r[2] + dz], 0.025, 0.002, { color: c, mat: 'plastic', bone: 'handR', k: 0, rot: [0, 0, Math.PI / 2] });
    });
  },
});
