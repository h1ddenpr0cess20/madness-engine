import { cloth, hold, person } from './person.js';
import { chestPrint } from './metalwear.js';

/**
 * The Scene Kid: a flat-ironed side-swept fringe dyed black with a neon
 * streak in it, eyeliner to the ears, a band T-shirt two sizes too small,
 * jeans so tight they are mostly a theory, a studded belt, a stack of
 * rubber wristbands to the elbow, Converse, and a phone held up at the
 * best angle: the MySpace angle, from above, with the lips pushed out.
 * Has 4,000 friends. Knows none of them. About 0.9 tiles tall.
 */

const TEE = cloth('#16161a', '#08080a');

export default person({
  name: 'scenekid',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.08, girth: 0.8, torso: 0.94 },
  skin: '#f0d0c0',
  look: { torso: TEE, sleeve: TEE, cuff: '#f0d0c0', legs: cloth('#16181e', '#0a0c10'), boot: '#f4f2ee', sole: '#16161a', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#2a3a4a', brow: '#0a0a0c', mood: 1, blush: 0.5 },
  hair: { color: cloth('#0a0a0e', '#04040a'), locks: [[[0.03, 0.78, 0.05], [0.06, 0.66, 0.1], 0.05, 0.7], [[0.08, 0.74, 0.02], [0.1, 0.62, 0.04], 0.04, 0.6], [[-0.07, 0.75, -0.03], [-0.1, 0.62, -0.06], 0.04, 0.5], [[0, 0.78, -0.06], [0, 0.66, -0.12], 0.05, 0.5]], cap: [0.108, 0.07, 0.108] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone up high and to the side, the head tilted, the pose held, shifting it a little every few seconds.
      hold(k, 'armR', -2.2, 0.2, -0.5); hold(k, 'foreR', -0.5, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.35); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('head', 0.18, 0.15 + Math.round(Math.sin(T * 0.7)) * 0.1, 0.22);
      k.turn('hips', 0, 0, Math.sin(T * 0.5) * 0.05);
    },
  },
  extras(s, J) {
    chestPrint(s, 'smile', '#ff3a9a', { y: 0.46, size: 0.04 });
    s.part('kit', () => {
      // A neon streak in the fringe, and the wristbands.
      s.limb([0.04, 0.775, 0.06], [0.06, 0.68, 0.105], 0.012, 0.01, { color: '#3aff9a', mat: 'hair', bone: 'head', k: 0.004 });
      for (const m of [1, -1]) {
        const w = J[m > 0 ? 'wristL' : 'wristR'];
        for (const [i, c] of [[0, '#ff3a9a'], [1, '#3ad8ff'], [2, '#16161a']]) s.torus([w[0], w[1] + 0.01 + i * 0.012, w[2]], 0.022, 0.006, { color: c, mat: 'plastic', bone: m > 0 ? 'foreL' : 'foreR', k: 0.002, rot: [0, 0, Math.PI / 2 * m] });
      }
      // The phone: a slab in the right hand, its screen lit.
      const r = J.handR;
      s.box([r[0], r[1] + 0.035, r[2]], [0.02, 0.032, 0.004], 0.002, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.001 });
      s.box([r[0], r[1] + 0.035, r[2] + 0.005], [0.017, 0.028, 0.001], 0.001, { color: '#9ad8ff', mat: 'screen', bone: 'handR', k: 0.0005 });
    });
  },
});
