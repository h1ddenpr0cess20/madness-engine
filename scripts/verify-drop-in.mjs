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
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HEROES, SETS, TOWN, VARIANTS, versionsOf } from './extract/sets.mjs';
import { GAMES } from './drop-in/games.mjs';
import { compareKit, compareSets } from './drop-in/characters-diff.mjs';
import { compareVersion } from './drop-in/variants-diff.mjs';
import { compareAudio, compareMusic } from './drop-in/audio-diff.mjs';
import { compareInput } from './drop-in/input-diff.mjs';
import { copyGame, dropIn } from './drop-in/overlay.mjs';
import { dropInPackage } from './drop-in/package-mode.mjs';
import { comparePhysics } from './drop-in/physics-diff.mjs';
import { compareShaders } from './drop-in/shaders-diff.mjs';
import { compareView } from './drop-in/view-diff.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(`--${name}`); return i < 0 ? undefined : args[i + 1]; };
const gamesDir = resolve(flag('games') ?? '..');
const only = flag('only')?.split(',');
const work = flag('work') ?? mkdtempSync(join(tmpdir(), 'drop-in-'));
const skipTests = args.includes('--skip-tests');
// --package: also run the game's tests with the engine installed as a package (`npm pack`, then `npm install`) and the game built by Vite.
const asPackage = args.includes('--package') || args.includes('--package-only');
const packageOnly = args.includes('--package-only');

/** Runs `command` in `dir`; resolves with how it ended and what it said. */
const run = (dir, command, commandArgs) => new Promise((done) => {
  const child = spawn(command, commandArgs, { cwd: dir });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  child.on('close', (code) => done({ code, out }));
});

let packed = null;
const pack = async () => {
  if (packed) return packed;
  const root = join(ENGINE, '..');
  const { code, out } = await run(root, 'npm', ['pack', '--pack-destination', work, '--silent']);
  if (code) throw new Error(`npm pack failed: ${out}`);
  return (packed = join(work, out.trim().split('\n').at(-1)));
};

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

  if (!packageOnly) {
    const physics = await comparePhysics(join(dir, 'src/physics.js'), join(ENGINE, 'physics.js'), { slide: g.physics === 'slide' });
    report(physics.ok && physics.reaches, physics.ok
      ? `physics: ${physics.steps} steps over 6 worlds identical${physics.reaches ? '' : ' — but the scenario never reaches the option, so it proves nothing'}`
      : `physics differs at ${physics.detail}`);

    const input = await compareInput(join(dir, 'src/input.js'), join(ENGINE, 'input.js'), { boost: g.boost, api: g.api, controls: g.controls });
    report(input.ok, input.ok ? `input: ${input.frames} frames of scripted keys, mouse, touch, pad identical` : `input differs at ${input.detail}`);

    const shaders = await compareShaders(join(dir, g.gfx, 'shaders'), join(ENGINE, 'gfx', 'shaders'));
    report(shaders.ok, shaders.ok ? `shaders: all ${shaders.files} files are the game's own, comments aside` : `shaders differ: ${shaders.detail}`);

    for (const [kind, sets, key, label] of [['characters', SETS, g.set, 'characters'], ['heroes', HEROES, g.hero, 'main characters']]) {
      if (!key || (g.dir ?? name) !== sets[key].dir) continue;
      const result = compareSets(gamesDir, kind, sets, key);
      report(result.ok, result.ok ? `${label}: all ${result.files} files are the game's own, import paths aside` : `${label} differ: ${result.detail}`);
    }
    {
      const id = g.hero ?? name;
      for (const v of versionsOf(id, g.dir ?? name)) {
        const text = readFileSync(join(gamesDir, g.dir ?? name, v.file), 'utf8');
        let result;
        if (v.exact) result = compareVersion(text, v.module, v.set);
        else {
          const sameAs = readFileSync(join(gamesDir, VARIANTS[v.module][v.set][1]), 'utf8');
          result = text === sameAs ? { ok: true, statements: 0, exports: 0 } : { ok: false, detail: `it is not ${v.set}'s` };
        }
        report(result.ok, result.ok ? `${v.module}: ${v.exact ? `${result.statements} statements, ${result.exports} exports, all the game's own` : `the same file as ${v.set}'s`}` : `${v.module} differs: ${result.detail}`);
        if (v.module === 'audio' || v.module === 'music') {
          const sound = await (v.module === 'audio' ? compareAudio : compareMusic)(join(gamesDir, g.dir ?? name, v.file), join(ENGINE, v.module, `${v.set}.js`));
          report(sound.ok, sound.ok ? `${v.module} played: ${sound.calls} Web Audio calls, identical` : `${v.module} sounds differ at ${sound.detail}`);
        }
      }
      if (TOWN[id] && TOWN[id].dir === (g.dir ?? name)) {
        const town = compareSets(gamesDir, 'town', TOWN, id);
        report(town.ok, town.ok ? `town textures: all ${town.files} files are the game's own, import paths aside` : `town textures differ: ${town.detail}`);
      }
    }
    if (g.hero === 'petroll' || g.hero === 'metrlol') {
      const kit = compareKit(gamesDir, g.dir ?? name);
      report(kit.ok, kit.ok ? `town kit: kit.js and linearRGB are the game's own` : `town kit differs: ${kit.detail}`);
    }

    const view = await compareView(join(dir, 'src/view.js'), join(ENGINE, 'view.js'), { home: g.home });
    report(view.ok, view.ok ? `view: ${view.ops} operations identical` : `view differs at ${view.detail}`);
  }

  if (skipTests) continue;
  const before = join(work, name, 'before'), after = join(work, name, 'after');
  copyGame(dir, before);
  copyGame(dir, after);
  dropIn(name, after);
  const [a, b] = await Promise.all([tests(before), packageOnly ? null : tests(after)]);
  report(a.fail === 0, `own tests, untouched: ${a.pass}/${a.tests} pass`);
  if (b) {
    const same = b.fail === 0 && b.pass === a.pass && b.tests === a.tests;
    report(same, `own tests, engine dropped in: ${b.pass}/${b.tests} pass`);
    if (!same) console.log(b.out.split('\n').filter((l) => /not ok|error|Error/.test(l)).slice(0, 20).join('\n'));
  }

  if (!asPackage) continue;
  const pkg = join(work, name, 'package');
  copyGame(dir, pkg);
  dropInPackage(name, pkg);
  const install = await run(pkg, 'npm', ['install', '--no-audit', '--no-fund', await pack()]);
  report(install.code === 0, install.code === 0 ? 'installed with the engine as a package' : `npm install failed:\n${install.out.slice(-600)}`);
  if (install.code) continue;
  const [c, built] = await Promise.all([tests(pkg), run(pkg, 'npx', ['vite', 'build'])]);
  const packaged = c.fail === 0 && c.pass === a.pass && c.tests === a.tests;
  report(packaged, `own tests, engine as a package: ${c.pass}/${c.tests} pass`);
  if (!packaged) console.log(c.out.split('\n').filter((l) => /not ok|error|Error/.test(l)).slice(0, 20).join('\n'));
  report(built.code === 0, built.code === 0 ? 'vite build: bundles, shaders and all' : `vite build failed:\n${built.out.slice(-800)}`);
}

console.log(bad ? `\n${bad} check(s) failed` : '\nAll checks passed');
process.exit(bad ? 1 : 0);
