/**
 * Building facades, painted from what a real facade is made of and checked against
 * photographs of real buildings: one storey of one bay, `TILE` metres square, to be
 * repeated up a wall and along it.
 *
 *   import { facadeTexture, FACADES } from 'madness-engine/textures/facades';
 *   const { map, bump } = facadeTexture(GFX, 'curtain');
 *
 * - `curtain`: a glass curtain wall. Three panes of blue-grey reflective glass a
 *   storey, each with its own tone and the soft reflection of sky and cloud (and a
 *   darker one of the building across the street), silver mullions between them,
 *   and a spandrel panel at the foot of each storey, with the slab line across it.
 * - `precast`: cream precast concrete panels, with the grain of the formwork and
 *   the sand in the mix, a horizontal joint, punched windows with dark frames and
 *   a deep reveal, and a darker spandrel band under them.
 * - `terracotta`: a rain-screen of terracotta panels in narrow courses, each its
 *   own firing, laid with open joints that throw a shadow, round a tall bay of
 *   blue-green glass in a silver frame.
 * - `sandstone`: rough-faced red sandstone in courses of uneven blocks, pitted and
 *   dark in its joints, round an arched window with a ring of dressed voussoirs
 *   and a projecting sill.
 *
 * Colours are neutral enough to be tinted by the vertex colour of the building
 * they are on (a different blue, a different cream); the glass of the curtain wall
 * and the windows are dark so a tint barely moves them.
 *
 * `paintFacade` gives raw pixels (`{ size, color, height }`) with no canvas, so it
 * runs under node; `facadeTexture` makes the maps (`{ map: null, bump: null }`
 * without a document, as the other painters do).
 */
import { fractal } from './painters.js';
import { Pixels, clamp, hash, lerp, made, prng, ramp } from './pixel-kit.js';

/** How many metres one tile spans, across and up. */
export const TILE = 3.6;

export const FACADES = Object.freeze(['curtain', 'precast', 'terracotta', 'sandstone']);

const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

function curtain(s, { seed }) {
  const n = s.size;
  const sky = fractal(seed * 7 + 11, 3, 4), city = fractal(seed * 7 + 13, 6, 3), fine = fractal(seed * 7 + 17, 48, 1);
  const panes = [0, 1, 2].map((i) => 0.9 + hash(i, seed, 3) * 0.2);
  const mull = n * 0.012;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x, u = x / n, v = y / n;
      const pane = Math.min(2, Math.floor(u * 3)), lu = u * 3 - pane;
      const edgeX = Math.min(lu, 1 - lu) * n / 3;
      let rgb, h;
      const spandrel = v > 0.74;
      if (edgeX < mull) { rgb = [188, 192, 198]; h = 0.85; }
      else if (v > 0.74 - 0.014 && v < 0.74 + 0.01) { rgb = [196, 199, 204]; h = 0.82; }
      else if (v > 0.965 || v < 0.01) { rgb = [190, 193, 198]; h = 0.8; }
      else if (!spandrel) {
        // Vision glass: a deep blue-grey with the sky in it, lighter high up, cloud and the street opposite as soft patches.
        const cloud = ramp(0.4, 0.85, sky(u * 0.9 + pane * 0.07, v * 0.6));
        const block = ramp(0.45, 0.8, city(u * 0.8 + pane * 0.05, v * 0.7));
        const base = mix([54, 82, 108], [96, 132, 164], clamp(1 - v / 0.74) * 0.8);
        rgb = mix(mix(base, [160, 182, 204], cloud * 0.3), [40, 56, 72], block * 0.28);
        rgb = scale(rgb, panes[pane] * (0.94 + (fine(u, v) - 0.5) * 0.08));
        h = 0.46 + (fine(u, v) - 0.5) * 0.02;
      } else {
        // The spandrel: an opaque panel behind glass, darker and flatter, ceramic-fritted at its edge.
        rgb = scale(mix([66, 78, 90], [84, 98, 112], clamp((v - 0.74) / 0.26)), panes[pane] * (0.96 + (fine(u, v) - 0.5) * 0.06));
        h = 0.5;
      }
      s.r[i] = rgb[0]; s.g[i] = rgb[1]; s.b[i] = rgb[2]; s.h[i] = h;
    }
  }
}

