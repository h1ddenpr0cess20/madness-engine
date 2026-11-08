/**
 * A bookcase: a carcass of boards (sides, top, bottom, shelves, back, and a
 * plinth) and nothing on it. The shelves are for models: `compartments` says
 * where each one's space is, and `place`, `standBook` and `shelve` put things
 * in it, among them real Book models (props/book.js) stood spine out, which
 * show the spine they were painted with.
 *
 * The wood is the library's (`textures/wood.js`: `woodTexture`, one repeat of
 * a map a metre of board, the grain running along each board) when that file
 * is there, and plain painted boards in the same species' colours when it is
 * not. It is looked for when this file loads, so a tree that gains the wood
 * library gains the grain here with no change: `WOOD_SOURCE` says which it
 * has, 'library' or 'plain'.
 *
 * Coordinates are metres: the middle of the footprint on the floor, the front
 * of the case facing +z.
 *
 *   const case_ = createBookcase(GFX, { species: 'walnut', shelves: 5 });
 *   case_.shelve(stockBooks(12).map((o) => createBook(GFX, o)));   // real books, spine out, row after row
 *   case_.place(someModel, { compartment: 2, x: 0.1 });            // anything else, where you say
 *   // or, to be given some: createBookcase(GFX, { books: 12 })
 */

import { createBook } from './book.js';
import { CLOTHS, EMBLEMS, FOILS, TRIMS } from './book-art.js';

// The wood library, if this tree has it (the path is held in a variable so that nothing needs it to be there).
const WOOD_LIBRARY = '../textures/wood.js';
let library = null;
try { library = await import(/* @vite-ignore */ WOOD_LIBRARY); } catch { library = null; }

/** Where the wood comes from: 'library' (textures/wood.js) or 'plain' (painted colours). */
export const WOOD_SOURCE = library ? 'library' : 'plain';

/** The colours of a plain board, by species: the same names as the library's. */
const PLAIN = Object.freeze({
  walnut: '#8a5f3b', oak: '#a9793f', mahogany: '#6b3a2c', maple: '#d8b98a', cherry: '#a8603f', ash: '#cf8b4a', pine: '#d4a96a', teak: '#9c6b37',
});

export const SPECIES = Object.freeze(library ? Object.keys(library.WOOD_SPECIES) : Object.keys(PLAIN));
export const FINISHES = Object.freeze(['raw', 'sanded', 'lacquered']);

const FINISH = Object.freeze({
  raw: { roughness: 0.82, clearcoat: 0, bumpScale: 0.035 },
  sanded: { roughness: 0.5, clearcoat: 0, bumpScale: 0.02 },
  lacquered: { roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06, bumpScale: 0.012 },
});

export const DEFAULTS = Object.freeze({
  species: 'walnut',
  finish: 'lacquered',
  width: 1.0,           // outside, side to side
  height: 1.9,
  depth: 0.34,
  shelves: 5,           // compartments, counting the top one and the bottom one
  books: 0,             // real books to stand on it to begin with (stockBooks); 0 is an empty case
  seed: 1,              // which books
});

const BOARD = 0.022;    // a board's thickness
const CROWN = 0.03;     // the top board's
const PLINTH = 0.09;
const BACK = 0.008;

function mulberry(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A board's material: the species in the finish, from the library's maps (or a plain colour). */
function woodMaterial(GFX, species, finish) {
  const maps = library ? library.woodTexture(GFX, species, finish) : { map: null, bump: null };
  const material = new GFX.MeshPhysicalMaterial({
    name: `${finish} ${species}`,
    color: maps.map ? '#ffffff' : PLAIN[species] ?? PLAIN.walnut,
    map: maps.map,
    bumpMap: maps.bump,
    metalness: 0,
    ...FINISH[finish],
  });
  return material;
}

/**
 * A box's texture coordinates from where it is in the world, one repeat a
 * metre, the grain running along `grain` ('x' for a shelf, 'y' for a side),
 * with `jitter` so that two boards of one species are not the same board.
 */
function woodUV(GFX, geometry, offset, grain) {
  const p = geometry.attributes.position, n = geometry.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + offset[0], y = p.getY(i) + offset[1], z = p.getZ(i) + offset[2];
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (grain === 'x') {
      if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    } else if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = y; v = z; } else { u = y; v = x; }
    uv[2 * i] = u;
    uv[2 * i + 1] = v;
  }
  geometry.setAttribute('uv', new GFX.BufferAttribute(uv, 2));
}

