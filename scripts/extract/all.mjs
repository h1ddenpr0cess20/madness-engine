#!/usr/bin/env node
/**
 * Rebuilds everything the engine takes from the games, in order:
 *
 *     npm run extract -- --games <folder with the games>
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
for (const step of ['characters', 'heroes', 'town', 'variants']) {
  const { status } = spawnSync(process.execPath, [join(here, `${step}.mjs`), ...process.argv.slice(2)], { stdio: 'inherit' });
  if (status) process.exit(status);
}
