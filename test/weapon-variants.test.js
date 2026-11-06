import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import {
  createMadnessSword,
  createMadnessDagger,
  createMadnessGreatsword,
  createMadnessMorningstar,
  createRegularSword,
  createRegularDagger,
  createRegularGreatsword,
  createRegularMorningstar,
  createMarcsSword,
  createMarcsDagger,
  createMarcsGreatsword,
  createMarcsMorningstar,
  createKrystalSword,
  createKrystalDagger,
  createMagicEggSword,
  bladeGeometry,
} from '../src/weapons/index.js';
import { METALS } from '../src/props/metalglobe.js';

function assertEggBezelOutsideShell(weapon) {
  const sleeve = weapon.bezel.children.find((part) =>
    part.name === 'pommel bezel tapered hollow sleeve');
  assert.ok(sleeve, 'egg pommel has a fitted metal bezel sleeve');
  const geometry = sleeve.geometry;
  assert.equal(geometry.type, 'EggFittedBezelGeometry');
  assert.ok(geometry.clearance >= 0.0008);
  const positions = geometry.attributes.position;
  const segments = geometry.radialSegments;
  const rows = geometry.axialSegments;
  const radius = weapon.pommelAsset.radius;
  const centerY = radius;

  for (let row = 0; row <= rows; row++) {
    const index = row * segments;
    const sleeveRadius = Math.hypot(positions.getX(index), positions.getZ(index));
    const worldY = positions.getY(index) + sleeve.position.y;
    const y = (centerY - worldY) / radius;
    const eggRadius = Math.abs(y) >= 1 ? 0
      : 0.032 * 0.84 * (1 - 0.075 * y - 0.055 * y * y) * Math.sqrt(1 - y * y);
    assert.ok(sleeveRadius >= eggRadius + 0.00079,
      `bezel remains outside egg shell at sleeve row ${row}`);
  }

  assert.ok(sleeve.position.y > centerY + radius * 0.25,
    'the ferrule is around the upper shoulder, not the egg equator');
  const shell = weapon.pommelAsset.mesh ?? weapon.pommelAsset.glass;
  assert.ok(shell.scale.y < 0,
    'the shell is flipped so its narrow point faces outward, away from the grip');

  let maxLocalY = -Infinity;
  let minLocalY = Infinity;
  let positiveEndRadius = 0;
  let negativeEndRadius = 0;
  const shellPositions = shell.geometry.attributes.position;
  for (let i = 0; i < shellPositions.count; i++) {
    const y = shellPositions.getY(i);
    maxLocalY = Math.max(maxLocalY, y);
    minLocalY = Math.min(minLocalY, y);
    const r = Math.hypot(shellPositions.getX(i), shellPositions.getZ(i));
    if (y > 0.65) positiveEndRadius = Math.max(positiveEndRadius, r);
    if (y < -0.65) negativeEndRadius = Math.max(negativeEndRadius, r);
  }
  const narrowTipWorldY = shell.position.y + maxLocalY * shell.scale.y;
  const broadEndWorldY = shell.position.y + minLocalY * shell.scale.y;
  assert.ok(narrowTipWorldY < broadEndWorldY,
    'the narrow egg tip is at the pommel end, not buried in the grip');
  assert.ok(positiveEndRadius < negativeEndRadius,
    'the outward-facing end is the narrower, more pointed end');

  const gripBottom = weapon.handle.position.y - weapon.handle.geometry.parameters.height / 2;
  const shellTop = broadEndWorldY;
  assert.ok(Math.abs(shellTop - gripBottom) <= 0.0011,
    'the broad egg shoulder meets the grip with only a 1 mm fitted overlap');
}

test('Madness and Regular retain their original guard shape and differ only at the pommel', () => {
  const pairs = [
    [createMadnessSword(GFX), createRegularSword(GFX)],
    [createMadnessDagger(GFX), createRegularDagger(GFX)],
    [createMadnessGreatsword(GFX), createRegularGreatsword(GFX)],
  ];

  for (const [madness, regular] of pairs) {
    assert.equal(madness.pommelAsset.kind, 'marble');
    assert.equal(regular.pommelAsset.kind, 'metal-ball');
    assert.equal(regular.dimensions.bladeLength, madness.dimensions.bladeLength);
    assert.equal(regular.dimensions.bladeWidth, madness.dimensions.bladeWidth);
    assert.equal(regular.dimensions.gripLength, madness.dimensions.gripLength);
    assert.equal(regular.guard.name, madness.guard.name);
    regular.setHiltMetal('gold');
    assert.equal(regular.pommelAsset.mesh.material.color.getHexString(), METALS.gold.color.slice(1));
  }

  assert.equal(createMadnessMorningstar(GFX).pommelAsset.kind, 'marble');
  assert.equal(createRegularMorningstar(GFX).pommelAsset.kind, 'metal-ball');
});

