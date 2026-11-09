import { clamp, cross, dot, frameAt, len, norm, Part, smooth, sub } from './kit.js';
import { EYE, HEAD_CENTER, HEAD_SCALE, trunkWeights } from './skeleton.js';

export { EYE, HEAD_CENTER, HEAD_SCALE };

/**
 * The head and neck, built the way a head is blocked out from drawings: the
 * planes first (skull, the face as a block, cheekbones, jaw, chin, neck) as
 * one smooth shape, a regular grid laid over it by casting out from inside,
 * and then the features (brow, nose, lips, chin, the sockets and the lids)
 * raised off those planes by heights given as profiles, the way they are
 * measured from the side and the front. The eyes are their own meshes, seen
 * through the lids' opening.
 *
 * Head-local coordinates: origin at `HEAD_CENTER`, y up, z forward. The
 * shapes are drawn at a man's natural size and scaled to a 22 cm head.
 */

const EYE_RAW = { center: EYE.center.map((v) => v / HEAD_SCALE), radius: EYE.radius / HEAD_SCALE };

const sq = (x) => x * x;
const G = (t) => Math.exp(-t * t);
/** |x|, rounded over the middle line so mirrored shapes meet there without a crease. */
const sabs = (x) => Math.sqrt(x * x + 0.000016);
const mx = (q) => [sabs(q[0]), q[1], q[2]];

function ellipsoid(q, c, r) {
  const x = (q[0] - c[0]) / r[0], y = (q[1] - c[1]) / r[1], z = (q[2] - c[2]) / r[2];
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const k1 = Math.sqrt(sq(x / r[0]) + sq(y / r[1]) + sq(z / r[2]));
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}
function capsule(q, a, b, r) {
  const pa = sub(q, a), ba = sub(b, a);
  const h = clamp(dot(pa, ba) / dot(ba, ba));
  return len([pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h]) - r;
}
function roundBox(q, c, h, r) {
  const x = Math.abs(q[0] - c[0]) - h[0], y = Math.abs(q[1] - c[1]) - h[1], z = Math.abs(q[2] - c[2]) - h[2];
  return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0) - r;
}
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a, b, k) => -smin(-a, -b, k);

/**
 * The head's planes, with no features on them: the skull, the face as a
 * block (its front a gently curved plane, narrowing toward the chin), the
 * cheekbones' corners, the jaw and the chin, and the neck with its muscles.
 */
export function baseField(q) {
  const s = mx(q);
  let d = ellipsoid(q, [0, 0.014, -0.014], [0.0785, 0.0955, 0.0985]);
  d = smin(d, ellipsoid(q, [0, 0.028, -0.045], [0.074, 0.078, 0.075]), 0.02);
  const taper = 1 - 0.42 * smooth(-0.03, -0.112, q[1]);
  const f = [q[0] / taper, q[1], q[2] + 5.5 * q[0] * q[0] + 0.12 * Math.max(0, q[1] - 0.03)];
  d = smin(d, roundBox(f, [0, -0.031, 0.034], [0.04, 0.0615, 0.031], 0.024) * Math.min(1, taper + 0.1), 0.03);
  d = smin(d, ellipsoid(s, [0.05, -0.016, 0.044], [0.02, 0.017, 0.028]), 0.025);
  d = smin(d, capsule(s, [0.053, -0.07, -0.004], [0.022, -0.103, 0.058], 0.0175), 0.026);
  const nk = Math.max(Math.hypot(q[0] / 0.97, q[2] + 0.024) - 0.071 - 0.006 * smooth(-0.2, -0.3, q[1]), q[1] + 0.035);
  d = smin(d, nk, 0.04);
  d = smin(d, capsule(s, [0.05, -0.05, -0.012], [0.017, -0.27, 0.055], 0.0105), 0.03);
  d = smin(d, ellipsoid(q, [0, -0.142, 0.043], [0.0085, 0.012, 0.0075]), 0.012);
  return d;
}

