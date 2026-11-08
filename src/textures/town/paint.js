/**
 * From Rock 'n' Roller III, with Petroleum Springs's own added at the end
 * (lawn, paving slabs, shingles, tar paper, pool tiles, kerbs).
 *
 * Every texture, painted on a canvas at startup: the floors and walls of the
 * sets (concrete, planks, lino, carpet, diamond plate, grass, wet asphalt,
 * dirt, grating, cobbles; plywood, foam, brick papered with movie posters,
 * curtain, corrugated iron, damask, clapboard, stucco, a spaceship's hull,
 * castle stone, wallpaper, and the backs of scenery flats), and the bits and
 * pieces that go with them (grilles, gaffer tape, shutters, glows, beams). A floor texture is one tile across and a wall texture one
 * tile across and high, and each comes with a `bump` map. Colour mostly comes
 * from the tile or wall under it, so the maps are near white. Under node (the
 * tests) there is no canvas, and everything is `{ map: null, bump: null }`.
 */

import { grainFields, asphalt, azulejo, belt, block, canvas, canvasWall, carpet, checker, clapboard, cliff, cobble, concrete, corrugated, curtain, damask, designed, DETAIL, dirt, fence, flats, foam, fractal, grass, grate, grey, haussmann, hedge, hull, K, laidGrain, marble, mosaic, mud, pair, panels, pixels, planks, plate, plywood, random, sand, sandstone, scree, shoji, smoothstep, snow, stone, stucco, tatami, terracotta, texture, timber, wallpaper } from '../painters.js';
import { WALLS as VENUE_WALLS } from '../venue.js';
export { canvas, copyOf, mix, random, texture, tiled } from '../painters.js';

const textures = new Map();

const none = () => ({ map: null, bump: null });

