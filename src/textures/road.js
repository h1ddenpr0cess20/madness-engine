/**
 * Asphalt and concrete, painted the way the granite is: not as noise with a
 * colour on it but as what the material is made of.
 *
 *   import { asphaltTexture, concreteTexture } from 'madness-engine/textures/road';
 *   const { map, bump } = asphaltTexture(GFX, { age: 0.5, cracks: 0.4 });
 *
 * Asphalt is crushed stone in a bitumen binder. Here every stone is its own
 * grain (an irregular, faceted, domed particle of grey granite, dark diorite,
 * tan limestone, pink feldspar, white quartz or black basalt, three sizes of
 * them laid coarse over fine), lying in a dark mastic of binder and sand with
 * pits where the mix did not fill. The binder wears off the stones that
 * traffic runs on, so a worn road is lighter and the stones show through; a
 * fresh one is black and the stones are coated. Cracks are real cracks, a thin
 * dark line, or the tar band a crew laid over one; a patch is a different mix
 * with a sealed edge; oil drips darken it.
 *
 * Concrete is cement paste with sand in it: a mottled warm grey, the fine
 * sand grains standing out of it, the air voids (bugholes) the pour trapped,
 * a few pebbles of aggregate where the paste has worn off them, the fine
 * ridges of a broom drawn across it, a control joint cut round each slab with
 * the dirt of years in it, and a hairline crack from a corner.
 *
 * Every field is periodic and every grain wraps, so a tile is seamless in both
 * directions. A texture is one tile across: `TILE.asphalt` and `TILE.concrete`
 * say how many metres. The maps are painted at 2048 by default, about a
 * millimetre a pixel for asphalt, so a stone is ten pixels across and has its own
 * edge, light side, shadow side and the shadow it throws on the binder; and each comes with a bump map (the stones stand proud of the
 * binder, the pits and cracks sink, the joints are cut) in the same pixels.
 *
 * `paintAsphalt` and `paintConcrete` return the raw pixels (`{ size, color,
 * height }`, RGBA and one grey byte a pixel) with no canvas, so they run under
 * node; the `*Texture` functions put them on a canvas and make the textures,
 * and give `{ map: null, bump: null }` without a document, as the other
 * painters do.
 */
import { fractal } from './painters.js';
import { Pixels, clamp, grain, hash, lerp, made, pickStone, prng, ramp, wander } from './pixel-kit.js';

/** How many metres one tile of each spans, for laying it on a street. */
export const TILE = Object.freeze({ asphalt: 2, concrete: 3 });

const ASPHALT_STONES = [
  { w: 0.4, rgb: [128, 127, 124] }, // grey granite
  { w: 0.26, rgb: [78, 78, 81] }, //  dark diorite
  { w: 0.09, rgb: [140, 131, 117] }, // tan limestone
  { w: 0.06, rgb: [138, 122, 118] }, // pink feldspar
  { w: 0.09, rgb: [188, 187, 182] }, // white quartz
  { w: 0.08, rgb: [50, 50, 55] }, // black basalt
  { w: 0.02, rgb: [112, 96, 84] }, // rusty gravel
];

/**
 * Asphalt, as pixels.
 * @param options
 *   - `size`: pixels a side (2048)
 *   - `age`: 0 fresh and black, 1 grey and worn to its stones (0.5)
 *   - `cracks`: how much it has cracked, 0 to 1: hairlines, and tar bands laid over the worst (0.2)
 *   - `patches`: how many repairs, 0 to 1 (0: a patch is a square, and a tile repeats it)
 *   - `stains`: oil and rubber, 0 to 1 (0.3)
 *   - `seed`: a different road for each (1)
 */
