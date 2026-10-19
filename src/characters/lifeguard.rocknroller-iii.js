import { cloth, hold, person } from './person.js';

/**
 * The Lifeguard: a volunteer surf lifesaver at Bondi, in the red and
 * yellow: the cap in quarters tied under the chin, the yellow shirt, the
 * red shorts, the rescue tube slung over the shoulder on its strap, and
 * the whistle, which he blows, with the other arm out pointing at the
 * flags you are not between. Red and yellow. Blows the whistle. Means it.
 * About 1.0 tiles tall.
 */

const SKIN = '#d8986a';
const YELLOW = cloth('#f8d020', '#d0a810');
const RED = cloth('#d8141e', '#a00a14');
/** The cap: red and yellow in quarters. */
const CAP = (p) => ((p[0] > 0) !== (p[2] > 0) ? [0.85, 0.08, 0.1] : [0.97, 0.82, 0.12]);

export default person({
  name: 'lifeguard',
  scale: 1.47,
  b: 1.08,
  shape: { legs: 1.06, girth: 1.02 },
  skin: SKIN,
  look: { torso: YELLOW, sleeve: YELLOW, cuff: SKIN, legs: (p, n) => (p[1] > 0.22 ? RED(p, n) : cloth(SKIN)(p, n)), boot: SKIN },
  mats: { cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#3a6a8a', brow: '#8a6a3a', jaw: 1.1, mood: 1, blush: 0.6 },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, blow = Math.max(0, Math.sin(T * 3));
      // The whistle to the mouth; the other arm out, pointing up the beach at the flags.
      hold(k, 'armR', -0.6, 0.5, -0.4);
      hold(k, 'foreR', -1.9, 0, 0);
      hold(k, 'armL', -1.4, 0, 0.7 + blow * 0.15);
      hold(k, 'foreL', -0.1, 0, 0);
      k.turn('chest', -0.05 * blow, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The quartered cap, tied under the chin.
      s.ellipsoid([0, 0.715, -0.006], [0.108, 0.09, 0.108], { color: CAP, mat: 'cloth', bone: 'head', k: 0.01 });
      s.ellipsoid([0, 0.66, 0.07], [0.12, 0.08, 0.09], { op: 'sub', k: 0.02 });
      for (const m of [1, -1]) s.limb([m * 0.09, 0.66, 0.02], [m * 0.02, 0.575, 0.07], 0.004, 0.004, { color: '#f8d020', mat: 'cloth', bone: 'head', k: 0.001 });
      // The rescue tube on its strap, over the left shoulder, down the back.
      s.limb([0.08, 0.53, 0.0], [-0.09, 0.3, 0.06], 0.006, 0.006, { color: '#1a1a1e', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([0.02, 0.4, -0.085], [0.03, 0.13, 0.02], 0.02, { color: '#ff6a1a', mat: 'plastic', bone: 'chest', k: 0.006, rot: [0, 0, 0.5] });
      // The whistle on its lanyard.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.03, r[2] + 0.02], [r[0], r[1] + 0.06, r[2] + 0.02], 0.01, 0.01, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.002 });
      s.limb([0, 0.52, 0.06], [r[0] * 0.3, 0.45, 0.08], 0.002, 0.002, { color: '#1a1a1e', mat: 'cloth', bone: 'chest', k: 0 });
    });
  },
});
