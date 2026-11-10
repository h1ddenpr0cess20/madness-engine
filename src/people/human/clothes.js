import { add, caster, clamp, cross, dot, len, norm, Part, scale, smooth, sub } from './kit.js';
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
  // Under the arm, near the armpit, it lies close: hung loose there it folds out in a flap as the arm goes up.
  const under = smooth(-0.1, 0.5, -Math.sin(th)) * smooth(D0 + 0.09, D0 + 0.02, d);
  const loose = add(add(sh, scale(t, d)), scale(radial, want / (r || 1)));
  return add(q, scale(sub(loose, q), 1 - under));
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

function shirt(detail, under = null) {
  const part = skinShell('shirt', 'shirt', {
    under,
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => shirtCut(p, z).f,
    ease: (p, z) => (z.zone === 'arm' ? 0.006 : 0.0065 + 0.011 * smooth(1.09, 1.0, p[1])),
    drape: (p, q, z, w) => {
      // Round the armpit, where the skin is pulled between the arm and the chest, the cloth keeps close to it, or folds out in flaps as the arm moves.
      const arm = (w.armL ?? 0) + (w.armR ?? 0) + (w.foreL ?? 0) + (w.foreR ?? 0);
      if (z.zone === 'arm') {
        const k = 1 - smooth(0.15, 0.5, 1 - arm), d = sleeveDrape(p, q);
        return [q[0] + (d[0] - q[0]) * k, q[1] + (d[1] - q[1]) * k, q[2] + (d[2] - q[2]) * k];
      }
      if (z.zone !== 'trunk' && z.zone !== 'leg') return q;
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

function jeans(detail, under = null) {
  const part = skinShell('jeans', 'denim', {
    under,
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

/**
 * Tags every vertex of `parts` as part of the garment `name` (for the
 * garments over it to know what they cover), keeping where on the body it
 * lies: `on` the body's zone under it, and its `d`, `x` and `z`.
 */
function tag(parts, name) {
  for (const part of parts) part.zones = part.zones.map((z, v) => ({ d: 0, ...z, zone: name, on: z?.zone === part.name ? null : z?.zone ?? null, y: part.pos[v * 3 + 1], sx: part.pos[v * 3], z: part.pos[v * 3 + 2] }));
  return parts;
}

// ———————————————————————————————————————————————— the socks

/** Crew socks: up the shin to here, the cuff's rib this deep. */
export const SOCKS = Object.freeze({ top: 0.205, rib: 0.035 });

/** The socks' outline: all of each foot, up the leg to the cuff. */
function socksCut(p, z) {
  if (z.zone !== 'foot' && z.zone !== 'leg') return -1;
  if (z.zone === 'leg' && p[1] > SOCKS.top + 0.1) return -1;
  // The knit over the toes is its own cap (see `toeCap`): the shell stops across the ball of the foot.
  const toes = z.zone === 'foot' ? toeCut() - p[2] : Infinity;
  return Math.min(SOCKS.top - p[1], toes);
}

const toeBoxes = new Map();
/**
 * A sock's toe box (side `m`): the convex hull of the front of the foot,
 * as the half-spaces round it (how far the foot reaches along each of many
 * directions, none of them back toward the heel). Knit stretched over the
 * toes lies on it, across the gaps between them.
 */
function toeBox(m) {
  if (toeBoxes.has(m)) return toeBoxes.get(m);
  const pts = footPoints(m, 0.08);
  let front = -Infinity, back = Infinity;
  for (const p of pts) { front = Math.max(front, p[2]); back = Math.min(back, p[2]); }
  const z0 = back + (front - back) * 0.6;
  const toes = pts.filter((p) => p[2] > z0 - 0.02);
  const dirs = [];
  const N = 600;
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    const d = [Math.cos(a) * r, y, Math.sin(a) * r];
    if (d[2] < -0.2) continue;
    let h = -Infinity;
    for (const p of toes) h = Math.max(h, dot(d, p));
    dirs.push({ d, h });
  }
  // Its middle, across and up: the axis the knit is projected out from.
  let cx = 0, cy = 0;
  for (const p of toes) { cx += p[0] / toes.length; cy += p[1] / toes.length; }
  const v = { dirs, z0, front, cx, cy };
  toeBoxes.set(m, v);
  return v;
}

/** Where, along the foot (by z), the sock's shell ends and its toe cap begins. */
const toeCut = () => toeBox(1).z0 + 0.012;

/** Where the line from `c` along unit `d` leaves a toe box (its planes `dirs`). */
function onBox(dirs, c, d) {
  let t = Infinity;
  for (const { d: n, h } of dirs) {
    const along = dot(n, d);
    if (along > 1e-6) t = Math.min(t, (h - dot(n, c)) / along);
  }
  return add(c, scale(d, t));
}

/**
 * The sock's toe (side `m`), added to its shell `part`: rings lofted from the shell's open edge across the
 * ball of the foot (`loop`, its vertex ids in order round it) onto the toe box, closing to a point at the tip:
 * one smooth stretch of knit over all the toes. In the same part, so its shading runs on across the join.
 */
function toeCap(part, loop, m, detail) {
  const { dirs, cx, cy } = toeBox(m);
  const zc = toeCut(), c = [cx, cy, zc];
  const P = (i) => [part.pos[i * 3], part.pos[i * 3 + 1], part.pos[i * 3 + 2]];
  const ring = loop.map(P);
  const ankle = mirror(JOINTS.ankle, m);
  const J = Math.round(14 * detail) + 4;
  const ease = 0.0013;
  // The skin's UV scale here (UV per metre round the edge), so the cap's knit is the same size as the shell's.
  let du = 0, dp = 0;
  for (let k = 0; k < loop.length; k++) {
    const a = loop[k], b = loop[(k + 1) % loop.length];
    du += Math.hypot(part.uv[a * 2] - part.uv[b * 2], part.uv[a * 2 + 1] - part.uv[b * 2 + 1]);
    dp += len(sub(P(a), P(b)));
  }
  const perMetre = du / (dp || 1);
  const along = new Array(ring.length + 1).fill(0), prev = [];
  part.grid(J, ring.length, (j, k) => {
    const kk = k % ring.length, q = ring[kk];
    const th = Math.atan2(q[1] - cy, q[0] - cx);
    // Out from the cut's middle across it at the edge (j = 0), turning forward to the tip.
    const phi = (Math.PI / 2) * (1 - j / J);
    const d = [Math.sin(phi) * Math.cos(th), Math.sin(phi) * Math.sin(th), Math.cos(phi)];
    let p = onBox(dirs, c, d);
    p = add(p, scale(d, ease));
    // The first rings eased from the shell's own edge onto the box.
    const flat = onBox(dirs, c, [Math.cos(th), Math.sin(th), 0]);
    const keep = 1 - smooth(0, 0.5, j / J);
    p = add(p, scale(sub(q, add(flat, scale([Math.cos(th), Math.sin(th), 0], ease))), keep));
    if (j === 0) p = q;
    const w = j === 0 ? part.weights[loop[kk]] : skinWeightsAt(p, { only: zoneIs('foot') }) ?? part.weights[loop[kk]];
    // Its UV: the edge's own, carried on toward the tip by how far along the cap it is.
    // (Rows are made in turn, so each column's last point is the row before's.)
    if (j > 0) along[k] += len(sub(p, prev[k]));
    prev[k] = p;
    const uv = [part.uv[loop[kk] * 2], part.uv[loop[kk] * 2 + 1] + along[k] * perMetre];
    return { p, uv, w, tint: part.tint[loop[kk]], zone: { zone: 'foot', y: p[1], d: p[2] - ankle[2], x: Math.abs(p[0]), sx: p[0], z: p[2] } };
  });
}

/**
 * The ids of the shell's open edge across the ball of foot `m`, in order round it. Vertices are matched by
 * place, so where the skin's UVs split a vertex (a seam) the cloth is still counted as one piece there.
 */
function toeLoop(part, m) {
  const keyOf = (i) => `${Math.round(part.pos[i * 3] * 1e5)},${Math.round(part.pos[i * 3 + 1] * 1e5)},${Math.round(part.pos[i * 3 + 2] * 1e5)}`;
  const id = new Map(), rep = [];
  const at = (i) => { const k = keyOf(i); if (!id.has(k)) { id.set(k, rep.length); rep.push(i); } return id.get(k); };
  const count = new Map();
  for (let t = 0; t < part.idx.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = at(part.idx[t + e]), b = at(part.idx[t + ((e + 1) % 3)]);
      if (a === b) continue;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  }
  // The sock's only openings are its cuff and this: the one low down, on this side.
  const near = (v) => part.pos[rep[v] * 3] * m > 0 && part.pos[rep[v] * 3 + 1] < 0.12;
  const next = new Map();
  for (const [key, c] of count) {
    if (c !== 1) continue;
    const [a, b] = key.split(',').map(Number);
    if (!near(a) || !near(b)) continue;
    (next.get(a) ?? next.set(a, []).get(a)).push(b);
    (next.get(b) ?? next.set(b, []).get(b)).push(a);
  }
  const start = next.keys().next().value;
  if (start === undefined) return [];
  const loop = [start];
  let prev = -1, cur = start;
  for (;;) {
    const n = (next.get(cur) ?? []).find((x) => x !== prev);
    if (n === undefined || n === start || loop.length > 2000) break;
    loop.push(n); prev = cur; cur = n;
  }
  return loop.map((v) => rep[v]);
}

/** Crew socks: close knit over each foot and up the shin, a ribbed cuff that grips a touch looser. */
function socks(detail, under) {
  return skinShell('socks', 'sock', {
    level: detail >= 0.8 ? 1 : 0,
    field: socksCut,
    ease: (p) => 0.0011 + 0.0007 * smooth(SOCKS.top - SOCKS.rib - 0.004, SOCKS.top - SOCKS.rib, p[1]),
    // At the cuff a turned edge; across the ball of the foot none (the toe cap carries on from there).
    edge: (p) => (p[1] > 0.12 ? { thick: 0.0022, turn: 0.012 } : null),
    smooth: detail >= 0.8 ? 3 : 2,
    stiff: detail >= 0.8 ? 6 : 3,
    under,
    thick: 0.0012,
  });
}

/** Crew socks, each with its toe cap. */
function socksWithToes(detail, under) {
  const part = socks(detail, under);
  for (const m of [1, -1]) {
    const loop = toeLoop(part, m);
    if (loop.length > 8) toeCap(part, loop, m, detail);
  }
  return part;
}

/**
 * The wardrobe. Each garment: its `layer` (higher is worn over lower; the
 * body is 0), the materials it is drawn in, `build(detail)` → its parts, and
 * `covers(zone)`: whether a vertex of the body or of a garment under it,
 * tagged { zone, y, d }, is hidden while it is worn. A garment of your own
 * is an object of the same shape (see `human.wear`).
 */
// ———————————————————————————————————————————————— the leather bomber

const ELBOW_D = armDistance(JOINTS.elbow, 1), WRIST_D = armDistance(JOINTS.wrist, 1);
/**
 * A leather bomber: blousing down to a knit rib at the waist and the wrists,
 * a rib collar standing round the neck, zipped up the middle (or worn open,
 * its fronts hanging apart).
 * - `hem`, `band`: the waistband's bottom, and its height.
 * - `cuff`, `cuffBand`: how far down the arm (from the shoulder) the sleeves
 *   end, and their cuffs' depth.
 * - `collar`: how high the collar stands.
 * - `gap`: half the space between its fronts, open.
 * - `over`: how far it hangs out from the t-shirt's shape.
 */
export const JACKET = Object.freeze({ hem: 0.955, band: 0.065, cuff: WRIST_D - 0.008, cuffBand: 0.06, collar: 0.036, gap: 0.05, over: 0.011 });
/** Where the leather ends over the waistband, tucked into it. */
const LEATHER_HEM = JACKET.hem + JACKET.band - 0.025;
/**
 * The jacket's neckline: close round the base of the neck. In front and behind, a little under the t-shirt's;
 * at the sides, up over the slope of the shoulders to where the neck itself begins (as measured: 2.5 cm up), and level from there round the back.
 */
const jacketNeck = (th) => neckline(th) - 0.006 + 0.03 * (Math.cos(th) < 0 ? 1 : (Math.sin(th) ** 2) ** 0.6);
/** Half the space between the open fronts (at any height: they hang straight). */
const frontGap = () => JACKET.gap;

/** The jacket's outline on the body (by part: the leather, the waistband, the cuffs), and which edge is nearest. */
function jacketCut(p, z, open, part) {
  if (z.zone === 'hand' || z.zone === 'foot' || z.zone === 'head' || p[1] > 1.6) return { f: -1, at: null };
  if (z.zone === 'arm') {
    const d = armDistance(p, p[0] >= 0 ? 1 : -1);
    if (part === 'band') return { f: -1, at: null };
    if (part === 'cuffs') {
      const top = d - (JACKET.cuff - JACKET.cuffBand), end = JACKET.cuff - d;
      return top < end ? { f: top, at: 'top' } : { f: end, at: 'cuff' };
    }
    return { f: JACKET.cuff - JACKET.cuffBand + 0.022 - d, at: 'cuff' };
  }
  if (part === 'cuffs') return { f: -1, at: null };
  const th = Math.atan2(p[0], p[2] - SHIRT_Z);
  const terms = part === 'band'
    ? [['hem', p[1] - JACKET.hem], ['top', JACKET.hem + JACKET.band - p[1]]]
    : [['hem', p[1] - LEATHER_HEM], ['collar', jacketNeck(th) - p[1]]];
  if (open && Math.cos(th) > 0.2) terms.push(['front', (Math.abs(p[0]) - frontGap(p[1])) * 0.94]);
  let best = terms[0];
  for (const t of terms) if (t[1] < best[1]) best = t;
  return { f: best[1], at: best[0] };
}

/** Where the leather gathers: over the elbows' crooks, bloused above the cuffs and the waistband. */
function jacketFolds(p, z) {
  if (z.zone === 'arm') {
    const m = p[0] >= 0 ? 1 : -1, d = armDistance(p, m);
    const { sh, t, fwd } = armFrame(m);
    const r = sub(sub(p, sh), scale(t, dot(sub(p, sh), t)));
    const crook = smooth(-0.3, 0.7, dot(norm(r), fwd));
    let f = 0.0034 * (0.5 + 0.5 * Math.sin(d * 150 + 1.3 * Math.sin(dot(r, fwd) * 90))) * G((d - ELBOW_D) / 0.045) * (0.35 + 0.65 * crook);
    // Bloused over the cuff: fuller just above it, gathered in folds round the arm.
    const above = d - (JACKET.cuff - JACKET.cuffBand);
    // (Full down to its end, where it is tucked over the knit.)
    f += (0.004 + 0.002 * Math.sin(Math.atan2(dot(r, fwd), dot(r, cross(t, fwd))) * 6)) * (above < -0.03 ? G((above + 0.03) / 0.025) : 1);
    return f;
  }
  // Bloused over the waistband: fuller above it, in soft folds round the body.
  const y = p[1], th = Math.atan2(p[0], p[2] - SHIRT_Z);
  const above = y - LEATHER_HEM;
  return (0.009 + 0.003 * Math.sin(th * 9 + 1.5 * Math.sin(th * 2))) * (above > 0.03 ? G((above - 0.03) / 0.03) : 1);
}

let jacketTable = null;
/** The leather's hang round the body: stiffer than the t-shirt's, straight down off the chest and shoulder blades. */
function jacketCloth() {
  if (jacketTable) return jacketTable;
  const { body, cloth } = shirtShape();
  const hung = drape(convex(table(body.y0, body.y1, body.rows, body.cols, (y, th) => body.at(y, th))), { reach: 0.5, slope: (th) => 0.06 + 1.6 * Math.abs(Math.sin(th)) ** 4, ease: 0 });
  jacketTable = table(body.y0, body.y1, body.rows, body.cols, (y, th) => Math.max(hung.at(y, th), cloth.at(y, th)));
  return jacketTable;
}

/** How the jacket's body hangs at skin point `p`: out from the t-shirt's shape, closing in on the neck at the top. */
function jacketDrape(p, q, z) {
  const cloth = jacketCloth();
  const y = q[1];
  if (y < cloth.y0 || y > cloth.y1) return q;
  const th = Math.atan2(q[0], q[2] - SHIRT_Z);
  const r = Math.hypot(q[0], q[2] - SHIRT_Z);
  const want = cloth.at(y, th) + shirtFolds(y, th) * 0.3 + JACKET.over + jacketFolds(p, z);
  if (want <= r) return q;
  const k = (want - r) * smooth(COLLAR - 0.012, 1.42, y);
  return [q[0] + (q[0] / r) * k, y, q[2] + ((q[2] - SHIRT_Z) / r) * k];
}

/** A segment of arm, from joint `a` to `b` (side `m`): where it starts, which way it runs, and out and forward square to it. */
function segFrame(a, b, m) {
  const t = norm(sub(b, a));
  const out = norm(sub([m, 0, 0], scale(t, m * t[0])));
  let fwd = cross(t, out);
  if (fwd[2] < 0) fwd = scale(fwd, -1);
  return { o: a, t, out, fwd, L: len(sub(b, a)) };
}

/** Hung from a table's high points either way along it (a stiff tube bridging the narrows between muscles). */
const both = (t, reach, slope) => drape(drape(t, { reach, slope: () => slope, ease: 0 }), { reach, slope: () => slope, ease: 0, up: -1 });

const jacketSleeves = new Map();
/** A leather sleeve's tube (side `m`): round each ring of the arm, convex, its narrows bridged, for the upper arm and the forearm. */
function jacketSleeve(m) {
  if (jacketSleeves.has(m)) return jacketSleeves.get(m);
  const sh = mirror(JOINTS.shoulder, m), el = mirror(JOINTS.elbow, m), wr = mirror(JOINTS.wrist, m);
  const segs = [segFrame(sh, el, m), segFrame(el, wr, m)].map((f) => {
    const dir = (th) => add(scale(f.fwd, Math.cos(th)), scale(f.out, Math.sin(th)));
    const body = fill(table(-0.04, f.L + 0.04, 48, 48, (d, th) => castBody(add(f.o, scale(f.t, d)), dir(th), { only: zoneIs('arm'), far: 0.12 }) ?? NaN));
    return { ...f, dir, tube: both(convex(body), 0.07, 0.25) };
  });
  const v = { segs };
  jacketSleeves.set(m, v);
  return v;
}

/** Where the sleeve's tube puts arm point `q` (lifted `ease` off it): out to the tube, whichever segment it is on, blended at the elbow. */
function sleeveTube(q, ease) {
  const m = q[0] >= 0 ? 1 : -1;
  const { segs } = jacketSleeve(m);
  const at = (f) => {
    const r0 = sub(q, f.o), d = dot(r0, f.t);
    const radial = sub(r0, scale(f.t, d));
    const r = len(radial) || 1e-6;
    const th = Math.atan2(dot(radial, f.out), dot(radial, f.fwd));
    const want = f.tube.at(clamp(d, -0.04, f.L + 0.04), th) + ease;
    return want > r ? add(add(f.o, scale(f.t, d)), scale(radial, want / r)) : q;
  };
  const d = armDistance(q, m), k = smooth(ELBOW_D - 0.03, ELBOW_D + 0.03, d);
  const a = at(segs[0]), b = at(segs[1]);
  // Over the shoulder's cap it is the body's drape that shapes it, not the tube.
  const on = smooth(0.03, 0.09, d);
  return [0, 1, 2].map((i) => q[i] + (a[i] + (b[i] - a[i]) * k - q[i]) * on);
}

/** The jacket's leather: the body and sleeves, cut from the skin and hung over the t-shirt. */
function jacketShell(detail, under, open) {
  return skinShell('jacket', 'leather', {
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => jacketCut(p, z, open, 'leather').f,
    ease: (p, z) => {
      if (z.zone !== 'arm') return 0.007;
      const d = armDistance(p, p[0] >= 0 ? 1 : -1);
      // Roomy over the shoulder and upper arm, closer down the forearm.
      return 0.009 - 0.002 * smooth(ELBOW_D - 0.05, ELBOW_D + 0.1, d);
    },
    folds: (p, z) => (z.zone === 'arm' ? jacketFolds(p, z) : 0),
    drape: (p, q, z, w) => {
      const arm = (w.armL ?? 0) + (w.armR ?? 0) + (w.foreL ?? 0) + (w.foreR ?? 0);
      if (z.zone === 'arm') {
        // Round the armpit it keeps close, as the t-shirt's sleeve does.
        const k = 1 - smooth(0.15, 0.5, 1 - arm), d = sleeveTube(q, 0.007 + jacketFolds(p, z));
        return [q[0] + (d[0] - q[0]) * k, q[1] + (d[1] - q[1]) * k, q[2] + (d[2] - q[2]) * k];
      }
      if (z.zone !== 'trunk' && z.zone !== 'leg') return q;
      const k = 1 - smooth(0.02, 0.25, arm), d = jacketDrape(p, q, z);
      return [q[0] + (d[0] - q[0]) * k, q[1] + (d[1] - q[1]) * k, q[2] + (d[2] - q[2]) * k];
    },
    edge: (p, z) => {
      const at = jacketCut(p, z, open, 'leather').at;
      // Tucked into the knit at the waist and wrists; faced with leather down the open fronts.
      return at === 'hem' || at === 'cuff' ? { thick: 0.007, turn: 0.012 } : { thick: 0.005, turn: 0.025 };
    },
    smooth: detail >= 0.8 ? 7 : 4,
    stiff: detail >= 0.8 ? 16 : 8,
    shade: 0.3,
    line: frontLine(open, 'leather'),
    under,
    gap: 0.0035,
    bridge: 10,
    thick: 0.0025,
  });
}

/**
 * For a jacket worn open, its fronts' edges run straight down: each vertex of the cut there put on the line
 * `frontGap` out from the middle (keeping its height and how far forward it is).
 */
const frontLine = (open, part) => (open ? (q, p, z) => {
  // On the front's cut, or at a corner of it (where the hem meets it).
  const cut = jacketCut(p, z, open, part).at;
  if (cut !== 'front' && !(Math.abs(Math.atan2(p[0], p[2] - SHIRT_Z)) < 1.3 && Math.abs(p[0]) - frontGap(p[1]) < 0.008)) return null;
  const s = q[0] >= 0 ? 1 : -1;
  return [s * frontGap(q[1]), q[1], q[2]];
} : null);

/** The knit rib at the waist (`band`) or the wrists (`cuffs`): snug, a few millimetres thick. */
function ribShell(detail, under, open, part) {
  return skinShell(part === 'band' ? 'waistband' : 'cuffs', 'rib', {
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => jacketCut(p, z, open, part).f,
    ease: (p, z) => (z.zone === 'arm' ? 0.0045 : 0.004),
    drape: (p, q, z) => {
      if (z.zone === 'arm') return sleeveTube(q, 0.0035);
      // Round the body over the t-shirt, drawn in at its bottom edge.
      const { cloth } = shirtShape();
      const th = Math.atan2(q[0], q[2] - SHIRT_Z), r = Math.hypot(q[0], q[2] - SHIRT_Z);
      const want = cloth.at(q[1], th) + 0.001 - 0.002 * smooth(JACKET.hem + 0.02, JACKET.hem, q[1]);
      return want > r ? [q[0] * want / r, q[1], SHIRT_Z + (q[2] - SHIRT_Z) * want / r] : q;
    },
    edge: () => ({ thick: 0.0035, turn: 0.015 }),
    smooth: 3,
    stiff: 4,
    line: frontLine(open, part),
    under,
    gap: 0.0015,
    thick: 0.003,
  });
}

/** A strip laid along `path` (points on a surface, each { p, n, w }), `width` across, raised by `rise(s, across)`; its UVs run along it. */
function strip(part, path, width, rise, { tint = 1 } = {}) {
  const C = 4;
  const L = [0];
  for (let i = 1; i < path.length; i++) L.push(L[i - 1] + len(sub(path[i].p, path[i - 1].p)));
  part.grid(path.length - 1, C, (i, j) => {
    const a = path[i], b = path[Math.min(path.length - 1, i + 1)], c = path[Math.max(0, i - 1)];
    const t = norm(sub(b.p, c.p));
    const side = norm(cross(a.n, t));
    const x = (j / C - 0.5) * 2;
    const p = add(add(a.p, scale(side, x * width / 2)), scale(a.n, rise(L[i], x)));
    return { p, uv: [j / C, L[i] * 20], w: a.w, tint };
  }, { flip: true });
}

/** A zip's teeth along `path`: a ridged metal chain on its dark tape, and its slider at the top. */
function zip(tape, teeth, path, { pull = true } = {}) {
  if (path.length < 4) return;
  // The path made fair first: the surface it was read off is not.
  for (let pass = 0; pass < 6; pass++) {
    path = path.map((q, i) => (i === 0 || i === path.length - 1 ? q : { ...q, p: [0, 1, 2].map((a) => (path[i - 1].p[a] + 2 * q.p[a] + path[i + 1].p[a]) / 4), n: norm([0, 1, 2].map((a) => path[i - 1].n[a] + 2 * q.n[a] + path[i + 1].n[a])) }));
  }
  strip(tape, path, 0.013, (s, x) => 0.0007 * (1 - x * x), { tint: 0.6 });
  strip(teeth, path, 0.0072, (s, x) => (0.0014 + 0.0013 * Math.abs(Math.sin(s * Math.PI / 0.0019))) * Math.sqrt(Math.max(0, 1 - x * x * 0.8)));
  if (!pull) return;
  // The slider, sitting on the teeth at the top, and its tab hanging from it.
  const top = path[path.length - 1], below = path[Math.max(0, path.length - 4)];
  const down = norm(sub(below.p, top.p));
  const side = norm(cross(top.n, down));
  const at = (u, v, h) => add(add(add(top.p, scale(side, u)), scale(down, v)), scale(top.n, h));
  box(teeth, at(0, 0.004, 0.003), side, down, top.n, [0.0045, 0.0055, 0.0018], top.w);
  box(teeth, at(0, 0.021, 0.0042), side, down, top.n, [0.0034, 0.011, 0.0008], top.w);
}

/** A rounded box: centre `c`, axes `u`, `v`, `n`, half-sizes `h`. */
function box(part, c, u, v, n, h, w) {
  part.grid(8, 16, (i, j) => {
    const lat = (i / 8 - 0.5) * Math.PI, lon = (j / 16) * Math.PI * 2;
    // A superellipsoid: flat faces, soft edges.
    const sp = (x, e) => Math.sign(x) * Math.abs(x) ** e;
    const x = sp(Math.cos(lat), 0.3) * sp(Math.cos(lon), 0.3), y = sp(Math.cos(lat), 0.3) * sp(Math.sin(lon), 0.3), z = sp(Math.sin(lat), 0.3);
    return { p: add(add(add(c, scale(u, x * h[0])), scale(v, y * h[1])), scale(n, z * h[2])), uv: [j / 16, i / 8], w };
  });
}

/**
 * The jacket's trims, laid on its leather: the rib collar standing round
 * the neck, the zip (up the middle, or down each open front with its slider
 * at the bottom), and the welts of the two slanting hip pockets.
 */
function jacketTrims(shell, open) {
  const cast = caster(shell);
  const collar = new Part('collar', 'ribTrim'), tape = new Part('zip tapes', 'leatherTrim'), metal = new Part('jacket hardware', 'metal'), welts = new Part('welts', 'leatherTrim');
  const front = (x, y) => cast([x, y, 0.6], [0, 0, -1], 0.6);
  const along = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n)).filter(Boolean);

  // The collar: round the neckline from one front to the other, standing up the neck, its top rolled.
  const ring = [];
  // On the neck's skin at the neckline, out past the t-shirt's collar and the leather.
  const base = (th) => {
    const y = jacketNeck(th), out = [Math.sin(th), 0, Math.cos(th)];
    const r = castBody([0, y, SHIRT_Z], out, { only: zoneIs('neck', 'trunk'), far: 0.2 });
    return r === null ? null : { y, out, r, p: [out[0] * (r + 0.011), y, SHIRT_Z + out[2] * (r + 0.011)] };
  };
  // Open, it runs from one front's edge round to the other's: from the angle where it reaches the edge.
  let a0 = 0;
  if (open) {
    let lo = 0, hi = Math.PI / 2;
    for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2, b = base(mid); if (b && Math.abs(b.p[0]) < frontGap(b.y)) lo = mid; else hi = mid; }
    a0 = hi;
  }
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const th = a0 + (i / N) * (Math.PI * 2 - 2 * a0);
    const b = base(th);
    if (!b) continue;
    const { y, out, r, p } = b;
    // Its top closes on the neck itself, a finger's width off it.
    const rt = castBody([0, y + JACKET.collar, SHIRT_Z], out, { only: zoneIs('neck', 'head'), far: 0.2 }) ?? r;
    const top = [out[0] * (rt + 0.009), y + JACKET.collar, SHIRT_Z + out[2] * (rt + 0.009)];
    ring.push({ p, top, n: out, w: clothWeights(zoneIs('neck', 'trunk'))(p), th, out });
  }
  if (!open && ring.length) ring.push(ring[0]);
  const profile = (q) => {
    // From the neckline up to the neck, its outside a little full, rounded over the top, and back down inside.
    const at = (k, o) => add(add(q.p, scale(sub(q.top, q.p), k)), scale(q.out, o + 0.003 * Math.sin(Math.PI * k) * (o > 0 ? 1 : 0)));
    return [at(-0.12, 0.004), at(0.08, 0.005), at(0.5, 0.0045), at(0.9, 0.0038), at(1, 0.0005), at(0.9, -0.0032), at(0.5, -0.0035), at(0.04, -0.003)];
  };
  const rows = ring.map(profile);
  const C = rows[0]?.length - 1;
  if (open && rows.length > 1) {
    // Each end closed: a flat face across the collar, square to the front's edge.
    for (const i of [0, rows.length - 1]) {
      const r = rows[i], c = r.reduce((a, p) => add(a, scale(p, 1 / r.length)), [0, 0, 0]);
      collar.grid(1, C, (k, j) => ({ p: k === 0 ? r[j] : c, uv: [j / C, 0], w: ring[i].w, tint: 0.8 }), { flip: i !== 0 });
    }
  }
  if (rows.length > 1) {
    let L = 0;
    collar.grid(rows.length - 1, C, (i, j) => {
      if (j === 0 && i > 0) L += len(sub(ring[i].p, ring[i - 1].p));
      return { p: rows[i][j], uv: [j / C, L * 40], w: ring[i].w, tint: j >= 5 ? 0.6 : 1 };
    }, { flip: true });
  }

  // The zip.
  if (!open) {
    const fz = along(220, (t) => front(0, JACKET.hem + 0.004 + (jacketNeck(0) - JACKET.hem - 0.006) * t));
    zip(tape, metal, fz);
  } else {
    for (const s of [-1, 1]) {
      // Down the edge of each front, the slider left at the bottom on his left.
      const fz = along(200, (t) => {
        const y = jacketNeck(0.4) - 0.01 - (jacketNeck(0.4) - 0.01 - JACKET.hem - 0.004) * t;
        for (let e = 0.0055; e < 0.03; e += 0.003) {
          const h = front(s * (frontGap(y) + e), y);
          if (h && h.p[2] > SHIRT_Z) return h;
        }
        return null;
      });
      zip(tape, metal, fz, { pull: false });
    }
  }
  // The hip pockets: a slanting welt each side, a lip of leather with the opening's shadow above it.
  for (const s of [-1, 1]) {
    const a = [s * 0.075, LEATHER_HEM + 0.025], b = [s * 0.125, LEATHER_HEM + 0.15];
    const pts = along(30, (t) => front(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t));
    strip(welts, pts.map((h) => ({ ...h, p: add(h.p, scale(h.n, 0.0004)) })), 0.012, (u, x) => 0.0016 * Math.sqrt(Math.max(0, 1 - x ** 4)));
  }
  return [collar, tape, metal, welts];
}

/**
 * The rib waistband: a band round the body over the t-shirt, from the hem up `JACKET.band`, its cross-section
 * a rounded strip 5 mm thick; open, its two ends square, flush with the fronts' edges.
 */
function waistband(detail, open) {
  const band = new Part('waistband', 'ribTrim');
  const { cloth } = shirtShape();
  const outR = (y, th) => cloth.at(y, th) + shirtFolds(y, th) + 0.007 - 0.0025 * smooth(JACKET.hem + 0.02, JACKET.hem, y);
  // The angle round the body where the band reaches the front's edge.
  let a0 = 0;
  if (open) {
    let lo = 0, hi = Math.PI / 2;
    const y = JACKET.hem + JACKET.band / 2;
    for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (Math.sin(mid) * outR(y, mid) < frontGap(y)) lo = mid; else hi = mid; }
    a0 = hi;
  }
  // Round its cross-section: up the outside, over the top, down the inside, under the bottom.
  const T = 0.005, H = JACKET.band;
  const section = [[0, 0.0015], [0, 0.2], [0, 0.5], [0, 0.8], [0, 0.98], [0.5, 1], [1, 0.98], [1, 0.5], [1, 0.02], [0.5, 0], [0, 0.0015]];
  const M = Math.round(160 * detail) + 32;
  const at = (k, j) => {
    const th = a0 + (k / M) * (Math.PI * 2 - 2 * a0);
    const [d, h] = section[j];
    const y = JACKET.hem + H * h;
    const r = outR(y, th) - T * d - 0.0015 * Math.sin(Math.PI * h) * (1 - d);
    let x = Math.sin(th) * r;
    // Open, its ends' last columns brought onto the edge, square.
    if (open && (k === 0 || k === M)) x = Math.sign(x) * frontGap(y);
    return [x, y, SHIRT_Z + Math.cos(th) * r];
  };
  const L = Math.PI * 2 * 0.16;
  band.grid(M, section.length - 1, (k, j) => {
    const p = at(k, j);
    return { p, uv: [section[j][1], (k / M) * L * 40], w: clothWeights(zoneIs('trunk', 'leg'))(p), tint: section[j][0] > 0.5 ? 0.6 : 1 };
  });
  if (open) {
    // Each end closed, a flat face across the strip.
    for (const k of [0, M]) {
      const ring = section.map((_, j) => at(k, j));
      const c = ring.reduce((a, p) => add(a, scale(p, 1 / ring.length)), [0, 0, 0]);
      band.grid(1, section.length - 1, (i, j) => {
        const p = i === 0 ? ring[j] : c;
        return { p, uv: [section[j][1], 0], w: clothWeights(zoneIs('trunk', 'leg'))(p), tint: 0.8 };
      }, { flip: k === 0 });
    }
  }
  return band;
}

function jacket(detail, under, open) {
  const shell = jacketShell(detail, under, open);
  return [shell, waistband(detail, open), ribShell(detail, under, open, 'cuffs'), ...jacketTrims(shell, open)];
}

/** How far inside a garment's openings the skin under it is kept, so looking in at a collar, cuff or hem never shows a hole. */
const OPEN = 0.06;

/** The leather bomber, worn open or zipped: either is worn in the one `outer` slot. */
function bomber(open) {
  const inside = ({ y, sx = 0, z = 0 }, margin) => {
    const th = Math.atan2(sx, z - SHIRT_Z);
    const shut = !open || Math.cos(th) < 0.2 || Math.abs(sx) - frontGap(y) > margin;
    return y > JACKET.hem + margin && y < jacketNeck(th) - margin * 0.5 && shut;
  };
  return {
    layer: 5,
    slot: 'outer',
    materials: ['leather', 'rib', 'ribTrim', 'leatherTrim', 'metal'],
    fits: true,
    build: (detail, { under } = {}) => tag(jacket(detail, under, open), open ? 'jacket' : 'jacketZipped'),
    covers: (z) => {
      const on = z.on ?? z.zone;
      if (on === 'arm') return z.d < JACKET.cuff - OPEN;
      if (z.zone === 'trunk' || z.zone === 'tshirt' || z.zone === 'leg' || z.zone === 'jeans' || z.zone === 'briefs') return (on === 'trunk' || on === 'leg' || on === null) && inside(z, OPEN);
      return false;
    },
  };
}

export const GARMENTS = Object.freeze({
  briefs: {
    layer: 1,
    materials: ['briefs'],
    build: (detail) => tag([briefs(detail)], 'briefs'),
    covers: ({ zone, y }) => (zone === 'leg' || zone === 'trunk') && y > BRIEFS.legs + OPEN && y < BRIEFS.waist - OPEN,
  },
  socks: {
    layer: 1,
    materials: ['sock'],
    fits: true,
    build: (detail, { under } = {}) => tag([socksWithToes(detail, under)], 'socks'),
    covers: ({ zone, y }) => zone === 'foot' || (zone === 'leg' && y < SOCKS.top - OPEN * 0.5),
  },
  sneakers: {
    layer: 2,
    materials: ['shoe', 'sole'],
    build: (detail) => {
      const upper = new Part('shoes', 'shoe'), sole = new Part('soles', 'sole'), laces = new Part('laces', 'sole');
      for (const m of [1, -1]) shoe(upper, sole, laces, m, detail);
      return tag([upper, sole, laces], 'sneakers');
    },
    covers: ({ zone, on, y, d }) => ((zone === 'foot' || on === 'foot') && (y < 0.05 || d > 0.05)) || ((zone === 'leg' || on === 'leg') && y < 0.04),
  },
  jeans: {
    layer: 3,
    materials: ['denim'],
    fits: true,
    build: (detail, { under } = {}) => tag([jeans(detail, under)], 'jeans'),
    covers: ({ zone, y }) => ((zone === 'leg' || zone === 'trunk') && y > HEM_FRONT + 0.1 && y < WAIST - OPEN) || (zone === 'briefs' && y < WAIST - OPEN) || (zone === 'sneakers' && y > 0.12),
  },
  tshirt: {
    layer: 4,
    materials: ['shirt'],
    fits: true,
    build: (detail, { under } = {}) => tag(shirt(detail, under), 'tshirt'),
    covers: ({ zone, y, d, x = 1, z = 0 }) => (zone === 'trunk' && y > HEM + OPEN && (y < COLLAR - 0.1 || Math.hypot(x, z - SHIRT_Z) > 0.16)) || (zone === 'arm' && d < SLEEVE_RANGE[1] - OPEN) || ((zone === 'jeans' || zone === 'briefs') && y > HEM + OPEN),
  },
  jacket: bomber(true),
  jacketZipped: bomber(false),
});

/** The outfit he is built in, unless told otherwise. */
export const DEFAULT_OUTFIT = Object.freeze(['briefs', 'socks', 'tshirt', 'jeans', 'sneakers', 'jacket']);

export { len, dot };
