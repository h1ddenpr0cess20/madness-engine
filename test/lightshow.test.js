import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createLightshow, colorAt, levelAt, spotTarget, STROBE_MAX_HZ, strobeAt } from '../src/scenery/lightshow.rocknroller-iii.js';

/** The least a light show asks of a set: a floor to hang over and a beat to keep. */
const venue = (fixtures, look = {}) => ({
  name: 'test hall',
  tempo: 126,
  look: { lamp: 'bulb', ...look },
  lamps: [],
  fixtures,
  lowest: 0,
  cell: () => ({}),
  heightAt: () => 0,
});

test('a fixture with one colour, or on static, never changes colour', () => {
  assert.deepEqual(colorAt({ colors: ['#ff0000'] }, 17), [1, 0, 0]);
  assert.deepEqual(colorAt({ colors: ['#ff0000', '#0000ff'], program: 'static' }, 9), [1, 0, 0]);
});

test('a chase steps through its colours, one every `every` beats, and fades across the end of each step', () => {
  const f = { colors: ['#ff0000', '#00ff00', '#0000ff'], every: 2 };
  assert.deepEqual(colorAt(f, 0), [1, 0, 0]);
  assert.deepEqual(colorAt(f, 2.2), [0, 1, 0]);
  assert.deepEqual(colorAt(f, 4.2), [0, 0, 1]);
  assert.deepEqual(colorAt(f, 6.2), [1, 0, 0]);
  const fading = colorAt(f, 1.95);
  assert.ok(fading[0] < 1 && fading[1] > 0, 'part-way between red and green');
  assert.deepEqual(colorAt({ ...f, shift: 1 }, 0), [0, 1, 0]);
});

test('a pulse kicks on the beat and dies away; other programs are steady', () => {
  const pulse = { program: 'pulse' };
  assert.ok(levelAt(pulse, 0) > levelAt(pulse, 0.5));
  assert.ok(levelAt(pulse, 0.95) >= 0.35);
  assert.equal(levelAt({ program: 'chase' }, 3.3), 1);
});

test('a strobe never flashes more than three times a second, at any tempo, and not at all with flashing off', () => {
  for (const tempo of [60, 120, 128, 174, 200]) {
    const dt = 1 / 480;
    let last = 0, windowStart = 0, windowEdges = 0, worst = 0;
    for (let t = 0; t < 60; t += dt) {
      const level = strobeAt({ cycle: 16, on: 4 }, (t * tempo) / 60, tempo, true);
      if (level > 0.5 && last <= 0.5) windowEdges++;
      last = level;
      if (t - windowStart >= 1) { worst = Math.max(worst, windowEdges); windowStart = t; windowEdges = 0; }
    }
    assert.ok(worst <= STROBE_MAX_HZ, `${tempo} bpm: ${worst} flashes in a second`);
  }
  for (let beat = 0; beat < 32; beat += 0.1) assert.equal(strobeAt({}, beat, 120, false), 0);
});

test('a moving head stays within its reach of where it points', () => {
  const f = { x: 10, z: 10, radius: 3, aim: [1, 2] };
  for (let beat = 0; beat < 64; beat += 0.5) {
    const [x, z] = spotTarget(f, beat);
    assert.ok(Math.abs(x - 11) <= 3 && Math.abs(z - 12) <= 3);
  }
});

test('the mirror ball, the lasers, the par cans, the moving heads and the strobes are all built, and light the stage\'s fixture lights', () => {
  const rig = [
    { kind: 'ball', x: 8.5, z: 8.5 },
    { kind: 'laser', x: 4.5, z: 4.5, colors: ['#7cff3a', '#ff2d95'] },
    { kind: 'par', x: 6.5, z: 6.5 },
    { kind: 'spot', x: 9.5, z: 5.5 },
    { kind: 'strobe', x: 7.5, z: 9.5 },
  ];
  const show = createLightshow(GFX, venue(rig, { rig: { colors: ['#ff2d95', '#2de2ff', '#a23aff'], program: 'chase', every: 1 } }));
  assert.equal(show.count, rig.length);
  assert.ok(show.group.children.length >= rig.length, 'each fixture draws something');
  const lights = Array.from({ length: 3 }, () => new GFX.PointLight(0xffffff, 0, 7, 1.1));
  for (let beat = 0; beat < 8; beat += 0.25) {
    show.update({ time: beat * 0.5, beat, rock: [8, 0, 8], lights });
    assert.ok(Number.isFinite(show.flash));
  }
  assert.ok(lights.some((l) => l.intensity > 0), 'the fixtures nearest the ball are lit');
  for (const l of lights) assert.ok(l.intensity >= 0 && Number.isFinite(l.distance));
});

