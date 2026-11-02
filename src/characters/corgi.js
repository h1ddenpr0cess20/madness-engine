import { coat } from '../models/skins.js';
import { collar, quadruped } from './quadruped.js';

/**
 * The Corgi: one of Her Majesty's, or says so. Long and low, fox-red on top
 * and white underneath, white socks, a white blaze up the face, the big
 * ears straight up, and the stump of a fluffy behind going all the time. A
 * red collar with a little gold crown on the tag. Looks at a boulder the
 * way it looks at everything that is not a biscuit: half-lidded. About 0.35
 * tiles tall to the ears, and fast.
 */

const RED = coat({ over: '#d8803a', under: '#f4ece0', vary: 0.1, freq: 16, edge: [-0.15, 0.25] });
const WHITE = coat({ over: '#f6f0e6', under: '#e8dcd0', vary: 0.06, freq: 20 });

export default quadruped({
  name: 'corgi',
  scale: 1.5,
  hip: 0.108,
  len: 0.13,
  girth: [0.066, 0.058],
  stance: 0.045,
  leg: [0.03, 0.024, 0.021],
  neck: { len: 0.05, rise: 0.8, r: 0.045 },
  head: { r: 0.05, snout: 0.045, sr: 0.024, drop: 0.2 },
  tail: { len: 0.05, rise: 0.6, r: 0.026, tip: 0.018 },
  ears: { kind: 'prick', size: 1.25 },
  paint: { body: RED, head: RED, snout: WHITE, legs: WHITE, feet: WHITE, tail: RED, ears: '#c87030' },
  style: { rate: 15, wag: 0.9, lift: 0.9 },
  extras(s, P) {
    const W = { color: WHITE, mat: 'fur' };
    // The white bib down the front, the blaze up the face.
    s.ellipsoid([0, 0.09, 0.17], [0.045, 0.05, 0.035], { ...W, bone: 'front', k: 0.02 });
    s.limb([0, P.H[1] - 0.005, P.H[2] + 0.035], [0, P.H[1] + 0.03, P.H[2] + 0.02], 0.012, 0.006, { ...W, bone: 'head', k: 0.012 });
    // The fluffy rump.
    s.ellipsoid([0, 0.128, -0.19], [0.05, 0.045, 0.03], { color: RED, mat: 'fur', bone: 'rear', k: 0.02 });
    // The red collar, and on its ring at the front a gold tag with a little crown on it.
    const { front } = collar(s, P, { at: 0.55, color: '#c8242c', width: 0.015, thick: 0.005, tag: '#e8c050' });
    s.part('kit', () => {
      const t = [front.p[0], front.p[1] - 0.013, front.p[2] + 0.006];
      for (const x of [-0.0035, 0, 0.0035]) s.cone([t[0] + x, t[1] + 0.002, t[2] + 0.001], 0.0016, 0.004, { color: '#e8c050', mat: 'gold', bone: 'neck', k: 0 });
    });
  },
});
