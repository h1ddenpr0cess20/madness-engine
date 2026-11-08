/**
 * The lava pit: Slimey's lava on the floor of a hole. The same melt, the same
 * flows, colors and bubbling (see `textures/lava.js`), but in one pass and
 * computed per pixel in 3D world space: the basalt is procedural too, so there
 * is no baked texture to stretch, tile or show a seam, and separate pieces of
 * pit join up. The melt is glossy, wet glints sliding over it; the basalt is
 * dull. GLSL for WebGL 2 and WGSL for WebGPU, the same picture from each.
 *
 * `createLavaSurface(GFX, geometry)` is the lava alone, for any pit geometry
 * (Dungeon Roller's `built.lava`, and the same for Rock 'n' Roller and
 * Metroll). `createLavaPit` is a whole pit: a stone rim, walls going down, the
 * lava at the bottom, and a warm light that flickers over its surroundings.
 */

const GLSL_VERTEX = `varying vec3 vWorld;
varying vec3 vNormalWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const GLSL_FRAGMENT = `uniform float uTime;
uniform float uBright;
uniform float uScale;
uniform float uCoverage;
uniform float uGlow;
varying vec3 vWorld;
varying vec3 vNormalWorld;

float hash31(vec3 p) {
  vec3 q = fract(p * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash31(i);
  float b = hash31(i + vec3(1.0, 0.0, 0.0));
  float c = hash31(i + vec3(0.0, 1.0, 0.0));
  float d = hash31(i + vec3(1.0, 1.0, 0.0));
  float e = hash31(i + vec3(0.0, 0.0, 1.0));
  float f1 = hash31(i + vec3(1.0, 0.0, 1.0));
  float g = hash31(i + vec3(0.0, 1.0, 1.0));
  float h = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
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
  vec3 w = vWorld;
  vec3 p = w * uScale;

  // Slimey's melt, unchanged: broad flows advected and re-warped over time.
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
  float magma = broadFlow * 0.70 + mediumFlow * 0.20 + reservoir * 0.10;
  float edgeAA = clamp(fwidth(magma) * 1.35, 0.008, 0.045);
  float shoulder = smoothstep(0.43 - uCoverage - edgeAA, 0.55 - uCoverage + edgeAA, magma);
  float pools = smoothstep(0.70, 0.86, reservoir) * 0.44;
  float bubbleField = fbm3(q * 0.48 + vec3(t * 0.021, -t * 0.017, t * 0.014) + vec3(1.8, 6.4, 3.2));
  float bubbleAA = clamp(fwidth(bubbleField) * 1.2, 0.01, 0.05);
  float bubbles = smoothstep(0.66 - bubbleAA, 0.82 + bubbleAA, bubbleField);
  float bubblePulse = 0.78 + 0.22 * sin(t * 0.82 + detailHeat * 5.4);
  float life = fbm3(q * 0.54 + vec3(t * 0.037, -t * 0.029, t * 0.023) + vec3(6.1, 2.5, 9.3));
  float activity = smoothstep(0.34, 0.70, life);
  float mask = clamp(max(shoulder * 0.9, pools) * mix(0.6, 1.0, activity) * bubblePulse, 0.0, 1.0);
  float core = smoothstep(0.565 - uCoverage, 0.67 - uCoverage, magma + detailHeat * 0.055);
  float temperature = clamp(0.24 + core * 0.48 + pools * 0.28 + bubbles * 0.16 + detailHeat * 0.13, 0.0, 1.0);
  vec3 melt = heat(temperature);
  float coolingRim = smoothstep(0.47, 0.57, magma) * (1.0 - smoothstep(0.57, 0.65, magma));
  melt = mix(melt * 0.58, melt, coolingRim * 0.65) * 1.12 * uGlow;

  // The basalt crust, procedural in 3D so it never stretches, tiles or shows a seam.
  float broad = fbm3(w * 1.6 + vec3(1.3, 4.7, 8.1));
  float grain = noise3(w * 4.5 + vec3(8.4, 2.1, 6.8)) * 0.6 + noise3(w * 10.0 + vec3(2.9, 7.3, 1.7)) * 0.4;
  float warmth = fbm3(w * 0.5 + vec3(3.1, 5.7, 1.9));
  vec3 albedo = vec3(
    mix(11.0, 34.0, broad) * (0.91 + grain * 0.16) + warmth * 2.0,
    mix(12.0, 24.0, broad) * (0.91 + grain * 0.16) + warmth * 0.55,
    mix(17.0, 23.0, broad) * (0.91 + grain * 0.16)
  ) / 255.0;
  // Smooth surface slope from the flowing field itself, so highlights follow
  // the flow and there is no grid of noise cells to see.
  vec3 fq = q * 1.9 + drift * 0.8;
  float h0 = fbm3(fq);
  vec3 slope = vec3(fbm3(fq + vec3(0.05, 0.0, 0.0)) - h0, fbm3(fq + vec3(0.0, 0.05, 0.0)) - h0, fbm3(fq + vec3(0.0, 0.0, 0.05)) - h0) / 0.05;
  vec3 view = normalize(cameraPosition - w);
  vec3 nw = normalize(vNormalWorld);
  if (dot(nw, view) < 0.0) nw = -nw;
  vec3 light = normalize(vec3(-0.45, 0.65, 0.6));
  vec3 hv = normalize(light + view);
  vec3 crustN = normalize(nw - slope * 0.12);
  // The basalt is dull: lit by diffuse alone, with only the faintest sheen.
  vec3 crust = albedo * (0.6 + 0.9 * max(dot(crustN, light), 0.0)) + vec3(0.5, 0.35, 0.3) * pow(max(dot(crustN, hv), 0.0), 9.0) * 0.035;
  // The melt lights the rock beside it.
  crust += heat(0.3) * 0.2 * smoothstep(0.3, 0.55, magma);
  // The melt is wet: a smooth surface with sharp glints sliding over it as it flows.
  vec3 meltN = normalize(nw - slope * 0.4);
  float glint = pow(max(dot(meltN, hv), 0.0), 60.0) * 1.7 + pow(max(dot(meltN, hv), 0.0), 14.0) * 0.3;
  vec3 col = crust + (melt + vec3(1.0, 0.82, 0.55) * glint) * mask;
  gl_FragColor = vec4(col * uBright, 1.0);
}`;


const WGSL = `struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) world: vec3f,
  @location(1) normalWorld: vec3f,
};
@vertex fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> Varyings {
  var out: Varyings;
  let world = object.modelMatrix * vec4f(position, 1.0);
  out.world = world.xyz;
  out.normalWorld = normalize((object.modelMatrix * vec4f(normal, 0.0)).xyz);
  out.position = object.projectionMatrix * object.viewMatrix * world;
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
  let a = hash31(i);
  let b = hash31(i + vec3f(1.0, 0.0, 0.0));
  let c = hash31(i + vec3f(0.0, 1.0, 0.0));
  let d = hash31(i + vec3f(1.0, 1.0, 0.0));
  let e = hash31(i + vec3f(0.0, 0.0, 1.0));
  let f1 = hash31(i + vec3f(1.0, 0.0, 1.0));
  let g = hash31(i + vec3f(0.0, 1.0, 1.0));
  let h = hash31(i + vec3f(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
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

@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let w = in.world;
  let p = w * material.uScale;

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
  let shoulder = smoothstep(0.43 - material.uCoverage - edgeAA, 0.55 - material.uCoverage + edgeAA, magma);
  let pools = smoothstep(0.70, 0.86, reservoir) * 0.44;
  let bubbleField = fbm3(q * 0.48 + vec3f(t * 0.021, -t * 0.017, t * 0.014) + vec3f(1.8, 6.4, 3.2));
  let bubbleAA = clamp(fwidth(bubbleField) * 1.2, 0.01, 0.05);
  let bubbles = smoothstep(0.66 - bubbleAA, 0.82 + bubbleAA, bubbleField);
  let bubblePulse = 0.78 + 0.22 * sin(t * 0.82 + detailHeat * 5.4);
  let life = fbm3(q * 0.54 + vec3f(t * 0.037, -t * 0.029, t * 0.023) + vec3f(6.1, 2.5, 9.3));
  let activity = smoothstep(0.34, 0.70, life);
  let mask = clamp(max(shoulder * 0.9, pools) * mix(0.6, 1.0, activity) * bubblePulse, 0.0, 1.0);
  let core = smoothstep(0.565 - material.uCoverage, 0.67 - material.uCoverage, magma + detailHeat * 0.055);
  let temperature = clamp(0.24 + core * 0.48 + pools * 0.28 + bubbles * 0.16 + detailHeat * 0.13, 0.0, 1.0);
  var melt = heat(temperature);
  let coolingRim = smoothstep(0.47, 0.57, magma) * (1.0 - smoothstep(0.57, 0.65, magma));
  melt = mix(melt * 0.58, melt, coolingRim * 0.65) * 1.12 * material.uGlow;

  let broad = fbm3(w * 1.6 + vec3f(1.3, 4.7, 8.1));
  let grain = noise3(w * 4.5 + vec3f(8.4, 2.1, 6.8)) * 0.6 + noise3(w * 10.0 + vec3f(2.9, 7.3, 1.7)) * 0.4;
  let warmth = fbm3(w * 0.5 + vec3f(3.1, 5.7, 1.9));
  let albedo = vec3f(
    mix(11.0, 34.0, broad) * (0.91 + grain * 0.16) + warmth * 2.0,
    mix(12.0, 24.0, broad) * (0.91 + grain * 0.16) + warmth * 0.55,
    mix(17.0, 23.0, broad) * (0.91 + grain * 0.16)
  ) / 255.0;
  let fq = q * 1.9 + drift * 0.8;
  let h0 = fbm3(fq);
  let slope = vec3f(fbm3(fq + vec3f(0.05, 0.0, 0.0)) - h0, fbm3(fq + vec3f(0.0, 0.05, 0.0)) - h0, fbm3(fq + vec3f(0.0, 0.0, 0.05)) - h0) / 0.05;
  let view = normalize(object.cameraPosition - w);
  var nw = normalize(in.normalWorld);
  if (dot(nw, view) < 0.0) { nw = -nw; }
  let light = normalize(vec3f(-0.45, 0.65, 0.6));
  let hv = normalize(light + view);
  let crustN = normalize(nw - slope * 0.12);
  var crust = albedo * (0.6 + 0.9 * max(dot(crustN, light), 0.0)) + vec3f(0.5, 0.35, 0.3) * pow(max(dot(crustN, hv), 0.0), 9.0) * 0.035;
  crust += heat(0.3) * 0.2 * smoothstep(0.3, 0.55, magma);
  let meltN = normalize(nw - slope * 0.4);
  let glint = pow(max(dot(meltN, hv), 0.0), 60.0) * 1.7 + pow(max(dot(meltN, hv), 0.0), 14.0) * 0.3;
  let col = crust + (melt + vec3f(1.0, 0.82, 0.55) * glint) * mask;
  return vec4f(col * material.uBright, 1.0);
}`;


/**
 * How much of Slimey's lava fits in a world unit. Slimey is a sphere of radius
 * 1 sampling its field out to 2.2, so 2.2 lays the same pattern out flat at the
 * same size, as if Slimey were rolled out with a rolling pin: a 3-unit pit shows
 * about three Slimeys' worth. Halve it for twice the size.
 */
export const SLIMEY_SCALE = 2.2;

/**
 * The lava material, in world space: `uniforms.uTime` (seconds),
 * `uniforms.uBright`, and `uniforms.uScale`, the size of the pattern
 * (`scale`, default `SLIMEY_SCALE`; smaller is bigger lava), `uniforms.uCoverage`
 * (`coverage`: how much of the surface is molten, 0 is Slimey's own, 0.07 by
 * default for a pit) and `uniforms.uGlow` (`glow`: melt brightness, 1.6).
 */
export function createLavaPitMaterial(GFX, { scale = SLIMEY_SCALE, coverage = 0.07, glow = 1.6 } = {}) {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('lava scale must be a positive finite number');
  if (!Number.isFinite(coverage) || !Number.isFinite(glow)) throw new Error('lava coverage and glow must be finite numbers');
  const material = new GFX.ShaderMaterial({
    name: 'lava-pit',
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 }, uScale: { value: scale }, uCoverage: { value: coverage }, uGlow: { value: glow } },
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
    side: GFX.DoubleSide,
    toneMapped: false,
    depthWrite: true,
  });
  return material;
}

/** The lava for `geometry`. Add `mesh` to the scene; `update(time)` moves it. */
export function createLavaSurface(GFX, geometry, options = {}) {
  const material = createLavaPitMaterial(GFX, options);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'lava';
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return {
    mesh, material,
    update(time) {
      material.uniforms.uTime.value = time;
      material.uniforms.uBright.value = 0.94 + 0.06 * Math.sin(time * 1.7);
    },
  };
}

/** Seconds into the flicker: the light over the pit is the sum of a few slow sines, never quite the same twice. */
export function lavaFlicker(time) {
  return 0.82 + 0.1 * Math.sin(time * 1.7) + 0.05 * Math.sin(time * 4.3 + 1.3) + 0.03 * Math.sin(time * 9.1 + 0.4);
}

/**
 * A whole pit: a rim of dark stone, walls that go down, the lava at the
 * bottom of them, and a warm light hung over it that flickers. The pit is
 * `width` by `depth` across and `sink` deep, centred on the origin with its
 * rim at y = 0. `update(time)` moves it.
 */
export function createLavaPit(GFX, { width = 3, depth = 3, sink = 0.6, rim = 0.3, light = true, scale = SLIMEY_SCALE, coverage, glow } = {}) {
  const group = new GFX.Group();
  group.name = 'lava_pit';

  const plane = new GFX.PlaneGeometry(width, depth, 1, 1);
  const lava = createLavaSurface(GFX, plane, { scale, ...(coverage === undefined ? {} : { coverage }), ...(glow === undefined ? {} : { glow }) });
  const material = lava.material;
  const surface = lava.mesh;
  surface.name = 'lava_surface';
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -sink;
  group.add(surface);

  // Stone, scorched dark and lit warm from beneath at the lip.
  const stone = new GFX.MeshStandardMaterial({
    name: 'lava_pit_stone',
    color: new GFX.Color('#0d0a09'),
    roughness: 0.85,
    metalness: 0,
    emissive: new GFX.Color('#ff3a05'),
    emissiveIntensity: 0.02,
  });
  const wall = (w, h, d, x, y, z, name) => {
    const m = new GFX.Mesh(new GFX.BoxGeometry(w, h, d), stone);
    m.position.set(x, y, z);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  // Four walls going down from the rim, slightly overlapping at the corners.
  const t = rim;
  wall(width + t * 2, sink, t, 0, -sink / 2, -(depth + t) / 2, 'pit_wall_back');
  wall(width + t * 2, sink, t, 0, -sink / 2, (depth + t) / 2, 'pit_wall_front');
  wall(t, sink, depth, -(width + t) / 2, -sink / 2, 0, 'pit_wall_left');
  wall(t, sink, depth, (width + t) / 2, -sink / 2, 0, 'pit_wall_right');
  // The lip: a flat ring of stone round the hole.
  const lip = (w, d, x, z, name) => wall(w, 0.06, d, x, 0.03, z, name);
  const lipW = rim * 1.4;
  lip(width + (t + lipW) * 2, lipW, 0, -(depth + t * 2 + lipW) / 2, 'pit_lip_back');
  lip(width + (t + lipW) * 2, lipW, 0, (depth + t * 2 + lipW) / 2, 'pit_lip_front');
  lip(lipW, depth + t * 2, -(width + t * 2 + lipW) / 2, 0, 'pit_lip_left');
  lip(lipW, depth + t * 2, (width + t * 2 + lipW) / 2, 0, 'pit_lip_right');

  let lamp = null;
  if (light) {
    lamp = new GFX.PointLight('#ff6a1a', 5, Math.max(width, depth) * 2, 2);
    lamp.position.set(0, -sink * 0.75, 0);
    lamp.name = 'lava_light';
    group.add(lamp);
  }

  return {
    group,
    material,
    surface,
    light: lamp,
    update(time) {
      lava.update(time);
      const f = lavaFlicker(time);
      stone.emissiveIntensity = 0.015 + 0.02 * f;
      if (lamp) lamp.intensity = 5 * f;
    },
  };
}
