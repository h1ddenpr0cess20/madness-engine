/**
 * A bookcase: a carcass of boards (sides, top, bottom, shelves, back, and a
 * plinth), shelves of books, and, lying on the top, the Book of Madness
 * (props/book.js), which opens and turns its pages.
 *
 * The wood is the library's (`textures/wood.js`: `woodTexture`, one repeat of
 * a map a metre of board, the grain running along each board) when that file
 * is there, and plain painted boards in the same species' colours when it is
 * not. It is looked for when this file loads, so a tree that gains the wood
 * library gains the grain here with no change: `WOOD_SOURCE` says which it
 * has, 'library' or 'plain'.
 *
 * The books are one mesh of vertex-coloured boxes, spines out, gilt bands on
 * the spines, a few leaning; `reshelve({ seed, fill })` sets them out again.
 * Coordinates are metres: the middle of the footprint on the floor, the front
 * of the case facing +z, the books standing at its front a little way in.
 *
 *   const { group, book, compartments, reshelve, update } = createBookcase(GFX, { species: 'walnut' });
 */

import { linearRGB } from '../color.js';
import { createBook } from './book.js';

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
  fill: 0.9,            // how full the shelves are, 0 to 1
  seed: 3,
  featured: true,       // the Book of Madness on top
  book: {},             // createBook options for it
});

const BOARD = 0.022;    // a board's thickness
const CROWN = 0.03;     // the top board's
const PLINTH = 0.09;
const BACK = 0.008;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
/* the books                                                           */
/* ------------------------------------------------------------------ */

const SPINES = ['#3a0d14', '#131114', '#10192e', '#18271d', '#2b1741', '#3b3b41', '#5b2b15', '#7a5a3a', '#6a2b2b', '#2f3a2f', '#8a6d3b', '#c8baa0', '#4a2a3a', '#23313f'];
const GILT = linearRGB('#c4a050');
const LABEL = linearRGB('#e6d6b4');

