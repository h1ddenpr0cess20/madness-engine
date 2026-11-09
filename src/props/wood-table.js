/**
 * A set of customizable wood tables, built the way the bookcase is (props/bookcase.js): boards of one species
 * in one finish, textured in the world so the grain runs along each board, with the library's wood when
 * `textures/wood.js` is there and plain painted boards when it is not.
 *
 * `kind` picks a starting shape and size (dining, coffee, side, console, desk, bar); every measure, the top's
 * `shape` (rectangle, round, oval), the `legs` (square, tapered, turned, trestle), the `apron`, a lower `shelf`
 * and a `drawer` can be given to change it. `surface` says where the top is, so that models can be set on it.
 *
 * Coordinates are metres: the middle of the footprint on the floor, the long side along x, the front facing +z.
 *
 *   const table = createWoodTable(GFX, { kind: 'dining', species: 'oak', legs: 'turned' });
 *   table.place(someModel, { x: 0.2 });          // stood on the top
 */

import { FINISHES, SPECIES, mulberry, woodMaterial, woodUV, WOOD_SOURCE } from './bookcase.js';

export { FINISHES, SPECIES, WOOD_SOURCE };
export const KINDS = Object.freeze(['dining', 'coffee', 'side', 'console', 'desk', 'bar']);
export const SHAPES = Object.freeze(['rectangle', 'round', 'oval']);
export const LEGS = Object.freeze(['square', 'tapered', 'turned', 'trestle']);

/** The starting measures of each kind of table: outside, in metres. */
export const KIND_DEFAULTS = Object.freeze({
  dining: { shape: 'rectangle', legs: 'turned', width: 1.8, depth: 0.9, height: 0.76, apron: true, shelf: false, drawer: false },
  coffee: { shape: 'oval', legs: 'tapered', width: 1.1, depth: 0.6, height: 0.42, apron: false, shelf: true, drawer: false },
  side: { shape: 'round', legs: 'tapered', width: 0.5, depth: 0.5, height: 0.55, apron: true, shelf: false, drawer: false },
  console: { shape: 'rectangle', legs: 'square', width: 1.2, depth: 0.35, height: 0.8, apron: true, shelf: true, drawer: true },
  desk: { shape: 'rectangle', legs: 'square', width: 1.4, depth: 0.7, height: 0.75, apron: true, shelf: false, drawer: true },
  bar: { shape: 'round', legs: 'trestle', width: 0.8, depth: 0.8, height: 1.05, apron: false, shelf: false, drawer: false },
});

export const DEFAULTS = Object.freeze({
  kind: 'dining',
  species: 'oak',
  finish: 'lacquered',
  seed: 1,
  topThickness: 0.035,  // the top board's
  overhang: 0.05,       // how far the top stands out past the legs
});

const LEG = 0.06;       // a leg's thickness at the top
const APRON = 0.09;     // the rail under the top: how tall
const RAIL = 0.02;      // and how thick
const SHELF = 0.02;

