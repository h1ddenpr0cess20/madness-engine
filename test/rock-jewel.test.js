import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createGraniteBoulder, createGraniteStone } from '../src/heroes/rock-granite.js';
import { createJewelBoulder, createJewelRock, JEWELS, JEWEL_CHOICES, MIST_RADIUS } from '../src/heroes/rock-jewel.js';

const innermost = (geometry) => {
  const p = geometry.attributes.position.array;
  let min = Infinity;
  for (let i = 0; i < p.length; i += 3) min = Math.min(min, Math.hypot(p[i], p[i + 1], p[i + 2]));
  return min;
};

test('the jewel is cut to the granite stone exactly, shape and grain', () => {
  const stone = createGraniteStone(GFX);
  const jewel = createJewelBoulder(GFX);
  const granite = createGraniteBoulder(GFX);
  assert.deepEqual([...jewel.geometry.attributes.position.array], [...stone.attributes.position.array]);
  assert.deepEqual([...jewel.geometry.attributes.position.array], [...granite.geometry.attributes.position.array]);
  assert.equal(jewel.geometry.attributes.uv, undefined, 'no picture is laid on the glass, so there are no seams to show');
  assert.equal(jewel.geometry.attributes.color.count, jewel.geometry.attributes.position.count, 'the inclusions are colored per vertex, sampled in 3D');
});

test('the jewel is translucent glass tinted by its color', () => {
  const jewel = createJewelBoulder(GFX, { colour: 'emerald' });
  const m = jewel.material;
  assert.equal(m.transmission, 1);
  assert.equal(m.attenuationColor.getHexString(), JEWELS.emerald.slice(1));
  assert.equal(jewel.colour, JEWELS.emerald);
  assert.ok(jewel.mesh.children.includes(jewel.glass) && jewel.mesh.children.includes(jewel.mist));
});

test('every named color is a jewel, and any hex color is too', () => {
  assert.deepEqual(JEWEL_CHOICES, Object.keys(JEWELS));
  for (const name of JEWEL_CHOICES) assert.equal(createJewelBoulder(GFX, { colour: name }).colour, JEWELS[name]);
  assert.equal(createJewelBoulder(GFX, { color: '#ABCDEF' }).colour, '#abcdef');
  assert.throws(() => createJewelBoulder(GFX, { colour: 'pearl' }), /no jewel called pearl/);
  assert.throws(() => createJewelBoulder(GFX, { color: 'blue' }), /six-digit hex/);
});

test('the color can be changed afterwards, the stone and its mist together', () => {
  const jewel = createJewelBoulder(GFX, { colour: 'ruby' });
  const before = jewel.mistMaterial.uniforms.uDuoA.value.clone();
  jewel.setColour('amethyst');
  assert.equal(jewel.material.attenuationColor.getHexString(), JEWELS.amethyst.slice(1));
  assert.notDeepEqual(jewel.mistMaterial.uniforms.uDuoA.value, before, 'the mist takes the new color');
  jewel.setColour('x', '#102030');
  assert.equal(jewel.colour, '#102030');
});

test('the mist sits inside the stone, and can be hidden', () => {
  const stone = createGraniteStone(GFX);
  assert.ok(MIST_RADIUS < innermost(stone) - 0.05, 'the mist sphere is clear of the glass all round');
  const jewel = createJewelBoulder(GFX);
  assert.equal(jewel.mist.visible, true, 'the mist is on by default');
  jewel.setMist(false);
  assert.equal(jewel.mist.visible, false);
  assert.equal(createJewelBoulder(GFX, { mist: false }).mist.visible, false);
});

test('the jewel rock is a rock: it squashes, turns and follows its position, with the stone in its color', () => {
  const rock = createJewelRock(GFX, { colour: 'topaz', radius: 0.5 });
  assert.equal(rock.group.name, 'rock');
  assert.equal(rock.colour, JEWELS.topaz);
  rock.update(1 / 60, { q: [0, 0, 0, 1], position: [1, 2, 3] });
  assert.deepEqual(rock.group.position.toArray(), [1, 2, 3]);
  rock.setColour('garnet').setMist(false);
  assert.equal(rock.colour, JEWELS.garnet, 'the color follows the stone');
});
