# Granite kitchen: counter, sink, and cabinetry

The granite kitchen asset is built from three reusable pieces: a counter, a separate sink, and a combined counter-with-sink asset.

## Constructors

### `createGraniteCounter(GFX, options)`

Creates a cabinet run beneath a polished granite top.

| Option | Default | Notes |
|---|---|---|
| `length` | `2.8` | Run length in meters; supported range is 1.2–4.8 m. |
| `depth` | `0.72` | Counter depth in meters; supported range is 0.55–1.1 m. |
| `height` | `0.92` | Counter height in meters; supported range is 0.7–1.2 m. |
| `granite` | `'grey'` | Key in the granite library. |

The API key is spelled `'grey'` in the current source and must be passed exactly as shown; it is not a prose spelling choice.
| `wood` | `'walnut'` | Key in `WOOD_SPECIES`. |
| `hardwareMetal` | `'brass'` | Finish for cabinet pulls and hinges. |
| `environment` | `null` | Optional reflection environment for metal hardware. |
| `cutout` | `null` | Optional `{ x, z, width, depth }` opening, measured from the counter's center. |

Without a cutout, the granite top is a solid slab. With a cutout, the top is built from pieces around the opening and the cabinet carcass is left open below it for a sink.

### `createKitchenSink(GFX, options)`

Creates a separate sink group. Its origin is at the center of the rim, which sits flush with the counter when placed at the cutout's `(x, height, z)`.

| Option | Default | Supported range |
|---|---|---|
| `width` | `0.6` m | 0.4–0.9 m |
| `depth` | `0.42` m | 0.3–0.6 m |
| `basinMetal` | `'copper'` | Any key in `FINISHES` |
| `fixtureMetal` | `'brass'` | Any key in `FINISHES` |
| `environment` | `null` | Optional reflection environment |

The basin and faucet use separate metal finishes. The faucet sits behind the basin.

### `createGraniteKitchen(GFX, options)`

Creates the assembled kitchen counter and sink. It accepts the granite, wood, basin, fixture, and hardware finishes, plus `length`, `height`, `depth`, and `environment`. The sink opening is calculated from the counter size, with the sink positioned slightly left of center and toward the back.

This is the asset registered in the asset viewer. The result includes the combined `group`, the separate `counter` and `sink` groups, materials, and dimension metadata.

## Materials

- **Granite:** uses the granite boulder's color and bump maps from `heroes/rock-granite`. The countertop texture repeats at twice the boulder's repeats-per-meter value, so its pattern reads finer.
- **Hardwood:** uses the shared maps in `textures/wood`. The cabinet carcass is raw lumber; the doors, face frame, and toe kick use finished wood.
- **Lacquer:** finished boards use a sealed, satin-gloss clearcoat. Raw lumber has no clearcoat.
- **Metals:** basin, faucet, and cabinet hardware use the engine's `METALS` finishes. Cabinet hardware uses `hardwareMetal`; the basin and faucet use `basinMetal` and `fixtureMetal` independently.

Valid choices for granite, hardwood, and metal finishes are exported from the corresponding source modules. The granite colors are defined in `heroes/rock-granite`; wood species are defined in `textures/wood`; `FINISHES` is exported by `props/granite-kitchen`.

## Geometry and coordinates

All dimensions are in meters. The counter is centered at the origin on the floor, with its front facing +z. Its length runs along x. Adjacent counters can be placed end to end; each retains its own top and end faces.

Texture coordinates are derived from the parts' positions in the counter. This keeps the grain direction continuous across cabinet components and granite sections around a cutout.
