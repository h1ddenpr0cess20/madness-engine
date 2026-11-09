import { baseMesh } from './basemesh.js';
import { frameAt, Part, smooth } from './kit.js';
import { EYE, FACE } from './skeleton.js';

/**
 * What the head needs beyond the skin: the eyeballs (seen through the lids'
 * opening), the teeth, tongue and lashes (MakeHuman's own, fitted to its
 * mouth and lids), and the mouth's corners given bones of their own, so the
 * mouth can smile.
 */

const G = (t) => Math.exp(-t * t);

/** Moves some of a face vertex's head and jaw share to the mouth's corner it is near, so a smile pulls it. */
export function withLipCorners(w, p) {
  const m = p[0] >= 0 ? 1 : -1, S = m > 0 ? 'L' : 'R';
  const c = FACE.lipCorner;
  const d = Math.hypot(p[0] - c[0] * m, (p[1] - c[1]) * 1.3, (p[2] - c[2]) * 1.5);
  const k = 0.85 * G(d / 0.013) * smooth(0.06, 0.1, p[2]);
  if (k < 1e-3) return w;
  const out = { ...w };
  let moved = 0;
  for (const b of ['head', 'jaw']) if (out[b]) { const take = out[b] * k; out[b] -= take; moved += take; }
  if (moved > 0) out[`lipCorner${S}`] = (out[`lipCorner${S}`] ?? 0) + moved;
  return out;
}

/** The eyes: spheres looking down +z, the cornea's bulge over the iris, mapped so the iris is a disc in the middle of the texture. */
export function buildEyes(detail = 1) {
  const part = new Part('eyes', 'eye');
  const R = EYE.radius * 1.01, rows = Math.round(24 * Math.max(0.6, detail)), cols = Math.round(32 * Math.max(0.6, detail));
  for (const m of [1, -1]) {
    const c = [EYE.center[0] * m, EYE.center[1], EYE.center[2]];
    const yaw = m * 0.04;
    const fwd = [Math.sin(yaw), 0, Math.cos(yaw)], right = [Math.cos(yaw), 0, -Math.sin(yaw)], up = [0, 1, 0];
    part.grid(rows, cols, (i, j) => {
      const a = (i / rows) * Math.PI, b = (j / cols) * Math.PI * 2;
      const r = R + 0.0008 * smooth(0.5, 0.18, a);
      const p = frameAt(c, right, up, fwd, Math.sin(a) * Math.cos(b) * r, Math.sin(a) * Math.sin(b) * r, Math.cos(a) * r);
      // The texture's middle spread over the front, so the iris has texels to spare: radius √(a/π)/2.
      const k = 0.5 * Math.sqrt(a / Math.PI);
      return { p, uv: [0.5 + k * Math.cos(b), 0.5 + k * Math.sin(b)], w: { [m > 0 ? 'eyeL' : 'eyeR']: 1 }, tint: 1 - 0.3 * smooth(0.9, 1.6, a), zone: { zone: 'head', y: p[1], d: 0 } };
    });
  }
  return part;
}

/** One of the baked mesh's small surfaces (teeth, tongue, lashes) as a part, in `material`. */
function helperPart(name, material, tint = () => 1) {
  const m = baseMesh();
  const s = m.surfaces[name];
  const part = new Part(name, material);
  const map = new Map();
  const at = (v) => {
    if (!map.has(v)) {
      const p = [m.position[v * 3], m.position[v * 3 + 1], m.position[v * 3 + 2]];
      const w = {};
      for (let k = 0; k < 4; k++) { const x = m.weight[v * 4 + k]; if (x > 0) w[m.bones[m.bone[v * 4 + k]]] = (w[m.bones[m.bone[v * 4 + k]]] ?? 0) + x; }
      map.set(v, part.vertex(p, [0, 0], w, tint(p), null, { zone: 'head', y: p[1], d: 0 }));
    }
    return map.get(v);
  };
  for (let f = 0; f < s.v.length; f += 4) {
    const q = [at(s.v[f]), at(s.v[f + 1]), at(s.v[f + 2]), at(s.v[f + 3])];
    part.idx.push(q[0], q[1], q[2]);
    if (q[3] !== q[2]) part.idx.push(q[0], q[2], q[3]);
  }
  return part;
}

/** The teeth of each jaw, and the tongue. */
export function buildMouth() {
  const mouth = FACE.mouth;
  // Darker toward the back of the mouth.
  const back = (p) => 0.55 + 0.45 * smooth(mouth[2] - 0.05, mouth[2] - 0.01, p[2]);
  return [helperPart('upperTeeth', 'teeth', back), helperPart('lowerTeeth', 'teeth', back), helperPart('tongue', 'tongue', back)];
}
