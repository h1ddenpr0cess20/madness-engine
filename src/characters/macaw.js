import { coat } from '../models/skins.js';

/**
 * The Macaw: a scarlet macaw off the beach at Copacabana, red all over, a
 * bare white face, a hooked beak that could open a coconut, wings yellow
 * and then blue at the ends, and a long red-and-blue tail. Loud. Steals
 * everybody's chips, and is flying round with one now, sideways in its
 * beak. About 0.55 tiles across the wings; a flyer, so its origin is its
 * middle.
 */

const RED = coat({ over: '#e0202a', under: '#9a1018', vary: 0.12, freq: 30 });
const YELLOW = '#f2c41a';
const BLUE = '#1a5ad8';

export default {
  name: 'macaw',
  scale: 1.5,
  cell: 0.0055,
  cells: { kit: 0.004, fine: 0.0025 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ['head', 'body', [0, 0.06, 0.07]],
    ['beak', 'head', [0, 0.07, 0.12]],
    ['wingL', 'body', [0.045, 0.03, 0.02]],
    ['wingR', 'body', [-0.045, 0.03, 0.02]],
    ['tail', 'body', [0, -0.01, -0.07]],
  ],
  materials: {
    feather: { roughness: 0.7, sheen: 0.5, sheenColor: '#ffd0a0' },
    face: { roughness: 0.6 },
    beak: { roughness: 0.35, clearcoat: 0.5 },
    eye: { roughness: 0.1, clearcoat: 1 },
  },
  sculpt(s) {
    const F = { color: RED, mat: 'feather' };
    // The body, the head, the white face, the beak: the top hooked, the lower on its own bone.
    s.ellipsoid([0, 0, 0], [0.05, 0.055, 0.08], { ...F, bone: 'body', k: 0.03 });
    s.sphere([0, 0.065, 0.075], 0.042, { ...F, bone: 'head', k: 0.03 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.026, 0.06, 0.098], [0.014, 0.02, 0.016], { color: '#f4f0ea', mat: 'face', bone: 'head', k: 0.008 });
    s.limb([0, 0.075, 0.11], [0, 0.04, 0.142], 0.02, 0.006, { color: '#e8e0d0', mat: 'beak', bone: 'head', k: 0.008 });
    s.ellipsoid([0, 0.045, 0.118], [0.014, 0.01, 0.014], { color: '#1a1a1c', mat: 'beak', bone: 'beak', k: 0.004 });
    s.part('kit', () => {
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        // A wing: red at the shoulder, then yellow, then the long blue flight feathers.
        s.flake([m * 0.045, 0.03, 0.02], [m * 0.13, 0.04, -0.01], [0, 1, 0], 0.03, 0.03, 0.25, { ...F, bone: `wing${S}`, k: 0.01 });
        s.flake([m * 0.1, 0.04, 0.0], [m * 0.18, 0.045, -0.03], [0, 1, 0], 0.03, 0.028, 0.22, { color: YELLOW, mat: 'feather', bone: `wing${S}`, k: 0.008 });
        for (let i = 0; i < 4; i++) {
          s.flake([m * (0.15 + i * 0.01), 0.045, -0.02 - i * 0.005], [m * (0.28 - i * 0.03), 0.05, -0.04 - i * 0.03], [0, 1, 0], 0.016, 0.01, 0.25, { color: BLUE, mat: 'feather', bone: `wing${S}`, k: 0.004 });
        }
      }
      // The tail: long, red and blue.
      for (const [x, c] of [[0, RED], [0.015, BLUE], [-0.015, BLUE]]) {
        s.flake([x, -0.01, -0.06], [x * 3, -0.04, -0.24], [0, 1, 0], 0.016, 0.008, 0.25, { color: c, mat: 'feather', bone: 'tail', k: 0.006 });
      }
      // The chip, crosswise in the beak.
      s.box([0.012, 0.042, 0.125], [0.05, 0.008, 0.008], 0.004, { color: '#f0c860', mat: 'face', bone: 'beak', k: 0.002, rot: [0, 0.25, 0.1] });
      // Grey feet, tucked under.
      for (const m of [1, -1]) s.limb([m * 0.02, -0.05, 0.0], [m * 0.02, -0.07, 0.02], 0.006, 0.005, { color: '#6a6a72', mat: 'face', bone: 'body', k: 0.004 });
    });
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.033, 0.07, 0.1], 0.009, { color: '#f2e4a0', mat: 'eye', bone: 'head', k: 0 });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) {
        s.sphere([m * 0.037, 0.07, 0.104], 0.005, { color: '#0a0a0c', mat: 'eye', bone: 'head', k: 0 });
      }
    });
  },
  animate(k, { clip, t = 0, time, seed = 0 }) {
    const T = time + seed;
    if (clip === 'ko') {
      // Winded: wings stuck out, head down, tipped over, still holding the chip.
      k.turn('body', 0.4, 0, 1.4 * Math.min(1, t / 0.5));
      k.turn('head', 0.6, 0, 0);
      k.turn('beak', 0.4, 0, 0);
      return;
    }
    const rate = clip === 'attack' ? 14 : 10;
    const f = Math.sin(T * rate);
    k.turn('wingL', 0, 0, f * 0.8);
    k.turn('wingR', 0, 0, -f * 0.8);
    k.turn('tail', Math.sin(T * rate * 0.5) * 0.1, Math.sin(T * 2) * 0.15, 0);
    k.move('root', 0, -f * 0.01, 0);
    k.turn('body', clip === 'walk' || clip === 'attack' ? 0.25 : 0.05, 0, Math.sin(T * 1.2) * 0.1);
    // The head turning in jerks, the beak going: squawk.
    k.turn('head', Math.sin(T * 3) * 0.1, Math.round(Math.sin(T * 0.8) * 2) * 0.3, 0);
    k.turn('beak', Math.max(0, Math.sin(T * (clip === 'attack' ? 12 : 4))) * 0.5, 0, 0);
  },
};
