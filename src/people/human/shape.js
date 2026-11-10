import { SHAPES as HIS } from './data/shapes.js';
import { SHAPES as HERS } from './data/shapes-female.js';
import { baseMesh } from './basemesh.js';
import { BUILDS, SLOTS } from './features.js';
import { figureOf } from './skeleton.js';

/** Each figure's shapes, baked in its own pose and at its own size. */
const BY_FIGURE = { male: HIS, female: HERS };

/**
 * The character creator's shapes put on the human. Each slot that changes
 * his shape (features.js) is made of MakeHuman's own modelling targets,
 * baked into data/shapes.js at his size and in his pose: for each, how far
 * it moves every vertex of the base mesh, every joint of his skeleton, and
 * each eye.
 *
 * The skin takes the offsets exactly, through the same subdivision that
 * smooths it. His joints move as MakeHuman's do, so he bends where his new
 * shape bends. Everything worn or grown over the skin (clothes, hair,
 * beard, brows, glasses, teeth, tongue) moves as the skin nearest it does,
 * and the eyeballs move and grow whole. He is set back on the ground
 * afterward, however much taller or shorter he has become. The woman has
 * shapes of her own, baked from MakeHuman's female targets on her body.
 */

function decode(b64, Type) {
  let bytes;
  if (typeof atob === 'function') {
    const s = atob(b64);
    bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  } else {
    bytes = new Uint8Array(globalThis.Buffer.from(b64, 'base64'));
  }
  return new Type(bytes.buffer, bytes.byteOffset, bytes.byteLength / Type.BYTES_PER_ELEMENT);
}

const unpacked = new Map();
/** One of figure `sex`'s baked shapes, unpacked once: the vertices it moves and by how much (metres), its joints and eyes. */
function shapeOf(name, sex) {
  const key = `${sex}:${name}`;
  if (!unpacked.has(key)) {
    const s = BY_FIGURE[sex][name];
    const raw = decode(s.d, s.bits === 8 ? Int8Array : Int16Array);
    unpacked.set(key, { index: decode(s.i, Uint16Array), offset: Float32Array.from(raw, (v) => v * s.q), pivots: s.pivots, eyes: s.eyes ?? {} });
  }
  return unpacked.get(key);
}

/** The keys of the slots that change his shape. */
export const SHAPE_KEYS = Object.freeze([...Object.values(SLOTS).filter((s) => s.shape).map((s) => s.key), 'build', 'browThickness']);

/**
 * How much of each baked shape `features` asks for: { name: amount }. A
 * build adds to the body's sliders; a slider takes its `+` shape one way
 * and its `−` shape the other.
 */
export function shapeAmounts(features) {
  const out = {};
  const SHAPES = BY_FIGURE[features.sex ?? 'male'];
  const build = BUILDS[features.build] ?? {};
  for (const s of Object.values(SLOTS)) {
    if (!s.shape) continue;
    if (s.type === 'range') {
      const v = Math.max(s.min, Math.min(s.max, (features[s.key] ?? 0) + (build[s.key] ?? 0)));
      if (v > 1e-4) out[`${s.key}+`] = v;
      else if (v < -1e-4) out[`${s.key}-`] = -v;
    } else {
      const name = `${s.key}:${features[s.key]}`;
      if (SHAPES[name]) out[name] = 1;
    }
  }
  return out;
}

const soles = new Map();
/** Figure `sex`'s lowest and highest points as baked, and the vertices of its skin. */
function groundOf(sex) {
  if (soles.has(sex)) return soles.get(sex);
  const m = baseMesh(sex);
  const skin = new Uint8Array(m.count);
  for (const v of m.surfaces.body.v) skin[v] = 1;
  let lo = Infinity, hi = -Infinity;
  for (let v = 0; v < m.count; v++) if (skin[v]) { lo = Math.min(lo, m.position[v * 3 + 1]); hi = Math.max(hi, m.position[v * 3 + 1]); }
  soles.set(sex, { skin, lo, hi });
  return soles.get(sex);
}

/**
 * The shape `features` give him, or null if they leave him as he is:
 * `delta`, every base vertex's offset; `pivots`, each bone's; `eyes`, how
 * much each eye's radius grows; `height`, how tall he now stands; and
 * `browThickness`, for his brows' cards.
 */
