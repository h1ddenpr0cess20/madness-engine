import { baseMesh, bodyLevel } from './basemesh.js';
import { BONES as BAKED_BONES } from './data/base.js';
import { bones, figureOf } from './skeleton.js';

/**
 * Fitting what was made for the man onto the woman.
 *
 * She is MakeHuman's own young woman: its base mesh, vertex for vertex, with
 * its female targets applied. So every point of his skin has a point of hers
 * that is the same place on a person (the tip of the nose, the inside of
 * the elbow, the nipple). Everything worn or grown on him (his clothes, his
 * hair, his eyes, his teeth) is made on him, as it always is, and then
 * carried onto her: each of its points moves as the skin under it moves
 * from his body to hers, as MakeHuman fits its own clothes to a figure. Their
 * weights, UVs and the zones they say they cover are left as they were.
 *
 * Cloth then hangs as it would on her (`hang`): off the bust and down, and
 * across between the breasts, instead of lying in under them.
 */

const NAMES = bones().map(([n]) => n);
const index = new Map(NAMES.map((n, i) => [n, i]));
/**
 * What part of the body each bone moves, for telling which skin a point lies on: the trunk, the head,
 * each arm, each leg. Compared limb by limb, not bone by bone, a point on the left thigh follows the left
 * thigh and not the right one beside it, but one down a leg follows the leg smoothly from shin to foot.
 */
const LIMB = (n) => {
  const S = /[LR]$/.test(n) && !/^(eye|lid|brow|lipCorner)/.test(n) ? n.at(-1) : '';
  const b = n.replace(/[LR]$/, '');
  if (['thigh', 'shin', 'foot', 'toes'].includes(b)) return `leg${S}`;
  if (['arm', 'fore', 'hand'].includes(b) || /^(thumb|index|middle|ring|pinky)\d$/.test(b)) return `arm${S}`;
  if (['root', 'hips', 'spine', 'chest', 'clavicle'].includes(b)) return 'trunk';
  if (b === 'neck') return 'neck';
  return 'head';
};
const LIMBS = [...new Set(NAMES.map(LIMB))];
const canonical = NAMES.map((n) => LIMBS.indexOf(LIMB(n)));
const L = LIMBS.length;

const fitters = new Map();
const G = 0.02;

/** His skin and hers, in a grid for finding the skin near a point: where each point is on him, how far it moves to hers, and its weights. */
function fitter(sex) {
  if (fitters.has(sex)) return fitters.get(sex);
  const him = baseMesh(), her = baseMesh(sex);
  const count = him.count;
  const M = him.position, D = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) D[i] = her.position[i] - M[i];
  const SB = new Int16Array(count * 4).fill(-1), SW = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) {
      const x = him.weight[i * 4 + k];
      if (x > 0) { SB[i * 4 + k] = canonical[index.get(BAKED_BONES[him.bone[i * 4 + k]])]; SW[i * 4 + k] = x; }
    }
  }
  // Only the points some surface uses (the base mesh carries helpers we do not keep).
  const used = new Uint8Array(count);
  for (const s of Object.values(him.surfaces)) for (const v of s.v) used[v] = 1;
  // The skin's points in a grid of cells G across: each cell's points together (in the order they come),
  // with where they are, how far each moves and its limbs alongside, so a cell is read straight through.
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) if (used[i]) for (let a = 0; a < 3; a++) { const c = Math.floor(M[i * 3 + a] / G); lo[a] = Math.min(lo[a], c); hi[a] = Math.max(hi[a], c); }
  const dims = [0, 1, 2].map((a) => hi[a] - lo[a] + 1);
  const cellOf = (i) => ((Math.floor(M[i * 3] / G) - lo[0]) * dims[1] + (Math.floor(M[i * 3 + 1] / G) - lo[1])) * dims[2] + (Math.floor(M[i * 3 + 2] / G) - lo[2]);
  const start = new Int32Array(dims[0] * dims[1] * dims[2] + 1);
  for (let i = 0; i < count; i++) if (used[i]) start[cellOf(i) + 1]++;
  for (let c = 0; c < start.length - 1; c++) start[c + 1] += start[c];
  const fill = start.slice(0, -1), order = new Int32Array(start[start.length - 1]);
  for (let i = 0; i < count; i++) if (used[i]) order[fill[cellOf(i)]++] = i;
  // Each skin point's weights summed limb by limb, for comparing with a point's own.
  const LW = new Float32Array(count * L);
  for (let i = 0; i < count; i++) for (let k = 0; k < 4; k++) if (SB[i * 4 + k] >= 0) LW[i * L + SB[i * 4 + k]] += SW[i * 4 + k];
  const CM = new Float64Array(order.length * 3), CD = new Float64Array(order.length * 3), CL = new Float32Array(order.length * L);
  order.forEach((v, j) => {
    for (let a = 0; a < 3; a++) { CM[j * 3 + a] = M[v * 3 + a]; CD[j * 3 + a] = D[v * 3 + a]; }
    for (let l = 0; l < L; l++) CL[j * L + l] = LW[v * L + l];
  });
  const grid = { lo, dims, start, CM, CD, CL };
  const f = { M, D, SB, SW, LW, grid, sex, figure: figureOf(sex), male: figureOf('male'), acc: new Float64Array(32) };
  fitters.set(sex, f);
  return f;
}

