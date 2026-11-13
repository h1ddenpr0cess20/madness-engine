# Graphics API

The graphics module provides the scene and drawing types used by Madness Engine assets and games. It includes math, scene objects, geometries, materials, textures, cameras, lights, and buffer attributes.

Import it as a namespace:

```js
import * as GFX from 'madness-engine/gfx';
```

## What is included

The public `GFX` entry point re-exports the engine's math, core scene types, and geometry helpers. Common types include:

- Scene graph: `Scene`, `Group`, `Object3D`, and `Mesh`.
- Geometry: `BufferGeometry`, `BufferAttribute`, and the built-in geometry constructors.
- Materials: basic, standard, and physical material classes, plus the engine's custom shader material support.
- Cameras and lighting: perspective and orthographic cameras, directional, point, spot, and hemisphere lights.
- Math: vectors, matrices, quaternions, colors, and bounding volumes.
- Textures: texture objects and canvas textures, wrapping modes, mapping modes, and color-space constants.

The stage constructs and manages the renderer. Most games should use `createStage` rather than constructing the renderer and GPU backend directly.

## Engine implementation, not a general Three.js installation

The API is intentionally familiar to developers who have worked with Three.js, and parts of the renderer are adapted from Three.js under its MIT license. However, `madness-engine/gfx` is the engine's own graphics layer and renderer. It is not a dependency on the full Three.js package, and compatibility with arbitrary Three.js addons or examples should not be assumed.

Use the classes and methods exported by `madness-engine/gfx` and the engine's own helpers. If a feature is not present in the engine's exports, it should not be assumed to exist simply because a similarly named Three.js API has it.

## Renderer backends

The stage uses the engine's WebGPU backend when available and WebGL 2 otherwise. You can pin a backend during testing with the `renderer` URL parameter; see the [stage reference](stage.md).

## Basic scene example

```js
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';

const stage = await createStage(document.querySelector('#game'));
const geometry = new GFX.SphereGeometry(0.5, 32, 20);
const material = new GFX.MeshPhysicalMaterial({
  color: '#4d9bd6',
  roughness: 0.28,
  metalness: 0.1,
});
const sphere = new GFX.Mesh(geometry, material);

stage.scene.add(sphere);
const stop = stage.run((dt) => {
  sphere.rotation.y += dt * 0.4;
});
```

For custom geometry and asset construction, use the engine's geometry and modeling helpers rather than relying on unexported implementation details.
