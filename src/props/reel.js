import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A golden reel: a film reel in gold, two flanges with six round windows
 * in each and a rolled rim, a hub between them with a square spindle hole;
 * the film wound thick on the hub between the flanges, the turns of it
 * showing through the windows; and a length of it run off the bottom and
 * out along the floor, the sprocket holes down both its edges and the
 * frames between. Stands upright facing +z, about 0.45 tiles across; the
 * game floats and turns it, so both faces are the same.
 */

const C = [0, 0.26, 0], R = 0.2, GAP = 0.021, PLATE = 0.0035;   // the flanges stand GAP either side of the middle
const HUB = 0.036, PACK = 0.152, FILM = 0.0165;                  // the film: wound from the hub out to PACK, FILM either side of the middle

const GOLD = rgb('#f2c454'), GOLD_DEEP = rgb('#a87820');
const gold = (p) => mix(GOLD_DEEP, GOLD, 0.7 + 0.3 * noise(p[0] * 160, p[1] * 160, p[2] * 160));
const BASE = rgb('#2a1608'), AMBER = rgb('#8a5a24'), CLEAR = rgb('#c89a5a');
/** The wound film from the side: ring on ring of it. */
const wound = (p) => {
  const r = Math.hypot(p[0] - C[0], p[1] - C[1]);
  return mix(BASE, AMBER, 0.35 + 0.3 * Math.sin(r * 2600) * Math.sin(r * 310) + 0.2 * noise(r * 900, 0, 0));
};

export default {
  name: 'reel',
  scale: 1.2,
  cell: 0.0042,
  budget: 72000,
  refine: 0.4,
  cells: { film: 0.0036, strip: 0.0022 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.24, metalness: 0.85, emissive: '#5a3c00', emissiveIntensity: 0.6, clearcoat: 0.5, clearcoatRoughness: 0.1 },
    film: { roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.08 },
  },
  sculpt(s) {
    const G = { color: gold, mat: 'gold' };
    const flat = [Math.PI / 2, 0, 0];
    // The flanges: thin discs with a rolled rim, either side of the film. And the hub between them.
    for (const z of [-GAP, GAP]) {
      s.cylinder([C[0], C[1], z], R - 0.004, PLATE, { ...G, k: 0, rot: flat, round: 0.0015 });
      s.torus([C[0], C[1], z], R - 0.004, 0.0055, { ...G, k: 0.002, rot: flat });
    }
    s.cylinder(C, HUB, GAP, { ...G, k: 0.002, rot: flat });
    // Six windows through both flanges, a ring of raised lip round the hub, the square spindle hole and its keyway.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      s.cylinder([C[0] + Math.cos(a) * 0.112, C[1] + Math.sin(a) * 0.112, 0], 0.044, GAP + 0.02, { op: 'sub', rot: flat, k: 0.002 });
    }
    for (const z of [-1, 1]) s.torus([C[0], C[1], z * (GAP + PLATE)], 0.048, 0.003, { ...G, k: 0.002, rot: flat });
    s.box(C, [0.0085, 0.0085, GAP + 0.02], 0.0015, { op: 'sub', k: 0 });
    s.box([C[0], C[1] + 0.011, 0], [0.0025, 0.004, GAP + 0.02], 0.001, { op: 'sub', k: 0 });

    // The film wound on the hub: dark on its face, the turns showing on its sides.
    s.part('film', () => {
      s.shape((p) => {
        const r = Math.hypot(p[0] - C[0], p[1] - C[1]), z = Math.abs(p[2] - C[2]);
        const dr = Math.max(r - PACK, HUB - r) + 0.0015, dz = z - FILM + 0.0015;
        return Math.min(Math.max(dr, dz), 0) + Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) - 0.0015;
      }, [[-PACK, C[1] - PACK, -FILM], [PACK, C[1] + PACK, FILM]], { color: (p) => (Math.abs(p[2] - C[2]) > FILM - 0.002 ? wound(p) : mix(BASE, AMBER, 0.25)), mat: 'film', k: 0 });
    });

    // The strip run off the bottom: out between the flanges, down to the floor and along it, curling up at its end.
    s.part('strip', () => {
      const path = [[0.062, 0.121], [0.1, 0.094], [0.14, 0.064], [0.18, 0.036], [0.215, 0.016], [0.25, 0.006], [0.29, 0.0032], [0.33, 0.0032], [0.365, 0.0045], [0.392, 0.012], [0.41, 0.026], [0.418, 0.042]];
      let s0 = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
        const start = s0;
        // Along it: frames between the sprocket holes, and the holes down both edges.
        const color = (p) => {
          const along = start + (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1], z = Math.abs(p[2] - C[2]);
          if (z > FILM * 0.72) {
            const f = (((along / 0.0095) % 1) + 1) % 1;
            return f > 0.3 && f < 0.7 && z < FILM * 0.92 ? rgb('#0c0604') : AMBER;
          }
          const f = (((along / 0.019) % 1) + 1) % 1;
          if (f < 0.08) return BASE;
          // A picture in each frame: a blur of something lit.
          return mix(CLEAR, mix(AMBER, rgb('#f0d8a0'), noise(along * 120, z * 120, 1)), 0.6);
        };
        s.shape((p) => {
          const q = [p[0] - a[0], p[1] - a[1]];
          const along = q[0] * u[0] + q[1] * u[1], across = q[0] * -u[1] + q[1] * u[0];
          const dl = Math.max(-along - 0.001, along - L - 0.001), dz = Math.abs(p[2] - C[2]) - FILM, dn = Math.abs(across) - 0.0021;
          return Math.min(Math.max(dl, dz, dn), 0) + Math.hypot(Math.max(dl, 0), Math.max(dz, 0), Math.max(dn, 0));
        }, [[Math.min(a[0], b[0]) - 0.006, Math.min(a[1], b[1]) - 0.006, -FILM - 0.002], [Math.max(a[0], b[0]) + 0.006, Math.max(a[1], b[1]) + 0.006, FILM + 0.002]], { color, mat: 'film', k: 0.0015 });
        s0 += L;
      }
    });
  },
};
