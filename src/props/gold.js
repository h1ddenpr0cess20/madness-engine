import { noise, rgb } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

/**
 * A heap of gold: coins piled up in a mound, more slid off it on top and
 * spilled round the foot of it, and a couple of gems in amongst them. Sits
 * on the floor, about a third of a tile across.
 */

const GOLD = rgb('#f0bf4c'), DEEP = rgb('#8a5a14');

/** A coin at `c`: a rim round its edge and a stamped face. */
const coin = (c, r) => (p) => {
  const d = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) / r;
  const face = noise(p[0] * 220, p[1] * 220, p[2] * 220);
  const k = d > 0.82 ? 0.7 + 0.3 * smooth(0.95, 0.85, d) : 0.85 + 0.25 * face;
  return mix(DEEP, GOLD, k);
};

/** The heap's shape: coins lie over this, each tipped to its slope. */
const MOUND = [0.13, 0.085, 0.13];
const height = (x, z) => MOUND[1] * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (MOUND[0] * MOUND[0]))) - 0.01;
const R = 0.034;

/** Euler angles that tip a coin's face (its local y) to point along n. */
const facing = (n) => [Math.asin(n[2]), 0, Math.atan2(-n[0], n[1])];

export default {
  name: 'gold',
  cell: 0.0068,
  cells: { gems: 0.0045 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.3, metalness: 1, emissive: '#3a2600', emissiveIntensity: 0.8 },
    gem: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#400010', emissiveIntensity: 0.6 },
  },
  sculpt(s) {
    // A core for the coins to lie on, dark where it shows between them.
    s.ellipsoid([0, -0.01, 0], MOUND, { color: DEEP, mat: 'gold', k: 0 });
    s.box([0, 0.1, 0], [0.3, 0.1, 0.3], 0, { op: 'inter', k: 0 });
    // Coins all over it, spiralling out from the top, each lying on the slope, a little askew.
    const N = 34;
    for (let i = 0; i < N; i++) {
      const a = i * 2.399963, f = Math.sqrt((i + 0.5) / N) * 1.02;
      const x = Math.cos(a) * MOUND[0] * f, z = Math.sin(a) * MOUND[0] * f;
      const y = Math.max(0.004, height(x, z));
      const g = [x / (MOUND[0] * MOUND[0]), (y + 0.01) / (MOUND[1] * MOUND[1]), z / (MOUND[0] * MOUND[0])];
      const l = Math.hypot(...g);
      const n = [g[0] / l + Math.sin(i * 3.7) * 0.2, g[1] / l, g[2] / l + Math.cos(i * 5.1) * 0.2];
      const nl = Math.hypot(...n);
      const c = [x, y + 0.003, z];
      s.cylinder(c, R, 0.0045, { color: coin(c, R), mat: 'gold', k: 0, round: 0.0025, rot: facing(n.map((v) => v / nl)) });
    }
    // And a few slid off onto the floor.
    for (const [x, z, t] of [[0.17, 0.05, 0.1], [-0.16, 0.09, -0.12], [0.05, 0.18, 0.08], [-0.06, -0.17, 0.14]]) {
      const c = [x, 0.006, z];
      s.cylinder(c, R, 0.0045, { color: coin(c, R), mat: 'gold', k: 0, round: 0.0025, rot: [t, 0, t * 0.6] });
    }
    // Nothing under the floor.
    s.box([0, 0.15, 0], [0.4, 0.15, 0.4], 0, { op: 'inter', k: 0 });

    s.part('gems', () => {
      // A ruby, cut square, and an emerald, long, half sunk in the coins; a sapphire on the floor.
      s.box([0.04, height(0.04, -0.03) + 0.014, -0.03], [0.017, 0.017, 0.017], 0.003, { color: '#d0102c', mat: 'gem', k: 0, rot: [0.62, 0.78, 0.2] });
      s.ellipsoid([-0.05, height(-0.05, 0.035) + 0.012, 0.035], [0.024, 0.012, 0.014], { color: '#0f9a48', mat: 'gem', k: 0, rot: [0, 0.9, 0.2] });
      s.box([0.11, 0.012, -0.11], [0.012, 0.012, 0.012], 0.002, { color: '#2050e0', mat: 'gem', k: 0, rot: [0.6, 0.2, 0.7] });
    });
  },
};
