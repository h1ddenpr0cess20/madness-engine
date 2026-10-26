import { PALETTE, barrel, chimney, crate, logPile, pickFrom, sack } from './common.js';
import { cart, gabled, wheel } from './parts.js';

/**
 * The works: quarry, iron mine, storehouse, smithy and weaver.
 */

const GREYS = ['#8f8a80', '#a29c90', '#7c776e', '#b0aa9c', '#96907f'];
/** Freshly cut stone is paler than the weathered rock round it. */
const FRESH = ['#cfc6b2', '#c4baa4', '#d6ceba', '#bdb39c'];
const ORE = ['#7a4a32', '#8a4a30', '#5a3a2e', '#6a3e2a', '#94583a'];

/** A squared block: a box of cut stone, a little different each time. */
function block(m, rnd, x, y, z, s, yaw = 0) {
  const h = s * (0.62 + rnd() * 0.2);
  m.at(x, y, z, () => m.box('rock', -s * 0.6, 0, -s * 0.45, s * 0.6, h, s * 0.45, pickFrom(rnd, FRESH), { skip: ['bottom'] }), yaw);
  return h;
}

/** A heap of broken stone: rough lumps, the bigger ones at the foot. */
function heap(m, rnd, cx, cz, r, n = 8, cols = GREYS, { seed = 0, size = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r;
    const s = (0.05 + rnd() * 0.06) * size * (1.3 - d / r * 0.5);
    m.rock('rock', cx + Math.cos(a) * d, s * 0.35, cz + Math.sin(a) * d, s * 1.3, s * 0.9, s * 1.1, pickFrom(rnd, cols), { detail: 0, rough: 0.3, seed: seed + i * 3.1, lichen: 0 });
  }
}

/**
 * A treadwheel crane, the way a medieval quarry or a cathedral lifted its
 * stone: a man-high wheel walked from inside, turning a drum that winds the
 * rope, on a frame with a jib out over the work. In its own frame the wheel
 * turns about x, and the jib reaches toward +z.
 */
function treadwheel(m, x, z, yaw = 0, { r = 0.38, reach = 0.95, load = null } = {}) {
  const W = PALETTE.wood;
  m.at(x, 0, z, () => {
    const y = r + 0.06;
    // The two rims, each a ring of short timbers, and the spokes.
    const n = 14;
    for (const sx of [-0.11, 0.11]) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        m.beam('wood', [sx, y + Math.sin(a0) * r, Math.cos(a0) * r], [sx, y + Math.sin(a1) * r, Math.cos(a1) * r], 0.035, W[1]);
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI + 0.3;
        m.beam('wood', [sx, y - Math.sin(a) * r * 0.95, -Math.cos(a) * r * 0.95], [sx, y + Math.sin(a) * r * 0.95, Math.cos(a) * r * 0.95], 0.022, W[0]);
      }
    }
    // The treads between the rims.
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      const py = y + Math.sin(a) * r * 0.97, pz = Math.cos(a) * r * 0.97;
      m.beam('wood', [-0.11, py, pz], [0.11, py, pz], 0.022, W[2]);
    }
    // The axle and its two trestles.
    m.beam('wood', [-0.22, y, 0], [0.22, y, 0], 0.05, '#4a3622');
    for (const sx of [-0.2, 0.2]) {
      m.beam('wood', [sx, 0, -0.22], [sx, y + 0.02, 0], 0.04, W[1]);
      m.beam('wood', [sx, 0, 0.22], [sx, y + 0.02, 0], 0.04, W[1]);
      m.beam('wood', [sx, 0.02, -0.26], [sx, 0.02, 0.26], 0.04, W[0]);
    }
    // The mast beside it, a jib out over the work, braced, and the rope down to the load.
    const mx = 0.36, top = y + r + 0.55;
    m.beam('wood', [mx, 0, 0], [mx, top, 0], 0.07, W[1]);
    m.beam('wood', [mx, top - 0.08, -0.05], [mx, top + 0.08, reach], 0.055, W[0]);
    m.beam('wood', [mx, top - 0.55, 0.03], [mx, top - 0.02, reach * 0.55], 0.035, W[0]);
    for (const sz of [-0.32, 0.32]) m.beam('wood', [mx, 0, sz], [mx, top * 0.45, 0], 0.035, W[1]);
    m.beam('wood', [0.22, y, 0], [mx, top - 0.06, 0], 0.012, '#c8b48a');
    const hook = load ?? 0.35;
    m.beam('wood', [mx, top + 0.06, reach - 0.04], [mx, hook, reach - 0.04], 0.012, '#c8b48a');
    m.cylinder('wood', mx, top + 0.02, reach - 0.04, 0.045, 0.045, 0.04, 8, '#3a2a1a', { smooth: true });
  }, yaw);
  // Where the rope hangs, in the model's frame.
  const mx = 0.36, tz = reach - 0.04, c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + c * mx + s * tz, z - s * mx + c * tz];
}

