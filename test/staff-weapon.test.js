import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createStaff, createMetalStaff, STAFF_TOPPERS, METALS } from '../src/weapons/index.js';
import { WOOD_SPECIES } from '../src/textures/wood.js';

const visibleToppers = (staff) => staff.head.children
  .find((c) => c.name === 'staff topper').children.filter((c) => c.visible);

test('the staff is an all-wood, metre-scale weapon with the Krystal orb on top by default', () => {
  const staff = createStaff(GFX);
  assert.equal(staff.topper, 'orb');
  assert.equal(staff.species, 'walnut');
  assert.ok(staff.dimensions.overallLength > 1.6 && staff.dimensions.overallLength < 2);
  assert.equal(staff.shaft.material.name, 'lacquered walnut');
  assert.ok(staff.orb.glass && staff.orb.vision, 'the real crystal orb glass and vision are used');
  assert.equal(visibleToppers(staff).length, 1);
});

test('the orb sits in a cradle of root tendrils, and a seed gives another staff', () => {
  const staff = createStaff(GFX, { tendrils: 12 });
  const tendrils = staff.head.children.filter((c) => c.name.startsWith('root tendril'));
  assert.equal(tendrils.length, 12);
  const orb = staff.head.children.find((c) => c.name === 'staff topper').children[0];
  assert.ok(orb.position.y > staff.dimensions.cradleDepth, 'the orb centre is above the cradle lip');
  const first = (s) => s.head.children.find((c) => c.name === 'root tendril 1').geometry.attributes.position.array;
  assert.deepEqual([...first(createStaff(GFX))], [...first(createStaff(GFX))], 'the same seed gives the same staff');
  assert.notDeepEqual([...first(createStaff(GFX))], [...first(createStaff(GFX, { seed: 99 }))]);
});

test('the glass egg is an optional topper, point up, and can be swapped with the orb', () => {
  const staff = createStaff(GFX, { topper: 'egg' });
  assert.equal(staff.topper, 'egg');
  assert.ok(staff.egg.glass && staff.egg.mist, 'the real glass egg and mist are used');
  assert.equal(staff.orb, null, 'the orb is not built until it is asked for');
  const eggHolder = visibleToppers(staff)[0];
  assert.ok(Math.abs(eggHolder.rotation.z - Math.PI) < 1e-9, 'the egg is turned over so its narrow end points up');

  staff.setTopper('orb');
  assert.equal(staff.topper, 'orb');
  assert.ok(staff.orb);
  assert.equal(visibleToppers(staff).length, 1);
  assert.equal(visibleToppers(staff)[0], staff.orb.group);

  staff.setTopper('none');
  assert.equal(visibleToppers(staff).length, 0);
  assert.ok(staff.dimensions.overallLength > 1.6);
});

test('the Madness marble is an optional topper using the existing glass marble and 3D spark', () => {
  const staff = createStaff(GFX, { topper: 'marble' });
  assert.equal(staff.topper, 'marble');
  assert.ok(staff.marble.asset.marble && staff.marble.asset.glass && staff.marble.asset.spark);
  assert.equal(staff.marble.group.position.y, staff.dimensions.cradleDepth + 0.045);
  assert.equal(visibleToppers(staff).length, 1);
});

test('the glass planets reuse the glass globe factory and all start with mist enabled', async () => {
  const staff = createStaff(GFX, { topper: 'moon' });
  assert.equal(staff.topper, 'moon');
  assert.ok(staff.moon);
  await staff.topperReady;
  assert.equal(staff.moon.mist.visible, true);
  assert.equal(staff.moon.glass.material.transmission, 1);

  for (const kind of ['globe', 'moon', 'mars', 'jupiter']) {
    staff.setTopper(kind);
    await staff.topperReady;
    const planet = staff.topperAsset;
    assert.ok(planet, `${kind} is available as a staff topper`);
    assert.equal(planet.mist.visible, true, `${kind} has its mist enabled`);
    assert.equal(planet.glass.material.transmission, 1, `${kind} uses the shared transmissive glass`);
    assert.equal(visibleToppers(staff).length, 1);
  }
});

