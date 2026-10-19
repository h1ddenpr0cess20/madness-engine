import { coat } from '../models/skins.js';

/**
 * The Pantomime Horse: two men, one horse, no plan. A brown costume with
 * pale patches, a seam round the middle where the two halves meet, a
 * stuffed head on a floppy neck with googly eyes and a yarn mane, a yarn
 * tail; and under it four legs in the costume's trousers that end in two
 * pairs of shoes that do not match. The back half is never quite in step
 * with the front. About 1.1 tiles tall to the ears, and long.
 */

const HIDE = coat({ over: '#8a5a32', under: '#5a3a1e', vary: 0.12, freq: 10 });
const YARN = coat({ over: '#2a1a10', under: '#140a06', vary: 0.2, freq: 40 });
const Y = 0.42;

export default {
  name: 'horse',
  scale: 1.7,
  cell: 0.0085,
  cells: { kit: 0.0045, eyes: 0.003, fine: 0.003 },
  budget: 12000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['front', 'root', [0, Y, 0.02]],
    ['rear', 'root', [0, Y, -0.02]],
    ['neck', 'front', [0, Y + 0.06, 0.24]],
    ['head', 'neck', [0, Y + 0.25, 0.32]],
    ['jaw', 'head', [0, Y + 0.22, 0.38]],
    ['tail', 'rear', [0, Y + 0.06, -0.3]],
    ...[['FL', 0.07, 0.18, 'front'], ['FR', -0.07, 0.18, 'front'], ['BL', 0.07, -0.2, 'rear'], ['BR', -0.07, -0.2, 'rear']].flatMap(([n, x, z, parent]) => [
      [`thigh${n}`, parent, [x, 0.33, z]],
      [`shin${n}`, `thigh${n}`, [x, 0.18, z + 0.005]],
      [`foot${n}`, `shin${n}`, [x, 0.05, z]],
    ]),
  ],
  materials: {
    hide: { roughness: 0.9, sheen: 0.4, sheenColor: '#c08a5a' },
    yarn: { roughness: 0.95, sheen: 0.6, sheenColor: '#5a3a2a' },
    eye: { roughness: 0.1, clearcoat: 1 },
    leather: { roughness: 0.4, clearcoat: 0.3 },
    rubber: { roughness: 0.8 },
    felt: { roughness: 0.95 },
  },
  sculpt(s) {
    const H = { color: HIDE, mat: 'hide' };
    // The body: two halves of a barrel, sagging a bit where they meet.
    s.ellipsoid([0, Y + 0.02, 0.12], [0.15, 0.13, 0.2], { ...H, bone: 'front', k: 0.05 });
    s.ellipsoid([0, Y + 0.02, -0.12], [0.15, 0.13, 0.2], { ...H, bone: 'rear', k: 0.05 });
    s.ellipsoid([0, Y + 0.0, 0], [0.14, 0.11, 0.08], { ...H, bone: 'rear', k: 0.05 });
    // The rump, rounder.
    s.ellipsoid([0, Y + 0.05, -0.24], [0.14, 0.12, 0.1], { ...H, bone: 'rear', k: 0.05 });
    // The neck, up and forward, and the head: a long face, a muzzle, nostrils, ears.
    s.limb([0, Y + 0.08, 0.26], [0, Y + 0.26, 0.34], 0.07, 0.05, { ...H, bone: 'neck', k: 0.04 });
    s.limb([0, Y + 0.28, 0.33], [0, Y + 0.22, 0.48], 0.06, 0.045, { ...H, bone: 'head', k: 0.03 });
    s.ellipsoid([0, Y + 0.21, 0.49], [0.045, 0.035, 0.04], { color: '#c8a888', mat: 'felt', bone: 'jaw', k: 0.02 });
    for (const m of [1, -1]) {
      s.ellipsoid([m * 0.018, Y + 0.225, 0.525], [0.008, 0.01, 0.006], { op: 'sub', k: 0.004 });
      s.flake([m * 0.03, Y + 0.32, 0.33], [m * 0.05, Y + 0.4, 0.3], [0, 0, 1], 0.018, 0.008, 0.35, { ...H, bone: 'head', k: 0.01 });
    }
    // Four legs, in the costume's trousers.
    for (const n of ['FL', 'FR', 'BL', 'BR']) {
      const x = n.endsWith('L') ? 0.07 : -0.07, z = n.startsWith('F') ? 0.18 : -0.2;
      s.limb([x, Y - 0.04, z], [x, 0.18, z + 0.005], 0.05, 0.036, { ...H, bone: `thigh${n}`, k: 0.03 });
      s.limb([x, 0.18, z + 0.005], [x, 0.06, z], 0.034, 0.028, { ...H, bone: `shin${n}`, k: 0.012 });
    }
    s.part('kit', () => {
      // Shoes: the front man in black brogues, the back man in white sneakers.
      for (const n of ['FL', 'FR', 'BL', 'BR']) {
        const x = n.endsWith('L') ? 0.07 : -0.07, z = n.startsWith('F') ? 0.18 : -0.2;
        const front = n.startsWith('F');
        s.ellipsoid([x, 0.03, z + 0.03], [0.032, 0.03, 0.055], { color: front ? '#14100c' : '#f0f0ee', mat: front ? 'leather' : 'rubber', bone: `foot${n}`, k: 0.015 });
        if (!front) s.box([x, 0.006, z + 0.03], [0.032, 0.006, 0.058], 0.005, { color: '#c82a2a', mat: 'rubber', bone: `foot${n}`, k: 0.004 });
      }
      // The seam round the middle: a line of big stitches where the halves are sewn.
      s.torus([0, Y + 0.01, 0], 0.142, 0.007, { color: '#3a2412', mat: 'felt', bone: 'front', k: 0.004, rot: [Math.PI / 2, 0, 0] });
      // Pale patches.
      for (const [x, y, z, r] of [[0.13, Y + 0.05, 0.12, 0.05], [-0.12, Y + 0.08, -0.18, 0.06], [0.11, Y + 0.0, -0.1, 0.04]]) {
        s.ellipsoid([x, y, z], [0.012, r * 0.8, r], { color: '#e8d8c0', mat: 'felt', bone: z > 0 ? 'front' : 'rear', k: 0.01 });
      }
      // The mane, yarn down the back of the neck; the tail, a hank of it.
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const at = [0, Y + 0.12 + t * 0.2, 0.22 + t * 0.12];
        s.flake(at, [i % 2 ? 0.04 : -0.04, at[1] - 0.05, at[2] - 0.05], [0, 1, -1], 0.02, 0.012, 0.4, { color: YARN, mat: 'yarn', bone: i < 3 ? 'neck' : 'head', k: 0.008 });
      }
      s.flake([0, Y + 0.33, 0.35], [0, Y + 0.32, 0.42], [0, 1, 0], 0.02, 0.015, 0.4, { color: YARN, mat: 'yarn', bone: 'head', k: 0.008 });
      for (const m of [-1, 0, 1]) s.flake([0, Y + 0.08, -0.32], [m * 0.04, Y - 0.14, -0.4], [m, 0, -1], 0.025, 0.018, 0.4, { color: YARN, mat: 'yarn', bone: 'tail', k: 0.01 });
    });
    // Googly eyes: big white domes, the pupils off to the side.
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.045, Y + 0.3, 0.4], 0.028, { color: '#f4f4f0', mat: 'eye', bone: 'head', k: 0 });
    });
    s.part('fine', () => {
      s.sphere([0.06, Y + 0.3, 0.418], 0.013, { color: '#08080a', mat: 'eye', bone: 'head', k: 0 });
      s.sphere([-0.053, Y + 0.285, 0.42], 0.013, { color: '#08080a', mat: 'eye', bone: 'head', k: 0 });
    });
  },
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const legs = (n, swing, lift) => {
      k.turn(`thigh${n}`, swing, 0, 0);
      k.turn(`shin${n}`, Math.max(0, lift), 0, 0);
    };
    if (clip === 'ko') {
      // It comes apart: the front half down on its nose, the back half sat down behind.
      const f = Math.min(1, t / 0.6);
      k.move('front', 0, -0.2 * f, 0.08 * f);
      k.turn('front', 0.5 * f, 0, 0.2 * f);
      k.move('rear', 0, -0.22 * f, -0.08 * f);
      k.turn('rear', -0.4 * f, 0, -0.15 * f);
      for (const n of ['FL', 'FR']) legs(n, -1.2 * f, 1.4 * f);
      for (const n of ['BL', 'BR']) legs(n, -1.4 * f, 1.8 * f);
      k.turn('neck', 0.6 * f, 0, 0);
      return;
    }
    if (clip === 'attack') {
      // Rearing: the front half up, the front legs pawing the air; the back half braced.
      const up = Math.sin(Math.min(1, t / 0.7) * Math.PI);
      k.turn('front', -0.5 * up, 0, 0);
      k.move('front', 0, 0.06 * up, -0.03 * up);
      for (const [n, ph] of [['FL', 0], ['FR', 1.5]]) legs(n, -0.9 * up + Math.sin(t * 18 + ph) * 0.3 * up, 1.2 * up);
      k.turn('neck', -0.3 * up, 0, 0);
      k.turn('jaw', 0.2 * up, 0, 0);
      return;
    }
    if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.move('front', 0, 0, -0.05 * h);
      k.move('rear', 0, 0.02 * h, 0.04 * h);
      k.turn('neck', -0.4 * h, 0.3 * h, 0);
      return;
    }
    const walk = clip === 'walk';
    const rate = walk ? 8 * Math.max(0.5, speed) : 0;
    // Front and back are out of step: the back half a beat behind and bumping into the front.
    const pf = T * rate, pb = T * rate * 1.13 + 1.2;
    if (walk) {
      legs('FL', Math.sin(pf) * 0.5, Math.sin(pf) * 0.7);
      legs('FR', -Math.sin(pf) * 0.5, -Math.sin(pf) * 0.7);
      legs('BL', Math.sin(pb) * 0.5, Math.sin(pb) * 0.7);
      legs('BR', -Math.sin(pb) * 0.5, -Math.sin(pb) * 0.7);
      k.move('front', 0, Math.abs(Math.cos(pf)) * 0.015, 0);
      k.move('rear', 0, Math.abs(Math.cos(pb)) * 0.015, Math.max(0, Math.sin(pb - pf)) * 0.02);
      k.turn('rear', 0, Math.sin(pb) * 0.08, 0);
    } else {
      // Shuffling about, the back half shifting from foot to foot, arguing.
      legs('BL', Math.max(0, Math.sin(T * 1.7)) * -0.2, Math.max(0, Math.sin(T * 1.7)) * 0.3);
      legs('BR', Math.max(0, -Math.sin(T * 1.7)) * -0.2, Math.max(0, -Math.sin(T * 1.7)) * 0.3);
      k.turn('rear', 0, Math.sin(T * 0.9) * 0.12, Math.sin(T * 1.7) * 0.03);
      k.move('front', 0, Math.sin(T * 2) * 0.004, 0);
    }
    // The head nodding on its floppy neck, the jaw flapping, the tail going round.
    k.turn('neck', Math.sin(T * 2.3) * 0.15, Math.sin(T * 0.7) * 0.3, Math.sin(T * 1.3) * 0.1);
    k.turn('head', Math.sin(T * 2.3 + 1) * 0.1, 0, 0);
    k.turn('jaw', Math.max(0, Math.sin(T * 5)) * 0.15, 0, 0);
    k.turn('tail', 0.2, Math.sin(T * 4) * 0.5, 0);
  },
};
