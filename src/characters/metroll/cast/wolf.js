import { coat } from '../../../models/skins.js';
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
  hip: 0.13,
  len: 0.15,
  girth: [0.062, 0.06],
  stance: 0.04,
  leg: [0.03, 0.022, 0.018],
  neck: { len: 0.06, rise: 0.7, r: 0.05 },
  head: { r: 0.05, snout: 0.075, sr: 0.026, drop: 0.25, jaw: 0.5 },
  tail: { len: 0.14, rise: -0.4, r: 0.03, tip: 0.012, curl: 0.02 },
  ears: { kind: 'prick', size: 1.1 },
  feet: 'paw',
  paint: { body: GREY, head: GREY, snout: PALE, legs: GREY, feet: SADDLE, tail: SADDLE, ears: SADDLE },
  style: { gait: 'trot', rate: 11, wag: 0.1, lift: 1, attack: 'bite' },
  extras(s, P) {
    // The saddle: a dark patch over the shoulders and back, and the ruff round the neck.
    s.ellipsoid([0, 0.17, 0.02], [0.062, 0.025, 0.14], { color: SADDLE, mat: 'fur', bone: 'trunk', k: 0.03 });
    s.ellipsoid([0, P.N0[1] + 0.01, P.N0[2] + 0.015], [0.058, 0.06, 0.05], { color: GREY, mat: 'fur', bone: 'neck', k: 0.03 });
  },
});
