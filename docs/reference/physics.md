# Physics

The physics module provides rolling-ball simulation against static triangle geometry, static boxes and cylinders, and moving boxes. It is a purpose-built system for the rolling games, not a general rigid-body engine.

Import the common API with:

```js
import { World, Worlds, createBall, placeBall, stepBall } from 'madness-engine/physics';
```

## Coordinate system and units

Physics uses map tiles as world units. One tile spans one unit along x and z, and heights use the same unit. The simulation's time values are in seconds.

The renderer and physics must use the same coordinate values for a game world. Human and weapon assets use meter-based dimensions, so games that combine them with tile-based physics should establish their scale convention explicitly.

## Build a collision world

A `World` represents a rectangular patch of the game map:

```js
const world = new World({
  cols: 12,
  rows: 12,
  slideUnder: false,
});
```

Add each collision triangle as nine coordinate values, then call `finish()` once after the static geometry has been added. `finish()` freezes the triangle data into typed arrays and calculates its normals.

```js
world.addTriangle(
  0, 0, 0,
  12, 0, 12,
  12, 0, 0,
);
world.addTriangle(
  0, 0, 0,
  0, 0, 12,
  12, 0, 12,
);
world.finish();
```

Triangles are bucketed by map tile so a ball only checks nearby collision geometry. Add the complete static surface before finishing the world.

### Static collision shapes

- `addStatic(box)` registers a stationary axis-aligned box. The box supplies `min` and `max` coordinate arrays.
- `addCylinder(cylinder)` registers a stationary upright cylinder. Supply its x/z center and radius using the shape expected by the game.
- Moving boxes are stored in `world.boxes` and provide bounds and velocity values used by the collision step.

The `slideUnder` option changes how the ball interacts with stationary overhead boxes. When enabled, a ball can be pushed sideways beneath a low overhang instead of always being pushed down from the underside.

## Create and step a ball

`createBall(options)` returns a mutable ball state. Its main options are `x`, `y`, `z`, `r`, `mass`, `bounce`, and `bounceFrom`.

```js
const ball = createBall({
  x: 2,
  y: 0.5,
  z: 2,
  r: 0.35,
});
```

Call `stepBall(ball, world, ax, az, dt, options)` once per simulation step:

- `ax` and `az` are control inputs from -1 to 1.
- `dt` is elapsed simulation time in seconds.
- Optional settings override `push`, `airPush`, `topSpeed`, and `drag`.

The ball is updated in place. The result reports the strongest impact, whether it landed, the drop distance, and whether it was crushed.

```js
const result = stepBall(ball, world, inputX, inputZ, 1 / 120);
if (result.impact > 2) {
  // Trigger a game-specific sound or effect.
}
```

Use a fixed timestep for consistent results. The engine's starter and rolling games accumulate frame time and step physics at fixed intervals. `placeBall(ball, x, y, z)` teleports the ball and clears its velocity and contact state.

## Multiple balls

`collideBalls(a, b, restitution)` resolves a collision between two balls and returns the resulting impulse value. `rollSpin(ball, out)` calculates the angular velocity used to rotate a visual rolling object. `turn(quaternion, angularVelocity, dt)` integrates that rotation.

## Streamed worlds

`Worlds` combines multiple `World` patches for large maps. Add and remove finished world patches as the player moves:

```js
const worlds = new Worlds({ capacity: 4096 });
worlds.add(northChunk);
worlds.add(southChunk);
worlds.remove(northChunk);
```

A ball near a seam can collide with geometry in both patches. Call `worlds.settle()` between simulation steps; it grows the temporary collision buffer if a step needed more capacity than was available.

## Tuning constants

The module exports `GRAVITY`, `PUSH`, `AIR_PUSH`, `TOP_SPEED`, `MAX_SPEED`, `ROLL_DRAG`, `FALL_LIMIT`, `BREAK_SPEED`, `RUBBER`, and `SUPERBALL`. These are the defaults used by the rolling simulation. Prefer per-ball or per-step options where possible instead of changing shared constants.