/** A point's weights (bones `qb`, weights `qw`, four each) summed limb by limb, into `out` (L numbers). */
function limbSums(qb, qw, out) {
  out.fill(0);
  for (let a = 0; a < 4; a++) if (qb[a] >= 0) out[qb[a]] += qw[a];
  return out;
}

/**
 * How far a point `q` of his moves to be the same place on her (into `out`),
 * and, given `grad` (nine numbers), how that move changes as q moves (row by
 * row, d(move)/dq): the skin near it, each piece by how near it is and how
 * alike its weights are to the point's own (`qb`, `qw`), so a point on his
 * left thigh follows the left thigh and not the right one beside it. The
 * further from the skin, the wider the skin it follows, so cloth standing
 * off it moves smoothly.
 *
 * One pass over the skin within 3σ: the weighted sums of the moves and of
 * their gradient's parts are gathered together (the gradient's
 * Σ k·e·(D − mean) is Σ k·e·D − mean·Σ k·e).
 */
const qsum = new Float32Array(L);
const SPAN = new Int32Array(2);
function shiftAt(F, q, qb, qw, out, grad = null) {
  const { lo, dims, start, CM, CD, CL } = F.grid;
  const cx = Math.floor(q[0] / G) - lo[0], cy = Math.floor(q[1] / G) - lo[1], cz = Math.floor(q[2] / G) - lo[2];
  /** Cell (i, j, k) from q's: its first point and one past its last (nothing outside the grid). */
  const span = (i, j, k) => {
    const x = cx + i, y = cy + j, z = cz + k;
    if (x < 0 || y < 0 || z < 0 || x >= dims[0] || y >= dims[1] || z >= dims[2]) return 0;
    const c = (x * dims[1] + y) * dims[2] + z;
    SPAN[0] = start[c]; SPAN[1] = start[c + 1];
    return SPAN[1] - SPAN[0];
  };
  // The nearest skin in the cells round q's own, those further out until some is found.
  let near = Infinity;
  for (let r = 1; !Number.isFinite(near); r += 2) {
    if (r > 13) break;
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
      if (!span(i, j, k)) continue;
      for (let n = SPAN[0]; n < SPAN[1]; n++) {
        const d2 = (CM[n * 3] - q[0]) ** 2 + (CM[n * 3 + 1] - q[1]) ** 2 + (CM[n * 3 + 2] - q[2]) ** 2;
        if (d2 < near) near = d2;
      }
    }
  }
  if (!Number.isFinite(near)) { out[0] = out[1] = out[2] = 0; if (grad) grad.fill(0); return out; }
  const sigma = 0.008 + 0.5 * Math.sqrt(near), s2 = sigma * sigma, far = 9 * s2;
  const reach = Math.ceil((3 * sigma) / G);
  const weighted = !!qb;
  if (weighted) limbSums(qb, qw, qsum);
  // [Σw, Σw·D (3), Σw·e (3), Σw·e⊗D (9)], with the weights alike (k) and plain (g).
  const A = F.acc.fill(0);
  for (let i = -reach; i <= reach; i++) {
    // Only the cells some of which lie within 3σ.
    const dx = Math.max(0, Math.abs(i) - 1) * G;
    for (let j = -reach; j <= reach; j++) {
      const dy = Math.max(0, Math.abs(j) - 1) * G;
      if (dx * dx + dy * dy > far) continue;
      for (let k = -reach; k <= reach; k++) {
        const dz = Math.max(0, Math.abs(k) - 1) * G;
        if (dx * dx + dy * dy + dz * dz > far) continue;
        if (!span(i, j, k)) continue;
        for (let n = SPAN[0]; n < SPAN[1]; n++) {
          const e0 = q[0] - CM[n * 3], e1 = q[1] - CM[n * 3 + 1], e2 = q[2] - CM[n * 3 + 2];
          const d2 = e0 * e0 + e1 * e1 + e2 * e2;
          if (d2 > far) continue;
          const g = Math.exp(-d2 / s2);
          let same = 1;
          if (weighted) { same = 0; for (let l = 0; l < L; l++) { const a = qsum[l], b = CL[n * L + l]; same += a < b ? a : b; } }
          const D0 = CD[n * 3], D1 = CD[n * 3 + 1], D2 = CD[n * 3 + 2];
          for (let t = 0, w = g * same; t < 2; t++, w = g) {
            if (!w) continue;
            const o = t * 16;
            A[o] += w; A[o + 1] += w * D0; A[o + 2] += w * D1; A[o + 3] += w * D2;
            if (!grad) continue;
            A[o + 4] += w * e0; A[o + 5] += w * e1; A[o + 6] += w * e2;
            A[o + 7] += w * e0 * D0; A[o + 8] += w * e1 * D0; A[o + 9] += w * e2 * D0;
            A[o + 10] += w * e0 * D1; A[o + 11] += w * e1 * D1; A[o + 12] += w * e2 * D1;
            A[o + 13] += w * e0 * D2; A[o + 14] += w * e1 * D2; A[o + 15] += w * e2 * D2;
          }
        }
      }
    }
  }
  // Where nothing near shares its weights, the skin nearest it, whatever it is.
  const o = A[0] === 0 || A[0] < 1e-6 * A[16] ? 16 : 0;
  const tw = A[o];
  if (tw === 0) { out[0] = out[1] = out[2] = 0; if (grad) grad.fill(0); return out; }
  out[0] = A[o + 1] / tw; out[1] = A[o + 2] / tw; out[2] = A[o + 3] / tw;
  if (grad) {
    // d(k)/dq = k · −2 (q − M) / σ²: grad[r][c] = −2/(σ² tw) Σ k e_c (D_r − out_r).
    const f = -2 / s2 / tw;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grad[r * 3 + c] = f * (A[o + 7 + r * 3 + c] - out[r] * A[o + 4 + c]);
  }
  return out;
}

