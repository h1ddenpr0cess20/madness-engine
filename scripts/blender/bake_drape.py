"""
Drapes the human's garments on his body with Blender's cloth solver and keeps
where their cloth settles, so the engine builds each one draped.

    node scripts/blender/export-human.mjs <workDir>
    blender -b --factory-startup --python scripts/blender/bake_drape.py -- \\
        <workDir> male/jeans,male/tshirt,... [--preview] [--frames 60]
    node scripts/blender/pack-drape.mjs <workDir>      # writes src/people/human/data/drape.js

`<workDir>` holds what export-human.mjs writes (body-male.obj and
<sex>-<garment>.obj, the garments as the engine cuts them). For each garment
named (as `sex/name`, in the order given) this writes `<sex>-<name>.drape.json`
(its cloth's points, about SAMPLE apart, and how far each moved) and
`<sex>-<name>.draped.obj` (its settled shape, for what is worn over it to
drape against). With --preview, a Cycles render of it on him too
(`<sex>-<name>.png`). Name a garment after what it is worn over, so that is
already draped (see OVER); whatever is not yet draped is left out.

How a garment is draped: its cloth (no trims; they follow it in the engine)
is let out a little off the body (`ease`), its springs at rest at that size,
and held along its top (a collar, a waistband, a skirt's waist), as a real one
hangs from its wearer. It then settles under gravity for `--frames` frames
against his body, the floor, and what it is worn over, as the cloth it is
(CLOTH). Where it settles, against where it was cut, lightly smoothed, and
never in toward what it covers, is its move.
"""
import json
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WORK = os.path.abspath(argv[0] if argv else "blender-work")
NAMES = (argv[1] if len(argv) > 1 else "male/jeans").split(",")


def opt(name, default, cast=int):
    return cast(argv[argv.index(name) + 1]) if name in argv else default


FRAMES = opt("--frames", 60)
PREVIEW = "--preview" in argv
# How far apart (metres) the points kept of each garment's cloth are.
SAMPLE = 0.015

# The cloths, after Blender's own presets: (mass kg/m², tension, compression, shear, bending), and how far each is let out.
KNIT = dict(mass=0.15, tension=15, compression=1, shear=5, bending=0.05, ease=0.006)
HEAVY_KNIT = dict(mass=0.3, tension=20, compression=3, shear=8, bending=0.4, ease=0.006)
SHIRTING = dict(mass=0.15, tension=25, compression=4, shear=8, bending=0.2, ease=0.005)
DENIM = dict(mass=0.4, tension=40, compression=4, shear=40, bending=2, ease=0.005)
WOOL = dict(mass=0.3, tension=30, compression=4, shear=20, bending=1.5, ease=0.004)
LEATHER = dict(mass=0.6, tension=80, compression=10, shear=60, bending=10, ease=0.003)
GI = dict(mass=0.3, tension=30, compression=4, shear=20, bending=1, ease=0.006)
FLOWING = dict(mass=0.12, tension=10, compression=1, shear=4, bending=0.03, ease=0.004)

CLOTH = {
    "tshirt": KNIT, "tank": KNIT, "sweater": HEAVY_KNIT, "hoodie": HEAVY_KNIT,
    "dressShirt": SHIRTING, "giTop": GI, "giPants": GI,
    "jacket": LEATHER, "jacketZipped": LEATHER,
    "denimJacket": DENIM, "denimJacketButtoned": DENIM, "jeans": DENIM, "shorts": DENIM,
    "blazer": WOOL, "blazerButtoned": WOOL, "trousers": WOOL,
    "dress": FLOWING, "miniDress": FLOWING, "skirt": FLOWING, "miniSkirt": FLOWING,
}
# What each is worn over, as it would be, to drape against.
OVER = {
    "tshirt": ["jeans"], "tank": ["jeans"],
    "sweater": ["jeans", "tshirt"], "hoodie": ["jeans", "tshirt"],
    "jacket": ["jeans", "tshirt"], "jacketZipped": ["jeans", "tshirt"],
    "denimJacket": ["jeans", "tshirt"], "denimJacketButtoned": ["jeans", "tshirt"],
    "trousers": ["dressShirt"], "blazer": ["trousers", "dressShirt"], "blazerButtoned": ["trousers", "dressShirt"],
    "giTop": ["giPants"],
}
# How far down from a piece's top it is held (metres): a collar or waistband's depth.
HOLD = 0.02
# Points further out than this either side (metres) are a sleeve's, not the trunk's.
ARM = 0.22


def engine(p):
    """Blender's frame (z up) to the engine's (y up)."""
    return (p[0], p[2], -p[1])


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.use_denoising = False
    return scene


def load(path):
    """The OBJ at `path`, its objects joined into one, in Blender's frame, its points welded where they were split."""
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.obj_import(filepath=path, forward_axis='NEGATIVE_Z', up_axis='Y')
    objs = list(bpy.context.selected_objects)
    bpy.context.view_layer.objects.active = objs[0]
    # Each piece's own top, held: before the pieces are joined, so a dress's skirt is held at its waist.
    # And a sleeve's end, on the wrist or the arm, as its cuff holds it: else it slides off the hand.
    for o in objs:
        co = [v.co for v in o.data.vertices]  # the importer has not turned the points yet: y is up
        top = max(c.y for c in co)
        arm = [c.y for c in co if abs(c.x) > ARM]
        cuff = min(arm) + HOLD if arm and top - min(arm) < 0.75 else -1
        g = o.vertex_groups.new(name="pin")
        # Long trousers by their hems too, on the instep: else a close pair slides down and piles up there.
        bottom = min(c.y for c in co)
        hem = bottom + HOLD if top < 1.1 and bottom < 0.2 else -1
        g.add([i for i, c in enumerate(co) if c.y > top - HOLD or (abs(c.x) > ARM and c.y < cuff) or c.y < hem], 1.0, 'REPLACE')
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.shade_smooth()
    return obj


