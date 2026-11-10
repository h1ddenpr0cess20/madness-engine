/**
 * Keeping the arms out of the body. A clip is written for one body; on a
 * heavier one, or in a thicker jacket, a hand hanging at the side or
 * swinging past the hips would pass into the thigh or the belly. So, as he
 * is shaped and dressed, what the arms must stay out of is measured off his
 * own rest surfaces (the skin and everything worn over it): the trunk height
 * by height, each thigh along its length, each as how far out it reaches in
 * every direction round its middle. And so are the arms, as points down
 * each one with how thick it is there (sleeve and all). Every frame, any arm
 * that would pass inside is swung out from the shoulder just far enough to
 * clear.
 */

const TRUNK = ['hips', 'spine', 'chest'];
const SECTORS = 48;
const BIN = 0.02;
/** Room kept between an arm and the body. */
const GAP = 0.004;

/** The bone with the most weight on vertex `v` of `data`. */
const topBone = (data, v) => {
  let best = -1, w = 0;
  for (let k = 0; k < 4; k++) if (data.skinWeight[v * 4 + k] > w) { w = data.skinWeight[v * 4 + k]; best = data.skinIndex[v * 4 + k]; }
  return best;
};

/** How far out round a middle line each direction reaches, bin by bin: `r`, bins × SECTORS (0 where nothing is). */
function radial(n) {
  return { r: new Float32Array(n * SECTORS), n };
}
const sectorOf = (a) => ((Math.round((a / (Math.PI * 2)) * SECTORS) % SECTORS) + SECTORS) % SECTORS;

/** A sector left empty takes the larger of its neighbours', so there is no gap to reach through. */
function close(prof) {
  const { r, n } = prof;
  for (let b = 0; b < n; b++) {
    for (let pass = 0; pass < 2; pass++) {
      for (let s = 0; s < SECTORS; s++) {
        if (r[b * SECTORS + s] > 0) continue;
        const a = r[b * SECTORS + ((s + 1) % SECTORS)], c = r[b * SECTORS + ((s + SECTORS - 1) % SECTORS)];
        if (a > 0 && c > 0) r[b * SECTORS + s] = Math.min(a, c);
      }
    }
  }
}

/**
 * What the arms must keep out of, from `meshes` (rest data: the skin and
 * what is worn, as he is shaped), on bones `names` with joints at `pivots`
 * (rest): the trunk and each thigh, and points down each arm.
 */
