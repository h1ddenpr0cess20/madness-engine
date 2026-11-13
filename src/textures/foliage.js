/**
 * Foliage for leaf cards: a 2 by 2 atlas of sprays, each a twig from the bottom middle of its square with leaves
 * (or needles) along it, on a clear ground. The trees in flora.js (`leafy`, `spruce`) lay their cards over one
 * square of it each. Painted in pale, nearly grey green, light and dark leaf by leaf, so the vertex colour (a
 * tree's own green) gives the hue and the texture the leaves.
 *
 *     const map = foliageTexture(GFX, 'broad');   // or 'needle'
 *     new GFX.MeshStandardMaterial({ map, alphaTest: 0.5, vertexColors: true });
 *
 * The clear ground takes the colour of the leaves round it, so a mip level that blends in a clear pixel does not
 * darken the edge of a leaf.
 */
import { prng } from './pixel-kit.js';

/** The atlas as pixels: `{ size, data }`, RGBA, `size` square. Pure, for node and the page alike. */
export function paintFoliage({ size = 512, kind = 'broad', seed = 1 } = {}) {
  const n = size, half = n >> 1;
  const r = new Float32Array(n * n), g = new Float32Array(n * n), b = new Float32Array(n * n), a = new Float32Array(n * n);
  const put = (x, y, rgb, alpha = 1) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    const i = y * n + x;
    r[i] = rgb[0]; g[i] = rgb[1]; b[i] = rgb[2]; a[i] = Math.max(a[i], alpha);
  };
  /** A twig: a line from p to q, `w` pixels across. */
  const line = (p, q, w, rgb, x0, y0) => {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), steps = Math.ceil(L * 1.5) + 1;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, ww = w * (1 - 0.5 * t);
      for (let dy = -ww; dy <= ww; dy += 0.5) for (let dx = -ww; dx <= ww; dx += 0.5) if (dx * dx + dy * dy <= ww * ww) {
        const px = x + dx, py = y + dy;
        if (px >= x0 && px < x0 + half && py >= y0 && py < y0 + half) put(px, py, rgb);
      }
    }
  };
  /** A leaf: from its stalk at `p`, `len` long along angle `ang`, `wid` across at its widest, pointed, with a midrib. */
  const leaf = (p, ang, len, wid, shade, x0, y0) => {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const R = Math.ceil(len + wid);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const t = (dx * ca + dy * sa) / len, s = (-dx * sa + dy * ca) / wid;
      if (t < 0 || t > 1) continue;
      const edge = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.75) * (1 - 0.25 * t);
      if (Math.abs(s) > edge) continue;
      const px = p[0] + dx, py = p[1] + dy;
      if (px < x0 || px >= x0 + half || py < y0 || py >= y0 + half) continue;
      // Lit on one side of the midrib, darker toward the rim and down the rib itself.
      const rim = Math.abs(s) / (edge || 1), side = s > 0 ? 1.04 : 0.9, rib = Math.abs(s) < 0.09 ? 0.8 : 1;
      const k = shade * side * rib * (1 - 0.22 * rim * rim);
      put(px, py, [205 * k, 228 * k, 182 * k]);
    }
  };
  for (let q = 0; q < 4; q++) {
    const x0 = (q % 2) * half, y0 = Math.floor(q / 2) * half, rnd = prng(seed * 977 + q * 131 + (kind === 'needle' ? 7 : 0));
    const base = [x0 + half / 2, y0 + half - 4];
    const twig = [110, 96, 80];
    if (kind === 'needle') {
      // A spray of fir: a stem up the middle and side shoots, each thick with short needles both sides.
      const shoot = (p, ang, len, depth) => {
        const q2 = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len];
        line(p, q2, depth ? 1.1 : 1.8, twig, x0, y0);
        const count = Math.floor(len / 2.2);
        for (let k = 0; k < count; k++) {
          const t = k / count, x = p[0] + (q2[0] - p[0]) * t, y = p[1] + (q2[1] - p[1]) * t;
          const nl = (depth ? 12 : 15) * (1 - 0.4 * t) * (0.8 + 0.4 * rnd());
          for (const side of [-1, 1]) {
            const na = ang + side * (0.9 + 0.3 * rnd()) - 0.25 * side * t;
            const shade = 0.72 + 0.3 * rnd();
            line([x, y], [x + Math.cos(na) * nl, y + Math.sin(na) * nl], 1.4, [150 * shade, 182 * shade, 150 * shade], x0, y0);
          }
        }
        if (depth < 1) for (let k = 1; k < 8; k++) {
          const t = k / 8.4, x = p[0] + (q2[0] - p[0]) * t, y = p[1] + (q2[1] - p[1]) * t;
          for (const side of [-1, 1]) shoot([x, y], ang + side * (0.95 + 0.25 * rnd()), len * (0.55 - 0.3 * t) * (0.8 + 0.4 * rnd()), depth + 1);
        }
      };
      shoot(base, -Math.PI / 2 + (rnd() - 0.5) * 0.2, half * 0.86, 0);
    } else {
      // A twig of a broadleaf: a stem that forks, and leaves on stalks along each part, the most toward the tips.
      const stems = [];
      const fork = (p, ang, len, depth) => {
        const q2 = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len];
        line(p, q2, 2.4 - depth * 0.7, twig, x0, y0);
        stems.push([p, q2, depth]);
        if (depth < 2) for (const side of [-1, 1]) fork([p[0] + (q2[0] - p[0]) * 0.55, p[1] + (q2[1] - p[1]) * 0.55], ang + side * (0.5 + 0.35 * rnd()), len * (0.62 + 0.15 * rnd()), depth + 1);
      };
      fork(base, -Math.PI / 2 + (rnd() - 0.5) * 0.3, half * 0.48, 0);
      // The leaves: big ones first, so the small ones near the tips lie over them.
      const leaves = [];
      for (const [p, q2, depth] of stems) {
        const count = depth === 0 ? 6 : 7;
        for (let k = 0; k < count; k++) {
          const t = 0.25 + 0.75 * (k / (count - 1)), x = p[0] + (q2[0] - p[0]) * t, y = p[1] + (q2[1] - p[1]) * t;
          const along = Math.atan2(q2[1] - p[1], q2[0] - p[0]);
          const side = k % 2 ? 1 : -1;
          leaves.push({ p: [x, y], ang: along + side * (0.55 + 0.5 * rnd()), len: half * (0.17 + 0.06 * rnd()) * (depth ? 0.9 : 1.05), shade: 0.66 + 0.4 * rnd() });
        }
        leaves.push({ p: q2, ang: Math.atan2(q2[1] - p[1], q2[0] - p[0]) + (rnd() - 0.5) * 0.4, len: half * 0.18, shade: 0.8 + 0.25 * rnd() });
      }
      leaves.sort((u, v) => v.len - u.len);
      for (const l of leaves) leaf(l.p, l.ang, l.len, l.len * 0.42, l.shade, x0, y0);
    }
  }
  // The clear ground: the colour of the nearest leaves, spread out a few times, so the mips keep the leaves' colour.
  for (let pass = 0; pass < 8; pass++) {
    const fill = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (a[i] > 0 || r[i] > 0) continue;
      let sr = 0, sg = 0, sb = 0, c = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const j = yy * n + xx;
        if (a[j] > 0 || r[j] > 0) { sr += r[j]; sg += g[j]; sb += b[j]; c++; }
      }
      if (c) fill.push([i, sr / c, sg / c, sb / c]);
    }
    for (const [i, sr, sg, sb] of fill) { r[i] = sr || 1; g[i] = sg; b[i] = sb; }
  }
  // Past that, the leaves' mean colour.
  let mr = 0, mg = 0, mb = 0, mc = 0;
  for (let i = 0; i < n * n; i++) if (a[i] > 0) { mr += r[i]; mg += g[i]; mb += b[i]; mc++; }
  for (let i = 0; i < n * n; i++) if (!a[i] && !r[i]) { r[i] = mr / (mc || 1); g[i] = mg / (mc || 1); b[i] = mb / (mc || 1); }
  const data = new Uint8ClampedArray(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    data[i * 4] = r[i]; data[i * 4 + 1] = g[i]; data[i * 4 + 2] = b[i]; data[i * 4 + 3] = a[i] > 0 ? 255 : 0;
  }
  return { size: n, data };
}

/** How much of the atlas is leaf (0 to 1). */
export function coverOf({ size, data }) {
  let on = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]) on++;
  return on / (size * size);
}

const cache = new Map();

/** The atlas as a texture (`'broad'` or `'needle'`), made once a kind. */
export function foliageTexture(GFX, kind = 'broad', { size = 512, seed = 1 } = {}) {
  const key = `${kind}:${size}:${seed}`;
  if (cache.has(key)) return cache.get(key);
  const { data } = paintFoliage({ size, kind, seed });
  let t;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').putImageData(new ImageData(data, size, size), 0, 0);
    t = new GFX.CanvasTexture(c);
  } else {
    t = new GFX.DataTexture(data, size, size);
    t.needsUpdate = true;
  }
  t.colorSpace = GFX.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}