/** A vertex's weights in `data`, as four canonical bones and their weights (−1 for none). */
function weightsOf(data, v, qb, qw) {
  for (let k = 0; k < 4; k++) {
    const x = data.skinWeight[v * 4 + k];
    qb[k] = x > 0 ? canonical[data.skinIndex[v * 4 + k]] : -1;
    qw[k] = x;
  }
}

/** Where his rest-pose point `p` is on the figure `sex` (any point near his body: a grip in the hand, say), lying on bone `bone` if given. */
export function fitPoint(p, sex, bone = null) {
  if (sex === 'male') return p.slice();
  const F = fitter(sex);
  const qb = bone === null ? null : Int16Array.of(canonical[index.get(bone)], -1, -1, -1), qw = Float32Array.of(1, 0, 0, 0);
  const s = shiftAt(F, p, qb, qw, [0, 0, 0]);
  return [p[0] + s[0], p[1] + s[1], p[2] + s[2]];
}

/**
 * Mesh data (from `assemble`) made on him, carried onto the figure `sex`: a
 * copy whose positions are moved as the skin under them moves, and whose
 * normals are turned as the surface is (by the move's own gradient). The
 * eyes go whole, to where hers are and at her size. All else is shared.
 */
export function fitData(data, sex, { surface = false } = {}) {
  if (sex === 'male') return data;
  const F = fitter(sex);
  const { figure: fig, male } = F;
  const position = new Float32Array(data.position.length), normal = new Float32Array(data.normal.length);
  const eyes = [index.get('eyeL'), index.get('eyeR')];
  const s0 = [0, 0, 0], grad = new Float64Array(9), qb = new Int16Array(4), qw = new Float32Array(4);
  // Points at one place (a seam of the UVs) move as one: worked out once.
  const done = new Map();
  for (let v = 0; v < data.count; v++) {
    const q = [data.position[v * 3], data.position[v * 3 + 1], data.position[v * 3 + 2]];
    const n = [data.normal[v * 3], data.normal[v * 3 + 1], data.normal[v * 3 + 2]];
    // An eye: moved and scaled whole, to keep it a ball.
    const top = data.skinWeight[v * 4] > 0.5 ? data.skinIndex[v * 4] : -1;
    const eye = eyes.indexOf(top);
    if (eye >= 0) {
      const m = eye === 0 ? 1 : -1, k = fig.eye.radius / male.eye.radius;
      const a = male.eye.center, b = fig.eye.center;
      position[v * 3] = b[0] * m + (q[0] - a[0] * m) * k;
      position[v * 3 + 1] = b[1] + (q[1] - a[1]) * k;
      position[v * 3 + 2] = b[2] + (q[2] - a[2]) * k;
      normal.set(n, v * 3);
      continue;
    }
    weightsOf(data, v, qb, qw);
    const key = `${q[0]},${q[1]},${q[2]},${qb[0]}`;
    let hit = done.get(key);
    if (!hit) {
      shiftAt(F, q, qb, qw, s0, grad);
      hit = { s: s0.slice(), J: [0, 1, 2].map((r) => [0, 1, 2].map((c) => (r === c ? 1 : 0) + grad[r * 3 + c])) };
      done.set(key, hit);
    }
    const { s, J } = hit;
    position[v * 3] = q[0] + s[0]; position[v * 3 + 1] = q[1] + s[1]; position[v * 3 + 2] = q[2] + s[2];
    // The normal by the move's inverse transpose: the cofactor matrix's rows times n, the same direction.
    const c0 = [J[1][1] * J[2][2] - J[1][2] * J[2][1], J[1][2] * J[2][0] - J[1][0] * J[2][2], J[1][0] * J[2][1] - J[1][1] * J[2][0]];
    const c1 = [J[0][2] * J[2][1] - J[0][1] * J[2][2], J[0][0] * J[2][2] - J[0][2] * J[2][0], J[0][1] * J[2][0] - J[0][0] * J[2][1]];
    const c2 = [J[0][1] * J[1][2] - J[0][2] * J[1][1], J[0][2] * J[1][0] - J[0][0] * J[1][2], J[0][0] * J[1][1] - J[0][1] * J[1][0]];
    // (The cofactors are det J times the inverse transpose: where the move turns space inside out, det J < 0, turn it back.)
    const det = Math.sign(J[0][0] * c0[0] + J[0][1] * c0[1] + J[0][2] * c0[2]) || 1;
    let nx = det * (c0[0] * n[0] + c1[0] * n[1] + c2[0] * n[2]);
    let ny = det * (c0[1] * n[0] + c1[1] * n[1] + c2[1] * n[2]);
    let nz = det * (c0[2] * n[0] + c1[2] * n[1] + c2[2] * n[2]);
    const l = Math.hypot(nx, ny, nz);
    if (!(l > 1e-9)) { nx = n[0]; ny = n[1]; nz = n[2]; } else { nx /= l; ny /= l; nz /= l; }
    normal[v * 3] = nx; normal[v * 3 + 1] = ny; normal[v * 3 + 2] = nz;
  }
  // A surface (cloth, the mouth) shades by its own new shape: the move's gradient jumps a little where
  // the skin it follows changes (from the shin to the foot, say), and its normals would show that as a seam.
  // (Faced the way his faced: a turned hem faces in.)
  if (surface) return { ...data, position, normal: reshade(data, position, new Float32Array(data.count).fill(1)) };
  return { ...data, position, normal };
}

