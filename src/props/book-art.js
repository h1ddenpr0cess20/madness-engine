/**
 * What is written and painted on Book (props/book.js): the cover's leather,
 * foil, emblem and title, the endpapers, and the pages in a madman's hand.
 *
 * Everything here is painted on a canvas, so it only runs where there is a
 * page (the viewer, a game); under node (the tests) nothing is painted and
 * the book is plain cloth and plain paper.
 *
 * The words are the caller's to replace: Book takes `pages`, a list of
 * strings (page 1 first) or a function from a page number to a string. A page
 * may use three marks: `*underlined and pressed hard*`, `~struck out~`, and
 * a line that begins with `#` is written large. Blank lines are paragraphs.
 * `madnessPage(n)` is what it writes when nothing else is given.
 */

const TAU = Math.PI * 2;

export const DEFAULT_TITLE = 'Book of Madness';
export const DEFAULT_SUBTITLE = 'as set down by one who has heard the walls';

export const CLOTHS = {
  oxblood: '#3a0d14', black: '#131114', midnight: '#10192e', bog: '#18271d', violet: '#2b1741',
  ash: '#3b3b41', rust: '#5b2b15', bone: '#c8baa0',
};
export const FOILS = {
  'aged gold': '#c4a050', silver: '#b9bec7', copper: '#b8693b', blood: '#a3151c', bone: '#e2d6b8', verdigris: '#4fa08a',
};
export const EMBLEMS = ['pentagram', 'eye', 'kraken', 'moon', 'skull', 'none'];
export const TRIMS = ['ornate', 'double', 'runes', 'none'];
export const PAPERS = {
  aged: '#e6d6b4', vellum: '#efe3c6', bone: '#d8ccb0', ash: '#cdc8bd', white: '#f3f0e8', black: '#26242a',
};

/* ------------------------------------------------------------------ */
/* small tools                                                         */
/* ------------------------------------------------------------------ */

export const mulberry = (seed) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const parse = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const shade = (hex, k) => toHex(parse(hex).map((v) => v * k));
const mixHex = (a, b, t) => { const x = parse(a), y = parse(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const canvasOf = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

/** Foil: a gradient in the colour pass, plain white in the bump pass so it stands proud of the leather. */
function makeFoil(ctx, mode, hex, bg) {
  return {
    mode, bg, hex,
    set(x0, y0, x1, y1) {
      if (mode === 'bump') { ctx.fillStyle = ctx.strokeStyle = '#ffffff'; return; }
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, mixHex(hex, '#ffffff', 0.5));
      g.addColorStop(0.45, hex);
      g.addColorStop(1, shade(hex, 0.5));
      ctx.fillStyle = ctx.strokeStyle = g;
    },
  };
}

/* ------------------------------------------------------------------ */
/* emblems                                                             */
/* ------------------------------------------------------------------ */

function rune(ctx, x, y, s, rot, rand) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(0, s);
  const branches = 1 + ((rand() * 3) | 0);
  for (let i = 0; i < branches; i++) {
    const y0 = (rand() * 1.5 - 0.75) * s, dir = rand() < 0.5 ? -1 : 1, len = (0.4 + rand() * 0.5) * s;
    ctx.moveTo(0, y0); ctx.lineTo(dir * len * 0.8, y0 + (rand() < 0.5 ? -1 : 1) * len * 0.7);
  }
  ctx.stroke();
  ctx.restore();
}

const ring = (ctx, cx, cy, r, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); };

function runeBand(ctx, cx, cy, r0, r1, count, rand) {
  const mid = (r0 + r1) / 2, s = (r1 - r0) * 0.38;
  ctx.lineWidth = (r1 - r0) * 0.11;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    rune(ctx, cx + Math.cos(a) * mid, cy + Math.sin(a) * mid, s, a + Math.PI / 2, rand);
  }
}

