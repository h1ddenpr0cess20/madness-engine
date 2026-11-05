import assert from 'node:assert/strict';
import { test } from 'node:test';

import { METALS, createMetalGlobe, reverseRelief } from '../src/props/metalglobe.js';

test('there are the usual metals, each with a color and a roughness', () => {
  for (const name of ['steel', 'silver', 'gold', 'copper', 'bronze', 'brass']) {
    assert.ok(METALS[name], name);
    assert.match(METALS[name].color, /^#[0-9a-f]{6}$/);
    assert.ok(METALS[name].roughness > 0 && METALS[name].roughness < 1);
  }
});

test('a metal globe changes its metal, and refuses one it does not know', () => {
  const colors = [];
  const GFX = {
    CanvasTexture: class {}, RepeatWrapping: 1, Color: class { constructor() {} set(c) { colors.push(c); } },
    MeshPhysicalMaterial: class { constructor(o) { Object.assign(this, o); } },
    SphereGeometry: class {}, Mesh: class { constructor(g, m) { this.material = m; } },
    Group: class { constructor() { this.rotation = { set() {} }; } add() {} },
  };
  const globe = createMetalGlobe(GFX, { metal: 'gold' });
  assert.equal(globe.metal, 'gold');
  globe.setMetal('copper');
  assert.equal(globe.metal, 'copper');
  assert.equal(colors.at(-1), METALS.copper.color);
  assert.throws(() => globe.setMetal('unobtainium'), /no metal/);
});


test('reverseRelief mirrors the equirectangular canvas left-to-right', () => {
  const source = { width: 4096, height: 2048 };
  const calls = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext(kind) {
          assert.equal(kind, '2d');
          return {
            translate: (...args) => calls.push(['translate', ...args]),
            scale: (...args) => calls.push(['scale', ...args]),
            drawImage: (...args) => calls.push(['drawImage', ...args]),
          };
        },
      };
    },
  };
  try {
    const reversed = reverseRelief(source);
    assert.equal(reversed.width, source.width);
    assert.equal(reversed.height, source.height);
    assert.deepEqual(calls, [
      ['translate', source.width, 0],
      ['scale', -1, 1],
      ['drawImage', source, 0, 0],
    ]);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
