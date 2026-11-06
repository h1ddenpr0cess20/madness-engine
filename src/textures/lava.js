/**
 * Procedural lava for both continuous world surfaces and deforming objects.
 *
 * A warped 3D field breaks the surface into domed basalt plates. Their
 * irregular boundaries split into glowing fissures, with finer hairline
 * cracks, slow molten flow and occasional hot embers. Coordinates are taken
 * from world space for floors or object space for things like Slimey, so the
 * pattern has no UV border, tile frame or seam at a texture edge.
 *
 * The GLSL and WGSL versions intentionally use the same fields and thresholds.
 * Existing callers keep the `uTime` and `uBright` controls.
 */

const GLSL_VERTEX = /* glsl */`
varying vec3 vWorld;
varying vec3 vLocal;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vLocal = position;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const GLSL_FRAGMENT = /* glsl */`
uniform float uTime;
uniform float uBright;
uniform float uScale;
uniform float uLocal;
varying vec3 vWorld;
varying vec3 vLocal;

float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}
vec3 hash33(vec3 p) {
  return fract(sin(vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  )) * 43758.5453);
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
  for (int i = 0; i < 5; i++) {
    sum += noise3(p) * amp;
    p = p * 2.03 + vec3(13.1, 7.7, 3.4);
    amp *= 0.5;
  }
  return sum;
}

// Nearest and second-nearest feature distances form irregular, organic plates.
vec2 voronoi3(vec3 p) {
  vec3 cell = floor(p);
  vec3 local = fract(p);
  float d1 = 16.0;
  float d2 = 16.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 site = offset + hash33(cell + offset) * 0.78 + 0.11;
        vec3 delta = site - local;
        float d = dot(delta, delta);
        if (d < d1) { d2 = d1; d1 = d; }
        else if (d < d2) { d2 = d; }
      }
    }
  }
  float nearDistance = sqrt(d1);
  return vec2(nearDistance, sqrt(d2) - nearDistance);
}

vec3 heatColour(float h) {
  vec3 c = mix(vec3(0.16, 0.008, 0.002), vec3(0.78, 0.075, 0.008), smoothstep(0.04, 0.42, h));
  c = mix(c, vec3(1.0, 0.31, 0.025), smoothstep(0.38, 0.72, h));
  c = mix(c, vec3(1.0, 0.72, 0.22), smoothstep(0.72, 0.91, h));
  return mix(c, vec3(1.0, 0.96, 0.78), smoothstep(0.91, 1.0, h));
}

void main() {
  float t = uTime;
  // Floors use continuous world coordinates; rounded/deforming objects use
  // their local vertex positions. Neither path depends on a UV rectangle.
  vec3 worldSurface = vec3(vWorld.x, vWorld.z, vWorld.y * 0.28);
  vec3 p = mix(worldSurface, vLocal, uLocal) * uScale;
  vec3 drift = vec3(t * 0.035, -t * 0.022, t * 0.027);

  vec3 warp = vec3(
    fbm3(p * 0.52 + drift + vec3(2.1, 5.7, 1.3)),
    fbm3(p * 0.52 - drift.yzx + vec3(7.2, 1.8, 4.6)),
    fbm3(p * 0.52 + drift.zxy + vec3(3.4, 8.1, 6.2))
  );
  vec3 q = p * 1.72 + (warp - 0.5) * 1.45 + drift * 0.75;
  vec2 plates = voronoi3(q);
  float crack = 1.0 - smoothstep(0.028, 0.105, plates.y);

  float grain = fbm3(q * 2.5 + vec3(4.0, 1.3, 8.2));
  float flow = fbm3(q * 0.72 + drift * 1.8 + vec3(5.2, 2.7, 9.1));
  float fineField = fbm3(q * 3.8 + drift * 2.6);
  float fineCrack = pow(clamp(1.0 - abs(fineField * 2.0 - 1.0), 0.0, 1.0), 7.0);
  fineCrack *= smoothstep(0.075, 0.24, plates.y);
  float poolField = fbm3(q * 0.34 - drift * 0.65 + vec3(9.7, 2.2, 3.8));
  float pool = smoothstep(0.67, 0.84, poolField);

  float heat = clamp(crack * (0.76 + flow * 0.34) + fineCrack * 0.22 + pool * 0.42, 0.0, 1.0);
  float plateDome = 1.0 - smoothstep(0.08, 0.74, plates.x);
  vec3 basalt = mix(vec3(0.009, 0.012, 0.017), vec3(0.105, 0.043, 0.029), grain * 0.82);
  basalt *= 0.72 + plateDome * 0.42;
  basalt += heatColour(0.24) * exp(-plates.y * 34.0) * 0.16;

  float molten = clamp(0.22 + heat * 0.72 + (flow - 0.5) * 0.2, 0.0, 1.0);
  float pulse = 0.94 + 0.06 * sin(t * 1.7 + flow * 7.0);
  vec3 colour = mix(basalt, heatColour(molten) * pulse, clamp(heat * 1.18, 0.0, 1.0));

  // Sparse embers are embedded in the same 3D field and drift with the crust.
  vec3 emberCell = floor(q * 11.0);
  vec3 emberLocal = fract(q * 11.0) - 0.5;
  float emberPick = hash31(emberCell + vec3(17.1, 4.7, 9.2));
  float ember = step(0.993, emberPick)
    * (1.0 - smoothstep(0.025, 0.16, length(emberLocal)))
    * (0.55 + 0.45 * sin(t * 3.2 + emberPick * 51.0));
  colour += heatColour(0.88) * ember * 0.72;

  gl_FragColor = vec4(colour * uBright, 1.0);
}
`;

const WGSL = /* wgsl */`
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) world: vec3f,
  @location(1) localPos: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f) -> Varyings {
  var out: Varyings;
  let world = object.modelMatrix * vec4f(position, 1.0);
  out.world = world.xyz;
  out.localPos = position;
  out.position = object.projectionMatrix * object.viewMatrix * world;
  return out;
}