/** Where the nipples are on the figure `sex` (left), from the skin itself: the most forward point of the left breast. */
const apexes = new Map();
export function bustOf(sex) {
  if (apexes.has(sex)) return apexes.get(sex);
  const { pos } = bodyLevel(0, sex);
  const { joints } = figureOf(sex);
  let best = null;
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    if (x < 0.04 || x > 0.14 || y < joints.chest[1] - 0.12 || y > joints.chest[1] + 0.12) continue;
    if (!best || z > best[2]) best = [x, y, z];
  }
  apexes.set(sex, best);
  return best;
}

/**
 * Hangs the front of a garment on the trunk (`data`, already on her) as
 * cloth hangs over a bust: from the fullest of it, down at `down` (how far it
 * comes in for each metre it falls; small, so it falls nearly straight), in
 * toward the middle at `across` (bridging between the breasts), and back up
 * toward the collar at `up`. Out toward the sides it follows the body, as it
 * did. Only ever outward: each point is moved forward by as much as the cloth
 * in front of it, inside and out alike, so its hems, turns and layers keep
 * their thickness.
 */
export function hang(data, sex, { down = 0.3, across = 0.35, up = 1.6, out = 4, only = (z) => z.on !== 'arm' } = {}) {
  if (sex === 'male') return data;
  const apex = bustOf(sex);
  const { joints } = figureOf(sex);
  const C = 0.005, X0 = -0.2, nx = 81;
  const Y0 = joints.hips[1] - 0.25, Y1 = apex[1] + 0.2, ny = Math.ceil((Y1 - Y0) / C) + 1;
  const front = joints.chest[2] - 0.02;
  const P = data.position, N = data.normal;
  const Z = new Float32Array(nx * ny).fill(-Infinity);
  const cell = (x, y) => [Math.round((x - X0) / C), Math.round((y - Y0) / C)];
  const take = (v) => P[v * 3 + 2] > front && only(data.zones[v] ?? {}) && P[v * 3 + 1] > Y0 && P[v * 3 + 1] < Y1 && Math.abs(P[v * 3]) < -X0;
  for (let v = 0; v < data.count; v++) {
    if (!take(v) || N[v * 3 + 2] < 0.2) continue;
    const [i, j] = cell(P[v * 3], P[v * 3 + 1]);
    const k = j * nx + i;
    if (P[v * 3 + 2] > Z[k]) Z[k] = P[v * 3 + 2];
  }
  // The envelope: the most any cloth above, beside or below would hold it out.
  const E = new Float32Array(nx * ny).fill(-Infinity);
  const RY = Math.round(0.3 / C), RX = Math.round(0.12 / C);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * C;
      let e = Z[j * nx + i];
      if (e === -Infinity) continue;
      for (let jj = Math.max(0, j - RY); jj < Math.min(ny, j + RY + 1); jj++) {
        const dy = (jj - j) * C;
        const cy = dy > 0 ? down * dy : -up * dy;
        if (cy > 0.2) continue;
        for (let ii = Math.max(0, i - RX); ii < Math.min(nx, i + RX + 1); ii++) {
          const z = Z[jj * nx + ii];
          if (z === -Infinity) continue;
          const xs = X0 + ii * C;
          // From the source toward the middle line costs `across`; away from it, `out`.
          const toward = Math.abs(x) < Math.abs(xs) && Math.sign(x) * Math.sign(xs) >= 0;
          const reach = z - cy - (toward ? across : out) * Math.abs(x - xs);
          if (reach > e) e = reach;
        }
      }
      E[j * nx + i] = e;
    }
  }
  // How far forward each cell's cloth goes, smoothed a little so it rounds into the rest.
  let L = new Float32Array(nx * ny);
  for (let k = 0; k < L.length; k++) L[k] = Z[k] === -Infinity ? 0 : Math.max(0, E[k] - Z[k]);
  for (let pass = 0; pass < 3; pass++) {
    const next = new Float32Array(L.length);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let s = 0, n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny || Z[b * nx + a] === -Infinity) continue;
        s += L[b * nx + a]; n++;
      }
      next[j * nx + i] = n ? s / n : 0;
    }
    L = next;
  }
  const lift = (x, y) => {
    const fx = (x - X0) / C, fy = (y - Y0) / C;
    const i = Math.max(0, Math.min(nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(ny - 2, Math.floor(fy)));
    const a = Math.min(1, Math.max(0, fx - i)), b = Math.min(1, Math.max(0, fy - j));
    return (L[j * nx + i] * (1 - a) + L[j * nx + i + 1] * a) * (1 - b) + (L[(j + 1) * nx + i] * (1 - a) + L[(j + 1) * nx + i + 1] * a) * b;
  };
  const position = P.slice();
  const moved = new Float32Array(data.count);
  for (let v = 0; v < data.count; v++) {
    if (!take(v)) continue;
    // Faded in from the sides, so the cloth turning round them keeps to the body.
    const fade = Math.min(1, Math.max(0, (P[v * 3 + 2] - front) / 0.03));
    moved[v] = lift(P[v * 3], P[v * 3 + 1]) * fade;
    position[v * 3 + 2] += moved[v];
  }
  return { ...data, position, normal: reshade(data, position, moved) };
}

