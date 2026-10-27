import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createRiver } from '../src/river.js';

test('the banks laid again further on lie where they did, near and far', () => {
  const river = createRiver(GFX, new GFX.Scene(), { width: 20, snake: 1 });
  // Each row of the bank, by where it meets the water, and the ground along it.
  const lay = (x) => {
    river.place(x);
    const pos = river.banks[0].geometry.attributes.position.array, rows = new Map();
    for (let k = 0; k < pos.length; k += 23 * 3) {
      rows.set(`${pos[k].toFixed(1)},${pos[k + 2].toFixed(1)}`, Array.from({ length: 23 }, (_, j) => pos[k + j * 3 + 1]));
    }
    return rows;
  };
  const here = lay(0), on = lay(30);
  let shared = 0, far = 0;
  for (const [at, ground] of on) {
    if (Math.abs(Number(at.split(',')[0]) - 30) < 100) continue;
    far++;
    if (!here.has(at)) continue;
    shared++;
    here.get(at).forEach((y, j) => assert.ok(Math.abs(y - ground[j]) < 1e-3, `the ground at ${at} moved`));
  }
  // Away from the float, the rows are the ones that were there before.
  assert.ok(shared >= far * 0.95, `${shared} of ${far} rows stayed put`);
});

test('a float past the bank is put back, and bounced only if it was going into the bank', () => {
  const river = createRiver(GFX, new GFX.Scene(), { width: 20, snake: 0 });
  const out = { x: 0, z: 15, vx: 0, vz: 2, r: 1 };
  river.keep(out);
  assert.equal(out.z, 9);
  assert.ok(Math.abs(out.vz + 0.8) < 1e-9, 'bounced back');
  // The river narrowed under it: it is already coming back, and keeps coming.
  const back = { x: 0, z: 15, vx: 0, vz: -2, r: 1 };
  river.keep(back);
  assert.equal(back.z, 9);
  assert.equal(back.vz, -2);
});
