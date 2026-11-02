import { rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';
import { MATERIALS, kernel } from './popcorn.js';

/**
 * A bucket of popcorn from the concession stand: a tall paper tub in red
 * and white stripes, wider at the top, its rim rolled over, a yellow oval
 * on the front with POPCORN across it in red; and the popcorn heaped up
 * over the rim, a few pieces fallen onto it. Sits on the floor,
 * half a tile tall.
 */

const TOP = 0.27, RB = 0.084, RT = 0.116;
const RED = rgb('#d4182a'), WHITE = rgb('#fbf6ea'), RED_DARK = rgb('#9a1020');
const radiusAt = (y) => RB + (RT - RB) * (y / TOP);

/** Stripes round it, sixteen of each; the paper a touch darker toward the foot. */
const stripes = (p) => {
  const a = Math.atan2(p[0], p[2]);
  const f = (((a / (Math.PI * 2)) * 16) % 1 + 1) % 1;
  const c = f < 0.5 ? RED : WHITE;
  return mix(f < 0.5 ? RED_DARK : rgb('#e8dcc8'), c, Math.min(1, 0.7 + p[1] * 3));
};

export default {
  name: 'bucket',
  scale: 1.3,
  cell: 0.0042,
  budget: 58000,
  refine: 0.6,
  cells: { corn: 0.0038, rim: 0.0026 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    paper: { roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.3 },
    ...MATERIALS,
  },
  sculpt(s) {
    // The tub: a tapered drum of card, the popcorn filling it to the rim.
    s.shape((p) => {
      const y = p[1], r = Math.hypot(p[0], p[2]);
      const R = radiusAt(Math.max(0, Math.min(TOP, y)));
      const slope = (RT - RB) / TOP;
      return Math.max((r - R) / Math.sqrt(1 + slope * slope), -y, y - (TOP - 0.004));
    }, [[-RT, 0, -RT], [RT, TOP, RT]], { color: stripes, mat: 'paper', k: 0 });
    s.torus([0, 0.004, 0], RB - 0.002, 0.004, { color: stripes, mat: 'paper', k: 0.003 });

    // The top of the tub, under the heap: more popcorn, as far as anyone can see.
    s.paint((p) => Math.max(TOP - 0.008 - p[1], Math.hypot(p[0], p[2]) - (RT - 0.006)), '#f4e2b0', 0.002);

    s.part('rim', () => {
      // The rim, rolled over: a white bead with the stripes running over it.
      s.torus([0, TOP - 0.002, 0], RT - 0.001, 0.0052, { color: stripes, mat: 'paper', k: 0.002 });
    });

    // The yellow oval on the front, a red line round it, and the word across it.
    const face = radiusAt(0.15);
    s.paint((p) => {
      if (p[2] < face * 0.6) return 0.01;
      const u = Math.atan2(p[0], p[2]) * face, v = p[1] - 0.15;
      return Math.hypot(u / 0.072, v / 0.046) - 1;
    }, '#d01828', 0.0012);
    s.paint((p) => {
      if (p[2] < face * 0.6) return 0.01;
      const u = Math.atan2(p[0], p[2]) * face, v = p[1] - 0.15;
      return Math.hypot(u / 0.067, v / 0.041) - 1;
    }, '#ffd23a', 0.0012);
    letters(s, 'POPCORN', { at: [0, 0.141, face - 0.03], up: [0, 1, 0], right: [1, 0, 0], size: 0.018, width: 0.0023, color: '#c81424', depth: 0.05, spacing: 0.24, aspect: 0.56 });

    s.part('corn', () => {
      // The heap: a bed of it just under the rim, then piled up over it in a dome.
      const N = 34;
      for (let i = 0; i < N; i++) {
        const a = i * 2.399963, f = Math.sqrt((i + 0.5) / N);
        const r = (RT - 0.022) * f;
        const y = TOP - 0.002 + 0.05 * (1 - f * f) + (i % 4) * 0.004;
        kernel(s, [Math.cos(a) * r, y, Math.sin(a) * r], 0.036 + (i % 5) * 0.003, i * 11 + 5);
      }
      for (let i = 0; i < 8; i++) {
        const a = i * 2.399963 + 1.1, r = (RT - 0.04) * Math.sqrt((i + 0.5) / 8);
        kernel(s, [Math.cos(a) * r, TOP + 0.03 + 0.03 * (1 - (r / RT) ** 2), Math.sin(a) * r], 0.036, i * 13 + 101);
      }
      // A few over the edge, on the rim.
      for (const [a, y, out] of [[0.5, TOP + 0.014, -0.008], [2.6, TOP + 0.012, -0.006], [4.4, TOP + 0.015, -0.01]]) {
        kernel(s, [Math.sin(a) * (RT + out), y, Math.cos(a) * (RT + out)], 0.034, Math.round(a * 50));
      }
    });
  },
};
