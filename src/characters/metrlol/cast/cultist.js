import { cloth, hold, person } from './person.js';
import { hood, robe } from './metalwear.js';

/**
 * The Cultist: a long robe the colour of a bad bruise, a hood, a candle in
 * one hand and a book in the other that is mostly the same word over and
 * over. Chants. Does not say what. Has been here since before the venue,
 * and will be here after. A slow walker who is not at all in a hurry.
 * About 1.0 tiles tall.
 */

const ROBE = cloth('#3a1a3a', '#1e0c20');

export default person({
  name: 'cultist',
  budget: 19000,
  scale: 1.5,
  b: 1.04,
  shape: { legs: 0.9, girth: 1.0 },
  skin: '#c8b8b0',
  look: { torso: ROBE, sleeve: ROBE, cuff: ROBE, legs: ROBE, boot: '#16101a', sole: '#2a2030' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#c8a040', brow: '#1a1218', mood: -1 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A candle held up and a book held open, the head bowed and nodding, a slow sway: the chant.
      hold(k, 'armR', -0.55, 0, 0.15); hold(k, 'foreR', -1.55, 0, 0);
      hold(k, 'armL', -0.5, -0.6, -0.05); hold(k, 'foreL', -1.15, 0, 0);
      k.turn('head', 0.3 + Math.sin(T * 1.3) * 0.08, 0, 0);
      k.turn('hips', 0, Math.sin(T * 0.6) * 0.06, 0);
    },
  },
  extras(s) {
    robe(s, { color: '#3a1a3a', trim: '#c8a040', flare: 1.1 });
    hood(s, { color: '#3a1a3a', lining: '#12081a' });
    s.part('kit', () => {
      // The candle, and its flame.
      // Held where the posed fists are, on the chest, so they stand upright.
      s.cylinder([-0.158, 0.53, 0.155], 0.011, 0.045, { color: '#f0e8d0', mat: 'cloth', bone: 'chest', k: 0.003, round: 0.003 });
      s.limb([-0.158, 0.585, 0.155], [-0.158, 0.612, 0.155], 0.009, 0.002, { color: '#ffb02a', mat: 'glow', bone: 'chest', k: 0.002 });
      // The book, open on the left hand: two dark covers in a shallow V, pages on them.
      for (const m of [1, -1]) {
        s.box([0.05 + m * 0.034, 0.462, 0.178], [0.034, 0.004, 0.046], 0.003, { color: '#2a0e0e', mat: 'leather', bone: 'chest', k: 0.002, rot: [0.55, 0, m * -0.25] });
        s.box([0.05 + m * 0.032, 0.467, 0.178], [0.03, 0.003, 0.042], 0.002, { color: '#e8dcc0', mat: 'paper', bone: 'chest', k: 0.001, rot: [0.55, 0, m * -0.25] });
      }
    });
  },
});
