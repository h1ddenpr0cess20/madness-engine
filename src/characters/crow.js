import { coat } from '../models/skins.js';

/**
 * The Crow: black all the way through, a heavy dark beak, a feather
 * collar blown up in the wind, a grey bloom on the wings, an eye like a
 * drop of oil, and a very good memory. Arrived in Norway ahead of the
 * band and has been on every roof since. Flies at your face on principle.
 * About 0.55 tiles across the wings; a flyer, so its origin is its
 * middle.
 */

const GREY = coat({ over: '#1c1c22', under: '#0e0e12', vary: 0.1, freq: 30 });
const DARK = coat({ over: '#0e0e12', under: '#06060a', vary: 0.1, freq: 30 });
/** The breast: blue where it faces one way, purple the other, as it catches the light. */
const SHEEN = (p, n) => {
  const t = 0.5 + 0.5 * Math.sin(n[0] * 3 + n[2] * 2 + p[1] * 40);
  return [0.06 + t * 0.12, 0.08 + t * 0.06, 0.2 + t * 0.16];
};

export default {
  name: 'crow',
  scale: 1.5,
  cell: 0.0055,
  cells: { kit: 0.004, fine: 0.0025, eyes: 0.0025 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ['head', 'body', [0, 0.06, 0.06]],
    ['wingL', 'body', [0.045, 0.025, 0.02]],
    ['wingR', 'body', [-0.045, 0.025, 0.02]],
    ['tail', 'body', [0, -0.005, -0.07]],
  ],
  materials: {
    feather: { roughness: 0.7, sheen: 0.25, sheenColor: '#3a4a7a' },
    sheen: { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 },
    beak: { roughness: 0.4 },
    eye: { roughness: 0.1, clearcoat: 1 },
    skin: { roughness: 0.6 },
  },
  sculpt(s) {
    const F = { color: GREY, mat: 'feather' };
    // A plump body, the chest out; the neck and its sheen; a small round head.
    s.ellipsoid([0, 0, 0], [0.055, 0.055, 0.08], { ...F, bone: 'body', k: 0.03 });
    s.ellipsoid([0, 0.015, 0.045], [0.048, 0.05, 0.04], { color: SHEEN, mat: 'sheen', bone: 'body', k: 0.03 });
    s.sphere([0, 0.07, 0.07], 0.033, { ...F, bone: 'head', k: 0.025 });
    s.limb([0, 0.068, 0.095], [0, 0.056, 0.135], 0.013, 0.004, { color: '#0a0a0c', mat: 'beak', bone: 'head', k: 0.004 });
    s.part('kit', () => {
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        // A wing: black, with the dark bars and the flight feathers at the end.
        s.flake([m * 0.045, 0.025, 0.02], [m * 0.14, 0.035, -0.02], [0, 1, 0], 0.035, 0.03, 0.25, { ...F, bone: `wing${S}`, k: 0.01 });
        for (const z of [-0.005, -0.025]) s.flake([m * 0.06, 0.04, z], [m * 0.12, 0.045, z - 0.01], [0, 1, 0], 0.008, 0.008, 0.25, { color: DARK, mat: 'feather', bone: `wing${S}`, k: 0.002 });
        for (let i = 0; i < 4; i++) s.flake([m * (0.12 + i * 0.01), 0.035, -0.01 - i * 0.008], [m * (0.24 - i * 0.025), 0.04, -0.03 - i * 0.03], [0, 1, 0], 0.016, 0.01, 0.25, { color: DARK, mat: 'feather', bone: `wing${S}`, k: 0.004 });
      }
      // The tail fanned out.
      for (const x of [-0.02, 0, 0.02]) {
        s.flake([x, -0.005, -0.06], [x * 2.2, -0.015, -0.15], [0, 1, 0], 0.018, 0.016, 0.25, { ...F, bone: 'tail', k: 0.005 });
        s.flake([x * 2.1, -0.014, -0.14], [x * 2.3, -0.016, -0.165], [0, 1, 0], 0.017, 0.016, 0.26, { color: DARK, mat: 'feather', bone: 'tail', k: 0.002 });
      }
      // Black feet, tucked up.
      for (const m of [1, -1]) s.limb([m * 0.02, -0.05, 0.0], [m * 0.022, -0.068, 0.02], 0.006, 0.005, { color: '#16161a', mat: 'skin', bone: 'body', k: 0.004 });
    });
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.026, 0.078, 0.088], 0.008, { color: '#c8c0b0', mat: 'eye', bone: 'head', k: 0 });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) s.sphere([m * 0.03, 0.078, 0.092], 0.004, { color: '#0a0a0c', mat: 'eye', bone: 'head', k: 0 });
    });
  },
  animate(k, { clip, t = 0, time, seed = 0 }) {
    const T = time + seed;
    if (clip === 'ko') {
      // Feathers everywhere: wings out, tipped over.
      k.turn('body', 0.4, 0, 1.4 * Math.min(1, t / 0.5));
      k.turn('head', 0.6, 0, 0);
      return;
    }
    const rate = clip === 'attack' ? 16 : 12;
    const f = Math.sin(T * rate);
    k.turn('wingL', 0, 0, f * 0.85);
    k.turn('wingR', 0, 0, -f * 0.85);
    k.turn('tail', Math.sin(T * rate * 0.5) * 0.1, 0, 0);
    k.move('root', 0, -f * 0.01, 0);
    k.turn('body', clip === 'walk' || clip === 'attack' ? 0.3 : 0.05, 0, Math.sin(T * 1.1) * 0.08);
    // The head: forward and back, forward and back.
    k.move('head', 0, 0, Math.max(0, Math.sin(T * 6)) * 0.012);
    k.turn('head', clip === 'attack' ? 0.4 : 0, Math.sin(T * 0.7) * 0.4, 0);
  },
};
