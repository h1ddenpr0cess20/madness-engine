import { at, barrel, doorOn, faces, panel, pickFrom, windowOn } from './common.js';
import { palm } from '../flora.js';

/**
 * Buildings from cities abroad: a Paris apartment block under its mansard, a
 * Greek island house with a blue dome, a Kyoto townhouse and a tiered pagoda,
 * a colonial house with iron balconies and a palm court, an Amsterdam canal
 * house, an Orthodox church with onion domes, a mosque with its minarets, and a
 * favela of shacks on a hill. The same frame as the rest of the library: front
 * toward +z, middle at the origin, standing on y = 0.
 */

const INT = {
  cream: ['#eadfc4', '#f0e6d0', '#e4d6b8'],
  zinc: '#6a7078',
  white: ['#f6f6f2', '#f0ece2'],
  blue: ['#2a5aa8', '#3a7ac0'],
  tile: ['#8a4a32', '#a85a3c', '#6a3a2a'],
  brick: ['#9a4a32', '#8a3f2a', '#a85a3c'],
  pink: ['#e8a0a0', '#e8c0a0'],
  roof: '#3a3a3e',
};

/** A block of walls with a flat roof. Returns its faces. */
function block(m, x0, z0, x1, z1, y0, y1, col) {
  m.box('plaster', x0, y0, z0, x1, y1, z1, col, { skip: ['bottom', 'top'] });
  m.box('plain', x0, y1 - 0.001, z0, x1, y1, z1, INT.roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  return faces(x0, z0, x1, z1, y0, y1);
}

/** Windows in rows on the given faces. `skip(name, u, row)` leaves out the ones it names. */
function grid(m, F, rows, fh, { gap = 0.36, w = 0.18, h = 0.2, frame = '#ffffff', v0 = 0.12, skip = null } = {}) {
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
function slabOn(m, mat, f, u0, u1, v0, v1, o0, o1, col) {
  const a = at(f, u0, v0, o0), b = at(f, u1, v1, o1);
  m.box(mat, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), col);
}

/** A quad seen from both sides: a roof's underside, a mansard's slope. */
function sheet(m, mat, a, b, c, d, col) {
  m.quad(mat, a, b, c, d, col);
  m.quad(mat, d, c, b, a, col);
}

// ---- Europe ----

/** A Paris apartment block under its mansard: cream stone, a zinc roof sloping up from the cornice, tall windows, and iron balconies on the second floor. */
export function haussmann(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, INT.cream);
  const x0 = -0.85, x1 = 0.85, z0 = -1.3, z1 = 1.3, H = 1.05, top = H + 0.5, ins = 0.25;
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  m.box('stone', x0 - 0.03, H - 0.02, z0 - 0.03, x1 + 0.03, H + 0.06, z1 + 0.03, '#d8d0bc', { skip: ['bottom'] });
  // The mansard: four slopes up to a flat top.
  sheet(m, 'plain', [x0, H, z1], [x1, H, z1], [x1 - ins, top, z1 - ins], [x0 + ins, top, z1 - ins], INT.zinc);
  sheet(m, 'plain', [x1, H, z1], [x1, H, z0], [x1 - ins, top, z0 + ins], [x1 - ins, top, z1 - ins], INT.zinc);
  sheet(m, 'plain', [x1, H, z0], [x0, H, z0], [x0 + ins, top, z0 + ins], [x1 - ins, top, z0 + ins], INT.zinc);
  sheet(m, 'plain', [x0, H, z0], [x0, H, z1], [x0 + ins, top, z1 - ins], [x0 + ins, top, z0 + ins], INT.zinc);
  sheet(m, 'plain', [x0 + ins, top, z1 - ins], [x1 - ins, top, z1 - ins], [x1 - ins, top, z0 + ins], [x0 + ins, top, z0 + ins], INT.zinc);
  // Four storeys of windows; an iron balcony under the second-floor windows.
  grid(m, F, 4, 0.24, { gap: 0.38, w: 0.18, h: 0.2, frame: '#3a3a40', v0: 0.1, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 0.9) < 0.3 });
  doorOn(m, F.front, 0.9, 0.22, 0.38, '#3a2a1a', { step: false });
  for (const [u0, u1] of [[0.2, 0.6], [1.2, 1.6]]) {
    slabOn(m, 'stone', F.front, u0, u1, 0.3, 0.33, 0, 0.12, INT.cream[0]);
    slabOn(m, 'metal', F.front, u0, u1, 0.33, 0.45, 0.1, 0.12, '#2a2a2e');
  }
  return { height: top };
}

