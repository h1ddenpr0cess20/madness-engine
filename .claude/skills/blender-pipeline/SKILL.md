---
name: blender-pipeline
description: Use when making or importing Blender-made assets (glTF/GLB), building modular city kits, baking textures or LODs, or upgrading the Madness engine's renderer to load and show such assets at high quality. Covers the Blender-to-engine conventions, headless Blender scripting, and the ordered engine roadmap.
---

# Blender pipeline for the Madness engine

## 1. Goal and the split of work

Blender makes the content; the engine renders it. Models, LODs, collision
shapes, texture sets and city kit pieces are authored in Blender and exported
as **glTF 2.0 binary (`.glb`)**. The engine loads the files at runtime and
draws them with its own renderer. Blender never ships inside a game.

Interchange rules:

- Blender authors in meters, Z up. glTF is meters, Y up. The exporter converts
  the axes; the engine never sees Blender's Z-up.
- Materials are PBR metallic-roughness, so the engine's `MeshStandardMaterial`
  and `MeshPhysicalMaterial` can read them.
- The engine decides scale. The city uses one engine unit (a "tile") for
  `SCALE = 4` meters (`3d-city/src/city/config.js`). A loader takes
  a scale option; do not hard-code meters.

### Where the engine stands (checked in the repo; re-verify before relying on it)

- **No glTF loader.** No `GLTFLoader`, GLB parser or glTF code under `src/`.
  A case-insensitive grep for `gltf`, `.glb` and `GLTFLoader` matches five data
  files (`src/textures/mars/relief.js`, `src/textures/coin/logo.js`,
  `src/textures/moon/relief.js`, `src/textures/jupiter/layout.js`,
  `src/people/human/data/shapes-female.js`), none of them loader code. The
  loader is **to build**.
- **No KTX2 / Basis transcoder.** Textures are procedural (`src/textures/`) or
  raw images. Compressed textures are **to build**.
- **Instancing exists.** `InstancedMesh` (`src/gfx/core.js`). Each copy has two
  vec4 attributes, `instancePlace` (where and how turned) and `instanceLook`
  (scale and tint), per `src/gfx/webgpu.js`.
- **Shadows.** One directional shadow map with PCF (`src/gfx/renderer.js`); the
  renderer samples only the first directional shadow.
- **Depth.** WebGPU uses `depthCompare: 'less-equal'` with a standard, not
  reversed, depth buffer (`src/gfx/webgpu.js`).
- **Anti-aliasing.** WebGPU uses 4x MSAA (`const SAMPLES = 4`). No FXAA or TAA.
- **Environment and filtering.** PMREM prefiltering (`src/gfx/pmrem.js`) and
  mipmaps with up to 16x anisotropy (`_sampler` in `src/gfx/webgpu.js`).
- **Culling.** Frustum culling per object and per instanced mesh
  (`src/gfx/renderer.js`). No GPU culling.
- **LOD.** The city toggles `mesh.visible` by distance in `chooseLods`
  (`src/city/scene.js`), with `RANGE` in meters: `hi` 260, `near` 650, `lo` 1500.
- **Post-processing.** No bloom, SSAO, tone-mapping pass or grading was found.
  Materials have a `toneMapped` flag (`src/gfx/core.js`), and the transmission
  buffer is an `rgba16float` mipped offscreen target (`src/gfx/webgpu.js`),
  the pattern for an HDR post stack.
- **Backends.** WebGPU (`src/gfx/webgpu.js`) and WebGL 2 (`src/gfx/webgl.js`).
  `?renderer=webgl` pins WebGL (engine README).

### The city today (`the 3d-city repo (h1ddenpr0cess20/3d-city)`)

- `src/city/buildings.js` turns footprints into walls. Each wall edge becomes one
  textured quad per story band (the `builder.quad` call in the wall loop). The
  facade texture repeats once per story and once per bay, with whole numbers of
  each so windows land on corners. Roofs are separate quads.
- Walls collide as two triangles per edge (`builder.collide`, same file).
- Tiles stream from Web Workers: `src/city/stream.js` creates
  `metro.worker.js`, which builds each tile at runtime.
