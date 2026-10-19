#!/usr/bin/env node
/**
 * Gathers the main characters — the marble, the d20, the boulder, the morning
 * star, the yarn, the hamster — of every game into `src/heroes/`, as sets
 * (see `lib.mjs`). What they stand on in the games is the engine's: the
 * physics, the sculpting kit, the characters, and the town's prop kit.
 *
 *     node scripts/extract/heroes.mjs --games <folder with the games>
 */
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extract } from './lib.mjs';
import { HEROES } from './sets.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const gamesDir = resolve(args[args.indexOf('--games') + 1] ?? '..');

/** What a game file outside a hero's set is, in the engine. */
export function engineOf(game, set) {
  game = posix.normalize(game);
  if (game === 'src/physics.js') return 'physics.js';
  if (game === 'src/kit.js') return 'kit.js';
  if (game === 'src/sculpt/bake.js') return 'models/legacy-bake.js';
  if (game === 'src/models/cast/index.js') return `characters/${set}/cast/index.js`;
  const kit = /^src\/(?:models|sculpt)\/(sdf|skins|rig|model)\.js$/.exec(game);
  return kit ? `models/${kit[1]}.js` : null;
}

extract({ gamesDir, sets: HEROES, out: join(ENGINE, 'src', 'heroes'), engineOf, kind: 'heroes' });
