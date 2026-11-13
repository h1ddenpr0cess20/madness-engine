import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { palm } from '../../flora.js';
import { awning, block, grid, slabOn } from './kit.js';

/**
 * A Mexico pack: a colonial house with pink trim, iron balconies and a palm; a
 * cantina with a painted sign and a tin awning; a market hall of stalls under a
 * sheet roof; a taquería stand with its striped umbrellas; and a cathedral with
 * two bell towers and a dome, in the colonial style.
 */

const WHITE = ['#f6f6f2', '#f0ece2'];
const PINK = ['#e8a0a0', '#e8c0a0'];
const TILE = ['#8a4a32', '#a85a3c', '#6a3a2a'];

/** A colonial house: whitewash with pink trim, a tiled hip roof, and iron balconies over the windows of two floors. */
export function colonial(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, WHITE);
  const x0 = -1.2, x1 = 1.2, z0 = -1.1, z1 = 0.9, H = 0.95;
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  m.hip('tile', x0 - 0.05, z0 - 0.05, x1 + 0.05, z1 + 0.05, H, H + 0.4, pickFrom(rnd, TILE), { over: 0.1 });
  grid(m, F, 2, 0.38, { gap: 0.4, w: 0.2, h: 0.22, frame: pickFrom(rnd, PINK), v0: 0.12, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 1.2) < 0.3 });
  doorOn(m, F.front, 1.2, 0.24, 0.42, '#4a2a18', { step: false });
  slabOn(m, 'stone', F.front, 0.3, 1.5, 0.5, 0.53, 0, 0.14, pickFrom(rnd, PINK));
  slabOn(m, 'metal', F.front, 0.3, 1.5, 0.53, 0.63, 0.12, 0.14, '#2a2a2e');
  m.at(-1.0, 0, 1.1, (mm) => palm(mm, { seed: 3 }));
  return { height: H + 0.4 };
}

/** A cantina: a whitewashed corner bar with a painted sign band, a tin awning, a wooden door and a row of tables under a palm. */
export function cantina(m, v) {
  const { rnd } = v;
  const F = block(m, -0.9, -0.8, 0.9, 0.8, 0, 0.9, pickFrom(rnd, ['#e8c0a0', '#f0d0a8', '#d8e8c8']), { roof: '#7a5a3a', parapet: 0.05 });
  panel(m, 'plain', F.front, 0.1, 0.72, 1.7, 0.86, 0.012, '#d8402a');
  panel(m, 'glow', F.front, 0.2, 0.76, 1.6, 0.82, 0.03, '#ffe08a');
  awning(m, F.front, 0.05, 1.75, 0.66, '#c8a060');
  doorOn(m, F.front, 0.9, 0.24, 0.42, '#5a3a20', { step: false });
  windowOn(m, F.front, 0.35, 0.22, 0.24, 0.26, { sill: false, frame: '#3a2a1a' });
  windowOn(m, F.front, 1.5, 0.22, 0.24, 0.26, { sill: false, frame: '#3a2a1a' });
  for (const [x, z] of [[-0.4, 1.1], [0.5, 1.1]]) {
    m.cylinder('wood', x, 0, z, 0.1, 0.1, 0.3, 10, '#8a6840', { caps: true });
  }
  m.at(-0.9, 0, 1.0, (mm) => palm(mm, { seed: 5 }));
  return { height: 1.0 };
}

/** A market hall: a long open shed of posts under a sheet roof, with stalls of produce and striped cloth along its length. */
export function mercado(m, v) {
  const { rnd } = v;
  const x0 = -1.4, x1 = 1.4, z0 = -0.9, z1 = 0.9, H = 0.7;
  m.box('stone', x0 - 0.05, 0, z0 - 0.05, x1 + 0.05, 0.04, z1 + 0.05, '#c8c0a8', { skip: ['bottom'] });
  for (const x of [-1.3, -0.6, 0.1, 0.8, 1.3]) for (const z of [-0.8, 0.8]) m.box('wood', x - 0.04, 0.04, z - 0.04, x + 0.04, H, z + 0.04, '#6a4a2a', { skip: ['bottom'] });
  m.box('plain', x0, H, z0, x1, H + 0.06, z1, '#c8c4bc', { skip: ['bottom'] });
  // Stalls under the roof, each with a crate of fruit and a cloth awning.
  for (let i = 0; i < 4; i++) {
    const x = -1.1 + i * 0.7;
    m.box('wood', x, 0.04, -0.6, x + 0.5, 0.3, -0.35, '#8a6840', { skip: ['bottom', 'top'] });
    for (let k = 0; k < 4; k++) m.sphere('plain', x + 0.1 + (k % 2) * 0.2, 0.36, -0.46 + (k < 2 ? 0 : 0.06), 0.06, 0.05, 0.06, pickFrom(rnd, ['#e8a030', '#d8402a', '#7ab050']), { detail: 0 });
    m.cone('cloth', x + 0.25, 0.5, -0.3, 0.3, 0.6, 8, pickFrom(rnd, ['#d8402a', '#2a6ab0', '#f4c040']));
  }
  return { height: H + 0.1 };
}

