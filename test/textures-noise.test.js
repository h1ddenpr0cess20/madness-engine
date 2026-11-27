import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fractal, periodic, random, DETAIL, K } from '../src/textures/painters.js';

// The noise as it was before its lattices were flattened: the same seeds, grids and weights, evaluated the slow way.
function referencePeriodic(seed, period) {
  const rnd = random(seed);
  const grid = Array.from({ length: period * period }, () => rnd());
  const at = (i, j) => grid[(((j % period) + period) % period) * period + (((i % period) + period) % period)];
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y);
    const u = x - i, v = y - j;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * su;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * su;
    return a + (b - a) * sv;
  };
}

function referenceFractal(seed, cells = 4, octaves = 4) {
  const layers = Array.from({ length: octaves }, (_, o) => referencePeriodic(seed + o * 101, cells * 2 ** o));
  return (u, v) => {
    let sum = 0, amp = 0.5, total = 0;
    for (let o = 0; o < octaves; o++) {
      sum += layers[o](u * cells * 2 ** o, v * cells * 2 ** o) * amp;
      total += amp;
      amp *= 0.5;
    }
    return sum / total;
  };
}

const POINTS = [[0, 0], [0.13, 0.71], [0.5, 0.5], [0.999, 0.001], [1.37, -0.42], [-0.2, 2.6], [0.031, 0.977]];

test('the flattened fractal gives the same values as the original', () => {
  for (const [seed, cells, octaves] of [[601, 3, 4], [41, 3, 3], [211, 12, 2], [7, 64, 1]]) {
    const now = fractal(seed, cells, octaves), before = referenceFractal(seed, cells, octaves);
    for (const [u, v] of POINTS) assert.ok(Math.abs(now(u, v) - before(u, v)) < 1e-12, `${seed}/${cells}/${octaves} at ${u},${v}`);
  }
});

test('the flattened periodic noise gives the same values as the original', () => {
  const now = periodic(29, 5), before = referencePeriodic(29, 5);
  for (const [u, v] of POINTS) assert.ok(Math.abs(now(u * 9, v * 9) - before(u * 9, v * 9)) < 1e-12);
});

test('the painters are drawn at DETAIL pixels, a whole number of pixels per design unit', () => {
  assert.equal(DETAIL, 1024);
  assert.equal(K * 256, DETAIL);
});
