/**
 * Molten basalt, built as a physically based material with a seamless,
 * high-resolution procedural texture.
 *
 * Its visual language follows the engine's polished metal assets: real scene
 * reflections, broad softbox highlights, and surface relief carried by a
 * bump map. Dark glassy basalt is broken by a small number of broad connected
 * molten flows, softly feathered channels, and narrow hot centres.
 *
 * Sphere maps are sampled in 3D direction space with matched UV borders and
 * pole rows. Floor maps use periodic noise in both directions. There are no
 * UV frames, cellular plate grids, crater pits, or dense contour networks.
 *
 * The legacy world-floor API and uTime/uBright controls are preserved.
 * Use mapping: "local" for rounded or deforming objects such as Slimey.
 */

const TAU = Math.PI * 2;
const textureCache = new WeakMap();

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function hash3(x, y, z, seed = 0) {
  let h = Math.imul(x | 0, 0x8da6b343)
    ^ Math.imul(y | 0, 0xd8163841)
    ^ Math.imul(z | 0, 0xcb1ab31f)
    ^ Math.imul(seed | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function noise3(x, y, z, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const x00 = mix(hash3(ix, iy, iz, seed), hash3(ix + 1, iy, iz, seed), u);
  const x10 = mix(hash3(ix, iy + 1, iz, seed), hash3(ix + 1, iy + 1, iz, seed), u);
  const x01 = mix(hash3(ix, iy, iz + 1, seed), hash3(ix + 1, iy, iz + 1, seed), u);
  const x11 = mix(hash3(ix, iy + 1, iz + 1, seed), hash3(ix + 1, iy + 1, iz + 1, seed), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

function fbm3(x, y, z, seed = 0, octaves = 3) {
  let sum = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x, y, z, seed + i * 17) * amplitude;
    total += amplitude;
    [x, y, z] = [y * 2.01 + 13.1, z * 2.01 + 7.7, x * 2.01 + 3.3];
    amplitude *= 0.5;
  }
  return sum / total;
}

function hash2(x, y, seed = 0) {
  return hash3(x, y, 0, seed);
}

function noise2(u, v, seed, period) {
  const x = u * period, y = v * period;
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const wrap = (n) => ((n % period) + period) % period;
  const a = hash2(wrap(ix), wrap(iy), seed);
  const b = hash2(wrap(ix + 1), wrap(iy), seed);
  const c = hash2(wrap(ix), wrap(iy + 1), seed);
  const d = hash2(wrap(ix + 1), wrap(iy + 1), seed);
  return mix(mix(a, b, sx), mix(c, d, sx), sy);
}

function fbm2(u, v, seed, cells = 3, octaves = 4) {
  let sum = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    const period = cells * 2 ** i;
    sum += noise2(u, v, seed + i * 37, period) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
  }
  return sum / total;
}

function heatColour(h) {
  const stops = [
    [0.00, [76, 8, 3]],
    [0.34, [135, 17, 4]],
    [0.67, [235, 66, 7]],
    [0.86, [255, 151, 24]],
    [1.00, [255, 231, 155]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (h <= stops[i][0]) {
      const a = stops[i - 1][0], ca = stops[i - 1][1];
      const b = stops[i][0], cb = stops[i][1];
      const t = smooth(a, b, h);
      return ca.map((v, k) => Math.round(mix(v, cb[k], t)));
    }
  }
  return stops[stops.length - 1][1];
}

function sphereField(u, v, scale) {
  const phi = v * Math.PI;
  const theta = u * TAU;
  const sinPhi = Math.sin(phi);
  const dx = Math.abs(sinPhi) < 1e-7 ? 0 : sinPhi * Math.cos(theta);
  const dy = Math.cos(phi);
  const dz = Math.abs(sinPhi) < 1e-7 ? 0 : sinPhi * Math.sin(theta);

  // Stable basalt only. The molten channels are computed per-pixel by the
  // animated overlay instead of being baked into a fixed spherical line map.
  const broad = fbm3(dx * 7.0 + 1.3, dy * 7.0 + 4.7, dz * 7.0 + 8.1, 29, 3);
  const grain = fbm3(dx * 21.0 + 8.4, dy * 21.0 + 2.1, dz * 21.0 + 6.8, 31, 2);
  const warmth = fbm3(dx * 2.0 + 3.1, dy * 2.0 + 5.7, dz * 2.0 + 1.9, 37, 2);
  const base = [
    mix(11, 34, broad) * (0.91 + grain * 0.16) + warmth * 2.0,
    mix(12, 24, broad) * (0.91 + grain * 0.16) + warmth * 0.55,
    mix(17, 23, broad) * (0.91 + grain * 0.16),
  ];
  const albedo = base.map((c) => Math.round(Math.max(0, Math.min(255, c))));
  const relief = Math.round(clamp01(0.66 + (broad - 0.5) * 0.055 + (grain - 0.5) * 0.025) * 255);
  return { albedo, relief };
}

function floorField(u, v, scale) {
  // Periodic mineral variation only. Molten areas are rendered by the same
  // animated shader used on Slimey; no fixed lava lines are baked into this map.
  const broad = fbm2(u, v, 67, 5, 4);
  const grain = fbm2(u, v, 71, 19, 2);
  const warmth = fbm2(u, v, 73, 2, 3);
  const base = [
    mix(11, 34, broad) * (0.91 + grain * 0.16) + warmth * 2,
    mix(12, 24, broad) * (0.91 + grain * 0.16) + warmth * 0.55,
    mix(17, 23, broad) * (0.91 + grain * 0.16),
  ];
  const albedo = base.map((c) => Math.round(Math.max(0, Math.min(255, c))));
  const relief = Math.round(clamp01(0.66 + (broad - 0.5) * 0.055 + (grain - 0.5) * 0.025) * 255);
  return { albedo, relief };
}



const HOT_VERTEX = `
uniform float uLocal;
varying vec3 vMoltenPoint;
void main() {
  vec3 p = position;
  if (uLocal > 0.5) p *= 1.002;
  else p += normalize(normal) * 0.0015;
  vMoltenPoint = position;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const HOT_FRAGMENT = `
uniform float uTime;
uniform float uScale;
uniform float uLocal;
varying vec3 vMoltenPoint;

float hash31(vec3 p) {
  vec3 q = fract(p * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash31(i + vec3(0.0, 0.0, 0.0));
  float b = hash31(i + vec3(1.0, 0.0, 0.0));
  float c = hash31(i + vec3(0.0, 1.0, 0.0));
  float d = hash31(i + vec3(1.0, 1.0, 0.0));
  float e = hash31(i + vec3(0.0, 0.0, 1.0));
  float f1 = hash31(i + vec3(1.0, 0.0, 1.0));
  float g = hash31(i + vec3(0.0, 1.0, 1.0));
  float h = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f1, u.x), mix(g, h, u.x), u.y),
    u.z
  );
}

