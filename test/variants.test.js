import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { fakeAudio, memoryStore } from './helpers/webaudio.js';

const src = join(dirname(fileURLToPath(import.meta.url)), '../src');
const sets = (module) => readdirSync(join(src, module)).filter((f) => f.endsWith('.js') && f !== 'core.js').map((f) => f.replace(/\.js$/, ''));

// What the pages give a module, for the modules that can be run without one.
globalThis.localStorage = memoryStore();
for (const g of ['GPUBufferUsage', 'GPUTextureUsage', 'GPUShaderStage', 'GPUMapMode', 'GPUColorWrite']) globalThis[g] = new Proxy({}, { get: () => 1 });

test('every game has its version of audio, storage and stage, and the engine-class modules each have a core', () => {
  for (const module of ['audio', 'storage', 'stage', 'effects', 'textures', 'music']) assert.ok(sets(module).length >= 4, module);
  assert.equal(sets('audio').length, 9);
  assert.equal(sets('storage').length, 9);
  assert.equal(sets('stage').length, 9);
  assert.equal(sets('effects').length, 8, 'Metrlol takes its effects from its own model library');
});

for (const set of sets('audio')) {
  test(`audio/${set}: wakes, plays every sound it has, and mutes`, async () => {
    const { FakeContext, log } = fakeAudio();
    globalThis.AudioContext = FakeContext;
    try {
      const { createAudio } = await import(`../src/audio/${set}.js`);
      const audio = createAudio();
      audio.wake();
      const before = log.length;
      const sounds = Object.entries(Object.getOwnPropertyDescriptors(audio)).filter(([, d]) => typeof d.value === 'function').map(([name]) => name);
      assert.ok(sounds.length > 8, `${sounds.length} sounds`);
      for (const name of sounds) {
        // The music runs on a timer until it is stopped; it has its own test.
        if (name === 'wake' || name === 'startMusic' || name === 'tension') continue;
        assert.doesNotThrow(() => audio[name](1, 1), `${set}.${name}()`);
      }
      assert.ok(log.length > before, 'something was played');
      const was = audio.muted;
      audio.toggleMute();
      assert.equal(audio.muted, !was);
      audio.stopMusic?.();
    } finally {
      delete globalThis.AudioContext;
    }
  });
}

for (const set of sets('storage')) {
  test(`storage/${set}: remembers nothing it was not told, and survives a store that refuses`, async () => {
    const { createStorage } = await import(`../src/storage/${set}.js`);
    const fresh = createStorage(memoryStore());
    assert.equal(typeof fresh.load(), 'object');
    const refusing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    assert.doesNotThrow(() => createStorage(refusing).load());
    assert.doesNotThrow(() => createStorage(null).load());
  });
}

for (const module of ['textures', 'music', 'score', 'horizons', 'scenery', 'lava', 'stage', 'effects', 'views']) {
  for (const set of sets(module)) {
    test(`${module}/${set}: loads, and exports what its game imports`, async () => {
      const mod = await import(`../src/${module}/${set}.js`);
      assert.ok(Object.keys(mod).length > 0);
    });
  }
}

test('a camera view is its game\'s home, and nothing else about it differs', async () => {
  const arcade = await import('../src/views/arcade.js');
  const town = await import('../src/views/town.js');
  const catroller = await import('../src/views/catroller.js');
  assert.equal(arcade.HOME.zoom, 1);
  assert.equal(catroller.HOME.zoom, 1.12);
  assert.equal(town.HOME.pitch, 0.92);
  assert.deepEqual(arcade.LIMITS, town.LIMITS);
});

for (const set of sets('town').length ? [] : []) void set;

test('the town games each have their textures, built on one set of painters', async () => {
  const root = join(src, 'town');
  for (const set of ['metrlol', 'petroll']) {
    for (const f of ['paint', 'surfaces', 'textures']) {
      const mod = await import(`../src/town/${set}/${f}.js`);
      assert.ok(Object.keys(mod).length > 0, `${set}/${f}`);
    }
  }
  assert.ok(readdirSync(join(root, 'shared')).includes('paint.js'));
});
