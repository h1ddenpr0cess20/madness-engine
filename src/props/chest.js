import { noise, rgb } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

/**
 * A treasure chest: oak planks with the grain in them, a barrel-vaulted lid
 * of staves, two iron bands over it all studded with rivets, an iron
 * bracket on every corner, strap hinges at the back, a ring handle on each
 * end, and on the front a gold lock plate with a keyhole and the hasp
 * coming down over it. Sits on the floor facing +z, half a tile across.
 */

const LID = 0.26;       // where the lid meets the box
const W = 0.24, D = 0.16;
const PLANK = LID / 4, STAVE = Math.PI / 5;
const OAK = rgb('#86522a'), DARK = rgb('#3e2311'), PALE = rgb('#b07a44'), GAP = rgb('#1a0c05');
const hash = (i) => { const s = Math.sin(i * 91.7 + 13.1) * 43758.5; return s - Math.floor(s); };

/** Which plank a point is on, and how far across it: up the box they stack; over the lid they go round it. */
const plankAt = (p) => (p[1] < LID + 0.002 ? p[1] / PLANK : Math.abs(p[0]) > W - 0.005 ? p[2] / (PLANK * 1.2) + 20 : Math.atan2(p[1] - LID, p[2]) / STAVE + 10);
/** Oak: each plank its own shade, the grain running along it, a knot here and there, dark at the seams. */
const oak = (p) => {
  const u = plankAt(p), i = Math.floor(u), f = u - i;
  const along = Math.abs(p[0]) > W - 0.005 ? (p[1] > LID ? p[1] : p[2] * 1.3) : p[0];
  const grain = noise(along * 14 + i * 7.1, f * 9 + i * 3.3, i * 1.7) * 0.5 + noise(along * 60, f * 40 + i, i) * 0.3 + noise(along * 4, f * 70, i * 2.3) * 0.2;
  let c = mix(DARK, OAK, 0.4 + 0.6 * grain);
  c = mix(c, PALE, hash(i) * 0.3);
  const knot = noise(along * 16 + 40, f * 3 + i * 5, 2);
  if (knot > 0.8) c = mix(c, DARK, Math.min(1, (knot - 0.8) * 4));
  return mix(GAP, c, smooth(0.015, 0.07, Math.min(f, 1 - f)));
};
const IRON = rgb('#34353a'), IRON_HI = rgb('#5a5c64'), RUST = rgb('#6e3a1c');
const iron = (p) => {
  let c = mix(IRON, IRON_HI, noise(p[0] * 90, p[1] * 90, p[2] * 90) * 0.7);
  return mix(c, RUST, Math.max(0, noise(p[0] * 30 + 5, p[1] * 30, p[2] * 30) - 0.6) * 2.2);
};
const gold = (p) => mix(rgb('#a8781e'), rgb('#f4c860'), 0.65 + 0.35 * noise(p[0] * 200, p[1] * 200, p[2] * 200));

