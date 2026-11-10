import { bodyLevel } from './basemesh.js';
import { BONES as BAKED_BONES } from './data/base.js';
import { withLipCorners } from './head.js';
import { cross, dot, len, noise3, norm, Part, profile, smooth, sub } from './kit.js';
import { EYE, FACE } from './skeleton.js';

/**
 * Hair and facial hair, made as games make them: hair cards. Each card is
 * a narrow strip grown from a root on the scalp (or the face) along the way
 * the hair is combed, lying on the hair under it, with a texture of a clump
 * of strands on it, its gaps cut out by the alpha test. Under the cards the
 * skin is painted the hair's colour where it grows (textures.js), so no
 * scalp shows between them.
 *
 * A style says where hair grows (its line on the head), how long it is at
 * each place, which way it is combed, how much it stands off the head, and
 * how many cards it takes. The cut here is a short side part: about 5 cm
 * on top, combed across from a parting over the left eye, tapering to a few
 * millimetres over the ears and at the nape. The beard is a full beard of
 * about 2 cm, longer at the chin: a natural cheek line from the sideburn to
 * the corner of the moustache, a neckline two fingers above the Adam's
 * apple, along the jaw.
 *
 * The cards' normals are the head's under them, so the hair shades as one
 * mass, the way a head of hair does, not card by card.
 */

/** A small seeded generator, so a style comes out the same every time. */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The middle of the skull, for the hairline's bearing round the head.
const SKULL = [0, 1.675, 0.045];
/** Bearing round the head from the front: 0 at the forehead, π/2 over the ear, π at the nape. */
const bearing = (p) => Math.atan2(Math.abs(p[0]), p[2] - SKULL[2]);

// The hairline: its height at each bearing. Across the forehead, back at the temples, down
// in front of each ear for the sideburn (a band about 2.5 cm wide, from the temple to the ear),
// over the ear, and down behind it to the nape.
const HAIRLINE = profile([
  [0, 1.737], [0.5, 1.733], [0.8, 1.722], [1.0, 1.706], [1.1, 1.672], [1.17, 1.648], [1.38, 1.645],
  [1.47, 1.69], [1.62, 1.694], [1.78, 1.682], [1.95, 1.652], [2.2, 1.628], [2.6, 1.614], [Math.PI, 1.607],
]);

/** How much hair grows on the scalp at `p` (rest, metres), with normal `n`: 0 to 1, soft at the hairline. */
export function scalpCover(p, n) {
  if (p[1] < 1.58) return 0;
  // Only the outside of the head (not the inside of the mouth or the ear's hollow).
  if (n && dot(n, sub(p, SKULL)) <= 0) return 0;
  // A hairline is never a clean line: it wavers, and thins out over a few millimetres.
  // (Taken over a little span of bearings, so its steep parts — the sideburn's edges — are soft too.)
  const b = bearing(p);
  const H = (HAIRLINE(b - 0.05) + HAIRLINE(b - 0.025) + HAIRLINE(b) + HAIRLINE(b + 0.025) + HAIRLINE(b + 0.05)) / 5
    + 0.0035 * noise3(p[0] * 160, p[1] * 60, p[2] * 160);
  return smooth(H - 0.004, H + 0.006, p[1]);
}

// The beard's top edge, by distance from the middle of the face: the moustache under the
// nose, then the cheek line rising to the sideburn.
// From the corner of the moustache it runs straight up the cheek to the top of the sideburn, at the
// top of the ear.
const CHEEKLINE = profile([[0, 1.6035], [0.015, 1.6045], [0.026, 1.6], [0.035, 1.606], [0.05, 1.628], [0.065, 1.655], [0.075, 1.675], [0.09, 1.69]]);

/** The lips' outline at `s` across: [lower, upper] heights (as the skin painter draws them). */
function lipsAt(s) {
  const M = FACE.mouth, lc = FACE.lipCorner[0] + 0.001;
  const t = Math.min(1, s / lc);
  const slit = M[1] - (M[1] - FACE.lipCorner[1]) * t * t;
  const up = slit + 0.0102 * Math.sqrt(Math.max(0, 1 - t * t)) * smooth(1, 0.85, t) + 0.0006;
  const low = slit - 0.0128 * Math.pow(Math.max(0, 1 - t * t), 0.55);
  return [low, up];
}

// The full beard's outline, seen from the side, as a barber draws it: a line from behind the top
// of the ear down and forward across the neck to the throat (its back edge); a line from above the
// front of the ear down across the cheek to just under the corner of the mouth (its top edge); and
// a level line under the chin, where it is trimmed (BEARD_FLOOR). In metres, [y, z] at each end.
const BEARD_BACK = [[1.6697, 0.0127], [1.5048, 0.1148]];
const BEARD_TOP = [[1.685, 0.0383], [1.527, 0.2057]];
const BEARD_FLOOR = 1.533;
/** Where a line [[y0, z0], [y1, z1]] is at height `y` (its z), or at depth `z` (its y). */
const zOn = ([[y0, z0], [y1, z1]], y) => z0 + ((y - y0) * (z1 - z0)) / (y1 - y0);
const yOn = ([[y0, z0], [y1, z1]], z) => y0 + ((z - z0) * (y1 - y0)) / (z1 - z0);

/** The beard's top edge over `p`: the line across the cheek, and in front, between the nose and the lip, the moustache's own line. */
function beardTop(p) {
  const front = smooth(0.036, 0.028, Math.abs(p[0]));
  return CHEEKLINE(Math.abs(p[0])) * front + yOn(BEARD_TOP, p[2]) * (1 - front);
}