/** A tub on four small wheels, for ore or stone, on rails or the ground: plank sides that splay out, iron at the corners. */
function tub(m, x, y, z, yaw, { load = ORE, rnd = Math.random } = {}) {
  m.at(x, y, z, () => {
    const b = [0.15, 0.1], t = [0.18, 0.13], y0 = 0.07, y1 = 0.24;
    const P = (sx, sz, top) => [sx * (top ? t[0] : b[0]), top ? y1 : y0, sz * (top ? t[1] : b[1])];
    const W = '#6a4a2c';
    m.quad('wood', P(-1, 1, 0), P(1, 1, 0), P(1, 1, 1), P(-1, 1, 1), W);
    m.quad('wood', P(1, -1, 0), P(-1, -1, 0), P(-1, -1, 1), P(1, -1, 1), W);
    m.quad('wood', P(1, 1, 0), P(1, -1, 0), P(1, -1, 1), P(1, 1, 1), '#5e4228');
    m.quad('wood', P(-1, -1, 0), P(-1, 1, 0), P(-1, 1, 1), P(-1, -1, 1), '#5e4228');
    m.quad('wood', P(-1, -1, 0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0), '#2a1e14');
    // The insides, seen over the rim.
    m.quad('wood', P(-1, 1, 1), P(1, 1, 1), P(1, 1, 0), P(-1, 1, 0), '#3a2a1c');
    m.quad('wood', P(1, -1, 1), P(-1, -1, 1), P(-1, -1, 0), P(1, -1, 0), '#3a2a1c');
    m.quad('wood', P(1, -1, 1), P(1, -1, 0), P(1, 1, 0), P(1, 1, 1), '#3a2a1c');
    m.quad('wood', P(-1, 1, 1), P(-1, 1, 0), P(-1, -1, 0), P(-1, -1, 1), '#3a2a1c');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.beam('metal', [sx * (b[0] + 0.004), y0, sz * (b[1] + 0.004)], [sx * (t[0] + 0.004), y1, sz * (t[1] + 0.004)], 0.014, '#2e2c2a');
    m.beam('metal', [-t[0] - 0.004, y1 - 0.012, t[1] + 0.006], [t[0] + 0.004, y1 - 0.012, t[1] + 0.006], 0.016, '#2e2c2a');
    m.beam('metal', [-t[0] - 0.004, y1 - 0.012, -t[1] - 0.006], [t[0] + 0.004, y1 - 0.012, -t[1] - 0.006], 0.016, '#2e2c2a');
    if (load) for (let i = 0; i < 6; i++) m.rock('rock', (rnd() - 0.5) * 0.2, y1 - 0.02, (rnd() - 0.5) * 0.12, 0.05, 0.04, 0.045, pickFrom(rnd, load), { detail: 0, rough: 0.3, seed: i * 7.3 + x, lichen: 0 });
    for (const sx of [-0.1, 0.1]) for (const sz of [-1, 1]) m.at(sx, 0.05, sz * 0.115, () => wheel(m, 0, 0, 0, 0.05));
  }, yaw);
}

