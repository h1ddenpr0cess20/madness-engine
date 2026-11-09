import { add, clamp, dot, frames, len, norm, Part, profile, scale, smooth, spline, sub } from './kit.js';
import { armWeights, JOINTS, legWeights, mirror, torsoWeights } from './skeleton.js';
import { legPoint, pelvisAt, TRUNK, trunkPoint } from './body.js';

/**
 * The wardrobe: boxer briefs, a crew-neck t-shirt, straight jeans and a pair
 * of sneakers. Each garment is its own mesh, put on over the base body and
 * weighted to the same bones by the same rules as the skin, so cloth and
 * skin move as one. Each is built never closer to the body than an ease
 * (it is made from the body's own surface where its cut would come inside
 * it), and each says which parts of the body (and of the garments under it)
 * it covers: those are not drawn while it is worn, so nothing can show
 * through it however he moves.
 */

const G = (t) => Math.exp(-t * t);
const ad = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** A superellipse's radius scale at angle `th`, exponent `n` (2 an ellipse, higher squarer). */
const superK = (th, n) => Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), -1 / n);

// ———————————————————————————————————————————————— the t-shirt

export const HEM = 0.865, COLLAR = 1.485;
/** Where each piece of the shirt is in its texture: the body below `body`, the sleeves between, the collar above `collar`. */
export const SHIRT_UV = Object.freeze({ body: 0.74, sleeve: [0.76, 0.97], collar: 0.975 });
export const SLEEVE_RANGE = Object.freeze([-0.005, 0.168]);
// By height: half-width, half-depth, centre z, squareness.
const SHIRT = profile([
  [0.865, [0.186, 0.136, 0.004, 2.4]],
  [0.95, [0.181, 0.131, 0.002, 2.4]],
  [1.07, [0.172, 0.123, -0.004, 2.5]],
  [1.2, [0.18, 0.132, 0.0, 2.6]],
  [1.3, [0.195, 0.141, 0.0, 2.7]],
  [1.36, [0.206, 0.132, -0.01, 2.8]],
  [1.4, [0.208, 0.121, -0.018, 2.9]],
  [1.43, [0.198, 0.106, -0.024, 2.9]],
  [1.455, [0.178, 0.088, -0.028, 2.6]],
  [1.472, [0.118, 0.077, -0.027, 2.3]],
  [1.485, [0.082, 0.07, -0.025, 2.1]],
]);

/** A point of the shirt's body at height `y` and angle `th` (0 straight ahead, π/2 to his left). */
export function shirtPoint(y, th) {
  const [a, b, cz, n] = SHIRT(y);
  const k = superK(th, n);
  const sx = Math.sin(th), cz_ = Math.cos(th);
  let ra = a * k, rb = b * k;
  // The chest a little fuller, the shoulder blades behind, a soft drape down the front from the chest to the hem.
  const chest = 0.008 * G((y - 1.29) / 0.06) * G(ad(th, 0) / 0.9);
  const blades = 0.007 * G((y - 1.33) / 0.07) * (G(ad(th, Math.PI - 0.6) / 0.35) + G(ad(th, Math.PI + 0.6) / 0.35));
  const folds = 0.0025 * Math.sin(th * 7 + y * 9) * smooth(1.15, 0.9, y);
  const r = 1 + (chest + blades + folds) / Math.max(0.05, Math.hypot(ra * sx, rb * cz_));
  const p = [sx * ra * r, y, cz + cz_ * rb * r];
  // Never inside the body: out to the skin under it, and an ease beyond.
  const under = y >= TRUNK[0] ? trunkPoint(Math.min(y, TRUNK[1]), th) : (() => { const [a0, b0, c0] = pelvisAt(y); return [sx * a0, y, c0 + cz_ * b0]; })();
  const ease = 0.008 + 0.004 * smooth(1.1, 0.9, y);
  const rp = Math.hypot(p[0], p[2] - cz), rb2 = Math.hypot(under[0], under[2] - cz) + ease;
  if (rp >= rb2 || y > 1.47) return p;
  const f = rb2 / rp;
  return [p[0] * f, y, cz + (p[2] - cz) * f];
}

/** The neckline: lower in front, as a crew neck sits. */
const neckDrop = (th) => 0.028 * Math.pow(Math.max(0, Math.cos(th)), 1.5) + 0.004 * Math.cos(th);

