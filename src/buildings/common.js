/** A seeded random source: calls give 0 up to 1. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * What the building models share: palettes, a way to name the four faces of a
 * box so windows and doors and half-timbering can be put on them, and the
 * small things that turn up everywhere (chimneys, fences, barrels, logs).
 */

export const PALETTE = {
  plaster: ['#eadfc4', '#e0d2b0', '#f0e8d2', '#dccaa2', '#cdb78c', '#e4d6be', '#d8c8a6'],
  ochre: ['#d6b26a', '#cfa45a', '#c99a50'],
  tile: ['#b5553b', '#a64a30', '#c26141', '#9c4833', '#b95c3c'],
  slate: ['#5e6670', '#6a727c', '#535b66'],
  thatch: ['#cbab5e', '#bf9f52', '#d3b66a', '#b59346'],
  timber: '#44301e',
  oak: '#5a4026',
  stone: ['#a8a090', '#9a9283', '#b4ac9a', '#8f887a'],
  door: ['#6a4426', '#5a3a20', '#7a5030', '#3f5a40', '#7a3a2a', '#35465f'],
  shutter: ['#3f5a40', '#35465f', '#7a3a2a', '#5a3a20', '#6a4a70'],
  glass: '#27384a',
  warm: '#ffb45a',
  fire: '#ff8a2a',
  banner: ['#b32a2a', '#2a4a9a', '#c9a227', '#2a7a4a'],
  hay: '#d8b858',
  wood: ['#8a6840', '#7a5a38', '#9a7648'],
};

export const pickFrom = (rnd, list) => list[Math.floor(rnd() * list.length) % list.length];

/** A seeded random source for a model's variant. */
export const rngFor = (variant, salt = 0) => mulberry32((variant + 1) * 7919 + salt * 104729);

/**
 * The four faces of a box, each with an origin (its lower left seen from
 * outside), `U` along it, `V` up it, `N` out of it. `at(face, u, v, off)` is a
 * point on a face: u along, v up, off out from it.
 */
export function faces(x0, z0, x1, z1, y0, y1) {
  return {
    front: { P: [x0, y0, z1], U: [1, 0, 0], V: [0, 1, 0], N: [0, 0, 1], w: x1 - x0, h: y1 - y0, holes: [] },
    back: { P: [x1, y0, z0], U: [-1, 0, 0], V: [0, 1, 0], N: [0, 0, -1], w: x1 - x0, h: y1 - y0, holes: [] },
    right: { P: [x1, y0, z1], U: [0, 0, -1], V: [0, 1, 0], N: [1, 0, 0], w: z1 - z0, h: y1 - y0, holes: [] },
    left: { P: [x0, y0, z0], U: [0, 0, 1], V: [0, 1, 0], N: [-1, 0, 0], w: z1 - z0, h: y1 - y0, holes: [] },
  };
}

export const at = (f, u, v, off = 0) => [
  f.P[0] + f.U[0] * u + f.V[0] * v + f.N[0] * off,
  f.P[1] + f.U[1] * u + f.V[1] * v + f.N[1] * off,
  f.P[2] + f.U[2] * u + f.V[2] * v + f.N[2] * off,
];

/** A flat rectangle on a face: `u0..u1` across and `v0..v1` up, `off` out from the wall. */
export function panel(m, mat, f, u0, v0, u1, v1, off, col, o) {
  m.quad(mat, at(f, u0, v0, off), at(f, u1, v0, off), at(f, u1, v1, off), at(f, u0, v1, off), col, o);
}

/**
 * How far from its wall each layer of a wall's dressing stands. Every layer is
 * a few millimetres past the one under it, so no two faces share a plane: faces
 * that do fight for the pixel, and flicker as the camera moves.
 */
export const LAYER = Object.freeze({ glass: 0.006, glow: 0.011, frame: 0.016, shutter: 0.034 });

