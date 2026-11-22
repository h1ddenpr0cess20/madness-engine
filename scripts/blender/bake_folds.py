"""
Drapes the human's shell garments on his body with Blender's cloth solver and
bakes the folds they fall into onto the body's UV layout, for the engine.

    node scripts/blender/export-human.mjs <workDir> tshirt jeans
    blender -b --factory-startup --python scripts/blender/bake_folds.py -- \
        <workDir> tshirt,jeans --module src/people/human/data/folds.js [--preview]

`<workDir>` holds the OBJ files export-human.mjs writes (body-male.obj,
<garment>-male.obj). `--module` writes the engine's data module (FOLDS: each
garment's folds as a height on the body's layout); each garment's folds are
also written as a picture to look at (`<garment>-folds.png`) and, with
--preview, a Cycles render of the draped garment on him
(`<garment>-preview.png`). `--size` (512) is the layout's size in texels,
`--frames` (60) how long the cloth settles.

How a fold is made: each garment starts a little longer than it is cut, top
to bottom, and its springs rest at that length; its held edges (a waistband,
a collar, a shirt's hem on the hips) are then drawn back to where the cut
puts them. The cloth between has more length than room and, under gravity
and against the body (and the floor, for a hem that reaches it), buckles:
the jeans stack over the feet and crease behind the knees, the shirt bunches
over the hips and folds under the arms. Where the cloth then lies, against
where it was cut, along its normal, is a height; its broad part (how far the
whole garment slid or sagged) is taken off by blurring that height over the
garment and subtracting, leaving only the folds. That is baked through an
emission shader onto the garment's UVs, which are the body's.
"""
import math
import os
import sys

import base64

import bmesh
import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WORK = os.path.abspath(argv[0] if argv else "blender-work")
NAMES = (argv[1] if len(argv) > 1 else "tshirt,jeans").split(",")


def opt(name, default, cast=int):
    return cast(argv[argv.index(name) + 1]) if name in argv else default


SIZE = opt("--size", 512)
FRAMES = opt("--frames", 60)
PREVIEW = "--preview" in argv
MODULE = opt("--module", None, str)
SEX = "male"
# The height that white (or black) stands for, in metres either way of 0.5.
RANGE = 0.02

# Each garment's cloth, after Blender's own presets (cotton, denim), and how it is held.
# `pin(x, y, z)`, in the engine's frame (y up, metres): the points held where they are cut (a
# waistband, a collar, a hem resting on the hips). `long`: how much longer than the space it is
# cut for the cloth is, top to bottom, measured from `top` (the springs' rest lengths come from
# that longer shape, so between its held edges the cloth has more length than room, and folds).
# `grow`: the same all round (the solver's shrink, negated). `smooth`: how broad a height counts
# as the garment's lie and not a fold (steps of a blur over its points, about 1 cm each).
CLOTH = {
    "tshirt": dict(mass=0.15, tension=15, compression=1, shear=5, bending=0.05, grow=0.0, long=0.04, top=1.49, smooth=40,
                   pin=lambda x, y, z: y > 1.475 or y < 0.9),
    "jeans": dict(mass=0.4, tension=40, compression=2, shear=40, bending=2, grow=0.0, long=0.04, top=1.0, smooth=40,
                  pin=lambda x, y, z: y > 0.985),
}


# `--set key=value,...` overrides the garments' cloth, for trying settings out.
for kv in (opt("--set", "", str).split(",") if "--set" in argv else []):
    k, v = kv.split("=")
    for spec in CLOTH.values():
        spec[k] = float(v)
TAG = opt("--tag", "", str)


def engine(p):
    """Blender's frame (z up) to the engine's (y up), as the OBJ importer turned it."""
    return (p.x, p.z, -p.y)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.use_denoising = False
    return scene


def load(path):
    bpy.ops.wm.obj_import(filepath=path, forward_axis='NEGATIVE_Z', up_axis='Y')
    obj = bpy.context.selected_objects[0]
    # The importer turns the object, not its points: bake the turn in, so its points are in Blender's frame.
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # The engine splits points along UV seams; weld them so the cloth is one sheet (each corner keeps its UV).
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.shade_smooth()
    return obj


def smooth_scalar(obj, values, iterations):
    """Spreads a value per vertex over its neighbours, `iterations` times (a Laplacian blur over the mesh)."""
    me = obj.data
    nbrs = [[] for _ in me.vertices]
    for e in me.edges:
        a, b = e.vertices
        nbrs[a].append(b)
        nbrs[b].append(a)
    v = list(values)
    for _ in range(iterations):
        v = [(0.5 * v[i] + 0.5 * sum(v[j] for j in n) / len(n)) if n else v[i] for i, n in enumerate(nbrs)]
    return v


