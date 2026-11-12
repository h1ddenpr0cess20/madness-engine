/**
 * Molded chocolate: for a kind, a color map and a bump map painted on the
 * sphere's own map (u round, v pole to pole), as a chocolate egg wears it. The
 * surface is smooth and glossy with a soft mottle to the color, a few small
 * air pits where the mold did not quite fill, and the seam where the two
 * halves of the mold met, a fine raised line round the middle.
 *
 *   import { chocolateTexture, CHOCOLATES } from 'madness-engine/textures/chocolate';
 *   const { map, bump } = chocolateTexture(GFX, 'dark');
 *
 * Painted once per renderer. Under node (the tests) there is no canvas, and
 * both maps are null: the material falls back on the kind's `color`.
 */
import { canvas, fractal, smoothstep, texture } from './painters.js';

/**
 * The kinds. `base` is the typical color (0 to 255 sRGB), `deep` the darker tone it mottles toward; `color`
 * is the flat color to fall back on; `gloss` how tight the clearcoat is (1 the glassiest).
 */
export const CHOCOLATES = Object.freeze({
  milk: { base: [98, 56, 33], deep: [78, 43, 25], color: '#623821', gloss: 0.8, seed: 211 },
  dark: { base: [52, 28, 17], deep: [36, 18, 11], color: '#341c11', gloss: 0.95, seed: 223 },
  white: { base: [224, 208, 170], deep: [205, 186, 144], color: '#e0d0aa', gloss: 0.6, seed: 227 },
});

const WIDTH = 1024;
const HEIGHT = 512;
const caches = new WeakMap();

const clamp255 = (x) => Math.max(0, Math.min(255, x));

function paint(GFX, kind) {
  if (typeof document === 'undefined' || !GFX?.CanvasTexture) return { map: null, bump: null };
  const look = CHOCOLATES[kind];
  const mottle = fractal(look.seed, 4, 4);
  const swirl = fractal(look.seed + 7, 8, 3);
  const grain = fractal(look.seed + 13, 96, 1);
  const pits = fractal(look.seed + 29, 128, 1);

  const [color, g] = canvas(WIDTH, HEIGHT);
  const [relief, r] = canvas(WIDTH, HEIGHT);
  const tone = g.createImageData(WIDTH, HEIGHT);
  const height = r.createImageData(WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    const v = y / HEIGHT;
    // The seam: a ridge a hair wide round the equator, the mold's join.
    const seam = Math.exp(-(((v - 0.5) / 0.0065) ** 2));
    for (let x = 0; x < WIDTH; x++) {
      const u = x / WIDTH;
      const m = mottle(u, v), s = swirl(u + 0.31 * m, v);
      // Blooms and streaks where the chocolate set at different speeds.
      const mix = Math.min(1, Math.max(0, 0.55 * m + 0.45 * s));
      const fine = (grain(u, v) - 0.5) * 6;
      const pit = smoothstep(0.9, 0.97, pits(u, v));
      const i = (y * WIDTH + x) * 4;
      for (let c = 0; c < 3; c++) {
        let value = look.deep[c] + (look.base[c] - look.deep[c]) * mix + fine;
        value *= 1 - 0.16 * pit; // an air pit is darker, and the seam a touch lighter where it catches.
        value *= 1 + 0.07 * seam;
        tone.data[i + c] = clamp255(value);
        height.data[i + c] = clamp255(128 + (mix - 0.5) * 10 + fine * 1.5 - pit * 40 + seam * 55);
      }
      tone.data[i + 3] = height.data[i + 3] = 255;
    }
  }
  g.putImageData(tone, 0, 0);
  r.putImageData(height, 0, 0);
  const map = texture(GFX, color, { wrap: true });
  const bump = texture(GFX, relief, { srgb: false, wrap: true });
  return { map, bump };
}

/** The color and bump maps of chocolate `kind` (a key of `CHOCOLATES`), painted once per renderer. */
export function chocolateTexture(GFX, kind = 'milk') {
  if (!Object.hasOwn(CHOCOLATES, kind)) throw new Error(`chocolate: unknown kind "${kind}"`);
  if (!GFX || (typeof GFX !== 'object' && typeof GFX !== 'function')) throw new TypeError('chocolate: a graphics namespace is required');
  let cache = caches.get(GFX);
  if (!cache) { cache = new Map(); caches.set(GFX, cache); }
  if (!cache.has(kind)) cache.set(kind, paint(GFX, kind));
  return cache.get(kind);
}