def collider(obj, thickness):
    obj.modifiers.new("Collision", 'COLLISION')
    obj.collision.thickness_outer = thickness
    obj.collision.cloth_friction = 8
    obj.hide_render = True


def blur(values, me, iterations):
    nbrs = [[] for _ in me.vertices]
    for e in me.edges:
        a, b = e.vertices
        nbrs[a].append(b)
        nbrs[b].append(a)
    v = np.array(values, dtype=np.float64)
    for _ in range(iterations):
        v = np.array([(0.5 * v[i] + 0.5 * v[n].mean(axis=0)) if n else v[i] for i, n in enumerate(nbrs)])
    return v


def drape(key):
    sex, name = key.split("/")
    spec = CLOTH[name]
    reset()
    body = load(os.path.join(WORK, "body-male.obj"))
    collider(body, 0.001)
    bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0))
    collider(bpy.context.active_object, 0.001)
    under = [o for o in OVER.get(name, []) if os.path.exists(os.path.join(WORK, f"{sex}-{o}.draped.obj"))]
    for o in under:
        collider(load(os.path.join(WORK, f"{sex}-{o}.draped.obj")), 0.002)

    cloth = load(os.path.join(WORK, f"{sex}-{name}.obj"))
    me = cloth.data
    rest = np.array([tuple(v.co) for v in me.vertices])
    normals = np.array([tuple(v.normal) for v in me.vertices])
    held = {v.index for v in me.vertices if any(g.weight > 0.5 for g in v.groups)}
    # Let out: every free point off the body along its normal; the cloth's springs rest at that size.
    for i, v in enumerate(me.vertices):
        if i not in held:
            v.co = Vector(rest[i] + normals[i] * spec["ease"])

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
    c = mod.collision_settings
    c.distance_min = 0.002
    # Not against itself: turned hems lie closer than any self-collision distance keeps cloth apart.
    c.use_self_collision = False
    c.collision_quality = 4
    mod.point_cache.frame_end = FRAMES
    scene = bpy.context.scene
    scene.frame_end = FRAMES
    for f in range(1, FRAMES + 1):
        scene.frame_set(f)

    ev = cloth.evaluated_get(bpy.context.evaluated_depsgraph_get())
    sim = np.array([tuple(v.co) for v in ev.data.vertices])
    move = blur(sim - rest, me, 6)
    # Never in toward what it covers: that is hidden under it, and must stay so.
    into = np.einsum("ij,ij->i", move, normals)
    move -= np.minimum(into, 0)[:, None] * normals
    settled = rest + move
    d = np.linalg.norm(move, axis=1)
    print(f"{key}: {len(rest)} points, {len(held)} held, over {under or 'nothing'}; "
          f"moved median {np.median(d) * 1000:.1f} mm, 99% {np.percentile(d, 99) * 1000:.1f} mm")

    # Its settled shape, for what is worn over it.
    mesh = bpy.data.meshes.new("draped")
    mesh.from_pydata([tuple(p) for p in settled], [], [tuple(p.vertices) for p in me.polygons])
    out = bpy.data.objects.new(f"{name}_draped", mesh)
    scene.collection.objects.link(out)
    bpy.ops.object.select_all(action='DESELECT')
    out.select_set(True)
    bpy.context.view_layer.objects.active = out
    bpy.ops.wm.obj_export(filepath=os.path.join(WORK, f"{sex}-{name}.draped.obj"), export_selected_objects=True,
                          forward_axis='NEGATIVE_Z', up_axis='Y', export_uv=False, export_normals=False, export_materials=False)

    # Its points, one to each SAMPLE-sized cell (their mean), in the engine's frame, and their moves.
    P = np.array([engine(p) for p in rest])
    M = np.array([engine(m) for m in move])
    cells = {}
    for i, k in enumerate(map(tuple, np.floor(P / SAMPLE).astype(np.int64))):
        cells.setdefault(k, []).append(i)
    points = [P[ix].mean(axis=0).tolist() for ix in cells.values()]
    moves = [M[ix].mean(axis=0).tolist() for ix in cells.values()]
    with open(os.path.join(WORK, f"{sex}-{name}.drape.json"), "w") as f:
        json.dump({"points": points, "moves": moves}, f)
    print(f"  {len(points)} points kept")

    if PREVIEW:
        preview(body, cloth, out, os.path.join(WORK, f"{sex}-{name}.png"))


def preview(body, cloth, draped, path):
    scene = bpy.context.scene
    cloth.hide_render = True
    body.hide_render = False

    def mat(colour, rough):
        m = bpy.data.materials.new(f"m{colour}")
        m.use_nodes = True
        bsdf = m.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
        bsdf.inputs["Roughness"].default_value = rough
        return m

    draped.data.materials.append(mat((0.75, 0.75, 0.72), 0.9))
    draped.data.shade_smooth()
    body.data.materials.append(mat((0.55, 0.38, 0.3), 0.5))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    zs = [v.co.z for v in draped.data.vertices]
    mid, span = (max(zs) + min(zs)) / 2, max(max(zs) - min(zs), 0.5)
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
    scene.render.resolution_x, scene.render.resolution_y = 360, 480
    scene.cycles.samples = 16
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


for key in NAMES:
    drape(key)
