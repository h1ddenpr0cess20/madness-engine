import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Mesher } from '../src/mesher.js';

// The same unit tile of floor, given its corners in two orders (both counter-clockwise seen from above).
const TILE_ALONG_X = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]];
const TILE_ALONG_Z = [[0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0]];

/** The uv of each vertex, keyed by its world position, so the two orders can be compared. */
function uvByPosition(corners, mat = 'plate') {
  const m = new Mesher();
  m.quad(mat, ...corners, '#ffffff');
  const part = m.finish()[mat];
  const out = new Map();
  for (let i = 0; i < part.count; i++) {
    const key = [part.pos[i * 3], part.pos[i * 3 + 1], part.pos[i * 3 + 2]].join(',');
    out.set(key, [part.uv[i * 2], part.uv[i * 2 + 1]]);
  }
  return out;
}

test('a floor tile is textured the same however its corners are ordered', () => {
  const a = uvByPosition(TILE_ALONG_X);
  const b = uvByPosition(TILE_ALONG_Z);
  for (const [key, uv] of a) assert.deepEqual(b.get(key), uv, `corner ${key}`);
});

test('a floor texture runs on the world x and z, one repeat per unit of tile', () => {
  const uv = uvByPosition(TILE_ALONG_Z, 'plate');
  assert.deepEqual(uv.get('1,0,0'), [1, 0]);
  assert.deepEqual(uv.get('0,0,1'), [0, 1]);
});

test('a ceiling tile is textured on x and z too', () => {
  const ceiling = [[0, 3, 0], [0, 3, 1], [1, 3, 1], [1, 3, 0]];
  const uv = uvByPosition(ceiling, 'plate');
  assert.deepEqual(uv.get('1,3,0'), [1, 0]);
  assert.deepEqual(uv.get('0,3,1'), [0, 1]);
});

test('a floor triangle is textured on world x and z as well', () => {
  const m = new Mesher();
  m.tri('plate', [0, 0, 0], [1, 0, 0], [0, 0, 1], '#ffffff');
  const part = m.finish().plate;
  const uv = (i) => [part.uv[i * 2], part.uv[i * 2 + 1]];
  assert.deepEqual(uv(1), [1, 0]);
  assert.deepEqual(uv(2), [0, 1]);
});

test('a wall keeps its texture upright, with v going up the face', () => {
  const m = new Mesher();
  m.quad('brick', [0, 0, 0], [1, 0, 0], [1, 2, 0], [0, 2, 0], '#ffffff');
  const part = m.finish().brick;
  // Vertices 0..5 are the two triangles; the top corners (y = 2) must have the larger v.
  for (let i = 0; i < part.count; i++) {
    const y = part.pos[i * 3 + 1], v = part.uv[i * 2 + 1];
    if (y === 2) assert.ok(v > 0.5, `top corner v ${v}`);
    else assert.ok(v < 0.5 || v === 0, `bottom corner v ${v}`);
  }
});