/* ------------------------------------------------------------------ */
/* books to put on it                                                  */
/* ------------------------------------------------------------------ */

const TITLES = ['Book of Madness', 'The Whispering Walls', 'Concerning Teeth', 'A Grammar of Knots', 'The Drowned Almanac', 'Lesser Hours', 'On Candles', 'The Tenant of the Left Ear', 'Index of Things Not Said', 'Vigil', 'The Salt Codex', 'Notes Toward a Door', 'Of Stairs', 'The Long Table'];

/**
 * Options for `n` different books to stand on a shelf (give each to `createBook`): titles, cloths, foils and
 * emblems, in a spread of thicknesses and heights, made light for a shelf (a small picture, pages written
 * only when one is opened). The first is always the Book of Madness.
 */
export function stockBooks(n, seed = 1) {
  const rand = mulberry(seed * 31 + 7);
  const pick = (list) => list[(rand() * list.length) | 0];
  const cloths = Object.values(CLOTHS), foils = Object.values(FOILS);
  return Array.from({ length: n }, (_, i) => ({
    title: i === 0 ? TITLES[0] : TITLES[(1 + ((rand() * (TITLES.length - 1)) | 0)) % TITLES.length],
    subtitle: '',
    cloth: i === 0 ? CLOTHS.oxblood : pick(cloths),
    foil: i === 0 ? FOILS['aged gold'] : pick(foils),
    emblem: pick(EMBLEMS),
    trim: pick(TRIMS),
    drips: rand() < 0.25,
    pageCount: pick([8, 12, 16, 24, 32, 40]),
    size: 0.52 + rand() * 0.1,
    textureSize: 1024,
    bump: false,
    deferPages: true,
  }));
}

/* ------------------------------------------------------------------ */

