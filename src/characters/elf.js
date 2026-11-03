import { bands } from '../models/skins.js';
import { cloth, shell } from './person.js';
import { child } from './kids.js';

/**
 * The Elf: one of Santa's, the Boy's build (about six) in an elf's costume: a
 * green tunic with white cuffs and collar and a belt, red and white striped
 * tights, shoes with curled, belled toes, a long green cap with a white band and
 * a bell on the tip, and long pointed ears. Carries nothing. About 0.56 of a
 * grown person's height.
 */

const GREEN = cloth('#2f8a4c', '#1e6636');
const WHITE = cloth('#f6f4f0', '#d6d4ce');
const GOLD = '#e6c24a';
const STRIPES = bands(1, 0.05, '#cf2a30', '#f4f0e8', 0.5, 0.15);
const SHOE = '#b8282c';
const SKIN = '#e8b490';

/**
 * Long pointed ears in place of the head's round ones: each a leaf standing out from the side of the head and a little up,
 * They come out below the cap's band (the cap is fitted over everything on the head above it,
 * and would cover them). `skin` is the person's skin.
 */
function pointedEars(s, skin) {
  const from = s.shapes.length;
  for (const m of [1, -1]) {
    s.part('head', () => {
      const S = { color: skin, mat: 'skin', bone: 'head', k: 0.01 };
      const root = [m * 0.086, 0.636, -0.004], tip = [m * 0.19, 0.698, -0.03];
      // The ear: a flat leaf facing forward, broad at its root and drawn out to a point, thick enough for the head's grid (a
      // thinner one tears into holes).
      s.flake(root, tip, [0, 0, 1], 0.036, 0.012, 0.4, S);
      // Its bowl: hollowed into the front face, shallow: only a couple of millimeters of a leaf twelve thick (cut right through, it would be a hole).
      s.ellipsoid([m * 0.126, 0.659, -0.0013], [0.036, 0.013, 0.007], { op: 'sub', k: 0.005, rot: [0, 0, m * 0.52] });
      // The rim: a ridge round the front edge of the leaf, from the root over the top to the tip, and the lobe at the root.
      s.limb([m * 0.092, 0.652, -0.003], [m * 0.14, 0.683, -0.012], 0.0055, 0.0045, { ...S, k: 0.006 });
      s.limb([m * 0.14, 0.683, -0.012], [m * 0.182, 0.698, -0.024], 0.0045, 0.0045, { ...S, k: 0.006 });
      s.sphere([m * 0.092, 0.622, -0.004], 0.0115, { ...S, k: 0.01 });
    });
  }
  // Marked, so the cap is not fitted over them.
  for (const x of s.shapes.slice(from)) x.ear = true;
}
/** What the cap is fitted over: not the ears. */
const notEars = (x) => !x.ear;

/**
 * A long cap: green, fitted over the head and the hair to a line a little lower at the back than at the brows, a white
 * band round its foot, and the point rising and then curling forward and down, a gold bell on the tip.
 */
function elfCap(s, { color = GREEN, trim = WHITE } = {}) {
  const foot = (p) => 0.715 - 0.12 * Math.max(0, 0.05 - p[2]);
  shell(s, (p) => foot(p) + 0.012 - p[1], { color, mat: 'cloth', part: 'outer', thick: 0.01, lift: 0.002, over: ['head', 'hair'], keep: notEars, bone: 'head', k: 0.004 });
  shell(s, (p) => Math.max(foot(p) - p[1], p[1] - foot(p) - 0.034), { color: trim, mat: 'cloth', part: 'outer2', thick: 0.011, lift: 0.001, over: ['head', 'hair', 'outer'], keep: notEars, bone: 'head', k: 0.005 });
  s.part('outer2', () => {
    const C = { color, mat: 'cloth', bone: 'head', k: 0.008 };
    const pts = [[0, 0.74, -0.006], [0, 0.83, -0.01], [0, 0.92, 0.0], [0, 0.97, 0.05], [0, 0.965, 0.115], [0, 0.93, 0.15]];
    const rad = [0.095, 0.072, 0.05, 0.036, 0.026, 0.02];
    for (let i = 0; i < pts.length - 1; i++) s.limb(pts[i], pts[i + 1], rad[i], rad[i + 1], C);
    s.sphere([0, 0.915, 0.158], 0.022, { color: GOLD, mat: 'metal', bone: 'head', k: 0.004 });
  });
}

/** A white collar round the neck, lying on the tunic. */
function elfCollar(s) {
  shell(s, (p) => Math.max(Math.abs(p[1] - 0.536) - 0.016, -p[2] - 0.045), { color: WHITE, mat: 'cloth', part: 'outer2', thick: 0.009, lift: 0.0015, over: ['top', 'head'], bone: 'neck', k: 0.004 });
}

/** Shoes with long toes curling up, a gold bell on each. */
function elfShoes(s, J) {
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


export default child('child', {
  name: 'elf',
  skin: SKIN,
  belly: 0,
  budget: 70000,
  look: { torso: GREEN, sleeve: GREEN, cuff: WHITE, legs: STRIPES, boot: SHOE, sole: '#3a2412', belt: '#3a2412', buckle: GOLD, tuck: false },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  // The head's round ears are left off, for the pointed ones.
  face: { eyeColor: '#4a6a3a', brow: '#4a2e18', blush: 0.7, ears: false },
  hair: {
    color: cloth('#5a3a1e', '#3a220e'),
    cap: [0.108, 0.098, 0.108],
    locks: [[[0.03, 0.79, 0.04], [0.065, 0.745, 0.1], 0.034, 0.5], [[0.08, 0.76, 0.0], [0.1, 0.7, -0.02], 0.028, 0.5], [[-0.08, 0.76, 0.0], [-0.1, 0.7, -0.02], 0.028, 0.5]],
  },
  extras(s, J, { skin: tone }) {
    pointedEars(s, tone);
    elfCap(s);
    elfCollar(s);
    elfShoes(s, J);
  },
});
