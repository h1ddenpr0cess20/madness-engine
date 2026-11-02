import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters, plate } from '../models/lettering.js';

/**
 * A snow globe: a souvenir, three hide at every stop. A turned base of dark
 * polished wood, moulded top and bottom, with a gold band and a little
 * brass plate on the front that says ON TOUR; on it a dome of water-clear
 * glass (the marble's glass), and inside a snowy hill with a stone tower
 * on it — battlements, a window lit, a red roof and a flag — two small
 * firs beside it, and the snow coming down round them all. Stands upright,
 * about 0.4 tiles tall; the game floats and turns it.
 */

const DOME = [0, 0.205, 0], DR = 0.112;
const WOOD = rgb('#4a2614'), WOOD_DARK = rgb('#26120a'), WOOD_PALE = rgb('#6e3a1e');
/** Polished wood, the grain running round the base in rings with streaks through them. */
const wood = (p) => {
  const r = Math.hypot(p[0], p[2]);
  const ring = 0.5 + 0.5 * Math.sin(r * 260 + noise(p[0] * 30, p[1] * 30, p[2] * 30) * 6);
  const streak = noise(p[0] * 12, p[1] * 160, p[2] * 12);
  return mix(mix(WOOD_DARK, WOOD, 0.4 + 0.6 * ring), WOOD_PALE, Math.max(0, streak - 0.55) * 1.6);
};
const GOLD = rgb('#f0c050'), GOLD_DARK = rgb('#a87a20');
const gold = (p) => mix(GOLD_DARK, GOLD, 0.7 + 0.3 * noise(p[0] * 300, p[1] * 300, p[2] * 300));
const STONE = rgb('#ece2c8'), MORTAR = rgb('#b8aa90');
/** Coursed stone: rows of blocks, each row offset half a block. */
const stone = (p) => {
  const row = Math.floor(p[1] / 0.008), a = Math.atan2(p[0], p[2]) * 0.019 / 0.009 + (row % 2) * 0.5;
  const fy = (p[1] / 0.008) % 1, fx = ((a % 1) + 1) % 1;
  const joint = Math.min(fy, 1 - fy, fx * 1.4, (1 - fx) * 1.4) < 0.1;
  return joint ? MORTAR : mix(STONE, rgb('#c0b090'), noise(row * 3.1, Math.floor(a) * 1.7, 0.5));
};
const snow = (p, n) => mix(rgb('#c8d4e8'), rgb('#ffffff'), 0.6 + 0.4 * Math.max(0, n[1]));