/**
 * Wraps the front of a close garment (`data`, already on her) as a stretched
 * knit lies over a bust, a sports bra: as a ball of `ball` radius rolled over
 * her front would leave it. It fills what the ball cannot reach (between the
 * breasts, the crease under them, round the nipples) and leaves the rest,
 * every outward curve, where it was. Only ever forward, and only between
 * the fullest of the breasts: out past them it follows her round her sides,
 * as a close knit does, and is not slid along itself into folds. Within `hem` of its lowest edge it
 * holds to the body (the band). First it is kept `ease` clear of her skin
 * (made on his flat chest and carried over, it can sink into the tips).
 */
export function wrap(data, sex, { ball = 0.05, hem = 0, ease = 0.0025, only = (z) => z.on !== 'arm' } = {}) {
  if (sex === 'male') return data;
  const { joints } = figureOf(sex);
  const apex = bustOf(sex);
  const C = 0.004, X0 = -0.22, nx = Math.round((-2 * X0) / C) + 1;
  // (Over the bust: elsewhere it lies on him much as on her.)
  const P = clear(data, sex, ease, (v) => only(data.zones[v] ?? {}) && data.position[v * 3 + 2] > joints.chest[2] - 0.02
    && Math.abs(Math.abs(data.position[v * 3]) - apex[0]) < 0.05 && Math.abs(data.position[v * 3 + 1] - apex[1]) < 0.07);
  const pushed = new Float32Array(data.count);
  for (let v = 0; v < data.count; v++) pushed[v] = Math.hypot(P[v * 3] - data.position[v * 3], P[v * 3 + 1] - data.position[v * 3 + 1], P[v * 3 + 2] - data.position[v * 3 + 2]);
  const front = joints.chest[2] - 0.02;
  let Y0 = Infinity, Y1 = -Infinity;
  const take = (v) => P[v * 3 + 2] > front && only(data.zones[v] ?? {}) && Math.abs(P[v * 3]) < -X0;
  for (let v = 0; v < data.count; v++) if (take(v)) { Y0 = Math.min(Y0, P[v * 3 + 1]); Y1 = Math.max(Y1, P[v * 3 + 1]); }
  if (Y0 > Y1) return data;
  const pad = Math.ceil(ball / C) + 2;
  Y0 -= pad * C; Y1 += pad * C;
  const ny = Math.ceil((Y1 - Y0) / C) + 1;
  // How far forward the cloth is, cell by cell (its outermost layer).
  const Z = new Float32Array(nx * ny).fill(-Infinity);
  for (let v = 0; v < data.count; v++) {
    if (!take(v)) continue;
    const k = Math.round((P[v * 3 + 1] - Y0) / C) * nx + Math.round((P[v * 3] - X0) / C);
    if (P[v * 3 + 2] > Z[k]) Z[k] = P[v * 3 + 2];
  }
  // Carried on past its edges and into its gaps, as it was going, so the ball rolls off them as it would off more of it.
  const F = Z.slice();
  for (let pass = 0; pass < pad; pass++) {
    const was = F.slice();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (was[j * nx + i] !== -Infinity) continue;
      let s = 0, n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny || was[b * nx + a] === -Infinity) continue;
        s += was[b * nx + a]; n++;
      }
      if (n) F[j * nx + i] = s / n;
    }
  }
  // The ball rolled over it: the highest it rests at over each cell (a dilation), then where its front reaches (an erosion).
  const r = Math.ceil(ball / C), cap = [];
  for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const d2 = (di * di + dj * dj) * C * C;
    if (d2 <= ball * ball) cap.push([di, dj, Math.sqrt(ball * ball - d2)]);
  }
  const D = new Float32Array(nx * ny).fill(-Infinity);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let m = -Infinity;
    for (const [di, dj, h] of cap) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const z = F[b * nx + a] + h;
      if (z > m) m = z;
    }
    D[j * nx + i] = m;
  }
  const L = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (F[k] === -Infinity) continue;
    let m = Infinity;
    for (const [di, dj, h] of cap) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const z = D[b * nx + a] - h;
      if (z < m) m = z;
    }
    L[k] = m === Infinity ? 0 : Math.max(0, m - F[k]);
  }
  // As far as the cloth there faces forward (by its slope, so every layer of it, a turned hem's too, moves as one).
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const k = j * nx + i;
    const gx = (F[k + 1] - F[k - 1]) / (2 * C), gy = (F[k + nx] - F[k - nx]) / (2 * C);
    if (!Number.isFinite(gx) || !Number.isFinite(gy)) { L[k] = 0; continue; }
    const t = Math.min(1, Math.max(0, (1 / Math.hypot(1, gx, gy) - 0.25) / 0.35));
    L[k] *= t * t * (3 - 2 * t);
  }
  const at = (G, x, y) => {
    const fx = (x - X0) / C, fy = (y - Y0) / C;
    const i = Math.max(0, Math.min(nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(ny - 2, Math.floor(fy)));
    const a = Math.min(1, Math.max(0, fx - i)), b = Math.min(1, Math.max(0, fy - j));
    return (G[j * nx + i] * (1 - a) + G[j * nx + i + 1] * a) * (1 - b) + (G[(j + 1) * nx + i] * (1 - a) + G[(j + 1) * nx + i + 1] * a) * b;
  };
  // The outermost cloth, where there is any (its gaps and beyond as carried on), for how deep under it each point is.
  const top = F.map((z) => (z === -Infinity ? 0 : z));
  const low = Y0 + pad * C;
  const position = P.slice();
  const moved = new Float32Array(data.count);
  for (let v = 0; v < data.count; v++) {
    if (!take(v)) continue;
    const fade = Math.min(1, Math.max(0, (P[v * 3 + 2] - front) / 0.03))
      * Math.min(1, Math.max(0, (apex[0] + 0.015 - Math.abs(P[v * 3])) / 0.025))
      * (hem ? Math.min(1, Math.max(0, (P[v * 3 + 1] - low - hem) / hem)) : 1);
    // Up to the wrapped surface, a point under the outermost cloth (in a crease, a turned hem) keeping no more than a
    // hem's depth under it: the cloth in the crease comes out to bridge it, not left folded in.
    const x = P[v * 3], y = P[v * 3 + 1], surface = at(top, x, y);
    const under = Math.min(Math.max(0, surface - P[v * 3 + 2]), 0.006);
    // (Only where the wrap lifts it: elsewhere, at her sides say, cloth behind is just more of the cloth going round.)
    const l = at(L, x, y);
    moved[v] = Math.max(0, surface + l - under - P[v * 3 + 2]) * Math.min(1, l / 0.004) * fade;
    position[v * 3 + 2] += moved[v];
  }
  for (let v = 0; v < data.count; v++) moved[v] += pushed[v];
  return { ...data, position, normal: reshade(data, position, moved) };
}

