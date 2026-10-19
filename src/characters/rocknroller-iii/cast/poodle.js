import { coat } from '../../../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Poodle: a standard, in the full continental clip, groomed this
 * morning at a salon off the Rue du Faubourg Saint-Honoré. Shaved fine
 * everywhere it is not a pom-pom: a mane over the chest and shoulders, a
 * topknot with a pink bow in it, fluffed ears, a rosette on each hip, a
 * bracelet on each ankle and a pom-pom on the end of the tail held high.
 * Better hair than anyone in the band. About 0.55 tiles tall to the
 * topknot.
 */

const SHAVED = coat({ over: '#f2e8e4', under: '#e0d0cc', vary: 0.05, freq: 20, grain: 0.04 });
const FLUFF = coat({ over: '#fbf6f2', under: '#e8dcd8', vary: 0.1, freq: 40, grain: 0.12, gfreq: 120 });
const PUFF = { color: FLUFF, mat: 'fur', bump: [0.004, 90] };

export default quadruped({
  name: 'poodle',
  scale: 1.5,
  hip: 0.2,
  len: 0.1,
  girth: [0.042, 0.05],
  stance: 0.032,
  leg: [0.018, 0.013, 0.012],
  neck: { len: 0.09, rise: 1.15, r: 0.026 },
  head: { r: 0.036, snout: 0.055, sr: 0.015, drop: 0.12 },
  tail: { len: 0.07, rise: 1.25, r: 0.009, tip: 0.007 },
  ears: { kind: null },
  paint: { body: SHAVED, nose: '#1a1214', feet: SHAVED },
  style: { rate: 12, wag: 0.5, lift: 1.0, after(k, { clip }, T) {
    // Prancing: the head held up, a toss now and then.
    if (clip === 'idle') k.turn('head', -0.1 - Math.max(0, Math.sin(T * 0.8)) * 0.15, 0, 0);
  } },
  extras(s, P, { Hd }) {
    // The mane: a cloud over the chest and shoulders and up the neck.
    s.ellipsoid([0, 0.205, 0.09], [0.06, 0.07, 0.07], { ...PUFF, bone: 'front', k: 0.02 });
    s.limb(P.N0, P.N1, 0.045, 0.036, { ...PUFF, bone: 'neck', k: 0.02 });
    // The rosettes on the hips, and the pom-pom on the tail.
    for (const m of [1, -1]) s.sphere([m * 0.035, 0.215, -0.085], 0.03, { ...PUFF, bone: 'rear', k: 0.006 });
    s.sphere(P.T2, 0.034, { ...PUFF, bone: 'tail2', k: 0.004 });
    // A bracelet round each ankle.
    for (const n of ['FL', 'FR', 'BL', 'BR']) {
      const L = P.legs[n];
      s.sphere([L.foot[0], 0.04, L.foot[2]], 0.026, { ...PUFF, bone: `shin${n}`, k: 0.006 });
    }
    // The topknot, and the ears fluffed out long either side.
    s.ellipsoid([0, P.H[1] + 0.035, P.H[2] - 0.005], [0.04, 0.042, 0.044], { ...PUFF, bone: 'head', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * Hd.r * 0.95, P.H[1] - 0.025, P.H[2] - 0.01], [0.02, 0.045, 0.024], { ...PUFF, bone: 'head', k: 0.008 });
    s.part('kit', () => {
      // The pink bow in the topknot.
      for (const m of [1, -1]) s.ellipsoid([m * 0.014, P.H[1] + 0.075, P.H[2] - 0.01], [0.014, 0.009, 0.005], { color: '#ff7ab0', mat: 'cloth', bone: 'head', k: 0.003, rot: [0, 0, m * 0.3] });
      s.sphere([0, P.H[1] + 0.075, P.H[2] - 0.01], 0.006, { color: '#e85a98', mat: 'cloth', bone: 'head', k: 0.002 });
    });
  },
});