test('Marc blade guards reuse the inverted Madness sweep with integrated pointed ends', () => {
  for (const weapon of [
    createMarcsSword(GFX),
    createMarcsDagger(GFX),
    createMarcsGreatsword(GFX),
  ]) {
    assert.equal(weapon.pommelAsset.kind, 'metal-egg');
    assert.equal(weapon.guard.name, 'Marc inverted Madness swept guard');
    assert.equal(weapon.guard.children.length, 1,
      'guard arch and both pointed terminals are a single mesh');
    const guardMesh = weapon.guard.children[0];
    assert.equal(guardMesh.name, 'Madness swept guard with integrated pointed terminals');

    const position = guardMesh.geometry.attributes.position;
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < position.count; i++) {
      minY = Math.min(minY, position.getY(i));
      maxY = Math.max(maxY, position.getY(i));
      minX = Math.min(minX, position.getX(i));
      maxX = Math.max(maxX, position.getX(i));
    }
    assert.ok(minY < weapon.guardY - 0.004,
      'the centre of the flipped Madness arch sits below the guard root');
    assert.ok(maxY > weapon.guardY + 0.02,
      'the sharpened terminal tips rise above the guard root');
    assert.ok(maxX > weapon.dimensions.guardSpan / 2);
    assert.ok(minX < -weapon.dimensions.guardSpan / 2);
  }
});

test('Marc metal egg is a stationary engine shell with its broad end joined to the grip', () => {
  const weapon = createMarcsSword(GFX);
  const egg = weapon.pommelAsset.mesh;
  assert.equal(egg.name, 'stationary Metal Egg asset shell');
  assert.equal(egg, weapon.pommelAsset.asset.shell,
    'the pommel uses the exact shell mesh returned by the repo Metal Egg asset factory');
  assert.equal(egg.geometry.type, 'SphereGeometry');
  assert.equal(typeof egg.onBeforeRender, 'function',
    'the renderer still receives a callable hook for the detached shell');
  const stationaryTransform = {
    position: egg.position.toArray(),
    rotation: egg.rotation.toArray(),
    scale: egg.scale.toArray(),
  };
  egg.onBeforeRender();
  assert.deepEqual(egg.position.toArray(), stationaryTransform.position);
  assert.deepEqual(egg.rotation.toArray(), stationaryTransform.rotation);
  assert.deepEqual(egg.scale.toArray(), stationaryTransform.scale,
    'the detached asset shell stays stationary when its render hook runs');
  assert.equal(egg.parent, weapon.pommel,
    'the shell is reparented to the stationary weapon pommel');
  assert.ok(egg.scale.y < 0, 'the engine egg shell is flipped so its broad end faces the grip');
  assert.equal(egg.parent, weapon.pommel);
  assert.equal(weapon.pommel.parent, weapon.group);
  assert.equal(weapon.pommelAsset.kind, 'metal-egg');
  assertEggBezelOutsideShell(weapon);

  const source = egg.geometry.attributes.position;
  let broadEndRadius = 0, narrowEndRadius = 0;
  for (let i = 0; i < source.count; i++) {
    const y = source.getY(i);
    const radius = Math.hypot(source.getX(i), source.getZ(i));
    if (y < -0.2) broadEndRadius = Math.max(broadEndRadius, radius);
    if (y > 0.2) narrowEndRadius = Math.max(narrowEndRadius, radius);
  }
  assert.ok(broadEndRadius > narrowEndRadius,
    'engine egg has its broader end toward the handle');
  let eggTop = -Infinity;
  for (let i = 0; i < source.count; i++) {
    eggTop = Math.max(eggTop, source.getY(i) * egg.scale.y + egg.position.y);
  }
  const gripBottom = weapon.handle.position.y - weapon.handle.geometry.parameters.height / 2;
  assert.ok(eggTop >= gripBottom,
    'the broad Metal Egg shoulder reaches the handle');
  assert.ok(eggTop <= gripBottom + 0.0011,
    'the Metal Egg overlaps the handle by no more than the fitted 1 mm seat');

  weapon.setHiltMetal('gold');
  assert.equal(egg.material.color.getHexString(), METALS.gold.color.slice(1));
});

