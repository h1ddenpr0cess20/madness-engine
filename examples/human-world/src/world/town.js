import * as GFX from 'madness-engine/gfx';
import { rngFor } from 'madness-engine/buildings/common';
import { createGround, createMaterials } from './materials.js';
import { buildGround, noise } from './ground.js';
import { SCALE, raise, scatter } from './buildings.js';
import * as scenery from './scenery.js';

/**
 * Gravemoor. Eighty tiles by eighty: the road in from the south gate runs
 * north between the houses to the chapel; the graveyard lies east of the
 * chapel with the crypt at the back of it; the manor stands on its hill in
 * the north-west, shuttered; and past the iron fence on every side the dead
 * wood closes in. Everything solid is a box or a circle on the ground plan;
 * the player walks between them.
 */

export const SIZE = 80;
export const START = [40, 72.5];

/** The graveyard's walls, and the gate in the west one. */
export const CEMETERY = { x0: 54, x1: 78, z0: 5, z1: 34, gate: [19.5, 23] };

/** Where the town's people may go and the player may not: the margin inside the fence. */
export const WALLS = { x0: 1.2, z0: 1.2, x1: SIZE - 1.2, z1: 76.6 };

const TINTS = {
  cold: [0.5, 0.58, 0.6],
  green: [0.46, 0.58, 0.52],
  grey: [0.55, 0.57, 0.6],
  warm: [0.62, 0.55, 0.5],
  dark: [0.38, 0.44, 0.48],
  bruise: [0.52, 0.48, 0.6],
};

/**
 * The buildings. `id` is what the story calls a house that can be entered
 * (`enter`); the rest are shut and dark. `door` is the doorstep in the world.
 */
export const BUILDINGS = [
  { id: 'chapel', enter: 'chapel', name: "St. Wick's Chapel", type: 'chapel', variant: 0, door: [40, 20.4], yaw: 0, tint: TINTS.grey },
  { id: 'tavern', enter: 'tavern', name: 'The Hanged Man', type: 'tavern', variant: 1, door: [34.0, 44], yaw: Math.PI / 2, tint: TINTS.warm },
  { id: 'apothecary', enter: 'apothecary', name: "Morrow's Apothecary", type: 'healer', variant: 0, door: [46.0, 36.5], yaw: -Math.PI / 2, tint: TINTS.green },
  { id: 'smithy', enter: 'smithy', name: "Brandt's Forge", type: 'smithy', variant: 0, door: [46.0, 59.5], yaw: -Math.PI / 2, tint: TINTS.dark },
  { id: 'undertaker', enter: 'undertaker', name: "Crane & Son, Undertakers", type: 'townhouse', variant: 0, door: [34.0, 58.5], yaw: Math.PI / 2, tint: TINTS.bruise },
  { id: 'cottage', enter: 'cottage', name: "Old Maud's Cottage", type: 'cottage', variant: 1, door: [22.4, 36.2], yaw: Math.PI / 2, tint: TINTS.warm },
  { id: 'tower', enter: 'tower', name: "The Constable's Tower", type: 'watchtower', variant: 0, door: [51.5, 70.5], yaw: -Math.PI / 2, tint: TINTS.cold },
  { id: 'crypt', enter: 'crypt', name: 'The Ashcombe Crypt', type: 'crypt', variant: 0, door: [70, 16.6], yaw: 0, tint: [0.8, 0.85, 0.85], shadow: true },
  { id: 'manor', enter: null, name: 'Gravemoor Manor', type: 'castle', variant: 2, door: [13.5, 22.2], yaw: 0, tint: TINTS.dark, lit: false },
  // Shut up, the lot of them.
  { id: 'h1', enter: null, name: 'A shuttered house', type: 'house', variant: 2, door: [34.0, 29], yaw: Math.PI / 2, tint: TINTS.cold, lit: false },
  { id: 'h2', enter: null, name: 'A shuttered shop', type: 'shop', variant: 1, door: [34.0, 69], yaw: Math.PI / 2, tint: TINTS.green, lit: false },
  { id: 'h3', enter: null, name: 'A barred house', type: 'merchant', variant: 0, door: [46.0, 48.5], yaw: -Math.PI / 2, tint: TINTS.grey, lit: true },
  { id: 'h4', enter: null, name: 'The weaver’s', type: 'weaver', variant: 0, door: [46.0, 27.5], yaw: -Math.PI / 2, tint: TINTS.bruise, lit: false },
  { id: 'h5', enter: null, name: 'A dark house', type: 'house', variant: 4, door: [46.0, 70], yaw: -Math.PI / 2, tint: TINTS.dark, lit: false, skip: [] },
  { id: 'h6', enter: null, name: 'The old brewery', type: 'brewery', variant: 0, door: [22.5, 52], yaw: Math.PI / 2, tint: TINTS.dark, lit: false },
  { id: 'h7', enter: null, name: 'A leaning cottage', type: 'cottage', variant: 2, door: [22.5, 64], yaw: Math.PI / 2, tint: TINTS.cold, lit: false },
  { id: 'well', enter: null, name: 'The well', type: 'well', variant: 0, door: [40, 46], yaw: 0, tint: TINTS.grey, lit: false },
];

