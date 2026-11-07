/**
 * Rock, in granite. The same stone as `heroes/rock`: the same shape (the same
 * noise, the same cutting planes, the same squash and turn), sampled finer so
 * its faces have no grid to them, and a surface of real granite rather than
 * vertex colour: a painted colour map of feldspar, quartz and mica in crisp
 * grains, and a bump map on which the grains stand proud.
 *
 * `createGraniteRock(GFX, { colour })` gives the same handle as `createRock`;
 * `createGraniteBoulder` the stone alone, { mesh, geometry, material }. The
 * colours are the GRANITES below, by name (GRANITE_CHOICES).
 */
import { fractal, pixels, texture } from '../textures/painters.js';
import { createRock, cuttingPlanes, noise } from './rock.js';

/** How finely the granite stone is sampled: the shape is the same at any sampling, only the faceting goes. */
export const GRANITE_DETAIL = 64;

/**
 * The colourways: a ground, a pale feldspar and a glassy quartz (sRGB, 0 to 1),
 * and how dark the mica flecks go into the ground.
 */
export const GRANITES = {
  grey: { ground: [0.54, 0.51, 0.47], feldspar: [0.84, 0.8, 0.74], quartz: [0.92, 0.92, 0.9], mica: 0.8 },
  pink: { ground: [0.68, 0.48, 0.45], feldspar: [0.88, 0.68, 0.64], quartz: [0.84, 0.82, 0.8], mica: 0.85 },
  black: { ground: [0.17, 0.17, 0.18], feldspar: [0.34, 0.34, 0.36], quartz: [0.42, 0.42, 0.44], mica: 0.4 },
  white: { ground: [0.8, 0.78, 0.74], feldspar: [0.95, 0.94, 0.9], quartz: [0.97, 0.97, 0.96], mica: 0.9 },
  green: { ground: [0.27, 0.33, 0.28], feldspar: [0.52, 0.58, 0.46], quartz: [0.62, 0.64, 0.6], mica: 0.85 },
};
export const GRANITE_CHOICES = Object.keys(GRANITES);

/** One tile of granite spans this much of the stone (it is about 1.9 across). */
export const GRANITE_TILE_SIZE = 1.9;
/** The maps are painted this size, one tile across. */
const SIZE = 1024;

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ramp = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const painted = new WeakMap();

/**
 * The granite's maps for one colourway: its colour map, painted once per
 * renderer and colourway, and the bump map they share, on which the grains
 * stand proud. Under node there is no canvas, and the vertex colours carry the
 * tone alone.
 */
function granite(GFX, name) {
  let cache = painted.get(GFX);
  if (!cache) { cache = { maps: new Map(), fields: null, bump: null }; painted.set(GFX, cache); }
  if (cache.maps.has(name)) return cache.maps.get(name);
  let maps = { map: null, bump: null };
  if (typeof document !== 'undefined') {
    cache.fields ??= {
      tone: fractal(601, 3, 4), feld: fractal(607, 96, 2), quartz: fractal(613, 160, 2),
      mica: fractal(619, 224, 2), pit: fractal(631, 320, 2), fine: fractal(641, 512, 1),
    };
    const { tone, feld, quartz, mica, pit, fine } = cache.fields;
    const pal = GRANITES[name];
    const paint = (u, v) => {
      const b = tone(u, v) - 0.5;
      const f = ramp(0.56, 0.62, feld(u, v)) * 0.7;
      const q = ramp(0.6, 0.66, quartz(u, v)) * 0.5;
      const k = 1 - ramp(0.63, 0.7, mica(u, v)) * pal.mica - ramp(0.6, 0.8, pit(u, v)) * 0.15;
      return pal.ground.map((g, c) => {
        let x = g + b * 0.23;
        x += (pal.feldspar[c] - x) * f;
        x += (pal.quartz[c] - x) * q;
        return clamp01(x * k) * 255;
      });
    };
    const height = (u, v) => {
      const h = 0.5 + (feld(u, v) - 0.5) * 0.3 + (quartz(u, v) - 0.5) * 0.2 + (fine(u, v) - 0.5) * 0.3
        - ramp(0.63, 0.7, mica(u, v)) * 0.3 - ramp(0.6, 0.8, pit(u, v)) * 0.3;
      return [h, h, h].map((x) => clamp01(x) * 255);
    };
    cache.bump ??= texture(GFX, pixels(SIZE, height), { srgb: false, wrap: true });
    maps = { map: texture(GFX, pixels(SIZE, paint), { wrap: true }), bump: cache.bump };
  }
  cache.maps.set(name, maps);
  return maps;
}

