import { PALETTE, barrel, chimney, crate, doorOn, fenceRun, flag, crenellate, faces, halfTimber, panel, pickFrom, sign, windowOn, at } from './common.js';
import { cart, gabled } from './parts.js';

/**
 * Civic buildings: the well, the green, the tavern, the chapel, the healer's,
 * the market square, the watchtower, the barracks, the gatehouse and the
 * cathedral.
 */

const STONE = ['#a8a090', '#9a9283', '#b4ac9a', '#8f887a'];

export function well(m, v) {
  const { rnd } = v;
  m.cylinder('stone', 0, -0.2, 0, 0.3, 0.32, 0.55, 12, pickFrom(rnd, STONE), { smooth: true, bottom: false });
  m.cylinder('stone', 0, 0.33, 0, 0.3, 0.3, 0.03, 12, STONE[3], { smooth: true });
  m.cylinder('plain', 0, 0.345, 0, 0.23, 0.23, 0.01, 12, '#0a1218', { smooth: true, caps: true });
  for (const s of [-1, 1]) m.box('wood', s * 0.25 - 0.03, 0.33, -0.03, s * 0.25 + 0.03, 0.95, 0.03, PALETTE.wood[1], { skip: ['bottom'] });
  m.beam('wood', [-0.27, 0.8, 0], [0.27, 0.8, 0], 0.05, PALETTE.wood[0]);
  m.gable('tile', -0.3, -0.22, 0.3, 0.22, 0.92, 1.18, pickFrom(rnd, PALETTE.tile), { over: 0.08, gable: 'wood', gableColor: PALETTE.wood[1], axis: 'x' });
  // The rope wound on the windlass and down to the bucket's bail; the crank on the end of the axle.
  m.push().translate(0, 0.8, 0).rotateZ(Math.PI / 2);
  m.cylinder('cloth', 0, -0.09, 0, 0.042, 0.042, 0.18, 10, '#b89a6a', { smooth: true, caps: true, bottom: true });
  m.pop();
  m.beam('cloth', [0, 0.76, 0.03], [0, 0.6, 0.0], 0.007, '#b89a6a');
  m.beam('metal', [-0.04, 0.55, 0], [0, 0.6, 0], 0.005, '#222');
  m.beam('metal', [0.04, 0.55, 0], [0, 0.6, 0], 0.005, '#222');
  barrel(m, 0, 0.47, 0, { r: 0.042, h: 0.08 });
  m.beam('metal', [0.27, 0.8, 0], [0.34, 0.8, 0], 0.012, '#2a2a2a');
  m.beam('metal', [0.34, 0.8, 0], [0.34, 0.8, 0.12], 0.012, '#2a2a2a');
  m.beam('wood', [0.34, 0.8, 0.12], [0.42, 0.8, 0.12], 0.016, PALETTE.wood[0]);
  return { height: 1.2 };
}

/**
 * The village green: a lawn with a duck pond on it — a natural, irregular
 * pond with a muddy bank, reeds, lily pads and two ducks — a maypole wound
 * with ribbons and a crown of flowers, the ribbons pegged out round it, a
 * bench with a back, a path of stepping stones, flower beds, and three
 * trees.
 */