export function createBookcase(GFX, options = {}) {
  const o = { ...DEFAULTS, ...options };
  if (!SPECIES.includes(o.species)) throw new Error(`bookcase: unknown species "${o.species}"`);
  if (!FINISHES.includes(o.finish)) throw new Error(`bookcase: unknown finish "${o.finish}"`);
  const shelves = Math.round(o.shelves);
  if (!(shelves >= 2 && shelves <= 10)) throw new Error('bookcase: shelves must be 2 to 10');
  if (!(o.width >= 0.5 && o.width <= 2.4 && o.height >= 0.8 && o.height <= 3 && o.depth >= 0.2 && o.depth <= 0.6)) throw new Error('bookcase: dimensions outside supported ranges');
  const { width, height, depth } = o;

  const group = new GFX.Group();
  group.name = 'bookcase';
  const wood = woodMaterial(GFX, o.species, o.finish);
  const rand = mulberry(o.seed * 7 + 1);

  /** A board, textured in the world with the grain along `grain`. */
  const board = (name, size, position, grain) => {
    const geometry = new GFX.BoxGeometry(...size);
    woodUV(GFX, geometry, [position[0] + rand() * 3.1, position[1] + rand() * 2.3, position[2] + rand() * 1.7], grain);
    const mesh = new GFX.Mesh(geometry, wood);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const inner = width - 2 * BOARD;                       // between the sides
  const body = height - CROWN;                           // sides run to the underside of the top
  const yFloor = PLINTH + BOARD;                         // the top of the bottom board
  const yCeil = body;                                    // the underside of the top
  const zBack = -depth / 2 + BACK;                       // the face of the back panel
  const shelfDepth = depth - BACK - 0.012;
  const shelfZ = (zBack + depth / 2 - 0.012) / 2;

  board('side left', [BOARD, body, depth], [-width / 2 + BOARD / 2, body / 2, 0], 'y');
  board('side right', [BOARD, body, depth], [width / 2 - BOARD / 2, body / 2, 0], 'y');
  board('top', [width + 0.04, CROWN, depth + 0.03], [0, height - CROWN / 2, 0.015], 'x');
  board('bottom', [inner, BOARD, shelfDepth], [0, PLINTH + BOARD / 2, shelfZ], 'x');
  board('plinth', [inner, PLINTH, BOARD], [0, PLINTH / 2, depth / 2 - 0.03], 'x');
  board('back', [inner, body - PLINTH, BACK], [0, PLINTH + (body - PLINTH) / 2, -depth / 2 + BACK / 2], 'y');

  const space = (yCeil - yFloor - (shelves - 1) * BOARD) / shelves;
  const compartments = [];
  for (let i = 0; i < shelves; i++) {
    const y0 = yFloor + i * (space + BOARD);
    compartments.push({ x0: -inner / 2 + 0.01, x1: inner / 2 - 0.01, y0, y1: y0 + space, z0: zBack, z1: depth / 2 - 0.012 });
    if (i < shelves - 1) board(`shelf ${i + 1}`, [inner, BOARD, shelfDepth], [0, y0 + space + BOARD / 2, shelfZ], 'x');
  }

  /* ------------------------- what stands on it ------------------------- */

  const placed = [];
  const cursor = compartments.map((c) => c.x0 + 0.006);
  const front = depth / 2 - 0.012 - 0.015;             // where a spine stands: just inside the front of the shelf
  // A book stands spine to the front, its front cover to the right, its head up: the book's own x (spine to
  // fore-edge) runs to -z, its z (head to tail) to -y, and its y (back cover to front) to +x.
  const STAND = new GFX.Matrix4().set(0, 1, 0, 0, 0, 0, -1, 0, -1, 0, 0, 0, 0, 0, 0, 1);

  /** Why a book will not stand at x in this compartment (or null if it will), with the place it would stand. */
  const fit = (book, i, x) => {
    const c = compartments[i];
    const s = book.group.scale.x;
    const { min, max } = book.dimensions.closed;
    const thick = (max[1] - min[1]) * s, tall = (max[2] - min[2]) * s, deep = (max[0] - min[0]) * s;
    if (tall > c.y1 - c.y0 - 0.01) return { reason: 'height' };
    if (deep > front - c.z0 - 0.005) return { reason: 'depth' };
    if (x + thick > c.x1) return { reason: 'width' };
    return { position: [x - min[1] * s, c.y0 + max[2] * s, front + min[0] * s], x0: x, x1: x + thick };
  };

  const api = {
    group,
    compartments,
    material: wood,
    wood: { species: o.species, finish: o.finish, source: WOOD_SOURCE },
    dimensions: { width, height, depth, shelves, shelfSpace: space },
    frame: { center: [0, height / 2, 0], radius: Math.hypot(width, height, depth) / 2 * 1.05 },
    /** Everything put on the shelves: [{ object, model, compartment }]. */
    get placed() { return placed.slice(); },

    /**
     * Put a model on a shelf: `compartment` (0 the lowest), `x` and `z` where its origin stands (x from the middle
     * of the case; z from the middle, default the middle of the shelf), turned `turn` radians about the vertical.
     * The origin is taken to be the model's base; the model is anything with a `group` or an Object3D.
     */
    place(model, { compartment = 0, x = 0, z = null, turn = 0 } = {}) {
      const c = compartments[compartment];
      if (!c) throw new Error(`bookcase: no compartment ${compartment}`);
      const object = model.group ?? model;
      object.position.set(x, c.y0, z ?? (c.z0 + c.z1) / 2);
      object.rotation.y = turn;
      group.add(object);
      placed.push({ object, model, compartment });
      return object;
    },

    /**
     * Stand a Book model on a shelf, spine out: at `x` (its left edge) or after the last book put there. Gives
     * { object, x0, x1 } where it stands, or null where it does not fit (too tall, too deep, or the shelf is full).
     */
    standBook(book, { compartment = 0, x = null } = {}) {
      if (!compartments[compartment]) throw new Error(`bookcase: no compartment ${compartment}`);
      const at = fit(book, compartment, x ?? cursor[compartment]);
      if (!at.position) return null;
      const object = book.group;
      object.quaternion.setFromRotationMatrix(STAND);
      object.position.set(...at.position);
      group.add(object);
      placed.push({ object, model: book, compartment });
      cursor[compartment] = Math.max(cursor[compartment], at.x1 + 0.002);
      return { object, x0: at.x0, x1: at.x1 };
    },

    /**
     * Stand books on the shelves one after another, from `compartment` up: along a shelf until it is full, then
     * the next; or with `spread`, the same number on each shelf from there up. Gives { placed, left }: those
     * that stood, and those there was no room for.
     */
    shelve(books, { compartment = 0, spread = false } = {}) {
      const done = [], left = [];
      const per = spread ? Math.ceil(books.length / (compartments.length - compartment)) : Infinity;
      let on = 0;
      for (const book of books) {
        if (on >= per && compartment < compartments.length - 1) { compartment++; on = 0; }
        let i = compartment, put = null;
        for (; i < compartments.length && !put; i++) {
          const at = fit(book, i, cursor[i]);
          if (at.position) put = api.standBook(book, { compartment: i });
        }
        if (put) { done.push(book); if (i - 1 !== compartment) { compartment = i - 1; on = 0; } on++; } else left.push(book);
      }
      return { placed: done, left };
    },

    /** Take everything off the shelves. */
    clear() {
      for (const { object } of placed) group.remove(object);
      placed.length = 0;
      cursor.forEach((_, i) => { cursor[i] = compartments[i].x0 + 0.006; });
      return api;
    },

    /** Once a frame: whatever stands on it that moves (a Book that is opened). */
    update(dt) { for (const { model } of placed) model.update?.(dt); },
  };

  if (o.books > 0) api.shelve(stockBooks(o.books, o.seed).map((b) => createBook(GFX, b)), { spread: true });
  return api;
}

const choices = (list, def) => Object.assign([...list], { default: def });

export const assetViewer = Object.freeze({
  id: 'bookcase',
  name: 'Bookcase (wood shelves for books)',
  category: 'Props',
  group: 'furniture',
  options: {
    species: choices(SPECIES, 'walnut'),
    finish: choices(FINISHES, 'lacquered'),
    shelves: choices([3, 4, 5, 6, 7], 5),
    width: choices([0.7, 1.0, 1.4, 1.8], 1.0),
    books: choices([0, 6, 12, 24], 12),
  },
  build({ GFX, species = 'walnut', finish = 'lacquered', shelves = 5, width = 1.0, books = 12 }) {
    const made = createBookcase(GFX, { species, finish, shelves, width, books });
    let seed = 1;
    let title = 'The Hours of the Left Ear';
    const stock = (n) => made.shelve(stockBooks(n, ++seed).map((b) => createBook(GFX, b)), { spread: true });
    return Object.assign(made, {
      ui: [
        { type: 'buttons', items: [
          { label: 'Restock', title: 'Clear the shelves and stand new books on them', onClick: () => { made.clear(); stock(books || 12); } },
          { label: 'Empty', onClick: () => made.clear() },
        ] },
        { type: 'text', label: 'New book', get: () => title, set: (v) => { title = v; } },
        { type: 'buttons', items: [
          { label: 'Add this book', onClick: () => {
            const o = { ...stockBooks(1, ++seed)[0], title };
            const book = createBook(GFX, o);
            for (let i = 0; i < made.compartments.length; i++) if (made.standBook(book, { compartment: i })) return;
          } },
        ] },
      ],
    });
  },
});
