/**
 * How each game uses the engine: what its own copies of the engine files do
 * that the others' don't. This table is the migration spec — a game that
 * drops the engine in passes exactly these options and nothing else.
 *
 *   physics  'base' — a ball under a box is pushed down; 'slide' — it is
 *            shoved aside (`new World({ ..., slideUnder: true })`).
 *   boost    The held boost button, if the game has one: `createInput(view,
 *            { anchor, boost })`. `api` is what the game calls it.
 *   home     Where its camera starts, where that isn't the arcade's corner.
 *   hero     Which set of main characters (`src/heroes/<set>`) it is.
 *   set      Which set of characters it is (`src/characters/<set>`), if the engine has its.
 *   models   Which model kit it carries: 'kit' (src/models), 'legacy'
 *            (src/sculpt, the older bake) or none.
 */
const REV = { pad: [0, 2, 7, 6] };
const BOOST = { pad: [0, 2, 7], element: 'accel-touch' };
const TOWN_HOME = { pitch: 0.92, zoom: 0.95 };

/**
 * Petroll's jobs: Space hops, Shift dashes, Escape backs out of a menu as well
 * as pausing, X gives up a job, and the arrows and the d-pad go through menus.
 */
const JOBS_CONTROLS = {
  presses: {
    Enter: 'start', NumpadEnter: 'start', Space: 'hop',
    ShiftLeft: 'dash', ShiftRight: 'dash',
    KeyP: 'pause', Escape: ['pause', 'back'],
    KeyX: 'quit', KeyM: 'mute', KeyC: 'home',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  },
  padPresses: '(b, sx, sy) => ({ start: b(0), back: b(1), dash: b(2) || b(7), quit: b(8), pause: b(9), home: b(11), up: b(12) || sy < -0.6, down: b(13) || sy > 0.6 })',
};

/** The module a game with its own buttons keeps them in. */
export const controlsSource = (c) => `export const presses = ${JSON.stringify(c.presses)};\nexport const padPresses = ${c.padPresses};\n`;

/** Metrlol's cast, baked in the background: the whole cast at one detail. */
const METRLOL_CAST = { detail: 0.5, names: true, failure: 'metrlol: a person would not bake', terminateOnError: false };
/** Petroll's: the names are always asked for, and a worker that errs is stopped. */
const PETROLL_CAST = { detail: 0.5, names: false, failure: 'petroll: somebody would not bake', terminateOnError: true };

export const GAMES = {
  madness: { hero: 'madness', gfx: 'src/vendor/gfx', physics: 'base', boost: null, home: {}, models: null },
  'dungeon-roller': { hero: 'dungeon-roller', set: 'dungeon-roller', gfx: 'src/vendor/gfx', physics: 'base', boost: null, home: {}, models: 'kit' },
  catroller: { hero: 'catroller', set: 'catroller', gfx: 'src/vendor/gfx', physics: 'base', boost: null, home: { zoom: 1.12 }, models: 'kit' },
  metroll: { hero: 'metroll', set: 'metroll', gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', home: {}, models: 'kit' },
  rocknroller: { hero: 'rocknroller', set: 'rocknroller', gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', home: {}, models: 'kit' },
  'rocknroller-ii': { hero: 'rocknroller-ii', set: 'rocknroller-ii', gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', home: {}, models: 'kit' },
  'rocknroller-iii': { hero: 'rocknroller-iii', set: 'rocknroller-iii', gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', home: {}, models: 'kit' },
  metrlol: { gfx: 'src/vendor/gfx', physics: 'slide', boost: BOOST, api: 'boost', home: TOWN_HOME, models: 'legacy', worldFile: 'src/map.js', cast: METRLOL_CAST },
  petroll: { gfx: 'src/vendor/gfx', physics: 'slide', boost: null, home: TOWN_HOME, models: 'legacy', worldFile: 'src/map.js' },

  // The open pull requests, as they stand: metrlol's bigger map and petroll's jobs.
  'metrlol-pr': { hero: 'metrlol', set: 'metrlol', dir: 'pr/metrlol', label: 'metrlol', gfx: 'src/vendor/gfx', physics: 'slide', boost: BOOST, api: 'boost', home: TOWN_HOME, models: 'legacy', worldFile: 'src/map.js', cast: METRLOL_CAST },
  'petroll-pr': { hero: 'petroll', set: 'petroll', dir: 'pr/petroll', label: 'petroll', gfx: 'src/vendor/gfx', physics: 'slide', boost: null, home: TOWN_HOME, models: 'legacy', worldFile: 'src/map.js', controls: JOBS_CONTROLS, cast: PETROLL_CAST },
};