export function green(m, v) {
  const { rnd } = v;
  const GRASS = '#5f9a3a';
  m.disc('hedge', 0, 0.006, 0, 1.45, 28, GRASS);
  // The pond: a wobbly outline, a muddy bank a little bigger, the water inside.
  const [px, pz] = [-0.45, 0.35];
  const ring = (scale, k) => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = (0.48 + 0.08 * Math.sin(a * 2 + 0.7) + 0.05 * Math.sin(a * 3 + 2.1)) * scale;
    return [px + Math.cos(a) * r * 1.25, k, pz + Math.sin(a) * r];
  });
  const fan = (pts, y, col, mat) => { for (let i = 0; i < pts.length; i++) m.tri(mat, [px, y, pz], pts[(i + 1) % pts.length], pts[i], col); };
  fan(ring(1.12, 0.014), 0.014, '#6e5a3a', 'plain');
  fan(ring(1.0, 0.02), 0.02, '#2f6a86', 'glass');
  // Reeds in clumps on the bank, bulrushes among them.
  for (const a of [0.3, 1.9, 2.4, 4.1]) {
    const r = 0.5 * 1.12;
    const cx = px + Math.cos(a) * r * 1.25, cz = pz + Math.sin(a) * r;
    for (let k = 0; k < 6; k++) {
      const x = cx + (rnd() - 0.5) * 0.1, z = cz + (rnd() - 0.5) * 0.08, h = 0.14 + rnd() * 0.1;
      m.beam('hedge', [x, 0.01, z], [x + (rnd() - 0.5) * 0.04, h, z + (rnd() - 0.5) * 0.04], 0.006, pickFrom(rnd, ['#6a8a3a', '#7a9a44', '#5a7a30']));
      if (k % 3 === 0) m.cylinder('plain', x, h * 0.7, z, 0.011, 0.011, 0.05, 5, '#5a3a20');
    }
  }
  // Lily pads with a flower or two, and two ducks.
  for (const [x, z, f] of [[-0.6, 0.2, true], [-0.25, 0.45, false], [-0.5, 0.55, true], [-0.3, 0.15, false]]) {
    m.disc('hedge', x, 0.024, z, 0.045, 7, '#4a8a3a');
    if (f) m.sphere('cloth', x + 0.01, 0.034, z, 0.014, 0.01, 0.014, '#f0a0c0', { detail: 0 });
  }
  for (const [x, z, yaw, col] of [[-0.62, 0.42, 0.6, '#f4f0e8'], [-0.36, 0.28, 2.5, '#8a6a48']]) {
    m.at(x, 0.02, z, () => {
      m.sphere('cloth', 0, 0.025, 0, 0.045, 0.026, 0.028, col, { detail: 1 });
      m.sphere('cloth', 0.04, 0.06, 0, 0.018, 0.018, 0.017, col === '#f4f0e8' ? col : '#2a6a3a', { detail: 1 });
      m.beam('plain', [0.055, 0.058, 0], [0.075, 0.055, 0], 0.006, '#e8902a');
      m.sphere('cloth', -0.045, 0.035, 0, 0.012, 0.01, 0.02, col, { detail: 0 });
    }, yaw);
  }
  // The maypole: ribbons wound round its foot, a crown of flowers at its top, streamers pegged out round it.
  const MX = 0.75, MZ = -0.35, H = 1.35;
  m.cylinder('wood', MX, 0, MZ, 0.025, 0.04, H, 8, '#d8caa0', { smooth: true });
  const cols = ['#b32a2a', '#2a4a9a', '#c9a227', '#2a7a4a', '#7a3a8a', '#efe4cc'];
  for (let i = 0; i < 24; i++) {
    const a0 = i * 0.9, a1 = a0 + 0.9, y0 = 0.15 + i * 0.03, y1 = y0 + 0.03;
    const r = 0.04 - (y0 / H) * 0.015 + 0.004;
    m.beam('cloth', [MX + Math.cos(a0) * r, y0, MZ + Math.sin(a0) * r], [MX + Math.cos(a1) * r, y1, MZ + Math.sin(a1) * r], 0.009, cols[i % 3]);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    m.sphere('cloth', MX + Math.cos(a) * 0.07, H - 0.06, MZ + Math.sin(a) * 0.07, 0.025, 0.02, 0.025, pickFrom(rnd, ['#f0d040', '#f08ab0', '#f4f0e8', '#d84a3a']), { detail: 0 });
  }
  m.sphere('wood', MX, H + 0.03, MZ, 0.04, 0.04, 0.04, '#d4b24a', { detail: 0 });
  cols.forEach((c, i) => {
    const a = (i / cols.length) * Math.PI * 2 + 0.3, r = 0.62;
    const end = [MX + Math.cos(a) * r, 0.02, MZ + Math.sin(a) * r];
    const mid = [MX + Math.cos(a) * r * 0.55, 0.55, MZ + Math.sin(a) * r * 0.55];
    m.beam('cloth', [MX, H - 0.08, MZ], mid, 0.01, c);
    m.beam('cloth', mid, end, 0.01, c);
    m.beam('wood', [end[0], -0.02, end[2]], [end[0], 0.05, end[2]], 0.012, PALETTE.wood[1]);
  });
  // The bench: planks on two ends, a back on posts.
  m.at(0.1, 0, -1.05, () => {
    for (const x of [-0.3, 0.3]) {
      m.box('wood', x - 0.02, 0, -0.07, x + 0.02, 0.16, 0.07, PALETTE.wood[1], { skip: ['bottom'] });
      m.box('wood', x - 0.02, 0.16, -0.08, x + 0.02, 0.38, -0.05, PALETTE.wood[1], { skip: ['bottom'] });
      m.box('wood', x - 0.02, 0.24, -0.07, x + 0.02, 0.26, 0.07, PALETTE.wood[0], { skip: ['bottom'] });
    }
    for (const z of [-0.04, 0.0, 0.04]) m.box('wood', -0.34, 0.16, z - 0.017, 0.34, 0.185, z + 0.017, PALETTE.wood[0], { skip: ['bottom'] });
    for (const y of [0.26, 0.33]) m.box('wood', -0.34, y, -0.08, 0.34, y + 0.035, -0.055, PALETTE.wood[0], { skip: [] });
  });
  // The path across, in stepping stones.
  for (let i = 0; i < 8; i++) {
    const t = i / 7, x = 1.2 - t * 1.15, z = 1.1 - t * 1.25 + Math.sin(t * 3) * 0.12;
    m.cylinder('stone', x, 0.0, z, 0.06 + (i % 2) * 0.01, 0.065, 0.02, 7, pickFrom(rnd, STONE), { rot: i });
  }
  // Flower beds along the edge, and three trees.
  for (let i = 0; i < 22; i++) {
    const a = 3.6 + i * 0.12, r = 1.3 + (i % 2) * 0.05;
    m.sphere('hedge', Math.cos(a) * r, 0.04, Math.sin(a) * r, 0.04, 0.035, 0.04, pickFrom(rnd, ['#c9507a', '#e8c040', '#f4f0e8', '#8a5ac0', '#d8503a']), { detail: 0, jitter: 0.2 });
  }
  for (const [x, z, h, s] of [[1.05, 0.75, 0.7, 1], [-1.05, -0.75, 0.85, 1.15], [0.95, -1.1, 0.6, 0.85]]) {
    m.cylinder('bark', x, 0, z, 0.03 * s, 0.05 * s, h * 0.6, 7, '#5a4430', { smooth: true });
    m.crown('leafB', x, h * 0.75, z, 0.28 * s, 0.24 * s, 0.28 * s, '#5f8f3a', { detail: 1, lump: 0.22, seed: Math.round(x * 10) });
  }
  return { height: 1.45 };
}

