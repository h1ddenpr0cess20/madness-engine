/**
 * The sea and the sky over it, as shaders of their own: GLSL for WebGL 2 and
 * WGSL for WebGPU, the same picture from each.
 *
 * The water is a flat grid of rings round the camera (ocean.js), finest
 * underfoot and coarser out to the horizon. The vertex stage lifts and
 * carries it by the Gerstner sum of ocean/waves.js, leaving out the waves
 * too short for the grid where it is, so the far water doesn't shimmer.
 * The fragment stage does the sum again, all of it but what is shorter than
 * a pixel there, for the surface's normal and for how it is squeezed, and
 * shades it after Neverending Tunnel III's barrel:
 *
 *   - deep water, lighter where the light gets into it, and the glow of
 *     light through the thin water at the crests, brightest looking into
 *     the sun;
 *   - ripples running with the wind: a dozen short waves too small for the
 *     grid, only tipping the normal;
 *   - foam where the crests pinch together and break, broken up by streaks
 *     long along the wind and short across it (value noise whose lattice
 *     wraps, so the offsets handed in, modulo the wrap, never jump), with
 *     thin lines of lace left behind;
 *   - the sky reflected (Fresnel), the sun's glint, wider as the pixel
 *     grows, and haze into the horizon.
 *
 * The sky's dome uses the same sky: what is reflected is what is overhead.
 *
 * Uniforms, in order (WGSL takes them in this order as `material`'s fields):
 *   uA, uQ, uK, uDX, uDZ, uPhase   mat4: the sixteen waves' lift, carry,
 *                                  wave number, way, and phase at the camera
 *   uR1, uR2, uR3                  mat4: the ripples, twelve short waves, a column
 *                                  each: wave number, way (x, z), phase at the camera
 *   uNoiseC                        vec2: the foam's streaks' offset, in cells mod 256
 *   uCloudShift, uWind             vec2: the clouds' drift; the way the wind blows
 *   uSun, uSunColor                vec3: towards the sun; its light
 *   uZenith, uHorizon, uCloud      vec3: the sky
 *   uSkyShape                      vec3: cloud cover, stars, unused
 *   uDeep, uBody, uGlow, uFoam     vec3: the water
 *   uSea                           vec3: choppiness, foam, radians a pixel spans
 *   uLook                          vec3: exposure, haze a tile, a crest's height
 *   uFrame                         vec3: reach (the grid's radius), time, unused
 */

// ---------------------------------------------------------------- GLSL

const GLSL_COMMON = `
uniform mat4 uA;
uniform mat4 uQ;
uniform mat4 uK;
uniform mat4 uDX;
uniform mat4 uDZ;
uniform mat4 uPhase;
uniform mat4 uR1;
uniform mat4 uR2;
uniform mat4 uR3;
uniform vec2 uNoiseC;
uniform vec2 uCloudShift;
uniform vec2 uWind;
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uCloud;
uniform vec3 uSkyShape;
uniform vec3 uDeep;
uniform vec3 uBody;
uniform vec3 uGlow;
uniform vec3 uFoam;
uniform vec3 uSea;
uniform vec3 uLook;
uniform vec3 uFrame;

const float TAU = 6.2831853;

// The Gerstner sum, as displace() in ocean/waves.js: what the water at rest
// at p is carried by, and its squeeze (xx, zz, xz) and slope. Waves shorter
// than about \`fine\` fade out.
vec3 waves(vec2 p, float fine, out vec3 jac, out vec2 slope) {
  vec3 o = vec3(0.0);
  jac = vec3(1.0, 1.0, 0.0);
  slope = vec2(0.0);
  for (int i = 0; i < 16; i++) {
    int c = i / 4;
    int r = i - c * 4;
    float k = uK[c][r];
    float fade = clamp(TAU / (k * fine) - 1.0, 0.0, 1.0);
    if (fade <= 0.0) continue;
    vec2 dir = vec2(uDX[c][r], uDZ[c][r]);
    float th = k * dot(dir, p) + uPhase[c][r];
    float s = sin(th);
    float cs = cos(th);
    float A = uA[c][r] * fade;
    float Q = uQ[c][r] * fade;
    o += vec3(Q * dir.x * cs, A * s, Q * dir.y * cs);
    jac -= Q * k * s * vec3(dir.x * dir.x, dir.y * dir.y, dir.x * dir.y);
    slope += A * k * cs * dir;
  }
  return o;
}
`;