/** One geometry for every book: boxes of vertex colour, spines to +z. */
function bookGeometry(GFX, { compartments, front, depth, seed, fill }) {
  const rand = mulberry(seed);
  const pos = [], nor = [], col = [], idx = [];
  const box = (size, at, colour, lean = 0) => {
    const g = new GFX.BoxGeometry(...size);
    if (lean) g.rotateZ(lean);
    g.translate(...at);
    const base = pos.length / 3;
    const P = g.attributes.position.array, N = g.attributes.normal.array, I = g.index.array;
    for (let i = 0; i < P.length; i += 3) { pos.push(P[i], P[i + 1], P[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); col.push(colour[0], colour[1], colour[2]); }
    for (let i = 0; i < I.length; i++) idx.push(I[i] + base);
  };
  for (const c of compartments) {
    const room = c.y1 - c.y0;
    let x = c.x0 + rand() * 0.012;
    let last = null;
    while (x < c.x1 - 0.02) {
      if (rand() > fill) { x += 0.025 + rand() * 0.05; continue; }
      const w = 0.022 + rand() * 0.04;
      if (x + w > c.x1) break;
      const h = Math.min(room - 0.025, room * (0.6 + rand() * 0.32));
      const d = Math.min(0.3, depth) * (0.72 + rand() * 0.28);
      const z = front - rand() * 0.014;
      const colour = linearRGB(SPINES[(rand() * SPINES.length) | 0]);
      box([w, h, d], [x + w / 2, c.y0 + h / 2, z - d / 2], colour);
      // Gilt bands on the spine, and on a stout one a label.
      const bands = 2 + ((rand() * 3) | 0);
      for (let b = 0; b < bands; b++) {
        const at = b < bands / 2 ? 0.1 + b * 0.06 : 0.9 - (bands - 1 - b) * 0.06;
        box([w + 0.002, 0.004, 0.003], [x + w / 2, c.y0 + h * at, z + 0.0008], GILT);
      }
      if (w > 0.034) box([w * 0.62, Math.min(0.06, h * 0.22), 0.003], [x + w / 2, c.y0 + h * 0.62, z + 0.0008], LABEL);
      last = { x: x + w, h };
      x += w + 0.001 + rand() * 0.003;
    }
    // A book left leaning on the last of them, where there is room.
    if (last && c.x1 - last.x > 0.07 && rand() < 0.7) {
      const w = 0.03 + rand() * 0.02, h = room * (0.6 + rand() * 0.25), lean = -0.2 - rand() * 0.12;
      const d = Math.min(0.3, depth) * 0.8;
      const cx = last.x + 0.012 + (h / 2) * Math.sin(-lean) + w / 2 * Math.cos(lean);
      if (cx + w < c.x1) box([w, h, d], [cx, c.y0 + (h / 2) * Math.cos(lean) + (w / 2) * Math.sin(-lean), front - d / 2 - 0.01], linearRGB(SPINES[(rand() * SPINES.length) | 0]), lean);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new GFX.Float32BufferAttribute(nor, 3));
  geometry.setAttribute('color', new GFX.Float32BufferAttribute(col, 3));
  geometry.setIndex(idx);
  return geometry;
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

  // The books.
  const booksMaterial = new GFX.MeshStandardMaterial({ name: 'book spines', vertexColors: true, roughness: 0.78, metalness: 0 });
  const booksMesh = new GFX.Mesh(new GFX.BufferGeometry(), booksMaterial);
  booksMesh.name = 'books';
  booksMesh.castShadow = booksMesh.receiveShadow = true;
  group.add(booksMesh);
  const shelve = ({ seed = o.seed, fill = o.fill } = {}) => {
    booksMesh.geometry.dispose?.();
    booksMesh.geometry = bookGeometry(GFX, { compartments, front: depth / 2 - 0.022, depth: depth - BACK - 0.05, seed, fill: clamp(fill, 0, 1) });
  };
  shelve();

  // The Book of Madness, lying on top.
  let book = null;
  if (o.featured) {
    book = createBook(GFX, { pageCount: 40, size: 0.5, ...o.book });
    book.group.position.set(-width * 0.12, height, 0.01);
    book.group.rotation.y = 0.35;
    group.add(book.group);
  }

  return {
    group,
    book,
    compartments,
    material: wood,
    booksMaterial,
    wood: { species: o.species, finish: o.finish, source: WOOD_SOURCE },
    dimensions: { width, height, depth, shelves, shelfSpace: space },
    /** Set the books out again: `seed` for which, `fill` (0 to 1) for how many. */
    reshelve: shelve,
    /** Once a frame: the Book of Madness. */
    update(dt) { book?.update(dt); },
    frame: { center: [0, height / 2, 0], radius: Math.hypot(width, height, depth) / 2 * 1.05 },
  };
}

const choices = (list, def) => Object.assign([...list], { default: def });

export const assetViewer = Object.freeze({
  id: 'bookcase',
  name: 'Bookcase (wood, books, the Book of Madness)',
  category: 'Props',
  group: 'furniture',
  options: {
    species: choices(SPECIES, 'walnut'),
    finish: choices(FINISHES, 'lacquered'),
    shelves: choices([3, 4, 5, 6, 7], 5),
    width: choices([0.7, 1.0, 1.4, 1.8], 1.0),
  },
  build({ GFX, species = 'walnut', finish = 'lacquered', shelves = 5, width = 1.0 }) {
    const made = createBookcase(GFX, { species, finish, shelves, width });
    let seed = 3;
    let fill = DEFAULTS.fill;
    const b = made.book;
    return Object.assign(made, {
      ui: [
        { type: 'buttons', items: [
          { label: 'Open book', onClick: () => b.open() }, { label: 'Close', onClick: () => b.close() },
          { label: '◀ Page', onClick: () => b.prev() }, { label: 'Page ▶', onClick: () => b.next() },
        ] },
        { type: 'range', label: 'Shelves full', min: 0, max: 1, step: 0.05, get: () => fill, set: (v) => { fill = v; made.reshelve({ seed, fill }); } },
        { type: 'buttons', items: [{ label: 'Reshelve', onClick: () => made.reshelve({ seed: ++seed, fill }) }] },
        { type: 'text', label: 'Book title', get: () => b.style.title, set: (v) => b.setStyle({ title: v }) },
      ],
      click: (hit) => { if (hit.object.parent === b.group || hit.object.parent?.parent === b.group) b.touch(b.group.worldToLocal(hit.point.clone()).x); },
      key: (k) => (k === 'ArrowRight' ? (b.next(), true) : k === 'ArrowLeft' ? (b.prev(), true) : false),
    });
  },
});
