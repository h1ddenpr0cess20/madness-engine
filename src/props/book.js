/**
 * Book: a hardcover whose cover is ONE piece, with hinges that really flex,
 * and pages that turn on its spine.
 *
 * It is made the way Slimey's orb is. Slimey keeps one closed mesh and its
 * rest positions (`base`); every frame each vertex is re-derived from its
 * own rest position by a field (its lobes), the seam is welded and the
 * normals are redone. Here:
 *
 *  - The cover is one welded, closed slab of cloth-covered board, built
 *    flat: back board, hinge groove, spine, hinge groove, front board, laid
 *    end to end along `s` (with `z` up the book's height and `n` through
 *    its thickness). Each vertex keeps its rest (s, z, n). The field is a
 *    curvature along `s`: stiff on the boards and spine, bending in the
 *    grooves, which are thinner. The heading is its running total and the
 *    position the running total of the heading, which has a closed form for
 *    constant curvature, so every frame the cover is exactly where its
 *    hinges put it. Nothing is a bone, a joint, or a second mesh.
 *  - Opening is two moves of that one field: the front hinge unbends (the
 *    cover swings up to stand), then the spine rolls out flat (the cover
 *    lays down beside the text, both boards on the table).
 *  - Each leaf is a closed slab of paper, built flat and bent the same way
 *    by a field of its own. It begins inside the spine's inner surface, at
 *    the spine's own heading, and bends through the gutter (a raised-cosine
 *    run of curvature, so there is no crease) to lie at its stack height;
 *    the length of the gutter is solved so it lands exactly there, which is
 *    what makes the leaves fan out of a rolled-flat spine without crossing.
 *    While it turns the free end lags the root, so the page curls.
 *
 * Its cover, endpapers and pages are painted pictures (book-art.js): leather,
 * foil, emblem and title, and a madman's hand on every page, which the
 * caller can replace. Lying flat, spine along z, up is +y, the back board on y = 0; centered on
 * its spine when open. `createBook(GFX, options)` gives
 * { group, cover, leaves, pose(), open(), close({ instant }), turnTo(), next(), prev(),
 *   update(dt), ... }.
 */

import {
  CLOTHS, DEFAULT_SUBTITLE, DEFAULT_TITLE, EMBLEMS, FOILS, PAPERS, TRIMS,
  flowPages, madnessPage, openingPages, paintCover, paintLeaf,
} from './book-art.js';

export { CLOTHS, DEFAULT_SUBTITLE, DEFAULT_TITLE, EMBLEMS, FOILS, PAPERS, TRIMS, flowPages, madnessPage };

const PI = Math.PI;
const HALF_PI = PI / 2;
const TAU = PI * 2;

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export const DEFAULTS = {
  title: DEFAULT_TITLE,
  subtitle: DEFAULT_SUBTITLE,
  pageCount: 80,        // pages (two to a leaf); `leaves` says it in sheets instead
  pages: null,          // the words: a list of strings (page 1 first) or (n) => string; null is the madman's own
  seed: 0,              // which ramblings
  cloth: CLOTHS.oxblood,
  foil: FOILS['aged gold'],
  emblem: 'pentagram',  // EMBLEMS
  trim: 'ornate',       // TRIMS
  drips: true,          // blood from the title
  print: false,         // pages in a steady print for real text, not the madman's hand
  paper: PAPERS.aged,
  ink: '#2a1d14',
  endpaper: '#e4d6b6',
  bookplate: true,      // the ex libris on the inside of the front cover; false for plain endpapers
  shell: false,         // true builds the cover and its size only; the leaves wait for `build()`, the first time it is opened
  font: undefined,
  width: 0.30,          // a page's width, spine to fore-edge
  height: 0.42,         // a page's height
  boardThickness: 0.0075,
  overhang: 0.009,      // how far the boards stand past the pages (the squares)
  hinge: 0.0095,        // the length of a hinge groove
  embed: 0.004,         // how far a leaf runs into the spine
  size: 1,
  autoplay: false,
  textureSize: 2048,    // the cover's picture, square: 1024 is plenty for a book on a shelf
  bump: true,           // the cover's relief (the foil and grain standing proud)
  deferPages: false,    // write the pages only once the book is opened (a book on a shelf, shut)
};

/* ------------------------------------------------------------------ */
/* the cover's spine of curvature: a strip bending in a plane          */
/* ------------------------------------------------------------------ */

