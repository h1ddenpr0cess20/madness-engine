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
    // Each stick turns about its butt, held up over the drum by hands nobody sees.
    ['stickL', 'root', [0.09, 0.5, -0.14]],
    ['stickR', 'root', [-0.09, 0.5, -0.14]],
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
      // The sticks: from the butt, up over the back of the drum, down to a bead at the tip that rests on the head.
      for (const m of [1, -1]) {
        const bone = m > 0 ? 'stickL' : 'stickR';
        s.limb([m * 0.09, 0.5, -0.14], [m * 0.065, 0.318, 0.07], 0.0125, 0.0085, { color: '#d9b080', mat: 'wood', bone, k: 0.002 });
        s.ellipsoid([m * 0.064, 0.31, 0.078], [0.011, 0.009, 0.013], { color: '#e8d4b0', mat: 'wood', bone, k: 0.002 });
      }
    });
  },
  animate(k, { clip = 'idle', time = 0, seed = 0 }) {
    const T = time + seed;
    const hop = clip === 'walk' ? Math.abs(Math.sin(T * 8)) * 0.07 : Math.abs(Math.sin(T * 3)) * 0.015;
    k.move('root', 0, hop, 0);
    k.turn('root', Math.sin(T * 8) * 0.06, 0, Math.cos(T * 6) * 0.06);
    // The sticks lift and come down on the head in turn, the tips striking it and bouncing up again.
    const rate = clip === 'attack' ? 22 : 12;
    const lift = (ph) => -Math.pow(Math.max(0, Math.sin(T * rate + ph)), 0.7) * 0.75;
    k.turn('stickL', lift(0), 0, 0);
    k.turn('stickR', lift(Math.PI), 0, 0);
    if (clip === 'ko') k.turn('root', 0, 0, 1.3);
  },
};
