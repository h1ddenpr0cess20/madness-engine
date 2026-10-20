import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as GFX from '../src/gfx/index.js';
import { fakeAudio, memoryStore } from './helpers/webaudio.js';

const src = join(dirname(fileURLToPath(import.meta.url)), '../src');

/** Runs `f` with a fake Web Audio as the page's, and gives it the log of what was asked of it. */
async function withAudio(f) {
  const { FakeContext, log } = fakeAudio();
  globalThis.AudioContext = FakeContext;
  try {
    return await f(log);
  } finally {
    delete globalThis.AudioContext;
  }
}

test('audio: silent until woken, then every kind of sound plays, through the right bus', async () => {
  const { createAudio, NOTE } = await import('../src/audio.js');
  assert.equal(NOTE(69), 440);
  await withAudio((log) => {
    const audio = createAudio();
    audio.tone({ freq: 440 });
    audio.burst({});
    assert.equal(audio.loop(), null);
    assert.equal(log.length, 0, 'nothing before wake()');

    let woke = 0;
    audio.onWake(() => woke++);
    audio.wake();
    assert.equal(woke, 1);
    audio.onWake(() => woke++);
    assert.equal(woke, 2, 'onWake after waking runs at once');
    assert.ok(audio.ctx && audio.sfx && audio.music && audio.noise);

    const before = log.length;
    audio.tone({ freq: 440, to: 220, length: 0.2 });
    audio.burst({ type: 'highpass', freq: 3000, sweep: 6000 });
    audio.jingle([60, 64, 67]);
    const roll = audio.loop({ filters: [{ type: 'bandpass', freq: 300 }, { type: 'lowpass', freq: 1400 }] });
    roll.set({ gain: 0.3, filter: 500 });
    const rev = audio.loop({ source: 'sawtooth', freq: 55 });
    rev.set({ freq: 110 });
    rev.stop();
    assert.ok(log.length > before + 20);
    // A vibrato is a second oscillator wobbling the note's pitch.
    const plain = log.length;
    audio.tone({ freq: 220 });
    const wobbled = log.length;
    audio.tone({ freq: 220, vibrato: 6 });
    assert.ok(log.length - wobbled > wobbled - plain, 'a vibrato adds to the note');
    // Rubbish in is quiet, not an exception: Web Audio throws on anything not finite.
    assert.doesNotThrow(() => audio.tone({ freq: NaN, gain: Infinity, length: -1 }));
    assert.doesNotThrow(() => audio.tone({ freq: 220, vibrato: NaN }));
  });
});

test('audio: the mute switch is remembered where the game says, and a store that refuses does no harm', async () => {
  const { createAudio } = await import('../src/audio.js');
  globalThis.localStorage = memoryStore();
  try {
    await withAudio(() => {
      const audio = createAudio({ storageKey: 'test.muted', glue: true });
      audio.wake();
      assert.equal(audio.toggleMute(), true);
      assert.equal(createAudio({ storageKey: 'test.muted' }).muted, true);
      assert.equal(createAudio().muted, false, 'without a key nothing is kept');
      audio.setVolume('music', 2);
      audio.setVolume('sfx', 0.5);
    });
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    await withAudio(() => {
      const audio = createAudio({ storageKey: 'test.muted' });
      audio.wake();
      assert.equal(audio.toggleMute(), true);
    });
  } finally {
    delete globalThis.localStorage;
  }
});

for (const file of readdirSync(join(src, 'music')).filter((f) => /^(band|score)/.test(f))) {
  test(`music/${file}: plays into the audio's music bus`, async () => {
    const { createAudio } = await import('../src/audio.js');
    const mod = await import(pathToFileURL(join(src, 'music', file)));
    await withAudio((log) => {
      const audio = createAudio();
      audio.wake();
      const make = mod.createBand ?? mod.createScore;
      const player = make(audio.ctx, audio.music, audio.noise);
      const before = log.length;
      if (mod.THEMES) {
        const names = Object.keys(mod.THEMES);
        assert.ok(names.length > 1);
        player.sketch(mod.THEMES[names[0]], 120, 2);
      } else {
        player.sketch?.(mod.themeFor(1), 2);
      }
      if (player.sketch) assert.ok(log.length > before, 'something was played');
    });
  });
}

test('effects: bits fly, land on the ground, fade and are gone; rings go out; weather falls', async () => {
  const { createEffects, shardGeometry, WEATHER } = await import('../src/effects.js');
  const scene = new GFX.Scene();
  const ground = { heightAt: () => 0 };
  const effects = createEffects(GFX, scene, { ground });
  const shard = shardGeometry(GFX);
  const glass = new GFX.MeshBasicMaterial();
  effects.burst({ at: [0, 1, 0], count: 12, mesh: () => new GFX.Mesh(shard, glass), speed: 3, up: 4, life: 1, lifeSpread: 0 });
  effects.spawn(new GFX.Mesh(shard, glass), { x: 0, y: 2, z: 0, bounce: 0, life: 5 });
  effects.ring(0, 0, 0, { reach: 2 });
  assert.equal(effects.count, 13);
  for (let i = 0; i < 60; i++) effects.update(1 / 60);
  for (const m of effects.group.children.filter((c) => c.geometry === shard)) assert.ok(m.position.y >= -0.01, `a bit went through the ground at ${m.position.y}`);
  for (let i = 0; i < 30; i++) effects.update(1 / 60);
  assert.equal(effects.count, 1, 'the shards are gone, the one that lives longer is not');
  effects.clear();
  assert.equal(effects.count, 0);

  for (const name of Object.keys(WEATHER)) {
    effects.setWeather(name);
    for (let i = 0; i < 10; i++) effects.weather(1 / 30, 0, 1, 0);
  }
  effects.setWeather(null);
  effects.weather(1 / 30, 0, 1, 0);
});

test('stage: what it is built from works without a page', async () => {
  // The WebGPU backend reads the browser's usage flags as it loads.
  globalThis.GPUBufferUsage ??= {};
  globalThis.GPUTextureUsage ??= {};
  const { domeU, KEY, LENS, LIGHTS } = await import('../src/stage.js');
  assert.ok(Math.abs(KEY.length() - 1) < 1e-9);
  assert.ok(LENS.distance > 0 && LENS.fov > 0);
  assert.ok(LIGHTS.key.intensity > LIGHTS.fill.intensity);
  for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [0.3, -0.7]]) {
    const u = domeU(dx, dz);
    assert.ok(u >= 0 && u < 1, `${u}`);
  }
});

test('storage: settings keep only what the game has, of the right kind', async () => {
  const { pickSettings, SETTINGS } = await import('../src/storage.js');
  assert.deepEqual(pickSettings({ music: 0.2, sfx: 'loud', extra: 1 }), { music: 0.2 });
  assert.deepEqual(pickSettings(null), {});
  assert.deepEqual(pickSettings({ speed: 2 }, { speed: 1 }), { speed: 2 });
  assert.equal(SETTINGS.flashing, true);
});

test('views: arcade, close and town differ only in where the camera starts', async () => {
  const arcade = await import('../src/views/arcade.js');
  const close = await import('../src/views/close.js');
  const town = await import('../src/views/town.js');
  assert.equal(arcade.HOME.zoom, 1);
  assert.equal(close.HOME.zoom, 1.12);
  assert.equal(town.HOME.pitch, 0.92);
  assert.deepEqual(arcade.LIMITS, town.LIMITS);
  assert.deepEqual(close.createView().direction(), close.createView(close.HOME).direction());
});
