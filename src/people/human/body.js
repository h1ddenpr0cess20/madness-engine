import { clamp, Part, profile, smooth } from './kit.js';
import { JOINTS, legWeights, mirror, torsoWeights } from './skeleton.js';

/**
 * The bare body below the neck and between the arms: the trunk, the legs
 * and the feet, the base every garment is put on over. Stylised and
 * athletic (a broad chest, a narrow waist, the pecs, abs and shoulder
 * blades drawn in), and smooth where it has nothing to show.
 *
 * The legs each carry half the pelvis up to the waist, meeting on the
 * middle line, so the hips have no seam; the trunk rises out of them. Every
 * vertex is tagged with where on the body it is, so a garment can say which
 * of it it covers.
 */

const G = (t) => Math.exp(-t * t);
const ad = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const superK = (th, n) => Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), -1 / n);

// ———————————————————————————————————————————————— the trunk

export const TRUNK = Object.freeze([0.985, 1.5]);
// By height: half-width, half-depth, centre z, squareness.
const TORSO = profile([
  [0.985, [0.16, 0.109, -0.002, 2.3]],
  [1.06, [0.146, 0.103, 0.0, 2.3]],
  [1.12, [0.151, 0.107, 0.002, 2.4]],
  [1.2, [0.166, 0.118, 0.006, 2.5]],
  [1.28, [0.181, 0.126, 0.006, 2.6]],
  [1.34, [0.192, 0.122, -0.004, 2.7]],
  [1.39, [0.196, 0.111, -0.016, 2.8]],
  [1.425, [0.178, 0.096, -0.024, 2.7]],
  [1.455, [0.13, 0.079, -0.029, 2.4]],
  [1.48, [0.075, 0.064, -0.03, 2.1]],
  [1.5, [0.05, 0.05, -0.03, 2.0]],
]);

/** A point of the trunk at height `y`, angle `th` (0 ahead, π/2 to his left). */
export function trunkPoint(y, th) {
  const [a, b, cz, n] = TORSO(y);
  const k = superK(th, n);
  const s = Math.sin(th), c = Math.cos(th);
  const x = s * a * k, ax = Math.abs(x);
  const front = Math.max(0, c), back = Math.max(0, -c);
  let bump = 0;
  // The pecs, with a firm lower edge; the abs in rows down the middle with the line between them; the navel.
  bump += 0.013 * G((ax - 0.072) / 0.05) * smooth(1.245, 1.275, y) * G((y - 1.315) / 0.05) * front ** 0.6;
  bump += 0.0035 * G(ax / 0.045) * (0.5 + 0.5 * Math.cos(((y - 1.04) / 0.055) * Math.PI * 2)) * smooth(1.02, 1.05, y) * smooth(1.24, 1.21, y) * front;
  bump -= 0.0028 * G(ax / 0.006) * smooth(1.02, 1.05, y) * smooth(1.26, 1.22, y) * front;
  bump -= 0.007 * G(ax / 0.0065) * G((y - 1.083) / 0.0065) * front;
  // The obliques over the hips; the shoulder blades and the groove of the spine behind.
  bump += 0.006 * G((ax - 0.13) / 0.03) * G((y - 1.03) / 0.04) * (1 - back);
  bump += 0.009 * G((ax - 0.075) / 0.04) * G((y - 1.33) / 0.06) * back;
  bump -= 0.005 * G(ax / 0.011) * smooth(1.0, 1.06, y) * smooth(1.44, 1.38, y) * back;
  // The muscle from the neck down to each shoulder, rising behind.
  bump += 0.006 * G((ax - 0.08) / 0.04) * G((y - 1.44) / 0.025) * (0.4 + back);
  const r = Math.hypot(a * k * s, b * k * c) || 1;
  const f = 1 + bump / r;
  return [x * f, y, cz + c * b * k * f];
}

function trunk(part, detail) {
  const rows = Math.round(52 * detail), around = Math.round(52 * detail);
  const [y0, y1] = TRUNK;
  part.grid(rows, around, (i, j) => {
    const th = (j / around) * Math.PI * 2;
    const y = y0 + (y1 - y0) * (i / rows);
    const p = trunkPoint(y, th);
    const pit = 1 - 0.3 * G((y - 1.32) / 0.04) * G(ad(Math.abs(ad(th, 0)), Math.PI / 2) / 0.3);
    return { p, uv: [j / around, i / rows], w: torsoWeights(p), tint: pit * (1 - 0.2 * G((p[0]) / 0.006) * G((y - 1.083) / 0.007)), zone: { zone: 'trunk', y, d: 0 } };
  }, { flip: true });
}

