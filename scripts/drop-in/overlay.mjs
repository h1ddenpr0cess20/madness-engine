import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { edited } from '../extract/edits.mjs';
import { controlsSource, GAMES } from './games.mjs';

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const ORIGINS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'extract', 'origins.json'), 'utf8'));

/** Copies a game, leaving out what isn't source. */
export function copyGame(from, to) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, filter: (p) => !/(^|\/)(\.git|node_modules|dist)(\/|$)/.test(p.slice(from.length)) });
}

const put = (dir, file, text) => {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), text);
};
const copyEngine = (dir, from, to) => cpSync(join(ENGINE, from), join(dir, to));

const patch = (dir, file, from, to) => {
  const text = readFileSync(join(dir, file), 'utf8');
  if (!text.includes(from)) throw new Error(`${file}: expected to find ${from}`);
  writeFileSync(join(dir, file), text.replace(from, to));
};

/** The people's kit, which the town games keep in src/cast beside the sculpt kit. */
function castKit(dir, g) {
  copyEngine(dir, 'models/rig.js', 'src/cast/rig.js');
  const model = readFileSync(join(ENGINE, 'models/model.js'), 'utf8').replace("from './sdf.js'", "from '../sculpt/sdf.js'");
  put(dir, 'src/cast/model.js', model);
  copyEngine(dir, 'models/bake.js', 'src/cast/engine-bake.js');
  put(dir, 'src/cast/bake.worker.js', `import { CAST } from './index.js';
import { serveBakes } from './engine-bake.js';

serveBakes(CAST);
`);
  put(dir, 'src/cast/library.js', `import { CAST } from './index.js';
import { createCastLibrary } from './engine-bake.js';

export const { isBaked, readyAll, ready, preload } = createCastLibrary({
  cast: CAST,
  spawn: () => new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' }),
  detail: ${g.cast.detail},${g.cast.names ? '\n  names: () => Object.keys(CAST),' : ''}
  failure: ${JSON.stringify(g.cast.failure)},
  terminateOnError: ${g.cast.terminateOnError},
});
`);
}

/**
 * Drops the engine into a copy of `name`: its renderer, physics, input, view
 * and model kit replaced by the engine's, with the options the game passes,
 * and the engine's changes made to its characters and props.
 */
export function dropIn(name, dir) {
  const g = GAMES[name];

  rmSync(join(dir, g.gfx), { recursive: true, force: true });
  cpSync(join(ENGINE, 'gfx'), join(dir, g.gfx), { recursive: true });

  copyEngine(dir, 'physics.js', 'src/physics.js');
  if (g.physics === 'slide') {
    patch(dir, g.worldFile, 'new World({ cols: map.cols, rows: map.rows })', 'new World({ cols: map.cols, rows: map.rows, slideUnder: true })');
  }

  copyEngine(dir, 'input.js', 'src/input.js');
  const options = [];
  if (g.boost) options.push(`boost: ${JSON.stringify(g.boost)}`);
  if (g.controls) {
    put(dir, 'src/controls.js', controlsSource(g.controls));
    patch(dir, 'src/main.js', 'createInput(view, {', "createInput(view, {");
    writeFileSync(join(dir, 'src/main.js'), `import { padPresses, presses } from './controls.js';\n${readFileSync(join(dir, 'src/main.js'), 'utf8')}`);
    options.push('presses', 'padPresses');
  }
  if (options.length) patch(dir, 'src/main.js', 'createInput(view, {', `createInput(view, { ${options.join(', ')},`);

  copyEngine(dir, 'view.js', 'src/engine-view.js');
  put(dir, 'src/view.js', `import { defineView } from './engine-view.js';\n\nexport const { HOME, LIMITS, createView, groundAxes } = defineView({ home: ${JSON.stringify(g.home)} });\n`);

  if (g.models === 'kit') {
    for (const f of ['sdf', 'rig', 'skins', 'model']) copyEngine(dir, `models/${f}.js`, `src/models/${f}.js`);
    copyEngine(dir, 'models/bake.js', 'src/models/engine-bake.js');
    const lib = readFileSync(join(dir, 'src/models/library.js'), 'utf8');
    const jobs = /export function preload\(jobs = (\[.*\])\) \{/.exec(lib)[1];
    put(dir, 'src/models/library.js', `import { CAST } from './cast/index.js';
import { createBakeLibrary } from './engine-bake.js';
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
    put(dir, 'src/models/bake.worker.js', `import { CAST } from './cast/index.js';
import { serveBakes } from './engine-bake.js';
import { PROPS } from './props/index.js';

serveBakes({ ...CAST, ...PROPS });
`);
  } else if (g.models === 'legacy') {
    copyEngine(dir, 'models/sdf.js', 'src/sculpt/sdf.js');
    copyEngine(dir, 'models/skins.js', 'src/sculpt/skins.js');
    copyEngine(dir, 'models/legacy-bake.js', 'src/sculpt/bake.js');
    if (g.cast) castKit(dir, g);
  }

  // The game's characters and props as the engine has changed them (extract/edits.mjs): its eyes, and the budgets its tests hold the finer meshes to.
  for (const [gamePath, libPath] of Object.entries(ORIGINS[name] ?? {})) {
    if (gamePath.includes('#')) continue;
    const text = readFileSync(join(dir, gamePath), 'utf8');
    const ours = edited(libPath, text);
    if (ours !== text) writeFileSync(join(dir, gamePath), ours);
  }
  return existsSync(dir);
}
