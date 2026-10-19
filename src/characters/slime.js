/**
 * The slime: Slimey's jelly orb (github.com/h1ddenpr0cess20/slimey, its
 * `orb`), brought down into the dungeon. Same jelly — a transmissive shell
 * pushed about by a few lobes of waves, bubbles drifting through it, a
 * bloom round its rim — but with no glowing core in it, sat on the floor as
 * a dome rather than floating, with a pair of eyes looking out of it, and
 * each slime one colour from the orb's palette instead of drifting through
 * all of them.
 *
 * `createSlime` gives { group, pose(state) }: `state.clip` is idle, walk,
 * attack, hit or ko, as for the sculpted models (model.js).
 */

/** The orb's palette; each slime is near one of these. */
const STOPS = ['#38f2b6', '#37c8f7', '#8f7bff', '#ff62c8', '#ffc861'];

/** Its rim bloom: brightest at the silhouette, gone face-on (Slimey's glow shaders). */
const GLOW_VERTEX = `varying vec3 vN; varying vec3 vP;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position * 1.035, 1.0);
  vP = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_FRAGMENT = `uniform vec3 uColor; uniform float uStrength;
varying vec3 vN; varying vec3 vP;
void main() {
  float f = 1.0 - abs(dot(normalize(vN), normalize(-vP)));
  float a = pow(f, 2.2) * (1.0 - pow(f, 8.0)) * uStrength;
  gl_FragColor = vec4(uColor * a, a);
}`;
const GLOW_WGSL = `struct Varyings { @builtin(position) position: vec4f, @location(0) vN: vec3f, @location(1) vP: vec3f };
@vertex fn vs(@location(0) position: vec3f, @location(1) normal: vec3f) -> Varyings {
  var out: Varyings;
  out.vN = normalize(object.normalMatrix * normal);
  let mv = object.modelViewMatrix * vec4f(position * 1.035, 1.0);
  out.vP = mv.xyz;
  out.position = object.projectionMatrix * mv;
  return out;
}
@fragment fn fs(in: Varyings) -> @location(0) vec4f {
  let f = 1.0 - abs(dot(normalize(in.vN), normalize(-in.vP)));
  let a = pow(f, 2.2) * (1.0 - pow(f, 8.0)) * material.uStrength;
  return vec4f(material.uColor * a, a);
}`;

/** Five lobes of waves over the surface, spread on a Fibonacci sphere (Slimey's lobes.js). */
function lobes(count = 5) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963, y = 1 - (2 * (i + 0.5)) / count, r = Math.sqrt(1 - y * y);
    out.push({ dir: [Math.cos(a) * r, y, Math.sin(a) * r], freq: 1 + i * 0.42, speed: 0.45 + i * 0.19, amp: 0.115 / (1 + i * 0.6), phase: i * 1.7 });
  }
  return out;
}

const LOBES = lobes();

/** Moves a unit sphere's vertices out and in by the lobes, then into a dome sat on y = 0 of height `tall`. */
function deform(attribute, base, list, { wobble, phase, ampScale, freqScale, phaseScale, sx, sy, dome }) {
  const a = attribute.array;
  for (let i = 0; i < a.length; i += 3) {
    const x = base[i], y = base[i + 1], z = base[i + 2];
    let d = 0;
    for (const l of list) d += l.amp * ampScale * Math.sin(l.freq * (x * l.dir[0] + y * l.dir[1] + z * l.dir[2]) * freqScale + phase * l.speed * phaseScale + l.phase);
    const s = 1 + d * wobble;
    let px = x * s * sx, py = y * s * sy, pz = z * s * sx;
    if (dome) {
      // Sat on the floor: the underside squashed flat and spread a little.
      if (py < -0.35 * sy) {
        const under = (-0.35 * sy - py) / (0.65 * sy);
        py = -0.35 * sy - under * 0.08 * sy;
        px *= 1 + under * 0.12; pz *= 1 + under * 0.12;
      }
      py += 0.43 * sy;
    }
    a[i] = px; a[i + 1] = py; a[i + 2] = pz;
  }
  attribute.needsUpdate = true;
}

/**
 * A slime `size` tiles across (its radius about half that), coloured from
 * the palette by `hue` (0–5, wrapping). `detail` picks the shell's grid:
 * 1 for close up, lower on the board.
 */
export function createSlime(GFX, { size = 0.85, hue = 0, detail = 1 } = {}) {
  const R = size / 2;
  const group = new GFX.Group();
  group.name = 'slime';
  const body = new GFX.Group();
  body.scale.setScalar(R);
  group.add(body);

  const colors = STOPS.map((h) => new GFX.Color(h));
  const colorAt = (t, out) => {
    const f = ((t % colors.length) + colors.length) % colors.length;
    const i = Math.floor(f);
    return out.copy(colors[i]).lerp(colors[(i + 1) % colors.length], f - i);
  };

  // Real glass (transmission) only close up: it has the renderer draw the
  // whole scene again behind it every frame, which a dungeon full of slimes
  // can't afford. On the board the jelly is see-through by blending instead.
  const glass = detail >= 1;
  const shellMaterial = new GFX.MeshPhysicalMaterial({
    name: glass ? 'slime-shell' : 'slime-shell-board', color: new GFX.Color('#38f2b6'), transparent: true, opacity: glass ? 0.8 : 0.62,
    transmission: glass ? 0.9 : 0, thickness: 0.35, ior: 1.3, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.06,
    iridescence: 0.35, iridescenceIOR: 1.35, attenuationDistance: 2.4, attenuationColor: new GFX.Color('#7ff0d8'),
    sheen: 0.5, sheenRoughness: 0.5, sheenColor: new GFX.Color('#ffffff'),
    emissive: new GFX.Color('#000000'), emissiveIntensity: glass ? 0 : 0.35,
    depthWrite: glass,
  });
  const shellGeometry = new GFX.SphereGeometry(1, Math.round(72 * detail) + 16, Math.round(48 * detail) + 10);
  const shellBase = shellGeometry.attributes.position.array.slice();
  const shell = new GFX.Mesh(shellGeometry, shellMaterial);
  shell.name = 'slime-shell';
  shell.castShadow = true;


  const glowMaterial = new GFX.ShaderMaterial({
    name: 'slime-glow',
    uniforms: { uColor: { value: new GFX.Color('#38f2b6') }, uStrength: { value: 0.5 } },
    glsl: { vertex: GLOW_VERTEX, fragment: GLOW_FRAGMENT },
    wgsl: GLOW_WGSL,
    transparent: true, blending: GFX.AdditiveBlending, depthWrite: false,
  });
  const glow = new GFX.Mesh(shellGeometry, glowMaterial);
  glow.name = 'slime-glow';

  // What makes it a monster: eyes, set in the jelly near the front, looking out.
  const eyeWhite = new GFX.MeshPhysicalMaterial({ name: 'slime-eye', color: new GFX.Color('#f6fff9'), roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
  const pupil = new GFX.MeshPhysicalMaterial({ name: 'slime-pupil', color: new GFX.Color('#06100c'), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
  const glint = new GFX.MeshBasicMaterial({ name: 'slime-glint', color: new GFX.Color('#ffffff') });
  const eyes = new GFX.Group();
  for (const m of [1, -1]) {
    const e = new GFX.Group();
    e.position.set(m * 0.3, 0.62, 0.72);
    e.rotation.y = m * 0.32;
    const white = new GFX.Mesh(new GFX.SphereGeometry(0.17, 20, 14), eyeWhite);
    white.scale.set(1, 1.15, 0.7);
    const p = new GFX.Mesh(new GFX.SphereGeometry(0.1, 16, 12), pupil);
    p.position.set(-m * 0.02, -0.02, 0.085);
    p.scale.set(1, 1.2, 0.55);
    const g = new GFX.Mesh(new GFX.SphereGeometry(0.03, 8, 6), glint);
    g.position.set(-m * 0.05, 0.04, 0.13);
    e.add(white, p, g);
    eyes.add(e);
  }

  const bubbleMaterial = new GFX.MeshPhysicalMaterial({
    name: 'slime-bubble', color: new GFX.Color('#eafffb'), roughness: 0.05, transmission: glass ? 0.95 : 0, thickness: 0.15, ior: 1.2, transparent: true, opacity: 0.5,
  });
  const bubbles = Array.from({ length: 5 }, (_, i) => {
    const b = new GFX.Mesh(new GFX.SphereGeometry(0.05 + (i % 3) * 0.03, 12, 8), bubbleMaterial);
    b.userData.orbit = { a: i * 2.399963, rr: 0.35 + (i % 4) * 0.1, y: 0.15 + i * 0.12, sp: 0.25 + (i % 3) * 0.14 };
    return b;
  });

  body.add(shell, eyes, glow, ...bubbles);
  for (const o of [glow, eyes, ...bubbles]) o.traverse((x) => { x.castShadow = false; });

  const tint = new GFX.Color(), white = new GFX.Color('#ffffff');
  const own = ((hue % STOPS.length) + STOPS.length) % STOPS.length;
  let shaped = -Infinity, lastClip = null;

  return {
    group,
    body,
    /** Wobbles, glows and moves it for `state` ({ clip, t, time, seed, speed }). */
    pose({ clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
      const T = time + seed;
      // How lively, how wide and how tall it is, by what it is doing.
      let wobble = 1.15, rate = 1, sx = 1, sy = 0.72, lift = 0, glowK = 1;
      if (clip === 'walk') {
        // Oozing along: a squash and a stretch with every heave.
        const h = Math.sin(T * 7 * Math.max(0.5, speed));
        wobble = 1.4; rate = 2;
        sx = 1 + h * 0.08; sy = 0.72 - h * 0.08;
      } else if (clip === 'attack') {
        // Rears up tall, then slams down flat.
        const up = Math.min(1, t / 0.24), slam = Math.max(0, Math.min(1, (t - 0.24) / 0.1)), back = Math.max(0, Math.min(1, (t - 0.36) / 0.3));
        const rear = up * (1 - slam), flat = slam * (1 - back);
        sy = 0.72 + rear * 0.45 - flat * 0.3;
        sx = 1 - rear * 0.18 + flat * 0.3;
        wobble = 1.2 + flat * 2; rate = 2.5; glowK = 1 + rear;
      } else if (clip === 'hit') {
        const j = Math.sin(Math.min(1, t / 0.45) * Math.PI);
        wobble = 1.15 + j * 3; rate = 4;
        sx = 1 + Math.sin(t * 40) * 0.08 * j; sy = 0.72 - Math.sin(t * 40) * 0.08 * j;
      } else if (clip === 'ko') {
        // Melts flat.
        const f = Math.min(1, t / 0.6);
        sy = 0.72 * (1 - f * 0.8); sx = 1 + f * 0.45; wobble = 1.15 * (1 - f * 0.7); glowK = 1 - f * 0.85;
      }
      const phase = T * rate;
      sy *= 1 + Math.sin(phase * 1.5) * 0.035;
      // Re-shaping the jelly is the costly part: at most thirty times a second.
      if (time - shaped < 1 / 30 && time >= shaped && clip === lastClip) return;
      shaped = time;
      lastClip = clip;
      deform(shellGeometry.attributes.position, shellBase, LOBES, { wobble, phase, ampScale: 1, freqScale: 2.35, phaseScale: 2.2, sx, sy, dome: true });
      shellGeometry.computeVertexNormals();
      // The eyes ride the front of the jelly as it squashes.
      eyes.position.set(0, (sy - 0.72) * 0.7 + lift, (sx - 1) * 0.6);
      eyes.scale.set(1, Math.min(1.1, sy / 0.72), 1);
      const blink = Math.sin(T * 0.7) > 0.985 ? 0.15 : 1;
      for (const e of eyes.children) e.scale.y = clip === 'ko' ? 0.15 : blink;
      // Its colour: near its own, drifting a little.
      colorAt(own + Math.sin(T * 0.13) * 0.35, tint);
      shellMaterial.color.copy(tint);
      if (!glass) shellMaterial.emissive.copy(tint);
      shellMaterial.attenuationColor.copy(tint).lerp(white, 0.35);
      glowMaterial.uniforms.uColor.value.copy(tint);
      glowMaterial.uniforms.uStrength.value = 0.72 * glowK * (0.85 + Math.sin(phase * 2.1) * 0.15);
      for (const b of bubbles) {
        const o = b.userData.orbit, a = o.a + phase * o.sp;
        b.position.set(Math.cos(a) * o.rr * sx, (o.y + Math.sin(phase * 0.8 + o.a) * 0.08) * sy / 0.72 + 0.05, Math.sin(a) * o.rr * sx);
      }
    },
  };
}
