"""
Drapes the human's shell garments on his body with Blender's cloth solver and
bakes where they settle onto the body's UV layout, so the engine builds each
garment in its draped shape instead of as the skin lifted off.

    node scripts/blender/export-human.mjs <workDir> tshirt jeans
    blender -b --factory-startup --python scripts/blender/bake_drape.py -- \\
        <workDir> tshirt,jeans --module src/people/human/data/drape.js [--preview]

`<workDir>` holds the OBJ files export-human.mjs writes (body-male.obj,
<garment>-male.obj). `--module` writes the engine's data module (DRAPE: for
each garment, how far each point of it moves from the cut to where the cloth
settles, as a vector on the body's layout). With --preview, each draped
garment is rendered on him with Cycles (`<garment>-preview.png`). `--size`
(512) is the layout's size in texels, `--frames` (60) how long it settles,
`--set key=value,...` overrides the cloth (CLOTH) for a trial run.

How a garment is draped: it is let out (`ease`: every point moved off the body
along its normal, and the cloth's springs rest at that larger size), held
where a real one is held (a collar, a waistband), and, if it is to bunch,
started a little longer than it is cut (`long`, drawn back to its cut over
the first frames, so the cloth between has more length than room). Then it
settles under gravity against the body and the floor: the shirt hangs from
the shoulders and falls loose off the chest and back, the jeans fall straight
from the seat and thighs and stack over the feet.
"""
import base64
import math
import os
import sys

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
TAG = opt("--tag", "", str)
SEX = "male"
# How far a point may move, in metres along each axis, at 0 or 255 of a channel.
RANGE = 0.08

# Each garment's cloth, after Blender's own presets (cotton, denim), and how it is held.
# `pin(x, y, z)`, in the engine's frame (y up, metres): the points held where they are cut.
# `ease`: how far it is let out off the body, metres. `long`: how much longer than it is cut it
# starts, top to bottom from `top`. `smooth`: blur steps over its points for the settled shape,
# so the folds kept are the broad ones its vertices can carry, not a crumple between them.
CLOTH = {
    "tshirt": dict(mass=0.15, tension=15, compression=1, shear=5, bending=0.05, ease=0.012, long=0.0, top=1.49,
                   smooth=4, over=["jeans"], pin=lambda x, y, z: y > 1.475),
    "jeans": dict(mass=0.4, tension=40, compression=2, shear=40, bending=2, ease=0.008, long=0.03, top=1.0,
                  smooth=2, pin=lambda x, y, z: y > 0.985),
}

for kv in (opt("--set", "", str).split(",") if "--set" in argv else []):
    k, v = kv.split("=")
    for spec in CLOTH.values():
        spec[k] = float(v)


def engine(p):
    """Blender's frame (z up) to the engine's (y up)."""
    return (p[0], p[2], -p[1])


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


def neighbours(me):
    nbrs = [[] for _ in me.vertices]
    for e in me.edges:
        a, b = e.vertices
        nbrs[a].append(b)
        nbrs[b].append(a)
    return nbrs


def blur(values, nbrs, iterations):
    """Spreads a vector per vertex over its neighbours, `iterations` times."""
    v = np.array(values, dtype=np.float64)
    for _ in range(iterations):
        v = np.array([(0.5 * v[i] + 0.5 * v[n].mean(axis=0)) if n else v[i] for i, n in enumerate(nbrs)])
    return v