/** A window on a face: glass in a timber frame, with a lit pane over it that shows at night, and shutters if asked. */
export function windowOn(m, f, u, v, w, h, { shutters = null, sill = true, glow = true, frame = PALETTE.timber } = {}) {
  const t = 0.028;
  const reach = w / 2 + t + (shutters ? 0.09 : 0);
  f.holes?.push([u - reach, u + reach, v - t, v + h + t]);
  panel(m, 'glass', f, u - w / 2, v, u + w / 2, v + h, LAYER.glass, PALETTE.glass);
  if (glow) panel(m, 'glow', f, u - w / 2 + 0.012, v + 0.012, u + w / 2 - 0.012, v + h - 0.012, LAYER.glow, PALETTE.warm);
  // The frame: four thin bars and a mullion, the sides and the mullion cut to fit between the top and bottom bars.
  const o = LAYER.frame;
  const bar = (a, b, c, d) => panel(m, 'trim', f, a, b, c, d, o, frame, { uvScale: 2 });
  const foot = v + t * 0.6, head = v + h - t * 0.6;
  bar(u - w / 2 - t, v - t, u + w / 2 + t, foot);
  bar(u - w / 2 - t, head, u + w / 2 + t, v + h + t);
  bar(u - w / 2 - t, foot, u - w / 2 + t * 0.4, head);
  bar(u + w / 2 - t * 0.4, foot, u + w / 2 + t, head);
  bar(u - t * 0.3, foot, u + t * 0.3, head);
  if (sill) m.quad('stone', at(f, u - w / 2 - 0.05, v - t, 0.05), at(f, u + w / 2 + 0.05, v - t, 0.05), at(f, u + w / 2 + 0.05, v - t, 0.0), at(f, u - w / 2 - 0.05, v - t, 0.0), PALETTE.stone[0]);
  if (shutters) {
    for (const s of [-1, 1]) {
      const x = u + s * (w / 2 + 0.045);
      panel(m, 'wood', f, x - 0.04, v, x + 0.04, v + h, LAYER.shutter, shutters);
    }
  }
}

/** A door on a face: planks, a lintel, a stone step, an iron ring. */
export function doorOn(m, f, u, w, h, col, { step = true } = {}) {
  f.holes?.push([u - w / 2 - 0.035, u + w / 2 + 0.035, 0, h + 0.04]);
  panel(m, 'wood', f, u - w / 2, 0, u + w / 2, h, 0.012, col);
  panel(m, 'trim', f, u - w / 2 - 0.035, h, u + w / 2 + 0.035, h + 0.04, 0.016, PALETTE.timber, { uvScale: 2 });
  panel(m, 'trim', f, u - w / 2 - 0.035, 0, u - w / 2, h, 0.016, PALETTE.timber, { uvScale: 2 });
  panel(m, 'trim', f, u + w / 2, 0, u + w / 2 + 0.035, h, 0.016, PALETTE.timber, { uvScale: 2 });
  panel(m, 'metal', f, u + w / 2 - 0.07, h * 0.45, u + w / 2 - 0.045, h * 0.45 + 0.025, 0.02, '#2a2a2a');
  if (step) m.box('stone', ...bounds(f, u - w / 2 - 0.05, u + w / 2 + 0.05, 0, 0.055, 0.0, 0.1), PALETTE.stone[0], { skip: ['bottom'] });
}

/** The axis-aligned box a rectangle on a face and an extent out of it makes, as x0 y0 z0 x1 y1 z1. */
function bounds(f, u0, u1, v0, v1, o0, o1) {
  const a = at(f, u0, v0, o0), b = at(f, u1, v1, o1);
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])];
}

/** The half-timbering waits for the rest of its model, so that it can leave the windows and doors alone: `modelFor` draws it once the model is done. */
const timberLater = [];
export function drawTimber() {
  for (const draw of timberLater.splice(0)) draw();
}

/**
 * Half-timbering on a face: posts at `cols` along it, rails at the given
 * heights, and braces in the end panels of each storey, rising toward the
 * middle of the wall, the same on both sides. The beams stand a hair proud, and
 * they are cut to meet square, the posts and braces stopping at the rails and
 * the posts, because two beams that overlap with their faces in one plane flicker
 * where they cross. No post or brace runs across a window or a door (`f.holes`,
 * which the windows and doors put there), and a brace is only put in a panel
 * whose shape suits one.
 */
export function halfTimber(m, f, { cols = 4, rails = null, brace = true, thick = 0.032, col = PALETTE.timber, skip = [], capped = true } = {}) {
  timberLater.push(() => drawHalfTimber(m, f, { cols, rails, brace, thick, col, skip, capped }));
}

