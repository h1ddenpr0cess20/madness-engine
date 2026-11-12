import test from 'node:test';
import assert from 'node:assert/strict';
import * as GFX from '../src/gfx/index.js';
import { TILE, asphaltTexture, concreteTexture, paintAsphalt, paintConcrete } from '../src/textures/road.js';

const SIZE = 384;

const luma = (color, i) => (color[i * 4] + color[i * 4 + 1] + color[i * 4 + 2]) / 3;

/** How much a tile jumps across its own wrap, against how much it changes between any two neighbours inside it: about 1 when it tiles. */
function seam({ size, color }) {
  let across = 0, inside = 0;
  for (let k = 0; k < size; k++) {
    across += Math.abs(luma(color, k * size) - luma(color, k * size + size - 1)) + Math.abs(luma(color, k) - luma(color, (size - 1) * size + k));
    inside += Math.abs(luma(color, k * size + 100) - luma(color, k * size + 101)) + Math.abs(luma(color, 100 * size + k) - luma(color, 101 * size + k));
  }
  return across / inside;
}

const stats = ({ size, color }) => {
  let sum = 0, sq = 0;
  for (let i = 0; i < size * size; i++) { const l = luma(color, i); sum += l; sq += l * l; }
  const mean = sum / (size * size);
  return { mean, sd: Math.sqrt(sq / (size * size) - mean * mean) };
};

test('asphalt is dark, has grain, and tiles', () => {
  const a = paintAsphalt({ size: SIZE });
  const { mean, sd } = stats(a);
  assert.ok(mean > 30 && mean < 90, `mean ${mean}`);
  assert.ok(sd > 10, `grain ${sd}`);
  assert.ok(seam(a) < 1.6, `seam ${seam(a)}`);
  assert.equal(a.height.length, SIZE * SIZE);
});

test('asphalt stones stand proud of the binder in the bump', () => {
  const a = paintAsphalt({ size: SIZE });
  let lo = 255, hi = 0;
  for (const h of a.height) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  assert.ok(hi - lo > 80, `relief ${hi - lo}`);
});

test('a worn road is lighter than a fresh one, and the same seed paints the same road', () => {
  const fresh = stats(paintAsphalt({ size: SIZE, age: 0.05, seed: 2 })).mean, worn = stats(paintAsphalt({ size: SIZE, age: 0.95, seed: 2 })).mean;
  assert.ok(worn > fresh + 6, `${fresh} vs ${worn}`);
  const a = paintAsphalt({ size: 256, seed: 5 }), b = paintAsphalt({ size: 256, seed: 5 }), c = paintAsphalt({ size: 256, seed: 6 });
  assert.deepEqual(a.color, b.color);
  assert.notDeepEqual(a.color, c.color);
});

test('cracks and patches change the road, and it still tiles', () => {
  const plain = paintAsphalt({ size: SIZE, cracks: 0, patches: 0, stains: 0 });
  const bad = paintAsphalt({ size: SIZE, cracks: 1, patches: 1, stains: 1 });
  assert.notDeepEqual(plain.color, bad.color);
  assert.ok(seam(bad) < 1.8, `seam ${seam(bad)}`);
});

test('concrete is pale grey, tiles, and each finish is its own', () => {
  const broom = paintConcrete({ size: SIZE, finish: 'broom' }), trowel = paintConcrete({ size: SIZE, finish: 'trowel' }), aged = paintConcrete({ size: SIZE, finish: 'aged' });
  for (const c of [broom, trowel, aged]) {
    const { mean } = stats(c);
    assert.ok(mean > 100 && mean < 200, `mean ${mean}`);
    assert.ok(seam(c) < 1.8, `seam ${seam(c)}`);
  }
  assert.notDeepEqual(broom.color, trowel.color);
  assert.notDeepEqual(broom.color, aged.color);
});

test('concrete slabs have a joint round each one', () => {
  const size = SIZE;
  const c = paintConcrete({ size, slabs: 2, cracks: 0, stains: 0 });
  // Along a row through the middle of a slab, the joint at 0 and size / 2 is the darkest place.
  const row = (y, x) => luma(c.color, y * size + x);
  const at = (x) => { let s = 0; for (let y = 40; y < 140; y++) s += row(y, (x + size) % size); return s / 100; };
  assert.ok(at(size / 2) < at(size / 4) - 10, `${at(size / 2)} vs ${at(size / 4)}`);
  assert.ok(at(0) < at(size / 4) - 10);
});

test('the texture functions give nothing without a canvas, as the other painters do', () => {
  assert.deepEqual(asphaltTexture(GFX, { size: 64 }), { map: null, bump: null });
  assert.deepEqual(concreteTexture(GFX), { map: null, bump: null });
  assert.ok(TILE.asphalt > 0 && TILE.concrete > 0);
});