/** How much beard grows at `p` (rest) with normal `n`: 0 to 1. */
export function beardCover(p, n) {
  const s = Math.abs(p[0]), y = p[1], z = p[2];
  if (y > 1.7 || y < 1.5) return 0;
  if (n && dot(n, sub(p, [0, 1.6, 0.04])) <= 0) return 0;
  // Not on the ear.
  if (s > 0.07 && y > 1.605 && y < 1.697 && z < 0.058) return 0;
  // In front of its back edge, and never back past the front of the ear (nothing under the ear).
  const back = Math.max(zOn(BEARD_BACK, y), 0.06);
  let c = smooth(back - 0.002, back + 0.004, z);
  // Under its top edge: crisp across the cheek, thinning out up the side of the face, where it
  // becomes the sideburn.
  const top = beardTop(p), soft = 0.002 + 0.014 * smooth(0.05, 0.065, s);
  c *= smooth(top + 0.002, top - soft, y);
  // Its bottom edge: the neckline, level, just under the chin.
  c *= smooth(BEARD_FLOOR - 0.007, BEARD_FLOOR - 0.002, y);
  // Not on the lips, and a hair's gap round them.
  const lc = FACE.lipCorner[0];
  if (s < lc + 0.004 && z > FACE.mouth[2] - 0.03) {
    const [low, up] = lipsAt(s);
    const along = smooth(lc + 0.004, lc - 0.001, s);
    c *= 1 - along * smooth(low - 0.0045, low - 0.002, y) * smooth(up + 0.0016, up + 0.0004, y);
  }
  return c;
}

/**
 * The head's surface (the subdivided body, from the shoulders up): each
 * vertex's position, normal and weights, with a grid to find the nearest.
 */
let headSurface = null;
function surface() {
  if (headSurface) return headSurface;
  const { pos, faces, weights } = bodyLevel(1);
  const count = pos.length / 3;
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const n = new Float32Array(pos.length);
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const q = cross(sub(P(c), P(a)), sub(P(d), P(b)));
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  const CELL = 0.01, cells = new Map();
  // A cell as one number (cells within ±5 m of the origin: the body is well inside).
  const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const near = [];
  for (let v = 0; v < count; v++) {
    if (pos[v * 3 + 1] < 1.45) continue;
    const l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1;
    n[v * 3] /= l; n[v * 3 + 1] /= l; n[v * 3 + 2] /= l;
    near.push(v);
    const k = key(Math.floor(pos[v * 3] / CELL), Math.floor(pos[v * 3 + 1] / CELL), Math.floor(pos[v * 3 + 2] / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(v);
  }
  /** The nearest surface vertex to `p`. */
  const nearest = (p) => {
    const cx = Math.floor(p[0] / CELL), cy = Math.floor(p[1] / CELL), cz = Math.floor(p[2] / CELL);
    let best = -1, bd = Infinity;
    for (let r = 1; r <= 3 && best < 0; r++) {
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
        const list = cells.get(key(cx + i, cy + j, cz + k));
        if (!list) continue;
        for (const v of list) {
          const d = (pos[v * 3] - p[0]) ** 2 + (pos[v * 3 + 1] - p[1]) ** 2 + (pos[v * 3 + 2] - p[2]) ** 2;
          if (d < bd) { bd = d; best = v; }
        }
      }
    }
    return best;
  };
  const named = (v) => {
    const w = {};
    for (const [b, x] of Object.entries(weights[v])) w[BAKED_BONES[b]] = (w[BAKED_BONES[b]] ?? 0) + x;
    return withLipCorners(w, P(v));
  };
  headSurface = { pos, faces, n, P, N: (v) => [n[v * 3], n[v * 3 + 1], n[v * 3 + 2]], nearest, named };
  return headSurface;
}

/**
 * Roots scattered over the head where `cover` says hair grows, about
 * `count` of them, thicker where it grows thicker: [position, normal].
 */
function scatter(cover, count, rnd, density = null) {
  const S = surface();
  const quads = [];
  let total = 0;
  for (let f = 0; f < S.faces.length; f += 4) {
    const v = [S.faces[f], S.faces[f + 1], S.faces[f + 2], S.faces[f + 3]];
    if (v.some((i) => S.pos[i * 3 + 1] < 1.45)) continue;
    const ps = v.map(S.P);
    const mid = [0, 1, 2].map((k) => (ps[0][k] + ps[1][k] + ps[2][k] + ps[3][k]) / 4);
    const nm = norm(v.map(S.N).reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]));
    const c = cover(mid, nm) * (density ? density(mid) : 1);
    if (c <= 0.02) continue;
    const area = Math.hypot(...cross(sub(ps[2], ps[0]), sub(ps[3], ps[1]))) / 2;
    quads.push({ v, ps, area: area * c });
    total += area * c;
  }
  const roots = [];
  const per = count / total;
  for (const q of quads) {
    let k = q.area * per;
    while (k > 0) {
      if (k >= 1 || rnd() < k) {
        const a = rnd(), b = rnd();
        const lerp4 = (A) => [0, 1, 2].map((i) => (A[0][i] * (1 - a) + A[1][i] * a) * (1 - b) + (A[3][i] * (1 - a) + A[2][i] * a) * b);
        const p = lerp4(q.ps);
        const n = norm(lerp4(q.v.map(S.N)));
        // Thinning toward the edge: fewer roots where the cover fades.
        if (rnd() < cover(p, n)) roots.push([p, n]);
      }
      k -= 1;
    }
  }
  return roots;
}

/**
 * One strand's path from `root` (normal `n0`): `steps` points, combed by the
 * style's field, bent by its weight, and kept on the hair under it. Each
 * lies a layer out from the head (`layer` 0 against it, 1 at the outside).
 */
