import { RELIEF_HEIGHT, RELIEF_JPEG, RELIEF_WIDTH } from './relief.js';

/**
 * Mars from measurements. `RADIUS_KM` is its mean radius, 3389.5 km (IAU), and
 * `SIZE_VS_EARTH` is that against the Earth's 6371 km. What is etched is its
 * actual surface: Mars Global Surveyor's MOLA laser altimetry, shaded as relief
 * from the north-west and cut into the glass as frost (`relief.js`, made by
 * `scripts/mars-relief.py`), so the volcanoes, the canyons, the basins and
 * every large crater are where the planet has them.
 */
export const RADIUS_KM = 3389.5;
export const EARTH_RADIUS_KM = 6371;
export const SIZE_VS_EARTH = RADIUS_KM / EARTH_RADIUS_KM;

/** The mosaic's size, and where its pixels are: rows from 90N, columns from -180 east. */
export const RELIEF = Object.freeze({ width: RELIEF_WIDTH, height: RELIEF_HEIGHT, jpeg: RELIEF_JPEG });

/**
 * The etching, on a canvas `width` wide (4096 is the data's own size): frost
 * where the relief catches the light, clear glass where it falls away, and a
 * graticule every 30°. Resolves to null where there is no document to paint on.
 */
export async function loadMarsEtch({ width = RELIEF_WIDTH } = {}) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = `data:image/jpeg;base64,${RELIEF_JPEG}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  // The gray is how much frost: turn it into frost-colored glass with that much alpha.
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const frost = d[i];
    d[i] = 255; d[i + 1] = 236; d[i + 2] = 224; d[i + 3] = frost * 0.95;
  }
  ctx.putImageData(pixels, 0, 0);
  ctx.strokeStyle = 'rgba(255,230,215,0.35)';
  ctx.lineWidth = Math.max(1, width / 4096);
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) { const x = (lon + 180) / 360 * width; ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
  for (let lat = -60; lat <= 60; lat += 30) { const y = (90 - lat) / 180 * canvas.height; ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
  return canvas;
}
