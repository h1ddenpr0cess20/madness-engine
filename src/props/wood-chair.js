/**
 * A set of customizable wooden chairs, built like the wood tables (props/wood-table.js) and the bookcase
 * (props/bookcase.js): boards of one species in one finish, grain along each board, the library's wood when
 * `textures/wood.js` is there and plain painted boards when it is not. Every part overlaps what it joins, so a
 * chair is one piece.
 *
 * `kind` picks a starting chair (dining, spindle, ladder, armchair, stool, barstool); `seat` (square, round),
 * `legs` (square, tapered, turned), `back` (slat, spindle, ladder, none), `curve` (how far the back bows out behind the
 * sitter, in metres, 0 for a flat back), `arms`, `stretchers` and every measure can be given to change it. `seatSurface` says where the seat is, so that a model can sit on it.
 *
 * Coordinates are metres: the middle of the seat on the floor, the front facing +z, the back at -z.
 *
 *   const chair = createWoodChair(GFX, { kind: 'armchair', species: 'cherry', finish: 'sanded' });
 */

import { FINISHES, SPECIES, mulberry, woodMaterial, woodUV, WOOD_SOURCE } from './bookcase.js';

export { FINISHES, SPECIES, WOOD_SOURCE };
export const KINDS = Object.freeze(['dining', 'spindle', 'ladder', 'armchair', 'stool', 'barstool']);
export const SEATS = Object.freeze(['square', 'round']);
export const LEGS = Object.freeze(['square', 'tapered', 'turned']);
export const BACKS = Object.freeze(['slat', 'spindle', 'ladder', 'none']);

/** The starting measures of each kind, in metres: the seat's outside, its height from the floor, the back above it. */
export const KIND_DEFAULTS = Object.freeze({
  dining: { seat: 'square', legs: 'tapered', back: 'slat', arms: false, stretchers: true, width: 0.44, depth: 0.44, height: 0.46, backHeight: 0.46 },
  spindle: { seat: 'square', legs: 'turned', back: 'spindle', arms: false, stretchers: true, width: 0.44, depth: 0.42, height: 0.46, backHeight: 0.48 },
  ladder: { seat: 'square', legs: 'square', back: 'ladder', arms: false, stretchers: true, width: 0.42, depth: 0.4, height: 0.46, backHeight: 0.5 },
  armchair: { seat: 'square', legs: 'turned', back: 'slat', arms: true, stretchers: true, width: 0.58, depth: 0.52, height: 0.46, backHeight: 0.5 },
  stool: { seat: 'round', legs: 'tapered', back: 'none', arms: false, stretchers: true, width: 0.36, depth: 0.36, height: 0.46, backHeight: 0 },
  barstool: { seat: 'round', legs: 'turned', back: 'none', arms: false, stretchers: true, width: 0.38, depth: 0.38, height: 0.75, backHeight: 0 },
});

export const DEFAULTS = Object.freeze({ kind: 'dining', species: 'oak', finish: 'lacquered', seed: 1, curve: 0 });
export const MAX_CURVE = 0.15;

const ST = 0.03;        // the seat's thickness
const L = 0.04;         // a leg's thickness at the top
const EPS = 0.002;      // how far a part runs into the one it joins

