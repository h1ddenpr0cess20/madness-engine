import { coat } from '../../../models/skins.js';
import { fbm } from '../../../models/sdf.js';
import { quadruped } from './quadruped.js';

/**
 * The St Bernard: off the Great St Bernard Pass, enormous and kind and
 * slow, white with a red-brown saddle and patches, a dark mask round the
 * eyes, a white blaze down the face, jowls, ears that hang, and the brandy
 * cask on a strap under its chin, for whoever it finds in the snow. It has
 * found Rock. It is going to rescue him whether he likes it or not. About
 * 0.65 tiles tall.
 */

const WHITE = coat({ over: '#f6f0e8', under: '#e4d8cc', vary: 0.08, freq: 18 });
const BROWN = coat({ over: '#a0522a', under: '#7a3a1c', vary: 0.12, freq: 18 });
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** White, with the brown saddle over the back and patches where the noise says. */
const PATCHED = (p, n) => {
  const w = WHITE(p, n), b = BROWN(p, n);
  const saddle = smooth(0.29, 0.34, p[1] + (fbm(p[0] * 14, p[1] * 14, p[2] * 14, 3) - 0.5) * 0.08) * smooth(0.2, 0.12, Math.abs(p[2] + 0.02));
  const patch = smooth(0.56, 0.62, fbm(p[0] * 9 + 3, p[1] * 9, p[2] * 9, 3));
  const t = Math.max(saddle, patch * smooth(0.18, 0.26, p[1]));
  return w.map((v, i) => v + (b[i] - v) * t);
};
const FACE = (p, n) => {
  const w = WHITE(p, n), b = BROWN(p, n);
  // Brown either side, the white blaze up the middle.
  const t = smooth(0.012, 0.03, Math.abs(p[0]));
  return w.map((v, i) => v + (b[i] - v) * t);
};

export default quadruped({
  name: 'stbernard',
  scale: 1.55,
  hip: 0.27,
  len: 0.17,
  girth: [0.1, 0.1],
  stance: 0.062,
  leg: [0.046, 0.036, 0.032],
  neck: { len: 0.06, rise: 0.55, r: 0.075 },
  head: { r: 0.075, snout: 0.045, sr: 0.046, drop: 0.35 },
  tail: { len: 0.2, rise: -0.7, r: 0.026, tip: 0.016, curl: 0.5 },
  ears: { kind: 'flop', size: 1.0 },
  paint: { body: PATCHED, head: FACE, snout: WHITE, legs: WHITE, feet: WHITE, tail: PATCHED, ears: BROWN, nose: '#1a1210' },
  style: { rate: 7, wag: 0.3, lift: 0.6, after(k, { clip }, T) {
    // Panting, and the slow sweep of the tail.
    if (clip !== 'ko') k.turn('jaw', 0.12 + Math.sin(T * 7) * 0.04, 0, 0);
  } },
  extras(s, P, { Hd }) {
    // The dark mask round each eye, the jowls hanging either side of the jaw.
    for (const m of [1, -1]) {
      s.ellipsoid([m * Hd.r * 0.55, P.H[1] + Hd.r * 0.18, P.H[2] + Hd.r * 0.5], [0.026, 0.022, 0.016], { color: '#3a1e10', mat: 'fur', bone: 'head', k: 0.012 });
      s.ellipsoid([m * 0.032, P.S1[1] - 0.04, P.S1[2] - 0.02], [0.022, 0.032, 0.03], { color: WHITE, mat: 'fur', bone: 'jaw', k: 0.012 });
    }
    // A ruff of white down the chest.
    s.ellipsoid([0, 0.25, 0.22], [0.07, 0.08, 0.05], { color: WHITE, mat: 'fur', bone: 'front', k: 0.03, bump: [0.003, 70] });
    s.part('kit', () => {
      // The collar, and the cask hanging from it under the chin, hooped.
      s.torus([0, P.N0[1] + 0.03, P.N0[2] + 0.015], 0.074, 0.008, { color: '#5a2a14', mat: 'leather', bone: 'neck', k: 0.002, rot: [1.1, 0, 0] });
      const c = [0, P.N0[1] - 0.05, P.N0[2] + 0.07];
      s.cylinder(c, 0.032, 0.04, { color: '#a87038', mat: 'wood', bone: 'neck', k: 0.004, round: 0.01, rot: [0, 0, Math.PI / 2] });
      for (const x of [-0.028, 0.028]) s.cylinder([x, c[1], c[2]], 0.034, 0.003, { color: '#8a8a90', mat: 'metal', bone: 'neck', k: 0.001, round: 0.002, rot: [0, 0, Math.PI / 2] });
      s.cylinder([0, c[1] + 0.034, c[2]], 0.006, 0.006, { color: '#3a2010', mat: 'wood', bone: 'neck', k: 0.001 });
    });
  },
});