function precast(s, { seed }) {
  const n = s.size;
  const cloud = fractal(seed * 9 + 21, 4, 4), form = fractal(seed * 9 + 23, 22, 2);
  const win = { u0: 0.12, u1: 0.42, v0: 0.18, v1: 0.62 };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x, u = x / n, v = y / n;
      const sand = hash(x, y, 31), pit = hash(x >> 1, y >> 1, 33);
      // The paste: warm cream, clouded, with the faint vertical grain of the form boards.
      const k = 0.94 + (cloud(u, v) - 0.5) * 0.14 + (form(u * 0.4, v) - 0.5) * 0.06 + (sand - 0.5) * 0.06;
      let rgb = scale([214, 204, 184], k * (pit < 0.015 ? 0.78 : 1));
      let h = 0.55 + (sand - 0.5) * 0.03;
      // A spandrel band under the windows: a darker, browner panel of the same stone, the way those towers are banded.
      if (v > 0.7 && v < 0.86) { rgb = mix(rgb, [160, 130, 104], 0.62); h = 0.5; }
      // Two punched windows, each in its reveal.
      for (const o of [0, 0.5]) {
        const a = win.u0 + o, b = win.u1 + o;
        if (u > a - 0.012 && u < b + 0.012 && v > win.v0 - 0.012 && v < win.v1 + 0.02) {
          const inside = u > a && u < b && v > win.v0 && v < win.v1;
          if (inside) {
            const g = ramp(0, 1, (v - win.v0) / (win.v1 - win.v0));
            rgb = mix([66, 86, 102], [28, 40, 52], g * 0.8);
            rgb = scale(rgb, 0.92 + (form(u * 3, v * 3) - 0.5) * 0.16);
            h = 0.18;
            // The frame: a dark bronze line round the glass and a transom across it.
            if (u < a + 0.012 || u > b - 0.012 || v < win.v0 + 0.012 || Math.abs(v - (win.v0 + 0.3 * (win.v1 - win.v0))) < 0.007 || Math.abs(u - (a + b) / 2) < 0.006) { rgb = [74, 62, 52]; h = 0.3; }
          } else if (v >= win.v1) { rgb = [226, 218, 200]; h = 0.78; } // the sill, proud, and lit
          else { rgb = scale(rgb, 0.78); h = 0.4; } // the shadowed reveal
        }
      }
      // The horizontal panel joint at the foot of the storey, and one halfway up.
      const j = Math.min(Math.abs(v - 0.0), Math.abs(v - 1));
      if (j < 0.004) { rgb = scale(rgb, 0.55); h = 0.2; }
      s.r[i] = rgb[0]; s.g[i] = rgb[1]; s.b[i] = rgb[2]; s.h[i] = h;
    }
  }
}

function terracotta(s, { seed }) {
  const n = s.size;
  const rnd = prng(seed * 13 + 5);
  const fire = fractal(seed * 11 + 31, 4, 3), fine = fractal(seed * 11 + 33, 60, 1);
  // Large panels, two across and two up a tile, each its own firing, with the fine horizontal reeding the cladding is extruded with.
  const tone = Array.from({ length: 6 }, () => 0.88 + rnd() * 0.24);
  const glass = { u0: 0.36, u1: 0.64 };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x, u = x / n, v = y / n;
      let rgb, h;
      if (u > glass.u0 && u < glass.u1) {
        // The glass bay: tall, in a silver frame with a transom at each storey, blue-green with the sky in it.
        const e = Math.min(u - glass.u0, glass.u1 - u);
        if (e < 0.014) { rgb = [190, 194, 196]; h = 0.84; }
        else if (v < 0.012 || v > 0.985 || Math.abs(v - 0.5) < 0.008) { rgb = [180, 184, 188]; h = 0.8; }
        else {
          rgb = scale(mix([118, 160, 166], [60, 98, 110], v), 0.9 + (fine(u, v) - 0.5) * 0.1);
          h = 0.3;
        }
      } else {
        const side = u < glass.u0 ? 0 : 1, row = v < 0.5 ? 0 : 1;
        const lu = side ? (u - glass.u1) / (1 - glass.u1) : u / glass.u0, lv = (v - row * 0.5) / 0.5;
        const t = tone[row * 2 + side] * (0.96 + (fire(u, v) - 0.5) * 0.14);
        const reed = Math.sin(v * n / 3.4) * 0.5 + 0.5;
        rgb = scale([156, 98, 74], t * (0.93 + reed * 0.12 + (fine(u, v) - 0.5) * 0.05));
        h = 0.62 + reed * 0.06;
        // The open joints round each panel, throwing a shadow.
        if (lu < 0.012 || lu > 0.988 || lv < 0.012 || lv > 0.988) { rgb = scale(rgb, 0.3); h = 0.16; }
        else if (lv > 0.94 || lu > 0.97) { rgb = scale(rgb, 0.86); }
      }
      s.r[i] = rgb[0]; s.g[i] = rgb[1]; s.b[i] = rgb[2]; s.h[i] = h;
    }
  }
}