export function createWoodTable(GFX, options = {}) {
  const kind = options.kind ?? DEFAULTS.kind;
  if (!KINDS.includes(kind)) throw new Error(`wood table: unknown kind "${kind}"`);
  const o = { ...DEFAULTS, ...KIND_DEFAULTS[kind], ...Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)), kind };
  if (!SPECIES.includes(o.species)) throw new Error(`wood table: unknown species "${o.species}"`);
  if (!FINISHES.includes(o.finish)) throw new Error(`wood table: unknown finish "${o.finish}"`);
  if (!SHAPES.includes(o.shape)) throw new Error(`wood table: unknown shape "${o.shape}"`);
  if (!LEGS.includes(o.legs)) throw new Error(`wood table: unknown legs "${o.legs}"`);
  if (!(o.width >= 0.3 && o.width <= 3.5 && o.depth >= 0.3 && o.depth <= 1.6 && o.height >= 0.3 && o.height <= 1.3)) throw new Error('wood table: dimensions outside supported ranges');
  const { width, depth, height, topThickness: T } = o;

  const group = new GFX.Group();
  group.name = `${kind} table`;
  const wood = woodMaterial(GFX, o.species, o.finish);
  const rand = mulberry(o.seed * 13 + 5);
  const jitter = (p) => [p[0] + rand() * 3.1, p[1] + rand() * 2.3, p[2] + rand() * 1.7];

  const add = (name, geometry, position, grain) => {
    woodUV(GFX, geometry, jitter(position), grain);
    const mesh = new GFX.Mesh(geometry, wood);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const board = (name, size, position, grain) => add(name, new GFX.BoxGeometry(...size), position, grain);

  /* ------------------------------ the top ------------------------------ */

  const yTop = height - T / 2;
  if (o.shape === 'rectangle') {
    board('top', [width, T + 0.002, depth], [0, yTop - 0.001, 0], 'x');   // 2 mm into what it sits on
  } else {
    const g = new GFX.CylinderGeometry(0.5, 0.5, T + 0.002, 64);
    g.scale(width, 1, depth);                       // round when width = depth, an oval when not
    g.computeVertexNormals();
    add('top', g, [0, yTop - 0.001, 0], 'x');
  }

  /* ------------------------------ the legs ----------------------------- */

  // Where the legs stand: inside the top by the overhang; for a round or oval top, on the ellipse's inscribed rectangle.
  const inset = o.shape === 'rectangle' ? o.overhang : o.overhang + 0.07 * Math.min(width, depth);
  const lx = width / 2 - inset - LEG / 2 - (o.shape === 'rectangle' ? 0 : width * 0.08);
  const lz = depth / 2 - inset - LEG / 2 - (o.shape === 'rectangle' ? 0 : depth * 0.08);
  const legHeight = height - T;
  const spots = [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]];

  if (o.legs === 'trestle') {
    // Two slab ends and a stretcher between them (a pedestal column and foot for a round top).
    if (o.shape === 'rectangle') {
      for (const s of [-1, 1]) {
        board(`trestle ${s < 0 ? 'left' : 'right'}`, [0.045, legHeight + 0.004, depth * 0.78], [s * lx, legHeight / 2 + 0.002, 0], 'y');
        board(`foot ${s < 0 ? 'left' : 'right'}`, [0.07, 0.06, depth * 0.92], [s * lx, 0.03, 0], 'y');
      }
      board('stretcher', [2 * lx, 0.07, 0.03], [0, legHeight * 0.72, 0], 'x');
    } else {
      const r = Math.min(width, depth) / 2;
      const col = new GFX.CylinderGeometry(0.045, 0.06, legHeight - 0.046, 24);
      add('pedestal', col, [0, 0.046 + (legHeight - 0.046) / 2, 0], 'y');
      add('foot', new GFX.CylinderGeometry(r * 0.6, r * 0.65, 0.05, 48), [0, 0.025, 0], 'x');
    }
  } else {
    spots.forEach(([x, z], i) => {
      const name = `leg ${i + 1}`;
      if (o.legs === 'square') {
        board(name, [LEG, legHeight, LEG], [x, legHeight / 2, z], 'y');
      } else if (o.legs === 'tapered') {
        const g = new GFX.CylinderGeometry(LEG * 0.71, LEG * 0.4, legHeight, 4, 1);   // a four-sided taper
        g.rotateY(Math.PI / 4);
        add(name, g, [x, legHeight / 2, z], 'y');
      } else {
        // Turned: a lathe profile of a plain square block at the top, then bead, vase and a slim foot.
        const profile = [[0.012, 0], [0.02, 0.0], [0.024, 0.04], [0.02, 0.08], [0.026, 0.16], [0.03, 0.26], [0.022, 0.4], [0.02, 0.55], [0.03, 0.7], [0.034, 0.78], [0.03, 0.82], [0.033, 0.86], [0.033, 1]]
          .map(([r, t]) => new GFX.Vector2(r * (LEG / 0.06), t * legHeight));
        add(name, new GFX.LatheGeometry(profile, 24), [x, 0, z], 'y');
      }
    });
  }

  /* --------------------- aprons, shelf and drawer ---------------------- */

  const topOfLegs = legHeight;
  if (o.apron && o.legs !== 'trestle') {
    const ax = 2 * lx, az = 2 * lz;
    board('apron front', [ax, APRON, RAIL], [0, topOfLegs - APRON / 2, lz - LEG / 2 + RAIL / 2], 'x');
    board('apron back', [ax, APRON, RAIL], [0, topOfLegs - APRON / 2, -lz + LEG / 2 - RAIL / 2], 'x');
    board('apron left', [RAIL, APRON, az], [-lx + LEG / 2 - RAIL / 2, topOfLegs - APRON / 2, 0], 'y');
    board('apron right', [RAIL, APRON, az], [lx - LEG / 2 + RAIL / 2, topOfLegs - APRON / 2, 0], 'y');
  }

  let shelfY = null;
  if (o.shelf && o.legs !== 'trestle') {
    shelfY = Math.min(0.18, legHeight * 0.3);
    board('shelf', [2 * lx, SHELF, 2 * lz], [0, shelfY, 0], 'x');
  }

  if (o.drawer && o.apron && o.legs !== 'trestle') {
    const dw = Math.min(2 * lx - LEG - 0.1, 0.7), dh = APRON - 0.02;
    const z = lz - LEG / 2 + RAIL / 2;
    board('drawer front', [dw, dh, 0.022], [0, topOfLegs - APRON / 2, z + 0.012], 'x');
    const knob = new GFX.Mesh(new GFX.SphereGeometry(0.014, 16, 12), wood);
    knob.name = 'drawer knob';
    knob.position.set(0, topOfLegs - APRON / 2, z + 0.034);
    group.add(knob);
  }

  /* ------------------------ what stands on it -------------------------- */

  const placed = [];
  const api = {
    group,
    material: wood,
    wood: { species: o.species, finish: o.finish, source: WOOD_SOURCE },
    options: { kind, shape: o.shape, legs: o.legs, apron: !!o.apron, shelf: !!o.shelf, drawer: !!o.drawer },
    dimensions: { width, depth, height, topThickness: T },
    /** The top's upper face: its height and extent (a half-width and half-depth of the board or ellipse). */
    surface: { y: height, halfWidth: width / 2, halfDepth: depth / 2, shape: o.shape },
    /** The lower shelf's upper face, or null. */
    lowerShelf: shelfY === null ? null : { y: shelfY + SHELF / 2, halfWidth: lx, halfDepth: lz },
    frame: { center: [0, height / 2, 0], radius: Math.hypot(width, height, depth) / 2 * 1.1 },
    get placed() { return placed.slice(); },

    /** Stand a model (anything with a `group`, or an Object3D) on the top at x, z from its middle, turned `turn`. */
    place(model, { x = 0, z = 0, turn = 0, onShelf = false } = {}) {
      const base = onShelf ? api.lowerShelf : api.surface;
      if (!base) throw new Error('wood table: no lower shelf');
      const object = model.group ?? model;
      object.position.set(x, base.y, z);
      object.rotation.y = turn;
      group.add(object);
      placed.push({ object, model });
      return object;
    },

    clear() {
      for (const { object } of placed) group.remove(object);
      placed.length = 0;
      return api;
    },

    update(dt) { for (const { model } of placed) model.update?.(dt); },
  };
  return api;
}