/**
 * The points of `data` that `which` picks, kept `ease` out from her skin
 * (along the skin's normal) where they face the way it does: the cloth's
 * outer side. A copy of the positions.
 */
function clear(data, sex, ease, which) {
  const { pos, faces } = bodyLevel(1, sex);
  const n = new Float32Array(pos.length);
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const u = [pos[c * 3] - pos[a * 3], pos[c * 3 + 1] - pos[a * 3 + 1], pos[c * 3 + 2] - pos[a * 3 + 2]];
    const w = [pos[d * 3] - pos[b * 3], pos[d * 3 + 1] - pos[b * 3 + 1], pos[d * 3 + 2] - pos[b * 3 + 2]];
    const q = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  const CELL = 0.01, cells = new Map();
  const key = (x, y, z) => (x + 512) * 1048576 + (y + 512) * 1024 + (z + 512);
  for (let v = 0; v < pos.length / 3; v++) {
    if (pos[v * 3 + 1] < 0.9 || pos[v * 3 + 1] > 1.5) continue;
    const k = key(Math.floor(pos[v * 3] / CELL), Math.floor(pos[v * 3 + 1] / CELL), Math.floor(pos[v * 3 + 2] / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(v);
  }
  const P = data.position.slice(), N = data.normal;
  for (let v = 0; v < data.count; v++) {
    if (!which(v)) continue;
    const p = [P[v * 3], P[v * 3 + 1], P[v * 3 + 2]];
    const cx = Math.floor(p[0] / CELL), cy = Math.floor(p[1] / CELL), cz = Math.floor(p[2] / CELL);
    let best = -1, bd = Infinity;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      for (const s of cells.get(key(cx + i, cy + j, cz + k)) ?? []) {
        const d = (pos[s * 3] - p[0]) ** 2 + (pos[s * 3 + 1] - p[1]) ** 2 + (pos[s * 3 + 2] - p[2]) ** 2;
        if (d < bd) { bd = d; best = s; }
      }
    }
    if (best < 0) continue;
    const l = Math.hypot(n[best * 3], n[best * 3 + 1], n[best * 3 + 2]) || 1;
    const sn = [n[best * 3] / l, n[best * 3 + 1] / l, n[best * 3 + 2] / l];
    if (sn[0] * N[v * 3] + sn[1] * N[v * 3 + 1] + sn[2] * N[v * 3 + 2] <= 0) continue;
    const d = (p[0] - pos[best * 3]) * sn[0] + (p[1] - pos[best * 3 + 1]) * sn[1] + (p[2] - pos[best * 3 + 2]) * sn[2];
    if (d < ease) for (let c = 0; c < 3; c++) P[v * 3 + c] += sn[c] * (ease - d);
  }
  return P;
}

/**
 * Normals for the points `moved` (by how far): the surface's own, from its
 * triangles, the points at one place shared (so a seam of the UVs shows no
 * crease), blended in as far as each was moved.
 */
function reshade(data, P, moved) {
  const acc = new Float32Array(P.length);
  const weld = new Map(), id = new Uint32Array(data.count);
  for (let v = 0; v < data.count; v++) {
    const k = `${Math.round(P[v * 3] * 2e4)},${Math.round(P[v * 3 + 1] * 2e4)},${Math.round(P[v * 3 + 2] * 2e4)}`;
    if (!weld.has(k)) weld.set(k, v);
    id[v] = weld.get(k);
  }
  const I = data.index;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    if (!(moved[a] || moved[b] || moved[c])) continue;
    const e1 = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]];
    const e2 = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) acc[id[v] * 3 + k] += n[k];
  }
  const normal = data.normal.slice();
  for (let v = 0; v < data.count; v++) {
    if (!moved[v]) continue;
    const o = id[v] * 3, l = Math.hypot(acc[o], acc[o + 1], acc[o + 2]);
    if (!(l > 0)) continue;
    // Facing the way it faced (a hem turned in faces in).
    const s = acc[o] * normal[v * 3] + acc[o + 1] * normal[v * 3 + 1] + acc[o + 2] * normal[v * 3 + 2] < 0 ? -1 : 1;
    const k = Math.min(1, moved[v] / 0.004);
    const n = [0, 1, 2].map((i) => normal[v * 3 + i] * (1 - k) + (s * acc[o + i] / l) * k);
    const m = Math.hypot(...n) || 1;
    for (let i = 0; i < 3; i++) normal[v * 3 + i] = n[i] / m;
  }
  return normal;
}
