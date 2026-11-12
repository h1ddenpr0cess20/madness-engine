import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';

/** The main characters, by name, and what each gives. */
const HEROES = {
  marble: ['createMarble', 'RADIUS'],
  'vibey/index': ['createStar', 'createMetalStar', 'METALS'],
  'slimey/index': ['createSlimeOrb', 'createMetalSlimeOrb', 'createMoltenSlimeOrb', 'createLavaSlimeOrb', 'METALS'],
  'debater-egg/index': ['createEgg', 'createMetalEgg', 'createGlassEgg', 'createWoodEgg', 'createChocolateEgg', 'EGG_APPEARANCES', 'METALS', 'WOOD_SPECIES', 'WOOD_FINISHES', 'CHOCOLATES', 'ROLL_REACH'],
  die: ['createDieState', 'stepDie', 'topFace', 'dieModel', 'DIE_RADIUS'],
  'yarn/ball': ['createBall', 'TILE_METRES'],
  hamster: ['createPlayer', 'createHamster', 'RADIUS', 'TINTS'],
  mace: ['createMace', 'createMetalMace', 'createPlayer', 'createMetalPlayer', 'RADIUS'],
  morningstar: ['createMorningStar', 'createMetalMorningStar', 'METALS'],
  rock: ['createRock', 'createBoulder'],
  'rock-granite': ['createGraniteRock', 'createGraniteBoulder', 'GRANITE_DETAIL', 'GRANITES', 'GRANITE_CHOICES'],
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


test('molten Slimey keeps the orb geometry and controls in hot orange glass, with no mist, core or bubbles', async () => {
  const { createSlimeOrb, createMoltenSlimeOrb } = await import('../src/heroes/slimey/index.js');
  const originalStage = { setObject(object) { this.object = object; } };
  const moltenStage = { setObject(object) { this.object = object; } };
  createSlimeOrb({ stage: originalStage, GFX });
  const molten = createMoltenSlimeOrb({ stage: moltenStage, GFX });
  const shell = moltenStage.object.children.find((child) => child.name === 'shell');
  const originalShell = originalStage.object.children.find((child) => child.name === 'shell');

  assert.equal(shell.geometry.attributes.position.count, originalShell.geometry.attributes.position.count);
  assert.equal(shell.material.metalness, 0, 'it is glass, not metal');
  assert.ok(shell.material.transmission > 0.4, 'the shell stays transmissive');
  const { r, g, b } = shell.material.emissive;
  assert.ok(r > g && g > b, 'the glass glows orange-red, not green');
  assert.equal(moltenStage.object.children.some((child) => child.name === 'molten_swirl'), false, 'no mist inside');
  assert.equal(moltenStage.object.children.some((child) => child.name.startsWith('bubble_')), false, 'no bubbles');
  assert.equal(moltenStage.object.children.some((child) => child.name === 'core'), false, 'no core');

  molten.setState('speaking');
  molten.setLevel(0.7);
  molten.pulse(0.4);
  assert.equal(molten.state, 'speaking');
  shell.onBeforeRender();
  assert.ok(shell.material.emissive.r > shell.material.emissive.b, 'it stays molten while it moves');
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


test('metal and clear-glass Egg keep Marc geometry and behaviour with optional white-yellow mist', async () => {
  const { createEgg, createMetalEgg, createGlassEgg, METALS, ROLL_REACH } = await import('../src/heroes/debater-egg/index.js');
  const original = createEgg({ GFX });
  const metal = createMetalEgg({ GFX, metal: 'silver' });
  const clear = createGlassEgg({ GFX });
  const misty = createGlassEgg({ GFX, mist: true });
  const shellOf = (made) => made.group.children[0].children[0].children.find((child) => child.name === 'shell');

  const originalShell = shellOf(original);
  const metalShell = shellOf(metal);
  const glassShell = shellOf(clear);
  assert.deepEqual(metalShell.geometry.attributes.position.array, originalShell.geometry.attributes.position.array);
  assert.deepEqual(glassShell.geometry.attributes.position.array, originalShell.geometry.attributes.position.array);
  assert.equal(metalShell.material.metalness, 1);
  assert.equal(metalShell.material.roughness, METALS.silver.roughness);
  assert.equal(metal.metal, 'silver');
  assert.equal(metal.reach, ROLL_REACH);
  metal.setMetal('copper');
  assert.equal(metal.metal, 'copper');
  assert.equal(metalShell.material.roughness, METALS.copper.roughness);
  assert.throws(() => metal.setMetal('unobtainium'), /no metal/);

  assert.equal(glassShell.material.transmission, 1);
  assert.equal(glassShell.material.metalness, 0);
  assert.equal(glassShell.material.roughness, 0.02);
  assert.equal(clear.mist.visible, false);
  clear.setMist(true);
  assert.equal(clear.mist.visible, true);
  clear.setMist(false);
  assert.equal(clear.mist.visible, false);

  assert.equal(misty.mist.visible, true);
  assert.equal(misty.mist.material.uniforms.uDuo.value, 1);
  const white = misty.mist.material.uniforms.uDuoB.value;
  const centre = misty.mist.material.uniforms.uDuoC.value;
  const uniforms = misty.mist.material.uniforms;
  assert.ok(white.x > 0.95 && white.y > 0.95 && white.z > 0.9);
  assert.ok(Math.abs(centre.x - white.x) < 1e-7 && Math.abs(centre.y - white.y) < 1e-7 && Math.abs(centre.z - white.z) < 1e-7,
    'the mist colour is white away from its radial centre, with no yellow side band');
  assert.equal(uniforms.uCore.value, 0.9, 'the yellow accent comes from the radial centre glow');
  assert.ok(uniforms.uHue.value > 0.3 && uniforms.uHue.value < 0.5, 'the radial core hue is warm yellow');
  assert.equal(misty.mist.renderOrder, 1);
  const inner = misty.mist.geometry.attributes.position;
  const outer = glassShell.geometry.attributes.position;
  const maxY = (attribute) => {
    let max = -Infinity;
    for (let i = 0; i < attribute.count; i++) max = Math.max(max, attribute.getY(i));
    return max;
  };
  assert.ok(maxY(inner) / maxY(outer) > 0.98, 'mist fills the egg almost to the inner shell');
});


test('wooden Egg is the same egg in any wood and finish, with the grain turned to run tip to tip', async () => {
  const { createEgg, createWoodEgg, WOOD_SPECIES, WOOD_FINISHES, ROLL_REACH } = await import('../src/heroes/debater-egg/index.js');
  const original = createEgg({ GFX });
  const wood = createWoodEgg({ GFX, species: 'oak', finish: 'raw' });
  const shellOf = (made) => made.group.children[0].children[0].children.find((child) => child.name === 'shell');
  const shell = shellOf(wood);
  assert.deepEqual(shell.geometry.attributes.position.array, shellOf(original).geometry.attributes.position.array);
  assert.equal(shell.material.metalness, 0);
  assert.equal(wood.species, 'oak');
  assert.equal(wood.finish, 'raw');
  assert.equal(shell.material.clearcoat, 0);
  assert.equal(wood.reach, ROLL_REACH);

  // u now runs from one tip to the other (the sphere's v), so the grain, which runs along u, follows the egg's length.
  const uv = shell.geometry.attributes.uv, y = shell.geometry.attributes.position;
  let top = 0, bottom = 0;
  for (let i = 0; i < uv.count; i++) {
    if (y.getY(i) > y.getY(top)) top = i;
    if (y.getY(i) < y.getY(bottom)) bottom = i;
  }
  assert.ok(Math.abs(uv.getX(top) - uv.getX(bottom)) > 0.98, 'the tips are the ends of u');

  wood.setWood('maple');
  assert.equal(wood.species, 'maple');
  assert.equal(wood.finish, 'raw');
  wood.setWood(undefined, 'lacquered');
  assert.equal(wood.species, 'maple');
  assert.equal(shell.material.clearcoat, 1);
  for (const species of Object.keys(WOOD_SPECIES)) for (const finish of WOOD_FINISHES) wood.setWood(species, finish);
  assert.throws(() => wood.setWood('unobtainium'), /no wood/);
  assert.throws(() => wood.setWood('oak', 'varnished'), /no wood finish/);
  assert.throws(() => createWoodEgg({ GFX, species: 'plastic' }), /no wood/);

  const far = createWoodEgg({ GFX, reach: 0.42 });
  assert.equal(far.reach, 0.42);
});

test('chocolate Egg is the same egg in milk, dark or white, glossy under a clearcoat', async () => {
  const { createEgg, createChocolateEgg, CHOCOLATES } = await import('../src/heroes/debater-egg/index.js');
  const original = createEgg({ GFX });
  const choc = createChocolateEgg({ GFX });
  const shellOf = (made) => made.group.children[0].children[0].children.find((child) => child.name === 'shell');
  const shell = shellOf(choc);
  assert.deepEqual(shell.geometry.attributes.position.array, shellOf(original).geometry.attributes.position.array);
  assert.equal(choc.chocolate, 'milk');
  assert.equal(shell.material.metalness, 0);
  assert.ok(shell.material.clearcoat > 0.5);
  for (const kind of Object.keys(CHOCOLATES)) {
    choc.setChocolate(kind);
    assert.equal(choc.chocolate, kind);
  }
  choc.setChocolate('dark');
  assert.ok(shell.material.clearcoat > CHOCOLATES.white.gloss, 'dark is glossier than white');
  assert.throws(() => choc.setChocolate('carob'), /no chocolate/);
  assert.equal(choc.chocolate, 'dark', 'a refusal leaves it as it was');
  assert.throws(() => createChocolateEgg({ GFX, chocolate: 'carob' }), /no chocolate/);
});

test('createEgg makes any appearance of the Egg from its options', async () => {
  const { createEgg, EGG_APPEARANCES } = await import('../src/heroes/debater-egg/index.js');
  assert.deepEqual([...EGG_APPEARANCES], ['original', 'metal', 'glass', 'wood', 'chocolate']);
  const metal = createEgg({ GFX, appearance: 'metal', metal: 'gold' });
  assert.equal(metal.metal, 'gold');
  assert.equal(createEgg({ GFX, appearance: 'wood', species: 'teak' }).species, 'teak');
  assert.equal(createEgg({ GFX, appearance: 'chocolate', chocolate: 'white' }).chocolate, 'white');
  assert.equal(createEgg({ GFX, appearance: 'glass', mist: true }).mist.visible, true);
  assert.throws(() => createEgg({ GFX, appearance: 'jelly' }), /unknown egg appearance/);
});


test('metal Egg has continuous UV-seam and pole normals for unbroken reflections', async () => {
  const { createMetalEgg } = await import('../src/heroes/debater-egg/index.js');
  const metal = createMetalEgg({ GFX, metal: 'chrome' });
  const shell = metal.shell.geometry;
  const { uv, position, normal } = shell.attributes;
  const starts = new Map();
  const ends = new Map();
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), v = uv.getY(i), row = Math.round(v * 1e6);
    if (u <= 1e-6) starts.set(row, i);
    else if (u >= 1 - 1e-6) ends.set(row, i);
  }
  assert.ok(starts.size > 0);
  for (const [row, a] of starts) {
    const b = ends.get(row);
    if (b === undefined) continue;
    for (const attr of [position, normal]) {
      assert.ok(Math.abs(attr.getX(a) - attr.getX(b)) < 1e-7, `row ${row} x matches`);
      assert.ok(Math.abs(attr.getY(a) - attr.getY(b)) < 1e-7, `row ${row} y matches`);
      assert.ok(Math.abs(attr.getZ(a) - attr.getZ(b)) < 1e-7, `row ${row} z matches`);
    }
  }
  for (const pole of [0, 1]) {
    const indices = Array.from({ length: uv.count }, (_, i) => i).filter((i) => Math.abs(uv.getY(i) - pole) < 1e-6);
    assert.ok(indices.length > 1);
    for (const attr of [position, normal]) {
      const first = [attr.getX(indices[0]), attr.getY(indices[0]), attr.getZ(indices[0])];
      for (const i of indices.slice(1)) {
        assert.ok(Math.abs(attr.getX(i) - first[0]) < 1e-7);
        assert.ok(Math.abs(attr.getY(i) - first[1]) < 1e-7);
        assert.ok(Math.abs(attr.getZ(i) - first[2]) < 1e-7);
      }
    }
  }
});


test('lava Slimey reuses the deforming orb while replacing every slime layer with a moving lava surface', async () => {
  const { createSlimeOrb, createLavaSlimeOrb } = await import('../src/heroes/slimey/index.js');
  const originalStage = { setObject(object) { this.object = object; } };
  const lavaStage = { setObject(object) { this.object = object; } };
  createSlimeOrb({ stage: originalStage, GFX });
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
