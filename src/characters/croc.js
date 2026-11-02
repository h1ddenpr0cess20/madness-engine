import { coat, mix, smooth } from '../models/skins.js';
import { rgb, shingles } from '../models/sdf.js';
import { quadruped } from './quadruped.js';

/**
 * The Saltwater Croc: up out of the harbour and onto the rocks, long and
 * low and armoured, olive-tan above with dark blotches and cream
 * underneath, rows of scutes down the back and a double crest down the
 * tail, the eyes and the nostrils up on top, and the long narrow snout
 * coming to a point, its teeth interlocking — the bottom ones showing
 * outside the top even with the mouth shut. Has been around since the
 * dinosaurs. About 0.25 tiles tall and 1.2 long.
 */

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Scaly hide: the colour of `base`, every scale's edge dark. */
export function scaly(base, size = 0.013) {
  const cell = { height: 0, id: 0, edge: 0 };
  return (p, n) => {
    const c = base(p, n);
    shingles(p, size, 2, 1.25, cell);
    const k = 0.62 + 0.38 * Math.min(1, cell.edge * 1.6) + (cell.id - 0.5) * 0.1;
    return [c[0] * k, c[1] * k, c[2] * k];
  };
}

/**
 * A crocodilian's head and armour, for the croc and the gator: `snout`
 * [width at the eyes, width at the tip], `teeth` 'interlock' (the croc's,
 * top and bottom showing) or 'over' (the gator's, the top ones down
 * outside the bottom jaw), the hide `H` and the colour of the eye.
 */
export function crocodilian(s, P, { H, snout = [0.042, 0.016], teeth = 'interlock', eye = '#c8a020', flat = 0.4 }) {
  const top = { ...H, bone: 'head' };
  // The skull, flat, and the snout from it to the tip, flat and tapering; the lower jaw the same under it.
  s.ellipsoid(P.H, [0.054, 0.03, 0.05], { ...top, k: 0.018 });
  s.flake(P.H, P.S1, [0, 1, 0], snout[0], snout[1], flat, { ...top, k: 0.016 });
  const low = [0, -snout[0] * flat * 1.15, 0];
  s.flake(add(P.H, low), add(P.S1, [0, low[1] * 0.7, -0.004]), [0, 1, 0], snout[0] * 0.96, snout[1] * 0.92, flat * 0.8, { ...H, bone: 'jaw', k: 0.008 });
  // The jaw muscles bulging behind the eyes.
  for (const m of [1, -1]) s.ellipsoid(add(P.H, [m * 0.036, -0.008, -0.022]), [0.022, 0.024, 0.03], { ...H, bone: 'jaw', k: 0.014 });
  // The bumps the eyes sit in, and the nostrils' mound on the end.
  for (const m of [1, -1]) s.ellipsoid(add(P.H, [m * 0.024, 0.026, 0.008]), [0.016, 0.013, 0.02], { ...top, k: 0.01 });
  s.ellipsoid(add(P.S1, [0, snout[1] * flat + 0.002, -snout[1] * 0.5]), [snout[1] * 0.9, 0.008, snout[1] * 0.9], { ...top, k: 0.006 });
  for (const m of [1, -1]) s.sphere(add(P.S1, [m * snout[1] * 0.3, snout[1] * flat + 0.008, -snout[1] * 0.45]), 0.0028, { op: 'sub', k: 0.001 });
  // The teeth, along the edges of the jaws, rooted in them.
  const TOOTH = { color: '#ece4cc', mat: 'tooth', k: 0.0012 };
  s.part('teeth', () => {
    for (let i = 0; i < 9; i++) {
      const u = 0.12 + i * 0.1, c = lerp(P.H, P.S1, u), r = snout[0] + (snout[1] - snout[0]) * u;
      const edge = c[1] - r * flat * 0.88, lowTop = c[1] + low[1] + r * flat * 0.8 * 0.85;
      const len = 0.006 + 0.004 * Math.sin(i * 1.7) ** 2;
      for (const m of [1, -1]) {
        // The top ones down over the outside of the bottom jaw (all of them, on a gator); on a croc, every other.
        if (teeth === 'over' || i % 2 === 0) s.cone([m * r * 0.9, edge - len, c[2]], 0.0026, len + 0.003, { ...TOOTH, bone: 'head', rot: [Math.PI, 0, 0] });
        // The bottom ones up outside the top jaw: only a croc's show.
        if (teeth === 'interlock' && i % 2 === 1) s.cone([m * r * 0.97, lowTop + len * 0.9, c[2] + 0.004], 0.0024, len + 0.004, { ...TOOTH, bone: 'jaw' });
      }
    }
  });
  // The eyes: gold, a black slit up the middle, under a heavy bony lid.
  s.part('eyes', () => {
    for (const m of [1, -1]) {
      const c = add(P.H, [m * 0.027, 0.032, 0.012]);
      s.sphere(c, 0.008, { color: (p) => (Math.abs(p[0] - c[0] - m * 0.004) < 0.0012 && p[1] > c[1] - 0.006 ? rgb('#080806') : mix(rgb(eye), rgb('#5a4010'), smooth(0.003, 0.008, Math.hypot(p[0] - c[0] - m * 0.006, p[1] - c[1], p[2] - c[2])))), mat: 'eye', bone: 'head', k: 0 });
    }
  });
  for (const m of [1, -1]) s.ellipsoid(add(P.H, [m * 0.027, 0.039, 0.008]), [0.011, 0.004, 0.011], { ...top, k: 0.004 });
}

