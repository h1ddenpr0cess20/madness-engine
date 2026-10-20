/**
 * How each game uses the engine: what its own copies of the engine files do
 * that the others' don't. This table is the migration spec — a game that
 * drops the engine in passes exactly these options and nothing else.
 *
 *   physics  'base' — a ball under a box is pushed down; 'slide' — it is
 *            shoved aside (`new World({ ..., slideUnder: true })`).
 *   boost    The held boost button, if the game has one: `createInput(view,
 *            { anchor, boost })`. `api` is what the game calls it.
 *   home     Where its camera starts, where that isn't the arcade's corner,
 *            and `view`, which of `views/` that is.
 *   models   Which model kit it carries: 'kit' (src/models), 'legacy'
 *            (src/sculpt, the older bake) or none.
 *   onEngine A game that runs on the engine already: it imports
 *            `madness-engine/...` and keeps no copies, so there is nothing
 *            to compare, and its tests are run against this engine.
 *
 * What of each game is in the library (characters, props, heroes, scenery,
 * textures, music) is `extract/sources.mjs`'s, and where each file went is
 * `extract/origins.json`.
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

const ARCADE = { view: 'arcade', home: {} };
const TOWN = { view: 'town', home: TOWN_HOME };

export const GAMES = {
  madness: { gfx: 'src/vendor/gfx', physics: 'base', boost: null, ...ARCADE, models: null },
  'dungeon-roller': { gfx: 'src/vendor/gfx', physics: 'base', boost: null, ...ARCADE, models: 'kit' },
  catroller: { onEngine: true },
  metroll: { gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', ...ARCADE, models: 'kit' },
  rocknroller: { gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', ...ARCADE, models: 'kit' },
  'rocknroller-ii': { gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', ...ARCADE, models: 'kit' },
  'rocknroller-iii': { gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', ...ARCADE, models: 'kit' },
  metrlol: { gfx: 'src/vendor/gfx', physics: 'slide', boost: BOOST, api: 'boost', ...TOWN, models: 'legacy', worldFile: 'src/map.js', cast: METRLOL_CAST },
  petroll: { gfx: 'src/vendor/gfx', physics: 'slide', boost: null, ...TOWN, models: 'legacy', worldFile: 'src/map.js', controls: JOBS_CONTROLS, cast: PETROLL_CAST },
};
