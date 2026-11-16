# Wood textures: sources and status

The wood system in `textures/wood` generates reusable color and bump maps for hardwood and softwood materials. `woodTexture(GFX, species, finish)` returns the maps for a species and finish. Each species defines a heartwood color (`heart`), a typical board color (`base`), and a pale sapwood color (`sap`), along with parameters for growth rings, latewood, and pores.

The available finishes are `raw`, `sanded`, and `lacquered`. The lacquered finish supplies the sanded maps; a material's clearcoat provides the visible lacquer layer.

## Walnut: photograph texture

Walnut uses an embedded photograph as its color map rather than relying only on the procedural wood figure. The file `src/textures/wood/walnut-photo.js` contains a tileable crop of "20160211154306!Nussbaum Holz.jpg" by User:Das_Ohr on Wikimedia Commons.

- License: CC BY 3.0.
- Source: https://commons.wikimedia.org/wiki/File:20160211154306!Nussbaum_Holz.jpg
- The photograph was cropped, made tileable by blending its edges with a half-shifted copy, resized, and saved as a JPEG.
- The bump map is derived from the photograph's luminance.

**Attribution is required wherever the embedded walnut texture is distributed.** Retain the author and license information when packaging or redistributing this asset.

The walnut color parameters are heart (119, 72, 31), base (174, 127, 84), and sap (238, 192, 150). The reference grain's measured anisotropy is 1.5.

## Ash: colors sampled from a reference

Ash uses the procedural wood figure with color parameters sampled from "Esche Maser Holz.JPG" by User:Das_Ohr on Wikimedia Commons.

- License: CC BY-SA 4.0.
- Source: https://commons.wikimedia.org/wiki/File:Esche_Maser_Holz.JPG
- Heart: (197, 111, 40).
- Base: (221, 140, 68).
- Sap: (243, 169, 100).

The reference is a burl, so its figure is stronger than that of a plain board. The photograph is a color reference; the ash material does not use the photograph as its texture map.

The sampled values use the 5th, 50th, and 95th percentiles of the reference photo's luminance, expressed as sRGB color values.

## Approximate species and unused references

The remaining species are procedural approximations in `src/textures/wood.js`:

- **Oak:** the available flooring reference appears gray from weathering or lighting, so it was not used for color sampling.
- **Teak:** the available reference also appears gray and is not used for color sampling.
- **Mahogany, maple, cherry, and pine:** no suitable reference photographs were available when these values were set.

These colors are marked as approximate in the source. Re-sample them from suitable, clearly lit reference photographs before treating them as accurate representations of a species.

## API

```js
import { woodTexture, WOOD_SPECIES, WOOD_FINISHES } from 'madness-engine/textures/wood';

const { map, bump } = woodTexture(GFX, 'oak', 'lacquered');
```

The module also exports `rawLumber(GFX, species)` and `finishedWood(GFX, species)`. The latter selects the lacquered finish. Maps are cached per graphics namespace, species, and finish.
