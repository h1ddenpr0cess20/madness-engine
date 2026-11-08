# Wood textures: sources and status

`textures/wood` paints the library's hardwood and softwood maps (`woodTexture`).
The colours of a species are its darkest (`heart`), typical (`base`) and palest
(`sap`) tones.

## Sampled from reference photographs

Colours are the 5th, 50th and 95th percentiles of the luminance of each photo,
as sRGB.

- **Walnut** (`walnut.jpg`): "20160211154306!Nussbaum Holz.jpg", by User:Das_Ohr,
  CC BY 3.0, https://commons.wikimedia.org/wiki/File:20160211154306!Nussbaum_Holz.jpg
  heart (119, 72, 31), base (174, 127, 84), sap (238, 192, 150). The grain
  anisotropy measured 1.5 (the lines run across the photo's vertical, along u).
- **Ash** (`ash-burl.jpg`): "Esche Maser Holz.JPG", by User:Das_Ohr, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File:Esche_Maser_Holz.JPG
  heart (197, 111, 40), base (221, 140, 68), sap (243, 169, 100). The photo is a
  burl, so the figure is stronger than a plain board's.

## Not sampled yet

- **Oak**: the reference photo ("16 inch wide oak flooring.jpeg", public domain)
  is greyed by weathering or lighting, so its colour is not used.
- **Teak**: the reference photo ("Teak arrived ras3751 mar19h.jpg", CC BY-SA 4.0)
  reads grey too.
- **Mahogany, maple, cherry, pine**: no reference photographs were reachable.
  Their colours are approximate and marked as such in `textures/wood.js`.