export function shapeFor(features) {
  const sex = features.sex ?? 'male';
  const amounts = shapeAmounts(features);
  const thick = features.browThickness ?? 0;
  if (!Object.keys(amounts).length && !thick) return null;
  const m = baseMesh(sex);
  const delta = new Float32Array(m.count * 3);
  const pivots = {};
  const eyes = { L: 0, R: 0 };
  for (const [name, k] of Object.entries(amounts)) {
    const s = shapeOf(name, sex);
    for (let j = 0; j < s.index.length; j++) {
      const o = s.index[j] * 3;
      delta[o] += s.offset[j * 3] * k; delta[o + 1] += s.offset[j * 3 + 1] * k; delta[o + 2] += s.offset[j * 3 + 2] * k;
    }
    for (const [b, d] of Object.entries(s.pivots)) {
      const p = (pivots[b] ??= [0, 0, 0]);
      p[0] += d[0] * k; p[1] += d[1] * k; p[2] += d[2] * k;
    }
    for (const [S, r] of Object.entries(s.eyes)) eyes[S] += r * k;
  }
  // Back on the ground: his soles where they were.
  const { skin, lo, hi } = groundOf(sex);
  let low = Infinity, top = -Infinity;
  for (let v = 0; v < m.count; v++) {
    if (!skin[v]) continue;
    const y = m.position[v * 3 + 1] + delta[v * 3 + 1];
    if (y < low) low = y;
    if (y > top) top = y;
  }
  const lift = lo - low;
  if (Math.abs(lift) > 1e-6) {
    for (let v = 0; v < m.count; v++) delta[v * 3 + 1] += lift;
    pivots.root = [0, 0, 0];
    for (const p of Object.values(pivots)) p[1] += lift;
  }
  return { sex, amounts, delta, pivots, eyes, lift, height: figureOf(sex).height + top + lift - hi, browThickness: thick };
}

// ————————————————————————————————————————————— the skin, through its subdivision

const topologies = new Map();
/**
 * The connectivity one level of Catmull–Clark needs, for quads `faces` over
 * `V` vertices, in the order basemesh.js's subdivision makes its points:
 * the old vertices, then one an edge, then one a face.
 */
function topology(faces, V) {
  if (topologies.has(faces)) return topologies.get(faces);
  const F = faces.length / 4;
  const edges = new Map();
  const ekey = (a, b) => (a < b ? a * 1048576 + b : b * 1048576 + a);
  for (let f = 0; f < F; f++) {
    for (let k = 0; k < 4; k++) {
      const a = faces[f * 4 + k], b = faces[f * 4 + ((k + 1) % 4)];
      const key = ekey(a, b);
      let e = edges.get(key);
      if (!e) edges.set(key, (e = { a, b, faces: [] }));
      e.faces.push(f);
    }
  }
  const list = [...edges.values()];
  const vf = Array.from({ length: V }, () => []), ve = Array.from({ length: V }, () => []);
  for (let f = 0; f < F; f++) for (let k = 0; k < 4; k++) vf[faces[f * 4 + k]].push(f);
  list.forEach((e, i) => { ve[e.a].push(i); ve[e.b].push(i); });
  const t = { F, V, faces, edges: list, vf, ve };
  topologies.set(faces, t);
  return t;
}

/** One level of Catmull–Clark over offsets `d` (it is linear, so the offsets subdivide as the positions do). */
function subdivideOffsets(d, t) {
  const { F, V, faces, edges, vf, ve } = t;
  const out = new Float32Array((V + edges.length + F) * 3);
  const fp = new Float32Array(F * 3);
  for (let f = 0; f < F; f++) {
    for (let k = 0; k < 4; k++) { const o = faces[f * 4 + k] * 3; fp[f * 3] += d[o] / 4; fp[f * 3 + 1] += d[o + 1] / 4; fp[f * 3 + 2] += d[o + 2] / 4; }
  }
  for (let i = 0; i < V; i++) {
    const border = ve[i].filter((e) => edges[e].faces.length === 1);
    const o = i * 3;
    if (border.length >= 2) {
      const [a, b] = border.slice(0, 2).map((e) => (edges[e].a === i ? edges[e].b : edges[e].a) * 3);
      for (let x = 0; x < 3; x++) out[o + x] = (6 * d[o + x] + d[a + x] + d[b + x]) / 8;
    } else if (!vf[i].length) {
      for (let x = 0; x < 3; x++) out[o + x] = d[o + x];
    } else {
      const n = ve[i].length;
      for (let x = 0; x < 3; x++) {
        let Q = 0, R = 0;
        for (const f of vf[i]) Q += fp[f * 3 + x] / vf[i].length;
        for (const e of ve[i]) { const u = edges[e].a === i ? edges[e].b : edges[e].a; R += (d[o + x] + d[u * 3 + x]) / 2 / n; }
        out[o + x] = (Q + 2 * R + (n - 3) * d[o + x]) / n;
      }
    }
  }
  edges.forEach((e, k) => {
    const o = (V + k) * 3, a = e.a * 3, b = e.b * 3;
    if (e.faces.length === 2) {
      const f0 = e.faces[0] * 3, f1 = e.faces[1] * 3;
      for (let x = 0; x < 3; x++) out[o + x] = (d[a + x] + d[b + x] + fp[f0 + x] + fp[f1 + x]) / 4;
    } else for (let x = 0; x < 3; x++) out[o + x] = (d[a + x] + d[b + x]) / 2;
  });
  out.set(fp, (V + edges.length) * 3);
  return out;
}