export function tavern(m, v) {
  const { rnd } = v;
  const x0 = -1.25, x1 = 1.25, z0 = -1.25, z1 = 0.7;
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.1, z1 + 0.03, STONE[0], { skip: ['bottom'] });
  m.box('plaster', x0, 0.1, z0, x1, 0.62, z1, pickFrom(rnd, PALETTE.plaster), { skip: ['bottom', 'top'] });
  const G = faces(x0, z0, x1, z1, 0.1, 0.62);
  for (const n of ['front', 'back']) halfTimber(m, G[n], { cols: 6, rails: [0, 0.52], rnd, capped: false });
  for (const n of ['left', 'right']) halfTimber(m, G[n], { cols: 4, rails: [0, 0.52], rnd, capped: false });
  const J = 0.1;
  m.box('timber', x0 - 0.042, 0.58, z1, x1 + 0.042, 0.64, z1 + J + 0.012, PALETTE.timber, { skip: ['bottom'] });
  const wall = pickFrom(rnd, PALETTE.plaster);
  m.box('plaster', x0 - 0.03, 0.62, z0 - 0.02, x1 + 0.03, 1.12, z1 + J, wall, { skip: ['bottom', 'top'] });
  const U = faces(x0 - 0.03, z0 - 0.02, x1 + 0.03, z1 + J, 0.62, 1.12);
  for (const n of ['front', 'back']) halfTimber(m, U[n], { cols: 6, rails: [0, 0.5], rnd });
  for (const n of ['left', 'right']) halfTimber(m, U[n], { cols: 4, rails: [0, 0.5], rnd });
  m.gable('tile', x0 - 0.03, z0 - 0.02, x1 + 0.03, z1 + J, 1.12, 1.72, pickFrom(rnd, PALETTE.tile), { over: 0.15, gable: 'plaster', gableColor: wall, axis: 'x', ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  const shut = pickFrom(rnd, PALETTE.shutter);
  doorOn(m, G.front, 1.25, 0.34, 0.5, pickFrom(rnd, PALETTE.door));
  for (const u of [0.5, 0.9, 1.65, 2.1]) windowOn(m, G.front, u, 0.2, 0.22, 0.24, { shutters: shut });
  for (const u of [0.4, 0.85, 1.25, 1.65, 2.1]) windowOn(m, U.front, u, 0.12, 0.22, 0.24, { shutters: shut });
  windowOn(m, G.right, 1.0, 0.22, 0.24, 0.24, {});
  windowOn(m, U.right, 0.7, 0.14, 0.22, 0.24, {});
  windowOn(m, U.right, 1.4, 0.14, 0.22, 0.24, {});
  windowOn(m, U.left, 1.0, 0.14, 0.22, 0.24, {});
  const top1 = chimney(m, -0.8, -0.6, 1.0, 1.95, { w: 0.24 });
  const top2 = chimney(m, 0.8, -0.6, 1.0, 1.9, { w: 0.22 });
  // The sign, a big one, swinging over the door; lanterns by the door.
  sign(m, U.front, 1.25, 0.34, '#c9a227');
  for (const u of [0.95, 1.55]) {
    panel(m, 'metal', G.front, u - 0.015, 0.5, u + 0.015, 0.54, 0.05, '#222');
    panel(m, 'glow', G.front, u - 0.03, 0.4, u + 0.03, 0.5, 0.06, '#ffb45a');
  }
  // Tables and benches out front, barrels, a cart.
  for (const x of [-0.85, 0.85]) {
    m.box('wood', x - 0.22, 0.2, 1.05, x + 0.22, 0.24, 1.28, PALETTE.wood[0], { skip: ['bottom'] });
    for (const sx of [-0.18, 0.18]) for (const sz of [1.08, 1.25]) m.box('wood', x + sx - 0.015, 0.0, sz - 0.015, x + sx + 0.015, 0.2, sz + 0.015, PALETTE.wood[1]);
    for (const bz of [0.95, 1.38]) {
      m.box('wood', x - 0.2, 0.1, bz - 0.04, x + 0.2, 0.13, bz + 0.04, PALETTE.wood[1], { skip: ['bottom'] });
      for (const lx of [-0.16, 0.16]) m.box('wood', x + lx - 0.015, 0, bz - 0.03, x + lx + 0.015, 0.1, bz + 0.03, PALETTE.wood[0], { skip: ['bottom'] });
    }
  }
  for (let i = 0; i < 3; i++) barrel(m, 1.5 + (i % 2) * 0.06, 0, 0.0 + i * 0.25, { r: 0.1, h: 0.17 });
  cart(m, -1.5, 0, 0.4, 1.5);
  return { smoke: [top1, top2], height: 1.9 };
}

/** A pointed window with a coloured pane, glowing at night. */
function lancet(m, f, u, v, w, h, col) {
  panel(m, 'glass', f, u - w / 2, v, u + w / 2, v + h * 0.7, 0.01, '#27384a');
  m.tri('glass', at(f, u - w / 2, v + h * 0.7, 0.01), at(f, u + w / 2, v + h * 0.7, 0.01), at(f, u, v + h, 0.01), '#27384a');
  panel(m, 'glow', f, u - w / 2 + 0.01, v + 0.01, u + w / 2 - 0.01, v + h * 0.7, 0.016, col);
  m.tri('glow', at(f, u - w / 2 + 0.01, v + h * 0.7, 0.016), at(f, u + w / 2 - 0.01, v + h * 0.7, 0.016), at(f, u, v + h - 0.02, 0.016), col);
  for (const [a, b] of [[u - w / 2 - 0.02, u - w / 2 + 0.005], [u + w / 2 - 0.005, u + w / 2 + 0.02]]) panel(m, 'stone', f, a, v, b, v + h * 0.72, 0.02, STONE[2], { uvScale: 2 });
}

/** A belfry opening: a pointed arch in a dressed surround, the dark within, and wooden louvres across it to keep the rain off the bell. */
function belfry(m, f, u, v, w, h) {
  const spring = v + h * 0.72;
  panel(m, 'plain', f, u - w / 2, v, u + w / 2, spring, 0.006, '#0d0a08');
  m.tri('plain', at(f, u - w / 2, spring, 0.006), at(f, u + w / 2, spring, 0.006), at(f, u, v + h, 0.006), '#0d0a08');
  for (let i = 0; i < 5; i++) {
    const y = v + 0.03 + i * ((spring - v - 0.04) / 5);
    m.quad('wood', at(f, u - w / 2, y, 0.004), at(f, u + w / 2, y, 0.004), at(f, u + w / 2, y + 0.04, 0.03), at(f, u - w / 2, y + 0.04, 0.03), '#5a4630');
  }
  for (const [a, b] of [[u - w / 2 - 0.035, u - w / 2], [u + w / 2, u + w / 2 + 0.035]]) panel(m, 'stone', f, a, v - 0.02, b, spring, 0.014, STONE[2], { uvScale: 2 });
  panel(m, 'stone', f, u - w / 2 - 0.05, v - 0.04, u + w / 2 + 0.05, v - 0.005, 0.03, STONE[3], { uvScale: 2 });
}

/** A buttress against a wall: a pier stepped back once, each stage finished with a sloping weathering. `s` is the side it stands out to along x. */
function buttress(m, x, z, s, h, { d = 0.11, w = 0.1, col = STONE[2] } = {}) {
  const wedge = (y0, depth, rise) => {
    const xo = x + s * depth, z0 = z - w / 2, z1 = z + w / 2;
    // The sloping top, its two ends, and the face it runs down to.
    if (s > 0) {
      m.quad('stone', [xo, y0, z1], [xo, y0, z0], [x, y0 + rise, z0], [x, y0 + rise, z1], col);
      m.tri('stone', [x, y0, z1], [xo, y0, z1], [x, y0 + rise, z1], col);
      m.tri('stone', [xo, y0, z0], [x, y0, z0], [x, y0 + rise, z0], col);
    } else {
      m.quad('stone', [xo, y0, z0], [xo, y0, z1], [x, y0 + rise, z1], [x, y0 + rise, z0], col);
      m.tri('stone', [xo, y0, z1], [x, y0, z1], [x, y0 + rise, z1], col);
      m.tri('stone', [x, y0, z0], [xo, y0, z0], [x, y0 + rise, z0], col);
    }
  };
  const lo = h * 0.5;
  const bx = (depth, y0, y1) => m.box('stone', s > 0 ? x : x - depth, y0, z - w / 2, s > 0 ? x + depth : x, y1, z + w / 2, col, { skip: ['bottom', 'top', s > 0 ? 'left' : 'right'] });
  bx(d, 0.1, lo);
  wedge(lo, d, 0.05);
  bx(d * 0.6, lo + 0.002, h);
  wedge(h, d * 0.6, 0.09);
}

export function chapel(m) {
  // The nave (x half 0.62), the tower at the front, a porch.
  const x0 = -0.62, x1 = 0.62, z0 = -1.75, z1 = 0.35;
  m.box('stone', x0 - 0.04, -0.35, z0 - 0.04, x1 + 0.04, 0.1, z1 + 0.04, STONE[3], { skip: ['bottom'] });
  m.box('stone', x0, 0.1, z0, x1, 0.95, z1, STONE[0], { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, 0.1, 0.95);
  // Buttresses and windows along both sides.
  for (const zz of [-1.5, -1.0, -0.5, 0.0]) for (const s of [-1, 1]) buttress(m, s > 0 ? x1 : x0, zz, s, 0.78);
  for (const u of [0.45, 0.95, 1.45]) { lancet(m, F.right, u, 0.35, 0.16, 0.42, '#ff6a8a'); lancet(m, F.left, u + 0.25, 0.35, 0.16, 0.42, '#6aa8ff'); }
  m.gable('slate', x0, z0, x1, z1, 0.95, 1.6, '#5a626c', { over: 0.1, gable: 'stone', gableColor: STONE[0], axis: 'z', ridge: { mat: 'stone', col: STONE[3] } });
  // The bell tower at the front of the nave.
  const tx0 = -0.42, tx1 = 0.42, tz0 = 0.0, tz1 = 0.82;
  m.box('stone', tx0, 0.1, tz0, tx1, 1.85, tz1, STONE[2], { skip: ['bottom', 'top'] });
  const T = faces(tx0, tz0, tx1, tz1, 0.1, 1.85);
  doorOn(m, T.front, 0.42, 0.3, 0.52, '#5a3a20', {});
  panel(m, 'stone', T.front, 0.1, 0.5, 0.74, 0.6, 0.03, STONE[3]);
  lancet(m, T.front, 0.42, 0.95, 0.14, 0.4, '#ffcf6a');
  // Louvred belfry openings with the bell glowing within.
  for (const f of [T.front, T.back, T.left, T.right]) belfry(m, f, f.w / 2, 1.35, 0.2, 0.38);
  crenellate(m, [tx0, 0, tz1], [tx1, 0, tz1], 1.85, { h: 0.08, w: 0.1, gap: 0.08, t: 0.08 });
  crenellate(m, [tx0, 0, tz0], [tx1, 0, tz0], 1.85, { h: 0.08, w: 0.1, gap: 0.08, t: 0.08 });
  m.cylinder('slate', 0, 1.85, 0.41, 0.0, 0.5, 0.95, 4, '#4f5760', { rot: Math.PI / 4, smooth: false, caps: false });
  m.beam('metal', [0, 2.8, 0.41], [0, 3.05, 0.41], 0.02, '#d4b24a');
  m.beam('metal', [-0.07, 2.95, 0.41], [0.07, 2.95, 0.41], 0.02, '#d4b24a');
  return { height: 3.1, bell: [0, 1.5, 0.41] };
}

export function healer(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.7, x1: 0.7, z0: -0.75, z1: 0.2, h1: 0.62, roof: pickFrom(rnd, PALETTE.thatch), roofMat: 'thatch', ridgeH: 0.46, over: 0.15, doors: [{ face: 'front', u: 0.4 }], windows: [{ face: 'front', u: 1.05, shutters: '#3f5a40' }, { face: 'right', u: 0.5 }] });
  const top = chimney(m, -0.45, -0.45, 0.5, 1.2);
  // A green cross over the door, herbs hung from the eaves, a herb garden with rows.
  const HF = faces(-0.7, -0.75, 0.7, 0.2, 0.09, 0.62).front;
  panel(m, 'wood', HF, 0.66, 0.24, 0.84, 0.42, 0.03, '#efe4cc');
  panel(m, 'cloth', HF, 0.73, 0.26, 0.77, 0.4, 0.036, '#2a7a4a');
  panel(m, 'cloth', HF, 0.68, 0.31, 0.82, 0.35, 0.04, '#2a7a4a');
  for (let i = 0; i < 5; i++) m.sphere('hedge', -0.5 + i * 0.22, 0.52, 0.24, 0.04, 0.07, 0.04, pickFrom(rnd, ['#8aa84a', '#a8b85a', '#7a9a3a']), { detail: 0 });
  m.box('plain', -0.9, 0, 0.45, 0.9, 0.04, 0.95, '#4a3622');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) m.sphere('hedge', -0.8 + i * 0.2, 0.08, 0.55 + r * 0.16, 0.045, 0.045, 0.045, pickFrom(rnd, ['#6a9a3a', '#8ab84a', '#c97a9a', '#b8a84a']), { detail: 0 });
  fenceRun(m, [-1.0, 0, 1.05], [1.0, 0, 1.05], { h: 0.16 });
  return { smoke: [top], height: 1.2 };
}

