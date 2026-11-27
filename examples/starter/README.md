# Starter game

A small browser game that demonstrates how the main engine systems fit together. It includes a rolling marble, a triangle-based physics world, a character model, pickups, particle effects, audio, music, and optional scene moods.

## Run

From this directory:

```sh
npm install
npm run dev
```

The project uses a local dependency on the repository root, so changes to the engine source are available to the example during development.

## Main integration points

- `src/main.js` creates the stage and adds scene objects.
- The board's triangles are used for both rendering and the physics `World`.
- `createInput` converts keyboard, pointer, touch, and gamepad controls into movement and view input.
- Physics advances in fixed steps while the stage frame loop renders.
- The audio system wakes on user interaction; effects respond to collisions and pickups.
- The `mood` query parameter applies one of the shared scene moods.

See [Getting started](../../docs/guides/getting-started.md) and the [stage](../../docs/reference/stage.md), [physics](../../docs/reference/physics.md), and [input](../../docs/reference/input.md) references for the underlying APIs.
