import { rngFor } from './buildings/common.js';

/**
 * Trees of the California coast, drawn into a `Mesher` standing on y = 0 at
 * the origin, a tile across: the date palm with its curved trunk and drooping
 * fronds, the tall thin fan palm of the boulevards, the coast redwood, and the
 * Italian cypress. `hi` draws the near version, false a cheaper one for far
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

/** The trees by name, for a game that picks one. */
export const FLORA = Object.freeze({ palm, fanPalm, redwood, cypress });
