/**
 * The shell garments as Blender's cloth solver drapes them on him
 * (scripts/blender/bake_drape.py): each is cut from the skin and lifted off
 * it, and then every point of it is moved to where that cloth settles, let
 * out and hanging under its own weight against his body. The move is baked
 * on the body's UV layout (data/drape.js), which the shell garments share,
 * so it holds whatever detail a garment is built at.
 */
import { decode } from './basemesh.js';
import { DRAPE, RANGE, SIZE } from './data/drape.js';

const cache = new Map();

/** The garment `name`'s moves, SIZE² × 3 (x, y, z, metres) on the layout; null if none is baked. */
function moves(name) {
  if (!DRAPE[name]) return null;
  if (!cache.has(name)) {
    const { x, y, w, h, data } = DRAPE[name];
    const bytes = decode(data, Uint8Array);
    const M = new Float32Array(SIZE * SIZE * 3);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        for (let k = 0; k < 3; k++) M[((y + r) * SIZE + x + c) * 3 + k] = ((bytes[(r * w + c) * 3 + k] - 128) / 127) * RANGE;
      }
    }
    cache.set(name, M);
  }
  return cache.get(name);
}

/** The move at a UV, filtered between texels. */
function moveAt(M, u, v, out) {
  const fx = Math.max(0, Math.min(SIZE - 1.001, u * SIZE - 0.5)), fy = Math.max(0, Math.min(SIZE - 1.001, (1 - v) * SIZE - 0.5));
  const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y;
  const o = (y * SIZE + x) * 3, row = SIZE * 3;
  for (let k = 0; k < 3; k++) {
    out[k] = (M[o + k] * (1 - tx) + M[o + 3 + k] * tx) * (1 - ty) + (M[o + row + k] * (1 - tx) + M[o + row + 3 + k] * tx) * ty;
  }
  return out;
}

/** Whether the garment `name` has a drape baked. */
export const draped = (name) => !!DRAPE[name];

/**
 * Moves the points of `parts` (the garment `name`, as cut) to where its cloth settles. A point
 * cut twice (either side of a UV seam, an edge's two faces) moves once, by the mean of its UVs'
 * moves, so the garment never opens along a seam. Returns `parts`.
 */
export function drape(parts, name) {
  const M = moves(name);
  if (!M) return parts;
  const at = new Map(), m = [0, 0, 0];
  const key = (p, i) => `${Math.round(p[i] * 1e5)},${Math.round(p[i + 1] * 1e5)},${Math.round(p[i + 2] * 1e5)}`;
  for (const part of parts) {
    for (let i = 0; i < part.count; i++) {
      const k = key(part.pos, i * 3);
      moveAt(M, part.uv[i * 2], part.uv[i * 2 + 1], m);
      const s = at.get(k) ?? [0, 0, 0, 0];
      s[0] += m[0]; s[1] += m[1]; s[2] += m[2]; s[3]++;
      at.set(k, s);
    }
  }
  for (const part of parts) {
    for (let i = 0; i < part.count; i++) {
      const s = at.get(key(part.pos, i * 3));
      for (let a = 0; a < 3; a++) part.pos[i * 3 + a] += s[a] / s[3];
    }
  }
  return parts;
}
