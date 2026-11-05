import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GREEN, TIERS } from '../src/props/glasspine.js';
import { pine } from '../src/scenery/street.js';

test('the glass pine stands where the street pine does: four tiers, each narrower and 0.62 higher', () => {
  assert.equal(TIERS.length, 4);
  for (let i = 1; i < TIERS.length; i++) {
    assert.ok(Math.abs(TIERS[i].base - TIERS[i - 1].base - 0.62) < 1e-9);
    assert.ok(TIERS[i].radius < TIERS[i - 1].radius);
  }
  assert.equal(pine.name, 'pine');
});

test('its mist is green: the green is the strongest of its tint', () => {
  assert.ok(GREEN.tint[1] > GREEN.tint[0] && GREEN.tint[1] > GREEN.tint[2]);
});
