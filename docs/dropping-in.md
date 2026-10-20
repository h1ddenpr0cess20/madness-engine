# Dropping the engine into a game

Each game has its own copies of the files below. Swap them for the engine's,
pass the options in the table, and nothing about how it plays changes. How it
looks changes only where the engine is more than the game (below): its cast
is finer.
`npm run verify` does exactly this swap on a copy of every game and runs the
game's tests (`scripts/drop-in/overlay.mjs` is the recipe in code).

| Game | physics | input | view | models |
|---|---|---|---|---|
| madness | – | – | `views/arcade` | – |
| dungeon-roller | – | – | `views/arcade` | kit |
| catroller | on the engine (below) | | | |
| metroll | – | `boost: { pad: [0, 2, 7, 6] }` (`rev()`) | `views/arcade` | kit |
| rocknroller, -ii, -iii | – | `boost: { pad: [0, 2, 7, 6] }` (`rev()`) | `views/arcade` | kit |
| metrlol | `slideUnder: true` | `boost: { pad: [0, 2, 7], element: 'accel-touch' }` (`boost()`) | `views/town` | sculpt + cast |
| petroll | `slideUnder: true` | `presses`, `padPresses` (below) | `views/town` | sculpt + cast |

## A game rewritten on the engine: Catroller

Catroller is the first game to go all the way. It depends on
`github:h1ddenpr0cess20/madness-engine#<commit>` and has no copies at all:
it imports `madness-engine/gfx`, `physics`, `input`, `views/close`,
`models/model` and `models/bake`; its cats, mouse, yarn ball and music from
the library (`characters/cat`, `characters/mouse`, `heroes/yarn/…`,
`music/score`); and its stage, sound, effects and storage are the engine's
with the game's own on top:

- `stage.js` is `createStage(host, { lens, view, sky, room, lights })` with
  `textures/rooms/house` and `textures/skies/night`, the house's light,
  and real lights at the lamps nearest the ball added to `stage.look`.
  `main.js` runs the game with `stage.run`.
- `audio.js` is `createAudio({ storageKey, volume, onWake })` with the roll
  as a `loop`, and the cats' voices, purrs and the rest made on its
  `tone` (now with a `vibrato`) and `burst`.
- `effects.js` is the engine's `burst` with the game's sparkles, wool,
  drops, dust and buttons; `storage.js` is a `saveSlot`.
- `models/library.js` is `createBakeLibrary`, `bake.worker.js`
  `serveBakes`, and `models/cast.js` the roster.

It is `onEngine` in `scripts/drop-in/games.mjs` and in `ON_ENGINE` in
`scripts/extract/sources.mjs`: the library's files of it are the source,
and the verify runs its tests on the engine rather than comparing copies.

## Swapping the files

- `src/vendor/gfx/` → `madness-engine/gfx`. Delete the folder; import
  `madness-engine/gfx` where `./vendor/gfx/index.js` was, and
  `madness-engine/gfx/stage` (and so on: `renderer`, `webgl`, `webgpu`) for the rest.
- `src/physics.js` → `export * from 'madness-engine/physics'`, and in the map
  or course builder `new World({ cols, rows, slideUnder: true })` for the town
  games.
- `src/input.js` → `madness-engine/input`, with the options above passed where
  the game calls `createInput(view, { anchor, ... })`.
- `src/view.js` → `export * from 'madness-engine/views/<arcade, close or town>'`.
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

It also has a fix the games' copies don't: under WebGL, a double-sided lit
material drawn after a back-sided one (the sky dome, which is drawn first)
took the dome's winding, so it was lit as if seen from behind.

And its cast is finer. The mesher spends up to 30% more vertices where the
grid was too coarse for the detail (sharp bends, lines of paint, small
parts), the people's and animals' eyes are set by where the face is, not
just under its skin, and the animals' faces, paws and wings have more to
them. The library's characters and props carry budgets
half as large again for the finer meshes. A game that takes the engine's
`models/` should take the library's characters and props with them, or
raise its own budgets the same way (`scripts/extract/edits.mjs` has the
changes). `npm run verify` tests each game with them made.

## The game's characters, props, heroes, textures and music

Each file of the game that the library has becomes a line or two that takes
the library's:

```js
// src/models/cast/bouncer.js in Rock 'n' Roller III
export * from 'madness-engine/characters/bouncer.rocknroller-iii';
export { default } from 'madness-engine/characters/bouncer.rocknroller-iii';
```

`scripts/extract/origins.json` says, for every game, which library file each of
its files is. `npm run verify -- --package` does exactly this to a copy of each
game, runs its tests and builds it. The rosters (`cast/index.js`,
`props/index.js`, `models/index.js`) stay the game's: they say who is in the
game, and they import the files above as before.

The skies and rooms in `textures/skies` and `textures/rooms` were lifted out of
the games' `stage.js`. A game keeps its own `stage.js`, audio, effects and
storage. Those are the game itself, and the engine's `stage`, `audio`,
`effects` and `storage` are for new games, or for a game that wants to be
rewritten on them.

The moods in `moods/` are the same: each is what a game's own `setVenue`
and stylesheet make of one of its sets (the light, the sky, the reflections,
the grade, the grain and the vignette), so the game keeps its `look`s, its
`stage.js` and its `styles.css`. `npm run verify` checks each mood against
what the game makes of its set now.