/** A run of track: two iron rails on sleepers, from a to b along the ground. */
function rails(m, a, b, { gauge = 0.2, y = 0 } = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
  const n = Math.round(len / 0.14);
  for (let i = 0; i <= n; i++) {
    const t = (i + 0.5) / (n + 1);
    const x = a[0] + dx * t, z = a[1] + dz * t;
    m.beam('wood', [x - nx * gauge * 0.75, y + 0.012, z - nz * gauge * 0.75], [x + nx * gauge * 0.75, y + 0.012, z + nz * gauge * 0.75], 0.026, '#5a4430');
  }
  for (const s of [-1, 1]) m.beam('metal', [a[0] + nx * s * gauge / 2, y + 0.034, a[1] + nz * s * gauge / 2], [b[0] + nx * s * gauge / 2, y + 0.034, b[1] + nz * s * gauge / 2], 0.018, '#3c3a38');
}

/** A banker: the mason's bench, a block on it half dressed, a mallet and a chisel. */
function banker(m, rnd, x, z, yaw = 0) {
  m.at(x, 0, z, () => {
    m.box('wood', -0.18, 0.2, -0.1, 0.18, 0.24, 0.1, PALETTE.wood[0], { skip: ['bottom'] });
    for (const sx of [-0.15, 0.15]) for (const sz of [-0.07, 0.07]) m.box('wood', sx - 0.015, 0, sz - 0.015, sx + 0.015, 0.2, sz + 0.015, PALETTE.wood[1]);
    m.box('rock', -0.1, 0.24, -0.07, 0.08, 0.36, 0.07, pickFrom(rnd, FRESH), { skip: ['bottom'] });
    m.box('wood', 0.1, 0.24, -0.02, 0.16, 0.28, 0.03, '#7a5a38', { skip: ['bottom'] });
  }, yaw);
}