export function paintAsphalt({ size = 2048, age = 0.5, cracks = 0.2, patches = 0, stains = 0.3, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 7919 + 13);
  const S = size / 2048;
  const wearField = fractal(seed * 11 + 101, 3, 4), cloud = fractal(seed * 11 + 103, 9, 3), mid = fractal(seed * 11 + 107, 36, 2), oil = fractal(seed * 11 + 109, 4, 3);

  // Where traffic has worn the binder off, and where a repair was laid: low-frequency fields, sampled everywhere.
  const worn = new Float32Array(size * size);
  // Patches: rounded rectangles laid wherever the draw says, over the tile and across its edge.
  const patch = new Uint8Array(size * size);
  const patchRects = [];
  for (let n = 0, count = Math.round(patches * 5); n < count; n++) {
    patchRects.push({ x: rnd() * size, y: rnd() * size, w: (140 + rnd() * 420) * S, h: (110 + rnd() * 300) * S, r: 10 * S });
  }
  const inPatch = (x, y) => {
    for (const p of patchRects) {
      let dx = Math.abs(((x - p.x + size * 1.5) % size) - size / 2), dy = Math.abs(((y - p.y + size * 1.5) % size) - size / 2);
      if (dx < p.w / 2 && dy < p.h / 2) return 1 + (dx > p.w / 2 - 7 * S || dy > p.h / 2 - 7 * S ? 1 : 0);
    }
    return 0;
  };

  // The mastic: binder with sand in it, darker where it is fresh, greyer where the sun has had it.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = y * size + x;
      const w = clamp(ramp(0.25, 0.75, wearField(u, v)) * 0.4 + age * 0.62 - 0.1 + (mid(u, v) - 0.5) * 0.3);
      worn[i] = w;
      const p = inPatch(x, y);
      patch[i] = p;
      const sand = hash(x, y, 7) * 0.5 + hash(x >> 1, y >> 1, 8) * 0.5;
      const tone = lerp(30, 66, w) * (0.94 + (cloud(u, v) - 0.5) * 0.2 + (sand - 0.5) * 0.26) * (p ? 0.8 : 1);
      s.r[i] = tone * 1.02; s.g[i] = tone * 0.99; s.b[i] = tone * 1.04;
      s.h[i] = 0.34 + (sand - 0.5) * 0.08 + (mid(u, v) - 0.5) * 0.04;
    }
  }

  // The sand in it: tiny bright and dark particles, thousands to a hand's breadth.
  const sands = Math.floor(size * size * 0.045);
  for (let n = 0; n < sands; n++) {
    const x = rnd() * size, y = rnd() * size;
    const bright = rnd();
    const rgb = bright > 0.55 ? [138 + rnd() * 46, 136 + rnd() * 44, 130 + rnd() * 44] : [36, 35, 38];
    grain(s, x, y, (0.85 + rnd() * 0.8) * Math.max(S, 0.6), rnd, { rgb, top: 0.16, base: 0.4, speck: 0.05, shadow: 0.3 });
  }

  // The stones, three sizes, the fine laid first so the coarse sit on them.
  const layers = [
    { cell: 8.5, rLo: 1.7, rHi: 3.4, top: 0.22, keep: 0.82, elong: 1.25 },
    { cell: 14.5, rLo: 3.0, rHi: 6.0, top: 0.32, keep: 0.8, elong: 1.35 },
    { cell: 26, rLo: 5.2, rHi: 10.5, top: 0.42, keep: 0.7, elong: 1.45 },
  ];
  for (const L of layers) {
    const cell = Math.max(2.6, L.cell * S), n = Math.floor(size / cell);
    const step = size / n;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (rnd() > L.keep) continue;
        const cx = (i + 0.5 + (rnd() - 0.5) * 0.85) * step, cy = (j + 0.5 + (rnd() - 0.5) * 0.85) * step;
        const k = (Math.floor(cy) % size) * size + (Math.floor(cx) % size);
        const w = worn[k], p = patch[k];
        // Fresh binder coats the stones; worn, they show. A repair is a fresh mix, a seam is all binder.
        const film = clamp(1.05 - w * 1.35 + (rnd() - 0.5) * 0.5 + (p ? 0.35 : 0));
        const stone = pickStone(rnd(), ASPHALT_STONES);
        const bright = 0.82 + rnd() * 0.34 + w * 0.1;
        const mastic = Math.max(22, s.r[k]);
        const coated = [lerp(stone[0] * bright, mastic * 1.1, film * 0.82), lerp(stone[1] * bright, mastic, film * 0.82), lerp(stone[2] * bright, mastic * 1.06, film * 0.82)];
        grain(s, cx, cy, (L.rLo + rnd() * (L.rHi - L.rLo)) * Math.max(S, 0.7), rnd, { rgb: coated, top: L.top * (1 - film * 0.35), base: 0.4, elong: 1 + rnd() * (L.elong - 1) });
      }
    }
  }

  // Voids: where the mix did not close. Small, black, sunk, a little lip round each.
  const voids = Math.floor(size * size * 0.0004);
  for (let n = 0; n < voids; n++) {
    const x = Math.floor(rnd() * size), y = Math.floor(rnd() * size), r = (1.4 + rnd() * rnd() * 4.2) * Math.max(S, 0.7);
    for (let j = -Math.ceil(r + 1); j <= Math.ceil(r + 1); j++) {
      for (let i = -Math.ceil(r + 1); i <= Math.ceil(r + 1); i++) {
        const d = Math.hypot(i, j) / r;
        if (d > 1.3) continue;
        if (d <= 1) { const k = s.at(x + i, y + j); s.r[k] *= 0.32; s.g[k] *= 0.32; s.b[k] *= 0.34; s.h[k] = 0.08 + d * 0.12; }
        else { const k = s.at(x + i, y + j); s.h[k] = Math.min(1, s.h[k] + (1.3 - d) * 0.25); }
      }
    }
  }

  // Stains: oil dripped where the engines drip, rubber and dust worn into the tracks.
  if (stains > 0) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size, i = y * size + x;
        const o = ramp(0.6 - stains * 0.1, 0.72 - stains * 0.1, oil(u, v));
        if (o > 0) { const k = 1 - o * 0.5 * stains * 1.6; s.r[i] *= k; s.g[i] *= k; s.b[i] *= k * 1.02; s.h[i] -= o * 0.03; }
      }
    }
  }

  // Cracks, and the seam of a repair: a hairline cracks the stones through; a tar band is laid over it, wider, smooth and glossy black.
  const crackMask = new Float32Array(size * size), seal = new Float32Array(size * size);
  const nCracks = Math.round(cracks * 5);
  for (let n = 0; n < nCracks; n++) {
    const x = rnd() * size, y = rnd() * size, a = rnd() * 6.28, len = (500 + rnd() * 900) * S;
    wander(crackMask, size, rnd, x, y, a, len, (1.1 + rnd() * 0.9) * Math.max(S, 0.6), 1, 2);
    if (rnd() < 0.5 + cracks * 0.3) wander(seal, size, rnd, x, y, a, len, (3.6 + rnd() * 2.2) * Math.max(S, 0.6), 1, 0);
  }
  for (let i = 0; i < size * size; i++) {
    if (seal[i] > 0) {
      const t = ramp(0, 0.45, seal[i]);
      s.r[i] = lerp(s.r[i], 24, t); s.g[i] = lerp(s.g[i], 24, t); s.b[i] = lerp(s.b[i], 27, t);
      s.h[i] = lerp(s.h[i], 0.46 - (1 - seal[i]) * 0.03, t);
    }
    if (crackMask[i] > 0) {
      const t = ramp(0, 0.35, crackMask[i]);
      s.r[i] *= 1 - t * 0.82; s.g[i] *= 1 - t * 0.82; s.b[i] *= 1 - t * 0.8;
      s.h[i] = lerp(s.h[i], 0.02, t);
    }
    // A patch's edge: a sealed line round it, a hair proud.
    if (patch[i] === 2) { s.r[i] = lerp(s.r[i], 25, 0.8); s.g[i] = lerp(s.g[i], 25, 0.8); s.b[i] = lerp(s.b[i], 28, 0.8); s.h[i] = 0.5; }
  }
  return s.bake();
}

