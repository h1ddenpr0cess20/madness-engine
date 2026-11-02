import { noise, rgb, rotation } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A pile of guitar picks: nine of them, slid into a heap, in the colours
 * and the stuff picks come in — tortoiseshell, pearloid, plain celluloid
 * in pink and blue and yellow and white — each the proper shape, a rounded
 * triangle with a firm point, thin as a fingernail, some with a gold star
 * or a ring printed on. About a quarter of a tile across. `pick` lays one
 * down anywhere (the suitcase is full of them).
 */

/** The outline: the convex hull of a round point and two round shoulders, as the standard pick is. */
const OUTLINE = (() => {
  const circles = [[0, 0.55, 0.13], [0.37, -0.22, 0.3], [-0.37, -0.22, 0.3]];
  const pts = [];
  for (const [x, z, r] of circles) for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    pts.push([x + Math.cos(a) * r, z + Math.sin(a) * r]);
  }
  // Gift-wrap them.
  const hull = [];
  let start = pts.reduce((a, b) => (b[0] < a[0] ? b : a));
  let p = start;
  do {
    hull.push(p);
    let q = pts[0] === p ? pts[1] : pts[0];
    for (const r of pts) {
      const c = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      if (c < 0 || (c === 0 && Math.hypot(r[0] - p[0], r[1] - p[1]) > Math.hypot(q[0] - p[0], q[1] - p[1]))) q = r;
    }
    p = q;
  } while (p !== start && hull.length < 200);
  return hull;
})();

/** Signed distance to the outline, scaled by `L` (Quilez's polygon distance). */
function outline(x, z, L) {
  const v = OUTLINE, n = v.length;
  let d = Infinity, s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const ax = v[i][0] * L, az = v[i][1] * L, bx = v[j][0] * L, bz = v[j][1] * L;
    const ex = bx - ax, ez = bz - az, wx = x - ax, wz = z - az;
    const t = Math.max(0, Math.min(1, (wx * ex + wz * ez) / (ex * ex + ez * ez)));
    d = Math.min(d, (wx - ex * t) ** 2 + (wz - ez * t) ** 2);
    const c1 = z >= az, c2 = z < bz, c3 = ex * wz > ez * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

const TORT = [rgb('#2a1206'), rgb('#7a3a0e'), rgb('#c8781e'), rgb('#e8a840')];
/** Tortoiseshell: amber with dark clouds through it. */
const tortoise = (u, v) => {
  const n = noise(u * 60, v * 60, 3.1) * 0.65 + noise(u * 160, v * 160, 7.7) * 0.35;
  const i = Math.min(2.999, Math.max(0, (n - 0.25) * 6));
  return mix(TORT[Math.floor(i)], TORT[Math.floor(i) + 1], i % 1);
};
/** Pearloid: white swirled with pink and pale green. */
const pearl = (u, v) => {
  const n = noise(u * 40 + Math.sin(v * 90) * 0.6, v * 40, 1.3);
  return mix(mix(rgb('#f8f2ee'), rgb('#f2c8d8'), Math.max(0, n - 0.5) * 2), rgb('#d8eee4'), Math.max(0, 0.45 - n) * 2);
};

export const PICK_MATERIALS = {
  celluloid: { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 },
  foil: { roughness: 0.25, metalness: 1, emissive: '#3a2600', emissiveIntensity: 0.4 },
};

/**
 * A pick lying at `c`, turned by `rot` (lying flat at [0, a, 0]): `size` from
 * shoulder to point, `color` a colour or 'tortoise' or 'pearl', `print` a
 * 'star' or a 'ring' stamped in gold on its face.
 */
export function pick(s, c, rot, { size = 0.07, thick = 0.005, color = '#ff3a8a', print = null, mat = 'celluloid', bone = 'root' } = {}) {
  const R = rotation(rot), L = size / 1.1, h = thick / 2, round = h * 0.9;
  const toLocal = (p) => {
    const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
    return [R[0][0] * x + R[1][0] * y + R[2][0] * z, R[0][1] * x + R[1][1] * y + R[2][1] * z, R[0][2] * x + R[1][2] * y + R[2][2] * z];
  };
  const base = typeof color === 'string' && color.startsWith('#') ? rgb(color) : null;
  const paint = (p) => {
    const [u, , v] = toLocal(p);
    const col = color === 'tortoise' ? tortoise(u, v) : color === 'pearl' ? pearl(u, v) : base;
    // The edge a shade lighter where it is worn by the strings.
    const e = -outline(u, v, L);
    return e < 0.002 ? mix(col, rgb('#ffffff'), 0.12 * (1 - e / 0.002)) : col;
  };
  const m = size;
  s.shape((p) => {
    const [x, y, z] = toLocal(p);
    const d2 = outline(x, z, L) + round, dy = Math.abs(y) - h + round;
    return Math.min(Math.max(d2, dy), 0) + Math.hypot(Math.max(d2, 0), Math.max(dy, 0)) - round;
  }, [c.map((v) => v - m), c.map((v) => v + m)], { color: paint, mat, bone, k: 0 });
  if (print) {
    // The print: on the face that looks up.
    const up = [R[0][1], R[1][1], R[2][1]], sgn = up[1] >= 0 ? 1 : -1;
    s.paint((p) => {
      const [x, y, z] = toLocal(p);
      if (y * sgn < h * 0.4 || y * sgn > h * 1.6) return 0.01;
      const u = x / L, v = (z + 0.02 * L) / L;
      if (print === 'ring') return (Math.abs(Math.hypot(u, v) - 0.2) - 0.04) * L;
      // A five-pointed star: its radius running from the notches out to the points and back.
      const a = Math.atan2(u, -v), f = (((a / (Math.PI * 2 / 5)) % 1) + 1) % 1;
      return (Math.hypot(u, v) - (0.085 + 0.2 * (1 - Math.abs(f * 2 - 1)))) * L * 0.8;
    }, '#f0c040', 0.0006);
  }
}

const HEAP = [
  // [x, y, z, turn, tilt x, tilt z, colour, print]
  [0.0, 0.0026, 0.0, 0.3, 0, 0, '#ff3a8a', null],
  [0.062, 0.0026, 0.03, 2.1, 0, 0, 'tortoise', null],
  [-0.058, 0.0026, 0.045, 4.2, 0, 0, '#2ad0ff', 'star'],
  [0.02, 0.0026, -0.064, 5.4, 0, 0, '#ffd23a', null],
  [-0.03, 0.0026, -0.04, 1.0, 0, 0, 'pearl', null],
  [0.012, 0.0082, 0.012, 1.3, 0.05, -0.04, '#8a4be8', 'ring'],
  [0.045, 0.0082, -0.02, 3.4, -0.06, 0.05, '#f5f0e6', 'star'],
  [-0.028, 0.0082, 0.008, 5.9, 0.04, 0.07, 'tortoise', null],
  [0.004, 0.0138, -0.004, 0.8, -0.05, 0.03, '#3ae88a', 'star'],
];

export default {
  name: 'pick',
  scale: 1.5,
  cell: 0.0021,
  budget: 30000,
  refine: 0.5,
  bones: [['root', null, [0, 0, 0]]],
  materials: PICK_MATERIALS,
  sculpt(s) {
    for (const [x, y, z, a, tx, tz, color, print] of HEAP) pick(s, [x, y, z], [tx, a, tz], { color, print });
  },
};