export default {
  name: 'chest',
  scale: 1.15,
  cell: 0.006,
  budget: 110000,
  refine: 0.5,
  cells: { iron: 0.0034, gold: 0.002 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    oak: { roughness: 0.78 },
    iron: { roughness: 0.48, metalness: 0.85 },
    gold: { roughness: 0.25, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.5 },
  },
  sculpt(s) {
    const O = { color: oak, mat: 'oak', k: 0 };
    // The box, and the lid on it: a half round of staves along the chest.
    s.box([0, LID / 2, 0], [W, LID / 2, D], 0.008, O);
    s.shape((p) => {
      const r = Math.hypot(p[1] - LID, p[2]), dr = r - D, dx = Math.abs(p[0]) - W, dy = LID - p[1];
      const e = Math.max(dr, dy) + 0.006;
      return Math.min(Math.max(e, dx + 0.006), 0) + Math.hypot(Math.max(e, 0), Math.max(dx + 0.006, 0)) - 0.006;
    }, [[-W, LID - 0.01, -D], [W, LID + D, D]], O);
    // The seams cut in: between the planks of the box, and between the staves of the lid.
    for (let i = 1; i < 4; i++) {
      for (const z of [-1, 1]) s.box([0, i * PLANK, z * D], [W + 0.01, 0.0016, 0.003], 0, { op: 'sub', k: 0.001 });
      for (const x of [-1, 1]) s.box([x * W, i * PLANK, 0], [0.003, 0.0016, D + 0.01], 0, { op: 'sub', k: 0.001 });
    }
    for (let k = 1; k < 5; k++) {
      const a = k * STAVE;
      s.box([0, LID + Math.sin(a) * D, Math.cos(a) * D], [W - 0.004, 0.003, 0.0016], 0, { op: 'sub', k: 0.001, rot: [-a, 0, 0] });
    }
    // Where the lid shuts: a gap all round.
    s.box([0, LID, 0], [W + 0.01, 0.0022, D + 0.01], 0, { op: 'sub', k: 0.001 });

    const I = { color: iron, mat: 'iron', k: 0.0008 };
    s.part('iron', () => {
      // Two bands over the lid and down the box, rivets down them.
      for (const m of [1, -1]) {
        const x = m * 0.15;
        s.shape((p) => {
          const r = Math.hypot(p[1] - LID, p[2]), dr = Math.abs(r - D - 0.003) - 0.0035, dx = Math.abs(p[0] - x) - 0.02, dy = LID + 0.004 - p[1];
          const e = Math.max(dr, dx, dy);
          return e;
        }, [[x - 0.025, LID, -D - 0.01], [x + 0.025, LID + D + 0.01, D + 0.01]], I);
        for (const z of [-1, 1]) s.box([x, LID / 2 - 0.002, z * (D + 0.003)], [0.02, LID / 2 - 0.006, 0.0035], 0.002, I);
        s.box([x, LID - 0.003, 0], [0.02, 0.0035, D + 0.0035], 0.002, I);
        for (const y of [0.04, 0.1, 0.16, 0.22]) for (const z of [-1, 1]) s.sphere([x, y, z * (D + 0.0068)], 0.0042, I);
        for (let k = 1; k < 10; k += 2) {
          const a = (k / 10) * Math.PI;
          s.sphere([x, LID + Math.sin(a) * (D + 0.0068), Math.cos(a) * (D + 0.0068)], 0.0042, I);
        }
      }
      // A bracket on every upright corner: a strip down each face, rivets in it; caps on the feet.
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        for (const [y0, y1] of [[0.006, 0.07], [LID - 0.07, LID - 0.006]]) {
          const yc = (y0 + y1) / 2, h = (y1 - y0) / 2;
          s.box([x * (W - 0.012), yc, z * (D + 0.003)], [0.017, h, 0.0035], 0.002, I);
          s.box([x * (W + 0.003), yc, z * (D - 0.012)], [0.0035, h, 0.017], 0.002, I);
          s.sphere([x * (W - 0.016), yc, z * (D + 0.0068)], 0.0036, I);
          s.sphere([x * (W + 0.0068), yc, z * (D - 0.016)], 0.0036, I);
        }
        s.box([x * (W - 0.004), 0.007, z * (D - 0.004)], [0.016, 0.009, 0.016], 0.006, I);
      }
      // A strip along the lid's front edge.
      s.box([0, LID + 0.006, D + 0.0028], [W - 0.03, 0.0055, 0.0032], 0.002, I);
      // Strap hinges at the back, from the lid down over the back of the box.
      for (const x of [-0.075, 0.075]) {
        s.box([x, LID - 0.025, -D - 0.003], [0.011, 0.028, 0.003], 0.003, I);
        s.cylinder([x, LID, -D - 0.006], 0.0065, 0.016, { ...I, rot: [0, 0, Math.PI / 2] });
        s.shape((p) => {
          const r = Math.hypot(p[1] - LID, p[2]), a = Math.atan2(p[1] - LID, -p[2]);
          return Math.max(Math.abs(r - D - 0.0015) - 0.0045, Math.abs(p[0] - x) - 0.011, (a - 0.7) * D, -a * D);
        }, [[x - 0.012, LID - 0.01, -D - 0.01], [x + 0.012, LID + D * 0.7, -D * 0.6]], I);
      }
      // Ring handles at the ends, hanging from a mount.
      for (const m of [1, -1]) {
        s.box([m * (W + 0.004), 0.19, 0], [0.004, 0.018, 0.028], 0.004, I);
        s.cylinder([m * (W + 0.009), 0.19, 0], 0.0055, 0.006, { ...I, rot: [0, 0, Math.PI / 2] });
        s.torus([m * (W + 0.012), 0.158, 0], 0.032, 0.0055, { ...I, rot: [0, 0, Math.PI / 2] });
      }
    });

    s.part('gold', () => {
      const G = { color: gold, mat: 'gold', k: 0.001 };
      // The lock plate: a shield of gold, a keyhole in it, studs round it, and the hasp down over it from the lid.
      const c = [0, LID - 0.04, D + 0.004];
      s.shape((p) => {
        const x = Math.abs(p[0]) - c[0], y = p[1] - c[1];
        const shield = Math.max(x - 0.038, y - 0.034, Math.hypot(x, y + 0.006) - 0.05);
        return Math.max(shield, Math.abs(p[2] - c[2]) - 0.0035) - 0.0015;
      }, [[-0.045, c[1] - 0.06, D - 0.004], [0.045, c[1] + 0.04, D + 0.01]], G);
      s.torus([0, c[1] - 0.004, D + 0.0068], 0.012, 0.0022, { ...G, rot: [Math.PI / 2, 0, 0] });
      s.cylinder([0, c[1] - 0.001, D + 0.008], 0.0055, 0.008, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });
      s.box([0, c[1] - 0.011, D + 0.008], [0.0024, 0.008, 0.008], 0.0008, { op: 'sub', k: 0 });
      for (const [x, y] of [[-0.03, 0.026], [0.03, 0.026], [-0.026, -0.028], [0.026, -0.028]]) s.sphere([x, c[1] + y, D + 0.0065], 0.0032, G);
      s.box([0, LID + 0.022, D + 0.008], [0.014, 0.032, 0.0035], 0.003, { ...G, rot: [-0.08, 0, 0] });
      s.torus([0, LID - 0.006, D + 0.011], 0.009, 0.0026, { ...G, rot: [0, 0, 0] });
    });
  },
};
