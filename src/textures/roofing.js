/**
 * Roofs, painted the way the granite is: as what they are made of.
 *
 *   import { shinglesTexture, membraneTexture } from 'madness-engine/textures/roofing';
 *   const { map, bump } = shinglesTexture(GFX, { color: 'charcoal' });
 *
 * Shingles are asphalt shingles in courses: each course laid over the one
 * below so that its upper edge is in shadow and its lower edge catches the light,
 * three tabs to a strip with the slots cut between them, every tab a shade of
 * its own, the surface a fine scatter of ceramic granules of three tones, and
 * with age, streaks of dirt, a lighter weathered top and moss in the shade.
 * `TILE.shingles` metres across, `u` along the eave and `v` up the slope.
 *
 * A membrane is a single-ply flat roof: sheets of white, grey, black or tan
 * membrane welded along their seams, a screw plate every so often along each,
 * the ripples of the sheet over the deck under it, dirt streaked down from the
 * outlets and gathered in the shallow ponds that stand on it. `TILE.membrane`
 * metres across.
 *
 * `paintShingles` and `paintMembrane` give raw pixels with no canvas, so they
 * run under node; the `*Texture` functions make the maps (`{ map: null, bump:
 * null }` without a document, as the other painters do).
 */
import { fractal } from './painters.js';
import { Pixels, grain, hash, lerp, made, pickStone, prng, ramp } from './pixel-kit.js';

/** How many metres one tile of each spans. */
export const TILE = Object.freeze({ shingles: 1.6, membrane: 3 });

const SHINGLES = {
  charcoal: [[0.4, [58, 58, 62]], [0.3, [70, 68, 70]], [0.18, [48, 48, 52]], [0.12, [82, 78, 74]]],
  brown: [[0.4, [92, 66, 50]], [0.3, [108, 78, 58]], [0.18, [74, 54, 44]], [0.12, [126, 96, 70]]],
  grey: [[0.4, [112, 112, 114]], [0.3, [96, 98, 100]], [0.18, [128, 126, 124]], [0.12, [82, 84, 88]]],
  green: [[0.4, [72, 88, 72]], [0.3, [84, 100, 80]], [0.18, [60, 74, 62]], [0.12, [98, 110, 88]]],
};

/**
 * Asphalt shingles, as pixels.
 * @param options `size` (2048); `color`: 'charcoal', 'brown', 'grey' or 'green'; `age` (0 new, 1 old and streaked, 0.4); `seed`
 *   A tile is 12 courses of 133 mm (the exposure) and 5 tabs of 320 mm across.
 */
export function paintShingles({ size = 2048, color = 'charcoal', age = 0.4, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 8123 + 11);
  const courses = 12, tabs = 5;
  const ch = size / courses, tw = size / tabs, slot = Math.max(3, size * 0.0035);
  const table = (SHINGLES[color] ?? SHINGLES.charcoal).map(([w, rgb]) => ({ w, rgb }));
  const streak = fractal(seed * 29 + 601, 3, 3), moss = fractal(seed * 29 + 603, 7, 4), fine = fractal(seed * 29 + 607, 60, 1);
  // One colour for each tab of each course.
  const tone = [];
  for (let c = 0; c < courses; c++) for (let t = 0; t <= tabs; t++) { const rgb = pickStone(rnd(), table); const b = 0.88 + rnd() * 0.24; tone.push([rgb[0] * b, rgb[1] * b, rgb[2] * b]); }
  for (let y = 0; y < size; y++) {
    const c = Math.floor(y / ch), yIn = y - c * ch, v = yIn / ch;
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const off = c % 2 ? tw / 2 : 0;
      const xs = x + off, t = Math.floor(xs / tw), xIn = xs - t * tw;
      const base = tone[c * (tabs + 1) + (t % tabs)];
      const u = x / size, w = y / size;
      // The shadow under the course above, deepest at the top of the exposure; the lit edge of this one at the foot.
      let k = 0.62 + 0.46 * ramp(0, 0.42, v) - (v > 0.94 ? (v - 0.94) * 6 : 0);
      if (v > 0.9 && v <= 0.965) k += 0.18;
      // Granules: a fine scatter of three tones.
      const g = hash(x, y, 17);
      k *= g > 0.96 ? 1.36 : g < 0.05 ? 0.62 : 0.9 + hash(x >> 1, y >> 1, 19) * 0.18;
      // Streaks of dirt running down the roof, lighter weathered grit on top, and moss low in the shade.
      const dirt = ramp(0.45, 0.75, streak(u * 1.0, w * 0.35)) * age;
      const weather = ramp(0.5, 0.8, fine(u, w)) * age * 0.18;
      const m = ramp(0.7, 0.82, moss(u, w)) * age * (1 - v * 0.5);
      let r = base[0] * k, gg = base[1] * k, b = base[2] * k;
      r *= 1 - dirt * 0.3 + weather; gg *= 1 - dirt * 0.28 + weather; b *= 1 - dirt * 0.24 + weather;
      r = lerp(r, 58, m * 0.55); gg = lerp(gg, 92, m * 0.55); b = lerp(b, 40, m * 0.55);
      let h = 0.3 + 0.5 * ramp(0, 0.9, v) - (v > 0.965 ? 0.4 : 0) + (g - 0.5) * 0.06;
      // The slots between the tabs, cut up most of the exposure.
      if (xIn < slot && v > 0.04 && v < 0.62) { r *= 0.3; gg *= 0.3; b *= 0.32; h = 0.12; }
      else if (xIn < slot * 2.4 && v > 0.04 && v < 0.62) { r *= 0.8; gg *= 0.8; b *= 0.8; }
      s.r[i] = r; s.g[i] = gg; s.b[i] = b; s.h[i] = h;
    }
  }
  return s.bake();
}

