import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as GFX from '../src/gfx/index.js';
import { DEFAULTS, FINISHES, SPECIES, WOOD_SOURCE, createBookcase } from '../src/props/bookcase.js';

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
  for (const species of SPECIES) for (const finish of FINISHES) createBookcase(GFX, { species, finish, featured: false });
  assert.throws(() => createBookcase(GFX, { species: 'balsa' }), /unknown species/);
  assert.throws(() => createBookcase(GFX, { finish: 'varnished' }), /unknown finish/);
  assert.throws(() => createBookcase(GFX, { shelves: 1 }), /shelves/);
  assert.throws(() => createBookcase(GFX, { width: 9 }), /dimensions/);
});

test('it is a carcass: two sides, a top, a bottom, a back, a plinth and a shelf between each compartment', () => {
  for (const shelves of [2, 5, 7]) {
    const made = createBookcase(GFX, { shelves, featured: false });
    assert.equal(made.compartments.length, shelves);
    assert.equal(named(made, 'shelf ').length, shelves - 1);
    for (const n of ['side left', 'side right', 'top', 'bottom', 'back', 'plinth']) assert.equal(named(made, n).length, 1, n);
    for (const c of made.compartments) assert.ok(c.y1 - c.y0 > 0.1 && c.x1 > c.x0);
  }
});

test('it stands on the floor, as tall and wide as it was asked, and its books are inside it', () => {
  const made = createBookcase(GFX, { width: 1.2, height: 2, depth: 0.36, featured: false });
  const all = bounds(made.group.children.find((c) => c.name === 'side left').geometry);
  assert.ok(Math.abs(all.hi[1] - all.lo[1] - (2 - 0.03)) < 1e-6);
  const books = bounds(made.group.children.find((c) => c.name === 'books').geometry);
  assert.ok(books.lo[0] > -0.6 + 0.022 - 1e-6 && books.hi[0] < 0.6 - 0.022 + 1e-6, 'between the sides');
  assert.ok(books.lo[1] >= 0.09 + 0.022 - 1e-6 && books.hi[1] <= 2 - 0.03 + 1e-6, 'between the bottom and the top');
  assert.ok(books.hi[2] <= 0.18 + 1e-6 && books.lo[2] > -0.18, 'not through the front or the back');
  // Each book stands in a compartment, none above its top.
  const P = made.group.children.find((c) => c.name === 'books').geometry.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) {
    const c = made.compartments.find((k) => P[i + 1] >= k.y0 - 1e-6 && P[i + 1] <= k.y1 + 1e-6);
    assert.ok(c, `a book vertex at y ${P[i + 1]} is not in any compartment`);
  }
});

test('the shelves can be set out again, and fuller or emptier', () => {
  const made = createBookcase(GFX, { featured: false });
  const count = () => made.group.children.find((c) => c.name === 'books').geometry.attributes.position.count;
  const full = count();
  made.reshelve({ seed: 99, fill: 0.2 });
  assert.ok(count() < full, 'fewer books');
  made.reshelve({ seed: 4, fill: 1 });
  assert.ok(count() > full * 0.8);
  made.reshelve({ fill: 0 });
  assert.equal(count(), 0);
});

test('the Book of Madness lies on top, and works', () => {
  const made = createBookcase(GFX, { height: 1.9 });
  assert.ok(made.book);
  assert.equal(made.book.group.position.y, 1.9);
  made.book.open();
  for (let i = 0; i < 90; i++) made.update(1 / 30);
  assert.equal(made.book.openness, 1);
  assert.equal(createBookcase(GFX, { featured: false }).book, null);
  assert.equal(DEFAULTS.featured, true);
});
