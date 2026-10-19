import { grainy } from '../../../models/skins.js';

/**
 * A roll of gaffer tape: silver cloth tape on a card core, the loose end
 * curling off the front. Stands on its edge, facing +z, about 0.3 tiles
 * across. The game floats it and turns it.
 */

const silver = grainy('#b8bcc4', 0.1, 90);
const core = grainy('#b48a58', 0.12, 50);

export default {
  name: 'tape',
  scale: 1.2,
  cell: 0.0042,
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    tape: { roughness: 0.42, metalness: 0.75 },
    card: { roughness: 0.9 },
  },
  sculpt(s) {
    const c = [0, 0.17, 0];
    const flat = [Math.PI / 2, 0, 0];
    // The roll, a thick ring.
    s.cylinder(c, 0.15, 0.05, { color: silver, mat: 'tape', rot: flat, k: 0.004, round: 0.008 });
    s.cylinder(c, 0.085, 0.07, { op: 'sub', rot: flat, k: 0.004 });
    // The card core, set back a little inside.
    s.part('card', () => s.cylinder(c, 0.088, 0.048, { color: core, mat: 'card', rot: flat, k: 0 }));
    s.cylinder(c, 0.082, 0.07, { op: 'sub', rot: flat, k: 0 });
  },
};
