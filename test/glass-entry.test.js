import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { FRAMES, createGlassEntry } from '../src/props/glass-entry.js';

test('an entryway has two doors, glass, a frame and a doorway', () => {
  const entry = createGlassEntry(GFX);
  assert.equal(entry.doors.length, 2);
  const names = entry.group.children.map((c) => c.name);
  assert.ok(names.includes('entry glass'));
  assert.ok(names.includes('entry frame'));
  assert.ok(names.includes('entry pull'));
  assert.equal(entry.doorway.width, 1.8);
  for (const frame of Object.keys(FRAMES)) createGlassEntry(GFX, { frame });
});

test('the doors sit side by side in the middle of the opening', () => {
  const { doors } = createGlassEntry(GFX, { doorWidth: 2 });
  assert.ok(Math.abs(doors[0].x + doors[1].x) < 1e-9);
  assert.ok(Math.abs(doors[1].x - doors[0].x - 1) < 1e-9);
});

test('the outside and the mat can be left out', () => {
  const names = createGlassEntry(GFX, { outside: false, mat: false }).group.children.map((c) => c.name);
  assert.ok(!names.includes('entry daylight'));
  assert.ok(!names.includes('entry mat'));
});

test('what is asked is checked', () => {
  assert.throws(() => createGlassEntry(GFX, { frame: 'gold' }), /unknown frame/);
  assert.throws(() => createGlassEntry(GFX, { width: 0 }), /positive/);
  assert.throws(() => createGlassEntry(GFX, { width: 2, doorWidth: 2 }), /fit/);
});