test('Marc morningstar keeps its egg pommel and diagonal wrap but has no horn guard', () => {
  const weapon = createMarcsMorningstar(GFX);
  assert.equal(weapon.pommelAsset.kind, 'metal-egg');
  assert.equal(weapon.guard, null);
  assert.ok(weapon.hilt.children.some((part) => part.name === 'diagonal leather wrap'));
  assert.ok(!weapon.hilt.children.some((part) => /horn|quillon/i.test(part.name)));
});


test('Krystal sword and dagger use the lightning guard, two-tone diamond grip and independent blade mist', () => {
  const pairs = [
    [createKrystalSword(GFX), createMadnessSword(GFX)],
    [createKrystalDagger(GFX), createMadnessDagger(GFX)],
  ];

  for (const [krystal, madness] of pairs) {
    assert.equal(krystal.pommelAsset.kind, 'krystal-orb');
    assert.equal(krystal.pommelAsset.glass.material.transmission, 1);
    assert.ok(krystal.pommelAsset.vision, 'the orb retains Krystal ray-marched mist');
    assert.equal(krystal.pommelAsset.vision.visible, true,
      'Krystal mist inside the glass is always visible');
    assert.equal(krystal.pommelAsset.vision.material, krystal.pommelAsset.material);
    assert.equal(krystal.dimensions.pommelDiameter, madness.dimensions.pommelDiameter);
    assert.equal(krystal.dimensions.bladeLength, madness.dimensions.bladeLength);
    assert.equal(krystal.dimensions.bladeWidth, madness.dimensions.bladeWidth);
    assert.equal(krystal.dimensions.gripLength, madness.dimensions.gripLength);

    assert.equal(krystal.guard.name, 'lightning swept crossguard');
    assert.equal(krystal.guard.children[0].name, 'three-bend lightning quillons with tapered points');
    assert.equal(krystal.guard.userData.lightningProfile.bendsPerArm, 3);
    assert.ok(krystal.guard.userData.lightningProfile.baseDiameter
      > krystal.guard.userData.lightningProfile.shaftDiameter,
    'the root is reinforced and the quillons taper toward their tips');

    const diamondLaces = krystal.hilt.children.filter((part) =>
      part.name.startsWith('diamond leather stitch '));
    assert.equal(diamondLaces.length, 2, 'opposing laces form the diamond pattern');
    assert.ok(diamondLaces.every((lace) => lace.geometry.attributes.position.count > 1000));
    assert.equal(diamondLaces[0].material, diamondLaces[1].material,
      'both crossing stitch passes share one independent thread material');

    assert.equal(krystal.gripColor, '#25364a');
    assert.equal(krystal.threadColor, '#a7e6ff');
    assert.equal(krystal.handle.material.color.getHexString(), '25364a');
    assert.equal(diamondLaces[0].material.color.getHexString(), 'a7e6ff');

    krystal.setGripColor('#75452e');
    assert.equal(krystal.handle.material.color.getHexString(), '75452e',
      'changing the leather colour leaves its thread untouched');
    assert.equal(krystal.threadColor, '#a7e6ff');
    krystal.setThreadColor('#ffb04a');
    assert.equal(krystal.threadColor, '#ffb04a');
    assert.equal(krystal.handle.material.color.getHexString(), '75452e',
      'changing the thread colour leaves the leather untouched');
    assert.throws(() => krystal.setThreadColor('blue'), /threadColor/);

    assert.ok(krystal.bladeMist, 'a separate mist volume surrounds the blade');
    assert.equal(krystal.bladeMist.visible, true, 'blade mist is visible by default');
    assert.equal(krystal.bladeMist.material.blending, GFX.AdditiveBlending);
    assert.equal(krystal.bladeMist.material.uniforms.uGlow.value, 1.05);
    assert.equal(krystal.bladeMist.material.uniforms.uCore.value, 0.36);
    for (const metal of Object.keys(METALS)) {
      krystal.setBladeMetal(metal);
      assert.equal(krystal.bladeMist.material.uniforms.uGlow.value, 1.05);
    }
    krystal.setBladeMist(false);
    assert.equal(krystal.bladeMist.visible, false);
    assert.equal(krystal.pommelAsset.vision.visible, true);
    krystal.setBladeMist(true);
    assert.equal(krystal.bladeMist.visible, true);
    assert.equal(krystal.pommelAsset.vision.visible, true);
  }
});

