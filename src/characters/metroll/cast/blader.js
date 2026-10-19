import { cloth, hold, person } from './person.js';
import { headband } from './metalwear.js';

/**
 * The Rollerblader: neon spandex, a headband and matching wristbands, knee
 * pads, big headphones on a Walkman at the hip, and in-line skates, the
 * wheels in a row. Has right of way. Thinks. Fast. About 0.95 tiles tall.
 */

const NEON = (p) => (Math.sin(p[1] * 60) > 0.2 ? [0.1, 0.9, 0.7] : [1, 0.15, 0.55]);

export default person({
  name: 'blader',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.1, girth: 0.86, head: 1.0 },
  skin: '#d8a888',
  look: { torso: NEON, sleeve: NEON, cuff: '#d8a888', legs: NEON, boot: '#f4f2ee', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a5a8a', brow: '#6a4a2a', mood: 0, blush: 0.6 },
  hair: { color: cloth('#d8a838', '#a07820'), locks: [[[0, 0.78, -0.04], [0, 0.6, -0.15], 0.05, 0.5], [[0.07, 0.77, 0.0], [0.1, 0.62, -0.1], 0.04, 0.5], [[-0.07, 0.77, 0.0], [-0.1, 0.62, -0.1], 0.04, 0.5]], cap: [0.11, 0.1, 0.11] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Gliding: the knees bent, one leg back, arms swinging across.
      k.turn('hips', 0.18, 0, 0);
      k.turn('thighL', -0.5 + Math.sin(T * 5) * 0.3, 0, 0); k.turn('shinL', 0.7, 0, 0);
      k.turn('thighR', 0.2 - Math.sin(T * 5) * 0.3, 0, 0); k.turn('shinR', 0.5, 0, 0);
      hold(k, 'armL', 0.5 - Math.sin(T * 5) * 0.6, 0, 0.3); hold(k, 'armR', 0.5 + Math.sin(T * 5) * 0.6, 0, -0.3);
      k.turn('head', 0.1, 0, 0);
    },
  },
  extras(s) {
    headband(s, { color: '#ffffff' });
    s.part('kit', () => {
      // Headphones: a band and two foam cups. A Walkman clipped to the hip.
      s.torus([0, 0.7, -0.005], 0.1, 0.006, { color: '#16161a', mat: 'plastic', bone: 'head', k: 0.002, rot: [0, 0, Math.PI / 2] });
      for (const m of [1, -1]) s.sphere([m * 0.108, 0.66, 0], 0.03, { color: '#ffd23a', mat: 'rubber', bone: 'head', k: 0.004 });
      s.box([0.085, 0.31, 0.04], [0.018, 0.025, 0.009], 0.003, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0.002 });
      // The skates: a row of wheels under each foot, and the kneepads.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        for (let i = 0; i < 4; i++) s.cylinder([m * 0.06, 0.012, 0.0 + i * 0.026], 0.014, 0.006, { color: '#ff2d95', mat: 'rubber', bone: `foot${S}`, k: 0.001, rot: [0, 0, Math.PI / 2] });
        s.ellipsoid([m * 0.06, 0.17, 0.03], [0.036, 0.034, 0.03], { color: '#16161a', mat: 'plastic', bone: `thigh${S}`, k: 0.006 });
      }
    });
  },
});
