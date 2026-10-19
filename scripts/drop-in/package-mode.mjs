import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { controlsSource, GAMES } from './games.mjs';
import { ORIGINS } from './library-diff.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const put = (dir, file, text) => writeFileSync(join(dir, file), text);

/**
 * Drops the engine into a copy of `name` as a package: the game's own copies
 * of the engine files are removed or turned into re-exports of
 * `madness-engine/...`, and every import of the renderer goes to the package.
 * (`npm install <the packed engine>` is the caller's, so the package is really
 * in node_modules and the bundler really has to read it from there.)
 */
export function dropInPackage(name, dir) {
  const g = GAMES[name];

  // The renderer: no folder, and every import of it goes to the package.
  rmSync(join(dir, g.gfx), { recursive: true, force: true });
  for (const file of [...walk(join(dir, 'src')), ...walk(join(dir, 'test'))].filter((f) => f.endsWith('.js'))) {
    const before = readFileSync(file, 'utf8');
    const after = before.replace(/(['"])(?:\.{1,2}\/)+(?:src\/)?(?:vendor\/)?gfx\/(\w+)\.js\1/g, (_, q, part) => `${q}madness-engine/gfx${part === 'index' ? '' : `/${part}`}${q}`);
    if (after !== before) writeFileSync(file, after);
  }

  put(dir, 'src/physics.js', "export * from 'madness-engine/physics';\n");
  if (g.physics === 'slide') {
    const text = readFileSync(join(dir, g.worldFile), 'utf8');
    writeFileSync(join(dir, g.worldFile), text.replace('new World({ cols: map.cols, rows: map.rows })', 'new World({ cols: map.cols, rows: map.rows, slideUnder: true })'));
  }

  put(dir, 'src/input.js', "export * from 'madness-engine/input';\n");
  const options = [];
  let main = readFileSync(join(dir, 'src/main.js'), 'utf8');
  if (g.boost) options.push(`boost: ${JSON.stringify(g.boost)}`);
  if (g.controls) {
    put(dir, 'src/controls.js', controlsSource(g.controls));
    main = `import { padPresses, presses } from './controls.js';\n${main}`;
    options.push('presses', 'padPresses');
  }
  if (options.length) main = main.replace('createInput(view, {', `createInput(view, { ${options.join(', ')},`);
  writeFileSync(join(dir, 'src/main.js'), main);

  put(dir, 'src/view.js', `export * from 'madness-engine/views/${g.view}';\n`);

  if (g.models === 'kit') {
    for (const f of ['sdf', 'rig', 'skins', 'model']) put(dir, `src/models/${f}.js`, `export * from 'madness-engine/models/${f}';\n`);
    const lib = readFileSync(join(dir, 'src/models/library.js'), 'utf8');
    const jobs = /export function preload\(jobs = (\[.*\])\) \{/.exec(lib)[1];
    put(dir, 'src/models/library.js', `import { createBakeLibrary } from 'madness-engine/models/bake';
import { CAST } from './cast/index.js';
import { PROPS } from './props/index.js';

/** Everything sculpted, by name: the creatures and the props. */
export const SCULPTED = { ...CAST, ...PROPS };

export const { isBaked, readyAll, ready, preload } = createBakeLibrary({
  sculpted: SCULPTED,
  spawn: () => new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' }),
  jobs: () => ${jobs},
  label: ${JSON.stringify(g.label ?? name)},
});
`);
    put(dir, 'src/models/bake.worker.js', `import { serveBakes } from 'madness-engine/models/bake';
import { CAST } from './cast/index.js';
import { PROPS } from './props/index.js';

serveBakes({ ...CAST, ...PROPS });
`);
  } else if (g.models === 'legacy') {
    put(dir, 'src/sculpt/sdf.js', "export * from 'madness-engine/models/sdf';\n");
    put(dir, 'src/sculpt/skins.js', "export * from 'madness-engine/models/skins';\n");
    put(dir, 'src/sculpt/bake.js', "export * from 'madness-engine/models/legacy-bake';\n");
    if (g.cast) {
      put(dir, 'src/cast/rig.js', "export * from 'madness-engine/models/rig';\n");
      put(dir, 'src/cast/model.js', "export * from 'madness-engine/models/model';\n");
      put(dir, 'src/cast/bake.worker.js', "import { serveBakes } from 'madness-engine/models/bake';\nimport { CAST } from './index.js';\n\nserveBakes(CAST);\n");
      put(dir, 'src/cast/library.js', `import { createCastLibrary } from 'madness-engine/models/bake';
import { CAST } from './index.js';

export const { isBaked, readyAll, ready, preload } = createCastLibrary({
  cast: CAST,
  spawn: () => new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' }),
  detail: ${g.cast.detail},${g.cast.names ? '\n  names: () => Object.keys(CAST),' : ''}
  failure: ${JSON.stringify(g.cast.failure)},
  terminateOnError: ${g.cast.terminateOnError},
});
`);
    }
  }
  libraryStubs(name, dir);
  if (g.view === 'town') put(dir, 'src/kit.js', "export * from 'madness-engine/kit';\n");
}

/**
 * Every file of the game the library has, whole, becomes a line or two that
 * takes the library's — so what the game imports from its own folders still
 * resolves, to the package. (A painter the library lifted out of a bigger
 * file stays where it is, in that file.)
 */
export function libraryStubs(name, dir) {
  for (const [gamePath, libPath] of Object.entries(ORIGINS[name])) {
    if (gamePath.includes('#')) continue;
    const text = readFileSync(join(SRC, libPath), 'utf8');
    const hasDefault = /^export default\b/m.test(text) || /^export \{[^}]*\bdefault\b/m.test(text);
    const spec = `madness-engine/${libPath.replace(/\.js$/, '')}`;
    put(dir, gamePath, `export * from '${spec}';\n${hasDefault ? `export { default } from '${spec}';\n` : ''}`);
  }
}