/** The base offsets carried to subdivision `level` of the skin. */
export function levelOffsets(delta, level) {
  // The figures are one mesh: their quads are the same.
  const m = baseMesh();
  let d = delta, faces = m.surfaces.body.v, V = m.count;
  for (let l = 0; l < level; l++) {
    const t = topology(faces, V);
    d = subdivideOffsets(d, t);
    V = t.V + t.edges.length + t.F;
    faces = nextFaces(t);
  }
  return d;
}

const nextOf = new WeakMap();
/** The quads one level finer, as basemesh.js's subdivision makes them. */
function nextFaces(t) {
  if (nextOf.has(t)) return nextOf.get(t);
  const { F, V, faces, edges } = t;
  const index = new Map();
  const ekey = (a, b) => (a < b ? a * 1048576 + b : b * 1048576 + a);
  edges.forEach((e, k) => index.set(ekey(e.a, e.b), V + k));
  const out = new Uint32Array(F * 16);
  for (let f = 0; f < F; f++) {
    const vs = [0, 1, 2, 3].map((k) => faces[f * 4 + k]);
    for (let k = 0; k < 4; k++) {
      const prev = (k + 3) % 4, next = (k + 1) % 4;
      out.set([vs[k], index.get(ekey(vs[k], vs[next])), V + edges.length + f, index.get(ekey(vs[prev], vs[k]))], f * 16 + k * 4);
    }
  }
  nextOf.set(t, out);
  return out;
}

// ————————————————————————————————————————————— what is over the skin

const grids = new Map();
const LIMBS = /^(arm|fore|hand|thumb|index|middle|ring|pinky)/;
/**
 * Figure `sex`'s skin's base vertices in a grid of 2 cm cells, to find those
 * nearest a point; with `trunk`, only those of the head and trunk (long hair
 * lies by the arms, but goes with the back it hangs down).
 */
function skinGrid(sex, trunk = false) {
  const id = `${sex}${trunk ? ':trunk' : ''}`;
  if (grids.has(id)) return grids.get(id);
  const m = baseMesh(sex);
  const skin = groundOf(sex).skin.slice();
  if (trunk) for (let v = 0; v < m.count; v++) if (LIMBS.test(m.bones[m.bone[v * 4]])) skin[v] = 0;
  const CELL = 0.02, cells = new Map();
  const key = (i, j, k) => (i + 512) * 1048576 + (j + 512) * 1024 + (k + 512);
  for (let v = 0; v < m.count; v++) {
    if (!skin[v]) continue;
    const k = key(Math.floor(m.position[v * 3] / CELL), Math.floor(m.position[v * 3 + 1] / CELL), Math.floor(m.position[v * 3 + 2] / CELL));
    let list = cells.get(k);
    if (!list) cells.set(k, (list = []));
    list.push(v);
  }
  grids.set(id, { CELL, cells, key, P: m.position });
  return grids.get(id);
}

/**
 * For each of `position`'s points (xyz), the `k` skin vertices nearest it
 * and how much each counts (by inverse square distance): what it moves with.
 */
