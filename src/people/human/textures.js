import { bodyLevel } from './basemesh.js';
import { zoneOf } from './body.js';
import { clamp, cross, fbm, noise3, smooth } from './kit.js';
import { armDistance, EYE, FACE, FINGERS, JOINTS } from './skeleton.js';
import { browAt, hairPaint } from './hair.js';
import { HEM, JACKET, jeansHeight, legAngle, neckline, SHIRT_Z, SLEEVE_RANGE, SOCKS } from './clothes.js';

/**
 * The human's textures, painted when he is first built (in a browser; with
 * no `document`, as under test, there are none and the materials carry
 * their colours alone). Each painter works the way a texture artist's
 * projection does: every texel is taken back to the place on the body it
 * covers, and the colour there (a cheek's flush, an eyebrow's hair, a
 * jeans' seam) is worked out from that place. The skin is painted onto the
 * base mesh's own UV layout through a map of where on the body each texel
 * is, so the paint runs on unbroken across its seams.
 */

const G = (t) => Math.exp(-t * t);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A `w` × `h` canvas, every texel coloured by `fn(u, v)` → [r, g, b] (0–255); u across, v up. */
function paint(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const v = 1 - (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      const rgb = fn((x + 0.5) / w, v, x, y);
      const o = (y * w + x) * 4;
      d[o] = clamp(rgb[0], 0, 255); d[o + 1] = clamp(rgb[1], 0, 255); d[o + 2] = clamp(rgb[2], 0, 255); d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function texture(GFX, canvas, { color = true, repeat = null } = {}) {
  const t = new GFX.CanvasTexture(canvas);
  if (color) t.colorSpace = GFX.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = GFX.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.updateMatrix?.();
  }
  return t;
}

// ———————————————————————————————————————————————— skin

/**
 * Where on the body each texel of the skin's UV layout is: its rest
 * position, normal and zone, by rasterising the body's quads in UV space.
 * Texels no quad covers are left empty (zone 0).
 */
const positionMaps = new Map();
function positionMap(size) {
  if (!positionMaps.has(size)) positionMaps.set(size, makePositionMap(size));
  return positionMaps.get(size);
}

function makePositionMap(size) {
  const { pos, uv, faces, uvFaces, weights } = bodyLevel(0);
  const N = size * size;
  const P = new Float32Array(N * 3), Nn = new Float32Array(N * 3), Z = new Uint8Array(N);
  const ZONES = ['', 'head', 'neck', 'trunk', 'arm', 'hand', 'leg', 'foot'];
  const vn = new Float32Array(pos.length), vz = new Uint8Array(pos.length / 3);
  for (let f = 0; f < faces.length; f += 4) {
    const v = [0, 1, 2, 3].map((k) => faces[f + k]);
    const A = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
    const d1 = [0, 1, 2].map((a) => A(v[2])[a] - A(v[0])[a]), d2 = [0, 1, 2].map((a) => A(v[3])[a] - A(v[1])[a]);
    const n = cross(d1, d2);
    for (const i of v) { vn[i * 3] += n[0]; vn[i * 3 + 1] += n[1]; vn[i * 3 + 2] += n[2]; }
  }
  for (let i = 0; i < vz.length; i++) {
    const l = Math.hypot(vn[i * 3], vn[i * 3 + 1], vn[i * 3 + 2]) || 1;
    vn[i * 3] /= l; vn[i * 3 + 1] /= l; vn[i * 3 + 2] /= l;
    if (weights[i] && Object.keys(weights[i]).length) vz[i] = ZONES.indexOf(zoneOf(weights[i], [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]).zone);
  }
  const tri = (a, b, c) => {
    const ua = uv[a[1] * 2] * size, va = (1 - uv[a[1] * 2 + 1]) * size;
    const ub = uv[b[1] * 2] * size, vb = (1 - uv[b[1] * 2 + 1]) * size;
    const uc = uv[c[1] * 2] * size, vc = (1 - uv[c[1] * 2 + 1]) * size;
    const det = (vb - vc) * (ua - uc) + (uc - ub) * (va - vc);
    if (Math.abs(det) < 1e-9) return;
    const x0 = Math.max(0, Math.floor(Math.min(ua, ub, uc))), x1 = Math.min(size - 1, Math.ceil(Math.max(ua, ub, uc)));
    const y0 = Math.max(0, Math.floor(Math.min(va, vb, vc))), y1 = Math.min(size - 1, Math.ceil(Math.max(va, vb, vc)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const l1 = ((vb - vc) * (px - uc) + (uc - ub) * (py - vc)) / det;
        const l2 = ((vc - va) * (px - uc) + (ua - uc) * (py - vc)) / det;
        const l3 = 1 - l1 - l2;
        if (l1 < -1e-3 || l2 < -1e-3 || l3 < -1e-3) continue;
        const o = y * size + x;
        for (let k = 0; k < 3; k++) {
          P[o * 3 + k] = pos[a[0] * 3 + k] * l1 + pos[b[0] * 3 + k] * l2 + pos[c[0] * 3 + k] * l3;
          Nn[o * 3 + k] = vn[a[0] * 3 + k] * l1 + vn[b[0] * 3 + k] * l2 + vn[c[0] * 3 + k] * l3;
        }
        Z[o] = l1 >= l2 && l1 >= l3 ? vz[a[0]] : l2 >= l3 ? vz[b[0]] : vz[c[0]];
      }
    }
  };
  for (let f = 0; f < faces.length; f += 4) {
    const c = [0, 1, 2, 3].map((k) => [faces[f + k], uvFaces[f + k]]);
    tri(c[0], c[1], c[2]);
    tri(c[0], c[2], c[3]);
  }
  return { P, N: Nn, Z, ZONES };
}

/** Spreads the painted islands a few texels into the empty space round them, so filtering never reaches the background. */
function bleed(rgba, filled, size, passes = 4) {
  let have = filled.slice();
  for (let pass = 0; pass < passes; pass++) {
    const next = have.slice();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const o = y * size + x;
        if (have[o]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          const q = yy * size + xx;
          if (!have[q]) continue;
          r += rgba[q * 4]; g += rgba[q * 4 + 1]; b += rgba[q * 4 + 2]; n++;
        }
        if (n) { rgba[o * 4] = r / n; rgba[o * 4 + 1] = g / n; rgba[o * 4 + 2] = b / n; rgba[o * 4 + 3] = 255; next[o] = 1; }
      }
    }
    have = next;
  }
}

/** Landmarks of the face and hands the skin painter measures from. */
function landmarks() {
  const { pos, faces } = bodyLevel(0);
  const E = EYE.center, M = FACE.mouth;
  let nose = [0, 0, -1];
  for (const v of faces) {
    const p = [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]];
    if (Math.abs(p[0]) < 0.006 && p[1] < E[1] - 0.01 && p[1] > M[1] + 0.01 && p[2] > nose[2]) nose = p;
  }
  // Each finger's tip, which way its nail faces, and the axis it runs along.
  const nails = [], creases = [];
  for (const m of [1, -1]) {
    for (const f of Object.values(FINGERS)) {
      const j = f.joints.map((p) => [p[0] * m, p[1], p[2]]);
      const dir = [j[3][0] - j[2][0], j[3][1] - j[2][1], j[3][2] - j[2][2]];
      const l = Math.hypot(...dir);
      const d = dir.map((v) => v / l);
      const curl = m > 0 ? f.curl : [f.curl[0], -f.curl[1], -f.curl[2]];
      const toward = cross(curl, d);
      nails.push({ tip: j[3], base: j[2], dir: d, back: toward.map((v) => -v), len: l });
      // The two joints along the finger, where its skin creases: over the back in a few lines, under it in one.
      for (const k of [1, 2]) {
        const a = [j[k + 1][0] - j[k - 1][0], j[k + 1][1] - j[k - 1][1], j[k + 1][2] - j[k - 1][2]];
        const al = Math.hypot(...a), ad = a.map((v) => v / al);
        creases.push({ at: j[k], dir: ad, back: cross(curl, ad).map((v) => -v) });
      }
    }
  }
  return { E, M, nose, nails, creases, R: EYE.radius };
}

