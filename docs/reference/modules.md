# Module map

The engine is distributed as JavaScript ES modules. Import a module by its path under the package name:

```js
import { createStage } from 'madness-engine/stage';
import { World, createBall } from 'madness-engine/physics';
import * as GFX from 'madness-engine/gfx';
```

## Main entry points

| Import path | Purpose |
|---|---|
| `madness-engine/gfx` | Scene, geometry, material, texture, and math types. |
| `madness-engine/stage` | Renderer, scene, camera, lighting, and frame loop. |
| `madness-engine/physics` | Ball physics and collision worlds. |
| `madness-engine/input` | Keyboard, pointer, touch, and gamepad controls. |
| `madness-engine/audio` | Web Audio helpers. |
| `madness-engine/effects` | Particles, weather, and visual effects. |
| `madness-engine/view` | Camera view helpers and coordinate conversion. |
| `madness-engine/people` | Human and robot characters. |
| `madness-engine/weapons` | Measured weapon factories and categories. |
| `madness-engine/characters` | Shared character definitions and roster. |
| `madness-engine/props` | Shared props and prop factories. |
| `madness-engine/props/dice` | Dice definitions and constructors. |
| `madness-engine/buildings` | Procedural building models and footprints. |
| `madness-engine/vehicles` | Drivable vehicle models. |
| `madness-engine/moods` | Reusable scene and lighting moods. |

## Submodules

Many systems expose smaller modules for focused imports. Examples include:

- `madness-engine/models/model` — sculpted model baking and instantiation.
- `madness-engine/models/rig` — skeleton and skinning utilities.
- `madness-engine/mesher` — low-level mesh building and batching.
- `madness-engine/venue/venue` — venue grid and simulation data.
- `madness-engine/venue/gig` — rolling-game venue simulation.
- `madness-engine/venue/scenery` — venue meshes and exits.
- `madness-engine/characters/punk` — an individual shared character definition.
- `madness-engine/props/glass-planets` — glass planet assets and their maps.
- `madness-engine/textures/wood` — shared wood texture materials.

The package export map is in `package.json`. Its wildcard subpath exports make source modules importable by path, but they do not create aggregate entry points for every directory. For example, import `madness-engine/models/model`, not `madness-engine/models`.

## Related documentation

- [Getting started](../guides/getting-started.md)
- [Stage and rendering](stage.md)
- [Physics](physics.md)
- [Input](input.md)
- [Graphics API](gfx.md)
