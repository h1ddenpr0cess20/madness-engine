/**
 * The ball, wound: one continuous strand, laid turn by turn round a hollow the
 * size of two fingers, the way a hand winds a ball, until its surface averages
 * `R_TARGET`. Everything here is plain arithmetic on typed arrays — no scene,
 * no renderer — so the rig can be measured in a test.
 */

/** Yarn radius, in metres: six millimetre wool. */
export const YR = 0.003;
/** Sample spacing along the strand. */
export const STEP = 0.0025;
/** The two fingers the first turns went round. */
const HOLLOW = 0.008;
/** Keep winding until the surface averages this. */
export const R_TARGET = 0.09;
/** Turns in the final band — the ones that unwind. */
const K_LAST = 5;
/** A strand bridges bumps over ±LAG samples (wound tight: short). */
export const LAG = 4;
const CAP = 90000;

/** The ball the asset was drawn with. Any other seed winds another, as round. */
export const SEED = 20261009;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const wrapPi = (x) => {
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

function mulberry(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * The surface of the ball so far: a height map over the sphere, one per cube
 * face. Every sample of strand that is laid raises it, and each new sample sits
 * on whatever is already there — so where turns cross, the newer rides over
 * the older and nothing passes through anything.
 */
const M = 160;
const CELL = 2 / M;

export function cellOf(x, y, z) {
  const ax = x < 0 ? -x : x, ay = y < 0 ? -y : y, az = z < 0 ? -z : z;
  let f, p, q, m;
  if (ax >= ay && ax >= az) { f = x > 0 ? 0 : 1; p = y; q = z; m = ax; }
  else if (ay >= az) { f = y > 0 ? 2 : 3; p = x; q = z; m = ay; }
  else { f = z > 0 ? 4 : 5; p = x; q = y; m = az; }
  let i = ((p / m + 1) * 0.5 * M) | 0, j = ((q / m + 1) * 0.5 * M) | 0;
  if (i >= M) i = M - 1;
  if (j >= M) j = M - 1;
  return (f * M + j) * M + i;
}

/**
 * Winds a ball. Returns the strand as samples from the core outwards: `dirs`
 * (unit directions from the centre), `P` (positions), `cum` (arc length to
 * each), `tS` (the strand's direction across the sphere), `rBall` (the radius
 * the ball rides on there), and the height maps the occlusion is read from.
 */
export function windBall({ seed = SEED } = {}) {
  const rnd = mulberry(seed);
  const HM = new Float32Array(6 * M * M).fill(HOLLOW);

  /** rc < 0: the radius a strand centred on u must sit at to rest on the surface.
   *  rc ≥ 0: lay a strand centred at radius rc (raises the surface under it). */
  function footprint(u0, u1, u2, a0, a1, a2, b0, b1, b2, r, rc) {
    const rho = YR / r;
    const n = Math.min(9, Math.ceil(rho / (CELL * 0.75)));
    const d = rho / n, yr2 = YR * YR, rr = r * r * d * d;
    // A resting strand settles into the grooves below: only its middle has to
    // clear what's there. Laid down, soft yarn squashes a little.
    const lim2 = rc < 0 ? yr2 * 0.36 : yr2;
    let best = 0;
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const lat2 = (i * i + j * j) * rr;
        if (lat2 >= lim2) continue;
        const c = cellOf(
          u0 + (a0 * i + b0 * j) * d, u1 + (a1 * i + b1 * j) * d, u2 + (a2 * i + b2 * j) * d);
        const k = Math.sqrt(yr2 - lat2);
        if (rc < 0) { const v = HM[c] + k; if (v > best) best = v; }
        else { const v = rc + k * 0.8; if (v > HM[c]) HM[c] = v; }
      }
    }
    return best;
  }

  /*
   * Band after band of turns laid side by side, the ball turned between bands
   * so they cross. Each band goes where the ball is lowest, which keeps it
   * round. The last band runs round the ball in the plane it rolls in, so its
   * outermost end is always at the contact patch.
   */
  const dirs = new Float32Array(CAP * 3), heads = new Float32Array(CAP * 3);
  const req = new Float32Array(CAP), rEnv = new Float32Array(CAP);
  let n = 0, iLast = -1, HMpre = null;
  let u0 = 0, u1 = 0, u2 = 1, h0 = 1, h1 = 0, h2 = 0;
  let rEst = HOLLOW + YR;
  let band = null;
  let meanNow = HOLLOW;

  function meanSurface() {
    let s = 0, c = 0;
    for (let i = 0; i < HM.length; i += 5) { s += HM[i]; c++; }
    return s / c;
  }

  function startBand(last) {
    const pitch = (1.72 * YR) / rEst; // turns pressed against each other
    const K = last ? K_LAST : Math.max(1, Math.min(10, Math.floor(0.8 / pitch)));
    const rise = K > 1 ? pitch : 0;
    const lat0 = (-K * rise) / 2;
    const w0 = u1 * h2 - u2 * h1, w1 = u2 * h0 - u0 * h2, w2 = u0 * h1 - u1 * h0;
    const cl = Math.cos(lat0), sl = Math.sin(lat0);
    let best = null, bestScore = Infinity;
    for (let c = 0; c < 48; c++) {
      // Turn the ball: the strand's new direction is γ off its current one.
      const g = (rnd() < 0.5 ? -1 : 1) * (0.4 + rnd() * 1.05);
      const cg = Math.cos(g), sg = Math.sin(g);
      const e0 = h0 * cg + w0 * sg, e1 = h1 * cg + w1 * sg, e2 = h2 * cg + w2 * sg;
      let n0 = u1 * e2 - u2 * e1, n1 = u2 * e0 - u0 * e2, n2 = u0 * e1 - u1 * e0;
      n0 = n0 * cl + u0 * sl; n1 = n1 * cl + u1 * sl; n2 = n2 * cl + u2 * sl;
      const q0 = n1 * e2 - n2 * e1, q1 = n2 * e0 - n0 * e2, q2 = n0 * e1 - n1 * e0;
      let sc = 0, top = 0;
      for (let k = 0; k < 36; k++) {
        const ph = (k / 36) * 2 * Math.PI, cp = Math.cos(ph), sp = Math.sin(ph);
        for (let l = -1; l <= 1; l++) {
          const lt = l * K * pitch * 0.4, ct = Math.cos(lt), st = Math.sin(lt);
          const hv = HM[cellOf(
            (e0 * cp + q0 * sp) * ct + n0 * st,
            (e1 * cp + q1 * sp) * ct + n1 * st,
            (e2 * cp + q2 * sp) * ct + n2 * st)];
          sc += hv;
          if (hv > top) top = hv;
        }
      }
      // Fill the low ground, and stay off the lumps.
      sc = sc / 108 + 0.6 * top + rnd() * 0.0004;
      if (sc < bestScore) { bestScore = sc; best = [n0, n1, n2]; }
    }
    const [n0, n1, n2] = best;
    const d = u0 * n0 + u1 * n1 + u2 * n2;
    let a0 = u0 - d * n0, a1 = u1 - d * n1, a2 = u2 - d * n2;
    const al = Math.hypot(a0, a1, a2) || 1;
    a0 /= al; a1 /= al; a2 /= al;
    band = {
      n0, n1, n2, a0, a1, a2,
      b0: n1 * a2 - n2 * a1, b1: n2 * a0 - n0 * a2, b2: n0 * a1 - n1 * a0,
      lat0, rise, K, last, phi: 0, prev: 0, steps: 0,
      // End each band part-way round, so the next one starts somewhere new
      // (ending where it began piles every band change onto one spot).
      phiEnd: (last ? K : K > 1 ? K - 0.5 + rnd() : 0.5 + rnd()) * 2 * Math.PI,
      maxSteps: (((K + 1.5) * 2 * Math.PI * rEst) / STEP) * 1.6,
    };
    meanNow = meanSurface();
  }

  function step() {
    const B = band;
    const lam = Math.asin(clamp(B.n0 * u0 + B.n1 * u1 + B.n2 * u2, -1, 1));
    let e0 = B.n1 * u2 - B.n2 * u1, e1 = B.n2 * u0 - B.n0 * u2, e2 = B.n0 * u1 - B.n1 * u0;
    const el = Math.hypot(e0, e1, e2) || 1;
    e0 /= el; e1 /= el; e2 /= el;
    const m0 = u1 * e2 - u2 * e1, m1 = u2 * e0 - u0 * e2, m2 = u0 * e1 - u1 * e0;
    const psi = Math.atan2(h0 * m0 + h1 * m1 + h2 * m2, h0 * e0 + h1 * e1 + h2 * e2);
    // Aim along a helix that climbs one yarn width per turn.
    const lamT = B.lat0 + (B.rise * B.phi) / (2 * Math.PI);
    const rate = B.rise / (2 * Math.PI) + (lamT - lam) / 0.45;
    const psiT = clamp(Math.atan(rate / Math.max(Math.cos(lam), 0.2)), -1.1, 1.1);
    const psiN = psi + wrapPi(psiT - psi) * Math.min(1, STEP / Math.min(0.03, 0.35 * rEst));
    const cp = Math.cos(psiN), sp = Math.sin(psiN);
    const g0 = e0 * cp + m0 * sp, g1 = e1 * cp + m1 * sp, g2 = e2 * cp + m2 * sp;
    const ds = STEP / rEst, cd = Math.cos(ds), sd = Math.sin(ds);
    let v0 = u0 * cd + g0 * sd, v1 = u1 * cd + g1 * sd, v2 = u2 * cd + g2 * sd;
    const vl = Math.hypot(v0, v1, v2);
    v0 /= vl; v1 /= vl; v2 /= vl;
    let k0 = g0 * cd - u0 * sd, k1 = g1 * cd - u1 * sd, k2 = g2 * cd - u2 * sd;
    const kd = k0 * v0 + k1 * v1 + k2 * v2;
    k0 -= kd * v0; k1 -= kd * v1; k2 -= kd * v2;
    const kl = Math.hypot(k0, k1, k2) || 1;
    u0 = v0; u1 = v1; u2 = v2;
    h0 = k0 / kl; h1 = k1 / kl; h2 = k2 / kl;
    const ph = Math.atan2(u0 * B.b0 + u1 * B.b1 + u2 * B.b2, u0 * B.a0 + u1 * B.a1 + u2 * B.a2);
    B.phi += wrapPi(ph - B.prev);
    B.prev = ph;
    B.steps++;
  }

  function finalize(i, jmax) {
    let r = 0;
    for (let k = Math.max(0, i - LAG), e = Math.min(jmax, i + LAG); k <= e; k++) if (req[k] > r) r = req[k];
    rEnv[i] = r;
    const x = dirs[3 * i], y = dirs[3 * i + 1], z = dirs[3 * i + 2];
    const a0 = heads[3 * i], a1 = heads[3 * i + 1], a2 = heads[3 * i + 2];
    footprint(x, y, z, a0, a1, a2, y * a2 - z * a1, z * a0 - x * a2, x * a1 - y * a0, r, r);
  }

  startBand(false);
  for (;;) {
    const w0 = u1 * h2 - u2 * h1, w1 = u2 * h0 - u0 * h2, w2 = u0 * h1 - u1 * h0;
    const rq = Math.min(footprint(u0, u1, u2, h0, h1, h2, w0, w1, w2, rEst, -1), meanNow + 4 * YR);
    dirs[3 * n] = u0; dirs[3 * n + 1] = u1; dirs[3 * n + 2] = u2;
    heads[3 * n] = h0; heads[3 * n + 1] = h1; heads[3 * n + 2] = h2;
    req[n] = rq;
    rEst = rq;
    if (n >= LAG) finalize(n - LAG, n);
    n++;
    if (n >= CAP - 1) break;
    step();
    if (band.phi >= band.phiEnd || band.steps > band.maxSteps) {
      if (band.last) break;
      const last = meanNow >= R_TARGET || n > CAP - 6000;
      if (last) { HMpre = HM.slice(); iLast = n; }
      startBand(last);
    }
  }
  for (let i = Math.max(0, n - LAG); i < n; i++) finalize(i, n - 1);

  // The strand, final: radii smoothed along it, then positions and arc length.
  const N = n;
  const rR = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - LAG); k <= Math.min(N - 1, i + LAG); k++) { s += rEnv[k]; c++; }
    rR[i] = s / c;
  }
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    P[3 * i] = dirs[3 * i] * rR[i];
    P[3 * i + 1] = dirs[3 * i + 1] * rR[i];
    P[3 * i + 2] = dirs[3 * i + 2] * rR[i];
  }
  const cum = new Float64Array(N);
  for (let i = 1; i < N; i++) {
    cum[i] = cum[i - 1] + Math.hypot(P[3 * i] - P[3 * i - 3], P[3 * i + 1] - P[3 * i - 2], P[3 * i + 2] - P[3 * i - 1]);
  }
  // The strand's direction across the sphere — direction only, so it is smooth.
  const tS = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    let x = dirs[3 * b] - dirs[3 * a], y = dirs[3 * b + 1] - dirs[3 * a + 1], z = dirs[3 * b + 2] - dirs[3 * a + 2];
    const d = x * dirs[3 * i] + y * dirs[3 * i + 1] + z * dirs[3 * i + 2];
    x -= d * dirs[3 * i]; y -= d * dirs[3 * i + 1]; z -= d * dirs[3 * i + 2];
    const l = Math.hypot(x, y, z) || 1;
    tS[3 * i] = x / l; tS[3 * i + 1] = y / l; tS[3 * i + 2] = z / l;
  }
  // The radius the ball rides on, smoothed over ±3 cm so it doesn't bob.
  const rBall = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 12); k <= Math.min(N - 1, i + 12); k++) { s += rR[k]; c++; }
    rBall[i] = s / c;
  }

  return {
    N, total: cum[N - 1], dirs: dirs.subarray(0, N * 3), P, cum, tS, rBall,
    HM, HMpre, iLast,
  };
}