const GLSL_SKY = `
float hash(vec2 p) {
  vec2 q = fract(p * 0.3183099 + vec2(0.71, 0.113)) * 17.0;
  return fract(q.x * q.y * (q.x + q.y));
}
// Value noise and its gradient, its lattice wrapping every \`per\` cells.
vec3 noised(vec2 p, float per) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  vec2 i0 = mod(i, per);
  vec2 i1 = mod(i + 1.0, per);
  float a = hash(i0);
  float b = hash(vec2(i1.x, i0.y));
  float c = hash(vec2(i0.x, i1.y));
  float d = hash(i1);
  float e = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + e * u.x * u.y, du * (vec2(b - a, c - a) + e * u.yx));
}
float fbm(vec2 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  float fr = 1.0;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    v += amp * noised(p * fr, 256.0 * fr).x;
    amp *= 0.5;
    fr *= 2.0;
  }
  return v;
}
// How much cloud is in the way looking along d.
float clouds(vec3 d, int octaves) {
  if (d.y <= 0.0 || uSkyShape.x <= 0.0) return 0.0;
  vec2 p = d.xz / (d.y + 0.08) * 1.2 + uCloudShift;
  float cover = uSkyShape.x;
  return smoothstep(1.0 - cover - 0.1, 1.0 - cover + 0.35, fbm(p, octaves)) * smoothstep(0.0, 0.15, d.y);
}
// The sky looking along d, as skyColour() in ocean/sky.js.
vec3 skyColour(vec3 d, float cl) {
  float h = max(d.y, 0.0);
  float mu = max(dot(d, uSun), 0.0);
  vec3 col = mix(uHorizon, uZenith, sqrt(h)) + uSunColor * (0.18 * pow(mu, 6.0) + 0.5 * pow(mu, 64.0));
  return mix(col, uCloud + uSunColor * 0.3 * pow(mu, 4.0), cl);
}
// The haze at the horizon, round the way d looks.
vec3 haze(vec3 d) {
  return skyColour(normalize(vec3(d.x, 0.0, d.z) + vec3(1e-4, 0.0, 0.0)), 0.0);
}
// Exposure, the highlights rolled off above 0.8, and sRGB for the canvas (linear for what glass refracts).
vec3 film(vec3 c) {
  c *= uLook.x;
  vec3 hi = 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) / 0.2));
  c = clamp(mix(c, hi, step(0.8, c)), 0.0, 1.0);
  if (!OUTPUT_SRGB) return c;
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
`;

const WATER_VERTEX = `${GLSL_COMMON}
varying vec3 vWorld;
varying vec2 vRest;
void main() {
  // position.y is how far apart the grid's points are here.
  vec2 p = position.xz;
  vec3 jac;
  vec2 slope;
  vec3 d = waves(p, 3.0 * position.y, jac, slope);
  vec4 world = modelMatrix * vec4(p.x + d.x, d.y, p.y + d.z, 1.0);
  vWorld = world.xyz;
  vRest = p;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const WATER_FRAGMENT = `${GLSL_COMMON}${GLSL_SKY}