- `CHUNK = 320` meters (`src/city/config.js`) is the unit of culling and loading.
- Facade looks: `src/city/looks.js`, with the engine's `textures/facades` and
  `textures/town`.

## 2. Running Blender

Blender is not installed here (`which blender` finds nothing).

**Cloud container (headless).** Install with `apt-get install -y blender`
(may be an older 3.x or 4.x build), or unpack the official Linux tarball from
`download.blender.org` into an empty directory. If the proxy refuses the
download, read `/root/.ccr/README.md`. Never disable TLS verification.

Run scripts in background mode, with arguments after `--`:

```sh
blender -b --factory-startup --python /path/to/export_kit.py -- /path/out kit_brick
```

- `--factory-startup` ignores the user's add-ons and preferences, so runs repeat.
- Only scripted, headless work is possible here. There is no window.
- Previews and bakes should use **Cycles on the CPU** (`scene.cycles.device =
  'CPU'`). Eevee needs an OpenGL context, which a container without a GPU often
  lacks, so Eevee previews can fail. A quick preview:
  `blender -b scene.blend -E CYCLES -f 1` renders frame 1 to the output path.

**Interactive on the user's machine.** Model, sculpt and develop looks in the
GUI. Keep every export step in a script under the repo (for example
`scripts/blender/`) so a later session can rerun it. Commit `.blend` sources
only when the user asks.

## 3. Asset conventions

**Units and axes.** Scene unit scale 1.0, metric; a door is about 2.1 m. Export
with `export_yup=True`: Blender X stays X, and Blender Z becomes glTF Y. City
footprints use x east and z south, with the map center at (0, 0)
(`3d-city/README.md`). Blender uses Y north, so a point at the same
place on the map has `z_city = -y_blender`. Check one known building before
trusting a placement.

**Origin.** Each piece's origin is at the center of its base; kit modules use a
base corner. Set it with `origin_set(type='ORIGIN_CURSOR')` after placing the
3D cursor at the base.

**Names.** Object names become file names:
- `<kit>_<piece>_<variant>` for the visual mesh, for example `brick_bay_plain_01`.
- `<name>_LOD1`, `_LOD2`, `_LOD3` for lower LODs. LOD0 has no suffix.
- `<name>-col` for the collision mesh, exported as a separate simplified file
  (`brick_bay_plain_01-col.glb`).

**Materials.** Principled BSDF only, so the exporter writes metallic-roughness.
Each material gets one baked set:

| Map | Format | Notes |
|---|---|---|
| Base color | sRGB PNG or JPEG (KTX2 later) | Color only; no baked lighting. |
| Normal | linear PNG | Tangent space; `export_tangents=True`. |
| ORM | linear PNG | Occlusion in R, roughness in G, metallic in B (the glTF convention). |

Blender's exporter does not pack channels, so combine AO, roughness and
metallic into the ORM image yourself.

**Texel density (starting targets; tune against screenshots).**

| Use | Target | Typical texture |
|---|---|---|
| Hero prop, near the ball | 256 px/m | 1024 or 2048 per set |
| Mid-distance kit | 128 px/m | 512 or 1024 |
| Far city and background | 32 px/m | 256, packed in an atlas |

Use power-of-two sizes.

**LOD triangle budgets (starting points).**

| LOD | Used at | Budget |
|---|---|---|
| LOD0 | Near, under about 20 m | about 2,000 per kit bay; about 20,000 per hero prop |
| LOD1 | 20 to 60 m | about 50% of LOD0 |
| LOD2 | 60 to 200 m | about 12% of LOD0 |
| LOD3 | Far, or instanced city | a box, a card, or an impostor (roadmap item 4) |

**Collision meshes.** A `-col` mesh has at most about 200 triangles, no
materials, and is separate from the visual mesh. The engine reads it as
triangles and passes each to `World.addTriangle(ax, ay, az, bx, by, bz, cx, cy,
cz)` (`src/physics.js`). Its positions are in engine
units, so the loader applies the same scale as the visual mesh.