/** A Greek island house: whitewashed cubes stepped up a hill, blue doors and shutters, and a blue-domed chapel on the top. */
export function greekvillage(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, INT.white);
  const F = block(m, -0.8, -0.7, 0.8, 0.6, 0, 0.7, wall);
  doorOn(m, F.front, 0.4, 0.2, 0.36, INT.blue[0], { step: false });
  windowOn(m, F.front, 1.1, 0.3, 0.2, 0.2, { sill: false, frame: INT.blue[0] });
  // A second cube up and to the back, and the chapel's dome on a third.
  const G = block(m, -0.1, -0.7, 0.6, -0.1, 0.7, 1.0, wall);
  windowOn(m, G.front, 0.3, 0.2, 0.16, 0.2, { sill: false, frame: INT.blue[0] });
  m.box('plaster', 0.2, 1.0, -0.6, 0.6, 1.3, -0.2, wall, { skip: ['bottom', 'top'] });
  m.sphere('glass', 0.4, 1.3, -0.4, 0.2, 0.2, 0.2, INT.blue[1], { detail: 2 });
  m.cylinder('metal', 0.4, 1.5, -0.4, 0.008, 0.008, 0.2, 4, '#e8e8e8', { caps: false });
  return { height: 1.5 };
}

// ---- Asia ----

/** A Kyoto townhouse: a wooden shopfront behind a lattice of slim bars, plaster above, and a deep tiled roof on hips. */
export function machiya(m, v) {
  const { rnd } = v;
  const tile = pickFrom(rnd, INT.tile);
  const x0 = -0.8, x1 = 0.8, z0 = -1.0, z1 = 0.8, H = 1.0;
  m.box('wood', x0, 0, z0, x1, 0.5, z1, '#6a4a2a', { skip: ['bottom', 'top'] });
  for (let i = 0; i < 9; i++) m.box('wood', x0 + 0.1 + i * 0.16, 0.05, z1, x0 + 0.12 + i * 0.16, 0.5, z1 + 0.03, '#3a2a1a');
  m.box('plaster', x0, 0.5, z0, x1, H, z1, '#e8e0d0', { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, 0.5, H);
  windowOn(m, F.front, 0.4, 0.2, 0.2, 0.22, { sill: false, frame: '#3a2a1a' });
  windowOn(m, F.front, 1.2, 0.2, 0.2, 0.22, { sill: false, frame: '#3a2a1a' });
  m.hip('tile', x0 - 0.12, z0 - 0.12, x1 + 0.12, z1 + 0.12, H, H + 0.35, tile, { over: 0.04 });
  return { height: H + 0.35 };
}

/** A tiered pagoda: a stone plinth, three wooden storeys each under a deep tiled roof that turns up at the eaves, and a spire. */
export function pagoda(m, v) {
  const { rnd } = v;
  const tile = pickFrom(rnd, INT.tile);
  m.box('stone', -0.95, 0, -0.95, 0.95, 0.1, 0.95, '#b8b0a0', { skip: ['bottom'] });
  let y = 0.1;
  for (let t = 0; t < 3; t++) {
    const w = 0.78 - t * 0.2, h = 0.3;
    m.box('wood', -w * 0.7, y, -w * 0.7, w * 0.7, y + h, w * 0.7, '#8a3a2a', { skip: ['bottom', 'top'] });
    // Only the ground storey has windows: the storeys above stand on the roofs below.
    if (t === 0) windowOn(m, faces(-w * 0.7, -w * 0.7, w * 0.7, w * 0.7, y, y + h).front, 0, 0.08, 0.14, 0.16, { sill: false, frame: '#f4e4c0' });
    m.hip('tile', -w, -w, w, w, y + h, y + h + 0.12, tile, { over: 0.06 });
    y += h + 0.12;
  }
  m.cylinder('metal', 0, y, 0, 0.02, 0.03, 0.5, 6, '#c8a040', { caps: false });
  m.sphere('glow', 0, y + 0.55, 0, 0.05, 0.05, 0.05, '#ffd84a', { detail: 0 });
  return { height: y + 0.6 };
}

// ---- The Americas ----

/** A colonial house: whitewash with pink trim, a tiled hip roof, and iron balconies over the windows of two floors round a palm court. */
export function colonial(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, INT.white);
  const x0 = -1.2, x1 = 1.2, z0 = -1.1, z1 = 0.9, H = 0.95;
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  m.hip('tile', x0 - 0.05, z0 - 0.05, x1 + 0.05, z1 + 0.05, H, H + 0.4, INT.tile[0], { over: 0.1 });
  grid(m, F, 2, 0.38, { gap: 0.4, w: 0.2, h: 0.22, frame: pickFrom(rnd, INT.pink), v0: 0.12, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 1.2) < 0.3 });
  doorOn(m, F.front, 1.2, 0.24, 0.42, '#4a2a18', { step: false });
  // Iron balconies across the second floor's front.
  slabOn(m, 'stone', F.front, 0.3, 1.5, 0.5, 0.53, 0, 0.14, pickFrom(rnd, INT.pink));
  slabOn(m, 'metal', F.front, 0.3, 1.5, 0.53, 0.63, 0.12, 0.14, '#2a2a2e');
  m.at(-1.0, 0, 1.1, (mm) => palm(mm, { seed: 3 }));
  return { height: H + 0.4 };
}

