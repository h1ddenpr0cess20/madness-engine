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

const RED = coat({ over: '#d47a34', under: '#e8a868', vary: 0.1, freq: 16, edge: [-0.15, 0.25] });
const WHITE = coat({ over: '#f6f0e6', under: '#e8dcd0', vary: 0.06, freq: 20 });
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/**
 * A Pembroke's coat, painted rather than stuck on: red over the back and
 * the head, darker along the topline; white socks to the elbow and the
 * stifle, white underneath, a white collar up the front of the neck and
 * the chest, the muzzle white and a narrow blaze up between the eyes.
 */
const COAT = (p, n) => {
  const r = RED(p, n), w = WHITE(p, n);
  const legs = smooth(0.072, 0.05, p[1]);
  const chest = smooth(0.11, 0.16, p[2]) * smooth(0.17, 0.12, p[1]) * smooth(-0.2, 0.4, n[2]);
  const belly = smooth(-0.2, -0.6, n[1]) * smooth(0.11, 0.07, p[1]);
  const muzzle = smooth(0.212, 0.226, p[2]) * smooth(0.2, 0.185, p[1] - (p[2] - 0.22) * 0.3);
  const blaze = smooth(0.18, 0.2, p[2]) * smooth(0.009 + (p[2] - 0.19) * 0.25, 0.004, Math.abs(p[0])) * smooth(0.22, 0.2, p[1]);
  const t = Math.min(1, Math.max(legs, chest, belly, muzzle, blaze));
  const top = smooth(0.4, 0.95, n[1]) * smooth(0.14, 0.16, p[1]) * 0.18;
  return r.map((v, i) => v * (1 - top) + (w[i] - v * (1 - top)) * t);
};

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
  paint: { body: COAT, head: COAT, snout: COAT, legs: COAT, feet: WHITE, tail: RED, ears: '#c87030', inner: '#f0d8c4', countershade: 0.2 },
  style: { rate: 15, wag: 0.9, lift: 0.9 },
  extras(s, P) {
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
