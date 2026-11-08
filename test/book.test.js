import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createBook } from '../src/heroes/book.js';

const book = createBook(GFX);

/** A mesh's signed volume: positive when its triangles face outward all round. */
function volume(geometry) {
  const P = geometry.attributes.position.array, I = geometry.index.array;
  let v = 0;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    v += (P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1]) - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c]) + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c])) / 6;
  }
  return v;
}

/** Every edge of a closed surface is walked once each way. */
function closed(geometry) {
  const I = geometry.index.array;
  const seen = new Map();
  for (let t = 0; t < I.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const key = `${I[t + e]}>${I[t + (e + 1) % 3]}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  }
  for (const [key, n] of seen) {
    const [a, b] = key.split('>');
    assert.equal(n, 1, `edge ${key} is walked ${n} times`);
    assert.ok(seen.has(`${b}>${a}`), `edge ${key} has no partner`);
  }
}

const bounds = (geometry) => {
  const P = geometry.attributes.position.array;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i + k]); hi[k] = Math.max(hi[k], P[i + k]); }
  return { lo, hi };
};

test('the cover is one closed, welded piece, in every pose', () => {
  assert.equal(book.group.children.filter((c) => c.name === 'book_cover').length, 1);
  for (const open of [0, 0.2, 0.5, 0.8, 1]) {
    book.pose({ open });
    closed(book.cover.geometry);
    assert.ok(volume(book.cover.geometry) > 0, `inside out at ${open}`);
    for (const v of book.cover.geometry.attributes.position.array) assert.ok(Number.isFinite(v));
  }
});

test('each leaf is a closed slab, turned or not', () => {
  for (const turn of [0, 3.4, 20]) {
    book.pose({ open: 1, turn });
    for (const leaf of book.leaves) {
      closed(leaf.geometry);
      assert.ok(volume(leaf.geometry) > 0);
    }
  }
});

test('shut, the leaves are flat in the cover with the cover standing past them', () => {
  book.pose({ open: 0, turn: 0 });
  const cover = bounds(book.cover.geometry);
  const { width, overhang } = { width: 0.30, overhang: 0.009 };
  let tip = -Infinity;
  for (const leaf of book.leaves) {
    const b = bounds(leaf.geometry);
    assert.ok(b.hi[1] - b.lo[1] < 0.0035, 'a shut leaf is level');
    assert.ok(b.lo[1] > cover.lo[1] + 0.0075 - 1e-4 && b.hi[1] < cover.hi[1] - 0.0075 + 1e-4, 'it lies between the boards');
    tip = Math.max(tip, b.hi[0]);
  }
  assert.ok(Math.abs(cover.hi[0] - tip - overhang) < 0.0005, `the square is ${cover.hi[0] - tip}`);
  assert.ok(Math.abs(cover.hi[0] - cover.lo[0] - (width + overhang + 0.011)) < 0.03);
});

test('opened out, both boards lie on the table and the spine is flat between them', () => {
  book.pose({ open: 1 });
  const cover = bounds(book.cover.geometry);
  assert.ok(cover.lo[1] > -1e-6 && cover.hi[1] < 0.0076, `${cover.hi[1]}`);
  assert.ok(cover.hi[0] - cover.lo[0] > 0.6, 'a spread cover is two boards and the spine across');
});

test('the front hinge bends first and the spine rolls after, all in the one cover', () => {
  book.pose({ open: 0.5 });
  const half = bounds(book.cover.geometry);
  assert.ok(half.hi[1] > 0.2, 'the front board stands upright at the half way');
  book.pose({ open: 0.25 });
  const quarter = bounds(book.cover.geometry);
  assert.ok(quarter.hi[1] > 0.04 && quarter.hi[1] < half.hi[1]);
});

test('the pages stay on the spine at every stage of opening and turning', () => {
  const near = (leaf, cover) => {
    // The root end of each leaf lies inside the cover's own extent along the spine.
    const l = bounds(leaf.geometry), c = bounds(cover.geometry);
    assert.ok(l.lo[2] >= c.lo[2] && l.hi[2] <= c.hi[2]);
  };
  for (const pose of [{ open: 0 }, { open: 0.6 }, { open: 0.9 }, { open: 1, turn: 0 }, { open: 1, turn: 7.5 }, { open: 1, turn: 20 }]) {
    book.pose(pose);
    for (const leaf of book.leaves) near(leaf, book.cover);
  }
});

test('turned leaves lie over on the other side in order, each higher than the last', () => {
  book.pose({ open: 1, turn: 6 });
  const top = book.leaves.map((l) => bounds(l.geometry));
  for (let k = 1; k < 6; k++) assert.ok(top[k].hi[1] > top[k - 1].hi[1] - 1e-9, `leaf ${k + 1} is under leaf ${k}`);
  const left = bounds(book.leaves[0].geometry);
  assert.ok(left.lo[0] < -0.2, 'a turned leaf lies on the left');
  const right = bounds(book.leaves[19].geometry);
  assert.ok(right.hi[0] > 0.2, 'an unturned leaf lies on the right');
});

test('leaves do not pass through each other when stacked or fanned', () => {
  // On the spread cross-section a leaf's middle line must keep a clear gap from the next one's.
  for (const pose of [{ open: 0 }, { open: 0.85 }, { open: 1, turn: 0 }, { open: 1, turn: 4 }, { open: 1, turn: 20 }]) {
    book.pose(pose);
    const rows = book.leaves.map((l) => {
      const P = l.geometry.attributes.position.array;
      const out = new Map();
      for (let v = 0; v < P.length; v += 3) if (Math.abs(P[v + 2] - P[2]) < 1e-9) out.set(Math.round(P[v] * 2000), P[v + 1]);
      return out;
    });
    for (let k = 0; k < rows.length - 1; k++) {
      for (const [x, y] of rows[k]) {
        const other = rows[k + 1].get(x);
        if (other !== undefined) assert.ok(Math.abs(y - other) > 0.0004, `leaves ${k + 1} and ${k + 2} meet at ${x} in ${JSON.stringify(pose)}`);
      }
    }
  }
});

test('it plays: open, turn, turn back and shut, and the leaf in flight curls', () => {
  const b = createBook(GFX, { leaves: 8 });
  b.open();
  for (let i = 0; i < 80; i++) b.update(1 / 30);
  assert.equal(b.openness, 1);
  b.turnTo(2);
  let curl = 0;
  for (let i = 0; i < 90; i++) {
    b.update(1 / 30);
    curl = Math.max(curl, Math.abs(b.leaves[0].curl));
  }
  assert.equal(b.turned, 2);
  b.close();
  for (let i = 0; i < 240; i++) b.update(1 / 30);
  assert.equal(b.turned, 0);
  assert.ok(b.openness < 1e-9);
  assert.ok(curl > 0.2, `the free edge trailed by ${curl}`);
  assert.ok(Math.abs(b.leaves[0].curl) < 1e-3, 'and it settles flat');
});
