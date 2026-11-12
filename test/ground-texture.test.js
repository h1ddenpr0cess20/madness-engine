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
    inside += Math.abs(l(k * n + 100) - l(k * n + 101)) + Math.abs(l(100 * n + k) - l(101 * n + k));
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
