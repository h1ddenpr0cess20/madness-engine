import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BOWLING_BALL_PALETTES, randomBowlingBallPalette } from '../examples/asset-viewer/src/bowling-ball-palettes.js';

test('the randomizer returns a complete coordinated four-colour palette', () => {
  assert.ok(BOWLING_BALL_PALETTES.length >= 6);
  for (const palette of BOWLING_BALL_PALETTES) {
    assert.deepEqual(Object.keys(palette).sort(), ['accent', 'base', 'holes', 'swirl']);
    for (const color of Object.values(palette)) assert.match(color, /^#[\da-f]{6}$/i);
  }

  const first = randomBowlingBallPalette(() => 0);
  assert.deepEqual(first, BOWLING_BALL_PALETTES[0]);
});

test('the randomizer avoids the current palette when alternatives exist', () => {
  const current = BOWLING_BALL_PALETTES[0];
  const next = randomBowlingBallPalette(() => 0, current);
  assert.deepEqual(next, BOWLING_BALL_PALETTES[1]);
  assert.notDeepEqual(next, current);
});

test('the randomizer rejects an invalid random source result', () => {
  assert.throws(() => randomBowlingBallPalette(() => -0.1), /random source must return/);
  assert.throws(() => randomBowlingBallPalette(() => 1), /random source must return/);
});