fn hash31(p: vec3f) -> f32 {
  return fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453123);
}
fn hash33(p: vec3f) -> vec3f {
  return fract(sin(vec3f(
    dot(p, vec3f(127.1, 311.7, 74.7)),
    dot(p, vec3f(269.5, 183.3, 246.1)),
    dot(p, vec3f(113.5, 271.9, 124.6))
  )) * 43758.5453);
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
  for (var i = 0; i < 5; i++) {
    sum += noise3(p) * amp;
    p = p * 2.03 + vec3f(13.1, 7.7, 3.4);
    amp *= 0.5;
  }
  return sum;
}
fn voronoi3(p: vec3f) -> vec2f {
  let cell = floor(p);
  let local = fract(p);
  var d1 = 16.0;
  var d2 = 16.0;
  for (var z = -1; z <= 1; z++) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let offset = vec3f(f32(x), f32(y), f32(z));
        let site = offset + hash33(cell + offset) * 0.78 + 0.11;
        let delta = site - local;
        let d = dot(delta, delta);
        if (d < d1) { d2 = d1; d1 = d; }
        else if (d < d2) { d2 = d; }
      }
    }
  }
  let nearDistance = sqrt(d1);
  return vec2f(nearDistance, sqrt(d2) - nearDistance);
}
fn heatColour(h: f32) -> vec3f {
  var c = mix(vec3f(0.16, 0.008, 0.002), vec3f(0.78, 0.075, 0.008), smoothstep(0.04, 0.42, h));
  c = mix(c, vec3f(1.0, 0.31, 0.025), smoothstep(0.38, 0.72, h));
  c = mix(c, vec3f(1.0, 0.72, 0.22), smoothstep(0.72, 0.91, h));
  return mix(c, vec3f(1.0, 0.96, 0.78), smoothstep(0.91, 1.0, h));
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let worldSurface = vec3f(in.world.x, in.world.z, in.world.y * 0.28);
  let p = mix(worldSurface, in.localPos, material.uLocal) * material.uScale;
  let drift = vec3f(t * 0.035, -t * 0.022, t * 0.027);

  let warp = vec3f(
    fbm3(p * 0.52 + drift + vec3f(2.1, 5.7, 1.3)),
    fbm3(p * 0.52 - drift.yzx + vec3f(7.2, 1.8, 4.6)),
    fbm3(p * 0.52 + drift.zxy + vec3f(3.4, 8.1, 6.2))
  );
  let q = p * 1.72 + (warp - vec3f(0.5)) * 1.45 + drift * 0.75;
  let plates = voronoi3(q);
  let crack = 1.0 - smoothstep(0.028, 0.105, plates.y);

  let grain = fbm3(q * 2.5 + vec3f(4.0, 1.3, 8.2));
  let flow = fbm3(q * 0.72 + drift * 1.8 + vec3f(5.2, 2.7, 9.1));
  let fineField = fbm3(q * 3.8 + drift * 2.6);
  var fineCrack = pow(clamp(1.0 - abs(fineField * 2.0 - 1.0), 0.0, 1.0), 7.0);
  fineCrack *= smoothstep(0.075, 0.24, plates.y);
  let poolField = fbm3(q * 0.34 - drift * 0.65 + vec3f(9.7, 2.2, 3.8));
  let pool = smoothstep(0.67, 0.84, poolField);

  let heat = clamp(crack * (0.76 + flow * 0.34) + fineCrack * 0.22 + pool * 0.42, 0.0, 1.0);
  let plateDome = 1.0 - smoothstep(0.08, 0.74, plates.x);
  var basalt = mix(vec3f(0.009, 0.012, 0.017), vec3f(0.105, 0.043, 0.029), grain * 0.82);
  basalt *= 0.72 + plateDome * 0.42;
  basalt += heatColour(0.24) * exp(-plates.y * 34.0) * 0.16;

  let molten = clamp(0.22 + heat * 0.72 + (flow - 0.5) * 0.2, 0.0, 1.0);
  let pulse = 0.94 + 0.06 * sin(t * 1.7 + flow * 7.0);
  var colour = mix(basalt, heatColour(molten) * pulse, clamp(heat * 1.18, 0.0, 1.0));

  let emberCell = floor(q * 11.0);
  let emberLocal = fract(q * 11.0) - vec3f(0.5);
  let emberPick = hash31(emberCell + vec3f(17.1, 4.7, 9.2));
  let ember = step(0.993, emberPick)
    * (1.0 - smoothstep(0.025, 0.16, length(emberLocal)))
    * (0.55 + 0.45 * sin(t * 3.2 + emberPick * 51.0));
  colour += heatColour(0.88) * ember * 0.72;

  return vec4f(colour * material.uBright, 1.0);
}
`;

/**
 * The lava's material. By default it maps continuously in world space for
 * floors. Use `mapping: 'local'` and a higher `scale` for a rounded object
 * whose geometry moves or deforms; its pattern follows the vertices.
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
