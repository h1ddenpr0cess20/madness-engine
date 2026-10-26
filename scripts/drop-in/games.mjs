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

/** The module a game with its own buttons keeps them in. */
export const controlsSource = (c) => `export const presses = ${JSON.stringify(c.presses)};\nexport const padPresses = ${c.padPresses};\n`;

const ARCADE = { view: 'arcade', home: {} };

export const GAMES = {
  madness: { onEngine: true },
  'dungeon-roller': { onEngine: true },
  catroller: { onEngine: true },
  metroll: { gfx: 'src/vendor/gfx', physics: 'base', boost: REV, api: 'rev', ...ARCADE, models: 'kit' },
  rocknroller: { onEngine: true },
  'rocknroller-ii': { onEngine: true },
  'rocknroller-iii': { onEngine: true },
  metrlol: { onEngine: true },
  petroll: { onEngine: true },
};