/** Where a run of constant curvature `k` has got to after `t`, from (x0, y0) heading psi0. Straight outside its ends, too. */
function along(x0, y0, psi0, k, t, out) {
  if (Math.abs(k) < 1e-9) {
    out[0] = x0 + Math.cos(psi0) * t; out[1] = y0 + Math.sin(psi0) * t; out[2] = psi0;
  } else {
    const psi = psi0 + k * t;
    out[0] = x0 + (Math.sin(psi) - Math.sin(psi0)) / k;
    out[1] = y0 - (Math.cos(psi) - Math.cos(psi0)) / k;
    out[2] = psi;
  }
  return out;
}

/**
 * The cover's centre line at openness `a` (0 shut, 1 lying flat): its five
 * runs and where each begins. The back board is fixed; the hinges are the
 * only places it bends. The front hinge unbends over the first half of the
 * opening, the back hinge (so the spine rolls flat) over the second.
 */
function layoutAt(plan, a, segs = []) {
  const f = smooth(a * 2);
  const b = smooth(a * 2 - 1);
  const spec = [
    [plan.boardLength, 0],
    [plan.hinge, -HALF_PI * (1 - b) / plan.hinge],
    [plan.spine, 0],
    [plan.hinge, -HALF_PI * (1 - f) / plan.hinge],
    [plan.boardLength, 0],
  ];
  let x = plan.x0, y = plan.y0, psi = PI, s = 0;
  const e = [0, 0, 0];
  for (let i = 0; i < spec.length; i++) {
    const [len, k] = spec[i];
    const seg = segs[i] ?? (segs[i] = {});
    seg.s0 = s; seg.len = len; seg.k = k; seg.x = x; seg.y = y; seg.psi = psi;
    along(x, y, psi, k, len, e);
    x = e[0]; y = e[1]; psi = e[2]; s += len;
  }
  return segs;
}

/** The centre line at arc length `s`: [x, y, heading], extended straight past either end. */
function atLayout(segs, s, out) {
  let i = segs.length - 1;
  while (i > 0 && segs[i].s0 > s) i--;
  const g = segs[i];
  return along(g.x, g.y, g.psi, g.k, s - g.s0, out);
}

/* ------------------------------------------------------------------ */
/* a closed slab, flat, with rounded edges, ready to be bent           */
/* ------------------------------------------------------------------ */

/** Sorted coordinates from `lo` to `hi`: every break, and between them steps no longer than `step(mid)`. */
function gridOf(breaks, lo, hi, step) {
  const pts = [...new Set([lo, hi, ...breaks.filter((v) => v > lo + 1e-9 && v < hi - 1e-9)].map((v) => +v.toFixed(7)))].sort((a, b) => a - b);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.ceil((b - a) / step((a + b) / 2) - 1e-9));
    for (let k = 1; k <= n; k++) out.push(a + ((b - a) * k) / n);
  }
  return out;
}

/**
 * One closed, welded surface for a flat plate: an outer face and an inner
 * face over the same grid (`sg` along the strip, `zg` across it), joined all
 * round by a rim that rolls from one face to the other in `steps` steps (the
 * rounded edge). `thick(s)` is where the two faces lie, as offsets `out` and
 * `inn` from the strip's middle (so a groove is a thinner place). A vertex
 * is kept as its rest position: `S` along, `Z` across, `N` through.
 */
