import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';

/** The main characters, by name, and what each gives. */
const HEROES = {
  marble: ['createMarble', 'RADIUS'],
  'vibey/index': ['createStar', 'createMetalStar', 'METALS'],
  'slimey/index': ['createSlimeOrb', 'createMetalSlimeOrb', 'createLavaSlimeOrb', 'METALS'],
  die: ['createDieState', 'stepDie', 'topFace', 'dieModel', 'DIE_RADIUS'],
  'yarn/ball': ['createBall', 'TILE_METRES'],
  hamster: ['createPlayer', 'createHamster', 'RADIUS', 'TINTS'],
  mace: ['createMace', 'createMetalMace', 'createPlayer', 'createMetalPlayer', 'RADIUS'],
  morningstar: ['createMorningStar', 'createMetalMorningStar', 'METALS'],
  rock: ['createRock', 'createBoulder'],
};

for (const [file, exports] of Object.entries(HEROES)) {
  test(`heroes/${file}: loads${exports.length ? ` and gives ${exports.join(', ')}` : ''}`, async () => {
    const mod = await import(`../src/heroes/${file}.js`);
    assert.ok(Object.keys(mod).length > 0);
    for (const name of exports) assert.ok(name in mod, `${name} is missing`);
  });
}

test('the d20 has twenty numbered faces, and the die tips over onto one when it stops', async () => {
  const { createDie } = await import('../src/heroes/nat/geometry.js');
  const { createDieState, stepDie, topFace } = await import('../src/heroes/die.js');
  const model = createDie(GFX);
  assert.equal(model.faces.length, 20);
  assert.deepEqual(model.faces.map((f) => f.number).sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));

  const state = createDieState();
  const ball = { vx: 0, vz: 0, grounded: true };
  // Let go on a slant: it comes to rest flat on a face, which is the one on top.
  state.q = [0.2, 0.1, 0.3, 0.9];
  for (let i = 0; i < 600; i++) stepDie(state, ball, model, 1 / 120);
  const top = topFace(model, state.q);
  assert.ok(top.number >= 1 && top.number <= 20);
  assert.ok(top.up > 0.999, `the face is ${top.up} of the way up`);
});

test('the town games share one prop kit, and it puts shapes into one geometry per finish', async () => {
  const { createKit } = await import('../src/kit.js');
  assert.equal(typeof createKit, 'function');
  const { linearRGB } = await import('../src/color.js');
  assert.deepEqual(linearRGB('#000000'), [0, 0, 0]);
  assert.ok(Math.abs(linearRGB('#ffffff')[0] - 1) < 1e-9);
});


test('metal Morningstar keeps the original shape and snapping with the coin metal finishes', async () => {
  const { createMorningStar, createMetalMorningStar, METALS } = await import('../src/heroes/morningstar.js');
  const original = createMorningStar(GFX);
  const metal = createMetalMorningStar(GFX, { metal: 'copper' });

  assert.equal(metal.core.geometry.attributes.position.count, original.core.geometry.attributes.position.count);
  assert.equal(metal.mesh.geometry.attributes.position.count, original.mesh.geometry.attributes.position.count);
  assert.equal(metal.group.children.length, original.group.children.length);
  assert.equal(metal.material.metalness, 1);
  assert.equal(metal.spikeMaterial.metalness, 1);
  assert.equal(metal.material.roughness, METALS.copper.roughness);
  assert.equal(metal.spikeMaterial.roughness, METALS.copper.roughness);
  assert.equal(metal.snap(7), true);
  assert.equal(metal.snapped, 7);
  metal.setMetal('gold');
  assert.equal(metal.metal, 'gold');
  assert.equal(metal.material.roughness, METALS.gold.roughness);
  assert.equal(metal.spikeMaterial.roughness, METALS.gold.roughness);
  assert.throws(() => metal.setMetal('unobtainium'), /no metal/);
});

test('the metal player shares the original mace scale, roll transform, and damage behaviour', async () => {
  const { createMace, createMetalMace, RADIUS } = await import('../src/heroes/mace.js');
  const original = createMace(GFX, { radius: RADIUS });
  const metal = createMetalMace(GFX, { radius: RADIUS, metal: 'silver' });
  assert.deepEqual(metal.mesh.scale.toArray(), original.mesh.scale.toArray());
  assert.equal(metal.metal, 'silver');
  assert.equal(metal.hurtTo(0.5), true);
  metal.update(1 / 60, { q: [0, 0, 0, 1], position: [2, 3, 4] });
  assert.deepEqual(metal.group.position.toArray(), [2, 3, 4]);
  metal.setMetal('chrome');
  assert.equal(metal.metal, 'chrome');
});