export function createWoodChair(GFX, options = {}) {
  const kind = options.kind ?? DEFAULTS.kind;
  if (!KINDS.includes(kind)) throw new Error(`wood chair: unknown kind "${kind}"`);
  const o = { ...DEFAULTS, ...KIND_DEFAULTS[kind], ...Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)), kind };
  if (!SPECIES.includes(o.species)) throw new Error(`wood chair: unknown species "${o.species}"`);
  if (!FINISHES.includes(o.finish)) throw new Error(`wood chair: unknown finish "${o.finish}"`);
  if (!SEATS.includes(o.seat)) throw new Error(`wood chair: unknown seat "${o.seat}"`);
  if (!LEGS.includes(o.legs)) throw new Error(`wood chair: unknown legs "${o.legs}"`);
  if (!BACKS.includes(o.back)) throw new Error(`wood chair: unknown back "${o.back}"`);
  if (!(Number.isFinite(o.curve) && o.curve >= 0 && o.curve <= MAX_CURVE)) throw new Error(`wood chair: curve must be 0 to ${MAX_CURVE} metres`);
  if (!(o.width >= 0.25 && o.width <= 0.9 && o.depth >= 0.25 && o.depth <= 0.8 && o.height >= 0.3 && o.height <= 0.9 && o.backHeight >= 0 && o.backHeight <= 0.9)) throw new Error('wood chair: dimensions outside supported ranges');
  const { width, depth, height } = o;
  const backHeight = o.back === 'none' ? 0 : Math.max(o.backHeight, 0.2);

  const group = new GFX.Group();
  group.name = `${kind} chair`;
  const wood = woodMaterial(GFX, o.species, o.finish);
  const rand = mulberry(o.seed * 17 + 3);

  const add = (name, geometry, position, grain) => {
    woodUV(GFX, geometry, [position[0] + rand() * 3.1, position[1] + rand() * 2.3, position[2] + rand() * 1.7], grain);
    const mesh = new GFX.Mesh(geometry, wood);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const board = (name, size, position, grain) => add(name, new GFX.BoxGeometry(...size), position, grain);

  /* ------------------------------- seat -------------------------------- */

  const yb = height - ST;                              // the seat's underside
  if (o.seat === 'round') {
    const g = new GFX.CylinderGeometry(0.5, 0.5, ST, 48);
    g.scale(width, 1, depth);
    g.computeVertexNormals();
    add('seat', g, [0, height - ST / 2, 0], 'x');
  } else {
    board('seat', [width, ST, depth], [0, height - ST / 2, 0], 'x');
  }

  /* ------------------------------- legs -------------------------------- */

  const lx = o.seat === 'round' ? width * 0.31 : width / 2 - 0.03;
  const lz = o.seat === 'round' ? depth * 0.31 : depth / 2 - 0.03;
  const legLen = yb + EPS * 2;                         // up into the seat
  const hasBack = o.back !== 'none';
  const backTop = height + backHeight;
  const armY = height + 0.2;

  const leg = (name, x, z, tall) => {
    if (o.legs === 'square') {
      board(name, [L, tall ?? legLen, L], [x, (tall ?? legLen) / 2, z], 'y');
    } else if (o.legs === 'tapered') {
      const g = new GFX.CylinderGeometry(L * 0.707, L * 0.4, legLen, 4, 1);
      g.rotateY(Math.PI / 4);
      add(name, g, [x, legLen / 2, z], 'y');
    } else {
      const prof = [[0.4, 0], [0.5, 0.05], [0.58, 0.16], [0.46, 0.3], [0.52, 0.4], [0.64, 0.5], [0.5, 0.58], [0.74, 0.64], [0.5, 0.7], [0.5, 1]]
        .map(([r, t]) => new GFX.Vector2(r * L * 0.9, t * legLen));
      add(name, new GFX.LatheGeometry(prof, 20), [x, 0, z], 'y');
    }
    // Posts rising above the seat: a square post over a turned or tapered leg, from just inside the leg's top.
    if (tall && o.legs !== 'square') board(`${name} post`, [L * 0.85, tall - legLen + EPS * 2, L * 0.85], [x, legLen - EPS + (tall - legLen + EPS * 2) / 2, z], 'y');
  };
  leg('leg front left', -lx, lz, o.arms ? armY : null);
  leg('leg front right', lx, lz, o.arms ? armY : null);
  leg('leg rear left', -lx, -lz, hasBack ? backTop : null);
  leg('leg rear right', lx, -lz, hasBack ? backTop : null);

  /* ------------------------ rails and stretchers ----------------------- */

  const RH = 0.06, RT = 0.02;
  board('rail front', [2 * lx, RH, RT], [0, yb - RH / 2 + EPS, lz], 'x');
  board('rail rear', [2 * lx, RH, RT], [0, yb - RH / 2 + EPS, -lz], 'x');
  board('rail left', [RT, RH, 2 * lz], [-lx, yb - RH / 2 + EPS, 0], 'y');
  board('rail right', [RT, RH, 2 * lz], [lx, yb - RH / 2 + EPS, 0], 'y');
  if (o.stretchers) {
    const ys = Math.min(0.2, yb * 0.35) + (kind === 'barstool' ? 0.1 : 0);
    board('stretcher left', [0.022, 0.022, 2 * lz], [-lx, ys, 0], 'y');
    board('stretcher right', [0.022, 0.022, 2 * lz], [lx, ys, 0], 'y');
    board('stretcher middle', [2 * lx, 0.022, 0.022], [0, ys, 0], 'x');
  }

  /* -------------------------------- back ------------------------------- */

  if (hasBack) {
    // The back bows out behind the sitter by `curve` at its middle, and meets the posts at its ends. A board is cut
    // into strips along x and each strip's z follows the arc, so it is one curved board.
    const bow = (x) => -o.curve * (1 - (x / lx) ** 2);
    const backBoard = (name, h, t, y) => {
      const g = new GFX.BoxGeometry(2 * lx, h, t, o.curve > 0 ? 24 : 1, 1, 1);
      if (o.curve > 0) {
        const P = g.attributes.position;
        for (let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) + bow(P.getX(i)));
        g.computeVertexNormals();
      }
      add(name, g, [0, y, -lz], 'x');
    };
    const topRail = (h) => backBoard('back top rail', h, 0.024, backTop - h / 2);
    if (o.back === 'slat') {
      topRail(0.1);
      for (let i = 0; i < 2; i++) backBoard(`back slat ${i + 1}`, 0.07, 0.02, height + 0.1 + i * (backHeight - 0.28));
    } else if (o.back === 'ladder') {
      topRail(0.07);
      const n = 3, y0 = height + 0.1, y1 = backTop - 0.16;
      for (let i = 0; i < n; i++) backBoard(`back slat ${i + 1}`, 0.045, 0.02, y0 + (y1 - y0) * i / (n - 1));
    } else {
      topRail(0.06);
      const n = 5, bottom = height - 0.01, top = backTop - 0.06 + EPS;
      for (let i = 0; i < n; i++) {
        const x = -lx + (2 * lx) * (i + 1) / (n + 1);
        add(`back spindle ${i + 1}`, new GFX.CylinderGeometry(0.009, 0.009, top - bottom, 12), [x, (top + bottom) / 2, -lz + bow(x)], 'y');
      }
      // a low rail the spindles stand in
      backBoard('back base rail', 0.03, 0.024, height + 0.015);
    }
  }

  /* -------------------------------- arms ------------------------------- */

  if (o.arms) {
    for (const s of [-1, 1]) board(`arm ${s < 0 ? 'left' : 'right'}`, [0.055, 0.025, 2 * lz + 0.06], [s * lx, armY - 0.0125 + EPS, 0.0], 'y');
  }

  return {
    group,
    material: wood,
    wood: { species: o.species, finish: o.finish, source: WOOD_SOURCE },
    options: { kind, seat: o.seat, legs: o.legs, back: o.back, curve: o.curve, arms: !!o.arms, stretchers: !!o.stretchers },
    dimensions: { width, depth, height, backHeight },
    /** Where a model sits: the seat's upper face. */
    seatSurface: { y: height, halfWidth: width / 2, halfDepth: depth / 2, shape: o.seat },
    frame: { center: [0, (height + backHeight) / 2, 0], radius: Math.hypot(width, height + backHeight, depth) / 2 * 1.15 },
    /** Sit a model (anything with a `group`, or an Object3D) on the seat. */
    place(model, { x = 0, z = 0, turn = 0 } = {}) {
      const object = model.group ?? model;
      object.position.set(x, height, z);
      object.rotation.y = turn;
      group.add(object);
      return object;
    },
  };
}

