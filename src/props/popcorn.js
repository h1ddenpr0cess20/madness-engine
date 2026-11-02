import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A handful of popcorn, spilled from somebody's bucket: popped kernels in a
 * heap, each one burst into four to six crinkled white wings round a little
 * core, a scrap of the golden hull still stuck to it, a yellow blush of
 * butter toward the hull. About a quarter of a tile across. `kernel` is
 * the bucket's popcorn too.
 */

const CREAM = rgb('#fff7e6'), WHITE = rgb('#fffdf6'), BUTTER = rgb('#f2cc5a'), HULL = rgb('#c88a2a'), HULL_DARK = rgb('#7a4a14');

export const MATERIALS = {
  corn: { roughness: 0.85, sheen: 0.5, sheenColor: '#fff4d0', emissive: '#2a1e06', emissiveIntensity: 0.2 },
  hull: { roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 },
};

/** A seeded run of numbers 0–1. */
function random(seed) {
  let s = Math.floor(seed * 9973 + 17) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * One popped kernel at `c`, about `size` across its middle: a core, four
 * to six wings burst out of it every which way, and the hull on the side
 * they burst away from. `seed` makes each one its own.
 */
export function kernel(s, c, size, seed, { mat = 'corn', hullMat = 'hull', bone = 'root' } = {}) {
  const rnd = random(seed);
  const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
  // The hull's side: the wings burst away from it.
  const back = unit([rnd() - 0.5, -0.1 - rnd() * 0.5, rnd() - 0.5]);
  const H = [c[0] + back[0] * size * 0.32, c[1] + back[1] * size * 0.32, c[2] + back[2] * size * 0.32];
  const color = (p) => {
    const d = Math.hypot(p[0] - H[0], p[1] - H[1], p[2] - H[2]) / size;
    const lump = noise(p[0] * 300 + seed, p[1] * 300, p[2] * 300);
    return mix(mix(BUTTER, CREAM, Math.min(1, d * 1.15)), WHITE, Math.max(0, lump - 0.5) * 0.8);
  };
  const o = { color, mat, bone, k: size * 0.11, bump: [size * 0.055, 4.2 / size] };
  s.sphere(c, size * 0.3, o);
  const wings = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < wings; i++) {
    // Each wing out from the core, away from the hull, turned its own way.
    const a = (i / wings) * Math.PI * 2 + rnd() * 0.8;
    let d = [Math.cos(a), 0.3 + rnd() * 0.6, Math.sin(a)];
    d = unit([d[0] - back[0] * 0.8, d[1] - back[1] * 0.8, d[2] - back[2] * 0.8]);
    const w = size * (0.3 + rnd() * 0.14);
    const at = [c[0] + d[0] * size * 0.4, c[1] + d[1] * size * 0.4, c[2] + d[2] * size * 0.4];
    s.ellipsoid(at, [w, w * (0.62 + rnd() * 0.2), w * (0.85 + rnd() * 0.2)], { ...o, rot: [rnd() * 3, rnd() * 3, rnd() * 3] });
    // A smaller puff on the end of the bigger ones.
    if (w > size * 0.38) s.sphere([at[0] + d[0] * w * 0.6, at[1] + d[1] * w * 0.6, at[2] + d[2] * w * 0.6], w * 0.55, o);
  }
  // The hull: a little cupped flake of golden skin on the back, darker at its tip.
  const hc = (p) => mix(HULL, HULL_DARK, Math.min(1, Math.hypot(p[0] - H[0], p[1] - H[1], p[2] - H[2]) / (size * 0.3)));
  const side = unit([back[2], 0.2, -back[0]]);
  s.flake([H[0] - side[0] * size * 0.12, H[1] - side[1] * size * 0.12, H[2] - side[2] * size * 0.12],
    [H[0] + side[0] * size * 0.12 + back[0] * size * 0.08, H[1] + side[1] * size * 0.12 + back[1] * size * 0.08, H[2] + side[2] * size * 0.12 + back[2] * size * 0.08],
    back, size * 0.17, size * 0.08, 0.35, { color: hc, mat: hullMat, bone, k: size * 0.06 });
}

export default {
  name: 'popcorn',
  scale: 1.5,
  cell: 0.0026,
  budget: 30000,
  bones: [['root', null, [0, 0, 0]]],
  materials: MATERIALS,
  sculpt(s) {
    // Where each kernel sits: [x, y, z, size], the bottom ones first.
    const heap = [
      [0, 0.017, 0, 0.042], [0.045, 0.014, 0.022, 0.036], [-0.042, 0.014, 0.026, 0.038], [0.008, 0.014, -0.046, 0.038],
      [-0.038, 0.013, -0.03, 0.034], [0.044, 0.013, -0.03, 0.035], [0.078, 0.011, 0.058, 0.03], [-0.076, 0.011, -0.004, 0.032],
      [0.014, 0.05, 0.014, 0.04], [-0.02, 0.048, -0.016, 0.036], [0.032, 0.045, -0.012, 0.034], [-0.012, 0.072, 0.004, 0.034],
      [0.02, 0.011, 0.075, 0.03],
    ];
    heap.forEach(([x, y, z, r], i) => kernel(s, [x, y, z], r, i * 7 + 3));
  },
};
