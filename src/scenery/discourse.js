import { grainy } from '../models/skins.js';

/**
 * What there is to find in the discourse, sculpted the same way as the rest
 * (see `street.js`): the whetstone stand (Metroll's whetstone on a bench,
 * where the spikes get sharpened back and the ball is put back after a
 * blunting), the likes there are to collect, the golden GPUs the whole game
 * is about, and a cookie banner.
 */

const GLOW = (hex, k = 2) => ({ roughness: 0.3, emissive: hex, emissiveIntensity: k });

/** A bench with a whetstone on it, wet and dark where the oil is, and a few bright filings. */
export const whetstone = {
  name: 'whetstone', cell: 0.02,
  materials: { stone: { roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 }, wood: { roughness: 0.75 }, steel: { roughness: 0.18, metalness: 1 }, spark: GLOW('#ffb050', 1.8) },
  colliders: [{ box: [-0.22, 0, -0.17, 0.22, 1.25, 0.17] }],
  lights: [[0, 1.0, 0.2, '#ffc880', 2.4]],
  sculpt(s) {
    const stone = grainy('#8a8f98', 0.18, 12), oil = grainy('#4c525c', 0.14, 12);
    // The bench: a thick top on four legs.
    s.box([0, 0.62, 0], [0.22, 0.05, 0.16], 0.02, { color: '#6a4524', mat: 'wood', k: 0.01 });
    s.mirror((m) => s.box([m * 0.17, 0.3, 0], [0.03, 0.3, 0.12], 0.01, { color: '#5a3a1e', mat: 'wood', k: 0.006 }));
    // The stone, long and flat, dark with oil where the blade has been, a groove worn in it.
    s.box([0, 0.73, 0], [0.18, 0.06, 0.1], 0.02, { color: stone, mat: 'stone', k: 0.01 });
    s.paint((p) => Math.max(Math.abs(p[0] + 0.02) - 0.13, Math.abs(p[2]) - 0.06, 0.74 - p[1]), oil, 0.01);
    s.ellipsoid([-0.02, 0.8, 0], [0.11, 0.015, 0.025], { op: 'sub', k: 0.01 });
    // Filings.
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399963, r = 0.05 + 0.09 * ((i * 0.37) % 1);
      s.sphere([Math.cos(a) * r, 0.8, Math.sin(a) * r * 0.4], 0.012, { color: '#ffd8a0', mat: 'spark', k: 0.004 });
    }
    // A sign on a post: SHARPEN.
    s.limb([0.17, 0.66, -0.12], [0.17, 1.2, -0.12], 0.02, 0.02, { color: '#5a3a1e', mat: 'wood', k: 0.01 });
    s.box([0.1, 1.18, -0.12], [0.12, 0.09, 0.012], 0.01, { color: '#d8402e', mat: 'steel', k: 0.004 });
  },
};

/** A like: a small red heart, flat to the ground. */
export const like = {
  name: 'like', cell: 0.009,
  materials: { heart: { roughness: 0.3, clearcoat: 0.8, emissive: '#600814', emissiveIntensity: 0.5 } },
  sculpt(s) {
    const red = '#f0284a';
    s.sphere([-0.018, 0, 0.012], 0.024, { color: red, mat: 'heart', k: 0.012 });
    s.sphere([0.018, 0, 0.012], 0.024, { color: red, mat: 'heart', k: 0.012 });
    s.cone([0, 0, -0.022], 0.04, 0.05, { color: red, mat: 'heart', k: 0.012, rot: [Math.PI / 2, 0, 0] });
  },
};

/** A golden GPU: a card with a fan, a heatsink shroud and a row of gold contacts. What the whole game is about. */
export const gpu = {
  name: 'gpu', cell: 0.011,
  materials: { gold: { roughness: 0.16, metalness: 1, clearcoat: 1, emissive: '#7a4a08', emissiveIntensity: 0.6 }, board: { roughness: 0.4, metalness: 0.6 }, fan: { roughness: 0.3, metalness: 0.9 } },
  sculpt(s) {
    // The card standing on its end, so it can be seen spinning.
    s.box([0, 0.16, 0], [0.2, 0.15, 0.02], 0.01, { color: '#f0c040', mat: 'gold', k: 0.008 });
    s.box([0, 0.18, 0.03], [0.19, 0.13, 0.014], 0.01, { color: '#c8982c', mat: 'board', k: 0.006 });
    s.mirror((m) => {
      s.cylinder([m * 0.09, 0.18, 0.048], 0.062, 0.006, { color: '#fff0b0', mat: 'fan', k: 0.004, rot: [Math.PI / 2, 0, 0] });
      s.sphere([m * 0.09, 0.18, 0.058], 0.016, { color: '#f0c040', mat: 'gold', k: 0.006 });
    });
    for (let i = 0; i < 9; i++) s.box([-0.16 + i * 0.04, 0.0, 0], [0.012, 0.025, 0.012], 0.003, { color: '#fff0b0', mat: 'gold', k: 0.002 });
  },
};

export const DISCOURSE = { whetstone, like, gpu };
