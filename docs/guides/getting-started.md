# Getting started

Madness Engine is a JavaScript module library for browser games. It grew out of the rolling games in this repository, so its physics and game helpers are particularly well suited to that style of game. Its rendering, modeling, asset, and world-building modules can also be used independently.

## Requirements

- Node.js 22.12 or newer for the repository's scripts and examples.
- A modern browser with WebGPU or WebGL 2. The stage uses WebGPU when it is available and falls back to WebGL 2.
- A development server or bundler such as Vite for browser modules.

## Use the starter project

The starter is the best working example of a small game built from the engine. It uses a local dependency on the repository, so it exercises the source you are developing.

```sh
cd examples/starter
npm install
npm run dev
```

Open the local URL printed by Vite. The starter includes a stage, a physics world, a rolling marble, a character, pickups, effects, audio, and a mood.

To install the engine from GitHub in another project instead, add it as a dependency:

```sh
npm install github:h1ddenpr0cess20/madness-engine
```

## Create a stage

Give the stage a DOM element that has a real width and height. The returned stage owns the renderer, scene, camera, view, lights, and render loop.

```js
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';

const host = document.querySelector('#game');
const stage = await createStage(host, {
  label: 'my-game',
});

const marker = new GFX.Mesh(
  new GFX.BoxGeometry(1, 1, 1),
  new GFX.MeshStandardMaterial({ color: '#5b8fc9', roughness: 0.65 }),
);
stage.scene.add(marker);
stage.target.set(0, 0, 0);

const stop = stage.run((dt) => {
  marker.rotation.y += dt * 0.5;
});
```

The callback receives elapsed time in seconds. The stage updates the camera and renders after the callback. Keep the returned `stop` function and call it when the game is shut down or the page view is replaced.

The host needs a visible size. For example:

```css
#game {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
```

## Add physics

The physics system is separate from rendering. Build collision triangles, finish the world, and then step a ball through it.

```js
import { World, createBall, stepBall } from 'madness-engine/physics';

const world = new World({ cols: 12, rows: 12 });

// A flat 12-by-12 floor, split into two upward-facing triangles.
world.addTriangle(0, 0, 0, 12, 0, 12, 12, 0, 0);
world.addTriangle(0, 0, 0, 0, 0, 12, 12, 0, 12);
world.finish();

const ball = createBall({ x: 2, y: 0.5, z: 2, r: 0.35 });

// Call once per simulation step. ax and az are control inputs from -1 to 1.
const result = stepBall(ball, world, 0, 0, 1 / 60);
```

Physics coordinates are measured in map tiles, with one tile spanning one world unit. The ball's position and velocity are updated in place. See the [physics reference](../reference/physics.md) for collision geometry, moving platforms, and large streamed worlds.

## Add controls

The input system returns movement and view changes separately. It does not decide how a game's camera-relative movement or game-specific buttons should behave. See the [input reference](../reference/input.md) and the starter's `src/main.js` for a complete integration.

## Explore the code and assets

- [Module map](../reference/modules.md) lists the common import paths.
- [Generated library catalog](../library.md) lists the extracted shared asset categories.
- [People and characters](../people.md) and [weapons](../weapons.md) document the detailed character and weapon APIs.
- [Asset viewer](../../examples/asset-viewer/) lets you inspect assets in the repository.

The root [README](../../README.md) remains the project overview. This guide is the practical entry point for creating a game.
