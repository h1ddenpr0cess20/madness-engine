import { BONE, BONES, COUNT, OCCLUSION, POSITION, SURFACES, UV, WEIGHT } from './data/base.js';

/**
 * The base body: a real man's anatomy, from the MakeHuman project's base
 * mesh, targets and skin weights (CC0), baked by scripts/bake-human.mjs into
 * data/base.js at 1.76 m, in our A-pose and on our bones. Here it is
 * unpacked, and smoothed by Catmull–Clark subdivision for the higher
 * levels of detail (its quads were made for that).
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

let raw = null;
/** The baked mesh, unpacked once: rest positions, UVs, bone indices and weights, occlusion, and each surface's quads. */
export function baseMesh() {
  if (raw) return raw;
  const q = decode(POSITION, Int16Array);
  const position = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    position[i * 3] = (q[i * 3] * 1.2) / 32767;
    position[i * 3 + 1] = (q[i * 3 + 1] * 1.2) / 32767 + 0.9;
    position[i * 3 + 2] = (q[i * 3 + 2] * 1.2) / 32767;
  }
  const uq = decode(UV, Uint16Array);
  const uv = Float32Array.from(uq, (v) => v / 65535);
  const bone = decode(BONE, Uint8Array), w8 = decode(WEIGHT, Uint8Array);
  const weight = Float32Array.from(w8, (v) => v / 255);
  const occlusion = Float32Array.from(decode(OCCLUSION, Uint8Array), (v) => v / 255);
  const surfaces = {};
  for (const [name, s] of Object.entries(SURFACES)) surfaces[name] = { v: decode(s.v, Uint16Array), t: decode(s.t, Uint16Array) };
  raw = { count: COUNT, position, uv, bone, weight, occlusion, surfaces, bones: BONES };
  return raw;
}

/** A vertex's weights as { boneIndex: weight }. */
const weightsOf = (m, i) => {
  const w = {};
  for (let k = 0; k < 4; k++) { const v = m.weight[i * 4 + k]; if (v > 0) w[m.bone[i * 4 + k]] = (w[m.bone[i * 4 + k]] ?? 0) + v; }
  return w;
};
const mixWeights = (list) => {
  const w = {};
  for (const x of list) for (const [b, v] of Object.entries(x)) w[b] = (w[b] ?? 0) + v / list.length;
  return w;
};

/**
 * One level of Catmull–Clark over quads `faces` (vertex indices, 4 a face)
 * with face-varying `uvFaces` (indices into `uv`). Positions are smoothed
 * (with the open edges kept as creases), UVs split linearly within each
 * face, weights and occlusion averaged.
 */
