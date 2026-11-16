import { test } from 'node:test';
import assert from 'node:assert/strict';

import { americanizeMarkdown } from '../scripts/extract/library.mjs';

// The British inputs are split across concatenations so the spelling pass over the repository
// does not rewrite them into American spellings and turn these tests into no-ops.
const colour = 'col' + 'our';
const neighbour = 'neigh' + 'bour';

test('americanizes prose spellings and keeps capitalization', () => {
  assert.equal(americanizeMarkdown(`The ${colour[0].toUpperCase()}${colour.slice(1)} of the ${neighbour}.`), 'The Color of the neighbor.');
  assert.equal(americanizeMarkdown(`${colour}able and ${colour}ed`), 'colorable and colored');
});

test('leaves inline code and fenced blocks unchanged', () => {
  const input = `Use \`${colour}\` for the value.\n\n\`\`\`js\n// ${colour}\n\`\`\`\n\n${colour} here`;
  const expected = 'Use `' + colour + '` for the value.\n\n```js\n// ' + colour + '\n```\n\ncolor here';
  assert.equal(americanizeMarkdown(input), expected);
});
