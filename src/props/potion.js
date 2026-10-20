import { noise, rgb } from '../models/sdf.js';
import { grainy, mix } from '../models/skins.js';

/**
 * A healing potion: a round flask of thin glass with red draught glowing
 * inside it, a cork in the neck and a cord tied round under the lip. Sits
 * on the floor, a third of a tile tall.
 */

const GLASS = rgb('#f4e6ea');
const glass = (p) => mix(GLASS, rgb('#c8a8b0'), Math.max(0, 0.06 - p[1]) * 8);
const draught = (p) => mix(rgb('#ff2a40'), rgb('#ff8a70'), Math.max(0, noise(p[0] * 40, p[1] * 40, p[2] * 40) - 0.5));
const cork = grainy('#b08452', 0.25, 90);
const cord = grainy('#8a6a4a', 0.2, 120);

export default {
  name: 'potion',
  scale: 1.15,
  cell: 0.0075,
  budget: 13500,
  cells: { cork: 0.006 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    glass: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, opacity: 0.34 },
    draught: { roughness: 0.2, emissive: '#ff1030', emissiveIntensity: 1.1 },
    cork: { roughness: 0.9 },
  },
  sculpt(s) {
    // Round belly, flat bottom, a neck rising out of its shoulder, and a lip.
    s.sphere([0, 0.105, 0], 0.1, { color: glass, mat: 'glass', k: 0 });
    s.limb([0, 0.17, 0], [0, 0.29, 0], 0.033, 0.03, { color: glass, mat: 'glass', k: 0.035 });
    s.box([0, 0.2, 0], [0.2, 0.19, 0.2], 0, { op: 'inter', k: 0 });
    s.torus([0, 0.29, 0], 0.031, 0.008, { color: glass, mat: 'glass', k: 0.006 });

    // The draught inside, two thirds full.
    s.part('draught', () => {
      s.sphere([0, 0.105, 0], 0.088, { color: draught, mat: 'draught', k: 0 });
      s.box([0, 0.075, 0], [0.12, 0.065, 0.12], 0, { op: 'inter', k: 0.004 });
    });

    s.part('cork', () => {
      s.cylinder([0, 0.31, 0], 0.027, 0.024, { color: cork, mat: 'cork', k: 0, round: 0.006 });
      s.torus([0, 0.262, 0], 0.033, 0.0045, { color: cord, mat: 'cork', k: 0 });
      // The cord's ends, hanging down the side.
      s.limb([0.03, 0.258, 0.012], [0.042, 0.215, 0.026], 0.004, 0.003, { color: cord, mat: 'cork', k: 0.003 });
      s.limb([0.032, 0.258, 0.006], [0.05, 0.225, 0.004], 0.004, 0.003, { color: cord, mat: 'cork', k: 0.003 });
    });
  },
};
