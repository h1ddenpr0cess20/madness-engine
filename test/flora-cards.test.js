import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesher } from '../src/mesher.js';
import { leafy, spruce } from '../src/flora.js';
import { paintFoliage, coverOf } from '../src/textures/foliage.js';

const parts = (make, o) => { const m = new Mesher(); make(m, o); return m.finish(); };

test('leafy trees are limbs of bark and leaf cards, near and far, in every form', () => {
  for (const form of ['oak', 'maple', 'elm', 'birch']) {
    const near = parts(leafy, { form, hi: true, seed: 3 }), far = parts(leafy, { form, hi: false, seed: 3 });
    assert.ok(near.bark.count > 0 && near.leafCard.count > 0, form);
    // The far version is a good deal cheaper than the near.
    const tris = (p) => Object.values(p).reduce((s, v) => s + v.count / 3, 0);
    assert.ok(tris(far) * 4 < tris(near), `${form}: far ${tris(far)}, near ${tris(near)}`);
    assert.ok(tris(near) < 2000, `${form}: ${tris(near)} triangles near`);
    // Every card's corners lie on its square of the atlas.
    const uv = near.leafCard.uv;
    for (let i = 0; i < uv.length; i++) assert.ok(uv[i] >= 0 && uv[i] <= 1);
    // Upright: nothing far under the ground, the crown a tile or so up.
    let top = -Infinity, bottom = Infinity;
    for (let i = 1; i < near.leafCard.pos.length; i += 3) { top = Math.max(top, near.leafCard.pos[i]); bottom = Math.min(bottom, near.leafCard.pos[i]); }
    assert.ok(top > 1 && top < 1.8 && bottom > 0.2, `${form}: leaves from ${bottom} to ${top}`);
  }
});

test('a spruce is a trunk and whorls of needle cards', () => {
  const p = parts(spruce, { hi: true, seed: 1 });
  assert.ok(p.needleCard.count / 3 > 200 && p.bark.count > 0);
});

test('the foliage atlas is leaves on a clear ground, coloured right to its edge', () => {
  for (const kind of ['broad', 'needle']) {
    const a = paintFoliage({ kind, size: 256 });
    const c = coverOf(a);
    assert.ok(c > 0.2 && c < 0.75, `${kind}: ${c}`);
    // No clear pixel is black: the mips keep the leaves' colour.
    for (let i = 0; i < a.data.length; i += 4) if (!a.data[i + 3]) assert.ok(a.data[i] + a.data[i + 1] + a.data[i + 2] > 60);
  }
});

test("a tree's limbs end in its leaves: no bare branch out of the crown", () => {
  for (const form of ['oak', 'birch']) for (const hi of [true, false]) {
    let bare = 0, all = 0;
    for (let s = 0; s < 4; s++) {
      const p = parts(leafy, { form, hi, seed: s }), L = p.leafCard.pos, B = p.bark.pos, cards = [];
      // Each card is two quads, 12 corners: its middle, and half its width round it, is leaves.
      for (let i = 0; i < L.length; i += 36) {
        const c = [0, 0, 0];
        for (let k = 0; k < 12; k++) for (let a = 0; a < 3; a++) c[a] += L[i + k * 3 + a] / 12;
        cards.push([c, Math.hypot(L[i] - L[i + 3], L[i + 1] - L[i + 4], L[i + 2] - L[i + 5]) * 0.5]);
      }
      for (let i = 0; i < B.length; i += 3) {
        if (B[i + 1] < 0.6) continue;
        all++;
        if (!cards.some(([c, r]) => Math.hypot(c[0] - B[i], c[1] - B[i + 1], c[2] - B[i + 2]) < r)) bare++;
      }
    }
    assert.ok(bare / all < 0.02, `${form} ${hi ? 'near' : 'far'}: ${(100 * bare / all).toFixed(1)}% of the upper wood bare`);
  }
});