test('shared sword and dagger blade geometry keeps its width and ends in a short, sturdy point', () => {
  const geometry = bladeGeometry(GFX, { rootY: 0, length: 1, width: 0.05 });
  const ringSize = 20;
  const rowWidthRatio = (row) => {
    const start = row * ringSize;
    return Math.abs(geometry.attributes.position.getX(start)) * 2 / 0.05;
  };
  assert.ok(rowWidthRatio(54) > 0.9,
    'the blade keeps over 90% of its width until the final section');
  assert.ok(rowWidthRatio(58) > 0.55,
    'the point has a decisive but compact taper');
  assert.ok(rowWidthRatio(63) > 0.02 && rowWidthRatio(63) < 0.03,
    'the final ring is narrow enough to close into a crisp point');
  assert.deepEqual(geometry.pointProfile, {
    pointStart: 0.84,
    pointEnd: 1,
    terminalWidthRatio: 0.026,
  });
});




test('named weapon families use their requested default metals and grip colours', () => {
  for (const weapon of [
    createMadnessSword(GFX),
    createMadnessDagger(GFX),
    createMadnessGreatsword(GFX),
  ]) {
    assert.equal(weapon.bladeMetal, 'rose gold');
    assert.equal(weapon.hiltMetal, 'rose gold');
    assert.equal(weapon.gripColor, '#ffffff');
    assert.equal(weapon.handle.material.color.getHexString(), 'ffffff');
  }

  const krystal = createKrystalSword(GFX);
  assert.equal(krystal.bladeMetal, 'platinum');
  assert.equal(krystal.hiltMetal, 'platinum');
  assert.equal(krystal.gripColor, '#25364a');
  assert.equal(krystal.threadColor, '#a7e6ff');

  const marc = createMarcsSword(GFX);
  assert.equal(marc.bladeMetal, 'gold');
  assert.equal(marc.hiltMetal, 'gold');
  assert.equal(marc.gripColor, '#101010');
  assert.equal(marc.handle.material.color.getHexString(), '101010');
  const wrap = marc.hilt.children.find((part) => part.name === 'diagonal leather wrap');
  assert.ok(wrap);
  assert.equal(wrap.material.color.getHexString(), '0b0b0b');

  const madnessMorningstar = createMadnessMorningstar(GFX);
  assert.equal(madnessMorningstar.metal, 'rose gold');
  assert.equal(madnessMorningstar.gripColor, '#ffffff');

  const krystalDagger = createKrystalDagger(GFX);
  assert.equal(krystalDagger.bladeMetal, 'platinum');
  assert.equal(krystalDagger.hiltMetal, 'platinum');

  const override = createMadnessSword(GFX, {
    bladeMetal: 'steel',
    hiltMetal: 'platinum',
    gripColor: '#224466',
  });
  assert.equal(override.bladeMetal, 'steel');
  assert.equal(override.hiltMetal, 'platinum');
  assert.equal(override.gripColor, '#224466');
});

