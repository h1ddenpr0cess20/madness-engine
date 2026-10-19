/**
 * The moods of the games' sets. Each is what the game makes of a set's look:
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, taken from the game as its own code has them:
 *
 *   - the set's `look`, `palette` and `tempo`, from building it with the
 *     game's own code (each of `VENUES` in `src/venues/index.js`);
 *   - the light, the sky and the reflections, as the game's stage makes them
 *     of the look (`setVenue`);
 *   - the film, from the page and its stylesheet: the grade the picture gets
 *     for the look's `grade` (`#view[data-grade="noir"] canvas { filter }`),
 *     the vignette and the grain over it, and what changes when the stage
 *     puts a class on the page for the set (`body.noir`, `body.sandstorm`).
 *
 * A mood is `moods/<the set>.js`; `moods/index.js` lists them all (`MOODS`)
 * and `moods/grades.js` every grade by name, on the film its game gives it
 * (`GRADES`). Where two games have a set or a grade of the same name and
 * they differ, both are kept as everything else is: the newest game's (or
 * the most games') at the name, the other at `<name>.<game>`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MOODS, ORDER, SOURCES } from './sources.mjs';

/** A stylesheet's rules outside @-blocks, in order: each its selectors and its declarations. */
export function rules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let at = 0;
  while (at < text.length) {
    const open = text.indexOf('{', at);
    if (open < 0) break;
    let depth = 1, end = open + 1;
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++;
      else if (text[end] === '}') depth--;
    }
    const head = text.slice(at, open).trim();
    if (!head.startsWith('@')) {
      out.push({ selectors: head.split(',').map((s) => s.trim().replace(/\s+/g, ' ')), decls: declarations(text.slice(open + 1, end - 1)) });
    }
    at = end;
  }
  return out;
}

/** `a: b; c: url("x;y")` as { a: 'b', c: 'url("x;y")' }: a `;` in quotes or brackets is the value's. */
function declarations(body) {
  const out = {};
  let quote = null, depth = 0, start = 0;
  const take = (end) => {
    const d = body.slice(start, end);
    const colon = d.indexOf(':');
    if (colon > 0) out[d.slice(0, colon).trim()] = d.slice(colon + 1).trim();
    start = end + 1;
  };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === '\'') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth === 0) take(i);
  }
  take(body.length);
  return out;
}

/**
 * How a game shoots its picture: the grade for each `look.grade`, and the
 * vignette, the grain and the interface's stock, plain and under each class
 * the stage puts on the page for a set (`toggles`: which look makes which).
 */
