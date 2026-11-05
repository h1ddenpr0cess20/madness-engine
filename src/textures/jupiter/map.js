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
