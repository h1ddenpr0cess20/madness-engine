import test from 'node:test';
import assert from 'node:assert/strict';
import * as GFX from '../src/gfx/index.js';
import { FACADES, TILE, facadeTexture, paintFacade } from '../src/textures/facades.js';

const SIZE = 256;
const luma = (p, i) => (p.color[i * 4] + p.color[i * 4 + 1] + p.color[i * 4 + 2]) / 3;
const mean = (p) => { let s = 0; for (let i = 0; i < p.size * p.size; i++) s += luma(p, i); return s / (p.size * p.size); };
const rgbMean = (p) => { const m = [0, 0, 0]; for (let i = 0; i < p.size * p.size; i++) for (let c = 0; c < 3; c++) m[c] += p.color[i * 4 + c]; return m.map((v) => v / (p.size * p.size)); };
const share = (p, pred) => { let n = 0; for (let i = 0; i < p.size * p.size; i++) if (pred(luma(p, i))) n++; return n / (p.size * p.size); };

test('every facade is painted, is its own, and the same seed paints the same one', () => {
  const all = FACADES.map((kind) => paintFacade({ size: SIZE, kind }));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.notDeepEqual(all[i].color, all[j].color);
  assert.deepEqual(paintFacade({ size: 128, kind: 'precast', seed: 3 }).color, paintFacade({ size: 128, kind: 'precast', seed: 3 }).color);
  assert.ok(TILE > 0);
});

test('the colours are what the photographs show', () => {
  const [cr, cg, cb] = rgbMean(paintFacade({ size: SIZE, kind: 'curtain' }));
  assert.ok(cb > cr * 1.15, `curtain glass is blue: ${cr} ${cg} ${cb}`);
  const [pr, pg, pb] = rgbMean(paintFacade({ size: SIZE, kind: 'precast' }));
  assert.ok(pr > 150 && pr > pb, `precast is a warm cream: ${pr} ${pg} ${pb}`);
  const [tr, tg, tb] = rgbMean(paintFacade({ size: SIZE, kind: 'terracotta' }));
  assert.ok(tr > tg * 1.15 && tr > tb * 1.3, `terracotta is brown-red: ${tr} ${tg} ${tb}`);
  const [sr, sg, sb] = rgbMean(paintFacade({ size: SIZE, kind: 'sandstone' }));
  assert.ok(sr > sg * 1.3 && sr > sb * 1.5, `sandstone is red: ${sr} ${sg} ${sb}`);
});

test('windows and glass are dark where the wall is light', () => {
  const precast = paintFacade({ size: SIZE, kind: 'precast' });
  assert.ok(share(precast, (l) => l < 70) > 0.08 && share(precast, (l) => l > 150) > 0.4, 'dark windows in a light wall');
  const sandstone = paintFacade({ size: SIZE, kind: 'sandstone' });
  assert.ok(share(sandstone, (l) => l < 60) > 0.03);
});

test('they have relief: the windows are sunk, the sills and mullions stand proud', () => {
  for (const kind of FACADES) {
    const p = paintFacade({ size: SIZE, kind });
    let lo = 255, hi = 0;
    for (const h of p.height) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
    assert.ok(hi - lo > 100, `${kind} relief ${hi - lo}`);
  }
});

test('the left and right edges of a precast or curtain tile meet', () => {
  for (const kind of ['curtain', 'precast']) {
    const p = paintFacade({ size: SIZE, kind });
    let across = 0, inside = 0;
    for (let y = 0; y < SIZE; y++) {
      across += Math.abs(luma(p, y * SIZE) - luma(p, y * SIZE + SIZE - 1));
      for (let x = 0; x < SIZE - 1; x++) inside += Math.abs(luma(p, y * SIZE + x) - luma(p, y * SIZE + x + 1)) / (SIZE - 1);
    }
    assert.ok(across / inside < 2.5, `${kind} seam ${across / inside}`);
  }
  assert.ok(mean(paintFacade({ size: 64, kind: 'curtain' })) > 40);
});

test('the facade textures are nothing without a canvas', () => {
  assert.deepEqual(facadeTexture(GFX, 'curtain'), { map: null, bump: null });
});