function drawHalfTimber(m, f, { cols, rails, brace, thick, col, skip, capped }) {
  const r = thick / 2;
  const hs = [...(rails ?? [0, f.h])];
  // A rail right at the eaves would poke through the roof: keep it just under.
  if (capped) hs[hs.length - 1] -= 0.045;
  // A rail on the ground would sink into the stone base it stands on, and one at the top of a storey into the storey above, whose own rail would then lie in its plane: each is kept wholly within the wall.
  for (let i = 0; i < hs.length; i++) hs[i] = Math.min(Math.max(hs[i], r), f.h - r);
  const off = 0.01;
  const beam = (a, b) => m.beam('trim', at(f, a[0], a[1], off), at(f, b[0], b[1], off), thick, col, { uvScale: 2 });
  // Does anything cut in the wall lie across this rectangle (u0..u1, v0..v1)?
  const blocked = (u0, u1, v0, v1) => (f.holes ?? []).some(([a, b, c, d]) => a < u1 && b > u0 && c < v1 && d > v0);
  // Nothing is quite flush with the corners of the wall: a beam end in the plane of the next wall would fight it.
  const e = 0.004;
  for (const v of hs) beam([e, v], [f.w - e, v]);
  const post = (c) => e + r + ((f.w - 2 * (e + r)) * c) / cols;
  for (let c = 0; c <= cols; c++) {
    for (let k = 0; k + 1 < hs.length; k++) {
      if (c > 0 && c < cols && blocked(post(c) - r, post(c) + r, hs[k] + r, hs[k + 1] - r)) continue;
      beam([post(c), hs[k] + r], [post(c), hs[k + 1] - r]);
    }
  }
  if (!brace || cols < 2) return;
  for (let k = 0; k + 1 < hs.length; k++) {
    for (const c of [0, cols - 1]) {
      if (skip.some(([sc, sr]) => sc === c && sr === k)) continue;
      // The clear panel between the posts and rails, and a brace across it that stops short of them.
      const u0 = post(c) + r, u1 = post(c + 1) - r, v0 = hs[k] + r, v1 = hs[k + 1] - r;
      const dx = u1 - u0, dy = v1 - v0, len = Math.hypot(dx, dy);
      if (dx / dy < 0.55 || dx / dy > 1.8 || blocked(u0, u1, v0, v1)) continue;
      const cs = dx / len, sn = dy / len;
      const cut = Math.max(r * (1 + sn) / cs, r * (1 + cs) / sn);
      if (len - 2 * cut < thick) continue;
      // Both end braces rise toward the middle: the left one leans like /, the right one like \.
      const flip = c !== 0;
      const sx = flip ? -1 : 1, x0 = flip ? u1 : u0, x1 = flip ? u0 : u1;
      beam([x0 + sx * cs * cut, v0 + sn * cut], [x1 - sx * cs * cut, v1 - sn * cut]);
    }
  }
}

