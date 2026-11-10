import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createGlassGlobe } from '../src/props/glassglobe.js';
import { createGlassPlanet, GLASS_PLANET_NAMES, GLASS_PLANETS, loadGlassPlanetMaps } from '../src/props/glass-planets.js';

test('the five glass planets are the Earth, Mars, the Moon, and Jupiter twice', () => {
  assert.deepEqual([...GLASS_PLANET_NAMES], ['earth', 'mars', 'moon', 'jupiter', 'jupiter-etched']);
  assert.ok(Object.isFrozen(GLASS_PLANETS));
});

test('each planet keeps the mist it was shown in', () => {
  const mars = createGlassPlanet(GFX, 'mars', { radius: 0.3 });
  assert.equal(mars.mood.hue, 0.04);
  assert.deepEqual(mars.mood.tint, [1, 1.15, 0.18]);
  assert.equal(mars.mood.glow, 2.1);

  const moon = createGlassPlanet(GFX, 'moon', { radius: 0.3 });
  assert.equal(moon.mood.hue, 0.7071);
  assert.deepEqual(moon.mood.tint, [1.761, 1, 1.76]);

  const jupiter = createGlassPlanet(GFX, 'jupiter', { radius: 0.3 });
  assert.equal(jupiter.mood.glow, 0.4);
  assert.equal(jupiter.mood.core, 0.02);
  assert.equal(jupiter.mood.bands, 0, 'the field version is not banded');

  const etched = createGlassPlanet(GFX, 'jupiter-etched', { radius: 0.3 });
  assert.equal(etched.mood.bands, 1);
  assert.equal(etched.mood.swirl, 0.6);
  assert.equal(etched.mood.duo.length, 3);
});

test('the Earth keeps the default mist, and every planet turns on its own', () => {
  const earth = createGlassPlanet(GFX, 'earth', { radius: 0.6 });
  assert.equal(earth.mood.hue, createGlassGlobe(GFX, { radius: 0.6 }).mood.hue, 'the Earth is not given a mist of its own');
  for (const name of GLASS_PLANET_NAMES) {
    const planet = createGlassPlanet(GFX, name, { radius: 0.3 });
    assert.equal(planet.spinRate, 0.12, `${name} turns`);
    assert.equal(planet.group.name, `glass ${name}`);
    assert.ok(planet.mist.visible, `${name} has its mist showing`);
  }
});

test('the Earth is etched with its own coastlines, and the others only with their own maps', () => {
  // Under Node there is no canvas to paint on, so the Earth's etching comes back null and the glass is clear.
  const earth = createGlassPlanet(GFX, 'earth', { radius: 0.6 });
  assert.equal(earth.etchTexture, null);
  const mars = createGlassPlanet(GFX, 'mars', { radius: 0.3, etchCanvas: null });
  assert.equal(mars.etch.length, 0, 'Mars without its etching is not etched with the Earth');
  assert.equal(createGlassPlanet(GFX, 'jupiter', { radius: 0.3, fieldCanvas: null }).field, null);
});

test('loading a planet maps names the canvases each planet is drawn from', async () => {
  assert.deepEqual(await loadGlassPlanetMaps('earth'), {}, 'the Earth needs none');
  // Under Node nothing can paint, so each canvas is null rather than missing.
  assert.deepEqual(await loadGlassPlanetMaps('mars'), { etchCanvas: null });
  assert.deepEqual(await loadGlassPlanetMaps('moon'), { etchCanvas: null });
  assert.deepEqual(await loadGlassPlanetMaps('jupiter'), { fieldCanvas: null });
  assert.deepEqual(await loadGlassPlanetMaps('jupiter-etched'), { etchCanvas: null });
});

test('an unknown planet is refused', async () => {
  await assert.rejects(loadGlassPlanetMaps('pluto'), /no glass planet called pluto/);
  assert.throws(() => createGlassPlanet(GFX, 'pluto'), /no glass planet called pluto/);
});
