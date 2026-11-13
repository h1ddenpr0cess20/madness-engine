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
 * Gravel is stones laid on stones (angular crushed rock for a railway's
 * ballast, rounded river gravel for a roof or a path) in three sizes, dark in the
 * gaps between, each with the shadow it throws; pavers are fired bricks in a
 * running bond, every one its own colour and speckle with the kiln's dark flash
 * at its edges, a bevel, a chip, and the sand between them with grass seed in
 * it.
 *
 * `paintTurf` gives the raw pixels (`{ size, color, height }`) with no canvas,
 * so it runs under node; `turfTexture` puts them on one and gives `{ map: null,
 * bump: null }` without a document, as the other painters do.
 */
import { fractal } from './painters.js';
import { Pixels, clamp, grain, hash, lerp, made, pickStone, prng, ramp } from './pixel-kit.js';

/** How many metres one tile of each spans. */
export const TILE = Object.freeze({ turf: 1.5, gravel: 2, pavers: 1.6 });

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

const GRAVELS = {
  ballast: { cells: [30, 19, 11.5], radii: [[9, 17], [6, 11], [3.4, 6.6]], dense: 1, round: 0.1, tones: [[0.4, [118, 116, 112]], [0.26, [78, 78, 82]], [0.14, [146, 140, 130]], [0.1, [56, 56, 60]], [0.1, [170, 166, 158]]] },
  roof: { cells: [20, 12, 7], radii: [[4.4, 8.4], [3, 5.6], [1.8, 3.4]], round: 0.92, tones: [[0.34, [168, 164, 156]], [0.26, [136, 132, 126]], [0.2, [196, 190, 178]], [0.12, [104, 100, 98]], [0.08, [176, 150, 128]]] },
  path: { cells: [15, 9, 5.5], radii: [[3.4, 6.2], [2.2, 4.2], [1.3, 2.5]], round: 0.85, tones: [[0.3, [186, 170, 140]], [0.26, [214, 204, 184]], [0.2, [150, 140, 126]], [0.14, [172, 124, 98]], [0.1, [120, 118, 114]]] },
};

/**
 * Gravel, as pixels.
 * @param options `size` (2048); `kind`: 'ballast' (angular railway stone, fist-sized), 'roof' (rounded river gravel over tar) or 'path' (pea gravel); `seed`
 */
export function paintGravel({ size = 2048, kind = 'roof', seed = 1 } = {}) {
  const G = GRAVELS[kind] ?? GRAVELS.roof;
  const s = new Pixels(size);
  const rnd = prng(seed * 3989 + 5);
  const S = size / 2048;
  const tone = fractal(seed * 19 + 401, 5, 3);
  // What lies under: the dark of the gaps, a little lighter where the stones are thin.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x, f = 0.7 + (tone(x / size, y / size) - 0.5) * 0.3 + (hash(x, y, 6) - 0.5) * 0.2;
      s.r[i] = 46 * f; s.g[i] = 45 * f; s.b[i] = 44 * f; s.h[i] = 0.12;
    }
  }
  const table = G.tones.map(([w, rgb]) => ({ w, rgb }));
  for (let L = 2; L >= 0; L--) {
    const cell = Math.max(2.6, G.cells[L] * S), n = Math.floor(size / cell), step = size / n;
    const [lo, hi] = G.radii[L];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (rnd() > (G.dense ?? 0.93)) continue;
        const cx = (i + 0.5 + (rnd() - 0.5) * 0.9) * step, cy = (j + 0.5 + (rnd() - 0.5) * 0.9) * step;
        const rgb = pickStone(rnd(), table);
        const b = 0.78 + rnd() * 0.4 + (tone(cx / size, cy / size) - 0.5) * 0.3;
        // Dust on the stones that lie low, and the oldest weathered dark.
        grain(s, cx, cy, (lo + rnd() * (hi - lo)) * Math.max(S, 0.6), rnd, { rgb: [rgb[0] * b, rgb[1] * b, rgb[2] * b * 0.98], top: 0.3 + L * 0.12, base: 0.16 + (2 - L) * 0.1, elong: 1 + rnd() * 0.45, angular: lerp(0.8, 0.08, G.round) });
      }
    }
  }
  return s.bake();
}

const BRICKS = {
  brick: [[0.3, [150, 66, 48]], [0.24, [168, 80, 56]], [0.18, [128, 54, 42]], [0.14, [184, 100, 70]], [0.1, [104, 48, 40]], [0.04, [196, 150, 112]]],
  grey: [[0.4, [150, 150, 148]], [0.3, [128, 128, 128]], [0.2, [170, 168, 162]], [0.1, [104, 104, 106]]],
  tan: [[0.4, [190, 164, 124]], [0.3, [172, 142, 104]], [0.2, [208, 186, 150]], [0.1, [150, 118, 90]]],
};

