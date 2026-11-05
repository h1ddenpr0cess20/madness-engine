import { RELIEF_HEIGHT, RELIEF_JPEG, RELIEF_WIDTH } from './relief.js';
import { loadElevationMap } from '../elevation.js';

/**
 * The Moon from measurements. `RADIUS_KM` is its mean radius, 1737.4 km (IAU),
 * and `SIZE_VS_EARTH` is that against the Earth's 6371 km. What is etched is its
 * actual surface: LRO's LOLA laser altimetry (LDEM_16), shaded as relief from
 * the north-west and cut into the glass as frost (`relief.js`, made by
 * `scripts/moon-relief.py`), so the maria, the highlands, the South Pole-Aitken
 * basin and every large crater are where the Moon has them.
 */
export const RADIUS_KM = 1737.4;
export const EARTH_RADIUS_KM = 6371;
export const SIZE_VS_EARTH = RADIUS_KM / EARTH_RADIUS_KM;

/** The mosaic's size, and where its pixels are: rows from 90N, columns from -180 east. */
export const RELIEF = Object.freeze({ width: RELIEF_WIDTH, height: RELIEF_HEIGHT, jpeg: RELIEF_JPEG });

/**
 * The etching, on a canvas `width` wide (4096 is the data's own size): frost
 * where the relief catches the light and clear glass where it falls away.
 * Resolves to null where there is no document to paint on.
 */
export async function loadMoonEtch({ width = RELIEF_WIDTH } = {}) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = `data:image/jpeg;base64,${RELIEF_JPEG}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  // The gray is how much frost: turn it into white glass with that much alpha.
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const frost = d[i];
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = frost * 0.95;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}


/**
 * NASA's LOLA global elevation map, supplied by the CGI Moon Kit. This is a
 * height raster (not the north-west shaded frost image used by loadMoonEtch),
 * centered on 0° longitude, so it uses the same -180°..+180° UV convention.
 * Source: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg
 */
export function loadMoonTopography() {
  return loadElevationMap(
    'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg',
  );
}
