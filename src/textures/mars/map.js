/**
 * Mars as positions: its major surface features by planetographic latitude and
 * east longitude (the IAU/USGS values), and the etching they make on glass.
 * `RADIUS_KM` is its mean radius, 3389.5 km, 0.532 of the Earth's 6371 km.
 */
export const RADIUS_KM = 3389.5;
export const EARTH_RADIUS_KM = 6371;
/** Mars's size next to the Earth's, for scaling a globe against one made for the Earth. */
export const SIZE_VS_EARTH = RADIUS_KM / EARTH_RADIUS_KM;

/** [name, lat, lon east, radius in degrees]: volcanoes, basins and the dark plains. */
export const FEATURES = Object.freeze([
  ['Olympus Mons', 18.65, -133.8, 5],
  ['Ascraeus Mons', 11.8, -104.5, 3],
  ['Pavonis Mons', 1.5, -113.4, 3],
  ['Arsia Mons', -8.35, -120.1, 3],
  ['Alba Mons', 40.5, -109.6, 5],
  ['Elysium Mons', 25.0, 147.2, 3],
  ['Hellas Planitia', -42.4, 70.5, 17],
  ['Argyre Planitia', -49.7, -43.3, 11],
  ['Isidis Planitia', 12.9, 87.0, 10],
  ['Utopia Planitia', 46.7, 117.5, 20],
  ['Syrtis Major', 8.4, 69.5, 7],
  ['Gale', -5.4, 137.8, 1],
  ['Jezero', 18.4, 77.5, 1],
]);

/** Valles Marineris, the canyon, as a line of [lat, lon east]. */
export const VALLES_MARINERIS = Object.freeze([[-8, -92], [-10, -82], [-12, -72], [-13, -62], [-12, -52]]);

/** How far from each pole the ice caps reach, in degrees of latitude. */
export const CAPS = Object.freeze({ north: 82, south: -84 });

/**
 * The etching on a canvas `width` wide: frosted basins and volcanoes, the
 * canyon, the polar caps and a graticule every 30°, on clear glass. Returns
 * null where there is no document to paint on.
 */
export function createMarsEtchCanvas({ width = 4096 } = {}) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const H = canvas.height, k = width / 4096;
  const x = (lon) => (lon + 180) / 360 * width, y = (lat) => (90 - lat) / 180 * H;

  ctx.strokeStyle = 'rgba(255,225,205,0.3)';
  ctx.lineWidth = 1 * k;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) { ctx.moveTo(x(lon), 0); ctx.lineTo(x(lon), H); }
  for (let lat = -60; lat <= 60; lat += 30) { ctx.moveTo(0, y(lat)); ctx.lineTo(width, y(lat)); }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,225,205,0.5)';
  ctx.strokeStyle = 'rgba(255,240,228,0.95)';
  ctx.lineWidth = 2 * k;
  for (const [, lat, lon, r] of FEATURES) {
    // A circle on the sphere is wider on the map the nearer a pole it is.
    const rx = r / Math.max(0.2, Math.cos(lat * Math.PI / 180));
    for (const shift of [-360, 0, 360]) {
      ctx.beginPath();
      ctx.ellipse(x(lon + shift), y(lat), rx / 360 * width, r / 180 * H, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.lineWidth = 5 * k;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  VALLES_MARINERIS.forEach(([lat, lon], i) => (i ? ctx.lineTo(x(lon), y(lat)) : ctx.moveTo(x(lon), y(lat))));
  ctx.stroke();
  ctx.fillRect(0, 0, width, y(CAPS.north));
  ctx.fillRect(0, y(CAPS.south), width, H - y(CAPS.south));
  ctx.lineWidth = 2 * k;
  for (const lat of [CAPS.north, CAPS.south]) { ctx.beginPath(); ctx.moveTo(0, y(lat)); ctx.lineTo(width, y(lat)); ctx.stroke(); }
  return canvas;
}