export function market(m, v) {
  const { rnd } = v;
  // A paved square, a market cross on steps, four stalls at the corners.
  m.box('stone', -1.4, -0.3, -1.4, 1.4, 0.04, 1.4, '#a49c8a', { skip: ['bottom'] });
  for (let i = 0; i < 3; i++) { const half = 0.64 - i * 0.12; m.box('stone', -half, i * 0.06, -half, half, 0.06 + i * 0.06, half, STONE[(i + 1) % 4], { skip: ['bottom'] }); }
  m.box('stone', -0.22, 0.2, -0.22, 0.22, 0.26, 0.22, STONE[2], { skip: ['bottom'] });
  m.cylinder('stone', 0, 0.26, 0, 0.06, 0.09, 0.9, 8, STONE[0], { smooth: true });
  m.box('stone', -0.16, 1.14, -0.16, 0.16, 1.24, 0.16, STONE[2], { skip: ['bottom'] });
  m.cylinder('stone', 0, 1.24, 0, 0.001, 0.14, 0.18, 4, STONE[3], { rot: Math.PI / 4, smooth: false, caps: false });
  for (const [x, z, yaw] of [[-1.0, -1.0, 0.0], [1.0, -1.0, 0.0], [-1.0, 1.0, Math.PI], [1.0, 1.0, Math.PI]]) {
    m.at(x, 0.04, z, () => {
      const c1 = pickFrom(rnd, ['#b32a2a', '#2a4a9a', '#2a7a4a', '#c9a227', '#7a3a8a']);
      // The awning slopes from 0.54 at the front (z 0.2) to 0.66 at the back: each post stops under it.
      const under = (z) => 0.54 + ((0.2 - z) / 0.45) * 0.12 - 0.006;
      for (const sx of [-0.35, 0.35]) for (const sz of [-0.2, 0.15]) m.box('wood', sx - 0.02, 0, sz - 0.02, sx + 0.02, under(sz), sz + 0.02, PALETTE.wood[1], { skip: ['bottom'] });
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = -0.4 + (0.8 * i) / n, b = -0.4 + (0.8 * (i + 1)) / n;
        const c = i % 2 ? c1 : '#efe4cc';
        m.quad('cloth', [a, 0.54, 0.2], [b, 0.54, 0.2], [b, 0.66, -0.25], [a, 0.66, -0.25], c);
        m.quad('cloth', [a, 0.66, -0.25], [b, 0.66, -0.25], [b, 0.54, 0.2], [a, 0.54, 0.2], c);
      }
      m.box('wood', -0.4, 0.0, -0.1, 0.4, 0.3, 0.1, PALETTE.wood[0], { skip: ['bottom'] });
      for (let i = 0; i < 4; i++) m.sphere('hedge', -0.25 + i * 0.17, 0.34, 0, 0.055, 0.05, 0.055, pickFrom(rnd, ['#b8523a', '#7aa84a', '#d89a3a']), { detail: 0 });
    }, yaw);
  }
  flag(m, -1.3, 0.04, 1.3, 1.2, '#2a4a9a');
  flag(m, 1.3, 0.04, 1.3, 1.2, '#b32a2a');
  barrel(m, 0.9, 0.04, 0.2); crate(m, -0.9, 0.04, 0.1, 0.14);
  return { height: 1.4 };
}

