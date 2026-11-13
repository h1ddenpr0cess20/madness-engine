import { rngFor } from './buildings/common.js';

/**
 * Trees, drawn into a `Mesher` standing on y = 0 at the origin, a tile
 * across. From the California coast: the date palm with its curved trunk and
 * drooping fronds, the tall thin fan palm of the boulevards, the coast
 * redwood and the Italian cypress. From the moat games' woods: the oak, the
 * birch, the pine and the orchard's fruit tree, and the outcrops of boulders
 * and iron ore. `hi` draws the near version, false a cheaper one for far
 * away. Leaves are drawn near-white in the material `leaf` (or `needle` for
 * conifers), so the game's leaf materials color them.
 *
 *     const m = new Mesher();
 *     palm(m, { hi: true, seed: 3 });
 */

/** A frond: a strip from the crown out along `dir`, arcing down, widest in the middle, drawn from both sides. */
function frond(m, mat, top, a, len, droop, width, segs, col) {
  const dx = Math.cos(a), dz = Math.sin(a);
  const px = -dz, pz = dx;
  const pt = (t, s) => {
    const w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * s;
    return [top[0] + dx * len * t + px * w, top[1] + len * 0.35 * t - droop * t * t + Math.abs(w) * -0.25, top[2] + dz * len * t + pz * w];
  };
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const a0 = pt(t0, -1), a1 = pt(t1, -1), c0 = pt(t0, 0), c1 = pt(t1, 0), b0 = pt(t0, 1), b1 = pt(t1, 1);
    c0[1] += width * 0.15; c1[1] += width * 0.15;
    m.quad(mat, a0, c0, c1, a1, col);
    m.quad(mat, c0, b0, b1, c1, col);
    m.quad(mat, a1, c1, c0, a0, col);
    m.quad(mat, c1, b1, b0, c0, col);
  }
}

/** A trunk of stacked frustums along a curve from the ground to `top`, ringed like a palm's. */
function curvedTrunk(m, mat, h, bend, rBot, rTop, segs, sides, col, dark) {
  let prev = [0, 0, 0];
  for (let i = 0; i < segs; i++) {
    const t1 = (i + 1) / segs, t0 = i / segs;
    const next = [bend * t1 * t1, h * t1, 0];
    const r0 = rBot + (rTop - rBot) * t0, r1 = rBot + (rTop - rBot) * t1;
    m.push().translate(prev[0], prev[1], prev[2]);
    const lean = Math.atan2(next[0] - prev[0], next[1] - prev[1]);
    m.rotateZ(-lean);
    const len = Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    m.cylinder(mat, 0, 0, 0, r1, r0 * 1.06, len, sides, i % 2 ? col : dark, { smooth: true, caps: false });
    m.pop();
    prev = next;
  }
  return prev;
}

/** The date palm (Phoenix canariensis): a stout trunk, a little bent, and a full crown of long drooping fronds. */
export function palm(m, { hi = true, seed = 0, leaf = 'leafA', bark = 'bark' } = {}) {
  const rnd = rngFor(seed, 13);
  const h = 1.3 + rnd() * 0.5, bend = (rnd() - 0.3) * 0.25;
  const top = curvedTrunk(m, bark, h, bend, 0.085, 0.06, hi ? 7 : 3, hi ? 8 : 5, '#8a7458', '#6e5a42');
  m.sphere('bark', top[0], top[1], top[2], 0.1, 0.09, 0.1, '#6a5a3a', { detail: 0 });
  const n = hi ? 11 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
    frond(m, leaf, top, a, 0.55 + rnd() * 0.15, 0.5 + rnd() * 0.2, 0.11, hi ? 5 : 2, '#e8e8e8');
  }
  if (hi) for (let i = 0; i < 4; i++) frond(m, leaf, top, i * 1.6 + 0.4, 0.4, 0.05, 0.08, 3, '#f2f2f2');
}

