import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { awning, block, grid, slabOn, sheet } from './kit.js';

/**
 * A Paris pack: an apartment block under its mansard, a brasserie on a corner
 * with tables on the pavement, a boulangerie with a striped awning, a Gothic
 * church with twin towers and a rose, and a Guimard metro entrance in green iron.
 */

const CREAM = ['#eadfc4', '#f0e6d0', '#e4d6b8'];
const ZINC = '#6a7078';

/** An apartment block under its mansard: cream stone, a zinc roof sloping up from the cornice, and iron balconies. */
export function haussmann(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CREAM);
  const x0 = -0.85, x1 = 0.85, z0 = -1.3, z1 = 1.3, H = 1.05, top = H + 0.5, ins = 0.25;
  const F = block(m, x0, z0, x1, z1, 0, H, wall, { roof: ZINC, cornice: '#d8d0bc' });
  sheet(m, 'plain', [x0, H, z1], [x1, H, z1], [x1 - ins, top, z1 - ins], [x0 + ins, top, z1 - ins], ZINC);
  sheet(m, 'plain', [x1, H, z1], [x1, H, z0], [x1 - ins, top, z0 + ins], [x1 - ins, top, z1 - ins], ZINC);
  sheet(m, 'plain', [x1, H, z0], [x0, H, z0], [x0 + ins, top, z0 + ins], [x1 - ins, top, z0 + ins], ZINC);
  sheet(m, 'plain', [x0, H, z0], [x0, H, z1], [x0 + ins, top, z1 - ins], [x0 + ins, top, z0 + ins], ZINC);
  sheet(m, 'plain', [x0 + ins, top, z1 - ins], [x1 - ins, top, z1 - ins], [x1 - ins, top, z0 + ins], [x0 + ins, top, z0 + ins], ZINC);
  grid(m, F, 4, 0.24, { gap: 0.38, w: 0.18, h: 0.2, frame: '#3a3a40', v0: 0.1, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 0.9) < 0.3 });
  doorOn(m, F.front, 0.9, 0.22, 0.38, '#3a2a1a', { step: false });
  for (const [u0, u1] of [[0.2, 0.6], [1.2, 1.6]]) {
    slabOn(m, 'stone', F.front, u0, u1, 0.3, 0.33, 0, 0.12, CREAM[0]);
    slabOn(m, 'metal', F.front, u0, u1, 0.33, 0.45, 0.1, 0.12, '#2a2a2e');
  }
  return { height: top };
}

/** A brasserie on a corner: a long glass front with a lit interior, a green awning, and round tables with parasols on the pavement. */
export function brasserie(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CREAM);
  const F = block(m, -0.9, -0.9, 0.9, 0.9, 0, 1.2, wall, { roof: ZINC, cornice: '#d8d0bc' });
  panel(m, 'glass', F.front, 0.08, 0.1, 1.72, 0.6, 0.006, '#2e4e66');
  panel(m, 'glow', F.front, 0.12, 0.14, 1.68, 0.56, 0.011, '#ffcf8a');
  awning(m, F.front, 0.02, 1.78, 0.66, '#2a6a4a');
  panel(m, 'plain', F.front, 0.1, 0.8, 1.7, 0.9, 0.012, '#2a2420');
  panel(m, 'glow', F.front, 0.2, 0.82, 1.6, 0.88, 0.03, '#ffd84a');
  grid(m, { left: F.left, right: F.right }, 1, 0.3, { gap: 0.36, w: 0.2, h: 0.22, frame: '#3a3a40', v0: 0.6 });
  for (const [x, z] of [[-0.45, 1.25], [0.45, 1.25]]) {
    m.cylinder('metal', x, 0, z, 0.012, 0.012, 0.6, 5, '#2a2a2e', { caps: false });
    m.cone('cloth', x, 0.6, z, 0.2, 0.7, 8, pickFrom(rnd, ['#f4f4f0', '#2a6a4a', '#d8402a']));
    m.cylinder('plain', x, 0, z, 0.1, 0.1, 0.02, 10, '#f0f0f0', { caps: true });
  }
  return { height: 1.4 };
}

/** A boulangerie: a bakery front with a striped awning, a window of loaves in gold, and a painted sign over the door. */
export function boulangerie(m, v) {
  const { rnd } = v;
  const F = block(m, -0.85, -0.85, 0.85, 0.85, 0, 1.0, pickFrom(rnd, CREAM), { roof: ZINC, cornice: '#d8d0bc' });
  for (let i = 0; i < 6; i++) awning(m, F.front, -0.85 + 0.02 + i * 0.28, -0.85 + 0.28 + i * 0.28, 0.6, i % 2 ? '#f4f4f0' : '#2a4a8a');
  panel(m, 'glass', F.front, 0.1, 0.1, 1.6, 0.46, 0.006, '#2e4e66');
  panel(m, 'glow', F.front, 0.14, 0.14, 1.56, 0.42, 0.011, '#ffcf6a');
  panel(m, 'plain', F.front, 0.2, 0.7, 1.5, 0.8, 0.012, '#2a2420');
  panel(m, 'glow', F.front, 0.3, 0.72, 1.4, 0.78, 0.03, '#ffd84a');
  for (const u of [0.45, 0.85, 1.25]) {
    for (const k of [0, 1]) m.sphere('plaster', -0.85 + u + k * 0.07 - 0.035, 0.2, 0.9 + 0.03, 0.05, 0.035, 0.035, '#c8903a', { detail: 0 });
  }
  return { height: 1.1 };
}

