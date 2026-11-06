import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');
const coin = readFileSync(new URL('../src/props/coin.js', import.meta.url), 'utf8');
const bitcoin = readFileSync(new URL('../src/props/bitcoin-coin.js', import.meta.url), 'utf8');
const political = readFileSync(new URL('../src/props/political-coin.js', import.meta.url), 'utf8');

test('procedural props self-register through an assetViewer descriptor', () => {
  assert.ok(catalog.includes('if (folder === \'props\' && mod.assetViewer) items.push(proceduralPropItem(mod.assetViewer, path));'));
  assert.ok(catalog.includes('function proceduralPropItem(def, path)'));
  assert.ok(catalog.includes('def.build({ GFX, ...opts, renderer: globalThis.assetViewer?.renderer ?? null })'));
});

test('coin assets register themselves instead of being listed in the viewer MOVING array', () => {
  for (const source of [coin, bitcoin, political]) assert.ok(source.includes('export const assetViewer = {'));
  const moving = catalog.slice(catalog.indexOf('const MOVING = ['), catalog.indexOf('function proceduralPropItem'));
  assert.ok(!moving.includes("['coin', 'Animated props'"));
  assert.ok(!moving.includes("['bitcoin coin', 'Animated props'"));
  assert.ok(!moving.includes("['political coin', 'Animated props'"));
});
