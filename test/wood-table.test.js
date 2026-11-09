import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { FINISHES, KINDS, LEGS, SHAPES, SPECIES, createTableSet, createWoodTable } from '../src/props/wood-table.js';

const named = (made, prefix) => made.group.children.filter((c) => c.name.startsWith(prefix));

test('every kind, species, finish, shape and leg style makes a table, and what is asked is checked', () => {
  for (const kind of KINDS) createWoodTable(GFX, { kind });
  for (const species of SPECIES) for (const finish of FINISHES) createWoodTable(GFX, { species, finish });
  for (const shape of SHAPES) for (const legs of LEGS) createWoodTable(GFX, { shape, legs, apron: true, shelf: true });
  assert.throws(() => createWoodTable(GFX, { kind: 'altar' }), /unknown kind/);
  assert.throws(() => createWoodTable(GFX, { species: 'balsa' }), /unknown species/);
  assert.throws(() => createWoodTable(GFX, { shape: 'star' }), /unknown shape/);
  assert.throws(() => createWoodTable(GFX, { legs: 'wheels' }), /unknown legs/);
  assert.throws(() => createWoodTable(GFX, { height: 4 }), /dimensions/);
});

test('a table has a top, four legs and the parts it was asked for', () => {
  const made = createWoodTable(GFX, { kind: 'console' });
  assert.equal(named(made, 'top').length, 1);
  assert.equal(named(made, 'leg ').length, 4);
  assert.equal(named(made, 'apron ').length, 4);
  assert.equal(named(made, 'shelf').length, 1);
  assert.equal(named(made, 'drawer front').length, 1);
  const bare = createWoodTable(GFX, { kind: 'dining', apron: false, shelf: false, drawer: false, legs: 'square' });
  assert.equal(named(bare, 'apron').length + named(bare, 'shelf').length + named(bare, 'drawer').length, 0);
});

test('measures can be changed, and the surface says where the top is', () => {
  const made = createWoodTable(GFX, { kind: 'desk', width: 2, depth: 0.8, height: 0.72, species: 'maple', finish: 'raw' });
  assert.deepEqual(made.dimensions, { width: 2, depth: 0.8, height: 0.72, topThickness: 0.035 });
  assert.equal(made.surface.y, 0.72);
  assert.deepEqual(made.wood, { species: 'maple', finish: 'raw', source: made.wood.source });
  const top = named(made, 'top')[0];
  assert.ok(Math.abs(top.position.y + 0.035 / 2 - 0.72) < 1e-9);
});

test('models stand on the top or the lower shelf, and a table with no shelf refuses', () => {
  const coffee = createWoodTable(GFX, { kind: 'coffee' });
  const thing = new GFX.Group();
  assert.equal(coffee.place(thing, { x: 0.1, z: -0.05, turn: 0.4 }), thing);
  assert.equal(thing.position.y, coffee.surface.y);
  const other = new GFX.Group();
  coffee.place(other, { onShelf: true });
  assert.equal(other.position.y, coffee.lowerShelf.y);
  assert.equal(coffee.placed.length, 2);
  coffee.clear();
  assert.equal(coffee.placed.length, 0);
  assert.throws(() => createWoodTable(GFX, { kind: 'dining' }).place(new GFX.Group(), { onShelf: true }), /no lower shelf/);
});

test('the set lines the kinds up without overlap', () => {
  const set = createTableSet(GFX);
  assert.equal(set.tables.length, KINDS.length);
  for (let i = 1; i < set.tables.length; i++) {
    const a = set.tables[i - 1], b = set.tables[i];
    assert.ok(b.group.position.x - b.dimensions.width / 2 > a.group.position.x + a.dimensions.width / 2);
  }
});

/** Pieces whose bounding boxes touch, joined up: a model that holds together is one. */
const pieces = (root) => {
  root.updateMatrixWorld(true);
  const boxes = [];
  root.traverse((m) => { if (m.isMesh) boxes.push(new GFX.Box3().setFromObject(m)); });
  const seen = new Set(); let count = 0;
  boxes.forEach((_, i) => {
    if (seen.has(i)) return;
    count++; const st = [i]; seen.add(i);
    while (st.length) { const k = st.pop(); boxes.forEach((b, j) => { if (!seen.has(j) && boxes[k].intersectsBox(b)) { seen.add(j); st.push(j); } }); }
  });
  return count;
};

test('every table holds together: no part floats free of the rest', () => {
  for (const kind of KINDS) for (const shape of SHAPES) for (const legs of LEGS) {
    assert.equal(pieces(createWoodTable(GFX, { kind, shape, legs, apron: true, shelf: true, drawer: true }).group), 1, `${kind}/${shape}/${legs}`);
  }
});
