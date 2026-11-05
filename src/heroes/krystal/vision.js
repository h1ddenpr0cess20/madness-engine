/**
 * The visions: coloured mist swirling inside the glass, drawn by marching a
 * ray through the ball and adding up the light of what it passes.
 *
 * The mist is a vortex — turned about the upright, harder toward the middle —
 * whose space is then folded back on itself a few times with sines, which is
 * what makes the wisps curl and split rather than just rotate. Colour comes
 * from where in that folded space a wisp lies, run through a palette that
 * goes violet, magenta, rose, gold, teal; `hue` slides the whole palette
 * round, so a mood can lean the visions toward one end of it. `tint` multiplies the light, to take the palette toward one color it
 * cannot reach by itself (a rust red); `spread` is how
 * much of the palette the mist runs through: 1 is all of it, 0 is the one color
 * at `hue`, in lighter and darker wisps.
 *
 * It is drawn additively after the glass, on a sphere just inside it: the
 * glass still refracts the night behind, and the mist glows in front of
 * that. The same program twice, once per backend — keep the two in step.
 */

/**
 * How many samples each ray takes through the ball. Each ray starts a
 * different fraction of a step in, so what would be contour lines across the
 * ribbons is spread into a grain instead.
 */
export const STEPS = 36;

/**
 * The uniforms, in the order the WGSL struct declares them. `flow` is time
 * already scaled by the mood's speed — integrated on the CPU, so a change of
 * pace never makes the mist jump.
 */
