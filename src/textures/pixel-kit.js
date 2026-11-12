/**
 * What the painters of surfaces (textures/road, textures/ground,
 * textures/roofing) are made with: pixels to paint on with no canvas, so a
 * texture can be made (and tested) under node; a stone to lay into them, with
 * its facets, its light and the shadow it throws; a wandering crack; and the
 * step that puts finished pixels on a canvas as a colour map and a bump map.
 * Everything wraps, so what is painted tiles.
 */
import { canvas, texture } from './painters.js';

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const ramp = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A hash of a pixel to [0, 1): the fine grain that needs no field. */
export function hash(x, y, seed) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** The pixels being painted: colour (0 to 255, three floats), and a height (0 to 1). */
export class Pixels {
  constructor(size) {
    this.size = size;
    this.r = new Float32Array(size * size);
    this.g = new Float32Array(size * size);
    this.b = new Float32Array(size * size);
    this.h = new Float32Array(size * size);
  }

  at(x, y) {
    const n = this.size;
    return (((y % n) + n) % n) * n + (((x % n) + n) % n);
  }

  /** Mixes `rgb` into a pixel by `t`, and the height by the same. */
  put(x, y, rgb, height, t) {
    const i = this.at(x, y);
    this.r[i] += (rgb[0] - this.r[i]) * t;
    this.g[i] += (rgb[1] - this.g[i]) * t;
    this.b[i] += (rgb[2] - this.b[i]) * t;
    this.h[i] += (height - this.h[i]) * t;
  }

  /** The finished pixels. */
  bake() {
    const n = this.size * this.size;
    const color = new Uint8ClampedArray(n * 4), height = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) {
      color[i * 4] = this.r[i]; color[i * 4 + 1] = this.g[i]; color[i * 4 + 2] = this.b[i]; color[i * 4 + 3] = 255;
      height[i] = clamp(this.h[i]) * 255;
    }
    return { size: this.size, color, height };
  }
}

/**
 * One stone, laid into the surface: an irregular outline (a ring of three
 * lobes), stretched and turned, domed, its flat facets lit from one side and
 * its rim darkened, with the odd bright fleck of mica or quartz in it, and the
 * contact shadow it throws on what it lies in. A tiny grain takes a cheaper
 * way: a soft dome lit from one side, no outline to compute.
 */
const LIGHT = -2.2, LX = Math.cos(LIGHT), LY = Math.sin(LIGHT);
export function grain(s, cx, cy, R, rnd, { rgb, top, base, elong = 1, speck = 0.12, shadow = 0.55 }) {
  const x0 = Math.floor(cx), y0 = Math.floor(cy);
  if (R < 1.9) {
    const reach = Math.ceil(R * Math.max(elong, 1)) + 1;
    for (let j = -reach; j <= reach; j++) {
      for (let i = -reach; i <= reach; i++) {
        const dx = x0 + i + 0.5 - cx, dy = y0 + j + 0.5 - cy;
        const d = Math.hypot(dx, dy / elong);
        const t = d / R;
        if (t > 1.3) continue;
        if (t > 1) {
          // The shadow on the binder, on the side away from the light.
          const k = s.at(x0 + i, y0 + j);
          const away = clamp(-(dx * LX + dy * LY) / (d || 1), 0, 1);
          const dark = 1 - (1.3 - t) * 1.2 * shadow * (0.35 + away);
          s.r[k] *= dark; s.g[k] *= dark; s.b[k] *= dark;
          continue;
        }
        const dome = 1 - t * t;
        const k = 0.66 + 0.3 * dome + 0.2 * (dx * LX + dy * LY) / R * (1 - dome * 0.4);
        s.put(x0 + i, y0 + j, [rgb[0] * k, rgb[1] * k, rgb[2] * k], base + dome * top, clamp((R - d) + 0.5));
      }
    }
    return;
  }
  const turn = rnd() * Math.PI, c = Math.cos(turn), sn = Math.sin(turn);
  const l1 = 0.1 + rnd() * 0.12, l2 = 0.06 + rnd() * 0.08, l3 = 0.03 + rnd() * 0.05;
  const p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28;
  const facets = 3 + Math.floor(rnd() * 4), fp = rnd() * 6.28;
  // Crushed stone is angular: the outline is a polygon of five to eight sides, rounded a little at its corners and broken by the lobes.
  const sides = 5 + Math.floor(rnd() * 4), sp = rnd() * 6.28, angular = 0.55 + rnd() * 0.3, wedge = 6.2832 / sides;
  const reach = Math.ceil(R * Math.max(elong, 1) * 1.5) + 2;
  for (let j = -reach; j <= reach; j++) {
    for (let i = -reach; i <= reach; i++) {
      const dx = x0 + i + 0.5 - cx, dy = y0 + j + 0.5 - cy;
      const u = dx * c + dy * sn, v = (-dx * sn + dy * c) * elong;
      const d = Math.hypot(u, v);
      const a = Math.atan2(v, u);
      const lobes = 1 + l1 * Math.sin(2 * a + p1) + l2 * Math.sin(3 * a + p2) + l3 * Math.sin(5 * a + p3);
      const into = ((a + sp) % wedge + wedge) % wedge - wedge / 2;
      const poly = Math.cos(wedge / 2) / Math.cos(into) * 1.08;
      const edge = R * lobes * lerp(1, poly, angular);
      const t = d / edge;
      if (t > 1.35) continue;
      if (t > 1) {
        // The contact shadow: a dark halo, deepest on the side away from the light.
        const k = s.at(x0 + i, y0 + j);
        const away = clamp(-(dx * LX + dy * LY) / (Math.hypot(dx, dy) || 1), 0, 1);
        const dark = 1 - (1.35 - t) * 1.1 * shadow * (0.3 + away);
        s.r[k] *= dark; s.g[k] *= dark; s.b[k] *= dark;
        continue;
      }
      const cover = clamp((edge - d) + 0.5);
      if (cover <= 0) continue;
      const dome = 1 - t * t;
      // Flat facets: the face of the stone turns every so often, and each takes the light differently.
      const facet = Math.floor(((a + fp) / 6.2832 + 4) * facets) % facets;
      const lit = 0.5 + 0.5 * Math.cos(a - LIGHT) * (1 - dome * 0.55) + (facet % 2 ? 0.07 : -0.05);
      let k = 0.52 + 0.4 * dome + 0.34 * (lit - 0.5);
      if (t > 0.8) k *= 1 - (t - 0.8) * 1.6;
      const fleck = hash(x0 + i, y0 + j, 91);
      k *= fleck > 0.94 ? 1 + speck * 3 : fleck < 0.07 ? 1 - speck * 2.4 : 1 + (fleck - 0.5) * speck * 0.8;
      s.put(x0 + i, y0 + j, [rgb[0] * k, rgb[1] * k, rgb[2] * k], base + dome * top, cover);
    }
  }
}

