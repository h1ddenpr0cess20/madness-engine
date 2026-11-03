import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bake } from '../src/models/model.js';
import { PROPS } from '../src/props/index.js';
import { GROCERIES } from '../src/props/groceries.js';

test('the corner store stock is in the prop library, one prop for every line it sells', () => {
  const names = ['apples', 'bananas', 'tomatoes', 'lettuce', 'potatoes', 'oranges', 'carrots', 'onions', 'peppers', 'grapes', 'milk', 'yogurt', 'cheddar', 'butter', 'eggs', 'chicken', 'beef', 'turkey', 'orangejuice', 'bacon', 'sourcream', 'bread', 'rice', 'spaghetti', 'cereal', 'beans', 'coffee', 'flour', 'sugar', 'oats', 'peanutbutter', 'chips', 'cookies', 'candybar', 'cola', 'water', 'pizza', 'icecream', 'carton'];
  assert.deepEqual(Object.keys(GROCERIES).sort(), [...names].sort());
  for (const name of names) assert.equal(PROPS[name], GROCERIES[name], name);
});

test('each grocery bakes within its budget and stands on the floor', () => {
  for (const [name, def] of Object.entries(GROCERIES)) {
    const m = bake(def, { detail: 0.4 });
    assert.ok(m.count > 100, `${name}: ${m.count} vertices`);
    assert.ok(m.count <= (def.budget ?? 9000), `${name}: ${m.count} vertices, budget ${def.budget}`);
    let low = Infinity, high = -Infinity;
    for (let i = 1; i < m.position.length; i += 3) { low = Math.min(low, m.position[i]); high = Math.max(high, m.position[i]); }
    assert.ok(Math.abs(low) < 0.02, `${name} stands at y = ${low}`);
    assert.ok(high > 0.03 && high < 0.6, `${name} is ${high} tall`);
  }
});
