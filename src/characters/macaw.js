import { mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { bird, plumed } from './bird.js';

/**
 * The Macaw: a scarlet macaw off the beach at Copacabana. Red all over, a
 * big head with a bare white face, a pale yellow eye, a hooked beak that
 * could open a coconut (pale on top, black underneath), wings red at the
 * shoulder, then yellow tipped with green, then blue to the ends, and a
 * long tail, red down the middle and blue at the sides. Loud. Steals
 * everybody's chips, and is flying round with one now, crosswise in its
 * beak. About 0.75 tiles across the wings; a flyer, so its origin is its
 * middle.
 */

const RED = rgb('#d0141c'), DEEP = rgb('#a40c16'), YELLOW = rgb('#f4c010'), GREEN = rgb('#3c9a3a'), BLUE = rgb('#1f52c4'), NAVY = rgb('#163a9e');
const WHITE = rgb('#f6f0ea'), GOLD = rgb('#cc4a24');
const H = [0, 0.062, 0.088], HR = 0.031;

/** How far into the bare face a point is: the side of the head from the eye forward and down to the beak. */
function face(p) {
  const q = [Math.abs(p[0]), p[1] - H[1], p[2] - H[2]];
  return smooth(0.3 * HR, 0.45 * HR, q[0]) * smooth(0.25 * HR, 0.05 * HR, q[1]) * smooth(-0.15 * HR, 0.05 * HR, q[2] + q[1] * 0.4) * smooth(0.6 * HR, 0.35 * HR, -q[1]);
}

const COAT = (() => {
  const red = plumed((p, n) => mix(RED, DEEP, smooth(0.2, 0.9, n[1]) * smooth(0.05, -0.04, p[2]) * 0.6), { size: 0.01, edge: 0.18 });
  return (p, n) => {
    const f = face(p);
    if (f <= 0) return red(p, n);
    // Bare skin, with faint lines of tiny red feathers across it.
    const lines = smooth(0.75, 0.95, Math.abs(Math.sin((p[1] - p[2] * 0.3) * 900)));
    return mix(red(p, n), mix(WHITE, rgb('#e8b0a8'), lines * 0.5), f);
  };
})();

const UNDER = (n, c) => (n[1] < -0.2 ? GOLD : c);
const GREATER = (p, n, t) => UNDER(n, mix(YELLOW, GREEN, smooth(0.55, 0.8, t)));
const MEDIAN = (p, n, t) => UNDER(n, mix(YELLOW, GREEN, smooth(0.7, 0.95, t)));
const SEC = (p, n, t) => UNDER(n, mix(BLUE, NAVY, t * 0.5));
const PRIM = (p, n, t) => UNDER(n, mix(BLUE, NAVY, 0.4 + t * 0.4));
const TERT = (p, n, t) => UNDER(n, mix(mix(YELLOW, GREEN, 0.6), BLUE, smooth(0.3, 0.6, t)));
const TAIL = (p, n, t, f) => (Math.abs(f) < 0.3 ? mix(RED, BLUE, smooth(0.62, 0.82, t)) : mix(BLUE, NAVY, t * 0.5));

/** The upper half of the beak: pale horn, black along its edge at the base. */
const UPPER = (p) => {
  const edge = smooth(H[1] - 0.004, H[1] - 0.012, p[1]) * smooth(H[2] + HR * 1.35, H[2] + HR * 1.15, p[2]);
  return mix(rgb('#efe4cf'), rgb('#26201e'), edge);
};

export default bird({
  name: 'macaw',
  scale: 1.5,
  budget: 62000,
  body: { r: [0.045, 0.048, 0.078] },
  head: { r: HR, at: H, crown: 0.9 },
  beak: { len: 0.036, depth: 0.03, width: 0.021, tilt: 0.3, curve: 1.45, power: 2.2, y: 0.02, bulk: 0.9, upper: UPPER, lower: '#1e1c1e', low: { len: 0.72, depth: 0.95, curve: -0.7 }, nostrils: false },
  eye: { r: 0.006, iris: '#f2e6a8', pupil: 0.32, ring: '#f4eee6', ringW: 0.3, look: [0.86, 0.12, 0.5] },
  wing: { arm: 0.16, chord: 0.074, primary: 0.13, nP: 9, nS: 9, fingers: 0.3, round: 0.35, colors: { leading: COAT, lesser: COAT, median: MEDIAN, greater: GREATER, tertials: TERT, secondaries: SEC, coverts: SEC, primaries: PRIM, alula: SEC } },
  tail: { len: 0.24, width: 0.011, count: 8, spread: 0.13, droop: 0.18, tip: 0.55, shape: (f) => 1 - 0.62 * Math.abs(f) ** 0.8, color: TAIL },
  feet: { color: '#5c5a60', claw: '#1a1a1c', zygo: true },
  plumage: COAT,
  style: { rate: 8, amp: 0.85, after(k, { clip }, T) {
    // The beak going: squawk. Not wide enough to drop the chip.
    if (clip === 'idle' || clip === 'walk') k.turn('jaw', Math.max(0, Math.sin(T * 3)) * 0.12, 0, 0);
  } },
  extras(s, F, { down }) {
    // The chip: a ridged crisp, crosswise in the beak, held by the bottom half.
    // Held by its edge in the tip of the beak, sticking out forward and to one side.
    const tip = down.pts.at(-1);
    const c = [0.012, tip[1] - 0.004, tip[2] + 0.012];
    s.part('kit', () => s.ellipsoid(c, [0.021, 0.0021, 0.016], {
      color: (p) => mix(rgb('#f2cc6a'), rgb('#b8742a'), smooth(0.012, 0.02, Math.hypot((p[0] - c[0]) * 0.75, p[2] - c[2]))),
      mat: 'skin', bone: 'jaw', k: 0.002, rot: [0.35, 0.6, 0.2], bump: [0.001, 170],
    }));
  },
});