/** A thin wandering line, stamped into a mask with wrap: a crack, with its branches. */
export function wander(mask, size, rnd, x, y, heading, length, width, depth, branch, wobble = 0.34) {
  let a = heading;
  const stepLen = 1.2;
  for (let n = 0, steps = Math.floor(length / stepLen); n < steps; n++) {
    a += (rnd() - 0.5) * wobble + Math.sin(n * 0.045 + heading * 3) * 0.045;
    x += Math.cos(a) * stepLen; y += Math.sin(a) * stepLen;
    const w = width * (1 - (n / steps) * 0.55) * (0.8 + rnd() * 0.4);
    const reach = Math.ceil(w + 1);
    for (let j = -reach; j <= reach; j++) {
      for (let i = -reach; i <= reach; i++) {
        const d = Math.hypot(i + (x % 1), j + (y % 1)) / w;
        if (d > 1) continue;
        const k = (1 - d * d) * depth;
        const px = ((Math.floor(x) + i) % size + size) % size, py = ((Math.floor(y) + j) % size + size) % size;
        if (k > mask[py * size + px]) mask[py * size + px] = k;
      }
    }
    if (branch > 0 && n > 12 && rnd() < 0.018 * branch) wander(mask, size, rnd, x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.7), (steps - n) * stepLen * (0.25 + rnd() * 0.45), width * 0.62, depth, branch - 1, wobble);
  }
}

export function pickStone(r, table) {
  let t = r * table.reduce((a, s) => a + s.w, 0);
  for (const s of table) { t -= s.w; if (t <= 0) return s.rgb; }
  return table[0].rgb;
}

const lazy = new WeakMap();

/** Pixels on a canvas: a colour map of its own and a bump map, both wrapping. */
export function onCanvas(GFX, pixels) {
  const [color, cctx] = canvas(pixels.size);
  cctx.putImageData(new ImageData(pixels.color, pixels.size, pixels.size), 0, 0);
  const grey = new Uint8ClampedArray(pixels.size * pixels.size * 4);
  for (let i = 0; i < pixels.height.length; i++) { grey[i * 4] = grey[i * 4 + 1] = grey[i * 4 + 2] = pixels.height[i]; grey[i * 4 + 3] = 255; }
  const [height, hctx] = canvas(pixels.size);
  hctx.putImageData(new ImageData(grey, pixels.size, pixels.size), 0, 0);
  return { map: texture(GFX, color, { wrap: true }), bump: texture(GFX, height, { srgb: false, wrap: true }) };
}

export function made(GFX, key, paint, options) {
  if (typeof document === 'undefined') return { map: null, bump: null };
  let cache = lazy.get(GFX);
  if (!cache) { cache = new Map(); lazy.set(GFX, cache); }
  const k = `${key}:${JSON.stringify(options)}`;
  if (!cache.has(k)) cache.set(k, onCanvas(GFX, paint(options)));
  return cache.get(k);
}