test('Magic Egg Sword uses the glass egg, white/yellow mist and inverted lightning quillons', () => {
  const weapon = createMagicEggSword(GFX);
  assert.equal(weapon.name, 'Magic Egg Sword');
  assert.equal(weapon.bladeMetal, 'silver');
  assert.equal(weapon.hiltMetal, 'gold');
  assert.equal(weapon.gripColor, '#c0c0c0');
  assert.equal(weapon.threadColor, '#ffd264');
  assert.equal(weapon.handle.material.color.getHexString(), 'c0c0c0');
  assert.equal(weapon.pommelAsset.kind, 'magic-egg');
  assertEggBezelOutsideShell(weapon);
  assert.equal(weapon.pommelAsset.glass.material.transmission, 1);
  assert.equal(weapon.pommelAsset.glass.parent, weapon.pommelAsset.group,
    'the glass shell is attached to the stationary pommel group, not the animated hero');
  assert.equal(weapon.pommelAsset.mist.parent, weapon.pommelAsset.group,
    'the animated mist is fitted into the same stationary pommel group');
  const detachedRig = weapon.pommelAsset.asset.group;
  detachedRig.position.set(0.12, 0.21, -0.17);
  detachedRig.rotation.set(0.13, -0.24, 0.37);
  const rigPosition = detachedRig.position.toArray();
  const rigRotation = detachedRig.rotation.toArray();
  weapon.pommelAsset.glass.onBeforeRender();
  assert.deepEqual(detachedRig.position.toArray(), rigPosition,
    'rendering the glass pommel cannot move the detached hero rig');
  assert.deepEqual(detachedRig.rotation.toArray(), rigRotation,
    'rendering the glass pommel cannot rotate or wobble the detached hero rig');
  assert.equal(weapon.pommelAsset.mist.visible, true);
  assert.equal(typeof weapon.pommelAsset.mist.onBeforeRender, 'function',
    'the egg mist retains its separate animation callback');
  assert.notEqual(weapon.pommelAsset.mist.onBeforeRender, weapon.pommelAsset.glass.onBeforeRender,
    'the egg mist animation is not replaced by the stationary shell hook');
  assert.equal(weapon.pommelAsset.asset.mist, weapon.pommelAsset.mist);
  assert.equal(weapon.pommelAsset.mist.material.uniforms.uDuo.value, 1);
  const eggMistUniforms = weapon.pommelAsset.mist.material.uniforms;
  assert.deepEqual(eggMistUniforms.uShape.value.toArray(), [
    0.032 * 0.84,
    (0.027 / 1.03) * 1.03,
    0.032 * 0.84,
  ], 'the ray-marched ellipsoid matches the fitted egg shell dimensions');
  assert.equal(eggMistUniforms.uGlow.value, 1.15,
    'the internal egg mist has enough radiance to read through the glass');
  assert.deepEqual(eggMistUniforms.uDuoC.value.toArray(), [1, 0.82, 0.38],
    'the central mist tone is distinctly warm yellow');

  assert.equal(weapon.guard.name, 'inverted lightning swept crossguard');
  assert.equal(weapon.guard.userData.lightningProfile.orientation, 'inverted');
  const guardPositions = weapon.guard.children[0].geometry.attributes.position;
  let meanGuardY = 0;
  for (let i = 0; i < guardPositions.count; i++) meanGuardY += guardPositions.getY(i);
  meanGuardY /= guardPositions.count;
  assert.ok(meanGuardY < weapon.guardY - 0.01,
    'the inverted lightning guard bends below the guard root');

  const stitches = weapon.hilt.children.filter((part) => part.name.startsWith('diamond leather stitch '));
  assert.equal(stitches.length, 2);
  assert.equal(weapon.gripColor, '#c0c0c0');
  assert.equal(weapon.threadColor, '#ffd264');
  assert.equal(weapon.handle.material.color.getHexString(), 'c0c0c0');
  assert.equal(stitches[0].material.color.getHexString(), 'ffd264');

  assert.ok(weapon.bladeMist);
  assert.equal(weapon.bladeMist.visible, true);
  assert.equal(weapon.bladeMist.name, 'Magic Egg blade mist');
  assert.equal(weapon.bladeMist.material.uniforms.uDuo.value, 1);
  assert.ok(weapon.bladeMist.material.uniforms.uCore.value > 0.8,
    'the blade mist carries the warm white/yellow egg core');
  assert.equal(weapon.bladeMist.material.uniforms.uGlow.value, 1.05);

  weapon.setGripColor('#333333');
  assert.equal(weapon.threadColor, '#ffd264');
  weapon.setThreadColor('#ffdd66');
  assert.equal(weapon.gripColor, '#333333');
  assert.equal(weapon.threadColor, '#ffdd66');
  const custom = createMagicEggSword(GFX, {
    bladeMetal: 'platinum',
    hiltMetal: 'rose gold',
    gripColor: '#eeeeee',
    threadColor: '#ccaa33',
  });
  assert.equal(custom.bladeMetal, 'platinum');
  assert.equal(custom.hiltMetal, 'rose gold');
  assert.equal(custom.gripColor, '#eeeeee');
  assert.equal(custom.threadColor, '#ccaa33');
  weapon.setBladeMist(false);
  assert.equal(weapon.bladeMist.visible, false);
  assert.equal(weapon.pommelAsset.mist.visible, true,
    'the glass egg mist remains visible independently of the blade sheath');
});