export function measure(meshes, names, pivots) {
  const at = (n) => pivots[names.indexOf(n)];
  const trunkBones = TRUNK.map((n) => names.indexOf(n));
  // The trunk: from below the hip joints to the armpits, a bin every 2 cm.
  const y0 = at('thighL')[1] - 0.14, y1 = at('armL')[1] - 0.05;
  const nT = Math.max(1, Math.ceil((y1 - y0) / BIN));
  const trunk = { ...radial(nT), y0, mid: new Float32Array(nT), owner: new Int16Array(nT).fill(-1), bones: trunkBones };
  const votes = new Float32Array(nT * 3), zs = new Float32Array(nT), zn = new Float32Array(nT);
  const sides = ['L', 'R'];
  const thighs = {}, arms = {};
  for (const S of sides) {
    const hip = at(`thigh${S}`), knee = at(`shin${S}`);
    const axis = [knee[0] - hip[0], knee[1] - hip[1], knee[2] - hip[2]], len = Math.hypot(...axis);
    const t = axis.map((v) => v / len);
    const u0 = [1 - t[0] * t[0], -t[0] * t[1], -t[0] * t[2]], ul = Math.hypot(...u0), u = u0.map((v) => v / ul);
    const w = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
    thighs[S] = { ...radial(Math.ceil((len + 0.1) / BIN)), bone: names.indexOf(`thigh${S}`), hip, t, u, w, len };
  }
  // First the trunk's middle (front to back) at each height, then how far out it reaches round that.
  for (const data of meshes) {
    const P = data.position;
    for (let v = 0; v < data.count; v++) {
      const b = trunkBones.indexOf(topBone(data, v));
      if (b < 0) continue;
      const i = Math.floor((P[v * 3 + 1] - y0) / BIN);
      if (i < 0 || i >= nT) continue;
      votes[i * 3 + b]++;
      zs[i] += P[v * 3 + 2]; zn[i]++;
    }
  }
  for (let i = 0; i < nT; i++) {
    trunk.mid[i] = zn[i] ? zs[i] / zn[i] : 0;
    let best = 0;
    for (let b = 0; b < 3; b++) if (votes[i * 3 + b] > votes[i * 3 + best]) best = b;
    if (votes[i * 3 + best] > 0) trunk.owner[i] = trunkBones[best];
  }
  for (const data of meshes) {
    const P = data.position;
    for (let v = 0; v < data.count; v++) {
      const top = topBone(data, v), x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      if (trunkBones.includes(top)) {
        const i = Math.floor((y - y0) / BIN);
        if (i < 0 || i >= nT) continue;
        const dz = z - trunk.mid[i], o = i * SECTORS + sectorOf(Math.atan2(x, dz));
        trunk.r[o] = Math.max(trunk.r[o], Math.hypot(x, dz));
        continue;
      }
      for (const S of sides) {
        const T = thighs[S];
        if (top !== T.bone) continue;
        const e = [x - T.hip[0], y - T.hip[1], z - T.hip[2]];
        const a = e[0] * T.t[0] + e[1] * T.t[1] + e[2] * T.t[2];
        const i = Math.floor((a + 0.1) / BIN);
        if (i < 0 || i >= T.n) continue;
        const cu = e[0] * T.u[0] + e[1] * T.u[1] + e[2] * T.u[2], cw = e[0] * T.w[0] + e[1] * T.w[1] + e[2] * T.w[2];
        const o = i * SECTORS + sectorOf(Math.atan2(cu, cw));
        T.r[o] = Math.max(T.r[o], Math.hypot(cu, cw));
      }
    }
  }
  close(trunk);
  for (const S of sides) close(thighs[S]);
  // Down each arm: the upper arm near the elbow (higher, it lies against the side, as an arm hanging does),
  // the elbow, the forearm, the wrist and the palm, each with how
  // thick the arm is there (what is worn on it too).
  for (const S of sides) {
    const sh = at(`arm${S}`), el = at(`fore${S}`), wr = at(`hand${S}`), kn = at(`middle1${S}`);
    const spots = [
      ...[0.85, 1].map((k) => ({ bone: `arm${S}`, a: sh, b: el, k })),
      ...[0.25, 0.5, 0.75, 1].map((k) => ({ bone: `fore${S}`, a: el, b: wr, k })),
      ...[0.5, 1].map((k) => ({ bone: `hand${S}`, a: wr, b: kn, k })),
    ].map(({ bone, a, b, k }) => ({ bone: names.indexOf(bone), p: [0, 1, 2].map((x) => a[x] + (b[x] - a[x]) * k), dir: [0, 1, 2].map((x) => b[x] - a[x]), r: 0 }));
    for (const data of meshes) {
      const P = data.position;
      for (let v = 0; v < data.count; v++) {
        const top = topBone(data, v);
        for (const s of spots) {
          if (top !== s.bone) continue;
          const e = [P[v * 3] - s.p[0], P[v * 3 + 1] - s.p[1], P[v * 3 + 2] - s.p[2]];
          const L = Math.hypot(...s.dir), along = (e[0] * s.dir[0] + e[1] * s.dir[1] + e[2] * s.dir[2]) / L;
          if (Math.abs(along) > 0.02) continue;
          s.r = Math.max(s.r, Math.sqrt(Math.max(0, e[0] ** 2 + e[1] ** 2 + e[2] ** 2 - along * along)));
        }
      }
    }
    // Out, for this arm, is a turn about the forward axis toward its own side: + for the left (+x), − for the right.
    arms[S] = { shoulder: names.indexOf(`arm${S}`), parent: names.indexOf(`clavicle${S}`), spots: spots.filter((s) => s.r > 0), out: S === 'L' ? 1 : -1 };
  }
  const body = { trunk, thighs, arms };
  // As he stands at rest (the pose he is modelled in) the upper arm already lies against his side, under
  // the arm: there only what a pose takes it further in than that counts. The forearm and hand have no such
  // allowance: a heavier body is cleared of them however it stands.
  const rest = new Float32Array(names.length * 12);
  for (let b = 0; b < names.length; b++) { rest[b * 12] = rest[b * 12 + 5] = rest[b * 12 + 10] = 1; }
  for (const S of sides) for (const s of arms[S].spots) s.allow = s.bone === arms[S].shoulder ? depth(body, rest, s.p, s.r) : 0;
  return body;
}

