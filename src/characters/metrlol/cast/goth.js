import { cloth, hold, person } from './person.js';
import { bigHair } from './metalwear.js';

/**
 * The Goth: hair backcombed to the ceiling and dyed the black of a cupboard,
 * a face the white of one that has never seen the sun, eyes ringed in black,
 * lips the dark red of a very old wine, a lace-sleeved frock coat, a skirt of
 * black tulle, fishnets, boots on platforms, an ankh and six more necklaces,
 * and a rose he is carrying for a reason. Brooding, allegedly. About 1.0
 * tiles tall with the hair.
 */

const LACE = (p, n) => {
  const base = cloth('#14101a', '#0a080e')(p, n);
  return Math.sin(p[0] * 220) * Math.sin(p[1] * 220) > 0.5 ? [0.2, 0.14, 0.24] : base;
};

export default person({
  name: 'goth',
  budget: 19000,
  scale: 1.5,
  b: 0.98,
  shape: { legs: 1.1, girth: 0.88, head: 1.0 },
  skin: '#f0eaf0',
  look: { torso: cloth('#14101a', '#0a080e'), sleeve: LACE, cuff: LACE, legs: cloth('#14101a'), boot: '#0a080e', sole: '#2a2630', belt: '#2a2630', buckle: '#c8ccd4', boots: 0.13 },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#6a2a8a', brow: '#0a080e', mood: 1, blush: 0 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Brooding: the head tilted, one hand to the brow, the other holding out a rose; a very slow sway.
      k.turn('hips', 0, Math.sin(T * 0.5) * 0.06, Math.sin(T * 0.5) * 0.03);
      hold(k, 'armL', -1.6, 0.3, 0.3); hold(k, 'foreL', -1.9, 0, 0);
      hold(k, 'armR', -0.6, 0, -0.3); hold(k, 'foreR', -0.6, 0, 0);
      k.turn('head', 0.18, Math.sin(T * 0.4) * 0.3, 0.22);
    },
  },
  extras(s, J) {
    bigHair(s, '#0c0a12', { size: 1.32, drop: 0.14 });
    s.part('kit', () => {
      // Heavy dark rings round the eyes and the dark lips: painted, not sculpted.
      for (const m of [1, -1]) {
        s.torus([m * 0.041, 0.668, 0.1], 0.026, 0.006, { color: '#0a080e', mat: 'cloth', bone: 'head', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      }
      s.limb([-0.022, 0.611, 0.104], [0.022, 0.611, 0.104], 0.004, 0.004, { color: '#5a0a2a', mat: 'cloth', bone: 'head', k: 0.001 });
      // Tulle skirt: a short bell of layers over the hips; fishnet bars on the legs.
      s.cone([0, 0.4, 0.0], 0.14, 0.17, { color: '#14101a', mat: 'cloth', bone: 'hips', k: 0.012 });
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        for (let i = 0; i < 5; i++) s.torus([m * 0.058, 0.07 + i * 0.045, 0.0], 0.034, 0.002, { color: '#2a2630', mat: 'cloth', bone: `shin${S}`, k: 0.0008, rot: [0.3 * (i % 2 ? 1 : -1), 0, 0] });
        s.box([m * 0.06, 0.012, 0.045], [0.034, 0.016, 0.062], 0.006, { color: '#0a080e', mat: 'leather', bone: `foot${S}`, k: 0.003 });
      }
      // The necklaces and the ankh.
      for (const [r, y] of [[0.05, 0.53], [0.058, 0.5], [0.068, 0.47]]) s.torus([0, y, 0.035], r, 0.003, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001, rot: [0.5, 0, 0] });
      s.torus([0, 0.44, 0.088], 0.012, 0.0025, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.box([0, 0.415, 0.088], [0.0025, 0.016, 0.0025], 0.001, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.0005 });
      s.box([0, 0.425, 0.088], [0.012, 0.0025, 0.0025], 0.001, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.0005 });
      // The rose, in the right hand: a red bloom on a green stem.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.02, h[2]], [h[0], h[1] + 0.09, h[2]], 0.003, 0.003, { color: '#2a6a3a', mat: 'cloth', bone: 'handR', k: 0.001 });
      s.sphere([h[0], h[1] + 0.1, h[2]], 0.013, { color: '#a0102a', mat: 'cloth', bone: 'handR', k: 0.004 });
    });
  },
});
