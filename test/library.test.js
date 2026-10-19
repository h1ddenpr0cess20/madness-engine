import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { bakeData } from '../src/models/legacy-bake.js';
import { bake } from '../src/models/model.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../src');
const KINDS = ['characters', 'props', 'heroes', 'scenery', 'textures', 'music'];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = KINDS.flatMap((k) => walk(join(src, k))).map((f) => relative(src, f));
/** `characters/punk.rocknroller-iii.js` is a version of `characters/punk.js`. */
const VERSION = /^(.*)\.(madness|dungeon-roller|catroller|rocknroller|rocknroller-ii|rocknroller-iii|metroll|metrlol|petroll)\.js$/;

test('the library is laid out by what things are, and no game has a folder of its own', () => {
  for (const kind of KINDS) {
    for (const entry of readdirSync(join(src, kind))) {
      assert.ok(!/^(madness|dungeon-roller|catroller|rocknroller(-ii|-iii)?|metroll|metrlol|petroll|shared)$/.test(entry), `${kind}/${entry}`);
    }
  }
});

test('every file in the library loads', async () => {
  for (const f of files) await import(pathToFileURL(join(src, f)));
  assert.ok(files.length > 250, `${files.length} files`);
});

test('every other version stands beside a default of the same thing, and exports what it does', async () => {
  let versions = 0;
  for (const f of files) {
    const m = VERSION.exec(f);
    if (!m) continue;
    versions++;
    const def = `${m[1]}.js`;
    assert.ok(existsSync(join(src, def)), `${f} has no ${def}`);
    const [a, b] = await Promise.all([import(pathToFileURL(join(src, f))), import(pathToFileURL(join(src, def)))]);
    // A version may have more than the default, or less, but they are the same kind of thing.
    const shared = Object.keys(a).filter((k) => k in b);
    assert.ok(shared.length > 0, `${f} and ${def} have nothing in common`);
  }
  assert.ok(versions > 50, `${versions} versions`);
});

test('where every game\'s file went is recorded, and is there', () => {
  const origins = JSON.parse(readFileSync(join(here, '../scripts/extract/origins.json'), 'utf8'));
  assert.deepEqual(Object.keys(origins).sort(), ['catroller', 'dungeon-roller', 'madness', 'metrlol', 'metroll', 'petroll', 'rocknroller', 'rocknroller-ii', 'rocknroller-iii']);
  for (const [game, map] of Object.entries(origins)) {
    for (const [from, to] of Object.entries(map)) assert.ok(existsSync(join(src, to)), `${game}: ${from} -> ${to}`);
  }
});

/** An even spread through a list: its first, its last and `n` between. */
const spread = (list, n = 6) => [...new Set(Array.from({ length: n + 2 }, (_, i) => list[Math.round((i * (list.length - 1)) / (n + 1))]))];

const bakes = (name, def) => {
  const m = bake(def, { detail: 0.25 });
  assert.ok(m.count > 50, `${name}: ${m.count} vertices`);
  for (let v = 0; v < Math.min(m.count, 200); v++) {
    let w = 0;
    for (let i = 0; i < 4; i++) w += m.skinWeight[v * 4 + i];
    assert.ok(Math.abs(w - 1) < 1e-4, `${name}: vertex ${v} weighs ${w}`);
  }
};

test('the catalogues list every sculpted character and prop by name, and they bake', async () => {
  const { CHARACTERS } = await import('../src/characters/index.js');
  const { PROPS } = await import('../src/props/index.js');
  assert.ok(Object.keys(CHARACTERS).length > 150);
  assert.ok(Object.keys(PROPS).length >= 20);
  for (const name of ['rat', 'punk', 'skeleton', 'dragon', 'mouse', 'cat-ginger', 'corgi']) assert.ok(CHARACTERS[name], name);
  for (const name of ['pick', 'chest', 'gold', 'tape']) assert.ok(PROPS[name], name);
  for (const name of spread(Object.keys(CHARACTERS))) bakes(name, CHARACTERS[name]);
  for (const name of spread(Object.keys(PROPS), 2)) bakes(name, PROPS[name]);
});

test('other versions of a character bake too', async () => {
  const alternates = files.filter((f) => /^(characters|props)\//.test(f) && VERSION.test(f));
  for (const f of spread(alternates, 4)) {
    const mod = await import(pathToFileURL(join(src, f)));
    if (mod.default) bakes(f, mod.default);
  }
});

test('the town\'s street models bake', async () => {
  const { STREET } = await import('../src/scenery/street.js');
  const { VEHICLES } = await import('../src/scenery/vehicles.js');
  for (const set of [STREET, VEHICLES]) {
    const name = Object.keys(set)[0];
    const m = bakeData(set[name]);
    assert.ok(m.position.length > 0 && m.index.length > 0, name);
  }
});

test('every room and every sky is one painter under one name, so any can stand in for another', async () => {
  for (const [dir, name] of [['rooms', 'paintRoom'], ['skies', 'paintSky']]) {
    const painters = readdirSync(join(src, 'textures', dir));
    assert.ok(painters.length >= 5, dir);
    for (const f of painters) {
      const mod = await import(pathToFileURL(join(src, 'textures', dir, f)));
      assert.equal(typeof mod[name], 'function', `${dir}/${f}`);
    }
  }
});

test('the painters are the textures the games paint with', async () => {
  const painters = await import('../src/textures/painters.js');
  for (const name of ['canvas', 'texture', 'random', 'mix', 'tiled', 'concrete', 'planks', 'grass', 'cobble', 'marble', 'FLOORS']) assert.ok(name in painters, name);
  const venue = await import('../src/textures/venue.js');
  for (const name of ['floorTexture', 'wallTexture', 'beltTexture', 'grilleTexture', 'gaffTexture', 'shutterTexture', 'panelTexture', 'glowTexture']) assert.equal(typeof venue[name], 'function', name);
  // Under node there is no canvas: a texture is nothing, rather than an error.
  assert.deepEqual(venue.floorTexture({}, 'concrete'), { map: null, bump: null });
});

test('everything is imported by name through the package, as a game imports it', async () => {
  const starter = readFileSync(join(here, '../examples/starter/src/main.js'), 'utf8');
  const readme = readFileSync(join(here, '../README.md'), 'utf8');
  const specs = new Set([...`${starter}\n${readme}`.matchAll(/from '(madness-engine\/[^']+)'/g)].map((m) => m[1]));
  assert.ok(specs.size > 15, `${specs.size} imports`);
  globalThis.GPUBufferUsage ??= {};
  globalThis.GPUTextureUsage ??= {};
  for (const spec of specs) await import(spec);
  const { CHARACTERS } = await import('madness-engine/characters');
  const { PROPS } = await import('madness-engine/props');
  assert.ok(CHARACTERS.punk && PROPS.pick);
  assert.ok((await import('madness-engine/characters/bouncer.rocknroller-iii')).default);
});
