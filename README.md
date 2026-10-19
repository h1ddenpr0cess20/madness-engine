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
| `madness-engine/gfx` | The renderer, three.js-shaped but not three.js (see `src/gfx/LICENSE`): WebGPU where the browser has it and WebGL 2 where it doesn't (`?renderer=webgl` pins it), physically based shading, transmission, shadows. `madness-engine/gfx/stage.js`, `controls.js` and the rest are its parts. |
| `madness-engine/physics` | Sphere physics over a triangle soup, moving boxes, still boxes and cylinders. `World`, `createBall`, `stepBall`, `collideBalls`. Units are tiles. |
| `madness-engine/input` | Keys, mouse, touch and gamepad reduced to one stick, a view to turn and zoom, and one-shot presses. |
| `madness-engine/view` | Where the camera sits round the ball, and which way on the ground is up the screen. `defineView` for a game with its own idea of home. |
| `madness-engine/storage` | `saveSlot`: one guarded slot in browser storage. |
| `madness-engine/models/sdf`, `rig`, `skins`, `model` | The sculpting kit: signed-distance shapes meshed into skinned models, with a skeleton and clips. |
| `madness-engine/models/bake` | Baking those models in background workers: `serveBakes`, `createBakeLibrary`, `createCastLibrary`. |
| `madness-engine/models/legacy-bake` | The older bake that Metrlol and Petroll's props use. |

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
3. The renderer is the one file set that can't be run headless by its tests:
   the engine's is Catroller's, which is the others' plus three additions
   that do nothing unless asked for (a repeating texture wrap, a lens shift of
   0, and an `onFrame` hook). `test/gfx.test.js` holds those defaults.

## What is here, and what isn't yet

Here: the renderer, physics, input, view, storage helper, the sculpting kit
and baking.

Not yet: audio and music, effects, the HUD, the stage, scenery and textures
(each is a base shared by all the games with a game's own on top, and need
splitting along that line), and the characters — Rock, the morning-star ball,
the yarn ball, the cat, the people. They are plain sculpt definitions, so they
move as modules once the kit they sit on is the engine's.

## Developing

```sh
npm test       # the engine's own tests
npm run lint
npm run verify -- --games ..   # every game beside this folder; --only a,b to pick; --skip-tests for the quick part
```
