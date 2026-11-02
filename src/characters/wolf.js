import { fbm, noise, rgb } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Wolf: out of the spruce at the edge of the car park, grey and
 * silver with a dark saddle and a pale belly and muzzle, long in the leg,
 * the ears up and the eyes pale and fixed on you and nothing else. It
 * does not howl. It has seen the corpse paint and is not impressed
 * either. About 0.4 tiles to the shoulder, and it keeps up.
 */

const GREY = rgb('#686a70'), SILVER = rgb('#a4a4a2'), CREAM = rgb('#ece6da'), BLACK = rgb('#26262a'), TAWNY = rgb('#a08060');

/**
 * The wolf's coat, as a wolf's is: agouti grey, each hair banded, so it
 * flecks light and dark; a dark saddle over the back and shoulders and
 * down the top of the tail to its black tip; tawny on the backs of the
 * ears and down the outsides of the legs; cream underneath, on the throat,
 * the cheeks and the muzzle; a dark mask between the eyes and down the
 * bridge of the nose, and a dark line down the front of each foreleg.
 */
const COAT = (p, n) => {
  // Agouti: a soft variation of grey and silver over the coat, and a fine fleck too small to be more than a grain.
  const tone = fbm(p[0] * 24, p[1] * 24, p[2] * 24, 3), fleck = noise(p[0] * 300, p[1] * 300, p[2] * 80);
  let c = mix(GREY, SILVER, smooth(0.3, 0.75, tone)).map((v) => v * (0.94 + 0.12 * fleck));
  // The saddle: over the top of the back and the withers.
  const back = smooth(0.15, 0.6, n[1]) * smooth(0.12, 0.18, p[1]) * smooth(0.16, 0.06, p[2]) * smooth(-0.2, -0.1, p[2]);
  const saddle = back * (0.7 + 0.5 * (fbm(p[0] * 20, p[1] * 20, p[2] * 20, 2) - 0.5));
  c = mix(c, mix(BLACK, GREY, 0.3), Math.min(1, saddle * 1.25));
  // Tawny down the outsides of the legs.
  if (p[1] < 0.12 && p[1] > 0.02) c = mix(c, TAWNY, 0.3 * smooth(0.2, 0.8, Math.abs(n[0])));
  // Cream on the cheeks and the muzzle's sides and underneath it.
  if (p[2] > 0.2) {
    const cheek = smooth(-0.1, -0.5, n[1]) + smooth(0.5, 0.95, Math.abs(n[0])) * smooth(0.235, 0.215, p[1]) * 0.6;
    c = mix(c, CREAM, Math.min(1, cheek));
    // The mask: dark between the eyes and down the bridge.
    const bridge = smooth(0.012, 0.004, Math.abs(p[0])) * smooth(0.0, 0.6, n[1]);
    c = mix(c, mix(GREY, BLACK, 0.55), bridge * 0.8);
  }
  // A dark line down the front of each foreleg.
  if (p[2] > 0.08 && p[2] < 0.16 && p[1] < 0.1) c = mix(c, BLACK, smooth(0.6, 0.95, n[2]) * 0.7);
  return c;
};
/** The brush: grey, dark along the top, the tip black. */
const TAIL = (p, n) => {
  let c = mix(GREY, SILVER, smooth(0.3, 0.75, fbm(p[0] * 24, p[1] * 24, p[2] * 24, 3)));
  c = mix(c, BLACK, smooth(0.0, 0.7, n[1]) * 0.6);
  return mix(c, BLACK, smooth(-0.29, -0.33, p[2] + p[1] * 0.3));
};
const EARS = (p, n) => mix(mix(GREY, TAWNY, 0.45), BLACK, smooth(0.0, -0.8, n[2]) * 0.35);

export default quadruped({
  name: 'wolf',
  scale: 1.6,
  budget: 70000,
  hip: 0.17,
  len: 0.11,
  girth: [0.048, 0.056],
  stance: 0.03,
  leg: [0.026, 0.018, 0.0125],
  neck: { len: 0.065, rise: 0.62, r: 0.04 },
  head: { r: 0.036, snout: 0.07, sr: 0.019, drop: 0.1, jaw: 0.5 },
  tail: { len: 0.15, rise: -0.95, r: 0.022, tip: 0.012, curl: 0.25 },
  ears: { kind: 'prick', size: 0.95 },
  feet: 'paw',
  eye: { look: [0.42, 0.1, 0.9], size: 0.17 },
  paint: { body: COAT, head: COAT, snout: COAT, legs: COAT, feet: COAT, tail: TAIL, ears: EARS, inner: '#d8d2c6', eye: '#e0a830', rim: '#141414', countershade: 0.7, under: '#e2dccf', grain: 0.12 },
  style: { gait: 'trot', rate: 11, wag: 0.1, lift: 1, attack: 'bite' },
  extras(s, P, { Hd, T, N }) {
    // The ruff: thick round the neck and the throat, standing out over the shoulders, in locks.
    s.ellipsoid([0, P.N0[1] + 0.004, P.N0[2] + 0.012], [N.r * 1.2, N.r * 1.18, N.r * 0.95], { color: COAT, mat: 'fur', bone: 'neck', k: 0.03, locks: [0.012, 0.0035, 1, 2.2] });
    s.ellipsoid([0, P.N0[1] - 0.026, P.N0[2] + 0.018], [N.r * 0.8, N.r * 0.8, N.r * 0.62], { color: COAT, mat: 'fur', bone: 'neck', k: 0.025, locks: [0.01, 0.003, 1, 2.2] });
    // The cheeks flaring back behind the jaw.
    for (const m of [1, -1]) s.ellipsoid([m * Hd.r * 0.72, P.H[1] - Hd.r * 0.32, P.H[2] - Hd.r * 0.15], [Hd.r * 0.42, Hd.r * 0.52, Hd.r * 0.5], { color: COAT, mat: 'fur', bone: 'head', k: 0.012, locks: [0.008, 0.002, 1, 2] });
    // The brush: full, hanging, thicker than its bones.
    s.limb(P.T0, P.T1, T.r * 1.1, T.r * 1.55, { color: TAIL, mat: 'fur', bone: 'tail', k: 0.015, locks: [0.012, 0.003, 1, 2.4] });
    s.limb(P.T1, P.T2, T.r * 1.55, T.r * 0.5, { color: TAIL, mat: 'fur', bone: 'tail2', k: 0.012, locks: [0.012, 0.003, 1, 2.4] });
  },
});