export function filmOf(game, dir) {
  const spec = MOODS[game];
  const page = readFileSync(join(dir, spec.page), 'utf8');
  const has = (id) => new RegExp(`\\bid="${id}"`).test(page);
  const film = { grades: {}, vignette: { base: null, classes: {} }, grain: { base: null, classes: {} }, ui: {} };
  for (const r of rules(readFileSync(join(dir, spec.styles), 'utf8'))) {
    for (const s of r.selectors) {
      let m;
      if ((m = /^#view\[data-grade="([\w-]+)"\] canvas$/.exec(s)) && r.decls.filter) film.grades[m[1]] = r.decls.filter;
      else if (s === '#vignette' && r.decls.background && has('vignette')) film.vignette.base = r.decls.background;
      else if (s === '#grain' && r.decls.opacity && has('grain')) film.grain.base = Number(r.decls.opacity);
      else if ((m = /^body\.([\w-]+) #vignette$/.exec(s)) && r.decls.background && has('vignette')) film.vignette.classes[m[1]] = r.decls.background;
      else if ((m = /^body\.([\w-]+) #grain$/.exec(s)) && r.decls.opacity && has('grain')) film.grain.classes[m[1]] = Number(r.decls.opacity);
      else if ((m = /^body\.([\w-]+) \S+$/.exec(s)) && r.decls.filter) film.ui[m[1]] = r.decls.filter;
    }
  }
  const stage = readFileSync(join(dir, spec.stage), 'utf8');
  film.toggles = [...stage.matchAll(/document\.body\.classList\.toggle\('([\w-]+)', look\.(\w+) === '([^']*)'\)/g)].map(([, cls, key, value]) => ({ cls, key, value }));
  return film;
}

/** The film a set's look is shot on, or null for none: what the page does to the picture and round it. */
export function filmFor(film, look) {
  const on = new Set(film.toggles.filter((t) => look[t.key] === t.value).map((t) => t.cls));
  // A class's rule outweighs the plain one, and of two classes' rules the later in the stylesheet wins.
  const pick = (classes, base) => Object.entries(classes).filter(([c]) => on.has(c)).at(-1)?.[1] ?? base;
  const out = {
    grade: look.grade && film.grades[look.grade] ? look.grade : null,
    filter: (look.grade && film.grades[look.grade]) || null,
    grain: pick(film.grain.classes, film.grain.base),
    vignette: pick(film.vignette.classes, film.vignette.base),
    ui: pick(film.ui, null),
  };
  return out.filter || out.grain || out.vignette || out.ui ? out : null;
}

/**
 * What the game's stage does with a set's look (`setVenue`), which a mood
 * does the same way: if a game dresses its stage differently, this says so
 * rather than make a mood the game wouldn't.
 */
const DRESSING = [
  "const [skyHex, groundHex, hemiK] = look.hemi ?? ['#8a96c0', '#1a1210', 0.55];",
  "key.color.set(look.key ?? '#c8d2ff');",
  'key.intensity = look.keyK ?? 0.9;',
  "lantern.color.set(look.lantern ?? '#ffe2b8');",
  "paintRoom({ colors: look.reflect ?? [palette.lamp ?? '#ffa04a'], ceiling: look.ceiling })",
];

/** The lantern the game's stage hangs over the ball, which the look colours: how bright, how far it reaches, how it falls off, how high. */
function lanternOf(game, stage) {
  const light = /const lantern = new GFX\.PointLight\(0x[0-9a-f]{6}, ([\d.]+), ([\d.]+), ([\d.]+)\);/.exec(stage);
  const over = /lantern\.position\.set\(stage\.(\w+)\.x, stage\.\1\.y \+ ([\d.]+), stage\.\1\.z\);/.exec(stage);
  if (!light || !over) throw new Error(`${game}: its stage hangs no lantern over the ball as moods.mjs knows it`);
  return { intensity: Number(light[1]), distance: Number(light[2]), decay: Number(light[3]), height: Number(over[2]) };
}

/** Which of the look the stage paints its sky with: { painter's option: the look's key }. */
function skyOptions(game, stage) {
  for (const d of DRESSING) if (!stage.includes(d)) throw new Error(`${game}: its stage no longer does \`${d}\` with a set's look; moods.mjs must learn what it does now`);
  const call = /paintBackdrop\(\{([^}]*)\}\)/.exec(stage.slice(stage.indexOf('setVenue(')));
  if (!call) throw new Error(`${game}: its stage paints no sky for a set`);
  return Object.fromEntries([...call[1].matchAll(/(\w+): look\.(\w+)/g)].map(([, option, key]) => [option, key]));
}

/** The comment at the head of a module, as its lines. */
const header = (text) => {
  const m = /\/\*\*([\s\S]*?)\*\//.exec(text);
  return m ? m[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trimEnd()).filter((l, i, all) => l || (i > 0 && i < all.length - 1)) : [];
};

/**
 * Every set's mood in the game in `dir`, in the order the game plays them.
 * `origins` (as `extract/origins.json` has them) say where the game's sky,
 * room and band are in the library.
 */
export async function moodsOf(game, dir, origins) {
  const spec = MOODS[game];
  if (!spec) return [];
  const film = filmOf(game, dir);
  const stage = readFileSync(join(dir, spec.stage), 'utf8');
  const sky = skyOptions(game, stage);
  const lantern = lanternOf(game, stage);
  const at = (name) => {
    const g = SOURCES[game].find((s) => s.name === name);
    const path = g && origins[game][`${g.from}#${g.fn}`];
    if (!path) throw new Error(`${game}: the library has no ${name} of the game's`);
    return path;
  };
  const band = Object.values(origins[game]).find((p) => p.startsWith('music/band'));
  const folder = posix.dirname(spec.venues);
  const files = readdirSync(join(dir, folder)).filter((n) => n.endsWith('.js'));
  const { VENUES } = await import(pathToFileURL(join(dir, spec.venues)).href);
  return VENUES.map((build) => {
    const set = build();
    const look = set.look ?? {};
    const palette = set.palette ?? {};
    const file = files.find((n) => new RegExp(`^export function ${build.name}\\(`, 'm').test(readFileSync(join(dir, folder, n), 'utf8')));
    if (!file) throw new Error(`${game}: no module in ${folder} makes the set ${build.name}`);
    const [skyHex, groundHex, hemiK] = look.hemi ?? ['#8a96c0', '#1a1210', 0.55];
    const skyArgs = {};
    for (const [option, key] of Object.entries(sky)) if (look[key] !== undefined) skyArgs[option] = look[key];
    const room = { colors: look.reflect ?? [palette.lamp ?? '#ffa04a'] };
    if (look.ceiling !== undefined) room.ceiling = look.ceiling;
    return {
      name: build.name,
      game,
      gamePath: posix.join(folder, file),
      about: header(readFileSync(join(dir, folder, file), 'utf8')),
      painters: { sky: at('paintSky'), room: at('paintRoom') },
      mood: {
        name: set.name,
        game,
        light: {
          hemisphere: { sky: skyHex, ground: groundHex, intensity: hemiK },
          key: { color: look.key ?? '#c8d2ff', intensity: look.keyK ?? 0.9 },
          lantern: { color: look.lantern ?? '#ffe2b8', ...lantern },
        },
        sky: skyArgs,
        room,
        film: filmFor(film, look),
        weather: look.weather ?? null,
        music: { band: band.replace(/\.js$/, ''), theme: look.theme ?? null, tempo: set.tempo ?? null },
        palette,
        look,
      },
    };
  });
}

/** Every grade the game in `dir` has, by name, on the film the game gives it. */
export function gradesOf(game, dir) {
  if (!MOODS[game]) return {};
  const film = filmOf(game, dir);
  return Object.fromEntries(Object.keys(film.grades).map((grade) => {
    // The film of a set that has the grade and nothing else: no weather, no class but the grade's own.
    const look = { grade };
    return [grade, filmFor(film, look)];
  }));
}

/** A value as JavaScript: keys bare where they can be, strings in single quotes, short things on one line. */
export function literal(value, indent = '') {
  if (value === null) return 'null';
  if (typeof value === 'string') return value.includes('\'') ? JSON.stringify(value) : `'${value.replace(/\\/g, '\\\\')}'`;
  if (typeof value !== 'object') return String(value);
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    const items = value.map((v) => literal(v, inner));
    const flat = `[${items.join(', ')}]`;
    return flat.length + indent.length < 100 && !flat.includes('\n') ? flat : `[\n${items.map((v) => `${inner}${v},`).join('\n')}\n${indent}]`;
  }
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : literal(k));
  const entries = Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => `${key(k)}: ${literal(v, inner)}`);
  if (!entries.length) return '{}';
  const flat = `{ ${entries.join(', ')} }`;
  return flat.length + indent.length < 100 && !flat.includes('\n') ? flat : `{\n${entries.map((e) => `${inner}${e},`).join('\n')}\n${indent}}`;
}

const rel = (from, to) => {
  const r = posix.relative(posix.dirname(from), to);
  return r.startsWith('.') ? r : `./${r}`;
};

/** Words in lines of at most `width`. */
const wrap = (text, width = 74) => {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines;
};

/** A mood's module, at `path` in the library. */
export function moodText(m, path) {
  const about = [
    ...(m.about.length ? [...m.about, ''] : []),
    ...wrap(`The mood of \`${m.name}\`, a set in ${m.game} (${m.gamePath}): its light, its sky and what its chrome reflects, the film it is shot on, its weather and its music, as the game has them. \`stage.setMood(mood)\` dresses a stage in it. \`look\` and \`palette\` are the set's own.`),
  ];
  return `import { paintRoom } from '${rel(path, m.painters.room)}';
import { paintSky } from '${rel(path, m.painters.sky)}';

/**
${about.map((l) => (l ? ` * ${l}` : ' *')).join('\n')}
 */
const mood = ${literal(m.mood)};

/** Its sky and what its chrome reflects, painted on canvases, as \`stage.setSky\` and \`stage.setRoom\` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
`;
}

/** The newest of a list of games. */
const newest = (games) => Math.max(...games.map((g) => ORDER.indexOf(g)));

/**
 * Things of the same name from several games, `{ game, name, text }`, as the
 * library keeps them: one name each, the versions that differ beside the one
 * at the name (the most games', or on a tie the newest game's) as `name.game`.
 */
export function versions(things) {
  const byName = new Map();
  for (const t of things.map((x, at) => ({ ...x, at }))) {
    if (!byName.has(t.name)) byName.set(t.name, new Map());
    const v = byName.get(t.name);
    if (!v.has(t.text)) v.set(t.text, []);
    v.get(t.text).push(t);
  }
  const out = [];
  for (const [name, v] of byName) {
    const ranked = [...v.values()].sort((a, b) => b.length - a.length || newest(b.map((t) => t.game)) - newest(a.map((t) => t.game)));
    ranked.forEach((same, i) => {
      const oldest = ORDER[Math.min(...same.map((t) => ORDER.indexOf(t.game)))];
      for (const t of same) out.push({ ...t, key: i === 0 ? name : `${name}.${oldest}`, games: same.map((s) => s.game) });
    });
  }
  // In the order they came in: by game, then as the game has them.
  return out.sort((a, b) => a.at - b.at);
}

/** `moods/index.js`: every mood by name, in the order the games play them. */
export function indexText(moods) {
  const seen = new Set();
  const list = moods.filter((m) => !seen.has(m.key) && seen.add(m.key));
  const local = (key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : key.replace(/\W+(\w)/g, (_, c) => c.toUpperCase()));
  const imports = list.map((m) => `import ${local(m.key)} from './${m.key}.js';`).join('\n');
  const lines = [];
  let game = null, line = '';
  for (const m of list) {
    if (m.game !== game) {
      if (line) lines.push(line);
      lines.push(`  // ${m.game}`);
      game = m.game;
      line = ' ';
    }
    const entry = local(m.key) === m.key ? m.key : `${literal(m.key)}: ${local(m.key)}`;
    if (line.length + entry.length > 100) { lines.push(line); line = ' '; }
    line += ` ${entry},`;
  }
  if (line) lines.push(line);
  return `${imports}

/**
 * Every set's mood, by name: its light, its sky and reflections, its film,
 * its weather and its music. Hand one to \`stage.setMood\`.
 */
export const MOODS = {
${lines.join('\n')}
};
`;
}

/** `moods/grades.js`: every grade by name, on the film its game gives it, by game. */
export function gradesText(grades) {
  const seen = new Set();
  const lines = [];
  let game = null;
  for (const g of grades.filter((x) => !seen.has(x.key) && seen.add(x.key))) {
    if (g.game !== game) lines.push(`  // ${(game = g.game)}`);
    lines.push(`  ${/^[A-Za-z_$][\w$]*$/.test(g.key) ? g.key : literal(g.key)}: ${literal(g.film, '  ')},`);
  }
  return `/**
 * Every grade the games shoot a picture on, by name, with the film its game
 * gives it: \`filter\`, the grade itself (a CSS filter for the canvas and
 * nothing else); \`grain\`, how much grain dances over the picture;
 * \`vignette\`, the shadow round its edges; \`ui\`, a filter for the interface
 * too, where the game shoots it on the same stock (the noir's). Hand one to
 * \`stage.film.set\` (film.js). A set's mood (\`moods/*\`) has its own film, its
 * weather's included (a sandstorm's haze).
 */
export const GRADES = {
${lines.join('\n')}
};
`;
}

const WEATHER = { rain: 'rain', snow: 'snow', sand: 'a sandstorm', petals: 'falling petals' };

/** What a mood is, in a line, for `docs/library.md`. */
export function moodLine(m) {
  const { name, look, film, weather, music } = m.mood;
  const what = look.genre ?? look.country ?? look.place;
  const kind = [name.toLowerCase().includes(what?.toLowerCase()) ? null : what, look.year].filter(Boolean).join(', ');
  const parts = [film?.grade ? `the ${film.grade} grade` : film ? 'no grade' : 'no film', weather ? WEATHER[weather] ?? weather : null].filter(Boolean);
  return `${name}${kind ? ` (${kind})` : ''}: ${parts.join(', ')}; \`${music.theme}\` at ${music.tempo} on \`${music.band}\``;
}

/** Whether the game in `dir` has moods to take. */
export const hasMoods = (game, dir) => Boolean(MOODS[game]) && existsSync(join(dir, MOODS[game].venues));
