import { rgb } from '../models/sdf.js';
import { coat } from '../models/skins.js';

/**
 * A bucket of popcorn from the concession stand: a tall paper tub in red
 * and white stripes, wider at the top, a band of gold round the rim, and
 * popcorn heaped up over it. Sits on the floor, half a tile tall.
 */

const RED = rgb('#d81c2a'), WHITE = rgb('#f6f0e2');
const stripes = (p) => {
  const a = Math.atan2(p[0], p[2]);
  const f = (((a / (Math.PI * 2)) * 14) % 1 + 1) % 1;
  return f < 0.5 ? RED : WHITE;
};
const corn = coat({ over: '#fff4d8', under: '#f0c860', vary: 0.2, freq: 60, grain: 0.06, edge: [-0.6, 0.6] });

export default {
  name: 'bucket',
  scale: 1.3,
  cell: 0.0075,
  cells: { corn: 0.0058 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    paper: { roughness: 0.6, clearcoat: 0.3 },
    gold: { roughness: 0.3, metalness: 0.9 },
    corn: { roughness: 0.75, sheen: 0.4, sheenColor: '#fff0c0', emissive: '#3a2a08', emissiveIntensity: 0.25 },
  },
  sculpt(s) {
    // The tub, tapering down, open at the top.
    s.limb([0, 0.015, 0], [0, 0.27, 0], 0.085, 0.118, { color: stripes, mat: 'paper', k: 0.004 });
    s.limb([0, 0.3, 0], [0, 0.31, 0], 0.104, 0.104, { op: 'sub', k: 0.004 });
    s.torus([0, 0.272, 0], 0.115, 0.007, { color: '#f0c040', mat: 'gold', k: 0.002 });
    s.paint((p) => Math.abs(p[1] - 0.14) - 0.02, '#f0c040', 0.004);
    s.part('corn', () => {
      for (let i = 0; i < 26; i++) {
        const a = i * 2.399963, r = 0.1 * Math.sqrt((i + 0.5) / 26);
        const y = 0.27 + 0.05 * (1 - (r / 0.1) ** 2) + (i % 3) * 0.006;
        s.sphere([Math.cos(a) * r, y, Math.sin(a) * r], 0.02 + (i % 4) * 0.002, { color: corn, mat: 'corn', k: 0.008, bump: [0.005, 80 + i] });
      }
    });
  },
};
