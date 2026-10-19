#!/usr/bin/env node
/**
 * Gathers the town games' textures into `src/town/`, as sets (see `lib.mjs`).
 *
 *     node scripts/extract/town.mjs --games <folder with the games>
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extract } from './lib.mjs';
import { TOWN } from './sets.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const gamesDir = resolve(args[args.indexOf('--games') + 1] ?? '..');

extract({ gamesDir, sets: TOWN, out: join(ENGINE, 'src', 'town'), engineOf: () => null, kind: 'town' });
