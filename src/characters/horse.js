import { coat, mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { band } from './quadruped.js';

/**
 * The Pantomime Horse: two men, one horse, no plan. A brown felt costume
 * with pale patches and a stitched seam round the middle where the two
 * halves meet; a stuffed horse's head on a floppy neck, felt button eyes,
 * cupped felt ears, a pale muzzle, a red bridle and a yarn mane and tail;
 * and under it four legs in the costume's trousers ending in felt hooves,
 * the back pair in white socks. The back half is never quite in step with
 * the front. About 1.1 tiles tall to the ears, and long.
 */

const HIDE = coat({ over: '#8a5a32', under: '#5a3a1e', vary: 0.12, freq: 10 });
const YARN = coat({ over: '#2a1a10', under: '#140a06', vary: 0.2, freq: 40 });
const Y = 0.42;
const FELT = (p, n) => {
  const c = HIDE(p, n);
  // The seam round the middle, stitched.
  const seam = smooth(0.006, 0.003, Math.abs(p[2] + 0.005));
  const stitch = seam * smooth(0.3, 0.6, Math.sin(p[1] * 260) * 0.5 + 0.5);
  return mix(c, rgb('#2a180c'), Math.max(seam * 0.5, stitch * 0.85));
};

export default {
  name: 'horse',
  scale: 1.7,
  cell: 0.0085,
  cells: { kit: 0.0048, eyes: 0.0022, fine: 0.002, ears: 0.003 },
  budget: 60000,
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
    metal: { roughness: 0.3, metalness: 1 },
    felt: { roughness: 0.95 },
  },
  sculpt(s) {
    const H = { color: FELT, mat: 'hide' };
    // The barrel, in its two halves, and the rump.
    s.ellipsoid([0, Y + 0.02, 0.12], [0.15, 0.13, 0.2], { ...H, bone: 'front', k: 0.05 });
    s.ellipsoid([0, Y + 0.02, -0.12], [0.15, 0.13, 0.2], { ...H, bone: 'rear', k: 0.05 });
    s.ellipsoid([0, Y + 0.0, 0], [0.14, 0.11, 0.08], { ...H, bone: 'rear', k: 0.05 });
    s.ellipsoid([0, Y + 0.05, -0.24], [0.14, 0.12, 0.1], { ...H, bone: 'rear', k: 0.05 });
    // The neck, with a crest along its top.
    s.limb([0, Y + 0.08, 0.26], [0, Y + 0.26, 0.34], 0.07, 0.05, { ...H, bone: 'neck', k: 0.04 });
    s.limb([0, Y + 0.13, 0.25], [0, Y + 0.3, 0.32], 0.035, 0.03, { ...H, bone: 'neck', k: 0.04 });
    // The head: a broad brow, the long face narrowing down to the muzzle, flat cheeks, the jaw under them.
    const Hh = { ...H, bone: 'head' };
    s.ellipsoid([0, Y + 0.29, 0.345], [0.052, 0.045, 0.05], { ...Hh, k: 0.03 });
    s.limb([0, Y + 0.285, 0.36], [0, Y + 0.215, 0.475], 0.048, 0.036, { ...Hh, k: 0.03 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.03, Y + 0.245, 0.36], [0.022, 0.04, 0.042], { ...Hh, k: 0.025 });
    s.ellipsoid([0, Y + 0.205, 0.488], [0.042, 0.038, 0.042], { color: '#c8a888', mat: 'felt', bone: 'head', k: 0.025 });
    s.ellipsoid([0, Y + 0.178, 0.47], [0.03, 0.018, 0.035], { color: '#c8a888', mat: 'felt', bone: 'jaw', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.021, Y + 0.218, 0.524], [0.007, 0.011, 0.007], { op: 'sub', k: 0.004, rot: [0, 0, m * 0.4] });
    // The ears: felt, cupped forward, a paler lining inside.
    s.part('ears', () => {
      for (const m of [1, -1]) {
        const base = [m * 0.028, Y + 0.322, 0.33], tip = [m * 0.042, Y + 0.405, 0.322];
        s.flake(base, tip, [0, 0, 1], 0.019, 0.004, 0.4, { ...Hh, k: 0.006 });
        s.flake([base[0], base[1] + 0.01, base[2] + 0.008], [tip[0], tip[1] - 0.01, tip[2] + 0.006], [0, 0, 1], 0.013, 0.003, 0.3, { op: 'sub', k: 0.002 });
        s.paint((p) => Math.max(Math.hypot((p[0] - base[0] - (tip[0] - base[0]) * 0.5) * 2, p[1] - (base[1] + tip[1]) / 2) - 0.035, base[2] + 0.002 - p[2], 0.02 - Math.abs(p[0])), '#e0c8a8', 0.003);
      }
    });
    // The legs, in the costume's trouser legs.
    for (const n of ['FL', 'FR', 'BL', 'BR']) {
      const x = n.endsWith('L') ? 0.07 : -0.07, z = n.startsWith('F') ? 0.18 : -0.2;
      s.limb([x, Y - 0.04, z], [x, 0.18, z + 0.005], 0.05, 0.036, { ...H, bone: `thigh${n}`, k: 0.03 });
      s.limb([x, 0.18, z + 0.005], [x, 0.07, z], 0.034, 0.03, { ...H, bone: `shin${n}`, k: 0.012 });
    }
    s.part('kit', () => {
      for (const n of ['FL', 'FR', 'BL', 'BR']) {
        const x = n.endsWith('L') ? 0.07 : -0.07, z = n.startsWith('F') ? 0.18 : -0.2, bone = `foot${n}`;
        // A felt hoof: wider at the ground, its front sloping back, flat underneath, a cleft up the front; the back pair in white socks.
        s.limb([x, 0.012, z + 0.006], [x, 0.062, z], 0.04, 0.032, { color: '#1e1610', mat: 'felt', bone, k: 0.006 });
        s.box([x, 0.035, z + 0.044], [0.0025, 0.03, 0.006], 0.001, { op: 'sub', k: 0.002 });
        s.box([x, -0.02, z], [0.08, 0.02, 0.08], 0, { op: 'sub', k: 0.001 });
        if (n[0] === 'B') s.limb([x, 0.068, z], [x, 0.1, z], 0.036, 0.035, { color: '#f0eee8', mat: 'felt', bone: `shin${n}`, k: 0.004, bump: [0.0012, 140] });
      }
      // Pale patches sewn on.
      for (const [x, y, z, r] of [[0.13, Y + 0.05, 0.12, 0.05], [-0.12, Y + 0.08, -0.18, 0.06], [0.11, Y + 0.0, -0.1, 0.04]]) {
        s.ellipsoid([x, y, z], [0.012, r * 0.8, r], { color: '#e8d8c0', mat: 'felt', bone: z > 0 ? 'front' : 'rear', k: 0.01 });
      }
      // The mane down the crest of the neck, and the forelock.
      for (let i = 0; i < 9; i++) {
        const t = i / 8, at = [0, Y + 0.15 + t * 0.17, 0.235 + t * 0.09];
        s.flake(at, [i % 2 ? 0.035 : -0.035, at[1] - 0.06, at[2] - 0.035], [0, 1, -1], 0.018, 0.01, 0.4, { color: YARN, mat: 'yarn', bone: i < 5 ? 'neck' : 'head', k: 0.006 });
      }
      s.flake([0, Y + 0.33, 0.34], [0, Y + 0.3, 0.4], [0, 1, 0.4], 0.018, 0.012, 0.4, { color: YARN, mat: 'yarn', bone: 'head', k: 0.006 });
      // The tail: a hank of yarn.
      for (const m of [-1, 0, 1]) s.flake([0, Y + 0.08, -0.32], [m * 0.04, Y - 0.14, -0.4], [m, 0, -1], 0.025, 0.018, 0.4, { color: YARN, mat: 'yarn', bone: 'tail', k: 0.01 });
    });
    // The bridle: a noseband round the face above the muzzle, a browband under the ears, a strap down each cheek between them.
    const strap = { color: '#a82a20', width: 0.012, thick: 0.004, bone: 'head', tag: null };
    band(s, [0, Y + 0.232, 0.45], [0, -0.55, 0.83], { ...strap, count: 30, reach: 0.07 });
    band(s, [0, Y + 0.3, 0.345], [0, 0.35, 0.94], { ...strap, count: 30, reach: 0.08, arc: (d) => d[1] > -0.2 });
    s.part('kit', () => {
      for (const m of [1, -1]) {
        s.flake([m * 0.05, Y + 0.3, 0.35], [m * 0.042, Y + 0.24, 0.44], [m, 0, 0], 0.006, 0.006, 0.33, { color: '#a82a20', mat: 'leather', bone: 'head', k: 0.002 });
        s.torus([m * 0.043, Y + 0.232, 0.447], 0.008, 0.0018, { color: '#c8c8d0', mat: 'metal', bone: 'head', k: 0.001, rot: [0, 0, Math.PI / 2] });
      }
    });
    // Felt button eyes, looking out and forward, stitched on.
    s.part('eyes', () => {
      for (const m of [1, -1]) {
        const d = [m * 0.75, 0.15, 0.64], l = Math.hypot(...d), u = d.map((v) => v / l);
        const c = [m * 0.046, Y + 0.296, 0.385];
        const rot = [Math.acos(u[1]), Math.atan2(u[0], u[2]), 0];
        s.cylinder(c, 0.017, 0.004, { color: '#f4f2ea', mat: 'felt', bone: 'head', k: 0, round: 0.003, rot });
        s.cylinder(c.map((v, i) => v + u[i] * 0.004), 0.009, 0.0025, { color: '#100c0a', mat: 'eye', bone: 'head', k: 0, round: 0.002, rot });
        s.paint((p) => Math.hypot(p[0] - c[0] - u[0] * 0.007 + m * 0.003, p[1] - c[1] - 0.004, p[2] - c[2] - u[2] * 0.007) - 0.0025, '#ffffff', 0.001);
      }
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
