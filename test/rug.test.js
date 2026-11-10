import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RUG_DEFAULTS, RUG_PALETTES, RUG_PALETTE_NAMES, assetViewer, createPersianRug } from '../src/props/rug.js';

class Group {
  constructor() { this.children = []; this.userData = {}; this.name = ''; }
  add(object) { this.children.push(object); object.parent = this; }
}
class Geometry {
  constructor(...args) { this.parameters = args; }
  setIndex(indices) { this.index = indices; }
  setAttribute(name, attribute) { this.attributes ??= {}; this.attributes[name] = attribute; }
  computeVertexNormals() { this.normalsComputed = true; }
}
class Attribute { constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; } }
class Mesh {
  constructor(geometry, material) {
    this.geometry = geometry; this.material = material;
    this.position = { set: (...values) => { this.position.values = values; } };
    this.rotation = { x: 0 }; this.name = ''; this.castShadow = false; this.receiveShadow = false;
  }
}
class Material { constructor(options) { Object.assign(this, options); } }
const GFX = {
  Group, Mesh, MeshStandardMaterial: Material, BoxGeometry: Geometry, PlaneGeometry: Geometry,
  BufferGeometry: Geometry, Float32BufferAttribute: Attribute, DoubleSide: 2,
};

test('the rug keeps its default size and the wool colourway', () => {
  assert.deepEqual({ ...RUG_DEFAULTS }, { width: 3.8, depth: 3.15, thickness: 0.018, fringeLength: 0.075, palette: 'wool' });
  const rug = createPersianRug(GFX);
  assert.equal(rug.group.name, 'ornate Persian rug');
  assert.equal(rug.group.children.length, 7);
  assert.equal(rug.group.userData.dimensions.palette, 'wool');
  assert.equal(rug.binding.color, '#927b55', 'binding stays in muted antique brass');
  assert.equal(rug.foundation.color, '#514638', 'foundation uses warm brown wool tones');
  assert.equal(rug.fringe.color, '#c7b99d', 'fringe uses natural undyed wool');
  assert.equal(rug.group.children.at(-1).name, 'hand-knotted ivory fringe');
});

test('each colourway is a full palette with the same keys', () => {
  assert.deepEqual(RUG_PALETTE_NAMES, ['wool', 'rose', 'sage', 'indigo']);
  const keys = Object.keys(RUG_PALETTES.wool).sort();
  for (const name of RUG_PALETTE_NAMES) {
    assert.deepEqual(Object.keys(RUG_PALETTES[name]).sort(), keys, `${name} has every colour`);
    for (const value of Object.values(RUG_PALETTES[name])) assert.match(value, /^#[0-9a-f]{6}$/);
  }
  const fields = RUG_PALETTE_NAMES.map((name) => RUG_PALETTES[name].field);
  assert.equal(new Set(fields).size, fields.length, 'each colourway has its own field colour');
});

test('a rug takes its colourway, size and fringe, and records them', () => {
  const rug = createPersianRug(GFX, { palette: 'rose', width: 2.6, depth: 2.1, fringeLength: 0.05 });
  assert.deepEqual(rug.dimensions, { width: 2.6, depth: 2.1, thickness: 0.018, fringeLength: 0.05, palette: 'rose' });
  assert.equal(rug.group.userData.dimensions.palette, 'rose');
});

test('an unknown colourway is refused before anything is built', () => {
  assert.throws(() => createPersianRug(GFX, { palette: 'neon' }), /rug palette must be one of wool, rose, sage, indigo/);
});

test('the asset viewer registers the rug with its colourways and sizes as options', () => {
  assert.equal(assetViewer.id, 'persian-rug');
  assert.equal(assetViewer.category, 'Props');
  assert.deepEqual(assetViewer.options.palette, RUG_PALETTE_NAMES);
  assert.deepEqual(assetViewer.options.width, [2.6, 3.8, 4.8]);
  assert.deepEqual(assetViewer.options.depth, [2.1, 3.15, 4.8]);
  const built = assetViewer.build({ GFX, palette: 'sage', width: 2.6, depth: 2.1 });
  assert.equal(built.dimensions.palette, 'sage');
  assert.equal(built.dimensions.width, 2.6);
  assert.equal(built.dimensions.depth, 2.1);
});
