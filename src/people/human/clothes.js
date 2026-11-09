import { add, clamp, cross, dot, len, norm, Part, scale, smooth, sub } from './kit.js';
import { castBody, footProfile, legAxis, skinWeightsAt } from './body.js';
import { JOINTS, mirror } from './skeleton.js';

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
const ad = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

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
/** Where each piece of the shirt is in its texture: the body below `body`, the sleeves between, the collar above `collar`. */
export const SHIRT_UV = Object.freeze({ body: 0.74, sleeve: [0.76, 0.97], collar: 0.975 });
export const SLEEVE_RANGE = Object.freeze([0.03, 0.17]);
/** Above this the shirt's body goes over the shoulders' caps; the sleeves come out from under it. */
const ARMPIT = 1.365;
const SHIRT_Z = 0.028;
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
const shirtWeights = clothWeights(zoneIs('trunk', 'neck', 'leg'));
const sleeveWeights = clothWeights(zoneIs('trunk', 'arm'));

function shirt(detail) {
  const body = new Part('shirt', 'shirt');
  const rows = Math.round(64 * detail), around = Math.round(72 * detail);
  // Rows: the hem turned up inside (three rows), then the body from the hem to the collar.
  body.grid(rows + 3, around, (i, j) => {
    const th = (j / around) * TAU;
    if (i < 3) {
      const t = i / 3;
      const y = HEM + 0.02 * (1 - t) * (1 - t);
      const p = shirtPoint(Math.max(HEM, y), th);
      const dir = norm([p[0], 0, p[2] - SHIRT_Z]);
      const inset = 0.0035 * (1 - t);
      const q = [p[0] - dir[0] * inset, y - 0.002 * t, p[2] - dir[2] * inset];
      return { p: q, uv: [j / around, 0], w: shirtWeights(q), tint: 0.55 };
    }
    const t = (i - 3) / rows;
    const top = neckline(th);
    const y = HEM - 0.002 + (top - HEM) * (1 - Math.pow(1 - t, 1.2));
    const p = shirtPoint(y, th);
    // Darker in the folds' hollows and under the arms.
    const tint = 1 - 0.22 * G((y - 1.3) / 0.05) * G((Math.abs(Math.sin(th)) - 1) / 0.25) - 0.25 * (0.0045 - shirtFolds(y, th)) / 0.0045 * smooth(1.2, 0.95, y) * 0.5;
    return { p, uv: [j / around, SHIRT_UV.body * t], w: shirtWeights(p), tint };
  }, { flip: true });
  // The collar's rib: a soft rolled band round the neckline.
  const rib = new Part('collar', 'shirt');
  rib.grid(around, 10, (j, i) => {
    const th = (j / around) * TAU;
    const y = neckline(th);
    const p = shirtPoint(y, th);
    const out = norm([p[0], 0, p[2] - SHIRT_Z]);
    const a = (i / 10) * TAU;
    const o = 0.0015 + Math.cos(a) * 0.0035, h = -0.006 + Math.sin(a) * 0.0075;
    const q = [p[0] + out[0] * o, y + h, p[2] + out[2] * o];
    return { p: q, uv: [j / around, SHIRT_UV.collar + (1 - SHIRT_UV.collar) * (i / 10)], w: shirtWeights(q), tint: Math.cos(a) < -0.3 ? 0.55 : 0.95 };
  }, { flip: true });
  return [body, rib];
}

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