**Export rules.** `export_apply=True` bakes modifiers (Decimate, Array) into the
file. Skip hidden objects in the script. Use `export_format='GLB'`. Draco
(`export_draco_mesh_compression_enable=True`) writes
`KHR_draco_mesh_compression`, which the loader must read first, so leave it off
until then.

## 4. Modular city kit

The city wall is one quad per story band. A kit replaces it with **bays** placed
along the footprint edges: plain bays, windows, a shop front, corners, a cornice
and roof props.

**Grid.** Bay width **3 m** (one window and one pier). Story height **3.5 m**
for offices, **4 m** for retail and ground floors. Corner pieces are one bay
square (3 m by 3 m). For a wall of length `L`, use `n = round(L / 3)` bays,
each stretched by `L / n` so the ends meet the corners. If that stretch exceeds
about 10%, change the piece count or add a plain filler.

**Piece set for a first kit (names are suggestions).**

| Piece | Used for |
|---|---|
| `bay_plain` | Upper stories, blank walls, service faces |
| `bay_window` | Upper stories; two or three window variants |
| `bay_pier` | Strip between window groups |
| `ground_shop` | Ground floor of retail or commercial buildings |
| `ground_lobby` | Glass entrance on a tower |
| `corner` | Each footprint vertex |
| `cornice` | Top band, under the roof |
| `roof_prop` | Vents, a penthouse block, a sign, an AC unit |

**Placement generator (to build in `src/city/buildings.js`).**
1. For each wall edge in the loop, take its length `L` and outward normal `n`
   (already computed there as `[-dz/L, 0, dx/L]`).
2. Story count: `rows = max(1, round(height / storey))`, with the same
   `FACADE[kind].storey` values the file already uses.
3. Per story row, pick a piece: `ground_shop` for row 0 with a shop base,
   `cornice` for the top row when `h >= 7`, otherwise `bay_window` or `bay_plain`.
4. Place `n` bays along the edge as `instancePlace` entries, scaled by `L / (n * 3)`.
5. Place a `corner` at each vertex.
6. Keep `builder.collide` for each edge, or swap in a `-col` piece. The ball
   must not snag on a bay.

Use one `InstancedMesh` per piece type and variant. The frustum test then runs
per group, and a tile needs a few dozen draw calls instead of one per bay.

**Variation.** Author variants in Blender with Geometry Nodes (window size and
count, pier width, subtle tint). Bake each variant to its own `.glb` piece. The
engine picks a variant index; it does not run the node graph.

## 5. Baking

- **Normal map.** Model detail at high poly; bake onto the LOD0 mesh with
  `bpy.ops.object.bake(type='NORMAL', use_selected_to_active=True)`, with the
  high-poly object selected and the low-poly one active.
- **Ambient occlusion.** Bake AO into the ORM's R channel (section 8).
- **Roughness and metallic.** Paint masks, or set constants per material.
- **Atlases.** Each piece type shares one atlas: pack a kit's variants into a
  2048 or 4096 image. Fewer materials means fewer draw calls. Texture arrays
  are **to build** (WebGPU and WebGL 2 both support them).
- **Compression.** Export PNG or JPEG first, then convert with KTX-Software:

```sh
toktx --t2 --encode uastc --uastc_quality 2 out/brick_bay_n.ktx2 in/brick_bay_n.png   # normal, ORM
toktx --t2 --encode etc1s out/brick_bay_base.ktx2 in/brick_bay_base.png              # base color
```

Blender's exporter does not write `KHR_texture_basisu`. A Python post-step must
add it to the `.glb` JSON chunk (**to build**).

## 6. Engine upgrade roadmap

Ordered by payoff. Each item is **to build** unless marked as existing.

**1. glTF/GLB loader with KTX2 textures.** The most important step; nothing from
Blender reaches the screen until it exists.
- *Build:* `src/gfx/gltf.js`, exported from `src/gfx/index.js`. Parse the GLB
  header (magic `glTF`, version 2), the JSON chunk and the BIN chunk. Each mesh
  primitive becomes a `BufferGeometry` (`position`, `normal`, `uv`, `tangent`);
  each material becomes a `MeshPhysicalMaterial`; images decode with
  `createImageBitmap`. Accept `scale`, so the city loads at `1 / SCALE` tiles per meter.
