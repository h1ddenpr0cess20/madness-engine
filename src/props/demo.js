import { rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';

/**
 * A demo tape: a cassette in a dark shell, its two halves screwed together
 * at the corners and the foot, a paper label on each side — the side's
 * letter in a box, a red band, DEMO in marker and the band's name crossed
 * out and written again under it — and a window through it all where the
 * two hubs sit with the tape wound on them, more on one than the other.
 * Along its foot the head opening, the tape showing in it. It is the only
 * copy. Stands upright facing +z, about a third of a tile across; the game
 * floats and turns it.
 */

const C = [0, 0.125, 0], W = 0.165, H = 0.104, T = 0.014;       // middle, half width, half height, half thickness
const WIN = { x: 0.068, y: 0.02, h: 0.022 };                     // the window: half width, its middle (from C), half height
const HUBS = [-0.058, 0.058];
const SHELL = rgb('#26222c'), SHELL_HI = rgb('#3a3442');

export default {
  name: 'demo',
  scale: 1.3,
  cell: 0.0036,
  budget: 80000,
  refine: 0.5,
  cells: { label: 0.0021, reels: 0.0024, screws: 0.0014 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    shell: { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 },
    label: { roughness: 0.75 },
    reel: { roughness: 0.4 },
    tape: { roughness: 0.32, metalness: 0.5 },
    steel: { roughness: 0.22, metalness: 1 },
  },
  sculpt(s) {
    const S = { color: (p) => mix(SHELL, SHELL_HI, Math.abs(p[2]) < 0.0012 ? 0 : 0.35), mat: 'shell', k: 0 };
    // The shell: a slab with rounded corners, the foot a little wider where the head goes.
    s.box(C, [W, H, T], 0.008, S);
    s.box([0, C[1] - H + 0.016, 0], [0.12, 0.016, T + 0.0015], 0.006, { ...S, k: 0.004 });
    // The window, sunk into both faces, and the head opening along the foot.
    for (const z of [-1, 1]) s.box([0, C[1] + WIN.y, z * T], [WIN.x, WIN.h, 0.007], WIN.h * 0.9, { op: 'sub', k: 0.001 });
    s.box([0, C[1] - H, 0], [0.026, 0.01, T * 0.65], 0.003, { op: 'sub', k: 0.001 });
    for (const x of [-0.068, 0.068]) s.box([x, C[1] - H, 0], [0.012, 0.008, T * 0.65], 0.003, { op: 'sub', k: 0.001 });
    for (const x of [-0.098, 0.098]) s.cylinder([x, C[1] - H + 0.012, 0], 0.0045, T + 0.01, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });

    s.part('reels', () => {
      // The hubs inside the window, toothed, the tape wound on them: a fat pack on one, a thin one on the other.
      for (const [i, x] of HUBS.entries()) {
        const c = [x, C[1] + WIN.y, 0];
        s.cylinder(c, i === 0 ? 0.046 : 0.03, T * 0.55, { color: '#3a2414', mat: 'tape', k: 0, rot: [Math.PI / 2, 0, 0] });
        s.cylinder(c, 0.0145, T * 0.85, { color: '#f2eee6', mat: 'reel', k: 0.001, rot: [Math.PI / 2, 0, 0] });
        s.cylinder(c, 0.009, T + 0.01, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          s.box([x + Math.cos(a) * 0.0085, c[1] + Math.sin(a) * 0.0085, 0], [0.0022, 0.0018, T * 0.85], 0.0006, { color: '#f2eee6', mat: 'reel', k: 0, rot: [0, 0, a] });
        }
      }
      // The tape along the foot, across the head opening.
      s.box([0, C[1] - H + 0.0035, 0], [0.11, 0.0016, T * 0.32], 0.0008, { color: '#3a2414', mat: 'tape', k: 0 });
    });

    s.part('screws', () => {
      for (const z of [-1, 1]) for (const [x, y] of [[-0.148, 0.088], [0.148, 0.088], [-0.148, -0.088], [0.148, -0.088], [0, -0.07]]) {
        const c = [x, C[1] + y, z * (T + 0.0006)];
        s.cylinder(c, 0.0048, 0.0012, { color: '#b8bcc4', mat: 'steel', k: 0, round: 0.0008, rot: [Math.PI / 2, 0, 0] });
        s.box([c[0], c[1], c[2] + z * 0.0012], [0.0034, 0.0006, 0.0008], 0, { op: 'sub', k: 0 });
        s.box([c[0], c[1], c[2] + z * 0.0012], [0.0006, 0.0034, 0.0008], 0, { op: 'sub', k: 0 });
      }
    });

    s.part('label', () => {
      // A label on each face: paper, a window cut in it.
      for (const z of [-1, 1]) {
        s.box([0, C[1] + 0.022, z * (T + 0.0004)], [0.14, 0.062, 0.0012], 0.004, { color: '#f4efe2', mat: 'label', k: 0 });
        s.box([0, C[1] + WIN.y, z * T], [WIN.x + 0.004, WIN.h + 0.004, 0.004], WIN.h, { op: 'sub', k: 0 });
      }
      // What's on it: the side in a box, a red band along the top, lines to write on, and the writing.
      for (const [z, side, title, name, crossed] of [[1, 'A', 'DEMO', 'MADNESS', 'THE BAND'], [-1, 'B', 'LIVE', 'MADNESS', 'THE BAND']]) {
        const right = [z, 0, 0], f = z * (T + 0.0012);
        const at = (x, y) => [z * x, C[1] + y, f - z * 0.001];
        s.paint((p) => {
          if (p[2] * z < T) return 0.01;
          return Math.max(Math.abs(p[1] - (C[1] + 0.074)) - 0.007, Math.abs(p[0]) - 0.138);
        }, '#d01c28', 0.0006);
        s.paint((p) => {
          if (p[2] * z < T) return 0.01;
          const x = p[0] * z, y = p[1] - C[1];
          const box = Math.max(Math.abs(x + 0.12) - 0.012, Math.abs(y - 0.048) - 0.012);
          return Math.max(box, -(box + 0.0016));
        }, '#16161a', 0.0005);
        letters(s, side, { at: at(-0.12, 0.041), right, size: 0.014, width: 0.0017, color: '#16161a', depth: 0.004 });
        letters(s, title, { at: at(0.0, 0.043), right, size: 0.018, width: 0.0022, color: '#16161a', depth: 0.004, slant: 0.15, wobble: 0.05, spacing: 0.2 });
        letters(s, crossed, { at: at(-0.06, -0.019), right, size: 0.011, width: 0.0013, color: '#2a3a9a', depth: 0.004, slant: 0.12, wobble: 0.06, spacing: 0.22 });
        // Crossed out.
        s.paint((p) => {
          if (p[2] * z < T) return 0.01;
          const x = p[0] * z, y = p[1] - (C[1] - 0.0135) - (x + 0.06) * 0.08;
          return Math.max(Math.abs(y) - 0.0011, Math.abs(x + 0.06) - 0.036);
        }, '#2a3a9a', 0.0005);
        letters(s, name, { at: at(0.05, -0.034), right, size: 0.012, width: 0.0014, color: '#2a3a9a', depth: 0.004, slant: 0.12, wobble: 0.06, spacing: 0.22 });
      }
    });
  },
};
