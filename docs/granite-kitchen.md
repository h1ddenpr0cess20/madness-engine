# Granite kitchen counter and cabinetry

A reusable procedural kitchen prop built from the engine's existing material systems.

- **Countertop:** polished granite using the same granite colourways and grain/bump-map painter as the merged granite sword.
- **Cabinetry:** finished walnut by default, with oak and mahogany variants. The substrate uses a distinct raw-lumber material map from the same species palette.
- **Basin:** inset copper vessel, formed rim, drain flange and strainer using the engine's copper metal definition.
- **Hardware:** solid brass faucet, handles and mounts using the engine's brass definition.
- **Options:** granite, wood species, basin metal, fixture metal, width, height and depth.

`createGraniteKitchen(GFX, options)` returns a group and material handles. The asset registers itself in the asset viewer's procedural-prop catalog.