/** How much of a lip `(x, y, z)` is on (0 to 1), and how far above the slit between them it is (metres). */
function lipsAt(M, x, y, z) {
  const s = Math.abs(x), lc = FACE.lipCorner[0] + 0.001;
  const t = clamp(s / lc);
  const slit = M[1] - (M[1] - FACE.lipCorner[1]) * t * t;
  // The upper lip's border with its Cupid's bow; the fuller lower lip.
  const up = slit + (0.0102 * Math.sqrt(1 - t * t) - 0.0016 * G(s / 0.0035) + 0.0008 * G((s - 0.006) / 0.003)) * smooth(1, 0.85, t) + 0.0006;
  const low = slit - 0.0128 * Math.pow(1 - t * t, 0.55);
  const lipFront = smooth(M[2] - 0.035, M[2] - 0.022, z);
  return { on: smooth(lc, lc - 0.004, s) * smooth(low - 0.0009, low + 0.0009, y) * smooth(up + 0.0009, up - 0.0009, y) * lipFront, above: y - slit, up: up - slit, low: slit - low };
}

/** The nail `(x, y, z)` (facing `n`) is on, if any: how much of its plate is here, how far back from the tip, and which nail. */
function nailAt(L, x, y, z, n) {
  for (const nail of L.nails) {
    if (nail.tip[0] * x <= 0) continue;
    const rel = [x - nail.tip[0], y - nail.tip[1], z - nail.tip[2]];
    const along = -(rel[0] * nail.dir[0] + rel[1] * nail.dir[1] + rel[2] * nail.dir[2]);
    if (along < -0.002 || along > 0.016) continue;
    const facing = n[0] * nail.back[0] + n[1] * nail.back[1] + n[2] * nail.back[2];
    const side = Math.hypot(rel[0] + nail.dir[0] * along, rel[1] + nail.dir[1] * along, rel[2] + nail.dir[2] * along);
    if (side >= 0.02) continue;
    const plate = smooth(0.45, 0.75, facing) * smooth(0.013, 0.01, along) * smooth(0.0, 0.0015, along);
    const fold = G((along - 0.0128) / 0.0007) * smooth(0.45, 0.75, facing);
    if (plate > 0 || fold > 0.01) return { plate, fold, along, side };
  }
  return null;
}

/** The creases over a finger's joints at `(x, y, z)` (facing `n`): 0 to 1, a few lines across the back of each, one under it. */
function fingerCreases(L, x, y, z, n) {
  let lines = 0;
  for (const c of L.creases) {
    if (c.at[0] * x <= 0) continue;
    const rel = [x - c.at[0], y - c.at[1], z - c.at[2]];
    const along = rel[0] * c.dir[0] + rel[1] * c.dir[1] + rel[2] * c.dir[2];
    if (Math.abs(along) > 0.007) continue;
    if (Math.hypot(rel[0] - c.dir[0] * along, rel[1] - c.dir[1] * along, rel[2] - c.dir[2] * along) > 0.014) continue;
    const facing = n[0] * c.back[0] + n[1] * c.back[1] + n[2] * c.back[2];
    // (A little wavy, as creases are.)
    const a = along + 0.0004 * noise3(x * 600, y * 600, z * 600);
    const back = smooth(0.1, 0.5, facing), under = smooth(-0.1, -0.5, facing);
    lines = Math.max(lines, back * Math.max(G(a / 0.00045), 0.8 * G((a - 0.0022) / 0.0004), 0.8 * G((a + 0.0022) / 0.0004), 0.5 * G((a - 0.0041) / 0.0004), 0.5 * G((a + 0.0041) / 0.0004)), under * G(a / 0.0006));
  }
  return lines;
}

/**
 * The skin's colour at a place `p` (rest, metres) with normal `n` in `zone`:
 * the tone, mottled; flushed at the cheeks, nose, ears, knuckles, elbows
 * and knees; the lips, the brows' hair, the lash line, a shaved man's
 * shadow on the jaw and scalp (or, where his hair or beard grows, the
 * hair's own colour, so no skin shows between its cards), paler palms and
 * soles, the nails.
 */
