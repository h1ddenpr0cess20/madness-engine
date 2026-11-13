import test from 'node:test';
import assert from 'node:assert/strict';
import * as GFX from '../src/gfx/index.js';
import { TILE, paintTurf, turfTexture } from '../src/textures/ground.js';

const SIZE = 384;
const channel = (p, c) => { let s = 0; for (let i = 0; i < p.size * p.size; i++) s += p.color[i * 4 + c]; return s / (p.size * p.size); };

test('turf is green: more green than red or blue, and lit enough to be a lawn in the sun', () => {
  const t = paintTurf({ size: SIZE });
  const [r, g, b] = [channel(t, 0), channel(t, 1), channel(t, 2)];
  assert.ok(g > r * 1.2 && g > b * 1.8, `${r} ${g} ${b}`);
  assert.ok(g > 70 && g < 160, `green ${g}`);
});

test('turf tiles, and its blades stand up out of the soil in the bump', () => {
  const t = paintTurf({ size: SIZE });
  const n = t.size;
  let across = 0, inside = 0;
  const l = (i) => (t.color[i * 4] + t.color[i * 4 + 1] + t.color[i * 4 + 2]) / 3;
  for (let k = 0; k < n; k++) {
    across += Math.abs(l(k * n) - l(k * n + n - 1)) + Math.abs(l(k) - l((n - 1) * n + k));
    for (let j = 0; j < n - 1; j++) inside += (Math.abs(l(k * n + j) - l(k * n + j + 1)) + Math.abs(l(j * n + k) - l((j + 1) * n + k))) / (n - 1);
  }
  assert.ok(across / inside < 1.6, `seam ${across / inside}`);
  let lo = 255, hi = 0;
  for (const h of t.height) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  assert.ok(hi - lo > 100, `relief ${hi - lo}`);
});

test('a lush lawn is greener and denser than a thin one, and a dry one shows soil', () => {
  const lush = paintTurf({ size: SIZE, health: 1, seed: 3 }), thin = paintTurf({ size: SIZE, health: 0.1, seed: 3 });
  assert.ok(channel(lush, 1) > channel(thin, 1), 'lush is brighter in green');
  const dry = paintTurf({ size: SIZE, dry: 0.8, seed: 3 });
  assert.ok(channel(dry, 0) / channel(dry, 1) > channel(lush, 0) / channel(lush, 1), 'a dry lawn is browner');
});

test('the same seed grows the same lawn, another grows another', () => {
  assert.deepEqual(paintTurf({ size: 192, seed: 4 }).color, paintTurf({ size: 192, seed: 4 }).color);
  assert.notDeepEqual(paintTurf({ size: 192, seed: 4 }).color, paintTurf({ size: 192, seed: 5 }).color);
});

test('without a canvas the texture is nothing, as in the other painters', () => {
  assert.deepEqual(turfTexture(GFX), { map: null, bump: null });
  assert.ok(TILE.turf > 0);
});

import { paintGravel, paintPavers, gravelTexture, paversTexture } from '../src/textures/ground.js';

const seamOf = (p) => {
  const n = p.size, l = (i) => (p.color[i * 4] + p.color[i * 4 + 1] + p.color[i * 4 + 2]) / 3;
  let across = 0, inside = 0;
  for (let k = 0; k < n; k++) {
    across += Math.abs(l(k * n) - l(k * n + n - 1)) + Math.abs(l(k) - l((n - 1) * n + k));
    for (let j = 0; j < n - 1; j++) inside += (Math.abs(l(k * n + j) - l(k * n + j + 1)) + Math.abs(l(j * n + k) - l((j + 1) * n + k))) / (n - 1);
  }
  return across / inside;
};
const relief = (p) => { let lo = 255, hi = 0; for (const h of p.height) { lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };

test('gravel is stones: it tiles, has relief, and each kind is its own', () => {
  const kinds = ['ballast', 'roof', 'path'].map((kind) => paintGravel({ size: SIZE, kind }));
  for (const g of kinds) { assert.ok(seamOf(g) < 1.7, `seam ${seamOf(g)}`); assert.ok(relief(g) > 50, `relief ${relief(g)}`); }
  assert.notDeepEqual(kinds[0].color, kinds[1].color);
  assert.notDeepEqual(kinds[1].color, kinds[2].color);
});

test('pavers: a joint between every brick, bricks of different colours, tiling', () => {
  const p = paintPavers({ size: 512, seed: 2 });
  assert.ok(seamOf(p) < 2, `seam ${seamOf(p)}`);
  // The joint between the rows: along a column, the lowest places are the joints, one row of bricks apart.
  const row = 512 / 16;
  let joint = 0, face = 0;
  for (let x = 20; x < 120; x++) { joint += p.height[(0 * 512) + x]; face += p.height[Math.floor(row / 2) * 512 + x]; }
  assert.ok(joint < face - 100, `${joint} vs ${face}`);
  const reds = new Set();
  for (let r = 0; r < 16; r++) reds.add(Math.round(p.color[(Math.floor(r * row + row / 2) * 512 + 40) * 4] / 12));
  assert.ok(reds.size > 3, `colours ${reds.size}`);
  assert.deepEqual(paintPavers({ size: 128, seed: 3 }).color, paintPavers({ size: 128, seed: 3 }).color);
});

test('the gravel and pavers textures are nothing without a canvas', () => {
  assert.deepEqual(gravelTexture(GFX), { map: null, bump: null });
  assert.deepEqual(paversTexture(GFX), { map: null, bump: null });
});
