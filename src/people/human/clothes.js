import { add, clamp, cross, dot, len, norm, Part, scale, smooth, sub } from './kit.js';
import { castBody, footPoints, legAxis, skinWeightsAt } from './body.js';
import { armDistance, JOINTS, mirror } from './skeleton.js';
import { skinShell } from './shell.js';

/**
 * The wardrobe: boxer briefs, a crew-neck t-shirt, straight jeans and a pair
 * of sneakers, each its own mesh, put on over the base body.
 *
 * Each is cut from the body itself: rays from inside the trunk, a leg or an
 * arm find the skin, the cloth is set an ease beyond it, and then hangs the
 * way cloth does, straight down off the body's high points (the chest and
 * shoulder blades for the shirt, the seat and knees for the jeans) rather
 * than into every hollow, with folds where cloth gathers. So it is never
 * inside the skin it covers. Each vertex takes the bone weights of the skin
 * under it, so cloth moves as the body does; and each garment says which
 * parts of the body (and of the garments under it) it covers: those are not
 * drawn while it is worn, so nothing shows through however he moves.
 */

const G = (t) => Math.exp(-t * t);
const TAU = Math.PI * 2;

/** A table of radii round an axis by height and angle, read back smoothly (angles wrap). */
function table(y0, y1, rows, cols, sample) {
  const R = new Float32Array((rows + 1) * cols);
  for (let i = 0; i <= rows; i++) for (let j = 0; j < cols; j++) R[i * cols + j] = sample(y0 + ((y1 - y0) * i) / rows, (j / cols) * TAU);
  const t = {
    y0, y1, rows, cols, R,
    at(y, th) {
      const fi = clamp((y - y0) / (y1 - y0)) * rows, i = Math.min(rows - 1, Math.floor(fi)), a = fi - i;
      const fj = ((((th / TAU) % 1) + 1) % 1) * cols, j = Math.floor(fj) % cols, b = fj - Math.floor(fj), j2 = (j + 1) % cols;
      return (R[i * cols + j] * (1 - b) + R[i * cols + j2] * b) * (1 - a) + (R[(i + 1) * cols + j] * (1 - b) + R[(i + 1) * cols + j2] * b) * a;
    },
  };
  return t;
}

/** Where a ray found nothing (NaN), the nearest found either way round; a row with nothing, the row above. */
function fill(t) {
  const { rows, cols, R } = t;
  for (let i = rows; i >= 0; i--) {
    const row = R.subarray(i * cols, (i + 1) * cols);
    if (row.every(Number.isNaN)) { if (i < rows) row.set(R.subarray((i + 1) * cols, (i + 2) * cols)); continue; }
    const out = row.slice();
    for (let j = 0; j < cols; j++) {
      if (!Number.isNaN(row[j])) continue;
      let a = 1, b = 1;
      while (Number.isNaN(row[(j - a + cols) % cols])) a++;
      while (Number.isNaN(row[(j + b) % cols])) b++;
      const ra = row[(j - a + cols) % cols], rb = row[(j + b) % cols];
      out[j] = ra + ((rb - ra) * a) / (a + b);
    }
    row.set(out);
  }
  return t;
}

/**
 * Each row made convex, as cloth pulled round a body is: it bridges the
 * hollows (between the pecs, along the spine) instead of sinking into them.
 * Measured from the axis the table is round, at `cx`, `cz`.
 */
