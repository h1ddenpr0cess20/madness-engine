import { grainy } from '../models/skins.js';

/**
 * A golden reel: a film reel in gold, its flange pierced with six round
 * windows round a hub, a few turns of film wound on it, and a tail of film
 * curling off. Stands upright facing +z, about 0.45 tiles across; the game
 * floats and turns it, so both faces are the same.
 */

const gold = grainy('#f0be4a', 0.08, 80);

export default {
  name: 'reel',
  scale: 1.2,
  cell: 0.005,
  budget: 13500,
  cells: { fine: 0.003 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.2, metalness: 1, emissive: '#4a3000', emissiveIntensity: 0.9 },
    film: { roughness: 0.35, clearcoat: 0.6 },
  },
  sculpt(s) {
    const c = [0, 0.26, 0];
    const flat = [Math.PI / 2, 0, 0];
    // The flange: a gold disc, its rim rolled.
    s.cylinder(c, 0.2, 0.012, { color: gold, mat: 'gold', rot: flat, k: 0.002, round: 0.006 });
    s.torus(c, 0.195, 0.012, { color: gold, mat: 'gold', rot: flat, k: 0.003 });
    // Six windows round the hub.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      s.cylinder([Math.cos(a) * 0.115, c[1] + Math.sin(a) * 0.115, 0], 0.046, 0.04, { op: 'sub', rot: flat, k: 0.004 });
    }
    // The hub, standing proud, with a square spindle hole.
    s.cylinder(c, 0.04, 0.02, { color: gold, mat: 'gold', rot: flat, k: 0.004 });
    s.box(c, [0.012, 0.012, 0.04], 0.002, { op: 'sub', k: 0.001 });
    // A tail of film, off the bottom of the reel and curling out on the floor.
    s.part('fine', () => {
      s.flake([0.06, c[1] - 0.17, 0], [0.16, 0.02, 0.02], [0, 0, 1], 0.02, 0.018, 0.12, { color: '#2a1a12', mat: 'film', k: 0.002 });
      for (let k = 0; k < 6; k++) s.paint((p) => Math.hypot(p[0] - (0.075 + k * 0.016), p[1] - (c[1] - 0.15 - k * 0.032), 0) - 0.003, '#c8a070', 0.002);
    });
  },
};
