import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { assetViewer as coinAsset } from '../src/props/coin.js';
import { assetViewer as bitcoinAsset } from '../src/props/bitcoin-coin.js';
import { assetViewer as politicalAsset } from '../src/props/political-coin.js';

const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');
const coinSource = readFileSync(new URL('../src/props/coin.js', import.meta.url), 'utf8');

test('the original logo coin is registered through the dedicated procedural-props scan', () => {
  assert.equal(coinAsset.id, 'coin');
  assert.equal(coinAsset.name, 'coin');
  assert.equal(coinAsset.category, 'Animated props');
  assert.ok(coinSource.includes("import('../textures/coin/logo.js')"));
  assert.ok(coinSource.includes('texture.loadCoinLogo()'));
  assert.ok(catalog.includes("const proceduralProps = import.meta.glob('../../../src/props/*.js');"));
  assert.ok(catalog.includes('for (const [path, load] of Object.entries(proceduralProps))'));
  assert.ok(catalog.includes('if (mod.assetViewer) items.push(proceduralPropItem(mod.assetViewer, path));'));
});

test('all three coins self-register without hard-coded MOVING entries', () => {
  for (const asset of [coinAsset, bitcoinAsset, politicalAsset]) {
    assert.equal(asset.category, 'Animated props');
    assert.equal(asset.group, 'coin');
    assert.equal(typeof asset.build, 'function');
  }
  const moving = catalog.slice(catalog.indexOf('const MOVING = ['), catalog.indexOf('function proceduralPropItem'));
  assert.ok(!moving.includes("['coin', 'Animated props'"));
  assert.ok(!moving.includes("['bitcoin coin', 'Animated props'"));
  assert.ok(!moving.includes("['political coin', 'Animated props'"));
});