/**
 * Pavers, as pixels: fired bricks (or concrete blocks) in a running bond, every one its own.
 * @param options `size` (2048); `kind`: 'brick', 'grey' or 'tan'; `wear` (0 to 1, how much grime and moss is in the joints, 0.4); `seed`
 *   One tile is 8 bricks across (200 mm by 100 mm, with a joint of 5 mm) and 16 rows: `TILE.pavers` metres.
 */
export function paintPavers({ size = 2048, kind = 'brick', wear = 0.4, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 2711 + 3);
  const across = 8, rows = 16;
  const bw = size / across, bh = size / rows;
  const joint = Math.max(2, Math.round(size * 0.0035));
  const table = (BRICKS[kind] ?? BRICKS.brick).map(([w, rgb]) => ({ w, rgb }));
  const flash = fractal(seed * 23 + 501, 8, 3), grime = fractal(seed * 23 + 503, 6, 4);
  // The joints: sand, with the dirt of years in it and a little green.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x, f = 0.82 + (hash(x, y, 9) - 0.5) * 0.4 + (grime(x / size, y / size) - 0.5) * 0.3;
      const dirty = ramp(0.4, 0.8, grime(x / size, y / size)) * wear;
      s.r[i] = (156 - dirty * 62) * f; s.g[i] = (142 - dirty * 48 + (dirty > 0.5 ? 10 : 0)) * f; s.b[i] = (118 - dirty * 50) * f; s.h[i] = 0.12;
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = -1; c <= across; c++) {
      const x0 = c * bw + (r % 2 ? bw / 2 : 0), y0 = r * bh;
      const rgb = pickStone(rnd(), table);
      const b = 0.86 + rnd() * 0.28;
      const tiltX = (rnd() - 0.5) * 0.14, tiltY = (rnd() - 0.5) * 0.14;
      const dark = rnd() < 0.18;
      const chipX = rnd() < 0.12 ? rnd() * bw : -1, chipY = rnd() * bh;
      for (let y = Math.floor(y0 + joint / 2); y < Math.ceil(y0 + bh - joint / 2); y++) {
        for (let x = Math.floor(x0 + joint / 2); x < Math.ceil(x0 + bw - joint / 2); x++) {
          const u = (x - x0) / bw, v = (y - y0) / bh;
          // How far inside the brick's edge: the arris is rounded a little, the face a touch domed.
          const e = Math.min(x - x0 - joint / 2, x0 + bw - joint / 2 - x, y - y0 - joint / 2, y0 + bh - joint / 2 - y);
          const edge = ramp(0, 5, e);
          const fl = ramp(0.5, 0.75, flash((x / size + 0.37 * r) % 1, (y / size + 0.21 * c) % 1));
          let k = b * (1 + (u - 0.5) * tiltX * 2 + (v - 0.5) * tiltY * 2) * (0.7 + 0.3 * edge) * (1 - fl * (dark ? 0.35 : 0.18));
          // The bevel catches the light on the top and left, and loses it on the bottom and right.
          if (e < 5) k *= 1 + (((x - x0) / bw < 0.5 ? 0.22 : -0.2) + ((y - y0) / bh < 0.5 ? 0.16 : -0.16)) * (1 - e / 5) * 0.8;
          const sp = hash(x, y, 13);
          k *= sp > 0.97 ? 1.28 : sp < 0.04 ? 0.7 : 0.95 + sp * 0.1;
          let h = 0.62 + 0.1 * edge + tiltX * (u - 0.5) + tiltY * (v - 0.5);
          if (chipX >= 0 && Math.hypot((x - x0) - chipX, (y - y0) - chipY) < bh * 0.12) { k *= 0.78; h -= 0.2; }
          const idx = s.at(x, y);
          s.r[idx] = rgb[0] * k; s.g[idx] = rgb[1] * k; s.b[idx] = rgb[2] * k; s.h[idx] = h;
        }
      }
    }
  }
  // Sand grains in the joints, and dirt along the foot of each brick.
  for (let n = 0, count = Math.floor(size * size * 0.012); n < count; n++) {
    const x = rnd() * size, y = rnd() * size;
    const i = s.at(Math.floor(x), Math.floor(y));
    if (s.h[i] > 0.2) continue;
    const g = 120 + rnd() * 90;
    grain(s, x, y, 1 + rnd() * 1.2, rnd, { rgb: [g, g * 0.92, g * 0.76], top: 0.1, base: 0.14, shadow: 0.3 });
  }
  return s.bake();
}

/** A gravel tile's maps, painted once for each set of options (see `paintGravel`). */
export const gravelTexture = (GFX, options = {}) => made(GFX, 'gravel', paintGravel, options);

/** A pavers tile's maps, painted once for each set of options (see `paintPavers`). */
export const paversTexture = (GFX, options = {}) => made(GFX, 'pavers', paintPavers, options);