test('the metal staff preserves the wooden staff design while using the selected engine metal throughout its structure', () => {
  const staff = createMetalStaff(GFX, { metal: 'copper', tendrils: 12 });
  assert.equal(staff.materialType, 'metal');
  assert.equal(staff.metal, 'copper');
  assert.equal(staff.finish, null);
  assert.equal(staff.info.Metal, 'copper');
  assert.equal(staff.shaft.material.metalness, 1);
  assert.equal(staff.shaft.material.color.getHexString(), 'f08a68');
  assert.equal(staff.head.children.find((child) => child.name === 'metal topper cup').material, staff.shaft.material);
  const metalParts = [];
  staff.group.traverse((object) => {
    if (object.isMesh && object.material.name === 'staff metal') metalParts.push(object);
  });
  assert.ok(metalParts.length > 20, 'the shaft, vines, cup, tendrils and bindings share the metal finish');
  assert.ok(metalParts.every((mesh) => mesh.material === staff.shaft.material));
  assert.throws(() => staff.setWood(), /only available on a wooden staff/);

  staff.setMetal('rose gold');
  assert.equal(staff.metal, 'rose gold');
  assert.equal(staff.shaft.material.color.getHexString(), 'f0aa9a');
  assert.ok(metalParts.every((mesh) => mesh.material === staff.shaft.material));

  for (const metal of Object.keys(METALS)) {
    assert.doesNotThrow(() => staff.setMetal(metal));
    assert.equal(staff.metal, metal);
  }
  assert.throws(() => staff.setMetal('unobtainium'), /no metal called/);
  assert.throws(() => createMetalStaff(GFX, { metal: 'unobtainium' }), /no metal called/);
});

test('wood and grip colours are customizable at creation and afterwards', () => {
  const staff = createStaff(GFX, { species: 'oak', finish: 'raw', gripColor: '#112233', threadColor: '#ffeeaa' });
  assert.equal(staff.species, 'oak');
  assert.equal(staff.gripColor, '#112233');
  assert.equal(staff.threadColor, '#ffeeaa');
  const before = staff.shaft.material;
  staff.setWood('cherry', 'sanded');
  assert.notEqual(staff.shaft.material, before);
  assert.equal(staff.shaft.material.name, 'sanded cherry');
  assert.equal(staff.species, 'cherry');
  staff.setGripColor('#abcdef').setThreadColor('#123456');
  assert.equal(staff.gripColor, '#abcdef');
  assert.equal(staff.threadColor, '#123456');
  for (const species of Object.keys(WOOD_SPECIES)) assert.doesNotThrow(() => staff.setWood(species));
});

test('the staff rejects unknown choices', () => {
  assert.throws(() => createStaff(GFX, { species: 'balsa' }), /no wood called/);
  assert.throws(() => createStaff(GFX, { topper: 'cube' }), /no topper called/);
  assert.throws(() => createStaff(GFX, { tendrils: 2 }), RangeError);
  assert.throws(() => createStaff(GFX, { gripColor: 'red' }), TypeError);
  assert.deepEqual([...STAFF_TOPPERS], ['orb', 'egg', 'marble', 'globe', 'moon', 'mars', 'jupiter', 'none']);
});

test('every decorative part is wood: only the grip leather and thread are not', () => {
  const staff = createStaff(GFX);
  const others = new Set();
  staff.group.traverse((o) => {
    if (o.isMesh && !/^(staff topper|Krystal|glass|vision)/.test(o.name) && !o.material.name.endsWith('walnut')) others.add(o.name);
  });
  const allowed = new Set(['leather grip', 'grip thread', 'grip thread crossing']);
  const unexpected = [...others].filter((n) => !allowed.has(n) && !['glass', 'vision'].includes(n));
  assert.deepEqual(unexpected, []);
  staff.setWood('teak', 'raw');
  assert.equal(staff.shaft.material.name, 'raw teak');
  const cup = staff.head.children.find((c) => c.name === 'topper cup');
  assert.equal(cup.material, staff.shaft.material, 'the cup follows the wood chosen');
});

test('the grip wrap is optional', () => {
  const bare = createStaff(GFX, { wrap: false });
  assert.equal(bare.wrap, false);
  assert.ok([bare.grip, bare.gripThread, bare.gripThread2].every((m) => !m.visible));
  bare.setWrap(true);
  assert.ok([bare.grip, bare.gripThread, bare.gripThread2].every((m) => m.visible));
  assert.equal(createStaff(GFX).wrap, true);
});
