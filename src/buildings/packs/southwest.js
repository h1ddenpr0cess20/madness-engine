import { barrel, doorOn, faces, panel, pickFrom, windowOn } from '../common.js';
import { cypress, palm } from '../../flora.js';
import { block, grid } from './kit.js';

/**
 * A Southwest pack: a pueblo of adobe terraces stepped up the mesa, an adobe
 * mission church with its bell towers, a trading post with a false front and a
 * porch, a western saloon with swinging doors, a Navajo hogan of logs and earth,
 * and a cliff dwelling of sandstone set into the rock.
 */

const SW = {
  adobe: ['#c8a878', '#d4b488', '#bf9c6c', '#c09070'],
  sandstone: ['#c87a4a', '#b86a3c', '#d88a5a', '#a85a3a'],
  wood: ['#8a6840', '#7a5a38', '#9a7648'],
  timber: '#5a4026',
  dark: '#2a2420',
  turquoise: '#3a9a9a',
  trim: '#f4efe6',
  roof: '#8a7a64',
};

/** A pueblo: adobe rooms stepping back up the mesa in terraces, each with a ladder to the roof, and a turquoise door on the ground. */
export function pueblo(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, SW.adobe);
  const tiers = [[1.4, 0, 0.6], [1.0, 0.6, 1.15], [0.6, 1.15, 1.6]];
  for (const [hw, y0, y1] of tiers) {
    const F = block(m, -hw, -hw, hw, hw, y0, y1, wall, { roof: SW.roof, parapet: 0.03 });
    grid(m, F, Math.max(1, Math.floor((y1 - y0 - 0.1) / 0.3)), 0.3, {
      gap: 0.34, w: 0.16, h: 0.18, frame: SW.timber, v0: 0.12,
      skip: (name, u) => y0 === 0 && name === 'front' && Math.abs(u - 0.9) < 0.3,
    });
  }
  const F0 = faces(-1.4, -1.4, 1.4, 1.4, 0, 0.6);
  doorOn(m, F0.front, 0.9, 0.22, 0.36, SW.turquoise, { step: false });
  m.box('wood', 0.2, 0.6, 1.4, 0.24, 1.0, 1.5, SW.timber);
  m.box('wood', 0.1, 1.0, 1.4, 0.14, 1.4, 1.5, SW.timber);
  return { height: 1.6 };
}

/** An adobe mission church: a nave of thick walls, two bell towers with open bell niches, buttresses along the side and a cross. */
export function adobechurch(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, SW.adobe);
  const x0 = -0.8, x1 = 0.8, z0 = -1.2, z1 = 0.8, H = 0.9;
  m.box('plaster', x0, 0, z0, x1, H, z1, wall, { skip: ['bottom', 'top'] });
  m.box('plain', x0, H - 0.001, z0, x1, H, z1, SW.roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  const F = faces(x0, z0, x1, z1, 0, H);
  grid(m, { left: F.left, right: F.right }, 1, 0.4, { gap: 0.36, w: 0.18, h: 0.22, frame: SW.timber, v0: 0.28 });
  for (const tx of [-0.52, 0.52]) {
    const TH = 1.7;
    m.box('plaster', tx - 0.2, 0, z1 - 0.1, tx + 0.2, TH, z1 + 0.25, wall, { skip: ['bottom', 'top'] });
    const TF = faces(tx - 0.2, z1 - 0.1, tx + 0.2, z1 + 0.25, 0, TH).front;
    panel(m, 'plain', TF, 0.14, 1.25, 0.26, 1.55, 0.006, SW.dark);
    m.box('plain', tx - 0.22, TH, z1 - 0.12, tx + 0.22, TH + 0.04, z1 + 0.27, SW.roof, { skip: ['bottom'] });
  }
  for (let i = 0; i < 3; i++) m.box('plaster', x1, 0, -0.9 + i * 0.6, x1 + 0.12, H * 0.7, -0.7 + i * 0.6, wall, { skip: ['top'] });
  m.box('wood', -0.03, H + 0.25, z0 + 0.1, 0.03, H + 0.7, z0 + 0.12, SW.timber);
  m.box('wood', -0.12, H + 0.5, z0 + 0.1, 0.12, H + 0.54, z0 + 0.12, SW.timber);
  return { height: H + 0.7 };
}

/** A trading post: adobe with a false front of boards over a flat roof, a long porch on posts and a barrel by the steps. */
export function tradingpost(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, SW.adobe);
  const x0 = -1.2, x1 = 1.2, z0 = -0.7, z1 = 0.6, H = 0.8;
  const F = block(m, x0, z0, x1, z1, 0, H, wall, { roof: SW.roof });
  m.box('wood', -0.5, H, z0 + 0.2, 0.5, H + 0.4, z0 + 0.24, pickFrom(rnd, SW.wood));
  m.box('plain', -0.4, H + 0.12, z0 + 0.22, 0.4, H + 0.3, z0 + 0.26, SW.trim);
  grid(m, F, 1, 0.4, { gap: 0.4, w: 0.22, h: 0.22, frame: SW.timber, v0: 0.28, skip: (name, u) => name === 'front' && Math.abs(u - 1.2) < 0.3 });
  doorOn(m, F.front, 1.2, 0.22, 0.4, SW.timber, { step: false });
  for (const x of [-1.1, -0.4, 0.3, 1.0]) m.box('wood', x - 0.03, 0, z1 + 0.14, x + 0.03, 0.52, z1 + 0.17, SW.timber);
  m.box('wood', x0 + 0.05, 0.52, z1, x1 - 0.05, 0.56, z1 + 0.2, pickFrom(rnd, SW.wood));
  barrel(m, -0.9, 0, 0.9);
  return { height: H + 0.4 };
}