const inRect = (x, z, x0, z0, x1, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

/** Which surface lies at (x, z). */
export function surfaceAt(x, z) {
  const c = CEMETERY;
  // The graveyard: grave earth, with a path from the gate to the crypt.
  if (inRect(x, z, c.x0, c.z0, c.x1 + 1, c.z1)) {
    if (inRect(x, z, c.x0, c.gate[0] + 0.4, 66.5, c.gate[1] - 0.4) || inRect(x, z, 64.8, 15, 67, c.gate[1])) return 'dirt';
    if (inRect(x, z, 64, 15, 76, 20.5)) return 'flags';
    return noise(x * 0.5, z * 0.5, 5) > 0.82 ? 'dirt' : 'mud';
  }
  // The road from the gate to the chapel.
  if (inRect(x, z, 37.4, 20, 42.6, 90)) return 'cobble';
  // The plaza.
  if (Math.hypot(x - 40, z - 46) < 6.4) return 'flags';
  // The chapel's forecourt, and the way east to the graveyard.
  if (inRect(x, z, 34, 17, 46, 22) || inRect(x, z, 46, 19.5, 55, 23)) return 'flags';
  // The lane to Old Maud's.
  if (inRect(x, z, 21, 34.8, 37.5, 37.6)) return 'dirt';
  // The manor's yard.
  if (inRect(x, z, 4, 11, 26, 25)) return noise(x * 0.4, z * 0.4, 8) > 0.5 ? 'flags' : 'dirt';
  // The aprons before every door.
  for (const b of BUILDINGS) {
    if (!b.door || b.id === 'well') continue;
    const [nx, nz] = [Math.round(Math.sin(b.yaw)), Math.round(Math.cos(b.yaw))];
    const mx = b.door[0] + nx * 1.4, mz = b.door[1] + nz * 1.4;
    if (Math.abs(x - mx) < (nz ? 1.9 : 1.5) && Math.abs(z - mz) < (nx ? 1.9 : 1.5)) return 'flags';
  }
  // The yards behind the houses are dirt; the rest is dead grass and patches of mud.
  const n = noise(x * 0.18, z * 0.18, 2);
  if (n > 0.72) return 'mud';
  if (n < 0.28) return 'dirt';
  return 'grass';
}

/** Whether the tile is something a thing may be put down on (road, plaza and doorsteps are kept clear). */
const clear = (x, z) => {
  const s = surfaceAt(x, z);
  return s === 'grass' || s === 'mud' || (s === 'dirt');
};

/**
 * Builds the town.
 * @returns { group, colliders, buildings, lamps, windows, graves, surfaceAt, ... }
 */
export function buildTown() {
  const mats = createMaterials(GFX);
  const groundMats = createGround(GFX);
  const group = new GFX.Group();
  group.name = 'gravemoor';
  const colliders = { boxes: [], circles: [] };
  const lamps = [];
  const windows = [];

  group.add(buildGround(groundMats, surfaceAt, { x0: -18, z0: -18, x1: SIZE + 18, z1: SIZE + 18 }));

  // The buildings.
  const buildings = new Map();
  for (const spec of BUILDINGS) {
    if (spec.id === 'well') continue;
    const b = raise(mats, spec);
    b.spec = spec;
    buildings.set(spec.id, b);
    group.add(b.group);
    colliders.boxes.push({ ...b.box, id: spec.id });
    if (b.light && spec.lit !== false) windows.push({ x: b.light[0], y: b.light[1], z: b.light[2], color: '#ffb45a', reach: 7 });
  }
  // The well, in the middle of the plaza.
  {
    const spec = BUILDINGS.find((b) => b.id === 'well');
    const b = raise(mats, spec);
    b.spec = spec;
    group.add(b.group);
    colliders.circles.push({ x: 40, z: 46, r: 1.0 });
    buildings.set('well', b);
  }

  // Lamps along the road.
  const lampT = scenery.lamppost();
  const placements = [];
  const lampAt = (x, z, yaw = 0) => {
    placements.push([lampT, x, z, yaw]);
    colliders.circles.push({ x, z, r: 0.22 });
    lamps.push({ x, y: scenery.LAMP_HEIGHT * SCALE, z, color: '#ffb35a', reach: 9, safe: 3.6 });
  };
  for (const z of [26, 36, 53, 66]) { lampAt(36.2, z); lampAt(43.8, z + 4); }
  lampAt(40, 24.5); lampAt(34.6, 16.5); lampAt(45.4, 16.5);
  lampAt(36.4, 74.5); lampAt(43.6, 74.5);

  // The gate to the south, and the iron fence along the whole south side.
  const pier = scenery.gatePier({ lantern: true });
  placements.push([pier, 36.2, 77.4, 0], [pier, 43.8, 77.4, 0]);
  colliders.circles.push({ x: 36.2, z: 77.4, r: 0.5 }, { x: 43.8, z: 77.4, r: 0.5 });
  lamps.push({ x: 36.2, y: 2.4, z: 77.4, color: '#ffb35a', reach: 8, safe: 3.2 }, { x: 43.8, y: 2.4, z: 77.4, color: '#ffb35a', reach: 8, safe: 3.2 });
  const fence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / (2 * SCALE)));
    const seg = scenery.ironFence(len / n / SCALE);
    const yaw = Math.atan2(-(z1 - z0), x1 - x0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      placements.push([seg, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, yaw]);
    }
  };
  fence(0, 77.4, 35.6, 77.4);
  fence(44.4, 77.4, 80, 77.4);

  // The graveyard's iron fence, with its gate pillars.
  const c = CEMETERY;
  fence(c.x0, c.z0, c.x1, c.z0);
  fence(c.x1, c.z0, c.x1, c.z1);
  fence(c.x1, c.z1, c.x0, c.z1);
  fence(c.x0, c.z1, c.x0, c.gate[1]);
  fence(c.x0, c.gate[0], c.x0, c.z0);
  placements.push([scenery.gatePier(), c.x0, c.gate[0], 0], [scenery.gatePier(), c.x0, c.gate[1], 0]);
  colliders.boxes.push(
    { x0: c.x0 - 0.2, x1: c.x0 + 0.2, z0: c.z0, z1: c.gate[0] - 0.4 },
    { x0: c.x0 - 0.2, x1: c.x0 + 0.2, z0: c.gate[1] + 0.4, z1: c.z1 },
    { x0: c.x0, x1: c.x1 + 0.3, z0: c.z0 - 0.2, z1: c.z0 + 0.2 },
    { x0: c.x0, x1: c.x1 + 0.3, z0: c.z1 - 0.2, z1: c.z1 + 0.2 },
    { x0: c.x1 - 0.2, x1: c.x1 + 0.3, z0: c.z0, z1: c.z1 },
  );
  colliders.circles.push({ x: c.x0, z: c.gate[0], r: 0.5 }, { x: c.x0, z: c.gate[1], r: 0.5 });
  lamps.push({ x: c.x0 + 0.6, y: 2.6, z: (c.gate[0] + c.gate[1]) / 2, color: '#9aff9a', reach: 7, safe: 3.4 });

  // Graves, in rows, with the path and the crypt left clear. A few are known by name.
  const rnd = rngFor(5, 9);
  const graves = [];
  const stones = [0, 1, 2, 3, 4, 5, 6, 7].map((v) => scenery.headstone(v));
  for (let gz = 8.5; gz < c.z1 - 1; gz += 3.4) {
    for (let gx = 56.5; gx < c.x1 - 1; gx += 3.4) {
      const x = gx + (rnd() - 0.5) * 0.9, z = gz + (rnd() - 0.5) * 0.9;
      if (inRect(x, z, 62.5, 6, 68, c.z1) || inRect(x, z, 54, c.gate[0] - 1.5, 68, c.gate[1] + 1.5) || inRect(x, z, 62, 6, 78, 21)) continue;
      if (rnd() < 0.18) continue;
      const variant = Math.floor(rnd() * 8);
      placements.push([stones[variant], x, z, (rnd() - 0.5) * 0.3, SCALE * (0.9 + rnd() * 0.3)]);
      colliders.circles.push({ x, z: z - 0.1, r: 0.34 });
      graves.push({ x, z, variant });
    }
  }
  // The named graves: where the player may read what is cut in them.
  const named = [
    { id: 'tobias', x: 58.2, z: 14.2, variant: 0 }, { id: 'ashcombe', x: 72, z: 26, variant: 2 },
    { id: 'bellringer', x: 60, z: 30, variant: 1 }, { id: 'unmarked', x: 74.5, z: 31, variant: 3 },
    { id: 'wick', x: 69.5, z: 29.6, variant: 0 }, { id: 'twins', x: 57.5, z: 25.5, variant: 1 },
  ];
  for (const g of named) {
    for (let i = graves.length - 1; i >= 0; i--) if (Math.hypot(graves[i].x - g.x, graves[i].z - g.z) < 1.6) graves.splice(i, 1);
    placements.push([stones[g.variant], g.x, g.z, 0.05, SCALE * 1.1]);
    colliders.circles.push({ x: g.x, z: g.z - 0.1, r: 0.36 });
  }
  placements.push([scenery.bigCross(), 71, 26, 0, SCALE * 1.2], [scenery.angel(), 60.6, 20.6, 0.3, SCALE * 1.1], [scenery.angel(), 75.8, 9.6, -0.5, SCALE]);
  colliders.circles.push({ x: 71, z: 26, r: 0.7 }, { x: 60.6, z: 20.6, r: 0.6 }, { x: 75.8, z: 9.6, r: 0.6 });
  lamps.push({ x: 71, y: 1.2, z: 27.4, color: '#7aff8a', reach: 8, safe: 3.4 });

  // The lantern Lady Ashcombe keeps burning at her son's grave: he wanted the lights left on.
  lampAt(59.6, 16.0);
  lamps.at(-1).color = '#ffd8a0';

  // Dead trees: a thicket outside the walls, a few between the houses.
  const trees = [0, 1, 2, 3, 4, 5].map((v) => scenery.deadTree(v));
  const treeRnd = rngFor(3, 4);
  const tree = (x, z, big = 1) => {
    placements.push([trees[Math.floor(treeRnd() * trees.length)], x, z, treeRnd() * 6.28, SCALE * (1.0 + treeRnd() * 0.5) * big]);
  };
  for (let i = 0; i < 380; i++) {
    const x = -16 + treeRnd() * (SIZE + 32), z = -16 + treeRnd() * (SIZE + 32);
    const outside = x < 0.5 || x > SIZE - 0.5 || z < 0.5 || z > 77.8;
    if (!outside) continue;
    if (inRect(x, z, 36, 77, 44, 100)) continue;
    tree(x, z, 1.2);
    if (x > -1 && x < SIZE + 1 && z > -1 && z < 80) colliders.circles.push({ x, z, r: 0.5 });
  }
  // The inner edge: a line of them just inside the walls, and the odd one in the yards.
  for (let t = 2; t < SIZE - 1; t += 3 + treeRnd() * 3) {
    for (const [x, z] of [[t, 1.6 + treeRnd() * 2], [1.5 + treeRnd() * 2, t], [SIZE - 1.5 - treeRnd() * 2, t]]) {
      if (inRect(x, z, 4, 8, 28, 26) || inRect(x, z, 54, 4, 79, 36)) continue;
      if (z > 76) continue;
      tree(x, z);
      colliders.circles.push({ x, z, r: 0.45 });
    }
  }
  for (let i = 0; i < 46; i++) {
    const x = 4 + treeRnd() * 72, z = 6 + treeRnd() * 68;
    if (!clear(x, z) || buildings.size === 0) continue;
    if ([...buildings.values()].some((b) => x > b.box.x0 - 2.6 && x < b.box.x1 + 2.6 && z > b.box.z0 - 2.6 && z < b.box.z1 + 2.6)) continue;
    if (inRect(x, z, 33, 17, 47, 78) || inRect(x, z, 54, 4, 79, 36) || inRect(x, z, 20, 33, 38, 39)) continue;
    tree(x, z, 0.9);
    colliders.circles.push({ x, z, r: 0.4 });
  }

  // Weeds, boulders and bones, thrown about wherever there is room.
  const weeds = [0, 1, 2].map((v) => scenery.weeds(v));
  const rocks = [0, 1, 2].map((v) => scenery.boulder(v));
  const bones = [0, 1].map((v) => scenery.bones(v));
  const wr = rngFor(8, 8);
  for (let i = 0; i < 1100; i++) {
    const x = -4 + wr() * (SIZE + 8), z = -4 + wr() * (SIZE + 8);
    const s = surfaceAt(x, z);
    if (s !== 'grass' && s !== 'mud' && s !== 'dirt') continue;
    placements.push([weeds[i % 3], x, z, wr() * 6.28, SCALE * (0.7 + wr() * 0.7)]);
  }
  for (let i = 0; i < 70; i++) {
    const x = -2 + wr() * (SIZE + 4), z = -2 + wr() * (SIZE + 4);
    if (!clear(x, z)) continue;
    if ([...buildings.values()].some((b) => x > b.box.x0 - 1.5 && x < b.box.x1 + 1.5 && z > b.box.z0 - 1.5 && z < b.box.z1 + 1.5)) continue;
    const rs = 0.5 + wr() * 0.6;
    placements.push([rocks[i % 3], x, z, wr() * 6.28, SCALE * rs, [0.5, 0.52, 0.52]]);
    if (x > 0 && x < SIZE && z > 0 && z < 78) colliders.circles.push({ x, z, r: 0.3 + rs * 0.2 });
  }
  for (let i = 0; i < 14; i++) {
    const x = 55 + wr() * 22, z = 6 + wr() * 28;
    if (!clear(x, z) || inRect(x, z, 62, 6, 78, 21)) continue;
    placements.push([bones[i % 2], x, z, wr() * 6.28, SCALE]);
  }

  // The pumpkins on the steps, and the clutter by the doors.
  const pumpkins = [0, 1, 2].map((v) => scenery.pumpkin(v));
  const clutter = [0, 1, 2].map((v) => scenery.clutter(v));
  let pi = 0;
  for (const b of buildings.values()) {
    if (b.spec.id === 'well' || !b.door) continue;
    const [nx, nz] = b.out;
    const px = -nz, pz = nx;
    // On the door's right.
    if (b.spec.enter || b.spec.id === 'h3') {
      placements.push([pumpkins[pi++ % 3], b.door.x + nx * 0.7 + px * 1.1, b.door.z + nz * 0.7 + pz * 1.1, Math.atan2(nx, nz), SCALE]);
      lamps.push({ x: b.door.x + nx * 0.7 + px * 1.1, y: 0.4, z: b.door.z + nz * 0.7 + pz * 1.1, color: '#ff9a30', reach: 4.5, safe: 2.4 });
      if (b.spec.id !== 'crypt' && b.spec.id !== 'chapel') placements.push([clutter[pi % 3], b.door.x + nx * 0.6 - px * 1.6, b.door.z + nz * 0.6 - pz * 1.6, Math.atan2(nx, nz), SCALE]);
    }
  }
  // Pumpkins on the well and a few graves, for the look of it.
  placements.push([pumpkins[0], 38.9, 44.6, 0.4, SCALE], [pumpkins[1], 41.3, 47.5, 3.2, SCALE]);

  // The wagon the player came in on, at the gate.
  placements.push([scenery.wagon(), 35.6, 75.0, 0.6, SCALE * 1.15]);
  colliders.boxes.push({ x0: 34.6, x1: 36.6, z0: 74.2, z1: 75.8 });

  // A few broken barrels and crates in the plaza, so it looks lived in, once.
  placements.push([clutter[1], 43.4, 49.5, 0.8, SCALE], [clutter[2], 36.8, 42.2, 2.1, SCALE]);
  colliders.circles.push({ x: 43.4, z: 49.5, r: 0.5 }, { x: 36.8, z: 42.2, r: 0.5 });

  group.add(scatter(mats, placements));

  // The bell, in its frame, up where the player can see it ring from the road: at the top of the chapel's tower.
  return { group, colliders, buildings, lamps, windows, mats, groundMats, surfaceAt, graves, size: SIZE };
}
