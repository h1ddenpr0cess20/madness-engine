import { rotation, Sculpt } from '../models/sdf.js';
import { cloth } from './person.js';

/**
 * What goes with a baby: a baby (one of the baby characters, grafted into whoever holds it) and the stroller it is
 * pushed in. Both are sculpted into a person's `extras`, on a bone of theirs (the chest for a baby held in the arms,
 * the root for a stroller), and marked as held so they stay where they are put.
 */

const mark = (s, from) => {
  for (const x of s.shapes.slice(from)) x.held = true;
};

/** How big the grafted `def` is, in its host's sculpt (as `graft`'s `size` of 1: its height in the world over the host's scale). */
export const graftScale = (def, host, size = 1) => (def.scale / host) * size;

/**
 * The cell sizes for the parts of a character grafted in (named `baby…`: every part of it, on its own finer grid
 * as it is drawn small), for the host's `cells`.
 */
export function graftCells(def, host, size = 1) {
  const sc = graftScale(def, host, size), cells = {};
  for (const part of ['body', 'head', 'hands', 'shoes', 'soles', 'top', 'sleeves', 'cuffs', 'bottoms', 'hose', 'belt', 'outer', 'outer2', 'straps', 'hair', 'eyes', 'irises', 'pupils', 'brows', 'kit', 'fine', 'frames']) {
    cells[`baby${part}`] = (def.cells[part] ?? def.cell) * sc;
  }
  return cells;
}

/**
 * Another character's whole sculpt put into the host's (`s`): `def` as it stands at rest, its feet at `at` (as the host
 * is sculpted), turned by `rot` (Euler angles) and made `size` times the size it is in the world (`host`, the host's
 * scale, says how big that is in the host's sculpt), carried by `bone` and held rigid. `clip(q)`, if given, cuts off
 * what is not negative at a point `q` of the character's own sculpt (below the hips, for one sitting down).
 */
export function graft(s, def, { at, rot = [0, 0, 0], size = 1, host, bone = 'chest', clip = null }) {
  const from = s.shapes.length, sc = graftScale(def, host, size), R = rotation(rot);
  const it = new Sculpt();
  def.sculpt(it);
  // A point of the character's sculpt in the host's, and back; a direction back.
  const out = (q) => [0, 1, 2].map((i) => at[i] + sc * (R[i][0] * q[0] + R[i][1] * q[1] + R[i][2] * q[2]));
  const back = (v) => [0, 1, 2].map((j) => R[0][j] * v[0] + R[1][j] * v[1] + R[2][j] * v[2]);
  const into = (p) => back([(p[0] - at[0]) / sc, (p[1] - at[1]) / sc, (p[2] - at[2]) / sc]);
  const bounds = (box) => {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let c = 0; c < 8; c++) {
      const q = out([c & 1 ? box[1][0] : box[0][0], c & 2 ? box[1][1] : box[0][1], c & 4 ? box[1][2] : box[0][2]]);
      for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], q[i]); hi[i] = Math.max(hi[i], q[i]); }
    }
    return [lo, hi];
  };
  const hue = (c) => (typeof c === 'function' ? (p, n) => c(into(p), back(n)) : c);
  for (const x of it.shapes) {
    const d = clip ? (p) => { const q = into(p); return sc * Math.max(x.d(q), clip(q)); } : (p) => sc * x.d(into(p));
    s.part(`baby${x.part}`, () => s.shape(d, bounds(x.box), { op: x.op, k: x.k * sc, color: hue(x.color), bone, mat: x.mat }));
  }
  // What it is painted with: its eyes, its lips, its cheeks.
  for (const p of it.paints) s.paint((q) => sc * p.inside(into(q)), hue(p.color), p.soft * sc);
  mark(s, from);
}

/**
 * A stroller on the ground in front of whoever pushes it, its handle at `handle` (a point at its middle), a baby
 * (`baby`, a character, `host` the pusher's scale) sitting in the seat facing forward with a blanket over its lap.
 * Carried by `bone` (the root, so it rolls along with them).
 */