/** The Mexican fan palm (Washingtonia): very tall and thin, a small round head of fans, a skirt of dead fronds under it. */
export function fanPalm(m, { hi = true, seed = 0, leaf = 'leafB', bark = 'bark' } = {}) {
  const rnd = rngFor(seed, 7);
  const h = 2.1 + rnd() * 0.8, bend = (rnd() - 0.5) * 0.2;
  const top = curvedTrunk(m, bark, h, bend, 0.05, 0.035, hi ? 6 : 2, hi ? 6 : 4, '#8f8068', '#7e705a');
  m.cylinder('plain', top[0], top[1] - 0.32, top[2], 0.13, 0.06, 0.34, hi ? 8 : 5, '#9a8458', { caps: false });
  const n = hi ? 10 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4;
    frond(m, leaf, top, a, 0.3 + rnd() * 0.06, 0.18, 0.14, hi ? 3 : 1, '#e8e8e8');
  }
}

/** The coast redwood: a straight red trunk going up a long way bare, and a narrow spire of short boughs at the top. */
export function redwood(m, { hi = true, seed = 0, needle = 'needle', bark = 'bark' } = {}) {
  const rnd = rngFor(seed, 5);
  const h = 3.4 + rnd() * 1.2;
  m.cylinder(bark, 0, -0.05, 0, 0.13, 0.22, 0.25, hi ? 10 : 6, '#7a3e26', { smooth: true, caps: false });
  m.cylinder(bark, 0, 0.2, 0, 0.05, 0.13, h - 0.2, hi ? 10 : 6, '#8a4a2e', { smooth: true });
  const tiers = hi ? 9 : 4, sides = hi ? 9 : 6;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y = h * 0.38 + f * h * 0.58;
    const r = (0.62 - f * 0.48) * (0.85 + 0.3 * rnd());
    m.bough(needle, (rnd() - 0.5) * 0.04, y, 0, r, h * 0.16, sides, '#e0e0e0', { seed: seed * 11 + t, rot: t * 0.7 });
  }
  m.bough(needle, 0, h * 0.96, 0, 0.1, 0.35, 5, '#e0e0e0', { seed });
}

/** The Italian cypress: a dark green flame, for gardens and the edges of plazas. */
export function cypress(m, { hi = true, seed = 0, needle = 'needle' } = {}) {
  const rnd = rngFor(seed, 3);
  const h = 1.3 + rnd() * 0.5;
  m.crown(needle, 0, h * 0.5, 0, 0.17, h * 0.55, 0.17, '#d8d8d8', { detail: hi ? 2 : 1, lump: 0.12, seed });
}


// ———————————————————————————————————————————————— the woods of the moat games

