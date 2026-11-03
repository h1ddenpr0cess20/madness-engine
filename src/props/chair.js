import { rgb } from '../models/sdf.js';
import { grainy } from '../models/skins.js';

/**
 * A wooden chair, for a humanoid to sit on (the `sit` clip): a seat at the
 * height that clip lets a person down to, a slatted back, four turned legs
 * and the rails between them. Facing +z, as a person does, still on y = 0,
 * the seat's top 0.14 up and its back to 0.52.
 */

const one = [['root', null, [0, 0, 0]]];

export const chair = {
  name: 'chair',
  cell: 0.006,
  bones: one,
  decor: 0.8,
  materials: { wood: { roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.5 }, pad: { roughness: 0.9, sheen: 0.3, sheenColor: '#d89a8a', sheenRoughness: 0.6 } },
  sculpt(s) {
    const W = { color: grainy('#7a4c2a', 0.15, 30), mat: 'wood' };
    // The seat: a board with a cushion on it.
    s.box([0, 0.118, 0.01], [0.17, 0.0125, 0.17], 0.006, { ...W, k: 0 });
    s.box([0, 0.13, 0.01], [0.155, 0.007, 0.155], 0.007, { color: rgb('#a8483a'), mat: 'pad', k: 0.004 });
    // Legs, a little splayed, and a rail round them.
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const bx = x * 0.15, bz = 0.01 + z * 0.15;
      s.limb([bx, 0.115, bz], [bx * 1.07, 0, bz + z * 0.012], 0.014, 0.011, { ...W, k: 0.006 });
    }
    for (const y of [0.055]) {
      s.box([0, y, 0.16], [0.15, 0.007, 0.007], 0.003, { ...W, k: 0.004 });
      s.box([0, y, -0.14], [0.15, 0.007, 0.007], 0.003, { ...W, k: 0.004 });
      for (const x of [-1, 1]) s.box([x * 0.155, y, 0.01], [0.007, 0.007, 0.15], 0.003, { ...W, k: 0.004 });
    }
    // The back: two posts running on up from the rear legs, a top rail and three slats.
    for (const x of [-1, 1]) s.limb([x * 0.15, 0.115, -0.14], [x * 0.15, 0.52, -0.158], 0.013, 0.011, { ...W, k: 0.006 });
    s.box([0, 0.5, -0.158], [0.16, 0.025, 0.012], 0.008, { ...W, k: 0.006 });
    for (const x of [-0.07, 0, 0.07]) s.box([x, 0.33, -0.15], [0.016, 0.15, 0.007], 0.004, { ...W, k: 0.004 });
  },
};

export default chair;
