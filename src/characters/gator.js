import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Gator: up out of the swamp and onto the boardwalk, long and
 * low and armoured, olive-black above and pale underneath, a double row of
 * scutes down the back and along the tail, the eyes and the nostrils up on
 * top so it can lie in the water with only those showing, and the teeth,
 * all of them, showing even with the mouth shut. Has been around since the
 * dinosaurs, and has outlasted the music. About 0.25 tiles tall and 1.2 long.
 */

const HIDE = coat({ over: '#2e4a22', under: '#c8c088', vary: 0.14, freq: 16, edge: [-0.5, 0.1] });
const TOOTH = { color: '#f0ead8', mat: 'tooth', k: 0.001 };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export default quadruped({
  name: 'gator',
  scale: 1.6,
  hip: 0.07,
  len: 0.2,
  girth: [0.085, 0.05],
  stance: 0.075,
  leg: [0.024, 0.018, 0.016],
  neck: { len: 0.05, rise: 0, r: 0.055 },
  head: { r: 0.05, snout: 0.15, sr: 0.03, drop: 0.03 },
  tail: { len: 0.4, rise: -0.1, r: 0.05, tip: 0.008, curl: 0.04 },
  feet: 'claw',
  sculptHead: false,
  cells: { teeth: 0.0014, highlights: 0.0006 },
  paint: { body: HIDE, feet: HIDE },
  mats: { body: 'scale', legs: 'scale', tail: 'scale', feet: 'scale' },
  style: { gait: 'sprawl', rate: 7, wag: 0.5, after(k, { clip, t }) {
    // The jaws: open wide and slammed shut.
    if (clip === 'attack') k.turn('jaw', 0.45 * Math.max(0, Math.sin(Math.min(1, t / 0.7) * Math.PI * 2)), 0, 0);
    else if (clip === 'idle') k.turn('jaw', 0.06, 0, 0);
  } },
  extras(s, P) {
    const H = { color: HIDE, mat: 'scale' };
    // The head: a flat skull, the long flat snout, the lower jaw on its own bone.
    s.ellipsoid(P.H, [0.055, 0.032, 0.05], { ...H, bone: 'head', k: 0.02 });
    s.flake(P.H, P.S1, [0, 1, 0], 0.048, 0.026, 0.42, { ...H, bone: 'head', k: 0.02 });
    s.flake(add(P.H, [0, -0.026, 0]), add(P.S1, [0, -0.02, -0.01]), [0, 1, 0], 0.044, 0.022, 0.3, { ...H, bone: 'jaw', k: 0.008 });
    // The bumps the eyes sit in, and the nostrils on the end.
    for (const m of [1, -1]) s.sphere(add(P.H, [m * 0.026, 0.028, 0.012]), 0.017, { ...H, bone: 'head', k: 0.012 });
    s.ellipsoid(add(P.S1, [0, 0.016, -0.006]), [0.016, 0.01, 0.014], { ...H, bone: 'head', k: 0.008 });
    // Lumpy all over.
    s.ellipsoid([0, 0.09, 0], [0.07, 0.03, 0.2], { ...H, bone: 'trunk', k: 0.04, bump: [0.003, 70] });
    s.part('kit', () => {
      // A double row of scutes down the back and on along the tail.
      for (let i = 0; i < 9; i++) {
        const z = 0.16 - i * 0.045;
        for (const m of [1, -1]) s.cone([m * 0.026, 0.128, z], 0.009, 0.014, { ...H, bone: z > 0 ? 'front' : 'rear', k: 0.004 });
      }
      for (let i = 1; i < 7; i++) {
        const t = i / 7, p = [0, P.T0[1] + (P.T2[1] - P.T0[1]) * t, P.T0[2] + (P.T2[2] - P.T0[2]) * t];
        const r = 0.05 + (0.008 - 0.05) * t;
        s.cone([0, p[1] + r + 0.008 * (1 - t), p[2]], 0.01 * (1 - t * 0.5), 0.016 * (1 - t * 0.5), { ...H, bone: t < 0.5 ? 'tail' : 'tail2', k: 0.003 });
      }
      // The teeth, the top ones down over the lower jaw, the bottom ones up.
      for (let i = 0; i < 6; i++) {
        const t = 0.15 + i * 0.15, z = P.H[2] + (P.S1[2] - P.H[2]) * t, w = 0.042 - t * 0.018;
        for (const m of [1, -1]) {
          s.part('teeth', () => s.cone([m * w, P.H[1] - 0.026, z], 0.004, 0.012, { ...TOOTH, bone: 'head', rot: [Math.PI, 0, 0] }));
          s.part('teeth', () => s.cone([m * (w - 0.004), P.H[1] - 0.022, z + 0.01], 0.0035, 0.01, { ...TOOTH, bone: 'jaw' }));
        }
      }
    });
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere(add(P.H, [m * 0.03, 0.036, 0.018]), 0.009, { color: '#c8a020', mat: 'eye', bone: 'head', k: 0 });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) s.box(add(P.H, [m * 0.03, 0.036, 0.0265]), [0.0015, 0.007, 0.001], 0.0005, { color: '#0a0a08', mat: 'eye', bone: 'head', k: 0 });
    });
    s.part('highlights', () => {
      for (const m of [1, -1]) s.sphere(add(P.H, [m * 0.027, 0.041, 0.026]), 0.0018, { color: '#ffffff', mat: 'eye', bone: 'head', k: 0 });
    });
  },
});
