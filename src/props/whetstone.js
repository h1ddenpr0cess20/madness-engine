import { grainy } from '../models/skins.js';

/**
 * A whetstone: a grey sharpening stone, wet and dark where the oil is, on a
 * block of wood, with a few bright filings round it. It gives back what the
 * spikes lost. Stands facing +z, about a third of a tile across; the game
 * floats it and turns it.
 */

const stone = grainy('#8a8f98', 0.18, 70);
const oil = grainy('#4c525c', 0.14, 70);

export default {
  name: 'whetstone',
  scale: 1.45,
  cell: 0.0036,
  cells: { fine: 0.0028 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    stone: { roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 },
    wood: { roughness: 0.75 },
    steel: { roughness: 0.18, metalness: 1 },
  },
  sculpt(s) {
    // The wooden block it sits in.
    s.box([0, 0.035, 0], [0.12, 0.035, 0.06], 0.008, { color: '#5a3a1e', mat: 'wood', k: 0.004 });
    // The stone, long and flat, its top dark with oil where the blade has been.
    s.box([0, 0.095, 0], [0.105, 0.05, 0.05], 0.012, { color: stone, mat: 'stone', k: 0.004 });
    s.paint((p) => Math.max(Math.abs(p[0] + 0.01) - 0.075, Math.abs(p[2]) - 0.032, 0.12 - p[1]), oil, 0.006);
    // A groove worn into it, and the filings: a few specks of bright steel.
    s.ellipsoid([-0.01, 0.145, 0.0], [0.07, 0.008, 0.012], { op: 'sub', k: 0.006 });
    s.part('fine', () => {
      for (let i = 0; i < 9; i++) {
        const a = i * 2.399963, r = 0.025 + 0.06 * ((i * 0.37) % 1);
        s.limb([Math.cos(a) * r, 0.155, Math.sin(a) * r * 0.5], [Math.cos(a) * r + 0.012, 0.158, Math.sin(a) * r * 0.5 + 0.004], 0.0035, 0.002, { color: '#f4f6fb', mat: 'steel', k: 0.001 });
      }
    });
  },
};
