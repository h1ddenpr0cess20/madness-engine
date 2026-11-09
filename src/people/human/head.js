import { clamp, cross, dot, frameAt, len, norm, Part, smooth, sub } from './kit.js';
import { trunkWeights } from './skeleton.js';

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

export const HEAD_CENTER = [0, 1.654, 0.004];
export const HEAD_SCALE = 0.92;
const EYE_RAW = { center: [0.0322, 0.0008, 0.0645], radius: 0.0128 };
export const EYE = Object.freeze({ center: EYE_RAW.center.map((v) => v * HEAD_SCALE), radius: EYE_RAW.radius * HEAD_SCALE });

const sq = (x) => x * x;
const G = (t) => Math.exp(-t * t);
const mx = (q) => [Math.abs(q[0]), q[1], q[2]];

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
  const taper = 1 - 0.36 * smooth(-0.02, -0.112, q[1]);
  const f = [q[0] / taper, q[1], q[2] + 5.5 * q[0] * q[0] + 0.12 * Math.max(0, q[1] - 0.03)];
  d = smin(d, roundBox(f, [0, -0.031, 0.034], [0.04, 0.0615, 0.031], 0.024) * Math.min(1, taper + 0.1), 0.03);
  d = smin(d, ellipsoid(s, [0.05, -0.016, 0.044], [0.02, 0.017, 0.028]), 0.025);
  d = smin(d, capsule(s, [0.056, -0.07, -0.002], [0.024, -0.102, 0.06], 0.0185), 0.026);
  const nk = Math.max(Math.hypot(q[0] / 0.98, q[2] + 0.024) - 0.061 - 0.004 * smooth(-0.2, -0.3, q[1]), q[1] + 0.035);
  d = smin(d, nk, 0.04);
  d = smin(d, capsule(s, [0.05, -0.05, -0.012], [0.015, -0.27, 0.055], 0.0115), 0.02);
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
const UPPER_LIP = table([[-0.053, 0], [-0.059, 0.0022], [-0.0645, 0.0072], [-0.0685, 0.0085], [-0.0722, 0.006], [-0.0738, 0.0035]]);
const LOWER_LIP = table([[-0.0738, 0.0035], [-0.0758, 0.0072], [-0.0795, 0.0092], [-0.0845, 0.0062], [-0.0895, 0]]);

/** How far each point of the face stands out from the planes: brow, nose, lips, chin, cheekbones, and the sockets. */
export function features(x, y) {
  const s = Math.abs(x);
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
  const upper = y > -0.0738;
  const half = upper ? 0.0255 - 0.004 * smooth(-0.072, -0.058, y) : 0.0245 - 0.006 * smooth(-0.076, -0.088, y);
  h += (upper ? UPPER_LIP(y) : LOWER_LIP(y)) * Math.exp(-((s / half) ** 4)) * (1 - 0.35 * sq(s / half));
  h += 0.0007 * G((s - 0.0045) / 0.0017) * smooth(-0.066, -0.06, y) * smooth(-0.052, -0.056, y);
  h -= 0.0016 * G(s / 0.016) * G((y + 0.0888) / 0.0042);
  h += 0.0042 * G(s / 0.017) * G((y + 0.1) / 0.011);
  return h;
}

/** The lids' opening round eye centre `e`, as a distance in the face's plane (negative inside). */
export function almond(x, y) {
  const e = EYE_RAW.center;
  const u = Math.abs(x) - e[0], v = y - e[1] - 0.0016 * (u / 0.014) - 0.0006;
  const a = 0.0158, hu = 0.0071, hl = 0.0049;
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

/**
 * The head and neck as a part, and the grid it was made from (for painting
 * its skin). Each vertex is shaded by how far it sits in from its
 * neighbours: the corners of the eyes, under the nose, the lips' line.
 */
export function buildHead(detail = 1) {
  const around = Math.round(112 * detail / 2) * 2, down = Math.round(96 * detail), neckRows = Math.max(6, Math.round(8 * detail));
  const grid = headGrid({ around, down, neckRows });
  const rows = grid.length - 1;
  const part = new Part('head', 'skinHead');
  part.grid(rows, around, (i, j) => {
    const q = grid[i][j];
    let tint = 1;
    if (i > 0 && i < rows) {
      const jl = j === 0 ? around - 1 : j - 1, jr = j === around ? 1 : j + 1;
      const avg = [0, 1, 2].map((a) => (grid[i - 1][j][a] + grid[i + 1][j][a] + grid[i][jl][a] + grid[i][jr][a]) / 4);
      const n = norm(cross(sub(grid[i][jr], grid[i][jl]), sub(grid[i - 1][j], grid[i + 1][j])));
      tint = clamp(1 - Math.max(0, dot(sub(avg, q), n)) * 650, 0.55, 1);
    }
    return { p: toWorld(q), uv: [j / around, 1 - i / rows], w: trunkWeights(toWorld(q)), tint };
  });
  return { part, grid };
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
      return { p, uv: [0.5 + 0.5 * (a / Math.PI) * Math.cos(b), 0.5 + 0.5 * (a / Math.PI) * Math.sin(b)], w: { head: 1 } };
    });
  }
  return part;
}
