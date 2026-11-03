import { cloth } from './person.js';

/**
 * What goes with a baby: the baby, and the stroller it is pushed in. Both are
 * sculpted into a person's `extras`, on a bone of theirs (the chest for a baby
 * held in the arms, the root for a stroller), and marked as held so they stay
 * where they are put.
 */

const unit = (v) => {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mark = (s, from) => {
  for (const x of s.shapes.slice(from)) x.held = true;
};

/**
 * A baby asleep, wrapped in a blanket to the chin: its head at `head`, its feet at `foot`, its face turned out along
 * `face`; carried by `bone`.
 */
export function infant(s, { head, foot, face, bone = 'chest', skin = '#f0c4a0', blanket = cloth('#f2e6a8', '#d0c47c'), hair = '#7a5a34' }) {
  const from = s.shapes.length;
  const dir = unit(head.map((v, i) => v - foot[i]));
  const out = unit(face), side = unit(cross(dir, out));
  const at = (t, u = 0, o = 0) => head.map((v, i) => v + dir[i] * t + side[i] * u + out[i] * o);
  const SK = { color: skin, mat: 'skin', bone, k: 0.01 };
  s.part('kit', () => {
    // The bundle: a blanket from the feet to under the chin, a little fuller at the chest.
    s.limb(foot, at(-0.05), 0.034, 0.045, { color: blanket, mat: 'cloth', bone, k: 0.012, bump: [0.002, 90] });
    // The head: round, a cheek each side, a tuft of hair, a button nose, and eyes shut.
    s.sphere(head, 0.05, SK);
    for (const m of [1, -1]) s.sphere(at(-0.008, m * 0.028, 0.034), 0.017, { ...SK, k: 0.012 });
    s.sphere(at(0.012, 0, 0.049), 0.0075, { ...SK, k: 0.006 });
    s.sphere(at(0.046, 0, 0.0), 0.02, { color: hair, mat: 'hair', bone, k: 0.01 });
    for (const m of [1, -1]) s.limb(at(0.018, m * 0.012, 0.045), at(0.017, m * 0.03, 0.036), 0.0028, 0.0028, { color: '#3a2218', mat: 'plastic', bone, k: 0.001 });
    // A fist by its chin, out of the blanket.
    s.sphere(at(-0.055, -0.03, 0.04), 0.014, SK);
  });
  mark(s, from);
}

/**
 * A stroller on the ground in front of whoever pushes it, its handle at `handle` (a point at its middle) and a baby in
 * the seat. Carried by `bone` (the root, so it rolls along with them).
 */
export function stroller(s, { bone = 'root', handle = [0, 0.36, 0.22], frame = '#2c2c34', fabric = cloth('#4a8a9a', '#356a78') } = {}) {
  const from = s.shapes.length;
  const [hx, hy, hz] = handle;
  const F = { color: frame, mat: 'plastic', bone, k: 0.002 };
  const FAB = { color: fabric, mat: 'cloth', bone, k: 0.01 };
  s.part('kit', () => {
    // The handle bar, with a rubber grip each side for the hands.
    s.limb([hx - 0.085, hy, hz], [hx + 0.085, hy, hz], 0.0065, 0.0065, F);
    for (const m of [1, -1]) s.limb([hx + m * 0.05, hy, hz], [hx + m * 0.085, hy, hz], 0.0085, 0.0085, { ...F, color: '#16161a', mat: 'rubber' });
    for (const m of [1, -1]) {
      const x = m * 0.085;
      // The handle's post down to the seat's frame, the legs to the wheels, the rail along the seat.
      s.limb([x, hy, hz], [x, 0.215, hz + 0.12], 0.0062, 0.0062, F);
      s.limb([x, 0.215, hz + 0.12], [m * 0.1, 0.055, hz + 0.05], 0.0062, 0.0062, F);
      s.limb([x, 0.215, hz + 0.12], [x, 0.215, hz + 0.27], 0.0062, 0.0062, F);
      s.limb([x, 0.215, hz + 0.27], [m * 0.1, 0.045, hz + 0.3], 0.0062, 0.0062, F);
      // The wheels: big at the back, small at the front, each a tire, a disc and a hub.
      for (const [z, r] of [[hz + 0.05, 0.052], [hz + 0.3, 0.042]]) {
        const c = [m * 0.1, r + 0.003, z], rot = [0, 0, Math.PI / 2];
        s.torus(c, r - 0.008, 0.009, { color: '#16161a', mat: 'rubber', bone, k: 0.002, rot });
        s.cylinder(c, r - 0.012, 0.004, { color: '#a8acb4', mat: 'metal', bone, k: 0.002, rot });
        s.cylinder(c.map((v, i) => v + [m * 0.005, 0, 0][i]), 0.009, 0.006, { ...F, rot });
      }
    }
    // The seat: a shallow tub of fabric between the rails, and a basket under it.
    const seat = [0, 0.235, hz + 0.18];
    s.box(seat, [0.082, 0.026, 0.105], 0.022, FAB);
    s.box([seat[0], seat[1] + 0.03, seat[2]], [0.068, 0.03, 0.092], 0.018, { op: 'sub', k: 0.004 });
    s.box([0, 0.12, hz + 0.17], [0.065, 0.026, 0.08], 0.01, { color: '#3a3a42', mat: 'cloth', bone, k: 0.004 });
    // The hood: a half-dome over the back of the seat, open to the front.
    s.ellipsoid([0, 0.29, hz + 0.1], [0.096, 0.085, 0.09], { ...FAB, k: 0.012 });
    s.ellipsoid([0, 0.29, hz + 0.1], [0.086, 0.076, 0.082], { op: 'sub', k: 0.004 });
    s.box([0, 0.18, hz + 0.1], [0.2, 0.1, 0.2], 0, { op: 'sub', k: 0.001 });
    s.box([0, 0.3, hz + 0.28], [0.2, 0.2, 0.1], 0, { op: 'sub', k: 0.001 });
  });
  mark(s, from);
  // The baby, asleep in the seat with its blanket to its chin.
  infant(s, { head: [0, 0.285, hz + 0.19], foot: [0, 0.245, hz + 0.265], face: [0, 0.7, 0.7], bone });
}