/** Eased between [[x, y], ...] knots. */
function table(points) {
  const pts = points[0][0] > points[points.length - 1][0] ? points.slice().reverse() : points;
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const t = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t * t * (3 - 2 * t);
      }
    }
    return pts[pts.length - 1][1];
  };
}

// The nose from the side (how far it stands off the face at each height) and from the front (how wide it is).
const NOSE_RISE = table([[0.014, 0], [0.004, 0.0035], [-0.015, 0.0105], [-0.03, 0.0185], [-0.039, 0.0235], [-0.0445, 0.0225], [-0.049, 0.015], [-0.0525, 0.004], [-0.055, 0]]);
const NOSE_WIDTH = table([[0.014, 0.0062], [0.0, 0.0066], [-0.018, 0.0078], [-0.032, 0.0098], [-0.041, 0.0125], [-0.05, 0.0118], [-0.056, 0.009]]);
// The lips from the side: the upper from under the nose to where they meet, then the lower.
const UPPER_LIP = table([[-0.053, 0], [-0.06, 0.0018], [-0.0648, 0.0058], [-0.0688, 0.0068], [-0.0724, 0.005], [-0.0739, 0.003]]);
const LOWER_LIP = table([[-0.0739, 0.003], [-0.0762, 0.0062], [-0.0798, 0.0076], [-0.0845, 0.0048], [-0.0895, 0]]);

/** The lips' outline: the vermilion's top and bottom, and how far either side of the middle it reaches at height `y`. */
export const LIPS = Object.freeze({
  top: -0.0645, bottom: -0.0858,
  half: (y) => (y > -0.0739 ? 0.0232 - 0.0045 * smooth(-0.071, -0.062, y) : 0.0218 - 0.006 * smooth(-0.078, -0.087, y)),
});

/** How far each point of the face stands out from the planes: brow, nose, lips, chin, cheekbones, and the sockets. */
export function features(x, y) {
  const s = sabs(x);
  let h = 0;
  h += 0.0042 * G((y - 0.0235) / 0.0075) * (0.55 + 0.45 * G((s - 0.026) / 0.016)) * G(s / 0.058);
  h -= 0.0028 * G((y - 0.0095) / 0.0075) * G(s / 0.011);
  h -= 0.0075 * G((s - 0.0322) / 0.0155) * G((y - 0.0025) / 0.0105);
  h += 0.0035 * G((s - 0.046) / 0.015) * G((y + 0.024) / 0.013);
  const t = s / NOSE_WIDTH(y);
  h += NOSE_RISE(y) * Math.exp(-1.1 * t * t - 0.9 * t * t * t * t);
  h += 0.0058 * G((s - 0.0122) / 0.0052) * G((y + 0.0455) / 0.0052);
  // The lips, each as wide as the mouth at its line and rounding off toward its ends; the mouth's muzzle under them.
  h += 0.0045 * G(s / 0.032) * G((y + 0.072) / 0.022);
  const half = LIPS.half(y) + 0.003;
  h += (y > -0.0739 ? UPPER_LIP(y) : LOWER_LIP(y)) * Math.exp(-((s / half) ** 3)) * (1 - 0.3 * sq(s / half));
  h += 0.0007 * G((s - 0.0045) / 0.0017) * smooth(-0.066, -0.06, y) * smooth(-0.052, -0.056, y);
  h -= 0.0016 * G(s / 0.016) * G((y + 0.0888) / 0.0042);
  h += 0.0042 * G(s / 0.017) * G((y + 0.1) / 0.011);
  return h;
}

