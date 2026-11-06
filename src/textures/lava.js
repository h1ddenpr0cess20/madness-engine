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
  return { albedo, glowRGB: [0, 0, 0], alpha: 0, relief };
}

function floorField(u, v, scale) {
  const cells = Math.max(2, Math.round(2.4 + scale * 0.65));
  const warpU = (fbm2(u, v, 41, 2, 3) - 0.5) * 0.11;
  const warpV = (fbm2(u, v, 47, 2, 3) - 0.5) * 0.11;
  const uu = (u + warpU + 1) % 1;
  const vv = (v + warpV + 1) % 1;
  const flow = fbm2(uu, vv, 53, cells, 4);
  const bend = fbm2(uu, vv, 59, 2, 3);
  const contour = Math.abs(flow - (0.505 + (bend - 0.5) * 0.11));
  const channel = 1 - smooth(0.025, 0.075, contour);
  const core = 1 - smooth(0.006, 0.022, contour);
  const pool = smooth(0.78, 0.89, fbm2(uu, vv, 61, 2, 3)) * 0.58;
  const molten = Math.max(channel, pool);

  const stone = fbm2(uu, vv, 67, 8, 4);
  const grain = fbm2(uu, vv, 71, 22, 2);
  const warmEdge = Math.exp(-contour * 36) * (1 - core);
  const base = [
    mix(9, 36, stone) * (0.84 + grain * 0.28) + warmEdge * 20,
    mix(10, 23, stone) * (0.84 + grain * 0.28) + warmEdge * 4,
    mix(15, 20, stone) * (0.84 + grain * 0.28),
  ];
  const temp = clamp01(0.28 + channel * 0.34 + core * 0.52 + pool * 0.27);
  const moltenRGB = heatColour(temp);
  const albedo = base.map((c, k) => Math.round(mix(c, moltenRGB[k], molten)));
  const glowRGB = heatColour(clamp01(0.48 + core * 0.5 + pool * 0.16));
  const alpha = Math.round(clamp01(channel * 0.98 + pool * 0.82) * 245);
  const relief = Math.round(clamp01(0.62 + (stone - 0.5) * 0.12 + (grain - 0.5) * 0.05 - molten * 0.19) * 255);
  return { albedo, glowRGB, alpha, relief };
}



