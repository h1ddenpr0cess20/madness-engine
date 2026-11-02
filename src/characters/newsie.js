import { bag, cloth, person, plate, strap } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Newsie: a kid in a baggy cap, a waistcoat over a collarless shirt,
 * braces, knickerbockers and long socks, a canvas bag of the late edition
 * over one shoulder and today's paper held up high, waving. Read all about
 * it. It is about you. About 0.65 tiles tall.
 */

const SHIRT = cloth('#e8e0cc', '#b0a890');
const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const tweed = cloth('#6a5a44', '#4a3e2e', { vary: 0.2, freq: 30, grain: 0.12 });

export default person({
  name: 'newsie',
  budget: 42900,
  scale: 1.0,
  b: 0.94,
  shape: { legs: 0.86, girth: 0.9, head: 1.16 },
  skin: '#f0c4a4',
  look: { torso: tweed, sleeve: SHIRT, cuff: SHIRT, legs: tweed, shorts: 0.78, shin: cloth('#8a8a8e', '#5a5a5e'), boot: '#2a1a10', sole: '#140c06' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a7a3a', brow: '#8a4a1e', blush: 0.8 },
  hair: { color: cloth('#a85a24', '#6a3412'), locks: [[[0.06, 0.72, 0.06], [0.08, 0.7, 0.1], 0.02], [[-0.06, 0.72, 0.06], [-0.08, 0.7, 0.1], 0.02], [[0.08, 0.7, -0.05], [0.1, 0.64, -0.07], 0.02]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Extra! The paper up over his head, waving, and a bounce on his toes.
      k.turn('armR', -2.5 + Math.sin(T * 6) * 0.2, 0, -0.25);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('head', -0.15, Math.sin(T * 1.1) * 0.3, 0);
      if (clip === 'idle') k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.012, 0);
    },
  },
  extras(s, J, { pose }) {
    cap(s, { color: '#5a4a3a', peak: '#5a4a3a', flat: true });
    // Braces over the shirt, buttoned to the knickerbockers.
    for (const m of [1, -1]) {
      strap(s, [[m * 0.045, 0.355, 0.075], [m * 0.05, 0.45, 0.075], [m * 0.055, 0.53, 0.045], [m * 0.055, 0.553, 0.0], [m * 0.05, 0.53, -0.05], [m * 0.03, 0.45, -0.07], [m * 0.02, 0.355, -0.07]], { width: 0.009, thick: 0.003, color: '#3a2a20', mat: 'leather', over: ['top', 'bottoms'], keep: TRUNK });
    }
    // The bag of papers across him: the strap over the right shoulder, the bag on the left hip, the papers up out of it.
    strap(s, [[-0.07, 0.53, 0.045], [-0.055, 0.553, 0.0], [-0.03, 0.53, -0.065], [0.05, 0.4, -0.075], [0.095, 0.33, -0.02], [0.09, 0.33, 0.04], [0.02, 0.43, 0.08], [-0.07, 0.53, 0.045]], { width: 0.011, thick: 0.003, color: '#8a7a5a', mat: 'cloth', over: ['top', 'bottoms', 'straps'], keep: TRUNK, closed: true });
    const sack = bag(s, [0.1, 0.3, 0.02], { size: [0.035, 0.045, 0.014], color: '#a8986a', flap: false, over: ['bottoms', 'top'], keep: TRUNK, bone: 'hips' });
    s.part('kit', () => {
      for (const [dx, tilt] of [[-0.012, -0.08], [0.01, 0.06]]) {
        const c = sack.c.map((v, i) => v + sack.up[i] * 0.045 + sack.across[i] * dx);
        plate(s, c, sack.across.map((v, i) => v + sack.up[i] * tilt), sack.up, [0.026, 0.022, 0.0025], 0.001, { color: '#ece8dc', mat: 'paper', bone: 'hips', k: 0.001 });
      }
    });
    // The paper in his raised fist: folded, held by its foot, the headline across the top in black.
    const G = pose.grip('R'), n = [G.along[1] * G.up[2] - G.along[2] * G.up[1], G.along[2] * G.up[0] - G.along[0] * G.up[2], G.along[0] * G.up[1] - G.along[1] * G.up[0]];
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const c = G.at(0, -0.06, -0.004);
      plate(s, c, G.along, G.up, [0.045, 0.062, 0.003], 0.002, { color: '#ece8dc', mat: 'paper', k: 0.001 });
      for (const sg of [1, -1]) {
        plate(s, G.at(0, -0.1, -0.004).map((v, i) => v + n[i] * sg * 0.0032), G.along, G.up, [0.038, 0.011, 0.0008], 0.0005, { color: '#16161a', mat: 'paper', k: 0 });
        for (const u of [-0.075, -0.06, -0.045, -0.03]) plate(s, G.at(0, u, -0.004).map((v, i) => v + n[i] * sg * 0.0032), G.along, G.up, [0.036, 0.0025, 0.0006], 0.0003, { color: '#8a8a8e', mat: 'paper', k: 0 });
      }
    }));
  },
});
