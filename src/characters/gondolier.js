import { bands, grainy } from '../models/skins.js';
import { cloth, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Gondolier: a navy-and-white striped shirt, black trousers, a red sash,
 * a straw boater with a red ribbon down the back, a moustache, and the long
 * oar off the back of his gondola, which he leans on between verses. Sings
 * "O Sole Mio" with his arm out to the canal, unasked, all of it. The song
 * costs extra. About 1.2 tiles tall, the oar taller.
 */

const stripes = bands(1, 0.034, '#f4f2ec', '#1a2450', 0.5, 0.15);
const black = cloth('#1a1a20', '#0a0a0c');
const straw = (p, n) => {
  const c = grainy('#e8c878', 0.14, 70)(p, n);
  // Plaited round and round: a faint ring every few millimetres.
  const k = 0.9 + 0.1 * Math.abs(Math.sin(p[1] * 260 + Math.hypot(p[0], p[2]) * 260));
  return c.map((v) => v * k);
};
const WOOD = { color: grainy('#8a5a2e', 0.18, 30), mat: 'leather', bone: 'handR' };
const RIBBON = { color: '#c81c24', mat: 'cloth', bone: 'head' };

// The oar, in his right fist: along `up` from the fist, the blade at the top.
const OAR = { up: [0, 0.17, 0.985], below: 0.3, above: 0.78 };

export default person({
  name: 'gondolier',
  scale: 1.44,
  b: 1.04,
  shape: { legs: 1.04, girth: 0.98, hips: 0.95 },
  skin: '#d8a07a',
  look: { torso: stripes, sleeve: stripes, cuff: stripes, legs: black, boot: '#101012', sole: '#08080a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#1a120c', jaw: 1.06, blush: 0.4 },
  hair: { color: cloth('#2a1a10', '#140a06'), cap: [0.106, 0.09, 0.106], at: [0, 0.69, -0.012], locks: [[[0.08, 0.7, -0.03], [0.1, 0.64, -0.07], 0.026], [[-0.08, 0.7, -0.03], [-0.1, 0.64, -0.07], 0.026], [[0, 0.7, -0.09], [0, 0.63, -0.1], 0.035]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Leaning on the oar; the other arm out to the canal, sweeping with the song, chin up, chest out.
      const song = Math.sin(T * 1.3);
      k.turn('armR', 0.1, 0, -0.08);
      if (clip === 'idle') {
        k.turn('armL', -1.25 + song * 0.15, -0.2, 0.75 + song * 0.1);
        k.turn('foreL', 0.05, 0, 0);
        k.turn('handL', 0, 0, -0.4);
        k.turn('chest', -0.08, 0.1 + song * 0.05, 0);
        k.turn('head', -0.28 + song * 0.05, -0.1, 0.06 * song);
      }
    },
  },
  extras(s, J) {
    moustache(s, { color: '#1a120c', wide: 1.3 });
    s.part('kit', () => {
      // A straw boater: a flat brim, a flat-topped crown, a red ribbon round it, the ends down the back.
      const tilt = [-0.12, 0, 0.06];
      s.cylinder([0, 0.752, 0], 0.15, 0.005, { color: straw, mat: 'cloth', bone: 'head', k: 0.004, round: 0.004, rot: tilt });
      s.cylinder([0, 0.79, -0.004], 0.094, 0.036, { color: straw, mat: 'cloth', bone: 'head', k: 0.006, round: 0.008, rot: tilt });
      s.cylinder([0, 0.77, -0.004], 0.097, 0.013, { ...RIBBON, k: 0.003, round: 0.004, rot: tilt });
      for (const m of [1, -1]) s.flake([m * 0.012, 0.77, -0.1], [m * 0.03, 0.67, -0.17], [0, 0.4, -1], 0.012, 0.014, 0.25, { ...RIBBON, k: 0.003 });
      // A red sash round the waist, its ends hanging at the left hip.
      s.torus([0, 0.34, 0.004], 0.078, 0.016, { color: '#c81c24', mat: 'cloth', bone: 'hips', k: 0.006 });
      s.flake([0.075, 0.33, 0.03], [0.092, 0.22, 0.045], [1, 0, 0.4], 0.016, 0.02, 0.3, { color: '#c81c24', mat: 'cloth', bone: 'hips', k: 0.004 });
      // The oar: a long pale shaft, a grip at the fist, a flat blade at the top.
      const h = J.handR, u = OAR.up;
      const at = (d) => [h[0] + u[0] * d, h[1] + 0.004 + u[1] * d, h[2] + 0.01 + u[2] * d];
      s.limb(at(-OAR.below), at(OAR.above), 0.011, 0.012, { ...WOOD, k: 0.002 });
      s.flake(at(OAR.above - 0.04), at(OAR.above + 0.24), [1, 0, 0], 0.024, 0.04, 0.16, { ...WOOD, k: 0.004 });
    });
  },
});
