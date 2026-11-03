import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');
const viewer = readFileSync(new URL('../examples/asset-viewer/src/main.js', import.meta.url), 'utf8');

test('the asset viewer registers the bowling ball as a hero', () => {
  assert.match(catalog, /\['bowling ball',[\s\S]*?createBowlingBall\(GFX, \{ colors: colours \}\)/);
  assert.match(catalog, /kind: 'bowling-ball'/);
  assert.match(catalog, /async build\(\{ colours = \{\} \} = \{\}\)/);
});

test('the asset viewer exposes all four bowling ball colour controls', () => {
  for (const key of ['base', 'swirl', 'accent', 'holes']) assert.match(catalog, new RegExp(key + ':'));
  for (const label of ['Base resin', 'Swirl', 'Accent veins', 'Finger holes']) assert.ok(viewer.includes(label), label);
  assert.match(viewer, /import \{ createBowlingBall \} from 'madness-engine\/heroes\/bowling-ball'/);
  assert.match(viewer, /kind === 'bowling-ball'/);
});
