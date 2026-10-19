import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { bakeData } from '../src/models/legacy-bake.js';
import { bake } from '../src/models/model.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../src/characters');
const sets = readdirSync(root).filter((s) => s !== 'shared');

test('every game has a set of characters', () => {
  assert.deepEqual(sets.sort(), ['catroller', 'dungeon-roller', 'metrlol', 'metroll', 'petroll', 'rocknroller', 'rocknroller-ii', 'rocknroller-iii']);
});

for (const set of sets) {
  for (const [dir, key] of [['cast', 'CAST'], ['props', 'PROPS'], ['models', 'MODELS']]) {
    const index = join(root, set, dir, 'index.js');
    if (!existsSync(index)) continue;
    test(`${set}/${dir}: the roster loads, and what is in it bakes`, async () => {
      const roster = (await import(pathToFileURL(index)))[key];
      const names = Object.keys(roster);
      // (Catroller has no props.)
      if (key !== 'PROPS') assert.ok(names.length > 0, `${key} is empty`);
      if (!names.length) return;
      // The first and the last: the rest are the same code on the same kit, and the games' own tests bake every one.
      for (const name of [names[0], names.at(-1)]) {
        const def = roster[name];
        if (dir === 'models') {
          const m = bakeData(def);
          assert.ok(m.position.length > 0 && m.index.length > 0, name);
        } else {
          const m = bake(def, { detail: 0.5 });
          assert.ok(m.count > 100, `${name}: ${m.count} vertices`);
          for (let v = 0; v < Math.min(m.count, 200); v++) {
            let w = 0;
            for (let i = 0; i < 4; i++) w += m.skinWeight[v * 4 + i];
            assert.ok(Math.abs(w - 1) < 1e-4, `${name}: vertex ${v} weighs ${w}`);
          }
        }
      }
    });
  }
}

test('a shared character is one file, used by every set that has it', async () => {
  const shared = readdirSync(join(root, 'shared', 'cast')).filter((f) => !/^(humanoid|person|wardrobe|quadruped)/.test(f));
  assert.ok(shared.length >= 5);
  for (const set of sets) {
    for (const f of readdirSync(join(root, set, 'cast'))) {
      const text = (await import('node:fs')).readFileSync(join(root, set, 'cast', f), 'utf8');
      if (!text.includes("'../../shared/")) continue;
      const target = /from '(\.\.\/\.\.\/shared\/[^']+)'/.exec(text)[1];
      assert.ok(existsSync(join(root, set, 'cast', target)), `${set}/cast/${f} points at ${target}`);
    }
  }
});
