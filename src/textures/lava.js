/**
 * High-detail procedural lava for continuous world surfaces and deforming meshes.
 *
 * The surface is built from advected, domain-warped 3D gradient noise rather
 * than UV tiles or cellular plates. Nested contour fields form branching,
 * molten channels through deeply mottled basalt. Thin inner filaments run
 * orange-to-white; their broad heat falloff warms the surrounding crust.
 * Synthetic studio ribbons reveal the crust's rough relief while the melt
 * stays emissive. No UVs, planes, frames or texture borders are involved.
 *
 * GLSL and WGSL intentionally share the same field construction and palette.
 * The legacy world-space constructor and uTime/uBright controls are preserved.
 */

const GLSL_VERTEX = /* glsl */`
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vLocal = position;
  vNormal = normalize(normalMatrix * normal);
  vView = -view.xyz;
  gl_Position = projectionMatrix * view;
}
`;

const GLSL_FRAGMENT = /* glsl */`
uniform float uTime;
uniform float uBright;
uniform float uScale;
uniform float uLocal;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;

float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

// Smooth trilinear value noise. Its rotated, offset octaves avoid the grid
// alignment and hard cellular boundaries of the previous lava treatment.
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float x00 = mix(n000, n100, u.x);
  float x10 = mix(n010, n110, u.x);
  float x01 = mix(n001, n101, u.x);
  float x11 = mix(n011, n111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}

float fbm3(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += noise3(p) * amp;
    p = p.yzx * 2.02 + vec3(17.13, 9.17, 13.71);
    amp *= 0.5;
  }
  return sum;
}

vec3 heatRamp(float h) {
  vec3 c = mix(vec3(0.075, 0.0025, 0.001), vec3(0.48, 0.018, 0.002), smoothstep(0.06, 0.34, h));
  c = mix(c, vec3(1.0, 0.13, 0.008), smoothstep(0.32, 0.62, h));
  c = mix(c, vec3(1.0, 0.49, 0.055), smoothstep(0.62, 0.84, h));
  c = mix(c, vec3(1.0, 0.91, 0.62), smoothstep(0.84, 0.98, h));
  return mix(c, vec3(1.0, 0.99, 0.91), smoothstep(0.98, 1.0, h));
}

void main() {
  float t = uTime;

  // A plane reads in world coordinates; a moving/deforming object reads in
  // its own coordinates. Both sample the same seamless three-dimensional field.
  vec3 worldP = vec3(vWorld.x, vWorld.z, vWorld.y * 0.37);
  vec3 p = mix(worldP, vLocal, uLocal) * uScale;

  // Three independent low-frequency fields bend the flow in all directions.
  // The animation is advection through the field, not a scrolling image.
  vec3 drift = vec3(t * 0.031, -t * 0.024, t * 0.019);
  vec3 warp = vec3(
    fbm3(p * 0.78 + drift + vec3(2.7, 5.1, 1.4)),
    fbm3(p.yzx * 0.78 - drift.zxy + vec3(8.2, 1.6, 4.9)),
    fbm3(p.zxy * 0.78 + drift.yzx + vec3(4.3, 9.1, 7.2))
  );
  vec3 q = p * 1.55 + (warp - 0.5) * 1.75;

  // Long, fluid rivers: a warped contour with a changing centre-line, plus
  // thinner subsidiary veins that break and rejoin the main channels.
  float flowA = fbm3(q * 1.55 + drift * 1.7 + vec3(1.2, 4.8, 7.3));
  float flowB = fbm3(q * 2.9 - drift.yzx * 2.4 + vec3(6.4, 2.3, 9.8));
  float flowC = fbm3(q * 6.1 + drift.zxy * 3.2 + vec3(3.3, 8.7, 1.9));
  float centreA = 0.49 + (flowB - 0.5) * 0.075;
  float centreB = 0.515 + (flowC - 0.5) * 0.045;
  float distanceA = abs(flowA - centreA);
  float distanceB = abs(flowB - centreB);

  float river = 1.0 - smoothstep(0.018, 0.085, distanceA);
  float riverCore = 1.0 - smoothstep(0.004, 0.027, distanceA);
  float tributary = (1.0 - smoothstep(0.006, 0.026, distanceB)) * 0.34;
  float hairline = (1.0 - smoothstep(0.004, 0.014, abs(flowC - 0.485))) * 0.18;

  // Broad, slowly swelling magma pockets sit between the narrow channels.
  float poolField = fbm3(q * 0.43 - drift * 0.52 + vec3(11.4, 3.8, 6.1));
  float pool = smoothstep(0.715, 0.875, poolField);
  float moltenMask = clamp(max(river, tributary) + hairline + pool * 0.42, 0.0, 1.0);

  // Basalt is not a flat black fill: two scales of mineral mottling, soot,
  // cooled red edges and small pits give the crust a dense, tactile surface.
  float mineral = fbm3(q * 2.35 + vec3(4.1, 7.7, 2.8));
  float grain = fbm3(q * 10.5 + vec3(9.4, 1.2, 5.6));
  float pits = smoothstep(0.76, 0.91, fbm3(q * 17.0 + vec3(3.2, 6.8, 8.1)));
  vec3 basalt = mix(vec3(0.006, 0.007, 0.012), vec3(0.105, 0.031, 0.019), mineral * 0.86);
  basalt *= 0.72 + grain * 0.48;
  basalt *= 1.0 - pits * 0.42;
  float warmEdge = exp(-distanceA * 47.0) * (1.0 - riverCore);
  basalt += vec3(0.22, 0.018, 0.003) * warmEdge * 0.22;

  // Temperature peaks in the thinnest centre of a fissure. The channel's
  // shoulders stay deep red, the body orange, and the narrowest core runs hot.
  float temperature = clamp(
    0.2 + river * 0.42 + riverCore * 0.31 + tributary * 0.2
      + hairline * 0.18 + pool * 0.34 + (flowB - 0.5) * 0.16,
    0.0, 1.0
  );
  vec3 molten = heatRamp(temperature);
  float shimmer = 0.955 + 0.045 * sin(t * 2.1 + flowB * 13.0 + flowC * 5.0);
  molten *= shimmer;

  vec3 colour = mix(basalt, molten, moltenMask);
  colour += heatRamp(0.48) * warmEdge * 0.06;

  // A sparse scattering of tiny, hot inclusions in the cooled crust.
  float emberField = fbm3(q * 22.0 + drift * 5.0 + vec3(7.3, 4.1, 2.6));
  float ember = smoothstep(0.865, 0.93, emberField) * (1.0 - moltenMask);
  ember *= 0.42 + 0.58 * sin(t * 3.4 + emberField * 77.0);
  colour += heatRamp(0.91) * ember * 0.62;

  // Broad studio reflections give the hard crust a polished, dimensional
  // finish; molten seams remain self-lit instead of looking like flat paint.
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L1 = normalize(vec3(-0.48, 0.78, 0.4));
  vec3 L2 = normalize(vec3(0.72, 0.28, -0.56));
  vec3 H1 = normalize(L1 + V);
  vec3 H2 = normalize(L2 + V);
  float diffuse = 0.42 + 0.58 * max(dot(N, L1), 0.0);
  float specular = pow(max(dot(N, H1), 0.0), 54.0) * 0.56
    + pow(max(dot(N, H2), 0.0), 24.0) * 0.18;
  float roughSpec = pow(max(dot(N, H1), 0.0), 10.0) * 0.08;
  colour *= diffuse;
  colour += vec3(1.0, 0.46, 0.2) * specular * (0.16 + 0.52 * (1.0 - moltenMask));
  colour += vec3(1.0, 0.21, 0.055) * roughSpec * (1.0 - moltenMask);
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  colour += vec3(0.26, 0.022, 0.004) * fresnel * (0.14 + river * 0.18);

  gl_FragColor = vec4(colour * uBright, 1.0);
}
`;

