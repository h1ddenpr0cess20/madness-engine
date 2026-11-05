#!/usr/bin/env python3
"""
Builds src/textures/moon/relief.js: the surface of the Moon, from LRO LOLA
laser altimetry, as the frosting an etcher would leave for it.

    pip install pillow numpy
    python3 scripts/moon-relief.py ldem_16.img [out.js] [preview.png]

`ldem_16.img` is the LOLA gridded topography, LDEM_16 (16 pixels per degree,
5760 x 2880, 16-bit integers in metres), read with its PDS label `ldem_16.lbl`
beside it: the label gives the grid size, byte order, scale, offset and the
null value, so nothing is assumed about them.

Each pixel is lit from the north-west as shaded relief, 3x exaggerated, exactly
as `scripts/mars-relief.py` does for Mars, and the light is the frost: flat
ground is nearly clear, slopes facing the light are fully frosted and slopes
turned away are clear glass. The result is cut to 4096 x 2048 and stored as
one grayscale JPEG, 0 clear to 255 frosted, rows from 90N down and columns
from -180 east (the prime meridian in the middle).

LDEM columns run from 0 to 360 degrees east, so they are rolled half a turn
to put the near side's centre (longitude 0) in the middle, as Mars's are.
"""
import base64, io, os, re, sys
import numpy as np
from PIL import Image

MOON_RADIUS_M = 1737400.0
OUT_W, OUT_H = 4096, 2048
EXAGGERATION = 3.0


def read_label(path):
    """The PDS label beside the image: `KEY = value` lines, as a dict of strings."""
    text = open(os.path.splitext(path)[0] + ".lbl", errors="replace").read()
    fields = {}
    for key, value in re.findall(r'^\s*([A-Z_]+)\s*=\s*"?([^"\r\n]*?)"?\s*$', text, re.M):
        fields.setdefault(key, value.strip())
    return fields


def read_elevation(path):
    """The gridded topography in metres, with the label's nulls set to NaN."""
    label = read_label(path)
    lines, samples = int(label["LINES"]), int(label["LINE_SAMPLES"])
    bits = int(label.get("SAMPLE_BITS", "16"))
    order = ">" if label.get("SAMPLE_TYPE", "MSB_INTEGER").startswith("MSB") else "<"
    kind = "i" if "INTEGER" in label.get("SAMPLE_TYPE", "INTEGER") else "f"
    raw = np.fromfile(path, dtype=np.dtype(f"{order}{kind}{bits // 8}"), count=lines * samples)
    raw = raw.reshape(lines, samples).astype(np.float64)
    null = label.get("CORE_NULL", label.get("MISSING_CONSTANT"))
    missing = np.zeros(raw.shape, bool) if null is None else (raw == float(null))
    scale = float(label.get("SCALING_FACTOR", "1"))
    # HEIGHT = DN * SCALING_FACTOR, in the label's UNIT. OFFSET is the reference
    # radius, a constant, so it moves every pixel alike and leaves the slopes alone.
    metres = {"KILOMETER": 1000.0, "METER": 1.0}[label.get("UNIT", "METER")]
    elevation = raw * scale * metres
    elevation[missing] = np.nan
    return elevation


def frost_of(elevation):
    """The frost, 0 to 1, of each pixel: the relief lit from the north-west."""
    h, w = elevation.shape
    # Metres a pixel spans: north-south is constant, east-west shrinks with cos(latitude).
    lat = np.radians(90 - (np.arange(h) + 0.5) * 180 / h)
    dy = MOON_RADIUS_M * np.pi / h
    dx = (MOON_RADIUS_M * 2 * np.pi / w) * np.cos(lat)[:, None]
    z = np.where(np.isnan(elevation), np.nanmean(elevation), elevation)
    dz_east = np.gradient(z, axis=1)
    dz_north = -np.gradient(z, axis=0)  # rows run from the north pole south
    sx = EXAGGERATION * dz_east / np.maximum(dx, 1.0)
    sy = EXAGGERATION * dz_north / dy
    # Light from the north-west, 45 degrees up.
    lx, ly, lz = -0.5, 0.5, 0.7071
    shade = (lz - sx * lx - sy * ly) / np.sqrt(1 + sx * sx + sy * sy)
    return np.clip(0.1 + (shade - lz) * 3.4, 0, 1)


def main():
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(__file__), "..", "src", "textures", "moon", "relief.js")
    preview = sys.argv[3] if len(sys.argv) > 3 else None

    elevation = read_elevation(src)
    frost = np.roll(frost_of(elevation), elevation.shape[1] // 2, axis=1)
    im = Image.fromarray((frost * 255).astype(np.uint8), "L").resize((OUT_W, OUT_H), Image.BOX)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72, optimize=True)
    packed = base64.b64encode(buf.getvalue()).decode()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(f"""/**
 * The surface of the Moon as frost: LRO LOLA laser altimetry (LDEM_16, 16
 * pixels per degree, NASA / GSFC, public domain) shaded as relief from the
 * north-west by `scripts/moon-relief.py` and stored as a 4096 x 2048 grayscale
 * JPEG, 0 clear and 255 frosted, rows from 90N down, columns from -180 east.
 * Do not edit by hand.
 */
export const RELIEF_WIDTH = {OUT_W};
export const RELIEF_HEIGHT = {OUT_H};
export const RELIEF_JPEG = '{packed}';
""")
    if preview:
        im.resize((1400, 700), Image.LANCZOS).save(preview, "PNG")
    print(f"wrote {out}: {len(packed) // 1024} KB base64")


if __name__ == "__main__":
    main()