/** Bone `b`'s matrix in `M` (3×4, rows), applied to `p`. */
const apply = (M, b, p) => {
  const o = b * 12;
  return [
    M[o] * p[0] + M[o + 1] * p[1] + M[o + 2] * p[2] + M[o + 3],
    M[o + 4] * p[0] + M[o + 5] * p[1] + M[o + 6] * p[2] + M[o + 7],
    M[o + 8] * p[0] + M[o + 9] * p[1] + M[o + 10] * p[2] + M[o + 11],
  ];
};
/** Bone `b`'s matrix in `M`, undone: where world point `p` was at rest, for that bone. */
const undo = (M, b, p) => {
  const o = b * 12;
  const a = M[o], bb = M[o + 1], c = M[o + 2], d = M[o + 4], e = M[o + 5], f = M[o + 6], g = M[o + 8], h = M[o + 9], i = M[o + 10];
  const x = p[0] - M[o + 3], y = p[1] - M[o + 7], z = p[2] - M[o + 11];
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
  const det = a * A + bb * B + c * C || 1;
  return [
    (A * x + (c * h - bb * i) * y + (bb * f - c * e) * z) / det,
    (B * x + (a * i - c * g) * y + (c * d - a * f) * z) / det,
    (C * x + (bb * g - a * h) * y + (a * e - bb * d) * z) / det,
  ];
};

/** The way out of the body (world, unit) at the deepest place `depth` last found. */
const OUT = [0, 0, 0];
/** Bone `b`'s turn in `M` applied to local direction `d`, made unit, into OUT. */
const outward = (M, b, d) => {
  const o = b * 12;
  const x = M[o] * d[0] + M[o + 1] * d[1] + M[o + 2] * d[2], y = M[o + 4] * d[0] + M[o + 5] * d[1] + M[o + 6] * d[2], z = M[o + 8] * d[0] + M[o + 9] * d[1] + M[o + 10] * d[2];
  const l = Math.hypot(x, y, z) || 1;
  OUT[0] = x / l; OUT[1] = y / l; OUT[2] = z / l;
};

/** How far a ball at `p` (world) of radius `r` is inside the body (0 if it is clear); the way out of it in OUT. */
/**
 * How far out profile `prof` reaches at fractional bin `f` (bins counted from their starts) and angle `ang`:
 * read between the nearest bins and sectors, so it changes smoothly as a point moves (empty ones left out).
 */
function reachAt(prof, f, ang) {
  const { r, n } = prof;
  const fb = f - 0.5, b0 = Math.floor(fb), wb = fb - b0;
  const fs = ((ang / (Math.PI * 2)) * SECTORS % SECTORS + SECTORS) % SECTORS, s0 = Math.floor(fs), ws = fs - s0;
  let sum = 0, w = 0;
  for (const [b, kb] of [[b0, 1 - wb], [b0 + 1, wb]]) {
    const bb = Math.max(0, Math.min(n - 1, b));
    for (const [s, ks] of [[s0 % SECTORS, 1 - ws], [(s0 + 1) % SECTORS, ws]]) {
      const v = r[bb * SECTORS + s], k = kb * ks;
      if (v > 0 && k > 0) { sum += v * k; w += k; }
    }
  }
  return w > 0 ? sum / w : 0;
}

