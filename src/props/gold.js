import { noise, rgb, rotation } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A heap of gold: coins piled up in a mound, two stacks of them beside it,
 * more slid off onto the floor, each coin a proper coin — a raised rim, a
 * milled edge and a star struck in the middle of it — and three cut gems
 * in amongst them: a ruby, an emerald and a sapphire, faceted, the light
 * coming through them. Sits on the floor, about a third of a tile across.
 */

const GOLD = rgb('#f4c656'), DEEP = rgb('#9a6a18'), BRIGHT = rgb('#ffe8a0');
const R = 0.03, T = 0.0036;      // a coin's radius and half thickness

/** A seeded run of numbers 0–1, so the heap is the same heap every time. */
function random(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** The star struck in a coin: how far inside it (u, v) is, in its own units. */
const star = (u, v) => {
  const a = Math.atan2(u, v), f = (((a / (Math.PI * 2 / 5)) % 1) + 1) % 1;
  return Math.hypot(u, v) - (0.2 + 0.24 * (1 - Math.abs(f * 2 - 1)));
};

/** A coin at `c`, its face turned by `rot` (lying flat at [0, 0, 0]). */
function coin(s, c, rot, mat = 'gold') {
  const M = rotation(rot);
  const local = (p) => {
    const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
    return [M[0][0] * x + M[1][0] * y + M[2][0] * z, M[0][1] * x + M[1][1] * y + M[2][1] * z, M[0][2] * x + M[1][2] * y + M[2][2] * z];
  };
  s.shape((p) => {
    const [x, y, z] = local(p), r = Math.hypot(x, z);
    // The milled edge, the rim standing a little proud of the field, the star proud of that.
    const mill = r > R * 0.9 ? 0.00035 * (0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 60)) : 0;
    const rim = Math.min(1, Math.max(0, (r / R - 0.8) / 0.06));
    const h = T - 0.0007 * (1 - rim) + (star(x / R, z / R) < 0 ? 0.0004 : 0);
    const dr = r - R + mill + 0.001, dy = Math.abs(y) - h + 0.001;
    return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) - 0.001;
  }, [c.map((v) => v - R - 0.002), c.map((v) => v + R + 0.002)], {
    color: (p) => {
      const [x, y, z] = local(p), r = Math.hypot(x, z) / R;
      if (r > 0.97 && Math.abs(y) < T * 0.9) return mix(DEEP, GOLD, 0.6 + 0.4 * Math.cos(Math.atan2(z, x) * 60));
      if (r > 0.8) return mix(GOLD, BRIGHT, 0.35);
      if (star(x / R, z / R) < 0) return mix(GOLD, BRIGHT, 0.5);
      return mix(DEEP, GOLD, 0.72 + 0.2 * noise(x * 400, z * 400, c[0] * 50));
    },
    mat, k: 0,
  });
}

/** A gem: a convex cut, its facets planes [nx, ny, nz, d] in its own frame, at `c` turned by `rot`. */
function gem(s, c, rot, planes, size, color) {
  const M = rotation(rot);
  s.shape((p) => {
    const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
    const q = [M[0][0] * x + M[1][0] * y + M[2][0] * z, M[0][1] * x + M[1][1] * y + M[2][1] * z, M[0][2] * x + M[1][2] * y + M[2][2] * z];
    let d = -Infinity;
    for (const [a, b, e, k] of planes) d = Math.max(d, a * q[0] + b * q[1] + e * q[2] - k * size);
    return d;
  }, [c.map((v) => v - size * 1.6), c.map((v) => v + size * 1.6)], { color, mat: 'gem', k: 0 });
}
/** A round brilliant: a table, eight crown facets, eight pavilion facets to a point, the girdle round its middle. */
const BRILLIANT = (() => {
  const P = [[0, 1, 0, 0.42]];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, b = a + Math.PI / 8;
    P.push([Math.cos(a) * 0.82, 0.57, Math.sin(a) * 0.82, 0.82 * 0.95]);
    P.push([Math.cos(b) * 0.66, -0.75, Math.sin(b) * 0.66, 0.66 * 0.95]);
    P.push([Math.cos(b), 0, Math.sin(b), 1]);
  }
  return P;
})();
/** An emerald cut: a long table, stepped sides, the corners cut off. */
const STEP = [
  [0, 1, 0, 0.42], [0, -1, 0, 0.6],
  [1, 0, 0, 1.3], [-1, 0, 0, 1.3], [0, 0, 1, 0.9], [0, 0, -1, 0.9],
  [0.7, 0, 0.7, 1.45], [-0.7, 0, 0.7, 1.45], [0.7, 0, -0.7, 1.45], [-0.7, 0, -0.7, 1.45],
  [0.6, 0.8, 0, 1.0], [-0.6, 0.8, 0, 1.0], [0, 0.8, 0.6, 0.78], [0, 0.8, -0.6, 0.78],
  [0.6, -0.8, 0, 1.02], [-0.6, -0.8, 0, 1.02], [0, -0.8, 0.6, 0.8], [0, -0.8, -0.6, 0.8],
];

