import { cloth, hold, onBody, person, shell, strap } from './person.js';
import { beanie } from './metalwear.js';

/**
 * The Snowboarder: a jacket three sizes too big in lime and purple, the
 * trousers hanging off the backside, a bobble hat, goggles pushed up on
 * it, a scarf over the chin, and the board under one arm, stickered all
 * over. Says "gnarly" without irony. Sits down in the middle of the run.
 * About 0.95 tiles tall.
 */

const JACKET = cloth('#a8e030', '#78a818');
const TROUSERS = cloth('#6a3aa8', '#4a2478');

export default person({
  name: 'snowboarder',
  scale: 1.44,
  b: 1.12,
  shape: { legs: 0.96, girth: 1.14, hips: 1.1 },
  skin: '#e8b898',
  look: { torso: JACKET, sleeve: JACKET, cuff: JACKET, hand: '#2a2a30', legs: TROUSERS, boot: '#2a2a30', sole: '#14141a', boots: true },
  mats: { hand: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a6a3a', brow: '#6a4a2a', blush: 0.8 },
  hair: { color: cloth('#7a5a3a', '#5a3a24'), locks: [[[0.08, 0.68, -0.02], [0.11, 0.58, -0.04], 0.03], [[-0.08, 0.68, -0.02], [-0.11, 0.58, -0.04], 0.03], [[0, 0.66, -0.09], [0, 0.56, -0.1], 0.04]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The board hanging from the right hand by its edge; slouched, nodding to something only he can hear.
      hold(k, 'armR', 0.05, 0, -0.2);
      hold(k, 'foreR', -0.15, 0, 0);
      k.turn('spine', 0.1, 0, 0);
      k.turn('head', Math.max(0, Math.sin(T * 4)) * 0.15, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The bobble hat, its bobble; the goggles pushed up on it; the scarf round the neck, its end hanging.
    beanie(s, { color: '#e8301a', fold: '#f4f2ec' });
    const top = onBody(s, [0, 0.88, -0.01], ['outer']);
    s.part('outer2', () => s.sphere(top.p.map((v, i) => v + top.n[i] * 0.022), 0.03, { color: '#f4f2ec', mat: 'cloth', bone: 'head', k: 0.006, bump: [0.003, 120] }));
    goggles(s, 0.728, '#3ac8e8');
    strap(s, [[0, 0.545, 0.075], [0.055, 0.548, 0.045], [0.07, 0.552, -0.01], [0.045, 0.555, -0.065], [0, 0.556, -0.075], [-0.045, 0.555, -0.065], [-0.07, 0.552, -0.01], [-0.055, 0.548, 0.045], [0, 0.545, 0.075]], { width: 0.03, thick: 0.014, color: '#e8301a', mat: 'cloth', over: ['top', 'head'], part: 'outer2', bone: 'chest', closed: true });
    s.part('outer2', () => s.flake([0.035, 0.54, 0.075], [0.05, 0.43, 0.088], [0.2, 0, 1], 0.017, 0.015, 0.35, { color: '#e8301a', mat: 'cloth', bone: 'chest', k: 0.004 }));
    // The board: long, its waist cut in, both tips turned up, hanging by its edge from the right fist the long way
    // front to back; the bindings on its top facing out, the base to the leg, stickered.
    const G = pose.grip('R'), c = G.c.map((v, i) => v + [-0.004, -0.06, 0][i]), Lh = 0.27;
    const board = (p) => {
      const u = p[2] - c[2], v = p[1] - c[1], w = -(p[0] - c[0]);
      const half = 0.058 - Math.max(0, 1 - (u / Lh) ** 2) * 0.006;
      const tip = Math.max(0, Math.abs(u) - Lh + 0.05);
      const out = Math.hypot(Math.max(Math.abs(u) - Lh + half, 0), Math.max(Math.abs(v) - half + half, 0)) - half;
      return Math.max(Math.max(Math.abs(v) - half, Math.abs(u) - Lh - 0.0) * 0.5 + out * 0.5, Math.abs(w + tip * tip * 6) - 0.0045);
    };
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.shape(board, [[c[0] - 0.03, c[1] - 0.07, c[2] - Lh - 0.02], [c[0] + 0.03, c[1] + 0.07, c[2] + Lh + 0.02]], { color: '#1a1a24', mat: 'plastic', k: 0.002 });
        for (const u of [-0.1, 0.1]) {
          s.box([c[0] - 0.012, c[1], c[2] + u], [0.008, 0.042, 0.022], 0.006, { color: '#2a2a30', mat: 'plastic', k: 0.002 });
          s.box([c[0] - 0.02, c[1], c[2] + u + 0.018], [0.012, 0.036, 0.004], 0.003, { color: '#e8301a', mat: 'plastic', k: 0.001 });
        }
      });
      for (const [dz, col] of [[-0.15, '#ff3a8a'], [0.0, '#f0c020'], [0.14, '#3ac8e8']]) {
        s.paint((p) => Math.max(Math.hypot(p[2] - c[2] - dz, p[1] - c[1]) - 0.026, p[0] - c[0] - 0.0035, c[0] - 0.01 - p[0]), col, 0.002);
      }
    });
  },
});

/** Goggles pushed up on the hat: the strap round it, the frame, the mirrored lens. */
function goggles(s, y, lens) {
  strap(s, [[0, y - 0.004, 0.118], [0.08, y - 0.002, 0.085], [0.12, y, 0.0], [0.085, y + 0.002, -0.085], [0, y + 0.004, -0.12], [-0.085, y + 0.002, -0.085], [-0.12, y, 0.0], [-0.08, y - 0.002, 0.085], [0, y - 0.004, 0.118]], { width: 0.016, thick: 0.004, color: '#1a1a1e', mat: 'rubber', over: ['outer', 'outer2'], part: 'straps', bone: 'head', closed: true });
  shell(s, (p) => Math.max(Math.abs(p[0]) - 0.07, Math.abs(p[1] - y) - 0.019, 0.05 - p[2]), { color: '#1a1a1e', mat: 'rubber', part: 'kit', thick: 0.012, lift: 0.0, over: ['outer', 'outer2', 'straps'], bone: 'head', k: 0.004 });
  shell(s, (p) => Math.max(Math.abs(p[0]) - 0.062, Math.abs(p[1] - y) - 0.014, 0.05 - p[2]), { color: lens, mat: 'glass', part: 'fine', thick: 0.003, lift: 0.0, over: ['kit'], bone: 'head', k: 0.002 });
}
