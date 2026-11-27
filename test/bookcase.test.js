import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as GFX from '../src/gfx/index.js';
import { createBook } from '../src/props/book.js';
import { FINISHES, SPECIES, WOOD_SOURCE, createBookcase, stockBooks } from '../src/props/bookcase.js';

const bounds = (geometry) => {
  const P = geometry.attributes.position.array;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i + k]); hi[k] = Math.max(hi[k], P[i + k]); }
  return { lo, hi };
};
const named = (made, prefix) => made.group.children.filter((c) => c.name.startsWith(prefix));

test('it uses the wood library when the tree has it, and plain boards when it does not', () => {
  const there = existsSync(fileURLToPath(new URL('../src/textures/wood.js', import.meta.url)));
  assert.equal(WOOD_SOURCE, there ? 'library' : 'plain');
  assert.ok(SPECIES.includes('walnut'));
  const made = createBookcase(GFX, { species: 'walnut', finish: 'lacquered' });
  assert.deepEqual(made.wood, { species: 'walnut', finish: 'lacquered', source: WOOD_SOURCE });
  assert.equal(made.material.clearcoat, 1);
  assert.ok(made.material.name.includes('walnut'));
});

test('every species and finish makes a case, and what is asked of it is checked', () => {
  for (const species of SPECIES) for (const finish of FINISHES) createBookcase(GFX, { species, finish });
  assert.throws(() => createBookcase(GFX, { species: 'balsa' }), /unknown species/);
  assert.throws(() => createBookcase(GFX, { finish: 'varnished' }), /unknown finish/);
  assert.throws(() => createBookcase(GFX, { shelves: 1 }), /shelves/);
  assert.throws(() => createBookcase(GFX, { width: 9 }), /dimensions/);
});

test('it is a carcass: two sides, a top, a bottom, a back, a plinth and a shelf between each compartment', () => {
  for (const shelves of [2, 5, 7]) {
    const made = createBookcase(GFX, { shelves });
    assert.equal(made.compartments.length, shelves);
    assert.equal(named(made, 'shelf ').length, shelves - 1);
    for (const n of ['side left', 'side right', 'top', 'bottom', 'back', 'plinth']) assert.equal(named(made, n).length, 1, n);
    for (const c of made.compartments) assert.ok(c.y1 - c.y0 > 0.1 && c.x1 > c.x0);
  }
});

test('it is empty: boards and nothing else, and it says where each shelf\'s space is', () => {
  const made = createBookcase(GFX, { width: 1.2, height: 2, depth: 0.36 });
  assert.equal(made.placed.length, 0);
  assert.ok(made.group.children.every((c) => !/book/i.test(c.name)));
  const side = bounds(made.group.children.find((c) => c.name === 'side left').geometry);
  assert.ok(Math.abs(side.hi[1] - side.lo[1] - (2 - 0.03)) < 1e-6);
  for (const c of made.compartments) assert.ok(c.x1 - c.x0 > 1 && c.y1 > c.y0 && c.z1 > c.z0);
});

/** A small real Book, for a shelf. */
const aBook = (options = {}) => createBook(GFX, { pageCount: 16, size: 0.55, deferPages: true, bump: false, textureSize: 1024, ...options });

test('a real Book stands on a shelf spine out, in its compartment, and shows the spine it was painted with', () => {
  const made = createBookcase(GFX);
  const book = aBook({ title: 'Concerning Teeth' });
  const put = made.standBook(book, { compartment: 1 });
  assert.ok(put, 'it fits');
  const c = made.compartments[1];
  // Its geometry, in the world, lies inside the compartment: standing on the shelf, head up, spine at the front.
  book.group.updateMatrixWorld(true);
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const v = new GFX.Vector3();
  const P = book.cover.geometry.attributes.position;
  for (let i = 0; i < P.count; i++) {
    v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(book.group.matrixWorld);
    const w = [v.x, v.y, v.z];
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); }
  }
  assert.ok(Math.abs(lo[1] - c.y0) < 1e-4, `it stands on the shelf (${lo[1]} vs ${c.y0})`);
  assert.ok(hi[1] < c.y1, 'under the shelf above');
  assert.ok(lo[0] >= c.x0 - 1e-4 && hi[0] <= c.x1, 'between the sides');
  assert.ok(lo[2] > c.z0 && hi[2] <= c.z1, 'inside the case, not through the front');
  // The spine is the part nearest the front: the cover's spine panel is at the front-most z.
  const spineZ = hi[2];
  assert.ok(spineZ > c.z1 - 0.03, 'the spine is out at the front');
  assert.ok(hi[1] - lo[1] > 0.2 && hi[0] - lo[0] < 0.1, 'taller than it is thick');
  assert.equal(made.placed.length, 1);
});

test('books go along a shelf, then the next, and those with no room are given back', () => {
  const made = createBookcase(GFX, { width: 0.6, shelves: 2 });
  const books = stockBooks(60, 5).map((o) => aBook(o));
  const { placed, left } = made.shelve(books);
  assert.ok(placed.length >= 6 && left.length > 0, `${placed.length} placed, ${left.length} left`);
  assert.equal(placed.length + left.length, 60);
  // On each shelf they stand side by side, none over another.
  for (let i = 0; i < 2; i++) {
    const row = made.placed.filter((p) => p.compartment === i).map((p) => p.object.position.x).sort((a, b) => a - b);
    for (let k = 1; k < row.length; k++) assert.ok(row[k] - row[k - 1] > 0.006, 'books do not overlap');
  }
  made.clear();
  assert.equal(made.placed.length, 0);
});

test('a book too tall for a shelf is refused, and anything else can be placed where it is asked', () => {
  const made = createBookcase(GFX, { shelves: 5 });
  assert.equal(made.standBook(aBook({ size: 1.5 }), { compartment: 0 }), null);
  const thing = new GFX.Group();
  const out = made.place(thing, { compartment: 2, x: 0.1, turn: 0.5 });
  assert.equal(out, thing);
  assert.equal(out.position.y, made.compartments[2].y0);
  assert.equal(out.position.x, 0.1);
  assert.throws(() => made.place(thing, { compartment: 9 }), /no compartment/);
});

test('it can be given a stock of real books to begin with, and they move on with it', () => {
  const made = createBookcase(GFX, { books: 8, seed: 2 });
  assert.ok(made.placed.length >= 6);
  assert.ok(made.placed.every((p) => p.model.cover && p.model.dimensions.closed));
  assert.equal(stockBooks(3)[0].title, 'Book of Madness');
  made.placed[0].model.open();
  for (let i = 0; i < 5; i++) made.update(1 / 30);
  assert.ok(made.placed[0].model.openness > 0);
});

test('shelve can spread the books over the shelves, not fill the first', () => {
  const made = createBookcase(GFX, { shelves: 4 });
  const { placed } = made.shelve(stockBooks(12, 3).map((o) => aBook(o)), { spread: true });
  assert.equal(placed.length, 12);
  const per = [0, 1, 2, 3].map((i) => made.placed.filter((p) => p.compartment === i).length);
  assert.deepEqual(per, [3, 3, 3, 3]);
});
