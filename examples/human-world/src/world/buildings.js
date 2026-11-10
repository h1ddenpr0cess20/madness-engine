import * as GFX from 'madness-engine/gfx';
import { createBuildings, MODELS } from 'madness-engine/buildings';
import { PALETTE } from 'madness-engine/buildings/common';
import { Batch, Mesher, partGeometry } from 'madness-engine/mesher';
import { drawCrypt } from './scenery.js';

/**
 * The engine's buildings, stood up in the town. They are drawn at the size of
 * a strategy map, a doorway the height of a hand, so the town stamps them
 * `SCALE` times larger to let a person walk through the door. The models do
 * not say where their doors are, so each model is run once with a spy on its
 * `quad` calls to find the door planks (a `wood` quad in one of the door
 * colours, the height of a door) and keep where it is and which way it faces.
 */

export const SCALE = 2.2;

/** Where a model's door is, in the model's own frame, found by watching what it draws. */
const found = new Map();
const spied = {};
for (const type of Object.keys(MODELS)) {
  spied[type] = (m, v) => {
    const hits = [];
    const quad = m.quad.bind(m);
    m.quad = (mat, a, b, c, d, col, o) => {
      const h = c[1] - a[1], w = Math.hypot(b[0] - a[0], b[2] - a[2]);
      if (mat === 'wood' && PALETTE.door.includes(col) && h > 0.3 && h < 0.8 && w > 0.15 && w < 0.5) {
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const l = Math.hypot(...n) || 1;
        hits.push({ x: (a[0] + b[0]) / 2, z: (a[2] + b[2]) / 2, nx: n[0] / l, nz: n[2] / l });
      }
      return quad(mat, a, b, c, d, col, o);
    };
    const out = MODELS[type](m, v);
    found.set(`${type}:${v.variant % 8}`, hits.find((d) => d.nz > 0.9) ?? hits[0] ?? null);
    return out;
  };
}

export const library = createBuildings({ models: { ...spied, crypt: drawCrypt } });

/**
 * The part of each model that a person cannot walk through, as a box in the
 * model's frame (the roof's overhang and the yard in front are not it).
 * `front` is where the front wall is, if the door's own z doesn't say.
 */
export const BODY = {
  tavern: { x0: -1.3, x1: 1.3, z0: -1.3, z1: 0.72 },
  chapel: { x0: -0.74, x1: 0.74, z0: -1.86, z1: 0.84 },
  smithy: { x0: -1.0, x1: 1.1, z0: -1.4, z1: 0.6 },
  healer: { x0: -0.86, x1: 0.86, z0: -0.9, z1: 0.35 },
  townhouse: { x0: -0.96, x1: 0.96, z0: -1.4, z1: 0.8 },
  cottage: { x0: -0.78, x1: 0.78, z0: -0.78, z1: 0.35 },
  watchtower: { x0: -0.7, x1: 0.7, z0: -0.7, z1: 0.7 },
  guildhall: { x0: -1.0, x1: 1.0, z0: -1.0, z1: 1.17 },
  house: { x0: -0.82, x1: 0.82, z0: -0.82, z1: 0.36 },
  shop: { x0: -0.9, x1: 0.9, z0: -0.85, z1: 0.36 },
  merchant: { x0: -1.0, x1: 1.0, z0: -1.0, z1: 0.46 },
  weaver: { x0: -0.85, x1: 0.85, z0: -1.3, z1: 0.1 },
  brewery: { x0: -0.95, x1: 0.95, z0: -1.4, z1: 0.6 },
  castle: { x0: -3.0, x1: 3.0, z0: -3.0, z1: 3.0 },
  well: { x0: -0.35, x1: 0.35, z0: -0.35, z1: 0.35 },
  crypt: { x0: -0.78, x1: 0.78, z0: -0.88, z1: 0.9 },
};

/** Doors that the spy cannot see: the open forge, the tower's, the crypt's own. */
const FALLBACK_DOOR = {
  smithy: { x: 0, z: 0.6, nx: 0, nz: 1 },
  watchtower: { x: 0, z: 0.7, nx: 0, nz: 1 },
  crypt: { x: 0, z: 0.9, nx: 0, nz: 1 },
  castle: { x: -1.75, z: 1.51, nx: 0, nz: 1 },
};

/** The door of a model in the model's own frame. */
export function doorOf(type, variant) {
  library.modelFor(type, { variant });
  return found.get(`${type}:${variant % 8}`) ?? FALLBACK_DOOR[type] ?? { x: 0, z: (BODY[type]?.z1 ?? 0.5), nx: 0, nz: 1 };
}

const turn = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];