/** A taquería: a stand of tiled counter and a striped umbrella, with a grill of coals under the sign and two stools. */
export function taqueria(m, v) {
  const { rnd } = v;
  m.box('stone', -0.6, 0, -0.5, 0.6, 0.02, 0.5, '#c8c4bc', { skip: ['bottom'] });
  m.box('plaster', -0.5, 0.02, -0.4, 0.5, 0.5, 0.2, '#e8e0d0', { skip: ['bottom', 'top'] });
  m.box('plain', -0.52, 0.5, -0.42, 0.52, 0.54, 0.22, pickFrom(rnd, ['#2a6a9a', '#d8402a', '#e8b83a']), { skip: ['bottom'] });
  m.box('metal', -0.45, 0.54, -0.35, 0.45, 0.56, -0.25, '#2a2a2e', { skip: ['bottom'] });
  for (const x of [-0.3, 0.3]) m.sphere('glow', x, 0.6, -0.3, 0.05, 0.04, 0.05, '#ff6a2a', { detail: 0 });
  m.cylinder('metal', 0.5, 0, 0.3, 0.01, 0.012, 1.2, 5, '#c8ccd0', { caps: false });
  m.cone('cloth', 0.5, 1.1, 0.3, 0.4, 1.3, 8, pickFrom(rnd, ['#d8402a', '#2a6ab0', '#f4c040']));
  for (const [x, z] of [[-0.4, 0.75], [0.4, 0.75]]) m.cylinder('wood', x, 0, z, 0.08, 0.08, 0.4, 8, '#8a6840', { caps: true });
  return { height: 1.4 };
}

/** A cathedral: a white colonial church with two bell towers of arched openings and a tiled dome over the crossing, and a stone atrium before it. */
export function cathedral(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, WHITE);
  const x0 = -1.0, x1 = 1.0, z0 = -1.5, z1 = 0.8, H = 1.1;
  const F = block(m, x0, z0, x1, z1, 0, H, wall, { roof: '#6a6a70', parapet: 0.06 });
  // The dome over the crossing, tiled and ribbed.
  m.sphere('plain', 0, H, -0.4, 0.42, 0.36, 0.42, pickFrom(rnd, ['#2a6a9a', '#3a8a7a']), { detail: 2 });
  for (const tx of [-0.7, 0.7]) {
    const TH = 2.0;
    m.box('plaster', tx - 0.2, 0, z1 - 0.1, tx + 0.2, TH, z1 + 0.25, wall, { skip: ['bottom', 'top'] });
    const TF = faces(tx - 0.2, z1 - 0.1, tx + 0.2, z1 + 0.25, 0, TH).front;
    for (const v0 of [1.3, 1.7]) panel(m, 'plain', TF, 0.14, v0, 0.26, v0 + 0.24, 0.006, '#2a1a10');
    m.box('plain', tx - 0.22, TH, z1 - 0.12, tx + 0.22, TH + 0.05, z1 + 0.28, '#6a6a70', { skip: ['bottom'] });
    m.cone('plain', tx, TH + 0.05, z1 + 0.08, 0.16, TH + 0.45, 8, pickFrom(rnd, ['#2a6a9a', '#3a8a7a']));
  }
  grid(m, F, 2, 0.4, { gap: 0.36, w: 0.2, h: 0.24, frame: '#5a4a3a', v0: 0.12, skip: (name, u) => name === 'front' && Math.abs(u - 1.0) < 0.3 });
  doorOn(m, F.front, 1.0, 0.3, 0.46, '#5a3a20', { step: false });
  return { height: H + 0.1 };
}

/** The footprints these models are drawn for. */
export const MEXICO_FOOTPRINTS = Object.freeze({
  colonial: [3, 3], cantina: [2, 2], mercado: [3, 2], taqueria: [2, 2], cathedral: [3, 4],
});