export function watchtower(m, v) {
  const { rnd } = v;
  const x0 = -0.62, x1 = 0.62, z0 = -0.62, z1 = 0.62;
  m.box('stone', x0 - 0.06, -0.4, z0 - 0.06, x1 + 0.06, 0.2, z1 + 0.06, STONE[3], { skip: ['bottom'] });
  m.cylinder('stone', 0, 0.2, 0, 0.5, 0.62, 2.4, 4, STONE[0], { rot: Math.PI / 4, smooth: false, caps: false });
  // A timber hoarding at the top, with a roof, a brazier burning on it.
  m.box('stone', x0 - 0.1, 2.45, z0 - 0.1, x1 + 0.1, 2.6, z1 + 0.1, STONE[2], { skip: ['bottom'] });
  m.box('wood', x0 - 0.06, 2.6, z0 - 0.06, x1 + 0.06, 3.05, z1 + 0.06, '#9a7a52', { skip: ['bottom', 'top'], uvScale: 1.5 });
  for (const f of Object.values(faces(x0 - 0.06, z0 - 0.06, x1 + 0.06, z1 + 0.06, 2.6, 3.05))) panel(m, 'plain', f, f.w / 2 - 0.2, 0.12, f.w / 2 + 0.2, 0.3, 0.01, '#15110e');
  m.cylinder('tile', 0, 3.05, 0, 0.01, 0.95, 0.65, 4, pickFrom(rnd, PALETTE.tile), { rot: Math.PI / 4, smooth: false, caps: false });
  // A door and arrow slits.
  const F = faces(x0, z0, x1, z1, 0.2, 2.45);
  m.box('wood', -0.13, 0.2, z1 - 0.12, 0.13, 0.65, z1 + 0.02, '#4a3220', { skip: ['bottom'] });
  for (const f of [F.front, F.back, F.left, F.right]) for (const v2 of [1.0, 1.7]) panel(m, 'plain', f, f.w / 2 - 0.02, v2, f.w / 2 + 0.02, v2 + 0.2, 0.012, '#0c0a08');
  flag(m, 0, 3.7, 0, 0.5, '#b32a2a', { w: 0.34 });
  m.cylinder('wood', 0, 3.05, 0, 0.012, 0.02, 0.65, 5, PALETTE.wood[1]);
  m.box('glow', -0.1, 2.62, 0.54, 0.1, 2.75, 0.58, '#ffb45a', { skip: ['bottom'] });
  return { height: 3.9, lights: [{ at: [0, 2.8, 0.5], color: '#ff9a3a', reach: 6 }] };
}