export function quarry(m, v) {
  const { rnd } = v;
  // The working: benches cut down into the hill, pale where they are fresh, the weathered rock round them.
  m.rock('rock', -0.1, -0.5, -1.45, 1.7, 1.35, 0.55, '#8a857a', { detail: 2, rough: 0.18, seed: 11, base: 0.6, lichen: 0.8 });
  m.rock('rock', -1.3, -0.3, -0.85, 0.45, 0.78, 0.6, '#857f73', { detail: 1, rough: 0.22, seed: 4, lichen: 0.7 });
  m.rock('rock', 1.25, -0.3, -0.95, 0.5, 0.88, 0.55, '#8f897c', { detail: 1, rough: 0.22, seed: 9, lichen: 0.7 });
  const steps = [[-0.95, 0.85, -1.0, -0.66, 0.2], [-0.85, 0.75, -1.2, -0.96, 0.42], [-0.7, 0.6, -1.4, -1.16, 0.64]];
  for (const [x0, x1, z0, z1, h] of steps) m.box('rock', x0, 0, z0, x1, h, z1, pickFrom(rnd, FRESH), { skip: ['bottom', 'back'] });
  // The floor of the working, dusty and pale, and the blocks waiting on it.
  m.box('rock', -1.1, 0, -0.62, 1.0, 0.025, 0.1, '#bdb4a0', { skip: ['bottom', 'back'] });
  for (let i = 0; i < 3; i++) block(m, rnd, -0.65 + i * 0.36, 0.025, -0.35, 0.26, (rnd() - 0.5) * 0.3);
  // Dressed blocks stacked by the road, ready to go: two rows of three, two on top.
  for (let i = 0; i < 3; i++) block(m, rnd, -1.05 + i * 0.3, 0, 0.95, 0.24);
  for (let i = 0; i < 3; i++) block(m, rnd, -1.05 + i * 0.3, 0, 0.66, 0.24);
  for (let i = 0; i < 2; i++) block(m, rnd, -0.9 + i * 0.3, 0.155, 0.8, 0.22, 0.05);
  // The treadwheel crane lifting a block off the working.
  const [hx, hz] = treadwheel(m, 0.6, 0.05, Math.PI - 0.45, { r: 0.36, reach: 0.82, load: 0.5 });
  block(m, rnd, hx, 0.35, hz, 0.22);
  // The mason's lodge: an open-fronted shed with a banker in it, a sledge and chips by the door.
  const lx0 = 0.7, lx1 = 1.4, lz0 = 0.55, lz1 = 1.2;
  for (const [x, z] of [[lx0, lz1], [lx1, lz1]]) m.box('wood', x - 0.025, 0, z - 0.025, x + 0.025, 0.44, z + 0.025, PALETTE.wood[1], { skip: ['bottom'] });
  m.box('siding', lx0, 0, lz0, lx1, 0.52, lz0 + 0.04, '#8a7454', { skip: ['bottom'] });
  m.box('siding', lx1 - 0.04, 0, lz0 + 0.04, lx1, 0.47, lz1 - 0.03, '#8a7454', { skip: ['bottom'] });
  m.slab('slate', [lx0 - 0.06, 0.43, lz1 + 0.08], [lx1 + 0.06, 0.43, lz1 + 0.08], [lx1 + 0.06, 0.57, lz0 - 0.05], [lx0 - 0.06, 0.57, lz0 - 0.05], '#6a5a46', 0.035, [0, 1, 2, 3]);
  banker(m, rnd, 1.05, 0.85, 0);
  heap(m, rnd, 0.25, 0.85, 0.22, 7, FRESH, { seed: 5, size: 0.6 });
  heap(m, rnd, 1.15, -0.4, 0.3, 9, GREYS, { seed: 17 });
  m.at(-0.05, 0, 0.35, () => {
    for (const sx of [-0.1, 0.1]) m.box('wood', sx - 0.02, 0, -0.22, sx + 0.02, 0.04, 0.22, '#5a4430', { skip: ['bottom'] });
    m.box('wood', -0.14, 0.04, -0.18, 0.14, 0.065, 0.18, PALETTE.wood[0], { skip: ['bottom'] });
  }, 0.4);
  return { height: 1.7 };
}