export function visionUniforms(GFX) {
  return {
    uFlow: { value: 0 },
    uSwirl: { value: 1.4 },
    uChurn: { value: 0.55 },
    uGlow: { value: 0.8 },
    uHue: { value: 0.75 },
    uSpread: { value: 1 },
    uTint: { value: new GFX.Vector3(1, 1, 1) },
    uCore: { value: 0.3 },
    uRadius: { value: 1 },
    uCenter: { value: new GFX.Vector3() },
    // Added last (the WGSL struct follows this order): `bands` stretches the mist into horizontal belts that
    // shear past each other; `duo` (0 or 1) colors it, in place of the palette, with A (red) along Jupiter's belts, B (cream) between them, mostly B, and a little C (blue-green) where the mist is thin.
    uBands: { value: 0 },
    uDuoA: { value: new GFX.Vector3(1, 0.3, 0.2) },
    uDuoB: { value: new GFX.Vector3(0.15, 0.75, 0.7) },
    uDuo: { value: 0 },
    uDuoC: { value: new GFX.Vector3(0.12, 0.72, 0.68) },
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
uniform float uSwirl;
uniform float uChurn;
uniform float uGlow;
uniform float uHue;
uniform float uSpread;
uniform vec3 uTint;
uniform float uCore;
uniform float uRadius;
uniform vec3 uCenter;
uniform float uBands;
uniform vec3 uDuoA;
uniform vec3 uDuoB;
uniform float uDuo;
uniform vec3 uDuoC;
varying vec3 vWorld;

const int STEPS = ${STEPS};

vec3 palette(float t) {
  return vec3(0.56, 0.40, 0.62) + vec3(0.44, 0.38, 0.38) * cos(6.2831853 * (t + vec3(0.0, 0.30, 0.62)));
}

float mist(vec3 p, out float shade) {
  float r = length(p.xz);
  float a = uSwirl * (1.15 - r) * 2.2 + uFlow * 0.9 + uBands * (p.y * 3.5 + 0.6 * sin(p.y * 7.0 + uFlow * 0.5));
  float c = cos(a);
  float s = sin(a);
  p.xz = mat2(c, -s, s, c) * p.xz;
  vec3 q = p * vec3(2.8, 2.8 + uBands * 4.0, 2.8);
  for (int i = 1; i < 5; i++) {
    float fi = float(i);
    q += uChurn / fi * sin(fi * 1.6 * q.yzx + uFlow * (0.7 + 0.3 * fi));
  }
  shade = 0.12 * q.x + 0.17 * q.y - 0.08 * q.z;
  float ribbon = 1.0 - abs(sin(1.3 * q.x + 1.1 * q.y - 0.9 * q.z));
  ribbon *= ribbon;
  ribbon *= ribbon;
  float veil = 0.5 + 0.5 * sin(0.8 * q.y - 0.7 * q.x + 0.6 * q.z);
  return ribbon * ribbon * 1.4 + veil * veil * veil * 0.3;
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
  vec3 light = palette(uHue + 0.5);
  vec3 col = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    vec3 p = (ro + rd * (t0 + (float(i) + jitter) * dt) - uCenter) / uRadius;
    float d2 = dot(p, p);
    float edge = clamp(1.0 - d2, 0.0, 1.0);
    float shade;
    float dens = mist(p, shade) * edge * edge;
    vec3 tone = palette((shade + d2 * 0.3) * uSpread + uHue);
    if (uDuo > 0.5) {
      tone = mix(uDuoA, uDuoB, smoothstep(-0.75, 0.3, 0.45 * shade + 0.8 * cos((p.y - 0.16) * 12.5)));
      tone = mix(tone, uDuoC, 0.85 * smoothstep(0.45, 0.9, shade));
    }
    col += tone * dens;
    col += light * uCore * exp(-d2 * 7.0) * 0.35;
  }
  col *= uGlow * 2.6 * dt / uRadius * uTint;
  col = vec3(1.0) - exp(-col);
  gl_FragColor = vec4(col, 1.0);
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

fn palette(t: f32) -> vec3f {
  return vec3f(0.56, 0.40, 0.62) + vec3f(0.44, 0.38, 0.38) * cos(6.2831853 * (vec3f(t) + vec3f(0.0, 0.30, 0.62)));
}

struct Mist { density: f32, shade: f32 };

fn mist(at: vec3f) -> Mist {
  var p = at;
  let flow = material.uFlow;
  let r = length(p.xz);
  let a = material.uSwirl * (1.15 - r) * 2.2 + flow * 0.9 + material.uBands * (p.y * 3.5 + 0.6 * sin(p.y * 7.0 + flow * 0.5));
  let c = cos(a);
  let s = sin(a);
  let turned = mat2x2f(c, -s, s, c) * p.xz;
  p = vec3f(turned.x, p.y, turned.y);
  var q = p * vec3f(2.8, 2.8 + material.uBands * 4.0, 2.8);
  for (var i = 1; i < 5; i++) {
    let fi = f32(i);
    q += material.uChurn / fi * sin(fi * 1.6 * q.yzx + flow * (0.7 + 0.3 * fi));
  }
  var ribbon = 1.0 - abs(sin(1.3 * q.x + 1.1 * q.y - 0.9 * q.z));
  ribbon *= ribbon;
  ribbon *= ribbon;
  let veil = 0.5 + 0.5 * sin(0.8 * q.y - 0.7 * q.x + 0.6 * q.z);
  return Mist(ribbon * ribbon * 1.4 + veil * veil * veil * 0.3, 0.12 * q.x + 0.17 * q.y - 0.08 * q.z);
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
  let light = palette(material.uHue + 0.5);
  var col = vec3f(0.0);
  for (var i = 0; i < STEPS; i++) {
    let p = (ro + rd * (t0 + (f32(i) + jitter) * dt) - material.uCenter) / material.uRadius;
    let d2 = dot(p, p);
    let edge = clamp(1.0 - d2, 0.0, 1.0);
    let m = mist(p);
    var tone = palette((m.shade + d2 * 0.3) * material.uSpread + material.uHue);
    if (material.uDuo > 0.5) {
      tone = mix(material.uDuoA, material.uDuoB, smoothstep(-0.75, 0.3, 0.45 * m.shade + 0.8 * cos((p.y - 0.16) * 12.5)));
      tone = mix(tone, material.uDuoC, 0.85 * smoothstep(0.45, 0.9, m.shade));
    }
    col += tone * m.density * edge * edge;
    col += light * material.uCore * exp(-d2 * 7.0) * 0.35;
  }
  col *= material.uGlow * 2.6 * dt / material.uRadius * material.uTint;
  col = vec3f(1.0) - exp(-col);
  return vec4f(col, 1.0);
}
`;

/** The mist's material: additive, drawn over the glass, and writing no depth. */
export function createVisionMaterial(GFX) {
  return new GFX.ShaderMaterial({
    name: 'vision',
    uniforms: visionUniforms(GFX),
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
    transparent: true,
    blending: GFX.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * The same palette on the CPU, for what the visions light outside the glass:
 * the stand, the aura. Returns 0..1 RGB.
 */
export function paletteColour(t) {
  const a = [0.56, 0.40, 0.62];
  const b = [0.44, 0.38, 0.38];
  const d = [0.0, 0.30, 0.62];
  return a.map((v, i) => v + b[i] * Math.cos(2 * Math.PI * (t + d[i])));
}
