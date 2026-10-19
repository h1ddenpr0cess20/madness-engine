import { cloth, person } from './person.js';

/**
 * Merch Guy: a blue apron over a white tee, a lanyard, a cap, a big
 * cheerful smile, and a stack of folded T-shirts over one arm. They are
 * forty dollars. Rock is a rock. About 0.95 tiles.
 */

export default person({
  name: 'merch',
  scale: 1.42,
  b: 1.18,
  shape: { legs: 0.94, girth: 1.14, head: 1.04 },
  belly: 1.5,
  skin: '#dca480',
  look: { torso: '#f2f0ec', sleeve: '#f2f0ec', cuff: '#dca480', legs: cloth('#3a4a6a'), boot: '#f4f4f4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      k.turn('armL', -0.9, 0, 0.1);
      k.turn('foreL', -1.4, 0, 0);
      k.turn('head', 0, Math.sin(T * 0.8) * 0.25, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      s.box([0, 0.42, 0.075], [0.075, 0.1, 0.012], 0.01, { color: '#2a5ad9', mat: 'cloth', bone: 'chest', k: 0.006 });
      s.cylinder([0, 0.72, 0], 0.112, 0.012, { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.006 });
      s.ellipsoid([0, 0.73, 0.0], [0.108, 0.055, 0.108], { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.715, 0.09], [0, 0.705, 0.17], [0, 1, 0], 0.07, 0.05, 0.12, { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.006 });
      s.box([0, 0.46, 0.082], [0.016, 0.026, 0.003], 0.003, { color: '#ffd23a', mat: 'plastic', bone: 'chest', k: 0.002 });
      // The shirts: a pile of folded colours on the left forearm.
      const h = J.handL;
      ['#ff2d95', '#2de2ff', '#ffd23a', '#8a4be8', '#3ae88a'].forEach((c, i) => {
        s.box([h[0], h[1] + 0.03 + i * 0.026, h[2] + 0.04], [0.05, 0.012, 0.045], 0.006, { color: c, mat: 'cloth', bone: 'handL', k: 0.004, rot: [0, i * 0.25, 0] });
      });
    });
  },
});