export function barracks(m, v) {
  const { rnd } = v;
  const x0 = -1.9, x1 = 1.9, z0 = -1.4, z1 = 0.6;
  m.box('stone', x0 - 0.04, -0.4, z0 - 0.04, x1 + 0.04, 0.9, z1 + 0.04, STONE[0], { skip: ['bottom'] });
  const G = faces(x0 - 0.04, z0 - 0.04, x1 + 0.04, z1 + 0.04, 0, 0.9);
  m.box('plaster', x0 + 0.0, 0.9, z0, x1, 1.45, z1, '#dccaa2', { skip: ['bottom', 'top'] });
  const U = faces(x0, z0, x1, z1, 0.9, 1.45);
  for (const n of ['front', 'back']) halfTimber(m, U[n], { cols: 8, rails: [0, 0.55], rnd });
  for (const n of ['left', 'right']) halfTimber(m, U[n], { cols: 4, rails: [0, 0.55], rnd });
  m.gable('slate', x0, z0, x1, z1, 1.45, 2.0, '#5a626c', { over: 0.16, gable: 'plaster', gableColor: '#dccaa2', axis: 'x', ridge: { mat: 'stone', col: STONE[3] } });
  doorOn(m, G.front, 1.9, 0.4, 0.62, '#5a3a20');
  for (const u of [0.6, 1.1, 2.7, 3.2]) windowOn(m, G.front, u, 0.38, 0.14, 0.26, { glow: true });
  for (const u of [0.5, 1.05, 1.6, 2.15, 2.7, 3.25]) windowOn(m, U.front, u, 0.14, 0.18, 0.24, {});
  windowOn(m, G.right, 1.0, 0.38, 0.14, 0.26, {});
  const t1 = chimney(m, -1.3, -0.5, 1.7, 2.6, { w: 0.26 });
  const t2 = chimney(m, 1.3, -0.5, 1.7, 2.6, { w: 0.26 });
  // Banners and weapon racks (spears in a frame), an archery butt.
  flag(m, -1.85, 0.9, 0.55, 1.3, '#b32a2a', { w: 0.34 });
  flag(m, 1.85, 0.9, 0.55, 1.3, '#b32a2a', { w: 0.34 });
  m.box('wood', -0.8, 0.0, 0.9, 0.8, 0.04, 1.0, PALETTE.wood[1]);
  m.beam('wood', [-0.8, 0.5, 0.95], [0.8, 0.5, 0.95], 0.03, PALETTE.wood[1]);
  for (const x of [-0.8, 0.8]) m.beam('wood', [x, 0, 0.95], [x, 0.485, 0.95], 0.03, PALETTE.wood[1]);
  for (let i = 0; i < 7; i++) { m.beam('wood', [-0.7 + i * 0.23, 0.0, 0.95], [-0.7 + i * 0.23, 0.95, 0.95], 0.014, '#8a6a42'); m.tri('metal', [-0.7 + i * 0.23 - 0.025, 0.93, 0.95], [-0.7 + i * 0.23 + 0.025, 0.93, 0.95], [-0.7 + i * 0.23, 1.06, 0.95], '#b8bcc4'); }
  m.cylinder('thatch', 1.45, 0.0, 1.0, 0.25, 0.25, 0.04, 14, '#d8caa0', { smooth: true });
  m.cylinder('cloth', 1.45, 0.04, 1.0, 0.2, 0.2, 0.01, 14, '#b32a2a', { smooth: true, caps: true });
  m.cylinder('cloth', 1.45, 0.05, 1.0, 0.1, 0.1, 0.01, 14, '#efe4cc', { smooth: true, caps: true });
  return { smoke: [t1, t2], height: 2.7 };
}

