import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RELIEF_HEIGHT, RELIEF_JPEG, RELIEF_WIDTH } from '../src/textures/moon/relief.js';
import { loadMoonEtch, RADIUS_KM, RELIEF, SIZE_VS_EARTH } from '../src/textures/moon/map.js';

test('the Moon is 0.273 of the Earth across', () => {
  assert.equal(RADIUS_KM, 1737.4);
  assert.ok(Math.abs(SIZE_VS_EARTH - 0.273) < 0.001);
});

test('the surface is a 2:1 grayscale JPEG of the LOLA relief, as large as the Earth\'s etching', async () => {
  const bytes = Buffer.from(RELIEF_JPEG, 'base64');
  assert.deepEqual([...bytes.slice(0, 3)], [0xff, 0xd8, 0xff]);
  // Find the frame header (SOF0/SOF2): height, width and one component.
  let i = 2, found = null;
  while (i < bytes.length) {
    const marker = bytes[i + 1], length = bytes.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) { found = { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7), components: bytes[i + 9] }; break; }
    i += 2 + length;
  }
  assert.deepEqual(found, { height: RELIEF_HEIGHT, width: RELIEF_WIDTH, components: 1 });
  assert.equal(RELIEF_WIDTH, 4096);
  assert.equal(RELIEF.width / RELIEF.height, 2);
  assert.equal(await loadMoonEtch(), null, 'nothing to paint on under Node');
});
