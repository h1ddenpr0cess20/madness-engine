import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { METALS } from '../src/props/metalglobe.js';
import { shadeHex } from '../src/weapons/common.js';
import * as Props from '../src/props/index.js';
import {
  PUTTER_DIMENSIONS, PUTTER_HEADS, PUTTER_HEAD_NAMES, PUTTER_LENGTHS, PUTTER_LIES, PUTTER_SIGHTS,
  assetViewer, createPutter,
} from '../src/props/putter.js';

const boxOf = (object) => { object.updateMatrixWorld(true); return new GFX.Box3().setFromObject(object); };

test('a putter is built at real size, standing on a plain metal butt cap, with no pommel', () => {
  const putter = createPutter(GFX);
  assert.equal(PUTTER_DIMENSIONS.unit, 'm');
  assert.equal(putter.dimensions.unit, 'm');
  assert.equal(putter.dimensions.overallLength, 0.864);
  assert.equal(putter.dimensions.gripLength, 0.27);
  for (const gone of ['marble', 'pommel', 'pommelAsset', 'bezel']) assert.ok(!(gone in putter), `no ${gone}`);
  assert.ok(!putter.group.getObjectByName('marble') && !putter.group.getObjectByName('spark'), 'no marble anywhere in the club');
  assert.equal(putter.buttCap.name, 'butt cap');
  assert.equal(putter.buttCap.material, putter.hiltMaterial);
  assert.equal(putter.handle.parent, putter.hilt);
  assert.equal(putter.handle.geometry.parameters.height, 0.27, 'the grip is the real 270 mm');
  assert.equal(putter.handleBounds.top, putter.gripBounds.top);
  assert.ok(Math.abs(putter.gripBounds.bottom - (PUTTER_DIMENSIONS.buttCapHeight - 0.001)) < 1e-9, 'the grip starts at the butt cap');
  assert.ok(putter.bossSeatBounds.top > putter.gripBounds.top, 'the cap covers the grip end');
  assert.ok(putter.buttCap.geometry.parameters.radiusTop > putter.handle.geometry.parameters.radiusTop, 'the butt cap is a little wider than the grip');
  const box = boxOf(putter.group);
  assert.ok(Math.abs(box.min.y) < 1e-6, 'it stands on its butt: nothing below the origin');
  assert.ok(Math.abs(boxOf(putter.buttCap).min.y) < 1e-6, 'and the cap is what is at the origin');
  // The overall length is the butt to the sole under the shaft; the toe of the head stands a little past it.
  assert.ok(Math.abs(putter.sole[1] - 0.864) < 1e-9);
  assert.ok(box.max.y > 0.864 && box.max.y < 0.864 + 0.05);
});

test('the shaft runs straight up the middle from the grip cap into the hosel, whatever the head', () => {
  for (const head of PUTTER_HEAD_NAMES) {
    const putter = createPutter(GFX, { head });
    assert.equal(putter.head, head);
    assert.ok(Math.abs(putter.shaft.position.x) < 1e-9 && Math.abs(putter.shaft.position.z) < 1e-9, `${head}: the shaft is on the axis`);
    const shaft = boxOf(putter.shaft);
    assert.ok(Math.abs(shaft.min.y - (putter.bossSeatBounds.top - 0.001)) < 1e-6, `${head}: it starts on the grip cap`);
    assert.ok(shaft.max.y < putter.sole[1], `${head}: and ends short of the sole`);
    // The hosel is the stem its head carries: its far end meets the shaft's, on the axis.
    const hosel = putter.hosel.geometry.attributes.position;
    let top = null;
    const v = new GFX.Vector3();
    for (let i = 0; i < hosel.count; i++) {
      v.set(hosel.getX(i), hosel.getY(i), hosel.getZ(i)).applyMatrix4(putter.hosel.matrixWorld);
      if (!top || v.y < top.y) top = v.clone();
    }
    assert.ok(shaft.max.y > top.y, `${head}: the shaft reaches into the hosel`);
    assert.ok(Math.abs(putter.sole[2]) < 1e-9, `${head}: the sole point is under the shaft, not behind it`);
  }
});

