#!/usr/bin/env node
/**
 * Builds the engine's library (`src/characters`, `props`, `heroes`, `scenery`,
 * `textures`, `music`) from the games, by what each thing is:
 *
 *     npm run extract -- --games <folder with the games>
 *
 * Each game file the library takes (`sources.mjs`) has a place in it,
 * `<kind>/<path>`. Two games' files at the same place are the same thing when
 * they are the same text importing the same things (every import is followed,
 * and what it names must be the same too); otherwise they are versions of it.
 * Every version is kept:
 *
 *   - the default, at `<kind>/<path>`, is the version the most games have
 *     (on a tie, the newest game's);
 *   - each other version is at `<kind>/<name>.<game>.js`, after the oldest
 *     game that has it.
 *
 * Nothing is rewritten but the import paths, and what `edits.mjs` says the
 * engine changes. `origins.json` beside this file
 * records where each game's file went, for `verify-drop-in` and for moving a
 * game onto the library. `characters/index.js` and `props/index.js` list every
 * default sculpted model by name.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dedupe } from './dedupe.mjs';
import { edited } from './edits.mjs';
import { gradesOf, gradesText, indexText, moodLine, moodsOf, moodText, versions } from './moods.mjs';
import { engineOf, ORDER, SOURCES, SPLIT } from './sources.mjs';
import { split } from './split.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src');
export const KINDS = ['characters', 'props', 'heroes', 'scenery', 'textures', 'music'];
export const ORIGINS = join(HERE, 'origins.json');

const md5 = (text) => createHash('md5').update(text).digest('hex');
const IMPORT = /(\b(?:from|import)\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;
const rel = (from, to) => {
  const r = posix.relative(posix.dirname(from), to);
  return r.startsWith('.') ? r : `./${r}`;
};
/** `textures/venue.js` as version `metroll`: `textures/venue.metroll.js`. */
const versioned = (path, tag) => path.replace(/\.js$/, `.${tag}.js`);

/**
 * One function of a module on its own, as `rename`: its statement, every
 * top-level statement it uses (and what they use), in the module's order, and
 * the imports of those. Nothing else is changed.
 */
export function lift(source, fn, rename = fn) {
  const { imports, statements } = split(source);
  const declaring = new Map();
  for (const s of statements) for (const n of s.names) declaring.set(n, s);
  const root = declaring.get(fn);
  if (!root) throw new Error(`no function ${fn}`);
  const taken = new Set([root]);
  const used = new Set();
  const queue = [root];
  while (queue.length) {
    for (const n of queue.pop().mentions) {
      const s = declaring.get(n);
      if (s && !taken.has(s)) { taken.add(s); queue.push(s); }
      if (!s) used.add(n);
    }
  }
  const head = imports.map((i) => {
    const kept = i.specifiers.filter((x) => used.has(x.local));
    if (!kept.length) return null;
    if (kept.length === i.specifiers.length) return i.text;
    const ns = kept.find((x) => x.imported === '*');
    if (ns) return `import * as ${ns.local} from '${i.source}';`;
    const def = kept.find((x) => x.imported === 'default');
    const named = kept.filter((x) => x.imported !== 'default').map((x) => (x.local === x.imported ? x.local : `${x.imported} as ${x.local}`));
    return `import ${[def?.local, named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean).join(', ')} from '${i.source}';`;
  }).filter(Boolean);
  const body = statements.filter((s) => taken.has(s)).map((s) => {
    if (s !== root) return s.text;
    const at = s.node.range[0] - s.start;
    const text = `${s.text.slice(0, at)}${s.exported ? '' : 'export '}${s.text.slice(at)}`;
    return text.replace(new RegExp(`\\bfunction ${fn}\\(`), `function ${rename}(`);
  });
  return `${head.join('\n')}${head.length ? '\n\n' : ''}${body.join('\n\n')}\n`;
}

/** Every file the library takes from the game in `dir`. */
function gather(game, dir) {
  const files = [];
  for (const g of SOURCES[game]) {
    if (g.fn) {
      files.push({
        game,
        gamePath: `${g.from}#${g.fn}`,
        place: posix.join(g.kind, g.to ?? '', g.as),
        text: lift(readFileSync(join(dir, g.from), 'utf8'), g.fn, g.name),
      });
      continue;
    }
    const root = join(dir, g.from);
    const names = g.only ?? readdirSync(root).filter((n) => n.endsWith('.js') && statSync(join(root, n)).isFile() && !g.skip?.includes(n));
    for (const name of names) {
      const place = posix.join(g.kind, g.to ?? '', g.as ?? name);
      files.push({
        game,
        gamePath: posix.join(g.from, name),
        place,
        text: edited(place, readFileSync(join(root, name), 'utf8')),
      });
    }
  }
  return files;
}

