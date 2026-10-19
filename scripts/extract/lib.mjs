/**
 * The machinery behind `characters.mjs` and `heroes.mjs`: gathers a game's
 * files into *sets* (one per game, laid out as the game has them) and keeps
 * a file once, in `shared/`, when it is the same in two or more games.
 *
 * "The same" means the same text, importing the same things: every import
 * is resolved, and the files it names inside the set must be the same too,
 * and what it names outside the set (the sculpting kit, the physics) must be
 * the same engine file. A set's own file then points at the shared one, so
 * everything the game imports from its own folders still resolves.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';

const md5 = (text) => createHash('md5').update(text).digest('hex');
const IMPORT = /(\b(?:from|import)\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

/**
 * @param gamesDir  the folder the games are in
 * @param sets      { name: { dir, groups: [{ from, to, only?, skip? }] } }; a group
 *                  is a folder of the game (`from`, under its `dir`) laid out as `to` in the set
 * @param out       the folder to write the sets into
 * @param engineOf  (gamePath, set) => the engine file (from `src/`) that a game file outside
 *                  the set stands for, or null if there is none
 */
export function extract({ gamesDir, sets, out, engineOf, kind }) {
  const files = [];
  for (const [set, def] of Object.entries(sets)) {
    for (const g of def.groups) {
      const root = join(gamesDir, def.dir, g.from);
      const names = g.only ?? readdirSync(root).filter((n) => n.endsWith('.js') && statSync(join(root, n)).isFile());
      for (const name of names) {
        if (g.skip?.includes(name)) continue;
        files.push({ set, path: posix.join(g.to, name), gamePath: posix.join(g.from, name), text: readFileSync(join(root, name), 'utf8') });
      }
    }
  }
  const byKey = new Map(files.map((f) => [`${f.set}:${f.path}`, f]));

  // What each import of each file is: a file of the set, or an engine file.
  for (const f of files) {
    f.imports = [...f.text.matchAll(IMPORT)].map((m) => {
      const inSet = posix.join(posix.dirname(f.path), m[3]);
      if (byKey.has(`${f.set}:${inSet}`)) return { spec: m[3], dep: byKey.get(`${f.set}:${inSet}`) };
      const game = posix.join(posix.dirname(f.gamePath), m[3]);
      const engine = engineOf(game, f.set);
      if (!engine) throw new Error(`${f.set}:${f.path} imports ${m[3]} (${game}), which is neither in the set nor in the engine`);
      return { spec: m[3], engine };
    });
  }

  function closure(f, seen = []) {
    if (f.closure) return f.closure;
    if (seen.includes(f)) throw new Error(`import cycle at ${f.set}:${f.path}`);
    f.closure = md5(f.text + '|' + f.imports.map((i) => (i.dep ? closure(i.dep, [...seen, f]) : i.engine)).sort().join(','));
    return f.closure;
  }
  files.forEach((f) => closure(f));

  // Shared: the same closure under the same name in two or more sets.
  const groups = new Map();
  for (const f of files) {
    const k = `${f.path}#${f.closure}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }
  const taken = new Set();
  for (const g of [...groups.values()].filter((x) => x.length > 1).sort((a, b) => b.length - a.length)) {
    const path = g[0].path;
    const name = taken.has(path) ? path.replace(/\.js$/, `.${g[0].closure.slice(0, 6)}.js`) : path;
    taken.add(path);
    for (const f of g) f.shared = name;
  }

  /** The text of `f` for the engine: imports of the set pointing at the shared names, the rest at the engine. */
  const at = (f) => posix.join(f.shared ? 'shared' : f.set, f.shared ?? f.path);
  function engineText(f) {
    let i = 0;
    return f.text.replace(IMPORT, (all, head, q) => {
      const imp = f.imports[i++];
      const from = posix.dirname(at(f));
      let to;
      if (imp.dep) {
        if (f.shared && !imp.dep.shared) throw new Error(`${f.path} is shared but imports ${imp.dep.path}, which is not`);
        to = imp.dep.shared && f.shared ? posix.join('shared', imp.dep.shared) : posix.join(f.set, imp.dep.path);
      } else {
        to = posix.join('..', imp.engine);
      }
      let rel = posix.relative(from, to);
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return `${head}${q}${rel}${q}`;
    });
  }

  rmSync(out, { recursive: true, force: true });
  const write = (rel, text) => {
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), text);
  };
  const written = new Set();
  let stubs = 0;
  for (const f of files) {
    if (f.shared) {
      if (!written.has(f.shared)) {
        write(`shared/${f.shared}`, engineText(f));
        written.add(f.shared);
      }
      let target = posix.relative(posix.dirname(f.path), posix.join('..', 'shared', f.shared));
      if (!target.startsWith('.')) target = `./${target}`;
      const hasDefault = /^export default\b/m.test(f.text) || /^export \{[^}]*\bdefault\b/m.test(f.text);
      write(`${f.set}/${f.path}`, `export * from '${target}';\n${hasDefault ? `export { default } from '${target}';\n` : ''}`);
      stubs++;
    } else {
      write(`${f.set}/${f.path}`, engineText(f));
    }
  }
  console.log(`${kind}: ${files.length} files across ${Object.keys(sets).length} sets: ${written.size} kept once in shared/ (used ${stubs} times), ${files.length - stubs} stay in their sets`);
  for (const set of Object.keys(sets)) {
    const mine = files.filter((f) => f.set === set);
    console.log(`  ${set}: ${mine.length} files, ${mine.filter((f) => f.shared).length} shared`);
  }
  return { files, relative: relative(join(out, '..', '..'), out) };
}

export { existsSync };
