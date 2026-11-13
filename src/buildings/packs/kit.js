import { at, faces, panel, windowOn } from '../common.js';

/**
 * The pieces every pack builds from: walls with a roof, rows of windows, a
 * box set on a face, a double-sided sheet, an awning. Each takes the frame the
 * rest of the library uses: front toward +z, standing on y = 0.
 */

/** A block of walls with a flat roof of `roof` and a cornice, or a parapet, round its top. Returns its faces. */
export function block(m, x0, z0, x1, z1, y0, y1, col, { wall = 'plaster', roof = '#3a3a3e', cornice = null, parapet = 0 } = {}) {
  m.box(wall, x0, y0, z0, x1, y1, z1, col, { skip: ['bottom', 'top'] });
  m.box('plain', x0, y1 - 0.001, z0, x1, y1, z1, roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  if (cornice) m.box('stone', x0 - 0.03, y1 - 0.02, z0 - 0.03, x1 + 0.03, y1 + 0.06, z1 + 0.03, cornice, { skip: ['bottom'] });
  if (parapet) {
    const t = 0.04;
    m.box(wall, x0, y1, z1 - t, x1, y1 + parapet, z1, col);
    m.box(wall, x0, y1, z0, x1, y1 + parapet, z0 + t, col);
    m.box(wall, x0, y1, z0 + t, x0 + t, y1 + parapet, z1 - t, col);
    m.box(wall, x1 - t, y1, z0 + t, x1, y1 + parapet, z1 - t, col);
  }
  return faces(x0, z0, x1, z1, y0, y1);
}

/** Windows in rows on the given faces. `skip(name, u, row)` leaves out the ones it names. */
export function grid(m, F, rows, fh, { gap = 0.36, w = 0.18, h = 0.2, frame = '#ffffff', v0 = 0.12, skip = null } = {}) {
  for (const [name, f] of Object.entries(F)) {
    const n = Math.max(1, Math.floor(f.w / gap));
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < n; i++) {
        const u = (f.w * (i + 0.5)) / n;
        if (skip && skip(name, u, r)) continue;
        windowOn(m, f, u, v0 + r * fh, w, h, { sill: false, frame });
      }
    }
  }
}

/** A box whose corners are given in a face's frame: `u0..u1` across, `v0..v1` up, `o0..o1` out from the wall. */
export function slabOn(m, mat, f, u0, u1, v0, v1, o0, o1, col) {
  const a = at(f, u0, v0, o0), b = at(f, u1, v1, o1);
  m.box(mat, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), col);
}

/** A quad seen from both sides: a roof's underside, a mansard's slope, a sail. */
export function sheet(m, mat, a, b, c, d, col) {
  m.quad(mat, a, b, c, d, col);
  m.quad(mat, d, c, b, a, col);
}

/** An awning over a face: a sloped cloth from `v` down and out. */
export function awning(m, f, u0, u1, v, col) {
  m.quad('cloth', at(f, u0, v, 0.02), at(f, u0, v - 0.12, 0.26), at(f, u1, v - 0.12, 0.26), at(f, u1, v, 0.02), col);
}

/** A glass box with a lit pane per floor and metal bands between the floors. */
export function glassTier(m, x0, z0, x1, z1, y0, y1, fh, glass, band = '#d8dce0', warm = '#ffb45a') {
  m.box('glass', x0, y0, z0, x1, y1, z1, glass, { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, y0, y1);
  const floors = Math.max(1, Math.round((y1 - y0) / fh));
  for (const f of Object.values(F)) {
    for (let k = 0; k <= floors; k++) {
      const v = Math.min(f.h - 0.02, k * fh);
      panel(m, 'metal', f, 0, v, f.w, v + 0.025, 0.008, band);
      if (k < floors) {
        const cols = Math.max(1, Math.round(f.w / 0.3));
        for (let i = 0; i < cols; i++) {
          if ((i * 7 + k * 3) % 5 < 2) continue;
          panel(m, 'glow', f, (f.w * i) / cols + 0.03, v + 0.05, (f.w * (i + 1)) / cols - 0.03, v + fh - 0.04, 0.012, warm);
        }
      }
    }
  }
  m.box('metal', x0 - 0.02, y1, z0 - 0.02, x1 + 0.02, y1 + 0.05, z1 + 0.02, band);
}
