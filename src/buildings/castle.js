import { Mesher } from '../mesher.js';
import { PALETTE, at, barrel, crate, crenellate, faces, fenceRun, flag, haystack, panel, pickFrom, windowOn } from './common.js';
import { cart, gabled } from './parts.js';

/**
 * The castle, in four tiers: a timber keep in a palisade, a stone keep in a
 * curtain wall, a castle with a great hall and taller towers, and a citadel
 * whose inner and outer walls go round one another. It stands on the mound in
 * the middle of its island, a courtyard six tiles across, the gate to the south.
 */

const STONE = ['#a8a090', '#9a9283', '#b4ac9a', '#8f887a', '#bdb5a3'];
const SLATE = '#59626c';

/** A round tower: a flared foot, a smooth shaft, a crenellated or conical top, arrow slits. */
function roundTower(m, x, z, r, h, { roof = null, roofH = 0.9, crenel = true, col = STONE[0], banner = null } = {}) {
  m.cylinder('stone', x, -1.3, z, r * 1.08, r * 1.2, 1.3 + 0.25, 14, STONE[3], { smooth: true, bottom: false });
  m.cylinder('stone', x, 0.25, z, r, r * 1.04, h - 0.25, 14, col, { smooth: true, bottom: false });
  m.cylinder('stone', x, h - 0.12, z, r * 1.14, r * 1.1, 0.14, 14, STONE[2], { smooth: true, capMat: 'plain', capCol: '#7f796e' });
  if (roof) {
    m.cylinder('slate', x, h, z, 0.02, r * 1.2, roofH, 14, roof, { smooth: true, caps: false });
    m.sphere('metal', x, h + roofH + 0.03, z, 0.04, 0.04, 0.04, '#d4b24a', { detail: 0 });
  } else if (crenel) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m.at(x + Math.cos(a) * r * 1.1, h, z + Math.sin(a) * r * 1.1, () => m.box('stone', -0.06, 0, -0.045, 0.06, 0.11, 0.045, STONE[2], { skip: ['bottom'] }), -a);
    }
  }
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + 0.4;
    for (const y of [h * 0.45, h * 0.75]) m.at(x + Math.cos(a) * (r + 0.005), y, z + Math.sin(a) * (r + 0.005), () => m.box('plain', -0.012, 0, -0.03, 0.012, 0.16, 0.03, '#0c0a08'), -a);
  }
  if (banner) flag(m, x, h + (roof ? roofH : 0.1), z, 0.5, banner, { w: 0.32 });
}

/** A run of curtain wall along x or z, with a wall-walk and crenellations on its outer edge. */
function wallRun(m, a, b, { h = 1.4, t = 0.28, col = STONE[0], crenel = true } = {}) {
  const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
  const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [z0, z1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  const hx = alongX ? 0 : t / 2, hz = alongX ? t / 2 : 0;
  m.box('stone', x0 - hx, -1.3, z0 - hz, x1 + hx, 0.0, z1 + hz, STONE[3], { skip: ['bottom'] });
  m.box('stone', x0 - hx, 0, z0 - hz, x1 + hx, h, z1 + hz, col, { skip: ['bottom'] });
  if (crenel) {
    for (const s of [-1, 1]) {
      if (alongX) crenellate(m, [x0, 0, (z0 + z1) / 2 + s * (t / 2 - 0.04)], [x1, 0, (z0 + z1) / 2 + s * (t / 2 - 0.04)], h, { h: 0.12, w: 0.12, gap: 0.1, t: 0.07 });
      else crenellate(m, [(x0 + x1) / 2 + s * (t / 2 - 0.04), 0, z0], [(x0 + x1) / 2 + s * (t / 2 - 0.04), 0, z1], h, { h: 0.12, w: 0.12, gap: 0.1, t: 0.07 });
    }
  }
}

/** The gate: two small towers, an arch with a dark mouth and a portcullis, over the way in at the front. */
function gateTower(m, rnd, z, { h = 1.7, banners = true } = {}) {
  for (const s of [-1, 1]) roundTower(m, s * 0.72, z, 0.38, h, { roof: SLATE, roofH: 0.75, banner: banners ? pickFrom(rnd, PALETTE.banner) : null });
  m.box('stone', -0.52, 0.0, z - 0.2, 0.52, h - 0.35, z + 0.2, STONE[0], { skip: ['bottom'] });
  m.box('plain', -0.3, 0.0, z + 0.19, 0.3, 0.95, z + 0.22, '#0c0a08', { skip: ['bottom'] });
  for (let i = 0; i < 5; i++) m.box('metal', -0.26 + i * 0.13, 0.5, z + 0.22, -0.24 + i * 0.13, 0.95, z + 0.235, '#3a3a40');
  for (const y of [0.62, 0.8]) m.box('metal', -0.28, y, z + 0.22, 0.28, y + 0.02, z + 0.235, '#3a3a40');
  crenellate(m, [-0.52, 0, z + 0.2], [0.52, 0, z + 0.2], h - 0.35, { h: 0.12, w: 0.12, gap: 0.1, t: 0.07 });
}

/** A band of stone standing proud of a face at height y. */
function band(m, f, y) {
  const a = at(f, 0, y - f.P[1], -0.01), b = at(f, f.w, y - f.P[1] + 0.06, 0.03);
  m.box('stone', Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), STONE[2], { skip: ['bottom'] });
}