/** The lids' opening round eye centre `e`, as a distance in the face's plane (negative inside). */
export function almond(x, y) {
  const e = EYE_RAW.center;
  const u = Math.abs(x) - e[0], v = y - e[1] - 0.0016 * (u / 0.014) - 0.0006;
  const a = 0.0156, hu = 0.0059, hl = 0.0047;
  const Ru = (a * a + hu * hu) / (2 * hu), Rl = (a * a + hl * hl) / (2 * hl);
  return Math.max(Math.hypot(u * 0.97, v - (hu - Ru)) - Ru, Math.hypot(u, v + hl - Rl) - Rl);
}

/**
 * A point of the planes, `q` with normal `n` (natural size), moved out to
 * the face: by the features, and round each eye onto the lids, a shell over
 * the eyeball parted where the opening is so the eye shows through.
 */
function dress(q, n) {
  const front = smooth(0.15, 0.55, n[2]);
  if (front <= 0) return q;
  let z = q[2] + features(q[0], q[1]) * front;
  const e = EYE_RAW.center, dx = Math.abs(q[0]) - e[0], dy = q[1] - e[1];
  const R = EYE_RAW.radius + 0.0021;
  const r2 = R * R - dx * dx - dy * dy;
  if (r2 > 0) {
    z = smax(z, e[2] + Math.sqrt(r2), 0.0025);
    const open = smooth(0.00045, -0.00045, almond(q[0], q[1]));
    z += (e[2] - 0.003 - z) * open;
  }
  const lift = (z - q[2]) / Math.max(0.35, n[2]);
  return [q[0] + n[0] * lift, q[1] + n[1] * lift, q[2] + n[2] * lift];
}

function gradient(f, q, e = 0.0004) {
  return norm([
    f([q[0] + e, q[1], q[2]]) - f([q[0] - e, q[1], q[2]]),
    f([q[0], q[1] + e, q[2]]) - f([q[0], q[1] - e, q[2]]),
    f([q[0], q[1], q[2] + e]) - f([q[0], q[1], q[2] - e]),
  ]);
}

/** The first place, going out from `o` along `dir`, where the field turns positive. */
function cast(f, o, dir, far = 0.22) {
  let a = 0;
  const step = 0.002;
  for (let r = step; r <= far; r += step) {
    if (f([o[0] + dir[0] * r, o[1] + dir[1] * r, o[2] + dir[2] * r]) > 0) {
      let lo = a, hi = r;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (f([o[0] + dir[0] * mid, o[1] + dir[1] * mid, o[2] + dir[2] * mid]) > 0) hi = mid; else lo = mid;
      }
      return [o[0] + dir[0] * hi, o[1] + dir[1] * hi, o[2] + dir[2] * hi];
    }
    a = r;
  }
  return [o[0] + dir[0] * far, o[1] + dir[1] * far, o[2] + dir[2] * far];
}

/** A table turning an even 0..1 into a 0..1 that is denser where `density` is high. */
function warp(density, n = 512) {
  const acc = [0];
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + density((i - 0.5) / n));
  const total = acc[n];
  return (t) => {
    const target = t * total;
    let i = 0;
    while (i < n && acc[i + 1] < target) i++;
    return (i + (target - acc[i]) / (acc[i + 1] - acc[i] || 1)) / n;
  };
}

const THETA_MAX = (150 / 180) * Math.PI;
const NECK_BOTTOM = 1.375;

/**
 * The head's grid, head-local and at the head's real size: rows from the
 * crown down the face and on down the neck; columns round from the back
 * (u = 0 and 1 meet at the back of the head), through the face at 0.5.
 */
