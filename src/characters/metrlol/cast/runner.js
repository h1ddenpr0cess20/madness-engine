import { cloth, hold, person } from './person.js';

/**
 * The Bull Runner: in the whites of San Fermín, a red pañuelo knotted at
 * the throat and a red sash round the waist, a rolled-up newspaper in his
 * fist for the bull's nose, and the look over the shoulder of a man who
 * has just remembered why the others are running. White shirt, red scarf,
 * no plan. Running from the bull. Into you. About 0.95 tiles tall.
 */

const WHITE = cloth('#f6f4f0', '#d8d4cc');

export default person({
  name: 'runner',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.06, girth: 0.9 },
  skin: '#e0a880',
  look: { torso: WHITE, sleeve: WHITE, cuff: '#e0a880', legs: WHITE, boot: '#f4f2ec', sole: '#c8141e' },
  mats: { cuff: 'skin', boot: 'cloth' },
  face: { eyeColor: '#2a1a0a', brow: '#1a120a', blush: 0.9, jaw: 1.0 },
  hair: { color: cloth('#1a120a', '#0a0604'), locks: [[[0.03, 0.78, 0.06], [0.07, 0.77, 0.1], 0.03], [[-0.04, 0.78, 0.05], [-0.08, 0.76, 0.09], 0.03]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, g = Math.sin(T * 9);
      // Running on the spot, the paper up, looking back over his shoulder.
      if (clip === 'idle') {
        hold(k, 'thighL', -Math.max(0, g) * 0.8, 0, 0); hold(k, 'shinL', Math.max(0, g) * 1.0, 0, 0);
        hold(k, 'thighR', -Math.max(0, -g) * 0.8, 0, 0); hold(k, 'shinR', Math.max(0, -g) * 1.0, 0, 0);
        k.move('root', 0, Math.abs(g) * 0.012, 0);
      }
      hold(k, 'armR', -1.2, 0, -0.2);
      hold(k, 'foreR', -1.0, 0, 0);
      hold(k, 'armL', g * 0.6, 0, 0.1);
      hold(k, 'foreL', -1.2, 0, 0);
      k.turn('head', 0, 1.1 + Math.sin(T * 1.3) * 0.2, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The pañuelo, knotted at the throat, its point down the chest; the sash, its ends at the hip.
      s.torus([0, 0.53, 0.01], 0.04, 0.012, { color: '#c8141e', mat: 'cloth', bone: 'chest', k: 0.004, rot: [0.3, 0, 0] });
      s.cone([0, 0.47, 0.072], 0.024, 0.05, { color: '#c8141e', mat: 'cloth', bone: 'chest', k: 0.004, rot: [Math.PI, 0, 0] });
      s.torus([0, 0.34, 0.004], 0.08, 0.016, { color: '#c8141e', mat: 'cloth', bone: 'hips', k: 0.006 });
      s.flake([0.075, 0.33, 0.03], [0.09, 0.22, 0.04], [1, 0, 0.4], 0.016, 0.02, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'hips', k: 0.004 });
      // The rolled newspaper.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.05, h[2] + 0.01], [h[0], h[1] + 0.16, h[2] + 0.01], 0.018, 0.016, { color: '#ece6d6', mat: 'paper', bone: 'handR', k: 0.003 });
      s.torus([h[0], h[1] + 0.1, h[2] + 0.01], 0.018, 0.002, { color: '#3a3a3a', mat: 'paper', bone: 'handR', k: 0 });
    });
  },
});