/** The armour: rows of scutes down the back, and the double crest down the tail. */
export function scutes(s, P, H, { rows = 4, len = 0.2 } = {}) {
  s.part('kit', () => {
    for (let i = 0; i < 11; i++) {
      const z = len * 0.85 - i * 0.042;
      for (let r = 0; r < rows; r++) {
        const x = (r - (rows - 1) / 2) * 0.022;
        s.ellipsoid([x, 0.122 - Math.abs(x) * 0.6, z], [0.008, 0.0055, 0.014], { ...H, bone: z > 0 ? 'front' : 'rear', k: 0.004 });
      }
    }
    for (let i = 1; i < 10; i++) {
      const t = i / 10, p = lerp(P.T0, P.T2, t), r = 0.05 + (0.008 - 0.05) * t;
      for (const m of t < 0.55 ? [1, -1] : [0]) s.cone([m * r * 0.45, p[1] + r * 0.85, p[2]], 0.009 * (1 - t * 0.5), 0.016 * (1 - t * 0.5), { ...H, bone: t < 0.5 ? 'tail' : 'tail2', k: 0.003 });
    }
  });
}

const HIDE = scaly((() => {
  const base = coat({ over: '#5a6232', under: '#d8cc98', vary: 0.12, freq: 16, edge: [-0.5, 0.1] });
  return (p, n) => {
    const c = base(p, n);
    // Dark blotches along the flanks and bands on the tail.
    const blot = smooth(0.55, 0.62, Math.sin(p[2] * 70 + Math.sin(p[0] * 40) * 2) * 0.5 + 0.5) * smooth(-0.1, 0.4, n[1]);
    return mix(c, rgb('#262a14'), blot * 0.6);
  };
})());

export default quadruped({
  name: 'croc',
  scale: 1.6,
  cell: 0.0055,
  budget: 30000,
  hip: 0.07,
  len: 0.2,
  girth: [0.085, 0.05],
  stance: 0.075,
  leg: [0.024, 0.018, 0.016],
  neck: { len: 0.05, rise: 0, r: 0.055 },
  head: { r: 0.05, snout: 0.17, sr: 0.03, drop: 0.03 },
  tail: { len: 0.42, rise: -0.1, r: 0.05, tip: 0.008, curl: 0.04 },
  feet: 'claw',
  sculptHead: false,
  cells: { teeth: 0.0014, eyes: 0.0012 },
  paint: { body: HIDE, feet: HIDE },
  mats: { body: 'scale', legs: 'scale', tail: 'scale', feet: 'scale' },
  style: { gait: 'sprawl', rate: 7, wag: 0.5, after(k, { clip, t }) {
    // The jaws: open wide and slammed shut.
    if (clip === 'attack') k.turn('jaw', 0.5 * Math.max(0, Math.sin(Math.min(1, t / 0.7) * Math.PI * 2)), 0, 0);
    else if (clip === 'idle') k.turn('jaw', 0.04, 0, 0);
  } },
  extras(s, P) {
    const H = { color: HIDE, mat: 'scale' };
    crocodilian(s, P, { H, snout: [0.04, 0.013], teeth: 'interlock', eye: '#b8a030' });
    s.ellipsoid([0, 0.09, 0], [0.07, 0.03, 0.2], { ...H, bone: 'trunk', k: 0.04, bump: [0.003, 70] });
    scutes(s, P, H, { rows: 4 });
  },
});
