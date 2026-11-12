import test from 'node:test';
import assert from 'node:assert/strict';
import * as GFX from '../src/gfx/index.js';
import { TILE, membraneTexture, paintMembrane, paintShingles, shinglesTexture } from '../src/textures/roofing.js';

const luma = (p, i) => (p.color[i * 4] + p.color[i * 4 + 1] + p.color[i * 4 + 2]) / 3;
const mean = (p) => { let s = 0; for (let i = 0; i < p.size * p.size; i++) s += luma(p, i); return s / (p.size * p.size); };
const seam = (p) => {
  const n = p.size;
  let across = 0, inside = 0;
  for (let k = 0; k < n; k++) {
    across += Math.abs(luma(p, k * n) - luma(p, k * n + n - 1)) + Math.abs(luma(p, k) - luma(p, (n - 1) * n + k));
    for (let j = 0; j < n - 1; j++) inside += (Math.abs(luma(p, k * n + j) - luma(p, k * n + j + 1)) + Math.abs(luma(p, j * n + k) - luma(p, (j + 1) * n + k))) / (n - 1);
  }
  return across / inside;
};

test('shingles lie in courses: each course is dark at its top, light at its foot, and the tile wraps', () => {
  const size = 480, p = paintShingles({ size, age: 0 });
  const course = size / 12;
  // The last row of the tile is the foot of a course, like the foot of any other: the tile wraps between courses, not through one.
  const rowMean = (y) => { let t = 0; for (let x = 0; x < size; x++) t += luma(p, y * size + x); return t / size; };
  assert.ok(Math.abs(rowMean(size - 1) / rowMean(Math.round(course * 5) - 1) - 1) < 0.12, `${rowMean(size - 1)} vs ${rowMean(Math.round(course * 5) - 1)}`);
  // And along the courses the edge of the tile is a tab boundary like any other: it jumps as much as the boundary a tab in does.
  const tab = size / 5;
  let wrap = 0, boundary = 0;
  for (let y = 0; y < size; y++) { wrap += Math.abs(luma(p, y * size) - luma(p, y * size + size - 1)); boundary += Math.abs(luma(p, y * size + tab) - luma(p, y * size + tab - 1)); }
  assert.ok(wrap / boundary > 0.5 && wrap / boundary < 1.6, `wrap ${wrap / boundary}`);
  let top = 0, foot = 0;
  for (let c = 0; c < 12; c++) for (let x = 20; x < 200; x++) { top += luma(p, Math.floor(c * course + 3) * size + x); foot += luma(p, Math.floor(c * course + course * 0.93) * size + x); }
  assert.ok(foot > top * 1.25, `${top} vs ${foot}`);
});

test('the shingle colours differ, and slots are cut between the tabs', () => {
  const charcoal = mean(paintShingles({ size: 256, color: 'charcoal' })), grey = mean(paintShingles({ size: 256, color: 'grey' }));
  assert.ok(grey > charcoal + 15, `${charcoal} vs ${grey}`);
  const p = paintShingles({ size: 480, age: 0 });
  let lo = 255;
  for (const h of p.height) lo = Math.min(lo, h);
  assert.ok(lo < 60, `slot depth ${lo}`);
});

test('a membrane is its tone, welded in seams, and tiles', () => {
  const white = paintMembrane({ size: 384, tone: 'white' }), black = paintMembrane({ size: 384, tone: 'black' });
  assert.ok(mean(white) > 150 && mean(black) < 80, `${mean(white)} ${mean(black)}`);
  assert.ok(seam(white) < 1.8, `seam ${seam(white)}`);
  // The seam at the middle of the tile stands proud.
  const y = 192;
  let on = 0, off = 0;
  for (let x = 0; x < 384; x++) { on = Math.max(on, white.height[y * 384 + x]); off += white.height[(y + 60) * 384 + x]; }
  assert.ok(on > off / 384 + 40, `${on} vs ${off / 384}`);
});

test('the roofing textures are nothing without a canvas', () => {
  assert.deepEqual(shinglesTexture(GFX), { map: null, bump: null });
  assert.deepEqual(membraneTexture(GFX), { map: null, bump: null });
  assert.ok(TILE.shingles > 0 && TILE.membrane > 0);
});
