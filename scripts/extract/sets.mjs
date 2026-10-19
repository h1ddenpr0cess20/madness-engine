/**
 * Which folders of which games are characters, for `characters.mjs` and for
 * `verify-drop-in` to check the engine's against.
 */

/** The files of the town games' own people-kit, which are the engine's models now. */
export const KIT = ['model.js', 'rig.js', 'library.js', 'bake.worker.js', 'viewer.js', 'sdf.js', 'skins.js'];
export const GAME_GLUE = ['library.js', 'bake.worker.js'];

const kitGame = (dir) => ({ dir, groups: [{ from: 'src/models/cast', to: 'cast' }, { from: 'src/models/props', to: 'props' }] });
const townGame = (dir) => ({ dir, groups: [{ from: 'src/cast', to: 'cast', skip: KIT }, { from: 'src/models', to: 'models', skip: GAME_GLUE }] });

/** The sets. The town games are as their open pull requests have them. */
export const SETS = {
  'dungeon-roller': kitGame('dungeon-roller'),
  catroller: kitGame('catroller'),
  metroll: kitGame('metroll'),
  rocknroller: kitGame('rocknroller'),
  'rocknroller-ii': kitGame('rocknroller-ii'),
  'rocknroller-iii': kitGame('rocknroller-iii'),
  metrlol: townGame('pr/metrlol'),
  petroll: townGame('pr/petroll'),
};


/**
 * The main characters: the ball each game is played as, and what it is made of.
 * (Catroller's `yarn/viewer.js` is a page for looking at the yarn, not the yarn.)
 */
const files = (dir, ...only) => ({ dir, groups: [{ from: 'src', to: '.', only }] });
export const HEROES = {
  madness: files('madness', 'marble.js'),
  'dungeon-roller': {
    dir: 'dungeon-roller',
    groups: [
      { from: 'src', to: '.', only: ['die.js'] },
      { from: 'src/nat', to: 'nat' },
      { from: 'src/models', to: 'models', only: ['boulder.js', 'egg.js', 'slime.js', 'looks.js'] },
    ],
  },
  catroller: { dir: 'catroller', groups: [{ from: 'src/yarn', to: 'yarn', skip: ['viewer.js'] }] },
  petroll: files('pr/petroll', 'hamster.js'),
  metrlol: files('pr/metrlol', 'ball.js', 'mace.js', 'morningstar.js'),
  metroll: files('metroll', 'mace.js', 'morningstar.js', 'boulder.js'),
  rocknroller: files('rocknroller', 'rock.js', 'boulder.js'),
  'rocknroller-ii': files('rocknroller-ii', 'rock.js', 'boulder.js'),
  'rocknroller-iii': files('rocknroller-iii', 'rock.js', 'boulder.js'),
};

/**
 * What each game's files are, in the engine, where another file of the game
 * has to be mapped to one: the camera view it uses, and which textures and
 * music it has.
 */
export const GAME_INFO = {
  madness: { view: 'arcade' },
  'dungeon-roller': { view: 'arcade', score: 'dungeon-roller', scenery: 'dungeon-roller', lava: 'dungeon-roller' },
  catroller: { view: 'catroller', score: 'catroller' },
  metroll: { view: 'arcade', textures: 'metroll', music: 'metroll', horizons: 'metroll' },
  rocknroller: { view: 'arcade', textures: 'rocknroller', music: 'rocknroller' },
  'rocknroller-ii': { view: 'arcade', textures: 'rocknroller-ii', music: 'rocknroller-ii' },
  'rocknroller-iii': { view: 'arcade', textures: 'rocknroller-iii', music: 'rocknroller-iii' },
  metrlol: { view: 'town', music: 'metroll' },
  petroll: { view: 'town' },
};

/** The camera views: where each game's camera starts (`defineView`'s `home`). */
export const VIEWS = {
  arcade: {},
  catroller: { zoom: 1.12 },
  town: { pitch: 0.92, zoom: 0.95 },
};

/**
 * The modules each game has its own version of: `{ module: { set: [game, file in the game] } }`.
 * Each becomes `src/<module>/<set>.js`, with what the versions have in common in
 * `src/<module>/core.js` (see `dedupe.mjs`). A game that is not here for a module
 * has a version that imports something of the game's own that the engine does
 * not have, so it is still the game's.
 */
const all = (file, except = []) => Object.fromEntries(Object.keys(GAME_INFO).filter((g) => !except.includes(g)).map((g) => [g, [g, `${g === 'metrlol' || g === 'petroll' ? 'pr/' : ''}${g}/src/${file}`]]));
export const VARIANTS = {
  textures: {
    metroll: ['metroll', 'metroll/src/textures.js'],
    rocknroller: ['rocknroller', 'rocknroller/src/textures.js'],
    'rocknroller-ii': ['rocknroller-ii', 'rocknroller-ii/src/textures.js'],
    'rocknroller-iii': ['rocknroller-iii', 'rocknroller-iii/src/textures.js'],
  },
  music: {
    metroll: ['metroll', 'metroll/src/music.js'],
    rocknroller: ['rocknroller', 'rocknroller/src/music.js'],
    'rocknroller-ii': ['rocknroller-ii', 'rocknroller-ii/src/music.js'],
    'rocknroller-iii': ['rocknroller-iii', 'rocknroller-iii/src/music.js'],
  },
  score: {
    'dungeon-roller': ['dungeon-roller', 'dungeon-roller/src/score.js'],
    catroller: ['catroller', 'catroller/src/score.js'],
  },
  horizons: { metroll: ['metroll', 'metroll/src/horizons.js'] },
  // What Dungeon Roller's stage takes from the dungeon: the torch flicker is in its scenery, which is built on its lava.
  scenery: { 'dungeon-roller': ['dungeon-roller', 'dungeon-roller/src/scenery.js'] },
  lava: { 'dungeon-roller': ['dungeon-roller', 'dungeon-roller/src/lava.js'] },
  audio: all('audio.js'),
  // Metrlol's effects take `model` from its model library, which is the game's own glue (its workers).
  effects: all('effects.js', ['metrlol']),
  stage: all('stage.js'),
  storage: all('storage.js'),
};

/**
 * The town games' textures: the painters (`paint.js`, the same in both), the
 * surfaces they paint (each game's own) and how they are put together.
 */
export const TOWN = {
  metrlol: { dir: 'pr/metrlol', groups: [{ from: 'src', to: '.', only: ['paint.js', 'surfaces.js', 'textures.js'] }] },
  petroll: { dir: 'pr/petroll', groups: [{ from: 'src', to: '.', only: ['paint.js', 'surfaces.js', 'textures.js'] }] },
};

/**
 * Where the versions of the modules in the game folder `dir` are, as the engine's
 * `<module>/<set>`: [{ module, set, file (in the game), exact (the version is the
 * game's own, not another game's that it is the same as) }].
 */
export function versionsOf(game, dir) {
  const out = [];
  for (const [module, sets] of Object.entries(VARIANTS)) {
    for (const [set, [g, path]] of Object.entries(sets)) {
      if (g === game && path.startsWith(`${dir}/`)) out.push({ module, set, file: path.slice(dir.length + 1), exact: true });
    }
  }
  // Metrlol's music is Metroll's, to the letter.
  if (game === 'metrlol' && dir === 'pr/metrlol') out.push({ module: 'music', set: 'metroll', file: 'src/music.js', exact: false });
  return out;
}