/** A western saloon: a false front of tall boards with a sign band, swinging doors, a boardwalk, and a hitching rail out front. */
export function saloon(m, v) {
  const { rnd } = v;
  const wood = pickFrom(rnd, SW.wood);
  const x0 = -0.8, x1 = 0.8, z0 = -1.2, z1 = 0.8, H = 0.85;
  m.box('wood', x0, 0, z0, x1, H, z1, wood, { skip: ['bottom', 'top'] });
  m.box('wood', x0, H, z0, x1, H + 0.6, z0 + 0.1, wood);
  m.box('plain', x0 + 0.1, H + 0.42, z0 + 0.08, x1 - 0.1, H + 0.5, z0 + 0.14, SW.trim);
  m.box('plain', x0, H - 0.001, z0 + 0.1, x1, H, z1, SW.roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  const F = faces(x0, z0, x1, z1, 0, H);
  grid(m, { left: F.left, right: F.right }, 1, 0.4, { gap: 0.4, w: 0.22, h: 0.26, frame: SW.timber, v0: 0.32 });
  for (const [u0, u1] of [[0.22, 0.43], [0.45, 0.66]]) panel(m, 'wood', F.front, u0, 0, u1, 0.46, 0.02, pickFrom(rnd, SW.wood));
  panel(m, 'glow', F.front, 0.08, 0.48, 0.6, 0.58, 0.012, '#ffc860');
  panel(m, 'glow', F.front, 0.66, 0.48, 1.12, 0.58, 0.012, '#ffc860');
  m.box('wood', x0 - 0.1, 0, z1, x1 + 0.1, 0.14, z1 + 0.5, SW.wood[0], { skip: ['bottom'] });
  m.box('wood', -0.7, 0.14, z1 + 0.7, 0.7, 0.2, z1 + 0.74, SW.timber);
  for (const x of [-0.7, 0.7]) m.box('wood', x - 0.04, 0, z1 + 0.68, x + 0.04, 0.4, z1 + 0.76, SW.timber, { skip: ['top'] });
  return { height: H + 0.6 };
}

/** A Navajo hogan: a round dwelling of logs and earth, its low wall rising to a domed roof, with its door to the east. */
export function hogan(m, v) {
  const { rnd } = v;
  const earth = pickFrom(rnd, ['#8a6a4a', '#9a7a5a', '#7a5a3a']);
  m.cylinder('plaster', 0, 0, 0, 0.8, 0.8, 0.5, 16, earth, { caps: false });
  m.cone('wood', 0, 0.5, 0, 0.8, 0.95, 16, SW.wood[0]);
  m.cylinder('wood', 0, 0.5, 0, 0.82, 0.82, 0.04, 16, SW.timber, { caps: false });
  doorOn(m, faces(-0.8, -0.8, 0.8, 0.8, 0, 0.5).right, 0.8, 0.2, 0.36, SW.timber, { step: false });
  return { height: 0.95 };
}

/** A cliff dwelling: sandstone rooms built into a rock face, with dark doorways and windows, a juniper and a palm on the ledge. */
export function cliffdwelling(m, v) {
  const { rnd } = v;
  const stone = pickFrom(rnd, SW.sandstone);
  m.rock('stone', 0, -0.2, -0.3, 1.1, 0.8, 0.7, stone, { detail: 1, seed: 11 });
  for (const [x0, y0, x1, y1] of [[-0.8, 0.5, -0.1, 0.95], [0.0, 0.7, 0.7, 1.15]]) {
    m.box('plaster', x0, y0, -0.5, x1, y1, 0.2, stone, { skip: ['bottom'] });
    const F = faces(x0, -0.5, x1, 0.2, y0, y1).front;
    panel(m, 'plain', F, (x1 - x0) * 0.3, 0.05, (x1 - x0) * 0.5, 0.25, 0.012, SW.dark);
    windowOn(m, F, (x1 - x0) * 0.8, (y1 - y0) * 0.55, 0.14, 0.14, { sill: false, frame: SW.dark });
  }
  m.cylinder('plaster', 0.85, 0, 0.25, 0.1, 0.08, 0.6, 8, stone, { caps: false });
  m.at(-1.1, 0, 0.9, (mm) => cypress(mm, { seed: 4 }));
  m.at(1.0, 0, 0.9, (mm) => palm(mm, { seed: 6 }));
  return { height: 1.2 };
}

/** The footprints these models are drawn for. */
export const SOUTHWEST_FOOTPRINTS = Object.freeze({
  pueblo: [3, 3], adobechurch: [2, 3], tradingpost: [3, 2], saloon: [2, 3], hogan: [2, 2], cliffdwelling: [2, 2],
});
