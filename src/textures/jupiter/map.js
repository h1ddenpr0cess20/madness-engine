import { JUPITER_HEIGHT, JUPITER_JPEG, JUPITER_WIDTH } from './layout.js';

/**
 * Jupiter from measurements. `RADIUS_KM` is its mean radius, 69911 km (IAU),
 * and `SIZE_VS_EARTH` is that against the Earth's 6371 km. What is painted is
 * Jupiter's clouds from a photograph of its disc, laid out on the sphere by
 * `scripts/jupiter-map.py` (`layout.js`): the belts and zones and the Great Red
 * Spot where the photograph has them. Its far side is not in the photograph, so
 * there the belts are carried round as the mean of each latitude.
 */
export const RADIUS_KM = 69911;
export const EARTH_RADIUS_KM = 6371;
export const SIZE_VS_EARTH = RADIUS_KM / EARTH_RADIUS_KM;

/** The layout's size, and where its pixels are: rows from 90N, columns from -180 east. */
export const LAYOUT = Object.freeze({ width: JUPITER_WIDTH, height: JUPITER_HEIGHT, jpeg: JUPITER_JPEG });

/**
 * The clouds as a canvas, for `createGlassGlobe(...).setField(canvas)`: the glass
 * holds them as mist, which drifts, so they read as gas rather than a picture.
 * Resolves to null where there is no document to paint on.
 */
export async function loadJupiterMap() {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = `data:image/jpeg;base64,${JUPITER_JPEG}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = JUPITER_WIDTH; canvas.height = JUPITER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  return canvas;
}

/**
 * The clouds as an etching, for `createGlassGlobe(...).setField`-less glass: `etchCanvas`. The zones
 * (the bright bands) are the frost, the belts and the Great Red Spot clear glass, so the pattern of
 * the planet is cut into the glass and the mist inside shows through it.
 * Resolves to null where there is no document to paint on.
 */
/** Build the frosted glass etching from an already-decoded cloud map. */
export function createJupiterEtch(source, { relief = false } = {}) {
  if (!source || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const light = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    d[i] = 255; d[i + 1] = 240; d[i + 2] = 228;
    // For glass, the zones frost it. For metal, the whole range of the clouds' tone is the depth, stretched,
    // so every belt, festoon and storm is cut at its own depth and the finest of them is not lost.
    d[i + 3] = relief ? Math.min(1, Math.max(0, (light - 0.18) / 0.72)) ** 1.25 * 255 : Math.min(1, Math.max(0, (light - 0.5) * 1.6)) * 150;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/** The Jupiter clouds transformed into a frosted or relief etching. */
export async function loadJupiterEtch(options = {}) {
  return createJupiterEtch(await loadJupiterMap(), options);
}