// ———————————————————————————————————————————————— the legs

export const CROTCH = 0.8;
export const LEG_TOP = 1.06;
// The pelvis, by height: half-width, half-depth, centre z.
const PELVIS = profile([[0.74, [0.165, 0.118, -0.008]], [0.84, [0.174, 0.124, -0.012]], [0.92, [0.17, 0.12, -0.009]], [0.99, [0.162, 0.112, -0.003]], [1.035, [0.152, 0.106, 0.0]], [1.06, [0.13, 0.092, 0.0]]]);
// A leg, by height: radius across, radius front to back, how far forward of the bones its middle is.
const LEG = profile([[0.06, [0.034, 0.038, 0.004]], [0.12, [0.036, 0.04, 0.0]], [0.25, [0.044, 0.049, -0.006]], [0.36, [0.05, 0.056, -0.01]], [0.46, [0.048, 0.05, -0.002]], [0.5, [0.05, 0.052, 0.004]], [0.58, [0.059, 0.061, 0.004]], [0.68, [0.069, 0.071, 0.002]], [0.78, [0.079, 0.081, 0.0]], [0.86, [0.087, 0.087, -0.004]]]);

/** The pelvis's half-width, half-depth and centre z at height `y`. */
export const pelvisAt = (y) => PELVIS(y);

/** Where the leg's middle is at height `y` (side `m`): down the line of hip, knee and ankle. */
export function legAxis(y, m) {
  const J = JOINTS;
  const [hip, knee, ankle] = [J.hip, J.knee, J.ankle].map((p) => mirror(p, m));
  if (y >= knee[1]) { const t = (y - knee[1]) / (hip[1] - knee[1]); return [knee[0] + (hip[0] - knee[0]) * t, y, knee[2] + (hip[2] - knee[2]) * t]; }
  const t = clamp((y - ankle[1]) / (knee[1] - ankle[1]));
  return [ankle[0] + (knee[0] - ankle[0]) * t, y, ankle[2] + (knee[2] - ankle[2]) * t];
}

/**
 * A point round a leg at height `y` and angle `th` (0 forward, π/2 out),
 * side `m`, made `ease` bigger all round (for what is worn over it). Up in
 * the seat the leg is half the pelvis, out along the same ray to its
 * outline and flat on the middle line.
 */
export function legPoint(y, th, m, { ease = 0, pelvis = PELVIS, leg = LEG, shape = true } = {}) {
  const ax = legAxis(y, m);
  const [rx, rz, fz] = leg(y);
  const dir = [m * Math.sin(th), Math.cos(th)];
  const k = superK(th, 2.15);
  let bump = 0;
  if (shape) {
    const front = Math.max(0, Math.cos(th)), back = Math.max(0, -Math.cos(th)), inner = Math.max(0, -Math.sin(th));
    bump += 0.0045 * G((y - 0.5) / 0.025) * front ** 2;
    bump += 0.006 * G((y - 0.565) / 0.03) * G(ad(th, -0.6) / 0.6);
    bump += 0.008 * G((y - 0.37) / 0.05) * back * (0.6 + 0.4 * inner);
    bump -= 0.003 * G((y - 0.48) / 0.02) * back;
  }
  let p = [ax[0] + dir[0] * (rx * k + ease + bump), ax[2] + fz + dir[1] * (rz * k + ease + bump)];
  const s = smooth(CROTCH - 0.07, CROTCH + 0.04, y);
  if (s > 0) {
    const [a0, b0, cz] = pelvis(y);
    const a = a0 + ease, b = b0 + ease;
    const glute = shape ? 0.012 * G((y - 0.9) / 0.05) * Math.max(0, -Math.cos(th)) ** 1.5 : 0;
    let lo = 0, hi = 0.4;
    const inside = (t) => {
      const x = ax[0] + dir[0] * t, z = ax[2] + dir[1] * t;
      return (x / a) ** 2 + ((z - cz) / (b + glute)) ** 2 < 1 && x * m >= -0.0004;
    };
    for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; if (inside(mid)) lo = mid; else hi = mid; }
    p = [p[0] + (ax[0] + dir[0] * lo - p[0]) * s, p[1] + (ax[2] + dir[1] * lo - p[1]) * s];
  }
  return [p[0], y, p[1]];
}

