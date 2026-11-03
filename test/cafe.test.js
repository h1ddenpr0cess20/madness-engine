import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bake } from '../src/models/model.js';
import { PROPS } from '../src/props/index.js';
import { CAFE } from '../src/props/cafe.js';

const extent = (def, detail = 0.5) => {
  const m = bake(def, { detail });
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.position.length; i += 3) for (let a = 0; a < 3; a++) {
    low[a] = Math.min(low[a], m.position[i + a]);
    high[a] = Math.max(high[a], m.position[i + a]);
  }
  return { count: m.count, low, high };
};

test('the café furniture is in the prop library, one prop for each piece', () => {
  assert.deepEqual(Object.keys(CAFE).sort(), ['cafebooth', 'cafechair', 'cafestool', 'cafetable']);
  for (const name of Object.keys(CAFE)) assert.equal(PROPS[name], CAFE[name], name);
});

test('each piece of café furniture bakes, stands on the floor and is sized for a seated person', () => {
  const sizes = {};
  for (const [name, def] of Object.entries(CAFE)) {
    const { count, low, high } = extent(def);
    assert.ok(count > 100, `${name}: ${count} vertices`);
    assert.ok(count <= (def.budget ?? 20000), `${name}: ${count} vertices`);
    assert.ok(Math.abs(low[1]) < 0.01, `${name} stands at y = ${low[1]}`);
    sizes[name] = high[1] - low[1];
  }
  // The chair's back stands above its seat, the table top above the seat, the stool below the table.
  assert.ok(sizes.cafechair > 0.3 && sizes.cafechair < 0.45, `the chair is ${sizes.cafechair} tall`);
  assert.ok(sizes.cafetable > 0.24 && sizes.cafetable < 0.3, `the table is ${sizes.cafetable} tall`);
  assert.ok(sizes.cafestool > 0.2 && sizes.cafestool < 0.27, `the stool is ${sizes.cafestool} tall`);
  assert.ok(sizes.cafetable < sizes.cafechair, 'a table top sits below the back of a chair');
});

test('the café chair stands about as tall as the plain chair, for the same seated person', () => {
  const seat = extent(CAFE.cafechair);
  const plain = extent(PROPS.chair);
  assert.ok(seat.high[1] > plain.high[1] * 0.6 && seat.high[1] < plain.high[1] * 1.0, 'a back about as tall as the plain chair');
});
