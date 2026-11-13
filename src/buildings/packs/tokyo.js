import { faces, panel, pickFrom, windowOn } from '../common.js';
import { block, glassTier, grid } from './kit.js';

/**
 * A Tokyo pack: a Kyoto-style machiya townhouse, a tiered pagoda on a plinth,
 * a konbini convenience store with its bright sign, a two-storey izakaya with
 * paper lanterns, a danchi concrete housing block, and a neon tower.
 */

/** A machiya: a wooden shopfront behind a lattice of slim bars, plaster above, and a deep tiled roof on hips. */
export function machiya(m, v) {
  const { rnd } = v;
  const tile = pickFrom(rnd, ['#8a4a32', '#a85a3c', '#6a3a2a']);
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

/** A tiered pagoda: a stone plinth, three wooden storeys each under a deep tiled roof, and a gilt spire. Windows only on the ground storey, the storeys above standing on the roofs. */
export function pagoda(m, v) {
  const { rnd } = v;
  const tile = pickFrom(rnd, ['#8a4a32', '#a85a3c', '#6a3a2a']);
  m.box('stone', -0.95, 0, -0.95, 0.95, 0.1, 0.95, '#b8b0a0', { skip: ['bottom'] });
  let y = 0.1;
  for (let t = 0; t < 3; t++) {
    const w = 0.78 - t * 0.2, h = 0.3;
    m.box('wood', -w * 0.7, y, -w * 0.7, w * 0.7, y + h, w * 0.7, '#8a3a2a', { skip: ['bottom', 'top'] });
    if (t === 0) windowOn(m, faces(-w * 0.7, -w * 0.7, w * 0.7, w * 0.7, y, y + h).front, 0, 0.08, 0.14, 0.16, { sill: false, frame: '#f4e4c0' });
    m.hip('tile', -w, -w, w, w, y + h, y + h + 0.12, tile, { over: 0.06 });
    y += h + 0.12;
  }
  m.cylinder('metal', 0, y, 0, 0.02, 0.03, 0.5, 6, '#c8a040', { caps: false });
  m.sphere('glow', 0, y + 0.55, 0, 0.05, 0.05, 0.05, '#ffd84a', { detail: 0 });
  return { height: y + 0.6 };
}

/** A konbini: a flat white box of glass and a bright sign band in green and white, a canopy over the door and a row of bins. */
export function konbini(m, v) {
  const { rnd } = v;
  const F = block(m, -0.9, -0.8, 0.9, 0.8, 0, 0.9, pickFrom(rnd, ['#f4f4f0', '#eeeeea']), { roof: '#5a5a60', parapet: 0.06 });
  panel(m, 'glass', F.front, 0.1, 0.12, 1.6, 0.66, 0.006, '#2e4e66');
  panel(m, 'glow', F.front, 0.14, 0.16, 1.56, 0.62, 0.011, '#fff8e0');
  panel(m, 'plain', F.front, 0.05, 0.72, 1.65, 0.86, 0.012, '#1f8a4a');
  panel(m, 'glow', F.front, 0.2, 0.76, 1.5, 0.82, 0.03, '#ffffff');
  m.box('plain', -0.5, 0.66, 0.8, 0.5, 0.72, 1.05, '#d8d8d4', { skip: ['bottom'] });
  for (const x of [-0.4, 0.4]) m.box('metal', x - 0.02, 0, 1.0, x + 0.02, 0.62, 1.05, '#2a2a2e', { skip: ['top'] });
  m.box('plain', -0.8, 0, 0.9, -0.6, 0.45, 1.1, '#2a2a2e', { skip: ['bottom'] });
  m.box('plain', -0.5, 0, 0.9, -0.3, 0.45, 1.1, '#3a6aa8', { skip: ['bottom'] });
  return { height: 0.95 };
}

/** An izakaya: two storeys of dark wood under a tiled roof, paper lanterns on the eaves, and a noren curtain over the door. */
export function izakaya(m, v) {
  const { rnd } = v;
  const tile = pickFrom(rnd, ['#6a3a2a', '#4a3a3a', '#8a4a32']);
  const x0 = -0.8, x1 = 0.8, z0 = -0.8, z1 = 0.7;
  m.box('wood', x0, 0, z0, x1, 0.8, z1, '#4a3020', { skip: ['bottom', 'top'] });
  m.box('plaster', x0, 0.8, z0, x1, 1.45, z1, '#e8e0d0', { skip: ['bottom', 'top'] });
  m.hip('tile', x0 - 0.1, z0 - 0.1, x1 + 0.1, z1 + 0.1, 1.45, 1.75, tile, { over: 0.05 });
  const F = faces(x0, z0, x1, z1, 0.8, 1.45);
  windowOn(m, F.front, 0.5, 0.25, 0.3, 0.3, { sill: false, frame: '#3a2a1a' });
  windowOn(m, F.front, 1.1, 0.25, 0.3, 0.3, { sill: false, frame: '#3a2a1a' });
  panel(m, 'cloth', faces(x0, z0, x1, z1, 0, 0.8).front, 0.6, 0.05, 1.0, 0.6, 0.02, '#2a2420');
  for (const u of [-0.5, 0.5]) m.sphere('glow', u, 0.84, z1 + 0.14, 0.09, 0.12, 0.09, '#ff8a3a', { detail: 1 });
  return { height: 1.75 };
}

/** A danchi: a long concrete housing block of many storeys, with balconies of pale rail and a stair tower at one end. */
export function danchi(m, v) {
  const { rnd } = v;
  const floors = 5 + Math.floor(rnd() * 2), fh = 0.3, H = floors * fh;
  const F = block(m, -1.3, -0.5, 1.3, 0.5, 0, H, '#d8d8d4', { roof: '#7a7a80', parapet: 0.05 });
  grid(m, F, floors, fh, { gap: 0.34, w: 0.2, h: 0.18, frame: '#5a5a60', v0: 0.08 });
  for (let k = 1; k < floors; k++) m.box('metal', -1.25, k * fh, 0.5, 1.25, k * fh + 0.02, 0.58, '#8a8e94');
  m.box('stone', 1.3, 0, -0.7, 1.45, H, 0.7, '#c8c8c4', { skip: ['bottom'] });
  return { height: H + 0.1 };
}

/** A neon tower: a slim glass tower with its floors lit in pastel and a neon sign stacked up its front. */
export function neontower(m, v) {
  const { rnd } = v;
  const H = 5.2 + rnd() * 1.2;
  glassTier(m, -0.55, -0.5, 0.55, 0.5, 0, H, 0.3, pickFrom(rnd, ['#2e3a5a', '#3a2e5a', '#2a4a5a']), '#e8ecef', '#ff6ab0');
  m.box('plaster', -0.4, H, -0.35, 0.4, H + 0.2, 0.35, '#e8e8e4', { skip: ['top'] });
  // The neon sign: a column of pink and blue bars on the front.
  for (let k = 0; k < 6; k++) panel(m, 'glow', faces(-0.55, -0.5, 0.55, 0.5, 0, H).front, 0.2, 0.4 + k * 0.5, 0.9, 0.5 + k * 0.5, 0.02, pickFrom(rnd, ['#ff3ab0', '#3ad0ff', '#ffe03a']));
  m.cylinder('metal', 0, H + 0.2, 0, 0.01, 0.015, 0.9, 5, '#d8d8d8', { caps: false });
  m.sphere('glow', 0, H + 1.1, 0, 0.035, 0.035, 0.035, '#ff4a3a', { detail: 0 });
  return { height: H + 1.15 };
}

/** The footprints these models are drawn for. */
export const TOKYO_FOOTPRINTS = Object.freeze({
  machiya: [2, 2], pagoda: [2, 2], konbini: [2, 2], izakaya: [2, 2], danchi: [3, 2], neontower: [2, 2],
});