function skinColour(tone, L, groom = {}) {
  const grown = groom.hairColour ? hex(groom.hairColour) : null;
  const base = tone;
  const red = [tone[0] * 1.0, tone[1] * 0.8, tone[2] * 0.8];
  // A woman's lips a little rosier and more distinct; her face has no beard's shadow.
  const female = !!groom.female;
  const lipC = female ? [tone[0] * 0.88, tone[1] * 0.6, tone[2] * 0.64] : [tone[0] * 0.9, tone[1] * 0.72, tone[2] * 0.72];
  const hair = [72, 56, 46];
  const shadow = [tone[0] * 0.8, tone[1] * 0.82, tone[2] * 0.88];
  const pale = [Math.min(255, tone[0] * 1.08), Math.min(255, tone[1] * 1.02), Math.min(255, tone[2] * 1.0)];
  // What colours skin: blood (red), melanin (brown), and, where a vein lies under it, the blue of its depth.
  const brown = [tone[0] * 0.84, tone[1] * 0.76, tone[2] * 0.66];
  const mole = [tone[0] * 0.62, tone[1] * 0.48, tone[2] * 0.4];
  const vein = [tone[0] * 0.84, tone[1] * 0.9, tone[2] * 0.95];
  const { E, M, nose, R } = L;
  return (p, n, zone) => {
    const x = p[0], y = p[1], z = p[2], s = Math.abs(x);
    let c = base;
    // Mottling, at every size skin has it: broad flushes of blood, blotches a centimetre across, the
    // millimetre speckle of the capillaries, and melanin's own unevenness over them.
    const broad = fbm(x * 9, y * 9, z * 9, 3), blotch = fbm(x * 85 + 3, y * 85, z * 85, 2);
    const fine = noise3(x * 420, y * 420, z * 420), speck = noise3(x * 1050 + 9, y * 1050, z * 1050);
    c = mixc(c, red, clamp(0.07 + 0.09 * broad + 0.07 * blotch + 0.05 * fine));
    c = mixc(c, brown, clamp(0.1 * fbm(x * 30 + 7, y * 30, z * 30, 2) + 0.09 * noise3(x * 190 + 5, y * 190, z * 190) + 0.06 * speck + 0.04));
    c = c.map((v) => v * (1 + 0.025 * fine + 0.03 * speck));
    // Freckles, faint, where the sun gets (the face, the shoulders, the arms); a mole here and there.
    const sun = zone === 'head' ? smooth(-0.2, 0.5, n[2]) : zone === 'arm' ? 0.7 : zone === 'trunk' ? smooth(1.3, 1.42, y) * 0.8 : 0.25;
    c = mixc(c, brown, 0.3 * sun * smooth(0.5, 0.75, noise3(x * 330 + 40, y * 330, z * 330)) * smooth(-0.2, 0.3, blotch + broad));
    c = mixc(c, mole, 0.5 * smooth(0.94, 0.965, noise3(x * 120 + 11, y * 120 + 3, z * 120)) * smooth(0.2, 0.6, noise3(x * 500, y * 500, z * 500) + 0.6));
    if (zone === 'head' || zone === 'neck') {
      const front = smooth(-0.2, 0.4, n[2]);
      // Flush: cheeks, the nose (its tip most), the ears.
      let flush = 0.12 * G(Math.hypot(s - 0.045, y - (E[1] - 0.03)) / 0.022) * front;
      flush += 0.15 * G(Math.hypot(x - nose[0], (y - nose[1]) * 1.3, z - nose[2]) / 0.016);
      flush += 0.18 * smooth(0.068, 0.078, s) * smooth(E[1] + 0.03, E[1] + 0.01, y) * smooth(M[1] - 0.03, M[1] - 0.01, y);
      c = mixc(c, red, clamp(flush));
      // Shaved: the beard's shadow on the jaw, chin and upper lip; and the scalp's.
      const below = smooth(nose[1] + 0.004, nose[1] - 0.012, y) * smooth(0.07, 0.055, s);
      const jaw = below * smooth(E[1] - 0.12, E[1] - 0.095, y) * (smooth(-0.6, 0.2, n[2]) + smooth(-0.3, -0.8, n[1]));
      const cheekline = smooth(0.03, 0.05, s) * smooth(M[1] + 0.035, M[1] + 0.005, y);
      let beard = clamp(jaw) * (s < 0.03 ? 1 : cheekline + smooth(0.05, 0.03, s) * (1 - smooth(nose[1] - 0.02, nose[1] - 0.004, y)));
      const scalp = smooth(E[1] + 0.06, E[1] + 0.085, y + (0.06 - Math.min(0.06, z)) * 0.35) * smooth(E[1] - 0.04, E[1] - 0.01, y) * (1 - front * smooth(E[1] + 0.09, E[1] + 0.06, y));
      const dots = 0.6 + 0.4 * noise3(x * 900, y * 900, z * 900);
      c = mixc(c, shadow, clamp((female ? 0 : beard * 0.55) + scalp * 0.22) * dots);
      // Where hair grows, its colour, streaked as the hair is.
      if (grown) {
        const { cover, shade } = hairPaint(groom.style, groom.beard, p, n);
        // Stippled, as short hair is, and thinning toward the hairline at the neck, as a taper does.
        const stipple = 0.8 + 0.2 * noise3(x * 4000, y * 4000, z * 4000);
        const taper = groom.style ? 0.65 + 0.35 * smooth(1.615, 1.69, y) : 1;
        if (cover > 0) c = mixc(c, grown.map((v) => v * shade * (0.9 + 0.3 * noise3(x * 1800, y * 240, z * 1800))), clamp(cover * taper * stipple));
      }
      // The lips: their own red, deepest at their middles, lined with their fine creases, darker and
      // wetter into the slit between them; a paler rim where they meet the skin.
      const lips = lipsAt(M, x, y, z);
      if (lips.on > 0) {
        const into = lips.above > 0 ? lips.above / lips.up : -lips.above / lips.low;
        const creases = Math.max(0, 1 - Math.abs(noise3(x * 850 + y * 60, y * 55, z * 90)) * 3.5) * smooth(0.02, 0.2, into);
        const body = (0.5 + 0.14 * G((into - 0.45) / 0.35)) * (0.92 + 0.08 * noise3(x * 300, y * 2000, z * 300));
        c = mixc(c, lipC, lips.on * body * (female ? 1.2 : 1));
        c = mixc(c, [lipC[0] * 0.72, lipC[1] * 0.6, lipC[2] * 0.62], lips.on * (0.28 * creases + 0.45 * smooth(0.22, 0, into)));
        c = mixc(c, pale, 0.1 * lips.on * G((into - 0.72) / 0.12) * (lips.above > 0 ? 0.5 : 1));
      }
      c = mixc(c, pale, 0.1 * (1 - lips.on) * G((y - M[1] - lips.up - 0.0012) / 0.0012) * smooth(0.014, 0.008, s) * front);
      // Inside the mouth: dark, wet.
      const inside = smooth(M[2] - 0.006, M[2] - 0.014, z) * smooth(M[2] - 0.07, M[2] - 0.06, z) * smooth(FACE.lipCorner[0] - 0.001, FACE.lipCorner[0] - 0.006, s) * G((y - M[1]) / 0.02) * smooth(0.5, 0.0, n[2]);
      c = mixc(c, [70, 26, 28], inside);
      // The brows: a band of short hairs over each eye, arched, thinning toward the tail.
      // (Hers groomed: the fine brow's line, as hair.js grows it.)
      const brow = browAt(p, female), bx = brow.along;
      if (bx > -0.05 && bx < 1.05 && n[2] > 0) {
        const mid = brow.mid, half = brow.half;
        const across = (y - mid) / half;
        const ends = smooth(-0.05, 0.08, bx) * smooth(1.05, 0.85, bx);
        const hairs = 0.5 + 0.5 * noise3(s * 700 + y * 500, y * 250, z * 300);
        // (Hers plucked: the same hairs, with a cleaner edge.)
        const fill = smooth(1, female ? 0.45 : 0.2, Math.abs(across)) * (0.4 + 0.6 * hairs);
        const b = fill * ends * smooth(E[2] - 0.03, E[2] - 0.01, z);
        // (Under the brows' own hairs, when he has them: in his hair's colour, softer; hers a shade darker, as her brows are.)
        const browC = grown ? grown.map((v) => v * (female ? 0.45 : 0.7)) : hair;
        c = mixc(c, browC, clamp(b) * (grown ? 0.4 : 0.55));
      }
      // The lash line round each eye: the lids' rims, darkest along the upper.
      const e = [E[0] * (x >= 0 ? 1 : -1), E[1], E[2]];
      const de = Math.hypot(x - e[0], y - e[1], z - e[2]);
      const rim = smooth(R + 0.0019, R + 0.0006, de) * smooth(e[2] - 0.006, e[2] + 0.002, z);
      c = mixc(c, y > e[1] ? [70, 50, 42] : mixc(base, red, 0.3), clamp(rim * (y > e[1] ? 0.4 : 0.2)));
      // The upper lid's crease, a little shadowed; under the eye, a little blue.
      c = mixc(c, [base[0] * 0.82, base[1] * 0.78, base[2] * 0.8], 0.1 * G((de - R - 0.007) / 0.002) * smooth(e[1] + 0.002, e[1] + 0.007, y) * front);
      c = mixc(c, [base[0] * 0.8, base[1] * 0.76, base[2] * 0.84], 0.2 * G((de - R - 0.008) / 0.005) * smooth(e[1] - 0.003, e[1] - 0.008, y) * front * smooth(0.02, 0.006, Math.abs(s - e[0] * Math.sign(e[0]) + 0.004)));
      // The lids: thin skin, a little darker and redder, with the fine veins that show through it.
      const lid = smooth(R + 0.009, R + 0.003, de) * smooth(e[2] - 0.004, e[2] + 0.004, z);
      c = mixc(c, [base[0] * 0.86, base[1] * 0.74, base[2] * 0.76], lid * (0.2 + 0.1 * noise3(x * 900, y * 900, z * 900)));
      // The wet pink of the inner corner, and the lids' rims where they lie on the eye.
      const inner = G(Math.hypot(s - (E[0] - 0.0158), (y - (E[1] - 0.0022)) * 1.4) / 0.0028) * smooth(e[2] - 0.012, e[2] - 0.002, z);
      c = mixc(c, [208, 132, 124], 0.4 * inner);
      c = mixc(c, [base[0] * 0.98, base[1] * 0.72, base[2] * 0.72], 0.35 * smooth(R + 0.0006, R - 0.0006, de) * smooth(e[2] - 0.006, e[2] + 0.002, z));
    } else if (zone === 'hand') {
      const m = x >= 0 ? 1 : -1;
      // Paler palms; flushed knuckles and fingertips.
      const palm = smooth(0.1, 0.6, -n[0] * m);
      c = mixc(c, pale, palm * 0.6);
      c = mixc(c, red, 0.15 * (1 - palm) * smooth(0.04, 0.0, Math.abs(y - (JOINTS.wrist[1] - 0.1))));
      // Veins over the back of the hand, a little blue through the skin.
      const veins = Math.max(0, 1 - Math.abs(noise3(x * 70 + 3, y * 22, z * 70)) * 5) * smooth(0.2, 0.6, noise3(x * 30, y * 30, z * 30) + 0.5);
      c = mixc(c, vein, 0.16 * veins * (1 - palm) * smooth(JOINTS.wrist[1] - 0.105, JOINTS.wrist[1] - 0.08, y));
      // The joints' creases, darker in their folds, the skin over them redder.
      const crease = fingerCreases(L, x, y, z, n);
      c = mixc(c, [base[0] * 0.8, base[1] * 0.64, base[2] * 0.6], 0.4 * crease);
      const nail = nailAt(L, x, y, z, n);
      if (nail) {
        // The nail: pink over its bed, the pale moon at its root, its free edge white; fine ridges along it.
        const lunula = G((nail.along - 0.0115) / 0.0015) * 0.5;
        const free = smooth(0.0022, 0.0008, nail.along);
        const bed = mixc([236, 190, 180], [222, 160, 152], 0.5 + 0.5 * noise3(x * 300, y * 300, z * 300));
        c = mixc(c, mixc(bed, [248, 238, 230], Math.max(lunula, free)), nail.plate * 0.85);
        c = c.map((v) => v * (1 - 0.03 * nail.plate * Math.max(0, Math.sin(nail.side * 9000))));
        // The fold of skin round it, and the cuticle.
        c = mixc(c, [base[0] * 0.75, base[1] * 0.6, base[2] * 0.6], 0.5 * nail.fold);
      }
    } else if (zone === 'trunk') {
      // The nipples.
      // (Painted where they are on him: the skin is one, so on her they are where hers are, a little wider.)
      const areola = female ? 1.35 : 1;
      for (const m of [1, -1]) {
        const d = Math.hypot(x - 0.098 * m, (y - 1.287) * 1.1) / areola;
        if (d < 0.03 && n[2] > 0.3) c = mixc(c, [tone[0] * 0.72, tone[1] * 0.52, tone[2] * 0.52], 0.75 * smooth(0.0125, 0.0095, d) + 0.25 * smooth(0.005, 0.003, d));
      }
      // The navel's hollow.
      c = mixc(c, shadow.map((v) => v * 0.8), 0.5 * G(Math.hypot(x, y - 1.089) / 0.006) * smooth(0.3, 0.8, n[2]));
      // The armpits, a little darker.
      c = mixc(c, shadow, 0.2 * G((s - 0.17) / 0.03) * G((y - 1.34) / 0.04));
    } else if (zone === 'arm' || zone === 'leg') {
      // Elbows and knees, a little rough and red.
      const m = x >= 0 ? 1 : -1;
      if (zone === 'arm') c = mixc(c, red, 0.3 * G(Math.hypot(x - JOINTS.elbow[0] * m, y - JOINTS.elbow[1]) / 0.025) * smooth(0, -0.6, n[2]));
      else c = mixc(c, red, 0.25 * G(Math.hypot(x - JOINTS.knee[0] * m, y - JOINTS.knee[1] - 0.01) / 0.035) * smooth(0, 0.6, n[2]));
      // Veins down the inside of the forearm, faint.
      if (zone === 'arm') {
        const veins = Math.max(0, 1 - Math.abs(noise3(x * 60 + 3, y * 14, z * 60)) * 5);
        c = mixc(c, vein, 0.1 * veins * smooth(JOINTS.elbow[1] - 0.03, JOINTS.elbow[1] - 0.1, y) * smooth(0.1, 0.6, n[2] - n[0] * m * 0.5));
      }
    } else if (zone === 'foot') {
      c = mixc(c, pale, smooth(-0.3, -0.8, n[1]) * 0.6);
      c = mixc(c, red, 0.25 * smooth(0.1, 0.18, z) * smooth(0, 0.6, n[1]));
    }
    return c;
  };
}

