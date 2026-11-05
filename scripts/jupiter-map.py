#!/usr/bin/env python3
"""
Builds src/textures/jupiter/layout.js: Jupiter's clouds as a 2:1 cylindrical
layout, from one photograph of its disc.

    pip install pillow numpy
    python3 scripts/jupiter-map.py disc.png CX CY R LON0 [out.js] [preview.png]

`disc.png` is a photograph of Jupiter, square, with the planet a disc of radius
R pixels centred on (CX, CY). LON0 is the longitude, in degrees east, that faces
the middle of the photograph. The disc is projected orthographically onto the
sphere, so its visible hemisphere lands where the planet has it, from -180 east
at the left to 180 at the right and 90N at the top (as the Mars and Moon layouts
are). The hemisphere turned away from the camera is not in the photograph; each
latitude there takes the mean of that latitude's visible colours, so the belts
run all the way round without inventing detail.

The output is one colour JPEG, base64 in the module, which the glass globe holds
as a field of mist (`setField`), as globes does with its temperature.
"""
import base64, io, os, sys
import numpy as np
from PIL import Image

OUT_W, OUT_H = 2048, 1024


def layout(disc, cx, cy, r, lon0):
    """The colours of the cylindrical layout, rows from 90N, columns from -180 east."""
    lat = np.radians(90 - (np.arange(OUT_H) + 0.5) / OUT_H * 180)[:, None]
    lon = np.radians((np.arange(OUT_W) + 0.5) / OUT_W * 360 - 180)[None, :]
    dlon = lon - np.radians(lon0)
    # The point on the sphere, seen from the camera: x east (right), y north (up), z toward the camera.
    xs = np.cos(lat) * np.sin(dlon)
    ys = np.sin(lat) * np.ones_like(dlon)
    zs = np.cos(lat) * np.cos(dlon)
    front = zs > 0.0
    px = np.clip(np.round(cx + r * xs), 0, disc.shape[1] - 1).astype(int)
    py = np.clip(np.round(cy - r * ys), 0, disc.shape[0] - 1).astype(int)
    rgb = disc[py, px].astype(np.float64)

    # Each latitude's mean over the well-lit middle of the visible hemisphere (not the dark limb),
    # for the side turned away and for the limb, which the photograph darkens and foreshortens.
    core = zs > 0.5
    count = core.sum(axis=1)
    mean = (rgb * core[..., None]).sum(axis=1) / np.maximum(count, 1)[:, None]
    # Near the poles no column is well lit: those rows take the nearest latitude that is.
    rows = np.nonzero(count > 0)[0]
    for k in range(3):
        mean[:, k] = np.interp(np.arange(OUT_H), rows, mean[rows, k])
    mean = np.broadcast_to(mean[:, None, :], rgb.shape)
    keep = np.clip(zs / 0.5, 0.0, 1.0)[..., None]
    out = rgb * keep + mean * (1.0 - keep)
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    disc_path, cx, cy, r, lon0 = sys.argv[1], *map(float, sys.argv[2:6])
    out = sys.argv[6] if len(sys.argv) > 6 else os.path.join(
        os.path.dirname(__file__), "..", "src", "textures", "jupiter", "layout.js")
    preview = sys.argv[7] if len(sys.argv) > 7 else None

    disc = np.asarray(Image.open(disc_path).convert("RGB"))
    colours = layout(disc, cx, cy, r, lon0)
    im = Image.fromarray(colours, "RGB")
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85, optimize=True)
    packed = base64.b64encode(buf.getvalue()).decode()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(f"""/**
 * Jupiter's clouds as a 2:1 colour layout, rows from 90N down, columns from
 * -180 east, made by `scripts/jupiter-map.py` from one photograph of the disc
 * (its visible hemisphere; the far side is the mean of each latitude's belts).
 * Do not edit by hand.
 */
export const JUPITER_WIDTH = {OUT_W};
export const JUPITER_HEIGHT = {OUT_H};
export const JUPITER_JPEG = '{packed}';
""")
    if preview:
        im.resize((1400, 700), Image.LANCZOS).save(preview, "PNG")
    print(f"wrote {out}: {len(packed) // 1024} KB base64")


if __name__ == "__main__":
    main()
