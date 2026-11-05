import { RADIUS } from './glassglobe.js';
import { displaceSphereGeometry, heightOf } from './metalglobe.js';

/**
 * A planet in resin, the material the dice are cast in (`dice.js`): glossy, a clearcoat over a colored body,
 * its relief engraved into the surface. A single `color`, or `colors: { low, high }` to color the engraved
 * relief apart from the rest (the Earth's land green on its blue sea).
 *
 *     const globe = createResinGlobe(GFX, { radius: 0.6, relief: await loadMoonEtch(), color: '#f1e6cf' });
 *     scene.add(globe.group);
 */

/** A canvas of the relief colored by its height: `low` where it is clear, `high` where it is engraved. */
function colorsOf(source, low, high) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = parse(low), b = parse(high);
  for (let i = 0; i < d.length; i += 4) {
    const t = d[i + 3] / 255;
    for (let k = 0; k < 3; k++) d[i + k] = a[k] + (b[k] - a[k]) * t;
    d[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {HTMLCanvasElement} options.relief  a canvas with the height in its alpha, equirectangular
 * @param {string} [options.color]  the resin's color, as `#rrggbb`
 * @param {{low: string, high: string}} [options.colors]  two colors, `high` on the relief and `low` elsewhere
 * @param {number} [options.bump]  the bump map's strength (negative cuts in)
 * @param {number} [options.soften]  pixels of blur on the relief that cuts the mesh itself
 * @param {number[]} [options.segments]  the sphere's width and height in segments
 * @param {number} [options.height]  full low-to-high terrain range as a fraction of the radius (topography only)
 * @param {boolean} [options.topography]  bake the relief canvas into the sphere vertices as real terrain
 */
export function createResinGlobe(GFX, { radius = RADIUS, relief, color = '#3a3350', colors = null, height = 0.016, bump = -6, soften = 0, topography = false, segments = [384, 256] } = {}) {
  const gray = relief ? heightOf(relief) : null;
  const deepCanvas = relief ? heightOf(relief, soften) : null;
  const map = gray ? new GFX.CanvasTexture(gray) : null;
  if (map) { map.wrapS = GFX.RepeatWrapping; map.anisotropy = 4; }
  let colorMap = null;
  if (relief && colors) {
    colorMap = new GFX.CanvasTexture(colorsOf(relief, colors.low, colors.high));
    colorMap.wrapS = GFX.RepeatWrapping;
    colorMap.colorSpace = GFX.SRGBColorSpace ?? colorMap.colorSpace;
    colorMap.anisotropy = 4;
  }
  // The dice's resin: roughness and clearcoat as `dice.js` sets them.
  const material = new GFX.MeshPhysicalMaterial({
    name: 'resin',
    color: new GFX.Color(colorMap ? '#ffffff' : color),
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    ...(colorMap ? { map: colorMap } : {}),
    ...(map && bump !== 0 ? { bumpMap: map, bumpScale: bump } : {}),
  });
  const geometry = new GFX.SphereGeometry(radius, ...segments);
  if (topography && deepCanvas) displaceSphereGeometry(geometry, deepCanvas, radius * height);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'resin globe';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const spin = new GFX.Group();
  spin.name = 'planet';
  spin.add(mesh);
  const group = new GFX.Group();
  group.name = 'resinglobe';
  group.add(spin);

  const api = {
    group, spin, mesh, material, spinRate: 0,
    /** Turns the planet so (`lat`, `lon`) faces the front, as the glass globe does. */
    orient(lat, lon, roll = 0) {
      const rad = Math.PI / 180;
      spin.rotation.order = 'XYZ';
      spin.rotation.set(lat * rad, -(Math.PI / 2 + lon * rad), 0);
      group.rotation.z = roll * rad;
      return api;
    },
    update(dt) { if (api.spinRate) spin.rotation.y += api.spinRate * dt; },
  };
  return api;
}
