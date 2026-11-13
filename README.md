# Madness Engine

Madness Engine is a reusable JavaScript engine and shared asset library for browser-based games. It grew out of the Madness games, bringing their renderer, physics, game systems, tools, and accumulated art assets into one place so projects can build on the same foundation instead of maintaining separate copies.

The engine is made of small ES modules. A game imports the systems and assets it needs, and can combine them with its own code and content. The renderer uses **WebGPU** when available and falls back to **WebGL 2**.

## What it provides

Madness Engine covers the common parts of a 3D game, from drawing and simulation to the content used to build a world.

| Area | Included systems |
|---|---|
| **Rendering** | The engine's graphics API, WebGPU/WebGL 2 renderers, materials, lighting, shadows, transmission, and instancing. |
| **Simulation** | Ball physics, collision against world geometry and moving objects, rolling behavior, and shared world utilities. |
| **Game framework** | Stage setup, cameras and views, keyboard/mouse/touch/gamepad input, browser storage, and common game settings. |
| **Audio and effects** | Procedural audio through Web Audio, music systems, particle effects, and weather. |
| **Environment** | Ocean and sky systems, scene moods, film treatments, lighting setups, and environmental presets. |
| **Modeling tools** | Signed-distance-field modeling, skeletons, skinned models, animation, background baking, and a low-poly mesher for building geometry. |

These systems are intended to work together, but they are not tied to one game structure. Projects can use the full stage and rendering setup or import individual modules where that makes more sense.

## Shared asset library

The engine also collects reusable content created across the games. Assets are organized by type rather than by the project they originally came from, which makes it possible to use the same content in different games.

| Asset area | Contents |
|---|---|
| **Characters and people** | Human characters, creatures, monsters, rigs, body definitions, clothing, and character variants. |
| **Heroes and props** | Playable rolling characters, dice, weapons, pickups, furniture, and general-purpose props. |
| **Buildings and scenery** | Building models, streets, vehicles, flora, environmental pieces, and other world geometry. |
| **Textures and materials** | Surface painters, floors and walls, foliage, venue materials, reflective rooms, and skies. |
| **Moods and music** | Reusable visual themes, color palettes, lighting and weather presets, film treatments, bands, and music systems. |

The library is intentionally shared: a project can use an existing character, prop, texture, or environment instead of creating and maintaining another copy. Where games have distinct versions of an asset, those versions can be kept separately.

The generated [library catalog](docs/library.md) lists the shared-library assets by category and identifies their source game where applicable. It does not inventory every engine module or every standalone asset.

## Installation

Install the repository from GitHub:

```sh
npm install github:h1ddenpr0cess20/madness-engine
```

Madness Engine is distributed as plain JavaScript ES modules. It has no separate build step; the consuming game can bundle the modules with Vite.

## Using the engine

Import the modules a game needs. For example:

```js
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { World, createBall, stepBall } from 'madness-engine/physics';
import { createMarble } from 'madness-engine/heroes/marble';
import punk from 'madness-engine/characters/punk';
```

A stage brings together the renderer, scene, camera, and lighting. The physics, input, audio, effects, modeling tools, and asset libraries can be used alongside it or independently.

## Examples

The repository includes working projects that demonstrate different parts of the engine.

- **[Starter game](examples/starter/)** — A small playable project with a board, marble, moving character, collectibles, effects, and sound. It is the best starting point for a new game.
- **[Human world](examples/human-world/)** — A test environment for the human character and animation systems.
- **[Asset viewer](examples/asset-viewer/)** — A browser-based way to inspect the engine's assets.

Run the starter example:

```sh
cd examples/starter
npm install
npm run dev
```

The other examples are standalone projects and have their own package files and run instructions.

## Documentation

The README describes the project and its main parts. Practical guides, API references, asset specifications, and development workflows are organized in the **[documentation index](docs/README.md)**.

- **[Getting started](docs/guides/getting-started.md)** — Create a stage, run the frame loop, and add physics.
- **[API references](docs/reference/)** — Stage, graphics, physics, input, and module imports.
- **[Generated library catalog](docs/library.md)** — Extracted game-derived assets and their source projects.
- **[Adding an existing game to the engine](docs/dropping-in.md)** — Integration and migration process.
- **[People and characters](docs/people.md)** — Human models, clothing, animation, and related systems.
- **[Weapons](docs/weapons.md)** — Weapon assets and their construction.
- **[Venue systems](docs/venue.md)** — Venue components and setup.

See the **[docs directory](docs/)** for the other subject-specific notes.

## Development

The repository's development scripts cover tests, linting, library extraction, and compatibility verification. Development requires Node.js 22.12 or newer.

```sh
npm test
npm run lint
```

When working on the shared asset library, rebuild it from the source games and verify the consuming projects with:

```sh
npm run extract -- --games <path-to-games>
npm run verify -- --games <path-to-games>
```

The path should point to the directory containing the game projects.