test('the lie angle leans the shaft: turned by playRotation the sole is level and the head is at the bottom', () => {
  const putter = createPutter(GFX, { head: 'mallet', lie: 70 });
  assert.ok(Math.abs(putter.playRotation + (Math.PI / 2 + 70 * Math.PI / 180)) < 1e-9);
  putter.group.rotation.z = putter.playRotation;
  putter.group.updateMatrixWorld(true);
  const sole = new GFX.Vector3(...putter.sole).applyMatrix4(putter.group.matrixWorld);
  const body = putter.body.geometry.attributes.position;
  let lowest = Infinity, highest = -Infinity;
  const v = new GFX.Vector3();
  for (let i = 0; i < body.count; i++) {
    v.set(body.getX(i), body.getY(i), body.getZ(i)).applyMatrix4(putter.body.matrixWorld);
    lowest = Math.min(lowest, v.y); highest = Math.max(highest, v.y);
  }
  // Level: the whole of the head's underside is at one height, to within the bevel, and it is the bottom of the club.
  const below = [];
  for (let i = 0; i < body.count; i++) {
    v.set(body.getX(i), body.getY(i), body.getZ(i)).applyMatrix4(putter.body.matrixWorld);
    if (v.y < lowest + 0.0005) below.push(v.y);
  }
  assert.ok(below.length > 20, 'a flat sole, not a corner');
  assert.ok(Math.abs(highest - lowest - PUTTER_HEADS.mallet.height - 0.0036) < 2e-3, 'the head stands its own height off the floor');
  assert.ok(Math.abs(sole.y - lowest) < 0.004, 'the sole point is on the floor');
  const butt = new GFX.Vector3(0, 0, 0).applyMatrix4(putter.group.matrixWorld);
  assert.ok(butt.y > sole.y + 0.7, 'the grip is up in the air');
  // The shaft leans the lie's 20° from the vertical.
  const lean = Math.atan2(Math.abs(butt.x - sole.x), butt.y - sole.y);
  assert.ok(Math.abs(lean - 20 * Math.PI / 180) < 0.06, `leans ${(lean * 180 / Math.PI).toFixed(1)}°`);
});

test('every head is cut, has a face insert and a sight line, and can be swapped in place', () => {
  const putter = createPutter(GFX);
  const dims = {};
  for (const name of PUTTER_HEAD_NAMES) {
    putter.setHeadStyle(name);
    assert.equal(putter.head, name);
    assert.equal(putter.body.name, `${name} putter head`);
    assert.ok(putter.body.geometry.attributes.position.count > 200, `${name} is a real solid`);
    assert.equal(putter.face.name, 'face insert');
    assert.ok(putter.sights.length >= 1 && putter.sights.every((m) => m.visible));
    assert.equal(putter.headGroup.children.filter((c) => c.name === 'sight line').length, putter.sights.length, 'the old sight lines are gone');
    const b = boxOf(putter.body);
    dims[name] = b;
    assert.ok(Math.abs(putter.sole[1] - 0.864) < 1e-9, `${name} keeps the overall length`);
  }
  // Mallets are deeper than blades, blades are the thinnest.
  const depth = (name) => PUTTER_HEADS[name].depth;
  assert.ok(depth('mallet') > depth('half-moon') && depth('half-moon') > depth('blade'));
  assert.ok(PUTTER_HEADS.mallet.height > PUTTER_HEADS.blade.height);
  assert.throws(() => putter.setHeadStyle('driver'), /no putter head called driver/);
  assert.throws(() => createPutter(GFX, { head: 'wedge' }), /no putter head/);
});

test('head, shaft and fittings each take one of the twelve metals on their own', () => {
  const putter = createPutter(GFX, { headMetal: 'chrome', shaftMetal: 'brass', hiltMetal: 'gold' });
  assert.equal(putter.headMaterial.color.getHexString(), METALS.chrome.color.slice(1));
  assert.equal(putter.shaftMaterial.color.getHexString(), METALS.brass.color.slice(1));
  assert.equal(putter.hiltMaterial.color.getHexString(), METALS.gold.color.slice(1));
  assert.equal(putter.shaft.material, putter.shaftMaterial);
  assert.equal(putter.body.material, putter.headMaterial);
  assert.equal(putter.hosel.material, putter.headMaterial, 'the hosel is the head\'s metal');
  const goldAtStart = putter.hiltMaterial.color.getHexString();
  putter.setHeadMetal('copper');
  assert.equal(putter.headMetal, 'copper');
  assert.equal(putter.headMaterial.color.getHexString(), METALS.copper.color.slice(1));
  assert.equal(putter.shaftMaterial.color.getHexString(), METALS.brass.color.slice(1), 'the shaft did not change with the head');
  assert.equal(putter.hiltMaterial.color.getHexString(), goldAtStart, 'nor did the fittings');
  putter.setShaftMetal('titanium').setHiltMetal('rose gold');
  assert.equal(putter.shaftMetal, 'titanium');
  assert.equal(putter.hiltMetal, 'rose gold');
  assert.equal(putter.shaftMaterial.roughness, METALS.titanium.roughness);
  for (const name of Object.keys(METALS)) putter.setHeadMetal(name);
  assert.throws(() => putter.setHeadMetal('unobtainium'), /no metal called unobtainium/);
  assert.throws(() => putter.setShaftMetal('wood'), /no metal called wood/);
  assert.throws(() => createPutter(GFX, { hiltMetal: 'lead' }), /no metal called lead/);
});

