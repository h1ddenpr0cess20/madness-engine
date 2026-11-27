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
  for (const kind of KINDS) for (const seat of SEATS) for (const legs of LEGS) for (const back of BACKS) for (const arms of back === 'bow' ? [false] : [false, true]) {
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

test('a back can be curved: it bows out behind the sitter and still holds together', () => {
  for (const back of ['slat', 'spindle', 'ladder']) {
    const flat = createWoodChair(GFX, { kind: 'dining', back });
    const bowed = createWoodChair(GFX, { kind: 'dining', back, curve: 0.1 });
    assert.equal(bowed.options.curve, 0.1);
    assert.equal(pieces(bowed.group), 1, back);
    const rear = (m) => new GFX.Box3().setFromObject(m.group).min.z;
    assert.ok(rear(bowed) < rear(flat) - 0.05, `${back} bows backward`);
    // The middle spindle or slat is further back than the post it is joined to.
  }
  const s = createWoodChair(GFX, { kind: 'spindle', curve: 0.1 });
  const z = (n) => s.group.children.find((c) => c.name === n).position.z;
  const mid = s.group.children.find((c) => c.name === 'back spindle 3');
  assert.ok(mid.position.z < z('leg rear left') - 0.09);
  assert.throws(() => createWoodChair(GFX, { curve: 0.5 }), /curve/);
  assert.throws(() => createWoodChair(GFX, { curve: -1 }), /curve/);
});

test('a back can be arched: its middle rises above its ends, and it still holds together', () => {
  for (const back of ['slat', 'spindle', 'ladder']) for (const curve of [0, 0.08]) {
    const flat = createWoodChair(GFX, { kind: 'dining', back });
    const arched = createWoodChair(GFX, { kind: 'dining', back, arch: 0.1, curve });
    assert.equal(arched.options.arch, 0.1);
    assert.equal(pieces(arched.group), 1, `${back} curve ${curve}`);
    const top = (m) => new GFX.Box3().setFromObject(m.group).max.y;
    assert.ok(top(arched) > top(flat) + 0.05, `${back} rises`);
  }
  const posts = createWoodChair(GFX, { kind: 'dining', arch: 0.1 });
  const rail = posts.group.children.find((c) => c.name === 'back top rail');
  const post = posts.group.children.find((c) => c.name === 'leg rear left');
  const ymax = (m) => new GFX.Box3().setFromObject(m).max.y;
  assert.ok(ymax(rail) > ymax(post) + 0.05, 'the rail arches above the posts');
  assert.throws(() => createWoodChair(GFX, { arch: 0.5 }), /arch/);
  assert.throws(() => createWoodChair(GFX, { arch: -0.1 }), /arch/);
});

test('a Windsor has a bow, arrow spindles, a saddle seat and splayed turned legs with turned stretchers', () => {
  const w = createWoodChair(GFX, { kind: 'windsor' });
  assert.equal(w.options.back, 'bow');
  assert.equal(w.options.seat, 'saddle');
  assert.equal(pieces(w.group), 1);
  assert.equal(named(w, 'back bow').length, 1);
  assert.equal(named(w, 'back spindle').length, 6);
  assert.equal(named(w, 'stretcher').length, 3);
  assert.equal(named(w, 'rail').length, 0);
  // The legs stand out: each foot is further from the middle than the leg's top, and on the floor.
  for (const leg of named(w, 'leg ')) {
    leg.updateMatrixWorld(true);
    const box = new GFX.Box3().setFromObject(leg);
    assert.ok(Math.abs(box.min.y) < 0.02, 'the foot is on the floor');
    assert.ok(Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) > 0.14);
  }
  assert.equal(named(createWoodChair(GFX, { kind: 'windsor', spindles: 8 }), 'back spindle').length, 8);
  assert.throws(() => createWoodChair(GFX, { kind: 'windsor', arms: true }), /arms/);
  assert.throws(() => createWoodChair(GFX, { kind: 'windsor', splay: 40 }), /splay/);
  assert.throws(() => createWoodChair(GFX, { kind: 'windsor', spindles: 2 }), /spindles/);
  // Splay and a bow back come with any kind.
  for (const kind of ['dining', 'stool', 'barstool']) assert.equal(pieces(createWoodChair(GFX, { kind, splay: 8, back: kind === 'dining' ? 'bow' : 'none' }).group), 1, kind);
});
