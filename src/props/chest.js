import { noise, rgb } from '../models/sdf.js';
import { grainy, mix, smooth } from '../models/skins.js';

/**
 * A treasure chest: oak planks, a rounded lid, two iron bands over it all,
 * iron at every corner, ring handles at the ends and a gold lock plate on
 * the front. Sits on the floor facing +z, half a tile across.
 */

const LID = 0.26;       // where the lid meets the box
const W = 0.24, D = 0.16;
const OAK = rgb('#7c4b27'), DARK = rgb('#3a2110'), PALE = rgb('#a06a3a'), GAP = rgb('#170b05');
const hash = (i) => { const s = Math.sin(i * 91.7 + 13.1) * 43758.5; return s - Math.floor(s); };

/** Planks: across the box they stack up y; over the lid they go round it. Each its own shade, with grain and dark seams. */
const oak = (p) => {
  const u = p[1] > LID + 0.004 ? Math.atan2(p[1] - LID, p[2]) / (Math.PI / 5) : p[1] / 0.0655;
  const i = Math.floor(u), f = u - i;
  const along = Math.abs(p[0]) > W - 0.004 ? p[2] : p[0];
  const grain = noise(along * 9 + i * 7.1, f * 6 + i * 3.3, i * 1.7) * 0.6 + noise(along * 40, f * 30, i) * 0.4;
  let c = mix(DARK, OAK, 0.45 + 0.55 * grain);
  c = mix(c, PALE, hash(i) * 0.35);
  // A knot here and there.
  const knot = noise(along * 14 + 40, f * 3 + i * 5, 2);
  if (knot > 0.78) c = mix(c, DARK, (knot - 0.78) * 3);
  return mix(GAP, c, smooth(0.02, 0.09, Math.min(f, 1 - f)));
};
const ironBase = grainy('#3e3f45', 0.18, 50);
const RUST = rgb('#6b3a1e');
const iron = (p) => mix(ironBase(p), RUST, Math.max(0, noise(p[0] * 30, p[1] * 30, p[2] * 30) - 0.62) * 2.2);
const gold = grainy('#e9b84c', 0.08, 70);

export default {
  name: 'chest',
  scale: 1.15,
  cell: 0.0125,
  budget: 13500,
  cells: { iron: 0.006, gold: 0.0065 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    oak: { roughness: 0.82 },
    iron: { roughness: 0.42, metalness: 0.85 },
    gold: { roughness: 0.28, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.6 },
  },
  sculpt(s) {
    const O = { color: oak, mat: 'oak' };
    // The lid: a half round of planks along the chest. Then the box under it.
    s.cylinder([0, LID, 0], D, W, { ...O, rot: [0, 0, Math.PI / 2], k: 0 });
    s.box([0, LID + 0.1, 0], [0.3, 0.1, 0.3], 0, { op: 'inter', k: 0 });
    s.box([0, LID / 2, 0], [W, LID / 2, D], 0.012, { ...O, k: 0.004 });
    // Where the lid shuts: a dark line all round.
    s.paint((p) => Math.abs(p[1] - LID) - 0.003, '#120804', 0.003);

    // Iron, melted into the wood so nothing of it is hidden inside: two bands
    // over the lid and down the box, a cap on every corner, studs down the bands.
    const I = { color: iron, mat: 'iron', k: 0.002 };
    for (const m of [1, -1]) {
      s.cylinder([m * 0.155, LID, 0], D + 0.011, 0.021, { ...I, rot: [0, 0, Math.PI / 2], round: 0.004 });
      s.box([m * 0.155, LID / 2, 0], [0.021, LID / 2, D + 0.011], 0.004, I);
      for (const y of [0.07, 0.13, 0.19]) s.sphere([m * 0.155, y, D + 0.013], 0.0075, I);
    }
    for (const x of [1, -1]) for (const z of [1, -1]) for (const y of [0.028, LID - 0.03]) {
      s.box([x * (W - 0.016), y, z * (D - 0.016)], [0.026, 0.03, 0.026], 0.008, I);
    }
    // Down to the floor and no further: the bands' round would hang under it.
    s.box([0, 0.3, 0], [0.4, 0.3, 0.4], 0, { op: 'inter', k: 0 });

    s.part('iron', () => {
      // Ring handles at the ends, hanging from a mount.
      for (const m of [1, -1]) {
        s.box([m * (W + 0.004), 0.2, 0], [0.008, 0.022, 0.03], 0.004, I);
        s.torus([m * (W + 0.014), 0.17, 0], 0.036, 0.0075, { ...I, rot: [0, 0, Math.PI / 2] });
      }
    });

    s.part('gold', () => {
      const G = { color: gold, mat: 'gold', k: 0.003 };
      // The lock plate, with a keyhole, and the hasp coming down over it from the lid.
      s.box([0, LID - 0.035, D + 0.006], [0.042, 0.045, 0.008], 0.008, G);
      s.box([0, LID + 0.03, D + 0.004], [0.022, 0.045, 0.007], 0.006, { ...G, rot: [-0.2, 0, 0] });
      s.cylinder([0, LID - 0.03, D + 0.016], 0.009, 0.015, { op: 'sub', k: 0, rot: [Math.PI / 2, 0, 0] });
      s.box([0, LID - 0.048, D + 0.016], [0.0045, 0.016, 0.015], 0, { op: 'sub', k: 0 });
    });
  },
};
