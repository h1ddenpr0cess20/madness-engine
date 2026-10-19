import { cloth, person } from './person.js';

/**
 * The Critic: a tweed jacket with elbow patches, a long scarf, little round
 * glasses, a goatee, a notebook and a pen that is already writing something
 * unkind. One star. About 0.95 tiles tall.
 */

const tweed = cloth('#8a7050', '#5a4830');

export default person({
  name: 'critic',
  scale: 1.45,
  b: 1.05,
  shape: { legs: 1.1, girth: 0.82, head: 1.1, torso: 1.08 },
  skin: '#e0b090',
  look: { torso: tweed, sleeve: tweed, cuff: tweed, legs: cloth('#2a2a30'), boot: '#2a1c12' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a4a5a', brow: '#6a6a6a', mood: 1 },
  hair: { color: cloth('#7a7a7a', '#4a4a4a'), locks: [[[0.06, 0.74, -0.02], [0.1, 0.7, -0.05], 0.03], [[-0.06, 0.74, -0.02], [-0.1, 0.7, -0.05], 0.03]], cap: [0.106, 0.085, 0.106] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Writing it down.
      k.turn('armL', -0.9, 0, 0.3);
      k.turn('foreL', -1.5, 0, 0);
      k.turn('armR', -0.8, 0, -0.25);
      k.turn('foreR', -1.6 + Math.sin(T * 6) * 0.1, 0, 0);
      k.turn('head', 0.18, Math.sin(T * 0.5) * 0.2, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // Elbow patches, a scarf wound twice, a goatee, round glasses.
      for (const m of [1, -1]) {
        const e = J[m > 0 ? 'elbowL' : 'elbowR'];
        s.ellipsoid([e[0] + m * 0.016, e[1], e[2] - 0.012], [0.02, 0.026, 0.014], { color: '#3a2a18', mat: 'leather', bone: m > 0 ? 'foreL' : 'foreR', k: 0.006 });
        s.torus([m * 0.042, 0.668, 0.1], 0.022, 0.004, { color: '#8a8a92', mat: 'metal', bone: 'head', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      }
      s.torus([0, 0.52, 0.0], 0.066, 0.022, { color: '#b81a2a', mat: 'cloth', bone: 'neck', k: 0.01, rot: [0.15, 0, 0] });
      s.limb([0.02, 0.52, 0.06], [0.05, 0.36, 0.09], 0.022, 0.026, { color: '#b81a2a', mat: 'cloth', bone: 'chest', k: 0.008 });
      s.ellipsoid([0, 0.6, 0.095], [0.022, 0.03, 0.016], { color: '#6a6a6a', mat: 'hair', bone: 'head', k: 0.006 });
      // The notebook, in the left hand, and a pen in the right.
      const l = J.handL, r = J.handR;
      s.box([l[0], l[1] + 0.03, l[2] + 0.03], [0.04, 0.05, 0.008], 0.004, { color: '#f2f0ec', mat: 'paper', bone: 'handL', k: 0.003, rot: [-0.3, 0, 0] });
      s.limb([r[0], r[1] - 0.01, r[2]], [r[0], r[1] + 0.04, r[2] + 0.06], 0.005, 0.003, { color: '#c8a030', mat: 'metal', bone: 'handR', k: 0.002 });
    });
  },
});