export default {
  name: 'globe',
  scale: 1.25,
  cell: 0.0052,
  budget: 56000,
  cells: { glass: 0.0062, gold: 0.003, hill: 0.0032, fine: 0.0019, plate: 0.0012 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    wood: { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 },
    gold: { roughness: 0.22, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.5 },
    snow: { roughness: 0.75, emissive: '#c8d8ff', emissiveIntensity: 0.18 },
    stone: { roughness: 0.7 },
    roof: { roughness: 0.45, clearcoat: 0.4 },
    fir: { roughness: 0.8 },
    lamp: { roughness: 0.4, emissive: '#ffb040', emissiveIntensity: 2 },
    glass: { roughness: 0.02, transmission: 1, thickness: 0.05, ior: 1.25, attenuationColor: '#e8f4ff', attenuationDistance: 1.2, clearcoat: 0.6, clearcoatRoughness: 0.02 },
  },
  sculpt(s) {
    // The base, turned: a broad foot, a cove, a body that leans in, a bead at its top, and a gold collar for the glass.
    const Wd = { color: wood, mat: 'wood' };
    s.cylinder([0, 0.012, 0], 0.132, 0.012, { ...Wd, k: 0, round: 0.006 });
    s.torus([0, 0.026, 0], 0.122, 0.006, { ...Wd, k: 0.003 });
    s.shape((p) => {
      // A frustum, r 0.124 at y 0.03 to r 0.106 at y 0.082.
      const y = p[1], r = Math.hypot(p[0], p[2]);
      const t = Math.min(1, Math.max(0, (y - 0.03) / 0.052)), R = 0.124 - 0.018 * t;
      const dr = (r - R) * 0.95, dy = Math.max(0.03 - y, y - 0.082);
      return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) - 0.002;
    }, [[-0.13, 0.026, -0.13], [0.13, 0.086, 0.13]], { ...Wd, k: 0.004 });
    s.torus([0, 0.084, 0], 0.104, 0.0065, { ...Wd, k: 0.003 });
    s.cylinder([0, 0.094, 0], 0.096, 0.008, { ...Wd, k: 0.003, round: 0.004 });

    // The gold: a band round the base and the collar the glass sits in, meshed apart so their edges are clean.
    const G = { color: gold, mat: 'gold' };
    s.part('gold', () => {
      s.torus([0, 0.05, 0], 0.1205, 0.0042, { ...G, k: 0.001 });
      s.torus([0, 0.105, 0], 0.084, 0.0068, { ...G, k: 0.002 });
      s.torus([0, 0.111, 0], 0.085, 0.004, { ...G, k: 0.001 });
    });

    s.part('plate', () => {
      // The brass plate on the front, and what it says.
      const n = [0, 0.032, 0.9995], c = [0, 0.058, 0.1175];
      s.box(c, [0.034, 0.011, 0.0018], 0.0018, { ...G, k: 0.0006, rot: [-0.34, 0, 0] });
      for (const x of [-0.029, 0.029]) s.sphere([x, c[1], c[2] + 0.0018], 0.0018, { ...G, k: 0.0004 });
      const up = [0, Math.cos(0.34), -Math.sin(0.34)];
      plate(s, '#1c1208', { at: [0, c[1], c[2] + 0.0005], up, size: [0.025, 0.0075], round: 0.002, depth: 0.004 });
      letters(s, 'ON TOUR', { at: [0, c[1] - 0.0034, c[2] + 0.0004], up, size: 0.0068, width: 0.00075, color: '#f8d878', depth: 0.004, spacing: 0.34, aspect: 0.62 });
      void n;
    });

    s.part('hill', () => {
      // The hill, snow over it, deep enough to bury the foot of everything on it, and all of it inside the glass.
      const inside = (p) => Math.hypot(p[0] - DOME[0], p[1] - DOME[1], p[2] - DOME[2]) - (DR - 0.003);
      const hill = (c, r) => (p) => {
        const q = [(p[0] - c[0]) / r[0], (p[1] - c[1]) / r[1], (p[2] - c[2]) / r[2]];
        return Math.max((Math.hypot(...q) - 1) * Math.min(...r), inside(p));
      };
      s.shape(hill([0, 0.11, 0], [0.1, 0.03, 0.1]), [[-0.1, 0.08, -0.1], [0.1, 0.14, 0.1]], { color: snow, mat: 'snow', k: 0, bump: [0.0012, 80] });
      s.shape(hill([-0.02, 0.124, -0.02], [0.05, 0.026, 0.045]), [[-0.07, 0.098, -0.065], [0.03, 0.15, 0.025]], { color: snow, mat: 'snow', k: 0.02, bump: [0.0012, 80] });
    });

    s.part('fine', () => {
      // The tower: round, coursed stone, battlements, a slit window lit from inside, a red cone of a roof, a flag.
      const T = [0.008, 0.13, -0.006];
      s.cylinder([T[0], T[1] + 0.035, T[2]], 0.019, 0.04, { color: stone, mat: 'stone', k: 0.004 });
      s.cylinder([T[0], T[1] + 0.077, T[2]], 0.022, 0.006, { color: stone, mat: 'stone', k: 0.002, round: 0.001 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s.box([T[0] + Math.sin(a) * 0.02, T[1] + 0.086, T[2] + Math.cos(a) * 0.02], [0.004, 0.004, 0.003], 0.0008, { color: stone, mat: 'stone', k: 0.001, rot: [0, a, 0] });
      }
      s.box([T[0], T[1] + 0.05, T[2] + 0.018], [0.0035, 0.008, 0.004], 0.0025, { color: '#ffc860', mat: 'lamp', k: 0.0005 });
      s.box([T[0], T[1] + 0.022, T[2] + 0.018], [0.006, 0.01, 0.004], 0.005, { color: '#3a2010', mat: 'roof', k: 0.0005 });
      s.cone([T[0], T[1] + 0.13, T[2]], 0.024, 0.045, { color: '#b81c2c', mat: 'roof', k: 0.002 });
      s.limb([T[0], T[1] + 0.128, T[2]], [T[0], T[1] + 0.152, T[2]], 0.001, 0.001, { color: '#3a3a3a', mat: 'stone', k: 0 });
      s.flake([T[0], T[1] + 0.147, T[2]], [T[0] + 0.016, T[1] + 0.144, T[2] + 0.004], [0, 0, 1], 0.004, 0.0035, 0.25, { color: '#f0c040', mat: 'roof', k: 0.0004 });
      // Snow on the roof's foot and the battlements.
      s.torus([T[0], T[1] + 0.088, T[2]], 0.017, 0.003, { color: snow, mat: 'snow', k: 0.002 });
      // Two firs, tiers of dark green with snow on each.
      for (const [x, z, h] of [[-0.046, 0.04, 0.05], [0.05, 0.036, 0.04]]) {
        const y0 = 0.13 - (x < 0 ? 0.004 : 0.008);
        s.limb([x, y0 - 0.01, z], [x, y0 + 0.012, z], 0.003, 0.003, { color: '#4a2a14', mat: 'fir', k: 0.001 });
        for (let t = 0; t < 3; t++) {
          const r = 0.016 * (1 - t * 0.25) * (h / 0.05), y = y0 + 0.008 + t * h * 0.24;
          s.cone([x, y + r * 1.3, z], r, r * 1.3, { color: '#1e4a2a', mat: 'fir', k: 0.002 });
          s.cone([x, y + r * 1.3 + 0.001, z], r * 0.55, r * 0.7, { color: snow, mat: 'snow', k: 0.002 });
        }
      }
      // The snow coming down: flakes all through the water.
      for (let i = 0; i < 40; i++) {
        const a = i * 2.399963, f = (i * 0.618034) % 1, r = 0.02 + 0.075 * Math.sqrt((i * 0.37) % 1);
        const y = 0.14 + f * 0.15;
        if (Math.hypot(Math.cos(a) * r, y - DOME[1], Math.sin(a) * r) > DR - 0.012) continue;
        s.ellipsoid([Math.cos(a) * r, y, Math.sin(a) * r], [0.0028, 0.0012, 0.0028], { color: '#ffffff', mat: 'snow', k: 0, rot: [i * 0.7, i * 1.3, 0] });
      }
    });

    // The dome: clear glass full of water.
    s.part('glass', () => s.sphere(DOME, DR, { color: '#fbfdff', mat: 'glass', k: 0 }));
  },
};
