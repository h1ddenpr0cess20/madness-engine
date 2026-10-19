import { cloth, person } from './person.js';

/**
 * The Autograph Hunter: a fan in a T-shirt with Rock's face on it (it is
 * not his face: it is a rock), a ponytail, a backpack, and an autograph
 * book and a pen held out at arm's length. Small, quick, determined. About
 * 0.8 tiles tall.
 */

const tee = cloth('#f4f2ee', '#c8c4bc');

export default person({
  name: 'fan',
  scale: 1.3,
  b: 0.94,
  shape: { legs: 1.04, girth: 0.88, head: 1.04 },
  skin: '#c88a68',
  look: { torso: tee, sleeve: tee, cuff: '#c88a68', legs: cloth('#2a3a5a'), boot: '#d8302a', sole: '#f4f2ee' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', blush: 0.5 },
  hair: { color: cloth('#1a120a', '#0a0604'), locks: [[[0, 0.78, -0.06], [0, 0.72, -0.16], 0.035], [[0, 0.7, -0.15], [0, 0.6, -0.18], 0.025], [[0.05, 0.77, 0.03], [0.09, 0.73, 0.05], 0.03], [[-0.05, 0.77, 0.03], [-0.09, 0.73, 0.05], 0.03]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The book and the pen held out, shaking with excitement.
      k.turn('armR', -1.4 + Math.sin(T * 12) * 0.04, 0, -0.1);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('armL', -1.3 + Math.sin(T * 12 + 1) * 0.04, 0, 0.1);
      k.turn('foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.01, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // A rock printed on the shirt: a grey lump.
      s.ellipsoid([0, 0.45, 0.074], [0.04, 0.03, 0.004], { color: '#7a7470', mat: 'cloth', bone: 'chest', k: 0.002 });
      // The backpack.
      s.box([0, 0.43, -0.09], [0.06, 0.07, 0.035], 0.02, { color: '#d8302a', mat: 'cloth', bone: 'chest', k: 0.006 });
      for (const m of [1, -1]) s.limb([m * 0.05, 0.51, -0.05], [m * 0.06, 0.4, 0.06], 0.007, 0.007, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.003 });
      // The autograph book and the pen.
      const l = J.handL, r = J.handR;
      s.box([l[0], l[1] + 0.02, l[2] + 0.04], [0.035, 0.045, 0.008], 0.003, { color: '#3a6ad8', mat: 'paper', bone: 'handL', k: 0.002 });
      s.limb([r[0], r[1] - 0.01, r[2] + 0.01], [r[0], r[1] + 0.03, r[2] + 0.07], 0.005, 0.003, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.002 });
    });
  },
});
