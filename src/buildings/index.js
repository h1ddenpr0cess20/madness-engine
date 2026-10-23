import { Mesher } from '../mesher.js';
import { PALETTE, barrel, crate, drawTimber, logPile, pickFrom, rngFor } from './common.js';
import * as castle from './castle.js';
import * as civic from './civic.js';
import * as farm from './farm.js';
import * as homes from './homes.js';
import * as works from './works.js';

export { castleScaffold } from './castle.js';

/**
 * The buildings of a medieval town, drawn from boxes, beams and rocks: the
 * homes, the farm and the works, the civic buildings and the castle. Every
 * model is a function that draws into a `Mesher` in its own frame (front toward
 * +z, middle at the origin, standing on y = 0) and answers `{ smoke, anim, ... }`:
 * where its chimneys smoke, and any part that moves by itself.
 *
 *     const { modelFor } = createBuildings();
 *     const { parts, smoke } = modelFor('cottage', { variant: 2 });
 *     batch.stamp(parts, x, y, z, yaw);   // a Batch from `madness-engine/mesher`
 *
 * `modelFor` also draws a building going up (`building: true`, `progress`
 * from 0 to 1): a footing, walls that rise, scaffolding and stacked materials.
 */

export const MODELS = { ...homes, ...farm, ...works, ...civic, castle: castle.castle };

/** The footprint each model is drawn for: [width along the street, depth] in tiles. */
export const FOOTPRINTS = Object.freeze({
  cottage: [2, 2], house: [2, 2], townhouse: [2, 3], stall: [2, 1], shop: [2, 2], merchant: [2, 2],
  farmstead: [3, 3], fishery: [2, 3], hunter: [2, 2], granary: [3, 3], mill: [3, 3], brewery: [2, 3],
  woodcutter: [2, 2], forester: [2, 2], quarry: [3, 3], ironmine: [3, 3], storehouse: [3, 3], smithy: [2, 3], weaver: [2, 3],
  well: [1, 1], green: [3, 3], tavern: [3, 3], chapel: [3, 4], healer: [2, 2], market: [3, 3],
  watchtower: [2, 2], barracks: [4, 3], gatehouse: [2, 2], cathedral: [5, 7], castle: [6, 6],
});

/** A frame of scaffolding round a rectangle: poles, ledgers and a plank platform. */
function scaffold(m, x0, z0, x1, z1, h) {
  const poles = [];
  const nx = Math.max(1, Math.round((x1 - x0) / 0.7)), nz = Math.max(1, Math.round((z1 - z0) / 0.7));
  for (let i = 0; i <= nx; i++) { poles.push([x0 + ((x1 - x0) * i) / nx, z0], [x0 + ((x1 - x0) * i) / nx, z1]); }
  for (let i = 1; i < nz; i++) { poles.push([x0, z0 + ((z1 - z0) * i) / nz], [x1, z0 + ((z1 - z0) * i) / nz]); }
  for (const [x, z] of poles) m.box('wood', x - 0.02, 0, z - 0.02, x + 0.02, h, z + 0.02, PALETTE.wood[1], { skip: ['bottom'], uvScale: 2 });
  for (const y of [h * 0.45, h * 0.9]) {
    m.beam('wood', [x0, y, z0], [x1, y, z0], 0.028, PALETTE.wood[0]);
    m.beam('wood', [x0, y, z1], [x1, y, z1], 0.028, PALETTE.wood[0]);
    m.beam('wood', [x0, y, z0], [x0, y, z1], 0.028, PALETTE.wood[0]);
    m.beam('wood', [x1, y, z0], [x1, y, z1], 0.028, PALETTE.wood[0]);
  }
  m.beam('wood', [x0, 0.04, z1], [x1, h * 0.9, z1], 0.022, PALETTE.wood[2]);
  m.box('wood', x0 - 0.06, h * 0.45 - 0.02, z1, x1 + 0.06, h * 0.45 + 0.01, z1 + 0.14, PALETTE.wood[0], { skip: ['bottom'] });
}

