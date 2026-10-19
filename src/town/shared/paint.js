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

const textures = new Map();

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

const none = () => ({ map: null, bump: null });

/** A texture of its own over the same canvas, for something that turns or scrolls its texture by itself. */
export function copyOf(GFX, tex) {
  if (!tex) return null;
  const t = new GFX.CanvasTexture(tex.image);
  t.colorSpace = tex.colorSpace;
  t.anisotropy = tex.anisotropy;
  t.wrapS = t.wrapT = GFX.RepeatWrapping;
  return t;
}

const tiledMaps = new Map();

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

export const cached = (key, make) => {
  if (typeof document === 'undefined') return none();
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Value noise that wraps every `period` cells, so a texture painted with it tiles. */
function periodic(seed, period) {
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
function fractal(seed, cells = 4, octaves = 4) {
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
function pixels(size, shade) {
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

const grey = (v) => [v, v, v].map((x) => Math.max(0, Math.min(255, x)));

/** A map and a bump map from one pair of painters. */
function pair(GFX, size, color, height, opts = {}) {
  return { map: texture(GFX, color(size), opts), bump: texture(GFX, height(size), { srgb: false, ...opts }) };
}

// ———————————————————————————————————————————————————————————— floors

/**
 * Poured concrete, a slab to the tile: speckled, stained here and there with
 * oil, joints at two edges, a hairline crack. The garage, the dock, the arena.
 */
function concrete(GFX) {
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
function planks(GFX) {
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
function checker(GFX) {
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
function carpet(GFX) {
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
function plate(GFX) {
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
function grass(GFX) {
  const patch = fractal(17, 3, 4), blade = fractal(29, 64, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const p = patch(u, v), b = blade(u, v);
    const k = relief ? 0.4 + b * 0.6 : (0.62 + p * 0.38) * (0.74 + b * 0.4);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Dance-floor panels: two by two glossy squares in two shades, a bright bevel round each. The club. */
function panels(GFX) {
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
function mud(GFX) {
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
function belt(GFX) {
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
function asphalt(GFX) {
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
function dirt(GFX) {
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
function grate(GFX) {
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
function cobble(GFX) {
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
function snow(GFX) {
  const n = fractal(401, 4, 4), g = fractal(403, 40, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const drift = n(u, v), glint = g(u, v) > 0.82 ? 0.06 : 0;
    const k = relief ? 0.35 + drift * 0.65 : 0.78 + drift * 0.16 + glint;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Sand, rippled by the wind: fine grain in long curving ripples. The desert, the beach. */
function sand(GFX) {
  const n = fractal(411, 3, 3), g = fractal(413, 48, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const ripple = 0.5 + 0.5 * Math.sin((v + n(u, v) * 0.25) * Math.PI * 2 * 6);
    const k = relief ? 0.4 + ripple * 0.4 + (g(u, v) - 0.5) * 0.2 : 0.84 + ripple * 0.08 + (g(u, v) - 0.5) * 0.1;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Tatami: woven rush mats, the weave running one way, a dark cloth binding down two edges. Tokyo. */
function tatami(GFX) {
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
function terracotta(GFX) {
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
function marble(GFX) {
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
function mosaic(GFX) {
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
function scree(GFX) {
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

// ———————————————————————————————————————————————————————————— walls

/** Names, for the gig posters on the walls: the tour, and the bands on the bill with it. */
const BILLS = ['WORLD TOUR', 'BOULDER DASH', 'THE PEBBLES', 'LANDSLIDE', 'BEDROCK', 'THE SEDIMENTS', 'MAGMA', 'SCREE', 'GRANITE', 'SLAB', 'TECTONIC', 'HARD PLACE'];

/** Bricks, a tile wide and a tile high: four courses, each set half a brick over from the last. With `posters`, papered with gig posters. */
function brick(GFX, { posters = false } = {}) {
  const size = 256;
  const rnd = random(5);
  const tones = Array.from({ length: 40 }, () => rnd());
  const paint = (face, joint, vary, art) => {
    const [c, ctx] = canvas(size);
    ctx.fillStyle = joint;
    ctx.fillRect(0, 0, size, size);
    const rows = 4, per = 2, bh = size / rows, bw = size / per;
    let n = 0;
    for (let r = 0; r < rows; r++) {
      const shift = (r % 2) * bw / 2;
      for (let k = -1; k < per + 1; k++) {
        const x = k * bw + shift;
        ctx.fillStyle = vary ? mix(face, '#8a847a', tones[n++ % tones.length] * 0.5) : face;
        ctx.beginPath();
        ctx.roundRect(x + 4, r * bh + 4, bw - 8, bh - 8, 5);
        ctx.fill();
      }
    }
    if (art) art(ctx);
    return c;
  };
  const poster = (ctx) => {
    const r = random(77);
    const pick = (list) => list[Math.floor(r() * list.length)];
    // A flyer: a bold block of colour, a big shape, a name in poster letters, tape at the corners.
    const flyer = (x, y, w, h, bg, fg, name, shape, tilt) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(tilt);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = fg;
      if (shape === 'sun') {
        ctx.beginPath(); ctx.arc(0, -h * 0.08, w * 0.34, 0, 7); ctx.fill();
        for (let k = 0; k < 12; k++) {
          ctx.save(); ctx.rotate((k / 12) * Math.PI * 2); ctx.fillRect(-2, -w * 0.5, 4, w * 0.12); ctx.restore();
        }
      } else if (shape === 'bolt') {
        ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.42); ctx.lineTo(-w * 0.28, h * 0.02); ctx.lineTo(-w * 0.02, h * 0.02); ctx.lineTo(-w * 0.14, h * 0.3); ctx.lineTo(w * 0.3, -h * 0.08); ctx.lineTo(w * 0.04, -h * 0.08); ctx.closePath(); ctx.fill();
      } else {
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(0, -h * 0.05, w * (0.36 - k * 0.07), 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = k % 2 ? bg : fg; ctx.fillStyle = k % 2 ? bg : fg; ctx.fill(); }
      }
      ctx.fillStyle = '#0c0c10';
      ctx.fillRect(-w / 2, h * 0.28, w, h * 0.22);
      ctx.fillStyle = fg;
      ctx.font = `${Math.round(h * 0.15)}px "Anton", Impact, "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 0, h * 0.39, w - 8);
      ctx.fillStyle = 'rgba(240,230,190,0.85)';
      ctx.fillRect(-w / 2 - 5, -h / 2 - 3, 18, 8);
      ctx.fillRect(w / 2 - 13, -h / 2 - 3, 18, 8);
      ctx.restore();
    };
    flyer(10, 18, 104, 138, pick(['#c8302a', '#2a4a8a', '#e8a020']), '#ffffff', 'ROCK · LIVE', 'sun', -0.05);
    flyer(134, 96, 112, 142, pick(['#1a1a20', '#3a5a3a', '#6a2a6a']), '#f0d070', pick(BILLS), 'bolt', 0.04);
    flyer(150, 8, 80, 78, '#f5f0e6', '#d9232f', 'SOON', 'rings', 0.06);
  };
  return {
    map: texture(GFX, paint(posters ? '#b8a89a' : '#e2ddd4', '#3a342e', true, posters ? poster : null)),
    bump: texture(GFX, paint('#ffffff', '#000000', false), { srgb: false }),
  };
}

/** Plywood: a sheet to the tile, screwed to the studs, with a stencilled mark. The garage. */
function plywood(GFX) {
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
function foam(GFX) {
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
function curtain(GFX) {
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
function corrugated(GFX) {
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
function block(GFX) {
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
function damask(GFX) {
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
function canvasWall(GFX) {
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
function fence(GFX) {
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
function clapboard(GFX) {
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
function stucco(GFX) {
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
function hull(GFX) {
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
function stone(GFX) {
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

/** Striped wallpaper over dark wainscot, a dado rail between: hotel corridors and palazzo halls. */
function wallpaper(GFX) {
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
function flats(GFX) {
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
function sandstone(GFX) {
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
function cliff(GFX) {
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
function shoji(GFX) {
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
function timber(GFX) {
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
function haussmann(GFX) {
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
function azulejo(GFX) {
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
function hedge(GFX) {
  const n = fractal(551, 12, 3), m = fractal(553, 3, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const leaf = n(u, v);
    const k = relief ? 0.2 + leaf * 0.8 : 0.55 + leaf * 0.35 + m(u, v) * 0.1;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

export const WALLS = {
  brick: (GFX) => brick(GFX),
  posters: (GFX) => brick(GFX, { posters: true }),
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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

function facadeCanvas(storey, draw) {
  const W = 256, H = Math.round(256 * storey);
  return (relief) => () => {
    const [c, ctx] = canvas(W, H);
    draw(ctx, W, H, relief);
    return c;
  };
}

/** Clapboard and a sash window with a sill and shutters (or, `door`, a panelled front door with a step and a lamp). */
function houseFace(GFX, { door = false, plain = false } = {}) {
  const storey = 1.6;
  const grain = fractal(701, 3, 4);
  const draw = (ctx, W, H, relief) => {
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const boards = 9, f = ((y / H) * boards) % 1;
        const lip = smoothstep(0.75, 1, f);
        const g = grain((x / W) * 0.6, (y / H) * 6);
        const k = relief ? 0.25 + f * 0.7 : (0.84 + g * 0.16) * (1 - lip * 0.3) * (f < 0.05 ? 0.55 : 1);
        const i = (y * W + x) * 4;
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
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const open = y > H * 0.08 && y < H * 0.62 && (x % 128) > 14;
      const k = relief ? (open ? 0.1 : 0.6 + n(x / W, y / H) * 0.3) : open ? 0.08 : 0.78 + n(x / W, y / H) * 0.2;
      const i = (y * W + x) * 4;
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
  return pair(GFX, 256, paint(false), paint(true));
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
  return pair(GFX, 256, paint(false), paint(true));
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
      const [c, ctx] = canvas(size);
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
      const [c, ctx] = canvas(size);
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
      const [c, ctx] = canvas(size);
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
      const [c, ctx] = canvas(size);
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