const WGSL = /* wgsl */`
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) world: vec3f,
  @location(1) localPos: vec3f,
  @location(2) normal: vec3f,
  @location(3) view: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> Varyings {
  var out: Varyings;
  let world = object.modelMatrix * vec4f(position, 1.0);
  let view = object.modelViewMatrix * vec4f(position, 1.0);
  out.world = world.xyz;
  out.localPos = position;
  out.normal = normalize(object.normalMatrix * normal);
  out.view = -view.xyz;
  out.position = object.projectionMatrix * view;
  return out;
}

fn hash31(p: vec3f) -> f32 {
  return fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453123);
}

fn noise3(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (vec3f(3.0) - 2.0 * f);
  let n000 = hash31(i + vec3f(0.0, 0.0, 0.0));
  let n100 = hash31(i + vec3f(1.0, 0.0, 0.0));
  let n010 = hash31(i + vec3f(0.0, 1.0, 0.0));
  let n110 = hash31(i + vec3f(1.0, 1.0, 0.0));
  let n001 = hash31(i + vec3f(0.0, 0.0, 1.0));
  let n101 = hash31(i + vec3f(1.0, 0.0, 1.0));
  let n011 = hash31(i + vec3f(0.0, 1.0, 1.0));
  let n111 = hash31(i + vec3f(1.0, 1.0, 1.0));
  let x00 = mix(n000, n100, u.x);
  let x10 = mix(n010, n110, u.x);
  let x01 = mix(n001, n101, u.x);
  let x11 = mix(n011, n111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}

fn fbm3(p0: vec3f) -> f32 {
  var p = p0;
  var sum = 0.0;
  var amp = 0.5;
  for (var i = 0; i < 5; i++) {
    sum += noise3(p) * amp;
    p = p.yzx * 2.02 + vec3f(17.13, 9.17, 13.71);
    amp *= 0.5;
  }
  return sum;
}

fn heatRamp(h: f32) -> vec3f {
  var c = mix(vec3f(0.075, 0.0025, 0.001), vec3f(0.48, 0.018, 0.002), smoothstep(0.06, 0.34, h));
  c = mix(c, vec3f(1.0, 0.13, 0.008), smoothstep(0.32, 0.62, h));
  c = mix(c, vec3f(1.0, 0.49, 0.055), smoothstep(0.62, 0.84, h));
  c = mix(c, vec3f(1.0, 0.91, 0.62), smoothstep(0.84, 0.98, h));
  return mix(c, vec3f(1.0, 0.99, 0.91), smoothstep(0.98, 1.0, h));
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let worldP = vec3f(in.world.x, in.world.z, in.world.y * 0.37);
  let p = mix(worldP, in.localPos, material.uLocal) * material.uScale;
  let drift = vec3f(t * 0.031, -t * 0.024, t * 0.019);

  let warp = vec3f(
    fbm3(p * 0.78 + drift + vec3f(2.7, 5.1, 1.4)),
    fbm3(p.yzx * 0.78 - drift.zxy + vec3f(8.2, 1.6, 4.9)),
    fbm3(p.zxy * 0.78 + drift.yzx + vec3f(4.3, 9.1, 7.2))
  );
  let q = p * 1.55 + (warp - vec3f(0.5)) * 1.75;

  let flowA = fbm3(q * 1.55 + drift * 1.7 + vec3f(1.2, 4.8, 7.3));
  let flowB = fbm3(q * 2.9 - drift.yzx * 2.4 + vec3f(6.4, 2.3, 9.8));
  let flowC = fbm3(q * 6.1 + drift.zxy * 3.2 + vec3f(3.3, 8.7, 1.9));
  let centreA = 0.49 + (flowB - 0.5) * 0.075;
  let centreB = 0.515 + (flowC - 0.5) * 0.045;
  let distanceA = abs(flowA - centreA);
  let distanceB = abs(flowB - centreB);

  let river = 1.0 - smoothstep(0.018, 0.085, distanceA);
  let riverCore = 1.0 - smoothstep(0.004, 0.027, distanceA);
  let tributary = (1.0 - smoothstep(0.006, 0.026, distanceB)) * 0.34;
  let hairline = (1.0 - smoothstep(0.004, 0.014, abs(flowC - 0.485))) * 0.18;

  let poolField = fbm3(q * 0.43 - drift * 0.52 + vec3f(11.4, 3.8, 6.1));
  let pool = smoothstep(0.715, 0.875, poolField);
  let moltenMask = clamp(max(river, tributary) + hairline + pool * 0.42, 0.0, 1.0);

  let mineral = fbm3(q * 2.35 + vec3f(4.1, 7.7, 2.8));
  let grain = fbm3(q * 10.5 + vec3f(9.4, 1.2, 5.6));
  let pits = smoothstep(0.76, 0.91, fbm3(q * 17.0 + vec3f(3.2, 6.8, 8.1)));
  var basalt = mix(vec3f(0.006, 0.007, 0.012), vec3f(0.105, 0.031, 0.019), mineral * 0.86);
  basalt *= 0.72 + grain * 0.48;
  basalt *= 1.0 - pits * 0.42;
  let warmEdge = exp(-distanceA * 47.0) * (1.0 - riverCore);
  basalt += vec3f(0.22, 0.018, 0.003) * warmEdge * 0.22;

  let temperature = clamp(
    0.2 + river * 0.42 + riverCore * 0.31 + tributary * 0.2
      + hairline * 0.18 + pool * 0.34 + (flowB - 0.5) * 0.16,
    0.0, 1.0
  );
  var molten = heatRamp(temperature);
  let shimmer = 0.955 + 0.045 * sin(t * 2.1 + flowB * 13.0 + flowC * 5.0);
  molten *= shimmer;

  var colour = mix(basalt, molten, moltenMask);
  colour += heatRamp(0.48) * warmEdge * 0.06;

  let emberField = fbm3(q * 22.0 + drift * 5.0 + vec3f(7.3, 4.1, 2.6));
  var ember = smoothstep(0.865, 0.93, emberField) * (1.0 - moltenMask);
  ember *= 0.42 + 0.58 * sin(t * 3.4 + emberField * 77.0);
  colour += heatRamp(0.91) * ember * 0.62;

  let N = normalize(in.normal);
  let V = normalize(in.view);
  let L1 = normalize(vec3f(-0.48, 0.78, 0.4));
  let L2 = normalize(vec3f(0.72, 0.28, -0.56));
  let H1 = normalize(L1 + V);
  let H2 = normalize(L2 + V);
  let diffuse = 0.42 + 0.58 * max(dot(N, L1), 0.0);
  let specular = pow(max(dot(N, H1), 0.0), 54.0) * 0.56
    + pow(max(dot(N, H2), 0.0), 24.0) * 0.18;
  let roughSpec = pow(max(dot(N, H1), 0.0), 10.0) * 0.08;
  colour *= diffuse;
  colour += vec3f(1.0, 0.46, 0.2) * specular * (0.16 + 0.52 * (1.0 - moltenMask));
  colour += vec3f(1.0, 0.21, 0.055) * roughSpec * (1.0 - moltenMask);
  let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  colour += vec3f(0.26, 0.022, 0.004) * fresnel * (0.14 + river * 0.18);

  return vec4f(colour * material.uBright, 1.0);
}
`;

/**
 * The shared lava material. World mapping is continuous across floor meshes;
 * local mapping makes the same 3D field follow moving/deforming objects.
 * Existing dungeon callers can keep using createLavaMaterial(GFX) and update
 * uTime/uBright without changing a line of game code.
 */
export function createLavaMaterial(GFX, { mapping = 'world', scale = 1.6 } = {}) {
  if (mapping !== 'world' && mapping !== 'local') throw new Error(`unknown lava mapping: ${mapping}`);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('lava scale must be a positive finite number');
  return new GFX.ShaderMaterial({
    name: 'lava',
    uniforms: {
      uTime: { value: 0 },
      uBright: { value: 1 },
      uScale: { value: scale },
      uLocal: { value: mapping === 'local' ? 1 : 0 },
    },
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
    toneMapped: false,
    depthWrite: true,
  });
}
