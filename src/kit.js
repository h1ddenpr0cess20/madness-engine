import { linearRGB } from './color.js';

/**
 * Props are built from plain shapes — boxes, cylinders, cones, spheres —
 * each with a colour. A kit gathers them, already placed, into one
 * vertex-coloured geometry per finish (matte, shiny, glowing), so a whole
 * town of pumps, houses and fences draws in a handful of calls.
 */

const FINISHES = ['matte', 'shiny', 'glow', 'glass'];

export function createKit(GFX) {
  const parts = Object.fromEntries(FINISHES.map((f) => [f, { position: [], normal: [], color: [] }]));
  const m = new GFX.Matrix4();
  const q = new GFX.Quaternion();
  const e = new GFX.Euler();
  const s = new GFX.Vector3();
  const p = new GFX.Vector3();
  const n3 = new GFX.Matrix3();
  const v = new GFX.Vector3();
  const geometries = new Map();
  const cached = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make().toNonIndexed());
    return geometries.get(key);
  };

  /** Add `geometry` (unit-sized, centred) scaled to `size`, turned by `rot` ([x, y, z] radians), at `at`. */
  function add(geometry, at, size, rot, colour, finish) {
    const out = parts[finish] ?? parts.matte;
    e.set(rot[0], rot[1], rot[2]);
    q.setFromEuler(e);
    m.compose(p.set(at[0], at[1], at[2]), q, s.set(size[0], size[1], size[2]));
    n3.getNormalMatrix(m);
    const pos = geometry.attributes.position.array, nor = geometry.attributes.normal.array;
    const c = linearRGB(colour);
    for (let i = 0; i < pos.length; i += 3) {
      v.set(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(m);
      out.position.push(v.x, v.y, v.z);
      v.set(nor[i], nor[i + 1], nor[i + 2]).applyMatrix3(n3).normalize();
      out.normal.push(v.x, v.y, v.z);
      out.color.push(c[0], c[1], c[2]);
    }
  }

  const kit = {
    /** A box centred on `at`, `size` across. */
    box(at, size, colour, { rot = [0, 0, 0], finish = 'matte' } = {}) {
      add(cached('box', () => new GFX.BoxGeometry(1, 1, 1)), at, size, rot, colour, finish);
      return kit;
    },
    /** A box from its corners, (x0, y0, z0) to (x1, y1, z1). */
    slab(x0, y0, z0, x1, y1, z1, colour, opts) {
      return kit.box([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], colour, opts);
    },
    /** An upright cylinder centred on `at`, radius `r` (or [top, bottom]) and `h` tall; `rot` lays it down. */
    cyl(at, r, h, colour, { rot = [0, 0, 0], finish = 'matte', segments = 16, open = false } = {}) {
      const [rt, rb] = Array.isArray(r) ? r : [r, r];
      const k = rb || 1;
      add(cached(`cyl${segments}${rt / k}${open}`, () => new GFX.CylinderGeometry(rt / k, 1, 1, segments, 1, open)), at, [k, h, k], rot, colour, finish);
      return kit;
    },
    cone(at, r, h, colour, { rot = [0, 0, 0], finish = 'matte', segments = 16 } = {}) {
      add(cached(`cone${segments}`, () => new GFX.ConeGeometry(1, 1, segments)), at, [r, h, r], rot, colour, finish);
      return kit;
    },
    sphere(at, r, colour, { finish = 'matte', scale = [1, 1, 1], rot = [0, 0, 0], segments = 16 } = {}) {
      add(cached(`sphere${segments}`, () => new GFX.SphereGeometry(1, segments, Math.max(10, Math.round(segments * 0.6)))), at, [r * scale[0], r * scale[1], r * scale[2]], rot, colour, finish);
      return kit;
    },
    torus(at, r, tube, colour, { rot = [0, 0, 0], finish = 'matte', segments = 20 } = {}) {
      add(cached(`torus${tube / r}:${segments}`, () => new GFX.TorusGeometry(1, tube / r, 8, segments)), at, [r, r, r], rot, colour, finish);
      return kit;
    },
    /** A beam from point a to point b, `t` thick. */
    beam(a, b, t, colour, opts = {}) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-6) return kit;
      const dir = new GFX.Vector3(dx / len, dy / len, dz / len);
      q.setFromUnitVectors(new GFX.Vector3(0, 1, 0), dir);
      e.setFromQuaternion(q);
      return kit.cyl([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], t, len, colour, { ...opts, rot: [e.x, e.y, e.z], segments: opts.segments ?? 6 });
    },
    get empty() { return FINISHES.every((f) => parts[f].position.length === 0); },

    /** The geometries, one per finish that has anything in it. */
    geometries() {
      const out = {};
      for (const f of FINISHES) {
        const part = parts[f];
        if (!part.position.length) continue;
        const g = new GFX.BufferGeometry();
        g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(part.position), 3));
        g.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(part.normal), 3));
        g.setAttribute('color', new GFX.BufferAttribute(new Float32Array(part.color), 3));
        g.computeBoundingSphere();
        out[f] = g;
      }
      return out;
    },

    /** The kit as a group of meshes, one per finish. */
    build({ castShadow = true, receiveShadow = true, name = 'kit' } = {}) {
      const group = new GFX.Group();
      group.name = name;
      for (const [f, g] of Object.entries(kit.geometries())) {
        const mesh = new GFX.Mesh(g, materials(GFX)[f]);
        mesh.castShadow = castShadow && f !== 'glow' && f !== 'glass';
        mesh.receiveShadow = receiveShadow && f !== 'glow';
        group.add(mesh);
      }
      return group;
    },
  };
  return kit;
}

let shared = null;

/** The finishes, made once. */
export function materials(GFX) {
  if (shared) return shared;
  shared = {
    matte: new GFX.MeshStandardMaterial({ name: 'matte', vertexColors: true, roughness: 0.78, metalness: 0 }),
    shiny: new GFX.MeshPhysicalMaterial({ name: 'shiny', vertexColors: true, roughness: 0.28, metalness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    glow: new GFX.MeshBasicMaterial({ name: 'glow', vertexColors: true }),
    glass: new GFX.MeshPhysicalMaterial({ name: 'window', vertexColors: true, roughness: 0.06, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.02 }),
  };
  return shared;
}
