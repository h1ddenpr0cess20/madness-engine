import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import * as espree from 'espree';

import { edited } from '../extract/edits.mjs';
import { lift } from '../extract/library.mjs';
import { gradesOf, moodsOf, moodText } from '../extract/moods.mjs';
import { engineOf, MOODS, SOURCES, SPLIT } from '../extract/sources.mjs';
import { split } from '../extract/split.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
export const ORIGINS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'extract', 'origins.json'), 'utf8'));

const IMPORT = /(\b(?:from|import)\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;
/** A file's code with the paths of its imports left out. */
const code = (text) => text.replace(IMPORT, '$1$2$2');
/** Where a file's imports go, in order: from the game's file `from`, as the game sees it; from a library file, in the engine. */
const targets = (text, from) => [...text.matchAll(IMPORT)].map((m) => posix.normalize(posix.join(posix.dirname(from), m[3])));

/** Every name a module exports. */
function exportsOf(text) {
  const names = new Set();
  const own = (node, out = []) => {
    if (!node) return out;
    if (node.type === 'Identifier') out.push(node.name);
    else if (node.type === 'ObjectPattern') node.properties.forEach((p) => own(p.value ?? p.argument, out));
    else if (node.type === 'ArrayPattern') node.elements.forEach((e) => own(e, out));
    else if (node.type === 'RestElement') own(node.argument, out);
    else if (node.type === 'AssignmentPattern') own(node.left, out);
    return out;
  };
  for (const n of espree.parse(text, { ecmaVersion: 'latest', sourceType: 'module' }).body) {
    if (n.type === 'ExportDefaultDeclaration') names.add('default');
    else if (n.type === 'ExportNamedDeclaration') {
      if (n.declaration?.type === 'VariableDeclaration') n.declaration.declarations.forEach((d) => own(d.id).forEach((x) => names.add(x)));
      else if (n.declaration) names.add(n.declaration.id.name);
      n.specifiers.forEach((s) => names.add(s.exported.name));
    }
  }
  return names;
}

/**
 * Whether a version of a module whose versions share a core (`SPLIT`) is the
 * game's file: its own statements and the core's it takes, and nothing else,
 * are the file's statements, and it exports what the file exports.
 */
export function compareVersion(gameText, versionText, coreText, coreSpec) {
  const original = split(gameText);
  const version = split(versionText);
  const core = split(coreText);
  const real = (s) => !s.reexport;
  // A statement without the `export` in front of it: the core exports whatever a version takes from it.
  const bare = (s) => {
    const at = s.node.range[0] - s.start;
    return s.text.slice(0, at) + s.text.slice(at).replace(/^export\s+(?!default\b)/, '');
  };
  const declaredInCore = new Map();
  for (const s of core.statements) for (const n of s.names) declaredInCore.set(n, s);
  const need = [];
  for (const i of version.imports) if (i.source === coreSpec) need.push(...i.specifiers.map((x) => x.imported));
  for (const s of version.statements) if (s.reexport && s.exportSource === coreSpec) need.push(...s.exportSpecifiers.map((x) => x.local));
  const taken = new Map();
  const take = (n) => {
    const s = declaredInCore.get(n);
    if (!s || taken.has(s.text)) return;
    taken.set(s.text, s);
    for (const m of s.mentions) if (declaredInCore.has(m)) take(m);
  };
  need.forEach(take);

  const have = new Set([...version.statements.filter(real).map(bare), ...[...taken.values()].map(bare)]);
  const want = new Set(original.statements.filter(real).map(bare));
  const missing = [...want].filter((t) => !have.has(t));
  const extra = [...have].filter((t) => !want.has(t));
  if (missing.length || extra.length) return { ok: false, detail: `${missing.length} statements of the game's are missing, ${extra.length} are not the game's (${(missing[0] ?? extra[0]).slice(0, 60).replace(/\n/g, ' ')}…)` };
  const a = exportsOf(gameText), b = exportsOf(versionText);
  const lost = [...a].filter((n) => !b.has(n)), gained = [...b].filter((n) => !a.has(n));
  if (lost.length || gained.length) return { ok: false, detail: `exports differ: lost ${lost}, gained ${gained}` };
  return { ok: true };
}

/** The core the versions at `path` share, if they do: [its path, how they import it]. */
function coreOf(path) {
  for (const [place, core] of Object.entries(SPLIT)) {
    const stem = place.replace(/\.js$/, '');
    if (path === place || (path.startsWith(`${stem}.`) && path.endsWith('.js'))) {
      return [core, `./${posix.relative(posix.dirname(place), core)}`];
    }
  }
  return null;
}

/**
 * Whether everything the library took from the game in `dir` is, in the
 * library, the game's own: each file the same code (once the engine's
 * changes to it are made, `extract/edits.mjs`), its imports aside, and
 * each import going to the same thing — the library's file for the game's
 * file it imported, or the engine's.
 */
export function compareLibrary(game, dir) {
  const map = ORIGINS[game];
  if (!map) return { ok: false, detail: `the library has nothing recorded from ${game}` };
  let files = 0;
  for (const [gamePath, libPath] of Object.entries(map)) {
    const [file, fn] = gamePath.split('#');
    if (!existsSync(join(dir, file))) return { ok: false, detail: `${file} is not in the game any more (npm run extract)` };
    let theirs = readFileSync(join(dir, file), 'utf8');
    if (fn) theirs = lift(theirs, fn, SOURCES[game].find((g) => g.fn === fn && g.from === file).name);
    else theirs = edited(libPath, theirs);
    const ours = readFileSync(join(SRC, libPath), 'utf8');

    const core = coreOf(libPath);
    if (core && ours.includes(`'${core[1]}'`)) {
      const result = compareVersion(theirs, ours, readFileSync(join(SRC, core[0]), 'utf8'), core[1]);
      if (!result.ok) return { ok: false, detail: `${gamePath} -> ${libPath}: ${result.detail}` };
      files++;
      continue;
    }
    if (code(ours) !== code(theirs)) return { ok: false, detail: `${gamePath} -> ${libPath}: the code differs` };
    const want = targets(theirs, file).map((t) => map[t] ?? engineOf(t) ?? `(the game's ${t})`);
    const have = targets(ours, libPath);
    const i = want.findIndex((t, k) => t !== have[k]);
    if (i >= 0) return { ok: false, detail: `${gamePath} -> ${libPath}: import ${i + 1} is ${have[i]}, where the game's is ${want[i]}` };
    files++;
  }
  // And the game has nothing the library should have taken and hasn't.
  for (const g of SOURCES[game]) {
    if (g.fn) continue;
    const names = g.only ?? readdirSync(join(dir, g.from)).filter((n) => n.endsWith('.js') && statSync(join(dir, g.from, n)).isFile() && !g.skip?.includes(n));
    const missing = names.map((n) => posix.join(g.from, n)).filter((p) => !(p in map));
    if (missing.length) return { ok: false, detail: `the game has ${missing.join(', ')}, which the library hasn't taken yet (npm run extract)` };
  }
  return { ok: true, files };
}

/**
 * Whether the library has the mood of every set of the game in `dir`, and
 * every grade it has, each as the game's own code makes it now: the same
 * light, sky, reflections, film, weather and music (`extract/moods.mjs`).
 * Null if the game's sets have no moods.
 */
export async function compareMoods(game, dir) {
  if (!MOODS[game]) return null;
  const moods = await moodsOf(game, dir, ORIGINS);
  const ours = readdirSync(join(SRC, 'moods'));
  for (const m of moods) {
    const versions = ours.filter((n) => n === `${m.name}.js` || (n.startsWith(`${m.name}.`) && n.endsWith('.js')));
    if (!versions.some((n) => readFileSync(join(SRC, 'moods', n), 'utf8') === moodText(m, `moods/${n}`))) {
      return { ok: false, detail: `the library hasn't the mood of the set ${m.name} (${m.gamePath}) as the game has it (npm run extract)` };
    }
  }
  const { GRADES } = await import(pathToFileURL(join(SRC, 'moods/grades.js')).href);
  const grades = Object.entries(gradesOf(game, dir));
  for (const [name, film] of grades) {
    const versions = Object.keys(GRADES).filter((k) => k === name || k.startsWith(`${name}.`));
    if (!versions.some((k) => isDeepStrictEqual(GRADES[k], film))) return { ok: false, detail: `the library hasn't the ${name} grade as the game has it (npm run extract)` };
  }
  return { ok: true, sets: moods.length, grades: grades.length };
}

/** The town's prop kit, and the colour function it needs: the game's own, to the letter, bar where the colour function is found. */
export function compareKit(dir) {
  const kit = readFileSync(join(dir, 'src/kit.js'), 'utf8').replace("from './map.js'", "from './color.js'");
  if (kit !== readFileSync(join(SRC, 'kit.js'), 'utf8')) return { ok: false, detail: 'kit.js differs' };
  const color = readFileSync(join(SRC, 'color.js'), 'utf8').trim();
  if (!readFileSync(join(dir, 'src/map.js'), 'utf8').includes(color)) return { ok: false, detail: 'linearRGB is not the map\'s own' };
  return { ok: true };
}