export function headGrid({ around = 112, down = 96, neckRows = 8 } = {}) {
  const S = HEAD_SCALE;
  const th = warp((t) => 0.4 + 2.4 * Math.exp(-sq((t * 150 - 112) / 26)));
  const ph = warp((t) => 0.45 + 2.4 * Math.exp(-sq((t - 0.5) / 0.13)) + 0.5 * Math.exp(-sq((Math.abs(t - 0.5) - 0.25) / 0.05)));
  const phis = [];
  for (let j = 0; j <= around; j++) phis.push((ph(j / around) - 0.5) * 2 * Math.PI);
  const onPlanes = [];
  for (let i = 0; i <= down; i++) {
    const theta = th(i / down) * THETA_MAX;
    onPlanes.push(phis.map((phi) => cast(baseField, [0, 0, -0.005], i === 0 ? [0, 1, 0] : [Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi)])));
  }
  const bottom = (NECK_BOTTOM - HEAD_CENTER[1]) / S;
  for (let k = 1; k <= neckRows; k++) {
    const t = k / neckRows;
    onPlanes.push(phis.map((phi, j) => {
      const top = onPlanes[down][j][1];
      return cast(baseField, [0, top + (bottom - top) * (t * 0.85 + 0.15 * t * t), -0.024], [Math.sin(phi), 0, Math.cos(phi)], 0.15);
    }));
  }
  return onPlanes.map((row) => row.map((q) => {
    const p = dress(q, gradient(baseField, q));
    return [p[0] * S, p[1] * S, p[2] * S];
  }));
}

export const toWorld = (q) => [q[0] + HEAD_CENTER[0], q[1] + HEAD_CENTER[1], q[2] + HEAD_CENTER[2]];

/** The mouth's line (where the lips part), head-local at natural size: its height at `s` across, and its half-width. */
export const MOUTH = Object.freeze({ y: (s) => -0.0739 - 0.0032 * (s / 0.025) ** 2, half: 0.0252 });

/**
 * How the face's moving parts share a head vertex at `q` (head-local,
 * natural size), given what the trunk's rules gave it (`w`): of its head
 * share, the jaw takes the chin, the jaw's line and the lower lip; each lid
 * the shell over its eye above or below the opening; the brows their arch;
 * the mouth's corners the flesh round them.
 */
export function faceWeights(q, w, { lowerLip = false } = {}) {
  const head = w.head ?? 0;
  if (head <= 0) return w;
  const s = Math.abs(q[0]), y = q[1], z = q[2], S = q[0] >= 0 ? 'L' : 'R';
  const front = smooth(-0.01, 0.03, z);
  const out = { ...w };
  delete out.head;
  // The jaw: below the mouth's line, rising toward the ear behind the corner of the mouth, fading into the neck.
  const line = MOUTH.y(Math.min(s, MOUTH.half)) + 0.04 * smooth(MOUTH.half, 0.065, s);
  let jaw = lowerLip ? 1 : smooth(line + 0.001, line - 0.007, y) * smooth(-0.035, -0.005, z) * (1 - smooth(-0.125, -0.155, y) * 0.6);
  // The lids: inside the shell round each eye, above the opening's middle or below it.
  const e = EYE_RAW.center;
  const dx = s - e[0], dy = y - e[1] - 0.0016 * (dx / 0.014) - 0.0006;
  const shell = smooth(0.0185, 0.0142, Math.hypot(dx, dy)) * smooth(e[2] - 0.012, e[2] - 0.004, z);
  const up = shell * smooth(-0.0012, 0.0012, dy), low = shell * smooth(0.0012, -0.0012, dy) * 0.9;
  const brow = 0.9 * G((s - 0.026) / 0.018) * G((y - 0.027) / 0.012) * front;
  const corner = 0.85 * G(Math.hypot(s - 0.026, y + 0.0745) / 0.011) * front * (1 - shell);
  let total = jaw + up + low + brow + corner;
  if (total > 1) { jaw /= total; total = 1; }
  const k = total > 1 ? 1 / total : 1;
  out.head = head * (1 - Math.min(1, total));
  const add = (name, v) => { if (v > 1e-4) out[name] = (out[name] ?? 0) + head * v * k; };
  add('jaw', jaw);
  add(`lidUp${S}`, up);
  add(`lidLow${S}`, low);
  add(`brow${S}`, brow);
  add(`lipCorner${S}`, corner);
  return out;
}

