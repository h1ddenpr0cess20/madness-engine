/**
 * Hardwood and softwood material maps, reusable by any prop or set: for a
 * species and a finish, a colour map and a bump map, painted at DETAIL, one
 * repeat of the map a metre of board, grain along u.
 *
 *   import { woodTexture, WOOD_SPECIES, WOOD_FINISHES } from 'madness-engine/textures/wood';
 *   const { map, bump } = woodTexture(GFX, 'oak', 'lacquered');
 *
 * The finishes: `raw` (the sawn surface, fibres and open pores), `sanded` (the
 * same boards finely sanded, the pores softened), and `lacquered` (sanded, and
 * meant to be sealed: the material's clearcoat does the lacquer).
 *
 * Each species is a set of parameters for the figure, which is built as a board
 * is cut: growth rings laid by the tree and bent round the cathedral of the cut,
 * latewood in the dark band of each ring, fibres that run the length of the
 * board, pores where the species has them, and rays across the grain.
 *
 * Colours are the species' heartwood and sapwood, as a woodworker would name
 * them; they are approximate, and they should be re-sampled from the reference
 * photographs of each species before they are relied on for a likeness.
 */
import { fractal, pixels, texture, DETAIL } from './painters.js';

export const WOOD_FINISHES = Object.freeze(['raw', 'sanded', 'lacquered']);

/**
 * The species. `heart` is the darker heartwood, `base` the typical colour of the
 * board, `sap` the pale sapwood flush; `rings` is how many growth rings cross a
 * metre; `late` how dark the latewood is (0 for a diffuse-porous wood, which has
 * little figure); `pores` how open the pores are (0 closed, 1 ring-porous oak).
 */
export const WOOD_SPECIES = Object.freeze({
  // Walnut and ash: sampled from reference photographs (see docs/wood.md), the darkest, typical and palest tones.
  walnut: { heart: [119, 72, 31], base: [174, 127, 84], sap: [238, 192, 150], rings: 11, late: 0.6, pores: 0.5, seed: 709 },
  // Not sampled yet: the reference photograph is greyed, so these are approximate.
  oak: { heart: [97, 64, 35], base: [166, 117, 61], sap: [213, 173, 112], rings: 14, late: 0.75, pores: 1, seed: 719 },
  mahogany: { heart: [57, 27, 24], base: [113, 59, 45], sap: [169, 99, 70], rings: 8, late: 0.45, pores: 0.7, seed: 727 },
  maple: { heart: [200, 150, 100], base: [228, 190, 140], sap: [240, 215, 175], rings: 6, late: 0.2, pores: 0.15, seed: 733 },
  cherry: { heart: [140, 70, 40], base: [190, 110, 70], sap: [225, 170, 130], rings: 9, late: 0.35, pores: 0.3, seed: 739 },
  ash: { heart: [197, 111, 40], base: [221, 140, 68], sap: [243, 169, 100], rings: 13, late: 0.7, pores: 0.8, seed: 743 },
  pine: { heart: [170, 110, 60], base: [222, 172, 108], sap: [240, 215, 170], rings: 10, late: 0.55, pores: 0.4, seed: 751 },
  teak: { heart: [110, 70, 35], base: [160, 105, 55], sap: [195, 150, 95], rings: 9, late: 0.4, pores: 0.5, seed: 757 },
});

const clamp255 = (x) => Math.max(0, Math.min(255, x));
const ramp = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const caches = new WeakMap();

/**
 * The figure of one species, as continuous fields over the unit square (no
 * steps: a wood's figure is soft gradients plus fine fibres). `band` is the
 * latewood of the growth rings: a smooth wave along v, bent by the cathedral,
 * sharpened by the species' latewood; `fibre` is fine noise stretched along u so
 * it runs with the board; `pore` a few short dashes in the open-grained species.
 */
