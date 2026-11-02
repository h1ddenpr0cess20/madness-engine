import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';

/**
 * A crate of vinyl: a slatted wooden record crate with VINYL stencilled on
 * its front and a hand hole in each end, packed with records in their
 * sleeves standing face out and leaning back, the way you flip through
 * them; the front one's cover a sunburst with the band's name across it,
 * the ones behind in the colours the labels could afford; and one record
 * pulled halfway up out of its sleeve to be shown off. Sits on the floor,
 * about half a tile long.
 */

const W = 0.138, D = 0.16, H = 0.13;            // the crate: half width, half depth, height
const SLEEVE = 0.12, LEAN = -0.16;              // a sleeve's half size, how far they lean back
const WOOD = rgb('#b88446'), WOOD_DARK = rgb('#7a5028'), WOOD_PALE = rgb('#d8a868');
/** Pine boards: the grain along each, each board its own shade. */
const pine = (axis) => (p) => {
  const along = p[axis], b = Math.floor(p[1] / 0.042);
  const g = noise(along * 18 + b * 5, p[1] * 120, b * 3.3) * 0.6 + noise(along * 90, p[1] * 400, b) * 0.4;
  return mix(mix(WOOD_DARK, WOOD, 0.45 + 0.55 * g), WOOD_PALE, ((b * 0.37) % 1) * 0.35);
};
const COVERS = ['#2a6ad8', '#101014', '#f4f0e8', '#ff2d95', '#2ad0ff', '#f0c040', '#6a1fb8'];

export default {
  name: 'vinyl',
  scale: 1.3,
  cell: 0.0042,
  budget: 118000,
  refine: 0.4,
  cells: { sleeves: 0.0046, cover: 0.003, record: 0.003 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    wood: { roughness: 0.78 },
    sleeve: { roughness: 0.55, clearcoat: 0.3 },
    vinyl: { roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 },
    label: { roughness: 0.55 },
  },
  sculpt(s) {
    // The crate: four corner posts, a floor, three boards up each side and end with gaps between, two at the front.
    const P = (axis) => ({ color: pine(axis), mat: 'wood', k: 0 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) s.box([x * (W - 0.009), H / 2, z * (D - 0.009)], [0.009, H / 2, 0.009], 0.002, P(1));
    s.box([0, 0.006, 0], [W, 0.006, D], 0.002, P(0));
    for (let i = 0; i < 3; i++) {
      const y = 0.022 + i * 0.043;
      s.box([0, y, -D + 0.005], [W, 0.019, 0.005], 0.0018, P(0));
      for (const x of [-1, 1]) s.box([x * (W - 0.005), y, 0], [0.005, 0.019, D], 0.0018, P(2));
      if (i < 2) s.box([0, y, D - 0.005], [W, 0.019, 0.005], 0.0018, P(0));
    }
    // The hand holes, through the top board of each end.
    for (const x of [-1, 1]) s.box([x * (W - 0.005), 0.108, 0], [0.012, 0.009, 0.04], 0.009, { op: 'sub', k: 0.001 });
    // VINYL, stencilled across the front boards.
    letters(s, 'VINYL', { at: [0, 0.02, D - 0.004], size: 0.04, width: 0.0042, color: '#16161a', depth: 0.006, spacing: 0.32 });

    // The sleeves, face out, leaning back on each other: only the front one is seen whole, the rest above the crate.
    const sleeveAt = (i) => [0, 0.012 + SLEEVE * Math.cos(LEAN) + 0.002, D - 0.04 - i * 0.033];
    s.part('sleeves', () => {
      for (let i = 1; i < 8; i++) {
        const c = sleeveAt(i), col = rgb(COVERS[(i * 3) % COVERS.length]);
        // The last one, seen from behind, all of it; the ones between, what shows over the crate.
        const f = i === 7 ? 0 : 0.4;
        const top = [c[0], c[1] + Math.cos(LEAN) * SLEEVE * f, c[2] + Math.sin(LEAN) * SLEEVE * f];
        s.box(top, [SLEEVE - (i % 2) * 0.004, SLEEVE * (1 - f), 0.0052], 0.002, {
          color: (p) => (p[1] > c[1] + SLEEVE * 0.86 ? mix(col, rgb('#ffffff'), 0.12) : col), mat: 'sleeve', k: 0, rot: [LEAN, (i % 3 - 1) * 0.02, 0],
        });
      }
    });

    // The front cover: a sunburst behind the band's name.
    s.part('cover', () => {
      const c = sleeveAt(0);
      const ray = (p) => {
        const u = p[0], v = p[1] - (c[1] - 0.02), a = Math.atan2(u, v), r = Math.hypot(u, v);
        if (r < 0.05) return rgb('#ffd23a');
        return (((a / (Math.PI / 8)) % 1) + 1) % 1 < 0.5 ? rgb('#ff6a1a') : rgb('#d81c5a');
      };
      s.box(c, [SLEEVE, SLEEVE, 0.0045], 0.002, { color: ray, mat: 'sleeve', k: 0, rot: [LEAN, 0, 0] });
      const up = [0, Math.cos(LEAN), Math.sin(LEAN)], n = [0, -up[2], up[1]];
      const at = (y) => [0, c[1] + up[1] * y + n[1] * 0.0035, c[2] + up[2] * y + n[2] * 0.0035];
      letters(s, 'MADNESS', { at: at(0.06), up, size: 0.028, width: 0.0035, color: '#16161a', depth: 0.004, spacing: 0.24, aspect: 0.62 });
    });

    // One record, pulled halfway up out of the third sleeve: black, its grooves, a red label.
    s.part('record', () => {
      const c0 = sleeveAt(2);
      const c = [0.03, c0[1] + 0.105, c0[2] + 0.008];
      const flat = [Math.PI / 2 + LEAN, 0, 0];
      s.cylinder(c, 0.115, 0.0036, {
        color: (p) => {
          const r = Math.hypot(p[0] - c[0], (p[1] - c[1]) / Math.cos(LEAN));
          return mix(rgb('#0a0a0e'), rgb('#2a2a32'), r > 0.045 && r < 0.11 ? 0.3 + 0.3 * Math.sin(r * 900) : 0);
        }, mat: 'vinyl', k: 0, rot: flat, round: 0.0015,
      });
      s.cylinder(c, 0.038, 0.004, { color: '#d81c2a', mat: 'label', k: 0, rot: flat });
      s.cylinder(c, 0.0042, 0.01, { op: 'sub', k: 0, rot: flat });
    });
  },
};