/**
 * A building ready to put in the scene. `door` is the doorstep in the world
 * (where a player stands to go in), `out` the way it faces, `box` what is
 * solid, `lights` where its windows burn.
 *
 *   type, variant   which model
 *   door: [x, z]    where the door is, in the world
 *   yaw             which way it faces (0 is toward +z)
 *   tint            multiplies the model's colours: the town is drained and darkened with it
 *   lit             whether the windows glow
 */
export function raise(materials, { type, variant = 0, door, yaw = 0, tint = [0.6, 0.64, 0.66], lit = true, shadow = true, skip = [] }) {
  const model = library.modelFor(type, { variant });
  const d = doorOf(type, variant);
  const [dx, dz] = turn(d.x * SCALE, d.z * SCALE, yaw);
  const x = door[0] - dx, z = door[1] - dz;
  const batch = new Batch();
  const parts = { ...model.parts };
  if (!lit) delete parts.glow;
  for (const s of skip) delete parts[s];
  batch.stamp(parts, x, 0, z, yaw, SCALE, tint);
  const group = new GFX.Group();
  group.name = type;
  for (const [name, acc] of batch.accs) {
    const geometry = acc.geometry(GFX);
    if (!geometry) continue;
    const mesh = new GFX.Mesh(geometry, materials[name] ?? materials.plain);
    mesh.castShadow = shadow && name !== 'glow' && name !== 'flame' && name !== 'glass';
    mesh.receiveShadow = name !== 'glow' && name !== 'flame';
    mesh.name = `${type}:${name}`;
    group.add(mesh);
  }
  // The solid body, as a box on the ground plan.
  const b = BODY[type] ?? { x0: -1, x1: 1, z0: -1, z1: 1 };
  const corners = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]].map(([cx, cz]) => {
    const [wx, wz] = turn(cx * SCALE, cz * SCALE, yaw);
    return [x + wx, z + wz];
  });
  const box = {
    x0: Math.min(...corners.map((c) => c[0])), x1: Math.max(...corners.map((c) => c[0])),
    z0: Math.min(...corners.map((c) => c[1])), z1: Math.max(...corners.map((c) => c[1])),
  };
  const [nx, nz] = turn(d.nx, d.nz, yaw);
  // The model's own lit windows, for the town to put a light by.
  const [lx, lz] = turn(d.x * SCALE, (d.z - 0.1) * SCALE, yaw);
  return {
    type, group, box, x, z, yaw, height: model.height * SCALE,
    door: { x: door[0], z: door[1], nx, nz },
    out: [nx, nz],
    smoke: model.smoke.map(([sx, sy, sz]) => {
      const [wx, wz] = turn(sx * SCALE, sz * SCALE, yaw);
      return [x + wx, sy * SCALE, z + wz];
    }),
    light: lit ? [door[0] + nx * 1.4 + lx * 0 + (lz * 0), 1.1, door[1] + nz * 1.4] : null,
  };
}

/**
 * Puts a list of `[template, x, z, yaw, scale, tint, y]` into the scene. A
 * template that is used `instanceFrom` times or more is drawn as instances
 * (one call for every copy of it); the rest are merged into one mesh a
 * material.
 */
export function scatter(materials, placements, { castShadow = true, instanceFrom = 4 } = {}) {
  const byTemplate = new Map();
  for (const p of placements) {
    if (!byTemplate.has(p[0])) byTemplate.set(p[0], []);
    byTemplate.get(p[0]).push(p);
  }
  const group = new GFX.Group();
  const batch = new Batch();
  const shadows = (name) => castShadow && name !== 'glow' && name !== 'flame' && name !== 'hedge';
  for (const [template, list] of byTemplate) {
    if (list.length < instanceFrom) {
      for (const [, x, z, yaw = 0, scale = SCALE, tint = null, y = 0] of list) batch.stamp(template, x, y, z, yaw, scale, tint);
      continue;
    }
    for (const [name, part] of Object.entries(template)) {
      const mesh = new GFX.InstancedMesh(partGeometry(GFX, part), materials[name] ?? materials.plain, list.length);
      for (const [, x, z, yaw = 0, scale = SCALE, tint = null, y = 0] of list) mesh.add(x, y, z, yaw, scale, tint);
      mesh.update();
      mesh.castShadow = shadows(name);
      mesh.receiveShadow = name !== 'glow' && name !== 'flame';
      mesh.name = `instances:${name}`;
      group.add(mesh);
    }
  }
  for (const [name, acc] of batch.accs) {
    const geometry = acc.geometry(GFX);
    if (!geometry) continue;
    const mesh = new GFX.Mesh(geometry, materials[name] ?? materials.plain);
    mesh.castShadow = shadows(name);
    mesh.receiveShadow = name !== 'glow' && name !== 'flame';
    mesh.name = `scatter:${name}`;
    group.add(mesh);
  }
  return group;
}

export { Mesher };