function grow(style, [root, n0], L, layer, steps) {
  const S = surface();
  const ds = L / steps;
  const comb = style.comb(root, n0);
  let dir = norm([n0[0] * style.rise + comb[0], n0[1] * style.rise + comb[1], n0[2] * style.rise + comb[2]]);
  // A little under the skin, so the root never shows its end.
  let p = [root[0] - n0[0] * 0.0012, root[1] - n0[1] * 0.0012, root[2] - n0[2] * 0.0012];
  const pts = [p], normals = [n0];
  const thick = (typeof style.volume === 'function' ? style.volume(root) : style.volume) * L;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const c = style.comb(p, normals[normals.length - 1]);
    const bend = Math.min(1, (ds / L) * style.follow);
    dir = norm([dir[0] + c[0] * bend, dir[1] + c[1] * bend - style.weight * ds / L, dir[2] + c[2] * bend]);
    p = [p[0] + dir[0] * ds, p[1] + dir[1] * ds, p[2] + dir[2] * ds];
    const v = S.nearest(p);
    const q = S.P(v), n = S.N(v);
    const d = dot(sub(p, q), n);
    // Its layer's height over the head, and only so much looser: hair lies on the hair under it,
    // a little freer near the root, where it lifts off the scalp.
    const want = 0.0009 + layer * thick * smooth(0, 0.45, t);
    const most = want + L * (style.loose + style.lift * (1 - t) ** 2);
    const to = d < want ? want : d > most ? most : d;
    if (to !== d) p = [p[0] + n[0] * (to - d), p[1] + n[1] * (to - d), p[2] + n[2] * (to - d)];
    // Trimmed level underneath (a beard's bottom line): what would hang lower lies along it.
    if (style.floor !== undefined && p[1] < style.floor) p = [p[0], style.floor, p[2]];
    const prev = pts[pts.length - 1];
    dir = norm(sub(p, prev));
    pts.push(p);
    normals.push(n);
  }
  return { pts, normals };
}

/**
 * The body from the hips up, without the arms: where long hair lies once it
 * falls past the head (the neck, the shoulders, the back).
 */
