import { cloth, hold, person, plate } from './person.js';
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
  budget: 62700,
  scale: 1.5,
  b: 1.04,
  shape: { legs: 0.9, girth: 1.0 },
  skin: '#c8b8b0',
  look: { torso: ROBE, sleeve: ROBE, cuff: ROBE, legs: ROBE, boot: '#16101a', sole: '#2a2030' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#c8a040', brow: '#1a1218', mood: -1 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A candle held up and a book held open, the head bowed and nodding, a slow sway: the chant.
      hold(k, 'armR', -0.55, 0, 0.15); hold(k, 'foreR', -1.55, 0, 0);
      aim?.(k, 'R', 'chest', [-0.15, 2.0, 0.2]);
      hold(k, 'armL', -0.5, -0.6, -0.05); hold(k, 'foreL', -1.15, 0, 0);
      k.turn('head', 0.3 + Math.sin(T * 1.3) * 0.08, 0, 0);
      k.turn('hips', 0, Math.sin(T * 0.6) * 0.06, 0);
    },
  },
  extras(s, J, { pose }) {
    robe(s, { color: '#3a1a3a', trim: '#c8a040', flare: 1.1 });
    hood(s, { color: '#3a1a3a', lining: '#12081a' });
    // The candle, upright in the right fist, and its flame.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(R.at(-0.03), R.at(0.08), 0.0115, 0.011, { color: '#f0e8d0', mat: 'cloth', k: 0.002 });
        s.limb(R.at(0.08), R.at(0.087), 0.0018, 0.0016, { color: '#1a1a1a', mat: 'cloth', k: 0.001 });
      });
      s.part('fine', () => s.limb(R.at(0.087), R.at(0.115), 0.0062, 0.0012, { color: '#ffb02a', mat: 'glow', k: 0.002 }));
    });
    // The book, open on the left hand: its two boards in a shallow V on the palm, the spine down the middle, the
    // pages fanned on each board, the thick of the book's pages at their edges.
    const L = pose.grip('L');
    const spine = L.along, outward = L.out.map((v) => -v);
    const base = L.at(0, 0, -0.012);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      for (const m of [1, -1]) {
        // Each half: across from the spine to the side, tipped up a little toward the reader.
        const side = [spine[1] * outward[2] - spine[2] * outward[1], spine[2] * outward[0] - spine[0] * outward[2], spine[0] * outward[1] - spine[1] * outward[0]].map((v) => v * m);
        const tilt = side.map((v, i) => v * Math.cos(0.22) + outward[i] * Math.sin(0.22));
        const up = [tilt[1] * spine[2] - tilt[2] * spine[1], tilt[2] * spine[0] - tilt[0] * spine[2], tilt[0] * spine[1] - tilt[1] * spine[0]].map((v) => v * m);
        const mid = base.map((v, i) => v + tilt[i] * 0.036);
        plate(s, mid, tilt, spine, [0.036, 0.048, 0.0025], 0.0015, { color: '#2a0e0e', mat: 'leather', k: 0.001 });
        plate(s, mid.map((v, i) => v + up[i] * 0.0055 - tilt[i] * 0.002), tilt, spine, [0.033, 0.045, 0.0035], 0.0015, { color: '#e8dcc0', mat: 'paper', k: 0.0008 });
      }
      s.limb(base.map((v, i) => v - spine[i] * 0.048), base.map((v, i) => v + spine[i] * 0.048), 0.004, 0.004, { color: '#2a0e0e', mat: 'leather', k: 0.001 });
    }));
  },
});