/** A rectangular keep: stone walls, a crenellated top (or a roof), corner turrets, windows, and a flag. */
function keep(m, x, z, w, d, h, { turrets = true, roofed = false, banner = '#b32a2a' } = {}) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  m.box('stone', x0 - 0.1, -1.3, z0 - 0.1, x1 + 0.1, 0.0, z1 + 0.1, STONE[3], { skip: ['bottom'] });
  m.box('stone', x0, 0, z0, x1, h, z1, STONE[0], { skip: ['bottom', 'top'] });
  m.box('stone', x0 - 0.07, h - 0.1, z0 - 0.07, x1 + 0.07, h + 0.03, z1 + 0.07, STONE[2], { skip: ['bottom'] });
  const F = faces(x0, z0, x1, z1, 0, h);
  for (const n of ['front', 'back', 'left', 'right']) {
    const f = F[n];
    for (let k = 1; k < Math.floor(h / 0.9); k++) band(m, f, k * 0.9);
    const cols = Math.max(1, Math.round(f.w / 0.7));
    for (let c = 0; c < cols; c++) for (const y of [0.5, 1.4, 2.3].filter((q) => q < h - 0.5)) windowOn(m, f, ((c + 0.5) * f.w) / cols, y, 0.15, 0.3, { sill: false, glow: true });
  }
  m.box('wood', x - 0.18, 0.0, z1 - 0.01, x + 0.18, 0.5, z1 + 0.04, '#4a3220', { skip: ['bottom', 'back'] });
  if (roofed) m.gable('slate', x0, z0, x1, z1, h + 0.03, h + 0.9, SLATE, { over: 0.12, gable: 'stone', gableColor: STONE[0], axis: 'x', ridge: { mat: 'stone', col: STONE[3] } });
  else {
    const top = h + 0.03;
    const opts = { h: 0.14, w: 0.14, gap: 0.11, t: 0.08 };
    crenellate(m, [x0 - 0.07, 0, z1 + 0.07], [x1 + 0.07, 0, z1 + 0.07], top, opts);
    crenellate(m, [x0 - 0.07, 0, z0 - 0.07], [x1 + 0.07, 0, z0 - 0.07], top, opts);
    crenellate(m, [x0 - 0.07, 0, z0], [x0 - 0.07, 0, z1], top, opts);
    crenellate(m, [x1 + 0.07, 0, z0], [x1 + 0.07, 0, z1], top, opts);
  }
  if (turrets) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) roundTower(m, x + sx * (w / 2 - 0.05), z + sz * (d / 2 - 0.05), 0.28, h + 0.5, { roof: SLATE, roofH: 0.7, banner: sx === sz ? banner : null });
  } else {
    flag(m, x, h + 0.03, z, 0.7, banner);
  }
}

