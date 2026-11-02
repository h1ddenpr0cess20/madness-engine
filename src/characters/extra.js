import { cloth, person, plate, shell } from './person.js';

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
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The headshot held up by the face, hopefully.
      reach?.(k, 'L', 'chest', [0.15, 0.55 + Math.sin(T * 1.3) * 0.01, 0.1]);
      k.turn('head', 0, Math.sin(T * 0.7) * 0.4, 0);
    },
  },
  extras(s, J, { pose }) {
    // The audition number pinned on the chest: a white card, the figures in black.
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.04, Math.abs(p[1] - 0.44) - 0.03, 0.03 - p[2]), {
      color: (p) => (Math.abs(p[1] - 0.44) < 0.012 && Math.abs(p[0]) < 0.026 && Math.sin(p[0] * 520) > -0.2 ? [0.02, 0.02, 0.024] : [0.9, 0.89, 0.86]), mat: 'paper', part: 'outer', thick: 0.0025, lift: 0.0006, over: ['top'], bone: 'chest',
    });
    // The headshot, held up by the face by its edge: an eight-by-ten, a face in grey on it.
    const L = pose.grip('L'), across = [1, 0, 0], up = [0, 1, 0];
    const photo = L.at(0, 0, 0).map((v, i) => v + [0.035, 0.05, 0.012][i]);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, photo, across, up, [0.05, 0.064, 0.0016], 0.001, {
        color: (q) => (Math.hypot((q[0] - photo[0]) / 0.022, (q[1] - photo[1] - 0.008) / 0.03) < 1 ? [0.28, 0.28, 0.3] : [0.94, 0.93, 0.9]), mat: 'paper', k: 0.0005,
      });
    }));
  },
});