/** A hash of two whole numbers and a seed, 0 to 1 (the moat games' `hash2`), so each variant is the same each time. */
function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A color part of the way from one hex color to another. */
function mixHex(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** A clump of canopy in near-white (the leaf material colors it): lumpy, shaded round, pale on top and dark underneath. */
function blob(m, x, y, z, rx, ry, rz, mat, detail, seed, lump = 0.24) {
  m.crown(mat, x, y, z, rx, ry, rz, '#e8e8e8', { detail, lump, seed });
}

const TRUNK = ['#6a4a2c', '#5a3e26', '#74532f'];

/**
 * An oak (from the moat games' woods): a trunk that flares at the root and
 * tapers, limbs reaching up into a crown of five clumps. Six variants, by
 * `seed`; the leaf material by variant too unless `leaf` is given.
 */
export function oak(m, { hi = true, seed = 0, leaf = null, bark = 'bark' } = {}) {
  const v = ((seed % 6) + 6) % 6;
  const L = leaf ?? ['leafA', 'leafB', 'leafC'][v % 3];
  const rnd = (k) => hash2(v * 13 + k, k * 7, 3);
  const trunk = TRUNK[v % 3];
  const lean = (rnd(9) - 0.5) * 0.06;
  m.cylinder(bark, 0, -0.05, 0, 0.1, 0.13, 0.12, hi ? 8 : 5, trunk, { smooth: hi, caps: false });
  m.cylinder(bark, lean * 0.4, 0.06, 0, 0.05, 0.1, 0.34, hi ? 8 : 5, trunk, { smooth: hi });
  m.cylinder(bark, lean, 0.38, 0, 0.04, 0.05, 0.3, hi ? 7 : 5, trunk, { smooth: hi });
  if (hi) {
    for (let b = 0; b < 4; b++) {
      const a = b * 1.7 + rnd(b) * 1.5;
      m.beam(bark, [lean, 0.5, 0], [Math.cos(a) * 0.26, 0.9 + rnd(b + 3) * 0.14, Math.sin(a) * 0.26], 0.04 - b * 0.004, trunk);
    }
  }
  const R = 0.34 + rnd(1) * 0.1, D = hi ? 2 : 1;
  blob(m, lean, 0.96, 0, R, R * 0.8, R, L, D, v);
  blob(m, 0.2 * (rnd(2) - 0.5) * 2, 1.14, 0.18 * (rnd(3) - 0.5) * 2, R * 0.78, R * 0.66, R * 0.78, L, hi ? 1 : 0, v + 3);
  blob(m, -0.24, 0.86, 0.14, R * 0.62, R * 0.52, R * 0.62, L, hi ? 1 : 0, v + 5);
  if (hi) {
    blob(m, 0.25, 0.84, -0.18, R * 0.58, R * 0.5, R * 0.58, L, 1, v + 7);
    blob(m, 0.02, 0.74, 0.27, R * 0.5, R * 0.42, R * 0.5, L, 0, v + 9);
  }
}

/** A birch: a slim white trunk with dark marks across it, a few twigs, a narrow crown. Three variants, by `seed`. */
export function birch(m, { hi = true, seed = 0, leaf = 'leafB', bark = 'bark' } = {}) {
  const v = ((seed % 3) + 3) % 3;
  const lean = (hash2(v, 4, 2) - 0.5) * 0.08;
  m.cylinder(bark, 0, -0.05, 0, 0.03, 0.05, 0.5, hi ? 7 : 4, '#e2ded2', { smooth: hi });
  m.cylinder(bark, lean * 0.5, 0.45, 0, 0.022, 0.03, 0.55, hi ? 7 : 4, '#e2ded2', { smooth: hi });
  if (hi) {
    for (let k = 0; k < 8; k++) m.box('plain', -0.03 + lean * (k / 8), 0.12 + k * 0.11, -0.002, 0.03 + lean * (k / 8), 0.14 + k * 0.11 + 0.02 * (k % 3), 0.045, '#34312c', { skip: ['bottom'] });
    for (let b = 0; b < 3; b++) m.beam(bark, [lean, 0.7 + b * 0.1, 0], [lean + Math.cos(b * 2.3 + v) * 0.14, 0.95 + b * 0.08, Math.sin(b * 2.3 + v) * 0.14], 0.016, '#cfcabd');
  }
  const D = hi ? 2 : 1;
  blob(m, lean, 1.1, 0, 0.25, 0.34, 0.25, leaf, D, v, 0.3);
  blob(m, lean + 0.13, 0.84, 0.06, 0.2, 0.24, 0.2, leaf, hi ? 1 : 0, v + 2, 0.3);
  if (hi) blob(m, lean - 0.12, 0.8, -0.07, 0.18, 0.22, 0.18, leaf, 1, v + 4, 0.3);
}

/** A pine: tiers of drooping boughs up a straight trunk to a point. Four variants, by `seed`. */
export function pine(m, { hi = true, seed = 0, needle = 'needle', bark = 'bark' } = {}) {
  const v = ((seed % 4) + 4) % 4;
  const tiers = hi ? 5 : 3, sides = hi ? 10 : 6;
  m.cylinder(bark, 0, -0.05, 0, 0.035, 0.06, 0.5, hi ? 6 : 4, '#5a3e26', { smooth: hi });
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const r = (0.5 - f * 0.34) * (0.9 + 0.2 * hash2(v, t, 5));
    const y = 0.22 + f * (hi ? 0.95 : 0.88);
    m.bough(needle, 0, y, 0, r, hi ? 0.4 : 0.5, sides, '#e0e0e0', { seed: v * 7 + t, rot: t * 0.5 });
  }
  m.bough(needle, 0, 0.22 + (hi ? 0.95 : 0.88) + 0.12, 0, 0.1, 0.3, hi ? 8 : 5, '#e0e0e0', { seed: v });
}