let torsoSurface = null;
function torso() {
  if (torsoSurface) return torsoSurface;
  const { pos, faces, weights } = bodyLevel(0);
  const count = pos.length / 3;
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const n = new Float32Array(pos.length);
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const q = cross(sub(P(c), P(a)), sub(P(d), P(b)));
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  const limb = new Set(BAKED_BONES.map((b, i) => (/^(arm|fore|hand|thumb|index|middle|ring|pinky)/.test(b) ? i : -1)).filter((i) => i >= 0));
  const CELL = 0.02, cells = new Map();
  // A cell as one number (cells within ±5 m of the origin: the body is well inside).
  const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  for (let v = 0; v < count; v++) {
    if (pos[v * 3 + 1] < 0.95 || !Object.keys(weights[v]).length) continue;
    // Not the arms: the hair falls behind them, and they move away from it.
    let arm = 0;
    for (const [b, x] of Object.entries(weights[v])) if (limb.has(+b)) arm += x;
    if (arm > 0.5) continue;
    const l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1;
    n[v * 3] /= l; n[v * 3 + 1] /= l; n[v * 3 + 2] /= l;
    const k = key(Math.floor(pos[v * 3] / CELL), Math.floor(pos[v * 3 + 1] / CELL), Math.floor(pos[v * 3 + 2] / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(v);
  }
  /** How far `p` is out from the skin nearest it (along that skin's normal), and that normal; null far from it. */
  const outside = (p) => {
    const cx = Math.floor(p[0] / CELL), cy = Math.floor(p[1] / CELL), cz = Math.floor(p[2] / CELL);
    let best = -1, bd = Infinity;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
      const list = cells.get(key(cx + i, cy + j, cz + k));
      if (!list) continue;
      for (const v of list) {
        const d = (pos[v * 3] - p[0]) ** 2 + (pos[v * 3 + 1] - p[1]) ** 2 + (pos[v * 3 + 2] - p[2]) ** 2;
        if (d < bd) { bd = d; best = v; }
      }
    }
    if (best < 0) return null;
    const nn = [n[best * 3], n[best * 3 + 1], n[best * 3 + 2]];
    return { d: dot(sub(p, P(best)), nn), n: nn };
  };
  torsoSurface = { outside };
  return torsoSurface;
}

/**
 * A long strand's path from `root`: combed along the head (lying on the hair
 * under it, `layer` 0 against the scalp, 1 at the outside), then, once it
 * leaves the head, falling, and lying where it falls: over the shoulders and
 * down the back, never into them. It ends at the style's cut (`endAt`), or
 * at `L` long, whichever comes first.
 */
function fall(style, [root, n0], L, layer, fine, rnd) {
  const S = surface(), T = torso();
  const thick = style.volume * layer;
  let p = [root[0] - n0[0] * 0.0012, root[1] - n0[1] * 0.0012, root[2] - n0[2] * 0.0012];
  let dir = norm(add3(times(n0, style.rise), style.comb(root, n0)));
  const pts = [p], normals = [n0];
  const end = style.endAt(root) + (rnd() - 0.5) * 0.03;
  let run = 0;
  while (run < L && p[1] > end) {
    // Fine along the head, where it curves; longer steps where it hangs.
    const onHead = smooth(1.56, 1.64, p[1]);
    const ds = (fine ? 0.012 : 0.02) * (1 + 1.2 * (1 - onHead));
    const c = style.comb(p, normals[normals.length - 1]);
    // Gravity takes it as it leaves the top of the head.
    const g = style.weight * (0.25 + 0.75 * smooth(1.74, 1.62, p[1]));
    // Hanging, it falls behind the shoulders, not in front of them.
    const back = (style.drift ?? 0) * (1 - onHead) * smooth(-0.04, 0.04, p[2]);
    dir = norm([dir[0] * 0.55 + c[0] * 0.45 * onHead, dir[1] * 0.55 + c[1] * 0.45 * onHead - g, dir[2] * 0.55 + c[2] * 0.45 * onHead - back]);
    // Once it hangs it falls straight, not on in under the back of the head toward the neck.
    if (onHead < 1 && p[2] < -0.01 && dir[2] > 0) dir = norm([dir[0], dir[1], dir[2] * onHead]);
    p = [p[0] + dir[0] * ds, p[1] + dir[1] * ds, p[2] + dir[2] * ds];
    run += ds;
    let n = normals[normals.length - 1];
    // On the head: on its layer of the hair, close.
    if (p[1] > 1.45) {
      const v = S.nearest(p);
      if (v >= 0) {
        const q = S.P(v), hn = S.N(v), d = dot(sub(p, q), hn);
        // Flat at the root (a hairline lies on the skin), its layer's height built up along it.
        const want = 0.0015 + thick * (0.35 + 0.65 * smooth(1.78, 1.62, p[1])) * smooth(0, 0.07, run);
        const most = want + 0.004 + 0.01 * (1 - onHead);
        // (Held to the head only where it faces up or out: under the back of the head, where it turns in
        // toward the neck, the hair leaves it and falls.)
        const to = d < want ? want : d > most && onHead > 0.5 && hn[1] > -0.15 ? most : d;
        if (to !== d) p = [p[0] + hn[0] * (to - d), p[1] + hn[1] * (to - d), p[2] + hn[2] * (to - d)];
        n = hn;
      }
    }
    // Off it: kept outside the neck, the shoulders and the back, lying on them, and over what is worn
    // there (a jacket stands a few centimetres off the skin; its collar less).
    const o = T.outside(p);
    if (o) {
      const want = 0.006 + (style.over ?? 0) * smooth(1.52, 1.4, p[1]) + thick * 0.6;
      if (o.d < want) p = [p[0] + o.n[0] * (want - o.d), p[1] + o.n[1] * (want - o.d), p[2] + o.n[2] * (want - o.d)];
      // (Turned gradually, so a card does not twist where it comes off the head.)
      if (p[1] < 1.56) n = norm(add3(times(n, 0.7), times(norm([o.n[0], o.n[1] * 0.3, o.n[2]]), 0.3)));
    }
    const prev = pts[pts.length - 1];
    dir = norm(sub(p, prev));
    pts.push(p);
    normals.push(n);
  }
  return { pts, normals };
}

// The strand texture: COLUMNS clumps side by side, root at v 0, tip at v 1.
const COLUMNS = 4;

/**
 * Which of a strand's points a card needs: its ends, every point where it
 * bends or turns (more than `tol` off the straight line between the points
 * kept either side, or its normal more than 0.03 rad off), and every point
 * in `blend` (heights where its skin weights change, so it bends there as
 * the body under it does). Where hair hangs straight the rest add nothing.
 */
function needed({ pts, normals }, tol = 0.0004, blend = [1.34, 1.64]) {
  const n = pts.length, keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  for (let i = 0; i < n; i++) if (pts[i][1] > blend[0] && pts[i][1] < blend[1]) keep[i] = 1;
  const split = (a, b) => {
    let worst = 0, at = -1;
    const ab = sub(pts[b], pts[a]), L2 = dot(ab, ab) || 1;
    for (let i = a + 1; i < b; i++) {
      const t = dot(sub(pts[i], pts[a]), ab) / L2;
      const off = len(sub(sub(pts[i], pts[a]), times(ab, t)));
      const turn = Math.acos(Math.max(-1, Math.min(1, dot(normals[i], norm(add3(times(normals[a], 1 - t), times(normals[b], t)))))));
      const bad = Math.max(off / tol, turn / 0.03);
      if (bad > worst) { worst = bad; at = i; }
    }
    if (worst > 1) { keep[at] = 1; split(a, at); split(at, b); }
  };
  let a = 0;
  for (let i = 1; i < n; i++) if (keep[i]) { split(a, i); a = i; }
  return keep;
}

/** One card into `part` along a strand: `width` across at the root, narrowing to the tip; the texture's `column`. */
function card(part, strand, width, column, weights, shade, rootFade = 0) {
  // Only the points it needs; each keeps where along the strand it was (`ts`), for the taper and shading.
  const keep = needed(strand);
  const all = strand.pts.length - 1;
  const ts = [], pts = [], normals = [];
  strand.pts.forEach((p, i) => { if (keep[i]) { ts.push(i / all); pts.push(p); normals.push(strand.normals[i]); } });
  const steps = pts.length - 1;
  // Where along the texture each point is: evenly, or (for long hair, `rootFade` metres) the texture's
  // fading-in roots kept to the first few centimetres, the rest of it spread over the length.
  const arc = [0];
  for (let i = 1; i <= steps; i++) arc.push(arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const L = arc[steps] || 1;
  const vOf = (i) => (!rootFade ? ts[i] : arc[i] < rootFade ? (0.18 * arc[i]) / rootFade : 0.18 + (0.82 * (arc[i] - rootFade)) / Math.max(1e-6, L - rootFade));
  // Faced out from the head, so the side seen from outside is the front, its normal the head's.
  part.grid(steps, 1, (i, j) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(steps, i + 1)];
    const along = norm(sub(b, a));
    const n = normals[i];
    const side = norm(cross(along, n));
    const t = ts[i];
    const w = width * (1 - 0.55 * t ** 1.4) * (j - 0.5);
    const p = [pts[i][0] + side[0] * w, pts[i][1] + side[1] * w, pts[i][2] + side[2] * w];
    return { p, uv: [(column + 0.04 + 0.92 * j) / COLUMNS, vOf(i)], w: typeof weights === 'function' ? weights(pts[i]) : weights, tint: shade(t), n, zone: { zone: 'head', y: p[1], d: 0 } };
  }, { flip: true });
}