export default {
  name: 'gold',
  cell: 0.0026,
  budget: 78000,
  refine: 0.4,
  cells: { gems: 0.0012, core: 0.006 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.24, metalness: 0.9, emissive: '#4a3000', emissiveIntensity: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.1 },
    gem: { roughness: 0.02, transmission: 0.55, thickness: 0.02, ior: 1.76, clearcoat: 1, clearcoatRoughness: 0.02, emissive: '#200008', emissiveIntensity: 0.4 },
  },
  sculpt(s) {
    const rnd = random(4242);
    // A core for the coins to lie on, dark gold where it shows between them.
    const MOUND = [0.11, 0.07, 0.11];
    const height = (x, z) => MOUND[1] * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (MOUND[0] * MOUND[0])));
    s.part('core', () => {
      s.shape((p) => Math.max(Math.hypot(p[0] / MOUND[0], p[1] / MOUND[1], p[2] / MOUND[2]) - 1, -p[1]) * MOUND[1], [[-MOUND[0], 0, -MOUND[2]], MOUND], { color: DEEP, mat: 'gold', k: 0 });
    });

    // The mound: coins spiralling out from the top, each lying on the slope, a little askew.
    const N = 26;
    for (let i = 0; i < N; i++) {
      const a = i * 2.399963, f = Math.sqrt((i + 0.5) / N) * 0.98;
      const x = Math.cos(a) * MOUND[0] * f, z = Math.sin(a) * MOUND[0] * f, y = height(x, z);
      // Tipped to the slope there: its face along the mound's normal, plus a wobble.
      const g = [x / (MOUND[0] * MOUND[0]), y / (MOUND[1] * MOUND[1]), z / (MOUND[0] * MOUND[0])], l = Math.hypot(...g);
      const tx = Math.asin(Math.max(-1, Math.min(1, g[2] / l))) + (rnd() - 0.5) * 0.4, tz = -Math.asin(Math.max(-1, Math.min(1, g[0] / l))) + (rnd() - 0.5) * 0.4;
      coin(s, [x, y + T * 0.6, z], [tx, 0, tz]);
    }
    // Two stacks beside it, the coins not quite square on each other.
    for (const [sx, sz, n] of [[0.13, -0.06, 6], [-0.11, -0.1, 4]]) {
      for (let k = 0; k < n; k++) coin(s, [sx + (rnd() - 0.5) * 0.004, T + k * T * 2.05, sz + (rnd() - 0.5) * 0.004], [(rnd() - 0.5) * 0.06, rnd() * 6, (rnd() - 0.5) * 0.06]);
    }
    // And a few slid off onto the floor, one leaning on the heap.
    for (const [x, z] of [[0.15, 0.06], [-0.14, 0.08], [0.04, 0.16], [-0.05, -0.16]]) coin(s, [x, T, z], [(rnd() - 0.5) * 0.06, rnd() * 6, 0]);
    coin(s, [0.1, 0.03, 0.06], [0.5, 0.6, 1.1]);

    s.part('gems', () => {
      // A ruby set in the top, an emerald half sunk in the side, a sapphire on the floor.
      const tint = (hex, deep) => (p, n) => mix(rgb(deep), rgb(hex), 0.5 + 0.5 * Math.abs(n[1]));
      gem(s, [0.012, height(0.012, -0.01) + 0.012, -0.01], [0.35, 0.4, 0.2], BRILLIANT, 0.022, tint('#ff2848', '#80001c'));
      gem(s, [-0.06, height(-0.06, 0.04) + 0.006, 0.04], [0.2, 0.9, -0.5], STEP, 0.016, tint('#20d070', '#004a20'));
      gem(s, [0.085, 0.012, -0.12], [0.1, 0.3, 0], BRILLIANT, 0.017, tint('#3a70ff', '#081a70'));
    });
  },
};