function star(ctx, cx, cy, r, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.28 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

const EMBLEM = {
  pentagram(ctx, F, cx, cy, r, rand) {
    F.set(cx - r, cy - r, cx + r, cy + r);
    ctx.lineCap = ctx.lineJoin = 'round';
    const lw = r * 0.024;
    ring(ctx, cx, cy, r, lw * 1.4); ring(ctx, cx, cy, r * 0.93, lw * 0.7); ring(ctx, cx, cy, r * 0.77, lw * 0.9);
    runeBand(ctx, cx, cy, r * 0.77, r * 0.93, 30, rand);
    const R = r * 0.73;
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + ((i * 2) % 5) * (TAU / 5);
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (TAU / 5);
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, r * 0.035, 0, TAU); ctx.fill();
    }
    ring(ctx, cx, cy, r * 0.13, lw * 0.8);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.045, 0, TAU); ctx.fill();
  },

  eye(ctx, F, cx, cy, r, rand) {
    F.set(cx - r, cy - r, cx + r, cy + r);
    ctx.lineCap = ctx.lineJoin = 'round';
    const lw = r * 0.024;
    ring(ctx, cx, cy, r, lw * 1.4); ring(ctx, cx, cy, r * 0.93, lw * 0.7);
    runeBand(ctx, cx, cy, r * 0.8, r * 0.93, 26, rand);
    ring(ctx, cx, cy, r * 0.8, lw * 0.8);
    for (const k of [0.66, 0.6]) {
      ctx.lineWidth = lw * (k > 0.62 ? 1.3 : 0.7);
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = -Math.PI / 2 + i * (TAU / 3);
        ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r * k * 1.1, cy + 0.1 * r + Math.sin(a) * r * k * 1.1);
      }
      ctx.stroke();
    }
    // The almond, its iris and its slit.
    const ey = cy + r * 0.1;
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.42, ey);
    ctx.quadraticCurveTo(cx, ey - r * 0.42, cx + r * 0.42, ey);
    ctx.quadraticCurveTo(cx, ey + r * 0.42, cx - r * 0.42, ey);
    ctx.stroke();
    ring(ctx, cx, ey, r * 0.15, lw);
    ctx.beginPath(); ctx.ellipse(cx, ey, r * 0.035, r * 0.12, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = lw * 0.7;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * r * 0.1, ey - r * 0.3 + Math.abs(i) * r * 0.04); ctx.lineTo(cx + i * r * 0.14, ey - r * 0.42 + Math.abs(i) * r * 0.05); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx, ey + r * 0.4); ctx.quadraticCurveTo(cx - r * 0.07, ey + r * 0.52, cx, ey + r * 0.58); ctx.quadraticCurveTo(cx + r * 0.07, ey + r * 0.52, cx, ey + r * 0.4); ctx.fill();
  },

  kraken(ctx, F, cx, cy, r) {
    F.set(cx - r, cy - r, cx + r, cy + r);
    ctx.lineCap = ctx.lineJoin = 'round';
    const lw = r * 0.024;
    ring(ctx, cx, cy, r, lw * 1.4); ring(ctx, cx, cy, r * 0.95, lw * 0.7);
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * TAU, dir = i % 2 ? 1 : -1, curl = 1.2 + (i % 3) * 0.35;
      for (let t = 0; t <= 1; t += 0.012) {
        const a = a0 + dir * curl * t * t, rad = r * (0.24 + 0.68 * t);
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, r * (0.07 * (1 - t) + 0.012), 0, TAU); ctx.fill();
      }
      ctx.fillStyle = F.bg;
      for (let t = 0.12; t < 0.8; t += 0.1) {
        const a = a0 + dir * curl * t * t, rad = r * (0.24 + 0.68 * t);
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, r * 0.012 * (1 - t) + r * 0.003, 0, TAU); ctx.fill();
      }
      F.set(cx - r, cy - r, cx + r, cy + r);
    }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.24, 0, TAU); ctx.fill();
    ctx.fillStyle = F.bg;
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.05, r * 0.15, 0, 0, TAU); ctx.fill();
    F.set(cx - r, cy - r, cx + r, cy + r);
  },

  moon(ctx, F, cx, cy, r, rand) {
    F.set(cx - r, cy - r, cx + r, cy + r);
    ctx.lineCap = ctx.lineJoin = 'round';
    const lw = r * 0.024;
    ring(ctx, cx, cy, r, lw * 1.4); ring(ctx, cx, cy, r * 0.93, lw * 0.7); ring(ctx, cx, cy, r * 0.78, lw * 0.8);
    runeBand(ctx, cx, cy, r * 0.78, r * 0.93, 30, rand);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - r, cy - r, r * 2, r * 2);
    ctx.arc(cx + r * 0.2, cy - r * 0.06, r * 0.43, 0, TAU);
    ctx.clip('evenodd');
    ctx.beginPath(); ctx.arc(cx - r * 0.04, cy - r * 0.04, r * 0.52, 0, TAU); ctx.fill();
    ctx.restore();
    for (const [x, y, s] of [[0.28, -0.3, 0.07], [0.42, 0.1, 0.05], [0.12, 0.3, 0.06], [-0.46, -0.45, 0.045], [0.5, -0.1, 0.035]]) star(ctx, cx + x * r, cy + y * r, s * r, 4);
    ctx.lineWidth = lw;
    for (let i = -1; i <= 1; i++) {
      const x = cx + i * r * 0.2, y = cy + r * 0.62;
      ring(ctx, x, y, r * 0.055, lw);
      if (i < 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.055, 0, TAU); ctx.fill(); }
      if (i === 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.055, -Math.PI / 2, Math.PI / 2); ctx.fill(); }
    }
  },

  skull(ctx, F, cx, cy, r) {
    F.set(cx - r, cy - r, cx + r, cy + r);
    ctx.lineCap = ctx.lineJoin = 'round';
    const lw = r * 0.03;
    ring(ctx, cx, cy, r, lw * 1.4); ring(ctx, cx, cy, r * 0.93, lw * 0.7);
    // Two bones behind.
    ctx.lineWidth = r * 0.07;
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx - d * r * 0.62, cy - r * 0.55); ctx.lineTo(cx + d * r * 0.62, cy + r * 0.55); ctx.stroke();
      for (const e of [-1, 1]) for (const f of [-1, 1]) {
        ctx.beginPath(); ctx.arc(cx + e * d * r * 0.62 + f * r * 0.04, cy + e * r * 0.55 - f * d * r * 0.04 * 0, r * 0.07, 0, TAU); ctx.fill();
      }
    }
    // The skull, filled, with the leather showing through its sockets.
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.1, r * 0.4, r * 0.38, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - r * 0.24, cy + r * 0.12); ctx.lineTo(cx - r * 0.2, cy + r * 0.36); ctx.lineTo(cx + r * 0.2, cy + r * 0.36); ctx.lineTo(cx + r * 0.24, cy + r * 0.12); ctx.fill();
    ctx.fillStyle = F.bg;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * r * 0.17, cy - r * 0.08, r * 0.1, r * 0.115, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(cx, cy + r * 0.05); ctx.lineTo(cx - r * 0.05, cy + r * 0.16); ctx.lineTo(cx + r * 0.05, cy + r * 0.16); ctx.fill();
    ctx.strokeStyle = F.bg; ctx.lineWidth = lw * 0.9;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.07, cy + r * 0.26); ctx.lineTo(cx + i * r * 0.07, cy + r * 0.36); ctx.stroke(); }
    F.set(cx - r, cy - r, cx + r, cy + r);
  },

  none() {},
};

/* ------------------------------------------------------------------ */
/* trims                                                               */
/* ------------------------------------------------------------------ */