/** Builds a style's cards as one part in `material`, `fine` (detail 0.8 and up) or not. */
function cards(style, material, fine, rigid) {
  const S = surface();
  const rnd = random(style.seed);
  const part = new Part(style.name, material);
  // More of them out at the top of the hair, where they make its outline; built from the inside out,
  // so the soft edges drawn over them (blended, in the order they come) lie the right way.
  const roots = scatter(style.cover, Math.round(style.cards * (fine ? 1 : 0.55)), rnd, style.density?.bind(style))
    .map((r) => ({ r, layer: rnd() ** 0.7, k: rnd() })).sort((a, b) => a.layer - b.layer);
  for (const { r, layer, k } of roots) {
    const L = style.length(r[0], r[1]) * (0.85 + 0.3 * k);
    if (L < style.shortest) continue;
    const steps = Math.max(2, Math.min(fine ? 9 : 5, Math.round(L / (fine ? 0.0055 : 0.01))));
    const strand = style.fall ? fall(style, r, L, layer, fine, rnd) : grow(style, r, L, layer, steps);
    if (strand.pts.length < 3) continue;
    const weights = style.weightsAt ? style.weightsAt : rigid ? { head: 1 } : S.named(S.nearest(r[0]));
    // Darker at the root and deep in the hair, where less light gets in.
    // (Short hair lets more light down to its roots.)
    // (Cropped hair, lying close in the light, barely darkens at all.)
    const crop = smooth(0.02, 0.008, L);
    const deep = 0.62 + 0.38 * Math.max(layer, crop), root = 0.5 + 0.4 * crop;
    const tone = style.tone ?? 1;
    const shade = (t) => tone * deep * (root + (1 - root) * smooth(0, 0.7, t));
    const columns = style.columns ?? [0, 0, 1, 1, 2, 2, 3];
    // Short hair in narrower cards, so a card's clump stays a clump's shape.
    // Short hair in narrow cards of the looser clumps, so a short card is a few hairs, not a squashed clump.
    const short = L < 0.016;
    const width = Math.min(style.width * (0.8 + 0.4 * rnd()) * (style.widthAt ? style.widthAt(r[0]) : 1), L * (0.5 + 0.3 * rnd()) + 0.004 * smooth(0.016, 0.03, L));
    const column = short ? 2 + Math.floor(rnd() * 2) : columns[Math.floor(rnd() * columns.length)];
    card(part, strand, width, column, weights, shade, style.fall ? 0.025 : 0);
  }
  return part;
}

const add3 = (...vs) => vs.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);
const times = (v, k) => [v[0] * k, v[1] * k, v[2] * k];

// The parting, over the left eye (his left: +x), from the hairline back toward the crown.
const PART_X = 0.036;

// A woman's hairline: rounder, full at the temples, no sideburn to speak of (bearing → height, as HAIRLINE).
const HAIRLINE_FULL = profile([
  [0, 1.735], [0.5, 1.733], [0.8, 1.727], [1.0, 1.716], [1.1, 1.698], [1.2, 1.676], [1.38, 1.655],
  [1.47, 1.69], [1.62, 1.694], [1.78, 1.682], [1.95, 1.652], [2.2, 1.628], [2.6, 1.612], [Math.PI, 1.604],
]);
/** How much hair grows at `p` for a full hairline (long hair): as scalpCover, round the temples. */
export function fullScalpCover(p, n) {
  if (p[1] < 1.58) return 0;
  if (n && dot(n, sub(p, SKULL)) <= 0) return 0;
  const b = bearing(p);
  const H = (HAIRLINE_FULL(b - 0.05) + HAIRLINE_FULL(b - 0.025) + HAIRLINE_FULL(b) + HAIRLINE_FULL(b + 0.025) + HAIRLINE_FULL(b + 0.05)) / 5
    + 0.003 * noise3(p[0] * 160, p[1] * 60, p[2] * 160);
  return smooth(H - 0.004, H + 0.006, p[1]);
}

/**
 * Long hair, parted in the middle: off the face, back past the temples and
 * behind the ears, falling over the shoulders and down the back to below the
 * shoulder blades, cut in a soft U. It lies on the head and, below it, on the
 * neck, shoulders and back, so it is skinned to them (`weightsAt`) rather
 * than carried whole by the head.
 */
