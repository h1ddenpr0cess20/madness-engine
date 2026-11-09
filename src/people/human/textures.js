import { clamp, fbm, noise3, smooth } from './kit.js';
import { almond, HEAD_SCALE, LIPS } from './head.js';
import { COLLAR, HEM, jeansHeight, jeansPoint, shirtPoint, SHIRT_UV, SLEEVE_RANGE } from './clothes.js';

/**
 * The human's textures, painted when he is first built (in a browser; with
 * no `document`, as under test, there are none and the materials carry
 * their colours alone). Each painter works the way a texture artist's
 * projection does: every texel is taken back to the place on the body it
 * covers, and the colour there (a cheek's flush, an eyebrow's hair, a
 * jeans' seam) is worked out from that place.
 */

const G = (t) => Math.exp(-t * t);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A `w` × `h` canvas, every texel coloured by `fn(u, v)` → [r, g, b] (0–255); u across, v up. */
function paint(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const v = 1 - (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      const rgb = fn((x + 0.5) / w, v, x, y);
      const o = (y * w + x) * 4;
      d[o] = clamp(rgb[0], 0, 255); d[o + 1] = clamp(rgb[1], 0, 255); d[o + 2] = clamp(rgb[2], 0, 255); d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function texture(GFX, canvas, { color = true, repeat = null } = {}) {
  const t = new GFX.CanvasTexture(canvas);
  if (color) t.colorSpace = GFX.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = GFX.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.updateMatrix?.();
  }
  return t;
}

/** Bilinear lookup of the head's grid at (u, v) of its texture: the head-local point there, at natural size. */
function gridLookup(grid) {
  const rows = grid.length - 1, cols = grid[0].length - 1;
  return (u, v) => {
    const fi = clamp((1 - v) * rows, 0, rows - 1e-6), fj = clamp(u * cols, 0, cols - 1e-6);
    const i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    const p00 = grid[i][j], p01 = grid[i][j + 1], p10 = grid[i + 1][j], p11 = grid[i + 1][j + 1];
    return [0, 1, 2].map((k) => ((p00[k] * (1 - b) + p01[k] * b) * (1 - a) + (p10[k] * (1 - b) + p11[k] * b) * a) / HEAD_SCALE);
  };
}

// ———————————————————————————————————————————————— skin

/** How much of an eyebrow there is at (s, y), and the lie of its hairs. */
function brow(s, y) {
  const t = (s - 0.011) / 0.042;
  if (t < -0.15 || t > 1.15) return 0;
  const centre = 0.0213 + 0.0062 * Math.sin(Math.PI * clamp(t) * 0.82) - 0.0012 * t;
  const thick = 0.0068 * (1 - 0.6 * clamp(t)) + 0.0006;
  const body = smooth(thick / 2 + 0.0008, thick / 2 - 0.0008, Math.abs(y - centre)) * smooth(-0.12, 0.05, t) * smooth(1.12, 0.92, t);
  // Hairs: fine streaks laid outward and a little up, broken by noise.
  const hair = 0.5 + 0.5 * Math.sin((s * 0.9 - (y - centre) * 2.2) * 2600 + noise3(s * 900, y * 900, 1) * 5);
  return body * (0.55 + 0.45 * hair);
}

/** How much of the lips' red there is at (s, y) on the front of the face: inside the outline the geometry's lips have. */
function lips(s, y) {
  const bow = 0.0012 * G((s - 0.0058) / 0.004) - 0.0007 * G(s / 0.0022);
  const top = LIPS.top + bow;
  const v = smooth(top + 0.0005, top - 0.0005, y) * smooth(LIPS.bottom - 0.0005, LIPS.bottom + 0.0005, y);
  return v * smooth(LIPS.half(y) + 0.0008, LIPS.half(y) - 0.0012, s);
}

/** Paints the head's colour and its bump from its grid. `tone` is the skin's colour. */
function headMaps(grid, tone) {
  const at = gridLookup(grid);
  const base = hex(tone), flush = hex('#c26652'), lipc = hex('#a95a52'), browc = hex('#3a281e'), shade = hex('#6f6672'), lashc = hex('#24181350'.slice(0, 7)), wet = hex('#8a4a46');
  const W = 1024, H = 1024;
  const pos = new Float32Array(W * H * 3);
  const map = paint(W, H, (u, v, x, y) => {
    const q = at(u, v);
    const o = (y * W + x) * 3;
    pos[o] = q[0]; pos[o + 1] = q[1]; pos[o + 2] = q[2];
    const s = Math.abs(q[0]), Y = q[1], Z = q[2];
    const front = smooth(0.0, 0.05, Z);
    let c = base.slice();
    // Broad variation: warmer and redder in the middle of the face and on the ears' side, a little sallow on the scalp.
    const mottle = fbm(q[0] * 60, Y * 60, Z * 60, 3);
    c = mixc(c, [c[0] * 1.04, c[1] * 0.98, c[2] * 0.95], 0.5 + mottle);
    const red = 0.55 * G((s - 0.043) / 0.02) * G((Y + 0.028) / 0.02) * front + 0.7 * G(s / 0.012) * G((Y + 0.04) / 0.012) * front + 0.25 * G((Y - 0.035) / 0.03) * front * G(s / 0.05) + 0.3 * G((s - 0.032) / 0.016) * G((Y - 0.003) / 0.012) * front;
    c = mixc(c, flush, clamp(red * 0.32));
    // A shaved man's shadow: jaw, chin and upper lip, fading down the neck.
    const lip = front > 0.5 ? lips(s, Y) : 0;
    const beard = smooth(-0.04, -0.06, Y + 0.25 * Math.max(0, s - 0.03)) * smooth(-0.165, -0.13, Y) * smooth(0.0, 0.03, Z + 0.02) * (1 - lip)
      + 0.8 * smooth(-0.054, -0.058, Y) * smooth(-0.064, -0.0615, Y) * smooth(0.028, 0.02, s) * (1 - lip);
    c = mixc(c, shade, clamp(beard) * 0.2 * (0.8 + 0.4 * noise3(q[0] * 2000, Y * 2000, Z * 2000)));
    if (front > 0.3) {
      c = mixc(c, lipc, lip * 0.62);
      // The eyes: a little shadow under them, the lash line along the upper lid, the wet inside of the lids.
      const e = 0.0322;
      c = mixc(c, hex('#8a6466'), 0.16 * G((s - e) / 0.011) * G((Y + 0.011) / 0.005));
      const a = almond(q[0], Y);
      const upper = Y > 0.0005 + 0.0016 * ((s - e) / 0.014);
      c = mixc(c, lashc, (upper ? 0.92 : 0.35) * G(a / (upper ? 0.0009 : 0.0005)));
      if (a < 0) c = mixc(c, wet, 0.8);
      c = mixc(c, browc, brow(s, Y) * 0.9);
      // Nostrils and the mouth's line.
      c = mixc(c, hex('#3a1e1a'), 0.85 * G((s - 0.0072) / 0.0032) * G((Y + 0.0505) / 0.0019) * smooth(0.085, 0.095, Z));
      c = mixc(c, hex('#4e2622'), 0.75 * G((Y + 0.0739 + 0.0032 * (s / 0.025) ** 2) / 0.0007) * smooth(0.0262, 0.0235, s));
    }
    return c;
  });
  const bump = paint(W, H, (u, v, x, y) => {
    const o = (y * W + x) * 3;
    const q = [pos[o], pos[o + 1], pos[o + 2]];
    const s = Math.abs(q[0]), Y = q[1], Z = q[2];
    const front = smooth(0.0, 0.05, Z);
    let h = 128 + 18 * noise3(q[0] * 2600, Y * 2600, Z * 2600) + 10 * noise3(q[0] * 700, Y * 700, Z * 700);
    if (front > 0.3) {
      h += 60 * brow(s, Y);
      const lip = lips(s, Y);
      h -= 22 * lip * Math.max(0, Math.sin(s * 2400));
      // Two faint lines across the forehead, and the fold over each upper lid.
      h -= 26 * G((Y - 0.047 - 0.003 * Math.sin(s * 70)) / 0.0007) * G(s / 0.04) - 0 + 20 * G((Y - 0.058) / 0.0007) * G(s / 0.035) * -1;
      h -= 40 * G((Y - 0.0085 - 0.002 * ((s - 0.032) / 0.014) ** 2) / 0.0008) * G((s - 0.032) / 0.013);
      // The fold from the nose's wing toward the mouth's corner.
      const t = clamp((-0.046 - Y) / 0.03);
      h -= 30 * G((s - (0.024 + 0.008 * t)) / 0.0012) * (Y < -0.042 && Y > -0.079 ? 1 : 0) * (1 - t * 0.6);
    }
    return [h, h, h];
  });
  return { map, bump };
}

/** A tile of skin for the arms, hands and ears: the tone, a little mottling, and pores in its bump. */
function bodySkin(tone) {
  const base = hex(tone);
  const N = 256, f = (x, y, s) => noise3(x * s, y * s, 3) ;
  // Periodic noise: sampled on a torus so the tile repeats without a seam.
  const per = (u, v, s) => {
    const a = u * Math.PI * 2, b = v * Math.PI * 2;
    return noise3(Math.cos(a) * s, Math.sin(a) * s, Math.cos(b) * s + Math.sin(b) * s * 1.7);
  };
  const map = paint(N, N, (u, v) => {
    const m = per(u, v, 2) * 0.5 + per(u, v, 6) * 0.25;
    return mixc(base, [base[0] * 1.06, base[1] * 0.96, base[2] * 0.93], 0.5 + m);
  });
  const bump = paint(N, N, (u, v) => {
    const h = 128 + 30 * per(u, v, 40) + 14 * per(u, v, 14) + 0 * f(u, v, 1);
    return [h, h, h];
  });
  return { map, bump };
}

/** The eye: white, veined faintly toward the edges, the iris's fibres round a black pupil. */
function eyeMap(iris) {
  const ic = hex(iris), white = hex('#f2eee8'), pinkish = hex('#e2b8b0');
  return paint(256, 256, (u, v) => {
    const dx = u - 0.5, dy = v - 0.5;
    const r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const a = r * 2 * Math.PI;
    if (a < 0.17) return [8, 6, 6];
    if (a < 0.47) {
      const t = (a - 0.17) / 0.3;
      const fibres = 0.5 + 0.5 * Math.sin(ang * 70 + noise3(Math.cos(ang) * 4, Math.sin(ang) * 4, t * 3) * 4);
      let c = mixc(ic.map((x) => x * 0.55), ic.map((x) => Math.min(255, x * 1.35)), 0.35 + 0.4 * fibres * (1 - t));
      // A golden ring round the pupil, and the dark limbal ring at the edge.
      c = mixc(c, hex('#b08a3a'), 0.35 * G((t - 0.12) / 0.1));
      c = mixc(c, [20, 16, 14], smooth(0.8, 1, t) * 0.85);
      return c;
    }
    let c = mixc(white, pinkish, smooth(0.9, 1.6, a) * 0.6);
    c = mixc(c, hex('#c86060'), 0.25 * smooth(1.0, 1.5, a) * Math.max(0, Math.sin(ang * 9 + noise3(ang, a * 6, 7) * 3)) ** 8);
    return c;
  });
}

// ———————————————————————————————————————————————— the shirt

/** The shirt: off-white to be tinted, flecked like a heather jersey, with its seams and the hems' double stitching. */
function shirtMaps() {
  const W = 1024, H = 1024;
  const yOfT = (t) => HEM - 0.002 + (COLLAR - HEM) * (1 - Math.pow(1 - t, 1.25));
  const map = paint(W, H, (u, v) => {
    const th = u * Math.PI * 2;
    let c = 232 + 10 * noise3(u * 900, v * 600, 0) + 8 * noise3(u * 120, v * 80, 5);
    let seam = 0;
    if (v < SHIRT_UV.body) {
      const y = yOfT(v / SHIRT_UV.body);
      const p = shirtPoint(Math.min(COLLAR, y), th);
      // Side seams, and the hem's two rows of stitching.
      const side = Math.min(Math.abs(Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2))), Math.abs(Math.atan2(Math.sin(th + Math.PI / 2), Math.cos(th + Math.PI / 2))));
      seam += G(side / 0.006) * smooth(1.33, 1.3, y) * 0.8;
      for (const dy of [0.011, 0.0175]) seam += G((y - HEM - dy) / 0.0007) * (0.5 + 0.5 * Math.sign(Math.sin(u * 900)));
      // The shoulder seams: along the top of each shoulder, from the collar out.
      if (y > 1.42) seam += G((p[2] + 0.03) / 0.0025) * smooth(0.09, 0.12, Math.abs(p[0])) * 0.8;
    } else if (v < SHIRT_UV.collar) {
      const d = SLEEVE_RANGE[0] + (SLEEVE_RANGE[1] - SLEEVE_RANGE[0]) * clamp((v - SHIRT_UV.sleeve[0]) / (SHIRT_UV.sleeve[1] - SHIRT_UV.sleeve[0]));
      for (const dd of [0.011, 0.0165]) seam += G((SLEEVE_RANGE[1] - dd - d) / 0.0007) * (0.5 + 0.5 * Math.sign(Math.sin(u * 600)));
    } else {
      // The rib: fine lines up and down it.
      c -= 18 * Math.max(0, Math.sin(u * 900));
    }
    c -= 40 * clamp(seam);
    return [c, c, c];
  });
  // A jersey's knit, as a repeating tile: rows of little V-shaped stitches.
  const bump = paint(128, 128, (u, v) => {
    const cols = 16, rows = 16;
    const cu = (u * cols) % 1, cv = (v * rows) % 1;
    const vshape = Math.abs(cu - 0.5) * 2;
    const h = 128 + 70 * Math.cos((cv + vshape * 0.5) * Math.PI * 2) * 0.5 - 40 * G((cu - 0.5) / 0.08);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the jeans

/** The jeans: indigo, faded where they wear (thighs, knees), with every seam and pocket topstitched in gold. */
function denimMaps() {
  const W = 1024, H = 1024;
  const indigo = hex('#2c4a78'), faded = hex('#6f8fb8'), deep = hex('#1d3256'), thread = hex('#c9934a');
  const map = paint(W, H, (u, v) => {
    const th = u * Math.PI * 2;
    const y = jeansHeight(v, th);
    const p = jeansPoint(y, th, 1);
    const x = p[0], z = p[2];
    const front = Math.cos(th);
    // Wear: whiskers across the tops of the thighs, a pale knee, honeycombs behind it, lighter down the shins.
    let fade = 0.18 + 0.1 * fbm(x * 30, y * 30, z * 30, 3);
    fade += 0.3 * smooth(0.2, 0.8, front) * G((y - 0.52) / 0.07);
    fade += 0.25 * smooth(0.3, 0.9, front) * G((y - 0.75) / 0.06) * Math.max(0, Math.sin((y * 1.4 + (x - 0.05) * 3) * 70)) ** 3;
    fade += 0.22 * smooth(-0.3, -0.9, front) * G((y - 0.47) / 0.025) * Math.max(0, Math.sin(th * 14)) ** 4;
    fade += 0.12 * smooth(0.3, 0.9, front) * smooth(0.95, 0.75, y) * smooth(0.6, 0.8, y);
    let c = mixc(indigo, faded, clamp(fade));
    // Weft flecks.
    c = mixc(c, faded, 0.18 * Math.max(0, noise3(u * 1200, v * 900, 3)));
    let st = 0, dark = 0;
    const ang = (a) => Math.abs(Math.atan2(Math.sin(th - a), Math.cos(th - a)));
    // The outseam (one row), the inseam (two), the hem (two).
    dark += G(ang(Math.PI / 2) / 0.01);
    st += G((ang(Math.PI / 2) - 0.03) / 0.0045) * smooth(0.95, 0.9, y);
    dark += G(ang(3 * Math.PI / 2) / 0.01) * smooth(0.81, 0.79, y);
    for (const k of [0.022, 0.05]) st += G((ang(3 * Math.PI / 2) - k) / 0.0045) * smooth(0.81, 0.79, y);
    const hem = jeansHeight(0, th);
    for (const k of [0.012, 0.016]) st += G((y - hem - k) / 0.0008);
    if (front < -0.2) {
      // The yoke, and a back pocket under it with its stitched arcs.
      const yoke = 0.955 - 0.05 * clamp(x / 0.17);
      st += G((y - yoke) / 0.0009) + G((y - yoke + 0.007) / 0.0009);
      dark += G((y - yoke + 0.0035) / 0.002) * 0.6;
      const px = (x - 0.092) / 0.06, top = 0.925;
      const bottom = 0.815 - 0.022 * (1 - Math.abs(px));
      const inside = Math.abs(px) < 1 && y < top && y > bottom;
      const edge = Math.min(Math.abs(Math.abs(px) - 1) * 0.06, Math.abs(y - top), Math.abs(y - bottom));
      if (Math.abs(px) < 1.08 && y < top + 0.004 && y > bottom - 0.004) {
        st += G((edge - 0.003) / 0.0007) + G((edge - 0.0055) / 0.0007) * 0.8;
        if (inside) dark += 0.12;
        dark += G(edge / 0.0014) * 0.7;
        const arc = 0.88 - 0.012 * Math.cos(px * Math.PI);
        if (inside) st += G((y - arc) / 0.0008) + G((y - arc + 0.006) / 0.0008);
      }
    }
    if (front > 0.2) {
      // The front pocket's opening, and the J of the fly.
      const t = clamp((x - 0.1) / 0.075);
      const curve = 1.0 - 0.09 * Math.sin(t * Math.PI / 2);
      st += G((y - curve) / 0.0008) * smooth(0.098, 0.105, x) * smooth(0.178, 0.17, x);
      dark += G((y - curve - 0.003) / 0.002) * 0.6 * smooth(0.098, 0.105, x);
      const jx = 0.034, jr = 0.022;
      const jd = y > 0.885 ? Math.abs(x - jx) : Math.abs(Math.hypot(x - (jx - jr), y - 0.885) - jr);
      st += G((jd) / 0.0008) * smooth(0.005, 0.012, x) * smooth(0.86, 0.865, y);
    }
    c = mixc(c, deep, clamp(dark) * 0.7);
    // Stitches as dashes of gold thread.
    const dash = 0.55 + 0.45 * Math.sign(Math.sin((u * 1.3 + v * 2.0) * 1400));
    c = mixc(c, thread, clamp(st) * 0.85 * dash);
    return c;
  });
  // A 3/1 twill as a repeating tile: diagonal ribs.
  const bump = paint(128, 128, (u, v) => {
    const h = 128 + 80 * Math.sin((u * 16 + v * 16) * Math.PI * 2) + 25 * noise3(u * 64, v * 64, 9);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the sneakers

function shoeMaps() {
  const upper = paint(512, 512, (u, v) => {
    // u round the shoe (0 outside at the sole, ½ over the top, 1 inside), v from heel to toe.
    let c = 200 + 14 * noise3(u * 300, v * 300, 2);
    const seams = G((v - 0.76 - 0.06 * Math.cos((u - 0.5) * Math.PI)) / 0.004) + G((v - 0.12) / 0.004) * 0.8;
    const stitch = G((v - 0.768 - 0.06 * Math.cos((u - 0.5) * Math.PI)) / 0.0015) * (0.5 + 0.5 * Math.sign(Math.sin(u * 300)));
    // The side panel's sweep, a lighter band from the heel along each side.
    const side = Math.min(u, 1 - u);
    const sweep = smooth(0.06, 0.1, side) * smooth(0.24, 0.2, side + 0.15 * (v - 0.2)) * smooth(0.15, 0.25, v) * smooth(0.7, 0.6, v);
    // The eyestay round the laces, darker.
    const stay = smooth(0.2, 0.15, Math.abs(u - 0.5)) * smooth(0.36, 0.4, v) * smooth(0.78, 0.74, v);
    c += 40 * sweep - 60 * stay - 70 * seams + 80 * stitch;
    return [c, c, c];
  });
  const sole = paint(256, 256, (u, v) => {
    let c = 238 + 8 * noise3(u * 200, v * 200, 4);
    // Underneath: a tread of crossing grooves; round the sidewall, one coloured stripe.
    if (u > 0.55 && u < 0.95) c -= 50 * Math.max(0, Math.sin(v * 180)) ** 6 + 20;
    const wall = Math.min(Math.abs(u - 0.0), Math.abs(u - 0.5), Math.abs(u - 1));
    if (wall < 0.03) return [190, 70, 60].map((k) => k + 0 * c);
    return [c, c, c - 6];
  });
  return { upper, sole };
}

const cache = new WeakMap();

/**
 * Every texture the human needs, for one look ({ skin, iris }), made once a
 * look and kept. Returns nulls where there is no document to paint on.
 */
export function humanTextures(GFX, headGrid, { skin = '#d29a78', iris = '#5a4632' } = {}) {
  if (typeof document === 'undefined') return null;
  let byGFX = cache.get(GFX);
  if (!byGFX) cache.set(GFX, (byGFX = new Map()));
  const key = `${skin}|${iris}|${headGrid.length}x${headGrid[0].length}`;
  if (byGFX.has(key)) return byGFX.get(key);
  const head = headMaps(headGrid, skin);
  const body = bodySkin(skin);
  const shirt = shirtMaps(), denim = denimMaps(), shoes = shoeMaps();
  const made = {
    head: { map: texture(GFX, head.map), bump: texture(GFX, head.bump, { color: false }) },
    skin: { map: texture(GFX, body.map, { repeat: [3, 3] }), bump: texture(GFX, body.bump, { color: false, repeat: [6, 6] }) },
    eye: texture(GFX, eyeMap(iris)),
    shirt: { map: texture(GFX, shirt.map), bump: texture(GFX, shirt.bump, { color: false, repeat: [70, 50] }) },
    denim: { map: texture(GFX, denim.map), bump: texture(GFX, denim.bump, { color: false, repeat: [60, 90] }) },
    shoe: texture(GFX, shoes.upper),
    sole: texture(GFX, shoes.sole),
  };
  byGFX.set(key, made);
  return made;
}