export const cached = (key, make) => {
  if (typeof document === 'undefined') return none();
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

// ———————————————————————————————————————————————————————————— floors

// ——— the world tour's floors

export const FLOORS = { concrete, planks, checker, carpet, plate, grass, panels, mud, asphalt, dirt, grate, cobble, snow, sand, tatami, terracotta, marble, mosaic, scree };

// ———————————————————————————————————————————————————————————— walls

// ——— the world tour's walls

export const WALLS = {
  // The venue's brick, and its posters (whatever the game's bill says: venue.js's bill()).
  brick: VENUE_WALLS.brick,
  posters: VENUE_WALLS.posters,
  plywood, foam, curtain, corrugated, block, damask, canvas: canvasWall, fence,
  clapboard, stucco, hull, stone, wallpaper, flats,
  sandstone, cliff, shoji, timber, haussmann, azulejo, hedge,
};

// ———————————————————————————————————————————————————————————— Petroleum Springs

/** A lawn, mown in stripes: grass, light and dark by halves. */
function lawn(GFX) {
  const n = fractal(601, 16, 3), m = fractal(603, 4, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const stripe = v < 0.5 ? 1 : 0.86;
    const blade = n(u, v);
    const k = relief ? 0.3 + blade * 0.7 : (0.62 + blade * 0.3 + m(u, v) * 0.08) * stripe;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** Paving slabs, four to the tile, each a shade of its own, with the odd chip off a corner. */
function slabs(GFX) {
  const n = fractal(611, 6, 4), grit = fractal(613, 40, 2);
  const rnd = random(617);
  const tones = Array.from({ length: 4 }, () => 0.84 + rnd() * 0.12);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 2) % 1, fv = (v * 2) % 1;
    const edge = Math.min(fu, fv, 1 - fu, 1 - fv);
    const joint = edge < 0.022;
    const bevel = smoothstep(0.022, 0.05, edge);
    const t = tones[Math.floor(u * 2) + Math.floor(v * 2) * 2];
    const k = relief ? (joint ? 0 : 0.45 + bevel * 0.35 + (grit(u, v) - 0.5) * 0.2) : joint ? 0.42 : t * (0.9 + n(u, v) * 0.1 + (grit(u, v) - 0.5) * 0.08) * (0.9 + bevel * 0.1);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** Asphalt shingles, in courses, each tab its own shade, the gaps between them dark. Roofs, seen from above. */
function shingles(GFX) {
  const n = fractal(621, 20, 2);
  const rnd = random(623);
  const tones = Array.from({ length: 64 }, () => 0.7 + rnd() * 0.3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 5, r = Math.floor(v * rows), fr = (v * rows) % 1;
    const shift = (r % 2) * 0.125;
    const tabs = 4, c = Math.floor(((u + shift) % 1) * tabs), fc = (((u + shift) % 1) * tabs) % 1;
    const gap = fc < 0.04 || fc > 0.96;
    const shadow = smoothstep(0.75, 1, fr);
    const t = tones[(r * 7 + c * 3) % 64];
    const k = relief ? (gap ? 0.1 : 0.3 + fr * 0.6) : gap ? 0.3 : t * (0.85 + n(u, v) * 0.2) * (1 - shadow * 0.45);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** A flat roof: gravel over tar paper, the seams of the felt showing, a vent or a drain now and then. */
function tarpaper(GFX) {
  const n = fractal(631, 5, 4), grit = fractal(633, 64, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const seam = Math.abs(((v * 3) % 1) - 0.5) > 0.485;
    const g = grit(u, v);
    const k = relief ? (seam ? 0.8 : 0.35 + g * 0.5) : (0.6 + n(u, v) * 0.18 + (g > 0.6 ? 0.14 : 0)) * (seam ? 0.75 : 1);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** Spilt oil: black-brown and glassy, with the rainbow sheen of the film on it in swirls. */
function oilslick(GFX) {
  const n = fractal(661, 3, 4), m = fractal(663, 5, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const f = n(u, v) * 3 + m(u, v);
    if (relief) return grey(Math.round(128 + (m(u, v) - 0.5) * 30));
    const band = Math.max(0, 1 - Math.abs(((f * 4) % 1) - 0.5) * 3) * Math.max(0, m(u, v) - 0.35) * 2.2;
    const h = f * 9;
    const rainbow = [0, 2.1, 4.2].map((o) => 0.5 + 0.5 * Math.cos(h + o));
    const base = [46, 38, 36];
    return base.map((b, i) => Math.round(b + band * 150 * rainbow[i]));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** Little square pool tiles with white grout, and a band of darker tile at the top. */
function pooltile(GFX) {
  const n = fractal(641, 8, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 8) % 1, fv = (v * 8) % 1;
    const grout = Math.min(fu, fv, 1 - fu, 1 - fv) < 0.07;
    const k = relief ? (grout ? 0.2 : 0.7) : grout ? 1 : 0.78 + n(u, v) * 0.12;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** The face of a kerb: poured concrete, a rounded lip along the top, scuffed black where the tyres rub. */
function kerb(GFX) {
  const n = fractal(651, 6, 4), grit = fractal(653, 40, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const lip = smoothstep(0.86, 0.96, 1 - v);
    const scuff = smoothstep(0.75, 0.95, v) * (0.5 + n(u * 3, v) * 0.5);
    const k = relief ? 0.5 + lip * 0.4 + (grit(u, v) - 0.5) * 0.3 : (0.82 + n(u, v) * 0.12 + (grit(u, v) - 0.5) * 0.1) * (1 + lip * 0.08) * (1 - scuff * 0.5);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

Object.assign(FLOORS, { lawn, slabs, shingles, tarpaper, pooltile, oilslick });
Object.assign(WALLS, { kerb, pooltile });

// ———————————————————————————————————————————————————————————— facades

/**
 * A building's face, one tile across and one storey high (the canvas is
 * as tall as a storey is, so nothing stretches): its wall, and its windows
 * and doors, which are painted dark — a lit window is a glow laid over it
 * at night (`buildings.js`). `WINDOW` says where in it the window is, so
 * the glow can be laid over it.
 */
export const WINDOW = Object.freeze({
  house: { u: [0.24, 0.76], v: [0.26, 0.72] },
  brick: { u: [0.22, 0.78], v: [0.24, 0.76] },
  office: { u: [0.06, 0.94], v: [0.12, 0.86] },
  shop: { u: [0.06, 0.94], v: [0.32, 0.92] },
});

/**
 * A storey's face, drawn in the 256-unit design (`draw` takes design units; a
 * pixel loop in it takes `W * K` by `H * K` device pixels), at DETAIL, with the
 * same fine grain as every other floor and wall.
 */
function facadeCanvas(storey, draw) {
  const W = 256, H = Math.round(256 * storey);
  const grains = grainFields(907);
  return (relief) => () => {
    const [c, ctx] = designed(W, H);
    draw(ctx, W, H, relief);
    return laidGrain(c, grains, relief ? 0.11 : 0.12, relief);
  };
}

/** Clapboard and a sash window with a sill and shutters (or, `door`, a panelled front door with a step and a lamp). */
function houseFace(GFX, { door = false, plain = false } = {}) {
  const storey = 1.6;
  const grain = fractal(701, 3, 4);
  const draw = (ctx, W, H, relief) => {
    const DW = W * K, DH = H * K;
    const img = ctx.createImageData(DW, DH);
    for (let y = 0; y < DH; y++) {
      for (let x = 0; x < DW; x++) {
        const boards = 9, f = ((y / DH) * boards) % 1;
        const lip = smoothstep(0.75, 1, f);
        const g = grain((x / DW) * 0.6, (y / DH) * 6);
        const k = relief ? 0.25 + f * 0.7 : (0.84 + g * 0.16) * (1 - lip * 0.3) * (f < 0.05 ? 0.55 : 1);
        const i = (y * DW + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(255 * Math.min(1, k));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // The skirting along the foot.
    ctx.fillStyle = relief ? '#a0a0a0' : '#8a8680';
    ctx.fillRect(0, H * 0.94, W, H * 0.06);
    if (plain) return;
    const trim = relief ? '#ffffff' : '#fbfaf6';
    if (door) {
      const x0 = W * 0.3, x1 = W * 0.7, y0 = H * 0.2, y1 = H * 0.94;
      ctx.fillStyle = trim; ctx.fillRect(x0 - 10, y0 - 12, x1 - x0 + 20, y1 - y0 + 12);
      ctx.fillStyle = relief ? '#606060' : '#5a2a22'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = relief ? '#404040' : '#3a1a14'; ctx.lineWidth = 4;
      for (const [a, b, c2, d] of [[0.08, 0.06, 0.4, 0.38], [0.52, 0.06, 0.4, 0.38], [0.08, 0.52, 0.4, 0.4], [0.52, 0.52, 0.4, 0.4]]) ctx.strokeRect(x0 + a * (x1 - x0), y0 + b * (y1 - y0), c2 * (x1 - x0), d * (y1 - y0));
      ctx.fillStyle = relief ? '#fff' : '#d8b040'; ctx.beginPath(); ctx.arc(x1 - 14, (y0 + y1) / 2, 4, 0, 7); ctx.fill();
      return;
    }
    const { u, v } = WINDOW.house;
    const x0 = W * u[0], x1 = W * u[1], y0 = H * v[0], y1 = H * v[1];
    // Shutters, the frame, the glass in two sashes, the sill.
    ctx.fillStyle = relief ? '#808080' : '#2e3e2e';
    ctx.fillRect(x0 - 34, y0, 26, y1 - y0); ctx.fillRect(x1 + 8, y0, 26, y1 - y0);
    ctx.fillStyle = relief ? '#606060' : '#24321f';
    for (let k = 0; k < 8; k++) { ctx.fillRect(x0 - 32, y0 + 6 + k * (y1 - y0 - 10) / 8, 22, 3); ctx.fillRect(x1 + 10, y0 + 6 + k * (y1 - y0 - 10) / 8, 22, 3); }
    ctx.fillStyle = trim; ctx.fillRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
    ctx.fillStyle = relief ? '#202020' : '#1a2028'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = trim; ctx.fillRect(x0, (y0 + y1) / 2 - 3, x1 - x0, 6); ctx.fillRect((x0 + x1) / 2 - 2, y0, 4, y1 - y0);
    ctx.fillStyle = relief ? '#ffffff' : '#e8e4da'; ctx.fillRect(x0 - 14, y1 + 6, x1 - x0 + 28, 10);
    // A glint on the glass.
    ctx.fillStyle = relief ? 'rgba(0,0,0,0)' : 'rgba(150,170,200,0.25)';
    ctx.beginPath(); ctx.moveTo(x0 + 8, y0 + 8); ctx.lineTo(x0 + 34, y0 + 8); ctx.lineTo(x0 + 8, y0 + 50); ctx.fill();
  };
  return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
}

/** An office storey: a band of glass between mullions, a spandrel panel under it. */
function officeFace(GFX) {
  const storey = 0.9;
  const draw = (ctx, W, H, relief) => {
    ctx.fillStyle = relief ? '#909090' : '#d4d6da'; ctx.fillRect(0, 0, W, H);
    const { u, v } = WINDOW.office;
    ctx.fillStyle = relief ? '#303030' : '#22303e'; ctx.fillRect(W * u[0], H * v[0], W * (u[1] - u[0]), H * (v[1] - v[0]));
    const g = ctx.createLinearGradient(0, H * v[0], W, H * v[1]);
    g.addColorStop(0, 'rgba(120,150,190,0.35)'); g.addColorStop(0.5, 'rgba(60,80,110,0)'); g.addColorStop(1, 'rgba(120,150,190,0.2)');
    if (!relief) { ctx.fillStyle = g; ctx.fillRect(W * u[0], H * v[0], W * (u[1] - u[0]), H * (v[1] - v[0])); }
    ctx.fillStyle = relief ? '#ffffff' : '#b8bcc4';
    ctx.fillRect(W / 2 - 3, H * v[0], 6, H * (v[1] - v[0]));
    ctx.fillRect(0, 0, 8, H); ctx.fillRect(W - 8, 0, 8, H);
    ctx.fillStyle = relief ? '#c0c0c0' : '#9aa0a8'; ctx.fillRect(0, H * 0.9, W, H * 0.1);
  };
  return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
}

/** Brick, a tall window with a stone lintel and sill: the older downtown blocks. */
function brickFace(GFX) {
  const storey = 1.2;
  const n = fractal(711, 8, 3);
  const draw = (ctx, W, H, relief) => {
    const rows = 14, bh = H / rows, bw = W / 3;
    ctx.fillStyle = relief ? '#202020' : '#b8b0a4'; ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c < 4; c++) {
        const x = c * bw + (r % 2) * bw / 2;
        const k = 0.72 + n(x / W, r / rows) * 0.28;
        ctx.fillStyle = relief ? `rgb(${180 * k | 0},${180 * k | 0},${180 * k | 0})` : `rgb(${235 * k | 0},${232 * k | 0},${226 * k | 0})`;
        ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 3);
      }
    }
    const { u, v } = WINDOW.brick;
    const x0 = W * u[0], x1 = W * u[1], y0 = H * v[0], y1 = H * v[1];
    ctx.fillStyle = relief ? '#ffffff' : '#ece6da'; ctx.fillRect(x0 - 10, y0 - 14, x1 - x0 + 20, 12); ctx.fillRect(x0 - 8, y1, x1 - x0 + 16, 10);
    ctx.fillStyle = relief ? '#202020' : '#1c2430'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = relief ? '#c0c0c0' : '#e8e2d6'; ctx.fillRect((x0 + x1) / 2 - 3, y0, 6, y1 - y0); ctx.fillRect(x0, y0 + (y1 - y0) * 0.4, x1 - x0, 6);
  };
  return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
}

/** A shop front: plate glass from knee height to the fascia, a black frame. */
function shopFace(GFX) {
  const storey = 2.4;
  const draw = (ctx, W, H, relief) => {
    ctx.fillStyle = relief ? '#808080' : '#d8d4cc'; ctx.fillRect(0, 0, W, H);
    const { u, v } = WINDOW.shop;
    ctx.fillStyle = relief ? '#202020' : '#1a1e24'; ctx.fillRect(W * u[0], H * v[0], W * (u[1] - u[0]), H * (v[1] - v[0]));
    ctx.fillStyle = relief ? '#ffffff' : '#2a2c30'; ctx.fillRect(0, H * v[0], 10, H * (v[1] - v[0])); ctx.fillRect(W - 10, H * v[0], 10, H * (v[1] - v[0])); ctx.fillRect(0, H * v[1], W, 8); ctx.fillRect(0, H * v[0] - 8, W, 8);
    // The fascia over the windows is red.
    ctx.fillStyle = relief ? '#909090' : '#c8402e'; ctx.fillRect(0, H * 0.04, W, H * 0.22);
    ctx.fillStyle = relief ? '#c0c0c0' : '#8a8a8e'; ctx.fillRect(0, H * 0.94, W, H * 0.06);
  };
  return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
}

/** A parking garage's side: concrete bands with the open decks between. */
function garageFace(GFX) {
  const storey = 1.0;
  const n = fractal(721, 6, 3);
  const draw = (ctx, W, H, relief) => {
    const DW = W * K, DH = H * K;
    const img = ctx.createImageData(DW, DH);
    for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
      const open = y / K > H * 0.08 && y / K < H * 0.62 && ((x / K) % 128) > 14;
      const k = relief ? (open ? 0.1 : 0.6 + n(x / DW, y / DH) * 0.3) : open ? 0.08 : 0.78 + n(x / DW, y / DH) * 0.2;
      const i = (y * DW + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(255 * k);
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
}

export const FACADES = {
  house: { storey: 1.6, paint: (GFX) => houseFace(GFX) },
  'house-door': { storey: 1.6, paint: (GFX) => houseFace(GFX, { door: true }) },
  gable: { storey: 1.6, paint: (GFX) => houseFace(GFX, { plain: true }) },
  office: { storey: 0.9, paint: officeFace },
  brick: { storey: 1.2, paint: brickFace },
  shop: { storey: 2.4, paint: shopFace },
  garage: { storey: 1.0, paint: garageFace },
};

/** The facade texture called `name`, painted once. */
export function facadeTexture(GFX, name) {
  return cached(`facade:${name}`, () => FACADES[name].paint(GFX));
}

/** A storage tank's shell: welded steel plates, painted and weathered, rust running down from the seams. */
function tankshell(GFX) {
  const n = fractal(741, 4, 4), streak = fractal(743, 16, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 2) % 1, fv = (v * 1) % 1;
    const seam = Math.min(fu, 1 - fu) < 0.008 || Math.min(fv, 1 - fv) < 0.012;
    const run = smoothstep(0.55, 0.85, streak(u * 0.3, v * 0.05)) * smoothstep(0, 0.6, v);
    const k = relief ? (seam ? 0.85 : 0.5 + n(u, v) * 0.1) : (seam ? 0.7 : 0.9 + n(u, v) * 0.1) * (1 - run * 0.35);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

/** Chain-link fence: wire in diamonds, dark between, a little sag. */
function chainlink(GFX) {
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const a = ((u + v) * 10) % 1, b = ((u - v + 4) * 10) % 1;
    const wire = Math.min(a, 1 - a) < 0.08 || Math.min(b, 1 - b) < 0.08;
    const rail = v < 0.04;
    const k = relief ? (wire || rail ? 0.9 : 0.1) : wire || rail ? 0.85 : 0.08;
    return grey(Math.round(255 * k));
  });
  return pair(GFX, DETAIL, paint(false), paint(true));
}

Object.assign(WALLS, { tankshell, chainlink });

/** The floor texture called `name`, painted once. */
export function floorTexture(GFX, name = 'concrete') {
  return cached(`floor:${name}`, () => (FLOORS[name] ?? FLOORS.concrete)(GFX));
}

/** The wall texture called `name`, painted once. */
export function wallTexture(GFX, name = 'brick') {
  return cached(`wall:${name}`, () => (WALLS[name] ?? WALLS.brick)(GFX));
}

/** A conveyor belt's chevrons. */
export function beltTexture(GFX) {
  return cached('belt', () => belt(GFX));
}

// ———————————————————————————————————————————————————————————— the machinery's

/** A speaker cabinet's face: black cloth over a big cone, silver trim. */
export function grilleTexture(GFX) {
  return cached('grille', () => {
    const size = 256;
    const paint = (relief) => {
      const [c, ctx] = designed(size);
      ctx.fillStyle = relief ? '#808080' : '#18181b';
      ctx.fillRect(0, 0, size, size);
      const mid = size / 2;
      // The cone behind the cloth: rings, a dust cap, a glint.
      for (let r = 108; r > 10; r -= 7) {
        ctx.strokeStyle = relief ? (r % 14 ? '#c0c0c0' : '#606060') : (r % 14 ? '#2a2a30' : '#0e0e10');
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mid, mid, r, 0, 7); ctx.stroke();
      }
      ctx.fillStyle = relief ? '#fff' : '#33343a';
      ctx.beginPath(); ctx.arc(mid, mid, 22, 0, 7); ctx.fill();
      // Cloth weave.
      ctx.fillStyle = relief ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)';
      for (let y = 0; y < size; y += 3) for (let x = (y / 3) % 2 ? 0 : 1; x < size; x += 3) ctx.fillRect(x, y, 1, 1);
      // Trim.
      ctx.strokeStyle = relief ? '#fff' : '#9ea3ad';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, size - 8, size - 8);
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** Black stage deck with gaff tape laid across it, and the glow of spike marks. */
export function gaffTexture(GFX) {
  return cached('gaff', () => {
    const size = 256;
    const rnd = random(61);
    const paint = (relief) => {
      const [c, ctx] = designed(size);
      ctx.fillStyle = relief ? '#909090' : '#1c1c20';
      ctx.fillRect(0, 0, size, size);
      for (let k = 0; k < 400; k++) {
        ctx.fillStyle = relief ? `rgba(255,255,255,${rnd() * 0.3})` : `rgba(255,255,255,${rnd() * 0.05})`;
        ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
      }
      // Plywood seams.
      ctx.strokeStyle = relief ? '#000' : '#08080a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(size, 2); ctx.moveTo(2, 0); ctx.lineTo(2, size); ctx.stroke();
      // Gaff tape: a strip along the edge, and a spike mark.
      ctx.fillStyle = relief ? '#bbb' : '#cfd2d8';
      ctx.fillRect(0, 14, size, 8);
      ctx.fillStyle = relief ? '#bbb' : '#ffcf3a';
      ctx.fillRect(size * 0.5 - 18, size * 0.5 - 4, 36, 8);
      ctx.fillRect(size * 0.5 - 4, size * 0.5 - 18, 8, 36);
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** A roll-up shutter: ribbed steel, scuffed, with CLOSED SET stencilled across it and hazard stripes at the foot. */
export function shutterTexture(GFX) {
  return cached('shutter', () => {
    const size = 256;
    const rnd = random(13);
    const paint = (relief) => {
      const [c, ctx] = designed(size);
      ctx.fillStyle = relief ? '#808080' : '#8d939d';
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 16) {
        ctx.fillStyle = relief ? '#fff' : 'rgba(255,255,255,0.28)';
        ctx.fillRect(0, y, size, 3);
        ctx.fillStyle = relief ? '#000' : 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, y + 11, size, 5);
      }
      if (!relief) {
        for (let k = 0; k < 60; k++) {
          ctx.fillStyle = `rgba(60,40,30,${rnd() * 0.12})`;
          ctx.fillRect(rnd() * size, rnd() * size, 2 + rnd() * 18, 1 + rnd() * 5);
        }
        ctx.fillStyle = '#c8261d';
        ctx.font = '800 54px Impact, "Arial Narrow", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLOSED', size / 2, 98);
        ctx.fillText('SET', size / 2, 156);
        // Hazard stripes along the bottom rail.
        for (let x = -20; x < size; x += 32) {
          ctx.fillStyle = '#f0c020';
          ctx.beginPath(); ctx.moveTo(x, size); ctx.lineTo(x + 16, size); ctx.lineTo(x + 32, size - 24); ctx.lineTo(x + 16, size - 24); ctx.fill();
        }
      }
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/**
 * The look of a breakaway, by name: `flat` (black-painted ply with gaffer
 * tape on it), `drywall`, `wood`, `curtain`, `brick` (painted foam), `glass`
 * (sugar glass) and `backdrop` (a painted sky). Painted to be just a little
 * different from the wall it hides in, so a keen eye might wonder.
 */
export function panelTexture(GFX, look = 'flat') {
  return cached(`panel:${look}`, () => {
    const size = 256;
    const rnd = random(29);
    const base = { flat: '#34343a', drywall: '#c8c0b0', wood: '#8a6a48', curtain: '#5a1424', foam: '#2a2a30', steel: '#6a707a', canvas: '#c8b890', brick: '#9a5040', glass: '#b8d4e8', backdrop: '#3a5a98', stone: '#7a7068' }[look] ?? '#34343a';
    const paint = (relief) => {
      const [c, ctx] = designed(size);
      ctx.fillStyle = relief ? '#909090' : base;
      ctx.fillRect(0, 0, size, size);
      for (let k = 0; k < 300; k++) {
        ctx.fillStyle = relief ? `rgba(255,255,255,${rnd() * 0.3})` : `rgba(255,255,255,${rnd() * 0.06})`;
        ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2);
      }
      if (!relief && look === 'glass') {
        // Sugar glass: streaks of shine across it, and a pane frame.
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 6;
        for (const x of [40, 70, 170]) { ctx.beginPath(); ctx.moveTo(x, size); ctx.lineTo(x + 80, 0); ctx.stroke(); }
        ctx.strokeStyle = '#4a4a50';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, size, size);
        ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke();
      } else if (!relief && look === 'brick') {
        // Painted bricks, a little too neat.
        ctx.fillStyle = 'rgba(40,20,16,0.6)';
        for (let r = 0; r < 4; r++) { ctx.fillRect(0, r * 64, size, 5); for (let k = 0; k < 3; k++) ctx.fillRect(((r % 2) * 64 + k * 128) % size, r * 64, 5, 64); }
      } else if (!relief && look === 'backdrop') {
        // A painted sky: a gradient, a moon, a few clouds.
        const g = ctx.createLinearGradient(0, 0, 0, size);
        g.addColorStop(0, '#1a2a5a'); g.addColorStop(1, '#5a7ab8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#f4f0d8'; ctx.beginPath(); ctx.arc(180, 70, 28, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(220,226,240,0.5)';
        for (const [x, y] of [[50, 120], [90, 110], [140, 180]]) { ctx.beginPath(); ctx.ellipse(x, y, 46, 14, 0, 0, 7); ctx.fill(); }
      }
      if (!relief && look !== 'glass' && look !== 'backdrop') {
        // A hairline crack, staples at the edge, a strip of tape holding it together.
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let x = 40 + rnd() * 120, y = 0;
        ctx.moveTo(x, y);
        while (y < size * 0.7) { x += (rnd() - 0.5) * 26; y += 14 + rnd() * 16; ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(230,230,235,0.8)';
        ctx.fillRect(0, 118, size, 9);
        ctx.fillStyle = '#d0d0d8';
        for (let sx = 12; sx < size; sx += 28) ctx.fillRect(sx, 8, 6, 2);
      }
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** A soft round glow, for halos. White in the middle, clear at the edge: tint it with the material's colour. */
export function glowTexture(GFX) {
  return cached('glow', () => {
    const [c, ctx] = canvas(64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return { map: texture(GFX, c), bump: null };
  });
}