function trim(ctx, F, kind, x0, y0, x1, y1, rand) {
  if (kind === 'none') return;
  F.set(x0, y0, x1, y1);
  ctx.lineCap = ctx.lineJoin = 'round';
  const box = (m, w) => { ctx.lineWidth = w; ctx.strokeRect(x0 + m, y0 + m, x1 - x0 - 2 * m, y1 - y0 - 2 * m); };
  box(8, 1.6); box(11.5, 0.7);
  if (kind === 'ornate') {
    for (const [px, py, sx, sy] of [[x0 + 8, y0 + 8, 1, 1], [x1 - 8, y0 + 8, -1, 1], [x0 + 8, y1 - 8, 1, -1], [x1 - 8, y1 - 8, -1, -1]]) {
      ctx.lineWidth = 1.1;
      for (const rr of [20, 14]) {
        ctx.beginPath();
        ctx.arc(px, py, rr, sx > 0 ? (sy > 0 ? 0 : -Math.PI / 2) : (sy > 0 ? Math.PI / 2 : Math.PI), sx > 0 ? (sy > 0 ? Math.PI / 2 : 0) : (sy > 0 ? Math.PI : Math.PI * 1.5));
        ctx.stroke();
      }
      for (const k of [8, 17]) { ctx.beginPath(); ctx.arc(px + sx * k * 0.7, py + sy * k * 0.7, 1.7, 0, TAU); ctx.fill(); }
    }
    for (const [px, py] of [[(x0 + x1) / 2, y0 + 8], [(x0 + x1) / 2, y1 - 8], [x0 + 8, (y0 + y1) / 2], [x1 - 8, (y0 + y1) / 2]]) {
      ctx.beginPath(); ctx.moveTo(px - 5, py); ctx.lineTo(px, py - 5); ctx.lineTo(px + 5, py); ctx.lineTo(px, py + 5); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'runes') {
    ctx.lineWidth = 0.9;
    const along = (ax, ay, bx, by) => {
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 8));
      for (let i = 0; i <= n; i++) rune(ctx, ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, 2.6, Math.atan2(by - ay, bx - ax) + Math.PI / 2, rand);
    };
    const m = 17;
    along(x0 + m, y0 + m, x1 - m, y0 + m); along(x0 + m, y1 - m, x1 - m, y1 - m);
    along(x0 + m, y0 + m, x0 + m, y1 - m); along(x1 - m, y0 + m, x1 - m, y1 - m);
  }
}

/* ------------------------------------------------------------------ */
/* the cover                                                           */
/* ------------------------------------------------------------------ */

/** Text centred at (x, y), letter by letter so it can be spaced. */
function spaced(ctx, text, x, y, size, track, family, weight = 'bold') {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (widths.length - 1);
  let at = x - total / 2;
  [...text].forEach((c, i) => { ctx.fillText(c, at, y); at += widths[i] + track; });
  return total;
}

/** The largest size, up to `size`, at which the text (letter-spaced) is no wider than `maxW`. */
function fitSize(ctx, text, size, track, family, maxW, weight = 'bold') {
  for (let s = size; s > 4; s -= 0.5) {
    ctx.font = `${weight} ${s}px ${family}`;
    const total = [...text].reduce((a, c) => a + ctx.measureText(c).width, 0) + track * (text.length - 1) * (s / size);
    if (total <= maxW) return s;
  }
  return 4;
}

const TITLE_FONT = '"Cinzel","Trajan Pro","Palatino Linotype","Book Antiqua",Georgia,"DejaVu Serif",serif';

/**
 * The cover as one picture, outer face above and inner face below, in
 * millimetres: `s` along the unrolled cover, `z` up the book. `mode` is
 * 'color' or 'bump' (what stands proud). Returns a canvas.
 */