test('a set with no fixtures is lit by none, and a fixture that is not a light is refused', () => {
  const show = createLightshow(GFX, venue([]));
  const lights = [new GFX.PointLight(0xffffff, 1, 7, 1.1)];
  show.update({ time: 0, beat: 0, rock: [0, 0, 0], lights });
  assert.equal(lights[0].intensity, 0);
  assert.throws(() => createLightshow(GFX, venue([{ kind: 'sun', x: 0, z: 0 }])), /no such light as sun/);
});

test('every version of the light show loads and keeps the same fixtures', async () => {
  const kinds = new Set();
  for (const file of ['lightshow', 'lightshow.rocknroller', 'lightshow.rocknroller-ii', 'lightshow.rocknroller-iii']) {
    const mod = await import(`../src/scenery/${file}.js`);
    assert.equal(typeof mod.createLightshow, 'function', file);
    for (const kind of ['ball', 'laser', 'par', 'spot', 'strobe']) {
      const show = mod.createLightshow(GFX, venue([{ kind, x: 3.5, z: 3.5 }]));
      assert.equal(show.count, 1, `${file}: ${kind}`);
      if (kind === 'ball') {
        let mirrorBall;
        show.group.traverse((object) => { if (object.material?.name === 'mirror-ball') mirrorBall = object; });
        assert.ok(mirrorBall, `${file}: mirror-ball mesh is present`);
        assert.ok(mirrorBall.geometry.attributes.position.count >= 2160, `${file}: mirror ball has a dense faceted surface`);
      }
      kinds.add(kind);
    }
  }
  assert.equal(kinds.size, 5);
});

test('a strobe\'s glow and light come out of its lens, and its light never jumps between flashes', async () => {
  for (const file of ['lightshow', 'lightshow.rocknroller', 'lightshow.rocknroller-ii', 'lightshow.rocknroller-iii']) {
    const { createLightshow } = await import(`../src/scenery/${file}.js`);
    const fixture = { kind: 'strobe', x: 3.5, z: 3.5 };
    const show = createLightshow(GFX, venue([fixture]));
    let halo, face;
    show.group.traverse((o) => { if (o.isSprite) halo = o; if (o.material?.toneMapped === false && o.geometry?.parameters?.depth === 0.02) face = o; });
    assert.ok(halo && face, `${file}: halo and lens face are built`);
    assert.ok(halo.position.z > face.position.z, `${file}: the glow sits in front of the lens, not inside the housing`);
    assert.equal(halo.position.y, face.position.y, `${file}: and level with it`);

    const lights = [new GFX.PointLight(0xffffff, 0, 7, 1.1)];
    const at = (beat) => {
      show.update({ time: beat * 0.5, beat, troll: [3.5, 0, 3.5], rock: [3.5, 0, 3.5], lights, flashing: true });
      return { position: lights[0].position.toArray(), intensity: lights[0].intensity };
    };
    const flash = at(0);
    const dark = at(2.5);
    assert.ok(flash.intensity > 0, `${file}: lit on the flash`);
    assert.ok(dark.intensity < flash.intensity * 0.05, `${file}: dark between flashes`);
    assert.deepEqual(dark.position, flash.position, `${file}: the light stays on its fixture rather than jumping`);
    assert.ok(Math.abs(flash.position[2] - (fixture.z + 0.2)) < 1e-9, `${file}: out of the lens, at its front`);
  }
});