function legs(part, detail) {
  const rows = Math.round(70 * detail), around = Math.round(36 * detail);
  for (const m of [1, -1]) {
    part.grid(rows, around, (i, j) => {
      const th = (j / around) * Math.PI * 2;
      const y = 0.068 + (LEG_TOP - 0.068) * (i / rows);
      const p = legPoint(y, th, m);
      const tint = 1 - 0.28 * smooth(CROTCH + 0.02, CROTCH - 0.04, y) * G((m * Math.sin(th) + 1) / 0.45) - 0.15 * G((y - 0.48) / 0.02) * Math.max(0, -Math.cos(th));
      return { p, uv: [j / around, i / rows], w: legWeights(p), tint, zone: { zone: 'leg', y, d: 0 } };
    }, { flip: m > 0 });
  }
}

// ———————————————————————————————————————————————— the feet

const FOOT_BACK = -0.068, FOOT_LEN = 0.27;
// Heel (0) to toes (1): half-width, height of the top, the sole's arch on the inside.
const FOOT = profile([[0, [0.028, 0.065]], [0.12, [0.034, 0.095]], [0.3, [0.038, 0.1]], [0.5, [0.041, 0.062]], [0.68, [0.046, 0.042]], [0.82, [0.046, 0.03]], [0.93, [0.04, 0.024]], [1, [0.03, 0.018]]]);

/** A point of the left (m 1) or right foot: `u` heel to toe, `a` round (0 the outer edge at the sole, π/2 over the top, π the inner edge, on round under the sole). */
export function footPoint(u, a, m) {
  const ankle = mirror(JOINTS.ankle, m);
  const [hw, h] = FOOT(u);
  // Rounded at the heel and at the toes' ends; five toes, each a rise over the top and a step in the outline.
  const heel = Math.sqrt(clamp(1 - (Math.max(0, 0.08 - u) / 0.08) ** 2));
  const tip = Math.sqrt(clamp(1 - (Math.max(0, u - 0.9) / 0.1) ** 2));
  const across = Math.cos(a), up = Math.sin(a);
  // Toes from the inside (big toe) out; where on the foot's width each one is.
  let toes = 0;
  if (u > 0.74) {
    const w = (across * -1 + 1) / 2;
    const centres = [0.86, 0.66, 0.48, 0.31, 0.15];
    const sizes = [1.25, 0.95, 0.9, 0.82, 0.75];
    let best = 0;
    centres.forEach((c, i) => { best = Math.max(best, sizes[i] * G((w - c) / 0.075)); });
    toes = best * smooth(0.74, 0.82, u);
  }
  const width = hw * heel * tip * (1 - 0.07 * smooth(0.8, 1, u) * (1 - toes));
  // The sole: flat, the arch lifting the inside of the middle; the top: the instep falling to the toes.
  const sole = 0.004 + 0.01 * G((u - 0.42) / 0.14) * smooth(0.0, -0.8, across) * Math.max(0, -up);
  const top = h * (0.85 + 0.15 * toes * smooth(0.78, 0.86, u));
  const y = up >= 0 ? sole + (top - sole) * Math.pow(up, 0.75) * heel * tip + 0.004 * (1 - heel * tip) : sole * (1 + up);
  const lean = 0.006 * u;
  return [ankle[0] + m * (lean + across * width * (up >= 0 ? 1 : 0.92)), Math.max(0, y), ankle[2] + FOOT_BACK + u * FOOT_LEN];
}

function feet(part, detail) {
  const rows = Math.round(40 * detail), around = Math.round(28 * detail);
  for (const m of [1, -1]) {
    part.grid(rows, around, (i, j) => {
      const u = i / rows, a = (j / around) * Math.PI * 2;
      const p = footPoint(u, a, m);
      // The upper part of the foot rises into the shin; the heel is the leg's, the toes their own.
      return { p, uv: [j / around, u], w: legWeights(p), tint: Math.sin(a) < -0.2 ? 0.85 : 1, zone: { zone: 'foot', y: p[1], d: u } };
    }, { flip: m > 0 });
  }
}

/** The bare body's parts: trunk, legs and feet, all in the skin's material. */
export function buildBody(detail = 1) {
  const part = new Part('body', 'skin');
  trunk(part, detail);
  legs(part, detail);
  feet(part, detail);
  return part;
}
