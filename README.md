# Madness Engine

The engine under the rolling games: a WebGPU / WebGL 2 renderer, ball physics
written by hand, the camera and the controls, and the toolkit the models are
sculpted with. It is what [Madness](https://github.com/h1ddenpr0cess20/madness),
Dungeon Roller, Catroller, Rock 'n' Roller I–III, Metroll, Metrlol and Petroll
each carried their own copy of.

It is plain JavaScript modules with no dependencies and no build step of its
own: the games' bundlers (Vite) take it from here.

| Import | What it is |
|---|---|
| `madness-engine/gfx` | The renderer, three.js-shaped but not three.js (see `src/gfx/LICENSE`): WebGPU where the browser has it and WebGL 2 where it doesn't (`?renderer=webgl` pins it), physically based shading, transmission, shadows. `madness-engine/gfx/stage`, `renderer`, `webgl`, `webgpu` and the rest are its parts. The shaders are JS modules holding their text, so no bundler needs to know how to read a `.glsl` file. |
| `madness-engine/physics` | Sphere physics over a triangle soup, moving boxes, still boxes and cylinders. `World`, `createBall`, `stepBall`, `collideBalls`. Units are tiles. |
| `madness-engine/input` | Keys, mouse, touch and gamepad reduced to one stick, a view to turn and zoom, and one-shot presses. |
| `madness-engine/view`, `madness-engine/views/<arcade, catroller, town>` | Where the camera sits round the ball. `defineView` for a game with its own idea of home; the three views the games use. |
| `madness-engine/storage` | `saveSlot`: one guarded slot in browser storage. |
| `madness-engine/models/sdf`, `rig`, `skins`, `model` | The sculpting kit: signed-distance shapes meshed into skinned models, with a skeleton and clips. |
| `madness-engine/models/bake` | Baking those models in background workers: `serveBakes`, `createBakeLibrary`, `createCastLibrary`. `models/legacy-bake` is the older bake the town games' street models use. |
| `madness-engine/characters/<game>/…` | **Every character and prop the games have baked**: the people, creatures and monsters (`cast/`), what lies about to be picked up (`props/`), and the town games' street models (`models/`). 365 files; the ones that are the same in two or more games are kept once in `characters/shared/`. |
| `madness-engine/heroes/<game>/…` | **The main characters**: the glass marble (Madness), Nat's d20 and its monsters (Dungeon Roller), the yarn (Catroller), the hamster in its ball (Petroll), the morning star (Metroll, Metrlol), and Rock the boulder (Rock 'n' Roller I–III, Metroll). |
| `madness-engine/textures/<game>`, `madness-engine/town/<game>/…` | **The textures**, painted on canvases at startup: floors, walls, belts, grilles, gaffer tape, shutters, panels, glows. `textures/core` is what the games' versions have in common; `town/` holds the town games' painters, facades and surfaces. |
| `madness-engine/music/<game>`, `madness-engine/score/<game>` | **The music**, made on the spot with Web Audio and no samples: the band (drum kit, bass, two guitars through a distortion and a cabinet, a lead, synths) with each game's songs, and Dungeon Roller's and Catroller's scores. |
| `madness-engine/audio/<game>` | Every sound effect, made with Web Audio, and the mute switch. |
| `madness-engine/effects/<game>` | The bits that fly: shards, sparks, confetti, smoke, weather. |
| `madness-engine/stage/<game>` | The screen: renderer, scene, lights, sky and camera. |
| `madness-engine/storage/<game>` | What each game remembers between visits. |
| `madness-engine/kit`, `madness-engine/color` | The town games' prop kit, which gathers plain shapes into one geometry per finish, and `linearRGB`. |

## Using it

```sh
npm install github:h1ddenpr0cess20/madness-engine
```

```js
import { createInput } from 'madness-engine/input';
import { defineView } from 'madness-engine/view';
import { World, createBall, stepBall } from 'madness-engine/physics';
```

Where the games used to differ, the engine does what the older, plainer games
did unless it is asked otherwise. The options are the whole of the difference
between one game and the next:

| Option | Where | What it changes |
|---|---|---|
| `slideUnder: true` | `new World({ cols, rows, slideUnder })` | A box that isn't coming down shoves a ball under its edge aside, rather than down into the ground. The town games (Metrlol, Petroll) have it. |
| `boost: { pad, element }` | `createInput(surface, { anchor, boost })` | A held boost button (rev, accelerate): Space and Shift, the pad buttons in `pad`, and the on-screen button `element` or `setBoost()`. `boost()` and `rev()` are the same thing. The Rock 'n' Roller games, Metroll and Metrlol have it. |
| `presses`, `padPresses` | `createInput(surface, { anchor, presses, padPresses })` | A game's own buttons: key codes to presses (one key can make several), and which pad buttons make which. Petroll's jobs have them. |
| `home`, `limits` | `defineView({ home, limits })` | Where the camera starts. Catroller is nearer, the town games higher and further. |

`docs/dropping-in.md` has what each game passes.

## Dropping it into a game must change nothing

That is checked, not hoped. `npm run verify -- --games <folder with the games in>`
does three things for every game, against the game's own copy of each file:

1. **Physics, input and view, bit for bit.** The same seeded worlds (tiles of
   every slope, hammers, lifts, sliding boxes, posts and cylinders), the same
   scripted sessions (keys, mouse, two-finger gestures, gamepad, the touch
   button), and the same state after every step, on both. The physics scenario
   is checked to reach the one option that differs (`slideUnder`), so agreeing
   means something; and each comparison fails when the engine is given the
   wrong options.
2. **The game's own test suite**, on a copy with the engine's files swapped in,
   against the same suite on an untouched copy. Those suites include autopilots
   that play every level of every game, so a change in how the ball rolls
   would show.
3. **The renderer.** The engine's is Catroller's, which is the others' plus
   three additions that do nothing unless asked for (a repeating texture
   wrap, a lens shift of 0, and an `onFrame` hook). Every shader is checked
   against the game's own, comments aside. Then, in a real browser (WebGL 2,
   a virtual clock so frames are repeatable), Dungeon Roller, Rock 'n' Roller
   and Petroll's jobs PR were played for several seconds with and without the
   engine: every frame of the running game is identical to the pixel.
   (Title screens animate on the real clock and differ from themselves
   between two runs of the same build, so they prove nothing either way.)
