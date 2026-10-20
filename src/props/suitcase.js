import { rgb } from '../models/sdf.js';
import { coat } from '../models/skins.js';

/**
 * A suitcase: an old leather one with brass corners, two straps and a
 * handle, plastered with stickers from everywhere it has been, its lid
 * sprung open on a heap of guitar picks. Sits on the floor, about half a
 * tile long.
 */

const hide = coat({ over: '#8a5a32', under: '#5a3a1e', vary: 0.14, freq: 18, grain: 0.06 });
const STICKERS = [['#d81c2a', 0.05, 0.11], ['#2a6ad8', -0.11, 0.08], ['#f0c040', -0.02, 0.06], ['#3a9a5a', 0.12, 0.05], ['#f4f0e8', -0.06, 0.12]].map(([c, x, y]) => [rgb(c), x, y]);
const PICKS = ['#ff3a8a', '#2ad0ff', '#ffd23a', '#8a4be8', '#3ae88a', '#ff7a1a'];

export default {
  name: 'suitcase',
  scale: 1.3,
  cell: 0.008,
  budget: 13500,
  cells: { fine: 0.0045 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    leather: { roughness: 0.55, clearcoat: 0.3 },
    brass: { roughness: 0.3, metalness: 1 },
    paper: { roughness: 0.6 },
    celluloid: { roughness: 0.22, clearcoat: 1, emissive: '#201020', emissiveIntensity: 0.3 },
  },
  sculpt(s) {
    // The case, on its side, and the lid hinged up and back.
    s.box([0, 0.06, 0], [0.19, 0.06, 0.12], 0.02, { color: hide, mat: 'leather', k: 0.004 });
    s.box([0, 0.08, 0], [0.175, 0.05, 0.105], 0.01, { op: 'sub', k: 0.004 });
    s.box([0, 0.17, -0.13], [0.19, 0.12, 0.02], 0.02, { color: hide, mat: 'leather', k: 0.004, rot: [-0.35, 0, 0] });
    // Stickers on the lid: where it has been.
    for (const [c, x, y] of STICKERS) s.paint((p) => Math.max(Math.hypot(p[0] - x, p[1] - (0.12 + y * 0.6)) - 0.032, -0.14 - p[2]), c, 0.003);
    s.part('fine', () => {
      for (const x of [-0.17, 0.17]) for (const z of [-0.1, 0.1]) s.sphere([x, 0.02, z], 0.018, { color: '#d8b050', mat: 'brass', k: 0.003 });
      for (const x of [-0.09, 0.09]) s.box([x, 0.065, 0.122], [0.012, 0.062, 0.004], 0.002, { color: '#3a2412', mat: 'leather', k: 0.001 });
      s.torus([0, 0.13, 0.123], 0.03, 0.008, { color: '#3a2412', mat: 'leather', k: 0.002, arc: Math.PI / 2 });
      // The picks, heaped in it and spilling over the front.
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399963, r = 0.13 * Math.sqrt((i + 0.5) / 16);
        const c = [Math.cos(a) * r * 1.3, 0.11 + (i % 3) * 0.012, Math.sin(a) * r * 0.7];
        const d = [Math.sin(a * 3), 0.2, Math.cos(a * 3)];
        s.flake(c, [c[0] + d[0] * 0.035, c[1] + d[1] * 0.035, c[2] + d[2] * 0.035], [0, 1, 0], 0.03, 0.009, 0.2, { color: PICKS[i % PICKS.length], mat: 'celluloid', k: 0.001 });
      }
    });
  },
};