const LONG = Object.freeze({
  name: 'long',
  seed: 41,
  cover: fullScalpCover,
  fall: true,
  skinned: true,
  cards: 3600,
  width: 0.024,
  columns: [0, 0, 1, 1, 2],
  shortest: 0,
  rise: 0.3,
  weight: 0.55,
  volume: 0.03,
  // How far off the skin it keeps below the neck (over a jacket), and how hard it is drawn behind the shoulders.
  over: 0.026,
  drift: 0.7,
  /** Long enough to reach its cut from anywhere on the head. */
  length: () => 0.75,
  /** The cut: below the shoulder blades at the back, a little higher toward the sides. */
  endAt(p) {
    return 1.14 + 0.05 * smooth(2.2, 1.0, bearing(p));
  },
  /** Away from the part and back on top; down and back at the sides; straight down behind. */
  comb(p) {
    const m = Math.sign(p[0]) || 1, b = bearing(p);
    const top = smooth(1.70, 1.76, p[1]);
    const front = smooth(1.2, 0.3, b);
    // Back from the part and out a little, so the hair from the hairline covers the top of the head.
    const away = norm([0.3 * m, 0.05, -0.8 - 0.2 * (1 - front)]);
    // Off the face: the front swept back past the temples, behind the ears; behind, straight down, not parted.
    const sides = norm([0.25 * m * smooth(2.5, 1.5, b), -1, -0.55 - 0.4 * smooth(1.6, 0.6, b)]);
    const off = 0.6 * smooth(0.008, 0, Math.abs(p[0])) * smooth(-0.02, 0.04, p[2]);
    return add3(times(away, top), times(sides, 1 - top), [m * off, 0, 0]);
  },
  /** On the head, the head's; down the neck, partly the neck's; on the shoulders and back, the chest's. */
  weightsAt(p) {
    const head = smooth(1.5, 1.62, p[1]);
    const neck = (1 - head) * smooth(1.36, 1.48, p[1]) * 0.5;
    const out = { head, neck, chest: 1 - head - neck };
    for (const k of Object.keys(out)) if (out[k] < 1e-3) delete out[k];
    return out;
  },
});

/** The haircuts, by name. */
export const HAIRSTYLES = Object.freeze({
  sidePart: Object.freeze({
    name: 'sidePart',
    seed: 11,
    cover: scalpCover,
    cards: 3600,
    width: 0.015,
    /** Thicker at the crown, where the hair turns round its whorl and would part. */
    density(p) {
      // Thick at the crown, where the hair turns round its whorl and would part; and many more of the
      // short cards down the taper, each only a few hairs.
      const crown = 0.8 * smooth(0.04, 0.0, Math.hypot(p[0] + 0.01, p[1] - 1.755, (p[2] + 0.02) * 0.8));
      return 1 + crown + 2.2 * smooth(0.02, 0.008, this.length(p));
    },
    columns: [0, 0, 1, 1, 2, 2],
    // Shorter than this the cut is the scalp's paint alone, as a taper looks.
    shortest: 0.006,
    rise: 0.45,
    loose: 0.04,
    lift: 0.08,
    follow: 2.6,
    weight: 0.35,
    /** Full on top; close on the tapered sides and back. */
    volume: (p) => 0.1 + 0.2 * smooth(1.71, 1.75, p[1]) * smooth(2.5, 1.8, bearing(p)),
    /** About 5 cm on top (a touch more at the front), tapering down the sides and back to a few millimetres. */
    length(p) {
      const b = bearing(p);
      const top = 0.053 - 0.017 * smooth(1.2, 2.7, b);
      const t = Math.max(smooth(1.672, 1.752, p[1]) ** 1.3, smooth(0.95, 0.6, b));
      return 0.004 + (top - 0.004) * t;
    },
    /** Across from the part to his right on top, the short side down to his left; the sides and back down and back. */
    comb(p) {
      const b = bearing(p);
      const high = smooth(1.715, 1.745, p[1]) * smooth(2.4, 1.6, b);
      const front = smooth(0.02, 0.1, p[2]);
      // The long side: back from the hairline and over to the right, more back toward the crown.
      const across = p[0] < PART_X ? norm([-0.8, 0.05, -0.55 - 0.6 * (1 - front)]) : norm([0.9, -0.45, -0.4]);
      // The part, cleanly: hair either side of it leaves it.
      const off = smooth(0.012, 0, Math.abs(p[0] - PART_X)) * smooth(-0.01, 0.03, p[2]);
      const away = [Math.sign(p[0] - PART_X || -1) * off, 0, 0];
      const down = norm([0.15 * Math.sign(p[0]), -1, -0.45]);
      return add3(times(across, high), times(down, 1 - high), away);
    },
  }),
  long: LONG,
});

/**
 * Where the brow grows over the eye on `p`'s side, along it from its head
 * (`along` 0, over the inner corner of the eye) to its tail (1): the line
 * through its middle, and its half-height there. The same arch the skin's
 * paint follows (textures.js).
 */
export function browAt(p, fine = false) {
  const E = EYE.center, s = Math.abs(p[0]);
  const along = (s - (fine ? 0.01 : 0.008)) / (fine ? 0.048 : 0.05), a = Math.max(0, Math.min(1, along));
  if (fine) {
    // Groomed: a clean line, highest two-thirds out (the arch), tapering to a fine tail.
    const mid = E[1] + 0.0215 + 0.0075 * Math.sin(Math.min(1, a / 0.68) * Math.PI * 0.5) - 0.0075 * smooth(0.68, 1, a);
    return { along, mid, half: 0.0024 * (1 - 0.6 * a ** 1.3) + 0.0006 };
  }
  const mid = E[1] + 0.0205 + 0.006 * Math.sin(a * Math.PI * 0.85) - 0.004 * a;
  return { along, mid, half: 0.0036 * (1 - 0.5 * a) + 0.0008 };
}

/** How much brow grows at `p` (rest) with normal `n`: 0 to 1 (`fine`: the groomed brow's line). */
export function browCover(p, n, fine = false) {
  const E = EYE.center;
  if (p[2] < E[2] - 0.012 || (n && n[2] < 0.1)) return 0;
  const { along, mid, half } = browAt(p, fine);
  const ends = smooth(-0.06, 0.06, along) * smooth(1.05, 0.88, along);
  return ends * smooth(1.05, 0.6, Math.abs(p[1] - mid) / half);
}