varying vec3 vWorld;
varying vec2 vRest;
void main() {
  vec3 toEye = cameraPosition - vWorld;
  float dist = length(toEye);
  vec3 v = toEye / dist;
  // How wide a pixel is here, in tiles.
  float fp = dist * uSea.z;

  vec3 jac;
  vec2 slope;
  vec3 d = waves(vRest, 2.0 * fp, jac, slope);
  vec3 n = normalize(vec3(slope.y * jac.z - slope.x * jac.y, jac.x * jac.y - jac.z * jac.z, slope.x * jac.z - slope.y * jac.x));

  vec3 n0 = n;
  // Ripples: a dozen short waves running with the wind, tipping the normal,
  // each fading out as a pixel grows past it.
  float steep = 0.02 + 0.05 * uSea.x;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < 12; i++) {
    vec4 r = i < 4 ? uR1[i] : (i < 8 ? uR2[i - 4] : uR3[i - 8]);
    float fade = clamp(TAU / (r.x * 2.0 * fp) - 1.0, 0.0, 1.0);
    grad += steep * fade * cos(r.x * dot(r.yz, vRest) + r.w) * r.yz;
  }
  n = normalize(n - vec3(grad.x, 0.0, grad.y));
  vec2 w = uWind;
  vec2 wp = vec2(-w.y, w.x);
  float al = dot(vRest, w);
  float ac = dot(vRest, wp);

  vec3 L = uSun;
  float ndv = max(dot(n, v), 0.0);
  vec3 r = reflect(-v, n);
  vec3 rs = vec3(r.x, abs(r.y), r.z);
  float F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  // A wave steep enough to reflect downwards sees the sea, not the sky (ripples aside: they would ring it).
  vec3 sky = mix(uDeep + uBody * (uZenith * 0.3 + uHorizon * 0.2), skyColour(rs, clouds(rs, 3)), smoothstep(-0.25, 0.0, reflect(-v, n0).y));

  // Under the surface: deep water, lighter where the light gets in, and
  // glowing through the thin crests, brightest looking into the sun.
  float crest = clamp(d.y / max(uLook.z, 0.02) * 0.5 + 0.5, 0.0, 1.0);
  float sunUp = smoothstep(0.0, 0.5, L.y);
  float backlit = clamp(L.y * 8.0, 0.0, 1.0);
  vec3 ambient = uZenith * 0.5 + uHorizon * 0.3;
  vec3 lit = ambient * 0.6 + uSunColor * sunUp * (0.05 + 0.12 * max(dot(n, L), 0.0));
  vec3 col = uDeep + uBody * lit * (0.5 + 0.5 * crest);
  float toward = pow(max(dot(-v, L), 0.0), 4.0);
  col += uGlow * uSunColor * backlit * pow(crest, 3.0) * (0.12 + 1.4 * toward) * (1.0 - 0.6 * uSkyShape.x);
  col = mix(col, sky, F);

  // The sun's glint: sharp up close, spread wider as the pixel grows, over a sheen.
  float shine = mix(1800.0, 90.0, smoothstep(0.0, 3.0, fp + 0.4 * uSea.x));
  float rl = max(dot(r, L), 0.0);
  float glint = pow(rl, shine) * (shine * 0.01 + 0.15) + pow(rl, 24.0) * 0.08;
  col += uSunColor * glint * (0.25 + F) * (1.0 - 0.85 * uSkyShape.x);

  // Foam: where the crests pinch together and break.
  float b = (1.0 - (jac.x * jac.y - jac.z * jac.z)) / max(uSea.x, 0.05);
  vec2 qc = vec2(al * 0.16, ac * 0.32) + uNoiseC;
  float s1 = fbm(qc, 3);
  float s2 = fbm(qc * 2.0 + vec2(17.0, 5.0), 2);
  float edge = mix(0.6, 0.24, uSea.y);
  // Bubbly, not flat: a finer noise eats into the caps' edges.
  float bubbles = noised(qc * 8.0 + vec2(3.0, 11.0), 2048.0).x;
  float cap = smoothstep(edge - 0.05, edge + 0.3, b + 0.22 * (s1 - 0.5)) * step(0.001, uSea.y);
  cap *= smoothstep(0.15, 0.55, bubbles + cap * 0.5);
  float lace = (1.0 - smoothstep(0.0, 0.025, abs(s2 - 0.5))) * smoothstep(edge - 0.12, edge + 0.05, b) * uSea.y * 0.6
             * (1.0 - smoothstep(0.15, 0.9, fp));
  float foam = clamp(cap + lace, 0.0, 1.0);
  vec3 foamLit = uFoam * (ambient * 0.9 + uSunColor * backlit * (0.15 + 0.6 * max(dot(n, L), 0.0)) + 0.04);
  col = mix(col, foamLit, foam);

  // Into the haze, all of it by the grid's edge.
  float fog = max(1.0 - exp(-dist * uLook.y), smoothstep(0.7, 0.97, dist / uFrame.x));
  col = mix(col, haze(-v), fog);
  gl_FragColor = vec4(film(col), 1.0);
}`;

const SKY_VERTEX = `${GLSL_COMMON}
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const SKY_FRAGMENT = `${GLSL_COMMON}${GLSL_SKY}
varying vec3 vWorld;
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  // Under the horizon is the far sea, lost in the haze, as the water is at the grid's edge.
  vec3 col = haze(d);
  if (d.y > 0.0) {
    float cl = clouds(d, 4);
    col = skyColour(d, cl);
    float mu = dot(d, uSun);
    col += uSunColor * 24.0 * smoothstep(0.99965, 0.9999, mu) * (1.0 - 0.92 * cl);
    vec3 g = floor(d * 280.0);
    float star = step(0.9965, hash(g.xy + g.z * 37.0)) * hash(g.zx + 3.0) * smoothstep(0.32, 0.05, length(fract(d * 280.0) - 0.5));
    col += vec3(0.9, 0.95, 1.0) * star * uSkyShape.y * (1.0 - cl) * smoothstep(0.02, 0.25, d.y);
  }
  gl_FragColor = vec4(film(col), 1.0);
}`;

