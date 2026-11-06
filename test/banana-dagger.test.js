import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { BANANA_DAGGER_DIMENSIONS, createBananaDagger } from '../src/weapons/index.js';
import { METALS } from '../src/props/metalglobe.js';

function edgeUseCounts(geometry) {
  const indices = geometry.index.array;
  const edges = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = a < b ? a + ':' + b : b + ':' + a;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  return [...edges.values()];
}

test('banana dagger has a curved chrome blade, three two-tone peel lobes and no pommel', () => {
  const dagger = createBananaDagger(GFX);
  assert.equal(dagger.name, 'Banana Dagger');
  assert.equal(dagger.bladeMetal, 'chrome');
  assert.equal(dagger.hiltMetal, 'brass');
  assert.equal(dagger.innerMetal, 'chrome');
  assert.equal(dagger.pommel, null);
  assert.equal(dagger.dimensions.pommelStyle, 'none');
  assert.equal(dagger.endCap.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(dagger.blade.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(dagger.guard.children.filter((part) => part.name.startsWith('peeled banana lobe')).length, 3);
  const lobes = dagger.guard.children.filter((part) => part.name.startsWith('peeled banana lobe'));
  assert.equal(lobes.length, 3);
  assert.ok(lobes.every((lobe) => lobe.children.length === 2));
  for (const lobe of lobes) {
    assert.equal(lobe.children[0].material.color.getHexString(), METALS.brass.color.slice(1));
    assert.equal(lobe.children[1].material.color.getHexString(), METALS.chrome.color.slice(1));
  }
  const positions = dagger.blade.geometry.attributes.position;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.count; i++) {
    minZ = Math.min(minZ, positions.getZ(i));
    maxZ = Math.max(maxZ, positions.getZ(i));
  }
  assert.ok(maxZ - minZ > 0.035, 'blade has a visible banana-like sweep');
  assert.ok(edgeUseCounts(dagger.blade.geometry).every((count) => count === 2),
    'the curved blade is a closed solid with no open boundary edges');
  assert.ok(dagger.blade.geometry.userData.fullerLength
    === dagger.dimensions.bladeLength * 0.75,
  'the shallow fuller fades out at 75% of the blade length');
  assert.equal(dagger.dimensions.overallLength, BANANA_DAGGER_DIMENSIONS.overallLength);
  assert.equal(dagger.dimensions.fullerLength, BANANA_DAGGER_DIMENSIONS.bladeLength * 0.75);
});

test('banana dagger exposes independent blade, peel exterior and inner-face metal controls', () => {
  const dagger = createBananaDagger(GFX, { bladeMetal: 'silver', hiltMetal: 'gold', innerMetal: 'platinum' });
  assert.equal(dagger.bladeMetal, 'silver');
  assert.equal(dagger.hiltMetal, 'gold');
  assert.equal(dagger.innerMetal, 'platinum');
  dagger.setBladeMetal('chrome').setHiltMetal('brass').setInnerMetal('chrome');
  assert.equal(dagger.endCap.material, dagger.blade.material,
    'the dark-tip-shaped end cap uses the blade metal itself');
  assert.equal(dagger.blade.material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(dagger.guard.children[0].children[0].material.color.getHexString(), METALS.brass.color.slice(1));
  assert.equal(dagger.guard.children[0].children[1].material.color.getHexString(), METALS.chrome.color.slice(1));
  assert.throws(() => dagger.setInnerMetal('unobtanium'), /no metal called/);
});