export function stroller(s, { baby, host, size = 0.8, bone = 'root', handle = [0, 0.36, 0.22], frame = '#34343c', fabric = cloth('#4a8a9a', '#356a78'), blanket = cloth('#f6efdc', '#d8cfb4') } = {}) {
  const from = s.shapes.length;
  const [hx, hy, hz] = handle;
  const F = { color: frame, mat: 'plastic', bone, k: 0.002 };
  const FAB = { color: fabric, mat: 'cloth', bone, k: 0.008 };
  const rail = (a, b, r = 0.0075) => s.limb(a, b, r, r, F);
  s.part('kit', () => {
    // The handle: a bar with a rubber grip each side, its ends turning down into the push tubes.
    rail([hx - 0.085, hy, hz], [hx + 0.085, hy, hz]);
    for (const m of [1, -1]) {
      s.limb([hx + m * 0.04, hy, hz], [hx + m * 0.085, hy, hz], 0.0095, 0.0095, { ...F, color: '#16161a', mat: 'rubber' });
      const x = m * 0.088;
      // The push tube down to the seat's rail and on down to the big rear wheel.
      rail([x, hy, hz], [x, 0.27, hz + 0.09]);
      rail([x, 0.27, hz + 0.09], [m * 0.1, 0.06, hz + 0.07]);
      // The seat's rail along each side to the front, the front leg down to the small wheel, the chassis tube along the bottom.
      rail([x, 0.27, hz + 0.09], [x, 0.24, hz + 0.3]);
      rail([x, 0.24, hz + 0.3], [m * 0.095, 0.05, hz + 0.33]);
      rail([m * 0.1, 0.12, hz + 0.08], [m * 0.095, 0.1, hz + 0.32], 0.0065);
      // The footrest's bar and the front bumper bar's posts.
      rail([x, 0.24, hz + 0.3], [x, 0.2, hz + 0.33]);
      rail([x, 0.24, hz + 0.3], [x, 0.325, hz + 0.28], 0.0065);
      // The wheels: big at the back, small at the front, each a tire, a disc and a hub.
      for (const [z, r] of [[hz + 0.07, 0.062], [hz + 0.33, 0.049]]) {
        const c = [m * 0.1, r + 0.003, z], rot = [0, 0, Math.PI / 2];
        s.torus(c, r - 0.011, 0.012, { color: '#16161a', mat: 'rubber', bone, k: 0.002, rot });
        s.cylinder(c, r - 0.016, 0.006, { color: '#b4b8c0', mat: 'metal', bone, k: 0.002, rot });
        s.cylinder(c.map((v, i) => v + [m * 0.008, 0, 0][i]), 0.011, 0.006, { ...F, rot });
      }
    }
    // The bumper bar across the front, and a cross bar between the wheels at the back and the front.
    rail([hx - 0.088, 0.325, hz + 0.28], [hx + 0.088, 0.325, hz + 0.28], 0.007);
    rail([-0.1, 0.12, hz + 0.08], [0.1, 0.12, hz + 0.08], 0.006);
    rail([-0.095, 0.1, hz + 0.32], [0.095, 0.1, hz + 0.32], 0.006);
    // The seat: a base, a back reclined toward the one pushing, a wing up each side, and a footrest in front.
    s.box([0, 0.255, hz + 0.19], [0.082, 0.012, 0.1], 0.01, FAB);
    s.box([0, 0.33, hz + 0.1], [0.082, 0.085, 0.01], 0.01, { ...FAB, rot: [-0.3, 0, 0] });
    for (const m of [1, -1]) s.box([m * 0.082, 0.29, hz + 0.19], [0.008, 0.035, 0.1], 0.006, FAB);
    s.box([0, 0.2, hz + 0.335], [0.075, 0.008, 0.028], 0.006, { ...FAB, rot: [0.3, 0, 0] });
    // The canopy: a shallow shell over the head of the seat, a sunshade above the baby's head and no lower, open all round below it.
    s.ellipsoid([0, 0.5, hz + 0.1], [0.1, 0.085, 0.085], { ...FAB, k: 0.01 });
    s.ellipsoid([0, 0.5, hz + 0.1], [0.09, 0.075, 0.077], { op: 'sub', k: 0.004 });
    s.box([0, 0.4, hz + 0.1], [0.2, 0.1, 0.2], 0, { op: 'sub', k: 0.001 });
    s.box([0, 0.55, hz + 0.24], [0.2, 0.2, 0.1], 0, { op: 'sub', k: 0.001 });
    // Two arms holding it up to the seat's back.
    for (const m of [1, -1]) s.limb([m * 0.085, 0.31, hz + 0.1], [m * 0.095, 0.44, hz + 0.1], 0.006, 0.006, F);
    // The basket under the seat, between the wheels.
    s.box([0, 0.15, hz + 0.2], [0.07, 0.022, 0.09], 0.008, { color: '#40404a', mat: 'cloth', bone, k: 0.004 });
    // The blanket over its lap.
    s.box([0, 0.285, hz + 0.21], [0.07, 0.014, 0.075], 0.012, { color: blanket, mat: 'cloth', bone, k: 0.006 });
  });
  mark(s, from);
  // The baby: sitting up against the back of the seat, facing forward, cut off at the hips under the blanket.
  const sc = graftScale(baby, host, size), hip = 0.15;
  graft(s, baby, { at: [0, 0.285 + 0.01 - hip * sc, hz + 0.155], rot: [-0.15, 0, 0], size, host, bone, clip: (q) => hip - q[1] });
}