test('the grip, thread, face insert and glowing sight line are colours set live', () => {
  const putter = createPutter(GFX, { gripColor: '#ff3fa4', accentColor: '#39ff88', faceColor: '#202020', glow: 1 });
  assert.equal(putter.leatherMaterial.color.getHexString(), 'ff3fa4');
  assert.equal(putter.threadColor, shadeHex('#ff3fa4', 0.68), 'the thread is the grip in a darker shade until it is chosen');
  assert.equal(putter.faceMaterial.color.getHexString(), '202020');
  assert.equal(putter.accentMaterial.color.getHexString(), '39ff88');
  assert.equal(putter.accentMaterial.emissive.getHexString(), '39ff88', 'the sight line shines in its own colour');
  assert.ok(putter.accentMaterial.emissiveIntensity > 1);
  putter.setGripColor('#2b6cff');
  assert.equal(putter.gripColor, '#2b6cff');
  assert.equal(putter.threadColor, shadeHex('#2b6cff', 0.68), 'the thread follows the grip while it was not chosen');
  putter.setThreadColor('#ffd264');
  putter.setGripColor('#101010');
  assert.equal(putter.threadColor, '#ffd264', 'a chosen thread is kept');
  putter.setAccentColor('#39d0ff').setFaceColor('#ffffff');
  assert.equal(putter.accentMaterial.emissive.getHexString(), '39d0ff');
  assert.equal(putter.faceColor, '#ffffff');
  putter.setGlow(0);
  assert.equal(putter.accentMaterial.emissiveIntensity, 0, 'glow 0 is plain paint');
  assert.throws(() => putter.setGlow(1.5), RangeError);
  assert.throws(() => putter.setGripColor('red'), TypeError);
  assert.throws(() => putter.setAccentColor('#fff'), TypeError);
  assert.throws(() => createPutter(GFX, { faceColor: 'black' }), TypeError);
  assert.throws(() => createPutter(GFX, { glow: 2 }), RangeError);
});

test('length and lie are set within what a putter may be, and the head moves with them', () => {
  const putter = createPutter(GFX, { length: 5, lie: 10 });
  assert.equal(putter.length, PUTTER_LENGTHS.max, 'a too-long putter is the longest');
  assert.equal(putter.lie, PUTTER_LIES.min, 'a too-flat lie is the flattest');
  putter.setLength(0.8);
  assert.equal(putter.length, 0.8);
  assert.ok(Math.abs(putter.sole[1] - 0.8) < 1e-9);
  assert.ok(Math.abs(putter.dimensions.shaftLength - (0.8 - 0.323 - 0.04 - 0.004)) < 0.03, 'the shaft is what the length leaves');
  assert.ok(putter.dimensions.shaftLength < createPutter(GFX).dimensions.shaftLength);
  putter.setLie(75);
  assert.equal(putter.lie, 75);
  assert.ok(Math.abs(putter.playRotation + (Math.PI / 2 + 75 * Math.PI / 180)) < 1e-9);
  assert.match(putter.info['Putter length'], /0\.800 m \(31\.5 in\)/);
  assert.equal(putter.info['Lie angle'], '75°');
});

test('the sight line can be a line, a tee or off', () => {
  const putter = createPutter(GFX, { sight: 'tee' });
  assert.equal(putter.sights.length, 2);
  putter.setSight('none');
  assert.ok(putter.sights.every((m) => !m.visible));
  putter.setSight('line');
  assert.equal(putter.sights.length, 1);
  assert.deepEqual([...PUTTER_SIGHTS], ['line', 'tee', 'none']);
  assert.throws(() => putter.setSight('laser'), /no sight called laser/);
});

test('the grip wrap can be banded or diagonal', () => {
  const banded = createPutter(GFX, { wrapStyle: 'banded' });
  assert.equal(banded.hilt.children.filter((c) => c.name === 'leather wrap ridge').length, 21);
  const diagonal = createPutter(GFX, { wrapStyle: 'diagonal' });
  assert.ok(diagonal.hilt.getObjectByName('diagonal leather wrap'));
  assert.throws(() => createPutter(GFX, { wrapStyle: 'taped' }), /no putter grip wrap called taped/);
});

test('the putter is in the props library and the asset viewer, with every choice live', () => {
  assert.equal(Props.createPutter, createPutter);
  assert.equal(Props.PUTTER_HEAD_NAMES, PUTTER_HEAD_NAMES);
  assert.equal(assetViewer.category, 'Props');
  const made = assetViewer.build({ GFX });
  assert.ok(made.group.isObject3D);
  const labels = made.ui.map((row) => row.label);
  for (const label of ['Head', 'Head metal', 'Shaft metal', 'Fittings metal', 'Grip', 'Face insert', 'Sight line', 'Glow', 'Length (m)', 'Lie (°)']) {
    assert.ok(labels.includes(label), label);
  }
  const row = (label) => made.ui.find((r) => r.label === label);
  row('Head').set('mallet');
  assert.equal(row('Head').get(), 'mallet');
  row('Head metal').set('gold');
  assert.equal(made.headMetal, 'gold');
  row('Length (m)').set(0.9);
  assert.equal(made.length, 0.9);
  assert.deepEqual(row('Head metal').options, Object.keys(METALS));
});
