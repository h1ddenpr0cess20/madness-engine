import { grainy } from '../../../models/skins.js';

/**
 * A key: big, old and gold. A bow of three rings round a boss, a collar,
 * a long shank and a toothed bit. Stands upright on its tip, facing +z
 * (the game spins it), nearly half a tile tall.
 */

const gilt = grainy('#eab54a', 0.12, 80);

export default {
  name: 'key',
  scale: 1.45,
  cell: 0.0052,
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gilt: { roughness: 0.26, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.9 },
  },
  sculpt(s) {
    const G = { color: gilt, mat: 'gilt', k: 0.007 };
    const flat = [Math.PI / 2, 0, 0];
    // The bow: three rings in a trefoil, and a boss where they meet.
    s.torus([0, 0.349, 0], 0.03, 0.0095, { ...G, rot: flat });
    for (const m of [1, -1]) s.torus([m * 0.034, 0.296, 0], 0.03, 0.0095, { ...G, rot: flat });
    s.sphere([0, 0.314, 0], 0.016, G);
    // A collar where the bow meets the shank.
    s.torus([0, 0.256, 0], 0.017, 0.007, G);
    s.torus([0, 0.24, 0], 0.014, 0.006, G);
    // The shank, and a knob at its end.
    s.cylinder([0, 0.134, 0], 0.012, 0.115, { ...G, k: 0.004 });
    s.sphere([0, 0.016, 0], 0.016, G);
    // The bit, out to one side, its wards cut into it.
    s.box([0.04, 0.059, 0], [0.03, 0.036, 0.009], 0.003, { ...G, k: 0.004 });
    s.box([0.06, 0.064, 0], [0.012, 0.007, 0.02], 0.001, { op: 'sub', k: 0.002 });
    s.box([0.048, 0.087, 0], [0.008, 0.009, 0.02], 0.001, { op: 'sub', k: 0.002 });
    s.box([0.066, 0.034, 0], [0.006, 0.01, 0.02], 0.001, { op: 'sub', k: 0.002 });
  },
};