4. **As a package**, with `--package`: the engine is `npm pack`ed and
   installed into a copy of each game, the game's own copies of the engine
   files are replaced by imports of `madness-engine/...`, and its tests run
   and `vite build` bundles it.

## How a game's own versions are kept

The games each had their own copy of most of this, and the copies had drifted:
Rock 'n' Roller III's band is not Rock 'n' Roller's, and Metroll's audio is not
Dungeon Roller's. Nothing was rewritten to make them one. Each game's version
is in the engine as it was, and what two or more versions have in common is
kept once:

- **Whole files** (characters, props, heroes, the town's painters) that are the
  same in two or more games, including everything they import, are kept once
  in `shared/`; each game's folder has a one-line file pointing there, so
  everything a game imports from its own folders still resolves.
- **Modules** (textures, music, audio, effects, stage, storage) are split into
  a `core.js` of the top-level statements that are the same in two or more
  versions and use nothing the versions don't hold in common, and a file per
  game (`<module>/<game>.js`) of its own statements, importing what it takes
  from the core and re-exporting what it used to export.

A new game takes whichever version suits it, or starts from one and changes it.
`scripts/extract/` is how it was done (`npm run extract -- --games <folder>`
makes it all again from the games), so the engine can be brought up to date
with the games as they change.

## What stays in the games

The game itself: its levels, rules and objects (`game.js`, `levels.js`, `actors`,
`hazards`, the venues and towns), its HUD, its scenery apart from Dungeon
Roller's (which its stage needs), and the page. They import the engine, and
the engine imports none of them. Metrlol's effects are the one engine-class
module that is still its own: they take `model` from the game's model library,
which holds the game's workers, so they can't move without changing how that
game calls them.

## Developing

```sh
npm test       # the engine's own tests
npm run lint
npm run extract -- --games ..  # rebuilds characters, heroes, textures, music, audio, effects, stage and storage from the games
npm run verify -- --games ..   # every game beside this folder; --only a,b to pick; --skip-tests for the quick part; --package for the package install and build
```
