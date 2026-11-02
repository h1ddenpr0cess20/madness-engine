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

/** The lava's material; set `uniforms.uTime.value` each frame to keep it moving. */
export function createLavaMaterial(GFX) {
  return new GFX.ShaderMaterial({
    name: 'lava',
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 } },
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
  });
}
