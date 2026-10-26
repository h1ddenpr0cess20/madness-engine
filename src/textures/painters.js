/**
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

export const textures = new Map();

/** A seeded random source, so every venue is painted the same. */
export function random(seed) {
  let s = (seed >>> 0) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function texture(GFX, c, { srgb = true, wrap = false } = {}) {
  const t = new GFX.CanvasTexture(c);
  if (srgb) t.colorSpace = GFX.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = GFX.RepeatWrapping;
  return t;
}

export const none = () => ({ map: null, bump: null });

/** A texture of its own over the same canvas, for something that turns or scrolls its texture by itself. */
export function copyOf(GFX, tex) {
  if (!tex) return null;
  const t = new GFX.CanvasTexture(tex.image);
  t.colorSpace = tex.colorSpace;
  t.anisotropy = tex.anisotropy;
  t.wrapS = t.wrapT = GFX.RepeatWrapping;
  return t;
}

export const tiledMaps = new Map();

/**
 * `tex` repeated `rx` by `ry` times over whatever it is on: a texture of its
 * own, sharing the canvas, made once for each size. (Textures here don't
 * clone.) Null if there is no texture, as under node.
 */
export function tiled(GFX, tex, rx, ry = 1) {
  if (!tex) return null;
  const key = `${tex.id}:${rx}:${ry}`;
  if (!tiledMaps.has(key)) {
    const t = new GFX.CanvasTexture(tex.image);
    t.colorSpace = tex.colorSpace;
    t.anisotropy = tex.anisotropy;
    t.wrapS = t.wrapT = GFX.RepeatWrapping;
    t.repeat.set(rx, ry);
    tiledMaps.set(key, t);
  }
  return tiledMaps.get(key);
}

export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

export const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Value noise that wraps every `period` cells, so a texture painted with it tiles. */
export function periodic(seed, period) {
  const rnd = random(seed);
  const grid = Array.from({ length: period * period }, () => rnd());
  const at = (i, j) => grid[(((j % period) + period) % period) * period + (((i % period) + period) % period)];
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y);
    const u = x - i, v = y - j;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * su;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * su;
    return a + (b - a) * sv;
  };
}

/** Fractal noise over a few octaves of `periodic`, 0 to 1, tiling across `cells` cells. */
export function fractal(seed, cells = 4, octaves = 4) {
  const layers = Array.from({ length: octaves }, (_, o) => periodic(seed + o * 101, cells * 2 ** o));
  return (u, v) => {
    let sum = 0, amp = 0.5, total = 0;
    for (let o = 0; o < octaves; o++) {
      sum += layers[o](u * cells * 2 ** o, v * cells * 2 ** o) * amp;
      total += amp;
      amp *= 0.5;
    }
    return sum / total;
  };
}

/** Paints a `size`-square canvas a pixel at a time: `shade(u, v)` gives [r, g, b] each 0 to 255. */
export function pixels(size, shade) {
  const [c, ctx] = canvas(size);
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = shade(x / size, y / size);
      const i = (y * size + x) * 4;
      image.data[i] = r; image.data[i + 1] = g; image.data[i + 2] = b; image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return c;
}

export const grey = (v) => [v, v, v].map((x) => Math.max(0, Math.min(255, x)));

/** A map and a bump map from one pair of painters. */
export function pair(GFX, size, color, height, opts = {}) {
  return { map: texture(GFX, color(size), opts), bump: texture(GFX, height(size), { srgb: false, ...opts }) };
}

// ———————————————————————————————————————————————————————————— floors

/**
 * Poured concrete, a slab to the tile: speckled, stained here and there with
 * oil, joints at two edges, a hairline crack. The garage, the dock, the arena.
 */