function sandstone(s, { seed }) {
  const n = s.size;
  const rnd = prng(seed * 17 + 9);
  const tone = fractal(seed * 5 + 41, 6, 4), pit = fractal(seed * 5 + 43, 70, 2);
  const courses = 6, ch = 1 / courses;
  // Block edges in each course: uneven lengths, the course's own offset, wrapping the tile.
  const edges = [];
  for (let c = 0; c < courses; c++) {
    const e = []; let x = rnd() * 0.2;
    while (x < 1 + 0.4) { e.push(x); x += 0.16 + rnd() * 0.22; }
    edges.push(e);
  }
  const shade = (c, u) => { const e = edges[c]; let k = 0; for (let i = 0; i < e.length; i++) if (u >= e[i]) k = i; return 0.86 + hash(c, k, seed) * 0.26; };
  const cx = 0.5, cw = 0.2, springing = 0.42, topY = 0.1;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x, u = x / n, v = y / n;
      const c = Math.min(courses - 1, Math.floor(v / ch)), ry = (v - c * ch) / ch;
      const e = edges[c];
      let near = 1;
      for (const q of e) near = Math.min(near, Math.abs(u - q), Math.abs(u - q - 1), Math.abs(u - q + 1));
      const joint = Math.min(near * n, ry * ch * n, (1 - ry) * ch * n);
      const rough = pit(u, v), t0 = tone(u, v);
      let rgb = scale([146, 78, 58], shade(c, u) * (0.92 + (t0 - 0.5) * 0.3 + (rough - 0.5) * 0.22 + (hash(x, y, 7) - 0.5) * 0.06));
      let h = 0.58 + (rough - 0.5) * 0.3;
      // Rough-faced: the face of each block bulges between its drafted edges.
      const draft = clamp(joint / (n * 0.012));
      h = lerp(0.25, h + draft * 0.1, draft);
      rgb = scale(rgb, 0.55 + 0.45 * draft);
      // The arched window: a round head over a rectangle, dressed voussoirs round it.
      const dx = u - cx, ww = cw / 2;
      const inRect = Math.abs(dx) < ww && v > springing && v < 0.9;
      const inArch = v <= springing && Math.hypot(dx, v - springing) < ww;
      const dist = v > springing ? Math.abs(dx) - ww : Math.hypot(dx, v - springing) - ww;
      if (inRect || inArch) {
        const g = ramp(topY, 0.9, v);
        rgb = mix([62, 82, 98], [30, 42, 54], g);
        h = 0.16;
        if (Math.abs(dx) > ww - 0.012 || (v > springing - 0.004 && v < springing + 0.01) || Math.abs(dx) < 0.006) { rgb = [58, 52, 46]; h = 0.3; }
      } else if (dist > 0 && dist < 0.06 && v < 0.92) {
        // The ring of dressed voussoirs: paler, smoother, each a wedge.
        const a = Math.atan2(v - springing, dx);
        const wedge = v <= springing ? Math.floor((a + Math.PI) / (Math.PI / 9)) : 0;
        rgb = scale([182, 112, 86], 0.92 + hash(wedge, 5, seed) * 0.14);
        h = 0.78;
        if (v <= springing && Math.abs(((a + Math.PI) % (Math.PI / 9)) - 0) < 0.03) { rgb = scale(rgb, 0.6); h = 0.4; }
      }
      if (v >= 0.9 && v < 0.945 && Math.abs(dx) < ww + 0.05) { rgb = [190, 122, 96]; h = 0.88; } // the sill
      s.r[i] = rgb[0]; s.g[i] = rgb[1]; s.b[i] = rgb[2]; s.h[i] = h;
    }
  }
}

const PAINTERS = { curtain, precast, terracotta, sandstone };

/**
 * A facade as pixels.
 * @param options `size` (1024), `kind` (one of `FACADES`), `seed`
 */
export function paintFacade({ size = 1024, kind = 'precast', seed = 1 } = {}) {
  const s = new Pixels(size);
  (PAINTERS[kind] ?? precast)(s, { seed });
  return s.bake();
}

/** A facade's maps, painted once for each set of options (see `paintFacade`). */
export const facadeTexture = (GFX, kind = 'precast', options = {}) => made(GFX, 'facade', paintFacade, { kind, ...options });