/**
 * @param dirs  { game: the game's folder }
 * @returns { files, places: Map(place -> versions), origins }
 */
export function plan(dirs) {
  const files = Object.entries(dirs).flatMap(([game, dir]) => gather(game, dir));
  const byGamePath = new Map(files.map((f) => [`${f.game}:${f.gamePath}`, f]));

  // What each import is: another file the library takes from the same game, or an engine file.
  for (const f of files) {
    f.imports = [...f.text.matchAll(IMPORT)].map((m) => {
      const target = posix.normalize(posix.join(posix.dirname(f.gamePath.replace(/#.*$/, '')), m[3]));
      const dep = byGamePath.get(`${f.game}:${target}`);
      if (dep) return { dep };
      const engine = engineOf(target);
      if (!engine) throw new Error(`${f.game}: ${f.gamePath} imports ${m[3]} (${target}), which is neither in the library nor in the engine`);
      return { engine };
    });
  }

  // A file is what it says and everything it imports: how a game spells the path to an import is neither.
  const closure = (f, seen = []) => {
    if (f.closure) return f.closure;
    if (seen.includes(f)) throw new Error(`import cycle at ${f.game}: ${f.gamePath}`);
    f.closure = md5(`${f.place}|${f.text.replace(IMPORT, '$1$2$2')}|${f.imports.map((i) => (i.dep ? closure(i.dep, [...seen, f]) : i.engine)).join(',')}`);
    return f.closure;
  };
  files.forEach((f) => closure(f));

  // The versions at each place, and which is the default.
  const newest = (games) => Math.max(...games.map((g) => ORDER.indexOf(g)));
  const oldest = (games) => ORDER[Math.min(...games.map((g) => ORDER.indexOf(g)))];
  const places = new Map();
  for (const f of files) {
    if (!places.has(f.place)) places.set(f.place, new Map());
    const versions = places.get(f.place);
    if (!versions.has(f.closure)) versions.set(f.closure, { files: [], games: [] });
    const v = versions.get(f.closure);
    v.files.push(f);
    v.games.push(f.game);
  }
  for (const [place, versions] of places) {
    const ranked = [...versions.values()].sort((a, b) => b.games.length - a.games.length || newest(b.games) - newest(a.games));
    ranked.forEach((v, i) => {
      v.path = i === 0 ? place : versioned(place, oldest(v.games));
      for (const f of v.files) f.path = v.path;
    });
    if (new Set(ranked.map((v) => v.path)).size !== ranked.length) throw new Error(`${place}: two versions would have the same name`);
  }

  const origins = {};
  for (const f of files) (origins[f.game] ??= {})[f.gamePath] = f.path;
  return { files, places, origins };
}

/** A file's text in the library: its imports pointing at where those files are in it, or at the engine. */
function libraryText(f) {
  let i = 0;
  return f.text.replace(IMPORT, (all, head, q) => {
    const imp = f.imports[i++];
    return `${head}${q}${rel(f.path, imp.dep ? imp.dep.path : imp.engine)}${q}`;
  });
}

/**
 * Every default at `<kind>/<name>.js` that is a sculpted model, by name, as one
 * object: its default export, or the models of a set (`export const CAT_DEFS`,
 * a model for each coat) spread in.
 */
function catalog(kind, name, places, about) {
  const entries = [], sets = [];
  for (const [place, versions] of places) {
    if (!place.startsWith(`${kind}/`) || place.slice(kind.length + 1).includes('/')) continue;
    const def = [...versions.values()].find((v) => v.path === place);
    const text = def.files[0].text;
    if (/^export default\b/m.test(text)) entries.push(posix.basename(place, '.js'));
    for (const [, set] of text.matchAll(/^export const ([A-Z_]+_DEFS)\b/gm)) sets.push([set, posix.basename(place, '.js')]);
  }
  entries.sort();
  sets.sort();
  const local = (n) => (/^[a-z_$][\w$]*$/i.test(n) && !['case', 'default', 'new', 'class'].includes(n) ? n : `${n.replace(/\W/g, '_')}Model`);
  const imports = [
    ...entries.map((n) => `import ${local(n)} from './${n}.js';`),
    ...sets.map(([set, file]) => `import { ${set} } from './${file}.js';`),
  ].join('\n');
  const keys = [
    ...entries.map((n) => (local(n) === n ? n : `${/^[a-z_$][\w$]*$/i.test(n) ? n : JSON.stringify(n)}: ${local(n)}`)),
    ...sets.map(([set]) => `...${set}`),
  ];
  const lines = [];
  let line = ' ';
  for (const k of keys) {
    if (line.length + k.length > 100) { lines.push(line); line = ' '; }
    line += ` ${k},`;
  }
  lines.push(line);
  return `${imports}\n\n/**\n${about.map((l) => ` * ${l}`).join('\n')}\n */\nexport const ${name} = {\n${lines.join('\n')}\n};\n`;
}

const ABOUT = {
  characters: 'The people, creatures and monsters. Most are sculpted definitions (the default export) for `createModel`; `humanoid`, `quadruped`, `person` and `wardrobe` are the bodies and clothes they are built from; `slime`, `egg` and `boulder` are built from their own geometry.',
  props: 'What lies about to be picked up: sculpted, still, for `createStatic`.',
  heroes: 'The balls the games are played as, each with what it is made of.',
  scenery: 'The world round the ball: the town\'s street furniture and vehicles (`bakeData` in models/legacy-bake), and the dungeon\'s walls, torches and exit.',
  textures: 'Painted on canvases at startup. `painters` is the toolkit and the floors and walls; `venue` the rock clubs\' floors, walls, belts, grilles, tape, shutters, panels and glows; `town/` the town\'s; `lava` a material; `rooms/` what shiny things reflect (each `paintRoom`) and `skies/` what is round the scene (each `paintSky`).',
  moods: 'The look of every set: its light, its sky and what its chrome reflects (each with its painter), the film it is shot on (the grade on the picture, the grain and the vignette over it, and the interface on the same stock where the game does that), its weather, and its band, theme and tempo; and the set\'s own `look` and `palette`. `stage.setMood(mood)` dresses a stage in one; `MOODS` (`moods/index`) has them all.',
  music: 'Made on the spot with Web Audio. `band` is a whole band with its songs (`THEMES`), `theory` its scales, forms and effects; `score` a smaller orchestra with its own themes.',
};

/**
 * What a thing is, in a sentence: the first of the comment at the head of the
 * game's file, or, for a painter lifted out of one, of the painter's own.
 */
function blurb(f) {
  const comments = [...f.text.matchAll(/\/\*\*([\s\S]*?)\*\/\s*(export )?(function (\w+))?/g)];
  const m = (f.gamePath.includes('#') ? comments.find((c) => c[4] === f.gamePath.split('#')[1]) : null) ?? comments[0];
  if (!m) return '';
  const words = m[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
  const first = /^(.*?[.!?])(\s|$)/.exec(words)?.[1] ?? words;
  return first.length > 200 ? `${first.slice(0, 197)}…` : first;
}

/** `docs/library.md`: everything in the library, by kind, with its versions and the games they came from. */
function contents(places, moods) {
  const lines = [
    '# What is in the library',
    '',
    '<!-- Written by `npm run extract`: do not edit. -->',
    '',
    'Everything the games have made, by what it is. Import any of it as',
    '`madness-engine/<path>` (without the `.js`). Where games made different',
    'versions of one thing, the default is the one most games have, and each',
    'other is beside it, named after the oldest game that has it.',
    '',
  ];
  const title = (g) => g;
  for (const kind of KINDS) {
    lines.push(`## ${kind}`, '', ABOUT[kind], '', '| Path | Versions (games) | What it is |', '|---|---|---|');
    for (const [place, versions] of [...places].filter(([p]) => p.startsWith(`${kind}/`)).sort(([a], [b]) => a.localeCompare(b))) {
      const ranked = [...versions.values()].sort((a, b) => (a.path === place ? -1 : b.path === place ? 1 : a.path.localeCompare(b.path)));
      const which = ranked.map((v) => `\`${posix.basename(v.path, '.js')}\` (${v.games.map(title).join(', ')})`).join('<br>');
      lines.push(`| \`${place.replace(/\.js$/, '')}\` | ${which} | ${blurb([...versions.values()].find((v) => v.path === place).files[0]).replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }
  lines.push('## moods', '', ABOUT.moods, '', '| Path | Versions (games) | What it is |', '|---|---|---|');
  const graded = [...new Set(moods.grades.map((g) => g.game))].join(', ');
  const grades = [...new Set(moods.grades.map((g) => `\`${g.key}\``))].join(', ');
  lines.push(`| \`moods/grades\` | \`grades\` (${graded}) | Every grade by name (\`GRADES\`), on the film its game gives it: ${grades}. |`);
  const byName = new Map();
  for (const m of moods.moods) byName.set(m.name, [...(byName.get(m.name) ?? []), m]);
  for (const [name, ms] of [...byName].sort(([a], [b]) => a.localeCompare(b))) {
    const which = ms.map((m) => `\`${m.key}\` (${m.games.join(', ')})`).join('<br>');
    lines.push(`| \`moods/${name}\` | ${which} | ${moodLine(ms.find((m) => m.key === name)).replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

/**
 * Every set's mood and every grade, from the games that have them, each at
 * its place in `moods/` (`moods.mjs`).
 */
export async function planMoods(dirs, origins) {
  const found = [];
  for (const [game, dir] of Object.entries(dirs)) found.push(...await moodsOf(game, dir, origins));
  const moods = versions(found.map((m) => ({ ...m, text: moodText(m, `moods/${m.name}.js`) })))
    .map((m) => ({ ...m, path: `moods/${m.key}.js` }));
  for (const m of moods) m.text = moodText(m, m.path);
  const grades = versions(Object.entries(dirs).flatMap(([game, dir]) => Object.entries(gradesOf(game, dir))
    .map(([name, film]) => ({ game, name, film, text: JSON.stringify(film) }))));
  return { moods, grades, files: { ...Object.fromEntries(moods.map((m) => [m.path, m.text])), 'moods/index.js': indexText(moods), 'moods/grades.js': gradesText(grades) } };
}

/** Writes the library into `src/`. */
export async function build(dirs) {
  const { files, places, origins } = plan(dirs);
  for (const kind of [...KINDS, 'moods']) rmSync(join(SRC, kind), { recursive: true, force: true });
  const moods = await planMoods(dirs, origins);

  const out = new Map();
  for (const versions of places.values()) for (const v of versions.values()) out.set(v.path, libraryText(v.files[0]));

  // The long modules: what their versions share, once.
  for (const [place, corePath] of Object.entries(SPLIT)) {
    const versions = [...places.get(place).values()];
    if (versions.length < 2) continue;
    const { core, variants, report } = dedupe(Object.fromEntries(versions.map((v) => [v.path, out.get(v.path)])));
    out.set(corePath, core);
    const spec = rel(place, corePath);
    for (const [path, text] of Object.entries(variants)) out.set(path, text.replaceAll("from './core.js'", `from '${spec}'`));
    console.log(`${place}: ${report.shared} statements shared in ${corePath}`);
  }

  out.set('characters/index.js', catalog('characters', 'CHARACTERS', places, [
    'Every sculpted character in the library, by name: the default version of',
    'each. Hand one to `createModel` (models/model.js) or a bake library.',
  ]));
  out.set('props/index.js', catalog('props', 'PROPS', places, [
    'Every sculpted prop in the library, by name: the default version of each.',
  ]));

  for (const [path, text] of Object.entries(moods.files)) out.set(path, text);

  for (const [path, text] of out) {
    mkdirSync(dirname(join(SRC, path)), { recursive: true });
    writeFileSync(join(SRC, path), text);
  }
  writeFileSync(ORIGINS, `${JSON.stringify(origins, null, 2)}\n`);
  writeFileSync(join(SRC, '..', 'docs', 'library.md'), contents(places, moods));

  for (const kind of KINDS) {
    const mine = [...places.entries()].filter(([p]) => p.startsWith(`${kind}/`));
    const versions = mine.reduce((n, [, v]) => n + v.size, 0);
    console.log(`${kind}: ${mine.length} things, ${versions - mine.length} more versions`);
  }
  console.log(`moods: ${new Set(moods.moods.map((m) => m.name)).size} sets, ${new Set(moods.grades.map((g) => g.key)).size} grades`);
  console.log(`${files.length} files from ${Object.keys(dirs).length} games`);
  return { places, origins };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const gamesDir = resolve(args[args.indexOf('--games') + 1] ?? '..');
  const dirs = {};
  for (const game of ORDER) {
    const dir = join(gamesDir, game);
    if (!existsSync(dir)) throw new Error(`${game} is not in ${gamesDir}: the library is built from all the games at once`);
    dirs[game] = dir;
  }
  await build(dirs);
}
