#!/usr/bin/env node
/**
 * Proves the engine is a drop-in for the games: that a game running on it
 * plays and looks as it did.
 *
 *     npm run verify -- --games ..            # every game that is beside this one
 *     npm run verify -- --games .. --only dungeon-roller,catroller
 *
 * For each game, three things are checked against the game's own copies of
 * the engine files:
 *
 *   1. Physics, input and view, one by one, bit for bit: the same seeded
 *      worlds, the same scripted sessions, the same state after every step.
 *   2. The game's whole test suite, on a copy with the engine files
 *      swapped in (`drop-in/overlay.mjs`), against the same suite on an
 *      untouched copy. Those suites include autopilots that play every level.
 *
 * Exits non-zero if anything differs.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GAMES } from './drop-in/games.mjs';
import { compareInput } from './drop-in/input-diff.mjs';
import { copyGame, dropIn } from './drop-in/overlay.mjs';
import { comparePhysics } from './drop-in/physics-diff.mjs';
import { compareView } from './drop-in/view-diff.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(`--${name}`); return i < 0 ? undefined : args[i + 1]; };
const gamesDir = resolve(flag('games') ?? '..');
const only = flag('only')?.split(',');
const work = flag('work') ?? mkdtempSync(join(tmpdir(), 'drop-in-'));
const skipTests = args.includes('--skip-tests');

const tests = (dir) => new Promise((done) => {
  const child = spawn(process.execPath, ['--test', 'test/**/*.test.js'], { cwd: dir });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  child.on('close', () => {
    const n = (k) => Number(new RegExp(`^# ${k} (\\d+)`, 'm').exec(out)?.[1] ?? NaN);
    done({ pass: n('pass'), fail: n('fail'), tests: n('tests'), out });
  });
});

let bad = 0;
const report = (ok, text) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${text}`); };

for (const [name, g] of Object.entries(GAMES)) {
  if (only && !only.includes(name)) continue;
  const dir = join(gamesDir, g.dir ?? name);
  if (!existsSync(dir)) { console.log(`${name}: not found in ${gamesDir}, skipped`); continue; }
  console.log(name);

  const physics = await comparePhysics(join(dir, 'src/physics.js'), join(ENGINE, 'physics.js'), { slide: g.physics === 'slide' });
  report(physics.ok && physics.reaches, physics.ok
    ? `physics: ${physics.steps} steps over 6 worlds identical${physics.reaches ? '' : ' — but the scenario never reaches the option, so it proves nothing'}`
    : `physics differs at ${physics.detail}`);

  const input = await compareInput(join(dir, 'src/input.js'), join(ENGINE, 'input.js'), { boost: g.boost, api: g.api, controls: g.controls });
  report(input.ok, input.ok ? `input: ${input.frames} frames of scripted keys, mouse, touch, pad identical` : `input differs at ${input.detail}`);

  const view = await compareView(join(dir, 'src/view.js'), join(ENGINE, 'view.js'), { home: g.home });
  report(view.ok, view.ok ? `view: ${view.ops} operations identical` : `view differs at ${view.detail}`);

  if (skipTests) continue;
  const before = join(work, name, 'before'), after = join(work, name, 'after');
  copyGame(dir, before);
  copyGame(dir, after);
  dropIn(name, after);
  const [a, b] = await Promise.all([tests(before), tests(after)]);
  report(a.fail === 0, `own tests, untouched: ${a.pass}/${a.tests} pass`);
  const same = b.fail === 0 && b.pass === a.pass && b.tests === a.tests;
  report(same, `own tests, engine dropped in: ${b.pass}/${b.tests} pass`);
  if (!same) console.log(b.out.split('\n').filter((l) => /not ok|error|Error/.test(l)).slice(0, 20).join('\n'));
}

console.log(bad ? `\n${bad} check(s) failed` : '\nAll checks passed');
process.exit(bad ? 1 : 0);