export function concrete(GFX) {
  const n = fractal(7, 4, 5), grit = fractal(19, 32, 2), stain = fractal(41, 3, 3);
  const rnd = random(5);
  const cracks = Array.from({ length: 2 }, () => {
    let x = rnd(), y = rnd();
    const pts = [[x, y]];
    for (let k = 0; k < 7; k++) { x += (rnd() - 0.5) * 0.18; y += (rnd() - 0.5) * 0.18; pts.push([x, y]); }
    return pts;
  });
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const base = 0.8 + n(u, v) * 0.14 + (grit(u, v) - 0.5) * 0.1;
      const oil = smoothstep(0.7, 0.9, stain(u, v)) * 0.16;
      const joint = Math.min(u, v) < 0.006 ? 0.8 : 1;
      const k = relief ? 0.55 + n(u, v) * 0.4 + (grit(u, v) - 0.5) * 0.2 : base - oil * 0.8;
      return grey(Math.round(255 * k * joint));
    });
    const ctx = c.getContext('2d');
    ctx.strokeStyle = relief ? '#202020' : 'rgba(40,36,32,0.5)';
    ctx.lineWidth = relief ? 2 : 1.2;
    for (const pts of cracks) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * size, y * size) : ctx.moveTo(x * size, y * size)));
      ctx.stroke();
    }
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Boards, three to the tile, laid end to end: each its own shade, a soft grain, dark thin seams and nail heads. Stage decks and barroom floors. */
export function planks(GFX) {
  const rnd = random(23);
  const boards = Array.from({ length: 3 }, () => ({ tone: 0.8 + rnd() * 0.2, offset: rnd() * 5, butt: 0.15 + rnd() * 0.7 }));
  const grain = fractal(3, 2, 4);
  const paint = (relief) => (size) => {
    const [c, ctx] = canvas(size);
    ctx.fillStyle = relief ? '#000' : '#1a1410';
    ctx.fillRect(0, 0, size, size);
    const w = size / boards.length;
    const img = ctx.getImageData(0, 0, size, size);
    boards.forEach((b, i) => {
      for (let y = 0; y < size; y++) {
        for (let x = Math.floor(i * w) + 1; x < Math.floor((i + 1) * w) - 1; x++) {
          // Long soft figure along the board, with a faint fine grain across it.
          const along = y / size, across = (x - i * w) / w;
          const g = grain(across * 0.7 + i * 1.3, along * 0.25 + b.offset);
          const fine = 0.5 + 0.5 * Math.sin((across * 9 + g * 6) * Math.PI);
          const shade = relief ? 0.55 + g * 0.25 + fine * 0.08 : b.tone * (0.84 + g * 0.2 + fine * 0.04);
          const edge = Math.min(across, 1 - across) < 0.03 ? 0.78 : 1;
          const v = Math.round(255 * Math.min(1, shade * edge));
          const k = (y * size + x) * 4;
          img.data[k] = v; img.data[k + 1] = v; img.data[k + 2] = v; img.data[k + 3] = 255;
        }
      }
    });
    ctx.putImageData(img, 0, 0);
    boards.forEach((b, i) => {
      const x = i * w;
      ctx.fillStyle = relief ? '#000' : '#14100c';
      ctx.fillRect(x + 1, b.butt * size, w - 2, 2);
      ctx.fillStyle = relief ? '#fff' : '#4a3a2c';
      for (const y of [b.butt * size - 10, b.butt * size + 11]) {
        ctx.beginPath(); ctx.arc(x + 9, y, 1.8, 0, 7); ctx.arc(x + w - 9, y, 1.8, 0, 7); ctx.fill();
      }
    });
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Linoleum: two by two squares, light and dark, scuffed and worn at the edges. The dive bar. */
export function checker(GFX) {
  const n = fractal(11, 6, 4);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const cx = Math.floor(u * 2), cy = Math.floor(v * 2);
    const dark = (cx + cy) % 2;
    const fx = (u * 2) % 1, fy = (v * 2) % 1;
    const edge = Math.min(fx, fy, 1 - fx, 1 - fy);
    const wear = n(u, v);
    const grime = smoothstep(0.1, 0.0, edge) * 0.25;
    const base = dark ? 0.42 : 0.96;
    const k = relief ? 0.6 + wear * 0.3 - (edge < 0.012 ? 0.5 : 0) : (base - grime) * (0.84 + wear * 0.26) * (edge < 0.012 ? 0.45 : 1);
    return grey(Math.round(255 * k));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Carpet: a field of woven pile with a diamond pattern laid in it. The theatre. */
export function carpet(GFX) {
  const pile = fractal(31, 48, 2), cloud = fractal(5, 3, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    // Diamonds, a tile across, with a small one inside each.
    const a = Math.abs((u * 2) % 1 - 0.5) + Math.abs((v * 2) % 1 - 0.5);
    const big = smoothstep(0.34, 0.3, a), small = smoothstep(0.14, 0.1, a);
    const line = smoothstep(0.025, 0, Math.abs(a - 0.42));
    const p = pile(u, v);
    const k = relief ? 0.5 + p * 0.5 : (0.7 + 0.18 * big + 0.28 * small + 0.3 * line) * (0.82 + p * 0.3) * (0.92 + cloud(u, v) * 0.14);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Diamond plate: raised lozenges in alternating directions. The loading dock. */
export function plate(GFX) {
  const wear = fractal(13, 5, 4);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const cells = 4;
    const cu = (u * cells) % 1, cv = (v * cells) % 1;
    const flip = (Math.floor(u * cells) + Math.floor(v * cells)) % 2;
    // A lozenge: a thin diamond along one of the diagonals.
    const x = cu - 0.5, y = (flip ? cv : 1 - cv) - 0.5;
    const along = (x + y) * 0.7071, across = (x - y) * 0.7071;
    const d = Math.hypot(along / 0.4, across / 0.095);
    const raised = smoothstep(1, 0.7, d);
    const w = wear(u, v);
    const k = relief ? 0.2 + raised * 0.8 : (0.58 + raised * 0.34) * (0.8 + w * 0.3);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Grass, trodden and thin in patches: a blotchy lawn with blades in it. The festival. */
export function grass(GFX) {
  const patch = fractal(17, 3, 4), blade = fractal(29, 64, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const p = patch(u, v), b = blade(u, v);
    const k = relief ? 0.4 + b * 0.6 : (0.62 + p * 0.38) * (0.74 + b * 0.4);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Dance-floor panels: two by two glossy squares in two shades, a bright bevel round each. The club. */
export function panels(GFX) {
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const cx = Math.floor(u * 2), cy = Math.floor(v * 2);
    const alt = (cx + cy) % 2;
    const fx = (u * 2) % 1, fy = (v * 2) % 1;
    const edge = Math.min(fx, fy, 1 - fx, 1 - fy);
    const bevel = smoothstep(0.1, 0.02, edge);
    const gap = edge < 0.022 ? 1 : 0;
    const k = relief ? 0.7 - gap * 0.7 - bevel * 0.1 : gap ? 0.25 : (alt ? 0.82 : 1) * (0.94 + bevel * 0.12);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Trodden mud: wet brown churned with the prints of a thousand boots. Sticky floors. */
export function mud(GFX) {
  const a = fractal(37, 4, 5), b = fractal(53, 12, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const churn = a(u, v), rut = b(u, v);
    const puddle = smoothstep(0.52, 0.6, churn);
    const k = relief ? 0.35 + churn * 0.5 + rut * 0.2 : (0.7 + rut * 0.3) * (1 - puddle * 0.35);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A belt: dark rubber with a chevron pointing along it (v), which the scenery scrolls. */
export function belt(GFX) {
  const rub = fractal(61, 24, 2);
  const [c, ctx] = canvas(256);
  const image = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = x / 256, v = y / 256;
      // The bright chevron: a V pointing up the texture (toward +v, which is the top row when flipped).
      const w = Math.abs(u - 0.5);
      const line = Math.abs(((1 - v) - 0.15 - w * 0.9) % 0.5);
      const chevron = smoothstep(0.05, 0.02, Math.min(line, 0.5 - line)) * (w < 0.42 ? 1 : 0);
      const k = (0.2 + rub(u, v) * 0.12) + chevron * 0.75;
      const i = (y * 256 + x) * 4;
      const val = Math.round(255 * Math.min(1, k));
      image.data[i] = val; image.data[i + 1] = val; image.data[i + 2] = Math.round(val * 0.9); image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const t = texture(GFX, c, { wrap: true });
  return { map: t, bump: null };
}

/** Wet asphalt: fine black aggregate, a crack or two, and puddles that shine. New York's streets, and London's in the rain. */
export function asphalt(GFX) {
  const n = fractal(131, 6, 4), grit = fractal(137, 48, 2), wet = fractal(139, 3, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const puddle = smoothstep(0.58, 0.66, wet(u, v));
    const speck = grit(u, v) > 0.62 ? 0.18 : 0;
    const k = relief ? 0.5 + (grit(u, v) - 0.5) * 0.5 * (1 - puddle) : (0.62 + n(u, v) * 0.16 + speck) * (1 - puddle * 0.45);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Packed dirt: ruts, hoofprints and pebbles. The bull pen and the stables. */
export function dirt(GFX) {
  const a = fractal(149, 4, 5), b = fractal(151, 20, 3);
  const rnd = random(157);
  const stones = Array.from({ length: 26 }, () => [rnd(), rnd(), 0.006 + rnd() * 0.012]);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    let k = relief ? 0.4 + a(u, v) * 0.4 + b(u, v) * 0.2 : (0.7 + a(u, v) * 0.22) * (0.88 + b(u, v) * 0.18);
    for (const [x, y, r] of stones) {
      const d = Math.hypot(u - x, v - y) / r;
      if (d < 1) k = relief ? 0.6 + (1 - d) * 0.4 : k * (1.12 - d * 0.1);
    }
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Steel grating: a grid of bars over the dark, a seam round the tile. Spaceship decks, catwalks. */
export function grate(GFX) {
  const wear = fractal(163, 5, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 8) % 1, fv = (v * 8) % 1;
    const bar = Math.min(fu, 1 - fu) < 0.14 || Math.min(fv, 1 - fv) < 0.14;
    const edge = Math.min(u, v, 1 - u, 1 - v) < 0.02;
    const k = relief ? (bar || edge ? 0.85 : 0.05) : bar || edge ? 0.72 + wear(u, v) * 0.25 : 0.12;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Cobbles: rounded setts in rows, each a little different, dark between. Old town streets all over Europe. */
export function cobble(GFX) {
  const n = fractal(167, 8, 3);
  const rnd = random(173);
  const tones = Array.from({ length: 64 }, () => 0.75 + rnd() * 0.25);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 4, r = Math.floor(v * rows), fv = (v * rows) % 1;
    const shift = (r % 2) * 0.125;
    const cu = ((u + shift) * 4) % 1, c = Math.floor((u + shift) * 4) % 4;
    const dx = Math.abs(cu - 0.5) * 2, dy = Math.abs(fv - 0.5) * 2;
    const dome = Math.max(0, 1 - Math.pow(dx ** 4 + dy ** 4, 0.25));
    const joint = dome < 0.08;
    const k = relief ? (joint ? 0 : 0.3 + dome * 0.7) : joint ? 0.25 : tones[(r * 4 + c) % tones.length] * (0.8 + dome * 0.2) * (0.9 + n(u, v) * 0.15);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

// ——— the world tour's floors

/** Snow, packed and fresh: soft drifts, a sparkle here and there, footprints of nobody. The Alps. */
export function snow(GFX) {
  const n = fractal(401, 4, 4), g = fractal(403, 40, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const drift = n(u, v), glint = g(u, v) > 0.82 ? 0.06 : 0;
    const k = relief ? 0.35 + drift * 0.65 : 0.78 + drift * 0.16 + glint;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Sand, rippled by the wind: fine grain in long curving ripples. The desert, the beach. */
export function sand(GFX) {
  const n = fractal(411, 3, 3), g = fractal(413, 48, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const ripple = 0.5 + 0.5 * Math.sin((v + n(u, v) * 0.25) * Math.PI * 2 * 6);
    const k = relief ? 0.4 + ripple * 0.4 + (g(u, v) - 0.5) * 0.2 : 0.84 + ripple * 0.08 + (g(u, v) - 0.5) * 0.1;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Tatami: woven rush mats, the weave running one way, a dark cloth binding down two edges. Tokyo. */
export function tatami(GFX) {
  const n = fractal(421, 6, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const binding = u < 0.05 || u > 0.95;
    const weave = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 48) * (0.6 + 0.4 * Math.sin(u * Math.PI * 2 * 3));
    const k = relief ? (binding ? 0.55 : 0.4 + weave * 0.35) : binding ? 0.32 : 0.82 + weave * 0.08 + n(u, v) * 0.06;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Terracotta: square clay tiles, four to the tile, each its own fired shade, in grout. Spain, Italy, the piazzas. */
export function terracotta(GFX) {
  const n = fractal(431, 8, 3);
  const rnd = random(433);
  const tones = Array.from({ length: 16 }, () => 0.78 + rnd() * 0.2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 2) % 1, fv = (v * 2) % 1;
    const joint = Math.min(fu, fv, 1 - fu, 1 - fv) < 0.025;
    const t = tones[Math.floor(u * 2) + Math.floor(v * 2) * 2];
    const k = relief ? (joint ? 0 : 0.6 + n(u, v) * 0.2) : joint ? 0.62 : t * (0.92 + n(u, v) * 0.1);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Marble: polished, with the veins running through it. Palaces, lobbies, St Mark's. */
export function marble(GFX) {
  const n = fractal(441, 3, 5);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const vein = Math.abs(Math.sin((u * 2 + v + n(u, v) * 2.4) * Math.PI * 2));
    const dark = smoothstep(0.08, 0.0, vein) * 0.35;
    const k = relief ? 0.7 : 0.94 - dark + n(u, v) * 0.04;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Copacabana's promenade: the black-and-white waves in little stones. Rio. */
export function mosaic(GFX) {
  const rnd = random(451);
  const jitter = Array.from({ length: 1024 }, () => rnd());
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const wave = Math.sin((u + Math.sin(v * Math.PI * 2) * 0.12) * Math.PI * 2 * 2) > 0;
    const cu = Math.floor(u * 32), cv = Math.floor(v * 32);
    const fu = (u * 32) % 1, fv = (v * 32) % 1;
    const joint = Math.min(fu, fv, 1 - fu, 1 - fv) < 0.09;
    const j = jitter[(cu * 31 + cv) % jitter.length];
    const k = relief ? (joint ? 0.2 : 0.7) : joint ? 0.45 : wave ? 0.12 + j * 0.06 : 0.92 + j * 0.06;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A mountain path: broken rock and grit, darker in the cracks. */
export function scree(GFX) {
  const n = fractal(461, 6, 4), m = fractal(463, 14, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const facet = Math.abs(n(u, v) - 0.5) * 2;
    const crack = smoothstep(0.06, 0.0, facet) * 0.4;
    const k = relief ? 0.3 + facet * 0.6 : 0.7 + facet * 0.2 + (m(u, v) - 0.5) * 0.12 - crack;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

export const FLOORS = { concrete, planks, checker, carpet, plate, grass, panels, mud, asphalt, dirt, grate, cobble, snow, sand, tatami, terracotta, marble, mosaic, scree };

/** Plywood: a sheet to the tile, screwed to the studs, with a stencilled mark. The garage. */
export function plywood(GFX) {
  const grain = fractal(43, 3, 4);
  const rnd = random(9);
  const knots = Array.from({ length: 4 }, () => [rnd(), rnd(), 0.015 + rnd() * 0.02]);
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const g = grain(u * 0.5, v * 6);
      const lines = 0.5 + 0.5 * Math.sin(v * 90 + g * 14);
      let k = relief ? 0.5 + g * 0.3 + lines * 0.1 : 0.62 + g * 0.3 + lines * 0.07;
      for (const [x, y, r] of knots) {
        const d = Math.hypot((u - x) * 1.6, v - y) / r;
        if (d < 1) k *= relief ? 0.7 : 0.62 + 0.38 * d;
      }
      const seam = Math.min(u, 1 - u) < 0.008 || v < 0.006 ? 0.35 : 1;
      return grey(Math.round(255 * Math.min(1, k) * seam));
    });
    const ctx = c.getContext('2d');
    // Screws along the studs.
    ctx.fillStyle = relief ? '#fff' : '#403830';
    for (const x of [16, 128, 240]) for (const y of [20, 100, 180, 240]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Acoustic foam: wedges in a grid, each lit on one side. Practice rooms and studios. */
export function foam(GFX) {
  const sp = fractal(71, 16, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const cells = 4;
    const fu = (u * cells) % 1, fv = (v * cells) % 1;
    // A pyramid in each cell: height falls away from the middle.
    const h = 1 - Math.max(Math.abs(fu - 0.5), Math.abs(fv - 0.5)) * 2;
    const light = 0.55 + (fu - fv) * 0.5 * (1 - h * 0.2);
    const k = relief ? h : (0.3 + h * 0.6 * light) * (0.85 + sp(u, v) * 0.25);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Curtain: deep vertical folds, a tile wide. The stage drapes. */
export function curtain(GFX) {
  const wob = fractal(83, 4, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const f = Math.sin((u * 4 + wob(u, v * 0.2) * 0.6) * Math.PI * 2);
    const fold = 0.5 + 0.5 * f;
    const k = relief ? 0.3 + fold * 0.7 : 0.45 + fold * 0.55 - v * 0.05;
    return grey(Math.round(255 * k));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Corrugated iron: vertical ribs. The dock, the tents. */
export function corrugated(GFX) {
  const rust = fractal(89, 5, 4);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rib = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 8);
    const r = rust(u, v);
    const k = relief ? 0.2 + rib * 0.8 : (0.5 + rib * 0.45) * (0.8 + r * 0.3);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Breeze block: three courses of hollow blocks. */
export function block(GFX) {
  const n = fractal(97, 8, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 3;
    const r = Math.floor(v * rows), fr = (v * rows) % 1;
    const shift = (r % 2) * 0.25;
    const fu = ((u + shift) * 2) % 1;
    const joint = Math.min(fr, 1 - fr) < 0.045 || Math.min(fu, 1 - fu) < 0.03;
    const k = relief ? (joint ? 0 : 0.6 + n(u, v) * 0.3) : joint ? 0.28 : 0.74 + n(u, v) * 0.26;
    return grey(Math.round(255 * k));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Damask paper over panelling, with a gold rail: the theatre's walls. */
export function damask(GFX) {
  const n = fractal(101, 6, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    // A repeating motif: a lozenge with a bud in it.
    const fu = (u * 2) % 1 - 0.5, fv = (v * 2) % 1 - 0.5;
    const d = Math.abs(fu) * 1.4 + Math.abs(fv);
    const motif = smoothstep(0.34, 0.3, d) * (1 - smoothstep(0.2, 0.16, d)) + smoothstep(0.08, 0.04, Math.hypot(fu, fv));
    const rail = v > 0.9 ? 1 : 0;
    const k = relief ? 0.4 + motif * 0.5 + rail * 0.3 : (0.55 + motif * 0.45) * (0.9 + n(u, v) * 0.15) + rail * 0.3;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Tent canvas: wide taut stripes with a seam between, a little sag, stitched. The festival's tents. */
export function canvasWall(GFX) {
  const n = fractal(107, 6, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const f = (u * 3) % 1;
    const stripe = Math.floor(u * 3) % 2;
    const seam = Math.min(f, 1 - f) < 0.012 ? 1 : 0;
    const weave = 0.5 + 0.5 * Math.sin(u * 256 * Math.PI) * Math.sin(v * 256 * Math.PI);
    const sag = 0.94 + 0.06 * Math.sin(f * Math.PI);
    const k = relief ? 0.55 + n(u, v) * 0.2 + weave * 0.15 - seam * 0.3 : (stripe ? 1 : 0.88) * sag * (0.94 + n(u, v) * 0.1 + weave * 0.04) * (1 - seam * 0.2);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Festival hoarding: upright painted slats, two rails, a row of sponsor blocks along the top third. */
export function fence(GFX) {
  const n = fractal(113, 8, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const f = (u * 8) % 1;
    const gap = Math.min(f, 1 - f) < 0.03 ? 1 : 0;
    const rail = Math.abs(v - 0.22) < 0.035 || Math.abs(v - 0.78) < 0.035 ? 1 : 0;
    const block = v > 0.32 && v < 0.62 && Math.floor(u * 2) % 2 === 0 && (u * 2) % 1 > 0.08 && (u * 2) % 1 < 0.92 ? 1 : 0;
    const k = relief ? 0.5 + n(u, v) * 0.2 - gap * 0.4 + rail * 0.25 + block * 0.1 : (0.86 + n(u, v) * 0.16) * (1 - gap * 0.5) * (rail ? 0.72 : 1) * (block ? 0.6 : 1);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Clapboard: overlapping boards laid across, each shadowed under its lip, nailed at the studs. Huts and boathouses. */
export function clapboard(GFX) {
  const grain = fractal(181, 3, 4);
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const boards = 6, f = (v * boards) % 1;
      const lip = smoothstep(0.75, 1, f);
      const g = grain(u * 0.6, v * 6 + Math.floor(v * boards) * 0.37);
      const k = relief ? 0.25 + f * 0.7 : (0.78 + g * 0.2) * (1 - lip * 0.35) * (f < 0.04 ? 0.5 : 1);
      return grey(Math.round(255 * Math.min(1, k)));
    });
    const ctx = c.getContext('2d');
    ctx.fillStyle = relief ? '#fff' : '#3a3028';
    for (const x of [24, 232]) for (let b = 0; b < 6; b++) { ctx.beginPath(); ctx.arc(x, b * (size / 6) + 8, 1.6, 0, 7); ctx.fill(); }
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Stucco: rough plaster, trowel marks, a hairline crack, a darker band at the foot. Paris and Seville, Venice and Rio. */
export function stucco(GFX) {
  const a = fractal(191, 10, 4), b = fractal(193, 3, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rough = a(u, v), swirl = b(u, v);
    const foot = v > 0.86 ? 0.78 : 1;
    const k = relief ? 0.35 + rough * 0.65 : (0.84 + rough * 0.12 + swirl * 0.06) * foot;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A spaceship's hull: four plates to the tile, rivets round each, a vent and a stripe. The sci-fi set. */
export function hull(GFX) {
  const n = fractal(197, 6, 3);
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const fu = (u * 2) % 1, fv = (v * 2) % 1;
      const seam = Math.min(fu, fv, 1 - fu, 1 - fv) < 0.012;
      const stripe = Math.abs(v - 0.5) < 0.035 ? 1 : 0;
      const k = relief ? (seam ? 0 : 0.6 + n(u, v) * 0.1) : seam ? 0.3 : (0.78 + n(u, v) * 0.12) * (stripe ? 0.6 : 1);
      return grey(Math.round(255 * Math.min(1, k)));
    });
    const ctx = c.getContext('2d');
    ctx.fillStyle = relief ? '#fff' : '#9aa0aa';
    for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
      for (const [px, py] of [[10, 10], [118, 10], [10, 118], [118, 118]]) { ctx.beginPath(); ctx.arc(x * 128 + px, y * 128 + py, 2.4, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = relief ? '#000' : '#1a1c22';
    for (let k = 0; k < 5; k++) ctx.fillRect(152, 160 + k * 14, 80, 6);
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Castle stone: big blocks, two courses, each its own size, deep joints, damp at the foot. The horror's halls. */
export function stone(GFX) {
  const n = fractal(211, 6, 4), m = fractal(223, 2, 2);
  const rnd = random(227);
  const tones = Array.from({ length: 12 }, () => 0.72 + rnd() * 0.28);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const r = Math.floor(v * 2), fv = (v * 2) % 1;
    const shift = r ? 0.37 : 0;
    const w = r ? 0.55 : 0.45;
    const cu = (((u + shift) % 1) + 1) % 1;
    const c = cu < w ? 0 : 1;
    const fu = c ? (cu - w) / (1 - w) : cu / w;
    const joint = Math.min(fu, 1 - fu) < 0.025 || Math.min(fv, 1 - fv) < 0.03;
    const damp = 1 - smoothstep(0.6, 1, v) * 0.25 * m(u, v);
    const k = relief ? (joint ? 0 : 0.45 + n(u, v) * 0.5) : joint ? 0.22 : tones[r * 2 + c] * (0.8 + n(u, v) * 0.25) * damp;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/**
 * Ashlar: dressed stone laid in level courses, eight to the tile, each block
 * its own length and its own tone, the arrises a little worn and the joints
 * fine. At a town's scale a tile is about a storey, so a wall shows three or
 * four courses to a storey. The courses tile across and up; with `level`
 * texture coordinates (see the mesher) they run level round a building.
 */
export function ashlar(GFX) {
  const rnd = random(239);
  const pit = fractal(241, 16, 3), weather = fractal(251, 3, 3);
  const courses = 8;
  // Each course is a run of blocks whose lengths add up to one tile, so it wraps.
  const rows = Array.from({ length: courses }, () => {
    const lens = [];
    let sum = 0;
    while (sum < 1) { const l = 0.17 + rnd() * 0.2; lens.push(l); sum += l; }
    const start = rnd();
    let at = start;
    return lens.map((l) => { const b = { u0: at, len: l / sum, tone: 0.8 + rnd() * 0.2, dv: rnd() }; at += l / sum; return b; });
  });
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const r = Math.min(courses - 1, Math.floor(v * courses)), fv = (v * courses) % 1;
    const row = rows[r];
    let blk = row[row.length - 1], fu = 0;
    for (const b of row) { const d = (((u - b.u0) % 1) + 1) % 1; if (d < b.len) { blk = b; fu = d / b.len; break; } }
    // Distance to the nearest joint, in pixels.
    const px = Math.min(fu * blk.len, (1 - fu) * blk.len) * size, py = Math.min(fv, 1 - fv) * (size / courses);
    const e = Math.min(px, py);
    if (e < 1.1) return grey(Math.round(255 * (relief ? 0.08 : 0.5)));
    const arris = smoothstep(1.1, 3.6, e);
    const p = pit(u, v), w = weather(u, v);
    const k = relief ? 0.35 + arris * 0.4 + p * 0.25 : (blk.tone * (0.9 + p * 0.12) * (0.82 + arris * 0.18)) * (0.92 + w * 0.12) * (1 - (blk.dv - 0.5) * fv * 0.06);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/**
 * Rubble: fieldstone laid roughly in courses, the stones lumpy and of every
 * size, mortar thick between them. The footings of cottages, a mine's
 * walling, a smithy, a dovecote, the base of a mill.
 */
export function rubble(GFX) {
  const rnd = random(263);
  const cx = 7, cy = 9;
  // A jittered grid of stone middles that wraps, each with its own tone and a warm or cool cast.
  const cells = Array.from({ length: cx * cy }, () => ({ x: 0.15 + rnd() * 0.7, y: 0.2 + rnd() * 0.6, tone: 0.66 + rnd() * 0.34, cast: rnd() - 0.5 }));
  const grit = fractal(269, 24, 3), lump = fractal(271, 6, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const gx = u * cx, gy = v * cy;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    let d1 = 9, d2 = 9, best = cells[0];
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const c = cells[(((iy + j) % cy + cy) % cy) * cx + (((ix + i) % cx) + cx) % cx];
      // The stones are wider than they are tall: distance across counts for less.
      const dx = (ix + i + c.x - gx) * 0.72, dy = iy + j + c.y - gy;
      const d = Math.hypot(dx, dy) + (lump(u, v) - 0.5) * 0.12;
      if (d < d1) { d2 = d1; d1 = d; best = c; } else if (d < d2) d2 = d;
    }
    const edge = d2 - d1;
    const g = grit(u, v);
    if (edge < 0.07) {
      const k = relief ? 0.05 + g * 0.1 : 0.58 + g * 0.1;
      return grey(Math.round(255 * k));
    }
    const dome = smoothstep(0.07, 0.3, edge);
    const k = relief ? 0.25 + dome * 0.55 + g * 0.2 : best.tone * (0.8 + dome * 0.2) * (0.9 + g * 0.14);
    if (relief) return grey(Math.round(255 * Math.min(1, k)));
    const t = best.cast * 0.08;
    return [Math.round(255 * Math.min(1, k * (1 + t))), Math.round(255 * Math.min(1, k)), Math.round(255 * Math.min(1, k * (1 - t)))];
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/**
 * Bedrock: weathered stone as it lies in the ground, for boulders, outcrops
 * and the faces of a quarry. Grain at two sizes, pitting, faint bedding that
 * runs across, and here and there a hairline crack that only darkens the
 * stone a little. Nothing in it is sharp enough to read as a vein.
 */
export function bedrock(GFX) {
  const big = fractal(281, 3, 4), grain = fractal(283, 12, 3), fine = fractal(293, 40, 2), warp = fractal(307, 4, 2), crack = fractal(311, 5, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const w = warp(u, v);
    const bed = 0.5 + 0.5 * Math.sin((v * 7 + w * 1.6) * Math.PI * 2);
    const c = Math.abs(crack(u, v) - 0.5) * 2;
    const line = smoothstep(0.035, 0.0, c);
    const g = grain(u, v), f = fine(u, v), b = big(u, v);
    const k = relief
      ? 0.35 + g * 0.35 + f * 0.2 + bed * 0.08 - line * 0.25
      : (0.74 + (b - 0.5) * 0.22 + (g - 0.5) * 0.16 + (f - 0.5) * 0.1 + (bed - 0.5) * 0.05) * (1 - line * 0.16);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Striped wallpaper over dark wainscot, a dado rail between: hotel corridors and palazzo halls. */
export function wallpaper(GFX) {
  const n = fractal(229, 6, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const panel = v > 0.62;
    const rail = Math.abs(v - 0.62) < 0.02;
    const stripe = (u * 6) % 1 < 0.5 ? 1 : 0.86;
    const fine = 0.5 + 0.5 * Math.sin(u * 6 * Math.PI * 8);
    const fu = (u * 2) % 1;
    const box = panel && (Math.abs(Math.min(fu, 1 - fu) - 0.08) < 0.015 || Math.abs(v - 0.7) < 0.012 || Math.abs(v - 0.93) < 0.012);
    const k = relief
      ? rail ? 0.9 : panel ? (box ? 0.7 : 0.5) : 0.5 + fine * 0.05
      : rail ? 0.95 : panel ? (box ? 0.5 : 0.42) * (0.9 + n(u, v) * 0.15) : stripe * (0.92 + fine * 0.05) * (0.94 + n(u, v) * 0.08);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** The back of the set: scenery flats from behind, canvas on a timber frame, braced, stencilled with the stage. */
export function flats(GFX) {
  const n = fractal(233, 4, 3), grain = fractal(239, 2, 4);
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const stile = Math.min(u, 1 - u) < 0.05 || Math.abs(u - 0.5) < 0.025;
      const rail = Math.min(v, 1 - v) < 0.05 || Math.abs(v - 0.45) < 0.025;
      const brace = Math.abs((u - 0.5) - (v - 0.45) * 0.9) < 0.022 && u > 0.5 && v > 0.45;
      const wood = stile || rail || brace;
      const k = relief ? (wood ? 0.85 : 0.4 + n(u, v) * 0.1) : wood ? 0.7 + grain(u, v * 4) * 0.2 : 0.9 + n(u, v) * 0.1;
      return grey(Math.round(255 * Math.min(1, k)));
    });
    if (!relief) {
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(30,26,22,0.55)';
      ctx.font = '700 22px "Anton", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE 7', size * 0.27, size * 0.3);
      ctx.font = '700 14px "Anton", Impact, sans-serif';
      ctx.fillText('THIS SIDE AWAY', size * 0.27, size * 0.72);
    }
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

// ——— the world tour's walls

/** Sandstone: great blocks, two courses, worn soft at the edges, the strata showing. Egypt. */
export function sandstone(GFX) {
  const n = fractal(501, 6, 4), m = fractal(503, 2, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const course = Math.floor(v * 2), shift = course * 0.5;
    const fu = ((u + shift) * 1) % 1, fv = (v * 2) % 1;
    const edge = Math.min(fu, fv, 1 - fu, 1 - fv);
    const joint = edge < 0.03;
    const strata = 0.5 + 0.5 * Math.sin((v * 2 + n(u, v) * 0.3) * Math.PI * 2 * 5);
    const k = relief ? (joint ? 0 : smoothstep(0.0, 0.08, edge) * (0.6 + n(u, v) * 0.3)) : joint ? 0.45 : 0.8 + strata * 0.08 + m(u, v) * 0.08;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A cliff of mountain rock: strata slanting across, fissures, lichen and frost. The Alps. */
export function cliff(GFX) {
  const n = fractal(511, 5, 5), m = fractal(513, 2, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const strata = Math.abs(Math.sin((v + u * 0.3 + n(u, v) * 0.4) * Math.PI * 2 * 3));
    const fissure = smoothstep(0.05, 0.0, strata) * 0.45;
    const k = relief ? 0.25 + n(u, v) * 0.6 - fissure : 0.66 + n(u, v) * 0.22 + m(u, v) * 0.1 - fissure;
    return grey(Math.round(255 * Math.min(1, Math.max(0, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Shoji: paper panels in a lattice of thin wooden bars, lit from behind. Tokyo. */
export function shoji(GFX) {
  const n = fractal(521, 8, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 3) % 1, fv = (v * 4) % 1;
    const bar = Math.min(fu, 1 - fu) < 0.04 || Math.min(fv, 1 - fv) < 0.04;
    const frame = u < 0.04 || u > 0.96 || v > 0.9;
    const k = relief ? (bar || frame ? 0.9 : 0.45) : frame ? 0.35 : bar ? 0.5 : 0.96 + n(u, v) * 0.03;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A chalet's timber: round-edged logs laid one on another, the grain along them. The Alps. */
export function timber(GFX) {
  const n = fractal(531, 2, 4);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fv = (v * 5) % 1;
    const round = Math.sin(fv * Math.PI);
    const grain = 0.5 + 0.5 * Math.sin((v * 5 + n(u, v) * 0.6) * Math.PI * 2 * 8 + u * 2);
    const k = relief ? 0.2 + round * 0.7 : (0.62 + round * 0.22) * (0.88 + grain * 0.12);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Paris stone: pale ashlar, a tall window with its shutters and a wrought-iron balcony rail across. */
export function haussmann(GFX) {
  const n = fractal(541, 6, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const course = (v * 4) % 1, joint = course < 0.03;
    const win = Math.abs(u - 0.5) < 0.18 && v > 0.12 && v < 0.78;
    const shutter = !win && Math.abs(u - 0.5) < 0.27 && v > 0.12 && v < 0.78;
    const rail = v > 0.66 && v < 0.72 && Math.abs(u - 0.5) < 0.3 && (Math.floor(u * 40) % 2 === 0 || v < 0.675);
    const k = relief ? (win ? 0.1 : rail ? 0.9 : joint ? 0.3 : 0.65) : rail ? 0.15 : win ? 0.22 : shutter ? 0.55 : joint ? 0.7 : 0.9 + n(u, v) * 0.06;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Azulejos: glazed tiles, sixteen to the tile, each with a four-petalled pattern. Spain. */
export function azulejo(GFX) {
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const fu = (u * 4) % 1, fv = (v * 4) % 1;
    const joint = Math.min(fu, fv, 1 - fu, 1 - fv) < 0.03;
    const x = fu - 0.5, y = fv - 0.5, r = Math.hypot(x, y), a = Math.atan2(y, x);
    const petal = r < 0.18 + 0.14 * Math.abs(Math.cos(a * 2));
    const corner = Math.hypot(Math.min(fu, 1 - fu), Math.min(fv, 1 - fv)) < 0.16;
    const k = relief ? (joint ? 0.2 : 0.75) : joint ? 0.8 : petal || corner ? 0.35 : 0.97;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** A hedge, clipped square: leaves on leaves. London's parks, a palace garden. */
export function hedge(GFX) {
  const n = fractal(551, 12, 3), m = fractal(553, 3, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const leaf = n(u, v);
    const k = relief ? 0.2 + leaf * 0.8 : 0.55 + leaf * 0.35 + m(u, v) * 0.1;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}