/** The timber keep: a palisade of stakes, a gate, a wooden tower with a hoarding, a hall and sheds inside. */
function timberCastle(m, rnd) {
  const R = 2.7;
  // The earth bank the stakes stand on, and the stakes.
  const stakes = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.round(len / 0.16);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      const h = 0.95 + 0.12 * Math.sin(i * 1.7);
      m.cylinder('bark', x, -1.0, z, 0.06, 0.07, 1.0 + h, 6, '#7a5a38', { smooth: false, caps: false });
      m.cylinder('bark', x, h, z, 0.001, 0.065, 0.16, 6, '#8a6a42', { smooth: false, caps: false });
    }
    m.beam('wood', [a[0], 0.35, a[1]], [b[0], 0.35, b[1]], 0.04, PALETTE.wood[0]);
  };
  stakes([-R, -R], [R, -R]);
  stakes([-R, -R], [-R, R]);
  stakes([R, -R], [R, R]);
  stakes([-R, R], [-0.55, R]);
  stakes([0.55, R], [R, R]);
  // The gate: two posts, a lintel, a roof, a wall-walk across.
  for (const s of [-1, 1]) m.cylinder('bark', s * 0.55, -1.0, R, 0.09, 0.1, 2.5, 7, '#6a4a2c', { smooth: false });
  m.box('wood', -0.62, 1.2, R - 0.12, 0.62, 1.35, R + 0.12, PALETTE.wood[1], { skip: ['bottom'] });
  m.gable('slate', -0.62, R - 0.14, 0.62, R + 0.14, 1.35, 1.72, '#6a5a46', { over: 0.1, axis: 'x' });
  flag(m, 0, 1.72, R, 0.5, '#b32a2a', { w: 0.34 });
  for (const s of [-1, 1]) m.box('wood', s * 0.35 - 0.2, 0, R - 0.03, s * 0.35 + 0.2, 1.0, R + 0.03, '#5a3a20', { skip: ['bottom'] });
  // The wooden keep: planks, a jettied upper floor, a steep shingle roof.
  const kx = 0, kz = -0.9, kw = 1.9;
  m.box('stone', kx - kw / 2 - 0.1, -1.3, kz - kw / 2 - 0.1, kx + kw / 2 + 0.1, 0.18, kz + kw / 2 + 0.1, STONE[3], { skip: ['bottom'] });
  m.box('siding', kx - kw / 2, 0.18, kz - kw / 2, kx + kw / 2, 1.2, kz + kw / 2, '#8a6a46', { skip: ['bottom', 'top'], uvScale: 1.1 });
  m.box('siding', kx - kw / 2 - 0.14, 1.2, kz - kw / 2 - 0.14, kx + kw / 2 + 0.14, 1.95, kz + kw / 2 + 0.14, '#7a5a3a', { skip: ['bottom', 'top'], uvScale: 1.1 });
  m.box('timber', kx - kw / 2 - 0.16, 1.15, kz - kw / 2 - 0.16, kx + kw / 2 + 0.16, 1.24, kz + kw / 2 + 0.16, PALETTE.timber, { skip: ['bottom'] });
  m.cylinder('tile', kx, 1.95, kz, 0.01, 1.62, 1.2, 4, '#6a4a34', { rot: Math.PI / 4, smooth: false, caps: false });
  const F = faces(kx - kw / 2, kz - kw / 2, kx + kw / 2, kz + kw / 2, 0.18, 1.2);
  const U = faces(kx - kw / 2 - 0.14, kz - kw / 2 - 0.14, kx + kw / 2 + 0.14, kz + kw / 2 + 0.14, 1.2, 1.95);
  panel(m, 'wood', F.front, 0.7, 0, 1.2, 0.62, 0.012, '#4a3220');
  for (const f of [F.front, F.left, F.right, F.back]) windowOn(m, f, f.w * 0.2, 0.62, 0.18, 0.2, {});
  for (const f of [U.front, U.left, U.right, U.back]) for (const u of [0.3, 0.7]) windowOn(m, f, f.w * u, 0.28, 0.18, 0.24, {});
  flag(m, kx, 3.1, kz, 0.6, '#b32a2a', { w: 0.4 });
  m.cylinder('wood', kx, 3.1 - 0.3, kz, 0.015, 0.02, 0.4, 5, PALETTE.wood[1]);
  // The hall and the sheds against the walls; a well, a haystack, a cart.
  gabled(m, rnd, { x0: 0.9, x1: 2.45, z0: -0.2, z1: 1.2, h0: 0.0, h1: 0.6, wallMat: 'siding', wall: '#9a7a52', roofMat: 'thatch', roof: PALETTE.thatch[0], ridgeH: 0.6, over: 0.18, axis: 'x', frame: false, base: false, doors: [{ face: 'left', u: 0.7, w: 0.26, h: 0.44 }] });
  gabled(m, rnd, { x0: -2.45, x1: -1.2, z0: -0.1, z1: 0.8, h0: 0.0, h1: 0.5, wallMat: 'siding', wall: '#8a6a46', roofMat: 'thatch', roof: PALETTE.thatch[2], ridgeH: 0.4, over: 0.15, axis: 'z', frame: false, base: false, doors: [{ face: 'front', u: 0.5, w: 0.3, h: 0.4 }] });
  haystack(m, -1.7, 0, 1.4, 0.2);
  cart(m, 0.4, 0, 1.3, 0.3);
  barrel(m, 0.1, 0, 0.4); crate(m, -0.2, 0, 0.5, 0.14);
  return { height: 3.3 };
}