/** The gatehouse: twin towers either side of the passage and a wall over the arch. The passage runs along z. */
export function gatehouse(m, v) {
  const { rnd } = v;
  const tw = 0.7;
  for (const s of [-1, 1]) {
    const cx = s * (1 - tw / 2 + 0.0);
    m.box('stone', cx - tw / 2, -0.4, -0.95, cx + tw / 2, 0.15, 0.95, STONE[3], { skip: ['bottom'] });
    m.box('stone', cx - tw / 2 + 0.03, 0.1, -0.9, cx + tw / 2 - 0.03, 2.0, 0.9, STONE[0], { skip: ['bottom', 'top'] });
    m.box('stone', cx - tw / 2 - 0.06, 2.0, -0.96, cx + tw / 2 + 0.06, 2.12, 0.96, STONE[2], { skip: ['bottom'] });
    crenellate(m, [cx - tw / 2 - 0.06, 0, 0.96], [cx + tw / 2 + 0.06, 0, 0.96], 2.12, { h: 0.12, w: 0.11, gap: 0.08 });
    crenellate(m, [cx - tw / 2 - 0.06, 0, -0.96], [cx + tw / 2 + 0.06, 0, -0.96], 2.12, { h: 0.12, w: 0.11, gap: 0.08 });
    crenellate(m, [cx + s * (tw / 2 + 0.06), 0, -0.84], [cx + s * (tw / 2 + 0.06), 0, 0.84], 2.12, { h: 0.12, w: 0.11, gap: 0.08 });
    for (const z of [-0.45, 0.3]) m.box('plain', cx - 0.03, 1.2, z + (z > 0 ? 0.5 : 0), cx + 0.03, 1.5, z + 0.04 + (z > 0 ? 0.5 : 0), '#0c0a08', { skip: ['bottom'] });
    m.box('plain', cx + s * (tw / 2 - 0.02) - 0.01, 1.2, -0.08, cx + s * (tw / 2 - 0.02) + 0.01, 1.5, 0.08, '#0c0a08');
    flag(m, cx, 2.12, 0, 0.55, pickFrom(rnd, PALETTE.banner), { w: 0.34 });
  }
  // The wall and the arch over the passage.
  // (Between the towers: it stops at their walls, and the lintel and the parapet over it at the edges of their caps.)
  m.box('stone', -0.33, 1.15, -0.9, 0.33, 2.0, 0.9, STONE[0], { skip: ['bottom'] });
  m.box('stone', -0.24, 2.0, -0.96, 0.24, 2.12, 0.96, STONE[2], { skip: ['bottom'] });
  m.box('wood', -0.33, 1.05, -0.9, 0.33, 1.15, 0.9, PALETTE.wood[1], { skip: ['bottom', 'top'] });
  crenellate(m, [-0.24, 0, 0.96], [0.24, 0, 0.96], 2.12, { h: 0.12, w: 0.11, gap: 0.08 });
  crenellate(m, [-0.24, 0, -0.96], [0.24, 0, -0.96], 2.12, { h: 0.12, w: 0.11, gap: 0.08 });
  // The portcullis: a grid of iron in the mouth, raised halfway.
  for (let i = 0; i < 6; i++) m.box('metal', -0.45 + i * 0.18, 0.7, 0.9, -0.43 + i * 0.18, 1.1, 0.92, '#3a3a40');
  for (const y of [0.85, 0.98]) m.box('metal', -0.47, y, 0.89, 0.47, y + 0.02, 0.93, '#3a3a40');
  // A wooden floor through the passage, and torches inside.
  m.box('wood', -0.5, 0.0, -0.9, 0.5, 0.04, 0.9, PALETTE.wood[1], { skip: ['bottom'] });
  m.box('glow', -0.48, 0.7, -0.05, -0.44, 0.78, 0.03, '#ffb45a');
  return { height: 2.6, lights: [{ at: [0, 0.8, 0], color: '#ff9a3a', reach: 5 }] };
}

