import { cloth, hold, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Foreman: a flat cap, a brown warehouse coat down to the knee, a
 * moustache, a pencil behind the ear and a clipboard, on which is written,
 * every time, exactly how long you have been on your break. About 0.95 tiles
 * tall.
 */

const coat = cloth('#7a6648', '#4e4230');

export default person({
  name: 'foreman',
  scale: 1.5,
  b: 1.1,
  shape: { legs: 0.98, girth: 1.06, head: 1.02 },
  belly: 0.7,
  skin: '#d4a07c',
  look: { torso: coat, sleeve: coat, cuff: coat, legs: cloth('#2a2a2e'), boot: '#2a1c12', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#4a4a4a', mood: 1 },
  hair: { color: cloth('#6a6a6a', '#3a3a3a'), locks: [[[0.09, 0.7, -0.02], [0.11, 0.64, -0.06], 0.026], [[-0.09, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.026]], cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'smite', heavy: 0.4,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The clipboard held up in front of him, the pencil going: how long have you been on your break.
      hold(k, 'armL', -0.55, -0.6, 0); hold(k, 'foreL', -0.8, 0, 0);
      hold(k, 'armR', -1, 0.8, -0.05); hold(k, 'foreR', -0.35 + Math.sin(T * 5) * 0.06, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.5) * 0.25, 0);
    },
  },
  extras(s) {
    moustache(s, { color: '#5a5a5a', wide: 1.1 });
    s.part('kit', () => {
      // The flat cap: a soft wide crown and a short stiff peak.
      s.ellipsoid([0, 0.752, 0.005], [0.115, 0.04, 0.12], { color: '#4a4034', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.74, 0.08], [0, 0.735, 0.14], [0, 1, 0], 0.075, 0.06, 0.12, { color: '#3a3228', mat: 'cloth', bone: 'head', k: 0.005 });
      // The pencil behind his ear.
      s.limb([0.1, 0.69, 0.0], [0.108, 0.74, 0.02], 0.004, 0.004, { color: '#e8c030', mat: 'plastic', bone: 'head', k: 0.001 });
      // Big pockets on the coat, and the clipboard.
      for (const m of [1, -1]) s.box([m * 0.06, 0.35, 0.068], [0.025, 0.028, 0.008], 0.004, { color: '#6a563a', mat: 'cloth', bone: 'spine', k: 0.002 });
      // The clipboard, held up in front of him in the left hand, tipped back to write on.
      s.box([0.04, 0.43, 0.165], [0.045, 0.06, 0.005], 0.003, { color: '#8a6a3a', mat: 'leather', bone: 'chest', k: 0.002, rot: [-0.5, 0, 0] });
      s.box([0.04, 0.432, 0.171], [0.038, 0.05, 0.002], 0.002, { color: '#f4f0e6', mat: 'paper', bone: 'chest', k: 0.001, rot: [-0.5, 0, 0] });
      s.box([0.04, 0.483, 0.198], [0.014, 0.005, 0.004], 0.002, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001, rot: [-0.5, 0, 0] });
    });
  },
});