export const WATER_GLSL = Object.freeze({ vertex: WATER_VERTEX, fragment: WATER_FRAGMENT });
export const SKY_GLSL = Object.freeze({ vertex: SKY_VERTEX, fragment: SKY_FRAGMENT });

// ---------------------------------------------------------------- WGSL

const WGSL_COMMON = `
const TAU = 6.2831853;

struct Sum { o: vec3f, jac: vec3f, slope: vec2f };

// The Gerstner sum, as displace() in ocean/waves.js. Waves shorter than about \`fine\` fade out.
fn waves(p: vec2f, fine: f32) -> Sum {
  var s: Sum;
  s.o = vec3f(0.0);
  s.jac = vec3f(1.0, 1.0, 0.0);
  s.slope = vec2f(0.0);
  for (var i = 0; i < 16; i++) {
    let k = material.uK[i / 4][i % 4];
    let fade = clamp(TAU / (k * fine) - 1.0, 0.0, 1.0);
    if (fade <= 0.0) { continue; }
    let dir = vec2f(material.uDX[i / 4][i % 4], material.uDZ[i / 4][i % 4]);
    let th = k * dot(dir, p) + material.uPhase[i / 4][i % 4];
    let sn = sin(th);
    let cs = cos(th);
    let A = material.uA[i / 4][i % 4] * fade;
    let Q = material.uQ[i / 4][i % 4] * fade;
    s.o += vec3f(Q * dir.x * cs, A * sn, Q * dir.y * cs);
    s.jac -= Q * k * sn * vec3f(dir.x * dir.x, dir.y * dir.y, dir.x * dir.y);
    s.slope += A * k * cs * dir;
  }
  return s;
}

fn hash(p: vec2f) -> f32 {
  let q = fract(p * 0.3183099 + vec2f(0.71, 0.113)) * 17.0;
  return fract(q.x * q.y * (q.x + q.y));
}
fn wrap(x: vec2f, per: f32) -> vec2f { return x - per * floor(x / per); }
// Value noise and its gradient, its lattice wrapping every \`per\` cells.
fn noised(p: vec2f, per: f32) -> vec3f {
  let i = floor(p);
  let f = p - i;
  let u = f * f * (3.0 - 2.0 * f);
  let du = 6.0 * f * (1.0 - f);
  let i0 = wrap(i, per);
  let i1 = wrap(i + 1.0, per);
  let a = hash(i0);
  let b = hash(vec2f(i1.x, i0.y));
  let c = hash(vec2f(i0.x, i1.y));
  let d = hash(i1);
  let e = a - b - c + d;
  return vec3f(a + (b - a) * u.x + (c - a) * u.y + e * u.x * u.y, du * (vec2f(b - a, c - a) + e * u.yx));
}
fn fbm(p: vec2f, octaves: i32) -> f32 {
  var v = 0.0;
  var amp = 0.5;
  var fr = 1.0;
  for (var i = 0; i < octaves; i++) {
    v += amp * noised(p * fr, 256.0 * fr).x;
    amp *= 0.5;
    fr *= 2.0;
  }
  return v;
}
// How much cloud is in the way looking along d.
fn clouds(d: vec3f, octaves: i32) -> f32 {
  if (d.y <= 0.0 || material.uSkyShape.x <= 0.0) { return 0.0; }
  let p = d.xz / (d.y + 0.08) * 1.2 + material.uCloudShift;
  let cover = material.uSkyShape.x;
  return smoothstep(1.0 - cover - 0.1, 1.0 - cover + 0.35, fbm(p, octaves)) * smoothstep(0.0, 0.15, d.y);
}
// The sky looking along d, as skyColour() in ocean/sky.js.
fn skyColour(d: vec3f, cl: f32) -> vec3f {
  let h = max(d.y, 0.0);
  let mu = max(dot(d, material.uSun), 0.0);
  let col = mix(material.uHorizon, material.uZenith, sqrt(h)) + material.uSunColor * (0.18 * pow(mu, 6.0) + 0.5 * pow(mu, 64.0));
  return mix(col, material.uCloud + material.uSunColor * 0.3 * pow(mu, 4.0), cl);
}
// The haze at the horizon, round the way d looks.
fn haze(d: vec3f) -> vec3f {
  return skyColour(normalize(vec3f(d.x, 0.0, d.z) + vec3f(1e-4, 0.0, 0.0)), 0.0);
}
// Exposure, the highlights rolled off above 0.8, and sRGB for the canvas (linear for what glass refracts).
fn film(c0: vec3f) -> vec3f {
  var c = c0 * material.uLook.x;
  let hi = 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) / 0.2));
  c = clamp(mix(c, hi, step(vec3f(0.8), c)), vec3f(0.0), vec3f(1.0));
  if (!OUTPUT_SRGB) { return c; }
  return mix(c * 12.92, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, step(vec3f(0.0031308), c));
}
`;