function subdivide(mesh) {
  const { pos, uv, faces, uvFaces, weights, occ } = mesh;
  const V = pos.length / 3, F = faces.length / 4;
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const edges = new Map();
  const ekey = (a, b) => (a < b ? a * 1048576 + b : b * 1048576 + a);
  const facePts = [];
  for (let f = 0; f < F; f++) {
    const c = [0, 0, 0];
    for (let k = 0; k < 4; k++) { const p = P(faces[f * 4 + k]); c[0] += p[0] / 4; c[1] += p[1] / 4; c[2] += p[2] / 4; }
    facePts.push(c);
    for (let k = 0; k < 4; k++) {
      const a = faces[f * 4 + k], b = faces[f * 4 + ((k + 1) % 4)];
      const key = ekey(a, b);
      let e = edges.get(key);
      if (!e) edges.set(key, (e = { a, b, faces: [], index: -1 }));
      e.faces.push(f);
    }
  }
  const outPos = [];
  const outW = [], outO = [];
  // Old vertices, moved.
  const vf = Array.from({ length: V }, () => []), ve = Array.from({ length: V }, () => []);
  for (let f = 0; f < F; f++) for (let k = 0; k < 4; k++) vf[faces[f * 4 + k]].push(f);
  for (const e of edges.values()) { ve[e.a].push(e); ve[e.b].push(e); }
  for (let i = 0; i < V; i++) {
    const p = P(i);
    const border = ve[i].filter((e) => e.faces.length === 1);
    let q;
    if (border.length >= 2) {
      const o = border.slice(0, 2).map((e) => P(e.a === i ? e.b : e.a));
      q = [0, 1, 2].map((a) => (6 * p[a] + o[0][a] + o[1][a]) / 8);
    } else if (!vf[i].length) {
      q = p;
    } else {
      const n = ve[i].length;
      const Q = [0, 0, 0], R = [0, 0, 0];
      for (const f of vf[i]) for (let a = 0; a < 3; a++) Q[a] += facePts[f][a] / vf[i].length;
      for (const e of ve[i]) { const o = P(e.a === i ? e.b : e.a); for (let a = 0; a < 3; a++) R[a] += (p[a] + o[a]) / 2 / n; }
      q = [0, 1, 2].map((a) => (Q[a] + 2 * R[a] + (n - 3) * p[a]) / n);
    }
    outPos.push(...q);
    outW.push(weights[i]);
    outO.push(occ[i]);
  }
  // Edge points.
  for (const e of edges.values()) {
    e.index = outPos.length / 3;
    const a = P(e.a), b = P(e.b);
    if (e.faces.length === 2) {
      const f0 = facePts[e.faces[0]], f1 = facePts[e.faces[1]];
      outPos.push(...[0, 1, 2].map((k) => (a[k] + b[k] + f0[k] + f1[k]) / 4));
    } else outPos.push(...[0, 1, 2].map((k) => (a[k] + b[k]) / 2));
    outW.push(mixWeights([weights[e.a], weights[e.b]]));
    outO.push((occ[e.a] + occ[e.b]) / 2);
  }
  // Face points.
  const faceIndex = [];
  for (let f = 0; f < F; f++) {
    faceIndex.push(outPos.length / 3);
    outPos.push(...facePts[f]);
    const vs = [0, 1, 2, 3].map((k) => faces[f * 4 + k]);
    outW.push(mixWeights(vs.map((v) => weights[v])));
    outO.push(vs.reduce((s, v) => s + occ[v], 0) / 4);
  }
  // UVs: the old ones kept; one at each face's middle, one at each edge's middle within each face.
  const outUV = Array.from(uv);
  const uvEdge = new Map();
  const U = (t) => [uv[t * 2], uv[t * 2 + 1]];
  const uvMid = (s, t) => {
    const key = s < t ? s * 1048576 + t : t * 1048576 + s;
    if (!uvEdge.has(key)) { const a = U(s), b = U(t); uvEdge.set(key, outUV.length / 2); outUV.push((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    return uvEdge.get(key);
  };
  const outFaces = [], outUVFaces = [];
  for (let f = 0; f < F; f++) {
    const vs = [0, 1, 2, 3].map((k) => faces[f * 4 + k]), ts = [0, 1, 2, 3].map((k) => uvFaces[f * 4 + k]);
    const fc = outUV.length / 2;
    outUV.push(...[0, 1].map((a) => ts.reduce((s, t) => s + uv[t * 2 + a], 0) / 4));
    for (let k = 0; k < 4; k++) {
      const prev = (k + 3) % 4, next = (k + 1) % 4;
      const en = edges.get(ekey(vs[k], vs[next])).index, ep = edges.get(ekey(vs[prev], vs[k])).index;
      outFaces.push(vs[k], en, faceIndex[f], ep);
      outUVFaces.push(ts[k], uvMid(ts[k], ts[next]), fc, uvMid(ts[prev], ts[k]));
    }
  }
  return { pos: Float32Array.from(outPos), uv: Float32Array.from(outUV), faces: Uint32Array.from(outFaces), uvFaces: Uint32Array.from(outUVFaces), weights: outW, occ: Float32Array.from(outO) };
}

const levels = new Map();
/**
 * The body's surface at `level` of subdivision (0 as baked, about 27k
 * triangles; 1 smooth, about 107k), as a mesh with face-varying UVs, and
 * the mouth's and lashes' small surfaces (never subdivided).
 */
export function bodyLevel(level) {
  if (levels.has(level)) return levels.get(level);
  const m = baseMesh();
  const weights = Array.from({ length: m.count }, (_, i) => weightsOf(m, i));
  let mesh = { pos: m.position, uv: m.uv, faces: m.surfaces.body.v, uvFaces: m.surfaces.body.t, weights, occ: m.occlusion };
  for (let l = 0; l < level; l++) mesh = subdivide(mesh);
  levels.set(level, mesh);
  return mesh;
}