/**
 * The head and neck as a part, and the grid it was made from (for painting
 * its skin). The lips are parted along the mouth's line, the lower lip's
 * edge its own vertices on the jaw, so the mouth can open. Each vertex is
 * shaded by how far it sits in from its neighbours.
 */
export function buildHead(detail = 1) {
  const around = Math.round(112 * detail / 2) * 2, down = Math.round(96 * detail), neckRows = Math.max(6, Math.round(8 * detail));
  const grid = headGrid({ around, down, neckRows });
  const rows = grid.length - 1;
  const S = HEAD_SCALE;
  // The row that runs closest along the mouth's line, and the columns between its corners.
  const mid = around / 2;
  let lipRow = 0;
  for (let i = 0; i <= rows; i++) if (Math.abs(grid[i][mid][1] / S - MOUTH.y(0)) < Math.abs(grid[lipRow][mid][1] / S - MOUTH.y(0))) lipRow = i;
  const parted = (j) => grid[lipRow][j][2] > 0 && Math.abs(grid[lipRow][j][0] / S) < MOUTH.half - 0.0015;
  for (let j = 0; j <= around; j++) {
    if (Math.abs(grid[lipRow][j][0] / S) < MOUTH.half + 0.003 && grid[lipRow][j][2] > 0) grid[lipRow][j][1] = MOUTH.y(Math.abs(grid[lipRow][j][0] / S)) * S;
  }
  const part = new Part('head', 'skinHead');
  const tintAt = (i, j) => {
    if (i === 0 || i === rows) return 1;
    const q = grid[i][j];
    const jl = j === 0 ? around - 1 : j - 1, jr = j === around ? 1 : j + 1;
    const avg = [0, 1, 2].map((a) => (grid[i - 1][j][a] + grid[i + 1][j][a] + grid[i][jl][a] + grid[i][jr][a]) / 4);
    const n = norm(cross(sub(grid[i][jr], grid[i][jl]), sub(grid[i - 1][j], grid[i + 1][j])));
    return clamp(1 - Math.max(0, dot(sub(avg, q), n)) * 650, 0.55, 1);
  };
  const vertexAt = (i, j, lowerLip = false) => {
    const q = grid[i][j];
    const natural = [q[0] / S, q[1] / S, q[2] / S];
    return part.vertex(toWorld(q), [j / around, 1 - i / rows], faceWeights(natural, trunkWeights(toWorld(q)), { lowerLip }), tintAt(i, j) * (lowerLip ? 0.8 : 1), null, { zone: 'head', y: toWorld(q)[1], d: 0 });
  };
  const ids = grid.map((row, i) => row.map((_, j) => vertexAt(i, j)));
  const lower = new Map();
  for (let j = 0; j <= around; j++) if (parted(j)) lower.set(j, vertexAt(lipRow, j, true));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < around; j++) {
      // Below the parted row, its corners are the lower lip's.
      const top = (jj) => (i === lipRow && lower.has(jj) ? lower.get(jj) : ids[i][jj]);
      const a = top(j), b = top(j + 1), c = ids[i + 1][j], d = ids[i + 1][j + 1];
      part.idx.push(a, c, b, b, c, d);
    }
  }
  return { part, grid };
}

/**
 * Inside the mouth, seen only when it opens: its dark hollow, the teeth of
 * each jaw along the curve of the gums, and the tongue.
 */