/** One of each kind in a row along x, `gap` metres apart. Gives { group, chairs }. */
export function createChairSet(GFX, options = {}) {
  const { gap = 0.3, kinds = KINDS, ...shared } = options;
  const group = new GFX.Group();
  group.name = 'chair set';
  const chairs = kinds.map((kind) => createWoodChair(GFX, { ...shared, kind }));
  const total = chairs.reduce((sum, c) => sum + c.dimensions.width, 0) + gap * (chairs.length - 1);
  let x = -total / 2;
  for (const c of chairs) {
    c.group.position.x = x + c.dimensions.width / 2;
    x += c.dimensions.width + gap;
    group.add(c.group);
  }
  return { group, chairs, frame: { center: [0, 0.5, 0], radius: total / 2 * 1.1 } };
}

const choices = (list, def) => Object.assign([...list], { default: def });
const OWN = "(kind's own)";

export const assetViewer = Object.freeze({
  id: 'wood-chair',
  name: 'Wood chairs (customizable set)',
  category: 'Props',
  group: 'furniture',
  options: {
    kind: choices(KINDS, 'dining'),
    species: choices(SPECIES, 'oak'),
    finish: choices(FINISHES, 'lacquered'),
    legs: choices([OWN, ...LEGS], OWN),
    back: choices([OWN, ...BACKS], OWN),
    seat: choices([OWN, ...SEATS], OWN),
    curve: choices([0, 0.04, 0.08, 0.12], 0),
  },
  build({ GFX, kind = 'dining', species = 'oak', finish = 'lacquered', legs, back, seat, curve = 0 }) {
    const own = (v) => (v && v !== OWN ? v : undefined);
    return createWoodChair(GFX, { kind, species, finish, legs: own(legs), back: own(back), seat: own(seat), curve: Number(curve) });
  },
});