const WATER_WGSL = `${WGSL_COMMON}
struct Varyings { @builtin(position) position: vec4f, @location(0) world: vec3f, @location(1) rest: vec2f };

@vertex fn vs(@location(0) position: vec3f) -> Varyings {
  // position.y is how far apart the grid's points are here.
  let p = position.xz;
  let s = waves(p, 3.0 * position.y);
  let world = object.modelMatrix * vec4f(p.x + s.o.x, s.o.y, p.y + s.o.z, 1.0);
  var out: Varyings;
  out.world = world.xyz;
  out.rest = p;
  out.position = object.projectionMatrix * object.viewMatrix * world;
  return out;
}

@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let toEye = object.cameraPosition - in.world;
  let dist = length(toEye);
  let v = toEye / dist;
  // How wide a pixel is here, in tiles.
  let fp = dist * material.uSea.z;

  let s = waves(in.rest, 2.0 * fp);
  let jac = s.jac;
  let slope = s.slope;
  var n = normalize(vec3f(slope.y * jac.z - slope.x * jac.y, jac.x * jac.y - jac.z * jac.z, slope.x * jac.z - slope.y * jac.x));

  let n0 = n;
  // Ripples: a dozen short waves running with the wind, tipping the normal,
  // each fading out as a pixel grows past it.
  let steep = 0.02 + 0.05 * material.uSea.x;
  var grad = vec2f(0.0);
  for (var i = 0; i < 12; i++) {
    var r: vec4f;
    if (i < 4) { r = material.uR1[i]; } else if (i < 8) { r = material.uR2[i - 4]; } else { r = material.uR3[i - 8]; }
    let fade = clamp(TAU / (r.x * 2.0 * fp) - 1.0, 0.0, 1.0);
    grad += steep * fade * cos(r.x * dot(r.yz, in.rest) + r.w) * r.yz;
  }
  n = normalize(n - vec3f(grad.x, 0.0, grad.y));
  let w = material.uWind;
  let wp = vec2f(-w.y, w.x);
  let al = dot(in.rest, w);
  let ac = dot(in.rest, wp);

  let L = material.uSun;
  let ndv = max(dot(n, v), 0.0);
  let r = reflect(-v, n);
  let rs = vec3f(r.x, abs(r.y), r.z);
  let F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  // A wave steep enough to reflect downwards sees the sea, not the sky (ripples aside: they would ring it).
  let sky = mix(material.uDeep + material.uBody * (material.uZenith * 0.3 + material.uHorizon * 0.2), skyColour(rs, clouds(rs, 3)), smoothstep(-0.25, 0.0, reflect(-v, n0).y));

  // Under the surface: deep water, lighter where the light gets in, and
  // glowing through the thin crests, brightest looking into the sun.
  let crest = clamp(s.o.y / max(material.uLook.z, 0.02) * 0.5 + 0.5, 0.0, 1.0);
  let sunUp = smoothstep(0.0, 0.5, L.y);
  let backlit = clamp(L.y * 8.0, 0.0, 1.0);
  let ambient = material.uZenith * 0.5 + material.uHorizon * 0.3;
  let lit = ambient * 0.6 + material.uSunColor * sunUp * (0.05 + 0.12 * max(dot(n, L), 0.0));
  var col = material.uDeep + material.uBody * lit * (0.5 + 0.5 * crest);
  let toward = pow(max(dot(-v, L), 0.0), 4.0);
  col += material.uGlow * material.uSunColor * backlit * pow(crest, 3.0) * (0.12 + 1.4 * toward) * (1.0 - 0.6 * material.uSkyShape.x);
  col = mix(col, sky, F);

  // The sun's glint: sharp up close, spread wider as the pixel grows, over a sheen.
  let shine = mix(1800.0, 90.0, smoothstep(0.0, 3.0, fp + 0.4 * material.uSea.x));
  let rl = max(dot(r, L), 0.0);
  let glint = pow(rl, shine) * (shine * 0.01 + 0.15) + pow(rl, 24.0) * 0.08;
  col += material.uSunColor * glint * (0.25 + F) * (1.0 - 0.85 * material.uSkyShape.x);

  // Foam: where the crests pinch together and break.
  let b = (1.0 - (jac.x * jac.y - jac.z * jac.z)) / max(material.uSea.x, 0.05);
  let qc = vec2f(al * 0.16, ac * 0.32) + material.uNoiseC;
  let s1 = fbm(qc, 3);
  let s2 = fbm(qc * 2.0 + vec2f(17.0, 5.0), 2);
  let edge = mix(0.6, 0.24, material.uSea.y);
  // Bubbly, not flat: a finer noise eats into the caps' edges.
  let bubbles = noised(qc * 8.0 + vec2f(3.0, 11.0), 2048.0).x;
  var cap = smoothstep(edge - 0.05, edge + 0.3, b + 0.22 * (s1 - 0.5)) * step(0.001, material.uSea.y);
  cap *= smoothstep(0.15, 0.55, bubbles + cap * 0.5);
  let lace = (1.0 - smoothstep(0.0, 0.025, abs(s2 - 0.5))) * smoothstep(edge - 0.12, edge + 0.05, b) * material.uSea.y * 0.6
           * (1.0 - smoothstep(0.15, 0.9, fp));
  let foam = clamp(cap + lace, 0.0, 1.0);
  let foamLit = material.uFoam * (ambient * 0.9 + material.uSunColor * backlit * (0.15 + 0.6 * max(dot(n, L), 0.0)) + 0.04);
  col = mix(col, foamLit, foam);

  // Into the haze, all of it by the grid's edge.
  let fog = max(1.0 - exp(-dist * material.uLook.y), smoothstep(0.7, 0.97, dist / material.uFrame.x));
  col = mix(col, haze(-v), fog);
  return vec4f(film(col), 1.0);
}`;