float fbm3(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += noise3(p) * amp;
    p = p.yzx * 2.01 + vec3(13.1, 7.7, 3.3);
    amp *= 0.5;
  }
  return sum / 0.9375;
}

vec3 heat(float x) {
  vec3 c = mix(vec3(0.20, 0.009, 0.001), vec3(0.66, 0.045, 0.003), smoothstep(0.12, 0.48, x));
  c = mix(c, vec3(1.0, 0.22, 0.012), smoothstep(0.42, 0.76, x));
  c = mix(c, vec3(1.0, 0.62, 0.13), smoothstep(0.73, 0.94, x));
  return mix(c, vec3(1.0, 0.88, 0.52), smoothstep(0.94, 1.0, x));
}

void main() {
  float t = uTime;
  vec3 p = (uLocal > 0.5 ? normalize(vMoltenPoint) : vMoltenPoint) * uScale;

  // The field itself is advected and re-warped over time. Broad noise masses
  // merge into irregular molten rivers and pools; there is no fixed contour
  // or repeated line pattern beneath the animation.
  vec3 drift = vec3(t * 0.032, -t * 0.024, t * 0.019);
  vec3 warp = vec3(
    fbm3(p * 0.42 + drift + vec3(2.1, 5.4, 1.7)),
    fbm3(p.yzx * 0.42 - drift.zxy + vec3(7.2, 1.8, 4.3)),
    fbm3(p.zxy * 0.42 + drift.yzx + vec3(3.4, 8.1, 6.2))
  );
  vec3 q = p * 0.78 + (warp - 0.5) * 1.18;

  float broadFlow = fbm3(q * 0.62 + drift * 0.42 + vec3(4.1, 2.8, 7.3));
  float mediumFlow = fbm3(q * 1.08 - drift.yzx * 0.52 + vec3(8.4, 6.3, 1.2));
  float reservoir = fbm3(q * 0.30 + drift.zxy * 0.22 + vec3(9.7, 3.2, 5.8));
  float detailHeat = fbm3(q * 1.85 + drift * 0.78 + vec3(2.7, 5.1, 8.2));

  // Large connected bodies, with a small amount of secondary structure.
  // Smooth time-varying thresholds make regions widen, pinch off and join.
  float magma = broadFlow * 0.70 + mediumFlow * 0.20 + reservoir * 0.10;
  float edgeAA = clamp(fwidth(magma) * 1.35, 0.008, 0.045);
  float body = smoothstep(0.485 - edgeAA, 0.585 + edgeAA, magma);
  float shoulder = smoothstep(0.43 - edgeAA, 0.55 + edgeAA, magma);
  float pools = smoothstep(0.70, 0.86, reservoir) * 0.44;

  // Bubbles of trapped gas periodically swell under the melt. Their influence
  // is broad and independent of flow direction, rather than sliding linework.
  float bubbleField = fbm3(q * 0.48 + vec3(t * 0.021, -t * 0.017, t * 0.014) + vec3(1.8, 6.4, 3.2));
  float bubbleAA = clamp(fwidth(bubbleField) * 1.2, 0.01, 0.05);
  float bubbles = smoothstep(0.66 - bubbleAA, 0.82 + bubbleAA, bubbleField);
  float bubblePulse = 0.78 + 0.22 * sin(t * 0.82 + detailHeat * 5.4);

  // A second low-frequency field changes which areas are hot. Unlike a static
  // mask over contour lines, this changes the actual connected magma shapes.
  float life = fbm3(q * 0.54 + vec3(t * 0.037, -t * 0.029, t * 0.023) + vec3(6.1, 2.5, 9.3));
  float activity = smoothstep(0.34, 0.70, life);
  float mask = clamp(max(shoulder * 0.76, pools) * mix(0.52, 1.0, activity) * bubblePulse, 0.0, 0.82);
  if (mask < 0.006) discard;

  float core = smoothstep(0.565, 0.67, magma + detailHeat * 0.055);
  float temperature = clamp(0.24 + core * 0.48 + pools * 0.28 + bubbles * 0.16 + detailHeat * 0.13, 0.0, 1.0);
  vec3 colour = heat(temperature);
  float coolingRim = smoothstep(0.47, 0.57, magma) * (1.0 - smoothstep(0.57, 0.65, magma));
  colour = mix(colour * 0.58, colour, coolingRim * 0.65);
  gl_FragColor = vec4(colour * 1.12, mask);
}
`;

const HOT_WGSL = `
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) point: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> Varyings {
  var out: Varyings;
  var p = position;
  if (material.uLocal > 0.5) { p *= 1.002; }
  else { p += normalize(normal) * 0.0015; }
  out.point = position;
  out.position = object.projectionMatrix * object.modelViewMatrix * vec4f(p, 1.0);
  return out;
}