/** `values` (one a bin) read at fractional bin `f`, between the nearest two. */
const between = (values, n, f) => {
  const fb = f - 0.5, b0 = Math.floor(fb), w = fb - b0;
  const at = (b) => values[Math.max(0, Math.min(n - 1, b))];
  return at(b0) * (1 - w) + at(b0 + 1) * w;
};

/**
 * How far a ball at `p` (world) of radius `r` is inside the body (0 if it is clear); the way out of it in OUT.
 * The trunk is read in each of its bones' frames and blended by how much each owns that height, so the answer
 * changes smoothly as the arm moves over the joins between them.
 */
function depth(body, M, p, r) {
  let most = 0;
  const { trunk, thighs } = body;
  let tw = 0, ts = 0, tout = null, tb = -1;
  for (const b of trunk.bones) {
    const q = undo(M, b, p);
    const f = (q[1] - trunk.y0) / BIN;
    if (f < 0 || f > trunk.n) continue;
    // How much bone b owns this height: its share between the two nearest bins.
    const fb = f - 0.5, b0 = Math.floor(fb), wb = fb - b0;
    const own = (i) => (trunk.owner[Math.max(0, Math.min(trunk.n - 1, i))] === b ? 1 : 0);
    const k = own(b0) * (1 - wb) + own(b0 + 1) * wb;
    if (!k) continue;
    const dz = q[2] - between(trunk.mid, trunk.n, f), reach = reachAt(trunk, f, Math.atan2(q[0], dz));
    if (!(reach > 0)) continue;
    ts += k * (reach + r + GAP - Math.hypot(q[0], dz)); tw += k;
    if (k >= 0.5 || !tout) { tout = [q[0], 0, dz]; tb = b; }
  }
  if (tw > 0 && ts / tw > most) { most = ts / tw; outward(M, tb, tout); }
  for (const T of Object.values(thighs)) {
    const q = undo(M, T.bone, p), e = [q[0] - T.hip[0], q[1] - T.hip[1], q[2] - T.hip[2]];
    const f = (e[0] * T.t[0] + e[1] * T.t[1] + e[2] * T.t[2] + 0.1) / BIN;
    if (f < 0 || f > T.n) continue;
    const cu = e[0] * T.u[0] + e[1] * T.u[1] + e[2] * T.u[2], cw = e[0] * T.w[0] + e[1] * T.w[1] + e[2] * T.w[2];
    const reach = reachAt(T, f, Math.atan2(cu, cw));
    const d = reach > 0 ? reach + r + GAP - Math.hypot(cu, cw) : 0;
    if (d > most) { most = d; outward(M, T.bone, [0, 1, 2].map((a) => T.u[a] * cu + T.w[a] * cw)); }
  }
  return most;
}

/** `p` turned by `angle` about the unit axis `k` through `o`. */
function turnAbout(p, o, k, angle) {
  const v = [p[0] - o[0], p[1] - o[1], p[2] - o[2]], c = Math.cos(angle), s = Math.sin(angle);
  const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((a) => o[a] + v[a] * c + x[a] * s + k[a] * d * (1 - c));
}

