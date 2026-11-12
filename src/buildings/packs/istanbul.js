import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { block, grid } from './kit.js';

/**
 * An Istanbul pack: a mosque with its blue dome and minarets, a hamam with its
 * cluster of small domes and a chimney, a covered bazaar of stalls under arches,
 * and a konak, the timber-fronted house of a pasha, with its upper floor overhanging.
 */

/** A mosque: a white hall under a blue dome, with arched windows, and a minaret at each corner with its balcony and spire. */
export function mosque(m, v) {
  const { rnd } = v;
  const blue = pickFrom(rnd, ['#2a5aa8', '#3a7ac0']);
  const F = block(m, -1.1, -1.1, 1.1, 1.1, 0, 0.5, '#f0ead8', { roof: '#e8e0c8' });
  grid(m, F, 1, 0.3, { gap: 0.36, w: 0.18, h: 0.24, frame: '#4a6a7a', v0: 0.18 });
  m.sphere('glass', 0, 0.5, 0, 0.6, 0.55, 0.6, blue, { detail: 2 });
  for (const [x, z] of [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]]) {
    m.cylinder('plaster', x, 0, z, 0.1, 0.12, 1.6, 12, '#f0ead8', { caps: false });
    m.cylinder('plain', x, 1.2, z, 0.16, 0.16, 0.04, 12, '#e8e0c8', { caps: false });
    m.cone('plain', x, 1.6, z, 0.11, 2.0, 12, '#e8e0c8');
  }
  return { height: 2.0 };
}

/** A hamam: a bath house of stone with a cluster of small lead domes over its halls, a tall chimney and a arched door. */
export function hamam(m, v) {
  const { rnd } = v;
  const stone = pickFrom(rnd, ['#e8e0d0', '#d8d0c0']);
  m.box('stone', -1.0, 0, -0.9, 1.0, 0.5, 0.9, stone, { skip: ['bottom', 'top'] });
  const domes = [[-0.5, -0.4], [0.0, -0.4], [0.5, -0.4], [-0.25, 0.3], [0.25, 0.3]];
  for (const [x, z] of domes) {
    m.cylinder('stone', x, 0.5, z, 0.22, 0.25, 0.1, 12, stone, { caps: false });
    m.sphere('plain', x, 0.6, z, 0.24, 0.2, 0.24, '#6a7078', { detail: 2 });
  }
  m.cylinder('stone', 0.85, 0, -0.5, 0.07, 0.09, 1.3, 10, '#c8b8a0', { caps: false });
  const F = faces(-1.0, -0.9, 1.0, 0.9, 0, 0.5);
  doorOn(m, F.front, 1.0, 0.24, 0.4, '#4a2a18', { step: false });
  windowOn(m, F.front, 0.4, 0.2, 0.16, 0.14, { sill: false, frame: '#4a4a40' });
  return { height: 1.3 };
}

/** A covered bazaar: a long hall of arches open at the sides, a lead roof with domes, and stalls of carpets and brass along it. */
export function bazaar(m, v) {
  const { rnd } = v;
  const stone = pickFrom(rnd, ['#e8dcc4', '#d8ccb4']);
  const x0 = -1.4, x1 = 1.4, z0 = -0.8, z1 = 0.8, H = 0.8;
  m.box('stone', x0, 0, z0, x1, H, z1, stone, { skip: ['bottom', 'top'] });
  m.box('plain', x0 - 0.03, H, z0 - 0.03, x1 + 0.03, H + 0.05, z1 + 0.03, '#5a5a60', { skip: ['bottom'] });
  for (let i = 0; i < 6; i++) m.sphere('plain', -1.1 + i * 0.44, H + 0.05, 0, 0.2, 0.16, 0.2, '#6a7078', { detail: 2 });
  // The arches along the front, open between the piers.
  for (let i = 0; i <= 6; i++) m.box('stone', x0 + i * 0.4 - 0.04, 0, z1, x0 + i * 0.4 + 0.04, H * 0.8, z1 + 0.05, '#c8bca4');
  // Stalls within: a carpet on a stand and a brass lamp on a table.
  for (let i = 0; i < 3; i++) {
    const x = -0.9 + i * 0.9;
    m.box('wood', x - 0.2, 0, -0.3, x + 0.2, 0.3, 0.0, '#8a4a32', { skip: ['bottom', 'top'] });
    m.sphere('glow', x, 0.36, -0.15, 0.06, 0.06, 0.06, '#ffc860', { detail: 0 });
  }
  return { height: H + 0.1 };
}

/** A konak: a pasha's house of stone at the ground and timber above, its upper floor projecting over the street on brackets, with a bay of windows. */
export function konak(m, v) {
  const { rnd } = v;
  const timber = pickFrom(rnd, ['#8a5a3a', '#7a4a2a']);
  const x0 = -0.8, x1 = 0.8, z0 = -0.8, z1 = 0.7;
  m.box('stone', x0, 0, z0, x1, 0.6, z1, '#d8ccb4', { skip: ['bottom', 'top'] });
  m.box('wood', x0 - 0.1, 0.6, z0 - 0.1, x1 + 0.1, 1.0, z1 + 0.14, timber, { skip: ['bottom', 'top'] });
  m.box('plaster', x0, 1.0, z0, x1, 1.1, z1, '#e8dcc4', { skip: ['bottom'] });
  for (let i = 0; i < 4; i++) m.box('wood', x0 + 0.15 + i * 0.4, 0.6, z1 + 0.14, x0 + 0.22 + i * 0.4, 1.0, z1 + 0.15, '#4a2a18', { skip: ['top'] });
  m.hip('tile', x0 - 0.12, z0 - 0.12, x1 + 0.12, z1 + 0.12, 1.1, 1.4, '#7a4a32', { over: 0.04 });
  const F = faces(x0, z0, x1, z1, 0, 0.6);
  doorOn(m, F.front, 0.7, 0.24, 0.4, '#3a2a1a', { step: false });
  windowOn(m, F.front, 0.2, 0.25, 0.16, 0.18, { sill: false, frame: '#2a1a10', glow: true });
  panel(m, 'glow', faces(x0, z0, x1, z1, 1.0, 1.1).front, 0.3, 0.02, 0.9, 0.06, 0.012, '#ffc860');
  return { height: 1.4 };
}

/** The footprints these models are drawn for. */
export const ISTANBUL_FOOTPRINTS = Object.freeze({
  mosque: [3, 3], hamam: [2, 2], bazaar: [3, 2], konak: [2, 2],
});
