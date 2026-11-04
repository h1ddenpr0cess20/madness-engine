#!/usr/bin/env python3
"""
Builds src/textures/mars/relief.js: the surface of Mars, from MOLA laser
altimetry, as the frosting an etcher would leave for it.

    pip install pillow numpy
    python3 scripts/mars-relief.py relief.js

`relief.js` is the Mars Global Surveyor MOLA gridded topography (MEGDR, 32
pixels per degree) as east and north slopes, 8192 x 4096, red and green, each
stored as slope / slopeMax = sign(v) * v^2 with v in [-1, 1] mapped to 0..255
(the file of fgourdeau/rotating-mars-wallpaper, public domain data, MIT code).

Each pixel is lit from the north-west as shaded relief, 3x exaggerated, and the
light is the frost: flat ground is nearly clear, slopes facing the light are
fully frosted and slopes turned away are clear glass. The result is cut to
4096 x 2048 and stored as one grayscale JPEG, 0 clear to 255 frosted, rows from
90N down and columns from -180 east (the prime meridian in the middle).
"""
import base64, io, json, os, re, sys
import numpy as np
from PIL import Image

src = open(sys.argv[1]).read()
meta = json.loads(src[src.index("{"):src.rindex("}") + 1])
slope_max = meta["slopeMax"]
rgb = np.asarray(Image.open(io.BytesIO(base64.b64decode(meta["jpegBase64"]))).convert("RGB"), dtype=np.float32) / 255 * 2 - 1
sx, sy = (slope_max * np.sign(rgb[..., i]) * rgb[..., i] ** 2 * 3.0 for i in (0, 1))
# Light from the north-west, 45 degrees up.
lx, ly, lz = -0.5, 0.5, 0.7071
shade = (lz - sx * lx - sy * ly) / np.sqrt(1 + sx * sx + sy * sy)
frost = np.clip(0.1 + (shade - lz) * 3.4, 0, 1)
im = Image.fromarray((frost * 255).astype(np.uint8), "L").resize((4096, 2048), Image.BOX)
buf = io.BytesIO()
im.save(buf, "JPEG", quality=72, optimize=True)
packed = base64.b64encode(buf.getvalue()).decode()
lines = "\n".join(f"  '{packed[i:i+120]}' +" for i in range(0, len(packed), 120)).rstrip(" +")
out = os.path.join(os.path.dirname(__file__), "..", "src", "textures", "mars", "relief.js")
open(out, "w").write(f"""/**
 * The surface of Mars as frost: MOLA laser altimetry (Mars Global Surveyor,
 * 32 pixels per degree, NASA / GSFC, public domain) shaded as relief from the
 * north-west by `scripts/mars-relief.py` and stored as a 4096 x 2048 grayscale
 * JPEG, 0 clear and 255 frosted, rows from 90N down, columns from -180 east.
 * Do not edit by hand.
 */
export const RELIEF_WIDTH = 4096;
export const RELIEF_HEIGHT = 2048;
export const RELIEF_JPEG =
{lines};
""")
im.resize((1400, 700), Image.LANCZOS).save(sys.argv[2] if len(sys.argv) > 2 else os.devnull, "PNG") if len(sys.argv) > 2 else None
print(f"{len(packed)//1024} KB base64")
