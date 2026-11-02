import { rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters, plate } from '../models/lettering.js';

/**
 * A backstage pass: a laminated card on a lanyard. On the front, ALL
 * ACCESS in white on a black band with a red star, CREW in big red
 * letters, a barcode and a square of hologram that catches the light; on
 * the back, the small print. A slot punched in the top, a steel ring
 * through it and a swivel clip, and the lanyard going up from that in a
 * V, black with a red line down each edge. It opens the barrier, and the
 * stage door. Stands upright facing +z, about 0.35 tiles tall; the game
 * floats and turns it.
 */

const C = [0, 0.15, 0], W = 0.075, H = 0.105, T = 0.0032;   // the card: middle, half width, half height, half thickness
const HOLE = [0, C[1] + H - 0.014];

export default {
  name: 'pass',
  scale: 1.4,
  cell: 0.0018,
  budget: 50000,
  refine: 0.5,
  cells: { strap: 0.0026, steel: 0.0011, holo: 0.0012 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    card: { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 },
    strap: { roughness: 0.85, sheen: 0.4, sheenColor: '#404048' },
    holo: { roughness: 0.22, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#40305a', emissiveIntensity: 0.4 },
    steel: { roughness: 0.2, metalness: 1 },
  },
  sculpt(s) {
    // The laminate: a card with rounded corners, its slot punched through.
    s.box(C, [W, H, T], 0.008, { color: '#f6f3ec', mat: 'card', k: 0 });
    s.box([HOLE[0], HOLE[1], 0], [0.016, 0.0042, T + 0.01], 0.0042, { op: 'sub', k: 0 });

    const f = T - 0.0006, front = (x, y) => [x, C[1] + y, f], back = (x, y) => [-x, C[1] + y, -f];
    const R = [-1, 0, 0];
    // Front: the black band and ALL ACCESS in it, a red star, CREW, a barcode.
    plate(s, '#121216', { at: front(0, 0.052), size: [W, 0.022], depth: 0.004 });
    letters(s, 'ALL ACCESS', { at: front(0, 0.046), size: 0.013, width: 0.0016, color: '#f6f3ec', depth: 0.004, spacing: 0.26, aspect: 0.6 });
    s.paint((p) => {
      if (p[2] < f - 0.002) return 0.01;
      const u = p[0], v = p[1] - (C[1] + 0.012), a = Math.atan2(u, v), fr = (((a / (Math.PI * 2 / 5)) % 1) + 1) % 1;
      return Math.hypot(u, v) - (0.006 + 0.009 * (1 - Math.abs(fr * 2 - 1)));
    }, '#e01c2a', 0.0006);
    letters(s, 'CREW', { at: front(0, -0.042), size: 0.026, width: 0.0038, color: '#e01c2a', depth: 0.004, spacing: 0.2, aspect: 0.62 });
    for (let i = 0; i < 22; i++) {
      const x = -0.05 + i * 0.0036 + (i % 3) * 0.0006, w = 0.0006 + ((i * 7) % 5) * 0.00035;
      plate(s, '#16161a', { at: front(x - 0.012, -0.078), size: [w, 0.011], depth: 0.004, soft: 0.0003 });
    }
    // Back: the small print, in lines, and a box to sign in.
    letters(s, 'VALID ALL SHOWS', { at: back(0, 0.06), right: R, size: 0.009, width: 0.0011, color: '#16161a', depth: 0.004, spacing: 0.28, aspect: 0.6 });
    for (let i = 0; i < 6; i++) {
      const y = 0.035 - i * 0.012, w = 0.055 - (i === 5 ? 0.025 : (i % 2) * 0.006);
      plate(s, '#8a8a90', { at: back(-0.055 + w, y), right: R, size: [w, 0.0016], depth: 0.004, soft: 0.0004 });
    }
    plate(s, '#16161a', { at: back(0, -0.07), right: R, size: [0.055, 0.016], depth: 0.004, round: 0.003 });
    plate(s, '#f6f3ec', { at: back(0, -0.07), right: R, size: [0.0535, 0.0145], depth: 0.004, round: 0.0025 });

    s.part('holo', () => {
      // The hologram: a square of foil on the front, its colours running with the angle.
      s.box([0.048, C[1] - 0.078, T], [0.014, 0.014, 0.0008], 0.002, {
        color: (p, n) => {
          const t = (p[0] * 60 + p[1] * 40 + n[0] * 2 + n[1] * 3) % 1;
          return mix(mix(rgb('#ff6ad8'), rgb('#6ad8ff'), Math.abs(Math.sin(t * Math.PI * 2))), rgb('#f8f080'), Math.abs(Math.sin(t * 9)) * 0.4);
        }, mat: 'holo', k: 0,
      });
    });

    s.part('steel', () => {
      const S = { color: '#c8ccd4', mat: 'steel', k: 0.0004 };
      // A split ring through the slot, and the swivel clip hanging it from the lanyard's loop.
      s.torus([0, HOLE[1] + 0.006, 0], 0.011, 0.0016, { ...S, rot: [0, Math.PI / 2, Math.PI / 2] });
      s.ellipsoid([0, HOLE[1] + 0.03, 0], [0.0055, 0.012, 0.0035], S);
      s.ellipsoid([0, HOLE[1] + 0.03, 0], [0.0036, 0.009, 0.006], { op: 'sub', k: 0.0005 });
      s.cylinder([0, HOLE[1] + 0.017, 0], 0.0028, 0.003, S);
      s.cylinder([0, HOLE[1] + 0.045, 0], 0.0042, 0.003, S);
      s.torus([0, HOLE[1] + 0.052, 0], 0.0055, 0.0013, { ...S, rot: [Math.PI / 2, 0, 0] });
    });

    s.part('strap', () => {
      // The lanyard: a flat strap up from the clip's loop each side, in a V.
      const top = HOLE[1] + 0.056;
      for (const m of [-1, 1]) {
        const a = [m * 0.006, top, 0], b = [m * 0.075, top + 0.105, -0.008];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L];
        const ang = Math.atan2(-dir[0], dir[1]);
        const across = [Math.cos(ang), Math.sin(ang)];
        s.box([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [0.0105, L / 2, 0.0026], 0.0022, {
          color: (p) => {
            const u = Math.abs((p[0] - (a[0] + b[0]) / 2) * across[0] + (p[1] - (a[1] + b[1]) / 2) * across[1]);
            return u > 0.0065 && u < 0.0085 ? rgb('#d01c28') : rgb('#18181c');
          }, mat: 'strap', k: 0.002, rot: [0, 0, ang],
        });
      }
    });
  },
};
