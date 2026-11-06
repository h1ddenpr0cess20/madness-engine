import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { BUCKLER_DIMENSIONS, assetViewer, createBuckler } from '../src/props/buckler.js';
import { METALS } from '../src/props/metalglobe.js';
import { CHATGPT_BLOSSOM_PATH, CHATGPT_BLOSSOM_VIEWBOX, createChatGPTMarkCanvas } from '../src/textures/chatgpt-mark.js';

test('buckler is a convex round metal shield with detailed face and a usable reverse grip', () => {
  const buckler = createBuckler(GFX);
  assert.equal(buckler.group.name, 'ChatGPT engraved round metal buckler');
  assert.equal(buckler.body.geometry.type, 'LatheGeometry');
  assert.equal(buckler.body.rotation.x, Math.PI / 2);
  assert.equal(buckler.emblem.name, 'ChatGPT logo engraved into buckler central medallion');
  assert.equal(buckler.dimensions.diameter, 0.44);
  assert.equal(buckler.radius, BUCKLER_DIMENSIONS.radius);

  const names = [];
  buckler.group.traverse((part) => { if (part.name) names.push(part.name); });
  for (const name of [
    'buckler rolled outer rim',
    'buckler outer chased bead',
    'buckler inner decorative bead',
    'buckler central boss',
    'buckler boss rolled lip',
    'buckler emblem fine bezel',
    'buckler rear leather crossgrip',
    'buckler rear palm pad',
  ]) assert.ok(names.includes(name));
  assert.equal(names.filter((name) => name.startsWith('buckler peened rim rivet')).length, 12);
  assert.equal(names.filter((name) => name.startsWith('buckler radial chased index')).length, 12);
  assert.equal(buckler.materials.body.metalness, 1);
  assert.equal(buckler.materials.accent.metalness, 1);
  assert.equal(buckler.materials.emblem.bumpScale, -0.0016);
  assert.equal(buckler.materials.leather.metalness, 0);
  assert.ok(buckler.body.geometry.attributes.position.count > 500);
  assert.ok(buckler.emblem.geometry.attributes.position.count > 150);
});

test('buckler shell and decorative trim independently support all twelve metals', () => {
  const buckler = createBuckler(GFX);
  assert.equal(buckler.metal, 'silver');
  assert.equal(buckler.accentMetal, 'gold');
  assert.equal(buckler.materials.body.color.getHexString(), METALS.silver.color.slice(1));
  assert.equal(buckler.materials.accent.color.getHexString(), METALS.gold.color.slice(1));

  buckler.setMetal('rose gold');
  buckler.setAccentMetal('platinum');
  assert.equal(buckler.materials.body.color.getHexString(), METALS['rose gold'].color.slice(1));
  assert.equal(buckler.materials.emblem.color.getHexString(), METALS['rose gold'].color.slice(1));
  assert.equal(buckler.materials.accent.color.getHexString(), METALS.platinum.color.slice(1));
  assert.equal(buckler.materials.fineAccent.color.getHexString(), METALS.platinum.color.slice(1));
  assert.throws(() => buckler.setMetal('unobtainium'), /no metal called/);
  assert.throws(() => buckler.setAccentMetal('unobtainium'), /no metal called/);
  assert.throws(() => createBuckler(GFX, { radius: 0.1 }), /radius/);
  assert.throws(() => createBuckler(GFX, { metal: 'unobtainium' }), /no metal called/);
});

test('buckler uses the exact OpenAI Blossom vector and skips canvas only in non-browser tests', () => {
  assert.deepEqual(CHATGPT_BLOSSOM_VIEWBOX, [0, 0, 256, 260]);
  assert.ok(CHATGPT_BLOSSOM_PATH.startsWith('M239.184 106.203a64.716 64.716'));
  assert.ok(CHATGPT_BLOSSOM_PATH.endsWith('-.052-32.434Z'));
  assert.ok(CHATGPT_BLOSSOM_PATH.length > 1500);
  assert.ok(CHATGPT_BLOSSOM_PATH.includes('C219.452 28.459 191 15.784 163.213 21.74'));
  assert.ok(CHATGPT_BLOSSOM_PATH.includes('v32.434Z'));
  assert.equal(createChatGPTMarkCanvas(), null);
  const buckler = createBuckler(GFX);
  assert.equal(buckler.logoTexture, null);
  assert.ok(buckler.group.children.some((part) => part.name === 'ChatGPT logo engraved into buckler central medallion'));
});

test('buckler self-registers with the asset viewer and exposes independent metal options', () => {
  assert.equal(assetViewer.id, 'buckler');
  assert.equal(assetViewer.category, 'Props');
  assert.equal(assetViewer.group, 'shields');
  assert.deepEqual(assetViewer.options.metal, Object.keys(METALS));
  assert.deepEqual(assetViewer.options.accentMetal, Object.keys(METALS));
});
