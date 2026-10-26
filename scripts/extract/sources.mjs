/**
 * What the library takes from each game, and where it goes in it.
 *
 * The library is laid out by what things are, not by which game made them:
 * `characters/`, `props/`, `heroes/`, `scenery/`, `textures/`, `music/`. A
 * game's file lands at `<kind>/<to>/<its name>`; where two games have different
 * versions of the same file, both are kept (see `library.mjs` for which one is
 * the default and what the others are called).
 *
 * A group is `{ from, kind, to?, only?, skip?, as? }`: the files of the game's
 * folder `from` (all its `.js` files, or `only` these, less `skip`) go into
 * `kind`, under `to`. `as` renames a single file.
 */

/** The games, oldest first. Where versions tie, the newest game's is the default. */
export const ORDER = ['madness', 'dungeon-roller', 'catroller', 'rocknroller', 'rocknroller-ii', 'rocknroller-iii', 'metroll', 'metrlol', 'petroll'];

/**
 * The games that run on the engine: they import the library rather than
 * keep their own copies, so what the library has of them is the source, and
 * extracting takes it from the library as it is (where `origins.json` says
 * their files went) rather than from the game: their moods too, and the
 * cores of the long modules they share (SPLIT).
 */
export const ON_ENGINE = new Set(['madness', 'catroller', 'rocknroller', 'rocknroller-ii', 'rocknroller-iii', 'metroll']);

/** The town games keep their own people-kit (the engine's models now) and its glue beside their people. */
const TOWN_KIT = ['model.js', 'rig.js', 'library.js', 'bake.worker.js', 'viewer.js', 'sdf.js', 'skins.js'];
/** A game's list of who is in it (`CAST`, `PROPS`, `MODELS`), and its glue to the workers that bake them, are the game's. */
const ROSTER = ['index.js', 'library.js', 'bake.worker.js', 'viewer.js'];

const sculpted = [
  { from: 'src/models/cast', kind: 'characters', skip: ROSTER },
  { from: 'src/models/props', kind: 'props', skip: ROSTER },
];
const town = [
  { from: 'src/cast', kind: 'characters', skip: [...TOWN_KIT, ...ROSTER] },
  { from: 'src/stage.js', fn: 'paintRoom', kind: 'textures', to: 'rooms', as: 'town.js', name: 'paintRoom' },
  { from: 'src/stage.js', fn: 'paintSky', kind: 'textures', to: 'skies', as: 'town.js', name: 'paintSky' },
  { from: 'src/models', kind: 'scenery', skip: ROSTER },
  { from: 'src', kind: 'textures', to: 'town', only: ['paint.js', 'surfaces.js', 'textures.js'] },
];
/**
 * A painter lifted out of a game's module (`lift` in `library.mjs`): the
 * function and what it uses, as `name`. Every room exports `paintRoom` and every
 * sky `paintSky`, so one can stand in for another.
 */
const room = (from, fn, as) => ({ from, fn, kind: 'textures', to: 'rooms', as, name: 'paintRoom' });
const sky = (from, fn, as) => ({ from, fn, kind: 'textures', to: 'skies', as, name: 'paintSky' });

const rocker = [
  ...sculpted,
  room('src/stage.js', 'paintRoom', 'venue.js'),
  sky('src/stage.js', 'paintBackdrop', 'skyline.js'),
  { from: 'src', kind: 'heroes', only: ['rock.js', 'boulder.js'] },
  { from: 'src', kind: 'scenery', only: ['lightshow.js'] },
  { from: 'src', kind: 'textures', only: ['textures.js'], as: 'venue.js' },
  { from: 'src', kind: 'music', only: ['music.js'], as: 'band.js' },
];

