# Granite kitchen: counter, sink, cabinetry

The reference kitchen for the engine's procedural props. It is three parts that
fit together, so a game can take any one of them:

- **`createGraniteCounter(GFX, options)`**: a run of cabinetry under a polished
  granite top. `length` is any value from 1.2 to 4.8 m; the doors and drawers
  are counted to the run (about one door per 0.62 m), so a longer counter is the
  same counter, not a stretched one. `depth`, `height`, `granite`, `wood` and
  `fixtureMetal` are the rest. With a `cutout` (`{ x, z, width, depth }`, its
  middle from the middle of the counter), the top is cut round an aperture and
  the carcass beneath is open to receive a sink; without one, the top is one
  solid slab.
- **`createKitchenSink(GFX, options)`**: the sink, as its own part: a formed
  copper basin with a rolled rim, drain and strainer, and a solid brass faucet.
  Its origin is the middle of the rim, which sits flush with the counter. Build
  it for the cutout's `width` and `depth`, and place it at the cutout's middle.
- **`createGraniteKitchen(GFX, options)`**: the counter and the sink together,
  with the cutout cut to fit. This is the asset registered in the asset viewer.

## Materials

- **Granite**: the granite boulder's own colour and bump maps (`heroes/rock-granite`),
  at the boulder's grain scale, so the top's grain matches the granite rock.
- **Hardwood** (`textures/wood`): walnut, oak or mahogany. Each has a raw
  lumber map (the carcass, bare) and a finished map (the doors and drawers).
  The grain is built as a board is cut: growth rings bent round the cathedral,
  latewood, fibres running the length of the board, and open pores in the
  species that have them.
- **Lacquer**: the finished boards carry a sealed, satin-gloss clearcoat (clearcoat
  1, roughness 0.06 on the coat). The raw lumber has no clearcoat.
- **Metals**: `props/metalglobe`'s copper, brass, gold and bronze finishes.

## Geometry

Textures are placed in the world, not stretched over each box: a face takes its
texture from its position on the counter, so the grain runs on from one door to
the next and from one piece of granite to the next across a cut.
