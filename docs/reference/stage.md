# Stage and rendering

The stage is the standard starting point for a game that uses the engine's renderer. It creates the renderer, scene, camera, view, lighting, sky, reflection environment, and frame loop in one place.

Import it with:

```js
import { createStage } from 'madness-engine/stage';
```

## Create a stage

`createStage(host, options)` is asynchronous because renderer initialization may require WebGPU device setup.

```js
const stage = await createStage(document.querySelector('#game'), {
  label: 'my-game',
  shadows: true,
  shadowSize: 2048,
});
```

The host element must have a nonzero size. The stage resizes its drawing buffer when the host changes size.

### Options

| Option | Purpose | Default |
|---|---|---|
| `lens` | Camera distance and field of view: `{ distance, fov }`. | `LENS` |
| `view` | A view object, usually from `madness-engine/views/arcade`, `views/close`, or `views/town`. | Arcade view |
| `sky` | Painted canvas used for the surrounding sky. | `null` |
| `backdrop` | Solid sky color used when no sky canvas is supplied. | `#0b0e1d` |
| `room` | Equirectangular canvas used for reflections, or `null`. | `null` |
| `lights` | Partial overrides for the hemisphere, key, and fill lights. Set `fill: null` to remove the fill. | Engine defaults |
| `fixtures` | Number of reusable point lights reserved for a light show. | `0` |
| `shadows` | Enable shadows from the key light. | `true` |
| `shadowSize` | Shadow-map width and height in pixels. | `2048` |
| `pixelRatio` | Maximum drawing-buffer pixels per CSS pixel. | `2` |
| `ui` | DOM elements that the film system may process with the canvas. | `[]` |
| `preference` | `'webgpu'`, `'webgl'`, or `null` for automatic selection. | URL preference or automatic |
| `label` | Name used in renderer warnings. | `'madness-engine'` |
| `depth` | Near/far camera-plane behavior for unusually close or distant views. | Engine defaults |

The `LENS` and `LIGHTS` constants are exported from `madness-engine/stage`.

## Renderer selection

The stage prefers WebGPU when the browser exposes it. If initialization fails, it falls back to WebGL 2 unless WebGPU was explicitly required. If a WebGPU device is lost later, the stage attempts to continue through WebGL 2.

Use a query parameter to select a backend while testing:

- `?renderer=webgl` forces WebGL 2.
- `?renderer=webgpu` requests WebGPU when the browser exposes it; otherwise the stage falls back to WebGL 2.
- Without the parameter, the stage chooses automatically.

## Stage members

The returned object includes:

| Member | Description |
|---|---|
| `GFX` | The engine's graphics module. |
| `renderer` | Renderer instance and drawing canvas at `renderer.domElement`. |
| `scene` | Scene graph. Add meshes and groups here. |
| `camera` | Perspective camera controlled by the stage view. |
| `view` | Camera orbit, tilt, zoom, and reset behavior. |
| `target` | `Vector3` the camera looks at. Update it as the game moves. |
| `key`, `hemi`, `fill` | Main directional, hemisphere, and optional fill lights. |
| `fixtureLights` | The reserved point lights for a light show. |
| `film` | Film and post-processing controls. |
| `lantern` | Optional point light created by a mood. |
| `shake` | Camera shake amount in world units. |
| `look()` | Updates camera and light positions from the target and view. |
| `render()` | Renders the scene after updating the camera's depth range. |
| `setSky(canvas)` | Sets a painted sky canvas, or restores the solid backdrop with `null`. |
| `setRoom(canvas)` | Sets the reflection environment, or clears it with `null`. |
| `setMood(mood)` | Applies the mood's supported lighting, sky, room, and film settings. |
| `run(update, options)` | Starts the animation loop and returns a function that stops it. |

## Frame loop

`stage.run(update, { most = 0.1 })` calls `update(dt)`, then updates the camera and renders. `dt` is elapsed time in seconds and is capped by `most`, which prevents a long background-tab pause from producing one huge simulation step.

```js
stage.target.set(player.x, player.y, player.z);

const stop = stage.run((dt) => {
  updateGame(dt);
  stage.target.set(player.x, player.y, player.z);
});

// Stop the animation loop when this game view is disposed.
stop();
```

For fixed-step physics, accumulate `dt` and call the physics step at a fixed interval. The starter example demonstrates this pattern.

## Sky, reflections, and moods

A sky canvas is drawn around the scene. The room canvas is used to build the reflection environment for physical materials; it is not a second visible background.

`stage.setMood(mood)` applies the lighting, sky painter, room painter, and film settings present in the mood. Weather and music are not started automatically: the game should pass the mood's weather to its effects system and start the appropriate music itself.

The stage API is deliberately smaller than a full game framework. Game rules, physics, audio playback, asset loading, and input lifecycle remain the game's responsibility.