/** The stone castles: a curtain wall with corner towers, a gate, and a keep, growing in tiers. */
function stoneCastle(m, rnd, level) {
  const R = level >= 2 ? 2.78 : 2.7;
  const H = level === 1 ? 1.3 : 1.7;
  const TR = level === 1 ? 0.5 : 0.62;
  const TH = level === 1 ? 2.1 : 2.8;
  const banners = ['#b32a2a', '#2a4a9a', '#c9a227', '#b32a2a'];
  // Curtain walls on four sides, the front broken by the gate.
  wallRun(m, [-R, -R], [R, -R], { h: H });
  wallRun(m, [-R, -R], [-R, R], { h: H });
  wallRun(m, [R, -R], [R, R], { h: H });
  wallRun(m, [-R, R], [-0.95, R], { h: H });
  wallRun(m, [0.95, R], [R, R], { h: H });
  [[-R, -R], [R, -R], [-R, R], [R, R]].forEach(([x, z], i) => roundTower(m, x, z, TR, TH, { roof: level >= 2 ? SLATE : null, roofH: 1.1, banner: banners[i], crenel: true }));
  if (level >= 2) for (const [x, z] of [[0, -R], [-R, 0], [R, 0]]) roundTower(m, x, z, 0.4, H + 0.7, { roof: SLATE, roofH: 0.7 });
  gateTower(m, rnd, R, { h: level === 1 ? 1.8 : 2.2 });
  // The keep, in the back, and the buildings of the bailey.
  if (level === 1) {
    keep(m, 0, -0.6, 2.2, 2.0, 3.0, { turrets: true, roofed: false, banner: '#b32a2a' });
    gabled(m, rnd, { x0: 1.2, x1: 2.3, z0: 0.3, z1: 1.8, h0: 0.0, h1: 0.62, wallMat: 'plaster', wall: '#d8c8a6', roofMat: 'tile', roof: PALETTE.tile[0], ridgeH: 0.5, axis: 'x', base: false, doors: [{ face: 'left', u: 0.8 }] });
    gabled(m, rnd, { x0: -2.3, x1: -1.3, z0: 0.4, z1: 1.5, h0: 0.0, h1: 0.5, wallMat: 'siding', wall: '#8a6a46', roofMat: 'thatch', roof: PALETTE.thatch[1], ridgeH: 0.4, axis: 'z', frame: false, base: false, doors: [{ face: 'front', u: 0.55, w: 0.3, h: 0.38 }] });
  } else {
    // Level 2 and 3: a great hall against the back wall and a taller keep with turrets.
    gabled(m, rnd, { x0: -2.2, x1: 2.2, z0: -2.35, z1: -1.55, h0: 0.0, h1: 0.95, wallMat: 'stone', wall: STONE[0], roofMat: 'slate', roof: SLATE, ridgeH: 0.75, over: 0.1, axis: 'x', frame: false, base: false, doors: [{ face: 'front', u: 2.2, w: 0.3, h: 0.5 }], windows: [{ face: 'front', u: 0.8, v: 0.4, w: 0.18, h: 0.4 }, { face: 'front', u: 1.5, v: 0.4, w: 0.18, h: 0.4 }, { face: 'front', u: 2.9, v: 0.4, w: 0.18, h: 0.4 }, { face: 'front', u: 3.6, v: 0.4, w: 0.18, h: 0.4 }] });
    keep(m, 0.5, -0.1, 2.0, 1.9, level === 2 ? 3.4 : 3.9, { turrets: true, banner: '#b32a2a' });
    gabled(m, rnd, { x0: -2.4, x1: -1.4, z0: -0.9, z1: 0.6, h0: 0.0, h1: 0.7, wallMat: 'plaster', wall: '#d8c8a6', roofMat: 'tile', roof: PALETTE.tile[2], ridgeH: 0.5, axis: 'z', base: false, doors: [{ face: 'right', u: 0.7 }] });
    gabled(m, rnd, { x0: 1.5, x1: 2.4, z0: 0.8, z1: 2.0, h0: 0.0, h1: 0.55, wallMat: 'siding', wall: '#8a6a46', roofMat: 'thatch', roof: PALETTE.thatch[0], ridgeH: 0.42, axis: 'x', frame: false, base: false, doors: [{ face: 'front', u: 0.6, w: 0.3, h: 0.4 }] });
  }
  if (level >= 3) {
    // The inner ward: a second, higher wall round the keep, and a spire on it.
    const r = 1.55;
    wallRun(m, [-r, -r], [r, -r], { h: H + 0.9, col: STONE[2] });
    wallRun(m, [-r, -r], [-r, r], { h: H + 0.9, col: STONE[2] });
    wallRun(m, [r, -r], [r, r], { h: H + 0.9, col: STONE[2] });
    wallRun(m, [-r, r], [r, r], { h: H + 0.9, col: STONE[2] });
    for (const [x, z] of [[-r, -r], [r, -r], [-r, r], [r, r]]) roundTower(m, x, z, 0.4, 3.6, { roof: '#4a5460', roofH: 1.3, banner: pickFrom(rnd, banners) });
    m.cylinder('slate', 0.5, 3.93, -0.1, 0.01, 0.95, 2.2, 4, '#4a5460', { rot: Math.PI / 4, smooth: false, caps: false });
    m.sphere('metal', 0.5, 6.2, -0.1, 0.06, 0.06, 0.06, '#d4b24a', { detail: 1 });
    flag(m, 0.5, 6.25, -0.1, 0.55, '#b32a2a', { w: 0.42 });
  }
  // A well and a few barrels in the yard.
  m.cylinder('stone', -0.9, 0, 1.4, 0.22, 0.24, 0.3, 10, STONE[3], { smooth: true });
  barrel(m, 1.0, 0, 1.5); barrel(m, 1.2, 0, 1.4); crate(m, -1.2, 0, 1.0, 0.15);
  fenceRun(m, [-0.5, 0, 1.0], [0.5, 0, 1.0], { h: 0.15 });
  return { height: level >= 3 ? 6.8 : 4.4 };
}

export function castle(m, v) {
  const { rnd, level } = v;
  const out = level === 0 ? timberCastle(m, rnd) : stoneCastle(m, rnd, level);
  return { ...out, smoke: [[1.5, 1.1, 0.5]] };
}

/** Scaffolding round the castle while it is being raised. */
export function castleScaffold() {
  const m = new Mesher();
  const R = 3.05;
  const H = 2.6;
  for (const [a, b] of [[[-R, -R], [R, -R]], [[-R, R], [R, R]], [[-R, -R], [-R, R]], [[R, -R], [R, R]]]) {
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[1] + ((b[1] - a[1]) * i) / n;
      m.box('wood', x - 0.03, -0.2, z - 0.03, x + 0.03, H, z + 0.03, PALETTE.wood[1], { skip: ['bottom'], uvScale: 2 });
    }
    for (const y of [0.9, 1.8, 2.6]) m.beam('wood', [a[0], y, a[1]], [b[0], y, b[1]], 0.04, PALETTE.wood[0]);
  }
  return m.finish();
}