function shirt(detail) {
  const body = new Part('shirt', 'shirt');
  const rows = Math.round(56 * detail), around = Math.round(56 * detail);
  // Rows: the hem turned up inside (three rows), then the body from the hem to the collar.
  body.grid(rows + 3, around, (i, j) => {
    const th = (j / around) * Math.PI * 2;
    if (i < 3) {
      // The turned-up hem: from 2 cm up inside, down to the fold, then out.
      const t = i / 3;
      const y = HEM + 0.02 * (1 - t) * (1 - t);
      const p = shirtPoint(Math.max(HEM, y), th);
      const inset = 0.004 * (1 - t);
      const c = [0, y, SHIRT(HEM)[2]];
      const dir = norm([p[0] - c[0], 0, p[2] - c[2]]);
      return { p: [p[0] - dir[0] * inset, y - 0.002 * t, p[2] - dir[2] * inset], uv: [j / around, 0], w: torsoWeights(p), tint: 0.6 };
    }
    const t = (i - 3) / rows;
    const y0 = HEM - 0.002 + (COLLAR - HEM) * (1 - Math.pow(1 - t, 1.25));
    const y = y0 - neckDrop(th) * smooth(1.4, COLLAR, y0);
    const p = shirtPoint(Math.min(COLLAR, y0), th);
    p[1] = y;
    const tint = 1 - 0.25 * G((y - 1.33) / 0.04) * G(ad(Math.abs(ad(th, 0)), Math.PI / 2) / 0.35);
    return { p, uv: [j / around, SHIRT_UV.body * t], w: torsoWeights(p), tint };
  }, { flip: true });
  // The collar's rib: a soft rolled band round the neckline.
  const rib = new Part('collar', 'shirt');
  rib.grid(around, 10, (j, i) => {
    const th = (j / around) * Math.PI * 2;
    const p = shirtPoint(COLLAR, th);
    const y = COLLAR - neckDrop(th);
    const c = [0, y, SHIRT(COLLAR)[2]];
    const out = norm([p[0] - c[0], 0, p[2] - c[2]]);
    const a = (i / 10) * Math.PI * 2;
    const o = 0.0015 + Math.cos(a) * 0.0042, h = -0.0065 + Math.sin(a) * 0.0085;
    const q = [p[0] + out[0] * o, y + h, p[2] + out[2] * o];
    return { p: q, uv: [j / around, SHIRT_UV.collar + (1 - SHIRT_UV.collar) * (i / 10)], w: torsoWeights(q), tint: Math.cos(a) < -0.3 ? 0.6 : 0.95 };
  }, { flip: true });
  return [body, rib];
}

/** A sleeve is sewn to the arm: it goes where the arm goes, all but a little at the very top. */
function sleeveWeights(p) {
  const w = armWeights(p);
  const S = p[0] >= 0 ? 'L' : 'R';
  const give = (w.chest ?? 0) * 0.85 + (w[`clavicle${S}`] ?? 0) * 0.6;
  w.chest = (w.chest ?? 0) * 0.15;
  if (w[`clavicle${S}`]) w[`clavicle${S}`] *= 0.4;
  w[`arm${S}`] = (w[`arm${S}`] ?? 0) + give;
  return w;
}

/** A sleeve, along the arm from the shoulder to halfway to the elbow, its hem turned in. */
function sleeve(part, m, detail) {
  const sh = mirror(JOINTS.shoulder, m), el = mirror(JOINTS.elbow, m);
  const dir = norm(sub(el, sh));
  const rows = Math.round(16 * detail), around = Math.round(36 * detail);
  const [D0, D1] = SLEEVE_RANGE;
  let out = sub([m, 0, 0], scale(dir, dot([m, 0, 0], dir)));
  out = norm(out);
  const fwd = norm([dir[1] * out[2] - dir[2] * out[1], dir[2] * out[0] - dir[0] * out[2], dir[0] * out[1] - dir[1] * out[0]]);
  const f = fwd[2] < 0 ? scale(fwd, -1) : fwd;
  part.grid(rows + 3, around, (i, j) => {
    const th = (j / around) * Math.PI * 2;
    let d, inset = 0;
    if (i <= rows) d = D0 + (D1 - D0) * (i / rows);
    else { const t = (i - rows) / 3; d = D1 - 0.018 * t; inset = 0.0045 * Math.sin(t * Math.PI / 2); }
    // Roomy at the top, a little narrower at the hem; the underarm side gathered in.
    const dome = Math.sqrt(clamp(1 - ((0.075 - Math.min(d, 0.075)) / 0.08) ** 2));
    const r = (0.067 - 0.007 * smooth(0, D1, d)) * dome + 0.0022 * Math.sin(th * 5 + d * 30) * smooth(0.05, D1, d) - inset;
    const ro = r * (1 + 0.06 * Math.cos(th));
    const c = add(sh, scale(dir, d));
    const p = add(c, add(scale(f, Math.sin(th) * ro), scale(out, Math.cos(th) * ro)));
    return { p, uv: [j / around, SHIRT_UV.sleeve[0] + (SHIRT_UV.sleeve[1] - SHIRT_UV.sleeve[0]) * clamp((d - D0) / (D1 - D0))], w: sleeveWeights(p), tint: i > rows ? 0.6 : 1 - 0.3 * G(ad(th, Math.PI) / 0.5) * smooth(0.06, 0, d) };
  }, { flip: m > 0 });
}

