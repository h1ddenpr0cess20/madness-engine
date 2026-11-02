import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';

/**
 * A lighter, held up and lit: the cheap disposable kind every pocket at the
 * gig has one of. An oval body of glossy red plastic with a flat bottom; a
 * stamped steel hood over the top of it with two cheeks rising either side
 * of the knurled spark wheel; the red gas lever behind the wheel where the
 * thumb comes down; and the flame standing up out of the nozzle, blue at
 * the root and yellow up its length. Stands upright facing +z, about a
 * third of a tile tall; the game floats it and turns it.
 */

const RX = 0.031, RZ = 0.0175;        // the body's oval: across and front to back
const TOP = 0.17;                     // where the plastic ends and the hood begins
const HOOD = 0.197;                   // the hood's top plate
const WHEEL = [0, 0.207, 0.0055];     // the spark wheel's middle (it turns round x)
const NOZZLE = [0, HOOD, -0.004];

const RED = rgb('#d4202c'), DEEP = rgb('#8a0e18');
/** Glossy red, a little deeper toward the bottom, the faint line of the mould down each side. */
const plastic = (p) => {
  let c = mix(DEEP, RED, Math.min(1, 0.55 + p[1] * 4));
  const seam = Math.abs(p[2]) < 0.0009 && Math.abs(p[0]) > RX * 0.8 ? 0.25 : 0;
  return mix(c, DEEP, seam);
};
const STEEL = rgb('#e4e7ec'), STEEL_DARK = rgb('#9a9fa8');
const steel = (p) => mix(STEEL_DARK, STEEL, 0.75 + 0.25 * noise(p[0] * 600, p[1] * 90, p[2] * 600));

/** An oval prism round y from y0 to y1: rx across, rz deep, its edges rounded by `round`. */
function oval(s, y0, y1, rx, rz, o) {
  const round = o.round ?? 0.002, k = rz / rx, h = (y1 - y0) / 2, cy = (y0 + y1) / 2;
  return s.shape((p) => {
    const dx = Math.hypot(p[0] * k, p[2]) - rz + round, dy = Math.abs(p[1] - cy) - h + round;
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - round;
  }, [[-rx, y0, -rz], [rx, y1, rz]], o);
}

