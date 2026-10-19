import { coat } from '../models/skins.js';

/**
 * A crate of vinyl: a wooden record crate stencilled in black, packed with
 * sleeves in the colours the labels could afford, and one record pulled
 * halfway out to be shown off. Sits on the floor, about half a tile long.
 */

const wood = coat({ over: '#b07a3e', under: '#6e4622', vary: 0.16, freq: 22, grain: 0.07 });
const SLEEVES = ['#e8202a', '#101014', '#f4f0e8', '#ff2d95', '#2ad0ff', '#f0c040', '#6a1fb8', '#3a3a44'];

export default {
  name: 'vinyl',
  scale: 1.3,
  cell: 0.0075,
  cells: { fine: 0.0042 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    wood: { roughness: 0.8 },
    sleeve: { roughness: 0.65 },
    vinyl: { roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 },
    label: { roughness: 0.55 },
  },
  sculpt(s) {
    // The crate: a box with the top cut away, a slat missing from the front so the sleeves show.
    s.box([0, 0.07, 0], [0.2, 0.07, 0.15], 0.01, { color: wood, mat: 'wood', k: 0.004 });
    s.box([0, 0.105, 0], [0.18, 0.07, 0.13], 0.006, { op: 'sub', k: 0.002 });
    s.box([0, 0.12, 0.15], [0.14, 0.03, 0.02], 0.004, { op: 'sub', k: 0.002 });
    // A stencil along the front: three bars, black.
    for (const x of [-0.1, -0.06, 0.1]) s.paint((p) => Math.max(Math.abs(p[0] - x) - 0.012, Math.abs(p[1] - 0.045) - 0.022, 0.1 - p[2]), '#101014', 0.003);
    // The sleeves, stood in a row and leaning on each other.
    s.part('fine', () => {
      for (let i = 0; i < 9; i++) {
        const lean = (i - 4) * 0.02;
        s.box([-0.155 + i * 0.039, 0.15 + (i % 3) * 0.01, 0], [0.012, 0.085, 0.115], 0.003, { color: SLEEVES[(i * 3) % SLEEVES.length], mat: 'sleeve', k: 0.001, rot: [0, 0, lean] });
      }
      // One record, half out of its sleeve at the front: black, a ring of grooves, a red label.
      const flat = [Math.PI / 2 - 0.5, 0, 0];
      s.cylinder([0.0, 0.19, 0.2], 0.12, 0.0035, { color: '#0a0a0e', mat: 'vinyl', k: 0.001, rot: flat });
      s.paint((p) => Math.abs(Math.hypot(p[0], (p[1] - 0.19) * 1.3, p[2] - 0.2) - 0.1) - 0.006, '#26262e', 0.003);
      s.cylinder([0.0, 0.19, 0.2036], 0.04, 0.0015, { color: '#d81c2a', mat: 'label', k: 0.001, rot: flat });
    });
  },
};