const CONCRETE_PEBBLES = [
  { w: 0.3, rgb: [168, 150, 124] }, { w: 0.25, rgb: [134, 133, 130] }, { w: 0.15, rgb: [206, 202, 192] },
  { w: 0.12, rgb: [150, 122, 108] }, { w: 0.1, rgb: [96, 98, 100] }, { w: 0.08, rgb: [182, 170, 140] },
];

/**
 * Concrete, as pixels.
 * @param options
 *   - `size`: pixels a side (2048)
 *   - `finish`: 'broom' (fine ridges drawn across it, as a pavement is), 'trowel' (smooth, a floor) or 'aged' (broom, weathered, the pebbles showing)
 *   - `slabs`: slabs a side of a tile, each with its control joint (1)
 *   - `wear`: how far the paste has worn off the aggregate, 0 to 1 (0.3; 'aged' wants more)
 *   - `cracks`: hairline cracks, 0 to 1 (0.3)
 *   - `stains`: oil, rust and weather, 0 to 1 (0.35)
 *   - `seed`
 */
export function paintConcrete({ size = 2048, finish = 'broom', slabs = 1, wear = finish === 'aged' ? 0.6 : 0.3, cracks = 0.3, stains = 0.35, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 6007 + 29);
  const S = size / 2048;
  const cloud = fractal(seed * 13 + 201, 3, 5), mottle = fractal(seed * 13 + 203, 14, 3), pour = fractal(seed * 13 + 207, 5, 4), dirt = fractal(seed * 13 + 211, 7, 3);
  const slab = size / slabs;
  const broom = finish !== 'trowel';

  // The paste: warm grey, clouded by the water in the mix and by the way it was floated.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = y * size + x;
      const fine = hash(x, y, 3) * 0.55 + hash(x >> 1, y >> 1, 4) * 0.45;
      const k = 0.92 + (cloud(u, v) - 0.5) * 0.16 + (mottle(u, v) - 0.5) * 0.09 + (fine - 0.5) * 0.14;
      // Brooming: ridges across the slab, a pixel or three apart, uneven in their depth.
      let ridge = 0;
      if (broom) {
        const wob = (pour(u * 1.0, v * 1.0) - 0.5) * 4.0;
        ridge = Math.sin((x + wob) * (6.28 / (3.1 * Math.max(S, 0.7)))) * (0.4 + hash(x >> 2, y >> 5, 5) * 0.6);
      }
      s.r[i] = 176 * k * (1 + ridge * 0.07); s.g[i] = 173 * k * (1 + ridge * 0.07); s.b[i] = 165 * k * (1 + ridge * 0.075);
      s.h[i] = 0.5 + (fine - 0.5) * 0.1 + ridge * 0.13 + (pour(u, v) - 0.5) * 0.06;
    }
  }

  // Sand: grains of fine aggregate standing out of the paste, a few pixels each, light and dark.
  const sands = Math.floor(size * size * (0.05 + wear * 0.03));
  for (let n = 0; n < sands; n++) {
    const x = rnd() * size, y = rnd() * size, t = rnd();
    const rgb = t > 0.5 ? [196 + rnd() * 38, 190 + rnd() * 36, 176 + rnd() * 34] : t > 0.15 ? [140 + rnd() * 26, 138 + rnd() * 24, 132 + rnd() * 24] : [90, 88, 86];
    grain(s, x, y, (0.9 + rnd() * 1.1) * Math.max(S, 0.6), rnd, { rgb, top: 0.14, base: s.h[s.at(Math.floor(x), Math.floor(y))], speck: 0.04, shadow: 0.35 });
  }

  // Pebbles: where the paste has worn off the coarse aggregate, round stones, each its own colour, ringed by the paste it sits in.
  const pebbles = Math.floor(size * size * 0.00018 * (0.25 + wear * 2.6));
  for (let n = 0; n < pebbles; n++) {
    const x = rnd() * size, y = rnd() * size;
    const ex = ramp(0.38, 0.7, mottle(x / size, y / size) * 0.5 + dirt(x / size, y / size) * 0.5 + wear * 0.35);
    if (rnd() > ex) continue;
    const rgb = pickStone(rnd(), CONCRETE_PEBBLES);
    const b = 0.84 + rnd() * 0.3;
    grain(s, x, y, (2.1 + rnd() * rnd() * 4.2) * Math.max(S, 0.7), rnd, { rgb: [rgb[0] * b, rgb[1] * b, rgb[2] * b], top: 0.26, base: 0.46, elong: 1 + rnd() * 0.28, speck: 0.08 });
  }

  // Bugholes: air the pour trapped against the form, round, small, sunk, with a paler lip.
  const holes = Math.floor(size * size * 0.0007 * (0.6 + wear));
  for (let n = 0; n < holes; n++) {
    const x = Math.floor(rnd() * size), y = Math.floor(rnd() * size), r = (0.7 + rnd() * rnd() * 3.0) * Math.max(S, 0.7);
    for (let j = -Math.ceil(r + 2); j <= Math.ceil(r + 2); j++) {
      for (let i = -Math.ceil(r + 2); i <= Math.ceil(r + 2); i++) {
        const d = Math.hypot(i, j) / r;
        if (d > 1.35) continue;
        const k = s.at(x + i, y + j);
        if (d <= 1) { const c = 0.5 + d * 0.2; s.r[k] *= c; s.g[k] *= c; s.b[k] *= c * 1.02; s.h[k] = 0.16 + d * 0.16; } else { s.r[k] *= 1.05; s.g[k] *= 1.05; s.b[k] *= 1.05; s.h[k] += (1.35 - d) * 0.12; }
      }
    }
  }

  // Joints, hairlines and dirt, in one pass: the groove round each slab, with grime packed into it and creeping out.
  const crackMask = new Float32Array(size * size);
  const nCracks = Math.round(cracks * 3 * slabs * slabs);
  for (let n = 0; n < nCracks; n++) {
    const sx = Math.floor(rnd() * slabs) * slab, sy = Math.floor(rnd() * slabs) * slab;
    const corner = rnd() * 4 | 0;
    const x = sx + (corner & 1 ? slab - 6 : 6), y = sy + (corner & 2 ? slab - 6 : 6);
    const a = Math.atan2(slab / 2 - (y - sy), slab / 2 - (x - sx)) + (rnd() - 0.5) * 0.8;
    wander(crackMask, size, rnd, x, y, a, slab * (0.3 + rnd() * 0.35), (1.1 + rnd() * 0.7) * Math.max(S, 0.6), 1, 1, 0.16);
  }
  const groove = 3.2 * Math.max(S, 0.7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const jx = Math.abs(((x + slab / 2) % slab) - slab / 2), jy = Math.abs(((y + slab / 2) % slab) - slab / 2);
      const j = Math.min(jx, jy);
      if (j < groove * 4) {
        const dirty = ramp(groove * 4, 0, j) * (0.35 + dirt(x / size, y / size) * 0.7);
        const sh = 1 - dirty * 0.2;
        s.r[i] *= sh; s.g[i] *= sh; s.b[i] *= sh;
      }
      if (j < groove) {
        const t = ramp(groove, groove * 0.25, j);
        const c = 1 - t * 0.7;
        s.r[i] *= c; s.g[i] *= c; s.b[i] *= c * 1.02;
        s.h[i] = lerp(s.h[i], 0.06, t);
      } else if (j < groove * 1.9) {
        // The edge tooled off round: a hair brighter on the raised lip.
        const t = ramp(groove * 1.9, groove, j);
        s.r[i] *= 1 + t * 0.06; s.g[i] *= 1 + t * 0.06; s.b[i] *= 1 + t * 0.06;
        s.h[i] += t * 0.08;
      }
      if (crackMask[i] > 0) {
        const t = ramp(0, 0.35, crackMask[i]);
        s.r[i] *= 1 - t * 0.78; s.g[i] *= 1 - t * 0.78; s.b[i] *= 1 - t * 0.76;
        s.h[i] = lerp(s.h[i], 0.04, t);
      }
    }
  }

  // Weather: the dark of damp and dirt in low places, oil, and the rust-brown of what has stood on it.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = y * size + x;
      const d = ramp(0.52, 0.72, dirt(u, v)) * stains;
      const r = ramp(0.7, 0.82, mottle(u + 0.31, v + 0.17)) * stains * 0.5;
      const k = 1 - d * 0.28;
      s.r[i] *= k * (1 + r * 0.05); s.g[i] *= k * (1 - r * 0.07); s.b[i] *= k * (1 - r * 0.2);
    }
  }
  return s.bake();
}

/** An asphalt tile's maps, painted once for each set of options (see `paintAsphalt`). */
export const asphaltTexture = (GFX, options = {}) => made(GFX, 'asphalt', paintAsphalt, options);

/** A concrete tile's maps, painted once for each set of options (see `paintConcrete`). */
export const concreteTexture = (GFX, options = {}) => made(GFX, 'concrete', paintConcrete, options);