// ———————————————————————————————————————————————— trees of limbs and leaf cards

const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

/** A limb: a tapered tube from a (radius r0) to b (radius r1), `sides` round, smooth-shaded. */
function limb(m, mat, a, b, r0, r1, sides, col) {
  const d = v3.norm(v3.sub(b, a));
  const u = v3.norm(v3.cross(d, Math.abs(d[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0])), w = v3.cross(d, u);
  const ring = (c, r, k) => { const t = (k / sides) * Math.PI * 2, o = v3.add(v3.mul(u, Math.cos(t)), v3.mul(w, Math.sin(t))); return [v3.add(c, v3.mul(o, r)), o]; };
  for (let k = 0; k < sides; k++) {
    const [a0, n0] = ring(a, r0, k), [a1, n1] = ring(a, r0, k + 1), [b1] = ring(b, r1, k + 1), [b0] = ring(b, r1, k);
    m.quad(mat, a0, a1, b1, b0, col, { normals: [n0, n1, n1, n0], uv: [[k / sides, 0], [(k + 1) / sides, 0], [(k + 1) / sides, 1], [k / sides, 1]] });
  }
}

/**
 * A leaf card: a square of the foliage atlas (textures/foliage.js) at `p`, `size` across, turned to face `face`
 * with its twig toward `up`; drawn both ways round, each side shaded as the crown is at that point (`normal`), and
 * coloured `col` (darker inside the crown and under it).
 */
function card(m, mat, p, face, up, size, normal, col, square) {
  const f = v3.norm(face);
  let e2 = v3.sub(up, v3.mul(f, v3.dot(up, f)));
  if (Math.hypot(...e2) < 1e-4) e2 = v3.cross(f, [1, 0, 0]);
  e2 = v3.norm(e2);
  const e1 = v3.cross(e2, f), h = size / 2;
  // The twig sits at the bottom middle of its square: the card hangs from p outward.
  const at = (x, y) => v3.add(p, v3.add(v3.mul(e1, x * h), v3.mul(e2, y * h + h * 0.75)));
  const A = at(-1, -1), B = at(1, -1), C = at(1, 1), D = at(-1, 1);
  const u0 = (square % 2) * 0.5 + 0.004, v0 = Math.floor(square / 2) * 0.5 + 0.004, u1 = u0 + 0.492, v1 = v0 + 0.492;
  // The atlas's rows run down; v up the card.
  const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
  const normals = [normal, normal, normal, normal];
  m.quad(mat, A, B, C, D, col, { uv, normals });
  m.quad(mat, D, C, B, A, col, { uv: [uv[3], uv[2], uv[1], uv[0]], normals });
}

/** The forms of the leafy trees: trunk height, the crown's middle and radii, limbs, how they spread, the bark. */
const FORMS = {
  // Wide and round, low limbs reaching out: an oak, a street maple grown big.
  oak: { trunk: 0.4, c: 0.9, R: [0.5, 0.42], limbs: 5, spread: 1.05, bark: ['#5f4a38', '#4e3d2f'], r: 0.046, fill: 1 },
  // Rounder and denser, limbs steeper: a maple, a linden.
  maple: { trunk: 0.36, c: 0.92, R: [0.46, 0.48], limbs: 4, spread: 0.75, bark: ['#6a5c4e', '#575046'], r: 0.042, fill: 1.15 },
  // A vase: limbs up and out from low on the trunk, the crown wide at the top: an elm, a honey locust.
  elm: { trunk: 0.34, c: 1.0, R: [0.52, 0.38], limbs: 4, spread: 0.55, bark: ['#655648', '#544739'], r: 0.044, fill: 0.9 },
  // Slim and upright, a leader to the top, pale bark marked dark, a narrow crown that hangs: a birch.
  birch: { trunk: 0.5, c: 0.98, R: [0.27, 0.48], limbs: 6, spread: 0.6, bark: ['#e4e0d6', '#2e2b28'], r: 0.026, fill: 0.6, leader: true, droop: 0.25 },
};

/**
 * A leafy tree of limbs and leaf cards, standing on y = 0, a little over a tile high (as `oak`, crown half a tile
 * across): a trunk that flares at the root, limbs that fork toward the crown's edge, and clusters of leaf cards at
 * their tips, with more about the crown's shell so it reads full. `form` is oak, maple, elm or birch; `leaf` the
 * material of the cards (textures/foliage.js `foliageTexture(GFX, 'broad')`, alpha-tested), `bark` of the wood.
 * `hi` false draws a far version: a few limbs and a third of the cards, bigger.
 */
export function leafy(m, { hi = true, seed = 0, form = 'oak', leaf = 'leafCard', bark = 'bark' } = {}) {
  const F = FORMS[form] ?? FORMS.oak, rnd = rngFor(seed, 29 + Object.keys(FORMS).indexOf(form));
  const [Rx, Ry] = [F.R[0] * (0.9 + 0.2 * rnd()), F.R[1] * (0.9 + 0.2 * rnd())];
  const center = [(rnd() - 0.5) * 0.06, F.c, (rnd() - 0.5) * 0.06];
  const sides = hi ? 7 : 4;
  // Where in the crown a point is: 0 at its middle, 1 at its shell.
  const shell = (p) => Math.hypot((p[0] - center[0]) / Rx, (p[1] - center[1]) / Ry, (p[2] - center[2]) / Rx);
  const onShell = (dir, k) => v3.add(center, [dir[0] * Rx * k, dir[1] * Ry * k, dir[2] * Rx * k]);
  const outward = (p) => v3.norm([(p[0] - center[0]) / (Rx * Rx), (p[1] - center[1]) / (Ry * Ry), (p[2] - center[2]) / (Rx * Rx)]);
  const bark0 = F.bark[0];
  const leaves = [];

  // The trunk: a flared foot, then up in a few bends to where the limbs part (to the top, for a leader).
  const top = [center[0] * 0.6, F.trunk, center[2] * 0.6];
  const r = F.r * (0.9 + 0.2 * rnd());
  limb(m, bark, [0, -0.06, 0], [0, 0.06, 0], r * 1.6, r * 1.1, sides, bark0);
  let prev = [0, 0.06, 0], pr = r * 1.1;
  const segs = hi ? 3 : 1;
  for (let k = 1; k <= segs; k++) {
    const t = k / segs, p = [top[0] * t + (rnd() - 0.5) * 0.02, 0.06 + (top[1] - 0.06) * t, top[2] * t + (rnd() - 0.5) * 0.02], rr = r * (1 - 0.25 * t);
    limb(m, bark, prev, p, pr, rr, sides, bark0);
    prev = p; pr = rr;
  }
  if (F.leader) {
    // A birch's leader, on up through the crown, and its dark marks.
    // It ends inside the crown, in leaves of its own: not a bare pole out of the top.
    const tip = v3.add(center, [0, Ry * 0.6, 0]);
    limb(m, bark, top, tip, r * 0.75, r * 0.2, sides, bark0);
    leaves.push(tip, v3.lerp(top, tip, 0.75), v3.lerp(top, tip, 0.5));
    if (hi) for (let k = 0; k < 9; k++) {
      const y = 0.08 + k * 0.1, a = rnd() * Math.PI * 2, rr = r * (1.02 - 0.3 * (y / F.trunk));
      if (y > F.trunk) break;
      const c = [Math.cos(a) * rr, y, Math.sin(a) * rr], d = [-Math.sin(a), 0, Math.cos(a)];
      m.quad(bark, v3.add(c, v3.mul(d, -0.012)), v3.add(c, v3.mul(d, 0.012)), v3.add(c, [d[0] * 0.012, 0.012, d[2] * 0.012]), v3.add(c, [-d[0] * 0.012, 0.012, -d[2] * 0.012]), F.bark[1], { normals: Array(4).fill([Math.cos(a), 0, Math.sin(a)]) });
    }
  }

  // The limbs: from the trunk's top (or up the leader) toward points on the crown's shell, forking as they go.
  const grow = (p, target, rr, depth) => {
    const mid = v3.add(v3.lerp(p, target, 0.5 + 0.15 * rnd()), [(rnd() - 0.5) * 0.05, (rnd() - 0.3) * 0.05, (rnd() - 0.5) * 0.05]);
    if (depth === 0) {
      limb(m, bark, p, target, rr, rr * 0.5, hi ? 4 : 3, bark0);
      leaves.push(target, v3.lerp(p, target, 0.55));
      if (F.leader) leaves.push(v3.lerp(p, target, 0.82));
      return;
    }
    limb(m, bark, p, mid, rr, rr * 0.72, Math.max(3, sides - (2 - depth)), bark0);
    const kids = hi ? 2 + (rnd() < 0.5 ? 1 : 0) : 2;
    for (let k = 0; k < kids; k++) {
      const dir = v3.norm(v3.add(v3.norm(v3.sub(target, center)), [(rnd() - 0.5) * 0.9, (rnd() - 0.4) * 0.6, (rnd() - 0.5) * 0.9]));
      const t2 = onShell(dir, 0.72 + 0.22 * rnd());
      grow(mid, F.droop ? v3.add(t2, [0, -F.droop * Ry * rnd(), 0]) : t2, rr * 0.68, depth - 1);
    }
  };
  const n = hi ? F.limbs : Math.max(3, F.limbs - 2);
  for (let k = 0; k < n; k++) {
    const az = (k / n) * Math.PI * 2 + rnd() * 0.8;
    const el = F.spread * (0.6 + 0.5 * rnd());
    const dir = [Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az)];
    const from = F.leader ? [top[0], top[1] + (Ry * 1.2) * (k / n) * 0.8, top[2]] : top;
    grow(from, onShell(dir, 0.8), r * 0.62, hi ? 2 : 1);
  }

  // The leaves: clusters at the limbs' tips and along them, and more about the shell where there are gaps.
  const extra = Math.round((hi ? 60 : 16) * F.fill);
  for (let k = 0; k < extra; k++) {
    const y = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - y * y);
    leaves.push(onShell([s * Math.cos(a), y * 0.9 + (F.droop ? -0.1 : 0.1), s * Math.sin(a)], 0.55 + 0.42 * rnd()));
  }
  const size = (hi ? 0.3 : 0.46) * Math.min(1.25, Math.max(0.75, Rx / 0.45));
  const per = hi ? 2 : 1;
  for (const p of leaves) {
    const out = outward(p), sh = Math.min(1, shell(p));
    // Shaded by where it is: dark inside and underneath, light at the top of the shell.
    const lit = (0.5 + 0.5 * sh) * (0.72 + 0.28 * ((p[1] - (center[1] - Ry)) / (2 * Ry)));
    const col = [lit, lit, lit];
    const normal = v3.norm(v3.add(out, [0, 0.35, 0]));
    for (let k = 0; k < per; k++) {
      const face = v3.norm(v3.add(out, [(rnd() - 0.5) * 1.6, (rnd() - 0.2) * 1.2, (rnd() - 0.5) * 1.6]));
      // The spray reaches out from its twig (a birch's hangs a little), so the twig's end is in leaves.
      const up = F.droop ? v3.norm(v3.add(out, [0, -0.3, 0])) : v3.norm(v3.add(out, [0, 0.6, 0]));
      card(m, leaf, v3.add(p, v3.mul(out, -size * 0.25)), face, up, size * (0.85 + 0.3 * rnd()), normal, col, Math.floor(rnd() * 4));
    }
  }
}