function sleeve(part, m, detail) {
  const rows = Math.round(18 * detail), around = Math.round(40 * detail);
  const [D0, D1] = SLEEVE_RANGE;
  part.grid(rows + 3, around, (i, j) => {
    const th = (j / around) * TAU;
    let d, inset = 0;
    if (i <= rows) d = D0 + (D1 - D0) * (i / rows);
    else { const k = (i - rows) / 3; d = D1 - 0.018 * k; inset = 0.004 * Math.sin((k * Math.PI) / 2); }
    const p = sleevePoint(d, th, m, inset);
    const uv = [j / around, SHIRT_UV.sleeve[0] + (SHIRT_UV.sleeve[1] - SHIRT_UV.sleeve[0]) * clamp((d - D0) / (D1 - D0))];
    return { p, uv, w: sleeveWeights(p), tint: i > rows ? 0.55 : 1 - 0.3 * G(ad(th, -Math.PI / 2) / 0.6) * smooth(0.07, 0, d) };
  }, { flip: m > 0 });
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

const jeansWeights = clothWeights(zoneIs('leg', 'trunk', 'foot'));

function jeans(detail) {
  const part = new Part('jeans', 'denim');
  const rows = Math.round(80 * detail), around = Math.round(48 * detail);
  for (const m of [1, -1]) {
    part.grid(rows + 6, around, (i, j) => {
      const th = (j / around) * TAU;
      const hem = hemAt(th), top = waistAt(th);
      const o = (y) => legAxis(y, m);
      if (i < 3) {
        // The hem, turned up inside.
        const t = i / 3;
        const y = hem + 0.025 * (1 - t) * (1 - t);
        const p = jeansPoint(y, th, m), c = o(y);
        const n = norm([p[0] - c[0], 0, p[2] - c[2]]);
        const q = [p[0] - n[0] * 0.004 * (1 - t), y, p[2] - n[2] * 0.004 * (1 - t)];
        return { p: q, uv: [j / around, 0], w: jeansWeights(q), tint: 0.5 };
      }
      if (i > rows + 3) {
        // The waistband's top edge, turned in.
        const t = (i - rows - 3) / 3;
        const y = top - 0.012 * t * t;
        const p = jeansPoint(top, th, m), c = o(y);
        const n = norm([p[0] - c[0], 0, p[2] - c[2]]);
        const q = [p[0] - n[0] * 0.0035 * Math.sin((t * Math.PI) / 2), y + 0.0015 * Math.sin(t * Math.PI), p[2] - n[2] * 0.0035 * Math.sin((t * Math.PI) / 2)];
        return { p: q, uv: [j / around, 1], w: jeansWeights(q), tint: 0.6 };
      }
      const t = (i - 3) / rows;
      const y = hem + (top - hem) * t;
      const p = jeansPoint(y, th, m);
      const crotch = 0.3 * smooth(CROTCH + 0.02, CROTCH - 0.05, y) * G((m * Math.sin(th) + 1) / 0.5);
      const crease = (0.0045 - jeansFolds(y, th)) / 0.0045;
      return { p, uv: [j / around, t], w: jeansWeights(p), tint: 1 - crotch - 0.12 * clamp(crease) * smooth(0.25, 0.1, y) };
    }, { flip: m > 0 });
  }
  return part;
}

// ———————————————————————————————————————————————— the sneakers

/** A shoe's shape (side `m`), measured off the foot: its footprint, height and toe spring along it, heel (0) to toe (1). */
function shoeShape(m) {
  const foot = footProfile(m);
  const back = foot.back - 0.012, length = foot.front - foot.back + 0.03;
  const at = (u) => {
    const z = back + u * length;
    const f = foot.at(z);
    const cap = Math.sqrt(clamp(1 - (Math.max(0, u - 0.9) / 0.1) ** 2)) * Math.sqrt(clamp(1 - (Math.max(0, 0.07 - u) / 0.07) ** 2));
    return {
      z, x: f.x, cap,
      hw: Math.max(f.hw + 0.009, 0.028) * (0.35 + 0.65 * cap),
      h: Math.max(f.top + 0.012, 0.045 + 0.04 * smooth(0.75, 0.3, u)),
      spring: 0.012 * smooth(0.82, 1, u),
    };
  };
  return { at, back, length };
}

const SOLE = 0.024;
const shoeWeights = clothWeights(zoneIs('foot', 'leg'));

function shoe(upper, sole, laces, m, detail) {
  const rows = Math.round(34 * detail), around = Math.round(28 * detail);
  const S = shoeShape(m);
  // The upper: a loft from heel to toe, each section a rounded arch over the sole; the collar dips at the ankle.
  upper.grid(rows, around, (i, j) => {
    const u = i / rows;
    const s = S.at(u);
    const a = (j / around) * Math.PI; // 0 the outer edge, π the inner, over the top
    const ca = Math.cos(a), sa = Math.sin(a);
    const collar = 0.012 * G((u - 0.18) / 0.12) * Math.abs(ca);
    const top = s.h - collar;
    const y = SOLE + s.spring + (top - SOLE - s.spring) * Math.pow(sa, 0.6) * (0.25 + 0.75 * s.cap);
    const x = s.x + m * ca * s.hw * (1 + 0.06 * Math.max(0, ca) * G((u - 0.62) / 0.15));
    const z = s.z + (u < 0.5 ? -1 : 1) * (1 - s.cap) * 0.004;
    const p = [x, y, z];
    return { p, uv: [j / around, u], w: shoeWeights(p), tint: 1 - 0.25 * smooth(0.2, 0, sa) };
  }, { flip: m < 0 });
  // The sole: a slab under it all, its edge proud of the upper, the toe sprung up.
  const srows = Math.round(34 * detail), saround = Math.round(32 * detail);
  sole.grid(srows, saround, (i, j) => {
    const u = i / srows;
    const s = S.at(u);
    const a = (j / saround) * TAU;
    const ca = Math.cos(a), sa = Math.sin(a);
    const k = Math.pow(Math.abs(ca) ** 4 + Math.abs(sa) ** 4, -0.25);
    const x = s.x + m * ca * k * (s.hw + 0.004);
    const y = s.spring + SOLE / 2 + sa * k * (SOLE / 2 + 0.001);
    const z = s.z + (u < 0.5 ? -1 : 1) * (1 - s.cap) * 0.006;
    const p = [x, Math.max(0, y), z];
    return { p, uv: [j / saround, u], w: shoeWeights(p), tint: sa < -0.3 ? 0.8 : 1 };
  }, { flip: m > 0 });
  // Laces: five crossings over the instep, each a little tube.
  for (let k = 0; k < 5; k++) {
    const u = 0.4 + k * 0.07;
    const s = S.at(u);
    const span = s.hw * 0.5;
    laces.grid(3, 6, (i, j) => {
      const t = i / 3;
      const x = s.x + (t * 2 - 1) * span;
      const arc = s.h + 0.003 - 0.002 * (2 * t - 1) ** 2;
      const b = (j / 6) * TAU;
      const p = [x, arc + Math.sin(b) * 0.002, s.z + Math.cos(b) * 0.0028];
      return { p, uv: [t, j / 6], w: shoeWeights(p), tint: 0.9 };
    });
  }
}

// ———————————————————————————————————————————————— the briefs

export const BRIEFS = Object.freeze({ legs: 0.74, waist: 0.985 });
const briefsWeights = clothWeights(zoneIs('leg', 'trunk'));

/** Boxer briefs: close over the seat and the tops of the thighs, a band at the waist, the legs' hems turned in. */
function briefs(detail) {
  const part = new Part('briefs', 'briefs');
  const rows = Math.round(28 * detail), around = Math.round(40 * detail);
  for (const m of [1, -1]) {
    part.grid(rows + 2, around, (i, j) => {
      const th = (j / around) * TAU;
      if (i < 2) {
        const y = BRIEFS.legs + 0.012 * (1 - i / 2);
        const p = legPoint(y, th, m, { ease: 0.0015 });
        return { p, uv: [j / around, 0], w: briefsWeights(p), tint: 0.55 };
      }
      const t = (i - 2) / rows;
      const y = BRIEFS.legs + (BRIEFS.waist - BRIEFS.legs) * t;
      const band = 0.0018 * smooth(BRIEFS.waist - 0.04, BRIEFS.waist - 0.036, y);
      const p = legPoint(y, th, m, { ease: 0.0035 + band });
      return { p, uv: [j / around, t], w: briefsWeights(p), tint: 1 - 0.25 * smooth(CROTCH + 0.02, CROTCH - 0.04, y) * G((m * Math.sin(th) + 1) / 0.45) };
    }, { flip: m > 0 });
  }
  return [part];
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
export const GARMENTS = Object.freeze({
  briefs: {
    layer: 1,
    materials: ['briefs'],
    build: (detail) => tag(briefs(detail), 'briefs'),
    covers: ({ zone, y }) => (zone === 'leg' || zone === 'trunk') && y > BRIEFS.legs + 0.014 && y < BRIEFS.waist - 0.008,
  },
  sneakers: {
    layer: 2,
    materials: ['shoe', 'sole'],
    build: (detail) => {
      const upper = new Part('shoes', 'shoe'), sole = new Part('soles', 'sole'), laces = new Part('laces', 'sole');
      for (const m of [1, -1]) shoe(upper, sole, laces, m, detail);
      return tag([upper, sole, laces], 'sneakers');
    },
    covers: ({ zone, y }) => zone === 'foot' || (zone === 'leg' && y < 0.085),
  },
  jeans: {
    layer: 3,
    materials: ['denim'],
    build: (detail) => tag([jeans(detail)], 'jeans'),
    covers: ({ zone, y }) => ((zone === 'leg' || zone === 'trunk') && y > HEM_FRONT + 0.012 && y < WAIST - 0.01) || zone === 'briefs' || (zone === 'sneakers' && y > 0.1),
  },
  tshirt: {
    layer: 4,
    materials: ['shirt'],
    build: (detail) => {
      const [body, rib] = shirt(detail);
      const sleeves = new Part('sleeves', 'shirt');
      for (const m of [1, -1]) sleeve(sleeves, m, detail);
      return tag([body, rib, sleeves], 'tshirt');
    },
    covers: ({ zone, y, d, x = 1 }) => (zone === 'trunk' && y > HEM + 0.02 && (y < COLLAR - 0.03 || x > 0.075)) || (zone === 'neck' && y < COLLAR - 0.035) || (zone === 'arm' && d < SLEEVE_RANGE[1] - 0.015) || ((zone === 'jeans' || zone === 'briefs') && y > HEM + 0.008),
  },
});

/** The outfit he is built in, unless told otherwise. */
export const DEFAULT_OUTFIT = Object.freeze(['briefs', 'tshirt', 'jeans', 'sneakers']);

export { len, dot };
