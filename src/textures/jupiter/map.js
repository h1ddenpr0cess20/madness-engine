/**
 * Jupiter as a field of color, painted the way the Earth's temperature is: a
 * value per pixel, run through a scale of stops onto a canvas, which the glass
 * globe holds as mist (`createGlassGlobe(...).setField(canvas)`). The value is
 * the cloud deck: the belts and zones, the eddies between them, and the Great
 * Red Spot.
 *
 * This is a model, not a measurement. The belts and zones are a sine of
 * latitude, the eddies are sines of longitude and latitude, and the spot is a
 * soft oval at its present latitude. It is not a picture of Jupiter.
 *
 * `RADIUS_KM` is Jupiter's mean radius, 69911 km (IAU), and `SIZE_VS_EARTH` is
 * that against the Earth's 6371 km.
 */
export const RADIUS_KM = 69911;
export const EARTH_RADIUS_KM = 6371;
export const SIZE_VS_EARTH = RADIUS_KM / EARTH_RADIUS_KM;

/** Jupiter's scale, in the value of `cloudAt`: 0 is the darkest belt, 1 the white of the zones. */
export const JUPITER_STOPS = Object.freeze([
  [0, [84, 46, 26]],
  [0.2, [182, 84, 56]],
  [0.35, [140, 94, 62]],
  [0.5, [204, 170, 128]],
  [0.7, [236, 220, 190]],
  [0.9, [252, 248, 238]],
  [1, [255, 255, 250]],
]);

/** The Great Red Spot: its centre in degrees, and its half-width in longitude and latitude. */
export const GRS = Object.freeze({ lat: -22, lon: 0, lonRadius: 12, latRadius: 5 });

const RAD = Math.PI / 180;

/** Longitude difference wrapped to -180..180. */
function wrap(d) {
  return ((d + 540) % 360) - 180;
}

/**
 * The cloud deck at (`lat`, `lon`) in degrees, 0 to 1. `time` is in turns of
 * the eddies: they drift east as it grows.
 */
export function cloudAt(lat, lon, time = 0) {
  const la = lat * RAD, lo = lon * RAD;
  const band = 0.5 + 0.34 * Math.sin(lat * 0.3 + 0.6 * Math.sin(lat * 0.13));
  const drift = time * Math.PI * 2;
  const eddy = 0.5 * Math.sin(5 * lo + 3 * la + drift)
    + 0.3 * Math.sin(11 * lo - 4 * la + 2 * drift)
    + 0.2 * Math.sin(17 * lo + 7 * la - drift);
  const dx = wrap(lon - GRS.lon) * Math.cos(la) / GRS.lonRadius;
  const dy = (lat - GRS.lat) / GRS.latRadius;
  const spot = Math.exp(-(dx * dx + dy * dy));
  return Math.min(1, Math.max(0, band + 0.14 * eddy - 0.2 * spot));
}

/** [r, g, b] (0..255) for `v`, between the stops and held at the ends. */
export function colorAt(v, stops = JUPITER_STOPS) {
  if (v <= stops[0][0]) return [...stops[0][1]];
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [v0, a] = stops[i - 1], [v1, b] = stops[i];
      const f = (v - v0) / (v1 - v0);
      return a.map((c, k) => Math.round(c + (b[k] - c) * f));
    }
  }
  return [...stops[stops.length - 1][1]];
}

/**
 * Paints the cloud deck onto an equirectangular canvas (-180 at the left, 90 at
 * the top), colored by `JUPITER_STOPS`. Resolves to the canvas.
 */
export function paintJupiter(canvas, { time = 0, stops = JUPITER_STOPS, size = 1024 } = {}) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);
  const lut = new Uint8Array(size * 3);
  for (let i = 0; i < size; i++) lut.set(colorAt(i / (size - 1), stops), i * 3);
  const px = image.data;
  for (let r = 0; r < height; r++) {
    const lat = 90 - (r + 0.5) / height * 180;
    for (let c = 0; c < width; c++) {
      const lon = (c + 0.5) / width * 360 - 180;
      const v = cloudAt(lat, lon, time);
      const l = Math.round(v * (size - 1)) * 3;
      const k = (r * width + c) * 4;
      px[k] = lut[l]; px[k + 1] = lut[l + 1]; px[k + 2] = lut[l + 2]; px[k + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