export function paintCover(g, mode) {
  const SIZE = g.textureSize ?? 2048;
  const canvas = canvasOf(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const L = g.L * 1000, H = g.Hc * 1000;
  ctx.setTransform(SIZE / L, 0, 0, SIZE / 2 / H, 0, 0);
  const rand = mulberry(g.seed ?? 7);
  const bump = mode === 'bump';
  const cloth = bump ? '#808080' : g.cloth;
  const F = makeFoil(ctx, mode, g.foil, cloth);

  ctx.fillStyle = cloth; ctx.fillRect(0, 0, L, H);
  ctx.fillStyle = bump ? '#808080' : g.endpaper; ctx.fillRect(0, H, L, H);

  // Leather: fine grain and a pebble.
  const density = (SIZE / 2048) ** 2;
  for (let i = 0; i < 70000 * density; i++) {
    const x = rand() * L, y = rand() * H, s = 0.3 + rand() * 0.7;
    ctx.fillStyle = bump ? `rgba(${rand() < 0.5 ? '255,255,255' : '0,0,0'},0.4)` : `rgba(${rand() < 0.5 ? '0,0,0' : '255,255,255'},${0.05 + rand() * 0.05})`;
    ctx.fillRect(x, y, s, s);
  }
  ctx.lineWidth = 0.35;
  for (let i = 0; i < 7000 * density; i++) {
    ctx.strokeStyle = bump ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(rand() * L, rand() * H, 1 + rand() * 1.6, rand() * TAU, rand() * TAU + 2.2); ctx.stroke();
  }
  if (!bump) {
    // Wear: the corners and edges rubbed pale, and some scratches.
    for (const [x, y] of [[0, 0], [0, H], [g.boardLength * 1000, 0], [g.boardLength * 1000, H], [g.frontStart * 1000, 0], [g.frontStart * 1000, H], [L, 0], [L, H]]) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 22);
      grad.addColorStop(0, 'rgba(255,240,220,0.22)'); grad.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = grad; ctx.fillRect(x - 22, y - 22, 44, 44);
    }
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(255,235,210,${0.04 + rand() * 0.08})`;
      const x = rand() * L, y = rand() * H, a = rand() * TAU, l = 4 + rand() * 30;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
  }

  const back = [0, g.boardLength * 1000], front = [g.frontStart * 1000, L];
  const spine = [g.spineStart * 1000, (g.spineStart + g.spine) * 1000];
  const mid = (a) => (a[0] + a[1]) / 2;

  // The back: trim and a smaller emblem.
  trim(ctx, F, g.trim, back[0], 0, back[1], H, rand);
  EMBLEM[g.emblem]?.(ctx, F, mid(back), H / 2, 52, rand);

  // The spine: raised bands, the title up its length, a mark at the foot.
  F.set(spine[0], 0, spine[1], H);
  for (const [z0, z1] of [[20, 24], [29, 31], [H - 24, H - 20], [H - 31, H - 29]]) ctx.fillRect(spine[0] + 2, z0, spine[1] - spine[0] - 4, z1 - z0);
  ctx.save();
  ctx.translate(mid(spine), H / 2); ctx.rotate(Math.PI / 2);
  F.set(-150, -20, 150, 20);
  const spineTitle = g.title.toUpperCase();
  const spineSize = fitSize(ctx, spineTitle, 15, 3, TITLE_FONT, Math.min(H - 190, 260));
  spaced(ctx, spineTitle, 0, spineSize * 0.35, spineSize, 3, TITLE_FONT);
  ctx.restore();
  EMBLEM[g.emblem]?.(ctx, F, mid(spine), H - 52, 18, rand);

  // The front.
  trim(ctx, F, g.trim, front[0], 0, front[1], H, rand);
  const cx = mid(front) + 3;
  const words = g.title.trim().split(/\s+/);
  const head = words.slice(0, -1).join(' ');
  const last = words[words.length - 1].toUpperCase();
  F.set(cx - 100, 40, cx + 100, 150);
  // What the trim leaves free: the board less the frame, its corners and a margin.
  const usable = front[1] - front[0] - 2 * 40;
  const lastSize = fitSize(ctx, last, 54, 5 * 0.1 + 3, TITLE_FONT, usable);
  const lastTrack = Math.max(1.5, Math.min(6, lastSize * 0.1));
  if (head) {
    const headSize = fitSize(ctx, head.toUpperCase(), 21, 6, TITLE_FONT, usable * 0.8);
    ctx.save();
    if (!bump) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 2; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1.5; }
    spaced(ctx, head.toUpperCase(), cx, 66, headSize, Math.min(6, headSize * 0.28), TITLE_FONT);
    ctx.restore();
  }
  ctx.save();
  if (!bump) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 2; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1.5; }
  const lastWidth = spaced(ctx, last, cx, 66 + (head ? lastSize * 0.95 : 28), lastSize, lastTrack, TITLE_FONT);
  ctx.restore();
  if (g.drips) {
    const base = 66 + (head ? lastSize * 0.95 : 28) + 3;
    ctx.fillStyle = bump ? '#d0d0d0' : '#7d0c12';
    for (let i = 0; i < 7; i++) {
      const x = cx - lastWidth / 2 + (lastWidth * (i + 0.5 + (rand() - 0.5) * 0.5)) / 7, len = 6 + rand() * (i % 2 ? 26 : 12), w = 1.2 + rand() * 1.1;
      ctx.beginPath();
      ctx.moveTo(x - w, base); ctx.lineTo(x - w * 0.6, base + len); ctx.arc(x, base + len, w * 0.9, Math.PI, 0, true); ctx.lineTo(x + w, base); ctx.fill();
    }
  }
  F.set(cx - 90, 160, cx + 90, 330);
  EMBLEM[g.emblem]?.(ctx, F, cx, 262, 84, rand);
  F.set(cx - 100, 380, cx + 100, 410);
  ctx.font = `italic 11px ${TITLE_FONT}`; ctx.textAlign = 'center';
  const sub = g.subtitle || '';
  if (sub) {
    ctx.save();
    if (!bump) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 1.5; ctx.shadowOffsetY = 1; }
    let size = 11;
    ctx.font = `italic ${size}px ${TITLE_FONT}`;
    while (ctx.measureText(sub).width > usable && size > 4) { size -= 0.5; ctx.font = `italic ${size}px ${TITLE_FONT}`; }
    ctx.fillText(sub, cx, 388);
    ctx.restore();
  }
  ctx.textAlign = 'left';

  // The inside: marbled endpaper, a turned-in edge of cloth, and a bookplate on the front.
  ctx.save();
  ctx.translate(0, H);
  if (!bump) {
    for (let i = 0; i < 18; i++) {
      const x = rand() * L, y = rand() * H, r = 30 + rand() * 90;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${rand() < 0.5 ? '90,40,40' : '60,60,80'},0.045)`); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = shade(g.endpaper, 0.9); ctx.strokeStyle = shade(g.endpaper, 0.9); ctx.lineWidth = 0.5;
    for (let y = 20; y < H; y += 38) for (let x = 20; x < L; x += 38) { ctx.beginPath(); ctx.arc(x + ((y / 38) % 2) * 19, y, 4.5, 0, TAU); ctx.stroke(); star(ctx, x + ((y / 38) % 2) * 19, y, 3.2, 5); }
    ctx.fillStyle = g.cloth;
    for (const [a, b] of [back, front]) {
      ctx.fillRect(a === 0 ? 0 : b - 14, 0, 14, H);
      ctx.fillRect(a, 0, b - a, 14); ctx.fillRect(a, H - 14, b - a, 14);
    }
    // The bookplate (mirrored: this face lies the other way up when it is open); `g.bookplate: false` leaves the endpaper plain.
    if (g.bookplate !== false) {
    ctx.save();
    ctx.translate(mid(front), 0); ctx.scale(-1, 1);
    ctx.strokeStyle = '#3a2a1c'; ctx.fillStyle = '#3a2a1c';
    ctx.lineWidth = 0.9; ctx.strokeRect(-62, 150, 124, 134); ctx.lineWidth = 0.4; ctx.strokeRect(-59, 153, 118, 128);
    ctx.textAlign = 'center';
    // Each line is set at its size, then narrowed to sit inside the frame (118 wide, a little margin each side).
    const line = (text, font, y, size) => {
      ctx.font = `${font} ${size}px ${TITLE_FONT}`;
      const wide = ctx.measureText(text).width;
      if (wide > 108) ctx.font = `${font} ${(size * 108 / wide).toFixed(2)}px ${TITLE_FONT}`;
      ctx.fillText(text, 0, y);
    };
    line('EX LIBRIS', 'bold', 186, 17);
    line('the property of', 'italic', 206, 9.5);
    line('THE ONE WHO LISTENS', 'bold', 226, 11);
    line('(if found, do not return me.', 'italic', 252, 8.5);
    line('do not read after dark.)', 'italic', 264, 8.5);
    ctx.restore();
    }
  }
  ctx.restore();
  return canvas;
}