/** The skin's map, on the base mesh's own UVs, `size` square: RGBA bytes. */
export function skinPixels(size, tone, groom = {}) {
  return bodyPixels(size, skinColour(hex(tone), landmarks(), groom), [180, 130, 110]);
}

/**
 * The skin's detail at a place, for the material's detail map: [relief,
 * roughness, pores], each 0–255. The relief (128 level) is what the pore
 * tile cannot hold: the lips' creases, the lines of the brow and at the
 * eyes' corners, the joints' folds, the skin's unevenness. The roughness
 * (128 the material's own) is glossier down the brow, nose and chin, on the
 * lips, the lids and the nails, rougher on the palms, soles, elbows and
 * knees. The pores (255 all of the tile) are open on the nose and cheeks,
 * nearly closed on the lips and lids, and gone from the nails.
 */
function skinDetail(L) {
  const { E, M, nose, R } = L;
  // Thin lines where a noise crosses nought: wrinkles, running across the first direction it is stretched in.
  const lines = (a, b, c, sharp = 4) => Math.max(0, 1 - Math.abs(noise3(a, b, c)) * sharp);
  return (p, n, zone) => {
    const x = p[0], y = p[1], z = p[2], s = Math.abs(x);
    // Everywhere: the skin's unevenness, a few millimetres across.
    let h = 0.16 * fbm(x * 260, y * 260, z * 260, 2), rough = 1.06 + 0.1 * noise3(x * 150, y * 150, z * 150), pores = 0.75;
    if (zone === 'head' || zone === 'neck') {
      const front = smooth(-0.2, 0.4, n[2]);
      const e = [E[0] * (x >= 0 ? 1 : -1), E[1], E[2]];
      const de = Math.hypot(x - e[0], y - e[1], z - e[2]);
      // Glossier down the middle of the face, where the skin is oilier; the pores open over the nose and cheeks.
      const brow = smooth(E[1] + 0.022, E[1] + 0.035, y) * smooth(0.05, 0.02, s) * front;
      const onNose = G(Math.hypot(x, (y - nose[1] - 0.012) * 0.6, (z - nose[2]) * 0.8) / 0.02);
      const chin = G(Math.hypot(x, y - (M[1] - 0.032)) / 0.018) * front;
      rough *= 1 - 0.2 * Math.max(brow, onNose, chin * 0.7);
      pores = 0.7 + 0.3 * Math.max(onNose, G(Math.hypot(s - 0.04, y - (E[1] - 0.035)) / 0.03) * front);
      // The brow's lines, faint on a young man; the crow's feet and the crinkles under the eyes.
      h -= 0.16 * lines(x * 22, y * 420 + 6 * Math.cos(x * 30), z * 10) * smooth(E[1] + 0.03, E[1] + 0.04, y) * smooth(E[1] + 0.075, E[1] + 0.06, y) * smooth(0.055, 0.035, s) * front;
      const out = smooth(e[0] * Math.sign(e[0]) + 0.012, e[0] * Math.sign(e[0]) + 0.02, s);
      h -= 0.22 * lines(x * 260, y * 620 + (s - 0.05) * 300 * Math.sign(y - e[1]), z * 260) * out * G((y - e[1]) / 0.012) * smooth(R + 0.02, R + 0.008, de);
      const under = G((de - R - 0.006) / 0.005) * smooth(e[1] - 0.002, e[1] - 0.007, y) * front;
      h -= 0.2 * lines(x * 380 + y * 500, y * 760, z * 200, 3) * under;
      // The lids: thin and smooth.
      const lid = smooth(R + 0.009, R + 0.003, de) * smooth(e[2] - 0.004, e[2] + 0.004, z);
      pores *= 1 - 0.7 * Math.max(lid, under * 0.6);
      rough *= 1 - 0.14 * lid;
      // The lips: smooth and glossy, creased up and down.
      const lips = lipsAt(M, x, y, z);
      if (lips.on > 0) {
        const into = lips.above > 0 ? lips.above / lips.up : -lips.above / lips.low;
        const creases = lines(x * 850 + y * 60, y * 55, z * 90, 3.5) * smooth(0.02, 0.2, into) + 0.4 * lines(x * 1700 + 5, y * 80, z * 120, 3);
        h = h * (1 - lips.on) - 0.6 * lips.on * creases;
        pores *= 1 - 0.85 * lips.on;
        rough *= 1 - 0.38 * lips.on;
      }
      // The ears: smooth cartilage under thin skin.
      const ear = smooth(0.07, 0.078, s);
      pores *= 1 - 0.6 * ear;
      // The neck's rings, faint.
      if (zone === 'neck') h -= 0.12 * lines(x * 12, y * 260, z * 12) * front;
    } else if (zone === 'hand') {
      const m = x >= 0 ? 1 : -1;
      const palm = smooth(0.1, 0.6, -n[0] * m);
      rough *= 1 + 0.16 * palm;
      pores = 0.75 - 0.35 * palm;
      // The back of the hand's fine diamond lines; the palm's ridges.
      h -= 0.2 * (1 - palm) * Math.max(lines(x * 900 + y * 500, y * 900, z * 700, 3), lines(x * 900 - y * 500, y * 900, z * 700 + 9, 3));
      h += 0.1 * palm * Math.sin((x * 0.6 + y + z * 0.8) * 5200 + 4 * noise3(x * 150, y * 150, z * 150));
      h -= 0.9 * fingerCreases(L, x, y, z, n);
      const nail = nailAt(L, x, y, z, n);
      if (nail) {
        // The nail: hard, glossy, poreless, ridged faintly along its length, the fold round it sunk.
        h = h * (1 - nail.plate) + nail.plate * (0.25 + 0.06 * Math.sin(nail.side * 9000)) - 0.5 * nail.fold;
        pores *= 1 - nail.plate;
        rough *= 1 - 0.55 * nail.plate;
      }
    } else if (zone === 'trunk') {
      // The nipples: raised, pebbled.
      for (const m of [1, -1]) {
        const d = Math.hypot(x - 0.098 * m, (y - 1.287) * 1.1);
        if (d < 0.02 && n[2] > 0.3) {
          const on = smooth(0.0125, 0.0095, d);
          h += on * (0.25 + 0.4 * Math.max(0, noise3(x * 1300, y * 1300, z * 1300))) + 0.5 * smooth(0.005, 0.003, d);
          pores *= 1 - 0.6 * on;
        }
      }
    } else if (zone === 'arm' || zone === 'leg') {
      // Elbows and knees: thicker skin, folded across the joint.
      const m = x >= 0 ? 1 : -1;
      const joint = zone === 'arm'
        ? G(Math.hypot(x - JOINTS.elbow[0] * m, y - JOINTS.elbow[1]) / 0.03) * smooth(0, -0.6, n[2])
        : G(Math.hypot(x - JOINTS.knee[0] * m, y - JOINTS.knee[1] - 0.01) / 0.04) * smooth(0, 0.6, n[2]);
      h -= 0.45 * joint * lines(x * 60, y * 520 + 3 * noise3(x * 80, y * 20, z * 80), z * 60, 3);
      rough *= 1 + 0.18 * joint;
    } else if (zone === 'foot') {
      const sole = smooth(-0.3, -0.8, n[1]);
      rough *= 1 + 0.2 * sole;
      pores = 0.75 - 0.4 * sole;
      h -= 0.3 * (1 - sole) * smooth(0.14, 0.17, z) * lines(x * 200, y * 300, z * 900, 3);
    }
    return [128 + 115 * clamp(h, -1, 1), 128 * clamp(rough, 0, 1.99), 255 * clamp(pores)];
  };
}

