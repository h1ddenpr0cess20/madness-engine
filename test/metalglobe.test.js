import assert from 'node:assert/strict';
import { test } from 'node:test';

import { METALS, createMetalGlobe } from '../src/props/metalglobe.js';

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
