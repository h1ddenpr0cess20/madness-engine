import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { block, grid } from './kit.js';

/**
 * A Greek pack: whitewashed island houses stepped up a hill with blue doors, a
 * taverna with its vine-shaded terrace, a windmill with its white sails and
 * stone tower, and a chapel with a blue dome.
 */

const WHITE = ['#f6f6f2', '#f0ece2'];
const BLUE = ['#2a5aa8', '#3a7ac0'];

/** A whitewashed island house: cubes stepped up a hill, blue doors and shutters, and a blue-domed chapel on the top. */
export function greekvillage(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, WHITE);
  const F = block(m, -0.8, -0.7, 0.8, 0.6, 0, 0.7, wall, { roof: '#e8e4da' });
  doorOn(m, F.front, 0.4, 0.2, 0.36, BLUE[0], { step: false });
  windowOn(m, F.front, 1.1, 0.3, 0.2, 0.2, { sill: false, frame: BLUE[0] });
  const G = block(m, -0.1, -0.7, 0.6, -0.1, 0.7, 1.0, wall, { roof: '#e8e4da' });
  windowOn(m, G.front, 0.3, 0.2, 0.16, 0.2, { sill: false, frame: BLUE[0] });
  m.box('plaster', 0.2, 1.0, -0.6, 0.6, 1.3, -0.2, wall, { skip: ['bottom', 'top'] });
  m.sphere('glass', 0.4, 1.3, -0.4, 0.2, 0.2, 0.2, BLUE[1], { detail: 2 });
  m.cylinder('metal', 0.4, 1.5, -0.4, 0.008, 0.008, 0.2, 4, '#e8e8e8', { caps: false });
  return { height: 1.5 };
}

/** A taverna: a whitewashed house with blue shutters, a pergola of vines over the terrace, and tables with blue cloths. */
export function taverna(m, v) {
  const { rnd } = v;
  const F = block(m, -0.9, -0.7, 0.9, 0.6, 0, 0.8, pickFrom(rnd, WHITE), { roof: '#e8e4da' });
  doorOn(m, F.front, 1.2, 0.22, 0.4, BLUE[0], { step: false });
  windowOn(m, F.front, 0.4, 0.3, 0.2, 0.22, { sill: false, frame: BLUE[0] });
  panel(m, 'plain', F.front, 0.1, 0.84, 1.1, 0.92, 0.012, BLUE[0]);
  // The terrace: posts of stone, a pergola of timber and green vine across it.
  for (const x of [-0.8, -0.2, 0.4]) m.box('stone', x - 0.04, 0, 0.7, x + 0.04, 0.6, 0.76, '#e8e0d0', { skip: ['top'] });
  m.box('wood', -0.9, 0.6, 0.66, 0.5, 0.64, 1.15, '#8a6840', { skip: ['bottom'] });
  for (let i = 0; i < 4; i++) m.sphere('hedge', -0.8 + i * 0.35, 0.68, 0.95, 0.18, 0.08, 0.2, '#5a9a40', { detail: 1 });
  for (const x of [-0.5, 0.2]) {
    m.cylinder('plain', x, 0, 0.95, 0.14, 0.14, 0.03, 12, BLUE[0], { caps: true });
    m.cylinder('metal', x, 0.03, 0.95, 0.01, 0.012, 0.36, 5, '#2a2a2e', { caps: false });
  }
  return { height: 1.0 };
}

/** A windmill on the hill: a round white tower of stone tapering to a cap, with four white sails on a cross and a shuttered window. */
export function windmill(m, v) {
  const { rnd } = v;
  const white = pickFrom(rnd, WHITE);
  m.cylinder('plaster', 0, 0, 0, 0.42, 0.5, 1.3, 16, white, { caps: false });
  m.cylinder('plain', 0, 0.92, 0, 0.44, 0.42, 0.08, 16, '#c8402a', { caps: false });
  m.cone('wood', 0, 1.3, 0, 0.44, 1.65, 16, '#8a6840');
  windowOn(m, faces(-0.46, -0.46, 0.46, 0.46, 0, 1.3).front, 0, 0.6, 0.14, 0.2, { sill: false, frame: BLUE[0] });
  doorOn(m, faces(-0.46, -0.46, 0.46, 0.46, 0, 1.3).front, 0, 0.18, 0.34, BLUE[0], { step: false });
  // The hub and the four sails, each a lattice of timber under a white cloth.
  const hub = [0, 1.45, 0.5];
  m.cylinder('wood', hub[0], hub[1], hub[2], 0.05, 0.05, 0.12, 8, '#8a6840', { caps: true });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.2;
    const dx = Math.cos(a), dy = Math.sin(a);
    m.beam('wood', [hub[0], hub[1], hub[2] + 0.06], [hub[0] + dx * 0.95, hub[1] + dy * 0.95, hub[2] + 0.06], 0.025, '#8a6840');
    m.quad('cloth', [hub[0] + dx * 0.12, hub[1] + dy * 0.12, hub[2] + 0.07], [hub[0] + dx * 0.95 - dy * 0.14, hub[1] + dy * 0.95 + dx * 0.14, hub[2] + 0.07], [hub[0] + dx * 0.95 + dy * 0.14, hub[1] + dy * 0.95 - dx * 0.14, hub[2] + 0.07], [hub[0] + dx * 0.12 + dy * 0.0, hub[1] + dy * 0.12, hub[2] + 0.07], '#f4f4f0');
  }
  return { height: 1.75 };
}

/** A chapel of the islands: white walls, a small blue dome on a drum, a bell in an arch, and a cross at the top. */
export function greekchapel(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, WHITE);
  const F = block(m, -0.5, -0.4, 0.5, 0.4, 0, 0.8, wall, { roof: '#e8e4da' });
  doorOn(m, F.front, 0.5, 0.2, 0.38, BLUE[0], { step: false });
  m.box('plaster', -0.15, 0.8, -0.15, 0.15, 1.1, 0.15, wall, { skip: ['bottom', 'top'] });
  m.cylinder('plaster', 0, 1.1, 0, 0.19, 0.19, 0.12, 12, wall, { caps: false });
  m.sphere('glass', 0, 1.22, 0, 0.16, 0.14, 0.16, BLUE[1], { detail: 2 });
  m.box('metal', -0.01, 1.4, -0.01, 0.01, 1.62, 0.01, '#e8e8e8');
  m.box('metal', -0.06, 1.5, -0.01, 0.06, 1.53, 0.01, '#e8e8e8');
  panel(m, 'plain', faces(-0.15, -0.15, 0.15, 0.15, 0.8, 1.1).front, 0.06, 0.1, 0.18, 0.2, 0.012, '#4a3a2a');
  return { height: 1.65 };
}

/** The footprints these models are drawn for. */
export const GREECE_FOOTPRINTS = Object.freeze({
  greekvillage: [2, 2], taverna: [2, 2], windmill: [2, 2], greekchapel: [2, 2],
});
