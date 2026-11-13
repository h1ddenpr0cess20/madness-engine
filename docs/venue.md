# Venue system

The venue modules provide the tile-based world format used by the rolling games. A `Venue` describes the floor, walls, hazards, moving obstacles, lighting, pickups, props, and foes for one level. The simulation, mesh-building, and game rules are separate modules, so the level data can be used without baking in a particular game's roster or scoring rules.

Import modules through their subpaths:

```js
import { Venue, buildVenue } from 'madness-engine/venue/venue';
import { createVenueMeshes, createExit } from 'madness-engine/venue/scenery';
import { createGig, stepGig } from 'madness-engine/venue/gig';
```

## Build a venue

A venue is created with a name, grid size, palette, and optional game metadata:

```js
const venue = new Venue({
  name: 'Warehouse',
  cols: 24,
  rows: 18,
  palette,
  act: 1,
  tempo: 120,
  look: {},
});
```

Each cell can be empty or contain a surface described by four corner heights. The grid uses integer tile coordinates. The venue's x and z axes follow the angled board orientation used by the rolling games.

## Geometry and layout methods

The main layout methods return the venue, so calls can be chained.

| Method | Purpose |
|---|---|
| `surface(x, z, w, d, height, options)` | Set a rectangle of tile surfaces. `height(X, Z)` supplies the corner height in grid coordinates. |
| `flat(x, z, w, d, h, options)` | Set a flat rectangle at height `h`. |
| `slope(x, z, w, d, from, to, axis, options)` | Create a straight ramp along the x or z axis. |
| `stairs(x, z, w, d, from, to, axis, options)` | Create a run of flat steps. |
| `chute(x, z, w, d, from, to, axis, options)` | Create a banked channel that rises toward its sides. |
| `bend(x, z, size, h, pivot, options)` | Create a banked corner around a pivot. |
| `bowl(x, z, w, d, h, depth, options)` | Create a shallow dish. |
| `wall(x, z, w, d, top, options)` | Raise walls above the neighboring floor. |
| `enclose(x, z, w, d, options)` | Add selected sides around a rectangular area. |
| `room(x, z, w, d, h, options)` | Create a room from a floor and surrounding walls. |
| `floorOf(x, z, w, d, tex)` | Assign a floor texture to cells. |
| `pillar(x, z, rise, options)` | Add a pillar. |
| `block(x, z, w, d, rise, options)` | Add a raised block, optionally with a prop. |
| `prop(kind, x, z, options)` | Place a prop marker. |
| `clear(x, z, w, d)` / `gap(x, z, w, d)` | Clear cells or mark a gap. |

Use `cell(x, z)` to read a cell and `heightAt(x, z)` to query the surface height. `isSafe(x, z)`, `lowest`, and `highest` expose useful level checks and bounds.

## Hazards, obstacles, and pickups

The venue data also has methods for common gameplay elements:

- `zap(x, z, w, d, h, options)` marks electrified floor.
- `exit(x, z, w, d, h)` marks the exit area.
- `foe(kind, x, z, options)` places a foe marker with a range, optional path, and facing.
- `drop(x, z, options)` and `pyro(x, z, options)` schedule beat-driven hazards.
- `lift(x, z, w, d, h, options)` creates a moving lift.
- `sticky`, `ice`, and `belt` mark special floor effects.
- `bumper`, `gate`, and `panel` create moving or breakable obstacles.
- `pickup(kind, x, z, amount)` records a game-defined pickup.
- `lamp` and `light` add lighting fixtures and rig entries.

The methods record level data. They do not define the game's reward values, actor implementations, sound effects, or UI.

## Build collision and render data

`buildVenue(venue)` converts the venue description into the built geometry and physics data used by the game. `createVenueMeshes(GFX, built, venue)` creates the scene objects for that built venue. `createExit(GFX, venue, options)` builds the exit marker and signage.

The venue's palette and texture choices feed into the mesh builder. Keep the palette consistent with the game-specific material and scenery setup.

## Simulation

`venue/gig` handles the shared rolling-game simulation:

- `createGig(GFX, index, options)` creates a playable gig using the game's `loadVenue` and `createActors` callbacks.
- `stepGig(gig, push, dt, options)` advances the simulation.
- `putBack(gig)` resets the gig.
- `resultOf(gig)` returns the run's summary statistics.

The simulation module exports tuning constants for grip, rev, sticky ground, ice, belts, bumpers, and the fixed simulation step. Scoring, actor construction, pickup meaning, and presentation remain game-specific.

## Related modules

| Module | Responsibility |
|---|---|
| `venue/dig` | Cursor-based level construction. |
| `venue/helpers` | Helpers for laying out venue geometry. |
| `venue/scenery` | Venue meshes and exit visuals. |
| `venue/gig` | Shared rolling-game simulation. |
| `venue/hype`, `venue/integrity`, `venue/smash`, `venue/roll` | Score/combo, player integrity, impact grading, and rolling motion. |
| `venue/loading`, `venue/foemesh` | Loading UI and game-specific foe mesh integration. |

See the [module map](reference/modules.md) for other engine import paths.