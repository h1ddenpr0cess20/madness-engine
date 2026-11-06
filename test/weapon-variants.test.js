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
} from '../src/weapons/index.js';
import { METALS } from '../src/props/metalglobe.js';

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
  assert.ok(eggTop > gripBottom, 'egg shell overlaps the handle instead of floating below it');

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


test('Krystal sword and dagger use her crystal orb and independently toggleable blade mist', () => {
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
    assert.equal(krystal.guard.name, madness.guard.name);
    assert.ok(krystal.bladeMist, 'a separate mist volume surrounds the blade');
    assert.equal(krystal.bladeMist.visible, true, 'blade mist is visible by default');
    assert.equal(krystal.bladeMist.material.blending, GFX.AdditiveBlending);
    assert.equal(krystal.bladeMist.material.uniforms.uGlow.value, 1.05,
      'blade mist has a small radiance lift for visibility across metal finishes');
    assert.equal(krystal.bladeMist.material.uniforms.uCore.value, 0.36,
      'the brighter centre is part of the blade sheath, not the orb toggle');
    for (const metal of Object.keys(METALS)) {
      krystal.setBladeMetal(metal);
      assert.equal(krystal.bladeMist.material.uniforms.uGlow.value, 1.05,
        'blade mist visibility is independent of selected blade metal');
    }
    assert.ok(krystal.bladeMist.material.uniforms.uShape.value.y
      > krystal.bladeMist.material.uniforms.uShape.value.x,
    'blade mist is an elongated ellipsoid, not a spherical cloud');

    krystal.setBladeMist(false);
    assert.equal(krystal.bladeMist.visible, false);
    assert.equal(krystal.pommelAsset.vision.visible, true,
      'disabling the blade sheath leaves the orb visions running');
    krystal.setBladeMist(true);
    assert.equal(krystal.bladeMist.visible, true);
    assert.equal(krystal.pommelAsset.vision.visible, true,
      'enabling the blade sheath does not control the orb visions');
  }
});
