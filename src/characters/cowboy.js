import { bands } from '../models/skins.js';
import { cloth, person } from './person.metroll.js';
import { moustache, stetson } from './wardrobe.js';

/**
 * The Cowboy: a stetson, a red-checked shirt under a leather vest, a
 * bandana at the throat, a big buckle, chaps over his jeans and boots with
 * a heel to them; a gun belt low on the hip with a cap pistol in it, and a
 * hand hovering over it. Fastest draw on the lot. Draws a salary. About
 * 0.95 tiles tall.
 */

const check = (p, n) => {
  const a = bands(0, 0.04, '#c8242c', '#f0e8dc', 0.5, 0.2)(p, n);
  const b = bands(1, 0.04, '#c8242c', '#f0e8dc', 0.5, 0.2)(p, n);
  return a.map((v, i) => Math.min(v, b[i]) * 0.6 + v * b[i] * 0.4);
};
const hide = cloth('#7a4a26', '#4a2a14');

export default person({
  name: 'cowboy',
  budget: 27000,
  scale: 1.45,
  b: 1.06,
  shape: { legs: 1.08, girth: 0.98, hips: 0.95 },
  skin: '#d8a07a',
  look: { torso: check, sleeve: check, cuff: check, legs: cloth('#3a4a6a', '#24304a'), boot: '#5a341a', belt: '#3a2210', buckle: '#d8c070', sole: '#2a1608' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#4a6a8a', brow: '#6a4422', mood: 1, jaw: 1.1 },
  hair: { color: cloth('#7a5230', '#4a3018'), locks: [[[0.07, 0.72, -0.02], [0.1, 0.66, -0.06], 0.025], [[-0.07, 0.72, -0.02], [-0.1, 0.66, -0.06], 0.025]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Bow-legged, the gun hand hovering, fingers twitching; squinting down the street.
      k.turn('thighL', 0, 0, 0.12); k.turn('thighR', 0, 0, -0.12);
      k.turn('armR', -0.15, 0, -0.35 + Math.sin(T * 5) * 0.03);
      k.turn('foreR', -0.35, 0, 0);
      k.turn('armL', 0.1, 0, 0.2);
      k.turn('head', 0.05, Math.sin(T * 0.4) * 0.3, 0);
    },
  },
  extras(s, J) {
    stetson(s, { color: '#a87a4a', band: '#4a2a14' });
    moustache(s, { color: '#6a4422', wide: 1.1 });
    s.part('kit', () => {
      const V = { color: hide, mat: 'leather', bone: 'chest' };
      // An open leather vest, a sheriff's... no, a deputy's... a costume star on it.
      for (const m of [1, -1]) s.ellipsoid([m * 0.068, 0.455, 0.006], [0.042, 0.08, 0.072], { ...V, k: 0.012 });
      s.ellipsoid([0, 0.46, -0.03], [0.1, 0.08, 0.05], { ...V, k: 0.02 });
      // The bandana, knotted at the throat.
      s.ellipsoid([0, 0.525, 0.04], [0.045, 0.02, 0.04], { color: '#1a3a8a', mat: 'cloth', bone: 'chest', k: 0.008 });
      s.cone([0, 0.47, 0.075], 0.025, 0.05, { color: '#1a3a8a', mat: 'cloth', bone: 'chest', k: 0.006, rot: [Math.PI, 0, 0] });
      // Chaps: leather down the front of each leg.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.limb([J[`hip${S}`][0], 0.3, 0.02], [J[`knee${S}`][0], 0.17, 0.03], 0.044, 0.036, { color: hide, mat: 'leather', bone: `thigh${S}`, k: 0.008 });
        s.limb([J[`knee${S}`][0], 0.17, 0.03], [J[`ankle${S}`][0], 0.09, 0.02], 0.037, 0.034, { color: hide, mat: 'leather', bone: `shin${S}`, k: 0.008 });
      }
      // The gun belt, low on the right hip, and the cap pistol in its holster.
      s.torus([0, 0.31, 0.0], 0.088, 0.008, { color: '#2a1408', mat: 'leather', bone: 'hips', k: 0.003, rot: [0, 0, 0.12] });
      s.box([-0.1, 0.25, 0.02], [0.016, 0.04, 0.026], 0.008, { color: '#2a1408', mat: 'leather', bone: 'thighR', k: 0.003 });
      s.limb([-0.1, 0.285, 0.022], [-0.1, 0.31, 0.0], 0.011, 0.012, { color: '#e8e0cc', mat: 'plastic', bone: 'thighR', k: 0.003 });
    });
    s.part('fine', () => {
      // The star, and the spurs.
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s.limb([0.065, 0.47, 0.08], [0.065 + Math.sin(a) * 0.014, 0.47 + Math.cos(a) * 0.014, 0.08], 0.004, 0.002, { color: '#e8d080', mat: 'metal', bone: 'chest', k: 0.002 });
      }
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        s.torus([a[0], 0.035, a[2] - 0.035], 0.012, 0.003, { color: '#d6d9e0', mat: 'metal', bone: m > 0 ? 'footL' : 'footR', k: 0.001, rot: [0, Math.PI / 2, 0] });
      }
    });
  },
});