const HOT_VERTEX = \`
varying vec3 vMoltenPoint;
void main() {
  vec3 p = position * 1.002;
  vMoltenPoint = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
}
\`;

const HOT_FRAGMENT = \`
uniform float uTime;
uniform float uScale;
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
  vec3 c = mix(vec3(0.24, 0.012, 0.002), vec3(0.82, 0.075, 0.006), smoothstep(0.05, 0.48, x));
  c = mix(c, vec3(1.0, 0.31, 0.025), smoothstep(0.42, 0.78, x));
  return mix(c, vec3(1.0, 0.78, 0.35), smoothstep(0.82, 1.0, x));
}

void main() {
  float t = uTime;
  vec3 p = normalize(vMoltenPoint) * uScale;
  vec3 drift = vec3(t * 0.055, -t * 0.037, t * 0.029);

  // A gently advected, domain-warped field: deliberately only one main
  // channel field, so the surface has a few broad rivers instead of line noise.
  vec3 warp = vec3(
    fbm3(p * 0.42 + drift + vec3(2.1, 5.4, 1.7)),
    fbm3(p.yzx * 0.42 - drift.zxy + vec3(7.2, 1.8, 4.3)),
    fbm3(p.zxy * 0.42 + drift.yzx + vec3(3.4, 8.1, 6.2))
  );
  vec3 q = p * 0.9 + (warp - 0.5) * 0.72;

  float field = fbm3(q * 0.88 + drift * 0.28 + vec3(4.1, 2.8, 7.3));
  float bend = fbm3(q * 0.52 - drift * 0.17 + vec3(8.4, 6.3, 1.2));
  float centre = 0.505 + (bend - 0.5) * 0.12;
  float distance = abs(field - centre);

  // Derivative-aware widths keep the soft lava edges antialiased as the orb
  // fills the screen or the camera moves closer.
  float edgeAA = clamp(fwidth(distance) * 1.25, 0.001, 0.018);
  float channel = 1.0 - smoothstep(0.025 - edgeAA, 0.105 + edgeAA, distance);
  float core = 1.0 - smoothstep(max(0.0, 0.004 - edgeAA * 0.35), 0.027 + edgeAA, distance);
  float poolField = fbm3(q * 0.44 - drift * 0.12 + vec3(9.7, 3.2, 5.8));
  float poolAA = clamp(fwidth(poolField) * 1.25, 0.008, 0.045);
  float pools = smoothstep(0.73 - poolAA, 0.86 + poolAA, poolField) * 0.35;

  // This independent, slow life field fades individual sections locally;
  // new regions kindle as its smooth noise moves through the channel network.
  float life = fbm3(q * 0.58 + drift * 0.19 + vec3(t * 0.012, 6.1, 2.7));
  float lifeAA = clamp(fwidth(life) * 1.35, 0.008, 0.045);
  float activity = smoothstep(0.32 - lifeAA, 0.68 + lifeAA, life);
  float thermal = fbm3(q * 1.12 - drift * 0.43 + vec3(2.7, t * 0.018, 8.2));
  float pulse = 0.84 + 0.16 * sin(t * 0.72 + thermal * 4.2);
  float mask = clamp(max(channel * 0.68, pools) * activity * pulse, 0.0, 0.72);

  float temperature = clamp(0.28 + core * 0.55 + pools * 0.48 + thermal * 0.12, 0.0, 1.0);
  vec3 colour = heat(temperature);
  float edgeHeat = exp(-distance * 28.0) * (1.0 - core);
  colour = mix(colour * 0.66, colour, 1.0 - edgeHeat * 0.32);
  gl_FragColor = vec4(colour * 1.12, mask);
}
\`;

const HOT_WGSL = \`
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) point: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f) -> Varyings {
  var out: Varyings;
  let p = position * 1.002;
  out.point = p;
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
  var c = mix(vec3f(0.24, 0.012, 0.002), vec3f(0.82, 0.075, 0.006), smoothstep(0.05, 0.48, x));
  c = mix(c, vec3f(1.0, 0.31, 0.025), smoothstep(0.42, 0.78, x));
  return mix(c, vec3f(1.0, 0.78, 0.35), smoothstep(0.82, 1.0, x));
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = normalize(in.point) * material.uScale;
  let drift = vec3f(t * 0.055, -t * 0.037, t * 0.029);

  let warp = vec3f(
    fbm3(p * 0.42 + drift + vec3f(2.1, 5.4, 1.7)),
    fbm3(p.yzx * 0.42 - drift.zxy + vec3f(7.2, 1.8, 4.3)),
    fbm3(p.zxy * 0.42 + drift.yzx + vec3f(3.4, 8.1, 6.2))
  );
  let q = p * 0.9 + (warp - vec3f(0.5)) * 0.72;

  let field = fbm3(q * 0.88 + drift * 0.28 + vec3f(4.1, 2.8, 7.3));
  let bend = fbm3(q * 0.52 - drift * 0.17 + vec3f(8.4, 6.3, 1.2));
  let centre = 0.505 + (bend - 0.5) * 0.12;
  let distance = abs(field - centre);

  // Derivative-aware widths smooth the channels at close camera distances.
  let edgeAA = clamp(fwidth(distance) * 1.25, 0.001, 0.018);
  let channel = 1.0 - smoothstep(0.025 - edgeAA, 0.105 + edgeAA, distance);
  let core = 1.0 - smoothstep(max(0.0, 0.004 - edgeAA * 0.35), 0.027 + edgeAA, distance);
  let poolField = fbm3(q * 0.44 - drift * 0.12 + vec3f(9.7, 3.2, 5.8));
  let poolAA = clamp(fwidth(poolField) * 1.25, 0.008, 0.045);
  let pools = smoothstep(0.73 - poolAA, 0.86 + poolAA, poolField) * 0.35;

  let life = fbm3(q * 0.58 + drift * 0.19 + vec3f(t * 0.012, 6.1, 2.7));
  let lifeAA = clamp(fwidth(life) * 1.35, 0.008, 0.045);
  let activity = smoothstep(0.32 - lifeAA, 0.68 + lifeAA, life);
  let thermal = fbm3(q * 1.12 - drift * 0.43 + vec3f(2.7, t * 0.018, 8.2));
  let pulse = 0.84 + 0.16 * sin(t * 0.72 + thermal * 4.2);
  let mask = clamp(max(channel * 0.68, pools) * activity * pulse, 0.0, 0.72);

  let temperature = clamp(0.28 + core * 0.55 + pools * 0.48 + thermal * 0.12, 0.0, 1.0);
  var colour = heat(temperature);
  let edgeHeat = exp(-distance * 28.0) * (1.0 - core);
  colour = mix(colour * 0.66, colour, 1.0 - edgeHeat * 0.32);
  return vec4f(colour * 1.12, mask);
}
\`;

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
  const glow = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const sample = mapping === 'local' ? sphereField(u, v, scale) : floorField(u, v, scale);
      const i = (y * width + x) * 4;
      writePixel(albedo, i, sample.albedo);
      writePixel(glow, i, sample.glowRGB, sample.alpha);
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
      glow[last + c] = glow[first + c];
      relief[last + c] = relief[first + c];
    }
  }
  if (mapping === 'local') {
    for (const y of [0, height - 1]) {
      const base = y * width * 4;
      const first = [albedo[base], albedo[base + 1], albedo[base + 2], albedo[base + 3]];
      const hot = [glow[base], glow[base + 1], glow[base + 2], glow[base + 3]];
      const bump = [relief[base], relief[base + 1], relief[base + 2], relief[base + 3]];
      for (let x = 1; x < width; x++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          albedo[i + c] = first[c];
          glow[i + c] = hot[c];
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
        glow[last + c] = glow[first + c];
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
    hot: make(glow, GFX.SRGBColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    bump: make(relief, GFX.NoColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    width, height,
  };
  cache.set(key, result);
  return result;
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

  const hotMaterial = mapping === 'local' ? new GFX.ShaderMaterial({
    name: 'lava-molten-flow',
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 2.2 },
    },
    glsl: { vertex: HOT_VERTEX, fragment: HOT_FRAGMENT },
    wgsl: HOT_WGSL,
    transparent: true,
    blending: GFX.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: GFX.FrontSide,
  }) : null;
  material.hotMaterial = hotMaterial;
  material.textures = maps;
  material.mapping = mapping;

  let currentTime = 0;
  let brightness = 1;
  const applyTime = () => {
    // Keep local basalt anchored to the deforming surface. The molten layer
    // receives time directly and fades/re-forms in its own smooth 3D field.
    // World-space floor textures retain a slow continuous drift.
    const u = currentTime * (mapping === 'local' ? 0 : 0.014);
    const v = currentTime * (mapping === 'local' ? 0 : 0.005);
    if (mapping === 'world') {
      for (const tex of [maps.map, maps.hot, maps.bump]) tex.offset.set(u % 1, v % 1);
    }
    if (hotMaterial) hotMaterial.uniforms.uTime.value = currentTime;
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
