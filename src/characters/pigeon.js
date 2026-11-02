import { mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { bird, hue, iridescent, plumed } from './bird.js';

/**
 * The Pigeon: a city pigeon, the same one in every square in Europe. Plump
 * and blue-grey, a small round head, the neck shot through with green and
 * purple, two black bars across each wing, dark tips to the wings and a
 * black band across the end of the tail, an orange eye, a white blob over
 * a little dark beak, and coral-pink feet. Has seen every statue on the
 * tour. Has been on all of them. Flies at your face for no reason. About
 * 0.7 tiles across the wings; a flyer, so its origin is its middle.
 */

const HEAD = rgb('#6c7586'), BODY = rgb('#8b95a6'), PALE = rgb('#9ba4b3'), DARK = rgb('#22242a');
const SHOT = iridescent('#3c8a5a', '#7a3a7a');
const NECK = [0, 0.036, 0.06];

const COAT = plumed((p, n) => {
  // The head darker, the neck and the top of the breast shot with colour, the rest blue-grey.
  const neck = smooth(0.034, 0.018, Math.hypot(p[0] * 0.9, (p[1] - NECK[1]) * 1.1, p[2] - NECK[2]));
  const head = smooth(0.062, 0.072, p[2] + p[1] * 0.3);
  let c = mix(BODY, HEAD, head);
  c = mix(c, hue(SHOT, p, n), neck * (1 - head * 0.8) * 0.85);
  return mix(c, PALE, smooth(-0.2, -0.7, n[1]) * 0.25);
}, { size: 0.009, edge: 0.14 });

/** The two black bars across the inner wing: over the ends of the coverts, and across the secondaries behind them. */
const BARS = (c, p, n, [out, back]) => {
  if (n[1] < -0.3) return c;
  const bar = Math.max(smooth(0.021, 0.024, back) * smooth(0.031, 0.028, back), smooth(0.039, 0.042, back) * smooth(0.05, 0.047, back));
  return mix(c, DARK, bar * smooth(0.72, 0.6, out));
};
const FLIGHT = (p, n, t) => mix(BODY, rgb('#3a3e48'), smooth(0.25, 0.8, t));
const TAIL = (p, n, t) => mix(BODY, rgb('#1e2026'), smooth(0.74, 0.8, t));

export default bird({
  name: 'pigeon',
  scale: 1.5,
  budget: 46000,
  body: { r: [0.046, 0.047, 0.074] },
  head: { r: 0.022, at: [0, 0.058, 0.086], crown: 0.88 },
  beak: { len: 0.021, depth: 0.0075, width: 0.0058, tilt: 0.18, curve: 0.25, power: 2, y: -0.12, upper: '#3a3436', cere: { color: '#ece8e2', size: 1.5, at: 3 }, nostrils: false },
  eye: { r: 0.0058, iris: '#ea6a12', pupil: 0.38, ring: '#9a8c96', ringW: 0.2, look: [0.82, 0.12, 0.56] },
  wing: { arm: 0.15, chord: 0.064, primary: 0.12, nP: 9, nS: 9, fingers: 0, round: 0.15, colors: { leading: COAT, lesser: PALE, median: PALE, greater: PALE, tertials: BODY, secondaries: BODY, coverts: PALE, primaries: FLIGHT }, pattern: BARS },
  tail: { len: 0.076, width: 0.012, count: 12, spread: 0.5, shape: (f) => 1 - 0.05 * f * f, color: TAIL },
  feet: { color: '#d8606a', claw: '#3a2a2a' },
  plumage: COAT,
  style: { rate: 11, amp: 0.8 },
});
