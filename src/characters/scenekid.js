import { cloth, cuffBand, hold, person, plate } from './person.js';
import { chestPrint } from './metalwear.js';

/**
 * The Scene Kid: a flat-ironed side-swept fringe dyed black with a neon
 * streak in it, eyeliner to the ears, a band T-shirt two sizes too small,
 * jeans so tight they are mostly a theory, a studded belt, a stack of
 * rubber wristbands to the elbow, Converse, and a phone held up at the
 * best angle: the MySpace angle, from above, with the lips pushed out.
 * Has 4,000 friends. Knows none of them. About 0.9 tiles tall.
 */

const HAIR = cloth('#0a0a0e', '#04040a');
const TEE = cloth('#16161a', '#08080a');

export default person({
  name: 'scenekid',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.08, girth: 0.8, torso: 0.94 },
  skin: '#f0d0c0',
  look: { torso: TEE, sleeve: TEE, cuff: '#f0d0c0', legs: cloth('#16181e', '#0a0c10'), boot: '#f4f2ee', sole: '#16161a', belt: '#f4f2ee', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#2a3a4a', brow: '#0a0a0c', mood: 1, blush: 0.5 },
  hair: { color: HAIR, locks: [[[-0.07, 0.75, -0.03], [-0.11, 0.63, -0.05], 0.04, 0.5], [[0.08, 0.74, -0.02], [0.11, 0.63, -0.04], 0.035, 0.5], [[0, 0.78, -0.06], [0, 0.64, -0.13], 0.05, 0.5], [[0.05, 0.77, -0.08], [0.08, 0.66, -0.12], 0.035, 0.5], [[-0.05, 0.77, -0.08], [-0.08, 0.66, -0.12], 0.035, 0.5]], cap: [0.108, 0.09, 0.108] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone held up and out in front for the angle, the head tilted, the pose held, shifting it a little
      // every few seconds.
      hold(k, 'armR', -1.8, 0, -0.35); hold(k, 'foreR', -0.3, 0, 0);
      aim?.(k, 'R', 'chest', [-0.15, 1.3, 0.6]);
      hold(k, 'armL', 0.1, 0, 0.35); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('head', 0.15, 0.15 + Math.round(Math.sin(T * 0.7)) * 0.1, 0.22);
      k.turn('hips', 0, 0, Math.sin(T * 0.5) * 0.05);
    },
  },
  extras(s, J, { pose }) {
    chestPrint(s, 'smile', '#ff3a9a', { y: 0.46, size: 0.04 });
    // The fringe: swept long across the brow and down over the right eye, a neon green streak through it.
    s.part('hair', () => {
      s.flake([0.07, 0.775, 0.04], [-0.035, 0.7, 0.112], [0.15, 0.45, 1], 0.03, 0.026, 0.3, { color: HAIR, mat: 'hair', bone: 'head', k: 0.012 });
      s.flake([-0.03, 0.705, 0.11], [-0.07, 0.645, 0.1], [0.3, 0.2, 1], 0.026, 0.008, 0.3, { color: HAIR, mat: 'hair', bone: 'head', k: 0.008 });
    });
    s.paint((p) => Math.max(Math.abs(p[0] - 0.03 + (0.775 - p[1]) * 0.9) - 0.007, 0.06 - p[2], 0.66 - p[1]), '#3aff9a', 0.002);
    // Stacked rubber bands on both wrists.
    for (const S of ['L', 'R']) {
      [['#ff3a9a', 0.8], ['#3ad8ff', 0.86], ['#16161a', 0.92]].forEach(([c, t]) => cuffBand(s, J[`elbow${S}`], J[`wrist${S}`], t, { width: 0.009, thick: 0.004, color: c, mat: 'plastic', bone: `fore${S}` }));
    }
    // The phone in the right fist, its screen to them.
    const G = pose.grip('R'), c = G.at(0, -0.035, -0.006);
    const n0 = [G.along[1] * G.up[2] - G.along[2] * G.up[1], G.along[2] * G.up[0] - G.along[0] * G.up[2], G.along[0] * G.up[1] - G.along[1] * G.up[0]];
    const eye = pose.at('head', [0, 0.67, 0.05]), te = eye.map((v, i) => v - c[i]);
    const n = n0[0] * te[0] + n0[1] * te[1] + n0[2] * te[2] > 0 ? n0 : n0.map((v) => -v);
    pose.hold(s, 'handR', () => {
      s.part('kit', () => plate(s, c, G.along, G.up, [0.024, 0.046, 0.004], 0.004, { color: '#16161a', mat: 'plastic', k: 0.002 }));
      s.part('fine', () => plate(s, c.map((v, i) => v + n[i] * 0.0041), G.along, G.up, [0.021, 0.042, 0.0008], 0.002, { color: '#9ad8ff', mat: 'screen', k: 0 }));
    });
  },
});
