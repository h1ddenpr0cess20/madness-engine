import { build, Sculpt } from './sdf.js';

/**
 * A sculpt (`sdf.js`, from Metroll's model kit) baked into a mesh: each
 * part meshed on its own grid, the triangles grouped by material. `bakeData`
 * does the work and returns plain arrays (so a worker can do it and hand
 * them over); `meshOf` makes the geometry and materials from them.
 *
 * A definition: `name`, `sculpt(s)`, `materials` ({ name: physical material
 * options }; the vertex colours give the colour), `cell` (the grid step,
 * in tiles), `cells` ({ part: step } for finer parts) and `coarse` (a
 * factor on all of them).
 */

export function bakeData(def) {
  const s = new Sculpt();
  def.sculpt(s);
  const names = Object.keys(def.materials);
  const buckets = names.map(() => []);
  const chunks = [];
  let base = 0;
  // `coarse` scales every grid step: the models seen from the game's height don't need the detail of a close-up.
  const k = def.coarse ?? 1;
  for (const [part, shapes] of s.split()) {
    const m = build(shapes, { cell: (def.cells?.[part] ?? def.cell ?? 0.02) * k, bones: ['root'], ambient: def.ambient ?? 0.3 });
    chunks.push(m);
    for (let t = 0; t < m.index.length; t += 3) {
      const a = m.mats[m.index[t]], b = m.mats[m.index[t + 1]], c = m.mats[m.index[t + 2]];
      const mi = Math.max(0, names.indexOf(b === c ? b : a));
      buckets[mi].push(m.index[t] + base, m.index[t + 1] + base, m.index[t + 2] + base);
    }
    base += m.count;
  }
  const join = (field) => {
    const out = new Float32Array(base * 3);
    let o = 0;
    for (const c of chunks) { out.set(c[field], o); o += c.count * 3; }
    return out;
  };
  const index = new Uint32Array(buckets.reduce((n, b) => n + b.length, 0));
  const groups = [];
  let start = 0;
  buckets.forEach((b, materialIndex) => {
    if (!b.length) return;
    index.set(b, start);
    groups.push({ start, count: b.length, materialIndex });
    start += b.length;
  });
  return { position: join('position'), normal: join('normal'), color: join('color'), index, groups };
}

/** The geometry for baked arrays. */
export function geometryOf(GFX, data) {
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(data.position, 3));
  g.setAttribute('normal', new GFX.BufferAttribute(data.normal, 3));
  g.setAttribute('color', new GFX.BufferAttribute(data.color, 3));
  g.setIndex(new GFX.BufferAttribute(data.index, 1));
  for (const gr of data.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  g.computeBoundingSphere();
  return g;
}

/** The materials of a definition, in order: one each. */
export function materialsOf(GFX, def, overrides = {}) {
  return Object.entries(def.materials).map(([n, o]) => new GFX.MeshPhysicalMaterial({
    name: `${def.name}-${n}`, vertexColors: true, roughness: 0.6, ...o, ...overrides[n],
  }));
}

const cache = new Map();

/** Bakes a definition here and now, once: { geometry, materials, data }. */
export function bake(GFX, def) {
  if (cache.has(def.name)) return cache.get(def.name);
  const data = bakeData(def);
  const out = { data, geometry: geometryOf(GFX, data), materials: materialsOf(GFX, def) };
  cache.set(def.name, out);
  return out;
}

/** Puts arrays baked elsewhere (a worker) into the cache. */
export function adopt(GFX, def, data) {
  const out = { data, geometry: geometryOf(GFX, data), materials: materialsOf(GFX, def) };
  cache.set(def.name, out);
  return out;
}

export const isBaked = (name) => cache.has(name);