/** One of each kind, in a row along x, `gap` metres apart, for a showroom. Gives { group, tables }. */
export function createTableSet(GFX, options = {}) {
  const { gap = 0.4, kinds = KINDS, ...shared } = options;
  const group = new GFX.Group();
  group.name = 'table set';
  const tables = kinds.map((kind) => createWoodTable(GFX, { ...shared, kind }));
  const total = tables.reduce((sum, t) => sum + t.dimensions.width, 0) + gap * (tables.length - 1);
  let x = -total / 2;
  for (const t of tables) {
    t.group.position.x = x + t.dimensions.width / 2;
    x += t.dimensions.width + gap;
    group.add(t.group);
  }
  return { group, tables, frame: { center: [0, 0.5, 0], radius: total / 2 * 1.05 } };
}

const choices = (list, def) => Object.assign([...list], { default: def });

export const assetViewer = Object.freeze({
  id: 'wood-table',
  name: 'Wood tables (customizable set)',
  category: 'Props',
  group: 'furniture',
  options: {
    kind: choices(KINDS, 'dining'),
    species: choices(SPECIES, 'oak'),
    finish: choices(FINISHES, 'lacquered'),
    shape: choices(['(kind\'s own)', ...SHAPES], '(kind\'s own)'),
    legs: choices(['(kind\'s own)', ...LEGS], '(kind\'s own)'),
  },
  build({ GFX, kind = 'dining', species = 'oak', finish = 'lacquered', shape, legs }) {
    const own = (v) => (v && !v.startsWith('(') ? v : undefined);
    return createWoodTable(GFX, { kind, species, finish, shape: own(shape), legs: own(legs) });
  },
});