/**
 * A spruce (or fir) of needle cards: a straight trunk to the top and whorls of boughs round it, each a card of
 * needles (textures/foliage.js `'needle'`) reaching out and down a little, longest near the ground; a little over
 * a tile and a half high, half a tile across at the foot, as `pine`.
 */
export function spruce(m, { hi = true, seed = 0, needle = 'needleCard', bark = 'bark' } = {}) {
  const rnd = rngFor(seed, 41), H = 1.55 + rnd() * 0.15, R = 0.48 + rnd() * 0.08;
  limb(m, bark, [0, -0.05, 0], [0, H * 0.98, 0], 0.045, 0.006, hi ? 6 : 4, '#4e3a2a');
  const whorls = hi ? 11 : 6;
  for (let w = 0; w < whorls; w++) {
    const f = w / (whorls - 1), y = 0.16 + f * (H - 0.28);
    const len = R * Math.pow(1 - f * 0.92, 0.95) * (0.9 + 0.2 * rnd());
    const count = hi ? 6 : 4;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + w * 0.7 + rnd() * 0.4, out = [Math.cos(a), 0, Math.sin(a)];
      const droop = -0.25 - 0.2 * (1 - f);
      const dir = v3.norm([out[0], droop, out[2]]);
      const side = [-out[2], 0, out[0]];
      const lit = 0.55 + 0.45 * f;
      const normal = v3.norm([out[0], 0.7, out[2]]);
      // The bough lies flat-ish (its face up), the spray hanging out along it; a second card across it, on edge.
      const flat = v3.norm(v3.cross(dir, side));
      card(m, needle, [out[0] * 0.02, y, out[2] * 0.02], flat[1] < 0 ? v3.mul(flat, -1) : flat, dir, len, normal, [lit, lit, lit], Math.floor(rnd() * 4));
      if (hi) card(m, needle, [out[0] * 0.02, y - 0.01, out[2] * 0.02], side, dir, len * 0.8, normal, [lit * 0.9, lit * 0.9, lit * 0.9], Math.floor(rnd() * 4));
    }
  }
  // The leader: a small spray straight up.
  card(m, needle, [0, H - 0.18, 0], [1, 0, 0], [0, 1, 0], 0.22, [0, 1, 0], [1, 1, 1], 0);
  card(m, needle, [0, H - 0.18, 0], [0, 0, 1], [0, 1, 0], 0.22, [0, 1, 0], [1, 1, 1], 1);
}

