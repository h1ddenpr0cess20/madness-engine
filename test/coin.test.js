import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LOGO_PNG, LOGO_SIZE, loadCoinLogo } from '../src/textures/coin/logo.js';

test('the coin logo is a grayscale PNG as large as it says', async () => {
  const bytes = Buffer.from(LOGO_PNG, 'base64');
  assert.deepEqual([...bytes.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  assert.equal(bytes.readUInt32BE(16), LOGO_SIZE);
  assert.equal(bytes.readUInt32BE(20), LOGO_SIZE);
  assert.equal(bytes[25], 0, 'color type 0: grayscale');
  assert.equal(await loadCoinLogo(), null, 'nothing to paint on under Node');
});
