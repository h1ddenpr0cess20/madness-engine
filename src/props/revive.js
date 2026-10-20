import { rgb } from '../models/sdf.js';
import { grainy, mix, smooth } from '../models/skins.js';

/**
 * A revive potion: a tall teardrop of glass full of glowing gold, held in
 * gold — a foot, ribs up its sides, a collar — with a phoenix's wings
 * spreading from the neck and a flame of gold for a stopper. Sits on the
 * floor, nearly half a tile tall.
 */

const glass = () => rgb('#fff4dc');
const elixir = (p) => mix(rgb('#ffc030'), rgb('#fff0a0'), smooth(0.05, 0.2, p[1]));
const gilt = grainy('#eab54a', 0.1, 80);
/** The wings and the flame: gold, going to fire at the tips. */
const fire = (from, to) => (p) => mix(gilt(p), rgb('#ff6a20'), smooth(from, to, Math.hypot(p[0], p[1] - 0.3)) * 0.8);

export default {
  name: 'revive',
  scale: 1.15,
  cell: 0.0088,
  budget: 13500,
  cells: { gilt: 0.006, wings: 0.0055 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    glass: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, opacity: 0.3 },
    elixir: { roughness: 0.2, emissive: '#ffa820', emissiveIntensity: 1.4 },
    gilt: { roughness: 0.28, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.8 },
  },
  sculpt(s) {
    // A tall teardrop body and a narrow neck.
    s.ellipsoid([0, 0.155, 0], [0.072, 0.115, 0.072], { color: glass, mat: 'glass', k: 0 });
    s.limb([0, 0.24, 0], [0, 0.35, 0], 0.03, 0.021, { color: glass, mat: 'glass', k: 0.04 });
    s.box([0, 0.23, 0], [0.2, 0.2, 0.2], 0, { op: 'inter', k: 0 });

    s.part('elixir', () => {
      s.ellipsoid([0, 0.155, 0], [0.062, 0.104, 0.062], { color: elixir, mat: 'elixir', k: 0 });
      s.box([0, 0.12, 0], [0.1, 0.1, 0.1], 0, { op: 'inter', k: 0.004 });
    });

    s.part('gilt', () => {
      const G = { color: gilt, mat: 'gilt', k: 0.004 };
      // A foot to stand on, ribs up the glass to a collar under the neck.
      s.cylinder([0, 0.016, 0], 0.052, 0.016, { ...G, round: 0.007 });
      s.torus([0, 0.034, 0], 0.044, 0.006, G);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.26;
        const pts = [0.045, 0.09, 0.155, 0.22, 0.26].map((y) => {
          const t = (y - 0.155) / 0.116, r = 0.073 * Math.sqrt(Math.max(0, 1 - t * t)) + 0.003;
          return [Math.sin(a) * Math.max(r, 0.03), y, Math.cos(a) * Math.max(r, 0.03)];
        });
        s.chain(pts, [0.0055, 0.005, 0.005, 0.005, 0.005], G);
      }
      s.torus([0, 0.262, 0], 0.031, 0.007, G);
      s.torus([0, 0.348, 0], 0.024, 0.006, G);
    });

    // The phoenix's wings, feather by feather, rising from the collar either side.
    s.part('wings', () => {
      for (const m of [1, -1]) {
        for (let f = 0; f < 5; f++) {
          const a = 0.3 + f * 0.28, len = 0.135 - f * 0.014;
          const from = [m * 0.03, 0.27 + f * 0.004, -0.004];
          const to = [m * (0.03 + Math.cos(a) * len), 0.27 + Math.sin(a) * len * 0.9 + 0.02, -0.012 - f * 0.002];
          s.flake(from, to, [0, 0, 1], 0.019 - f * 0.0018, 0.005, 0.32, { color: fire(0.06, 0.13), mat: 'gilt', k: 0.006 });
        }
      }
      // And the flame on top.
      s.limb([0, 0.36, 0], [0, 0.4, 0], 0.024, 0.013, { color: fire(0.06, 0.13), mat: 'gilt', k: 0.01 });
      s.limb([0, 0.4, 0], [0.006, 0.45, 0], 0.013, 0.002, { color: fire(0.06, 0.13), mat: 'gilt', k: 0.01 });
      s.limb([0, 0.385, 0], [-0.016, 0.425, 0.004], 0.009, 0.0015, { color: fire(0.06, 0.13), mat: 'gilt', k: 0.008 });
      s.limb([0, 0.385, 0], [0.019, 0.418, -0.004], 0.008, 0.0015, { color: fire(0.06, 0.13), mat: 'gilt', k: 0.008 });
    });
  },
};