/** The skin's detail map (see skinDetail), on the base mesh's own UVs, `size` square: RGBA bytes. */
export function skinDetailPixels(size) {
  return bodyPixels(size, skinDetail(landmarks()), [128, 136, 190]);
}

/** Paints the body's UV layout texel by texel: `colour(p, n, zone)` → [r, g, b] for each texel's place on the body. */
function bodyPixels(size, colour, empty = [128, 128, 128]) {
  const { P, N, Z, ZONES } = positionMap(size);
  const rgba = new Uint8ClampedArray(size * size * 4);
  const filled = new Uint8Array(size * size);
  const p = [0, 0, 0], n = [0, 0, 0];
  for (let o = 0; o < size * size; o++) {
    if (!Z[o]) continue;
    for (let k = 0; k < 3; k++) { p[k] = P[o * 3 + k]; n[k] = N[o * 3 + k]; }
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    n[0] /= l; n[1] /= l; n[2] /= l;
    const c = colour(p, n, ZONES[Z[o]]);
    rgba[o * 4] = c[0]; rgba[o * 4 + 1] = c[1]; rgba[o * 4 + 2] = c[2]; rgba[o * 4 + 3] = 255;
    filled[o] = 1;
  }
  bleed(rgba, filled, size);
  for (let o = 0; o < size * size; o++) if (!rgba[o * 4 + 3]) { rgba[o * 4] = empty[0]; rgba[o * 4 + 1] = empty[1]; rgba[o * 4 + 2] = empty[2]; rgba[o * 4 + 3] = 255; }
  return rgba;
}

/** A canvas holding `rgba` (`size` square). */
function canvasOf(rgba, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  img.data.set(rgba);
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * The skin's own fine relief, as a repeating tile for its bump: the net of
 * furrows that divides it into little plates a third of a millimetre across,
 * a pore sunk where some of them meet, and hardly anything else. (Cells
 * about scattered points, their borders the furrows; the tile repeats.)
 */
function poreTile(size = 512, cells = 56) {
  const rnd = (i, j, k) => {
    let h = (Math.imul(((i % cells) + cells) % cells, 374761393) ^ Math.imul(((j % cells) + cells) % cells, 668265263) ^ Math.imul(k, 2147483647)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) & 0xffff) / 65535;
  };
  const per = (u, v, f, k) => noise3(Math.cos(u * Math.PI * 2) * f, Math.sin(u * Math.PI * 2) * f, Math.cos(v * Math.PI * 2) * f + Math.sin(v * Math.PI * 2) * f * 1.7 + k);
  return paint(size, size, (u, v) => {
    const gx = u * cells, gy = v * cells, ci = Math.floor(gx), cj = Math.floor(gy);
    let f1 = 9, f2 = 9, f3 = 9, open = 0;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const i = ci + di, j = cj + dj;
        const d = Math.hypot(i + 0.15 + 0.7 * rnd(i, j, 1) - gx, j + 0.15 + 0.7 * rnd(i, j, 2) - gy);
        if (d < f1) { f3 = f2; f2 = f1; f1 = d; open = rnd(i, j, 3); } else if (d < f2) { f3 = f2; f2 = d; } else if (d < f3) f3 = d;
      }
    }
    // The furrows between the plates, deeper along some than others; a pore where three plates meet, at some of the corners.
    const furrow = smooth(0.16, 0, f2 - f1) * (0.55 + 0.45 * per(u, v, 5, 2));
    const pore = smooth(0.3, 0.05, f3 - f1) * smooth(0.25, 0.05, f2 - f1) * smooth(0.35, 0.6, open);
    // Each plate gently domed.
    const h = 176 + 26 * smooth(0.75, 0.1, f1) - 62 * furrow - 96 * pore + 10 * per(u, v, 3, 0);
    return [h, h, h];
  });
}

/**
 * The eye. The iris as an iris is made: fibres running out from the pupil,
 * finer ones between them, the crinkled collarette a third of the way out
 * (paler, a little golden), dark crypts beyond it, the furrows that ring it
 * near its edge, and the limbal ring fading into the white. It is shadowed
 * above, where the lid and lashes stand over it, and lit below, where the
 * light through the cornea gathers. The white is not white: ivory, greyer
 * and pinker toward the corners, with its fine vessels branching in from
 * them.
 */