const SKY_WGSL = `${WGSL_COMMON}
struct Varyings { @builtin(position) position: vec4f, @location(0) world: vec3f };

@vertex fn vs(@location(0) position: vec3f) -> Varyings {
  let world = object.modelMatrix * vec4f(position, 1.0);
  var out: Varyings;
  out.world = world.xyz;
  out.position = object.projectionMatrix * object.viewMatrix * world;
  return out;
}

@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let d = normalize(in.world - object.cameraPosition);
  // Under the horizon is the far sea, lost in the haze, as the water is at the grid's edge.
  var col = haze(d);
  if (d.y > 0.0) {
    let cl = clouds(d, 4);
    col = skyColour(d, cl);
    let mu = dot(d, material.uSun);
    col += material.uSunColor * 24.0 * smoothstep(0.99965, 0.9999, mu) * (1.0 - 0.92 * cl);
    let g = floor(d * 280.0);
    let star = step(0.9965, hash(g.xy + g.z * 37.0)) * hash(g.zx + 3.0) * smoothstep(0.32, 0.05, length(fract(d * 280.0) - 0.5));
    col += vec3f(0.9, 0.95, 1.0) * star * material.uSkyShape.y * (1.0 - cl) * smoothstep(0.02, 0.25, d.y);
  }
  return vec4f(film(col), 1.0);
}`;

export { WATER_WGSL, SKY_WGSL };