/** A building going up: a stone footing, walls that rise as the work goes, scaffolding, and the materials piled by. */
function underConstruction(m, v) {
  const { w, d, progress, rnd } = v;
  const big = w * d >= 9;
  const H = big ? 1.5 : 0.95;
  const x0 = -w / 2 + 0.22, x1 = w / 2 - 0.22, z0 = -d / 2 + 0.22, z1 = d / 2 - 0.22;
  m.box('stone', x0 - 0.05, -0.35, z0 - 0.05, x1 + 0.05, 0.07, z1 + 0.05, PALETTE.stone[1], { skip: ['bottom'] });
  // The walls: timber frame first, then filled.
  const wallH = Math.max(0.05, Math.min(progress / 0.7, 1) * H * 0.7);
  m.box('wood', x0, 0.07, z0, x1, 0.07 + wallH, z1, '#a98c62', { skip: ['bottom', 'top'], uvScale: 1.2 });
  if (progress > 0.5) {
    const roofH = (progress - 0.5) / 0.5;
    const top = 0.07 + wallH;
    // Rafters.
    const n = Math.max(3, Math.round((x1 - x0) / 0.3));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      m.beam('wood', [x, top, z0], [x, top + 0.38 * roofH, (z0 + z1) / 2], 0.03, PALETTE.wood[0]);
      m.beam('wood', [x, top, z1], [x, top + 0.38 * roofH, (z0 + z1) / 2], 0.03, PALETTE.wood[0]);
    }
    m.beam('wood', [x0, top + 0.38 * roofH, (z0 + z1) / 2], [x1, top + 0.38 * roofH, (z0 + z1) / 2], 0.035, PALETTE.wood[0]);
  }
  scaffold(m, x0 - 0.12, z0 - 0.12, x1 + 0.12, z1 + 0.12, H);
  // Materials stacked about.
  logPile(m, x1 + 0.28, 0, z0 + 0.1, { len: 0.36, rows: 3, yaw: Math.PI / 2 });
  crate(m, x0 - 0.28, 0, z1 - 0.2, 0.14);
  barrel(m, x0 - 0.3, 0, z0 + 0.2);
  for (let i = 0; i < 4; i++) m.box('stone', x1 + 0.2, i * 0.05, z1 - 0.1 - (i % 2) * 0.02, x1 + 0.45, i * 0.05 + 0.05, z1 + 0.08, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  return {};
}

/** A plain block that stands in for a model that has not been drawn: a lodge with a roof. */
function placeholder(m, v) {
  const { w, d } = v;
  const x0 = -w / 2 + 0.2, x1 = w / 2 - 0.2, z0 = -d / 2 + 0.2, z1 = d / 2 - 0.2;
  m.box('stone', x0 - 0.04, -0.3, z0 - 0.04, x1 + 0.04, 0.08, z1 + 0.04, PALETTE.stone[0], { skip: ['bottom'] });
  m.box('plaster', x0, 0.08, z0, x1, 0.7, z1, '#d8c8a6', { skip: ['bottom'] });
  m.gable('tile', x0, z0, x1, z1, 0.7, 1.2, PALETTE.tile[0], { over: 0.12, gable: 'plaster', gableColor: '#d8c8a6' });
  return {};
}

/**
 * A library of models. `sizeOf(type)` is the footprint, in tiles, a type is
 * drawn for (`FOOTPRINTS` by default); a game with its own sizes passes them.
 * `models` adds to or replaces the types drawn. Models are built the first time
 * they are asked for, and kept.
 */
export function createBuildings({ sizeOf = (type) => FOOTPRINTS[type] ?? [1, 1], models = {} } = {}) {
  const all = { ...MODELS, ...models };
  const cache = new Map();

  /**
   * The template for a building: `{ parts, smoke, anim, lights, height }` where `parts` is the
   * material's vertex arrays. `variant` is any integer; a building under
   * construction has its own look.
   */
  function modelFor(type, { level = 1, variant = 0, building = false, progress = 0 } = {}) {
    const stage = building ? Math.min(3, Math.floor(progress * 4)) : -1;
    const key = `${type}:${level}:${variant % 8}:${stage}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const [w, d] = sizeOf(type);
    const m = new Mesher();
    const v = { w, d, level, variant, rnd: rngFor(variant % 8, type.length), progress: building ? (stage + 0.5) / 4 : 1, type };
    const fn = building ? underConstruction : all[type] ?? placeholder;
    const extra = fn(m, v) ?? {};
    drawTimber();
    const out = { parts: m.finish(), smoke: extra.smoke ?? [], anim: extra.anim ?? [], lights: extra.lights ?? [], height: extra.height ?? 1.6 };
    cache.set(key, out);
    return out;
  }

  return { modelFor, sizeOf, clear: () => cache.clear(), types: () => Object.keys(all) };
}
