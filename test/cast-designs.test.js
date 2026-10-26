import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Sculpt } from '../src/models/sdf.js';
import { Skeleton } from '../src/models/rig.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../src/characters');
const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const path = join(dir, entry);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const castFiles = walk(root).filter((path) => path.endsWith('.js'));
const isDefinition = (value) => value && typeof value.sculpt === 'function';

/**
 * Every cast definition should remain a well-formed sculpt, including older
 * game versions that are not in the default CHARACTERS catalogue.
 */
test('every cast definition sculpts finite geometry with a valid rig', async () => {
  const checked = new Set();

  for (const file of castFiles) {
    const module = await import(pathToFileURL(file));
    const definitions = [];
    if (isDefinition(module.default)) definitions.push(module.default);
    if (module.CAT_DEFS) definitions.push(...Object.values(module.CAT_DEFS));
    if (module.CHARACTERS) definitions.push(...Object.values(module.CHARACTERS));

    for (const def of definitions) {
      if (checked.has(def)) continue;
      checked.add(def);
      const label = `${relative(root, file)} (${def.name ?? 'unnamed'})`;
      assert.equal(typeof def.name, 'string', `${label}: missing name`);
      assert.ok(Number.isFinite(def.scale ?? 1) && (def.scale ?? 1) > 0, `${label}: invalid scale`);
      assert.ok(Number.isFinite(def.cell ?? 0.012) && (def.cell ?? 0.012) > 0, `${label}: invalid cell size`);
      assert.ok(Array.isArray(def.bones) && def.bones.length > 0, `${label}: missing bones`);

      const names = def.bones.map(([name]) => name);
      assert.equal(new Set(names).size, names.length, `${label}: duplicate bone names`);
      assert.doesNotThrow(() => new Skeleton(def.bones), `${label}: invalid rig hierarchy`);
      const sculpt = new Sculpt();
      assert.doesNotThrow(() => def.sculpt(sculpt), `${label}: sculpt threw`);
      assert.ok(sculpt.shapes.length > 0, `${label}: empty sculpt`);

      for (const [index, shape] of sculpt.shapes.entries()) {
        assert.ok(Array.isArray(shape.box) && shape.box.length === 2, `${label}: shape ${index} has no bounds`);
        for (const corner of shape.box) {
          assert.equal(corner.length, 3, `${label}: shape ${index} has malformed bounds`);
          assert.ok(corner.every(Number.isFinite), `${label}: shape ${index} has non-finite bounds`);
        }
      }

      const parts = sculpt.split();
      assert.ok(parts.size > 0, `${label}: no mesh parts`);
      for (const [partName, part] of parts) {
        assert.ok(part.shapes.length > 0, `${label}: empty ${partName} part`);
      }

      // Shared human/animal faces and the kangaroo all use real highlight
      // geometry. This guards against reverting to paint marks that vanish
      // when the face and eye parts are meshed independently.
      if (def.cells?.highlights !== undefined) {
        assert.ok(def.cells.highlights > 0, `${label}: highlights have no dedicated grid`);
        assert.ok(parts.has('highlights'), `${label}: configured highlights have no geometry`);
      }
    }
  }

  assert.ok(checked.size >= 200, `Only checked ${checked.size} cast definitions`);
});