/**
 * The grain is laid on the stone, not wrapped round the sphere it began as:
 * each triangle takes the cube-face projection of the way it faces most, so
 * the granite reads the same at the poles as at the equator. Returns the uv
 * attribute for the (non-indexed) positions `p`.
 */
function laySurface(p) {
  const uv = new Float32Array((p.length / 3) * 2);
  for (let t = 0; t < p.length; t += 9) {
    const ux = p[t + 3] - p[t], uy = p[t + 4] - p[t + 1], uz = p[t + 5] - p[t + 2];
    const wx = p[t + 6] - p[t], wy = p[t + 7] - p[t + 1], wz = p[t + 8] - p[t + 2];
    const nx = Math.abs(uy * wz - uz * wy), ny = Math.abs(uz * wx - ux * wz), nz = Math.abs(ux * wy - uy * wx);
    const axis = nx >= ny && nx >= nz ? 0 : ny >= nz ? 1 : 2;
    for (let k = 0; k < 3; k++) {
      const i = t + 3 * k, o = (t / 3 + k) * 2;
      const a = axis === 0 ? p[i + 1] : p[i];
      const b = axis === 2 ? p[i + 1] : p[i + 2];
      uv[o] = a / GRANITE_TILE_SIZE + axis * 0.37;
      uv[o + 1] = b / GRANITE_TILE_SIZE;
    }
  }
  return uv;
}

/** The granite stone alone: `heroes/rock`'s shape, finely sampled, with its own surface in the colour asked for. */
export function createGraniteBoulder(GFX, { detail = GRANITE_DETAIL, colour = 'grey' } = {}) {
  if (!(colour in GRANITES)) throw new Error(`rock-granite: no granite called ${colour}; there is ${GRANITE_CHOICES.join(', ')}`);
  const geometry = new GFX.IcosahedronGeometry(1, detail).toNonIndexed();
  const planes = cuttingPlanes(GFX);

  const p = geometry.attributes.position.array;
  const v = new GFX.Vector3();
  const colors = new Float32Array(p.length);

  for (let i = 0; i < p.length; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]).normalize();

    const d = 1
      + noise(v.x * 2.1 + 11, v.y * 2.1, v.z * 2.1) * 0.19
      + noise(v.x * 4.7, v.y * 4.7 + 5, v.z * 4.7) * 0.085
      + noise(v.x * 11, v.y * 11, v.z * 11 + 3) * 0.03;
    v.multiplyScalar(d);

    for (const pl of planes) {
      const t = v.dot(pl.n);
      if (t > pl.d) v.addScaledVector(pl.n, -(t - pl.d) * 0.92);
    }

    if (v.y < -0.87) v.y = -0.87 + (v.y + 0.87) * 0.18;

    p[i] = v.x; p[i + 1] = v.y * 0.94; p[i + 2] = v.z;

    // The large-scale tone, by vertex; the grain itself is the painted map, at pixel size.
    const m = noise(v.x * 6, v.y * 6, v.z * 6) * 0.5 + 0.5;
    colors[i] = colors[i + 1] = colors[i + 2] = 1 - Math.pow(m, 1.6) * 0.3;
  }

  geometry.setAttribute('uv', new GFX.BufferAttribute(laySurface(p), 2));
  geometry.setAttribute('color', new GFX.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const { map, bump } = granite(GFX, colour);
  const material = new GFX.MeshStandardMaterial({
    name: 'granite',
    vertexColors: true,
    map,
    bumpMap: bump,
    bumpScale: 1,
    roughness: 0.9,
    metalness: 0.04,
    flatShading: true,
  });

  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'rock_body';

  return { mesh, geometry, material };
}

/** Rock in granite: `createRock`, with the granite stone in the colour asked for (`grey` by default). */
export function createGraniteRock(GFX, { colour = 'grey', ...opts } = {}) {
  return createRock(GFX, { ...opts, boulder: (G) => createGraniteBoulder(G, { colour }) });
}