export default {
  name: 'lighter',
  scale: 1.5,
  cell: 0.0026,
  budget: 26000,
  refine: 0.6,
  cells: { hood: 0.0012, flame: 0.0024 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    plastic: { roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.12 },
    steel: { roughness: 0.38, metalness: 0.85 },
    lever: { roughness: 0.35, clearcoat: 0.4 },
    flint: { roughness: 0.5, metalness: 0.8 },
    flame: { roughness: 0.6, emissive: '#ff9a30', emissiveIntensity: 2.6 },
  },
  sculpt(s) {
    // The body: a smooth oval, a soft edge round its flat foot, a slight waist where the hood goes on.
    oval(s, 0, TOP + 0.004, RX, RZ, { color: plastic, mat: 'plastic', k: 0.003, round: 0.006 });
    oval(s, TOP - 0.004, TOP + 0.008, RX - 0.0012, RZ - 0.0008, { color: plastic, mat: 'plastic', k: 0.002, round: 0.001 });
    // The foot: a shallow dish in it.
    s.ellipsoid([0, -0.001, 0], [RX * 0.7, 0.003, RZ * 0.6], { op: 'sub', k: 0.002 });

    s.part('hood', () => {
      const S = { color: steel, mat: 'steel', k: 0.0008 };
      // The hood: a stamped band round the top of the body, a lip at its foot, the top plate over it.
      oval(s, TOP, HOOD, RX + 0.0006, RZ + 0.0006, { ...S, round: 0.0012 });
      oval(s, TOP, TOP + 0.0026, RX + 0.0014, RZ + 0.0014, { ...S, round: 0.0011 });
      // Three slots punched in the front of the band, and two up each side.
      for (const x of [-0.012, 0, 0.012]) s.box([x, TOP + 0.014, RZ], [0.0018, 0.0065, 0.004], 0.0015, { op: 'sub', k: 0.0004 });
      // The top: open over the wheel and the lever, the nozzle in its middle.
      s.box([0, HOOD + 0.002, 0.002], [0.0125, 0.004, 0.014], 0.0015, { op: 'sub', k: 0.0006 });
      // The cheeks: the hood's sides drawn up either side of the wheel, rounded over, with the axle through them.
      s.mirror((m) => {
        s.box([m * 0.0148, HOOD + 0.006, 0.0035], [0.0011, 0.0085, 0.0105], 0.0011, S);
        s.cylinder([m * 0.0148, WHEEL[1], WHEEL[2]], 0.0022, 0.0018, { ...S, rot: [0, 0, Math.PI / 2], round: 0.0006 });
      });
      // The nozzle: a short steel stub with a hole.
      s.cylinder([NOZZLE[0], NOZZLE[1] + 0.002, NOZZLE[2]], 0.0022, 0.0035, { ...S, round: 0.0006 });
      s.cylinder([NOZZLE[0], NOZZLE[1] + 0.006, NOZZLE[2]], 0.0009, 0.003, { op: 'sub', k: 0 });
    });

    s.part('wheel', () => {
      // The spark wheel: knurled steel, two smooth rims at its ends, the flint pressing up under it.
      const [cx, cy, cz] = WHEEL, R = 0.0078;
      s.shape((p) => {
        const y = p[1] - cy, z = p[2] - cz, a = Math.atan2(y, z), r = Math.hypot(y, z);
        const knurl = Math.abs(p[0]) < 0.0095 ? 0.0006 * (0.5 + 0.5 * Math.cos(a * 30)) : 0;
        const dr = r - R + knurl, dx = Math.abs(p[0] - cx) - 0.0128;
        return Math.min(Math.max(dr, dx), 0) + Math.hypot(Math.max(dr, 0), Math.max(dx, 0));
      }, [[-0.014, cy - R, cz - R], [0.014, cy + R, cz + R]], { color: '#9aa0aa', mat: 'flint', k: 0 });
      s.mirror((m) => s.cylinder([m * 0.0112, cy, cz], R + 0.0004, 0.0016, { color: steel, mat: 'steel', k: 0, rot: [0, 0, Math.PI / 2], round: 0.0006 }));
    });

    s.part('lever', () => {
      // The gas lever: red plastic, a ridged pad tipping up behind the wheel for the thumb.
      const L = { color: '#c41c28', mat: 'lever', k: 0.001 };
      s.box([0, HOOD + 0.0035, -0.0095], [0.0105, 0.0022, 0.0065], 0.0015, { ...L, rot: [-0.32, 0, 0] });
      for (let i = 0; i < 3; i++) s.box([0, HOOD + 0.0052 + i * 0.0016, -0.0125 + i * 0.0035], [0.0095, 0.0006, 0.0006], 0.0004, { ...L, rot: [-0.32, 0, 0] });
      // Its arm, down through the hood to the valve.
      s.box([0, HOOD + 0.0005, -0.004], [0.006, 0.0018, 0.004], 0.001, L);
    });

    s.part('flame', () => {
      // The flame: a blue root on the nozzle, a bright core, a yellow tongue drawn up to a point.
      const f = (p) => {
        const h = (p[1] - NOZZLE[1]) / 0.07;
        if (h < 0.1) return mix(rgb('#3a64ff'), rgb('#9ab4ff'), h / 0.1);
        return mix(mix(rgb('#fff8d0'), rgb('#ffd040'), Math.min(1, (h - 0.1) * 2)), rgb('#ff7a18'), Math.max(0, h - 0.55) * 2.2);
      };
      const b = [NOZZLE[0], NOZZLE[1] + 0.008, NOZZLE[2] + 0.001];
      s.ellipsoid([b[0], b[1] + 0.012, b[2]], [0.0085, 0.016, 0.0085], { color: f, mat: 'flame', k: 0.01 });
      s.limb([b[0], b[1] + 0.02, b[2]], [b[0], b[1] + 0.068, b[2] - 0.002], 0.0075, 0.0008, { color: f, mat: 'flame', k: 0.012 });
    });
  },
};