/* ------------------------------------------------------------------ */
/* the pages                                                           */
/* ------------------------------------------------------------------ */

export const PAGE_W = 768;
export const PAGE_H = 1075;
const HAND = '"Segoe Script","Bradley Hand","Snell Roundhand","Apple Chancery","URW Chancery L","Z003","Lucida Handwriting",cursive,"DejaVu Serif",serif';

function doodle(ctx, kind, x, y, s, rand) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.lineWidth = 1.4;
  const wob = () => (rand() - 0.5) * s * 0.06;
  if (kind === 0) { // a spiral
    ctx.beginPath();
    for (let t = 0; t < 22; t += 0.2) ctx.lineTo(Math.cos(t) * t * s * 0.021 + wob(), Math.sin(t) * t * s * 0.021 + wob());
    ctx.stroke();
  } else if (kind === 1) { // an eye
    ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.5, 0); ctx.quadraticCurveTo(0, s * 0.5, -s * 0.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.06, 0, TAU); ctx.fill();
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.18, -s * 0.2 - Math.abs(i) * -s * 0.04); ctx.lineTo(i * s * 0.22, -s * 0.38); ctx.stroke(); }
  } else if (kind === 2) { // tally marks
    for (let g = 0; g < 3; g++) {
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(g * s * 0.5 + i * s * 0.08, -s * 0.25 + wob()); ctx.lineTo(g * s * 0.5 + i * s * 0.08 + wob(), s * 0.25); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(g * s * 0.5 - s * 0.05, s * 0.18); ctx.lineTo(g * s * 0.5 + s * 0.35, -s * 0.18); ctx.stroke();
    }
  } else if (kind === 3) { // a tangle
    ctx.beginPath();
    for (let i = 0; i < 60; i++) ctx.lineTo((rand() - 0.5) * s, (rand() - 0.5) * s * 0.6);
    ctx.stroke();
  } else if (kind === 4) { // a face that has lost interest
    ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, TAU); ctx.stroke();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * s * 0.15 - s * 0.06, -s * 0.1 - s * 0.06); ctx.lineTo(d * s * 0.15 + s * 0.06, -s * 0.1 + s * 0.06); ctx.moveTo(d * s * 0.15 + s * 0.06, -s * 0.1 - s * 0.06); ctx.lineTo(d * s * 0.15 - s * 0.06, -s * 0.1 + s * 0.06); ctx.stroke(); }
    ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-s * 0.22 + i * s * 0.055, s * 0.18 + (i % 2 ? s * 0.04 : -s * 0.04)); ctx.stroke();
  } else { // a tentacle
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.03) ctx.lineTo(-s * 0.5 + t * s, Math.sin(t * 9) * s * 0.12 * (1 - t * 0.6));
    ctx.stroke();
  }
  ctx.restore();
}

const PRINT = '"Georgia","Iowan Old Style","Palatino Linotype","DejaVu Serif",serif';
/** The face a page is written in: a hand, or (g.print) a plain steady print for real text. */
const faceOf = (g, size, bold) => (g.print ? `${bold ? 'bold ' : ''}${size}px ${g.font ?? PRINT}` : `${bold ? 'bold ' : ''}italic ${size}px ${g.font ?? HAND}`);

/**
 * The text laid out as lines for a page of this kind: [{ words, width, size, big } | { gap, small }]. A paragraph is
 * a line of the string; a blank line is a gap; `*stress*`, `~strike~` and a leading `#` are marks.
 */