const BLOOM = { spring: '#f6d8e8', summer: null, autumn: '#d8402a', winter: null };

/** A fruit tree from an orchard: a short trunk, a round crown, blossom in spring and fruit in autumn (`season`). Two variants, by `seed`. */
export function fruitTree(m, { hi = true, seed = 0, season = 'autumn', bark = 'bark' } = {}) {
  const v = ((seed % 2) + 2) % 2, col = BLOOM[season] ?? null;
  m.cylinder(bark, 0, -0.05, 0, 0.035, 0.055, 0.34, hi ? 6 : 4, '#5a3e26', { smooth: false });
  blob(m, 0, 0.5, 0, 0.3, 0.26, 0.3, v ? 'leafB' : 'leafA', hi ? 2 : 1, v + 9);
  if (hi && col) for (let k = 0; k < 9; k++) {
    const a = k * 2.4 + v, d = 0.18 + 0.1 * hash2(k, v, 4);
    m.sphere('plain', Math.cos(a) * d, 0.42 + 0.2 * hash2(k, 3, v), Math.sin(a) * d, 0.026, 0.026, 0.026, col, { detail: 0 });
  }
}

const GRAY = [['#7a756b', '#6a655d', '#8a8478'], ['#8a8478', '#756f66', '#7f796c'], ['#6a655d', '#5c5851', '#7a756b'], ['#7f796c', '#8c8676', '#6e695f']];
const DARK = [['#5e5a52', '#4e4a44', '#6c675e'], ['#6c675e', '#58544c', '#625c54'], ['#4e4a44', '#5e5a52', '#403c38'], ['#625c54', '#6c675e', '#54504a']];

