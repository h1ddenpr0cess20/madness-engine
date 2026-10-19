import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** A file with its import paths reduced to the file they name (a shared copy's `.<hash>` suffix too), so only the code is compared. */
const code = (text) => text
  .replace(/(from\s+|import\s+)(['"])[^'"]*\/([^'"/]+?)(?:\.[0-9a-f]{6})?\.js\2/g, '$1$2$3.js$2')
  .replace(/legacy-bake\.js/g, 'bake.js');

/** The engine's text of a set's file, through the one-line file that points at the shared copy if it is one. */
function engineFile(root, set, path) {
  const file = join(root, set, path);
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const shared = /^export \* from '([^']+)';$/m.exec(text);
  return shared && text.split('\n').filter(Boolean).length <= 2 ? readFileSync(join(dirname(file), shared[1]), 'utf8') : text;
}

const walk = (dir, base = '') => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f), posix.join(base, f)) : [posix.join(base, f)]));

/**
 * Whether every file the game has in `sets[set]` (see `extract/sets.mjs`) is,
 * in the engine's `src/<kind>/<set>`, the same code — and the engine has no file
 * of the set that the game doesn't.
 */
export function compareSets(gamesDir, kind, sets, set) {
  const def = sets[set];
  const root = join(SRC, kind);
  let files = 0;
  const expected = new Set();
  for (const g of def.groups) {
    const folder = join(gamesDir, def.dir, g.from);
    const mine = g.only ?? readdirSync(folder).filter((n) => n.endsWith('.js') && statSync(join(folder, n)).isFile() && !g.skip?.includes(n));
    for (const name of mine) {
      const path = posix.join(g.to, name);
      expected.add(path);
      const theirs = engineFile(root, set, path);
      if (theirs === null) return { ok: false, detail: `${path} is missing from the engine` };
      if (code(theirs) !== code(readFileSync(join(folder, name), 'utf8'))) return { ok: false, detail: `${path} differs` };
      files++;
    }
  }
  const extra = walk(join(root, set)).filter((f) => !expected.has(f));
  if (extra.length) return { ok: false, detail: `the engine has ${extra.join(', ')} and the game doesn't` };
  return { ok: true, files };
}

/** The town's prop kit, and the colour function it needs: the games' own, to the letter, bar where the colour function is found. */
export function compareKit(gamesDir, dir) {
  const kit = readFileSync(join(gamesDir, dir, 'src/kit.js'), 'utf8').replace("from './map.js'", "from './color.js'");
  if (kit !== readFileSync(join(SRC, 'kit.js'), 'utf8')) return { ok: false, detail: 'kit.js differs' };
  const color = readFileSync(join(SRC, 'color.js'), 'utf8').trim();
  if (!readFileSync(join(gamesDir, dir, 'src/map.js'), 'utf8').includes(color)) return { ok: false, detail: 'linearRGB is not the map\'s own' };
  return { ok: true };
}
