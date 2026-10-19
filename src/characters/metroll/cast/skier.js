import { cloth, hold, person } from './person.js';

/**
 * The Skier: down off the black run in a lot of very expensive anorak, hot
 * pink and electric blue, salopettes, a helmet, mirrored goggles, a pass on
 * a lanyard, ski boots that walk like boots that were not made for it, the
 * skis over one shoulder and a pole in the other hand. Off-piste. About 1.0
 * tiles tall.
 */

const ANORAK = cloth('#ff3a8a', '#c81a64');
const SALOPETTES = cloth('#1a5ad8', '#0e3a9a');

export default person({
  name: 'skier',
  scale: 1.46,
  b: 1.06,
  shape: { legs: 1.02, girth: 1.06 },
  skin: '#f0c0a0',
  look: { torso: ANORAK, sleeve: ANORAK, cuff: ANORAK, hand: '#1a1a1e', legs: SALOPETTES, boot: '#f0f0f4', sole: '#1a1a1e', boots: 0.12 },
  mats: { hand: 'leather', boot: 'plastic' },
  face: { eyeColor: '#3a6a9a', brow: '#c8a060', blush: 0.9 },
  hair: { color: cloth('#e8c878', '#c8a050'), locks: [[[0.07, 0.68, -0.05], [0.09, 0.6, -0.08], 0.028], [[-0.07, 0.68, -0.05], [-0.09, 0.6, -0.08], 0.028]] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The skis on the left shoulder; the pole planted with the right; stamping the cold out of the boots.
      hold(k, 'armL', -0.4, 0, 0.5);
      hold(k, 'foreL', -2.1, 0.2, 0);
      hold(k, 'handL', 0, 0, 0);
      hold(k, 'armR', -0.15, 0, -0.2);
      hold(k, 'foreR', -0.3, 0, 0);
      if (clip === 'idle') k.turn(Math.sin(T * 2) > 0 ? 'thighL' : 'thighR', -0.15 * Math.abs(Math.sin(T * 4)), 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // A helmet, and the goggles on it, mirrored.
      s.ellipsoid([0, 0.73, -0.006], [0.112, 0.1, 0.116], { color: '#f4f4f8', mat: 'plastic', bone: 'head', k: 0.01 });
      s.ellipsoid([0, 0.66, 0.06], [0.13, 0.08, 0.1], { op: 'sub', k: 0.02 });
      s.box([0, 0.69, 0.095], [0.075, 0.025, 0.02], 0.016, { color: '#ff9a2a', mat: 'glass', bone: 'head', k: 0.004 });
      s.torus([0, 0.69, 0.0], 0.108, 0.008, { color: '#1a1a1e', mat: 'rubber', bone: 'head', k: 0.002 });
      // The lift pass on its lanyard, the zip, the fur round the hood.
      s.box([0.03, 0.42, 0.085], [0.018, 0.022, 0.003], 0.002, { color: '#f4f2ec', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.limb([0, 0.53, 0.05], [0, 0.34, 0.085], 0.004, 0.004, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001 });
      s.torus([0, 0.53, -0.02], 0.06, 0.018, { color: '#e8dcc8', mat: 'hair', bone: 'chest', k: 0.006, rot: [0.3, 0, 0], bump: [0.002, 120] });
      // The skis over the shoulder: crossed at the tips, bindings in the middle.
      const h = J.handL;
      for (const dx of [-0.012, 0.012]) {
        s.box([h[0] + dx, h[1] + 0.05, h[2] + 0.02], [0.008, 0.36, 0.02], 0.004, { color: '#1a1a1e', mat: 'plastic', bone: 'handL', k: 0.002 });
        s.box([h[0] + dx, h[1] + 0.05, h[2] + 0.02], [0.009, 0.3, 0.016], 0.003, { color: '#f0c020', mat: 'plastic', bone: 'handL', k: 0.001 });
      }
      // The pole.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.04, r[2]], [r[0] - 0.01, 0.0, r[2] + 0.02], 0.005, 0.004, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.001 });
      s.torus([r[0] - 0.009, 0.04, r[2] + 0.018], 0.022, 0.004, { color: '#1a1a1e', mat: 'rubber', bone: 'handR', k: 0.001 });
    });
  },
});