export function ironmine(m, v) {
  const { rnd } = v;
  // The hill: an outcrop the mine is driven into, rusty where the ore shows.
  const rusty = (d, lump) => (lump > 0.62 ? '#7a5a48' : null);
  m.rock('rock', 0.05, -0.45, -1.15, 1.55, 1.25, 0.75, '#6e675c', { detail: 2, rough: 0.2, seed: 3, base: 0.55, lichen: 0.8, colorFn: rusty });
  m.rock('rock', -1.2, -0.3, -0.6, 0.5, 0.7, 0.55, '#6a6359', { detail: 1, rough: 0.25, seed: 8, lichen: 0.7 });
  // The adit: a timbered entry out from the hill, a pitched plank roof over it, the dark going in.
  const ax = -0.25, az0 = -0.95, az1 = -0.25, hw = 0.24, hh = 0.5;
  m.box('plain', ax - hw, 0, az0, ax + hw, hh, az0 + 0.02, '#050403', { skip: ['bottom', 'back'] });
  // Its walls and roof, seen from inside.
  m.quad('plain', [ax - hw, 0, az1], [ax - hw, 0, az0], [ax - hw, hh, az0], [ax - hw, hh, az1], '#120e0a');
  m.quad('plain', [ax + hw, 0, az0], [ax + hw, 0, az1], [ax + hw, hh, az1], [ax + hw, hh, az0], '#120e0a');
  m.quad('plain', [ax - hw, hh, az1], [ax - hw, hh, az0], [ax + hw, hh, az0], [ax + hw, hh, az1], '#0a0806');
  m.quad('plain', [ax - hw, 0.002, az0], [ax - hw, 0.002, az1], [ax + hw, 0.002, az1], [ax + hw, 0.002, az0], '#1a140e');
  for (const z of [az1 - 0.02, az1 - 0.3, az1 - 0.58]) {
    const k = z < az1 - 0.1 ? 0.6 : 1;
    for (const s of [-1, 1]) m.box('wood', ax + s * hw - 0.04, 0, z - 0.04, ax + s * hw + 0.04, hh, z + 0.04, k < 1 ? '#3a2a1c' : PALETTE.wood[1], { skip: ['bottom'] });
    m.box('wood', ax - hw - 0.07, hh, z - 0.045, ax + hw + 0.07, hh + 0.08, z + 0.045, k < 1 ? '#3a2a1c' : PALETTE.wood[0], { skip: ['bottom'] });
  }
  // Plank cheeks either side of the mouth, holding the ground back, and the roof.
  for (const s of [-1, 1]) m.box('siding', ax + s * (hw + 0.04) - 0.015, 0, az1 - 0.6, ax + s * (hw + 0.04) + 0.015, hh, az1 - 0.06, '#5e4a34', { skip: ['bottom'] });
  m.gable('wood', ax - hw - 0.1, az1 - 0.62, ax + hw + 0.1, az1 + 0.02, hh + 0.08, hh + 0.32, '#6a5238', { over: 0.06, axis: 'z', gable: 'siding', gableColor: '#5e4a34', ridge: { mat: 'wood', col: PALETTE.wood[0] } });
  m.box('glow', ax + hw - 0.07, 0.32, az1 + 0.045, ax + hw - 0.03, 0.39, az1 + 0.06, PALETTE.warm, { skip: ['bottom'] });
  m.beam('metal', [ax + hw - 0.05, 0.39, az1 + 0.05], [ax + hw - 0.05, 0.46, az1 + 0.05], 0.008, '#222');
  // Rails out of the mouth to the tip, a tub of ore on them.
  rails(m, [ax, az0 + 0.05], [ax, 0.75]);
  rails(m, [ax, 0.75], [ax + 0.75, 1.25]);
  tub(m, ax, 0.034, 0.25, Math.PI / 2, { rnd });
  // The ore pile, sorted out of the rock, and the spoil tip below the end of the rails.
  heap(m, rnd, 0.55, 0.55, 0.32, 14, ORE, { seed: 21, size: 1.1 });
  heap(m, rnd, -1.05, 0.95, 0.35, 12, ['#6a6359', '#5e584f', '#77706a'], { seed: 31 });
  // A bloomery: a squat rubble furnace with the fire in its mouth and the bellows under a lean-to.
  const fx = 1.05, fz = -0.25;
  m.cylinder('rubble', fx, 0, fz, 0.17, 0.27, 0.62, 10, '#8a7e6e', { smooth: true, caps: false });
  m.ring('rubble', fx, 0.62, fz, 0.09, 0.17, 10, '#7e7264');
  m.disc('plain', fx, 0.6, fz, 0.09, 10, '#1a0c06');
  m.box('glow', fx - 0.06, 0.04, fz + 0.24, fx + 0.06, 0.14, fz + 0.262, PALETTE.fire, { skip: ['bottom'] });
  for (const s of [-1, 1]) m.box('wood', fx + 0.3 - 0.02, 0, fz + s * 0.25 - 0.02, fx + 0.3 + 0.02, 0.42, fz + s * 0.25 + 0.02, PALETTE.wood[1], { skip: ['bottom'] });
  m.slab('slate', [fx + 0.38, 0.38, fz + 0.32], [fx + 0.38, 0.38, fz - 0.32], [fx + 0.12, 0.5, fz - 0.32], [fx + 0.12, 0.5, fz + 0.32], '#5a5048', 0.03, [0, 1, 2, 3]);
  m.box('cloth', fx + 0.16, 0.12, fz - 0.1, fx + 0.32, 0.2, fz + 0.1, '#5a3a26', { skip: ['bottom'] });
  // The headframe over a shaft on the shoulder of the hill: two legs braced, the winding wheel, the rope down.
  const hx = 0.75, hz = -0.75, hy = 0.18;
  m.box('wood', hx - 0.2, hy, hz - 0.2, hx + 0.2, hy + 0.06, hz + 0.2, '#4a3622', { skip: ['bottom'] });
  m.box('plain', hx - 0.13, hy + 0.06, hz - 0.13, hx + 0.13, hy + 0.067, hz + 0.13, '#050403', { skip: ['bottom'] });
  for (const s of [-1, 1]) {
    m.beam('wood', [hx + s * 0.22, hy, hz - 0.18], [hx + s * 0.06, hy + 1.15, hz], 0.05, PALETTE.wood[1]);
    m.beam('wood', [hx + s * 0.22, hy, hz + 0.18], [hx + s * 0.06, hy + 1.15, hz], 0.05, PALETTE.wood[1]);
    m.beam('wood', [hx + s * 0.16, hy + 0.4, hz - 0.12], [hx + s * 0.16, hy + 0.4, hz + 0.12], 0.03, PALETTE.wood[0]);
  }
  m.beam('wood', [hx - 0.1, hy + 1.12, hz], [hx + 0.1, hy + 1.12, hz], 0.04, '#3a2a1a');
  m.push().translate(hx, hy + 1.12, hz).rotateY(Math.PI / 2);
  wheel(m, 0, 0, 0, 0.2);
  m.pop();
  m.beam('wood', [hx, hy + 0.95, hz + 0.02], [hx, hy + 0.08, hz + 0.02], 0.008, '#c8b48a');
  m.beam('wood', [hx, hy + 1.3, hz - 0.03], [hx + 0.5, hy - 0.05, hz + 0.6], 0.008, '#c8b48a');
  // The miners' shed by the road, a lantern at its door, tools and timber for the props.
  gabled(m, rnd, { x0: -1.45, x1: -0.75, z0: 0.05, z1: 0.6, h1: 0.48, wallMat: 'siding', wall: '#7a6a52', roofMat: 'slate', roof: '#555050', ridgeH: 0.28, frame: false, base: false, doors: [{ face: 'front', u: 0.4, w: 0.2, h: 0.34 }], windows: [{ face: 'right', u: 0.3, w: 0.14, h: 0.14 }] });
  logPile(m, -0.55, 0, 0.35, { len: 0.42, rows: 3, r: 0.03, yaw: Math.PI / 2 });
  barrel(m, -0.62, 0, 0.75);
  crate(m, 0.05, 0, 1.15, 0.13);
  for (let i = 0; i < 3; i++) m.beam('wood', [0.2 + i * 0.05, 0, 1.0], [0.24 + i * 0.05, 0.36, 0.84], 0.016, PALETTE.wood[0]);
  return { smoke: [[fx, 0.66, fz]], height: 1.8, lights: [{ at: [fx, 0.2, fz + 0.35], color: '#ff8a3a', reach: 3 }] };
}