function layoutText(ctx, g, text) {
  const W = PAGE_W, ppm = W / 300;
  const inner = 50 * ppm, outer = 22 * ppm;
  const width = W - inner - outer;
  const base = (g.print ? 6.2 : 6.8) * ppm;
  const lines = [];
  for (const paragraph of String(text ?? '').split('\n')) {
    if (!paragraph.trim()) { lines.push({ gap: true }); continue; }
    const big = paragraph.startsWith('#');
    const body = big ? paragraph.slice(1).trim() : paragraph;
    const words = body.split(/\s+/).map((raw) => {
      const m = /^([*~]?)(.*?)([*~]?)([.,;:!?)"']*)$/.exec(raw);
      const mark = m[1] || m[3];
      const word = m[2] + m[4];
      const caps = !g.print && word.length > 3 && /[A-Z]/.test(word) && word === word.toUpperCase();
      return { word, raw, under: mark === '*', strike: mark === '~', caps };
    });
    const size = big ? base * 1.9 : base;
    let line = [], used = 0;
    const flush = () => { lines.push({ words: line, width: used, size, big }); line = []; used = 0; };
    for (const w of words) {
      const wsize = size * (w.caps ? 1.18 : 1);
      ctx.font = faceOf(g, wsize, w.caps || big);
      const adv = ctx.measureText(w.word + ' ').width;
      if (used + adv > width && line.length) flush();
      line.push({ ...w, adv, size: wsize });
      used += adv;
    }
    if (line.length) flush();
    lines.push({ gap: true, small: true });
  }
  return { lines, base, width };
}

/** How far down the page a line takes the pen: the same sum whether the page is written or only measured. */
const advance = (line, base, jitter = 0) => (line.gap ? base * (line.small ? 0.5 : 1.4) : line.size * 1.45 + base * 0.16 + jitter);

/**
 * Real text to pages: the string cut into page-sized pieces by the same
 * measuring the pages are written with, so each piece fills a page and no
 * more. Give it `{ print, font }` as the book is styled. Needs a canvas.
 */
export function flowPages(text, g = {}) {
  const ctx = canvasOf(8, 8).getContext('2d');
  const { lines, base } = layoutText(ctx, g, text);
  const ppm = PAGE_W / 300;
  // What writePage has below its first baseline: the page less margins, less the first line's own start.
  const room = PAGE_H - (32 + 38) * ppm - base;
  const pages = [];
  let page = [], y = 0;
  const flushPage = () => { pages.push(page.join('\n').replace(/\n+$/, '')); page = []; y = 0; };
  let paragraph = [], heading = false;
  const endParagraph = () => { if (paragraph.length) page.push((heading ? '#' : '') + paragraph.join(' ')); paragraph = []; };
  for (const line of lines) {
    if (line.gap) {
      endParagraph();
      if (!line.small && page.length) page.push('');
      y += advance(line, base);
      continue;
    }
    if (y + line.size * 0.35 > room && (page.length || paragraph.length)) { endParagraph(); flushPage(); }
    heading = line.big;
    paragraph.push(line.words.map((w) => w.raw).join(' '));
    y += advance(line, base);
  }
  endParagraph();
  if (page.length) flushPage();
  return pages;
}

/** Lay words in lines (with `*` `~` and `#` marks) and write each one a little off true. */
function writePage(ctx, g, side, text, number, rand) {
  const W = PAGE_W, H = PAGE_H, ppm = W / 300;
  const inner = 50 * ppm, outer = 22 * ppm, top = 32 * ppm, bottom = 38 * ppm;
  const left = side === 0 ? inner : outer, right = W - (side === 0 ? outer : inner);
  const hand = !g.print;
  ctx.fillStyle = g.ink;
  ctx.strokeStyle = g.ink;
  const { lines, base } = layoutText(ctx, g, text);
  let y = top + base;
  for (const line of lines) {
    if (line.gap) { y += advance(line, base); continue; }
    y += line.size * 0.35;
    if (y > H - bottom) break;
    const tilt = hand ? (rand() - 0.5) * 0.03 : 0;
    let x = left + (line.big ? (right - left - line.width) / 2 : 0);
    for (const w of line.words) {
      ctx.save();
      ctx.translate(x, y + (x - left) * tilt + (hand ? (rand() - 0.5) * 2.2 : 0));
      if (hand) ctx.rotate((rand() - 0.5) * 0.05);
      ctx.font = faceOf(g, w.size, w.caps || line.big);
      ctx.globalAlpha = hand ? 0.78 + rand() * 0.22 : 0.94;
      ctx.fillText(w.word, 0, 0);
      ctx.lineWidth = Math.max(1, w.size * 0.07);
      if (w.under) { ctx.beginPath(); ctx.moveTo(0, w.size * 0.14); ctx.quadraticCurveTo(w.adv / 2, w.size * 0.24, w.adv - w.size * 0.3, w.size * 0.12); ctx.stroke(); if (hand) { ctx.beginPath(); ctx.moveTo(0, w.size * 0.22); ctx.lineTo(w.adv - w.size * 0.4, w.size * 0.2); ctx.stroke(); } }
      if (w.strike) { ctx.beginPath(); ctx.moveTo(-2, -w.size * 0.25); ctx.lineTo(w.adv - w.size * 0.2, -w.size * (hand ? 0.33 : 0.25)); if (hand) { ctx.moveTo(-1, -w.size * 0.18); ctx.lineTo(w.adv - w.size * 0.25, -w.size * 0.14); } ctx.stroke(); }
      if (hand && rand() < 0.012) { ctx.beginPath(); ctx.arc(w.adv * 0.5, -w.size * 0.3, w.size * (0.1 + rand() * 0.2), 0, TAU); ctx.fill(); }
      ctx.restore();
      x += w.adv;
    }
    y += advance(line, base, hand ? rand() * 2 : 0) - line.size * 0.35;
  }

  // The margins: in a hand, a doodle or two; always the number (in a hand, not always right).
  ctx.globalAlpha = 0.85;
  if (hand && rand() < 0.65) doodle(ctx, (rand() * 6) | 0, left + rand() * (right - left - 70) + 35, top * 0.5 + (rand() - 0.5) * 6, 26 * ppm * (0.7 + rand() * 0.6), rand);
  if (hand && rand() < 0.55) doodle(ctx, (rand() * 6) | 0, left + rand() * (right - left - 70) + 35, H - bottom * 0.62 + (rand() - 0.5) * 8, 24 * ppm * (0.7 + rand() * 0.6), rand);
  ctx.globalAlpha = 0.9;
  ctx.font = faceOf(g, base * 0.9, false);
  ctx.textAlign = hand ? (side === 0 ? 'right' : 'left') : 'center';
  const label = hand && rand() < 0.05 ? String(number * 7) : String(number);
  ctx.fillText(label, hand ? (side === 0 ? right : left) : (left + right) / 2, H - bottom * 0.4);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function paperPage(ctx, side, rand) {
  const W = PAGE_W, H = PAGE_H;
  ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) {
    const x = rand() * W, y = rand() * H, r = 40 + rand() * 160;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(140,100,50,${0.04 + rand() * 0.07})`); grad.addColorStop(1, 'rgba(140,100,50,0)');
    ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 260; i++) {
    ctx.strokeStyle = `rgba(80,60,30,${0.03 + rand() * 0.04})`;
    const x = rand() * W, y = rand() * H, a = rand() * TAU, l = 3 + rand() * 10;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  const gutter = ctx.createLinearGradient(side === 0 ? 0 : W, 0, side === 0 ? W * 0.14 : W * 0.86, 0);
  gutter.addColorStop(0, 'rgba(60,40,20,0.2)'); gutter.addColorStop(1, 'rgba(60,40,20,0)');
  ctx.fillStyle = gutter; ctx.fillRect(0, 0, W, H);
  const edge = ctx.createLinearGradient(side === 0 ? W : 0, 0, side === 0 ? W * 0.94 : W * 0.06, 0);
  edge.addColorStop(0, 'rgba(110,80,40,0.22)'); edge.addColorStop(1, 'rgba(110,80,40,0)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);
}

/**
 * One leaf's two pages on one canvas: the front (recto) on the left half, the
 * back (verso) on the right, which is the way up it is seen from when turned.
 * `g` is { pages: [text, text], numbers: [n, n], ink, seed, font }.
 */
export function paintLeaf(g) {
  const canvas = canvasOf(PAGE_W * 2, PAGE_H);
  const ctx = canvas.getContext('2d');
  for (let side = 0; side < 2; side++) {
    const rand = mulberry((g.seed ?? 1) * 31 + side * 977 + 5);
    ctx.save();
    ctx.beginPath(); ctx.rect(side * PAGE_W, 0, PAGE_W, PAGE_H); ctx.clip();
    ctx.translate(side * PAGE_W, 0);
    paperPage(ctx, side, rand);
    if (g.pages[side] != null) writePage(ctx, g, side, g.pages[side], g.numbers[side], rand);
    ctx.restore();
  }
  return canvas;
}

/* ------------------------------------------------------------------ */
/* the madman's words                                                  */
/* ------------------------------------------------------------------ */

const PARAGRAPHS = [
  'The walls told me again last night that the house is only the *inside* of something. I asked of what. They hummed the same three notes and would not say. I have written the notes here so that you will not have to hear them: do, re, ~mi~ no. No. They are not those.',
  'I have counted the stairs. There are thirteen going up and fourteen coming down. I have asked the stairs about this and they are very quiet about it, the way a man is quiet who owes you money.',
  'Tuesday. (It is not Tuesday.) The moon came in through the keyhole and sat in the good chair. It wanted to talk about the *arrangement*. I said I had made no arrangement. It said that was the arrangement.',
  'THEY ARE IN THE WALLS. They are not in the walls, the walls are in *them*. I understand it now. I have understood it all morning. I am sorry I wrote the first part, ignore the first part, I have crossed it out in my head.',
  'The soup knows. I did not tell the soup. I have told no one except the lamp, and the lamp has always been a gossip. If the soup is asking questions again I shall not eat the soup. I shall not. I am eating the soup.',
  'There is a man who lives in my left ear. He is perfectly polite and keeps very regular hours. At night he rearranges the furniture of my thoughts so that when I wake I walk into them. Last week he moved my mother. She did not mind, but she is not where she was.',
  'Seven. Seven. Seven windows and one of them is not a window. I have looked through it and I saw myself looking through it and that other one was *taller*. I closed the shutter. I nailed the shutter. In the morning the nails were on the other side.',
  'The lighthouse is not a lighthouse. It does not warn the ships. It *calls* them. I have watched for forty nights and not one ship has refused. Each one goes in a little way and then there is only the sound a throat makes.',
  'Do not trust the number eleven. It is two things pretending to be one thing, and I know a little about that. It stands at the end of the corridor with its hands behind it. It is waiting for me to say what is behind the hands.',
  'I have trained the spiders. They write in the corners, small, and what they write is accounts. Whose accounts I would not say. I have seen my own name among the debits. I will pay it. I will pay it in the old coin. They will know the coin.',
  'In the night the clock went backwards for an hour and gave me back a tooth I lost at nine. I am very grateful. I do not know what it will cost me and the clock will not say. It only *ticks*, which is a way of saying yes.',
  'The postman has my face. I do not mean he resembles me. I mean that when he leans in to the door, it is my face he has leaned in with, and he carries yesterday in the bag. He will not hand it over. He says I must *sign* for it.',
  'Whatever you do, do not whistle in the cellar. I whistled. Something whistled back, and it was better than I am, and it has been practicing ever since, and I can hear it improve.',
  'My shadow left in March. It sent a postcard. The postcard was of a very large room, with a very large chair, and on the back in my own hand: *you will like it here, there is room for everything you have forgotten*.',
  'Rain again, from the inside. It falls up the walls, and I stand in the middle of the room with a bucket to catch what is going the other way. Catching nothing. This is the whole of my work and I am good at it.',
  'The cat is not mine. The cat has never been mine. The cat is a *delegate*. It sits on the sill and takes notes with its eyes and every evening it goes out the way delegates do and reports, and comes back fatter.',
  'I dreamt a door, and in the door a smaller door, and in that a smaller, and at the end of it a hand the size of a seed that knocked from inside. I woke up and the knocking had not stopped. It is *in the bed* now. It is in the bed with me.',
  'The mirror in the hall has begun to arrive late. When I raise my arm it raises its arm, afterwards, thoughtfully, as though it is considering whether to. I have tried to catch it out. I wave very quickly. It is learning to wave quickly.',
  'Mice in the clock, mice in the bread, mice in the pocket of the dead man who sits in the parlor on Thursdays and does not mind. They are not mice. Do not call them mice to their faces. They will want to know what you mean.',
  'It was explained to me by a bird that the sea is not wet, that wet is a thing the sea *does to us*, out of spite. I wrote this down at once. I have since wept at how right the bird was. It sat on the rail and took the credit.',
  'The bees have started making something other than honey. It is dark and it smells of cold pennies and it fills the combs in the roof in shapes I almost recognise. I put a spoon to it. The spoon came out *older*.',
  'THEY SAY I MUST REST. They say it through the keyhole in very reasonable voices. I have said that I will rest when the last of the dust has been accounted for, and the dust is *infinite*, and they have stopped saying it through the keyhole and have started to say it through the floor.',
  'Page forty-one is missing from every book in the house. It is not torn out. The books simply have no forty-one, and go from forty to forty-two as if it were nothing, as if forty-one were a word you are not supposed to know. I know it. I do not wish to write it.',
  'I met myself on the landing, going the other way, in a better coat. We nodded. There was no need to speak. He knew what I had done and I knew what he was going to do and we agreed, in the way of men on staircases, to do it in different rooms.',
  'The tide has stopped at the wrong place and is *thinking*. All the little crabs are standing very still in the road. Do you see? Do you see what they are looking at? Do not look at what they are looking at.',
  'Every night at the same hour the pictures turn their faces from the wall. Every morning I turn them back. We are both very patient. We have been doing this for years. It is, I believe, a kind of marriage.',
  'My hands are not my hands today. They are the hands of a careful person, one who would never spill. I have decided to let them do my writing, and you will notice the improvement, and you will not ask whose hands.',
  'Under the floor of the chapel is another chapel, and under that one, a third, and in the third a very long table laid for a great many, with all the chairs pulled out a little. I was shown to my place. My name was already there, spelled the old way.',
  'I have invented a new color. It is the color of the second before you remember something. I painted one wall with it and now I cannot remember what I was going to say, and the wall is *very pleased*.',
  'A small grey man sells me the evenings. He will take nothing for them but the mornings. I thought this a bargain. I am beginning to doubt that I have ever had a morning. I will ask the man. I cannot find the man. It is evening.',
];

const HEADINGS = [
  'THE SEVENTH WINDOW', 'ON THE HABITS OF STAIRS', 'AN ACCOUNT OF THE MOON', 'WHAT THE SOUP SAID', 'THE LEFT EAR',
  'DO NOT WHISTLE', 'INVENTORY (INCOMPLETE)', 'THE LONG TABLE', 'WEDNESDAY, AGAIN', 'AGAINST THE NUMBER ELEVEN',
  'THE DELEGATE', 'LETTERS NOT SENT', 'HOW TO LEAVE A ROOM', 'THE TIDE IS THINKING',
];

const NOUNS = ['kettle', 'stairwell', 'wallpaper', 'weathervane', 'candle', 'bell', 'well', 'umbrella', 'doorknob', 'gramophone', 'ceiling', 'pantry', 'attic', 'weather', 'chimney'];
const PERSONS = ['postman', 'man in the left ear', 'second tenant', 'cat', 'moon', 'clock', 'tall one', 'girl who is not there', 'priest', 'landlord'];
const VERBS = ['hum', 'lean', 'lie to me', 'count itself', 'turn toward the window', 'remember my name', 'grow', 'rehearse', 'bleed a little', 'wait'];
const REACTIONS = ['did not blink', 'folded itself into a letter and left', 'said *yes* in a voice that was not its own', 'asked me to repeat what I had not said', 'laughed, and went on laughing after it had gone', 'agreed with everything and moved a chair'];

const made = (rand) => {
  const pick = (a) => a[(rand() * a.length) | 0];
  return `The ${pick(NOUNS)} in the ${pick(NOUNS)} has begun to ${pick(VERBS)} again. I told the ${pick(PERSONS)}, and the ${pick(PERSONS)} ${pick(REACTIONS)}. I wrote it down so it would be true. It is not yet true. It is only *written*.`;
};

/** What the book writes on page `n` (1, 2, ...) when it is given nothing else. The same page is always the same. */
export function madnessPage(n, seed = 0) {
  const rand = mulberry(n * 7919 + seed * 104729 + 11);
  const out = [];
  const used = new Set();
  let chars = 0;
  if (rand() < 0.3) { const h = HEADINGS[(rand() * HEADINGS.length) | 0]; out.push(`#${h}`); chars += 160; }
  while (chars < 1700) {
    const r = rand();
    let part;
    if (r < 0.58) { const i = (rand() * PARAGRAPHS.length) | 0; if (used.has(i)) continue; used.add(i); part = PARAGRAPHS[i]; }
    else if (r < 0.78) part = made(rand);
    else if (r < 0.86) part = Array.from({ length: 28 }, (_, i) => (i === 13 + ((rand() * 4) | 0) ? 'NO' : String(i + 1))).join(' ') + '.';
    else if (r < 0.93) { const w = ['they are listening', 'it is not me', 'I was here first', 'seven', 'the door is a mouth'][(rand() * 5) | 0]; part = Array.from({ length: 5 }, () => w).join(', ') + '.'; }
    else part = ['I AM PERFECTLY WELL', 'DO NOT LOOK BEHIND YOU', 'IT HAS NOT YET NOTICED THIS PAGE', 'ASK THE DUST'][(rand() * 4) | 0];
    out.push(part);
    chars += part.length + 40;
  }
  return out.join('\n');
}

/** The title page, and the one after it, from the book's own title. */
export function openingPages(title, subtitle) {
  return [
    `#${title.toUpperCase()}\n\n${subtitle}\n\n*Do not read aloud.*\n\nbeing a true and complete record, in my own hand,\nand in some places my own blood,\nand in one place soup.`,
    'To whoever finds this: I am not here. I have not been here for some time. What you are holding was written by the man who lived here before I did, and I only copied it out, and where I could not read his hand I made it up, and where I made it up it has come true.\n\nStart anywhere. It does not matter. It has already started.',
  ];
}