function anchorsFor(position, k, sex, trunk) {
  const { CELL, cells, key, P } = skinGrid(sex, trunk);
  const n = position.length / 3;
  const index = new Uint32Array(n * k), weight = new Float32Array(n * k);
  const best = new Float64Array(k), bestV = new Int32Array(k);
  for (let i = 0; i < n; i++) {
    const x = position[i * 3], y = position[i * 3 + 1], z = position[i * 3 + 2];
    const ci = Math.floor(x / CELL), cj = Math.floor(y / CELL), ck = Math.floor(z / CELL);
    best.fill(Infinity); bestV.fill(-1);
    for (let r = 0; r < 24; r++) {
      // Each shell of cells r out from the point's own.
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
        if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r) continue;
        const list = cells.get(key(ci + a, cj + b, ck + c));
        if (!list) continue;
        for (const v of list) {
          const dx = P[v * 3] - x, dy = P[v * 3 + 1] - y, dz = P[v * 3 + 2] - z;
          const d = dx * dx + dy * dy + dz * dz;
          if (d >= best[k - 1]) continue;
          let s = k - 1;
          while (s > 0 && best[s - 1] > d) { best[s] = best[s - 1]; bestV[s] = bestV[s - 1]; s--; }
          best[s] = d; bestV[s] = v;
        }
      }
      // Done once nothing in a further shell can be nearer than the k-th found.
      if (bestV[k - 1] >= 0 && Math.sqrt(best[k - 1]) <= r * CELL) break;
    }
    let total = 0;
    for (let s = 0; s < k; s++) { const w = bestV[s] < 0 ? 0 : 1 / (best[s] + 2.5e-5); weight[i * k + s] = w; index[i * k + s] = Math.max(0, bestV[s]); total += w; }
    for (let s = 0; s < k; s++) weight[i * k + s] /= total || 1;
  }
  return { k, index, weight };
}

const anchorsOf = new WeakMap();
/** `data`'s points moved with the skin (of figure `sex`) under them, by base offsets `delta`: new rest positions. */
export function carried(data, delta, { k = 4, from = 0, to = data.count, into = null, sex = 'male', trunk = false } = {}) {
  let a = anchorsOf.get(data.position);
  if (!a || a.k !== k || a.from !== from || a.to !== to || a.sex !== sex || a.trunk !== trunk) {
    a = { ...anchorsFor(data.position.subarray(from * 3, to * 3), k, sex, trunk), from, to, sex, trunk };
    anchorsOf.set(data.position, a);
  }
  const out = into ?? data.position.slice();
  for (let i = 0; i < to - from; i++) {
    const o = (from + i) * 3;
    for (let s = 0; s < k; s++) {
      const w = a.weight[i * k + s];
      if (!w) continue;
      const v = a.index[i * k + s] * 3;
      out[o] += delta[v] * w; out[o + 1] += delta[v + 1] * w; out[o + 2] += delta[v + 2] * w;
    }
  }
  return out;
}

/** The eyeballs (in `position`, `from` to `to`), each moved and grown whole as its eye in `shape` is. */
export function placeEyes(position, from, to, shape) {
  const EYE = figureOf(shape.sex).eye;
  for (let i = from; i < to; i++) {
    const o = i * 3, m = position[o] >= 0 ? 1 : -1, S = m > 0 ? 'L' : 'R';
    const c = [EYE.center[0] * m, EYE.center[1], EYE.center[2]];
    const d = shape.pivots[`eye${S}`] ?? [0, 0, 0];
    const grow = 1 + shape.eyes[S] / EYE.radius;
    for (let x = 0; x < 3; x++) position[o + x] = c[x] + d[x] + (position[o + x] - c[x]) * grow;
  }
  return position;
}

/**
 * The brows' cards thickened by `k` (−1..1) about the line each brow runs
 * along: drawn wider up and down it, and standing further off the skin.
 */
export function thickenBrows(position, k) {
  if (!k) return position;
  const n = position.length / 3;
  // The brow's middle line: its height and depth, bin by bin along it.
  const BINS = 12;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) { const x = Math.abs(position[i * 3]); lo = Math.min(lo, x); hi = Math.max(hi, x); }
  const sum = new Float64Array(BINS * 3);
  const bin = (x) => Math.min(BINS - 1, Math.floor(((Math.abs(x) - lo) / (hi - lo || 1)) * BINS));
  for (let i = 0; i < n; i++) { const b = bin(position[i * 3]); sum[b * 3] += position[i * 3 + 1]; sum[b * 3 + 1] += position[i * 3 + 2]; sum[b * 3 + 2]++; }
  const out = position.slice();
  const wide = 1 + 0.45 * k, lift = 1 + 0.6 * k;
  for (let i = 0; i < n; i++) {
    const b = bin(position[i * 3]), c = sum[b * 3 + 2] || 1;
    const y = sum[b * 3] / c, z = sum[b * 3 + 1] / c;
    out[i * 3 + 1] = y + (position[i * 3 + 1] - y) * wide;
    out[i * 3 + 2] = z + (position[i * 3 + 2] - z) * lift;
  }
  return out;
}
