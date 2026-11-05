import { RADIUS } from './glassglobe.js';

/**
 * A planet in solid metal. Equirectangular etch maps can add a bump-map finish;
 * when `topography: true`, real elevations are baked into the sphere vertices
 * so the terrain changes the silhouette and the mesh normals, not just lighting.
 *
 *     const globe = createMetalGlobe(GFX, { radius: 0.6, relief: await loadMoonEtch(), metal: 'silver' });
 *     scene.add(globe.group);
 *     globe.setMetal('copper');
 *     stage.run((dt) => globe.update(dt));
 *
 * Metal shows what it reflects, so it wants a scene with an environment (the stage has one).
 */

/** The metals: color of the polished metal, how rough its surface is. */
export const METALS = Object.freeze({
  steel: { color: '#c3c7cc', roughness: 0.34 },
  silver: { color: '#f3f1ec', roughness: 0.16 },
  gold: { color: '#ffd264', roughness: 0.2 },
  copper: { color: '#f08a68', roughness: 0.26 },
  bronze: { color: '#cf8a45', roughness: 0.34 },
  brass: { color: '#e0b84e', roughness: 0.28 },
  titanium: { color: '#9d9ea3', roughness: 0.42 },
  chrome: { color: '#fbfbfb', roughness: 0.04 },
  platinum: { color: '#e6e5e1', roughness: 0.18 },
  'rose gold': { color: '#f0aa9a', roughness: 0.22 },
  iron: { color: '#74747a', roughness: 0.52 },
  pewter: { color: '#a9a9a2', roughness: 0.4 },
});

/** A gray canvas of a relief canvas's alpha: the height, for a bump map. */
export function heightOf(source, blur = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(source, 0, 0);
  ctx.filter = 'none';
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = d[i + 3]; d[i + 3] = 255; }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/**
 * Applies a normalized equirectangular height canvas to a sphere's actual
 * vertices. The custom GFX renderers support bump maps but do not implement
 * material displacementMap, so terrain must be part of the BufferGeometry.
 *
 * `depth` is the full low-to-high elevation range in world units; the map's
 * midpoint stays on the reference sphere.
 */
export function displaceSphereGeometry(geometry, heightCanvas, depth) {
  if (!geometry || !heightCanvas || !Number.isFinite(depth) || depth < 0) {
    throw new TypeError('displaceSphereGeometry needs a geometry, height canvas, and non-negative depth');
  }
  if (depth === 0) return geometry;
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  if (!position || !uv) throw new Error('topographic sphere geometry needs position and uv attributes');
  const ctx = heightCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('could not read the height canvas');
  const { width, height } = heightCanvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const rowMean = (row) => {
    let total = 0;
    for (let x = 0; x < width; x++) total += pixels[(row * width + x) * 4];
    return total / width;
  };
  const northPole = rowMean(0);
  const southPole = rowMean(height - 1);
  const sample = (u, v) => {
    if (v >= 1 - 1e-6) return northPole;
    if (v <= 1e-6) return southPole;
    const px = (((u % 1) + 1) % 1) * width - 0.5;
    const xFloor = Math.floor(px);
    const x0 = ((xFloor % width) + width) % width;
    const x1 = (x0 + 1) % width;
    const tx = px - xFloor;
    const py = Math.min(height - 1, Math.max(0, (1 - v) * height - 0.5));
    const y0 = Math.floor(py);
    const y1 = Math.min(height - 1, y0 + 1);
    const ty = py - y0;
    const a = pixels[(y0 * width + x0) * 4] * (1 - tx) + pixels[(y0 * width + x1) * 4] * tx;
    const b = pixels[(y1 * width + x0) * 4] * (1 - tx) + pixels[(y1 * width + x1) * 4] * tx;
    return a * (1 - ty) + b * ty;
  };

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const radius = Math.hypot(x, y, z);
    if (!radius) continue;
    const normalizedHeight = sample(uv.getX(i), uv.getY(i)) / 255;
    const offset = (normalizedHeight - 0.5) * depth;
    const scale = (radius + offset) / radius;
    position.setXYZ(i, x * scale, y * scale, z * scale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A roughness map (the green channel) of a relief canvas: 0.25 of the metal's roughness on the field, all of it on the engraving. */
function roughnessOf(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) { const v = 64 + (255 - 64) * Math.min(1, d[i + 3] / 160); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {HTMLCanvasElement} options.relief  a canvas with the height in its alpha, equirectangular
 * @param {string} [options.metal]  a key of `METALS`
 * @param {number} [options.bump]  the bump map's strength (negative cuts in)
 * @param {number} [options.soften]  pixels of blur on the relief that cuts the mesh itself (0 for none): the mesh has only so many vertices
 * @param {boolean} [options.frost]  frost the engraving and leave the field polished
 * @param {number[]} [options.segments]  the sphere's width and height in segments
 * @param {number} [options.height]  full low-to-high terrain range as a fraction of the radius (topography only)
 * @param {boolean} [options.topography]  bake the relief canvas into the sphere vertices as real terrain
 */
export function createMetalGlobe(GFX, { radius = RADIUS, relief, metal = 'steel', height = 0.02, bump = -9, soften = 0, frost = false, topography = false, segments = [384, 256] } = {}) {
  const gray = relief ? heightOf(relief) : null;
  const deepCanvas = relief ? heightOf(relief, soften) : null;
  const map = gray ? new GFX.CanvasTexture(gray) : null;
  // Currency finish: the field polished to a mirror and the engraving frosted, as a proof coin is struck.
  const rough = relief && frost ? new GFX.CanvasTexture(roughnessOf(relief)) : null;
  for (const t of [map, rough]) if (t) { t.wrapS = GFX.RepeatWrapping; t.anisotropy = 4; }
  const geometry = new GFX.SphereGeometry(radius, ...segments);
  if (topography && deepCanvas) displaceSphereGeometry(geometry, deepCanvas, radius * height);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'metal',
    color: new GFX.Color('#ffffff'),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 3,
    ...(rough ? { roughnessMap: rough } : {}),
    ...(map && bump !== 0 ? { bumpMap: map, bumpScale: bump } : {}),
  });
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'metal globe';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const spin = new GFX.Group();
  spin.name = 'planet';
  spin.add(mesh);
  const group = new GFX.Group();
  group.name = 'metalglobe';
  group.add(spin);

  const api = {
    group, spin, mesh, material, metal, spinRate: 0,
    /** Changes the metal: any key of `METALS`. */
    setMetal(name) {
      const m = METALS[name];
      if (!m) throw new Error(`no metal called ${name}`);
      material.color.set(m.color);
      material.roughness = m.roughness + (material.roughnessMap ? 0.3 : 0);
      api.metal = name;
      return api;
    },
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
  return api.setMetal(metal);
}

/**
 * A bright studio to reflect, for metal to show itself in: soft boxes and a white floor on a dim room, as an
 * environment map made with `renderer`'s PMREM. Null where there is no renderer or no document.
 */
export function studioEnvironment(GFX, renderer) {
  if (!renderer || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#9aa4b4'); sky.addColorStop(0.5, '#556070'); sky.addColorStop(0.52, '#c8c2b8'); sky.addColorStop(1, '#6a665e');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#ffffff';
  for (const [x, y, w, h] of [[120, 90, 180, 110], [470, 60, 220, 90], [780, 110, 160, 130], [300, 300, 120, 60]]) g.fillRect(x, y, w, h);
  const texture = new GFX.CanvasTexture(c);
  texture.mapping = GFX.EquirectangularReflectionMapping;
  const pmrem = new GFX.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return environment;
}
