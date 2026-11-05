#!/usr/bin/env python3
"""
Builds src/textures/jupiter/layout.js: Jupiter's clouds as a 2:1 cylindrical
layout, from one photograph of its disc.

    pip install pillow numpy
    python3 scripts/jupiter-map.py disc.png CX CY R LON0 [out.js] [preview.png]

`disc.png` is a photograph of Jupiter, square, with the planet a disc of radius
R pixels centred on (CX, CY). LON0 is the longitude, in degrees east, that faces
the middle of the photograph. The photograph is enlarged, its brightness is
stretched over the disc, and that brightness is run through Jupiter's colour
scale (stops of value and color, as globes' temperature scale is). The disc is
projected orthographically onto the sphere, so its visible hemisphere lands where
the planet has it, from -180 east at the left to 180 at the right and 90N at the
top (as the Mars and Moon layouts are). The hemisphere turned away from the
camera is not in the photograph; each latitude there takes the mean of that
latitude's visible values, so the belts run all the way round without inventing
detail.

The output is one colour JPEG, base64 in the module, which the glass globe holds
as a field of mist (`setField`), as globes does with its temperature.
"""
import base64, io, os, sys
import numpy as np
from PIL import Image, ImageFilter

OUT_W, OUT_H = 4096, 2048
UPSCALE = 4

# Jupiter's colour scale, in globes' form (stops of value and color, as its temperature scale is): the value
# is the photograph's brightness, 0 darkest to 1 brightest. The belts go to brown and rust, the zones to
# cream and a cool white, so the planet reads as itself rather than as the photograph, which is dim and faded.
JUPITER_STOPS = [
    [0.00, [70, 28, 14]],
    [0.20, [140, 62, 26]],
    [0.40, [206, 112, 54]],
    [0.58, [232, 172, 106]],
    [0.76, [246, 218, 170]],
    [0.90, [252, 240, 218]],
    [1.00, [255, 255, 255]],
]


def stops_lut(stops, size=1024):
    """The stops as a lookup of `size` colors across 0..1, as globes' createLut makes."""
    v = np.linspace(0, 1, size)
    xs = [s[0] for s in stops]
    return np.stack([np.interp(v, xs, [s[1][k] for s in stops]) for k in range(3)], axis=1)


