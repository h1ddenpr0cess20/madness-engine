import { rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';

/**
 * A gold record: a disc of gold-plated vinyl, the grooves running round it
 * in fine rings with the gaps between the songs showing, a rolled bead at
 * its rim and a smooth run-out round the label; the label red, GOLD across
 * it and SIDE A under that, the spindle hole through the middle. Stands
 * upright facing +z, about 0.45 tiles across; the game floats and turns it,
 * so both faces are the same.
 */

const C = [0, 0.26, 0], R = 0.2, LABEL = 0.052, HOLE = 0.0048;
const GOLD = rgb('#f2c454'), DEEP = rgb('#b88624'), BRIGHT = rgb('#ffe49a');
const TRACKS = [0.072, 0.098, 0.121, 0.146, 0.17];   // the gaps between songs

/** Half the disc's thickness at radius r: the bead at the rim, the grooved field, the run-out, the label. */
const step = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const half = (r) => 0.0049 + 0.0003 * step(LABEL, LABEL + 0.004, r) - 0.0006 * step(0.064, 0.068, r) + 0.0016 * step(R - 0.008, R - 0.004, r);

/** Grooves: fine rings, a smooth band between songs, the run-out plain. */
const grooves = (p) => {
  const r = Math.hypot(p[0] - C[0], p[1] - C[1]);
  if (r > R - 0.006 || r < 0.066) return mix(GOLD, BRIGHT, 0.25);
  const gap = TRACKS.reduce((m, t) => Math.min(m, Math.abs(r - t)), 1);
  if (gap < 0.0018) return mix(GOLD, BRIGHT, 0.5);
  return mix(DEEP, GOLD, 0.62 + 0.38 * Math.sin(r * 1700) * Math.sin(r * 230));
};

export default {
  name: 'record',
  scale: 1.2,
  cell: 0.0032,
  budget: 52000,
  refine: 0.4,
  cells: { label: 0.0016 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.26, metalness: 0.85, emissive: '#6a4600', emissiveIntensity: 0.65, clearcoat: 0.6, clearcoatRoughness: 0.1 },
    label: { roughness: 0.55 },
  },
  sculpt(s) {
    // The disc: turned from its profile, round the z axis.
    s.shape((p) => {
      const r = Math.hypot(p[0] - C[0], p[1] - C[1]), z = Math.abs(p[2] - C[2]);
      const dr = r - R + 0.003, dz = z - half(Math.min(r, R)) + 0.003;
      return Math.min(Math.max(dr, dz), 0) + Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) - 0.003;
    }, [[-R, C[1] - R, -0.007], [R, C[1] + R, 0.007]], { color: grooves, mat: 'gold', k: 0 });
    s.cylinder(C, HOLE, 0.02, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });

    s.part('label', () => {
      // The label on each face, the hole through it all.
      s.cylinder(C, LABEL, 0.0058, { color: '#c8182a', mat: 'label', k: 0, round: 0.0012, rot: [Math.PI / 2, 0, 0] });
      s.cylinder(C, HOLE, 0.02, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });
      for (const side of [1, -1]) {
        const right = [side, 0, 0], at = (y) => [C[0], C[1] + y, C[2] + side * 0.004];
        letters(s, 'GOLD', { at: at(0.016), right, size: 0.018, width: 0.0022, color: '#f6d470', depth: 0.004, spacing: 0.3 });
        letters(s, 'SIDE A', { at: at(-0.03), right, size: 0.008, width: 0.0011, color: '#f8e8d0', depth: 0.004, spacing: 0.32 });
        // A gold ring printed round the label's edge.
        s.paint((p) => {
          if ((p[2] - C[2]) * side < 0.004) return 0.01;
          return Math.abs(Math.hypot(p[0] - C[0], p[1] - C[1]) - (LABEL - 0.005)) - 0.0012;
        }, '#f6d470', 0.0006);
      }
    });
  },
};
