/**
 * The lava pit. A shader of its own (GLSL for WebGL 2, WGSL for WebGPU, the
 * same picture from each) for the lava that lies at the bottom of a hole:
 *
 * - a crust of dark basalt plates sliding over the melt, each domed and
 *   grainy, its edges lit from below by the heat that seeps up round them;
 * - molten lakes of melt where the crust has broken away, streaming as they
 *   flow, the colour of real heat (black-red, red, orange, yellow, and
 *   nearly white where it is hottest) rather than a flat orange;
 * - bright glints sliding over the liquid, from a surface that moves, so it
 *   reads as wet and heavy and not as a painted floor;
 * - sparks drifting off it, and bubbles that swell, bulge the crust, burst
 *   and flash;
 * - a slow breath through all of it.
 *
 * It lights itself: what it draws is what you see, whatever the lights.
 * `createLavaPitMaterial` is the surface alone, for games that supply their
 * own pit geometry (Dungeon Roller's `built.lava`, and the same for Rock 'n'
 * Roller and Metroll). `createLavaPit` is a whole pit: a stone rim, walls
 * going down, the lava at the bottom, and a warm light that flickers over
 * its surroundings.
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
// The crust's plates: distance to the nearest plate's middle, and the gap between it and the next (0 on a crack).
vec2 plates(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.5 + 0.38 * sin(t * 0.25 + 6.2831 * hash2(i + g));
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2(d1, d2 - d1);
}
// The colour of heat, 0 (black-red) to 1 (nearly white).
vec3 heatColor(float h) {
  vec3 c = mix(vec3(0.05, 0.0, 0.0), vec3(0.6, 0.05, 0.0), smoothstep(0.0, 0.3, h));
  c = mix(c, vec3(1.0, 0.27, 0.02), smoothstep(0.25, 0.55, h));
  c = mix(c, vec3(1.0, 0.64, 0.1), smoothstep(0.5, 0.8, h));
  return mix(c, vec3(1.0, 0.93, 0.66), smoothstep(0.8, 1.05, h));
}
void main() {
  float t = uTime;
  vec2 p = vWorld.xz;
  vec2 drift = vec2(t * 0.035, -t * 0.02);
  vec2 warp = vec2(fbm(p * 0.6 + drift), fbm(p * 0.6 + vec2(4.3, 1.7) - drift)) - 0.5;

  // The crust slides over the melt, and breaks open into lakes.
  vec2 q = p * 1.35 + warp * 2.2 + drift * 1.5;
  vec2 v = plates(q, t);
  vec2 w = plates(q * 2.9 + vec2(5.2, 1.3), t * 0.6);
  float lake = smoothstep(0.4, 0.6, fbm(p * 0.55 + vec2(2.0, t * 0.02) + warp));
  float crack = 1.0 - smoothstep(0.0, 0.2, v.y);
  float halo = exp(-v.y * 7.0);
  float fine = (1.0 - smoothstep(0.0, 0.05, w.y)) * 0.5 * smoothstep(0.1, 0.35, v.y);
  float molten = clamp(lake + crack, 0.0, 1.0);

  // The melt: hotter in the cracks and at the middle of a lake, streaming as it moves.
  vec2 fp = p * 2.4 + warp * 3.0 + vec2(t * 0.22, t * 0.1);
  float flow = fbm(fp);
  float flow2 = fbm(p * 5.0 - warp * 2.0 - vec2(t * 0.3, 0.0));
  float pulse = 0.88 + 0.12 * sin(t * 1.6 + fbm(p * 1.3) * 6.0);
  float h = clamp(0.3 + 0.5 * flow + 0.6 * crack * crack + 0.22 * lake * flow2, 0.0, 1.1);
  vec3 melt = heatColor(h) * pulse * 1.2;

  // The crust: basalt, each plate domed and grainy, its edges lit from the melt beneath.
  float dome = 1.0 - smoothstep(0.0, 0.62, v.x);
  float grain = vnoise(q * 7.0) * 0.6 + vnoise(q * 17.0) * 0.4;
  vec3 crust = vec3(0.055, 0.03, 0.028) * (0.5 + 0.8 * dome) * (0.6 + 0.8 * grain);
  crust += heatColor(0.34) * halo * 0.9 * pulse;
  crust += heatColor(0.5) * fine * 0.8;

  vec3 col = mix(crust, melt, molten);

  // Glints sliding over the liquid: a surface that moves, lit by a high light.
  float e = 0.07;
  float hx = fbm((p + vec2(e, 0.0)) * 2.4 + warp * 3.0 + vec2(t * 0.22, t * 0.1));
  float hz = fbm((p + vec2(0.0, e)) * 2.4 + warp * 3.0 + vec2(t * 0.22, t * 0.1));
  vec3 n = normalize(vec3(-(hx - flow) / e * 0.45, 1.0, -(hz - flow) / e * 0.45));
  vec3 view = normalize(cameraPosition - vWorld);
  vec3 hv = normalize(normalize(vec3(0.35, 0.8, 0.25)) + view);
  float spec = pow(max(dot(n, hv), 0.0), 70.0);
  col += vec3(1.0, 0.78, 0.45) * spec * molten * 1.1;

  // Sparks drifting off it.
  vec2 sp = p * 7.0 + vec2(t * 0.35, -t * 0.9);
  vec2 sc = floor(sp);
  float sr = hash1(sc);
  float spark = step(0.965, sr) * (1.0 - smoothstep(0.03, 0.13, length(fract(sp) - 0.5 - (hash2(sc) - 0.5) * 0.5))) * (0.5 + 0.5 * sin(t * 6.0 + sr * 50.0));
  col += vec3(1.0, 0.55, 0.15) * spark * 1.4;

  // Bubbles: a bulge swells, bursts, and flashes.
  vec2 cell = floor(p * 1.1);
  float pick = hash1(cell);
  if (pick > 0.7) {
    vec2 at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.1;
    float phase = fract(t * (0.16 + pick * 0.2) + pick * 9.0);
    float r = phase * 0.3, d = length(p - at);
    float ring = (1.0 - smoothstep(0.0, 0.04, abs(d - r))) * (1.0 - phase);
    float bulge = (1.0 - smoothstep(0.0, max(r, 0.001), d)) * (1.0 - phase) * 0.7;
    float flash = (1.0 - smoothstep(0.0, 0.18, d)) * smoothstep(0.88, 0.96, phase) * (1.0 - smoothstep(0.96, 1.0, phase));
    col = mix(col, heatColor(0.9), clamp((ring + bulge) * (0.35 + 0.65 * molten), 0.0, 1.0));
    col += vec3(1.0, 0.7, 0.3) * flash * 1.2;
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
      let o = 0.5 + 0.38 * sin(t * 0.25 + 6.2831 * hash2(i + g));
      let d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2f(d1, d2 - d1);
}
fn heatColor(h: f32) -> vec3f {
  var c = mix(vec3f(0.05, 0.0, 0.0), vec3f(0.6, 0.05, 0.0), smoothstep(0.0, 0.3, h));
  c = mix(c, vec3f(1.0, 0.27, 0.02), smoothstep(0.25, 0.55, h));
  c = mix(c, vec3f(1.0, 0.64, 0.1), smoothstep(0.5, 0.8, h));
  return mix(c, vec3f(1.0, 0.93, 0.66), smoothstep(0.8, 1.05, h));
}
@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let t = material.uTime;
  let p = in.world.xz;
  let drift = vec2f(t * 0.035, -t * 0.02);
  let warp = vec2f(fbm(p * 0.6 + drift), fbm(p * 0.6 + vec2f(4.3, 1.7) - drift)) - 0.5;

  let q = p * 1.35 + warp * 2.2 + drift * 1.5;
  let v = plates(q, t);
  let w = plates(q * 2.9 + vec2f(5.2, 1.3), t * 0.6);
  let lake = smoothstep(0.4, 0.6, fbm(p * 0.55 + vec2f(2.0, t * 0.02) + warp));
  let crack = 1.0 - smoothstep(0.0, 0.2, v.y);
  let halo = exp(-v.y * 7.0);
  let fine = (1.0 - smoothstep(0.0, 0.05, w.y)) * 0.5 * smoothstep(0.1, 0.35, v.y);
  let molten = clamp(lake + crack, 0.0, 1.0);

  let fp = p * 2.4 + warp * 3.0 + vec2f(t * 0.22, t * 0.1);
  let flow = fbm(fp);
  let flow2 = fbm(p * 5.0 - warp * 2.0 - vec2f(t * 0.3, 0.0));
  let pulse = 0.88 + 0.12 * sin(t * 1.6 + fbm(p * 1.3) * 6.0);
  let h = clamp(0.3 + 0.5 * flow + 0.6 * crack * crack + 0.22 * lake * flow2, 0.0, 1.1);
  let melt = heatColor(h) * pulse * 1.2;

  let dome = 1.0 - smoothstep(0.0, 0.62, v.x);
  let grain = vnoise(q * 7.0) * 0.6 + vnoise(q * 17.0) * 0.4;
  var crust = vec3f(0.055, 0.03, 0.028) * (0.5 + 0.8 * dome) * (0.6 + 0.8 * grain);
  crust += heatColor(0.34) * halo * 0.9 * pulse;
  crust += heatColor(0.5) * fine * 0.8;

  var col = mix(crust, melt, molten);

  let e = 0.07;
  let hx = fbm((p + vec2f(e, 0.0)) * 2.4 + warp * 3.0 + vec2f(t * 0.22, t * 0.1));
  let hz = fbm((p + vec2f(0.0, e)) * 2.4 + warp * 3.0 + vec2f(t * 0.22, t * 0.1));
  let n = normalize(vec3f(-(hx - flow) / e * 0.45, 1.0, -(hz - flow) / e * 0.45));
  let view = normalize(object.cameraPosition - in.world);
  let hv = normalize(normalize(vec3f(0.35, 0.8, 0.25)) + view);
  let spec = pow(max(dot(n, hv), 0.0), 70.0);
  col += vec3f(1.0, 0.78, 0.45) * spec * molten * 1.1;

  let sp = p * 7.0 + vec2f(t * 0.35, -t * 0.9);
  let sc = floor(sp);
  let sr = hash1(sc);
  let spark = step(0.965, sr) * (1.0 - smoothstep(0.03, 0.13, length(fract(sp) - 0.5 - (hash2(sc) - 0.5) * 0.5))) * (0.5 + 0.5 * sin(t * 6.0 + sr * 50.0));
  col += vec3f(1.0, 0.55, 0.15) * spark * 1.4;

  let cell = floor(p * 1.1);
  let pick = hash1(cell);
  if (pick > 0.7) {
    let at = (cell + 0.25 + 0.5 * hash2(cell + 7.0)) / 1.1;
    let phase = fract(t * (0.16 + pick * 0.2) + pick * 9.0);
    let r = phase * 0.3;
    let d = length(p - at);
    let ring = (1.0 - smoothstep(0.0, 0.04, abs(d - r))) * (1.0 - phase);
    let bulge = (1.0 - smoothstep(0.0, max(r, 0.001), d)) * (1.0 - phase) * 0.7;
    let flash = (1.0 - smoothstep(0.0, 0.18, d)) * smoothstep(0.88, 0.96, phase) * (1.0 - smoothstep(0.96, 1.0, phase));
    col = mix(col, heatColor(0.9), clamp((ring + bulge) * (0.35 + 0.65 * molten), 0.0, 1.0));
    col += vec3f(1.0, 0.7, 0.3) * flash * 1.2;
  }
  return vec4f(col * material.uBright, 1.0);
}`;

/**
 * The lava surface alone, for any pit geometry (it works in world space, so
 * separate pieces join up). `uniforms.uTime` is seconds; `uniforms.uBright`
 * dims or flares the whole of it.
 */