def value_of(disc, cx, cy, r):
    """The disc as a value from 0 (darkest) to 1 (brightest): its brightness, stretched over the disc's range."""
    yy, xx = np.mgrid[0:disc.shape[0], 0:disc.shape[1]]
    inside = (xx - cx) ** 2 + (yy - cy) ** 2 < (r * 0.97) ** 2
    lum = 0.2126 * disc[..., 0] + 0.7152 * disc[..., 1] + 0.0722 * disc[..., 2]
    lo, hi = np.percentile(lum[inside], [0.5, 99.5])
    v = np.clip((lum - lo) / max(hi - lo, 1e-6), 0, 1)
    # a gentle S-curve so belts and zones separate, then a sharpen for the small storms
    v = v * v * (3 - 2 * v) * 0.6 + v * 0.4
    blur = np.asarray(Image.fromarray((v * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float64) / 255
    return np.clip(v + (v - blur) * 1.2, 0, 1)


def redness_of(disc, cx, cy, r):
    """How red the disc is, 0..1, so the Great Red Spot and the brown belts keep their hue."""
    yy, xx = np.mgrid[0:disc.shape[0], 0:disc.shape[1]]
    inside = (xx - cx) ** 2 + (yy - cy) ** 2 < (r * 0.97) ** 2
    lum = disc.mean(axis=2) + 1e-6
    red = (disc[..., 0] - disc[..., 2]) / lum
    lo, hi = np.percentile(red[inside], [2, 99.8])
    return np.clip((red - lo) / max(hi - lo, 1e-6), 0, 1)


def scale_from_photo(disc, value, cx, cy, r, saturation=3.0, bins=24):
    """
    The stops, taken from the photograph: at each level of value, the median color of the disc pixels there,
    with the saturation pushed up so the belts and the spot keep their color. This is the scale, as globes'
    temperature scale is, with the colors the planet has at each brightness rather than a hand-picked ramp.
    """
    yy, xx = np.mgrid[0:disc.shape[0], 0:disc.shape[1]]
    inside = (xx - cx) ** 2 + (yy - cy) ** 2 < (r * 0.97) ** 2
    stops = []
    for k in range(bins + 1):
        v = k / bins
        m = inside & (np.abs(value - v) <= 0.5 / bins)
        if m.sum() < 50:
            continue
        c = np.median(disc[m], axis=0)
        grey = c.mean()
        c = np.clip(grey + (c - grey) * saturation, 0, 255)
        stops.append([v, c.tolist()])
    return stops


def layout(value, cx, cy, r, lon0):
    """The values of the cylindrical layout, rows from 90N, columns from -180 east, as 0..1."""
    lat = np.radians(90 - (np.arange(OUT_H) + 0.5) / OUT_H * 180)[:, None]
    lon = np.radians((np.arange(OUT_W) + 0.5) / OUT_W * 360 - 180)[None, :]
    dlon = lon - np.radians(lon0)
    # The point on the sphere, seen from the camera: x east (right), y north (up), z toward the camera.
    xs = np.cos(lat) * np.sin(dlon)
    ys = np.sin(lat) * np.ones_like(dlon)
    zs = np.cos(lat) * np.cos(dlon)
    zs = np.abs(zs)  # the far side is the near side mirrored, so the belts and their storms carry on round
    # Bilinear across the four pixels round each point.
    fx = np.clip(cx + r * xs - 0.5, 0, value.shape[1] - 1.001)
    fy = np.clip(cy - r * ys - 0.5, 0, value.shape[0] - 1.001)
    x0, y0 = np.floor(fx).astype(int), np.floor(fy).astype(int)
    tx, ty = fx - x0, fy - y0
    v = ((value[y0, x0] * (1 - tx) + value[y0, x0 + 1] * tx) * (1 - ty)
         + (value[y0 + 1, x0] * (1 - tx) + value[y0 + 1, x0 + 1] * tx) * ty)

    v = v * (0.7 + 0.3 / np.maximum(zs, 0.35))  # lift the limb's darkening a little
    # Each latitude's mean over the well-lit middle of the visible hemisphere, for the far side and the limb.
    core = zs > 0.5
    count = core.sum(axis=1)
    mean = (v * core).sum(axis=1) / np.maximum(count, 1)
    rows = np.nonzero(count > 0)[0]  # near the poles no column is well lit: take the nearest latitude that is
    mean = np.interp(np.arange(OUT_H), rows, mean[rows])
    mean = np.broadcast_to(mean[:, None], v.shape)
    keep = np.clip(zs / 0.4, 0.0, 1.0)
    return np.clip(v * keep + mean * (1.0 - keep), 0, 1)


def main():
    disc_path, cx, cy, r, lon0 = sys.argv[1], *map(float, sys.argv[2:6])
    out = sys.argv[6] if len(sys.argv) > 6 else os.path.join(
        os.path.dirname(__file__), "..", "src", "textures", "jupiter", "layout.js")
    preview = sys.argv[7] if len(sys.argv) > 7 else None

    # The disc is small, so it is enlarged with a Lanczos filter before it is read; that adds no detail.
    photo = Image.open(disc_path).convert("RGB")
    photo = photo.resize((photo.width * UPSCALE, photo.height * UPSCALE), Image.LANCZOS)
    disc = np.asarray(photo).astype(np.float64)
    cx, cy, r = cx * UPSCALE, cy * UPSCALE, r * UPSCALE
    value_disc = value_of(disc, cx, cy, r)
    value = layout(value_disc, cx, cy, r, lon0)
    red = layout(redness_of(disc, cx, cy, r), cx, cy, r, lon0)
    lut = stops_lut(JUPITER_STOPS)
    colours = lut[np.round(value * (len(lut) - 1)).astype(int)]
    # the red the photograph has: pull the colour toward rust where it is red, most where it is dark
    rust = np.array([190.0, 82.0, 44.0])
    k = (np.clip(red, 0, 1) ** 1.5 * 0.85)[..., None] * (1.0 - 0.35 * value[..., None])
    colours = np.clip(colours * (1 - k) + rust * k * (0.55 + 0.6 * value[..., None]), 0, 255).astype(np.uint8)
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
