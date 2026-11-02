import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Wolf: out of the spruce at the edge of the car park, grey and
 * silver with a dark saddle and a pale belly and muzzle, long in the leg,
 * the ears up and the eyes pale and fixed on you and nothing else. It
 * does not howl. It has seen the corpse paint and is not impressed
 * either. About 0.4 tiles to the shoulder, and it keeps up.
 */

const GREY = coat({ over: '#7a7e86', under: '#d8d8d4', vary: 0.14, freq: 18, edge: [-0.2, 0.3] });
const SADDLE = coat({ over: '#3a3c44', under: '#7a7e86', vary: 0.12, freq: 14, edge: [0.05, 0.3] });
const PALE = coat({ over: '#d8d8d4', under: '#e8e8e4', vary: 0.06, freq: 20 });

export default quadruped({
  name: 'wolf',
  scale: 1.6,
  hip: 0.15,
  len: 0.15,
  girth: [0.062, 0.06],
  stance: 0.04,
  leg: [0.03, 0.02, 0.016],
  neck: { len: 0.06, rise: 0.7, r: 0.05 },
  head: { r: 0.05, snout: 0.075, sr: 0.026, drop: 0.25, jaw: 0.5 },
  tail: { len: 0.14, rise: -0.4, r: 0.03, tip: 0.012, curl: 0.02 },
  ears: { kind: 'prick', size: 1.1 },
  feet: 'paw',
  eye: { look: [0.42, 0.1, 0.9], size: 0.18 },
  paint: { body: GREY, head: GREY, snout: PALE, legs: GREY, feet: GREY, tail: SADDLE, ears: SADDLE, eye: '#d8a020' },
  style: { gait: 'trot', rate: 11, wag: 0.1, lift: 1, attack: 'bite' },
  extras(s, P, { Hd, T }) {
    // The saddle: a dark patch over the shoulders and back, rough-coated.
    s.ellipsoid([0, 0.19, 0.0], [0.058, 0.026, 0.14], { color: SADDLE, mat: 'fur', bone: 'trunk', k: 0.03, bump: [0.002, 90] });
    // The ruff: thick round the neck and the throat, out over the shoulders.
    s.ellipsoid([0, P.N0[1] + 0.006, P.N0[2] + 0.02], [0.064, 0.062, 0.05], { color: GREY, mat: 'fur', bone: 'neck', k: 0.03, bump: [0.003, 70] });
    s.ellipsoid([0, P.N0[1] - 0.03, P.N0[2] + 0.04], [0.04, 0.04, 0.035], { color: PALE, mat: 'fur', bone: 'neck', k: 0.025, bump: [0.002, 90] });
    // The cheeks flaring back, the brow over the eyes, the dark top of the muzzle.
    for (const m of [1, -1]) {
      s.ellipsoid([m * Hd.r * 0.7, P.H[1] - Hd.r * 0.25, P.H[2] - Hd.r * 0.1], [Hd.r * 0.45, Hd.r * 0.5, Hd.r * 0.55], { color: PALE, mat: 'fur', bone: 'head', k: 0.012, bump: [0.0015, 120] });
      s.ellipsoid([m * Hd.r * 0.42, P.H[1] + Hd.r * 0.42, P.H[2] + Hd.r * 0.55], [Hd.r * 0.32, Hd.r * 0.16, Hd.r * 0.26], { color: GREY, mat: 'fur', bone: 'head', k: 0.01 });
    }
    s.limb([0, P.S0[1] + Hd.sr * 0.75, P.S0[2]], [0, P.S1[1] + Hd.sr * 0.6, P.S1[2] - Hd.sr * 0.4], Hd.sr * 0.42, Hd.sr * 0.3, { color: SADDLE, mat: 'fur', bone: 'head', k: 0.01 });
    // The brush: a full tail, bushier than its bones.
    s.limb(P.T0, P.T1, T.r * 1.2, T.r * 1.5, { color: SADDLE, mat: 'fur', bone: 'tail', k: 0.015, bump: [0.003, 70] });
    s.limb(P.T1, P.T2, T.r * 1.5, T.r * 0.6, { color: SADDLE, mat: 'fur', bone: 'tail2', k: 0.012, bump: [0.003, 70] });
  },
});