function figure(species) {
  const p = WOOD_SPECIES[species];
  const bend = fractal(p.seed, 3, 4);
  const width = fractal(p.seed + 3, 6, 3);
  const fine = fractal(p.seed + 5, 40, 2);
  const finer = fractal(p.seed + 17, 90, 1);
  const pores = fractal(p.seed + 9, 240, 1);
  return (u, v) => {
    // The cathedral: the rings bend toward the centre of the cut, and drift along the board.
    const warp = (bend(u * 0.8, v) - 0.5) * 1.1 + (bend(u * 2.1 + 0.3, v * 2.4) - 0.5) * 0.25;
    const phase = (v * p.rings + warp * 2.6) * Math.PI * 2;
    // Two harmonics and a little drift in each band's spacing: the rings are not evenly laid.
    const wave = 0.5 + 0.35 * Math.sin(phase) + 0.15 * Math.sin(phase * 2.3 + 1.7 * width(u * 0.5, v));
    // Narrower and darker where the latewood is heavy; the band's width varies along the board.
    const sharp = 1 + p.late * 2 + (width(u, v) - 0.5) * 1.2;
    const late = p.late * Math.pow(wave, sharp);
    return {
      late,
      sap: ramp(0.6, 0.85, width(u * 0.6, v * 0.5)),
      // The fibres follow the rings' bend and break up along the board: long, irregular, not scanlines.
      fibre: fine(u * 0.06, v + warp * 0.15) * 0.7 + finer(u * 0.04, v + warp * 0.1) * 0.3,
      pore: pores(u * 0.012, v),
    };
  };
}

function paint(GFX, species, finish) {
  // Under node there is no canvas: the material is the colour alone.
  if (typeof document === 'undefined' || !GFX?.CanvasTexture) return { map: null, bump: null };
  const p = WOOD_SPECIES[species];
  const field = figure(species);
  const sanded = finish !== 'raw';
  const porosity = p.pores * (sanded ? 0.35 : 1);
  const fibreDepth = sanded ? 0.45 : 1;

  const colour = (u, v) => {
    const f = field(u, v);
    // Heartwood to the typical board colour, the latewood darker, and the sapwood's pale flush in the figure.
    let c = mix(p.heart, p.base, 0.7 + 0.3 * (1 - f.late));
    c = mix(c, p.sap, f.sap * 0.3);
    c = c.map((x) => x * (1 - f.late * 0.08));
    const streak = (f.fibre - 0.5) * 16 * fibreDepth;
    const pore = ramp(0.72, 0.82, f.pore) * 22 * porosity;
    const tone = c.map((x) => x + streak - pore);
    return tone.map(clamp255);
  };
  const relief = (u, v) => {
    const f = field(u, v);
    const h = 0.5 + f.late * 0.1 + (f.fibre - 0.5) * 0.25 * fibreDepth - ramp(0.72, 0.82, f.pore) * 0.2 * porosity;
    const x = clamp255(128 + (h - 0.5) * 255);
    return [x, x, x];
  };
  return {
    map: texture(GFX, pixels(DETAIL, colour)),
    bump: texture(GFX, pixels(DETAIL, relief), { srgb: false, wrap: true }),
  };
}

/**
 * The colour and bump maps of `species` in `finish` (one of WOOD_FINISHES),
 * painted once per renderer. Throws for an unknown species or finish.
 */
export function woodTexture(GFX, species = 'walnut', finish = 'sanded') {
  if (!Object.hasOwn(WOOD_SPECIES, species)) throw new Error(`wood: unknown species "${species}"`);
  if (!WOOD_FINISHES.includes(finish)) throw new Error(`wood: unknown finish "${finish}"`);
  if (!GFX || (typeof GFX !== 'object' && typeof GFX !== 'function')) throw new TypeError('wood: a graphics namespace is required');
  let cache = caches.get(GFX);
  if (!cache) { cache = new Map(); caches.set(GFX, cache); }
  const key = `${finish}:${species}`;
  if (!cache.has(key)) cache.set(key, paint(GFX, species, finish));
  return cache.get(key);
}

/** The bare carcass: the species, sawn and unfinished. */
export function rawLumber(GFX, species = 'walnut') {
  return woodTexture(GFX, species, 'raw');
}

/** The same boards, finely sanded and sealed: the doors and drawers. */
export function finishedWood(GFX, species = 'walnut') {
  return woodTexture(GFX, species, 'lacquered');
}
