# Madness Engine

Madness Engine is a reusable JavaScript engine and asset library for browser-based rolling games. It provides rendering, physics, input, cameras, stages, audio, effects, and a shared collection of models, materials, textures, scenery, and music.

It uses WebGPU when available and falls back to WebGL 2. The engine is distributed as plain JavaScript modules, with no build step of its own. It is designed to be consumed by games using Vite.

## Install

```sh
npm install github:h1ddenpr0cess20/madness-engine
```

## Use

Import only the modules your game needs:

```js
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { World, createBall, stepBall } from 'madness-engine/physics';
import { createMarble } from 'madness-engine/heroes/marble';
```

A stage provides the renderer, scene, camera, lights, and game loop. Physics and the shared asset library are independent modules, so a game can use the parts it needs.

## Start with the example

The starter example is a small game built with the engine. It includes a board, a marble, a moving character, collectibles, effects, and sound.

```sh
cd examples/starter
npm install
npm run dev
```

The `examples/human-world` directory contains a separate test world for the human character system.

## Documentation

Detailed guides and reference material belong in the documentation, not in this overview.

- [Documentation](docs/)
- [Asset library catalogue](docs/library.md)
- [Moving a game onto the engine](docs/dropping-in.md)
- [People and character system](docs/people.md)
- [Weapons](docs/weapons.md)

For development and verification commands, see the repository's scripts and package configuration.

## Development

```sh
npm test
npm run lint
```