// ———————————————————————————————————————————————— the jeans

export const WAIST = 1.005, CROTCH = 0.8, HEM_FRONT = 0.05, HEM_BACK = 0.028;
/** The height of the jeans at `t` up the leg (0 the hem, 1 the waist), at angle `th` round it. */
export const jeansHeight = (t, th) => { const hem = HEM_BACK + (HEM_FRONT - HEM_BACK) * (0.5 + 0.5 * Math.cos(th)); return hem + (WAIST - hem) * t; };
// The pelvis, by height: half-width, half-depth, centre z.
// The jeans' own cut: a roomy seat and a straight leg.
const JEANS_PELVIS = profile([[0.74, [0.176, 0.128, -0.008]], [0.84, [0.182, 0.132, -0.012]], [0.92, [0.178, 0.128, -0.009]], [0.99, [0.17, 0.12, -0.003]], [1.035, [0.164, 0.115, 0.0]], [1.06, [0.16, 0.112, 0.0]]]);
const JEANS_LEG = profile([[0.03, [0.06, 0.068, 0.016]], [0.12, [0.057, 0.062, 0.01]], [0.3, [0.057, 0.06, 0.004]], [0.46, [0.06, 0.062, 0.006]], [0.6, [0.07, 0.074, 0.004]], [0.75, [0.085, 0.087, 0.0]], [0.86, [0.094, 0.094, -0.004]]]);

/** A point of one leg of the jeans at height `y` and angle `th` round it (0 forward, π/2 out), side `m`. */
export function jeansPoint(y, th, m) {
  const own = legPoint(y, th, m, { pelvis: JEANS_PELVIS, leg: JEANS_LEG, shape: false });
  const body = legPoint(Math.max(0.07, y), th, m, { ease: 0.007 });
  body[1] = y;
  const ax = legAxisXZ(y, m);
  const ro = Math.hypot(own[0] - ax[0], own[2] - ax[1]), rb = Math.hypot(body[0] - ax[0], body[2] - ax[1]);
  const p = rb > ro ? body : own;
  // Creases: stacked over the shoe, behind the knee, across the lap.
  const r = Math.max(ro, rb);
  const crease = 0.0025 * Math.sin(y * 140 + th) * G((y - 0.13) / 0.06) + 0.002 * Math.sin(y * 180) * G((y - 0.5) / 0.03) * Math.max(0, -Math.cos(th));
  const f = (r + crease) / (r || 1);
  return [ax[0] + (p[0] - ax[0]) * f, y, ax[1] + (p[2] - ax[1]) * f];
}

/** The leg's middle in x and z at height `y` (as body.js has it), for measuring round. */
function legAxisXZ(y, m) {
  const J = JOINTS;
  const [hip, knee, ankle] = [J.hip, J.knee, J.ankle].map((p) => mirror(p, m));
  const t = y >= knee[1] ? (y - knee[1]) / (hip[1] - knee[1]) : clamp((y - ankle[1]) / (knee[1] - ankle[1]));
  const [a, b] = y >= knee[1] ? [knee, hip] : [ankle, knee];
  return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t];
}

