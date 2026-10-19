import { fbm } from '../../../models/sdf.js';
import { coat } from '../../../models/skins.js';

/**
 * A handful of popcorn, spilled from somebody's bucket: a dozen puffed
 * kernels in a heap, cream with a yellow blush of butter, each one lumpy.
 * About a quarter of a tile across.
 */

const corn = coat({ over: '#fff4d8', under: '#f0c860', vary: 0.18, freq: 60, grain: 0.06, edge: [-0.6, 0.6] });

export default {
  name: 'popcorn',
  scale: 1.5,
  cell: 0.0042,
  budget: 9000,
  bones: [['root', null, [0, 0, 0]]],
  materials: { corn: { roughness: 0.75, sheen: 0.4, sheenColor: '#fff0c0', emissive: '#3a2a08', emissiveIntensity: 0.25 } },
  sculpt(s) {
    // Where each kernel sits: [x, y, z, size].
    const heap = [
      [0, 0.022, 0, 0.026], [0.045, 0.02, 0.02, 0.022], [-0.04, 0.02, 0.025, 0.023], [0.01, 0.02, -0.045, 0.024],
      [-0.035, 0.02, -0.03, 0.02], [0.04, 0.02, -0.03, 0.021], [0.07, 0.016, 0.055, 0.017], [-0.07, 0.016, -0.005, 0.018],
      [0.012, 0.05, 0.012, 0.024], [-0.018, 0.05, -0.016, 0.021], [0.03, 0.046, -0.012, 0.019], [0.0, 0.074, 0.0, 0.019],
    ];
    heap.forEach(([x, y, z, r], i) => {
      // A kernel is a few blobs melted together, lumpy as popcorn is.
      const c = [x, y, z];
      s.sphere(c, r, { color: corn, mat: 'corn', k: 0.006, bump: [r * 0.25, 70 + i * 3] });
      for (let k = 0; k < 3; k++) {
        const a = i * 2.1 + k * 2.09, b = (k - 1) * 0.7;
        s.sphere([x + Math.cos(a) * r * 0.75, y + Math.sin(b) * r * 0.55, z + Math.sin(a) * r * 0.75], r * 0.62, { color: corn, mat: 'corn', k: 0.008 });
      }
    });
    void fbm;
  },
};
