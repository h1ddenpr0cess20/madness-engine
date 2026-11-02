import { rgb } from '../models/sdf.js';
import { letters } from '../models/lettering.js';

/**
 * A clapperboard: a black slate ruled in white — PROD at the top, ROLL,
 * SCENE and TAKE across the middle with their numbers chalked in, DIRECTOR
 * and CAMERA under — and TAKE 2 chalked big on the back; the clapsticks
 * along its top, striped black and white on the slant, the upper one
 * swung open on a steel hinge. It means take two. Stands upright facing
 * +z, about a third of a tile tall; the game floats it and turns it.
 */

const SW = 0.088, SH = 0.072, ST = 0.005, SY = 0.1;     // the slate: half width, half height, half thickness, middle
const STICK = 0.011;                                      // the sticks' half height
const BLACK = rgb('#121214'), WHITE = rgb('#f0f0ea');
/** The sticks' stripes: on the slant, along the stick (u runs along it). */
const stripes = (u) => (((u * 22) % 1 + 1) % 1 < 0.5 ? BLACK : WHITE);
const CHALK = '#e8e8e0', PRINT = '#d8d8d0';

export default {
  name: 'clapper',
  scale: 1.5,
  cell: 0.0018,
  budget: 60000,
  refine: 0.5,
  cells: { sticks: 0.0016, hinge: 0.001 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    slate: { roughness: 0.75 },
    stick: { roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.1 },
    steel: { roughness: 0.22, metalness: 1 },
  },
  sculpt(s) {
    // The slate.
    s.box([0, SY, 0], [SW, SH, ST], 0.003, { color: BLACK, mat: 'slate', k: 0 });
    const f = ST - 0.0005, at = (x, y) => [x, SY + y, f];
    const rule = (x0, y0, x1, y1) => s.paint((p) => {
      if (p[2] < f - 0.002) return 0.01;
      const x = p[0], y = p[1] - SY;
      return Math.max(Math.abs(y - (y0 + y1) / 2) - (Math.abs(y1 - y0) / 2 + 0.0011), Math.abs(x - (x0 + x1) / 2) - (Math.abs(x1 - x0) / 2 + 0.0011));
    }, PRINT, 0.0004);
    // The ruled lines.
    for (const y of [0.042, 0.004, -0.032]) rule(-0.08, y, 0.08, y);
    rule(-0.027, 0.004, -0.027, 0.042);
    rule(0.027, 0.004, 0.027, 0.042);
    rule(0, -0.064, 0, -0.032);
    // The printed heads of each box.
    const label = (text, x, y) => letters(s, text, { at: at(x, y), size: 0.0058, width: 0.0007, color: PRINT, depth: 0.004, align: 'left', spacing: 0.3, aspect: 0.66 });
    label('PROD', -0.078, 0.06);
    label('ROLL', -0.078, 0.034);
    label('SCENE', -0.024, 0.034);
    label('TAKE', 0.03, 0.034);
    label('DIRECTOR', -0.078, -0.004);
    label('CAMERA', -0.078, -0.04);
    label('DATE', 0.003, -0.04);
    // What's chalked in.
    const chalk = (text, x, y, size) => letters(s, text, { at: at(x, y), size, width: size * 0.11, color: CHALK, depth: 0.004, slant: 0.12, wobble: 0.05, spacing: 0.24 });
    chalk('LIVE', 0.012, 0.048, 0.014);
    chalk('7', -0.054, 0.01, 0.019);
    chalk('12', 0, 0.01, 0.019);
    chalk('2', 0.054, 0.01, 0.019);
    chalk('ME', 0.02, -0.026, 0.014);
    chalk('YOU', -0.04, -0.062, 0.012);
    chalk('TODAY', 0.042, -0.062, 0.01);
    // And on the back, big.
    letters(s, 'TAKE 2', { at: [0, SY - 0.012, -f], right: [-1, 0, 0], size: 0.03, width: 0.0034, color: CHALK, depth: 0.004, slant: 0.12, wobble: 0.04, spacing: 0.22 });

    s.part('sticks', () => {
      // The lower stick, fixed along the top of the slate; the upper one hinged at the left and swung up.
      const lower = [0, SY + SH + STICK, 0];
      s.box(lower, [SW + 0.002, STICK, ST + 0.0015], 0.0025, { color: (p) => stripes(p[0] - p[1]), mat: 'stick', k: 0 });
      const pivot = [-SW + 0.006, SY + SH + STICK * 2 + 0.002, 0], open = 0.42;
      const dir = [Math.cos(open), Math.sin(open)];
      const mid = [pivot[0] + dir[0] * (SW - 0.004) - dir[1] * STICK, pivot[1] + dir[1] * (SW - 0.004) + dir[0] * STICK, 0];
      s.box(mid, [SW + 0.002, STICK, ST + 0.0015], 0.0025, {
        color: (p) => {
          const u = (p[0] - pivot[0]) * dir[0] + (p[1] - pivot[1]) * dir[1], v = -(p[0] - pivot[0]) * dir[1] + (p[1] - pivot[1]) * dir[0];
          return stripes(u + v);
        }, mat: 'stick', k: 0, rot: [0, 0, open],
      });
    });

    s.part('hinge', () => {
      // The hinge: two steel leaves and the pin through them, at the left end.
      const S = { color: '#c4c8d0', mat: 'steel', k: 0.0005 };
      const p = [-SW + 0.006, SY + SH + STICK * 2 + 0.002, 0];
      for (const z of [-1, 1]) {
        s.box([p[0] + 0.006, p[1] - 0.006, z * (ST + 0.0022)], [0.009, 0.007, 0.0008], 0.0008, S);
        s.sphere([p[0] + 0.009, p[1] - 0.009, z * (ST + 0.003)], 0.0016, S);
      }
      s.cylinder(p, 0.0042, ST + 0.003, { ...S, rot: [Math.PI / 2, 0, 0], round: 0.001 });
    });
  },
};
