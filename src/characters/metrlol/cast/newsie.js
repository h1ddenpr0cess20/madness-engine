import { cloth, person } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Newsie: a kid in a baggy cap, a waistcoat over a collarless shirt,
 * braces, knickerbockers and long socks, a canvas bag of the late edition
 * over one shoulder and today's paper held up high, waving. Read all about
 * it. It is about you. About 0.65 tiles tall.
 */

const tweed = cloth('#6a5a44', '#4a3e2e', { vary: 0.2, freq: 30, grain: 0.12 });

export default person({
  name: 'newsie',
  budget: 13000,
  scale: 1.0,
  b: 0.94,
  shape: { legs: 0.86, girth: 0.9, head: 1.16 },
  skin: '#f0c4a4',
  look: { torso: tweed, sleeve: cloth('#e8e0cc', '#b0a890'), cuff: cloth('#e8e0cc', '#b0a890'), legs: tweed, boot: '#8a8a8e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#4a7a3a', brow: '#8a4a1e', blush: 0.8 },
  hair: { color: cloth('#a85a24', '#6a3412'), locks: [[[0.06, 0.72, 0.06], [0.08, 0.7, 0.1], 0.02], [[-0.06, 0.72, 0.06], [-0.08, 0.7, 0.1], 0.02], [[0.08, 0.7, -0.05], [0.1, 0.64, -0.07], 0.02]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The paper up over his head, waving, and a bounce on his toes.
      k.turn('armR', -2.6 + Math.sin(T * 6) * 0.25, 0, -0.2);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('head', -0.15, Math.sin(T * 1.1) * 0.3, 0);
      if (clip === 'idle') k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.012, 0);
    },
  },
  extras(s, J) {
    cap(s, { color: '#5a4a3a', peak: '#5a4a3a', flat: true });
    s.part('kit', () => {
      // Braces over the shoulders, buttoned to the knickerbockers.
      for (const m of [1, -1]) s.limb([m * 0.05, 0.52, 0.04], [m * 0.04, 0.34, 0.07], 0.007, 0.007, { color: '#3a2a20', mat: 'leather', bone: 'chest', k: 0.003 });
      // Shoes under the long socks.
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        s.ellipsoid([a[0], 0.026, a[2] + 0.04], [0.035, 0.028, 0.068], { color: '#2a1a10', mat: 'leather', bone: m > 0 ? 'footL' : 'footR', k: 0.008 });
      }
      // The bag across him: a strap over the right shoulder, the bag on the left hip, papers sticking up out of it.
      s.limb([-0.08, 0.52, 0.03], [0.09, 0.34, 0.05], 0.008, 0.008, { color: '#8a7a5a', mat: 'cloth', bone: 'chest', k: 0.003 });
      s.box([0.1, 0.3, 0.02], [0.03, 0.05, 0.06], 0.012, { color: '#a8986a', mat: 'cloth', bone: 'hips', k: 0.006 });
      for (const z of [-0.02, 0.02]) s.box([0.1, 0.36, 0.02 + z], [0.022, 0.025, 0.004], 0.001, { color: '#e8e4d8', mat: 'paper', bone: 'hips', k: 0.001, rot: [0, 0, 0.1] });
      // The paper in his hand: folded, the headline in black.
      const r = J.handR;
      s.box([r[0], r[1] + 0.07, r[2] + 0.01], [0.045, 0.06, 0.004], 0.002, { color: '#ece8dc', mat: 'paper', bone: 'handR', k: 0.001 });
      s.box([r[0], r[1] + 0.105, r[2] + 0.015], [0.04, 0.012, 0.002], 0.001, { color: '#16161a', mat: 'paper', bone: 'handR', k: 0 });
    });
  },
});
