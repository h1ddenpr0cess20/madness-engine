/**
 * The surfaces of a bistro kitchen, painted on canvases at load: honed
 * Calacatta marble for a counter, bottle-green glazed subway tile for the wall
 * behind it, and brushed brass for the trim. Ported from Short Order's kitchen.
 *
 *   import { marbleTexture, greenTileTexture, brushedTexture } from 'madness-engine/textures/kitchen';
 *
 * Each makes a texture of its own, wrapping, and gives back `null` without a
 * document (under node, in the tests), so a material built on it comes out
 * plain.
 */
import { texture } from './painters.js';

function canvas(width, height = width) {
  if (typeof document === 'undefined') return null;
  const el = document.createElement('canvas');
  el.width = width;
  el.height = height;
  const ctx = el.getContext('2d');
  return ctx ? { el, ctx } : null;
}

/** A tiny seeded generator, so the grain is the same on every load. */
function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise that repeats every `period` lattice cells, so a texture painted with it tiles. */
function periodic(x, y, period, seed = 0) {
  const fade = (t) => t * t * (3 - 2 * t);
  const i = Math.floor(x), j = Math.floor(y);
  const fx = fade(x - i), fy = fade(y - j);
  const at = (a, b) => {
    const p = ((a % period) + period) % period, q = ((b % period) + period) % period;
    let n = (Math.imul(p, 374761393) + Math.imul(q, 668265263) + Math.imul(seed, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
  const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
  return (top + (bottom - top) * fy) * 2 - 1;
}

/**
 * Honed Calacatta: warm white, soft grey clouding, and the long grey veins
 * with a gold bloom either side that the stone is named for. Still lighter
 * than anything on it, so the iron and the board read against it. It tiles,
 * so it can be laid down as many times as the counter is long.
 */
export function marbleTexture(GFX, size = 768) {
  const c = canvas(size);
  if (!c) return null;
  const { ctx } = c;
  const img = ctx.createImageData(size, size);
  const P = 4;
  /**
   * Everything slow-moving — the broad warp of the veins, the clouding, where
   * each family of veins fades — is worked out on a coarse grid and blended
   * up: only the fine warp is worked out for every pixel.
   */
  const G = 96;
  const coarse = (fn) => {
    const grid = new Float32Array(G * G);
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) grid[j * G + i] = fn((i / G) * P, (j / G) * P);
    return grid;
  };
  const warpLow = coarse((u, v) => periodic(u, v, P, 1) * 1.1 + periodic(u * 2, v * 2, P * 2, 2) * 0.5);
  const cloud = coarse((u, v) => periodic(u * 1.5, v * 1.5, P * 1.5, 4) * 0.5 + periodic(u * 8, v * 8, P * 8, 5) * 0.12);
  const fadeA = coarse((u, v) => Math.min(1, Math.max(0, 0.45 + periodic(u * 0.75 + 3, v * 0.75, P * 0.75, 7) * 1.6)));
  const fadeB = coarse((u, v) => Math.min(1, Math.max(0, 0.2 + periodic(u + 9, v + 4, P, 8) * 1.8)));
  const at = (grid, x, y) => {
    const gx = (x / size) * G, gy = (y / size) * G;
    const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const i1 = (i + 1) % G, j1 = (j + 1) % G;
    const top = grid[j * G + i] + (grid[j * G + i1] - grid[j * G + i]) * fx;
    const bottom = grid[j1 * G + i] + (grid[j1 * G + i1] - grid[j1 * G + i]) * fx;
    return top + (bottom - top) * fy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * P, v = (y / size) * P;
      const warp = at(warpLow, x, y) + periodic(u * 4, v * 4, P * 4, 3) * 0.3;
      /** Veins run on the diagonal; whole turns across the tile, so they meet themselves at the edges. */
      const a = Math.abs(Math.sin(((x + y) / size) * Math.PI * 2 + warp * 0.95));
      const b = Math.abs(Math.sin(((x - 2 * y) / size) * Math.PI * 2 + warp * 1.4 + 1.3));
      const hair = Math.abs(Math.sin(((3 * x + y) / size) * Math.PI * 2 + warp * 2.2 + 0.4));
      /**
       * How much vein is here: each family fades in and out along its length,
       * thick in places and gone in others, the way stone is.
       */
      const fa = at(fadeA, x, y), fb = at(fadeB, x, y);
      const widthA = 0.012 + 0.03 * fa;
      const vein = Math.max(0, 1 - a / widthA) * fa * 0.85 + Math.max(0, 1 - b / 0.012) * fb * 0.5
        + Math.max(0, 1 - hair / 0.006) * fb * 0.22;
      /** And the soft gold the big veins bleed into the stone either side of them. */
      const bloom = Math.max(0, 1 - a / 0.2) ** 2 * fa * 0.55;
      const l = 0.955 + at(cloud, x, y) * 0.03;
      let r = l, g = l * 0.978, bl = l * 0.948;
      r -= bloom * 0.02; g -= bloom * 0.06; bl -= bloom * 0.14;
      const k = Math.min(1, vein);
      r += (0.62 - r) * k * 0.4; g += (0.61 - g) * k * 0.4; bl += (0.59 - bl) * k * 0.4;
      const i = (y * size + x) * 4;
      img.data[i] = Math.round(255 * Math.min(1, r));
      img.data[i + 1] = Math.round(255 * Math.min(1, g));
      img.data[i + 2] = Math.round(255 * Math.min(1, bl));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return texture(GFX, c.el, { wrap: true });
}

/**
 * Bottle-green glazed tile, laid like subway tile: every tile its own depth of
 * green, pooled darker where the glaze ran thick at the bottom edge and bright
 * along the top where it thinned over the bevel, in dark grout. The wall a
 * bistro kitchen is painted against.
 */
export function greenTileTexture(GFX, { width = 1024, height = 512, seed = 3 } = {}) {
  const c = canvas(width, height);
  if (!c) return null;
  const { ctx } = c;
  const random = seeded(seed);
  ctx.fillStyle = '#1b1d18';
  ctx.fillRect(0, 0, width, height);
  const tw = width / 8, th = height / 8;
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 ? tw / 2 : 0;
    for (let col = -1; col < 9; col++) {
      const x = col * tw + offset, y = row * th;
      const t = random();
      const r = 22 + t * 16, g = 64 + t * 26, b = 48 + t * 16;
      const grad = ctx.createLinearGradient(x, y, x, y + th);
      grad.addColorStop(0, `rgb(${r + 34},${g + 44},${b + 34})`);
      grad.addColorStop(0.12, `rgb(${r + 8},${g + 10},${b + 8})`);
      grad.addColorStop(0.7, `rgb(${r},${g},${b})`);
      grad.addColorStop(1, `rgb(${r - 12},${g - 26},${b - 18})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, tw - 6, th - 6, 6);
      ctx.fill();
      /** The glaze is never quite even: a few soft pools of deeper colour on every tile. */
      for (let k = 0; k < 5; k++) {
        const px = x + 8 + random() * (tw - 16), py = y + 8 + random() * (th - 16), pr = 8 + random() * 22;
        const pool = ctx.createRadialGradient(px, py, 0, px, py, pr);
        pool.addColorStop(0, `rgba(6,30,20,${0.12 + random() * 0.14})`);
        pool.addColorStop(1, 'rgba(6,30,20,0)');
        ctx.fillStyle = pool;
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      /** The bevel catching the light along the top and down one side. */
      ctx.strokeStyle = 'rgba(210,235,215,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 4.5);
      ctx.lineTo(x + tw - 8, y + 4.5);
      ctx.stroke();
    }
  }
  return texture(GFX, c.el, { wrap: true });
}

/** Brushed metal: fine streaks one way, for the trim round the range. */
export function brushedTexture(GFX, size = 512, base = '#9da0a3') {
  const c = canvas(size);
  if (!c) return null;
  const { ctx } = c;
  const random = seeded(11);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let k = 0; k < 1400; k++) {
    const y = random() * size;
    const l = 40 + random() * 260;
    const x = random() * size;
    const v = random() < 0.5 ? 255 : 60;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.03 + random() * 0.05})`;
    ctx.lineWidth = 0.6 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + l, y + (random() - 0.5) * 1.5);
    ctx.stroke();
  }
  return texture(GFX, c.el, { wrap: true });
}

