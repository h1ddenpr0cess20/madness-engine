/**
 * Ground, painted the way the granite is: not as noise with a colour on it
 * but as what it is made of.
 *
 *   import { turfTexture } from 'madness-engine/textures/ground';
 *   const { map, bump } = turfTexture(GFX, { health: 0.8, clover: 0.4 });
 *
 * Turf is blades. Every blade is its own curved, tapering stroke, darker at
 * the root where the others shade it and lighter at the tip, with a pale rib
 * down its middle, lit on the side that faces the light; laid in four layers
 * over the thatch and soil, the tall ones last. Clover leaves come up between
 * them, dead straw lies in them, and where the lawn is worn the soil shows
 * through with its stones. A tile wraps in both directions, `TILE.turf` metres
 * across, and comes with a bump map in the same pixels (blades stand out of
 * the soil, tip highest).
 *
 * `paintTurf` gives the raw pixels (`{ size, color, height }`) with no canvas,
 * so it runs under node; `turfTexture` puts them on one and gives `{ map: null,
 * bump: null }` without a document, as the other painters do.
 */
import { fractal } from './painters.js';
import { Pixels, clamp, grain, hash, lerp, made, prng, ramp } from './pixel-kit.js';

/** How many metres one tile of each spans. */
export const TILE = Object.freeze({ turf: 1.5 });

const LIGHT = -2.2;

/** The greens of a lawn: bluegrass, rye, fescue, each a little off the others; and what dies back to. */
const GREENS = [
  { w: 0.3, root: [46, 78, 26], tip: [128, 176, 62] },
  { w: 0.26, root: [42, 72, 28], tip: [104, 158, 56] },
  { w: 0.2, root: [52, 84, 28], tip: [150, 192, 70] },
  { w: 0.14, root: [44, 74, 36], tip: [88, 142, 70] },
  { w: 0.1, root: [62, 84, 26], tip: [168, 190, 76] },
];
const STRAW = { root: [92, 78, 42], tip: [176, 156, 96] };

function pick(r, table) {
  let t = r * table.reduce((a, g) => a + g.w, 0);
  for (const g of table) { t -= g.w; if (t <= 0) return g; }
  return table[0];
}

/**
 * One blade: from its root, along a curve that bends as it goes, narrowing to
 * a point. Each step stamps a short disc whose brightness runs root to tip and
 * from the edge to the rib, and whose side toward the light is lit.
 */
function blade(s, x, y, heading, length, width, bend, { root, tip }, hRoot, hTip, rnd) {
  const steps = Math.max(6, Math.floor(length / 1.4));
  let a = heading;
  const lit = 0.88 + 0.24 * (0.5 + 0.5 * Math.cos(heading - LIGHT));
  const sway = (rnd() - 0.5) * 0.5;
  for (let n = 0; n <= steps; n++) {
    const t = n / steps;
    const w = width * (1 - 0.82 * t * t) + 0.35;
    a += bend / steps + sway / steps;
    x += Math.cos(a) * 1.4; y += Math.sin(a) * 1.4;
    const k = (0.72 + 0.66 * t) * lit;
    const h = hRoot + (hTip - hRoot) * t;
    const reach = Math.ceil(w) + 1;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    for (let j = -reach; j <= reach; j++) {
      for (let i = -reach; i <= reach; i++) {
        const dx = x0 + i + 0.5 - x, dy = y0 + j + 0.5 - y;
        const d = Math.hypot(dx, dy);
        if (d > w) continue;
        // Across the blade: darker at its edges, a pale rib down the middle.
        const rib = 1 - clamp(d / w);
        const shade = k * (0.8 + 0.34 * rib * rib + (dx * Math.cos(LIGHT) + dy * Math.sin(LIGHT)) / w * 0.1);
        const cover = clamp((w - d) + 0.4);
        const rgb = [(root[0] + (tip[0] - root[0]) * t) * shade, (root[1] + (tip[1] - root[1]) * t) * shade, (root[2] + (tip[2] - root[2]) * t) * shade];
        const idx = s.at(x0 + i, y0 + j);
        if (h < s.h[idx] - 0.2) continue;
        s.r[idx] += (rgb[0] - s.r[idx]) * cover; s.g[idx] += (rgb[1] - s.g[idx]) * cover; s.b[idx] += (rgb[2] - s.b[idx]) * cover;
        s.h[idx] = Math.max(s.h[idx], h * cover + s.h[idx] * (1 - cover));
      }
    }
  }
}

/** A clover leaf: three round leaflets round a point, each with its pale chevron. */
function clover(s, cx, cy, size, rnd) {
  const turn = rnd() * 6.28;
  for (let k = 0; k < 3; k++) {
    const a = turn + (k * 6.2832) / 3;
    const x = cx + Math.cos(a) * size * 0.62, y = cy + Math.sin(a) * size * 0.62;
    const r = size * (0.62 + rnd() * 0.12);
    const green = 0.8 + rnd() * 0.35;
    for (let j = -Math.ceil(r + 1); j <= Math.ceil(r + 1); j++) {
      for (let i = -Math.ceil(r + 1); i <= Math.ceil(r + 1); i++) {
        const px = Math.floor(x) + i, py = Math.floor(y) + j;
        const dx = px + 0.5 - x, dy = py + 0.5 - y;
        const d = Math.hypot(dx, dy) / r;
        if (d > 1) continue;
        // A pale V across each leaflet, pointing to the stem.
        const along = (dx * Math.cos(a) + dy * Math.sin(a)) / r, across = (-dx * Math.sin(a) + dy * Math.cos(a)) / r;
        const chevron = Math.abs(Math.abs(across) * 0.8 - (0.15 - along * 0.5)) < 0.07 ? 1.28 : 1;
        const edge = d > 0.8 ? 1 - (d - 0.8) * 2.4 : 1;
        const k2 = green * chevron * edge * (0.72 + 0.34 * (1 - d * d) + 0.12 * Math.cos(Math.atan2(dy, dx) - LIGHT));
        s.put(px, py, [62 * k2, 118 * k2, 48 * k2], 0.62 + 0.2 * (1 - d * d), clamp((1 - d) * r + 0.5));
      }
    }
  }
}

