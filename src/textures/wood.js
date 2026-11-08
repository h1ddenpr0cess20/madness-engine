/**
 * Hardwood material maps, painted at DETAIL: exposed raw lumber, and the same
 * boards finished with a sanded, sealed surface (the lacquer is the material's
 * clearcoat, in `props/granite-kitchen`).
 *
 * One repeat of a map is a metre of board, with the grain running along u.
 * The figure is built the way a board is cut: rings laid by the growth of the
 * tree, bent round the cathedral of the cut, with the latewood (the dark band
 * of each ring) between the earlywood; fine fibres that run the length of the
 * board, long pores in the fibres of the open-grained species, and a few
 * rays across the grain. Species share one figure field, so the two finishes
 * are recognisably the same wood.
 */
import { fractal, pixels, texture, DETAIL } from './painters.js';

export const WOOD_SPECIES = Object.freeze({
  walnut: { base: [116, 68, 43], heart: [62, 33, 24], sap: [178, 122, 77], open: 0.5 },
  oak: { base: [166, 117, 61], heart: [97, 64, 35], sap: [213, 173, 112], open: 1 },
  mahogany: { base: [113, 59, 45], heart: [57, 27, 24], sap: [169, 99, 70], open: 0.7 },
});

const SEED = { walnut: 709, oak: 719, mahogany: 727 };
const clamp255 = (x) => Math.max(0, Math.min(255, x));
const ramp = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const caches = new WeakMap();

/**
 * The figure of one species, as fields over the unit square. `ring` is the
 * phase of the growth rings (0 to 1 from one ring to the next, bent by the
 * cathedral); `fibre` and `pore` are stretched along u, so they run with the
 * board; `ray` is the short fleck across it.
 */
function figure(species) {
  const seed = SEED[species];
  const bend = fractal(seed, 3, 4);
  const broad = fractal(seed + 3, 6, 3);
  const fine = fractal(seed + 5, 200, 2);
  const pores = fractal(seed + 9, 320, 1);
  const rays = fractal(seed + 13, 60, 2);
  return (u, v) => {
    // The cathedral: the rings bend up toward the centre of the cut, and the centre drifts along the board.
    const warp = (bend(u * 0.8, v) - 0.5) * 0.9 + (bend(u * 2.1 + 0.3, v * 2.4) - 0.5) * 0.12;
    const phase = v * 11 + warp * 3.2;
    const ring = phase - Math.floor(phase);
    return {
      ring,
      // Latewood: the last tenth of each ring, darker and denser; its thickness varies from ring to ring.
      late: ramp(0.62 + (broad(u, v) - 0.5) * 0.25, 0.94, ring),
      sap: ramp(0.6, 0.85, broad(u * 0.6, v * 0.5)),
      fibre: fine(u * 0.02, v),
      pore: pores(u * 0.012, v),
      ray: ramp(0.7, 0.8, rays(u * 0.9, v * 0.3)),
    };
  };
}

function paintSpecies(GFX, species, finish) {
  // Under node there is no canvas: the material is the colour alone.
  if (typeof document === 'undefined' || !GFX?.CanvasTexture) return { map: null, bump: null };
  const pal = WOOD_SPECIES[species];
  const field = figure(species);
  const finished = finish === 'finished';
  // Open-grained species show their pores; a sealed finish fills them, so the finished boards have far fewer.
  const porosity = pal.open * (finished ? 0.35 : 1);
  const fibreDepth = finished ? 0.45 : 1;

  const colour = (u, v) => {
    const f = field(u, v);
    // Earlywood to heartwood, with the latewood darker, and the sapwood's pale flush in the figure.
    let c = mix(pal.heart, pal.base, 0.55 + 0.45 * (1 - f.late));
    c = mix(c, pal.sap, f.sap * 0.35);
    c = c.map((x) => x * (1 - f.late * 0.2));
    const streak = (f.fibre - 0.5) * 26 * fibreDepth;
    const pore = ramp(0.62, 0.7, f.pore) * 60 * porosity;
    const fleck = f.ray * 14;
    const tone = c.map((x) => x + streak - pore + fleck + (f.fibre - 0.5) * 6);
    return finished ? tone.map((x) => clamp255(x * 1.06 + 3)) : tone.map(clamp255);
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

function woodMaps(GFX, species, finish) {
  if (!WOOD_SPECIES[species]) throw new Error(`wood: unknown species "${species}"`);
  if (!GFX || (typeof GFX !== 'object' && typeof GFX !== 'function')) throw new TypeError('wood: a graphics namespace is required');
  let cache = caches.get(GFX);
  if (!cache) { cache = new Map(); caches.set(GFX, cache); }
  const key = `${finish}:${species}`;
  if (!cache.has(key)) cache.set(key, paintSpecies(GFX, species, finish));
  return cache.get(key);
}

/** Exposed natural surface: sawn fibres, the rings, and open pores. */
export function rawLumber(GFX, species = 'walnut') {
  return woodMaps(GFX, species, 'raw');
}

/** The same boards, finely sanded: the fibres softened, the pores filled, ready for a lacquer. */
export function finishedWood(GFX, species = 'walnut') {
  return woodMaps(GFX, species, 'finished');
}