/** A chimney: a stone stack with a lip and a cap. Returns the top, where the smoke comes from. */
export function chimney(m, x, z, y0, y1, { w = 0.17, col = PALETTE.stone[1] } = {}) {
  m.box('stone', x - w / 2, y0, z - w / 2, x + w / 2, y1, z + w / 2, col, { skip: ['bottom'] });
  m.box('stone', x - w / 2 - 0.03, y1 - 0.05, z - w / 2 - 0.03, x + w / 2 + 0.03, y1 + 0.03, z + w / 2 + 0.03, PALETTE.stone[3], { skip: ['bottom'] });
  m.box('plain', x - w / 4, y1 + 0.02, z - w / 4, x + w / 4, y1 + 0.035, z + w / 4, '#1a1612', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  return [x, y1 + 0.05, z];
}

/** A run of post-and-rail fence between two points. A run that starts where another ended leaves out its first post (`first: false`), as two posts in one place fight. */
export function fenceRun(m, a, b, { h = 0.2, col = PALETTE.wood[0], posts = 0.34, first = true } = {}) {
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const n = Math.max(1, Math.round(len / posts));
  for (let i = first ? 0 : 1; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t;
    m.box('wood', x - 0.016, y, z - 0.016, x + 0.016, y + h, z + 0.016, col, { skip: ['bottom'], uvScale: 2 });
  }
  for (const k of [0.45, 0.8]) {
    m.beam('wood', [a[0], a[1] + h * k, a[2]], [b[0], b[1] + h * k, b[2]], 0.014, col, { uvScale: 2 });
  }
}

/** A barrel: staves, two hoops. */
export function barrel(m, x, y, z, { r = 0.07, h = 0.13, col = PALETTE.wood[1] } = {}) {
  m.cylinder('wood', x, y, z, r * 0.9, r, h, 8, col, { bottom: false });
  for (const k of [0.25, 0.75]) m.cylinder('metal', x, y + h * k - 0.006, z, r * 1.02, r * 1.02, 0.012, 8, '#3a3a3a', { caps: false });
}

/** A crate. */
export function crate(m, x, y, z, s = 0.11, col = PALETTE.wood[2], yaw = 0) {
  m.at(x, y, z, () => m.box('wood', -s / 2, 0, -s / 2, s / 2, s, s / 2, col, { skip: ['bottom'] }), yaw);
}

/** A sack: a squashed, tied lump. */
export function sack(m, x, y, z, col = '#cbb68a', r = 0.06) {
  m.sphere('cloth', x, y + r * 0.8, z, r, r * 0.85, r, col, { detail: 0, flat: false });
}

/** A stack of logs lying along x: rows of cut ends. */
export function logPile(m, x, y, z, { len = 0.34, rows = 3, r = 0.035, yaw = 0 } = {}) {
  m.at(x, y, z, () => {
    for (let row = 0; row < rows; row++) {
      for (let k = 0; k < rows - row; k++) {
        const zz = (k - (rows - row - 1) / 2) * r * 2.05;
        m.push().rotateZ(Math.PI / 2);
        m.cylinder('bark', row * r * 1.8 + r, -len / 2, zz, r, r, len, 7, '#6a4a2c', { smooth: true, capCol: '#c9a26a' });
        m.pop();
      }
    }
  }, yaw);
}

/** A haystack: a lump on a stand, its top pulled to a point. */
export function haystack(m, x, y, z, r = 0.16) {
  m.cylinder('thatch', x, y, z, r * 0.15, r, r * 1.1, 9, PALETTE.hay, { smooth: true });
  m.sphere('thatch', x, y + r * 0.95, z, r * 0.6, r * 0.2, r * 0.6, PALETTE.hay, { detail: 0 });
}

/** A hanging sign on a bracket from a face: an arm out from the wall and a board hung from it. */
export function sign(m, f, u, v, col = '#c9a227') {
  m.beam('metal', at(f, u, v, 0.01), at(f, u, v, 0.24), 0.016, '#2a2a2a');
  const c = at(f, u, v - 0.12, 0.17);
  const half = (a) => [Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2])];
  const n = half(f.N), up = half(f.V), side = half(f.U);
  const ext = [0, 1, 2].map((i) => n[i] * 0.075 + up[i] * 0.065 + side[i] * 0.012);
  m.box('wood', c[0] - ext[0], c[1] - ext[1], c[2] - ext[2], c[0] + ext[0], c[1] + ext[1], c[2] + ext[2], col, { skip: [] });
}

/** A flagstaff with a flag, which flies from the top. Returns the top. */
export function flag(m, x, y, z, h, col, { w = 0.3, ht = 0.16, yaw = 0 } = {}) {
  m.at(x, y, z, () => {
    m.cylinder('wood', 0, 0, 0, 0.012, 0.02, h, 6, '#4a3a2a');
    m.quad('cloth', [0.01, h - ht, 0], [w, h - ht * 0.9, 0.02], [w, h - 0.02, 0.02], [0.01, h, 0], col);
    m.quad('cloth', [0.01, h, 0], [w, h - 0.02, 0.02], [w, h - ht * 0.9, 0.02], [0.01, h - ht, 0], col);
    m.sphere('metal', 0, h + 0.012, 0, 0.022, 0.022, 0.022, '#d4b24a', { detail: 0 });
  }, yaw);
  return [x, y + h, z];
}

/** Crenellations along a wall run from a to b at height y, on its top: a row of merlons. */
export function crenellate(m, a, b, y, { h = 0.1, w = 0.1, gap = 0.09, t = 0.12, col = PALETTE.stone[0] } = {}) {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.floor(len / (w + gap)));
  const ux = dx / len, uz = dz / len;
  const yaw = Math.atan2(-uz, ux);
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * (len / n);
    m.at(a[0] + ux * s, y, a[2] + uz * s, () => m.box('stone', -w / 2, 0, -t / 2, w / 2, h, t / 2, col, { skip: ['bottom'] }), yaw);
  }
}
