import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { assetViewer, createDiamond, DIAMOND_CUT } from '../src/props/diamond.js';
import { createDiamond as fromPropsEntry } from '../src/props/index.js';

test('the diamond is a real round brilliant with a table, crown, girdle and pavilion', () => {
  const diamond = createDiamond(GFX, { mist: false });
  assert.equal(diamond.sectors, DIAMOND_CUT.sectors);
  assert.equal(fromPropsEntry, createDiamond);
  assert.equal(diamond.stone.name, 'brilliant-cut diamond');
  assert.ok(diamond.geometry.attributes.position.count >= DIAMOND_CUT.sectors * 30);
  assert.equal(diamond.material.transmission, 1);
  assert.equal(diamond.material.ior, 2.12);
  assert.equal(diamond.material.roughness, 0.018);
  assert.equal(diamond.volume.visible, false);
  assert.equal(diamond.group.children.includes(diamond.stone), true);
  assert.equal(diamond.group.children.includes(diamond.volume), true);
  diamond.setMist(true);
  assert.equal(diamond.volume.visible, true);
  diamond.update(0.25);
  assert.ok(diamond.mistMaterial.uniforms.uFlow.value > 0);
  assert.ok(diamond.mistMaterial.uniforms.uShape.value.y < diamond.mistMaterial.uniforms.uShape.value.x);
  assert.equal(diamond.mistMaterial.uniforms.uDuo.value, 1);
  assert.deepEqual(diamond.mistMaterial.uniforms.uTint.value.toArray(), [0.84, 0.94, 1]);
  diamond.setMist(false);
  assert.equal(diamond.mist, false);
  diamond.dispose();
});

test('diamond validates its dimensions and tessellation', () => {
  assert.throws(() => createDiamond(GFX, { radius: 0 }), /positive finite/);
  assert.throws(() => createDiamond(GFX, { height: -1 }), /positive finite/);
  assert.throws(() => createDiamond(GFX, { sectors: 8 }), /12 to 128/);
});

test('the diamond registers itself for the asset viewer without a manual catalog entry', () => {
  assert.equal(assetViewer.id, 'diamond');
  assert.equal(assetViewer.category, 'Props');
  assert.equal(assetViewer.group, 'glass & crystal');
  assert.equal(typeof assetViewer.build, 'function');
  const built = assetViewer.build();
  assert.equal(built.object.name, 'diamond');
  assert.equal(built.mist.get(), true);
  built.mist.set(false);
  assert.equal(built.mist.get(), false);
});