def drape(name, body):
    spec = CLOTH[name]
    cloth = load(os.path.join(WORK, f"{name}-{SEX}.obj"))
    cloth.name = name
    me = cloth.data
    rest = [v.co.copy() for v in me.vertices]
    normals = [v.normal.copy() for v in me.vertices]

    pins = cloth.vertex_groups.new(name="pin")
    held = [v.index for v in me.vertices if spec["pin"](*engine(v.co))]
    pins.add(held, 1.0, 'REPLACE')
    print(f"{name}: {len(me.vertices)} points, {len(held)} pinned")

    # The cloth starts longer than it is cut (stretched down from `top`; Blender's z is the engine's y),
    # and its springs rest at that length. A shape key then draws it back to its cut over the first
    # frames, and the held points follow the key (pins go where the mesh under the cloth goes), so the
    # cloth between them is left with more length than room.
    if spec["long"]:
        k, top = spec["long"], spec["top"]
        for v in me.vertices:
            v.co.z = top - (top - v.co.z) * (1 + k)
        cloth.shape_key_add(name="Basis")
        cut = cloth.shape_key_add(name="cut", from_mix=False)
        for i, p in enumerate(rest):
            cut.data[i].co = p
        cut.value = 0
        cut.keyframe_insert("value", frame=1)
        cut.value = 1
        cut.keyframe_insert("value", frame=max(2, FRAMES // 3))

    mod = cloth.modifiers.new("Cloth", 'CLOTH')
    s = mod.settings
    s.quality = 10
    s.mass = spec["mass"]
    s.tension_stiffness = spec["tension"]
    s.compression_stiffness = spec["compression"]
    s.shear_stiffness = spec["shear"]
    s.bending_stiffness = spec["bending"]
    s.air_damping = 1
    s.shrink_min = -spec["grow"]
    s.vertex_group_mass = "pin"
    s.pin_stiffness = 1
    c = mod.collision_settings
    c.distance_min = spec.get("distance", 0.001)
    # Not against itself: the hems' turned edges lie closer than any self-collision distance keeps
    # cloth apart, and pushing them apart creases the whole garment.
    c.use_self_collision = spec.get("self", 0) > 0
    c.self_distance_min = spec.get("self_distance", 0.0005)
    c.collision_quality = 4
    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end = FRAMES

    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, FRAMES
    for f in range(1, FRAMES + 1):
        scene.frame_set(f)
        if f % 10 == 0:
            print(f"  {name}: frame {f}/{FRAMES}")

    dg = bpy.context.evaluated_depsgraph_get()
    ev = cloth.evaluated_get(dg)
    sim = [v.co.copy() for v in ev.data.vertices]

    # The height of each point off the garment as cut, along its normal; then the folds alone.
    height = [(sim[i] - rest[i]).dot(normals[i]) for i in range(len(rest))]
    broad = smooth_scalar(cloth, height, spec["smooth"])
    folds = [max(-RANGE, min(RANGE, h - b)) for h, b in zip(height, broad)]
    srt = sorted(folds)
    pct = lambda q: srt[int(q * (len(srt) - 1))] * 1000
    moved = sorted((sim[i] - rest[i]).length for i in range(len(rest)))
    print(f"  {name}: folds 1/50/99%: {pct(0.01):.1f} {pct(0.5):.1f} {pct(0.99):.1f} mm; "
          f"moved median {moved[len(moved) // 2] * 1000:.1f} mm, max {moved[-1] * 1000:.1f} mm")
    return cloth, sim, folds


def bake(cloth, folds):
    """
    Bakes `folds` (per vertex) onto the garment's UVs through an emission shader, and returns it as
    rows of bytes, top row first as the engine's canvases are (128 the cloth as cut, 0 and 255 RANGE
    in and out), cropped to the texels the garment covers.
    """
    me = cloth.data
    attr = me.color_attributes.new("folds", 'FLOAT_COLOR', 'POINT')
    for i, f in enumerate(folds):
        # Red marks the texels the garment covers (the bake clears the rest to black); green is the height.
        attr.data[i].color = (1.0, 0.5 + 0.5 * f / RANGE, 0.0, 1.0)

    img = bpy.data.images.new(cloth.name + "_folds", SIZE, SIZE, float_buffer=True, alpha=True)
    img.colorspace_settings.name = 'Non-Color'

    mat = bpy.data.materials.new(cloth.name + "_bake")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    col = nt.nodes.new('ShaderNodeVertexColor')
    col.layer_name = "folds"
    emit = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(col.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    nt.nodes.active = tex
    me.materials.clear()
    me.materials.append(mat)

    scene = bpy.context.scene
    scene.cycles.samples = 1
    # Bake the cloth as cut (the solver off): the UVs are the same either way, and the cut has no tangles.
    cloth.modifiers["Cloth"].show_render = False
    cloth.modifiers["Cloth"].show_viewport = False
    bpy.ops.object.select_all(action='DESELECT')
    cloth.select_set(True)
    bpy.context.view_layer.objects.active = cloth
    bpy.ops.object.bake(type='EMIT', margin=4, margin_type='EXTEND', use_clear=True)

    px = np.array(img.pixels[:], dtype=np.float32).reshape(SIZE, SIZE, 4)[::-1]  # Blender's rows run bottom up
    covered = px[..., 0] > 0.5
    height = np.where(covered, px[..., 1], 0.5)
    rows, cols = np.nonzero(covered)
    y0, y1, x0, x1 = rows.min(), rows.max() + 1, cols.min(), cols.max() + 1
    data = np.clip(np.round(height[y0:y1, x0:x1] * 255), 0, 255).astype(np.uint8)
    print(f"  {cloth.name}: {covered.sum()} texels, cropped to {x1 - x0}x{y1 - y0} at ({x0}, {y0})")
    return dict(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0), data=data)


def picture(name, baked, path):
    """The baked folds as a picture to look at (grey, its contrast tripled), for checking a bake by eye."""
    img = bpy.data.images.new(name + "_look", baked["w"], baked["h"], alpha=False)
    g = np.clip((baked["data"][::-1].astype(np.float32) / 255 - 0.5) * 3 + 0.5, 0, 1)
    img.pixels[:] = np.dstack([g, g, g, np.ones_like(g)]).ravel()
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()


def write_module(path, bakes):
    """Writes the engine's data module: each garment's folds, as base64 bytes with where they sit on the layout."""
    entries = []
    for name, b in bakes.items():
        data = base64.b64encode(b["data"].tobytes()).decode("ascii")
        entries.append(f'  {name}: {{ x: {b["x"]}, y: {b["y"]}, w: {b["w"]}, h: {b["h"]}, data: \'{data}\' }},')
    text = f"""// Generated by scripts/blender/bake_folds.py: the folds the shell garments fall into when
// Blender's cloth solver drapes them on his body. Do not edit by hand. Each is a height on the
// body's UV layout at SIZE texels square (rows top first), cropped to the texels the garment
// covers (`x`, `y`, `w`, `h`): a byte each, base64, 128 the garment as cut, 0 and 255
// RANGE metres in and out.
export const SIZE = {SIZE};
export const RANGE = {RANGE};
export const FOLDS = {{
{chr(10).join(entries)}
}};
"""
    with open(path, "w") as f:
        f.write(text)
    print("wrote", path)


def preview(body, name, sim, out_path):
    """A Cycles render of the draped garment (its settled shape) on him, from the front and a little to his left."""
    scene = bpy.context.scene
    mesh = bpy.data.meshes.new(name + "_draped")
    src = bpy.data.objects[name].data
    mesh.from_pydata([tuple(p) for p in sim], [], [tuple(p.vertices) for p in src.polygons])
    mesh.shade_smooth()
    draped = bpy.data.objects.new(name + "_draped", mesh)
    scene.collection.objects.link(draped)
    bpy.data.objects[name].hide_render = True

    def mat(colour, rough):
        m = bpy.data.materials.new(f"preview{colour}")
        m.use_nodes = True
        bsdf = m.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
        bsdf.inputs["Roughness"].default_value = rough
        return m

    draped.data.materials.append(mat((0.75, 0.75, 0.72), 0.9))
    body.data.materials.clear()
    body.data.materials.append(mat((0.55, 0.38, 0.3), 0.5))

    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    top = max(engine(p)[1] for p in sim)
    bottom = min(engine(p)[1] for p in sim)
    mid = (top + bottom) / 2
    span = max(top - bottom, 0.5)
    cam.data.lens = 50
    d = span * 2.6
    cam.location = Vector((d * 0.45, -d * 0.9, mid + 0.05))
    look = Vector((0, 0, mid)) - cam.location
    cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
    scene.world = world
    scene.render.resolution_x, scene.render.resolution_y = 480, 640
    scene.cycles.samples = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_depth = '8'
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print("  wrote", out_path)


bakes = {}
for name in NAMES:
    reset()
    body = load(os.path.join(WORK, f"body-{SEX}.obj"))
    body.name = "body"
    body.modifiers.new("Collision", 'COLLISION')
    body.collision.thickness_outer = 0.001
    body.collision.cloth_friction = 8
    # The floor, for the hems that reach it.
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.modifiers.new("Collision", 'COLLISION')
    floor.hide_render = True
    cloth, sim, folds = drape(name, body)
    bakes[name] = bake(cloth, folds)
    picture(name, bakes[name], os.path.join(WORK, f"{name}{TAG}-folds.png"))
    if PREVIEW:
        preview(body, name, sim, os.path.join(WORK, f"{name}{TAG}-preview.png"))

if MODULE:
    write_module(MODULE, bakes)