function eyeMap(iris, size = 1024) {
  const ic = hex(iris), white = hex('#e6e1dc'), pinkish = hex('#d2a79e'), gold = hex('#b9914a');
  const deep = ic.map((x) => x * 0.42), bright = ic.map((x) => Math.min(255, x * 1.5 + 14));
  const lines = (a, b, c, sharp) => Math.max(0, 1 - Math.abs(noise3(a, b, c)) * sharp);
  return paint(size, size, (u, v) => {
    const dx = u - 0.5, dy = v - 0.5;
    const r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // The eye's UVs put the angle from its front at radius √(a/π)/2.
    const a = Math.PI * (2 * r) ** 2;
    // The white, and what is on it.
    let c = mixc(white, pinkish, smooth(0.55, 1.5, a) * 0.65);
    c = c.map((x) => x * (1 - 0.2 * smooth(0.5, 1.3, a)) * (1 + 0.015 * noise3(ca * 20, sa * 20, a * 30)));
    const reach = smooth(0.45, 1.1, a);
    const vessels = Math.max(lines(ang * 5 + 0.6 * noise3(a * 5, ang * 2, 1), a * 0.9, 3, 9) * reach, 0.7 * lines(ang * 13 + noise3(a * 9, ang * 5, 5), a * 2.2, 11, 12) * smooth(0.6, 1.2, a));
    c = mixc(c, hex('#b8504c'), 0.4 * vessels);
    if (a < 0.44) {
      const t = (a - 0.115) / 0.265;
      // Fibres: coarse ones bent by noise, fine ones between; brighter strands over a darker ground.
      const warp = noise3(ca * 3, sa * 3, t * 2.5) * 2.2;
      const coarse = 0.5 + 0.5 * Math.sin(ang * 46 + warp * 3);
      const thin = 0.5 + 0.5 * noise3(ca * 60 + warp, sa * 60, t * 4);
      const strands = clamp(0.55 * coarse ** 2 + 0.6 * thin);
      let k = mixc(deep, bright, clamp(0.18 + 0.62 * strands * (1 - 0.35 * t)));
      // The collarette: a crinkled ring, paler and golden, the fibres inside it finer and brighter.
      const ring = 0.3 + 0.05 * noise3(ca * 9, sa * 9, 2) + 0.025 * Math.sin(ang * 23);
      k = mixc(k, gold, 0.5 * G((t - ring) / 0.07) + 0.28 * smooth(ring, 0, t));
      // Crypts: little dark pits beyond it. The furrows that ring it toward the edge.
      k = mixc(k, deep.map((x) => x * 0.7), 0.6 * smooth(0.35, 0.7, noise3(ca * 14 + 3, sa * 14, t * 6)) * smooth(ring, ring + 0.12, t) * smooth(0.95, 0.7, t));
      k = k.map((x) => x * (1 - 0.14 * Math.max(0, Math.sin(t * 34 + noise3(ca * 4, sa * 4, 9) * 3)) ** 3 * smooth(0.5, 0.8, t)));
      // The lid's shadow over its top, and the light the cornea gathers onto its lower half.
      k = k.map((x) => x * (0.72 + 0.4 * smooth(0.6, -0.7, sa * Math.min(1, t + 0.3)) + 0.16 * G(Math.hypot(ca * t + 0.3, sa * t + 0.5) / 0.4)));
      // The pupil, soft at its edge; the limbal ring, soft too, fading out into the white.
      k = mixc(k, [6, 5, 5], smooth(0.05, -0.03, t));
      k = mixc(k, [22, 18, 16], smooth(0.74, 1, t) * 0.88);
      c = mixc(k, c, smooth(0.92, 1.2, t));
    }
    return c;
  });
}

// ———————————————————————————————————————————————— the shirt

