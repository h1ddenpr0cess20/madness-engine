import { LAND_PACKED } from './land.js';

/**
 * The Earth as positions, not as a picture: the land's outlines in longitude
 * and latitude (`land.js`, from Natural Earth), turned into whatever a surface
 * needs. Because it is coordinates, it is as sharp at any size, and it lands
 * exactly where a latitude and longitude say.
 *
 * Longitude runs -180 (the left of a map) to 180, latitude 90 (top) to -90.
 */

let rings = null;

/**
 * Every outline of the land, as a flat array of [lon, lat, lon, lat, …] in
 * degrees. A ring inside another (the Caspian, say) is a hole in it.
 */
export function landRings() {
  if (rings) return rings;
  const bytes = Uint8Array.from(atob(LAND_PACKED), (c) => c.charCodeAt(0));
  const v = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length >> 1);
  rings = [];
  let at = 0;
  const count = v[at++];
  for (let r = 0; r < count; r++) {
    const n = v[at++];
    const ring = new Float32Array(n * 2);
    let x = v[at++], y = v[at++];
    ring[0] = x / 100; ring[1] = y / 100;
    for (let i = 1; i < n; i++) {
      x += v[at++]; y += v[at++];
      ring[i * 2] = x / 100; ring[i * 2 + 1] = y / 100;
    }
    rings.push(ring);
  }
  return rings;
}

/**
 * The land on a Uint8Array of `width` × `height`, 255 where it is land and 0
 * where it is sea, rows from the north down, columns from -180 east. It is
 * filled the way a map is (even–odd, so holes are holes), and each pixel is
 * taken at its middle.
 */
export function landMask(width, height) {
  const mask = new Uint8Array(width * height);
  const crossings = Array.from({ length: height }, () => []);
  for (const ring of landRings()) {
    const n = ring.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x0 = (ring[i * 2] + 180) / 360 * width, y0 = (90 - ring[i * 2 + 1]) / 180 * height;
      const x1 = (ring[j * 2] + 180) / 360 * width, y1 = (90 - ring[j * 2 + 1]) / 180 * height;
      if (y0 === y1) continue;
      const [ya, yb, xa, xb] = y0 < y1 ? [y0, y1, x0, x1] : [y1, y0, x1, x0];
      // The rows whose middle (row + 0.5) falls in [ya, yb).
      for (let row = Math.max(0, Math.ceil(ya - 0.5)); row < Math.min(height, Math.ceil(yb - 0.5)); row++) {
        crossings[row].push(xa + (xb - xa) * ((row + 0.5 - ya) / (yb - ya)));
      }
    }
  }
  for (let row = 0; row < height; row++) {
    const xs = crossings[row].sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k] - 0.5)), to = Math.min(width, Math.ceil(xs[k + 1] - 0.5));
      for (let col = from; col < to; col++) mask[row * width + col] = 255;
    }
  }
  return mask;
}

/** Whether (lat, lon) is on land, by the same outlines. For a handful of points; `landMask` is for a map. */
export function isLand(lat, lon) {
  let inside = false;
  for (const ring of landRings()) {
    const n = ring.length / 2;
    let hit = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = ring[i * 2], yi = ring[i * 2 + 1], xj = ring[j * 2], yj = ring[j * 2 + 1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
    }
    if (hit) inside = !inside;
  }
  return inside;
}

/** Strokes every outline of the land on `ctx` across a `width` × `height` map. */
export function tracePath(ctx, width, height) {
  ctx.beginPath();
  for (const ring of landRings()) {
    const n = ring.length / 2;
    for (let i = 0; i < n; i++) {
      const x = (ring[i * 2] + 180) / 360 * width, y = (90 - ring[i * 2 + 1]) / 180 * height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}

/**
 * Etches the land onto a canvas as frosted glass would carry it: a milky
 * fill over the land and a finer, brighter line along every coast, on a clear
 * (transparent) sea. The alpha is what matters; the colour is the frost.
 * Returns the canvas, or null where there is no document to make one in.
 */
export function createEtchCanvas({ width = 4096, fill = 'rgba(236,244,255,0.5)', coast = 'rgba(255,255,255,0.95)', line = 1.6, graticule = null } = {}) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (graticule) {
    // Fine lines every `graticule` degrees, as an engraver would draw them.
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = line * 0.5;
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += graticule) { const x = (lon + 180) / 360 * width; ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let lat = -90 + graticule; lat < 90; lat += graticule) { const y = (90 - lat) / 180 * canvas.height; ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
  }
  tracePath(ctx, width, canvas.height);
  ctx.fillStyle = fill;
  ctx.fill('evenodd');
  ctx.strokeStyle = coast;
  ctx.lineWidth = line * (width / 4096);
  ctx.lineJoin = 'round';
  ctx.stroke();
  return canvas;
}

/**
 * The Earth's land as relief, for a metal globe: a canvas with the height in its alpha, the land raised
 * and the sea down, the coast softened a little so it slopes. Resolves to null with no document to paint on.
 */
export async function loadEarthRelief({ width = 2048 } = {}) {
  if (typeof document === 'undefined') return null;
  const height = width / 2;
  const mask = landMask(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const pixels = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
    pixels.data[i * 4 + 3] = mask[i];
  }
  ctx.putImageData(pixels, 0, 0);
  // Soften the coast: draw it blurred onto a second canvas.
  const soft = document.createElement('canvas');
  soft.width = width; soft.height = height;
  const sctx = soft.getContext('2d');
  sctx.filter = 'blur(2px)';
  sctx.drawImage(canvas, 0, 0);
  return soft;
}
