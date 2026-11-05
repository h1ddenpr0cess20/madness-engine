import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');
const extraction = readFileSync(new URL('../scripts/extract/library.mjs', import.meta.url), 'utf8');

test('both cookware finish variants are registered on the Props shelf', () => {
  assert.ok(catalog.includes("['steel cookware set', 'Props', 'cookware'"));
  assert.ok(catalog.includes("['nonstick cookware set', 'Props', 'cookware'"));
  assert.ok(catalog.includes("finish: 'steel'"));
  assert.ok(catalog.includes("finish: 'nonstick'"));
  assert.ok(catalog.includes("'props/cookware'"));
});

test('cookware and its shared metal/skillet dependencies survive library extraction', () => {
  for (const path of [
    'props/cookware.js',
    'props/metal-finish.js',
    'props/metalglobe.js',
    'props/pan/cast.js',
    'props/pan/index.js',
  ]) assert.ok(extraction.includes(path), path);
});

test('other engine-authored prop assets are retained by the same extraction allowlist', () => {
  for (const path of [
    'props/bowling-pin.js',
    'props/coin.js',
    'props/glassglobe.js',
    'props/resinglobe.js',
  ]) assert.ok(extraction.includes(path), path);
});
