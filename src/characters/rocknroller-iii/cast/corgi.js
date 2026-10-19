import { coat } from '../../../models/skins.js';
import { quadruped } from './quadruped.js';

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
  extras(s, P, { Hd }) {
    const W = { color: WHITE, mat: 'fur' };
    // The white bib down the front, the blaze up the face.
    s.ellipsoid([0, 0.09, 0.17], [0.045, 0.05, 0.035], { ...W, bone: 'front', k: 0.02 });
    s.limb([0, P.H[1] - 0.005, P.H[2] + 0.035], [0, P.H[1] + 0.03, P.H[2] + 0.02], 0.012, 0.006, { ...W, bone: 'head', k: 0.012 });
    // The fluffy rump.
    s.ellipsoid([0, 0.128, -0.19], [0.05, 0.045, 0.03], { color: RED, mat: 'fur', bone: 'rear', k: 0.02 });
    s.part('kit', () => {
      // The collar, and the tag with its crown.
      s.torus([0, P.N0[1] + 0.025, P.N0[2] + 0.01], 0.04, 0.005, { color: '#c8242c', mat: 'leather', bone: 'neck', k: 0.002, rot: [1.0, 0, 0] });
      s.cylinder([0, P.N0[1] - 0.005, P.N0[2] + 0.04], 0.012, 0.002, { color: '#e8c050', mat: 'gold', bone: 'neck', k: 0.001, rot: [Math.PI / 2 - 0.4, 0, 0] });
      for (const x of [-0.006, 0, 0.006]) s.cone([x, P.N0[1] + 0.012, P.N0[2] + 0.042], 0.003, 0.007, { color: '#e8c050', mat: 'gold', bone: 'neck', k: 0 });
    });
    s.part('fine', () => {
      // Half-lidded: the lids down over the top of each eye, unimpressed.
      for (const m of [1, -1]) s.ellipsoid([m * Hd.r * 0.55, P.H[1] + Hd.r * 0.29, P.H[2] + Hd.r * 0.63], [Hd.r * 0.22, Hd.r * 0.1, Hd.r * 0.18], { color: RED, mat: 'fur', bone: 'head', k: 0.002 });
    });
  },
});
