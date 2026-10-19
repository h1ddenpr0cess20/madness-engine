import { cloth, person } from './person.js';

/**
 * The Extra: background artist number 212, in the beige everybody in the
 * background is put in, a number pinned to the chest and a headshot held up
 * in case anybody important walks past. Looks busy. About 0.9 tiles tall.
 */

const beige = cloth('#c8b898', '#9a8a6a');

export default person({
  name: 'extra',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 1.0, girth: 0.96 },
  skin: '#e0b090',
  look: { torso: beige, sleeve: beige, cuff: '#e0b090', legs: cloth('#5a5a62'), boot: '#2a2420', belt: '#3a2a1a', buckle: '#c8c8d0' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a6a3a', brow: '#5a3a1e', blush: 0.4 },
  hair: { color: cloth('#6a4422', '#3a2412'), locks: [[[0.04, 0.78, 0.02], [0.08, 0.79, 0.09], 0.03], [[-0.04, 0.78, 0.02], [-0.08, 0.79, 0.09], 0.03], [[0, 0.79, -0.05], [0.01, 0.8, 0.02], 0.035]] },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The headshot held up by the face, hopefully.
      k.turn('armL', -1.5 + Math.sin(T * 1.3) * 0.08, 0, 0.25);
      k.turn('foreL', -1.2, 0, 0);
      k.turn('head', 0, Math.sin(T * 0.7) * 0.4, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The number on the chest: a white card, a black stripe for the figures.
      s.box([0, 0.44, 0.075], [0.04, 0.03, 0.004], 0.003, { color: '#f4f2ee', mat: 'paper', bone: 'chest', k: 0.002 });
      s.box([0, 0.44, 0.079], [0.026, 0.01, 0.002], 0.001, { color: '#16161a', mat: 'paper', bone: 'chest', k: 0 });
      // The headshot: an eight-by-ten, a face in grey on it.
      const l = J.handL;
      s.box([l[0], l[1] + 0.06, l[2] + 0.02], [0.05, 0.065, 0.003], 0.002, { color: '#f4f2ee', mat: 'paper', bone: 'handL', k: 0.001 });
      s.ellipsoid([l[0], l[1] + 0.07, l[2] + 0.025], [0.02, 0.025, 0.002], { color: '#5a5a5e', mat: 'paper', bone: 'handL', k: 0 });
    });
  },
});