/** A Gothic church: a stone nave with lancet windows, two western towers with pointed spires, a rose window and buttresses along the flank. */
export function gothicchurch(m, v) {
  const { rnd } = v;
  const stone = pickFrom(rnd, ['#b8b0a0', '#a8a090', '#c8c0b0']);
  const x0 = -0.9, x1 = 0.9, z0 = -1.6, z1 = 0.9, H = 1.0;
  const F = block(m, x0, z0, x1, z1, 0, H, stone, { roof: '#4a4a50' });
  for (let i = 0; i < 5; i++) {
    const z = z0 + 0.4 + i * 0.4;
    m.box('stone', x1, 0, z - 0.04, x1 + 0.1, 0.72, z + 0.04, stone, { skip: ['top'] });
  }
  for (const u of [0.5, 0.8, 1.1, 1.4]) windowOn(m, F.right, 0.4 + u - 0.5, 0.2, 0.14, 0.4, { sill: false, frame: '#5a4a3a' });
  // The towers at the front, each with lancets, and a pointed spire.
  for (const tx of [-0.52, 0.52]) {
    const TH = 2.0;
    m.box('stone', tx - 0.2, 0, z1 - 0.1, tx + 0.2, TH, z1 + 0.3, stone, { skip: ['bottom', 'top'] });
    const TF = faces(tx - 0.2, z1 - 0.1, tx + 0.2, z1 + 0.3, 0, TH).front;
    windowOn(m, TF, 0.2, 1.1, 0.12, 0.34, { sill: false, frame: '#3a3a40' });
    windowOn(m, TF, 0.2, 1.6, 0.12, 0.3, { sill: false, frame: '#3a3a40' });
    windowOn(m, TF, 0.2, 1.4 + 0.2 - 0.2, 0.12, 0.1, { sill: false, frame: '#3a3a40' });
    m.cone('slate', tx, TH, z1 + 0.1, 0.22, TH + 1.0, 4, '#4a4a50');
  }
  // The rose over the nave's front, a glass disc in a stone ring.
  panel(m, 'glass', F.front, 0.7, 0.4, 1.1, 0.8, 0.006, '#3a5a72');
  panel(m, 'glow', F.front, 0.76, 0.46, 1.04, 0.74, 0.011, '#ffd88a');
  return { height: H + 1.0 };
}

/** A Guimard metro entrance: a green iron arch over the stairs down, a lit sign, and a pair of lamps. */
export function metrostation(m) {
  const iron = '#2e4a3e';
  m.box('stone', -0.5, 0, -0.45, 0.5, 0.02, 0.45, '#c8c4bc', { skip: ['bottom'] });
  m.box('plain', -0.3, 0.02, -0.4, 0.3, 0.024, -0.3, '#2a2a2e', { skip: ['bottom'] });
  // The arch: a curve of iron across the front, over the stairs.
  const pt = (a) => [-0.35 * Math.cos(a), 0.45 + 0.35 * Math.sin(a), 0.1];
  for (let k = 0; k < 8; k++) {
    m.beam('metal', pt((k / 8) * Math.PI), pt(((k + 1) / 8) * Math.PI), 0.02, iron);
    m.beam('metal', [pt((k / 8) * Math.PI)[0], pt((k / 8) * Math.PI)[1], -0.1], [pt(((k + 1) / 8) * Math.PI)[0], pt(((k + 1) / 8) * Math.PI)[1], -0.1], 0.02, iron);
  }
  m.box('metal', 0.33, 0, 0.08, 0.37, 0.45, 0.12, iron, { skip: ['bottom'] });
  m.box('metal', -0.37, 0, 0.08, -0.33, 0.45, 0.12, iron, { skip: ['bottom'] });
  m.box('glow', -0.12, 0.84, 0.1, 0.12, 0.92, 0.12, '#ffd84a', { skip: ['back'] });
  return { height: 0.95 };
}

/** The footprints these models are drawn for. */
export const PARIS_FOOTPRINTS = Object.freeze({
  haussmann: [2, 3], brasserie: [2, 2], boulangerie: [2, 2], gothicchurch: [3, 4], metrostation: [1, 1],
});
