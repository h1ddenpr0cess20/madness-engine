#!/usr/bin/env node
/**
 * Gathers the characters and props of every game into `src/characters/`.
 *
 *     node scripts/extract/characters.mjs --games <folder with the games>
 *
 * Each game's cast (its people, creatures and monsters), its props and, for
 * the town games, its street models become a *set*, `src/characters/<set>/`,
 * laid out as the game has them. See `lib.mjs` for what is shared.
 */
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extract } from './lib.mjs';
import { SETS } from './sets.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const gamesDir = resolve(args[args.indexOf('--games') + 1] ?? '..');

/** What a game file outside the set is, in the engine: the sculpting kit. */
export function kitOf(game) {
  const m = /^src\/(?:models|sculpt)\/(sdf|skins|rig|model)\.js$/.exec(game);
  return m ? `models/${m[1]}.js` : null;
}

extract({ gamesDir, sets: SETS, out: join(ENGINE, 'src', 'characters'), engineOf: (game) => kitOf(posix.normalize(game)), kind: 'characters' });