/** An outcrop: a heap of knocked-about rock, a big one with smaller ones and chips against its foot. Four variants, by `seed`. */
export function boulder(m, { hi = true, seed = 0 } = {}) {
  const v = ((seed % 4) + 4) % 4, c = GRAY[v], D = hi ? 1 : 0;
  m.rock('rock', 0, 0.1, 0, 0.3 + 0.05 * v, 0.2 + 0.03 * v, 0.26 + 0.04 * v, c[0], { detail: D, rough: 0.3, seed: v, cuts: 5 });
  m.rock('rock', 0.27 + 0.03 * v, 0.04, 0.12, 0.15, 0.11, 0.13, c[1], { detail: 0, rough: 0.28, seed: v + 4, cuts: 3 });
  m.rock('rock', -0.2, 0.03, -0.24 + 0.04 * v, 0.12, 0.09, 0.11, c[2], { detail: 0, rough: 0.28, seed: v + 8, cuts: 3 });
  if (hi) m.rock('rock', 0.1, 0.01, 0.3, 0.06, 0.04, 0.05, c[0], { detail: 0, rough: 0.2, seed: v + 12, cuts: 2 });
}

/** Iron ore: dark rock with rust-brown seams and stains through it, and a few rusty lumps broken off. Four variants, by `seed`. */
export function ore(m, { hi = true, seed = 0 } = {}) {
  const v = ((seed % 4) + 4) % 4, c = DARK[v], D = hi ? 1 : 0;
  const seams = (dir, lump, grain) => {
    const s = Math.abs(Math.sin((dir[0] * 3.1 + dir[1] * 5.3 - dir[2] * 2.2 + v) * 2.6 + lump * 4));
    const w = Math.max(0, 1 - s * 7) * 0.9 + Math.max(0, grain - 0.72) * 2;
    return w > 0.08 ? { col: '#8a4a2e', w: Math.min(1, w) } : null;
  };
  const tint = (base) => (dir, lump, grain) => { const t = seams(dir, lump, grain); return t ? mixHex(base, t.col, t.w) : base; };
  m.rock('rock', 0, 0.1, 0, 0.27 + 0.04 * v, 0.2 + 0.03 * v, 0.23 + 0.04 * v, c[0], { detail: D, rough: 0.28, seed: v + 20, cuts: 5, lichen: 0.15, colorFn: tint(c[0]) });
  m.rock('rock', -0.24, 0.03, 0.1, 0.13, 0.1, 0.12, c[1], { detail: 0, rough: 0.26, seed: v + 24, cuts: 3, lichen: 0.15, colorFn: tint(c[1]) });
  for (let k = 0; k < (hi ? 3 : 1); k++) {
    const a = k * 2.3 + v, r = 0.2 + 0.03 * hash2(k, v, 5);
    m.rock('rock', Math.cos(a) * r, 0.05 + 0.03 * k, Math.sin(a) * r * 0.9, 0.07, 0.05, 0.06, k % 2 ? '#7a4630' : '#69392a', { detail: 0, rough: 0.18, seed: k + v * 5, cuts: 3, base: 0.3 });
  }
}

/** The trees by name, for a game that picks one. */
export const FLORA = Object.freeze({ palm, fanPalm, redwood, cypress, oak, birch, pine, fruitTree, boulder, ore, leafy, spruce });