const MEMBRANES = {
  white: [212, 212, 208], grey: [150, 152, 154], black: [46, 46, 48], tan: [186, 168, 138],
};

/**
 * A single-ply membrane roof, as pixels.
 * @param options `size` (2048); `tone`: 'white', 'grey', 'black' or 'tan'; `age` (0 new, 1 dirty and stained, 0.45); `seed`
 *   A tile is two sheets, so two welded seams cross it, a screw plate every 300 mm along each.
 */
export function paintMembrane({ size = 2048, tone = 'white', age = 0.45, seed = 1 } = {}) {
  const s = new Pixels(size);
  const rnd = prng(seed * 5081 + 17);
  const S = size / 2048;
  const base = MEMBRANES[tone] ?? MEMBRANES.white;
  const ripple = fractal(seed * 31 + 701, 9, 4), blotch = fractal(seed * 31 + 703, 3, 4), pond = fractal(seed * 31 + 707, 4, 3), run = fractal(seed * 31 + 709, 14, 2);
  const seam = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x, u = x / size, v = y / size;
      const rip = ripple(u, v) - 0.5, bl = blotch(u, v) - 0.5, g = hash(x, y, 23);
      // Dirt gathers in the ponds, and streaks down from the outlets (along v).
      const pd = ramp(0.64, 0.7, pond(u, v)) * age;
      const ring = Math.abs(pond(u, v) - 0.67) < 0.007 ? age * 0.9 : 0;
      const st = ramp(0.55, 0.8, run(u * 3, v * 0.5)) * age * 0.7;
      let k = 0.96 + rip * 0.12 + bl * 0.1 + (g - 0.5) * 0.045 - pd * 0.2 - st * 0.14 - ring * 0.1;
      const grime = pd * 0.5 + st * 0.3;
      s.r[i] = (base[0] * k) * (1 - grime * 0.18) + grime * 10; s.g[i] = (base[1] * k) * (1 - grime * 0.2) + grime * 8; s.b[i] = (base[2] * k) * (1 - grime * 0.3);
      s.h[i] = 0.5 + rip * 0.18 + (g - 0.5) * 0.02;
    }
  }
  // The welded seams: a raised lap with a thin shadow line either side, running along u.
  for (let n = 0; n < 2; n++) {
    const y0 = Math.floor(n * seam);
    for (let y = y0 - 14; y <= y0 + 14; y++) {
      const d = Math.abs(y - y0);
      for (let x = 0; x < size; x++) {
        const i = s.at(x, y);
        if (d < 4 * Math.max(S, 0.7)) { s.h[i] = 0.74; s.r[i] *= 1.04; s.g[i] *= 1.04; s.b[i] *= 1.04; }
        else if (d < 7 * Math.max(S, 0.7)) { const sh = y > y0 ? 0.84 : 1.05; s.r[i] *= sh; s.g[i] *= sh; s.b[i] *= sh; s.h[i] = 0.42; }
      }
    }
    // The screw plates, a round disc each, a little darker and proud.
    for (let x = size / 14; x < size; x += size / 7) {
      grain(s, x, y0, 11 * Math.max(S, 0.7), rnd, { rgb: [base[0] * 0.78, base[1] * 0.78, base[2] * 0.8], top: 0.3, base: 0.7, angular: 0, shadow: 0.5 });
      grain(s, x, y0, 3.2 * Math.max(S, 0.7), rnd, { rgb: [70, 70, 74], top: 0.1, base: 0.9, angular: 0, shadow: 0.2 });
    }
  }
  return s.bake();
}

/** A shingles tile's maps, painted once for each set of options (see `paintShingles`). */
export const shinglesTexture = (GFX, options = {}) => made(GFX, 'shingles', paintShingles, options);

/** A membrane tile's maps, painted once for each set of options (see `paintMembrane`). */
export const membraneTexture = (GFX, options = {}) => made(GFX, 'membrane', paintMembrane, options);
