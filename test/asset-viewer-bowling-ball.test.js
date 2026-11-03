import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const catalog = readFileSync(new URL('../examples/asset-viewer/src/catalog.js', import.meta.url), 'utf8');
const viewer = readFileSync(new URL('../examples/asset-viewer/src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../examples/asset-viewer/index.html', import.meta.url), 'utf8');

test('the bowling ball is registered on the Props shelf, not Heroes', () => {
  assert.ok(catalog.includes("id: 'props/bowling-ball'"));
  assert.ok(catalog.includes("category: 'Props'"));
  assert.ok(catalog.includes("group: 'balls'"));
  assert.ok(catalog.includes("import { createBowlingBall } from '../../../src/props/bowling-ball.js';"));
  assert.ok(catalog.includes("items.push(...diceItems(), ...bowlingBallItems());"));
  assert.ok(!catalog.includes("['bowling ball'"));
});

test('the asset viewer exposes four palette channels, surface patterns and random palettes', () => {
  for (const key of ['base', 'swirl', 'accent', 'holes']) assert.ok(catalog.includes(key + ':'));
  for (const label of ['Base resin', 'Swirl', 'Accent veins', 'Finger holes']) assert.ok(viewer.includes(label));
  for (const design of ['marble', 'spiral', 'flame', 'split']) assert.ok(html.includes('value="' + design + '"'));
  assert.ok(viewer.includes("madness-engine/props/bowling-ball"));
  assert.ok(viewer.includes("import { randomBowlingBallPalette } from './bowling-ball-palettes.js';"));
  assert.ok(viewer.includes("'Randomise colours'"));
  assert.ok(viewer.includes("$('bowlingdesign').onchange"));
  assert.ok(viewer.includes('view.draft = { ...randomBowlingBallPalette(Math.random, current), design };'));
});