/**
 * Turf, as pixels.
 * @param options
 *   - `size`: pixels a side (2048)
 *   - `health`: 0 a thin, sun-struck lawn, 1 lush and dense (0.75)
 *   - `length`: 0 a close-mown lawn, 1 long grass (0.4)
 *   - `clover`: how much clover is in it, 0 to 1 (0.25)
 *   - `dry`: dead straw and bare soil, 0 to 1 (0: a patch of bare soil repeats with the tile)
 *   - `seed`
 */
export function paintTurf({ size = 2048, health = 0.75, length = 0.4, clover: cl = 0.25, dry = 0, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 4513 + 7);
  const S = size / 2048;
  const patch = fractal(seed * 17 + 301, 4, 4), tone = fractal(seed * 17 + 303, 6, 3), fine = fractal(seed * 17 + 307, 40, 2);

  // The thatch and the soil under it: dark, damp, with a little green in it.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = y * size + x;
      const bare = ramp(0.7 - dry * 0.14, 0.8 - dry * 0.12, patch(u, v)) * clamp(dry * 8);
      const f = 0.85 + (fine(u, v) - 0.5) * 0.5 + (hash(x, y, 5) - 0.5) * 0.22;
      const soil = [96 * f, 76 * f, 50 * f], thatch = [56 * f, 70 * f, 28 * f];
      s.r[i] = lerp(thatch[0], soil[0], bare); s.g[i] = lerp(thatch[1], soil[1], bare); s.b[i] = lerp(thatch[2], soil[2], bare);
      s.h[i] = 0.18 + bare * 0.02 + (fine(u, v) - 0.5) * 0.06;
    }
  }
  // Stones in the bare soil.
  for (let n = 0, count = Math.floor(size * size * 0.00004 * (0.3 + dry * 2)); n < count; n++) {
    const x = rnd() * size, y = rnd() * size;
    if (dry <= 0 || patch(x / size, y / size) < 0.66 - dry * 0.12) continue;
    const g = 100 + rnd() * 70;
    grain(s, x, y, (2.2 + rnd() * 4) * Math.max(S, 0.6), rnd, { rgb: [g, g * 0.95, g * 0.85], top: 0.2, base: 0.2, elong: 1 + rnd() * 0.4 });
  }

  // The blades: four layers, the short and dense first, the long and few last.
  const layers = [
    { count: 0.42, len: [30, 52], w: [1.5, 2.1], bend: 0.55, h: [0.3, 0.62] },
    { count: 0.3, len: [44, 76], w: [1.7, 2.4], bend: 0.7, h: [0.34, 0.74] },
    { count: 0.18, len: [60, 100], w: [1.8, 2.6], bend: 0.85, h: [0.4, 0.84] },
    { count: 0.07, len: [80, 130], w: [1.9, 2.7], bend: 1.0, h: [0.46, 0.94] },
  ];
  const grown = (0.55 + health * 0.7) * (0.5 + length * 0.9);
  for (const L of layers) {
    const blades = Math.floor((size * size * L.count * 0.0062 * (0.5 + health * 0.75)));
    for (let n = 0; n < blades; n++) {
      const x = rnd() * size, y = rnd() * size;
      const u = x / size, v = y / size;
      // Where the lawn is worn through, fewer come up.
      const bare = ramp(0.7 - dry * 0.14, 0.8 - dry * 0.12, patch(u, v)) * clamp(dry * 8);
      if (rnd() < bare * 0.9) continue;
      const dead = rnd() < dry * 0.5 * (0.4 + bare);
      const g = dead ? STRAW : pick(rnd(), GREENS);
      const mow = 0.9 + (tone(u, v) - 0.5) * 0.5;
      const len = (L.len[0] + rnd() * (L.len[1] - L.len[0])) * grown * Math.max(S, 0.6);
      const w = (L.w[0] + rnd() * (L.w[1] - L.w[0])) * Math.max(S, 0.65);
      const bend = (rnd() < 0.5 ? -1 : 1) * L.bend * (0.4 + rnd() * 0.8);
      const scaled = { root: g.root.map((c) => c * mow), tip: g.tip.map((c) => c * mow) };
      blade(s, x, y, rnd() * 6.2832, len, w, bend, scaled, L.h[0], L.h[1], rnd);
    }
  }

  // Clover, between the blades and a little over them.
  for (let n = 0, count = Math.floor(size * size * 0.00009 * cl); n < count; n++) clover(s, rnd() * size, rnd() * size, (5 + rnd() * 5) * Math.max(S, 0.65), rnd);
  return s.bake();
}

/** A turf tile's maps, painted once for each set of options (see `paintTurf`). */
export const turfTexture = (GFX, options = {}) => made(GFX, 'turf', paintTurf, options);