export const SOURCES = {
  madness: [
    { from: 'src', kind: 'heroes', only: ['marble.js'] },
    room('src/stage.js', 'paintStudio', 'studio.js'),
    sky('src/stage.js', 'paintBackdrop', 'haze.js'),
  ],
  'dungeon-roller': [
    ...sculpted,
    { from: 'src', kind: 'heroes', only: ['die.js'] },
    { from: 'src/nat', kind: 'heroes', to: 'nat' },
    // Slimey's orb, Rock's boulder and the egg, made monsters: built from their own geometry rather than sculpted.
    { from: 'src/models', kind: 'characters', only: ['slime.js', 'egg.js', 'boulder.js'] },
    { from: 'src', kind: 'music', only: ['score.js'] },
    { from: 'src', kind: 'textures', only: ['lava.js'] },
    { from: 'src', kind: 'scenery', only: ['scenery.js'], as: 'dungeon.js' },
    room('src/stage.js', 'paintVault', 'vault.js'),
    sky('src/stage.js', 'paintBackdrop', 'embers.js'),
  ],
  catroller: [
    ...sculpted,
    { from: 'src/yarn', kind: 'heroes', to: 'yarn', skip: ['viewer.js'] },
    { from: 'src', kind: 'music', only: ['score.js'] },
    room('src/stage.js', 'paintRoom', 'house.js'),
    sky('src/stage.js', 'paintBackdrop', 'night.js'),
  ],
  rocknroller: rocker,
  'rocknroller-ii': rocker,
  'rocknroller-iii': rocker,
  metroll: [
    ...sculpted,
    { from: 'src', kind: 'heroes', only: ['mace.js', 'morningstar.js', 'boulder.js'] },
    { from: 'src', kind: 'scenery', only: ['lightshow.js'] },
    { from: 'src', kind: 'textures', only: ['textures.js'], as: 'venue.js' },
    { from: 'src', kind: 'music', only: ['music.js'], as: 'band.js' },
    room('src/stage.js', 'paintRoom', 'venue.js'),
    sky('src/horizons.js', 'paintBackdrop', 'horizons.js'),
  ],
  metrlol: [
    ...town,
    { from: 'src', kind: 'heroes', only: ['ball.js', 'mace.js', 'morningstar.js'] },
    { from: 'src', kind: 'music', only: ['music.js'], as: 'band.js' },
  ],
  petroll: [
    ...town,
    { from: 'src', kind: 'heroes', only: ['hamster.js'] },
  ],
};

/**
 * The games whose sets each have a mood (`moods.mjs`): the module that lists
 * the sets (`VENUES`, each a function that builds one), the stage that
 * dresses itself for a set (`setVenue`), and the page and stylesheet that
 * shoot the picture on film.
 */
const STAGED = { venues: 'src/venues/index.js', stage: 'src/stage.js', page: 'index.html', styles: 'src/styles.css' };
export const MOODS = {
  rocknroller: STAGED,
  'rocknroller-ii': STAGED,
  'rocknroller-iii': STAGED,
  metroll: STAGED,
};

/**
 * The library files whose versions are long modules with much in common: what
 * the versions share is kept once, in `core`, and each version holds the rest
 * (see `dedupe.mjs`).
 */
export const SPLIT = {
  'textures/venue.js': 'textures/painters.js',
  'music/band.js': 'music/theory.js',
};

/**
 * What a game's file outside what the library takes is, in the engine (a path
 * under `src/`), or null if the engine has nothing for it.
 */
export function engineOf(gamePath) {
  let m;
  if ((m = /^src\/vendor\/gfx\/(\w+)\.js$/.exec(gamePath))) return `gfx/${m[1]}.js`;
  if ((m = /^src\/(?:models|sculpt|cast)\/(sdf|skins|rig|model)\.js$/.exec(gamePath))) return `models/${m[1]}.js`;
  if (gamePath === 'src/sculpt/bake.js') return 'models/legacy-bake.js';
  if (gamePath === 'src/physics.js') return 'physics.js';
  if (gamePath === 'src/kit.js') return 'kit.js';
  return null;
}
