import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Subway Rat: up from the platform at Times Square, grey-brown and
 * glossy, pink ears, a pink nose and a long pink tail, whiskers, and in its
 * jaws a slice of pizza bigger than it is, dragged along by the crust. It
 * will not let go of the slice. It would like yours as well. About 0.25
 * tiles tall, and the slice half a tile long.
 */

const FUR = coat({ over: '#6a6058', under: '#a89a8c', vary: 0.12, freq: 30, grain: 0.1, gfreq: 140 });
const PINK = coat({ over: '#e8a0a0', under: '#d08a8a', vary: 0.08, freq: 30 });
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export default quadruped({
  name: 'rat',
  scale: 1.7,
  hip: 0.065,
  len: 0.07,
  girth: [0.046, 0.045],
  stance: 0.03,
  leg: [0.016, 0.01, 0.009],
  neck: { len: 0.025, rise: 0.35, r: 0.032 },
  head: { r: 0.032, snout: 0.042, sr: 0.016, drop: 0.25 },
  tail: { len: 0.26, rise: 0.05, r: 0.009, tip: 0.003, curl: 0.35 },
  ears: { kind: 'round', size: 1.15 },
  feet: 'claw',
  paint: { body: FUR, tail: PINK, ears: PINK, feet: PINK, nose: '#e07a8a', eye: '#0a0606' },
  mats: { tail: 'hide', ears: 'hide', feet: 'hide' },
  style: { rate: 20, wag: 0.6, lift: 1.1, after(k, { clip }, T) {
    // Sniffing: the nose going, the head up.
    if (clip === 'idle') k.turn('head', -0.15 + Math.sin(T * 14) * 0.03, 0, 0);
  } },
  extras(s, P) {
    s.part('kit', () => {
      // The slice: crust in the jaws, the slice out to one side and its point dragging on the ground behind.
      const crust0 = add(P.S1, [-0.015, -0.02, 0]), crust1 = add(P.S1, [0.13, -0.035, -0.05]);
      const tip = [0.17, 0.006, -0.2];
      s.panel(crust0, crust1, tip, 0.006, { color: '#f0c050', mat: 'food', bone: 'jaw', k: 0.002 });
      s.panel(add(crust0, [0.006, 0.004, -0.008]), add(crust1, [-0.006, 0.004, -0.008]), add(tip, [-0.004, 0.004, 0.012]), 0.004, { color: '#d84a24', mat: 'food', bone: 'jaw', k: 0.003 });
      s.limb(crust0, crust1, 0.011, 0.011, { color: '#c8883a', mat: 'food', bone: 'jaw', k: 0.004 });
      // Pepperoni.
      for (const [u, v] of [[0.3, 0.25], [0.55, 0.3], [0.4, 0.55], [0.2, 0.45]]) {
        const p = [crust0[0] + (crust1[0] - crust0[0]) * u + (tip[0] - crust0[0]) * v * (1 - u), crust0[1] + (tip[1] - crust0[1]) * v + 0.006, crust0[2] + (tip[2] - crust0[2]) * v];
        s.cylinder(p, 0.012, 0.002, { color: '#a82a1a', mat: 'food', bone: 'jaw', k: 0.001, round: 0.001, rot: [0.35, 0, 0] });
      }
    });
    s.part('fine', () => {
      // Whiskers.
      for (const m of [1, -1]) for (const d of [-0.006, 0.004]) s.limb(add(P.S1, [m * 0.012, d, -0.004]), add(P.S1, [m * 0.05, d + 0.008, -0.02]), 0.0012, 0.0006, { color: '#e8e0d8', mat: 'hide', bone: 'head', k: 0 });
    });
  },
});