/** A favela: shacks of brick and board crowded up a slope, each under a sheet of tin, with a barrel of water by the door. */
export function favela(m, v) {
  const { rnd } = v;
  const shacks = [[-0.9, -0.9, -0.1, -0.1, 0.6], [0.1, -0.9, 0.9, -0.1, 0.8], [-0.9, 0.1, -0.1, 0.9, 0.5], [0.1, 0.1, 0.9, 0.9, 0.9]];
  for (const [x0, z0, x1, z1, h] of shacks) {
    const col = pickFrom(rnd, [...INT.brick, '#b8a888', '#8a7a64']);
    m.box('plaster', x0, 0, z0, x1, h, z1, col, { skip: ['bottom', 'top'] });
    m.box('metal', x0 - 0.03, h, z0 - 0.03, x1 + 0.03, h + 0.05, z1 + 0.03, '#8a8e94', { skip: ['bottom'] });
    const F = faces(x0, z0, x1, z1, 0, h);
    windowOn(m, F.front, (x1 - x0) * 0.3, h * 0.45, 0.16, 0.18, { sill: false, frame: '#2a2a2e' });
    doorOn(m, F.front, (x1 - x0) * 0.72, 0.16, 0.34, '#4a3a2a', { step: false });
  }
  barrel(m, -0.5, 0, 0.95);
  return { height: 1.0 };
}

// ---- The Orthodox and the Muslim world ----

/** An Orthodox church: a white body with a bell tower and green onion domes, one on the tower and two smaller ones beside it, under a gold cross. */
export function onionchurch(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, INT.white);
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

/** A mosque: a white hall under a blue dome, with arched windows, and a minaret at each corner with its balcony and spire. */
export function mosque(m, v) {
  const { rnd } = v;
  const blue = pickFrom(rnd, INT.blue);
  const F = block(m, -1.1, -1.1, 1.1, 1.1, 0, 0.5, '#f0ead8');
  grid(m, F, 1, 0.3, { gap: 0.36, w: 0.18, h: 0.24, frame: '#4a6a7a', v0: 0.18 });
  m.sphere('glass', 0, 0.5, 0, 0.6, 0.55, 0.6, blue, { detail: 2 });
  for (const [x, z] of [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]]) {
    m.cylinder('plaster', x, 0, z, 0.1, 0.12, 1.6, 12, '#f0ead8', { caps: false });
    m.cylinder('plain', x, 1.2, z, 0.16, 0.16, 0.04, 12, '#e8e0c8', { caps: false });
    m.cone('plain', x, 1.6, z, 0.11, 2.0, 12, '#e8e0c8');
  }
  return { height: 2.0 };
}

/** A canal house: a tall narrow brick house with a tiled gable to the street, a beam for hoisting goods at the top, and tall windows. */
export function canalhouse(m, v) {
  const { rnd } = v;
  const brick = pickFrom(rnd, INT.brick);
  const x0 = -0.75, x1 = 0.75, z0 = -1.3, z1 = 1.3, H = 1.6;
  m.box('plaster', x0, 0, z0, x1, H, z1, brick, { skip: ['bottom', 'top'] });
  m.gable('tile', x0, z0, x1, z1, H, H + 0.6, INT.tile[2], { over: 0.1, gable: 'plaster', gableColor: brick });
  const F = faces(x0, z0, x1, z1, 0, H);
  grid(m, F, 4, 0.36, { gap: 0.36, w: 0.2, h: 0.26, frame: '#f0ece0', v0: 0.12, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 0.75) < 0.3 });
  doorOn(m, F.front, 0.75, 0.2, 0.36, '#2a3a2a', { step: false });
  m.box('wood', 0.55, H - 0.25, z1, 0.65, H - 0.15, z1 + 0.25, '#4a3a2a');
  return { height: H + 0.6 };
}

/** The footprints these models are drawn for. */
export const INTERNATIONAL_FOOTPRINTS = Object.freeze({
  haussmann: [2, 3], greekvillage: [2, 2], machiya: [2, 2], pagoda: [2, 2], colonial: [3, 3],
  favela: [2, 2], onionchurch: [2, 2], mosque: [3, 3], canalhouse: [2, 3],
});
