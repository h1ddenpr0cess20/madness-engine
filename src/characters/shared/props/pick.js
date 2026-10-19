import { grainy } from '../../../models/skins.js';

/**
 * A pile of guitar picks: seven of them, in a heap, in the colours picks
 * come in, each a flat rounded teardrop. About a quarter of a tile across.
 */

const COLOURS = ['#ff3a8a', '#2ad0ff', '#ffd23a', '#8a4be8', '#3ae88a', '#ff7a1a', '#f5f0e6'];

export default {
  name: 'pick',
  scale: 1.5,
  cell: 0.0042,
  budget: 9000,
  bones: [['root', null, [0, 0, 0]]],
  materials: { celluloid: { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, emissive: '#201020', emissiveIntensity: 0.3 } },
  sculpt(s) {
    // Where each pick lies: [x, z, height, turn, tip up/down].
    const layout = [
      [0.0, 0.0, 0.012, 0.3, 0], [0.07, 0.03, 0.012, 2.1, 0.05], [-0.06, 0.05, 0.012, 4.2, -0.04], [0.02, -0.07, 0.012, 5.4, 0.03],
      [0.0, 0.01, 0.03, 1.3, 0.12], [0.05, -0.03, 0.03, 3.4, -0.1], [-0.03, 0.0, 0.047, 5.9, 0.08],
    ];
    layout.forEach(([x, z, y, a, tip], i) => {
      const c = [x, y, z];
      const dir = [Math.sin(a), tip, Math.cos(a)];
      const len = 0.06;
      const from = [c[0] - dir[0] * len * 0.55, c[1] - dir[1] * len * 0.55, c[2] - dir[2] * len * 0.55];
      const to = [c[0] + dir[0] * len * 0.55, c[1] + dir[1] * len * 0.55, c[2] + dir[2] * len * 0.55];
      s.flake(from, to, [0, 1, 0], 0.052, 0.014, 0.18, { color: grainy(COLOURS[i % COLOURS.length], 0.04, 120), mat: 'celluloid', k: 0.002 });
    });
  },
};
