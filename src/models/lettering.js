/**
 * Lettering: block capitals drawn as strokes, each glyph a list of lines
 * [x0, y0, x1, y1] in a box one wide and one tall, and a painter that lays
 * a line of them on any flat face of a sculpt — a label, a stencil, a pass.
 */

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const GLYPHS = {
  A: [[0, 0, 0.5, 1], [0.5, 1, 1, 0], [0.2, 0.42, 0.8, 0.42]],
  B: [[0, 0, 0, 1], [0, 1, 0.75, 1], [0.75, 1, 0.75, 0.55], [0, 0.52, 0.85, 0.52], [0.85, 0.52, 0.85, 0], [0.85, 0, 0, 0]],
  C: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0]],
  D: [[0, 0, 0, 1], [0, 1, 0.65, 1], [0.65, 1, 1, 0.7], [1, 0.7, 1, 0.3], [1, 0.3, 0.65, 0], [0.65, 0, 0, 0]],
  E: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0.5, 0.7, 0.5]],
  F: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0.5, 0.7, 0.5]],
  G: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0.45], [1, 0.45, 0.5, 0.45]],
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]],
  I: [[0.5, 0, 0.5, 1], [0.15, 1, 0.85, 1], [0.15, 0, 0.85, 0]],
  K: [[0, 0, 0, 1], [1, 1, 0, 0.45], [0.3, 0.6, 1, 0]],
  L: [[0, 1, 0, 0], [0, 0, 1, 0]],
  M: [[0, 0, 0, 1], [0, 1, 0.5, 0.45], [0.5, 0.45, 1, 1], [1, 1, 1, 0]],
  N: [[0, 0, 0, 1], [0, 1, 1, 0], [1, 0, 1, 1]],
  O: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0]],
  P: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0, 0.5]],
  R: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0, 0.5], [0.4, 0.5, 1, 0]],
  S: [[1, 1, 0, 1], [0, 1, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0.5, 1, 0], [1, 0, 0, 0]],
  T: [[0, 1, 1, 1], [0.5, 1, 0.5, 0]],
  U: [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 1]],
  V: [[0, 1, 0.5, 0], [0.5, 0, 1, 1]],
  W: [[0, 1, 0.2, 0], [0.2, 0, 0.5, 0.6], [0.5, 0.6, 0.8, 0], [0.8, 0, 1, 1]],
  Y: [[0, 1, 0.5, 0.5], [1, 1, 0.5, 0.5], [0.5, 0.5, 0.5, 0]],
  J: [[1, 1, 1, 0.2], [1, 0.2, 0.75, 0], [0.75, 0, 0.25, 0], [0.25, 0, 0, 0.25]],
  Q: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0], [0.6, 0.3, 1.05, -0.12]],
  X: [[0, 0, 1, 1], [0, 1, 1, 0]],
  Z: [[0, 1, 1, 1], [1, 1, 0, 0], [0, 0, 1, 0]],
  0: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0], [1, 1, 0, 0]],
  1: [[0.2, 0.8, 0.5, 1], [0.5, 1, 0.5, 0], [0.2, 0, 0.8, 0]],
  2: [[0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0, 0.5], [0, 0.5, 0, 0], [0, 0, 1, 0]],
  3: [[0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0], [0.25, 0.5, 1, 0.5]],
  4: [[0, 1, 0, 0.45], [0, 0.45, 1, 0.45], [0.75, 1, 0.75, 0]],
  5: [[1, 1, 0, 1], [0, 1, 0, 0.55], [0, 0.55, 1, 0.55], [1, 0.55, 1, 0], [1, 0, 0, 0]],
  6: [[1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5]],
  7: [[0, 1, 1, 1], [1, 1, 0.35, 0]],
  8: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0.5, 1, 0.5]],
  9: [[1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0.5], [0, 0.5, 1, 0.5]],
  '!': [[0.5, 1, 0.5, 0.3], [0.5, 0.04, 0.5, 0]],
  '-': [[0.15, 0.5, 0.85, 0.5]],
  '.': [[0.5, 0.03, 0.5, 0]],
  '/': [[0, 0, 1, 1]],
  '#': [[0.3, 0, 0.4, 1], [0.6, 0, 0.7, 1], [0, 0.32, 1, 0.32], [0, 0.68, 1, 0.68]],
};

