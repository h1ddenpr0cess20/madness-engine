#!/usr/bin/env node
/**
 * Splits the modules the games each have a version of — textures, music,
 * audio, effects, stage, storage — into a core and a variant per game (see
 * `dedupe.mjs`), under `src/<module>/`, and writes the camera views.
 *
 *     node scripts/extract/variants.mjs --games <folder with the games>
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dedupe } from './dedupe.mjs';
import { GAME_INFO, VARIANTS, VIEWS } from './sets.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const gamesDir = resolve(args[args.indexOf('--games') + 1] ?? '..');

/** What a game's import of one of its own files is, in the engine (from `src/`); null if the engine has no such file. */
export function engineImport(game, gamePath, spec) {
  const info = GAME_INFO[game];
  const file = posix.normalize(posix.join(posix.dirname(gamePath), spec)).replace(/^src\//, '');
  let m;
  if ((m = /^vendor\/gfx\/(\w+)\.js$/.exec(file))) return `gfx/${m[1]}.js`;
  if (file === 'view.js') return `views/${info.view}.js`;
  if (file === 'physics.js') return 'physics.js';
  if (file === 'textures.js' && info.textures) return `textures/${info.textures}.js`;
  if (file === 'music.js' && info.music) return `music/${info.music}.js`;
  if (file === 'score.js' && info.score) return `score/${info.score}.js`;
  if (file === 'horizons.js' && info.horizons) return `horizons/${info.horizons}.js`;
  if (file === 'scenery.js' && info.scenery) return `scenery/${info.scenery}.js`;
  if (file === 'lava.js' && info.lava) return `lava/${info.lava}.js`;
  if (file === 'marble.js') return 'heroes/madness/marble.js';
  return null;
}

const IMPORT = /(\b(?:from|import)\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

/** A version's text with the imports of the game's own files pointing at the engine's, from `src/<module>/<set>.js`. */
function rewrite(text, module, game, path, set) {
  const dirOfGameFile = posix.dirname(path.replace(/^pr\//, '').split('/').slice(1).join('/')); // 'src'
  return text.replace(IMPORT, (all, head, q, spec) => {
    const engine = engineImport(game, posix.join(dirOfGameFile, 'x.js'), spec);
    if (!engine) throw new Error(`${module}/${set}: imports ${spec}, which the engine has no file for`);
    // Imports of the engine's own variants of this module are siblings.
    let rel = posix.relative(module, engine);
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `${head}${q}${rel}${q}`;
  });
}

for (const [module, sets] of Object.entries(VARIANTS)) {
  const sources = {};
  for (const [set, [game, path]] of Object.entries(sets)) sources[set] = rewrite(readFileSync(join(gamesDir, path), 'utf8'), module, game, path, set);
  const { core, variants, report } = dedupe(sources);
  const out = join(ENGINE, 'src', module);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'core.js'), core);
  for (const [name, text] of Object.entries(variants)) writeFileSync(join(out, `${name}.js`), text);
  console.log(`${module}: ${report.shared} statements in the core`);
  for (const [name, r] of Object.entries(report.variants)) console.log(`  ${name}: ${r.taken} (${r.lines.taken} lines) from the core, ${r.own} (${r.lines.own} lines) its own`);
}

// The camera views: a game's `view.js` is one of these.
const views = join(ENGINE, 'src', 'views');
rmSync(views, { recursive: true, force: true });
mkdirSync(views, { recursive: true });
for (const [name, home] of Object.entries(VIEWS)) {
  writeFileSync(join(views, `${name}.js`), `import { defineView } from '../view.js';\n\nexport const { HOME, LIMITS, createView, groundAxes } = defineView({ home: ${JSON.stringify(home)} });\n`);
}