- *Check first:* which map slots `MeshPhysicalMaterial` supports in
  `src/gfx/core.js`. Add missing normal and ORM slots before wiring them.
  `Texture` already has `generateMipmaps` and `anisotropy`.
- *Verify:* a `test/` case that loads a fixture `.glb` and checks vertex count,
  bounds and material slots; then a screenshot of the starter example with it.

**2. Instanced kit pieces.** `InstancedMesh` exists.
- *Build:* a helper that turns placements into one `InstancedMesh` per piece
  type and variant, used by the city's building builder.
- *Verify:* draw calls per tile drop (count them via `renderer.info` or the
  draw loop in `src/gfx/renderer.js`); the picture matches the non-instanced build.

**3. GPU culling and LOD switching.**
- *Build:* per-instance LOD choice by distance. In WebGPU, a compute pass writes
  visible indices and an indirect draw consumes them; WebGL 2 keeps the CPU
  path. Start from `chooseLods` in `src/city/scene.js`.
- *Verify:* frame time on a fixed camera path, before and after, with the same pixels.

**4. Impostors for far buildings.**
- *Build:* bake each far tile's buildings from a few fixed angles into card
  atlases; swap to cards at the `RANGE.lo` distance (1500 m in `scene.js`).
- *Verify:* side-by-side screenshots at the swap distance; no visible pop.

**5. Reversed-Z or logarithmic depth.**
- *Why:* the standard `less-equal` buffer loses precision at range and z-fights
  on distant faces (`src/gfx/webgpu.js`).
- *Build:* reversed-Z (projection change in `src/gfx/math.js`, depth clear 0,
  compare `greater-equal`); it is the better option on WebGPU.
- *Verify:* a distant screenshot of coplanar faces (a roof and its parapet), before and after.

**6. Shadow cascades.**
- *Why:* only one directional shadow map exists, covering the whole stage.
- *Build:* 3 or 4 frustum slices with one shadow map each. `_renderShadows` in
  `src/gfx/renderer.js` already loops per light, so each cascade can be a
  virtual light with its own matrix, passed to the standard shader.
- *Verify:* a near and a far object in one frame: the near shadow sharp, the far one free of acne.

**7. Image-based lighting and SSAO.**
- *IBL exists:* PMREM (`src/gfx/pmrem.js`). Confirm the city's `ocean` sky
  feeds the buildings' environment.
- *SSAO to build:* depth and normal pre-pass, blur, multiplied into indirect light only.
- *Verify:* a street-corner screenshot with SSAO on and off; contact shadows
  under cornices and in corners.

**8. Anti-aliasing: FXAA or TAA.**
- *Exists:* 4x MSAA on WebGPU; check the WebGL 2 path separately.
- *Build:* FXAA as one post pass (cheap), or TAA with motion vectors (better on
  railings and wires).
- *Verify:* a zoomed railing or tree edge that stays stable as the camera moves slowly.

**9. Post-processing: bloom, tone mapping, grading.**
- *Build:* render to an `rgba16float` target (the transmission target shows the
  pattern), then bloom (mip chain), tone mapping (ACES or AgX) and a grade as a
  LUT or curves. The engine's moods (`src/moods/`) can supply the grade.
- *Verify:* before and after frames; the mood still reads (`?mood=noir`).

**10. Offline baking of city tiles.**
- *Why:* tiles build at runtime in `metro.worker.js`, which costs load time and
  keeps build code in the browser.
- *Build:* a script under `scripts/` that runs the tile builder (`buildTile` in
  `src/city/metro.js`) and writes each tile as `.glb`. Tiles then load through
  item 1, and the runtime builder stays as a fallback. First confirm `metro.js`
  runs under Node.
- *Verify:* baked and runtime tiles have the same bounds and triangle count, and
  matching screenshots within a small pixel tolerance.

## 7. Checklists

