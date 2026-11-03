import { bands } from '../models/skins.js';
import { cloth, shell } from './person.js';
import { child } from './kids.js';

/**
 * Santa's elves: the children (kids.js) in an elf's costume. A green tunic
 * with white cuffs and collar and a belt, red and white striped tights (a
 * green dress over them, for a girl), shoes with curled, belled toes, a long
 * green cap with a white band and a bell on the tip, and long pointed ears.
 * `elfKid(age, ...)` is the child of that age dressed so.
 */

export const GREEN = cloth('#2f8a4c', '#1e6636');
export const RED = '#c8282e';
export const WHITE = cloth('#f6f4f0', '#d6d4ce');
export const GOLD = '#e6c24a';
const STRIPES = bands(1, 0.05, '#cf2a30', '#f4f0e8', 0.5, 0.15);
const SHOE = '#b8282c';

/**
 * Long pointed ears in place of the head's round ones: each a leaf standing out from the side of the head, up and a
 * little back, with a scoop in its front. `skin` is the person's skin.
 */
export function pointedEars(s, skin) {
  for (const m of [1, -1]) {
    s.part('head', () => {
      const S = { color: skin, mat: 'skin', bone: 'head', k: 0.012 };
      s.flake([m * 0.088, 0.655, -0.004], [m * 0.172, 0.77, -0.03], [0, 0, 1], 0.026, 0.004, 0.32, S);
      // The ear's bowl, hollowed a little.
      s.ellipsoid([m * 0.104, 0.672, 0.0], [0.012, 0.026, 0.014], { op: 'sub', k: 0.006, rot: [0, 0, -m * 0.35] });
    });
  }
}

/**
 * A long cap: green, fitted over the head and the hair to a line a little lower at the back than at the brows, a white
 * band round its foot, and the point rising and then curling forward and down, a gold bell on the tip.
 */
export function elfCap(s, { color = GREEN, trim = WHITE } = {}) {
  const foot = (p) => 0.715 - 0.12 * Math.max(0, 0.05 - p[2]);
  shell(s, (p) => foot(p) + 0.012 - p[1], { color, mat: 'cloth', part: 'outer', thick: 0.01, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
  shell(s, (p) => Math.max(foot(p) - p[1], p[1] - foot(p) - 0.034), { color: trim, mat: 'cloth', part: 'outer2', thick: 0.011, lift: 0.001, over: ['head', 'hair', 'outer'], bone: 'head', k: 0.005 });
  s.part('outer2', () => {
    const C = { color, mat: 'cloth', bone: 'head', k: 0.008 };
    const pts = [[0, 0.74, -0.006], [0, 0.83, -0.01], [0, 0.92, 0.0], [0, 0.97, 0.05], [0, 0.965, 0.115], [0, 0.93, 0.15]];
    const rad = [0.095, 0.072, 0.05, 0.036, 0.026, 0.02];
    for (let i = 0; i < pts.length - 1; i++) s.limb(pts[i], pts[i + 1], rad[i], rad[i + 1], C);
    s.sphere([0, 0.915, 0.158], 0.022, { color: GOLD, mat: 'metal', bone: 'head', k: 0.004 });
  });
}

/** A white collar round the neck, lying on the tunic. */
export function elfCollar(s) {
  shell(s, (p) => Math.max(Math.abs(p[1] - 0.536) - 0.016, -p[2] - 0.045), { color: WHITE, mat: 'cloth', part: 'outer2', thick: 0.009, lift: 0.0015, over: ['top', 'head'], bone: 'neck', k: 0.004 });
}

/** Shoes with long toes curling up, a gold bell on each. */
export function elfShoes(s, J) {
  for (const S of ['L', 'R']) {
    const a = J[`ankle${S}`], x = a[0], z = a[2];
    s.part('shoes', () => {
      const C = { color: SHOE, mat: 'leather', bone: `foot${S}`, k: 0.006 };
      s.limb([x, 0.03, z + 0.07], [x, 0.045, z + 0.125], 0.027, 0.018, C);
      s.limb([x, 0.045, z + 0.125], [x, 0.08, z + 0.165], 0.018, 0.009, C);
      s.sphere([x, 0.088, z + 0.17], 0.012, { color: GOLD, mat: 'metal', bone: `foot${S}`, k: 0.003 });
    });
  }
}

/**
 * The child of age `age` ('baby', 'toddler', 'child', 'preteen' or 'teen') as an elf: `skin`, `eyes`, `hair` (its
 * colour, a hex) and `face` as for `person`; `girl` for the dress.
 */
export function elfKid(age, { name, girl = false, skin, eyes = '#3a6a4a', hair = '#6a4424', brow, face = {}, ...rest }) {
  const hairColor = cloth(hair, hair);
  const look = girl
    ? { torso: GREEN, sleeve: GREEN, cuff: WHITE, legs: GREEN, shin: STRIPES, skirt: { hem: 0.2, flare: 1.2 }, boot: SHOE, sole: '#3a2412', belt: '#3a2412', buckle: GOLD }
    : { torso: GREEN, sleeve: GREEN, cuff: WHITE, legs: STRIPES, boot: SHOE, sole: '#3a2412', belt: '#3a2412', buckle: GOLD, tuck: false };
  return child(age, {
    name, skin, look, belly: 0, budget: 70000,
    mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
    face: { eyeColor: eyes, ...(brow ? { brow } : {}), blush: 0.7, ears: false, ...face },
    hair: { color: hairColor, cap: [0.108, 0.098, 0.108], locks: girl
      ? [[[0.09, 0.73, 0.0], [0.11, 0.62, -0.02], 0.034, 0.5], [[-0.09, 0.73, 0.0], [-0.11, 0.62, -0.02], 0.034, 0.5], [[0, 0.76, -0.07], [0, 0.63, -0.12], 0.06, 0.45]]
      : [[[0.03, 0.78, 0.04], [0.06, 0.745, 0.1], 0.032, 0.5], [[0.08, 0.76, 0.0], [0.1, 0.7, -0.02], 0.028, 0.5], [[-0.08, 0.76, 0.0], [-0.1, 0.7, -0.02], 0.028, 0.5]] },
    ...rest,
    extras(s, J, { skin: tone }) {
      pointedEars(s, tone);
      elfCap(s);
      elfCollar(s);
      elfShoes(s, J);
    },
  });
}
