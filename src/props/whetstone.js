import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A whetstone: a two-sided sharpening stone, the coarse brown grit under
 * the fine grey, its edges chamfered, its top worn into a shallow dish and
 * dark and wet down the middle with grey slurry where the blade has been,
 * a few beads of water standing on it; set in a walnut block with a tray
 * cut for it and rubber feet under. It gives back what the spikes lost.
 * Stands facing +z, about a third of a tile across; the game floats it and
 * turns it.
 */

const SW = 0.1, SD = 0.038, SH = 0.06, SY = 0.034;     // the stone: half length, half depth, height, where its foot sits
const SPLIT = SY + 0.026;                              // where the coarse grit meets the fine
const FINE = rgb('#b0b0aa'), FINE_DARK = rgb('#74767a'), COARSE = rgb('#b46a3a'), COARSE_DARK = rgb('#7a4222');
/** The stone: speckled grit, coarse below and fine above, the wet stripe dark down the top. */
const grit = (p) => {
  const speck = noise(p[0] * 700, p[1] * 700, p[2] * 700), cloud = noise(p[0] * 40, p[1] * 40, p[2] * 40);
  const coarse = p[1] < SPLIT;
  let c = coarse ? mix(COARSE_DARK, COARSE, 0.5 + 0.35 * cloud + 0.7 * (speck - 0.5)) : mix(FINE_DARK, FINE, 0.55 + 0.3 * cloud + 0.55 * (speck - 0.5));
  if (Math.abs(p[1] - SPLIT) < 0.0012) c = mix(c, rgb('#3a2a20'), 0.5);
  // Wet down the middle of the top, the slurry grey in it.
  const top = p[1] - (SY + SH - 0.006);
  if (top > 0) {
    const wet = Math.max(0, 1 - Math.abs(p[2]) / (SD * 0.7)) * Math.max(0, 1 - Math.abs(p[0] + 0.008) / (SW * 0.85));
    c = mix(c, rgb('#4a525c'), Math.min(1, wet * 2.2) * 0.7);
    const slurry = noise(p[0] * 90, p[2] * 30, 4.2);
    if (wet > 0.2 && slurry > 0.62) c = mix(c, rgb('#8a9098'), (slurry - 0.62) * 2);
  }
  return c;
};
const WALNUT = rgb('#5a3820'), WALNUT_DARK = rgb('#2e1a0c'), WALNUT_PALE = rgb('#7a5030');
const walnut = (p) => {
  const g = noise(p[0] * 14, p[1] * 160, p[2] * 160) * 0.6 + noise(p[0] * 50, p[1] * 400, p[2] * 400) * 0.4;
  return mix(mix(WALNUT_DARK, WALNUT, 0.4 + 0.6 * g), WALNUT_PALE, Math.max(0, noise(p[0] * 6, p[1] * 30, p[2] * 30) - 0.6));
};

export default {
  name: 'whetstone',
  scale: 1.45,
  cell: 0.0028,
  budget: 52000,
  refine: 0.4,
  cells: { stone: 0.0024, beads: 0.0012 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    stone: { roughness: 0.82, clearcoat: 0.25, clearcoatRoughness: 0.3 },
    wood: { roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.2 },
    rubber: { roughness: 0.9 },
    water: { roughness: 0.02, transmission: 1, thickness: 0.004, ior: 1.33, clearcoat: 1 },
  },
  sculpt(s) {
    // The block: walnut, its edges chamfered, a tray cut in its top for the stone.
    s.box([0, 0.022, 0], [0.125, 0.017, 0.058], 0.006, { color: walnut, mat: 'wood', k: 0 });
    s.box([0, 0.04, 0], [SW + 0.003, 0.008, SD + 0.003], 0.002, { op: 'sub', k: 0.001 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) s.cylinder([x * 0.105, 0.0035, z * 0.042], 0.008, 0.0035, { color: '#1a1a1c', mat: 'rubber', k: 0.001, round: 0.002 });

    s.part('stone', () => {
      // The stone, chamfered all round, its top worn hollow along its length.
      s.box([0, SY + SH / 2, 0], [SW, SH / 2, SD], 0.0026, { color: grit, mat: 'stone', k: 0, bump: [0.0004, 600] });
      s.ellipsoid([-0.008, SY + SH + 0.0275, 0], [SW * 0.95, 0.03, SD * 1.6], { op: 'sub', k: 0.004 });
    });

    s.part('beads', () => {
      // Beads of water standing on the top.
      for (const [x, z, r] of [[0.05, 0.012, 0.0042], [0.064, -0.016, 0.003], [-0.07, 0.02, 0.0036], [0.02, -0.024, 0.0026], [-0.04, -0.02, 0.0032]]) {
        s.ellipsoid([x, SY + SH - 0.0012, z], [r, r * 0.55, r], { color: '#e8f2ff', mat: 'water', k: 0 });
      }
    });
  },
};
