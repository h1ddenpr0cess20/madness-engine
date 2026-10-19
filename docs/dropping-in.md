# Dropping the engine into a game

Each game has its own copies of the files below. Swap them for the engine's,
pass the options in the table, and nothing about how it looks or plays changes.
`npm run verify` does exactly this swap on a copy of every game and runs the
game's tests (`scripts/drop-in/overlay.mjs` is the recipe in code).

| Game | physics | input | view | models |
|---|---|---|---|---|
| madness | – | – | – | – |
| dungeon-roller | – | – | – | kit |
| catroller | – | – | `home: { zoom: 1.12 }` | kit |
| metroll | – | `boost: { pad: [0, 2, 7, 6] }` (`rev()`) | – | kit |
| rocknroller, -ii, -iii | – | `boost: { pad: [0, 2, 7, 6] }` (`rev()`) | – | kit |
| metrlol | `slideUnder: true` | `boost: { pad: [0, 2, 7], element: 'accel-touch' }` (`boost()`) | `home: { pitch: 0.92, zoom: 0.95 }` | sculpt + cast |
| petroll | `slideUnder: true` | – | `home: { pitch: 0.92, zoom: 0.95 }` | sculpt |
| petroll (jobs PR) | `slideUnder: true` | `presses`, `padPresses` (below) | as above | sculpt + cast |

## Swapping the files

- `src/vendor/gfx/` → `madness-engine/gfx`. Delete the folder; import
  `madness-engine/gfx` where `./vendor/gfx/index.js` was, and
  `madness-engine/gfx/stage` (and so on: `renderer`, `webgl`, `webgpu`) for the rest.
- `src/physics.js` → `export * from 'madness-engine/physics'`, and in the map
  or course builder `new World({ cols, rows, slideUnder: true })` for the town
  games.
- `src/input.js` → `madness-engine/input`, with the options above passed where
  the game calls `createInput(view, { anchor, ... })`.
- `src/view.js` → `export const { HOME, LIMITS, createView, groundAxes } = defineView({ home })`.
- `src/models/{sdf,rig,skins,model}.js` → `madness-engine/models/…`. The
  game's `library.js` becomes `createBakeLibrary({ sculpted, spawn, jobs, label })`
  and its `bake.worker.js` becomes `serveBakes(sculpted)`. The game keeps
  `new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' })`
  in its own `spawn`, so that Vite can find the worker.
- Metrlol and Petroll keep their people in `src/cast`: `rig.js` and `model.js`
  there are the engine's, and `cast/library.js` is `createCastLibrary`.

Petroll's jobs controls:

```js
export const presses = {
  Enter: 'start', NumpadEnter: 'start', Space: 'hop',
  ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyP: 'pause', Escape: ['pause', 'back'],
  KeyX: 'quit', KeyM: 'mute', KeyC: 'home',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
};
export const padPresses = (b, sx, sy) => ({
  start: b(0), back: b(1), dash: b(2) || b(7), quit: b(8), pause: b(9), home: b(11),
  up: b(12) || sy < -0.6, down: b(13) || sy > 0.6,
});
```

## Where the engine is more than the game

The engine's files are the newest of each game's, so a game picks up what the
others added and doesn't use: Metrlol's still boxes and cylinders, a physics
`drag` option, Catroller's texture wrap, lens shift and `onFrame`, Rock 'n'
Roller's sculpt warp, Catroller's clip blending. None of them does anything
until it is asked for.

## Everything else the engine takes from a game

Each is one file of the game, replaced by a line (or a few) that takes the
engine's version of it. `npm run verify -- --package` does exactly this to a
copy of each game, runs its tests and builds it.

| The game's file | Becomes | What the engine's is checked against |
|---|---|---|
| `src/models/cast/*`, `src/models/props/*`, `src/cast/*` and `src/models/*` (town) | `export * from 'madness-engine/characters/<game>/…'` for each file | the same code as the game's, file by file |
| `src/die.js`, `src/nat/*`, `src/marble.js`, `src/yarn/*`, `src/hamster.js`, `src/ball.js`, `src/mace.js`, `src/morningstar.js`, `src/rock.js`, `src/boulder.js`, `src/models/{boulder,egg,slime,looks}.js` | `export * from 'madness-engine/heroes/<game>/…'` | the same code as the game's |
| `src/textures.js` | `export * from 'madness-engine/textures/<game>'` | its statements, the core's it takes and its exports, one for one |
| `src/paint.js`, `src/surfaces.js`, `src/textures.js` (town) | `export * from 'madness-engine/town/<game>/…'` | the same code as the game's |
| `src/music.js`, `src/score.js` | `export * from 'madness-engine/music/<game>'`, `…/score/<game>` | statements and exports, and every Web Audio call of every theme on a fake clock with fixed dice |
| `src/audio.js` | `export * from 'madness-engine/audio/<game>'` | statements and exports, and every Web Audio call of every sound |
| `src/effects.js`, `src/stage.js`, `src/storage.js` | `…/effects/<game>`, `…/stage/<game>`, `…/storage/<game>` | statements and exports |
| `src/horizons.js` (Metroll), `src/scenery.js` and `src/lava.js` (Dungeon Roller) | `…/horizons/metroll`, `…/scenery/dungeon-roller`, `…/lava/dungeon-roller` | statements and exports |
| `src/view.js` | `export * from 'madness-engine/views/<arcade, catroller, town>'` | 3,000 camera operations |
| `src/kit.js` (Metrlol, Petroll) | `export * from 'madness-engine/kit'` | the same file, bar the import of `linearRGB` |

Metrlol keeps its own `src/effects.js`, because it takes `model` from the
game's model library. The other eight games' effects are the engine's.

Metrlol and Petroll are the open pull requests as they stand: their sets
are built from those, so they take the engine's once the pull requests are
merged. (Their `main` has fewer characters and an older storage.)