function jeans(detail) {
  const part = new Part('jeans', 'denim');
  const rows = Math.round(64 * detail), around = Math.round(36 * detail);
  for (const m of [1, -1]) {
    part.grid(rows + 3, around, (i, j) => {
      const th = (j / around) * Math.PI * 2;
      const hem = HEM_BACK + (HEM_FRONT - HEM_BACK) * (0.5 + 0.5 * Math.cos(th));
      if (i < 3) {
        // The hem, turned up inside.
        const t = i / 3;
        const y = hem + 0.025 * (1 - t) * (1 - t);
        const p = jeansPoint(y, th, m);
        const ax = legAxisXZ(y, m);
        const o = norm([p[0] - ax[0], 0, p[2] - ax[1]]);
        const inset = 0.004 * (1 - t);
        return { p: [p[0] - o[0] * inset, y, p[2] - o[2] * inset], uv: [j / around, 0], w: legWeights(p), tint: 0.55 };
      }
      const t = (i - 3) / rows;
      const y = hem + (WAIST - hem) * t;
      const p = jeansPoint(y, th, m);
      const tint = 1 - 0.3 * smooth(CROTCH + 0.02, CROTCH - 0.05, y) * G((m * Math.sin(th) + 1) / 0.5);
      return { p, uv: [j / around, t], w: legWeights(p), tint };
    }, { flip: m > 0 });
  }
  return part;
}

// ———————————————————————————————————————————————— the sneakers

const SOLE_TOP = 0.024;
// Along the foot, from the heel (0) to the toe (1): half-width, upper's height, the sole's toe spring.
const SHOE = profile([[0, [0.036, 0.085, 0]], [0.1, [0.042, 0.092, 0]], [0.35, [0.047, 0.098, 0]], [0.55, [0.052, 0.082, 0]], [0.72, [0.053, 0.066, 0.002]], [0.88, [0.047, 0.052, 0.008]], [1, [0.036, 0.038, 0.016]]]);
const SHOE_BACK = -0.082, SHOE_LEN = 0.29;

/** The outline of the shoe's footprint at `u` along it and side `s` (−1 inside, +1 outside): x offset, z. */
function footprint(u, s, m) {
  const [hw] = SHOE(u);
  const ankle = mirror(JOINTS.ankle, m);
  // The foot turns out a little, and the outline bulges on the outside at the ball.
  const z = ankle[2] + SHOE_BACK + u * SHOE_LEN;
  const x = ankle[0] + m * (0.006 * u + s * hw * (1 + 0.08 * Math.max(0, s) * G((u - 0.62) / 0.15)));
  return [x, z];
}

function shoe(upper, sole, laces, m, detail) {
  const rows = Math.round(30 * detail), around = Math.round(24 * detail);
  // The upper: a loft from heel to toe, each section a rounded arch over the sole.
  upper.grid(rows, around, (i, j) => {
    const u = i / rows;
    const [, h, spring] = SHOE(u);
    const a = (j / around) * Math.PI; // 0 the outer edge, π the inner, over the top
    const cap = Math.sqrt(clamp(1 - ((Math.max(0, u - 0.94)) / 0.06) ** 2)) * Math.sqrt(clamp(1 - (Math.max(0, 0.04 - u) / 0.04) ** 2));
    const s = Math.cos(a);
    const [x0, z] = footprint(u, s * cap, m);
    const ankle = mirror(JOINTS.ankle, m);
    const top = SOLE_TOP + spring + (h - SOLE_TOP) * Math.pow(Math.sin(a), 0.7) * (0.25 + 0.75 * cap);
    const zz = z + (u < 0.5 ? -1 : 1) * (1 - cap) * 0.006;
    const y = SOLE_TOP + spring + (top - SOLE_TOP - spring) * 1;
    const p = [ankle[0] + (x0 - ankle[0]), y, zz];
    return { p, uv: [j / around, u], w: legWeights(p), tint: 1 - 0.25 * smooth(0.2, 0, Math.sin(a)) };
  }, { flip: m < 0 });
  // The sole: a slab under it all, its edge proud of the upper, rounded at heel and toe, the toe sprung up.
  const srows = Math.round(30 * detail), saround = Math.round(32 * detail);
  sole.grid(srows, saround, (i, j) => {
    const u = i / srows;
    const a = (j / saround) * Math.PI * 2;
    const [, , spring] = SHOE(u);
    const cap = Math.sqrt(clamp(1 - (Math.max(0, u - 0.95) / 0.05) ** 2)) * Math.sqrt(clamp(1 - (Math.max(0, 0.05 - u) / 0.05) ** 2));
    // Round the slab's section: top, outer edge, bottom, inner edge.
    const ca = Math.cos(a), sa = Math.sin(a);
    const k = superK(a, 4);
    const [x, z] = footprint(u, ca * k * 1.06 * cap, m);
    const thick = SOLE_TOP + 0.002;
    const y = spring + thick / 2 + sa * k * (thick / 2);
    const zz = z + (u < 0.5 ? -1 : 1) * (1 - cap) * 0.008;
    const p = [x, Math.max(0, y), zz];
    return { p, uv: [j / saround, u], w: legWeights(p), tint: sa < -0.3 ? 0.8 : 1 };
  }, { flip: m > 0 });
  // Laces: five crossings over the instep, each a little tube.
  const ankle = mirror(JOINTS.ankle, m);
  for (let k = 0; k < 5; k++) {
    const u = 0.43 + k * 0.065;
    const h = SHOE(u)[1], hw = SHOE(u)[0];
    const z = ankle[2] + SHOE_BACK + u * SHOE_LEN;
    const span = hw * 0.5;
    laces.grid(3, 6, (i, j) => {
      const t = i / 3;
      const x = ankle[0] + m * 0.006 * u + (t * 2 - 1) * span;
      const arc = h + 0.0035 - 0.004 * (2 * t - 1) ** 2 * 0.5;
      const b = (j / 6) * Math.PI * 2;
      const p = [x, arc + Math.sin(b) * 0.0022, z + Math.cos(b) * 0.003];
      return { p, uv: [t, j / 6], w: legWeights(p), tint: 0.9 };
    });
  }
}