function convex(t) {
  const { rows, cols, R } = t;
  for (let i = 0; i <= rows; i++) {
    const pts = [];
    for (let j = 0; j < cols; j++) { const a = (j / cols) * TAU, r = R[i * cols + j]; pts.push([Math.sin(a) * r, Math.cos(a) * r]); }
    // The hull (monotone chain).
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const crossz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const p of P) { while (lower.length >= 2 && crossz(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    for (let k = P.length - 1; k >= 0; k--) { const p = P[k]; while (upper.length >= 2 && crossz(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
    // Each angle's radius out to the hull.
    for (let j = 0; j < cols; j++) {
      const a = (j / cols) * TAU, d = [Math.sin(a), Math.cos(a)];
      let best = R[i * cols + j];
      for (let k = 0; k < hull.length; k++) {
        const p = hull[k], q = hull[(k + 1) % hull.length];
        const e = [q[0] - p[0], q[1] - p[1]];
        const den = d[0] * e[1] - d[1] * e[0];
        if (Math.abs(den) < 1e-12) continue;
        const tt = (p[0] * e[1] - p[1] * e[0]) / den, u = (p[0] * d[1] - p[1] * d[0]) / den;
        if (tt > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.max(best, tt);
      }
      R[i * cols + j] = best;
    }
  }
  return t;
}

/**
 * Cloth hanging from a body table: at each height, the most of the body
 * within `reach` above it, less `slope(th)` per metre down (the cloth drawn
 * in as it falls), plus `ease`. Never inside the body.
 */
function drape(body, { reach, slope, ease, up = 1 }) {
  const { y0, y1, rows, cols } = body;
  const dy = (y1 - y0) / rows;
  const k = Math.round(reach / dy);
  return table(y0, y1, rows, cols, (y, th) => {
    const i = Math.round((y - y0) / dy), j = Math.round((th / TAU) * cols) % cols;
    const s = slope(th);
    let r = body.R[i * cols + j];
    for (let n = 1; n <= k; n++) {
      const ii = i + n * up;
      if (ii < 0 || ii > rows) break;
      r = Math.max(r, body.R[ii * cols + j] - s * n * dy);
    }
    return r + (typeof ease === 'function' ? ease(y) : ease);
  });
}

const zoneIs = (...names) => (z) => names.includes(z);

// ———————————————————————————————————————————————— the t-shirt

export const HEM = 0.885, COLLAR = 1.5;
export const SLEEVE_RANGE = Object.freeze([0.03, 0.17]);
/** Above this the shirt's body goes over the shoulders' caps; the sleeves come out from under it. */
const ARMPIT = 1.365;
export const SHIRT_Z = 0.028;
/** The neckline: lower in front, as a crew neck sits. */
export const neckline = (th) => COLLAR - 0.026 * Math.pow(Math.max(0, Math.cos(th)), 1.6) - 0.004 * Math.max(0, Math.cos(th));

let shirtTables = null;
function shirtShape() {
  if (shirtTables) return shirtTables;
  // Below the armpits the arms are left out; above them the shoulders' caps are the shirt's to cover.
  const trunk = zoneIs('trunk', 'neck', 'head', 'leg'), shoulders = zoneIs('trunk', 'neck', 'head', 'arm');
  const body = fill(table(0.8, 1.53, 73, 120, (y, th) => castBody([0, y, SHIRT_Z], [Math.sin(th), 0, Math.cos(th)], { only: y > ARMPIT ? shoulders : trunk }) ?? NaN));
  // It hangs off the chest and the shoulder blades, not off the sides (the arms are there).
  const cloth = drape(convex(table(body.y0, body.y1, body.rows, body.cols, (y, th) => body.at(y, th))), { reach: 0.34, slope: (th) => 0.22 + 2.5 * Math.abs(Math.sin(th)) ** 4, ease: (y) => 0.0075 + 0.012 * smooth(1.09, 1.01, y) });
  shirtTables = { body, cloth };
  return shirtTables;
}

/** The trunk's skin at height `y`, angle `th` (0 ahead, π/2 to his left), as the shirt measures it. */
export function trunkPoint(y, th) {
  const r = shirtShape().body.at(y, th);
  return [Math.sin(th) * r, y, SHIRT_Z + Math.cos(th) * r];
}

/** Folds in the shirt's body: soft drapes down from the chest, gathering over the waist of the jeans, pulls toward the armpits. */
function shirtFolds(y, th) {
  const s = Math.sin(th);
  let f = 0;
  f += 0.0045 * (0.5 + 0.5 * Math.sin(th * 7 + 2.2 * Math.sin(y * 6) + 0.6)) * smooth(1.22, 0.98, y);
  f += 0.0032 * (0.5 + 0.5 * Math.sin(y * 88 + 3 * Math.sin(th * 2))) * G((y - 0.98) / 0.045);
  f += 0.0025 * (0.5 + 0.5 * Math.sin((y - Math.abs(s) * 0.12) * 120)) * G((y - 1.27) / 0.04) * G((Math.abs(s) - 0.85) / 0.2);
  return f;
}

/** A point of the shirt's body at height `y` and angle `th`. */
export function shirtPoint(y, th) {
  const { cloth, body } = shirtShape();
  let r = cloth.at(y, th) + shirtFolds(y, th);
  // Up at the neck it closes in on the neck itself.
  r = Math.max(body.at(y, th) + 0.0065, r - 0.012 * smooth(1.44, COLLAR, y));
  return [Math.sin(th) * r, y, SHIRT_Z + Math.cos(th) * r];
}

const clothWeights = (only) => (p) => skinWeightsAt(p, { only });

/** The upper arm's frame (side `m`): where it starts, which way it runs, and out and forward square to it. */
function armFrame(m) {
  const sh = mirror(JOINTS.shoulder, m), el = mirror(JOINTS.elbow, m);
  const t = norm(sub(el, sh));
  const out = norm(sub([m, 0, 0], scale(t, m * t[0])));
  let fwd = cross(t, out);
  if (fwd[2] < 0) fwd = scale(fwd, -1);
  return { sh, t, out, fwd };
}

const sleeveTables = new Map();
function sleeveShape(m) {
  if (sleeveTables.has(m)) return sleeveTables.get(m);
  const { sh, t, out, fwd } = armFrame(m);
  const [D0, D1] = SLEEVE_RANGE;
  const dir = (th) => add(scale(fwd, Math.cos(th)), scale(out, Math.sin(th)));
  const only = zoneIs('arm', 'trunk');
  const body = fill(table(D0, D1 + 0.02, 40, 48, (d, th) => castBody(add(sh, scale(t, d)), dir(th), { only, far: 0.12 }) ?? NaN));
  // A sleeve hangs off the shoulder and the top of the arm, loose but not baggy.
  const cloth = drape(body, { reach: 0.06, slope: () => 0.2, ease: 0.008, up: -1 });
  const v = { body, cloth, sh, t, dir };
  sleeveTables.set(m, v);
  return v;
}

/** A point of the sleeve on side `m`, `d` down the upper arm from the shoulder, `th` round it (0 forward, π/2 out). */
export function sleevePoint(d, th, m, inset = 0) {
  const { cloth, sh, t, dir } = sleeveShape(m);
  const [, D1] = SLEEVE_RANGE;
  let r = Math.max(cloth.at(d, th), 0.05 - 0.003 * smooth(0.04, D1, d));
  r += 0.0022 * (0.5 + 0.5 * Math.sin(th * 5 + d * 40)) * smooth(0.05, D1, d);
  return add(add(sh, scale(t, d)), scale(dir(th), r - inset));
}

/**
 * The t-shirt's outline on the body (how far inside it skin at `p` is): above
 * the hem, below the crew neck, and on the arms down to the sleeves' ends.
 * Which of the three it is nearest, too, for its edge.
 */
function shirtCut(p, z) {
  if (z.zone === 'hand' || z.zone === 'foot' || p[1] > 1.6) return { f: -1, at: null };
  const th = Math.atan2(p[0], p[2] - SHIRT_Z);
  const terms = [['hem', p[1] - HEM], ['collar', neckline(th) - p[1]]];
  if (z.zone === 'arm') terms.push(['cuff', SLEEVE_RANGE[1] - armDistance(p, p[0] >= 0 ? 1 : -1)]);
  let best = terms[0];
  for (const t of terms) if (t[1] < best[1]) best = t;
  return { f: best[1], at: best[0] };
}

/** How the sleeve hangs at skin point `p` on the arm: the loose tube round it, from the shoulder. */
function sleeveDrape(p, q) {
  const m = p[0] >= 0 ? 1 : -1;
  const { cloth, sh, t, dir } = sleeveShape(m);
  const [D0, D1] = SLEEVE_RANGE;
  const r0 = sub(q, sh), d = dot(r0, t);
  if (d < D0 - 0.03 || d > D1 + 0.02) return q;
  const radial = sub(r0, scale(t, d));
  const fwd = dir(0), out = dir(Math.PI / 2);
  const th = Math.atan2(dot(radial, out), dot(radial, fwd));
  const r = len(radial);
  const want = Math.max(cloth.at(clamp(d, D0, D1 + 0.02), th), 0.05 - 0.003 * smooth(0.04, D1, d)) * smooth(D0 - 0.03, D0 + 0.02, d) + r * (1 - smooth(D0 - 0.03, D0 + 0.02, d));
  if (want <= r) return q;
  return add(add(sh, scale(t, d)), scale(radial, want / (r || 1)));
}

/** How the shirt's body hangs at skin point `p`: off the chest and the shoulder blades, across the hollows. */
function bodyDrape(p, q) {
  const { cloth } = shirtShape();
  const y = q[1];
  if (y < cloth.y0 || y > cloth.y1) return q;
  const th = Math.atan2(q[0], q[2] - SHIRT_Z);
  const r = Math.hypot(q[0], q[2] - SHIRT_Z);
  const want = cloth.at(y, th) + shirtFolds(y, th);
  if (want <= r) return q;
  // Up at the neck it closes in on the neck itself.
  const k = (want - r) * smooth(COLLAR - 0.01, 1.42, y);
  return [q[0] + (q[0] / r) * k, y, q[2] + ((q[2] - SHIRT_Z) / r) * k];
}

function shirt(detail) {
  const part = skinShell('shirt', 'shirt', {
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => shirtCut(p, z).f,
    ease: (p, z) => (z.zone === 'arm' ? 0.006 : 0.0065 + 0.011 * smooth(1.09, 1.0, p[1])),
    drape: (p, q, z, w) => {
      if (z.zone === 'arm') return sleeveDrape(p, q);
      if (z.zone !== 'trunk' && z.zone !== 'leg') return q;
      // Where the skin goes with the arm (round the armpit), the cloth keeps close to it, or the arm swings it out in a fin.
      const arm = (w.armL ?? 0) + (w.armR ?? 0) + (w.foreL ?? 0) + (w.foreR ?? 0);
      const k = 1 - smooth(0.02, 0.25, arm), d = bodyDrape(p, q);
      return [q[0] + (d[0] - q[0]) * k, q[1] + (d[1] - q[1]) * k, q[2] + (d[2] - q[2]) * k];
    },
    edge: (p, z) => {
      const at = shirtCut(p, z).at;
      return at === 'collar' ? { thick: 0.0055, turn: 0.012 } : at === 'cuff' ? { thick: 0.0032, turn: 0.016 } : { thick: 0.0035, turn: 0.02 };
    },
    smooth: detail >= 0.8 ? 6 : 3,
  });
  return [part];
}

// ———————————————————————————————————————————————— the jeans

export const WAIST = 1.0, CROTCH = 0.87, HEM_FRONT = 0.075, HEM_BACK = 0.05;
/** The jeans' top at angle `th` round a leg (a touch higher behind) and their hem. */
export const waistAt = (th) => WAIST + 0.012 * Math.max(0, -Math.cos(th));
export const hemAt = (th) => HEM_BACK + (HEM_FRONT - HEM_BACK) * (0.5 + 0.5 * Math.cos(th));
/** The height of the jeans at `t` up the leg (0 the hem, 1 the waist), at angle `th` round it. */
export const jeansHeight = (t, th) => hemAt(th) + (waistAt(th) - hemAt(th)) * t;

/** Distance from the leg's middle to the middle line along `d` (Infinity if it points away). */
const toMiddle = (o, d, m) => (d[0] * m < 0 ? -o[0] / d[0] : Infinity);
const legDir = (th, m) => [m * Math.sin(th), 0, Math.cos(th)];

const legTables = new Map();
function legShape(m) {
  if (legTables.has(m)) return legTables.get(m);
  const only = zoneIs('leg', 'trunk', 'foot');
  const body = fill(table(0.03, 1.04, 101, 72, (y, th) => {
    const o = legAxis(y, m), d = legDir(th, m);
    const hit = castBody(o, d, { only, far: 0.3 });
    return Math.min(hit ?? NaN, toMiddle(o, d, m));
  }));
  // Straight legs: hanging from the seat and the thigh past the knee, but not across the crotch.
  const inner = (th) => Math.max(0, -Math.sin(th));
  const cloth = drape(convex(table(body.y0, body.y1, body.rows, body.cols, (y, th) => body.at(y, th))), { reach: 0.5, slope: (th) => 0.07 + 1.2 * inner(th) ** 2, ease: 0.008 });
  const v = { body, cloth };
  legTables.set(m, v);
  return v;
}

/** A point of the leg's skin at height `y`, angle `th` (0 forward, π/2 out), side `m`, `ease` beyond it (the seat as half the pelvis, flat on the middle line). */
export function legPoint(y, th, m, { ease = 0 } = {}) {
  const o = legAxis(y, m), d = legDir(th, m);
  const r = Math.min(legShape(m).body.at(y, th) + ease, toMiddle(o, d, m));
  return [o[0] + d[0] * r, y, o[2] + d[2] * r];
}

/** Creases in the jeans: stacked over the shoes, behind the knees, across the lap, and the leg's long drape. */
function jeansFolds(y, th) {
  const back = Math.max(0, -Math.cos(th)), front = Math.max(0, Math.cos(th));
  let f = 0;
  f += 0.0045 * (0.5 + 0.5 * Math.sin(y * 105 + 2.5 * Math.sin(th * 2))) * smooth(0.24, 0.08, y);
  f += 0.003 * (0.5 + 0.5 * Math.sin(y * 150)) * G((y - 0.5) / 0.035) * back;
  f += 0.0025 * (0.5 + 0.5 * Math.sin((y + 0.3 * Math.sin(th)) * 110)) * G((y - 0.83) / 0.05) * front;
  f += 0.0018 * (0.5 + 0.5 * Math.sin(th * 4 + y * 3)) * smooth(0.9, 0.3, y);
  return f;
}

/** A point of one leg of the jeans at height `y` and angle `th` round it (0 forward, π/2 out), side `m`. */
export function jeansPoint(y, th, m) {
  const o = legAxis(y, m), d = legDir(th, m);
  // The waistband stands a little proud.
  const band = 0.0018 * smooth(WAIST - 0.04, WAIST - 0.036, y);
  const r = Math.min(legShape(m).cloth.at(y, th) + jeansFolds(y, th) + band, toMiddle(o, d, m));
  return [o[0] + d[0] * r, y, o[2] + d[2] * r];
}

/** Where skin point `p` is round its leg: the side (1 left, -1 right) and the angle (0 forward, π/2 out). */
export function legAngle(p) {
  const m = p[0] >= 0 ? 1 : -1;
  const o = legAxis(clamp(p[1], 0.03, 1.04), m);
  return { m, th: Math.atan2(m * (p[0] - o[0]), p[2] - o[2]) };
}

/** The jeans' outline on the body: below the waistband, above the hems. */
function jeansCut(p, z) {
  if (z.zone === 'hand' || z.zone === 'arm' || z.zone === 'head' || z.zone === 'neck' || (z.zone === 'foot' && p[1] < 0.03)) return { f: -1, at: null };
  const { th } = legAngle(p);
  const body = Math.atan2(p[0], p[2] - SHIRT_Z);
  const waist = waistAt(body) - p[1], hem = p[1] - hemAt(th);
  return waist < hem ? { f: waist, at: 'waist' } : { f: hem, at: 'hem' };
}

function jeans(detail) {
  const part = skinShell('jeans', 'denim', {
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => jeansCut(p, z).f,
    ease: (p) => 0.005 + 0.0025 * smooth(WAIST - 0.06, WAIST - 0.03, p[1]),
    // Straight legs: hanging from the seat and the thighs, never across the middle.
    drape: (p, q) => {
      if (q[1] > 1.04 || q[1] < 0.03) return q;
      q = withBulge(p, q, 0.85);
      const { m, th } = legAngle(q);
      const y = q[1], o = legAxis(y, m), d = legDir(th, m);
      const r = Math.hypot(q[0] - o[0], q[2] - o[2]);
      const want = Math.min(legShape(m).cloth.at(y, th) + jeansFolds(y, th), toMiddle(o, d, m));
      if (want <= r) return q;
      return [o[0] + d[0] * want, y, o[2] + d[2] * want];
    },
    edge: (p, z) => (jeansCut(p, z).at === 'waist' ? { thick: 0.006, turn: 0.03 } : { thick: 0.0045, turn: 0.02 }),
    smooth: detail >= 0.8 ? 5 : 3,
  });
  return part;
}

// ———————————————————————————————————————————————— the sneakers

/** Where along the shoe (heel 0, toe 1) its top closes over the foot: behind it, the opening for the ankle. */
export const THROAT = 0.44;
/** The sole's thickness, its toe's spring off the ground, and the collar's height round the ankle, along the shoe. */
const soleAt = (u) => 0.027 - 0.007 * u;
const springAt = (u) => 0.016 * smooth(0.76, 1.02, u) + 0.004 * smooth(0.07, 0, u);
const collarAt = (u) => 0.074 + 0.02 * smooth(0.2, 0, u);

/**
 * A shoe's last (side `m`), measured off the foot: along it (heel 0 to toe 1)
 * its middle across, half-width at the sole, and the height its top must
 * clear; each read off the foot's skin over a short window, then smoothed so
 * the shoe is fair.
 */
function shoeLast(m) {
  const pts = footPoints(m, 0.17);
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) { lo = Math.min(lo, p[2]); hi = Math.max(hi, p[2]); }
  const back = lo - 0.012, length = hi + 0.018 - back;
  const N = 48;
  let cx = [], hw = [], top = [];
  for (let i = 0; i <= N; i++) {
    const z = back + (i / N) * length;
    let a = Infinity, b = -Infinity, t = 0;
    for (const p of pts) {
      if (Math.abs(p[2] - z) > 0.016) continue;
      if (p[1] < 0.075) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); }
      t = Math.max(t, p[1]);
    }
    cx.push(Number.isFinite(a) ? (a + b) / 2 : null);
    hw.push(Number.isFinite(a) ? (b - a) / 2 : null);
    top.push(t || null);
  }
  const filled = (arr) => arr.map((v, i) => {
    if (v !== null) return v;
    for (let k = 1; k <= N; k++) { const x = arr[i - k] ?? arr[i + k]; if (x !== null && x !== undefined) return x; }
    return 0;
  });
  const fair = (arr, passes) => {
    let a = filled(arr);
    for (let p = 0; p < passes; p++) a = a.map((v, i) => (a[Math.max(0, i - 1)] + 2 * v + a[Math.min(N, i + 1)]) / 4);
    return a;
  };
  cx = fair(cx, 6); hw = fair(hw, 4); top = fair(top, 4);
  // A roomy toe box: no narrower toward the toes than most of the foot's width.
  const widest = Math.max(...hw);
  hw = hw.map((v, i) => Math.max(v, widest * 0.8 * smooth(0.35, 0.55, i / N)));
  // The tongue no higher than the instep needs.
  top = top.map((v, i) => Math.min(v, 0.075 + 0.05 * smooth(0.6, 0.3, i / N)));
  const lerp = (arr, u) => {
    const f = clamp(u) * N, i = Math.min(N - 1, Math.floor(f)), t = f - i;
    return arr[i] * (1 - t) + arr[i + 1] * t;
  };
  return (u) => {
    // Rounded at the heel and the toe.
    const cap = Math.pow(clamp(1 - (Math.max(0, u - 0.84) / 0.16) ** 2.4), 0.5) * Math.sqrt(clamp(1 - (Math.max(0, 0.12 - u) / 0.12) ** 2));
    return { z: back + u * length, x: lerp(cx, u), hw: (lerp(hw, u) + 0.008) * cap, top: Math.max(lerp(top, u) + 0.01, 0.05), sole: soleAt(u), spring: springAt(u) };
  };
}

const shoeWeights = clothWeights(zoneIs('foot', 'leg'));

function shoe(upper, sole, laces, m, detail) {
  const last = shoeLast(m);
  const K = Math.round(40 * detail), R = Math.round(14 * detail);
  // Round the outline, heel to toe on each side, ends close together.
  const uOf = (k) => (1 - Math.cos((k / K) * Math.PI)) / 2;
  // The outline at the sole, and its outward normal across the ground.
  const outline = (u, s) => { const a = last(u); return [a.x + m * s * a.hw, a.z]; };
  const normalAt = (u, s) => {
    const e = 1e-3, p = outline(Math.max(0, u - e), s), q = outline(Math.min(1, u + e), s);
    let n = [q[1] - p[1], -(q[0] - p[0])];
    const l = Math.hypot(n[0], n[1]) || 1;
    n = [n[0] / l, n[1] / l];
    const a = last(u), out = [outline(u, s)[0] - a.x, outline(u, s)[1] - (a.z + (u < 0.5 ? 0.04 : -0.04))];
    return n[0] * out[0] + n[1] * out[1] < 0 ? [-n[0], -n[1]] : n;
  };
  // The ring the collar makes round the ankle: out from the leg's middle as far as the skin, and a little more.
  const ring = new Map();
  const ringAt = (k, s) => {
    const key = `${k},${s}`;
    if (ring.has(key)) return ring.get(key);
    const u = uOf(k), y = collarAt(u);
    const C = legAxis(y, m), O = outline(u, s);
    let d = [O[0] - C[0], O[1] - C[2]];
    const full = Math.hypot(d[0], d[1]) || 1;
    d = [d[0] / full, d[1] / full];
    const r = castBody([C[0], y, C[2]], [d[0], 0, d[1]], { far: 0.2, only: zoneIs('foot', 'leg') }) ?? full;
    const at = Math.min(full, r + 0.007);
    const v = { p: [C[0] + d[0] * at, y, C[2] + d[1] * at], in: [-d[0], -d[1]] };
    ring.set(key, v);
    return v;
  };
  // A point of the upper: column k round the outline on side s, t up its profile from the sole (0) to the rim (1), then the collar's lip and lining.
  const upperPoint = (k, s, i) => {
    const u = uOf(k), a = last(u);
    const O = outline(u, s), base = a.spring + a.sole;
    const w = smooth(THROAT - 0.06, THROAT + 0.03, u);
    const R1 = ringAt(k, s);
    const b = last(Math.min(u, 0.84));
    const R2 = [b.x, b.top, b.z];
    const rim = [R1.p[0] + (R2[0] - R1.p[0]) * w, R1.p[1] + (R2[1] - R1.p[1]) * w, R1.p[2] + (R2[2] - R1.p[2]) * w];
    if (i > R) {
      // The collar rolled over and lined: in and down, only where it is open.
      const open = 1 - w, j = i - R;
      const inward = j === 1 ? 0.004 : 0.008, drop = j === 1 ? -0.003 : 0.016;
      return [rim[0] + R1.in[0] * inward * open, rim[1] - drop * open, rim[2] + R1.in[1] * inward * open];
    }
    const t = (i / R) * (Math.PI / 2);
    const e = 2 / 3.2;
    const c = Math.pow(Math.cos(t), e), sn = Math.pow(Math.sin(t), e);
    return [rim[0] + (O[0] - rim[0]) * c, base + (rim[1] - base) * sn, rim[2] + (O[1] - rim[2]) * c];
  };
  const facing = (part, fn, rows, cols, out) => {
    // Which winding faces out: (c - a) × (b - a) against the way out.
    const a = fn(Math.floor(rows / 2), Math.floor(cols / 2)), c = fn(Math.floor(rows / 2) + 1, Math.floor(cols / 2)), b = fn(Math.floor(rows / 2), Math.floor(cols / 2) + 1);
    const n = cross(sub(c, a), sub(b, a));
    return dot(n, out(a)) < 0;
  };
  for (const s of [1, -1]) {
    const pt = (i, k) => upperPoint(k, s, i);
    const out = (p) => [p[0] - last(0.5).x, 0, 0];
    const flip = facing(upper, pt, R + 2, K, out);
    upper.grid(R + 2, K, (i, k) => {
      const p = pt(i, k);
      const tv = Math.min(1, i / R);
      return { p, uv: [s > 0 ? 0.5 * tv : 1 - 0.5 * tv, uOf(k)], w: shoeWeights(p), tint: i > R ? 0.55 : 1 - 0.2 * smooth(0.25, 0, tv) };
    }, { flip });
    // The sole: under the foot, round its wall, and back in over its top.
    const PROFILE = [[0, 0, 0], [0.9, 0, 0.25], [1, 0.12, 0.36], [1.03, 0.4, 0.46], [1.04, 0.62, 0.6], [1.03, 0.86, 0.72], [0.98, 1, 0.84], [0, 1, 1]];
    const solePt = (i, k) => {
      const u = uOf(k), a = last(u);
      const O = outline(u, s), n = normalAt(u, s);
      const c = last(clamp(u, 0.1, 0.88));
      const [f, h] = PROFILE[i];
      const edge = [O[0] + n[0] * 0.004, O[1] + n[1] * 0.004];
      return [c.x + (edge[0] - c.x) * f, Math.max(0, a.spring + a.sole * h), c.z + (edge[1] - c.z) * f];
    };
    const sflip = facing(sole, solePt, PROFILE.length - 1, K, (p) => [p[0] - last(0.5).x, 0, 0]);
    sole.grid(PROFILE.length - 1, K, (i, k) => {
      const p = solePt(i, k);
      return { p, uv: [PROFILE[i][2], uOf(k)], w: shoeWeights(p), tint: 1 };
    }, { flip: sflip });
  }
  // Laces: crossing over the tongue, each a little tube lying on the upper.
  const onTop = (u, dx) => {
    const a = last(u), H = a.top - (a.spring + a.sole);
    const c = Math.pow(clamp(Math.abs(dx) / a.hw), 3.2 / 2);
    return a.spring + a.sole + H * Math.pow(Math.sqrt(clamp(1 - c * c)), 2 / 3.2);
  };
  const tube = (u0, x0, u1, x1) => {
    laces.grid(4, 6, (i, j) => {
      const t = i / 4;
      const u = u0 + (u1 - u0) * t, a = last(u);
      const dx = (x0 + (x1 - x0) * t) * a.hw;
      const b = (j / 6) * TAU;
      const p = [a.x + dx, onTop(u, dx) + 0.0028 + Math.sin(b) * 0.0022, a.z + Math.cos(b) * 0.0024];
      return { p, uv: [0.8, u], w: shoeWeights(p), tint: 0.95 };
    });
  };
  for (let k = 0; k < 5; k++) {
    const u = THROAT + 0.03 + k * 0.05;
    tube(u, -0.42, u + 0.04, 0.42);
    tube(u, 0.42, u + 0.04, -0.42);
  }
}

// ———————————————————————————————————————————————— the briefs

export const BRIEFS = Object.freeze({ legs: 0.74, waist: 0.985 });
/** Where the briefs end: the waistband, or the legs' hems (cut a touch higher on the outside of the thigh). */
function briefsCut(p, z) {
  if (z.zone !== 'leg' && z.zone !== 'trunk') return { f: -1, at: null };
  const { th } = legAngle(p);
  const waist = BRIEFS.waist - p[1], hem = p[1] - (BRIEFS.legs + 0.011 * Math.sin(th) + 0.003);
  return waist < hem ? { f: waist, at: 'waist' } : { f: hem, at: 'hem' };
}

/**
 * How far the cloth over the groin stands forward (and a little down) of the
 * skin at `p`, for what the base body leaves out.
 */
export function bulge(p) {
  return 0.05 * G(p[0] / 0.05) * G((p[1] - 0.872) / 0.032) * smooth(0.0, 0.07, p[2]);
}
// Forward, a little down, and drawn in toward the middle line.
const withBulge = (p, q, k = 1) => {
  const b = bulge(p) * k;
  return b ? [q[0] * (1 - 13 * b), q[1] - b * 0.45, q[2] + b] : q;
};

/** Boxer briefs: one piece close over the seat and the tops of the thighs, a band at the waist, the legs' hems turned in. */
function briefs(detail) {
  return skinShell('briefs', 'briefs', {
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => briefsCut(p, z).f,
    ease: (p) => 0.0025 + 0.0015 * smooth(BRIEFS.waist - 0.04, BRIEFS.waist - 0.034, p[1]),
    drape: (p, q) => withBulge(p, q),
    edge: (p, z) => (briefsCut(p, z).at === 'waist' ? { thick: 0.004, turn: 0.025 } : { thick: 0.0025, turn: 0.012 }),
    smooth: detail >= 0.8 ? 4 : 2,
  });
}

/** Tags every vertex of `parts` as part of the garment `name` (for the garments over it to know what they cover). */
function tag(parts, name) {
  for (const part of parts) part.zones = part.zones.map((z, v) => ({ zone: name, y: part.pos[v * 3 + 1], d: 0 }));
  return parts;
}

/**
 * The wardrobe. Each garment: its `layer` (higher is worn over lower; the
 * body is 0), the materials it is drawn in, `build(detail)` → its parts, and
 * `covers(zone)`: whether a vertex of the body or of a garment under it,
 * tagged { zone, y, d }, is hidden while it is worn. A garment of your own
 * is an object of the same shape (see `human.wear`).
 */
/** How far inside a garment's openings the skin under it is kept, so looking in at a collar, cuff or hem never shows a hole. */
const OPEN = 0.06;

export const GARMENTS = Object.freeze({
  briefs: {
    layer: 1,
    materials: ['briefs'],
    build: (detail) => tag([briefs(detail)], 'briefs'),
    covers: ({ zone, y }) => (zone === 'leg' || zone === 'trunk') && y > BRIEFS.legs + OPEN && y < BRIEFS.waist - OPEN,
  },
  sneakers: {
    layer: 2,
    materials: ['shoe', 'sole'],
    build: (detail) => {
      const upper = new Part('shoes', 'shoe'), sole = new Part('soles', 'sole'), laces = new Part('laces', 'sole');
      for (const m of [1, -1]) shoe(upper, sole, laces, m, detail);
      return tag([upper, sole, laces], 'sneakers');
    },
    covers: ({ zone, y, d }) => (zone === 'foot' && (y < 0.05 || d > 0.05)) || (zone === 'leg' && y < 0.04),
  },
  jeans: {
    layer: 3,
    materials: ['denim'],
    build: (detail) => tag([jeans(detail)], 'jeans'),
    covers: ({ zone, y }) => ((zone === 'leg' || zone === 'trunk') && y > HEM_FRONT + 0.1 && y < WAIST - OPEN) || (zone === 'briefs' && y < WAIST - OPEN) || (zone === 'sneakers' && y > 0.12),
  },
  tshirt: {
    layer: 4,
    materials: ['shirt'],
    build: (detail) => tag(shirt(detail), 'tshirt'),
    covers: ({ zone, y, d, x = 1, z = 0 }) => (zone === 'trunk' && y > HEM + OPEN && (y < COLLAR - 0.1 || Math.hypot(x, z - SHIRT_Z) > 0.16)) || (zone === 'arm' && d < SLEEVE_RANGE[1] - OPEN) || ((zone === 'jeans' || zone === 'briefs') && y > HEM + OPEN),
  },
});

/** The outfit he is built in, unless told otherwise. */
export const DEFAULT_OUTFIT = Object.freeze(['briefs', 'tshirt', 'jeans', 'sneakers']);

export { len, dot };
