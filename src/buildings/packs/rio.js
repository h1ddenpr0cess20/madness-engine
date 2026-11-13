import { doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { palm } from '../../flora.js';
import { block, grid } from './kit.js';

/**
 * A Rio pack: a favela of brick and tin shacks crowded up a slope, a beach
 * kiosk with a cloth awning and a counter of coconuts, and a pousada of bright
 * colonial walls with green shutters and a palm court.
 */

const SHACK = ['#9a4a32', '#8a3f2a', '#b8a888', '#8a7a64'];

/** A favela: shacks of brick and board crowded up a slope, each under a sheet of tin, with a barrel of water by the door. */
export function favela(m, v) {
  const { rnd } = v;
  const shacks = [[-0.9, -0.9, -0.1, -0.1, 0.6], [0.1, -0.9, 0.9, -0.1, 0.8], [-0.9, 0.1, -0.1, 0.9, 0.5], [0.1, 0.1, 0.9, 0.9, 0.9]];
  for (const [x0, z0, x1, z1, h] of shacks) {
    m.box('plaster', x0, 0, z0, x1, h, z1, pickFrom(rnd, SHACK), { skip: ['bottom', 'top'] });
    m.box('metal', x0 - 0.03, h, z0 - 0.03, x1 + 0.03, h + 0.05, z1 + 0.03, '#8a8e94', { skip: ['bottom'] });
    const F = faces(x0, z0, x1, z1, 0, h);
    windowOn(m, F.front, (x1 - x0) * 0.3, h * 0.45, 0.16, 0.18, { sill: false, frame: '#2a2a2e' });
    doorOn(m, F.front, (x1 - x0) * 0.72, 0.16, 0.34, '#4a3a2a', { step: false });
  }
  m.cylinder('plain', -0.5, 0, 0.95, 0.12, 0.12, 0.3, 10, '#2a6a9a', { caps: true });
  return { height: 1.0 };
}

/** A beach kiosk: a plank counter under a striped cloth awning, with a stack of coconuts and a cooler of drinks. */
export function quiosque(m, v) {
  const { rnd } = v;
  m.box('wood', -0.7, 0, -0.45, 0.7, 0.04, 0.45, '#c8a878', { skip: ['bottom'] });
  for (const x of [-0.6, 0.6]) m.box('wood', x - 0.04, 0.04, -0.4, x + 0.04, 0.8, -0.32, '#8a6840', { skip: ['bottom'] });
  m.box('wood', -0.7, 0.7, 0.3, 0.7, 0.78, 0.5, '#a88050');
  m.box('plaster', -0.75, 0.04, 0.4, 0.75, 0.5, 0.55, pickFrom(rnd, ['#f6f6f2', '#2a6a9a']), { skip: ['bottom', 'top'] });
  for (let i = 0; i < 5; i++) m.sphere('hedge', -0.5 + i * 0.22, 0.56, 0.45, 0.08, 0.08, 0.08, '#6a8a30', { detail: 0 });
  // The awning: a cone of cloth, striped in two colours.
  m.cone('cloth', -0.4, 0.9, -0.1, 0.8, 1.0, 8, pickFrom(rnd, ['#f4c040', '#d8402a', '#2a8a9a']));
  return { height: 1.0 };
}

/** A pousada: a bright colonial inn of two storeys, walls of yellow or pink with green shutters, a tiled roof and a palm court before it. */
export function pousada(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#f4d060', '#e8a0a0', '#8ad0b0', '#f0b080']);
  const x0 = -1.0, x1 = 1.0, z0 = -0.8, z1 = 0.8, H = 1.1;
  const F = block(m, x0, z0, x1, z1, 0, H, wall, { roof: '#a84e34' });
  m.hip('tile', x0 - 0.1, z0 - 0.1, x1 + 0.1, z1 + 0.1, H, H + 0.4, '#a84e34', { over: 0.08 });
  grid(m, F, 2, 0.42, { gap: 0.4, w: 0.2, h: 0.24, frame: '#2a8a5a', v0: 0.14, skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - 1.0) < 0.3 });
  doorOn(m, F.front, 1.0, 0.24, 0.4, '#2a6a4a', { step: false });
  panel(m, 'plain', F.front, 0.1, 0.84, 1.8, 0.92, 0.012, '#2a8a5a');
  m.at(-1.2, 0, 1.0, (mm) => palm(mm, { seed: 5 }));
  m.at(1.2, 0, 1.0, (mm) => palm(mm, { seed: 9 }));
  return { height: H + 0.4 };
}

/** The footprints these models are drawn for. */
export const RIO_FOOTPRINTS = Object.freeze({
  favela: [2, 2], quiosque: [2, 1], pousada: [2, 2],
});