/** The shirt: off-white to be tinted, flecked like a heather jersey, with its seams and the hems' double stitching. */
function shirtMaps() {
  // Painted on the body's own layout (the shirt is cut from the skin), by where each texel is on him.
  const size = 1024;
  const dash = (p, k) => 0.5 + 0.5 * Math.sign(Math.sin((p[0] * 0.7 + p[1] + p[2] * 0.8) * k));
  const rgba = bodyPixels(size, (p, n, zone) => {
    let c = 232 + 10 * noise3(p[0] * 300, p[1] * 300, p[2] * 300) + 8 * noise3(p[0] * 40, p[1] * 40, p[2] * 40);
    let seam = 0;
    const th = Math.atan2(p[0], p[2] - SHIRT_Z);
    const r = Math.hypot(p[0], p[2] - SHIRT_Z);
    if (zone === 'arm') {
      const d = armDistance(p, p[0] >= 0 ? 1 : -1);
      // The cuff's two rows of stitching, and the seam round the top of the sleeve.
      for (const dd of [0.011, 0.0165]) seam += G((SLEEVE_RANGE[1] - dd - d) / 0.0008) * dash(p, 900);
      seam += 0.7 * G((d - 0.03) / 0.0018);
    } else {
      // The side seams, under the arms.
      const side = Math.min(Math.abs(th - Math.PI / 2), Math.abs(th + Math.PI / 2)) * r;
      seam += 0.8 * G(side / 0.0025) * smooth(1.36, 1.32, p[1]);
      // The hem's two rows of stitching.
      for (const dy of [0.011, 0.0175]) seam += G((p[1] - HEM - dy) / 0.0008) * dash(p, 900);
      // The shoulder seams, along the top of each shoulder from the collar out.
      if (p[1] > 1.42) seam += 0.8 * G((p[2] + 0.005) / 0.0025) * smooth(0.07, 0.1, Math.abs(p[0]));
      // The collar's rib: fine lines up and down it.
      const down = neckline(th) - p[1];
      if (down < 0.016) c -= 18 * Math.max(0, Math.sin(th * 260)) * smooth(0.016, 0.014, down);
      seam += 0.8 * G((down - 0.016) / 0.0012);
    }
    c -= 40 * clamp(seam);
    return [c, c, c];
  }, [232, 232, 232]);
  const map = canvasOf(rgba, size);
  // A jersey's knit, as a repeating tile: rows of little V-shaped stitches.
  const bump = paint(128, 128, (u, v) => {
    const cols = 16, rows = 16;
    const cu = (u * cols) % 1, cv = (v * rows) % 1;
    const vshape = Math.abs(cu - 0.5) * 2;
    const h = 128 + 70 * Math.cos((cv + vshape * 0.5) * Math.PI * 2) * 0.5 - 40 * G((cu - 0.5) / 0.08);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the later cloths

/** The weaves of the later garments, as repeating tiles for their bump: a twill's diagonal, a fine plain weave, a coarse canvas, a chunky knit, felt. */
function fabricTiles() {
  const tile = (n, fn) => paint(n, n, (u, v) => { const h = fn(u, v); return [h, h, h]; });
  const TAU = Math.PI * 2;
  return {
    twill: tile(128, (u, v) => 128 + 46 * Math.sin((u + v) * 24 * TAU / 2) + 14 * Math.sin((u - v) * 96 * TAU / 2) + 6 * noise3(u * 40, v * 40, 1)),
    plain: tile(128, (u, v) => 128 + 34 * Math.cos(u * 48 * TAU) * Math.cos(v * 48 * TAU) + 8 * noise3(u * 30, v * 30, 2)),
    coarse: tile(128, (u, v) => 128 + 52 * Math.cos(u * 16 * TAU) * Math.cos(v * 16 * TAU) + 12 * noise3(u * 24, v * 24, 3)),
    // Rows of V stitches, chunky: the way a sweater is knit.
    knit: tile(128, (u, v) => {
      const cols = 8, rows = 8, cu = (u * cols) % 1, cv = (v * rows) % 1, vshape = Math.abs(cu - 0.5) * 2;
      return 128 + 80 * Math.cos((cv + vshape * 0.55) * TAU) * 0.5 - 46 * G((cu - 0.5) / 0.12);
    }),
    felt: tile(128, (u, v) => 128 + 30 * noise3(u * 90, v * 90, 4) + 18 * noise3(u * 24, v * 24, 5)),
  };
}

/** The suit's cloth: off-white to be tinted, a faint chalk pinstripe up it (up the arms and legs too, as it is cut). */
function woolMap() {
  const size = 1024;
  const rgba = bodyPixels(size, (p) => {
    const x = p[0] * 71, stripe = G((((x % 1) + 1) % 1 - 0.5) / 0.05);
    const c = 236 + 8 * noise3(p[0] * 220, p[1] * 220, p[2] * 220) - 17 * stripe;
    return [c, c, c];
  }, [236, 236, 236]);
  return canvasOf(rgba, size);
}

// ———————————————————————————————————————————————— the jeans

/** The jeans: indigo, faded where they wear (thighs, knees), with every seam and pocket topstitched in gold. */
function denimMaps() {
  const indigo = hex('#2c4a78'), faded = hex('#6f8fb8'), deep = hex('#1d3256'), thread = hex('#c9934a');
  // Painted on the body's own layout (the jeans are cut from the skin), by where each texel is round its leg.
  const at = (u, v, th, y, x, z) => {
    const front = Math.cos(th);
    // Wear: whiskers across the tops of the thighs, a pale knee, honeycombs behind it, lighter down the shins.
    let fade = 0.18 + 0.1 * fbm(x * 30, y * 30, z * 30, 3);
    fade += 0.3 * smooth(0.2, 0.8, front) * G((y - 0.54) / 0.07);
    fade += 0.25 * smooth(0.3, 0.9, front) * G((y - 0.8) / 0.06) * Math.max(0, Math.sin((y * 1.4 + (x - 0.05) * 3) * 70)) ** 3;
    fade += 0.22 * smooth(-0.3, -0.9, front) * G((y - 0.49) / 0.025) * Math.max(0, Math.sin(th * 14)) ** 4;
    fade += 0.12 * smooth(0.3, 0.9, front) * smooth(0.98, 0.8, y) * smooth(0.65, 0.85, y);
    let c = mixc(indigo, faded, clamp(fade));
    // Weft flecks.
    c = mixc(c, faded, 0.18 * Math.max(0, noise3(u * 1200, v * 900, 3)));
    let st = 0, dark = 0;
    const ang = (a) => Math.abs(Math.atan2(Math.sin(th - a), Math.cos(th - a)));
    // The outseam (one row), the inseam (two), the hem (two).
    dark += G(ang(Math.PI / 2) / 0.01);
    st += G((ang(Math.PI / 2) - 0.03) / 0.0045) * smooth(0.95, 0.9, y);
    dark += G(ang(3 * Math.PI / 2) / 0.01) * smooth(0.88, 0.86, y);
    for (const k of [0.022, 0.05]) st += G((ang(3 * Math.PI / 2) - k) / 0.0045) * smooth(0.88, 0.86, y);
    const hem = jeansHeight(0, th);
    for (const k of [0.012, 0.016]) st += G((y - hem - k) / 0.0008);
    if (front < -0.2) {
      // The yoke, and a back pocket under it with its stitched arcs.
      const yoke = 0.975 - 0.045 * clamp(x / 0.17);
      st += G((y - yoke) / 0.0009) + G((y - yoke + 0.007) / 0.0009);
      dark += G((y - yoke + 0.0035) / 0.002) * 0.6;
      const px = (x - 0.095) / 0.06, top = 0.945;
      const bottom = 0.835 - 0.022 * (1 - Math.abs(px));
      const inside = Math.abs(px) < 1 && y < top && y > bottom;
      const edge = Math.min(Math.abs(Math.abs(px) - 1) * 0.06, Math.abs(y - top), Math.abs(y - bottom));
      if (Math.abs(px) < 1.08 && y < top + 0.004 && y > bottom - 0.004) {
        st += G((edge - 0.003) / 0.0007) + G((edge - 0.0055) / 0.0007) * 0.8;
        if (inside) dark += 0.12;
        dark += G(edge / 0.0014) * 0.7;
        const arc = 0.9 - 0.012 * Math.cos(px * Math.PI);
        if (inside) st += G((y - arc) / 0.0008) + G((y - arc + 0.006) / 0.0008);
      }
    }
    if (front > 0.2) {
      // The front pocket's opening, and the J of the fly.
      const t = clamp((x - 0.1) / 0.075);
      const curve = 0.995 - 0.085 * Math.sin(t * Math.PI / 2);
      st += G((y - curve) / 0.0008) * smooth(0.098, 0.105, x) * smooth(0.178, 0.17, x);
      dark += G((y - curve - 0.003) / 0.002) * 0.6 * smooth(0.098, 0.105, x);
      const jx = 0.034, jr = 0.022;
      const jd = y > 0.915 ? Math.abs(x - jx) : Math.abs(Math.hypot(x - (jx - jr), y - 0.915) - jr);
      st += G((jd) / 0.0008) * smooth(0.005, 0.012, x) * smooth(0.89, 0.895, y);
    }
    c = mixc(c, deep, clamp(dark) * 0.7);
    // Stitches as dashes of gold thread.
    c = mixc(c, thread, clamp(st) * 0.6);
    return c;
  };
  const map = canvasOf(bodyPixels(1024, (p) => {
    const { th } = legAngle(p);
    const t = ((th / (Math.PI * 2)) % 1 + 1) % 1;
    const v = clamp((p[1] - jeansHeight(0, th)) / (jeansHeight(1, th) - jeansHeight(0, th)));
    return at(t, v, th, p[1], Math.abs(p[0]), p[2]);
  }, [44, 74, 120]), 1024);
  // A 3/1 twill as a repeating tile: diagonal ribs.
  const bump = paint(128, 128, (u, v) => {
    const h = 128 + 80 * Math.sin((u * 16 + v * 16) * Math.PI * 2) + 25 * noise3(u * 64, v * 64, 9);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the socks

/** Crew socks: a fine knit, the cuff ribbed, the heel knit denser and a shade darker. */
function sockMaps() {
  const map = canvasOf(bodyPixels(1024, (p, n, zone) => {
    let c = 236 + 8 * noise3(p[0] * 400, p[1] * 400, p[2] * 400);
    const { th } = legAngle(p);
    if (zone === 'leg') {
      // The cuff's rib, and the line where it is knit on.
      const rib = smooth(SOCKS.top - SOCKS.rib - 0.002, SOCKS.top - SOCKS.rib + 0.002, p[1]);
      c -= rib * 40 * Math.max(0, Math.sin(th * 32)) ** 1.5;
      c -= 22 * G((p[1] - SOCKS.top + SOCKS.rib) / 0.0015);
    }
    if (zone === 'foot') {
      const ankle = JOINTS.ankle[2];
      const heel = smooth(ankle - 0.02, ankle - 0.04, p[2]) * smooth(0.09, 0.07, p[1]);
      c -= 26 * heel;
    }
    return [c, c, c];
  }, [236, 236, 236]), 1024);
  const bump = paint(64, 64, (u, v) => {
    const cu = (u * 8) % 1, cv = (v * 8) % 1;
    const h = 128 + 60 * Math.cos((cv + Math.abs(cu - 0.5)) * Math.PI * 2) * 0.5 - 40 * G((cu - 0.5) / 0.1);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the leather jacket

/**
 * The jacket's hide: tinted by its colour, mottled as leather is, paler where
 * it wears (over the shoulders, the elbows, its edges), every panel's seam a
 * groove with a row of stitching beside it.
 */
function leatherMaps() {
  const size = 1024;
  const dash = (p, k) => 0.5 + 0.5 * Math.sign(Math.sin((p[0] * 0.7 + p[1] + p[2] * 0.8) * k));
  // A seam `d` away: the groove, and the stitching a few millimetres to one side.
  const seam = (d, p) => ({ groove: G(d / 0.0011), stitch: G((Math.abs(d) - 0.0042) / 0.0006) * dash(p, 700) });
  const map = canvasOf(bodyPixels(size, (p, n, zone) => {
    let c = 220 + 14 * fbm(p[0] * 60, p[1] * 60, p[2] * 60, 3) + 6 * noise3(p[0] * 500, p[1] * 500, p[2] * 500);
    let wear = 0, groove = 0, stitch = 0;
    const add = ({ groove: g, stitch: st }) => { groove = Math.max(groove, g); stitch = Math.max(stitch, st); };
    const th = Math.atan2(p[0], p[2] - SHIRT_Z), r = Math.hypot(p[0], p[2] - SHIRT_Z);
    if (zone === 'arm') {
      const m = p[0] >= 0 ? 1 : -1, d = armDistance(p, m);
      const el = armDistance(JOINTS.elbow, 1);
      add(seam(d - 0.03, p));
      // A seam down the back of the sleeve, and the panel over the elbow.
      const back = Math.atan2(p[0] - JOINTS.elbow[0] * m, p[2] - JOINTS.elbow[2]);
      add(seam((Math.abs(back) - 2.6) * 0.04, p));
      wear += 0.5 * G((d - el) / 0.05) * smooth(0.6, 1, -Math.cos(back));
      add(seam(d - JACKET.cuff + 0.035, p));
      wear += 0.6 * smooth(JACKET.cuff - 0.012, JACKET.cuff, d);
    } else {
      const band = JACKET.hem + JACKET.band;
      add(seam(p[1] - band, p));
      wear += 0.5 * smooth(JACKET.hem + 0.008, JACKET.hem, p[1]);
      // The yoke across the back, dipping to a point between the shoulder blades.
      if (Math.cos(th) < -0.2) add(seam(p[1] - (1.37 - 0.03 * G(p[0] / 0.06)), p));
      // The side seams, and a seam down each front from the shoulder to the band.
      const side = Math.min(Math.abs(th - Math.PI / 2), Math.abs(th + Math.PI / 2)) * r;
      if (p[1] < 1.34) add(seam(side, p));
      if (p[1] > 1.42) add(seam(p[2] + 0.005, p));
      wear += 0.45 * smooth(1.42, 1.48, p[1]);
    }
    c += 26 * clamp(wear) - 70 * groove - 45 * stitch;
    return [c, c * 0.985, c * 0.97];
  }, [220, 216, 212]), size);
  // The grain: a fine pebbling, and the faint creases of hide.
  const bump = paint(256, 256, (u, v) => {
    const per = (s, k) => noise3(Math.cos(u * Math.PI * 2) * s, Math.sin(u * Math.PI * 2) * s, Math.cos(v * Math.PI * 2) * s + Math.sin(v * Math.PI * 2) * s * 1.7 + k);
    const pebble = Math.abs(per(22, 0)) ** 0.6;
    const h = 150 - 70 * (1 - pebble) + 25 * per(6, 3) - 30 * Math.max(0, 1 - Math.abs(per(3, 7)) * 9);
    return [h, h, h];
  });
  return { map, bump };
}

// ———————————————————————————————————————————————— the rib knit

/**
 * The bomber's rib: ribs running across the waistband and the cuffs (painted
 * on the body's layout, by the angle round the body or the arm), and the same
 * as a tile for the collar, whose UVs run along it.
 */
function ribMaps() {
  const rib = (a) => 205 + 32 * Math.cos(a) - 10 * Math.max(0, Math.cos(a)) ** 6;
  const map = canvasOf(bodyPixels(1024, (p, n, zone) => {
    let a;
    if (zone === 'arm') {
      const m = p[0] >= 0 ? 1 : -1, el = [JOINTS.elbow[0] * m, JOINTS.elbow[1], JOINTS.elbow[2]];
      a = Math.atan2(p[0] - el[0], p[2] - el[2]) * 34;
    } else a = Math.atan2(p[0], p[2] - SHIRT_Z) * 150;
    const c = rib(a) + 8 * noise3(p[0] * 600, p[1] * 600, p[2] * 600);
    return [c, c, c];
  }, [200, 200, 200]), 1024);
  const tile = paint(64, 64, (u, v) => { const c = rib(v * Math.PI * 2 * 4); return [c, c, c]; });
  return { map, tile };
}

// ———————————————————————————————————————————————— the sneakers

function shoeMaps() {
  const upper = paint(512, 512, (u, v) => {
    // u round the shoe (0 outside at the sole, ½ over the top, 1 inside), v from heel to toe.
    let c = 200 + 14 * noise3(u * 300, v * 300, 2);
    const seams = G((v - 0.76 - 0.06 * Math.cos((u - 0.5) * Math.PI)) / 0.004) + G((v - 0.12) / 0.004) * 0.8;
    const stitch = G((v - 0.768 - 0.06 * Math.cos((u - 0.5) * Math.PI)) / 0.0015) * (0.5 + 0.5 * Math.sign(Math.sin(u * 300)));
    // The side panel's sweep, a lighter band from the heel along each side.
    const side = Math.min(u, 1 - u);
    const sweep = smooth(0.06, 0.1, side) * smooth(0.24, 0.2, side + 0.15 * (v - 0.2)) * smooth(0.15, 0.25, v) * smooth(0.7, 0.6, v);
    // The eyestay round the laces, darker.
    const stay = smooth(0.2, 0.15, Math.abs(u - 0.5)) * smooth(0.36, 0.4, v) * smooth(0.78, 0.74, v);
    c += 40 * sweep - 60 * stay - 70 * seams + 80 * stitch;
    return [c, c, c];
  });
  const sole = paint(256, 256, (u, v) => {
    // u across the sole: under it (0), round its edge and wall, back in over its top (1); v heel to toe.
    let c = 236 + 8 * noise3(u * 200, v * 200, 4);
    if (u < 0.3) {
      // The tread: rows of grooves across, darker rubber.
      const groove = Math.max(0, Math.sin(v * 140)) ** 8;
      return [c - 70 - 40 * groove, c - 72 - 40 * groove, c - 76 - 40 * groove];
    }
    // Round the wall, one coloured stripe and a fine rib either side.
    const stripe = G((u - 0.53) / 0.02);
    const rib = 0.5 * (G((u - 0.42) / 0.006) + G((u - 0.66) / 0.006));
    c -= 30 * rib;
    return [c + (190 - c) * stripe, c + (70 - c) * stripe, c - 6 + (60 - c) * stripe];
  });
  return { upper, sole };
}

const cache = new WeakMap();

/**
 * Every texture the human needs, for one look ({ skin, iris }) and size of
 * skin map, made once and kept. Returns null where there is no document to
 * paint on.
 */
export function humanTextures(GFX, { skin = '#c08a6c', iris = '#5a4632', size = 2048, hair: hairColour = null, style = null, beard = null, sex = 'male' } = {}) {
  if (typeof document === 'undefined') return null;
  let byGFX = cache.get(GFX);
  if (!byGFX) cache.set(GFX, (byGFX = new Map()));
  const groom = { ...(style || beard ? { hairColour, style, beard } : {}), female: sex === 'female' };
  const key = `${skin}|${iris}|${size}|${style}|${beard}|${style || beard ? hairColour : ''}|${sex}`;
  if (byGFX.has(key)) return byGFX.get(key);
  const garments = byGFX.get('garments') ?? (() => {
    const fabrics = fabricTiles(), suit = woolMap();
    const shirt = shirtMaps(), denim = denimMaps(), shoes = shoeMaps(), sock = sockMaps(), hide = leatherMaps(), ribs = ribMaps();
    const g = {
      shirt: { map: texture(GFX, shirt.map), bump: texture(GFX, shirt.bump, { color: false, repeat: [140, 140] }) },
      denim: { map: texture(GFX, denim.map), bump: texture(GFX, denim.bump, { color: false, repeat: [150, 150] }) },
      sock: { map: texture(GFX, sock.map), bump: texture(GFX, sock.bump, { color: false, repeat: [160, 160] }) },
      leather: { map: texture(GFX, hide.map), bump: texture(GFX, hide.bump, { color: false, repeat: [24, 24] }) },
      rib: { map: texture(GFX, ribs.map), tile: texture(GFX, ribs.tile, { repeat: [1, 1] }) },
      fabric: {
        twill: texture(GFX, fabrics.twill, { color: false, repeat: [150, 150] }), plain: texture(GFX, fabrics.plain, { color: false, repeat: [220, 220] }),
        coarse: texture(GFX, fabrics.coarse, { color: false, repeat: [90, 90] }), knit: texture(GFX, fabrics.knit, { color: false, repeat: [60, 60] }),
        felt: texture(GFX, fabrics.felt, { color: false, repeat: [120, 120] }),
      },
      wool: { map: texture(GFX, suit) },
      shoe: texture(GFX, shoes.upper),
      sole: texture(GFX, shoes.sole),
      pores: texture(GFX, poreTile(), { color: false, repeat: [44, 44] }),
    };
    byGFX.set('garments', g);
    return g;
  })();
  // The skin's detail is the same whatever his colouring: one for each size of map.
  const detail = byGFX.get(`detail|${size}`) ?? texture(GFX, canvasOf(skinDetailPixels(size), size), { color: false });
  byGFX.set(`detail|${size}`, detail);
  const made = {
    ...garments,
    skin: { map: texture(GFX, canvasOf(skinPixels(size, skin, groom), size)), bump: garments.pores, detail },
    eye: texture(GFX, eyeMap(iris)),
  };
  byGFX.set(key, made);
  return made;
}