export function storehouse(m, v) {
  const { rnd } = v;
  const x0 = -1.3, x1 = 1.3, z0 = -1.3, z1 = 0.8;
  gabled(m, rnd, { x0, x1, z0, z1, h0: 0.1, h1: 0.95, wallMat: 'plaster', wall: pickFrom(rnd, PALETTE.plaster), roofMat: 'tile', roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.8, over: 0.16, axis: 'x', baseCol: PALETTE.stone[0], doors: [], windows: [{ face: 'right', u: 1.0 }, { face: 'left', u: 1.0 }, { face: 'front', u: 0.4, v: 0.55, w: 0.18, h: 0.2, glow: true }, { face: 'front', u: 2.2, v: 0.55, w: 0.18, h: 0.2 }] });
  // Two wide cart doors with crossed timbers.
  for (const u of [0.7, 1.9]) {
    m.box('wood', x0 + u - 0.3, 0.1, z1 - 0.01, x0 + u + 0.3, 0.75, z1 + 0.04, '#5a3a20', { skip: ['bottom', 'back'] });
    m.beam('timber', [x0 + u - 0.3, 0.1, z1 + 0.05], [x0 + u + 0.3, 0.75, z1 + 0.05], 0.035, PALETTE.timber);
    m.beam('timber', [x0 + u + 0.3, 0.1, z1 + 0.06], [x0 + u - 0.3, 0.75, z1 + 0.06], 0.035, PALETTE.timber);
  }
  for (let i = 0; i < 3; i++) crate(m, -0.9 + i * 0.25, 0.0, 1.0, 0.15);
  crate(m, -0.8, 0.15, 1.0, 0.13);
  for (let i = 0; i < 3; i++) barrel(m, 0.7 + i * 0.22, 0.0, 1.1);
  for (let i = 0; i < 3; i++) sack(m, 1.3 + (i % 2) * 0.1, 0.0, 0.4 + i * 0.15);
  cart(m, -0.2, 0, 1.15, 1.2);
  return { height: 1.9 };
}

