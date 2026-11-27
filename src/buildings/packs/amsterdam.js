import { doorOn, faces, pickFrom, windowOn } from '../common.js';
import { block, grid } from './kit.js';

/**
 * An Amsterdam pack: a canal house, tall and narrow, with a tiled gable to the
 * street and a hoist beam; a houseboat moored at the quay under a low roof; and
 * a cheese market hall of brick under a tiled roof, open at the sides.
 */

const BRICK = ['#9a4a32', '#8a3f2a', '#a85a3c'];
const TILE = ['#8a4a32', '#a85a3c', '#6a3a2a'];

/** A canal house: a tall narrow brick house with a tiled gable to the street, a beam for hoisting goods at the top and tall windows. */
export function canalhouse(m, v) {
  const { rnd } = v;
  const brick = pickFrom(rnd, BRICK);
  const x0 = -0.75, x1 = 0.75, z0 = -1.3, z1 = 1.3, H = 1.6;
  m.box('plaster', x0, 0, z0, x1, H, z1, brick, { skip: ['bottom', 'top'] });
  m.gable('tile', x0, z0, x1, z1, H, H + 0.6, pickFrom(rnd, TILE), { over: 0.1, gable: 'plaster', gableColor: brick });
  const F = faces(x0, z0, x1, z1, 0, H);
  grid(m, F, 4, 0.36, { gap: 0.36, w: 0.2, h: 0.26, frame: '#f0ece0', v0: 0.12, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 0.75) < 0.3 });
  doorOn(m, F.front, 0.75, 0.2, 0.36, '#2a3a2a', { step: false });
  m.box('wood', 0.55, H - 0.25, z1, 0.65, H - 0.15, z1 + 0.25, '#4a3a2a');
  return { height: H + 0.6 };
}

/** A houseboat: a wooden barge with a low cabin, a row of small windows, a flower box and a plank to the quay. */
export function houseboat(m, v) {
  const { rnd } = v;
  const hull = pickFrom(rnd, ['#2a3a5a', '#3a2a2a', '#f0ece0']);
  m.box('wood', -0.9, 0, -0.35, 0.9, 0.22, 0.35, hull, { skip: ['top'] });
  m.box('plaster', -0.6, 0.22, -0.25, 0.6, 0.6, 0.25, '#f0ece0', { skip: ['bottom', 'top'] });
  m.box('plain', -0.66, 0.6, -0.3, 0.66, 0.66, 0.3, '#3a3a40', { skip: ['bottom'] });
  const F = faces(-0.6, -0.25, 0.6, 0.25, 0.22, 0.6).front;
  for (const u of [0.25, 0.6, 0.95]) windowOn(m, F, u, 0.18, 0.2, 0.2, { sill: false, frame: '#3a3a40' });
  m.box('plain', -0.2, 0.22, 0.35, 0.2, 0.26, 0.5, '#8a6840', { skip: ['bottom'] });
  m.box('wood', -0.9, 0.22, 0.35, -0.7, 0.24, 0.9, '#8a6840', { skip: ['bottom'] });
  m.box('glow', -0.5, 0.42, 0.25, -0.38, 0.46, 0.26, '#ff8aa0', { skip: ['back'] });
  return { height: 0.7 };
}

/** A cheese market: a long brick hall of arches open at the sides, a tiled roof, and scales and barrels of cheese under it. */
export function cheesemarket(m, v) {
  const { rnd } = v;
  const brick = pickFrom(rnd, BRICK);
  const x0 = -1.2, x1 = 1.2, z0 = -0.8, z1 = 0.8, H = 0.8;
  const F = block(m, x0, z0, x1, z1, 0, H, brick, { roof: pickFrom(rnd, TILE) });
  m.hip('tile', x0 - 0.1, z0 - 0.1, x1 + 0.1, z1 + 0.1, H, H + 0.4, pickFrom(rnd, TILE), { over: 0.02 });
  for (let i = 0; i <= 5; i++) m.box('stone', x0 + i * 0.4 - 0.03, 0, z1, x0 + i * 0.4 + 0.03, H * 0.55, z1 + 0.04, '#e8e0d0');
  grid(m, { back: F.back }, 1, 0.3, { gap: 0.4, w: 0.18, h: 0.2, frame: '#f0ece0', v0: 0.3 });
  // The cheese: round wheels stacked on a trestle by the door.
  for (let k = 0; k < 4; k++) m.cylinder('plain', -0.8 + k * 0.5, 0.05, 0.0, 0.14, 0.14, 0.1, 14, '#f4d060', { caps: true });
  return { height: H + 0.4 };
}

/** The footprints these models are drawn for. */
export const AMSTERDAM_FOOTPRINTS = Object.freeze({
  canalhouse: [2, 3], houseboat: [2, 1], cheesemarket: [3, 2],
});
