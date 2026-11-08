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
 * The figure of one species, as fields over the unit square: `ring` is the
 * phase of the growth rings, bent by the cathedral; `late` the latewood in the
 * ring; `fibre` and `pore` stretched along u, so they run with the board;
 * `ray` the short fleck across it.
 */
function figure(species) {
  const p = WOOD_SPECIES[species];
  const bend = fractal(p.seed, 3, 4);
  const broad = fractal(p.seed + 3, 6, 3);
  const fine = fractal(p.seed + 5, 200, 2);
  const pores = fractal(p.seed + 9, 320, 1);
  const rays = fractal(p.seed + 13, 60, 2);
  return (u, v) => {
    // The cathedral: the rings bend toward the centre of the cut, and the centre drifts along the board.
    const warp = (bend(u * 0.8, v) - 0.5) * 0.9 + (bend(u * 2.1 + 0.3, v * 2.4) - 0.5) * 0.12;
    const phase = v * p.rings + warp * 3.2;
    const ring = phase - Math.floor(phase);
    return {
      ring,
      late: p.late * ramp(0.62 + (broad(u, v) - 0.5) * 0.25, 0.94, ring),
      sap: ramp(0.6, 0.85, broad(u * 0.6, v * 0.5)),
      fibre: fine(u * 0.02, v),
      pore: pores(u * 0.012, v),
      ray: ramp(0.7, 0.8, rays(u * 0.9, v * 0.3)),
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
    let c = mix(p.heart, p.base, 0.55 + 0.45 * (1 - f.late));
    c = mix(c, p.sap, f.sap * 0.35);
    c = c.map((x) => x * (1 - f.late * 0.2));
    const streak = (f.fibre - 0.5) * 26 * fibreDepth;
    const pore = ramp(0.62, 0.7, f.pore) * 60 * porosity;
    const fleck = f.ray * 14;
    const tone = c.map((x) => x + streak - pore + fleck + (f.fibre - 0.5) * 6);
    return sanded ? tone.map((x) => clamp255(x * 1.06 + 3)) : tone.map(clamp255);
  };
  const relief = (u, v) => {
    const f = field(u, v);
    const h = 0.5 + f.late * 0.22 + (f.fibre - 0.5) * 0.3 * fibreDepth - ramp(0.62, 0.7, f.pore) * 0.45 * porosity;
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