/**
 * Paints `text` on the sculpt `s`, as strokes on a plane: `at` the middle of
 * its foot line, `right` and `up` the directions it reads along and stands
 * up (unit, at right angles), `size` how tall a capital is and `width` half
 * a stroke's thickness. Only the surface within `depth` of the plane takes
 * it, on the side `right` × `up` faces (both sides if `both`). `slant`
 * leans it like handwriting; `wobble` makes the strokes uneven, as a hand
 * does; `align` is 'center', 'left' or 'right'; `spacing` the gap between
 * letters as a share of their height. Returns how wide it came out.
 */
export function letters(s, text, { at, right = [1, 0, 0], up = [0, 1, 0], size = 0.02, width = size * 0.12, color = '#f4f2ee', depth = 0.01, both = false, slant = 0, wobble = 0, align = 'center', spacing = 0.32, aspect = 0.72, soft = Math.min(0.001, width * 0.4) }) {
  const w = size * aspect, gap = size * spacing, n = text.length, total = n * w + (n - 1) * gap;
  const x0 = align === 'left' ? 0 : align === 'right' ? -total : -total / 2;
  const normal = cross(right, up);
  const segs = [];
  [...text].forEach((ch, i) => {
    const ox = x0 + i * (w + gap);
    (GLYPHS[ch] ?? []).forEach(([ax, ay, bx, by], k) => {
      const jig = wobble ? (Math.sin(i * 12.9 + k * 7.3) * wobble) : 0;
      segs.push([ox + (ax + ay * slant) * w, (ay + jig) * size, ox + (bx + by * slant) * w, (by - jig) * size]);
    });
  });
  if (!segs.length) return total;
  const lo = [x0 - width * 2, -size * 0.25], hi = [x0 + total + width * 2 + size * slant, size * 1.25];
  s.paint((p) => {
    const q = sub(p, at), u = dot(q, right), v = dot(q, up), d = dot(q, normal);
    const off = both ? Math.abs(d) - depth : Math.max(-d, d - depth);
    if (off > 0 || u < lo[0] || u > hi[0] || v < lo[1] || v > hi[1]) return Math.max(off, 0.01);
    let best = Infinity;
    for (const [ax, ay, bx, by] of segs) {
      const dx = bx - ax, dy = by - ay, qx = u - ax, qy = v - ay;
      const t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (dx * dx + dy * dy || 1)));
      const e = Math.hypot(qx - dx * t, qy - dy * t);
      if (e < best) best = e;
    }
    return best - width;
  }, color, soft);
  return total;
}

/**
 * Paints a flat shape on a face, as `letters` does: a rectangle `size`
 * ([half width, half height]) about `at`, its corners rounded by `round`.
 */
export function plate(s, color, { at, right = [1, 0, 0], up = [0, 1, 0], size, round = 0, depth = 0.01, both = false, soft = 0.0008 }) {
  const normal = cross(right, up);
  s.paint((p) => {
    const q = sub(p, at), u = dot(q, right), v = dot(q, up), d = dot(q, normal);
    const off = both ? Math.abs(d) - depth : Math.max(-d, d - depth);
    if (off > 0) return Math.max(off, 0.01);
    const ex = Math.abs(u) - size[0] + round, ey = Math.abs(v) - size[1] + round;
    return Math.min(Math.max(ex, ey), 0) + Math.hypot(Math.max(ex, 0), Math.max(ey, 0)) - round;
  }, color, soft);
}