export function createLavaPitMaterial(GFX) {
  return new GFX.ShaderMaterial({
    name: 'lava-pit',
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 } },
    glsl: { vertex: GLSL_VERTEX, fragment: GLSL_FRAGMENT },
    wgsl: WGSL,
    side: GFX.DoubleSide,
    toneMapped: false,
    depthWrite: true,
  });
}

/** Seconds into the flicker: the light over the pit is the sum of a few slow sines, never quite the same twice. */
export function lavaFlicker(time) {
  return 0.82 + 0.1 * Math.sin(time * 1.7) + 0.05 * Math.sin(time * 4.3 + 1.3) + 0.03 * Math.sin(time * 9.1 + 0.4);
}

/**
 * A whole pit: a rim of dark stone, walls that go down, the lava at the
 * bottom of them, and a warm light hung over it that flickers. The pit is
 * `width` by `depth` across and `sink` deep, centred on the origin with its
 * rim at y = 0. `update(time)` moves it. Dispose of nothing: it is all made
 * of the material and a few boxes.
 */
export function createLavaPit(GFX, { width = 3, depth = 3, sink = 0.6, rim = 0.3, light = true } = {}) {
  const group = new GFX.Group();
  group.name = 'lava_pit';

  const material = createLavaPitMaterial(GFX);
  const surface = new GFX.Mesh(new GFX.PlaneGeometry(width, depth, 1, 1), material);
  surface.name = 'lava_surface';
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -sink;
  surface.receiveShadow = false;
  surface.castShadow = false;
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

  let glow = null;
  if (light) {
    glow = new GFX.PointLight('#ff6a1a', 5, Math.max(width, depth) * 2, 2);
    glow.position.set(0, -sink * 0.75, 0);
    glow.name = 'lava_light';
    group.add(glow);
  }

  return {
    group,
    material,
    surface,
    light: glow,
    update(time) {
      material.uniforms.uTime.value = time;
      const f = lavaFlicker(time);
      material.uniforms.uBright.value = 0.94 + 0.06 * Math.sin(time * 1.7);
      stone.emissiveIntensity = 0.015 + 0.02 * f;
      if (glow) glow.intensity = 5 * f;
    },
  };
}
