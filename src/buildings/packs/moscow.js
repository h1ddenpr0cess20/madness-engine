import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { block, grid } from './kit.js';

/**
 * A Moscow pack: an Orthodox church with green onion domes, a log izba with
 * carved shutters under a steep roof, a red-brick Kremlin tower with a star, and
 * a khrushchevka panel block of pale concrete with its balconies.
 */

/** An Orthodox church: a white body with a bell tower and green onion domes, one on the tower and two smaller ones beside it, under a gold cross. */
export function onionchurch(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#f6f6f2', '#f0ece2']);
  const green = pickFrom(rnd, ['#2a7a3a', '#2a6a5a', '#2a5aa8']);
  m.box('plaster', -0.6, 0, -0.5, 0.6, 0.7, 0.5, wall, { skip: ['bottom', 'top'] });
  m.box('plaster', -0.28, 0.7, -0.28, 0.28, 1.2, 0.28, wall, { skip: ['bottom', 'top'] });
  m.sphere('plain', 0, 1.25, 0, 0.28, 0.4, 0.28, green, { detail: 2 });
  for (const x of [-0.45, 0.45]) m.sphere('plain', x, 0.7, -0.1, 0.18, 0.3, 0.18, green, { detail: 2 });
  m.box('metal', -0.02, 1.62, -0.01, 0.02, 1.95, 0.01, '#d8b040');
  m.box('metal', -0.08, 1.72, -0.01, 0.08, 1.76, 0.01, '#d8b040');
  const F = faces(-0.6, -0.5, 0.6, 0.5, 0, 0.7);
  grid(m, F, 1, 0.3, { gap: 0.36, w: 0.18, h: 0.24, frame: '#4a3a2a', v0: 0.26, skip: (name, u) => name === 'front' && Math.abs(u - 0.6) < 0.3 });
  doorOn(m, F.front, 0.6, 0.2, 0.34, '#4a2a18', { step: false });
  return { height: 1.95 };
}

/** An izba: a log house on a plinth, its roof steep and wooden, with carved shutters in blue and a porch under the eaves. */
export function izba(m, v) {
  const { rnd } = v;
  const log = pickFrom(rnd, ['#8a6840', '#7a5a38', '#9a7648']);
  const x0 = -0.7, x1 = 0.7, z0 = -0.6, z1 = 0.5;
  m.box('stone', x0 - 0.03, 0, z0 - 0.03, x1 + 0.03, 0.12, z1 + 0.03, '#8a8270', { skip: ['bottom'] });
  m.box('wood', x0, 0.12, z0, x1, 0.7, z1, log, { skip: ['bottom', 'top'] });
  for (let k = 0; k < 6; k++) m.box('plain', x0 - 0.01, 0.14 + k * 0.095, z0 - 0.01, x1 + 0.01, 0.16 + k * 0.095, z1 + 0.01, '#5a4026', { skip: ['bottom', 'top'] });
  m.gable('wood', x0, z0, x1, z1, 0.7, 1.15, '#5a4026', { over: 0.22, gable: 'wood', gableColor: log });
  const F = faces(x0, z0, x1, z1, 0.12, 0.7);
  for (const u of [0.3, 1.1]) {
    windowOn(m, F.front, u, 0.22, 0.24, 0.26, { sill: false, frame: '#3a6aa8' });
  }
  doorOn(m, F.front, 0.7, 0.2, 0.38, '#5a3a20', { step: false });
  // A porch of posts with a carved edge, under the eave.
  for (const x of [0.5, 0.9]) m.box('wood', x - 0.03, 0, z1 + 0.02, x + 0.03, 0.58, z1 + 0.08, '#4a3020', { skip: ['top'] });
  return { height: 1.15 };
}

/** A Kremlin tower: a red-brick square tower with white stone trim, arched openings, a tented spire and a red star on top. */
export function kremlintower(m, v) {
  const { rnd } = v;
  const brick = pickFrom(rnd, ['#9a3a2a', '#a84a32', '#8a3a28']);
  const x0 = -0.5, x1 = 0.5, z0 = -0.5, z1 = 0.5, H = 2.2;
  m.box('plaster', x0, 0, z0, x1, H, z1, brick, { skip: ['bottom', 'top'] });
  m.box('stone', x0 - 0.03, H - 0.03, z0 - 0.03, x1 + 0.03, H + 0.06, z1 + 0.03, '#e8e0d0', { skip: ['bottom'] });
  const F = faces(x0, z0, x1, z1, 0, H);
  for (const f of Object.values(F)) {
    for (const v0 of [0.7, 1.2, 1.7]) panel(m, 'plain', f, f.w / 2 - 0.08, v0, f.w / 2 + 0.08, v0 + 0.3, 0.006, '#2a1a10');
  }
  // The crown: a tented spire of green, a star on the top.
  m.cone('metal', 0, H + 0.06, 0, 0.5, H + 0.9, 4, '#3a6a4a');
  m.cylinder('metal', 0, H + 0.9, 0, 0.012, 0.02, 0.3, 5, '#c8c8c8', { caps: false });
  m.box('glow', -0.1, H + 1.1, -0.01, 0.1, H + 1.3, 0.01, '#ff3030');
  return { height: H + 1.3 };
}

/** A khrushchevka: a pale concrete panel block of nine storeys, with a balcony on every floor and rows of plain windows. */
export function khrushchevka(m, v) {
  const { rnd } = v;
  const floors = 7 + Math.floor(rnd() * 2), fh = 0.26, H = floors * fh;
  const F = block(m, -1.2, -0.45, 1.2, 0.45, 0, H, '#d8d4cc', { roof: '#7a7a80', parapet: 0.04 });
  grid(m, F, floors, fh, { gap: 0.4, w: 0.2, h: 0.16, frame: '#8a8a90', v0: 0.06 });
  for (let k = 1; k < floors; k++) m.box('stone', -1.1, k * fh, 0.45, 1.1, k * fh + 0.02, 0.52, '#c8c4bc', { skip: ['top'] });
  return { height: H + 0.1 };
}

/** The footprints these models are drawn for. */
export const MOSCOW_FOOTPRINTS = Object.freeze({
  onionchurch: [2, 2], izba: [2, 2], kremlintower: [2, 2], khrushchevka: [3, 2],
});
