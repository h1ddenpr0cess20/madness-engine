# Madness Engine

An engine for rolling games, and a library of everything the rolling games
have made so far. The engine has a WebGPU / WebGL 2 renderer, ball physics
written by hand, the controls, the camera, the stage, sound, flying bits and
weather, and the toolkit models are sculpted with. The library holds every
character, prop, hero, texture, sky and song from
[Madness](https://github.com/h1ddenpr0cess20/madness), Dungeon Roller,
Catroller, Rock 'n' Roller I–III, Metroll, Metrlol and Petroll, filed by what
each thing is, so a new game can use any of it and nothing has to be made
twice.

It is plain JavaScript modules with no dependencies and no build step of its
own. A game's bundler (Vite) takes it from `node_modules`.

```sh
npm install github:h1ddenpr0cess20/madness-engine
```

```js
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { World, createBall, stepBall } from 'madness-engine/physics';
import { createMarble } from 'madness-engine/heroes/marble';
import punk from 'madness-engine/characters/punk';
import { paintRoom } from 'madness-engine/textures/rooms/venue';
```

`examples/starter` is a whole small game built from nothing but the engine:
a board with a ramp, the glass marble, a rat going round, gold to collect,
confetti, sound and the band. Start a new game by copying it:

```sh
cd examples/starter && npm install && npm run dev
```

## The engine

| Import | What it is |
|---|---|
| `madness-engine/gfx` | The renderer: three.js-shaped but not three.js (see `src/gfx/LICENSE`). It uses WebGPU where the browser has it and WebGL 2 where it doesn't (`?renderer=webgl` pins it), with physically based shading, transmission and shadows. `gfx/renderer`, `gfx/webgl`, `gfx/webgpu` and the rest are its parts. |
| `madness-engine/physics` | Sphere physics over a triangle soup, with moving boxes, still boxes and cylinders: `World`, `createBall`, `stepBall`, `collideBalls`, `rollSpin`, `turn`. Units are tiles. `new World({ cols, rows, slideUnder })`. |
| `madness-engine/input` | Keys, mouse, touch and gamepad reduced to one stick, a view to turn and zoom, and one-shot presses. Options: `boost` (a held button), and `presses` and `padPresses` (a game's own buttons). |
| `madness-engine/view`, `views/arcade`, `views/close`, `views/town` | Where the camera sits round the ball, and `toGround` (the stick as a push along the ground). The arcade's corner, the same a little nearer, or higher and further back for streets; `defineView({ home, limits })` for your own. |
| `madness-engine/stage` | The screen: `createStage(host, { sky, room, lights, lens, view })` gives the renderer, scene, camera and lights the way every game sets them up, follows a target, and `stage.run(update)` is the loop. It also exports `createRenderer` (WebGPU, falling back to WebGL 2, and carrying on in WebGL 2 if the GPU is lost) and `domeU`. |
| `madness-engine/audio` | Sound made with Web Audio and no samples: `createAudio({ storageKey, glue, onWake })` gives `tone`, `burst`, `jingle`, `loop` (a roll, an engine, a crowd), the mute switch and the music and effects levels. Silent until `wake()`. |
| `madness-engine/effects` | Bits that fly: `createEffects(GFX, scene, { ground })` gives `burst`, `spawn` (tumbling, bouncing, fading), `ring`, and the weather (`setWeather('rain' \| 'sand' \| 'snow' \| 'petals')`). Also `shardGeometry`, `CONFETTI`, `PICKS`, `WEATHER`. |
| `madness-engine/storage` | `saveSlot(key)`: one guarded slot in browser storage. `SETTINGS` and `pickSettings` for the settings every game has. |
| `madness-engine/models/sdf`, `rig`, `skins`, `model` | The sculpting kit: signed-distance shapes meshed into skinned models, with a skeleton and clips. `createModel(GFX, def)` stands one up, and `createStatic` makes a prop. |
| `madness-engine/models/bake` | Baking those models in background workers: `serveBakes`, `createBakeLibrary`, `createCastLibrary`. `models/legacy-bake` is the older bake the street models use. |
| `madness-engine/kit`, `madness-engine/color` | The prop kit, which gathers plain shapes into one geometry per finish, and `linearRGB`. |

## The library

Everything the games have made, filed by what it is rather than by which game
made it. **`docs/library.md` lists every item, with a line on what it is and
which games it came from.**

| Import | What is there |
|---|---|
| `madness-engine/characters/<name>` | 168 people, creatures and monsters: the gig crowd, the tourists, the metalheads, the dungeon's goblins, orcs, skeletons and dragon, the cats and the mouse. Each is a sculpted definition for `createModel` (`import punk from …`). `madness-engine/characters` is all of them by name (`CHARACTERS`). `humanoid`, `quadruped`, `person` and `wardrobe` are the bodies and clothes they are built on. |
| `madness-engine/props/<name>` | 20 things to pick up: picks, tape, lighters, passes, records, gold, keys, chests, potions and more, for `createStatic`. `madness-engine/props` is all of them (`PROPS`). |
| `madness-engine/heroes/<name>` | The balls the games are played as: `marble` (the glass marble), `die` and `nat/geometry` (the d20), `yarn/…` (the ball of yarn), `hamster`, `ball`, `mace` and `morningstar` (the spiked ball), `rock` and `boulder` (Rock). |
| `madness-engine/scenery/<name>` | The town's `street`, `vehicles`, `civic`, `discourse`, `odds` and `oil`, and the `dungeon`'s walls, torches and exit. |
| `madness-engine/textures/…` | `painters`: the canvas toolkit and some twenty floors and walls (concrete, planks, cobble, marble, tatami, brick and more). `venue`: the clubs' floors, walls, belts, grilles, gaffer tape, shutters, panels and glows. `town/…`: the town's painters and surfaces. `lava`. `rooms/<name>`: what shiny things reflect (`studio`, `vault`, `house`, `venue`, `town`), each a `paintRoom`. `skies/<name>`: what surrounds the scene (`haze`, `embers`, `night`, `skyline`, `horizons`, `town`), each a `paintSky`. Hand them to `createStage({ sky, room })`. |
| `madness-engine/music/…` | `band`: a whole band (drums, bass, guitars through a distortion and a cabinet, a lead, synths) with its songs in `THEMES`. `createBand(audio.ctx, audio.music, audio.noise).start(theme, tempo)`. `theory` holds the scales, the song form and the effects. `score` is a smaller orchestra with its own themes. |

### Versions

Where games made different versions of the same thing (Rock 'n' Roller III's
bouncer is not Metroll's), every version is kept, unchanged apart from its
import paths. The default, at `<kind>/<name>`, is the version the most games
have; on a tie it is the newest game's. Each other version sits beside it as
`<kind>/<name>.<game>`, named after the oldest game that has it:
`characters/bouncer`, `characters/bouncer.metroll` and
`characters/bouncer.rocknroller-iii`. Within each version, what it imports is
the version it was made with, so each one is exactly what its game has.

## The games still work as they did

Nothing here changes the games: each keeps its own files until it chooses to
take the engine's. `npm run verify -- --games <folder with the games in>`
proves that the engine can stand in for each game's own copies:

1. **Physics, input and view, bit for bit.** The same seeded worlds, the same
   scripted sessions (keys, mouse, two-finger gestures, gamepad, the touch
   button) and the same state after every step, on both. The renderer's
   shaders are compared with the game's own, comments aside.
2. **The library.** Every file it took from the game is the game's own code,
   and each import goes to the same thing. The game must also have nothing the
   library should have taken but hasn't. The bands play every theme with the
   same Web Audio calls as the game's own music.
3. **The game's own test suite**, on a copy with the engine's files swapped
   in, against the same suite on an untouched copy. Those suites include
   autopilots that play every level.
4. **As a package**, with `--package`: the engine is `npm pack`ed and
   installed into a copy of each game. Everything the engine and the library
   have of the game is taken from the package, the game's tests run, and
   `vite build` bundles it.

`docs/dropping-in.md` covers moving a game onto the engine.

## Keeping the library up to date

`npm run extract -- --games <folder>` rebuilds the library from the games
(`scripts/extract/`). `sources.mjs` says what is taken from each game and where
it goes. The script writes `scripts/extract/origins.json`, which records where
each game file went, and `docs/library.md`. Run it when a game gains a
character or a texture. The verify fails until you do.

## Developing

```sh
npm test       # the engine's own tests
npm run lint
npm run extract -- --games ..  # rebuilds the library from the games
npm run verify -- --games ..   # every game beside this folder; --only a,b to pick; --skip-tests for the quick part; --package for the package install and build
```
