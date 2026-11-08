# The venue kit

The rolling games (Rock 'n' Roller I–III, Metroll) were built from each other,
and each carried its own copy of the code that builds, plays and draws a level.
The copies differed only in what things are called. The kit is that code once,
in `src/venue/`; a game keeps its names, its rosters and its content.

Import as `madness-engine/venue/<module>`.

| Module | What it is |
|---|---|
| `venue/venue` | `Venue`: a grid of tiles with four corner heights each, and everything on them (walls, exit, zap floor, ice, sticky floor, belts, bumpers, gates, breakaways, lifts, lamps and the light rig, foes, drops and pyro on the beat, pickups, props). `buildVenue(venue)` turns it into meshes' vertex data and a physics `World`. |
| `venue/dig` | `digger(venue, { x, z, h, heading })`: describe a level a piece at a time (hall, room, ledge, bridge, stairs, ramp, chute, turn, gap, ferry, shaft, exit). A cursor keeps the pieces meeting. |
| `venue/helpers` | Small helpers for placing things across a dug piece: `across`, `barred`, `flat`, `loop`, `along`, and so on. |
| `venue/gig` | `createGig(GFX, index, { loadVenue, createActors, pickups })` and `stepGig`: one venue as it is played, with no drawing or sound. The rules: grip, rev, sticky floor, ice, belts, bumpers, breakaways, gates, hits and smashes, falls, pickups. |
| `venue/hype`, `venue/integrity`, `venue/smash`, `venue/roll` | The score and combo, the hero's integrity (and its spare), how a hit is graded, and how the ball turns as it rolls. |
| `venue/loading` | `createLoading(root, label, library)`: the loading screen while models bake. `library` is the game's `{ isBaked, ready, SCULPTED }`. |
| `venue/foemesh` | `createFoeMeshes({ foes, cast, isBaked, ready })` gives `createFoeMesh(GFX, kind)`: a foe's mesh with its clips (idle, walk, attack, ko), or a stand-in until its model has baked. The roster itself stays the game's. |
| `models/viewer` | `startViewer({ definitions })`: the models turntable page (`#view`, `#bar`). |
| `venue/scenery` | `createVenueMeshes(GFX, built, venue)` draws a built venue, `createExit(GFX, venue, { last, signs })` the exit. The electrified floor is the engine's lava pit (`textures/lavapit`) turned to blue by the palette's `zapHue` (default 2.9). |

## What a game gives it

- `loadVenue(index)` returns a `Venue`; `createActors(GFX, venue, world, { killY })` returns what moves in it. `gig.js` reads `pickups`, `props`, `doors`, `spikes`, `bumpers`, and calls `place`, `step`, `drain`, `velocityOf`, `hurt`, `smashProp`, `breakDoor` and `open` on it.
- `pickups`: a table from the game's own kind names to what each does (`score`, `heal`, `revive`, `pass`, `token`). The default is `PICKUPS`.
- Pickup methods on the venue (`pick`, `popcorn`, `tape`) are the game's, as a subclass over `venue.pickup(kind, x, z, amount)`.
- Posters (`bill()`), exit signs (`signs`), the cast and the foes' roster are the game's.

## Names

| Games had | The kit has |
|---|---|
| `gig.rock`, `gig.troll` | `gig.hero` |
| `encores`, `lighters`, `takes` | `revives` (and `encore()`, `retake()` are `revive()`) |
| `out.encore`, `out.retake` | `out.revived` |
| `stats.picks`, `stats.popcorn`, `hype.picks` | `stats.pickups`, `hype.pickups` |
| `stats.globes`, `records`, `reels`, `demos` | `stats.tokens` |
| `speaker()` | `drop()` |
| `ROCK_RADIUS`, `BALL_RADIUS` | `BALL_RADIUS` |
| `GRADES[g].say` | the game's own table; the kit has the titles |
