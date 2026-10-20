import { grainy } from '../models/skins.js';

/**
 * The Runaway Drum: a red-sparkle snare that nobody is playing and that is
 * playing itself, hopping about the floor with a drumstick going in each
 * side. About 0.55 tiles across; it only goes round a set loop.
 */

const shell = grainy('#c8222e', 0.1, 120);

export default {
  name: 'drum',
  scale: 1.5,
  cell: 0.0075,
  cells: { fine: 0.0034 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['stickL', 'root', [0.1, 0.24, 0]],
    ['stickR', 'root', [-0.1, 0.24, 0]],
  ],
  materials: {
    shell: { roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 },
    skin: { roughness: 0.55 },
    chrome: { roughness: 0.16, metalness: 1 },
    wood: { roughness: 0.6 },
  },
  sculpt(s) {
    s.cylinder([0, 0.15, 0], 0.24, 0.14, { color: shell, mat: 'shell', k: 0.004, round: 0.01 });
    s.part('fine', () => {
      s.cylinder([0, 0.294, 0], 0.225, 0.006, { color: '#f0ecdc', mat: 'skin', k: 0.002 });
      for (const y of [0.01, 0.29]) s.torus([0, y, 0], 0.242, 0.011, { color: '#d6d9e0', mat: 'chrome', k: 0.002 });
      // Lugs round the shell.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s.box([Math.cos(a) * 0.246, 0.15, Math.sin(a) * 0.246], [0.012, 0.09, 0.012], 0.004, { color: '#d6d9e0', mat: 'chrome', k: 0.002 });
      }
      for (const m of [1, -1]) {
        s.limb([m * 0.1, 0.27, 0], [m * 0.1, 0.52, 0.08], 0.012, 0.016, { color: '#d9b080', mat: 'wood', bone: m > 0 ? 'stickL' : 'stickR', k: 0.002 });
        s.sphere([m * 0.1, 0.52, 0.08], 0.021, { color: '#e8d4b0', mat: 'wood', bone: m > 0 ? 'stickL' : 'stickR', k: 0.002 });
      }
    });
  },
  animate(k, { clip = 'idle', time = 0, seed = 0 }) {
    const T = time + seed;
    const hop = clip === 'walk' ? Math.abs(Math.sin(T * 8)) * 0.07 : Math.abs(Math.sin(T * 3)) * 0.015;
    k.move('root', 0, hop, 0);
    k.turn('root', Math.sin(T * 8) * 0.06, 0, Math.cos(T * 6) * 0.06);
    const rate = clip === 'attack' ? 22 : 12;
    k.turn('stickL', Math.sin(T * rate) * 0.8, 0, 0);
    k.turn('stickR', -Math.sin(T * rate) * 0.8, 0, 0);
    if (clip === 'ko') k.turn('root', 0, 0, 1.3);
  },
};
