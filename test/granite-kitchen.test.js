import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { GRANITES } from '../src/heroes/rock-granite.js';
import { METALS } from '../src/props/metalglobe.js';
import { createGraniteKitchen, createGraniteCounter, createKitchenSink, MAX_LENGTH, MIN_LENGTH, radialOnRect, sdRoundRect } from '../src/props/granite-kitchen.js';
import { rawLumber, finishedWood, WOOD_SPECIES } from '../src/textures/wood.js';
import { FINISHES } from '../src/props/granite-kitchen.js';
import { METALS as ALL_METALS } from '../src/props/metalglobe.js';

const doors = (group) => group.children.filter((c) => /^finished hardwood cabinet door/.test(c.name)).length;

test('hardwood texture exposes raw and finished variants over the same species palette', () => {
  for (const species of Object.keys(WOOD_SPECIES)) {
    assert.ok(rawLumber(GFX, species));
    assert.ok(finishedWood(GFX, species));
    assert.notEqual(rawLumber(GFX, species), finishedWood(GFX, species));
  }
});

test('the kitchen reuses the engine granite and metal palettes, and is a counter with a sink in it', () => {
  assert.deepEqual(Object.keys(GRANITES), ['grey', 'pink', 'black', 'white', 'green']);
  assert.equal(METALS.copper.color, '#f08a68');
  assert.equal(METALS.brass.color, '#e0b84e');
  const kitchen = createGraniteKitchen(GFX);
  assert.equal(kitchen.group.name, 'granite kitchen counter with a copper sink');
  assert.equal(kitchen.counter.name, 'granite kitchen counter');
  assert.equal(kitchen.sink.name, 'copper kitchen sink');
  assert.equal(kitchen.group.userData.materials.granite.name, 'polished granite countertop');
  assert.equal(kitchen.group.userData.materials.finishedWood.name, 'finished walnut hardwood');
  assert.equal(kitchen.group.userData.materials.rawLumber.name, 'raw walnut lumber');
  assert.equal(kitchen.group.userData.materials.hardware.color.getHexString(), 'e0b84e');
  assert.equal(kitchen.group.userData.materials.copper.color.getHexString(), 'f08a68');
  assert.ok(kitchen.sink.getObjectByName('formed copper bowl'));
  assert.ok(kitchen.sink.getObjectByName('solid brass kitchen faucet'));
  assert.ok(kitchen.counter.getObjectByName('granite countertop left wing'));
});

test('the sink is a part of its own: it builds without a counter, and its rim is at the origin', () => {
  const sink = createKitchenSink(GFX, { width: 0.6, depth: 0.42 });
  assert.equal(sink.group.name, 'copper kitchen sink');
  assert.ok(sink.group.getObjectByName('inset copper basin'));
  assert.ok(sink.group.getObjectByName('solid brass kitchen faucet'));
  assert.equal(sink.group.userData.dimensions.width, 0.6);
  assert.throws(() => createKitchenSink(GFX, { width: 2 }), /sink dimensions/);
});

test('the counter is extendable: any length in range is built, with doors counted to the run', () => {
  const short = createGraniteCounter(GFX, { length: MIN_LENGTH });
  const long = createGraniteCounter(GFX, { length: MAX_LENGTH });
  const mid = createGraniteCounter(GFX, { length: 4.2 });
  assert.ok(doors(short.group) >= 2);
  assert.ok(doors(long.group) > doors(short.group));
  assert.equal(doors(mid.group), Math.round(4.2 / 0.62));
  assert.equal(long.group.userData.dimensions.length, MAX_LENGTH);
  assert.throws(() => createGraniteCounter(GFX, { length: MAX_LENGTH + 0.1 }), /dimensions/);
  assert.throws(() => createGraniteCounter(GFX, { length: MIN_LENGTH - 0.1 }), /dimensions/);
});

test('a counter with no cutout is one solid top, and one with a cutout has four pieces round the aperture', () => {
  const solid = createGraniteCounter(GFX, { length: 2.4 });
  assert.ok(solid.group.getObjectByName('polished solid granite countertop'));
  assert.equal(solid.group.getObjectByName('granite countertop left wing'), undefined);
  const cut = createGraniteCounter(GFX, { length: 2.4, cutout: { x: -0.4, z: 0, width: 0.6, depth: 0.4 } });
  for (const name of ['left wing', 'right wing', 'rear rail', 'front rail']) assert.ok(cut.group.getObjectByName(`granite countertop ${name}`), name);
  assert.ok(cut.group.getObjectByName('raw lumber carcass, under the sink'));
  assert.throws(() => createGraniteCounter(GFX, { length: 2.4, cutout: { x: 1.3, z: 0, width: 0.6, depth: 0.4 } }), /does not fit/);
});

