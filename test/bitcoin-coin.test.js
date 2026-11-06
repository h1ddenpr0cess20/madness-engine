import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readFileSync } from 'node:fs';
import { createBitcoinCoin } from '../src/props/index.js';

const bitcoinCoin = readFileSync(new URL('../src/props/bitcoin-coin.js', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');

test('the Bitcoin coin factory is exported from the props library', () => {
  assert.equal(typeof createBitcoinCoin, 'function');
});


test('the Bitcoin coin has its own rust motto and is registered in the asset viewer', () => {
  assert.ok(bitcoinCoin.includes("motto: 'IN CHAINS WE RUST'"));
  assert.ok(catalog.includes("['bitcoin coin', 'Animated props', 'coin'"));
  assert.ok(catalog.includes("'props/bitcoin-coin'"));
});