fn hash31(p: vec3f) -> f32 {
  var q = fract(p * 0.1031);
  q += dot(q, q.yzx + vec3f(33.33));
  return fract((q.x + q.y) * q.z);
}

fn noise3(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (vec3f(3.0) - 2.0 * f);
  let a = hash31(i + vec3f(0.0, 0.0, 0.0));
  let b = hash31(i + vec3f(1.0, 0.0, 0.0));
  let c = hash31(i + vec3f(0.0, 1.0, 0.0));
  let d = hash31(i + vec3f(1.0, 1.0, 0.0));
  let e = hash31(i + vec3f(0.0, 0.0, 1.0));
  let f1 = hash31(i + vec3f(1.0, 0.0, 1.0));
  let g = hash31(i + vec3f(0.0, 1.0, 1.0));
  let h = hash31(i + vec3f(1.0, 1.0, 1.0));
  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f1, u.x), mix(g, h, u.x), u.y),
    u.z
  );
}

fn fbm3(p0: vec3f) -> f32 {
  var p = p0;
  var sum = 0.0;
  var amp = 0.5;
  for (var i = 0; i < 4; i++) {
    sum += noise3(p) * amp;
    p = p.yzx * 2.01 + vec3f(13.1, 7.7, 3.3);
    amp *= 0.5;
  }
  return sum / 0.9375;
}

