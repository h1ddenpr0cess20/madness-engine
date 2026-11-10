import assert from 'node:assert/strict';
import { test } from 'node:test';

import { JUPITER_HEIGHT, JUPITER_JPEG, JUPITER_WIDTH } from '../src/textures/jupiter/layout.js';
import { createJupiterEtch, loadJupiterMap, LAYOUT, RADIUS_KM, SIZE_VS_EARTH } from '../src/textures/jupiter/map.js';

test('Jupiter is 11.0 of the Earth across', () => {
  assert.equal(RADIUS_KM, 69911);
  assert.ok(Math.abs(SIZE_VS_EARTH - 10.97) < 0.01);
});

test('the clouds are a 2:1 colour JPEG, as large as the layout says', async () => {
  const bytes = Buffer.from(JUPITER_JPEG, 'base64');
  assert.deepEqual([...bytes.slice(0, 3)], [0xff, 0xd8, 0xff]);
  // Find the frame header (SOF0/SOF2): height, width and three components.
  let i = 2, found = null;
  while (i < bytes.length) {
    const marker = bytes[i + 1], length = bytes.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) { found = { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7), components: bytes[i + 9] }; break; }
    i += 2 + length;
  }
  assert.deepEqual(found, { height: JUPITER_HEIGHT, width: JUPITER_WIDTH, components: 3 });
  assert.equal(LAYOUT.width / LAYOUT.height, 2);
  assert.equal(await loadJupiterMap(), null, 'nothing to paint on under Node');
});


test('the glass Jupiter etching frosts bright cloud zones and leaves dark belts clear', () => {
  const previousDocument = globalThis.document;
  const data = new Uint8ClampedArray([
    255, 255, 255, 255, // bright cloud zone
    192, 180, 160, 255, // intermediate cloud detail
    72, 64, 58, 255,    // dark belt
  ]);
  let written = null;
  const context = {
    drawImage() {},
    getImageData() { return { data }; },
    putImageData(imageData) { written = [...imageData.data]; },
  };
  globalThis.document = {
    createElement() {
      return { width: 0, height: 0, getContext() { return context; } };
    },
  };

  try {
    const etch = createJupiterEtch({ width: 3, height: 1 });
    assert.equal(etch.width, 3);
    assert.equal(etch.height, 1);
    assert.ok(written[3] > written[7], 'bright zones carry more frost than intermediate clouds');
    assert.equal(written[11], 0, 'dark belts remain clear');
    assert.deepEqual(written.slice(0, 3), [255, 240, 228], 'the Jupiter frost is warm ivory');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
