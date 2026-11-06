import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createBitcoinCoin } from '../src/props/index.js';

test('the Bitcoin coin factory is exported from the props library', () => {
  assert.equal(typeof createBitcoinCoin, 'function');
});