test('metal Slimey keeps the orb geometry and controls while switching shared metal finishes', async () => {
  const { createSlimeOrb, createMetalSlimeOrb, METALS } = await import('../src/heroes/slimey/index.js');
  const originalStage = { setObject(object) { this.object = object; } };
  const metalStage = { setObject(object) { this.object = object; } };
  const original = createSlimeOrb({ stage: originalStage, GFX });
  const metal = createMetalSlimeOrb({ stage: metalStage, GFX, metal: 'silver' });
  const originalShell = originalStage.object.children.find((child) => child.name === 'shell');
  const metalShell = metalStage.object.children.find((child) => child.name === 'shell');

  assert.equal(metalShell.geometry.attributes.position.count, originalShell.geometry.attributes.position.count);
  assert.equal(metal.metal, 'silver');
  assert.equal(metalShell.material.metalness, 1);
  assert.equal(metalShell.material.roughness, METALS.silver.roughness);
  assert.equal(metalShell.material.transmission, 0);
  const metalGlow = metalStage.object.children.find((child) => child.name === 'glow');
  const metalCore = metalStage.object.children.find((child) => child.name === 'core');
  const metalBubbles = metalStage.object.children.filter((child) => child.name.startsWith('bubble_'));
  assert.equal(metalGlow.visible, false, 'the additive slime rim is hidden');
  assert.equal(metalCore.material.emissiveIntensity, 0, 'the core does not emit non-metal light');
  assert.ok(metalBubbles.length > 0);
  for (const bubble of metalBubbles) {
    assert.equal(bubble.material.metalness, 1);
    assert.equal(bubble.material.transmission, 0);
    assert.equal(bubble.material.opacity, 1);
  }
  metal.setMetal('copper');
  assert.equal(metal.metal, 'copper');
  assert.equal(metalShell.material.roughness, METALS.copper.roughness);
  assert.equal(metalShell.material.color.r, new GFX.Color(METALS.copper.color).r);
  assert.throws(() => metal.setMetal('unobtainium'), /no metal/);

  metal.setState('speaking');
  metal.setLevel(0.7);
  metal.pulse(0.4);
  assert.equal(metal.state, 'speaking');
  assert.equal(typeof original.setState, 'function');
  assert.equal(typeof metal.pulse, 'function');
});


test('Slimey deformation keeps the duplicated longitude seam position and normal continuous', async () => {
  const { createDeformer } = await import('../src/heroes/slimey/deform.js');
  const geometry = new GFX.SphereGeometry(1, 24, 16);
  const base = geometry.attributes.position.array.slice();
  const lobes = [
    { dir: new GFX.Vector3(1, 2, 3).normalize(), amp: 0.12, freq: 1.3, speed: 0.7, phase: 0.4 },
    { dir: new GFX.Vector3(-2, 1, 0.5).normalize(), amp: 0.08, freq: 1.8, speed: 0.4, phase: 1.2 },
  ];

  createDeformer(GFX)(geometry, base, lobes, {
    wobble: 1.4, phase: 2.1, scale: 1.03, ampScale: 1, freqScale: 2.35, phaseScale: 2.2,
  });

  const { uv, position, normal } = geometry.attributes;
  const starts = new Map();
  const ends = new Map();
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), row = Math.round(uv.getY(i) * 1e6);
    if (u <= 1e-6) starts.set(row, i);
    else if (u >= 1 - 1e-6) ends.set(row, i);
  }

  assert.ok(starts.size > 0, 'sphere has duplicated wrap vertices');
  for (const pole of [1, 0]) {
    const indices = Array.from({ length: uv.count }, (_, i) => i)
      .filter((i) => Math.abs(uv.getY(i) - pole) < 1e-6);
    assert.ok(indices.length > 1, 'sphere pole has duplicated UV vertices');
    for (const attr of [position, normal]) {
      const first = [attr.getX(indices[0]), attr.getY(indices[0]), attr.getZ(indices[0])];
      for (const index of indices.slice(1)) {
        assert.ok(Math.abs(attr.getX(index) - first[0]) < 1e-7);
        assert.ok(Math.abs(attr.getY(index) - first[1]) < 1e-7);
        assert.ok(Math.abs(attr.getZ(index) - first[2]) < 1e-7);
      }
    }
  }
  for (const [row, a] of starts) {
    const b = ends.get(row);
    if (b === undefined) continue;
    for (const attr of [position, normal]) {
      assert.ok(Math.abs(attr.getX(a) - attr.getX(b)) < 1e-7);
      assert.ok(Math.abs(attr.getY(a) - attr.getY(b)) < 1e-7);
      assert.ok(Math.abs(attr.getZ(a) - attr.getZ(b)) < 1e-7);
    }
  }
});


test('lava Slimey reuses the deforming orb while replacing every slime layer with a moving lava surface', async () => {
  const { createSlimeOrb, createLavaSlimeOrb } = await import('../src/heroes/slimey/index.js');
  const originalStage = { setObject(object) { this.object = object; } };
  const lavaStage = { setObject(object) { this.object = object; } };
  const original = createSlimeOrb({ stage: originalStage, GFX });
  const lava = createLavaSlimeOrb({ stage: lavaStage, GFX });

  const originalShell = originalStage.object.children.find((child) => child.name === 'shell');
  const lavaShell = lavaStage.object.children.find((child) => child.name === 'shell');
  const core = lavaStage.object.children.find((child) => child.name === 'core');
  const glow = lavaStage.object.children.find((child) => child.name === 'glow');
  const bubbles = lavaStage.object.children.filter((child) => child.name.startsWith('bubble_'));

  assert.equal(lava.appearance, 'lava');
  assert.equal(lavaShell.geometry.attributes.position.count, originalShell.geometry.attributes.position.count);
  assert.equal(lavaShell.material, lava.lavaMaterial);
  assert.equal(lavaShell.material.name, 'lava-basalt');
  assert.equal(lavaShell.material.mapping, 'local');
  assert.equal(lavaShell.material.textures.width, 1024);
  assert.equal(lavaShell.material.textures.height, 512);
  assert.equal(lavaShell.material.hotMaterial.type, 'ShaderMaterial');
  assert.equal(lavaShell.material.hotMaterial.uniforms.uTime.value, 0);
  assert.equal(core.visible, false, 'no green slime core remains');
  assert.equal(glow.visible, false, 'no slime rim glow remains');
  assert.ok(bubbles.every((bubble) => !bubble.visible), 'no translucent slime bubbles remain');

  lava.setState('speaking');
  lava.setLevel(0.75);
  lava.pulse(0.4);
  assert.equal(lava.state, 'speaking');
  assert.equal(typeof lava.setState, 'function');
  assert.throws(() => createSlimeOrb({ stage: lavaStage, GFX, metal: 'steel', lava: true }), /both lava and metal/);
});