**Each new asset:**
- [ ] Meters and Z up in Blender; Y up in the `.glb`; scale checked against a door.
- [ ] Origin at the base; names follow section 3.
- [ ] Principled BSDF only, with the three baked maps.
- [ ] Texel density within target for its distance band.
- [ ] LOD1 to LOD3 exist with falling triangle counts.
- [ ] A `-col` mesh of at most about 200 triangles, for anything the ball touches.
- [ ] Export ran headless and the output loads in the engine.
- [ ] An engine screenshot, not a Blender one, shows the asset in place.

**Each engine feature:**
- [ ] A `test/` case; `npm test` passes in the engine and in the 3d-city repo.
- [ ] `npm run lint` is clean in the engine.
- [ ] Frame time on a fixed camera path is recorded before and after. Target
      16.6 ms (60 fps) on the user's machine; in software rendering compare
      relative times only.
- [ ] Before and after screenshots, kept in a scratch directory, not the repo.
- [ ] Both renderers checked: WebGPU (default) and `?renderer=webgl`.

**Screenshots in a container.** Install Chromium with
`npx playwright install chromium`, then drive it with Playwright. Chromium's
software GPU (SwiftShader) runs WebGL 2 without hardware. Open the page with
`?renderer=webgl`, since headless WebGPU needs extra flags and may be missing.
Wait for the first frame, then save the canvas. Use a fixed camera or seed so
before and after match. Software rendering is slow, so judge the picture, not the speed.

## 8. Blender Python snippets

Target Blender 3.x and 4.x. Run headless with
`blender -b --factory-startup --python script.py -- <args>`.

**Batch export a collection to `.glb` (Y up, modifiers applied).** Hidden
objects are skipped. Names ending in `-col` export as their own files, so the
same script handles collision meshes, provided they have no materials.

```python
import bpy, os, sys

argv = sys.argv[sys.argv.index("--") + 1:]
out_dir, coll_name = argv[0], argv[1]
os.makedirs(out_dir, exist_ok=True)
coll = bpy.data.collections[coll_name]

for obj in coll.all_objects:
    if obj.type != 'MESH' or obj.hide_render or obj.hide_viewport:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, obj.name + ".glb"),
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_normals=True,
        export_tangents=True,
        export_materials='EXPORT',
    )
    print("exported", obj.name)
```

**Generate LODs with the Decimate modifier.** Each copy gets its own mesh and
joins the source's collection, so the batch export above picks it up. The
modifier applies at export (`export_apply=True`).

```python
import bpy

def make_lod(src, ratio, suffix):
    dup = src.copy()
    dup.data = src.data.copy()                  # own mesh; src is unchanged
    dup.name = src.name + suffix
    for coll in src.users_collection:
        coll.objects.link(dup)
    mod = dup.modifiers.new("LOD", 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = ratio                           # 0.5 keeps about half the triangles
    mod.use_collapse_triangulate = True
    return dup

src = bpy.data.objects["brick_bay_plain_01"]
make_lod(src, 0.5, "_LOD1")
make_lod(src, 0.12, "_LOD2")
make_lod(src, 0.02, "_LOD3")
```

Check triangle counts afterwards; Decimate on hard-edged bays can move corners.

**Bake ambient occlusion to a texture.** The bake writes into the active image
node of the object's material, so the image node must exist and be active, and
the object needs a UV map. The image is non-color data.

```python
import bpy, os

def bake_ao(obj, size, out_path):
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'CPU'
    bpy.context.scene.cycles.samples = 64

    img = bpy.data.images.new(obj.name + "_AO", size, size)
    img.colorspace_settings.name = 'Non-Color'

    mat = obj.active_material
    if mat is None:
        mat = bpy.data.materials.new(obj.name + "_bake")
        mat.use_nodes = True
        obj.data.materials.append(mat)
    nodes = mat.node_tree.nodes
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = img
    nodes.active = tex                          # the bake target

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type='AO', margin=4, use_clear=True)

    img.filepath_raw = out_path
    img.file_format = 'PNG'
    img.save()

obj = bpy.data.objects["brick_bay_plain_01"]
os.makedirs("bake", exist_ok=True)
bake_ao(obj, 1024, os.path.abspath("bake/brick_bay_plain_01_ao.png"))
```

Pack this AO into the ORM's R channel, with roughness in G and metallic in B
(section 3), in a second step with the texture tool of your choice.