fn heat(x: f32) -> vec3f {
  var c = mix(vec3f(0.20, 0.009, 0.001), vec3f(0.66, 0.045, 0.003), smoothstep(0.12, 0.48, x));
  c = mix(c, vec3f(1.0, 0.22, 0.012), smoothstep(0.42, 0.76, x));
  c = mix(c, vec3f(1.0, 0.62, 0.13), smoothstep(0.73, 0.94, x));
  return mix(c, vec3f(1.0, 0.88, 0.52), smoothstep(0.94, 1.0, x));
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = select(in.point, normalize(in.point), material.uLocal > 0.5) * material.uScale;
  let drift = vec3f(t * 0.032, -t * 0.024, t * 0.019);
  let warp = vec3f(
    fbm3(p * 0.42 + drift + vec3f(2.1, 5.4, 1.7)),
    fbm3(p.yzx * 0.42 - drift.zxy + vec3f(7.2, 1.8, 4.3)),
    fbm3(p.zxy * 0.42 + drift.yzx + vec3f(3.4, 8.1, 6.2))
  );
  let q = p * 0.78 + (warp - vec3f(0.5)) * 1.18;

  let broadFlow = fbm3(q * 0.62 + drift * 0.42 + vec3f(4.1, 2.8, 7.3));
  let mediumFlow = fbm3(q * 1.08 - drift.yzx * 0.52 + vec3f(8.4, 6.3, 1.2));
  let reservoir = fbm3(q * 0.30 + drift.zxy * 0.22 + vec3f(9.7, 3.2, 5.8));
  let detailHeat = fbm3(q * 1.85 + drift * 0.78 + vec3f(2.7, 5.1, 8.2));
  let magma = broadFlow * 0.70 + mediumFlow * 0.20 + reservoir * 0.10;
  let edgeAA = clamp(fwidth(magma) * 1.35, 0.008, 0.045);
  let body = smoothstep(0.485 - edgeAA, 0.585 + edgeAA, magma);
  let shoulder = smoothstep(0.43 - edgeAA, 0.55 + edgeAA, magma);
  let pools = smoothstep(0.70, 0.86, reservoir) * 0.44;
  let bubbleField = fbm3(q * 0.48 + vec3f(t * 0.021, -t * 0.017, t * 0.014) + vec3f(1.8, 6.4, 3.2));
  let bubbleAA = clamp(fwidth(bubbleField) * 1.2, 0.01, 0.05);
  let bubbles = smoothstep(0.66 - bubbleAA, 0.82 + bubbleAA, bubbleField);
  let bubblePulse = 0.78 + 0.22 * sin(t * 0.82 + detailHeat * 5.4);
  let life = fbm3(q * 0.54 + vec3f(t * 0.037, -t * 0.029, t * 0.023) + vec3f(6.1, 2.5, 9.3));
  let activity = smoothstep(0.34, 0.70, life);
  let mask = clamp(max(shoulder * 0.76, pools) * mix(0.52, 1.0, activity) * bubblePulse, 0.0, 0.82);
  if (mask < 0.006) { discard; }
  let core = smoothstep(0.565, 0.67, magma + detailHeat * 0.055);
  let temperature = clamp(0.24 + core * 0.48 + pools * 0.28 + bubbles * 0.16 + detailHeat * 0.13, 0.0, 1.0);
  var colour = heat(temperature);
  let coolingRim = smoothstep(0.47, 0.57, magma) * (1.0 - smoothstep(0.57, 0.65, magma));
  colour = mix(colour * 0.58, colour, coolingRim * 0.65);
  return vec4f(colour * 1.12, mask);
}
`;

function writePixel(data, offset, rgb, alpha = 255) {
  data[offset] = rgb[0];
  data[offset + 1] = rgb[1];
  data[offset + 2] = rgb[2];
  data[offset + 3] = alpha;
}

function textureSet(GFX, mapping, scale) {
  let cache = textureCache.get(GFX);
  if (!cache) { cache = new Map(); textureCache.set(GFX, cache); }
  const key = mapping + ':' + scale.toFixed(3);
  if (cache.has(key)) return cache.get(key);

  const width = mapping === 'local' ? 1024 : 1024;
  const height = mapping === 'local' ? 512 : 512;
  const albedo = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const sample = mapping === 'local' ? sphereField(u, v, scale) : floorField(u, v, scale);
      const i = (y * width + x) * 4;
      writePixel(albedo, i, sample.albedo);
      writePixel(relief, i, [sample.relief, sample.relief, sample.relief]);
    }
  }

  // Make wrap borders bit-identical. The spherical poles are one direction,
  // therefore each pole row is constant as well.
  for (let y = 0; y < height; y++) {
    const first = y * width * 4;
    const last = (y * width + width - 1) * 4;
    for (let c = 0; c < 4; c++) {
      albedo[last + c] = albedo[first + c];
      relief[last + c] = relief[first + c];
    }
  }
  if (mapping === 'local') {
    for (const y of [0, height - 1]) {
      const base = y * width * 4;
      const first = [albedo[base], albedo[base + 1], albedo[base + 2], albedo[base + 3]];
      const bump = [relief[base], relief[base + 1], relief[base + 2], relief[base + 3]];
      for (let x = 1; x < width; x++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          albedo[i + c] = first[c];
          relief[i + c] = bump[c];
        }
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      const first = x * 4;
      const last = ((height - 1) * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        albedo[last + c] = albedo[first + c];
        relief[last + c] = relief[first + c];
      }
    }
  }

  const make = (data, colourSpace, wrapT) => {
    const tex = new GFX.DataTexture(data, width, height, 'rgba8unorm');
    tex.colorSpace = colourSpace;
    tex.wrapS = GFX.RepeatWrapping;
    tex.wrapT = wrapT;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = GFX.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  };
  const result = {
    map: make(albedo, GFX.SRGBColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    bump: make(relief, GFX.NoColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    width, height,
  };
  cache.set(key, result);
  return result;
}


/**
 * Subdivide a lava surface and apply Slimey-style localized gas swells.
 * The same height field is sampled every frame, so the surface inflates and
 * subsides in place rather than translating its texture. Dungeon floors are
 * horizontal (Y up); the deformer preserves the source surface and attributes.
 */
export function createLavaBubbler(GFX, sourceGeometry, { segments = 6, spacing = 1.05 } = {}) {
  const sourcePosition = sourceGeometry.attributes.position;
  if (!sourcePosition || sourcePosition.count < 3) throw new Error('lava bubbler needs triangle geometry');
  if (!Number.isInteger(segments) || segments < 2 || segments > 12) throw new Error('lava bubble segments must be 2–12');
  if (!Number.isFinite(spacing) || spacing <= 0) throw new Error('lava bubble spacing must be positive');

  const sourceIndex = sourceGeometry.index;
  const triangleCount = (sourceIndex ? sourceIndex.count : sourcePosition.count) / 3;
  if (!Number.isInteger(triangleCount)) throw new Error('lava bubbler geometry must contain complete triangles');
  const subdivisions = triangleCount * segments * segments * 3 > 360000 ? 4 : segments;
  const output = Object.fromEntries(Object.entries(sourceGeometry.attributes).map(([name]) => [name, []]));

  const vertexIndex = (i) => sourceIndex ? sourceIndex.getX(i) : i;
  const point = (ia, ib, ic, i, j, n) => {
    const wb = i / n, wc = j / n, wa = 1 - wb - wc;
    for (const [name, attribute] of Object.entries(sourceGeometry.attributes)) {
      const list = output[name];
      const base = ia * attribute.itemSize, bi = ib * attribute.itemSize, ci = ic * attribute.itemSize;
      for (let k = 0; k < attribute.itemSize; k++) {
        list.push(
          attribute.array[base + k] * wa +
          attribute.array[bi + k] * wb +
          attribute.array[ci + k] * wc
        );
      }
    }
  };
  const emit = (tri, a, b, c) => {
    point(tri[0], tri[1], tri[2], a[0], a[1], subdivisions);
    point(tri[0], tri[1], tri[2], b[0], b[1], subdivisions);
    point(tri[0], tri[1], tri[2], c[0], c[1], subdivisions);
  };
  for (let t = 0; t < (sourceIndex ? sourceIndex.count : sourcePosition.count); t += 3) {
    const tri = [vertexIndex(t), vertexIndex(t + 1), vertexIndex(t + 2)];
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions - i; j++) {
        emit(tri, [i,j], [i+1,j], [i,j+1]);
        if (j < subdivisions - i - 1) emit(tri, [i+1,j], [i+1,j+1], [i,j+1]);
      }
    }
  }

  const geometry = new GFX.BufferGeometry();
  for (const [name, values] of Object.entries(output)) {
    const source = sourceGeometry.attributes[name];
    geometry.setAttribute(name, new GFX.BufferAttribute(new Float32Array(values), source.itemSize, source.normalized));
  }
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  if (!normal) throw new Error('lava bubbler needs surface normals');
  const basePositions = position.array.slice();
  const baseNormals = normal.array.slice();

  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<position.count;i++){
    minX=Math.min(minX,position.getX(i)); maxX=Math.max(maxX,position.getX(i));
    minZ=Math.min(minZ,position.getZ(i)); maxZ=Math.max(maxZ,position.getZ(i));
  }

  const hash = (x, z, seed) => {
    let h = Math.imul(x | 0, 0x8da6b343)
      ^ Math.imul(z | 0, 0xd8163841)
      ^ Math.imul(seed | 0, 0xcb1ab31f);
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };

  const cells = new Map();
  for (let iz = Math.floor(minZ / spacing) - 1; iz <= Math.ceil(maxZ / spacing) + 1; iz++) {
    for (let ix = Math.floor(minX / spacing) - 1; ix <= Math.ceil(maxX / spacing) + 1; ix++) {
      const rx = hash(ix, iz, 17);
      const rz = hash(ix, iz, 41);
      cells.set(ix + ',' + iz, {
        x: (ix + 0.2 + rx * 0.6) * spacing,
        z: (iz + 0.2 + rz * 0.6) * spacing,
        radius: (0.34 + hash(ix, iz, 73) * 0.24) * spacing,
        height: 0.10 + hash(ix, iz, 97) * 0.085,
        phase: hash(ix, iz, 131) * Math.PI * 2,
        speed: 0.68 + hash(ix, iz, 157) * 0.46,
      });
    }
  }

  const sample = (x, z, time) => {
    let height = 0, dx = 0, dz = 0;
    const ix = Math.floor(x / spacing);
    const iz = Math.floor(z / spacing);
    for (let oz = -1; oz <= 1; oz++) {
      for (let ox = -1; ox <= 1; ox++) {
        const bubble = cells.get((ix + ox) + ',' + (iz + oz));
        if (!bubble) continue;
        const px = x - bubble.x;
        const pz = z - bubble.z;
        const pulse = 0.5 + 0.5 * Math.sin(time * bubble.speed + bubble.phase);
        const rise = pulse * pulse;
        const radius = bubble.radius * (0.82 + 0.24 * pulse);
        const inverseRadiusSq = 1 / (radius * radius);
        const dome = bubble.height * rise * Math.exp(-3.4 * (px * px + pz * pz) * inverseRadiusSq);
        height += dome;
        dx += dome * (-6.8 * px * inverseRadiusSq);
        dz += dome * (-6.8 * pz * inverseRadiusSq);
      }
    }
    return [height, dx, dz];
  };

  const update = (time) => {
    for (let i = 0; i < position.count; i++) {
      const k = i * 3;
      const x = basePositions[k], y = basePositions[k + 1], z = basePositions[k + 2];
      const ny = Math.max(0, baseNormals[k + 1]);
      if (ny < 0.35) {
        position.array[k] = x;
        position.array[k + 1] = y;
        position.array[k + 2] = z;
        normal.array[k] = baseNormals[k];
        normal.array[k + 1] = baseNormals[k + 1];
        normal.array[k + 2] = baseNormals[k + 2];
        continue;
      }

      const [height, dhx, dhz] = sample(x, z, time);
      position.array[k] = x;
      position.array[k + 1] = y + height * ny;
      position.array[k + 2] = z;

      let nx = baseNormals[k] - dhx * ny;
      let nz = baseNormals[k + 2] - dhz * ny;
      const normalLength = Math.hypot(nx, baseNormals[k + 1], nz) || 1;
      normal.array[k] = nx / normalLength;
      normal.array[k + 1] = baseNormals[k + 1] / normalLength;
      normal.array[k + 2] = nz / normalLength;
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  };

  geometry.computeBoundingSphere();
  return {geometry,update,segments:subdivisions,bubbleCount:cells.size};
}


/**
 * A lava material that behaves like the engine's metal finishes: physical
 * reflections and surface relief, with an emissive molten layer where needed.
 *
 * World mapping is a seamless repeating floor texture. Local mapping is a
 * spherical 3D sample that follows a deforming mesh and has exact UV borders.
 */
export function createLavaMaterial(GFX, { mapping = 'world', scale = 1.6 } = {}) {
  if (mapping !== 'world' && mapping !== 'local') throw new Error('unknown lava mapping: ' + mapping);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('lava scale must be a positive finite number');

  const maps = textureSet(GFX, mapping, scale);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'lava-basalt',
    color: new GFX.Color('#ffffff'),
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: mapping === 'local' ? 0.014 : 0.02,
    metalness: 0.025,
    roughness: 0.62,
    clearcoat: 0.14,
    clearcoatRoughness: 0.46,
    envMapIntensity: 0.62,
    emissive: new GFX.Color('#100300'),
    emissiveIntensity: 0.075,
    toneMapped: false,
  });

  const hotMaterial = new GFX.ShaderMaterial({
    name: 'lava-molten-flow',
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: mapping === 'local' ? 2.2 : 0.78 },
      uLocal: { value: mapping === 'local' ? 1 : 0 },
    },
    glsl: { vertex: HOT_VERTEX, fragment: HOT_FRAGMENT },
    wgsl: HOT_WGSL,
    transparent: true,
    blending: GFX.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: GFX.FrontSide,
  });
  material.hotMaterial = hotMaterial;
  material.textures = maps;
  material.mapping = mapping;

  let currentTime = 0;
  let brightness = 1;
  const applyTime = () => {
    // The crust stays anchored in both modes. The molten shader evolves its
    // own 3D field and the floor geometry is physically bubbled by its caller.
    hotMaterial.uniforms.uTime.value = currentTime;
  };

  const time = {};
  Object.defineProperty(time, 'value', {
    enumerable: true,
    get: () => currentTime,
    set: (value) => { if (Number.isFinite(value)) { currentTime = value; applyTime(); } },
  });
  const bright = {};
  Object.defineProperty(bright, 'value', {
    enumerable: true,
    get: () => brightness,
    set: (value) => {
      if (Number.isFinite(value)) {
        brightness = value;
        material.color.setRGB(brightness, brightness, brightness);
      }
    },
  });
  material.uniforms = { uTime: time, uBright: bright };
  material.update = (t) => { material.uniforms.uTime.value = t; return material; };
  material.hotMaterial = hotMaterial;
  return material;
}