export function cathedral(m, v) {
  const { rnd } = v;
  // The nave runs along z with the west front toward +z; five tiles wide, seven deep.
  const nx0 = -0.8, nx1 = 0.8, nz0 = -3.1, nz1 = 2.4;
  m.box('stone', nx0 - 0.06, -0.4, nz0 - 0.06, nx1 + 0.06, 0.2, nz1 + 0.06, STONE[3], { skip: ['bottom'] });
  m.box('stone', nx0, 0.2, nz0, nx1, 1.9, nz1, STONE[0], { skip: ['bottom', 'top'] });
  // The aisles, lower, each side.
  for (const s of [-1, 1]) {
    const ax0 = s > 0 ? nx1 : nx0 - 0.75, ax1 = s > 0 ? nx1 + 0.75 : nx0;
    m.box('stone', ax0, 0.2, nz0 + 0.3, ax1, 1.05, nz1 - 0.1, STONE[2], { skip: ['bottom', 'top'] });
    m.gable('slate', ax0, nz0 + 0.3, ax1, nz1 - 0.1, 1.05, 1.42, '#5a626c', { over: 0.05, axis: 'z' });
    // Flying buttresses from the aisles up the clerestory.
    for (let z = nz0 + 0.6; z < nz1 - 0.3; z += 0.75) {
      m.beam('stone', [s * (nx1 + 0.75), 0.2, z], [s * (nx1 + 0.75), 1.1, z], 0.12, STONE[2]);
      m.beam('stone', [s * (nx1 + 0.7), 1.1, z], [s * (nx1 + 0.03), 1.75, z], 0.1, STONE[2]);
    }
    for (let z = nz0 + 0.8; z < nz1 - 0.5; z += 0.7) {
      const f = s > 0 ? faces(ax0, nz0, ax1, nz1, 0.2, 1.05).right : faces(ax0, nz0, ax1, nz1, 0.2, 1.05).left;
      lancet(m, f, s > 0 ? nz1 - z : z - nz0, 0.3, 0.2, 0.5, pickFrom(rnd, ['#ff6a8a', '#6aa8ff', '#ffcf6a', '#6ad88a']));
    }
  }
  m.gable('slate', nx0, nz0, nx1, nz1, 1.9, 2.75, '#59626c', { over: 0.08, gable: 'stone', gableColor: STONE[0], axis: 'z', ridge: { mat: 'stone', col: STONE[3] } });
  // The transept, across the nave two-thirds along.
  m.box('stone', -1.85, 0.2, -1.5, 1.85, 1.9, -0.5, STONE[0], { skip: ['bottom', 'top'] });
  m.gable('slate', -1.85, -1.5, 1.85, -0.5, 1.9, 2.55, '#59626c', { over: 0.08, gable: 'stone', gableColor: STONE[0], axis: 'x' });
  // The west front: two towers with spires, and a great window between.
  for (const s of [-1, 1]) {
    const cx = s * 0.9;
    m.box('stone', cx - 0.5, 0.2, 1.7, cx + 0.5, 3.2, 2.7, STONE[2], { skip: ['bottom', 'top'] });
    for (const y of [1.2, 2.2]) m.box('stone', cx - 0.54, y, 1.66, cx + 0.54, y + 0.07, 2.74, STONE[0], { skip: ['bottom'] });
    m.cylinder('slate', cx, 3.2, 2.2, 0.0, 0.72, 2.2, 4, '#4f5760', { rot: Math.PI / 4, smooth: false, caps: false });
    lancet(m, faces(cx - 0.5, 1.7, cx + 0.5, 2.7, 0.2, 3.2).front, 0.5, 2.0, 0.2, 0.7, '#ffcf6a');
    m.beam('metal', [cx, 5.4, 2.2], [cx, 5.7, 2.2], 0.03, '#d4b24a');
  }
  const W = faces(-0.8, nz0, 0.8, 2.7, 0.2, 1.9);
  lancet(m, W.front, 0.8, 0.9, 0.5, 0.95, '#ff6a8a');
  // The rose window over the door: a ring of stone set in the west front, the glass glowing in it, tracery across.
  m.at(0, 1.9, 2.72, () => {
    m.push().rotateX(Math.PI / 2);
    m.cylinder('stone', 0, -0.03, 0, 0.27, 0.27, 0.05, 18, STONE[2], { smooth: true, bottom: true });
    m.cylinder('glow', 0, -0.05, 0, 0.21, 0.21, 0.05, 18, '#ffb45a', { smooth: true, bottom: true });
    m.pop();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      m.beam('stone', [-Math.cos(a) * 0.21, -Math.sin(a) * 0.21, 0.035], [Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0.035], 0.018, STONE[2]);
    }
  });
  doorOn(m, { ...W.front, P: [-0.8, 0.2, 2.74] }, 0.8, 0.5, 0.8, '#4a3220', {});
  // The crossing tower and its spire.
  m.box('stone', -0.5, 1.9, -1.4, 0.5, 2.7, -0.6, STONE[2], { skip: ['bottom', 'top'] });
  m.cylinder('slate', 0, 2.7, -1.0, 0.0, 0.6, 2.4, 4, '#4f5760', { rot: Math.PI / 4, smooth: false, caps: false });
  m.beam('metal', [0, 5.0, -1.0], [0, 5.35, -1.0], 0.03, '#d4b24a');
  return { height: 5.8 };
}
