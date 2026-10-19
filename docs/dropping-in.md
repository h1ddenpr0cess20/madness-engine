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
  `madness-engine/gfx/stage.js` (and so on) for the rest.
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
