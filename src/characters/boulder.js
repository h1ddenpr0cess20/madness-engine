/**
 * The rock monster: Rock's boulder (github.com/h1ddenpr0cess20/rock, its
 * `boulder`), several tons of granite, brought down into the dungeon to
 * roll after people. The stone is Rock's own — an icosphere pushed out by layers
 * of noise, sliced flat by a dozen cutting planes, its base ground level,
 * faceted, coloured grain by grain — with a face cut into it: two deep
 * sockets under a heavy brow with a glow of molten orange in each, and moss
 * where water runs off its top.
 *
 * It doesn't walk: it rolls. Going anywhere it tumbles over and over, as
 * far round as it has come, riding up over its own flats so it never sinks
 * into the floor; stopped, it rocks back onto its base to glare at you.
 *
 * `createBoulder` gives { group, pose(state) } like the other creatures.
 */

// Rock's noise (geometry.js), as it is.
const hash = (x, y, z) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x, y, z) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(
    L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v),
    w) * 2 - 1;
};

/** Rock's cutting planes: the flats that make it look broken from a bigger stone. */
function cuttingPlanes(seed) {
  const planes = [];
  for (let i = 0; i < 13; i++) {
    const a = i * 2.399963 + seed, y = 1 - (2 * (i + 0.5)) / 13, r = Math.sqrt(Math.max(0, 1 - y * y));
    const n = [Math.cos(a) * r, y * 0.75, Math.sin(a) * r], l = Math.hypot(...n);
    planes.push({ n: n.map((v) => v / l), d: 0.74 + hash(i, i * 3, 7 + seed) * 0.2 });
  }
  return planes;
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Where the eyes look out from, on the unit stone. */
const EYES = [1, -1].map((m) => {
  const d = [m * 0.36, 0.2, 0.91], l = Math.hypot(...d);
  return d.map((v) => v / l);
});

const geometries = new Map();

/** The stone, faceted and coloured; made once per detail and shared. */
function stone(GFX, detail) {
  if (geometries.has(detail)) return geometries.get(detail);
  const geometry = new GFX.IcosahedronGeometry(1, detail >= 1 ? 5 : 3).toNonIndexed();
  const planes = cuttingPlanes(0);
  const p = geometry.attributes.position.array;
  const colors = new Float32Array(p.length);
  const base = new GFX.Color('#8a8278'), dark = new GFX.Color('#453f39'), pale = new GFX.Color('#b8b0a2');
  const moss = new GFX.Color('#4f6a2a'), mossDark = new GFX.Color('#2c3d18'), soot = new GFX.Color('#1e1a17');
  const tc = new GFX.Color();
  const v = [0, 0, 0];
  for (let i = 0; i < p.length; i += 3) {
    const l = Math.hypot(p[i], p[i + 1], p[i + 2]);
    const u = [p[i] / l, p[i + 1] / l, p[i + 2] / l];
    const d = 1
      + noise(u[0] * 2.1 + 11, u[1] * 2.1, u[2] * 2.1) * 0.19
      + noise(u[0] * 4.7, u[1] * 4.7 + 5, u[2] * 4.7) * 0.085
      + noise(u[0] * 11, u[1] * 11, u[2] * 11 + 3) * 0.03;
    v[0] = u[0] * d; v[1] = u[1] * d; v[2] = u[2] * d;
    for (const pl of planes) {
      const t = v[0] * pl.n[0] + v[1] * pl.n[1] + v[2] * pl.n[2];
      if (t > pl.d) for (let k = 0; k < 3; k++) v[k] -= pl.n[k] * (t - pl.d) * 0.92;
    }
    // The face: two sockets cut in, and a brow standing out over them.
    let socket = 0, brow = 0;
    for (const e of EYES) {
      const c = u[0] * e[0] + u[1] * e[1] + u[2] * e[2];
      socket = Math.max(socket, smooth(0.955, 0.99, c));
      const above = [e[0] * 0.92, e[1] + 0.28, e[2] * 0.95];
      const al = Math.hypot(...above);
      brow = Math.max(brow, smooth(0.96, 0.99, (u[0] * above[0] + u[1] * above[1] + u[2] * above[2]) / al));
    }
    const dent = 1 - socket * 0.2 + brow * 0.07;
    v[0] *= dent; v[1] *= dent; v[2] *= dent;
    if (v[1] < -0.87) v[1] = -0.87 + (v[1] + 0.87) * 0.18;
    p[i] = v[0]; p[i + 1] = v[1] * 0.94; p[i + 2] = v[2];

    const m = noise(v[0] * 6, v[1] * 6, v[2] * 6) * 0.5 + 0.5;
    const grit = hash(Math.round(v[0] * 90), Math.round(v[1] * 90), Math.round(v[2] * 90));
    tc.copy(base).lerp(dark, Math.pow(m, 1.6) * 0.75).lerp(pale, grit > 0.93 ? 0.6 : 0);
    // Moss where the rain would sit, and soot in the sockets.
    const wet = smooth(0.35, 0.75, u[1] + noise(u[0] * 3, u[1] * 3 + 9, u[2] * 3) * 0.35);
    if (wet > 0) tc.lerp(grit > 0.5 ? moss : mossDark, wet * 0.85);
    if (socket > 0) tc.lerp(soot, socket * 0.9);
    colors[i] = tc.r; colors[i + 1] = tc.g; colors[i + 2] = tc.b;
  }
  geometry.setAttribute('color', new GFX.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometries.set(detail, geometry);
  return geometry;
}

const hulls = new Map();

/**
 * The points of the stone that can ever be the lowest, however it lies:
 * the outermost one in each of a few hundred directions. What it stands on
 * is always one of these.
 */
function hull(geometry) {
  if (hulls.has(geometry)) return hulls.get(geometry);
  const p = geometry.attributes.position.array;
  const keep = new Set();
  const N = 400;
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    let best = -Infinity, at = 0;
    for (let j = 0; j < p.length; j += 3) {
      const d = p[j] * x + p[j + 1] * y + p[j + 2] * z;
      if (d > best) { best = d; at = j; }
    }
    keep.add(at);
  }
  const points = new Float32Array(keep.size * 3);
  [...keep].forEach((j, i) => points.set(p.subarray(j, j + 3), i * 3));
  hulls.set(geometry, points);
  return points;
}

/** The row vector r turned by a rotation of `a` about axis 0 (x), 1 (y) or 2 (z): r times that matrix. */
function turnRow(r, axis, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const [x, y, z] = r;
  if (axis === 0) { r[1] = y * c + z * s; r[2] = -y * s + z * c; }
  else if (axis === 1) { r[0] = x * c - z * s; r[2] = x * s + z * c; }
  else { r[0] = x * c + y * s; r[1] = -x * s + y * c; }
  return r;
}

/** How far out the stone's surface is along the direction `d`: the vertex nearest that line. */
function socketDepth(geometry, d) {
  const p = geometry.attributes.position.array, l = Math.hypot(...d);
  let best = -Infinity, depth = 0.8;
  for (let j = 0; j < p.length; j += 3) {
    const r = Math.hypot(p[j], p[j + 1], p[j + 2]);
    const c = (p[j] * d[0] + p[j + 1] * d[1] + p[j + 2] * d[2]) / (r * l);
    if (c > best) { best = c; depth = r * c; }
  }
  return depth;
}

/** A spring, as Rock moves on: pulled to `to`, damped. */
function spring(s, k, c, dt, to = 0) {
  s.v += (to - s.p) * k * dt - s.v * c * dt;
  s.p += s.v * dt;
}

/** A rock monster `size` tiles across. */
export function createBoulder(GFX, { size = 0.8, detail = 1, seed = 0 } = {}) {
  const R = size / 2;
  const group = new GFX.Group();
  group.name = 'rock';
  const body = new GFX.Group();
  group.add(body);
  // It rolls about its middle; `roller` is that middle.
  const roller = new GFX.Group();
  body.add(roller);
  const holder = new GFX.Group();
  holder.scale.setScalar(R);
  roller.add(holder);

  const material = new GFX.MeshStandardMaterial({ name: 'granite', vertexColors: true, roughness: 0.92, metalness: 0.06, flatShading: true });
  const geometry = stone(GFX, detail);
  const points = hull(geometry);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'rock-body';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  holder.add(mesh);

  // Eyes: a molten glow down in each socket, slanted to a scowl.
  const glow = new GFX.MeshStandardMaterial({ name: 'rock-eye', color: new GFX.Color('#ffb070'), emissive: new GFX.Color('#ff6a10'), emissiveIntensity: 3 });
  const eyes = EYES.map((e, i) => {
    const m = i === 0 ? 1 : -1;
    const eye = new GFX.Mesh(new GFX.SphereGeometry(0.12, 14, 10), glow);
    // Down in the socket: as deep as the stone is there, along the eye's line.
    const deep = socketDepth(geometry, [e[0], e[1] * 0.94, e[2]]) + 0.01;
    eye.position.set(e[0] * deep, e[1] * 0.94 * deep, e[2] * deep);
    eye.scale.set(1.15, 0.55, 0.6);
    eye.rotation.set(0, m * 0.36, m * -0.35);
    eye.castShadow = false;
    holder.add(eye);
    return eye;
  });

  const sq = { p: 0, v: 0 }, tz = { p: 0, v: 0 }, tx = { p: 0, v: 0 }, ty = { p: 0, v: 0 };
  // How far over it has rolled, and how fast it is turning.
  const spin = { p: 0, v: 0 };
  let last = null, fidget = 2 + hash(seed, 1, 2) * 2, thumped = 0, wasRolling = false;

  return {
    group,
    body,
    /**
     * Rolls, rocks and squashes it for `state` ({ clip, t, time, seed,
     * speed, pace }): `pace` is how fast it is really going over the
     * ground, in tiles a second; without it, a walk rolls at `speed`.
     */
    pose({ clip = 'idle', t = 0, time = 0, seed: s = seed, speed = 1, pace }) {
      const dt = last === null ? 0 : Math.min(0.05, Math.max(0, time - last));
      last = time;
      const T = time + s;
      let lift = 0, roll = 0, forward = 0;
      const going = pace ?? (clip === 'walk' ? 1.6 * Math.max(0.5, speed) : 0);
      const rolling = going > 0.05;
      if (rolling) {
        // As far round as it has come along the ground.
        spin.v = going / R;
        spin.p += spin.v * dt;
        // Each time a new face comes down, a thud.
        const face = Math.floor(spin.p / 1.1);
        if (face !== thumped) { thumped = face; sq.v += 1.6 * Math.min(1.5, going); tz.v += (hash(face, s, 3) - 0.5) * 1.2; }
      } else {
        // Stopped: it rocks back onto its base, the short way round, and settles.
        if (wasRolling) spin.p = Math.atan2(Math.sin(spin.p), Math.cos(spin.p));
        spring(spin, 60, 7, dt);
      }
      wasRolling = rolling;
      if (clip === 'attack') {
        // Back a little, rocking on its heel; then it rolls in at you and slams.
        const back = Math.min(1, t / 0.3), go = Math.max(0, Math.min(1, (t - 0.3) / 0.14)), home = Math.max(0, Math.min(1, (t - 0.6) / 0.4));
        forward = (-0.12 * Math.sin(back * Math.PI * 0.5) * (1 - go) + 0.32 * go) * (1 - home * home * (3 - 2 * home));
        lift = Math.sin(go * Math.PI) * 0.12;
        if (go >= 1 && thumped !== -1) { thumped = -1; sq.v += 7; }
        if (t < 0.05) thumped = 0;
      } else if (clip === 'hit') {
        // Knocked back a little way, rolling with it.
        const h = Math.sin(Math.min(1, t / 0.45) * Math.PI);
        forward = -0.14 * h;
        roll = Math.sin(t * 50) * 0.04 * h;
      } else if (clip === 'ko') {
        // Over onto its side, and the light goes out of its eyes.
        const f = Math.min(1, t / 0.5);
        roll = f * f * 1.35;
      } else if (clip === 'idle' && !rolling) {
        fidget -= dt;
        if (fidget <= 0) {
          const r = hash(Math.floor(T), s, 5);
          if (r < 0.4) sq.v += 2.4;
          else if (r < 0.72) ty.v += (r < 0.56 ? -1 : 1) * 2.6;
          else { tz.v += (r - 0.86) * 10; spin.v -= 1.4; }
          fidget = 2.4 + hash(s, Math.floor(T), 9) * 4;
        }
      }
      spring(sq, 190, 11, dt);
      spring(tz, 70, 6.5, dt, (rolling ? 0 : Math.sin(T * 1.05 * 2) * 0.055) + roll);
      spring(tx, 70, 6.5, dt, 0);
      spring(ty, 40, 5, dt, 0);
      const breathe = rolling ? 0 : Math.sin(T * 1.25) * 0.008;
      // A lunge or a knock back turns it as far as it goes.
      const turned = spin.p + forward / R;
      roller.rotation.set(turned, 0, 0);
      const k = sq.p * 0.09 + breathe;
      const sx = R * (1 + k * 0.55), sy = R * (1 - k);
      holder.scale.set(sx, sy, sx);
      body.rotation.set(tx.p, ty.p, tz.p);
      // However it lies, its lowest point is on the floor (or `lift` above it).
      const up = turnRow(turnRow(turnRow(turnRow([0, 1, 0], 0, tx.p), 1, ty.p), 2, tz.p), 0, turned);
      let low = Infinity;
      for (let i = 0; i < points.length; i += 3) low = Math.min(low, up[0] * points[i] * sx + up[1] * points[i + 1] * sy + up[2] * points[i + 2] * sx);
      body.position.set(0, lift * R * 2 - low, forward);
      glow.emissiveIntensity = clip === 'ko' ? Math.max(0, 3 * (1 - t / 0.6)) : 3 + Math.sin(T * 3) * 0.6;
      for (const e of eyes) e.visible = glow.emissiveIntensity > 0.05;
    },
  };
}