export function buildMouth(detail = 1) {
  const S = HEAD_SCALE;
  const hollow = new Part('mouth', 'mouth'), teeth = new Part('teeth', 'teeth');
  const w = (q, upper) => (upper ? { head: 1 } : { jaw: 1 });
  const at = (q) => toWorld([q[0] * S, q[1] * S, q[2] * S]);
  // The hollow: an egg behind the lips, seen from inside (its faces turned in).
  const rows = Math.round(14 * detail), cols = Math.round(20 * detail);
  hollow.grid(rows, cols, (i, j) => {
    const a = (i / rows) * Math.PI, b = (j / cols) * Math.PI * 2;
    const q = [Math.sin(a) * Math.cos(b) * 0.025, -0.075 + Math.cos(a) * 0.013, 0.058 + Math.sin(a) * Math.sin(b) * 0.026];
    return { p: at(q), uv: [j / cols, i / rows], w: w(q, q[1] > -0.0745), tint: 0.5 + 0.5 * smooth(-0.09, -0.06, q[1]), zone: { zone: 'mouth', y: 0, d: 0 } };
  });
  // The teeth: for each jaw a band round the arch, rounded at the edge, each tooth a little rise.
  for (const upper of [true, false]) {
    const n = Math.round(24 * detail), m = 6;
    teeth.grid(m, n, (i, j) => {
      const u = j / n * 2 - 1;
      const x = u * 0.0215;
      const zf = 0.0835 - 32 * x * x;
      const toothBump = 0.0004 * Math.abs(Math.cos(u * Math.PI * 4));
      const a = (i / m) * Math.PI;
      const edge = upper ? -0.0742 : -0.0748;
      const len = upper ? 0.0085 : 0.0075;
      const yy = upper ? edge + len * (1 - Math.cos(a)) / 2 * 1 : edge - len * (1 - Math.cos(a)) / 2;
      const depth = 0.0028 * Math.sin(a) + toothBump;
      const nz = Math.cos(Math.atan(64 * x));
      const nx = Math.sin(Math.atan(64 * x));
      const q = [x + nx * depth, upper ? Math.min(yy, -0.064) : Math.max(yy, -0.085), zf - 0.002 + nz * depth];
      return { p: at(q), uv: [j / n, i / m], w: w(q, upper), tint: 0.75 + 0.25 * Math.sin(a), zone: { zone: 'mouth', y: 0, d: 0 } };
    }, { flip: !upper });
  }
  const tongue = new Part('tongue', 'tongue');
  tongue.grid(10, 16, (i, j) => {
    const a = (i / 10) * Math.PI, b = (j / 16) * Math.PI * 2;
    const q = [Math.sin(a) * Math.cos(b) * 0.0165, -0.0795 + Math.sin(a) * Math.sin(b) * 0.0045, 0.06 + Math.cos(a) * 0.022];
    return { p: at(q), uv: [j / 16, i / 10], w: { tongue: 1 }, tint: 0.85, zone: { zone: 'mouth', y: 0, d: 0 } };
  }, { flip: true });
  return [hollow, teeth, tongue];
}

/** The eyes: spheres looking down +z with the cornea's bulge over the iris, mapped so the iris is a disc in the middle of the texture. */
export function buildEyes(detail = 1) {
  const part = new Part('eyes', 'eye');
  const R = EYE.radius, rows = Math.round(16 * detail), cols = Math.round(20 * detail);
  for (const m of [1, -1]) {
    const c = toWorld([EYE.center[0] * m, EYE.center[1], EYE.center[2]]);
    const yaw = m * 0.05;
    const fwd = [Math.sin(yaw), 0, Math.cos(yaw)], right = [Math.cos(yaw), 0, -Math.sin(yaw)], up = [0, 1, 0];
    part.grid(rows, cols, (i, j) => {
      const a = (i / rows) * Math.PI, b = (j / cols) * Math.PI * 2;
      const r = R + 0.0007 * smooth(0.52, 0.2, a);
      const p = frameAt(c, right, up, fwd, Math.sin(a) * Math.cos(b) * r, Math.sin(a) * Math.sin(b) * r, Math.cos(a) * r);
      return { p, uv: [0.5 + 0.5 * (a / Math.PI) * Math.cos(b), 0.5 + 0.5 * (a / Math.PI) * Math.sin(b)], w: { [m > 0 ? 'eyeL' : 'eyeR']: 1 }, zone: { zone: 'head', y: p[1], d: 0 } };
    });
  }
  return part;
}
