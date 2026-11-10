import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createStaff, STAFF_DIMENSIONS, STAFF_TOPPERS } from '../src/weapons/index.js';
import { WOOD_SPECIES } from '../src/textures/wood.js';
import { JEWEL_CHOICES, JEWELS } from '../src/heroes/rock-jewel.js';

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
  assert.deepEqual([...STAFF_TOPPERS], ['orb', 'egg', 'earth', 'mars', 'moon', 'jupiter', 'jupiter-etched', ...JEWEL_CHOICES, 'none']);
  assert.throws(() => createStaff(GFX, { metal: 'tin' }), /no metal called tin/);
});

test('each glass planet is a topper, in its own mist, cradled like the orb', () => {
  for (const planet of ['earth', 'mars', 'moon', 'jupiter', 'jupiter-etched']) {
    const staff = createStaff(GFX, { topper: planet });
    assert.equal(staff.topper, planet);
    const globe = staff.topperAsset;
    assert.ok(globe.glass && globe.mist, `${planet}: glass and mist are built`);
    assert.equal(globe.group.name, `glass ${planet}`);
    assert.equal(globe.radius, STAFF_DIMENSIONS.orbRadius, `${planet}: drawn at the orb's radius, the one its cradle is cut for`);
    const [shown] = visibleToppers(staff);
    assert.equal(shown, globe.group);
    assert.ok(shown.position.y > STAFF_DIMENSIONS.cradleDepth, `${planet}: centered above the cradle lip`);
    assert.ok(staff.dimensions.overallLength > 1.6 && staff.dimensions.overallLength < 2);
  }
});

test('the planet toppers swap with the orb and egg, and hide the one not shown', () => {
  const staff = createStaff(GFX, { topper: 'mars' });
  assert.equal(staff.info.Topper, 'Glass Mars');
  staff.setTopper('jupiter-etched');
  assert.equal(staff.info.Topper, 'Glass Jupiter (etched)');
  assert.equal(visibleToppers(staff).length, 1);
  assert.equal(visibleToppers(staff)[0].name, 'glass jupiter-etched');
  staff.setTopper('orb');
  assert.equal(visibleToppers(staff)[0], staff.orb.group);
  assert.throws(() => staff.setTopper('pluto'), /no topper called pluto/);
});

test('a planet with no map is clear glass with its mist, never the Earth painted on the wrong world', () => {
  const mars = createStaff(GFX, { topper: 'mars' });
  const earth = createStaff(GFX, { topper: 'earth' });
  const glassOf = (s) => s.topperAsset.glass;
  assert.equal(glassOf(mars).name, 'glass');
  const etched = (s) => s.topperAsset.group.children.filter((c) => /^etch-/.test(c.name)).length;
  assert.equal(etched(mars), 0, 'Mars without its etching has no continents on it');
  assert.equal(etched(earth), 0, 'in the test environment the Earth has no canvas to paint on either, so it is clear too');
});

test('the metal staff is the wooden staff with its wooden parts in a metal finish', () => {
  const staff = createStaff(GFX, { metal: 'rose gold' });
  assert.equal(staff.metal, 'rose gold');
  assert.equal(staff.info.Metal, 'rose gold');
  assert.equal(staff.info.Wood, undefined);
  assert.equal(staff.shaft.material.name, 'staff rose gold');
  assert.equal(staff.shaft.material.metalness, 1);
  const cup = staff.head.children.find((c) => c.name === 'topper cup');
  assert.equal(cup.material, staff.shaft.material, 'the cup takes the metal too');
  const roots = staff.head.children.filter((c) => c.name.startsWith('root tendril'));
  assert.ok(roots.length > 0 && roots.every((r) => r.material === staff.shaft.material), 'the roots are metal');
  assert.equal(staff.vine, true, 'the entwined roots are still there');
  const leatherMats = [staff.grip, staff.gripThread].map((m) => m.material.name);
  assert.deepEqual(leatherMats, ['staff leather', 'staff thread'], 'the grip is still leather and thread');
});

test('the metal finish can change, and a topper built later is in it too', () => {
  const staff = createStaff(GFX, { metal: 'steel', topper: 'orb' });
  staff.setMetal('gold');
  assert.equal(staff.metal, 'gold');
  assert.equal(staff.shaft.material.name, 'staff gold');
  staff.setTopper('egg');
  const cup = staff.head.children.find((c) => c.name === 'topper cup');
  assert.equal(cup.material.name, 'staff gold', 'the head rebuilt for the egg is in the metal too');
  staff.setTopper('earth');
  const tendril = staff.head.children.find((c) => c.name === 'root tendril 1');
  assert.equal(tendril.material.name, 'staff gold');
  assert.throws(() => staff.setMetal('tin'), /no metal called tin/);
});

test('setWood turns the metal staff back to wood, and a wooden staff can go to metal', () => {
  const staff = createStaff(GFX, { metal: 'chrome' });
  staff.setWood('oak', 'raw');
  assert.equal(staff.metal, null);
  assert.equal(staff.info.Wood, 'oak (raw)');
  assert.equal(staff.shaft.material.name, 'raw oak');
  const cup = staff.head.children.find((c) => c.name === 'topper cup');
  assert.equal(cup.material, staff.shaft.material);

  const wooden = createStaff(GFX);
  wooden.setMetal('copper');
  assert.equal(wooden.shaft.material.name, 'staff copper');
  assert.equal(wooden.metal, 'copper');
  assert.equal(createStaff(GFX).metal, null, 'the default staff is wood');
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

test('each gem is a topper: the jewel stone in its color, with its mist, cradled like the orb', () => {
  for (const gem of ['sapphire', 'ruby', 'emerald', 'amber']) {
    const staff = createStaff(GFX, { topper: gem });
    assert.equal(staff.topper, gem);
    assert.equal(staff.topperAsset.colour, JEWELS[gem]);
    assert.ok(staff.topperAsset.mist, `${gem}: the mist is built`);
    assert.equal(visibleToppers(staff)[0], staff.topperAsset.mesh);
    assert.ok(staff.info.Topper.toLowerCase().startsWith(gem));
  }
});