/** The brows, by name. */
export const BROWS = Object.freeze({
  natural: Object.freeze({
    name: 'natural',
    seed: 31,
    cover: browCover,
    cards: 420,
    width: 0.0035,
    columns: [1, 2, 2, 3],
    shortest: 0.003,
    rise: 0.15,
    loose: 0.02,
    lift: 0.04,
    follow: 3,
    weight: 0,
    volume: 0.25,
    /** About 9 mm at the head of the brow, shorter toward its tail. */
    length(p) {
      return 0.0095 - 0.004 * Math.max(0, Math.min(1, browAt(p).along));
    },
    /** Up at its head, then out along the arch, turning down toward the tail; the hairs below its middle angled up into it, those above it down. */
    comb(p) {
      const { along, mid } = browAt(p), m = Math.sign(p[0]) || 1;
      const head = smooth(0.25, 0.05, along);
      const out = norm([m, 0.25 - 0.55 * smooth(0.4, 1, along) + 0.9 * Math.max(-0.4, Math.min(0.4, (mid - p[1]) * 120)) * 0.3, 0]);
      return add3(times(out, 1 - head), times(norm([0.35 * m, 1, 0]), head));
    },
  }),
  /** Groomed and fine: a thin, clean line with a lifted arch and a tapering tail, the hairs lying flat along it. */
  /**
   * His natural brows, shaped and plucked: the same hairs, as many to the
   * square centimetre and as long, kept to a narrower line with a clean
   * edge under it, lifted to an arch two-thirds out and tapered to a fine
   * tail.
   */
  fine: Object.freeze({
    name: 'fine',
    seed: 31,
    cover: (p, n) => browCover(p, n, true),
    // (Their area is about two-thirds the natural brows', at the same density.)
    cards: 320,
    width: 0.0032,
    columns: [1, 2, 2, 3],
    shortest: 0.003,
    rise: 0.12,
    loose: 0.018,
    lift: 0.035,
    follow: 3,
    weight: 0,
    volume: 0.22,
    // Darker than the hair, as brows are (fair hair's especially, or they read faint).
    tone: 0.5,
    length(p) {
      return 0.0088 - 0.0042 * Math.max(0, Math.min(1, browAt(p, true).along));
    },
    /** As the natural brows are combed, along the plucked line. */
    comb(p) {
      const { along, mid } = browAt(p, true), m = Math.sign(p[0]) || 1;
      const head = smooth(0.25, 0.05, along);
      const out = norm([m, 0.25 - 0.75 * smooth(0.62, 1, along) + 0.9 * Math.max(-0.4, Math.min(0.4, (mid - p[1]) * 120)) * 0.3, 0]);
      return add3(times(out, 1 - head), times(norm([0.35 * m, 1, 0]), head));
    },
  }),
});

/** The beards, by name. */
export const BEARDS = Object.freeze({
  full: Object.freeze({
    name: 'full',
    seed: 23,
    cover: beardCover,
    floor: BEARD_FLOOR,
    cards: 3200,
    width: 0.008,
    columns: [0, 1, 1, 2],
    /** Finer on the upper lip, where the hair is packed close. */
    widthAt: (p) => 1 - 0.3 * smooth(FACE.mouth[1] + 0.003, FACE.mouth[1] + 0.008, p[1]) * smooth(0.034, 0.026, Math.abs(p[0])),
    /** Thicker on the upper lip and chin, as a beard grows. */
    density(p) {
      const s = Math.abs(p[0]), M = FACE.mouth;
      return 1 + 7 * smooth(M[1] + 0.003, M[1] + 0.008, p[1]) * smooth(0.034, 0.026, s) + 0.4 * smooth(0.035, 0.015, s) * smooth(1.575, 1.56, p[1]);
    },
    shortest: 0.004,
    rise: 0.35,
    loose: 0.05,
    lift: 0.15,
    follow: 2.2,
    weight: 0.2,
    volume: 0.4,
    /** About 2 cm, 2.5 at the chin; the moustache shorter, to just over the lip. */
    length(p, n) {
      const s = Math.abs(p[0]), M = FACE.mouth;
      const chin = smooth(0.035, 0.015, s) * smooth(1.575, 1.56, p[1]);
      const under = smooth(-0.2, -0.6, n[1]);
      const lip = smooth(M[1] + 0.004, M[1] + 0.009, p[1]) * smooth(0.035, 0.028, s);
      let L = 0.017 + 0.009 * chin + 0.003 * under;
      L = L * (1 - lip) + 0.0085 * lip;
      // Shorter toward the cheek line (the moustache keeps its length), and shorter still up the
      // side of the face, fading into the cropped sideburn above it.
      const cheek = smooth(0.028, 0.036, s), side = smooth(0.05, 0.068, s);
      const top = beardTop(p);
      return L * (1 - cheek * 0.45 * smooth(top - 0.016, top - 0.004, p[1]))
        * (1 - side * 0.8 * smooth(top - 0.045, top - 0.004, p[1]));
    },
    /** Down the cheeks and jaw, a little forward off the chin; back toward the neck under the jaw; the moustache down and out. */
    comb(p, n) {
      const s = Math.abs(p[0]), m = Math.sign(p[0]) || 1, M = FACE.mouth;
      const lip = smooth(M[1] + 0.002, M[1] + 0.007, p[1]) * smooth(0.04, 0.025, s);
      const chin = smooth(0.04, 0.01, s) * smooth(1.58, 1.555, p[1]);
      const under = smooth(-0.2, -0.65, n[1]);
      let d = norm([0, -1, 0.15 + 0.3 * chin]);
      d = add3(times(d, 1 - under), times(norm([0, -0.6, -0.8]), under));
      // (Straight down under the nose, so the two halves meet there.)
      return add3(times(d, 1 - lip), times(norm([0.6 * m * smooth(0, 0.012, s), -1, 0.25]), lip));
    },
  }),
});