def drape(name, under=None):
    spec = CLOTH[name]
    cloth = load(os.path.join(WORK, f"{name}-{SEX}.obj"))
    cloth.name = name
    # What it is worn over (garments draped before it, as they settled) is in the way, as the body is.
    for other, (points, faces) in (under or {}).items():
        mesh = bpy.data.meshes.new(other + "_under")
        mesh.from_pydata(points, [], faces)
        obj = bpy.data.objects.new(other + "_under", mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.modifiers.new("Collision", 'COLLISION')
        obj.collision.thickness_outer = 0.002
        obj.collision.cloth_friction = 8
        obj.hide_render = True
    me = cloth.data
    rest = [v.co.copy() for v in me.vertices]
    normals = [v.normal.copy() for v in me.vertices]

    pins = cloth.vertex_groups.new(name="pin")
    held = [v.index for v in me.vertices if spec["pin"](*engine(v.co))]
    pins.add(held, 1.0, 'REPLACE')
    print(f"{name}: {len(me.vertices)} points, {len(held)} held")

    # Let out: every free point off the body along its normal. The springs rest at this size, so
    # the cloth is that much bigger than the body and falls loose under its own weight.
    heldset = set(held)
    for i, v in enumerate(me.vertices):
        if i not in heldset:
            v.co = rest[i] + normals[i] * spec["ease"]
    # Longer than cut, drawn back to its cut length over the first frames by a shape key.
    if spec["long"]:
        k, top = spec["long"], spec["top"]
        start = [v.co.copy() for v in me.vertices]
        for v in me.vertices:
            v.co.z = top - (top - v.co.z) * (1 + k)
        cloth.shape_key_add(name="Basis")
        cut = cloth.shape_key_add(name="cut", from_mix=False)
        for i, p in enumerate(start):
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
    s.vertex_group_mass = "pin"
    s.pin_stiffness = 1
    c = mod.collision_settings
    c.distance_min = 0.002
    # Not against itself: the hems' turned edges lie closer than any self-collision distance keeps
    # cloth apart, and pushing them apart creases the whole garment.
    c.use_self_collision = False
    c.collision_quality = 4
    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end = FRAMES

    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, FRAMES
    for f in range(1, FRAMES + 1):
        scene.frame_set(f)

    ev = cloth.evaluated_get(bpy.context.evaluated_depsgraph_get())
    sim = [v.co.copy() for v in ev.data.vertices]
    move = blur([tuple(sim[i] - rest[i]) for i in range(len(rest))], neighbours(me), spec["smooth"])
    # Never into what it was cut over: what it covers is hidden under it, and must stay so.
    for i in range(len(rest)):
        n = np.array(normals[i])
        into = move[i] @ n
        if into < 0:
            move[i] -= into * n
    sim = [rest[i] + Vector(move[i]) for i in range(len(rest))]
    d = np.linalg.norm(move, axis=1)
    print(f"  {name}: moved median {np.median(d) * 1000:.1f} mm, 99% {np.percentile(d, 99) * 1000:.1f} mm, max {d.max() * 1000:.1f} mm")
    return cloth, sim, move


def bake(cloth, move):
    """
    Bakes `move` (per vertex, Blender's frame) onto the garment's UVs through an emission shader,
    as the engine's frame, and returns it as rows of bytes (top row first, as the engine's canvases
    are; three per texel, 128 still, 0 and 255 RANGE metres either way), cropped to the garment.
    """
    me = cloth.data
    attr = me.color_attributes.new("move", 'FLOAT_COLOR', 'POINT')
    for i, m in enumerate(move):
        e = engine(m)
        attr.data[i].color = tuple(0.5 + 0.5 * max(-1, min(1, e[k] / RANGE)) for k in range(3)) + (1.0,)

    img = bpy.data.images.new(cloth.name + "_move", SIZE, SIZE, float_buffer=True, alpha=True)
    img.colorspace_settings.name = 'Non-Color'
    mat = bpy.data.materials.new(cloth.name + "_bake")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    col = nt.nodes.new('ShaderNodeVertexColor')
    col.layer_name = "move"
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
    # Bake on the garment as cut (the solver and shape keys off): the UVs are the same either way.
    cloth.modifiers["Cloth"].show_render = cloth.modifiers["Cloth"].show_viewport = False
    cloth.hide_render = False
    if me.shape_keys:
        cloth.shape_key_clear()
    bpy.ops.object.select_all(action='DESELECT')
    cloth.select_set(True)
    bpy.context.view_layer.objects.active = cloth
    bpy.ops.object.bake(type='EMIT', margin=6, margin_type='EXTEND', use_clear=True)

    px = np.array(img.pixels[:], dtype=np.float32).reshape(SIZE, SIZE, 4)[::-1]  # Blender's rows run bottom up
    covered = px[..., :3].max(axis=2) > 0.002  # the bake clears what it does not reach to black
    rows, cols = np.nonzero(covered)
    y0, y1, x0, x1 = rows.min(), rows.max() + 1, cols.min(), cols.max() + 1
    rgb = np.where(covered[..., None], px[..., :3], 0.5)[y0:y1, x0:x1]
    data = np.clip(np.round(rgb * 255), 0, 255).astype(np.uint8)
    print(f"  {cloth.name}: {covered.sum()} texels, cropped to {x1 - x0}x{y1 - y0} at ({x0}, {y0})")
    return dict(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0), data=data)


def write_module(path, bakes):
    entries = []
    for name, b in bakes.items():
        data = base64.b64encode(b["data"].tobytes()).decode("ascii")
        entries.append(f'  {name}: {{ x: {b["x"]}, y: {b["y"]}, w: {b["w"]}, h: {b["h"]}, data: \'{data}\' }},')
    text = f"""// Generated by scripts/blender/bake_drape.py: where each shell garment settles when Blender's
// cloth solver drapes it on his body. Do not edit by hand. Each is a move on the body's UV layout
// at SIZE texels square (rows top first), cropped to the texels the garment covers (`x`, `y`,
// `w`, `h`): three bytes a texel (x, y, z in the engine's frame), base64, 128 still, 0 and 255
// RANGE metres either way.
export const SIZE = {SIZE};
export const RANGE = {RANGE};
export const DRAPE = {{
{chr(10).join(entries)}
}};
"""
    with open(path, "w") as f:
        f.write(text)
    print("wrote", path)


def preview(body, name, sim, out_path):
    """A Cycles render of the draped garment on him, from the front and a little to his left."""
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
    top, bottom = max(p.z for p in sim), min(p.z for p in sim)
    mid, span = (top + bottom) / 2, max(top - bottom, 0.5)
    d = span * 2.6
    cam.location = Vector((d * 0.45, -d * 0.9, mid + 0.05))
    cam.rotation_euler = (Vector((0, 0, mid)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
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
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print("  wrote", out_path)


bakes, worn = {}, {}
# What goes under first, so what goes over is draped over it as it settled.
for name in sorted(NAMES, key=lambda n: len(CLOTH[n].get("over", []))):
    reset()
    body = load(os.path.join(WORK, f"body-{SEX}.obj"))
    body.name = "body"
    body.modifiers.new("Collision", 'COLLISION')
    body.collision.thickness_outer = 0.001
    body.collision.cloth_friction = 8
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0))  # the floor, for hems that reach it
    floor = bpy.context.active_object
    floor.modifiers.new("Collision", 'COLLISION')
    floor.hide_render = True
    under = {o: worn[o] for o in CLOTH[name].get("over", []) if o in worn}
    cloth, sim, move = drape(name, under)
    worn[name] = ([tuple(p) for p in sim], [tuple(f.vertices) for f in cloth.data.polygons])
    if PREVIEW:
        preview(body, name, sim, os.path.join(WORK, f"{name}{TAG}-preview.png"))
    bakes[name] = bake(cloth, move)

if MODULE:
    write_module(MODULE, bakes)