/** A flame: a few tilted glowing planes. */
function flameAt(m, x, y, z, s = 1) {
  for (const a of [0, Math.PI / 2, Math.PI / 4]) {
    m.at(x, y, z, () => {
      m.quad('flame', [-0.05 * s, 0, 0], [0.05 * s, 0, 0], [0.02 * s, 0.14 * s, 0], [-0.02 * s, 0.14 * s, 0], '#ff7a1a');
      m.quad('flame', [-0.03 * s, 0.02 * s, 0.002], [0.03 * s, 0.02 * s, 0.002], [0.0, 0.1 * s, 0.002], [0.0, 0.02 * s, 0.002], '#ffd45a');
    }, a);
  }
}

export function smithy(m, v) {
  const { rnd } = v;
  const x0 = -0.75, x1 = 0.75, z0 = -1.25, z1 = 0.45;
  // Stone walls on three sides, open at the front half.
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.08, z1 + 0.03, PALETTE.stone[3], { skip: ['bottom'] });
  m.box('stone', x0, 0.08, z0, x1, 0.74, z0 + 0.12, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0, 0.08, z0 + 0.12, x0 + 0.12, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x1 - 0.12, 0.08, z0 + 0.12, x1, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0 + 0.12, 0.08, z1 - 0.12, x0 + 0.5, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x1 - 0.5, 0.08, z1 - 0.12, x1 - 0.12, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0 + 0.5, 0.68, z1 - 0.12, x1 - 0.5, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.gable('tile', x0, z0, x1, z1, 0.74, 1.3, pickFrom(rnd, PALETTE.tile), { over: 0.15, gable: 'stone', gableColor: '#8f887a', axis: 'x', ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  // The forge: a hearth against the back wall, a hood, a chimney.
  m.box('stone', -0.3, 0.08, z0 + 0.12, 0.3, 0.38, z0 + 0.5, '#756f66', { skip: ['bottom'] });
  m.box('plain', -0.22, 0.38, z0 + 0.16, 0.22, 0.4, z0 + 0.46, '#1a1410', { skip: ['bottom'] });
  m.box('glow', -0.18, 0.4, z0 + 0.2, 0.18, 0.43, z0 + 0.42, '#ff7a1a', { skip: ['bottom'] });
  flameAt(m, 0, 0.4, z0 + 0.3, 1.4);
  const top = chimney(m, 0.0, z0 + 0.3, 0.55, 1.7, { w: 0.32 });
  // An anvil on a stump, a quench barrel, tools on the wall.
  m.cylinder('bark', -0.1, 0.08, -0.45, 0.1, 0.11, 0.26, 8, '#6a4a2c', { smooth: true });
  m.box('metal', -0.2, 0.34, -0.5, 0.0, 0.4, -0.4, '#44444a');
  m.box('metal', -0.17, 0.4, -0.49, -0.03, 0.46, -0.41, '#55555c');
  barrel(m, 0.55, 0.08, -0.5, { r: 0.1, h: 0.2 });
  for (let i = 0; i < 4; i++) m.beam('metal', [-0.6, 0.4 + i * 0.05, z0 + 0.13], [-0.4, 0.5 + i * 0.05, z0 + 0.13], 0.014, '#6a6a70');
  // Iron bars stacked outside, a grindstone.
  for (let i = 0; i < 6; i++) m.box('metal', 0.9, (i % 3) * 0.04, 0.0 + Math.floor(i / 3) * 0.06, 1.2, (i % 3) * 0.04 + 0.035, 0.05 + Math.floor(i / 3) * 0.06, '#5a5a62');
  m.push().translate(-1.0, 0.18, 0.2).rotateZ(Math.PI / 2);
  m.cylinder('stone', 0, -0.03, 0, 0.14, 0.14, 0.06, 12, '#a49c8a', { smooth: true });
  m.pop();
  m.beam('wood', [-1.0, 0.18, 0.15], [-1.0, 0.0, 0.1], 0.03, PALETTE.wood[1]);
  m.beam('wood', [-1.0, 0.18, 0.25], [-1.0, 0.0, 0.3], 0.03, PALETTE.wood[1]);
  logPile(m, 1.0, 0.0, 0.35, { len: 0.3, rows: 2, r: 0.03, yaw: Math.PI / 2 });
  return { smoke: [top], height: 1.7, lights: [{ at: [0, 0.5, z0 + 0.4], color: '#ff8a3a', reach: 5 }] };
}

export function weaver(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.65, x1: 0.65, z0: -1.25, z1: 0.0, h1: 0.66, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.5, axis: 'x', doors: [{ face: 'front', u: 0.4 }], windows: [{ face: 'front', u: 1.0, w: 0.26, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'right', u: 0.6 }, { face: 'left', u: 0.6 }] });
  const top = chimney(m, -0.4, -0.75, 0.5, 1.3);
  // A drying rack hung with dyed cloth.
  m.beam('wood', [-1.0, 0.7, 0.55], [1.0, 0.7, 0.55], 0.03, PALETTE.wood[1]);
  for (const x of [-1.0, 1.0]) m.beam('wood', [x, 0, 0.55], [x, 0.685, 0.55], 0.03, PALETTE.wood[1]);
  const cols = ['#b32a2a', '#2a4a9a', '#c9a227', '#2a7a4a', '#7a3a8a', '#e0d0a0', '#b32a2a'];
  cols.forEach((c, i) => {
    const x = -0.85 + i * 0.28;
    m.quad('cloth', [x, 0.68, 0.56], [x + 0.22, 0.68, 0.56], [x + 0.22, 0.2, 0.56], [x, 0.2, 0.56], c);
  });
  // A loom frame and a pair of dye vats.
  m.box('wood', 0.55, 0.0, 0.2, 0.62, 0.55, 0.28, PALETTE.wood[1]);
  m.box('wood', 0.95, 0.0, 0.2, 1.02, 0.55, 0.28, PALETTE.wood[1]);
  m.box('wood', 0.54, 0.5, 0.19, 1.03, 0.56, 0.29, PALETTE.wood[1]);
  for (let i = 0; i < 6; i++) m.box('cloth', 0.64 + i * 0.05, 0.1, 0.235, 0.66 + i * 0.05, 0.5, 0.245, '#e8e0c8');
  for (const [x, c] of [[-0.9, '#2a4a9a'], [-0.6, '#b32a2a']]) {
    m.cylinder('wood', x, 0, 0.1, 0.12, 0.13, 0.22, 10, PALETTE.wood[1], { smooth: true, bottom: false, capCol: c });
  }
  sack(m, 0.8, 0, -0.5, '#e8e0c8');
  sack(m, 0.9, 0, -0.35, '#efe8d0');
  return { smoke: [top], height: 1.3 };
}

