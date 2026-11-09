import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { BACKS, FINISHES, KINDS, LEGS, SEATS, SPECIES, createChairSet, createWoodChair } from '../src/props/wood-chair.js';

const named = (made, prefix) => made.group.children.filter((c) => c.name.startsWith(prefix));

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

test('every kind, species, finish, seat, leg and back makes a chair, and what is asked is checked', () => {
  for (const kind of KINDS) createWoodChair(GFX, { kind });
  for (const species of SPECIES) for (const finish of FINISHES) createWoodChair(GFX, { species, finish });
  assert.throws(() => createWoodChair(GFX, { kind: 'throne' }), /unknown kind/);
  assert.throws(() => createWoodChair(GFX, { species: 'balsa' }), /unknown species/);
  assert.throws(() => createWoodChair(GFX, { seat: 'oval' }), /unknown seat/);
  assert.throws(() => createWoodChair(GFX, { legs: 'wheels' }), /unknown legs/);
  assert.throws(() => createWoodChair(GFX, { back: 'wings' }), /unknown back/);
  assert.throws(() => createWoodChair(GFX, { height: 3 }), /dimensions/);
});

test('every chair holds together: no part floats free of the rest', () => {
  for (const kind of KINDS) for (const seat of SEATS) for (const legs of LEGS) for (const back of BACKS) for (const arms of [false, true]) {
    assert.equal(pieces(createWoodChair(GFX, { kind, seat, legs, back, arms, stretchers: true }).group), 1, `${kind}/${seat}/${legs}/${back}/${arms}`);
  }
});

test('a chair has a seat, four legs, rails, and the back and arms it was asked for', () => {
  const arm = createWoodChair(GFX, { kind: 'armchair' });
  assert.equal(named(arm, 'seat').length, 1);
  assert.equal(named(arm, 'leg ').filter((c) => !c.name.endsWith('post')).length, 4);
  assert.equal(named(arm, 'rail ').length, 4);
  assert.equal(named(arm, 'arm ').length, 2);
  assert.ok(named(arm, 'back ').length >= 3);
  const stool = createWoodChair(GFX, { kind: 'stool' });
  assert.equal(named(stool, 'back').length + named(stool, 'arm ').length, 0);
  assert.equal(createWoodChair(GFX, { kind: 'spindle' }).group.children.filter((c) => c.name.startsWith('back spindle')).length, 5);
});

test('measures can be changed, and the seat surface says where to sit', () => {
  const made = createWoodChair(GFX, { kind: 'barstool', height: 0.65, species: 'maple', finish: 'raw' });
  assert.equal(made.seatSurface.y, 0.65);
  assert.deepEqual(made.wood, { species: 'maple', finish: 'raw', source: made.wood.source });
  const thing = new GFX.Group();
  assert.equal(made.place(thing, { turn: 0.3 }), thing);
  assert.equal(thing.position.y, 0.65);
});

test('the set lines the kinds up without overlap', () => {
  const set = createChairSet(GFX);
  assert.equal(set.chairs.length, KINDS.length);
  for (let i = 1; i < set.chairs.length; i++) {
    const a = set.chairs[i - 1], b = set.chairs[i];
    assert.ok(b.group.position.x - b.dimensions.width / 2 > a.group.position.x + a.dimensions.width / 2);
  }
});