/** Rz·Ry·Rx for Euler angles `e`, rows. */
const fromEuler = ([x, y, z]) => {
  const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  return [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
};
const toEuler = (R) => [Math.atan2(R[2][1], R[2][2]), Math.asin(Math.max(-1, Math.min(1, -R[2][0]))), Math.atan2(R[1][0], R[0][0])];
const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const axisTurn = ([x, y, z], a) => {
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
};

/** How soon (radians before it would touch) an arm starts to be eased out, so it never starts to move with a jolt. */
const SOFT = 0.1;

/**
 * Swings each arm (`sides`, 'L' and/or 'R') of `skeleton` (its matrices
 * worked out for the pose) out to the side from the shoulder, about the
 * collarbone's forward axis, as little as keeps it out of `body` (from
 * `measure`), up to `most` radians. The turn starts softly a little before
 * the arm would touch, and grows and shrinks smoothly with the pose, so a
 * clip is no less smooth for it. Returns whether any arm moved (the matrices
 * then need working out again).
 */
export function clearArms(skeleton, body, pivots, sides = ['L', 'R'], most = 0.6) {
  const M = skeleton.matrices;
  let moved = false;
  for (const S of sides) {
    const arm = body.arms[S];
    if (!arm?.spots.length) continue;
    const o = apply(M, arm.shoulder, pivots[arm.shoulder]);
    const spots = arm.spots.map((s) => ({ p: apply(M, s.bone, s.p), r: s.r, allow: s.allow }));
    const q = arm.parent * 12;
    /** The collarbone's own axis `c` (0 sideways, 2 forward), in the world. */
    const axisOf = (c) => { const l = Math.hypot(M[q + c], M[q + 4 + c], M[q + 8 + c]) || 1; return [M[q + c] / l, M[q + 4 + c] / l, M[q + 8 + c] / l]; };
    /**
     * The least turn about world axis `k` (`sgn` the way out) that keeps `pts` clear, eased in over SOFT before
     * they would touch, up to `most`: 0 if they are clear by more than that.
     */
    const ease = (pts, k, sgn, limit) => {
      const inside = (a) => {
        let d = 0;
        for (const s of pts) d = Math.max(d, depth(body, M, a ? turnAbout(s.p, o, k, sgn * a) : s.p, s.r) - s.allow);
        return d;
      };
      const search = (lo, hi, clearAtHi) => {
        for (let it = 0; it < 16; it++) { const m = (lo + hi) / 2; if ((inside(m) <= 0) === clearAtHi) hi = m; else lo = m; }
        return hi;
      };
      let need;
      if (inside(0) <= 0) {
        if (inside(-SOFT) <= 0) return 0;
        need = search(0, -SOFT, false);
      } else {
        need = limit;
        for (let a = 0.02; a <= limit + 1e-9; a += 0.02) if (inside(a) <= 0) { need = search(a - 0.02, a, true); break; }
      }
      return Math.max(0, Math.min(limit, need >= SOFT ? need : (need + SOFT) ** 2 / (4 * SOFT)));
    };
    // First out to the side, about the collarbone's forward axis, the way out for this arm (fixed at rest);
    // then, if that is not enough (a hand swung across the chest), forward, about its sideways axis. Each about
    // one fixed axis, one fixed way, so the arm is never flicked from one way to another.
    const kz = axisOf(2), kx = axisOf(0);
    const out = ease(spots, kz, arm.out, most);
    const turned = out ? spots.map((s) => ({ ...s, p: turnAbout(s.p, o, kz, arm.out * out) })) : spots;
    // (Forward it may go further: a hand swung across the chest has further to come out.)
    const fwd = ease(turned, kx, -1, most * 1.5);
    if (!out && !fwd) continue;
    // As turns about the parent's own axes, before the arm's own turn, in its parent's frame.
    const rot = skeleton.bone(skeleton.names[arm.shoulder]).rot;
    const e = toEuler(mul(axisTurn([1, 0, 0], -fwd), mul(axisTurn([0, 0, 1], arm.out * out), fromEuler(rot))));
    rot[0] = e[0]; rot[1] = e[1]; rot[2] = e[2];
    moved = true;
  }
  return moved;
}

/** How far each arm (by side) of `skeleton`, as posed, is inside `body`, beyond what it may be: 0 when clear. */
export function armDepth(skeleton, body, { spots = false } = {}) {
  const M = skeleton.matrices, out = {};
  for (const [S, arm] of Object.entries(body.arms)) {
    const each = arm.spots.map((s) => depth(body, M, apply(M, s.bone, s.p), s.r) - s.allow);
    out[S] = spots ? each : Math.max(0, ...each);
  }
  return out;
}
