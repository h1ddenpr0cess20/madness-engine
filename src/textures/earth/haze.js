/**
 * The data as mist: a ray marched through the glass, adding up the color of a
 * map (an equirectangular texture of the Earth, -180 on the left, 90 at the top)
 * as it is found along the way, the way Krystal's visions add up theirs
 * (`heroes/krystal/vision.js`). The map's color is read where each sample lies
 * over the Earth, strongest in a thick shell just under the glass, so from
 * outside the globe reads as the map itself, and thinning inward into wisps. The
 * mist's ribbons and veils drift (`uFlow`), and slide the colors a degree or two
 * as they go, so it is alive and still where the map says.
 *
 * The map is read as it is painted, with no color-space conversion. `uInverse`
 * is the world-to-Earth matrix of the sphere it is drawn on, so the map turns
 * with the globe. The same program twice, once per backend: keep the two in step.
 */

export const STEPS = 40;

/** Uniforms in the order the WGSL struct declares them (the texture is separate). */
export function hazeUniforms(GFX, map) {
  return {
    uFlow: { value: 0 },
    uGlow: { value: 1 },
    uShell: { value: 0.72 },
    uRadius: { value: 1 },
    uCenter: { value: new GFX.Vector3() },
    uInverse: { value: new GFX.Matrix4() },
    uData: { value: map },
  };
}

const GLSL_VERTEX = /* glsl */`
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const GLSL_FRAGMENT = /* glsl */`
uniform float uFlow;
uniform float uGlow;
uniform float uShell;
uniform float uRadius;
uniform vec3 uCenter;
uniform mat4 uInverse;
uniform sampler2D uData;
varying vec3 vWorld;

const int STEPS = ${STEPS};

float mist(vec3 p) {
  vec3 q = p * 3.0;
  for (int i = 1; i < 4; i++) {
    float fi = float(i);
    q += 0.45 / fi * sin(fi * 1.6 * q.yzx + uFlow * (0.7 + 0.3 * fi));
  }
  float ribbon = 1.0 - abs(sin(1.3 * q.x + 1.1 * q.y - 0.9 * q.z));
  ribbon *= ribbon;
  ribbon *= ribbon;
  float veil = 0.5 + 0.5 * sin(0.8 * q.y - 0.7 * q.x + 0.6 * q.z);
  return 0.75 + ribbon * 0.7 + veil * veil * 0.25;
}

vec3 data(vec3 p) {
  vec3 d = normalize(p + 0.03 * sin(2.5 * p.yzx + uFlow * 0.8));
  float u = (atan(-d.z, d.x) + 3.14159265) / 6.2831853;
  float v = asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5;
  return textureLod(uData, vec2(u, v), 0.0).rgb;
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorld - cameraPosition);
  vec3 oc = ro - uCenter;
  float b = dot(oc, rd);
  float h = b * b - (dot(oc, oc) - uRadius * uRadius);
  if (h <= 0.0) discard;
  h = sqrt(h);
  float t0 = max(-b - h, 0.0);
  float t1 = -b + h;
  float dt = (t1 - t0) / float(STEPS);
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 world = ro + rd * (t0 + (float(i) + jitter) * dt);
    vec3 p = (uInverse * vec4(world, 1.0)).xyz / uRadius;
    float r = length(p);
    float shell = smoothstep(uShell, 0.9, r) * (1.0 - smoothstep(0.985, 1.0, r)) + 0.03 * (1.0 - r);
    float w = mist(p) * shell;
    sum += data(p) * w;
    weight += w;
  }
  vec3 col = sum / max(weight, 1e-4);
  float a = 1.0 - exp(-weight * dt / uRadius * uGlow * 2.2);
  gl_FragColor = vec4(col * a, 1.0);
}
`;

const WGSL = /* wgsl */`
struct VOut {
  @builtin(position) position: vec4f,
  @location(0) world: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f) -> VOut {
  var o: VOut;
  let world = object.modelMatrix * vec4f(position, 1.0);
  o.world = world.xyz;
  o.position = object.projectionMatrix * object.viewMatrix * world;
  return o;
}

const STEPS: i32 = ${STEPS};

fn mist(p: vec3f) -> f32 {
  var q = p * 3.0;
  for (var i = 1; i < 4; i++) {
    let fi = f32(i);
    q += 0.45 / fi * sin(fi * 1.6 * q.yzx + material.uFlow * (0.7 + 0.3 * fi));
  }
  var ribbon = 1.0 - abs(sin(1.3 * q.x + 1.1 * q.y - 0.9 * q.z));
  ribbon *= ribbon;
  ribbon *= ribbon;
  let veil = 0.5 + 0.5 * sin(0.8 * q.y - 0.7 * q.x + 0.6 * q.z);
  return 0.75 + ribbon * 0.7 + veil * veil * 0.25;
}

fn dataAt(p: vec3f) -> vec3f {
  let d = normalize(p + 0.03 * sin(2.5 * p.yzx + material.uFlow * 0.8));
  let u = (atan2(-d.z, d.x) + 3.14159265) / 6.2831853;
  let v = asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5;
  return textureSampleLevel(dataTex, dataSamp, vec2f(u, v), 0.0).rgb;
}

@fragment
fn fs(v: VOut) -> @location(0) vec4f {
  let ro = object.cameraPosition;
  let rd = normalize(v.world - ro);
  let oc = ro - material.uCenter;
  let b = dot(oc, rd);
  var h = b * b - (dot(oc, oc) - material.uRadius * material.uRadius);
  if (h <= 0.0) { discard; }
  h = sqrt(h);
  let t0 = max(-b - h, 0.0);
  let t1 = -b + h;
  let dt = (t1 - t0) / f32(STEPS);
  let jitter = fract(52.9829189 * fract(dot(v.position.xy, vec2f(0.06711056, 0.00583715))));
  var sum = vec3f(0.0);
  var weight = 0.0;
  for (var i = 0; i < STEPS; i++) {
    let world = ro + rd * (t0 + (f32(i) + jitter) * dt);
    let p = (material.uInverse * vec4f(world, 1.0)).xyz / material.uRadius;
    let r = length(p);
    let shell = smoothstep(material.uShell, 0.9, r) * (1.0 - smoothstep(0.985, 1.0, r)) + 0.03 * (1.0 - r);
    let w = mist(p) * shell;
    sum += dataAt(p) * w;
    weight += w;
  }
  let col = sum / max(weight, 1e-4);
  let a = 1.0 - exp(-weight * dt / material.uRadius * material.uGlow * 2.2);
  return vec4f(col * a, 1.0);
}
`;

/** The haze's material: additive, drawn over the glass, writing no depth. `map` is the Earth's colors. */
export function createHazeMaterial(GFX, map) {
  return new GFX.ShaderMaterial({
    name: 'haze',
    uniforms: hazeUniforms(GFX, map),
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
    transparent: true,
    blending: GFX.AdditiveBlending,
    depthWrite: false,
  });
}
