/**
 * Hardwood material maps: exposed raw lumber and the same wood after fine
 * sanding, stain and a clear protective finish. Species share one grain field
 * so the two finishes remain recognisably the same wood.
 */
import { fractal, pixels, texture } from './painters.js';

export const WOOD_SPECIES = Object.freeze({
  walnut: { base: [116, 68, 43], heart: [62, 33, 24], sap: [178, 122, 77] },
  oak: { base: [166, 117, 61], heart: [97, 64, 35], sap: [213, 173, 112] },
  mahogany: { base: [113, 59, 45], heart: [57, 27, 24], sap: [169, 99, 70] },
});

const SIZE = 1024;
const clamp = (x) => Math.max(0, Math.min(255, x));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const caches = new WeakMap();

function grainFields(species) {
  const seed = { walnut: 709, oak: 719, mahogany: 727 }[species];
  const broad = fractal(seed, 3, 5);
  const figure = fractal(seed + 7, 18, 3);
  const fine = fractal(seed + 19, 100, 2);
  const knots = fractal(seed + 29, 2, 2);
  return (u, v) => {
    const warp = (broad(u, v) - 0.5) * 0.025;
    const longitudinal = figure(u + warp, v * 0.16);
    const micro = fine(u, v * 0.9);
    const knot = knots(u * 1.4, v * 1.1);
    const fibre = 0.5 + 0.5 * Math.sin((v * 34 + warp * 80 + (longitudinal - 0.5) * 2.5) * Math.PI);
    return { broad: broad(u, v), figure: longitudinal, micro, knot, fibre };
  };
}

function paintSpecies(GFX, species, finish) {
  // Browser painters are intentionally inert in Node: like the granite maps,
  // geometry and material definitions remain testable without a DOM canvas.
  if (typeof document === 'undefined' || !GFX?.CanvasTexture) return { map: null, bump: null };
  const palette = WOOD_SPECIES[species];
  const field = grainFields(species);
  const polished = finish === 'finished';
  const colour = (u, v) => {
    const f = field(u, v);
    const low = mix(palette.heart, palette.base, 0.45 + f.broad * 0.4);
    const high = mix(low, palette.sap, Math.max(0, (f.figure - 0.48) * 1.4));
    const knots = Math.pow(Math.max(0, f.knot - 0.67), 2) * 6;
    const grain = (f.fibre - 0.5) * (polished ? 11 : 20) + (f.micro - 0.5) * 9 - knots;
    const raw = high.map((v) => clamp(v + grain));
    return polished ? raw.map((v) => clamp(v * 1.08 + 4)) : raw;
  };
  const relief = (u, v) => {
    const f = field(u, v);
    const fibre = (f.fibre - 0.5) * (polished ? 0.18 : 0.34);
    const micro = (f.micro - 0.5) * 0.08;
    const height = Math.round(128 + fibre * 255 + micro * 255);
    return [height, height, height];
  };
  return {
    map: texture(GFX, pixels(SIZE, colour)),
    bump: texture(GFX, pixels(SIZE, relief), { srgb: false, wrap: true }),
  };
}

function woodMaps(GFX, species, finish) {
  if (!WOOD_SPECIES[species]) throw new Error(`wood: unknown species "${species}"`);
  if (!GFX || (typeof GFX !== 'object' && typeof GFX !== 'function')) throw new TypeError('wood: a graphics namespace is required');
  let cache = caches.get(GFX);
  if (!cache) { cache = new Map(); caches.set(GFX, cache); }
  const key = `${finish}:${species}`;
  if (!cache.has(key)) cache.set(key, paintSpecies(GFX, species, finish));
  return cache.get(key);
}

/** Exposed natural surface: sawn fibres, knots and deeper pores. */
export function rawLumber(GFX, species = 'walnut') {
  return woodMaps(GFX, species, 'raw');
}

/** The same fibres, finely sanded and sealed with a restrained satin clearcoat. */
export function finishedWood(GFX, species = 'walnut') {
  return woodMaps(GFX, species, 'finished');
}