function buildSlab({ sg, zg, thick, steps, outer, inner, edge, uvOuter, uvInner, uvEdge }) {
  const ni = sg.length, nj = zg.length;
  const S = [], Z = [], N = [], C = [], NB = [], UV = [], idx = [];
  const add = (s, z, n, c, nb, uv) => {
    S.push(s); Z.push(z); N.push(n); UV.push(uv[0], uv[1]);
    C.push(c[0], c[1], c[2]);
    NB.push(nb[0], nb[1], nb[2]);
    return S.length - 1;
  };
  const top = new Int32Array(ni * nj), bot = new Int32Array(ni * nj);
  for (let i = 0; i < ni; i++) {
    const t = thick(sg[i]);
    for (let j = 0; j < nj; j++) {
      top[i * nj + j] = add(sg[i], zg[j], t.out, outer(sg[i], zg[j]), [1, 0, 0], uvOuter(sg[i], zg[j]));
      bot[i * nj + j] = add(sg[i], zg[j], t.inn, inner(sg[i], zg[j]), [-1, 0, 0], uvInner(sg[i], zg[j]));
    }
  }
  const tri = (a, b, c) => { if (a !== b && b !== c && a !== c) idx.push(a, b, c); };
  for (let i = 0; i < ni - 1; i++) {
    for (let j = 0; j < nj - 1; j++) {
      const a = top[i * nj + j], b = top[(i + 1) * nj + j], c = top[i * nj + j + 1], d = top[(i + 1) * nj + j + 1];
      tri(a, c, b); tri(b, c, d);
      const e = bot[i * nj + j], f = bot[(i + 1) * nj + j], g = bot[i * nj + j + 1], h = bot[(i + 1) * nj + j + 1];
      tri(e, f, g); tri(f, h, g);
    }
  }

  // The rim: round the rectangle's edge, corners rolled through a quarter turn.
  const D1 = [-1, 0], D2 = [0, 1], D3 = [1, 0], D4 = [0, -1];
  const loop = [];
  const fan = (i, j, da, db) => {
    const a0 = Math.atan2(da[1], da[0]);
    let d = Math.atan2(db[1], db[0]) - a0;
    if (d > PI) d -= TAU;
    if (d < -PI) d += TAU;
    for (let k = 0; k <= 3; k++) { const a = a0 + (d * k) / 3; loop.push({ i, j, d: [Math.cos(a), Math.sin(a)] }); }
  };
  fan(0, 0, D4, D1);
  for (let j = 1; j < nj - 1; j++) loop.push({ i: 0, j, d: D1 });
  fan(0, nj - 1, D1, D2);
  for (let i = 1; i < ni - 1; i++) loop.push({ i, j: nj - 1, d: D2 });
  fan(ni - 1, nj - 1, D2, D3);
  for (let j = nj - 2; j >= 1; j--) loop.push({ i: ni - 1, j, d: D3 });
  fan(ni - 1, 0, D3, D4);
  for (let i = ni - 2; i >= 1; i--) loop.push({ i, j: 0, d: D4 });

  const rings = [loop.map((l) => top[l.i * nj + l.j])];
  for (let k = 1; k < steps; k++) {
    const beta = (PI * k) / steps, sb = Math.sin(beta), cb = Math.cos(beta);
    rings.push(loop.map((l) => {
      const qs = sg[l.i], qz = zg[l.j];
      const t = thick(qs);
      const w = (t.out - t.inn) / 2, nq = (t.out + t.inn) / 2;
      const s = qs + l.d[0] * w * sb, z = qz + l.d[1] * w * sb;
      return add(s, z, nq + w * cb, edge(s, z, k / steps), [cb, l.d[0] * sb, l.d[1] * sb], uvEdge(s, z));
    }));
  }
  rings.push(loop.map((l) => bot[l.i * nj + l.j]));
  for (let k = 0; k < steps; k++) {
    for (let e = 0; e < loop.length; e++) {
      const e2 = (e + 1) % loop.length;
      const A = rings[k][e], B = rings[k][e2], Cc = rings[k + 1][e2], D = rings[k + 1][e];
      tri(A, Cc, B); tri(A, D, Cc);
    }
  }

  // The distinct places along the strip, in order: the field is worked once for each, not once for each vertex.
  const U = [...new Set(S)].sort((a, b) => a - b);
  const at = new Map(U.map((v, i) => [v, i]));
  const uOf = Int32Array.from(S, (v) => at.get(v));
  return {
    count: S.length, S: Float64Array.from(S), Z: Float64Array.from(Z), N: Float64Array.from(N),
    color: Float32Array.from(C), nb: Float32Array.from(NB), uv: Float32Array.from(UV), index: idx, U: Float64Array.from(U), uOf,
  };
}

function slabGeometry(GFX, slab) {
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.Float32BufferAttribute(new Float32Array(slab.count * 3), 3));
  geometry.setAttribute('normal', new GFX.Float32BufferAttribute(new Float32Array(slab.count * 3), 3));
  geometry.setAttribute('color', new GFX.Float32BufferAttribute(slab.color, 3));
  geometry.setAttribute('uv', new GFX.Float32BufferAttribute(slab.uv, 2));
  geometry.setIndex(slab.index);
  return geometry;
}

/** Area-weighted vertex normals, straight on the arrays. */
function vertexNormals(geometry) {
  const P = geometry.attributes.position.array, I = geometry.index.array, N = geometry.attributes.normal.array;
  N.fill(0);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const i of [a, b, c]) { N[i] += nx; N[i + 1] += ny; N[i + 2] += nz; }
  }
  for (let i = 0; i < N.length; i += 3) {
    const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1;
    N[i] /= l; N[i + 1] /= l; N[i + 2] /= l;
  }
  geometry.attributes.normal.needsUpdate = true;
}

/* ------------------------------------------------------------------ */
/* a leaf's gutter                                                     */
/* ------------------------------------------------------------------ */

/** The height a unit-length gutter gains turning from heading `psiN` to `psiN + delta` (raised-cosine curvature). */
function gutterRise(psiN, delta) {
  const n = 24;
  const f = (u) => Math.sin(psiN + delta * (u - Math.sin(TAU * u) / TAU));
  let sum = f(0) + f(1);
  for (let i = 1; i < n; i++) sum += f(i / n) * (i % 2 ? 4 : 2);
  return sum / (3 * n);
}

