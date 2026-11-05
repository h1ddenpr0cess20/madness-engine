import { RADIUS } from './glassglobe.js';

/**
 * A planet in solid metal, its relief engraved into the surface: a smooth sphere with the relief engraved into it by a bump and a displacement
 * map cut from a relief canvas (`textures/earth/map` `loadEarthRelief`, `textures/mars/map` `loadMarsEtch`,
 * `textures/moon/map` `loadMoonEtch`, `textures/jupiter/map` `loadJupiterEtch`: whatever has its height in
 * the alpha), with no color on it but the metal's own.
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

/**
 * Mirrors an equirectangular relief horizontally. The Mars and Moon etches are
 * also shown on the glass globes' far shell; seen through the glass, that shell
 * is east-west reversed. The opaque metal/resin versions need the matching
 * exterior orientation instead.
 */
export function reverseRelief(source) {
  if (!source) return source;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('could not create a canvas context for reversed relief');
  ctx.translate(source.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

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
 * @param {number} [options.height]  how deep the relief is cut, as a fraction of the radius
 */
export function createMetalGlobe(GFX, { radius = RADIUS, relief, metal = 'steel', height = 0.02, bump = -9, soften = 0, frost = false, segments = [384, 256] } = {}) {
  // Two readings of the relief: sharp for the bump, which carries the fine detail, and softened for the
  // displacement, which cuts the mesh itself (it has only so many vertices) so the engraving has real depth.
  const gray = relief ? heightOf(relief) : null;
  const map = gray ? new GFX.CanvasTexture(gray) : null;
  const deep = relief ? new GFX.CanvasTexture(heightOf(relief, soften)) : null;
  // Currency finish: the field polished to a mirror and the engraving frosted, as a proof coin is struck.
  const rough = relief && frost ? new GFX.CanvasTexture(roughnessOf(relief)) : null;
  for (const t of [map, deep, rough]) if (t) { t.wrapS = GFX.RepeatWrapping; t.anisotropy = 4; }
  const material = new GFX.MeshPhysicalMaterial({
    name: 'metal',
    color: new GFX.Color('#ffffff'),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 3,
    ...(rough ? { roughnessMap: rough } : {}),
    ...(map ? { bumpMap: map, bumpScale: bump, displacementMap: deep, displacementScale: -radius * height, displacementBias: 0 } : {}),
  });
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(radius, ...segments), material);
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