/**
 * What the skin is painted under the hair at `p` (rest) with normal `n`, for
 * a haircut and a beard (by name, or null): how much (`cover`, 0 to 1) and
 * how dark (`shade`): dark under long hair, where the scalp is in its
 * shadow; lighter where the hair is cropped short and the paint is all
 * there is of it.
 */
export function hairPaint(hair, beard, p, n) {
  let cover = 0, shade = 1;
  if (hair && HAIRSTYLES[hair]) {
    const s = HAIRSTYLES[hair];
    cover = s.cover(p, n);
    shade = s.fall ? 0.62 : 0.5 + 0.35 * smooth(0.035, 0.018, s.length(p, n));
  }
  if (beard && BEARDS[beard]) {
    const c = BEARDS[beard].cover(p, n);
    if (c > cover) { cover = c; shade = 0.5 + 0.35 * smooth(0.02, 0.008, BEARDS[beard].length(p, n)); }
  }
  return { cover, shade };
}

const builds = new Map();

/** The brows' cards (in the 'hair' material), each riding the brow bone over it, made once. */
export function buildBrows(name, detail = 1) {
  const style = BROWS[name];
  if (!style) throw new Error(`human: no brows called ${name}; choose ${Object.keys(BROWS).join(', ')}`);
  const key = `brows:${name}@${detail >= 0.8}`;
  if (!builds.has(key)) builds.set(key, cards(style, 'hair', detail >= 0.8, false));
  return builds.get(key);
}

/** A haircut's cards (in the 'hair' material), all on the head bone, made once. */
export function buildHair(name, detail = 1) {
  const style = HAIRSTYLES[name];
  if (!style) throw new Error(`human: no hairstyle called ${name}; choose ${Object.keys(HAIRSTYLES).join(', ')}`);
  const key = `hair:${name}@${detail >= 0.8}`;
  if (!builds.has(key)) builds.set(key, cards(style, 'hair', detail >= 0.8, true));
  return builds.get(key);
}

/** A beard's cards (in the 'hair' material), each riding on the face where it grows (the jaw, the lips' corners), made once. */
export function buildBeard(name, detail = 1) {
  const style = BEARDS[name];
  if (!style) throw new Error(`human: no beard called ${name}; choose ${Object.keys(BEARDS).join(', ')}`);
  const key = `beard:${name}@${detail >= 0.8}`;
  if (!builds.has(key)) builds.set(key, cards(style, 'hair', detail >= 0.8, false));
  return builds.get(key);
}

/**
 * The strand texture: four clumps of hair side by side (two thick, one
 * looser, one of strays), white, to be coloured by the material. Each strand
 * tapers to its tip and ends at a length of its own; the clumps draw in
 * toward their tips. Where there is no hair the colour is the hair's
 * still, so filtering at the edges does not darken them.
 */
export function hairTexels(width = 512, height = 1024) {
  const rnd = random(5);
  const alpha = new Float32Array(width * height), light = new Float32Array(width * height);
  const col = width / COLUMNS;
  const kinds = [{ n: 46, clump: 0.55, len: [0.7, 1] }, { n: 40, clump: 0.45, len: [0.65, 1] }, { n: 30, clump: 0.3, len: [0.55, 0.98] }, { n: 14, clump: 0.15, len: [0.4, 0.95] }];
  kinds.forEach((kind, c) => {
    const x0 = c * col, mid = x0 + col * (0.45 + 0.1 * rnd());
    for (let s = 0; s < kind.n; s++) {
      const start = x0 + col * (0.06 + 0.88 * rnd());
      // Each strand comes in from the root at its own place, faded in, so a card has no straight edge there.
      const from = 0.14 * rnd() ** 1.5;
      const end = kind.len[0] + (kind.len[1] - kind.len[0]) * rnd();
      const thick = 0.7 + 0.7 * rnd();
      const tone = 0.78 + 0.3 * rnd();
      const wave = (rnd() - 0.5) * col * 0.04, freq = 4 + 6 * rnd(), ph = rnd() * 6.28;
      for (let y = 0; y < height; y++) {
        const v = (y + 0.5) / height;
        if (v > end) break;
        const t = v / end;
        const x = start + (mid - start) * kind.clump * t ** 1.6 + wave * Math.sin(ph + freq * v * 6.28);
        const hw = thick * (1 - 0.65 * t ** 1.5) * 0.5;
        const fade = smooth(1, 0.85, t) * smooth(from, from + 0.06, v);
        for (let px = Math.floor(x - hw - 1); px <= Math.ceil(x + hw + 1); px++) {
          if (px < x0 || px >= x0 + col) continue;
          const a = Math.max(0, Math.min(1, hw + 0.5 - Math.abs(px + 0.5 - x))) * fade;
          if (a <= 0) continue;
          const o = y * width + px;
          light[o] = alpha[o] > 0 ? (light[o] * alpha[o] + tone * a) / (alpha[o] + a) : tone;
          alpha[o] = 1 - (1 - alpha[o]) * (1 - a);
        }
      }
    }
  });
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const l = alpha[i] > 0 ? light[i] : 0.92;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = Math.round(Math.min(1, l) * 255);
    data[i * 4 + 3] = Math.round(alpha[i] * 255);
  }
  return { data, width, height };
}

let texels = null;
const textures = new WeakMap();
/** The strand texture for `GFX`, made once. */
export function hairTexture(GFX) {
  if (textures.has(GFX)) return textures.get(GFX);
  texels ??= hairTexels();
  const t = new GFX.DataTexture(texels.data, texels.width, texels.height);
  t.colorSpace = GFX.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = GFX.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  textures.set(GFX, t);
  return t;
}
