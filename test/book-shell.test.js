import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createBook } from '../src/props/book.js';

const options = { size: 0.57, pageCount: 120, width: 0.3, height: 0.5, leafPitch: 0.0006, deferPages: true, bookplate: false, bump: false, textureSize: 64 };

test('a shell book has its cover and size but no leaves until it is built', () => {
  const shell = createBook(GFX, { ...options, shell: true });
  assert.equal(shell.built, false);
  assert.equal(shell.leaves.length, 0);
  assert.equal(shell.dimensions.leaves, 60);
  shell.build();
  assert.equal(shell.built, true);
  assert.equal(shell.leaves.length, 60);
});

test('a shell measures the same as the full book it becomes', () => {
  const full = createBook(GFX, options);
  const shell = createBook(GFX, { ...options, shell: true });
  assert.deepEqual(shell.dimensions, full.dimensions);
  assert.deepEqual(shell.dimensions.closed, full.dimensions.closed);
  assert.equal(shell.group.children.length, 1, 'only the cover is in the group until it is built');
  shell.build();
  assert.equal(shell.group.children.length, full.group.children.length, 'the leaves are added to the group');
});

test('building a shell twice does nothing the second time', () => {
  const shell = createBook(GFX, { ...options, shell: true });
  shell.build();
  const count = shell.leaves.length;
  shell.build();
  assert.equal(shell.leaves.length, count);
});

test('a built shell opens and turns like any book', () => {
  const shell = createBook(GFX, { ...options, shell: true });
  shell.build();
  shell.open();
  for (let i = 0; i < 200; i++) shell.update(0.05);
  assert.equal(shell.openness, 1);
  shell.next();
  for (let i = 0; i < 200; i++) shell.update(0.05);
  assert.ok(shell.leaves[0].turn > 0.5, 'the first leaf turns over');
});

test('a full book is built straight away, as before', () => {
  const full = createBook(GFX, options);
  assert.equal(full.built, true);
  assert.equal(full.leaves.length, 60);
});
