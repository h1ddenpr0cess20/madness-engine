import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A roll of gaffer tape: silver cloth tape wound on a card core, a hole
 * clean through the middle, the turns of it showing on each side, and the
 * loose end peeled up off it and curling away. Stands on its edge,
 * facing +z, about 0.3 tiles across. The game floats it and turns it.
 */

const C = [0, 0.17, 0];
const RO = 0.15, RI = 0.088, CORE = 0.08, HALF = 0.048;   // the roll's outside and inside, the core's bore, half its width

const SILVER = rgb('#b4b8c0'), SHADE = rgb('#868a94');
/** Cloth tape: a fine weave under the shine. */
const cloth = (p) => {
  const w = 0.5 + 0.25 * Math.sin(p[0] * 2400) + 0.25 * Math.sin((p[1] + p[2]) * 2400);
  return mix(SHADE, SILVER, 0.7 + 0.2 * w + 0.1 * noise(p[0] * 200, p[1] * 200, p[2] * 200));
};
/** The sides: the edges of the turns, ring after ring. */
const turns = (p) => {
  const r = Math.hypot(p[0] - C[0], p[1] - C[1]);
  return mix(SHADE, SILVER, 0.55 + 0.35 * Math.sin(r * 1500) * Math.sin(r * 410));
};
const card = (p) => mix(rgb('#8a6438'), rgb('#c09868'), 0.5 + 0.5 * noise(p[0] * 120, p[1] * 120, p[2] * 30));

export default {
  name: 'tape',
  scale: 1.2,
  cell: 0.0042,
  budget: 58000,
  refine: 0.2,
  cells: { core: 0.0026, end: 0.002 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    tape: { roughness: 0.5, metalness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4 },
    card: { roughness: 0.92 },
  },
  sculpt(s) {
    // The roll: a thick ring, its faces flat, its corners a little rounded, the outside face cloth.
    s.shape((p) => {
      const r = Math.hypot(p[0] - C[0], p[1] - C[1]), z = Math.abs(p[2] - C[2]);
      const dr = Math.max(r - RO, RI - r) + 0.004, dz = z - HALF + 0.004;
      return Math.min(Math.max(dr, dz), 0) + Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) - 0.004;
    }, [[-RO, C[1] - RO, -HALF], [RO, C[1] + RO, HALF]], { color: (p) => (Math.abs(p[2] - C[2]) > HALF - 0.003 ? turns(p) : cloth(p)), mat: 'tape', k: 0 });

    // The core: a tube of card, a little proud of the tape on each side, open through the middle.
    s.part('core', () => {
      s.shape((p) => {
        const r = Math.hypot(p[0] - C[0], p[1] - C[1]), z = Math.abs(p[2] - C[2]);
        const dr = Math.max(r - (RI + 0.002), CORE - r) + 0.0015, dz = z - (HALF + 0.002) + 0.0015;
        return Math.min(Math.max(dr, dz), 0) + Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) - 0.0015;
      }, [[-RI - 0.004, C[1] - RI - 0.004, -HALF - 0.004], [RI + 0.004, C[1] + RI + 0.004, HALF + 0.004]], { color: card, mat: 'card', k: 0 });
    });

    // The loose end: peeled off the bottom of the roll, curling out and down, its end torn.
    s.part('end', () => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, a = -0.25 - t * 0.85;
        const r = RO + 0.001 + t * t * 0.045;
        pts.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, C[2]]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const tear = i === pts.length - 2 ? 0.003 : 0;
        s.shape((p) => {
          // A strip the width of the roll, thin, along a–b.
          const ab = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...ab), u = [ab[0] / L, ab[1] / L];
          const q = [p[0] - a[0], p[1] - a[1]], along = q[0] * u[0] + q[1] * u[1], across = q[0] * -u[1] + q[1] * u[0];
          const jag = tear * Math.sin(p[2] * 700);
          const dl = Math.max(-along, along - L - jag), dz = Math.abs(p[2] - C[2]) - HALF + 0.001, dn = Math.abs(across) - 0.0022;
          return Math.min(Math.max(dl, dz, dn), 0) + Math.hypot(Math.max(dl, 0), Math.max(dz, 0), Math.max(dn, 0));
        }, [[Math.min(a[0], b[0]) - 0.01, Math.min(a[1], b[1]) - 0.01, -HALF - 0.002], [Math.max(a[0], b[0]) + 0.01, Math.max(a[1], b[1]) + 0.01, HALF + 0.002]], { color: cloth, mat: 'tape', k: 0.001 });
      }
    });
  },
};