// ———————————————————————————————————————————————— the briefs

export const BRIEFS = Object.freeze({ legs: 0.705, waist: 1.0 });

/** Boxer briefs: close over the seat and the tops of the thighs, a band at the waist, the legs' hems turned in. */
function briefs(detail) {
  const part = new Part('briefs', 'briefs');
  const rows = Math.round(26 * detail), around = Math.round(36 * detail);
  for (const m of [1, -1]) {
    part.grid(rows + 2, around, (i, j) => {
      const th = (j / around) * Math.PI * 2;
      if (i < 2) {
        const y = BRIEFS.legs + 0.012 * (1 - i / 2);
        const p = legPoint(y, th, m, { ease: 0.002 });
        return { p, uv: [j / around, 0], w: legWeights(p), tint: 0.55, zone: { zone: 'briefs', y, d: 0 } };
      }
      const t = (i - 2) / rows;
      const y = BRIEFS.legs + (BRIEFS.waist - BRIEFS.legs) * t;
      // The waistband stands a little proud.
      const band = 0.0018 * smooth(BRIEFS.waist - 0.04, BRIEFS.waist - 0.036, y);
      const p = legPoint(y, th, m, { ease: 0.0045 + band });
      return { p, uv: [j / around, t], w: legWeights(p), tint: 1 - 0.25 * smooth(CROTCH + 0.02, CROTCH - 0.04, y) * G((m * Math.sin(th) + 1) / 0.45), zone: { zone: 'briefs', y, d: 0 } };
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
    covers: ({ zone, y }) => (zone === 'leg' && y > BRIEFS.legs + 0.014) || (zone === 'trunk' && y < BRIEFS.waist - 0.006),
  },
  sneakers: {
    layer: 2,
    materials: ['shoe', 'sole'],
    build: (detail) => {
      const upper = new Part('shoes', 'shoe'), sole = new Part('soles', 'sole'), laces = new Part('laces', 'sole');
      for (const m of [1, -1]) shoe(upper, sole, laces, m, detail);
      return tag([upper, sole, laces], 'sneakers');
    },
    covers: ({ zone, y }) => zone === 'foot' || (zone === 'leg' && y < 0.084),
  },
  jeans: {
    layer: 3,
    materials: ['denim'],
    build: (detail) => tag([jeans(detail)], 'jeans'),
    covers: ({ zone, y }) => (zone === 'leg' && y > 0.07) || (zone === 'trunk' && y < WAIST - 0.012) || zone === 'briefs' || (zone === 'sneakers' && y > 0.08),
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
    covers: ({ zone, y, d }) => zone === 'trunk' || (zone === 'arm' && d < SLEEVE_RANGE[1] - 0.014) || ((zone === 'leg' || zone === 'briefs' || zone === 'jeans') && y > HEM + 0.02),
  },
});

/** The outfit he is built in, unless told otherwise. */
export const DEFAULT_OUTFIT = Object.freeze(['briefs', 'tshirt', 'jeans', 'sneakers']);

export { len, frames, spline };
