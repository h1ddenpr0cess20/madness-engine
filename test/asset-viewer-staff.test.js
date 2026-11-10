import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = read('../examples/asset-viewer/src/catalog.js');
const viewer = read('../examples/asset-viewer/src/main.js');

test('the asset viewer registers separate wooden and metal wizard staff entries', () => {
  assert.ok(catalog.includes("items.push(...weaponItems(), staffItem('wood'), staffItem('metal'));"));
  assert.ok(catalog.includes("id: isMetal ? 'weapons/wizard-staff-metal' : 'weapons/wizard-staff'"));
  assert.ok(catalog.includes("name: isMetal ? 'Wizard Staff (Metal)' : 'Wizard Staff'"));
  assert.ok(catalog.includes("const build = isMetal ? createMetalStaff : createStaff;"));
});

test('the staff viewer exposes every topper and defaults its metal variant to gold', () => {
  for (const topper of ['orb', 'egg', 'marble', 'globe', 'moon', 'mars', 'jupiter', 'none']) {
    assert.ok(catalog.includes("'" + topper + "'"), `the ${topper} topper is offered`);
  }
  assert.ok(catalog.includes("Object.assign([...METAL_CHOICES], { default: 'gold' })"));
  assert.ok(catalog.includes("await made.topperReady"), 'planet surfaces finish loading before the viewer frames the model');
});

test('the metal staff picker persists its choice and the viewer-generated snippet uses the matching factory', () => {
  assert.ok(viewer.includes("item.palette?.kind === 'staff' && item.materialType === 'metal'"));
  assert.ok(viewer.includes("view.weaponMetals[item.id]?.metal ?? 'gold'"));
  assert.ok(viewer.includes("const metalStaff = view.item.materialType === 'metal';"));
  assert.ok(viewer.includes("const factory = metalStaff ? 'createMetalStaff' : 'createStaff';"));
  assert.ok(viewer.includes("metal: options.metal ?? 'gold'"));
});
