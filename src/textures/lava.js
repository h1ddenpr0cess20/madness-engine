/**
 * Lava, as a shader of its own (GLSL for WebGL 2, WGSL for WebGPU, the same
 * picture from each). A crust of dark plates drifts and grinds over it, the
 * melt shows white-hot in the cracks between them, pools of it well up and
 * crust over again, bubbles swell and burst, and the whole of it pulses. It
 * lights itself: what it draws is what you see, whatever the lights.
 */

const GLSL_VERTEX = `varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const GLSL_FRAGMENT = `uniform float uTime;
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
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.5 + 0.4 * sin(t * 0.3 + 6.2831 * hash2(i + g));
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2(d1, d2 - d1);
}
void main() {
  float t = uTime;
  vec2 p = vWorld.xz;
  vec2 warp = vec2(fbm(p * 0.7 + vec2(t * 0.05, 0.0)), fbm(p * 0.7 + vec2(3.1, -t * 0.04)));
  vec2 q = p * 1.5 + warp * 1.3;
  vec2 v = plates(q, t);
  float crack = 1.0 - smoothstep(0.03, 0.17, v.y);
  float pool = smoothstep(0.5, 0.76, fbm(p * 0.8 + vec2(t * 0.06, -t * 0.045)));
  float heat = clamp(crack + pool, 0.0, 1.0);
  vec3 crust = mix(vec3(0.1, 0.03, 0.018), vec3(0.62, 0.12, 0.02), (1.0 - smoothstep(0.0, 0.36, v.y)) * 0.9);
  crust *= 0.75 + 0.5 * vnoise(q * 5.0);
  vec3 melt = mix(vec3(1.0, 0.3, 0.02), vec3(1.0, 0.86, 0.42), heat * heat);
  float pulse = 0.82 + 0.18 * sin(t * 1.9 + fbm(p * 1.7) * 6.0);
  vec3 col = mix(crust, melt * pulse, heat);
  // Bubbles: here and there a swelling bright ring that bursts.
  vec2 cell = floor(p * 1.25);
  float pick = hash1(cell);
  if (pick > 0.72) {
    vec2 at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.25;
    float phase = fract(t * (0.18 + pick * 0.2) + pick * 9.0);
    float r = phase * 0.28, d = length(p - at);
    float ring = (1.0 - smoothstep(0.0, 0.035, abs(d - r))) * (1.0 - phase);
    float dome = (1.0 - smoothstep(0.0, r, d)) * (1.0 - phase) * 0.6;
    col = mix(col, vec3(1.0, 0.72, 0.25), clamp((ring + dome) * (0.35 + 0.65 * pool), 0.0, 1.0));
  }
  gl_FragColor = vec4(col * uBright, 1.0);
}`;

const WGSL = `struct Varyings { @builtin(position) position: vec4f, @location(0) world: vec3f };
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
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let g = vec2f(f32(x), f32(y));
      let o = 0.5 + 0.4 * sin(t * 0.3 + 6.2831 * hash2(i + g));
      let d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2f(d1, d2 - d1);
}
@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = in.world.xz;
  let warp = vec2f(fbm(p * 0.7 + vec2f(t * 0.05, 0.0)), fbm(p * 0.7 + vec2f(3.1, -t * 0.04)));
  let q = p * 1.5 + warp * 1.3;
  let v = plates(q, t);
  let crack = 1.0 - smoothstep(0.03, 0.17, v.y);
  let pool = smoothstep(0.5, 0.76, fbm(p * 0.8 + vec2f(t * 0.06, -t * 0.045)));
  let heat = clamp(crack + pool, 0.0, 1.0);
  var crust = mix(vec3f(0.1, 0.03, 0.018), vec3f(0.62, 0.12, 0.02), (1.0 - smoothstep(0.0, 0.36, v.y)) * 0.9);
  crust *= 0.75 + 0.5 * vnoise(q * 5.0);
  let melt = mix(vec3f(1.0, 0.3, 0.02), vec3f(1.0, 0.86, 0.42), heat * heat);
  let pulse = 0.82 + 0.18 * sin(t * 1.9 + fbm(p * 1.7) * 6.0);
  var col = mix(crust, melt * pulse, heat);
  let cell = floor(p * 1.25);
  let pick = hash1(cell);
  if (pick > 0.72) {
    let at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.25;
    let phase = fract(t * (0.18 + pick * 0.2) + pick * 9.0);
    let r = phase * 0.28;
    let d = length(p - at);
    let ring = (1.0 - smoothstep(0.0, 0.035, abs(d - r))) * (1.0 - phase);
    let dome = (1.0 - smoothstep(0.0, max(r, 0.001), d)) * (1.0 - phase) * 0.6;
    col = mix(col, vec3f(1.0, 0.72, 0.25), clamp((ring + dome) * (0.35 + 0.65 * pool), 0.0, 1.0));
  }
  return vec4f(col * material.uBright, 1.0);
}`;

/** The lava's material; set `uniforms.uTime.value` each frame to keep it moving. */
export function createLavaMaterial(GFX) {
  return new GFX.ShaderMaterial({
    name: 'lava',
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 } },
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
  });
}
