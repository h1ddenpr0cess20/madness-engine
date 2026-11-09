import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createStaff, STAFF_TOPPERS } from '../src/weapons/index.js';
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
  assert.deepEqual([...STAFF_TOPPERS], ['orb', 'egg', 'none']);
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
