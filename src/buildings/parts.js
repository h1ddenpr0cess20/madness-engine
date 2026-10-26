import { PALETTE, doorOn, faces, halfTimber, pickFrom, windowOn } from './common.js';

/**
 * A gabled building from a description, for the many small works that differ
 * in their walls, their roof and their doors rather than in their shape.
 *
 *   gabled(m, rnd, { x0, x1, z0, z1, h1, wallMat, wall, roofMat, roof, ridgeH, ... })
 *
 * Returns the faces, so the caller can hang things on them.
 */
export function gabled(m, rnd, o) {
  const {
    x0, x1, z0, z1, h0 = 0.09, h1, wallMat = 'plaster', wall = pickFrom(rnd, PALETTE.plaster), roofMat = 'tile', roof = pickFrom(rnd, PALETTE.tile), ridgeH = 0.5,
    over = 0.12, axis = 'x', frame = wallMat === 'plaster', base = true, baseCol = pickFrom(rnd, PALETTE.stone), doors = [], windows = [], gableMat = wallMat, cols = null,
    stilts = 0,
  } = o;
  if (base) m.box('rubble', x0 - 0.03, -0.35 + stilts, z0 - 0.03, x1 + 0.03, h0, z1 + 0.03, baseCol, { skip: ['bottom'] });
  m.box(wallMat, x0, h0, z0, x1, h1, z1, wall, { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, h0, h1);
  if (frame) {
    for (const n of ['front', 'back']) halfTimber(m, F[n], { cols: cols ?? Math.max(2, Math.round((x1 - x0) / 0.42)), rails: [0, h1 - h0], rnd });
    for (const n of ['left', 'right']) halfTimber(m, F[n], { cols: Math.max(2, Math.round((z1 - z0) / 0.42)), rails: [0, h1 - h0], rnd });
  }
  m.gable(roofMat, x0, z0, x1, z1, h1, h1 + ridgeH, roof, { over, gable: gableMat, gableColor: wall, axis, gableScale: 0.7, ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  for (const d of doors) doorOn(m, F[d.face ?? 'front'], d.u, d.w ?? 0.24, d.h ?? 0.44, d.col ?? pickFrom(rnd, PALETTE.door), { step: d.step ?? true });
  for (const w of windows) windowOn(m, F[w.face ?? 'front'], w.u, w.v ?? 0.2, w.w ?? 0.2, w.h ?? 0.19, { shutters: w.shutters ?? null, glow: w.glow ?? true });
  return F;
}

/** A staddle stone: a mushroom of stone for a granary to stand on, against the rats. */
export function staddle(m, x, z, h = 0.3) {
  m.cylinder('stone', x, -0.1, z, 0.055, 0.075, h + 0.1, 8, PALETTE.stone[0], { bottom: false });
  m.cylinder('stone', x, h - 0.04, z, 0.12, 0.04, 0.05, 8, PALETTE.stone[1], { bottom: false });
}

/** A cartwheel standing on edge in the xy plane: a rim, a hub and spokes. */
export function wheel(m, x, y, z, r = 0.14) {
  m.at(x, y, z, () => {
    m.push().rotateX(Math.PI / 2);
    m.cylinder('wood', 0, -0.015, 0, r, r, 0.03, 12, PALETTE.wood[1], { caps: true });
    m.cylinder('wood', 0, -0.02, 0, r * 0.82, r * 0.82, 0.04, 12, '#1a1410', { caps: false });
    m.pop();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      m.beam('wood', [-Math.cos(a) * r * 0.85, -Math.sin(a) * r * 0.85, 0], [Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, 0], 0.016, PALETTE.wood[0]);
    }
  });
}

/** A hand cart: a bed on two wheels, handles out the back. */
export function cart(m, x, y, z, yaw = 0, col = PALETTE.wood[0]) {
  m.at(x, y, z, () => {
    m.box('wood', -0.22, 0.12, -0.14, 0.22, 0.16, 0.14, col, { skip: ['bottom'] });
    for (const s of [-1, 1]) m.box('wood', -0.22, 0.16, s * 0.14 - 0.01, 0.22, 0.26, s * 0.14 + 0.01, col, { skip: ['bottom'] });
    m.box('wood', -0.23, 0.16, -0.14, -0.21, 0.26, 0.14, col, { skip: ['bottom'] });
    wheel(m, 0, 0.12, 0.17, 0.12);
    wheel(m, 0, 0.12, -0.17, 0.12);
    m.beam('wood', [0.22, 0.14, 0.1], [0.5, 0.1, 0.1], 0.02, col);
    m.beam('wood', [0.22, 0.14, -0.1], [0.5, 0.1, -0.1], 0.02, col);
  }, yaw);
}

/** A hop pole or a bean row: tall poles with green climbing them. */
export function climbers(m, rnd, x0, z0, x1, z1, { h = 0.7, n = 4, col = '#5f9a3a' } = {}) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    m.cylinder('wood', x, 0, z, 0.012, 0.016, h, 5, PALETTE.wood[1]);
    for (let k = 0; k < 4; k++) m.sphere('hedge', x + (rnd() - 0.5) * 0.05, 0.14 + k * (h / 5), z + (rnd() - 0.5) * 0.05, 0.05, 0.065, 0.05, col, { detail: 0, jitter: 0.25 });
  }
}
