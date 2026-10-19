import { cloth, person } from './person.js';

/**
 * The A&R Suit: a sharp navy suit, a red tie, slicked hair, a phone at his
 * ear and a briefcase in the other hand. Loves the sound. Wants it more
 * commercial. About 0.95 tiles tall.
 */

const navy = cloth('#1a2a5a', '#0e1838');

export default person({
  name: 'suit',
  scale: 1.45,
  b: 1.08,
  shape: { legs: 1.06, girth: 1.04 },
  belly: 0.5,
  skin: '#d8a888',
  look: { torso: navy, sleeve: navy, cuff: navy, legs: navy, boot: '#101014' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a3a5a', brow: '#1a1208', mood: 0 },
  hair: { color: cloth('#1a1208', '#0a0804'), locks: [[[0, 0.785, 0.05], [0, 0.8, 0.12], 0.04], [[0.05, 0.77, 0.0], [0.09, 0.72, -0.03], 0.03], [[-0.05, 0.77, 0.0], [-0.09, 0.72, -0.03], 0.03]], cap: [0.108, 0.1, 0.108] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone hand up to the ear, talking.
      k.turn('armR', -2.0, 0, -0.45);
      k.turn('foreR', -2.0, 0, 0);
      k.turn('head', 0, -0.2 + Math.sin(T * 3) * 0.05, 0.12);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // White shirt and a red tie in the V.
      s.box([0, 0.47, 0.066], [0.028, 0.07, 0.014], 0.006, { color: '#f2f0ec', mat: 'cloth', bone: 'chest', k: 0.004 });
      s.limb([0, 0.5, 0.082], [0, 0.4, 0.088], 0.011, 0.017, { color: '#d9232f', mat: 'cloth', bone: 'chest', k: 0.003 });
      // A phone at the ear, and a briefcase in the left hand.
      const r = J.handR, l = J.handL;
      s.box([r[0], r[1] + 0.03, r[2]], [0.014, 0.036, 0.008], 0.004, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.box([l[0], l[1] - 0.09, l[2] + 0.02], [0.07, 0.05, 0.02], 0.008, { color: '#3a2a1a', mat: 'leather', bone: 'handL', k: 0.004 });
      s.torus([l[0], l[1] - 0.04, l[2] + 0.02], 0.03, 0.005, { color: '#d6d9e0', mat: 'metal', bone: 'handL', k: 0.002, rot: [0, Math.PI / 2, 0] });
    });
  },
});