test('the finished boards are lacquered, the raw lumber is not', () => {
  const kitchen = createGraniteKitchen(GFX);
  assert.equal(kitchen.finishedWood.clearcoat, 1);
  assert.ok(kitchen.finishedWood.clearcoatRoughness <= 0.1);
  assert.equal(kitchen.rawLumber.clearcoat, 0);
});

test('the kitchen validates material selectors and dimensions', () => {
  assert.throws(() => createGraniteKitchen(GFX, { granite: 'blue' }), /unknown granite/);
  assert.throws(() => createGraniteKitchen(GFX, { wood: 'balsa' }), /unknown hardwood/);
  assert.throws(() => createGraniteKitchen(GFX, { basinMetal: 'tin' }), /invalid basin metal/);
  assert.throws(() => createGraniteKitchen(GFX, { fixtureMetal: 'tin' }), /invalid fixture metal/);
  assert.throws(() => createGraniteKitchen(GFX, { length: 9 }), /dimensions/);
});

test('every engine metal finish is available for the basin and the fixtures', () => {
  assert.deepEqual(FINISHES, Object.keys(ALL_METALS));
  for (const metal of FINISHES) {
    const kitchen = createGraniteKitchen(GFX, { basinMetal: metal, fixtureMetal: metal, hardwareMetal: metal });
    assert.equal(kitchen.copper.name, metal);
    assert.equal(kitchen.faucet.name, metal);
    assert.equal(kitchen.hardware.name, metal);
  }
});

test('cabinet hardware and the faucet take separate finishes', () => {
  const kitchen = createGraniteKitchen(GFX, { hardwareMetal: 'chrome', fixtureMetal: 'gold' });
  assert.equal(kitchen.hardware.name, 'chrome');
  assert.equal(kitchen.faucet.name, 'gold');
  assert.ok(kitchen.counter.getObjectByName('brass cabinet pull 1'));
  assert.equal(kitchen.counter.getObjectByName('brass cabinet pull 1').material.name, 'chrome');
  assert.equal(kitchen.sink.getObjectByName('solid brass kitchen faucet').children.find((c) => c.name === 'brass faucet escutcheon').material.name, 'gold');
  assert.throws(() => createGraniteKitchen(GFX, { hardwareMetal: 'tin' }), /invalid hardware metal/);
});

test('the bowl outline reaches the rim at every angle: no pinch at the sink corners', () => {
  const hx = 0.3, hz = 0.2, rr = 0.015;
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const d = radialOnRect(c, s, hx, hz, rr);
    assert.ok(Math.abs(sdRoundRect(d * c, d * s, hx - rr, hz - rr, rr)) < 1e-6, `angle ${a}`);
  }
  // Along the sides and into the corner the outline is the rim, not inside it.
  assert.ok(Math.abs(radialOnRect(1, 0, hx, hz, rr) - hx) < 1e-6);
  assert.ok(Math.abs(radialOnRect(0, 1, hx, hz, rr) - hz) < 1e-6);
});

test('the counter holds together: doors, drawers, pulls and the faucet lever all touch the rest', async () => {
  const { Box3 } = GFX;
  const kitchen = createGraniteKitchen(GFX, {});
  kitchen.group.updateMatrixWorld(true);
  const boxes = [];
  kitchen.group.traverse((m) => { if (m.isMesh) boxes.push(new Box3().setFromObject(m)); });
  const seen = new Set([0]), st = [0];
  while (st.length) { const k = st.pop(); boxes.forEach((b, j) => { if (!seen.has(j) && boxes[k].intersectsBox(b)) { seen.add(j); st.push(j); } }); }
  assert.equal(seen.size, boxes.length);
});

test('every door hangs on two brass hinges, each with a barrel and a leaf', () => {
  const { group } = createGraniteCounter(GFX, { length: 2.8 });
  const names = group.children.map((c) => c.name);
  const doors = names.filter((n) => n.startsWith('finished hardwood cabinet door')).length;
  assert.ok(doors >= 2);
  assert.equal(names.filter((n) => n.startsWith('brass cabinet hinge barrel')).length, doors * 2);
  assert.equal(names.filter((n) => n.startsWith('brass cabinet hinge leaf')).length, doors * 2);
});
