import { grainy } from '../models/skins.js';

/**
 * A lighter, held up: a chrome case with its lid flipped back, and a flame
 * on it. Stands upright facing +z, about a third of a tile tall. The flame
 * glows; the game floats the lot and turns it.
 */

const chrome = grainy('#d6dae2', 0.06, 90);

export default {
  name: 'lighter',
  scale: 1.5,
  cell: 0.0034,
  budget: 13500,
  cells: { flame: 0.0028 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    chrome: { roughness: 0.16, metalness: 1 },
    flame: { roughness: 0.5, emissive: '#ff8a20', emissiveIntensity: 3.2, transmission: 0 },
  },
  sculpt(s) {
    const C = { color: chrome, mat: 'chrome', k: 0.004 };
    // The case.
    s.box([0, 0.09, 0], [0.036, 0.09, 0.012], 0.006, C);
    // The lid, flipped back and up behind, on its hinge.
    s.box([0, 0.215, -0.02], [0.034, 0.045, 0.01], 0.005, { ...C, rot: [-0.35, 0, 0] });
    // The wheel and the chimney.
    s.cylinder([-0.012, 0.19, 0.0], 0.012, 0.012, { ...C, rot: [0, 0, Math.PI / 2] });
    s.box([0.012, 0.2, 0], [0.016, 0.018, 0.009], 0.003, C);
    s.box([0.012, 0.205, 0], [0.011, 0.016, 0.01], 0.002, { op: 'sub', k: 0.001 });
    // A band round the middle.
    s.paint((p) => Math.abs(p[1] - 0.09) - 0.004, '#8a8e98', 0.002);
    s.part('flame', () => {
      s.limb([0.012, 0.222, 0], [0.012, 0.272, 0], 0.016, 0.003, { color: '#ffb440', mat: 'flame', k: 0.008 });
      s.sphere([0.012, 0.232, 0], 0.011, { color: '#fff0a0', mat: 'flame', k: 0.01 });
    });
  },
};
