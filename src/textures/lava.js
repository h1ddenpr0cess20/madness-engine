/**
 * Lava, as a shader of its own (GLSL for WebGL 2, WGSL for WebGPU, the same
 * picture from each). A crust of dark basalt plates drifts and grinds over
 * it, each plate domed and grainy, fine cracks crazing it, its edges lit
 * from the melt beneath; between the plates the melt shows in the cracks,
 * hottest in the middle of them, the colour of the heat — red, orange,
 * yellow, nearly white — streaming as it moves; pools of it well up and
 * crust over again, embers wink on the crust, bubbles swell and burst, and
 * the whole of it pulses. It lights itself: what it draws is what you see,
 * whatever the lights.
 */

const FLOOR_GLSL_VERTEX = `varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const FLOOR_GLSL_FRAGMENT = `uniform float uTime;
uniform float uBright;
varying vec3 vWorld;
float hash1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), u.x), mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
// The crust's plates: distance to the nearest plate's middle, and how far from the crack to the next.
vec2 plates(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.5 + 0.4 * sin(t * 0.3 + 6.2831 * hash2(i + g));
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2(d1, d2 - d1);
}
// The colour of the heat, 0 (dull red) to 1 (nearly white).
vec3 glow(float h) {
  vec3 c = mix(vec3(0.3, 0.025, 0.0), vec3(0.95, 0.22, 0.02), smoothstep(0.0, 0.45, h));
  c = mix(c, vec3(1.0, 0.6, 0.12), smoothstep(0.4, 0.75, h));
  return mix(c, vec3(1.0, 0.94, 0.72), smoothstep(0.78, 1.0, h));
}
void main() {
  float t = uTime;
  vec2 p = vWorld.xz;
  vec2 warp = vec2(fbm(p * 0.7 + vec2(t * 0.05, 0.0)), fbm(p * 0.7 + vec2(3.1, -t * 0.04)));
  vec2 q = p * 1.5 + warp * 1.3;
  vec2 v = plates(q, t);
  vec2 w = plates(q * 3.1 + vec2(5.2, 1.3), t * 0.7);
  float crack = 1.0 - smoothstep(0.02, 0.15, v.y);
  float fine = (1.0 - smoothstep(0.0, 0.06, w.y)) * 0.55 * smoothstep(0.08, 0.3, v.y);
  float pool = smoothstep(0.52, 0.78, fbm(p * 0.8 + vec2(t * 0.06, -t * 0.045)));
  float heat = clamp(max(crack, fine) + pool, 0.0, 1.0);
  // The crust: basalt, each plate domed (lighter to its middle) and grainy, its edges lit from below.
  float dome = 1.0 - smoothstep(0.0, 0.62, v.x);
  float grain = vnoise(q * 7.0) * 0.6 + vnoise(q * 17.0) * 0.4;
  vec3 crust = vec3(0.1, 0.048, 0.04) * (0.55 + 0.7 * dome) * (0.65 + 0.7 * grain);
  crust += glow(0.3) * exp(-v.y * 10.0) * 0.6;
  // Embers winking on the crust.
  vec2 ec = floor(q * 22.0);
  float ember = step(0.986, hash1(ec)) * (1.0 - smoothstep(0.08, 0.28, length(fract(q * 22.0) - 0.5))) * (0.5 + 0.5 * sin(t * 3.0 + hash1(ec + 3.0) * 40.0));
  crust += vec3(1.0, 0.42, 0.08) * ember * 0.7;
  // The melt: hotter the deeper in the crack or the pool, streaming as it moves.
  float flow = fbm(p * 2.2 + warp * 2.0 + vec2(t * 0.25, t * 0.1));
  float h = clamp(0.35 + 0.65 * heat * heat + (flow - 0.5) * 0.55, 0.0, 1.0);
  float pulse = 0.85 + 0.15 * sin(t * 1.9 + fbm(p * 1.7) * 6.0);
  vec3 col = mix(crust, glow(h) * pulse, heat);
  // Bubbles: here and there a swelling bright ring that bursts.
  vec2 cell = floor(p * 1.25);
  float pick = hash1(cell);
  if (pick > 0.72) {
    vec2 at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.25;
    float phase = fract(t * (0.18 + pick * 0.2) + pick * 9.0);
    float r = phase * 0.28, d = length(p - at);
    float ring = (1.0 - smoothstep(0.0, 0.035, abs(d - r))) * (1.0 - phase);
    float bulge = (1.0 - smoothstep(0.0, max(r, 0.001), d)) * (1.0 - phase) * 0.6;
    col = mix(col, glow(0.85), clamp((ring + bulge) * (0.35 + 0.65 * pool), 0.0, 1.0));
  }
  gl_FragColor = vec4(col * uBright, 1.0);
}`;

const FLOOR_WGSL = `struct Varyings { @builtin(position) position: vec4f, @location(0) world: vec3f };
@vertex fn vs(@location(0) position: vec3f) -> Varyings {
  var out: Varyings;
  let world = object.modelMatrix * vec4f(position, 1.0);
  out.world = world.xyz;
  out.position = object.projectionMatrix * object.viewMatrix * world;
  return out;
}
fn hash1(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453); }
fn hash2(p: vec2f) -> vec2f { return fract(sin(vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)))) * 43758.5453); }
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash1(i), hash1(i + vec2f(1.0, 0.0)), u.x), mix(hash1(i + vec2f(0.0, 1.0)), hash1(i + vec2f(1.0, 1.0)), u.x), u.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var s = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
fn plates(p: vec2f, t: f32) -> vec2f {
  let i = floor(p);
  let f = fract(p);
  var d1 = 8.0;
  var d2 = 8.0;
  for (var y = -2; y <= 2; y++) {
    for (var x = -2; x <= 2; x++) {
      let g = vec2f(f32(x), f32(y));
      let o = 0.5 + 0.4 * sin(t * 0.3 + 6.2831 * hash2(i + g));
      let d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2f(d1, d2 - d1);
}
fn glow(h: f32) -> vec3f {
  var c = mix(vec3f(0.3, 0.025, 0.0), vec3f(0.95, 0.22, 0.02), smoothstep(0.0, 0.45, h));
  c = mix(c, vec3f(1.0, 0.6, 0.12), smoothstep(0.4, 0.75, h));
  return mix(c, vec3f(1.0, 0.94, 0.72), smoothstep(0.78, 1.0, h));
}
@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = in.world.xz;
  let warp = vec2f(fbm(p * 0.7 + vec2f(t * 0.05, 0.0)), fbm(p * 0.7 + vec2f(3.1, -t * 0.04)));
  let q = p * 1.5 + warp * 1.3;
  let v = plates(q, t);
  let w = plates(q * 3.1 + vec2f(5.2, 1.3), t * 0.7);
  let crack = 1.0 - smoothstep(0.02, 0.15, v.y);
  let fine = (1.0 - smoothstep(0.0, 0.06, w.y)) * 0.55 * smoothstep(0.08, 0.3, v.y);
  let pool = smoothstep(0.52, 0.78, fbm(p * 0.8 + vec2f(t * 0.06, -t * 0.045)));
  let heat = clamp(max(crack, fine) + pool, 0.0, 1.0);
  let dome = 1.0 - smoothstep(0.0, 0.62, v.x);
  let grain = vnoise(q * 7.0) * 0.6 + vnoise(q * 17.0) * 0.4;
  var crust = vec3f(0.1, 0.048, 0.04) * (0.55 + 0.7 * dome) * (0.65 + 0.7 * grain);
  crust += glow(0.3) * exp(-v.y * 10.0) * 0.6;
  let ec = floor(q * 22.0);
  let ember = step(0.986, hash1(ec)) * (1.0 - smoothstep(0.08, 0.28, length(fract(q * 22.0) - 0.5))) * (0.5 + 0.5 * sin(t * 3.0 + hash1(ec + 3.0) * 40.0));
  crust += vec3f(1.0, 0.42, 0.08) * ember * 0.7;
  let flow = fbm(p * 2.2 + warp * 2.0 + vec2f(t * 0.25, t * 0.1));
  let h = clamp(0.35 + 0.65 * heat * heat + (flow - 0.5) * 0.55, 0.0, 1.0);
  let pulse = 0.85 + 0.15 * sin(t * 1.9 + fbm(p * 1.7) * 6.0);
  var col = mix(crust, glow(h) * pulse, heat);
  let cell = floor(p * 1.25);
  let pick = hash1(cell);
  if (pick > 0.72) {
    let at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.25;
    let phase = fract(t * (0.18 + pick * 0.2) + pick * 9.0);
    let r = phase * 0.28;
    let d = length(p - at);
    let ring = (1.0 - smoothstep(0.0, 0.035, abs(d - r))) * (1.0 - phase);
    let bulge = (1.0 - smoothstep(0.0, max(r, 0.001), d)) * (1.0 - phase) * 0.6;
    col = mix(col, glow(0.85), clamp((ring + bulge) * (0.35 + 0.65 * pool), 0.0, 1.0));
  }
  return vec4f(col * material.uBright, 1.0);
}`;

/**
 * The original single-pass lava floor shader. Its plate/crack/pool/bubble
 * treatment is intentionally preserved; world-space coordinates keep it
 * continuous across separate floor and pit meshes.
 */
export function createLavaFloorMaterial(GFX) {
  return new GFX.ShaderMaterial({
    name: 'lava',
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 } },
    glsl: { vertex: FLOOR_GLSL_VERTEX, fragment: FLOOR_GLSL_FRAGMENT },
    wgsl: FLOOR_WGSL,
    side: GFX.DoubleSide,
    toneMapped: false,
    depthWrite: true,
  });
}

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
varying vec3 vNormalView;
void main() {
  vec3 p = position;
  vNormalView = normalize(normalMatrix * normal);
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
varying vec3 vNormalView;

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

// Cracked basalt plates in 3D: distance to the nearest plate's middle, and the gap to the next (0 on a crack).
vec2 plates3(vec3 p, float t) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 c = i + g;
        vec3 h = vec3(hash31(c), hash31(c + vec3(17.0, 3.0, 9.0)), hash31(c + vec3(5.0, 29.0, 13.0)));
        vec3 o = 0.5 + 0.36 * sin(t * 0.12 + 6.2831 * h);
        float d = length(g + o - f);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
      }
    }
  }
  return vec2(d1, d2 - d1);
}

void main() {
  float t = uTime;
  vec3 p = (uLocal > 0.5 ? normalize(vMoltenPoint) : vMoltenPoint) * uScale;

  // Dark plates of crust with a bright network of melt between them, the
  // plates drifting and grinding so the cracks widen, pinch and shift.
  vec3 drift = vec3(t * 0.02, -t * 0.015, t * 0.012);
  vec3 warp = vec3(
    fbm3(p * 0.5 + drift),
    fbm3(p.yzx * 0.5 - drift + vec3(4.1, 2.2, 7.7)),
    fbm3(p.zxy * 0.5 + drift.yzx + vec3(8.3, 1.9, 5.5))
  ) - 0.5;
  vec3 q = p * 1.3 + warp * 1.1;
  vec2 v = plates3(q, t);
  vec2 w = plates3(q * 2.7 + vec3(3.1, 7.7, 1.3), t * 0.7);

  // Slowly, whole regions run hotter and cooler.
  float life = fbm3(q * 0.6 + vec3(t * 0.03, -t * 0.02, t * 0.025) + vec3(6.1, 2.5, 9.3));
  float activity = smoothstep(0.3, 0.7, life);

  float crack = 1.0 - smoothstep(0.0, 0.3, v.y);
  float core = 1.0 - smoothstep(0.0, 0.13, v.y);
  float fine = (1.0 - smoothstep(0.0, 0.07, w.y)) * 0.6 * smoothstep(0.12, 0.4, v.y);
  float flow = fbm3(q * 1.7 + drift * 3.0);
  float pulse = 0.86 + 0.14 * sin(t * 1.3 + flow * 6.0);

  // The colour of heat: yellow-white in the middle of a crack, orange at its edges, red where it dies out.
  float temperature = clamp((0.32 + 0.4 * crack + 0.4 * core + (flow - 0.5) * 0.35) * mix(0.82, 1.0, activity), 0.0, 1.0);
  vec3 colour = heat(temperature) * pulse * 1.4;
  float underglow = exp(-v.y * 6.0) * 0.4;
  float mask = clamp(max(clamp(crack + fine, 0.0, 1.0), underglow), 0.0, 1.0);
  if (mask < 0.01) discard;

  // The melt is wet and glassy: sharp highlights slide over it as it moves,
  // while the basalt crust (the shell) stays dull.
  vec3 jitter = vec3(
    noise3(p * 5.0 + vec3(1.3, t * 0.05, 0.0)),
    noise3(p * 5.0 + vec3(7.1, 2.2, t * 0.04)),
    noise3(p * 5.0 + vec3(3.7, 9.4, 1.1))
  ) - 0.5;
  vec3 nrm = normalize(normalize(vNormalView) + jitter * 0.55);
  vec3 hv = normalize(normalize(vec3(-0.45, 0.65, 0.6)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(nrm, hv), 0.0), 46.0);
  colour += vec3(1.0, 0.82, 0.55) * spec * 1.7 * smoothstep(0.3, 0.8, mask);
  gl_FragColor = vec4(colour, mask);
}
`;

const HOT_WGSL = `
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) point: vec3f,
  @location(1) normalView: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> Varyings {
  var out: Varyings;
  out.normalView = normalize(object.normalMatrix * normal);
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

fn plates3(p: vec3f, t: f32) -> vec2f {
  let i = floor(p);
  let f = fract(p);
  var d1 = 8.0;
  var d2 = 8.0;
  for (var z = -1; z <= 1; z++) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let g = vec3f(f32(x), f32(y), f32(z));
        let c = i + g;
        let h = vec3f(hash31(c), hash31(c + vec3f(17.0, 3.0, 9.0)), hash31(c + vec3f(5.0, 29.0, 13.0)));
        let o = vec3f(0.5) + 0.36 * sin(vec3f(t * 0.12) + 6.2831 * h);
        let d = length(g + o - f);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
      }
    }
  }
  return vec2f(d1, d2 - d1);
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = select(in.point, normalize(in.point), material.uLocal > 0.5) * material.uScale;

  let drift = vec3f(t * 0.02, -t * 0.015, t * 0.012);
  let warp = vec3f(
    fbm3(p * 0.5 + drift),
    fbm3(p.yzx * 0.5 - drift + vec3f(4.1, 2.2, 7.7)),
    fbm3(p.zxy * 0.5 + drift.yzx + vec3f(8.3, 1.9, 5.5))
  ) - vec3f(0.5);
  let q = p * 1.3 + warp * 1.1;
  let v = plates3(q, t);
  let w = plates3(q * 2.7 + vec3f(3.1, 7.7, 1.3), t * 0.7);

  let life = fbm3(q * 0.6 + vec3f(t * 0.03, -t * 0.02, t * 0.025) + vec3f(6.1, 2.5, 9.3));
  let activity = smoothstep(0.3, 0.7, life);

  let crack = 1.0 - smoothstep(0.0, 0.3, v.y);
  let core = 1.0 - smoothstep(0.0, 0.13, v.y);
  let fine = (1.0 - smoothstep(0.0, 0.07, w.y)) * 0.6 * smoothstep(0.12, 0.4, v.y);
  let flow = fbm3(q * 1.7 + drift * 3.0);
  let pulse = 0.86 + 0.14 * sin(t * 1.3 + flow * 6.0);

  let temperature = clamp((0.32 + 0.4 * crack + 0.4 * core + (flow - 0.5) * 0.35) * mix(0.82, 1.0, activity), 0.0, 1.0);
  var colour = heat(temperature) * pulse * 1.4;
  let underglow = exp(-v.y * 6.0) * 0.4;
  let mask = clamp(max(clamp(crack + fine, 0.0, 1.0), underglow), 0.0, 1.0);
  if (mask < 0.01) { discard; }

  let jitter = vec3f(
    noise3(p * 5.0 + vec3f(1.3, t * 0.05, 0.0)),
    noise3(p * 5.0 + vec3f(7.1, 2.2, t * 0.04)),
    noise3(p * 5.0 + vec3f(3.7, 9.4, 1.1))
  ) - vec3f(0.5);
  let nrm = normalize(normalize(in.normalView) + jitter * 0.55);
  let hv = normalize(normalize(vec3f(-0.45, 0.65, 0.6)) + vec3f(0.0, 0.0, 1.0));
  let spec = pow(max(dot(nrm, hv), 0.0), 46.0);
  colour += vec3f(1.0, 0.82, 0.55) * spec * 1.7 * smoothstep(0.3, 0.8, mask);
  return vec4f(colour, mask);
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
    // The basalt crust is dull; the melt over it is the glossy part (see the
    // highlights in HOT_FRAGMENT).
    metalness: 0,
    roughness: 0.72,
    clearcoat: 0,
    specularIntensity: 0.5,
    envMapIntensity: 0.35,
    emissive: new GFX.Color('#100300'),
    emissiveIntensity: 0.075,
    side: GFX.DoubleSide,
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
    side: GFX.DoubleSide,
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
