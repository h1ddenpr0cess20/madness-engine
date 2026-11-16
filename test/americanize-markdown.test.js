import { test } from 'node:test';
import assert from 'node:assert/strict';

import { americanizeMarkdown } from '../scripts/extract/library.mjs';

test('americanizes prose spellings and keeps capitalization', () => {
  assert.equal(americanizeMarkdown('The Colour of the Neighbour.'), 'The Color of the Neighbor.');
  assert.equal(americanizeMarkdown('colourable and coloured'), 'colorable and colored');
});

test('leaves inline code and fenced blocks unchanged', () => {
  const input = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolour here';
  const expected = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolor here';
  assert.equal(americanizeMarkdown(input), expected);
});