/** How long the gutter must be for a leaf to come out of the spine at `psiN` and lie at heading `rest`, `dy` above where it started. */
function gutterLength(psiN, rest, dy) {
  const rise = gutterRise(psiN, rest - psiN);
  if (Math.abs(rise) < 2e-3) return 0.012;
  const g = dy / rise;
  return g > 0 ? clamp(g, 0.003, 0.17) : 0.003;
}

/* ------------------------------------------------------------------ */

export function createBook(GFX, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const N = Math.max(1, Math.min(160, Math.floor(o.leaves ?? Math.ceil(o.pageCount / 2))));
  // However many leaves, the block is no thicker than a few fingers: more pages are thinner paper.
  const pitch = o.leafPitch ?? Math.min(0.0024, 0.045 / N);
  const th = o.leafThickness ?? pitch * 0.9;
  const { boardThickness: tc, hinge: hz, embed } = o;
  const rh = (2 * hz) / PI;                          // a hinge groove's radius when it is bent a quarter turn
  const spine = N * pitch;
  const boardLength = o.width + o.overhang - rh + tc / 2;
  const coverLength = 2 * boardLength + 2 * hz + spine;
  const coverHeight = o.height + 2 * o.overhang;
  const plan = {
    hinge: hz, spine, boardLength,
    x0: boardLength + hz + spine / 2,               // so the spine is at x = 0 when it lies flat
    y0: tc / 2,
  };
  const spineStart = boardLength + hz;
  const frontStart = spineStart + spine + hz;
  const stackBase = plan.y0 + rh;                    // where the lowest leaf's middle would lie, shut

  const canPaint = typeof document !== 'undefined';
  const style = {
    title: o.title, subtitle: o.subtitle, cloth: o.cloth, foil: o.foil, emblem: o.emblem, trim: o.trim,
    drips: o.drips, paper: o.paper, ink: o.ink, font: o.font, print: o.print,
  };
  let pagesSource = o.pages;
  let seed = o.seed;

  const group = new GFX.Group();
  group.name = 'book';
  group.scale.setScalar(o.size);

  const texture = (canvas, srgb) => {
    const t = new GFX.CanvasTexture(canvas);
    if (srgb) t.colorSpace = GFX.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };

  /* ---------------------------- the cover ---------------------------- */

  const grooveRuns = [[boardLength, boardLength + hz], [spineStart + spine, frontStart]];
  const groove = (s) => {
    let b = 0;
    for (const [s0, s1] of grooveRuns) {
      const w = hz * 0.28;
      b = Math.max(b, smooth((s - s0) / w) * (1 - smooth((s - (s1 - w)) / w)));
    }
    return b;
  };
  const thickCover = (s) => {
    const b = groove(s);
    return { out: (tc / 2) * (1 - 0.8 * b), inn: -(tc / 2) * (1 - 0.15 * b) };
  };

  const R = tc / 2;
  const sCover = gridOf(
    [...grooveRuns.flat(), spineStart, frontStart], R, coverLength - R,
    (s) => (s > boardLength - 1e-9 && s < spineStart + 1e-9) || (s > spineStart + spine - 1e-9 && s < frontStart + 1e-9) ? 0.0012 : s > spineStart && s < spineStart + spine ? 0.006 : 0.011,
  );
  const zCover = gridOf([], R, coverHeight - R, () => 0.012);
  // The cover's picture is one canvas, the outside above and the inside below.
  const uvCover = (s, z, inside) => [clamp(s / coverLength), 1 - (clamp(z / coverHeight) * 0.5 + (inside ? 0.5 : 0))];
  const shadeOf = (k) => [k, k, k];
  const clothSlab = buildSlab({
    sg: sCover, zg: zCover, thick: thickCover, steps: 6,
    outer: (s) => shadeOf(1 - 0.35 * groove(s)), inner: (s) => shadeOf(1 - 0.3 * groove(s)), edge: () => shadeOf(0.85),
    uvOuter: (s, z) => uvCover(s, z, false), uvInner: (s, z) => uvCover(s, z, true), uvEdge: (s, z) => uvCover(s, z, false),
  });
  const coverGeometry = slabGeometry(GFX, clothSlab);
  const clothMaterial = new GFX.MeshStandardMaterial({ name: 'book_cloth', vertexColors: true, roughness: 0.78, metalness: 0, bumpScale: 1.5 });
  const coverMesh = new GFX.Mesh(coverGeometry, clothMaterial);
  coverMesh.name = 'book_cover';
  coverMesh.castShadow = coverMesh.receiveShadow = true;
  coverMesh.frustumCulled = false;
  group.add(coverMesh);

  /** The cover's leather, foil, emblem and title: painted again whenever the style changes. */
  const paintCoverTextures = () => {
    if (!canPaint) { clothMaterial.color.set(style.cloth); return; }
    const spec = { L: coverLength, Hc: coverHeight, boardLength, frontStart, spineStart, spine, ...style, endpaper: o.endpaper, bookplate: o.bookplate, seed: 7, textureSize: o.textureSize };
    clothMaterial.map?.dispose(); clothMaterial.bumpMap?.dispose();
    clothMaterial.map = texture(paintCover(spec, 'color'), true);
    clothMaterial.bumpMap = o.bump ? texture(paintCover(spec, 'bump'), false) : null;
    clothMaterial.color.set('#ffffff');
    clothMaterial.needsUpdate = true;
  };

  /* ----------------------------- the leaves -------------------------- */

  const leaves = [];
  // The leaves are built once the book is wanted: all at once, or by `build()` for a shell.
  const buildLeaves = () => {
  for (let k = 0; k < N; k++) {
    const len = o.width;
    const tint = 1 + ((((k * 7919) % 13) / 13) - 0.5) * 0.04;
    const gutterShade = (s) => shadeOf((0.66 + 0.34 * smooth(s / 0.08)) * tint);
    const lr = th / 2;
    // Fine where the leaf bends through the gutter (the bend can be a few millimetres long, and a column must fall in it).
    const sg = gridOf([0, 0.03, 0.2], -embed + lr, len - lr, (s) => (s < 0.03 ? 0.0015 : s < 0.2 ? 0.006 : 0.02));
    const zg = [lr, o.height - lr];
    const across = (s) => clamp(s / len);
    const slab = buildSlab({
      sg, zg, thick: (s) => { const t = (th / 2) * (0.5 + 0.5 * smooth((s - 0.01) / 0.1)); return { out: t, inn: -t }; }, steps: 2,
      outer: gutterShade, inner: gutterShade, edge: (s) => gutterShade(s).map((v) => v * 0.94),
      // The front on the left half of the leaf's picture; the back on the right, turned about so it reads from the other side.
      uvOuter: (s, z) => [across(s) * 0.5, 1 - clamp(z / o.height)],
      uvInner: (s, z) => [0.5 + (1 - across(s)) * 0.5, 1 - clamp(z / o.height)],
      uvEdge: (s, z) => [across(s) * 0.5, 1 - clamp(z / o.height)],
    });
    const geometry = slabGeometry(GFX, slab);
    const material = new GFX.MeshStandardMaterial({ name: `book_paper_${k + 1}`, vertexColors: true, roughness: 0.92, metalness: 0, color: style.paper });
    const mesh = new GFX.Mesh(geometry, material);
    mesh.name = `book_leaf_${k + 1}`;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    const nU = slab.U.length;
    leaves.push({
      k, mesh, geometry, material, slab, len, tex: null,
      p: 0, theta: 0, lag: 0, omega: 0, gR: 0.012, gL: 0.012,
      cx: new Float64Array(nU), cy: new Float64Array(nU), sn: new Float64Array(nU), cs: new Float64Array(nU),
      dirty: true,
    });
  }
  };
  if (!o.shell) buildLeaves();

  /* ---------------------------- the words ---------------------------- */

  const textOf = (n) => {
    if (typeof pagesSource === 'function') return pagesSource(n);
    if (Array.isArray(pagesSource)) return pagesSource[n - 1];
    if (n <= 2) return openingPages(style.title, style.subtitle)[n - 1];
    return madnessPage(n, seed);
  };
  const paintLeafTexture = (L) => {
    if (!canPaint || L.tex) return;
    const canvas = paintLeaf({
      pages: [textOf(2 * L.k + 1), textOf(2 * L.k + 2)], numbers: [2 * L.k + 1, 2 * L.k + 2],
      ink: style.ink, font: style.font, print: style.print, seed: L.k + 1 + seed * 131,
    });
    L.tex = texture(canvas, true);
    L.material.map = L.tex;
    L.material.needsUpdate = true;
  };
  const dropLeafTexture = (L) => {
    if (!L.tex) return;
    L.tex.dispose();
    L.tex = null; L.material.map = null;
    L.material.needsUpdate = true;
  };
  /** Only the pages that can be seen are written: the two of the spread, and the leaf in the air. */
  const writeVisible = () => {
    if (!canPaint) return;
    if (o.deferPages && a < 0.001) return;
    const turned = leaves.reduce((n, L) => n + (L.p > 0.5 ? 1 : 0), 0);
    const need = new Set();
    for (let k = turned - 2; k <= turned + 1; k++) if (k >= 0 && k < N) need.add(k);
    for (const L of leaves) if (L.p > 0.001 && L.p < 0.999) need.add(L.k);
    for (const k of need) paintLeafTexture(leaves[k]);
    const held = leaves.filter((L) => L.tex);
    if (held.length > 10) {
      held.filter((L) => !need.has(L.k)).sort((a, b) => Math.abs(b.k - turned) - Math.abs(a.k - turned)).slice(0, held.length - 10).forEach(dropLeafTexture);
    }
  };

  /* ------------------------------ the field -------------------------- */

  let layout = layoutAt(plan, 0);
  let a = 0;
  const e3 = [0, 0, 0];
  const zShift = -coverHeight / 2;

  const bendCover = () => {
    const { U, uOf, N: Nn, Z } = clothSlab;
    const cx = new Float64Array(U.length), cy = new Float64Array(U.length), sn = new Float64Array(U.length), cs = new Float64Array(U.length);
    for (let u = 0; u < U.length; u++) {
      atLayout(layout, U[u], e3);
      cx[u] = e3[0]; cy[u] = e3[1]; sn[u] = Math.sin(e3[2]); cs[u] = Math.cos(e3[2]);
    }
    const P = coverGeometry.attributes.position.array;
    for (let v = 0; v < clothSlab.count; v++) {
      const u = uOf[v], n = Nn[v];
      P[v * 3] = cx[u] - sn[u] * n; P[v * 3 + 1] = cy[u] + cs[u] * n; P[v * 3 + 2] = Z[v] + zShift;
    }
    coverGeometry.attributes.position.needsUpdate = true;
    coverGeometry.boundingSphere = null; // the cover has moved: a pick must measure it where it is now
    vertexNormals(coverGeometry);
  };

  /** Where leaf `k` leaves the spine: the inner face's point, and the heading straight into the book. */
  const rootOf = (k, out) => {
    atLayout(layout, spineStart + (N - k - 0.5) * pitch, e3);
    const psi = e3[2];
    out.x = e3[0] + (tc / 2) * Math.sin(psi);
    out.y = e3[1] - (tc / 2) * Math.cos(psi);
    out.psiN = psi - HALF_PI;
    return out;
  };

  const root = { x: 0, y: 0, psiN: 0 };
  const solveGutters = () => {
    for (const L of leaves) {
      rootOf(L.k, root);
      L.gR = gutterLength(root.psiN, 0, stackBase + (N - L.k - 0.5) * pitch - root.y);
      L.gL = gutterLength(root.psiN, PI, stackBase + (L.k + 0.5) * pitch - root.y);
    }
  };

  const bendLeaf = (L) => {
    const { U, uOf, N: Nn, Z } = L.slab;
    rootOf(L.k, root);
    const psiN = root.psiN;
    const g = lerp(L.gR, L.gL, smooth(L.p));
    const delta = L.theta - psiN;
    const len = L.len;
    const heading = (x) => {
      if (x <= 0) return psiN;
      if (x < g) { const u = x / g; return psiN + delta * (u - Math.sin(TAU * u) / TAU); }
      const w = clamp((x - g) / Math.max(1e-6, len - g));
      return psiN + delta + L.lag * w * w * (3 - 2 * w);
    };
    let x = root.x - embed * Math.cos(psiN), y = root.y - embed * Math.sin(psiN);
    let prev = U[0];
    let h0 = heading(prev);
    for (let u = 0; u < U.length; u++) {
      const s = U[u];
      if (u > 0) {
        const hm = heading((prev + s) / 2), h1 = heading(s);
        const dx = (s - prev) / 6;
        x += dx * (Math.cos(h0) + 4 * Math.cos(hm) + Math.cos(h1));
        y += dx * (Math.sin(h0) + 4 * Math.sin(hm) + Math.sin(h1));
        h0 = h1; prev = s;
      }
      L.cx[u] = x; L.cy[u] = y; L.sn[u] = Math.sin(h0); L.cs[u] = Math.cos(h0);
    }
    const P = L.geometry.attributes.position.array, Nr = L.geometry.attributes.normal.array, NB = L.slab.nb;
    for (let v = 0; v < L.slab.count; v++) {
      const u = uOf[v], n = Nn[v], sn = L.sn[u], cs = L.cs[u];
      P[v * 3] = L.cx[u] - sn * n; P[v * 3 + 1] = L.cy[u] + cs * n; P[v * 3 + 2] = Z[v] + o.overhang + zShift;
      // The surface is straight across the page, so its normal is the face's, rolled round the rim.
      const c = NB[v * 3], ds = NB[v * 3 + 1], dz = NB[v * 3 + 2];
      Nr[v * 3] = -sn * c + cs * ds; Nr[v * 3 + 1] = cs * c + sn * ds; Nr[v * 3 + 2] = dz;
    }
    L.geometry.attributes.position.needsUpdate = true;
    L.geometry.attributes.normal.needsUpdate = true;
    L.geometry.boundingSphere = null; // the page has moved: a pick must measure it where it is now
    L.dirty = false;
  };

  const refresh = () => {
    layoutAt(plan, a, layout);
    bendCover();
    solveGutters();
    for (const L of leaves) bendLeaf(L);
    writeVisible();
  };

  /* ------------------------------ the story -------------------------- */

  let wantOpen = false;
  let spread = 0;
  let held = false;                                  // posed by hand: left exactly where it was put
  let auto = !!o.autoplay;
  const leafAngle = (p) => PI * smooth(p);

  const setLeaf = (L, p) => {
    L.p = p;
    L.theta = leafAngle(p);
    L.lag = 0; L.omega = 0;
  };
  const go = () => { held = false; };

  let built = !o.shell;
  const api = {
    group,
    cover: { mesh: coverMesh, geometry: coverGeometry, material: clothMaterial },
    /** Each leaf's mesh, how far it has turned (0..1) and how far its free edge trails its root (radians) while it moves. */
    get leaves() { return leaves.map((L) => ({ mesh: L.mesh, geometry: L.geometry, material: L.material, get turn() { return L.p; }, get curl() { return L.lag; },
      /** The leaf's middle line across the spine as it is now: [x0, y0, x1, y1, ...]. */
      get centerline() { const out = []; for (let u = 0; u < L.cx.length; u++) out.push(L.cx[u], L.cy[u]); return out; } })); },
    /** Whether the leaves are built: always, unless the book is a shell. */
    get built() { return built; },
    /** Builds a shell's leaves (once), at rest, shut. Does nothing for a book already built. */
    build() { if (!built) { buildLeaves(); built = true; api.pose({ open: 0, turn: 0 }); } return api; },
    clothMaterial,
    dimensions: { width: o.width, height: o.height, coverWidth: coverLength, coverHeight, thickness: rh * 2 + spine, leaves: N, pages: N * 2 },
    /** Where the camera should look. */
    frame: { center: [0, 0.03, 0], radius: 0.4 * o.size },
    /** The style now: what `setStyle` takes. */
    get style() { return { ...style }; },

    /** How far the cover is open, 0 shut to 1 lying flat. */
    get openness() { return a; },
    /** How many leaves lie turned over, to the left. */
    get turned() { return leaves.reduce((n, L) => n + (L.p > 0.5 ? 1 : 0), 0); },
    get pageCount() { return N * 2; },
    /** Open, leaf through and shut, over and over, until something else is asked of it. */
    get autoplay() { return auto; },
    set autoplay(on) { auto = !!on; if (auto) held = false; },
    /** The pages showing on the left and on the right (0 where there is none). */
    get spread() {
      const t = api.turned;
      return { left: t * 2, right: t < N ? t * 2 + 1 : 0 };
    },

    /**
     * Put it somewhere at once and leave it there: `open` 0..1, and `turn`
     * leaves turned (3.4 has three over and a fourth 0.4 of the way).
     */
    pose({ open = 0, turn = 0 } = {}) {
      a = turn > 0 ? 1 : clamp(open);
      wantOpen = a > 0.5;
      spread = clamp(Math.round(turn), 0, N);
      held = true;
      for (const L of leaves) setLeaf(L, clamp(turn - L.k));
      refresh();
      return api;
    },
    open() { go(); wantOpen = true; return api; },
    /**
     * Shut the cover. It swings shut over about a second; `{ instant: true }` shuts it at once, leaves and all,
     * for a book going back on a shelf, where nobody should watch it close.
     */
    close({ instant = false } = {}) {
      go();
      wantOpen = false;
      spread = 0;
      if (instant) {
        a = 0;
        for (const L of leaves) setLeaf(L, 0);
        refresh();
      }
      return api;
    },
    turnTo(n) { go(); spread = clamp(Math.round(n), 0, N); if (spread > 0) wantOpen = true; return api; },
    next() { return api.turnTo((held ? api.turned : spread) + 1); },
    prev() { return api.turnTo((held ? api.turned : spread) - 1); },
    /** Open the cover if it is shut; else turn on from the side of the spine that was touched (x < 0 turns back). */
    touch(x) {
      if (a < 0.999 && !leaves.some((L) => L.p > 0.001)) return api.open();
      return x < 0 ? api.prev() : api.next();
    },

    /** Change how it looks: any of title, subtitle, cloth, foil, emblem, trim, drips, paper, ink, font, print. */
    setStyle(patch = {}) {
      const before = { ...style };
      Object.assign(style, patch);
      const coverChanged = ['title', 'subtitle', 'cloth', 'foil', 'emblem', 'trim', 'drips'].some((k) => style[k] !== before[k]);
      if (coverChanged) paintCoverTextures();
      if (style.paper !== before.paper) for (const L of leaves) L.material.color.set(style.paper);
      if (['ink', 'font', 'print', 'title', 'subtitle'].some((k) => style[k] !== before[k])) { for (const L of leaves) dropLeafTexture(L); writeVisible(); }
      return api;
    },
    /** Replace the words: a list of strings (page 1 first), a function from a page number to a string, or null for the madman's own. */
    setPages(source, newSeed) {
      pagesSource = source ?? null;
      if (newSeed !== undefined) seed = newSeed;
      for (const L of leaves) dropLeafTexture(L);
      writeVisible();
      return api;
    },

    /**
     * Fill the book with real text: a long string, cut into pages as it is measured (a line is a paragraph, a
     * blank line a gap; `*stress*`, `~strike~` and `#Heading` are marks), written in print unless `print: false`.
     * Gives { pages, fits }: the pages the text takes, and whether this book has that many. A book has the pages
     * it was made with, so text past the last is left out: make one with a larger `pageCount`.
     */
    setText(text, { print = true } = {}) {
      style.print = print;
      const pages = canPaint ? flowPages(text, { print, font: style.font }) : String(text).match(/[\s\S]{1,1900}/g) ?? [];
      pagesSource = (n) => pages[n - 1];
      for (const L of leaves) dropLeafTexture(L);
      writeVisible();
      return { pages: pages.length, fits: pages.length <= N * 2 };
    },

    /** Once a frame. */
    update(dt) {
      dt = clamp(dt ?? 0, 0, 0.05);
      if (auto && !held) autoplay(dt);
      if (held) return;
      const anyTurned = leaves.some((L) => L.p > 1e-3);
      const aGoal = wantOpen || anyTurned ? 1 : 0;
      const a0 = a;
      a += clamp(aGoal - a, -dt * 0.8, dt * 0.8);
      const flat = a >= 0.999;
      for (const L of leaves) {
        const goal = flat && L.k < spread ? 1 : 0;
        let p = L.p;
        if (goal > p) {
          if (L.k === 0 || leaves[L.k - 1].p > 0.35) p = Math.min(1, p + dt * 1.2);
        } else if (goal < p) {
          if (L.k === N - 1 || leaves[L.k + 1].p < 0.65) p = Math.max(0, p - dt * 1.2);
        }
        const theta = leafAngle(p);
        const omega = dt > 0 ? (theta - L.theta) / dt : 0;
        const lagGoal = clamp(-omega * 0.22, -1.5, 1.5);
        const lag = L.lag + (lagGoal - L.lag) * Math.min(1, dt * 12);
        if (p !== L.p || Math.abs(lag - L.lag) > 1e-5) L.dirty = true;
        L.p = p; L.theta = theta; L.omega = omega; L.lag = lag;
      }
      if (a !== a0) {
        layoutAt(plan, a, layout);
        bendCover();
        solveGutters();
        for (const L of leaves) L.dirty = true;
      }
      let any = false;
      for (const L of leaves) if (L.dirty) { bendLeaf(L); any = true; }
      if (any) writeVisible();
    },
  };

  // A demonstration: open, leaf through, and shut, over and over.
  let clock = 0;
  let step = 0;
  const autoplay = (dt) => {
    clock -= dt;
    if (clock > 0) return;
    const half = Math.min(N, 6);
    const script = [
      () => { api.open(); return 2.2; },
      ...Array.from({ length: half }, () => () => { api.next(); return 1.3; }),
      ...Array.from({ length: half }, () => () => { api.prev(); return 1.1; }),
      () => { api.close(); return 3.2; },
    ];
    clock = script[step % script.length]();
    step++;
  };

  paintCoverTextures();
  api.pose({ open: 0, turn: 0 });
  // How much room it takes shut, in its own units (before `size`): for standing it on a shelf.
  {
    const P = coverGeometry.attributes.position.array;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[i + k]); max[k] = Math.max(max[k], P[i + k]); }
    api.dimensions.closed = { min, max };
  }
  return api;
}
