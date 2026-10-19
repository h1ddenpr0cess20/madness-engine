import { noise, rgb } from '../../../models/sdf.js';
import { grainy, mix, smooth } from '../../../models/skins.js';

/**
 * A road case: black laminate in a ribbed silver frame, a butterfly latch
 * on each side of the lid, a recessed handle at each end, and a stencil on
 * the front. It holds picks. Sits on the floor facing +z, half a tile across.
 */

const W = 0.24, D = 0.16, H = 0.17;
const BLACK = rgb('#26262c'), SCUFF = rgb('#4a4a52');
const laminate = (p) => mix(BLACK, SCUFF, Math.max(0, noise(p[0] * 30, p[1] * 30, p[2] * 30) - 0.6) * 1.6);
const alu = grainy('#b9bdc6', 0.12, 60);

export default {
  name: 'case',
  scale: 1.3,
  cell: 0.0075,
  cells: { trim: 0.0048, label: 0.003 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    laminate: { roughness: 0.55 },
    alu: { roughness: 0.3, metalness: 0.95 },
    label: { roughness: 0.7 },
  },
  sculpt(s) {
    s.box([0, H, 0], [W, H, D], 0.016, { color: laminate, mat: 'laminate', k: 0.004 });
    // The lid joint: a dark line round it.
    s.paint((p) => Math.abs(p[1] - H * 1.12) - 0.003, '#0a0a0c', 0.003);
    s.part('trim', () => {
      const T = { color: alu, mat: 'alu', k: 0.002 };
      // Rails round the top and bottom edges, and posts at the corners.
      for (const y of [0.012, H * 2 - 0.012]) {
        s.box([0, y, D], [W + 0.004, 0.012, 0.007], 0.004, T);
        s.box([0, y, -D], [W + 0.004, 0.012, 0.007], 0.004, T);
        s.box([W, y, 0], [0.007, 0.012, D + 0.004], 0.004, T);
        s.box([-W, y, 0], [0.007, 0.012, D + 0.004], 0.004, T);
      }
      for (const x of [1, -1]) for (const z of [1, -1]) s.box([x * W, H, z * D], [0.013, H, 0.013], 0.006, T);
      // Butterfly latches on the front.
      for (const x of [-0.12, 0.12]) {
        s.box([x, H * 1.08, D + 0.012], [0.03, 0.028, 0.006], 0.006, T);
        s.cylinder([x, H * 1.08, D + 0.02], 0.014, 0.004, { ...T, rot: [Math.PI / 2, 0, 0] });
      }
      // A handle at each end.
      for (const m of [1, -1]) {
        s.box([m * (W + 0.012), H * 1.15, 0], [0.006, 0.014, 0.06], 0.004, T);
        s.box([m * (W + 0.022), H * 1.15, 0], [0.006, 0.01, 0.07], 0.004, T);
      }
    });
    // The stencil: white block capitals, as near as paint gets. A bar and a mark.
    s.paint((p) => Math.max(Math.abs(p[1] - H * 1.4) - 0.01, Math.abs(p[0]) - 0.1, 0.1 - p[2]), '#e9e5da', 0.003);
    s.paint((p) => Math.max(Math.abs(p[1] - H * 0.78) - 0.006, Math.abs(p[0] + 0.05) - 0.05, 0.1 - p[2]), '#e9e5da', 0.003);
    s.paint((p) => Math.hypot(p[0] - 0.12, p[1] - H * 0.78, 0) - (smooth(0, 1, 1) ? 0.012 : 0) + Math.max(0, 0.1 - p[2]), '#ff3a8a', 0.003);
  },
};
