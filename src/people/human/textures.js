import { bodyLevel } from './basemesh.js';
import { zoneOf } from './body.js';
import { clamp, cross, fbm, noise3, smooth } from './kit.js';
import { armDistance, EYE, FACE, FINGERS, JOINTS } from './skeleton.js';
import { hairPaint } from './hair.js';
import { HEM, jeansHeight, legAngle, neckline, SHIRT_Z, SLEEVE_RANGE } from './clothes.js';

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
  const nails = [];
  for (const m of [1, -1]) {
    for (const f of Object.values(FINGERS)) {
      const j = f.joints.map((p) => [p[0] * m, p[1], p[2]]);
      const dir = [j[3][0] - j[2][0], j[3][1] - j[2][1], j[3][2] - j[2][2]];
      const l = Math.hypot(...dir);
      const d = dir.map((v) => v / l);
      const curl = m > 0 ? f.curl : [f.curl[0], -f.curl[1], -f.curl[2]];
      const toward = cross(curl, d);
      nails.push({ tip: j[3], base: j[2], dir: d, back: toward.map((v) => -v), len: l });
    }
  }
  return { E, M, nose, nails, R: EYE.radius };
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
  const lipC = [tone[0] * 0.9, tone[1] * 0.72, tone[2] * 0.72];
  const hair = [72, 56, 46];
  const shadow = [tone[0] * 0.8, tone[1] * 0.82, tone[2] * 0.88];
  const pale = [Math.min(255, tone[0] * 1.08), Math.min(255, tone[1] * 1.02), Math.min(255, tone[2] * 1.0)];
  const { E, M, nose, R } = L;
  return (p, n, zone) => {
    const x = p[0], y = p[1], z = p[2], s = Math.abs(x);
    let c = base;
    // Mottling: broad and fine.
    const mott = fbm(x * 9, y * 9, z * 9, 3) * 0.6 + noise3(x * 70, y * 70, z * 70) * 0.25;
    c = mixc(c, red, 0.05 + 0.08 * mott);
    c = c.map((v) => v * (1 + 0.035 * fbm(x * 30 + 7, y * 30, z * 30, 2)));
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
      c = mixc(c, shadow, clamp(beard * 0.55 + scalp * 0.22) * dots);
      // Where hair grows, its colour, streaked as the hair is.
      if (grown) {
        const { cover, shade } = hairPaint(groom.style, groom.beard, p, n);
        // Stippled, as short hair is, and thinning toward the hairline at the neck, as a taper does.
        const stipple = 0.8 + 0.2 * noise3(x * 4000, y * 4000, z * 4000);
        const taper = groom.style ? 0.65 + 0.35 * smooth(1.615, 1.69, y) : 1;
        if (cover > 0) c = mixc(c, grown.map((v) => v * shade * (0.9 + 0.3 * noise3(x * 1800, y * 240, z * 1800))), clamp(cover * taper * stipple));
      }
      // The lips.
      const lc = FACE.lipCorner[0] + 0.001;
      const t = clamp(s / lc);
      const slit = M[1] - (M[1] - FACE.lipCorner[1]) * t * t;
      // The upper lip's border with its Cupid's bow; the fuller lower lip.
      const up = slit + (0.0102 * Math.sqrt(1 - t * t) - 0.0016 * G(s / 0.0035) + 0.0008 * G((s - 0.006) / 0.003)) * smooth(1, 0.85, t) + 0.0006;
      const low = slit - 0.0128 * Math.pow(1 - t * t, 0.55);
      const lipFront = smooth(M[2] - 0.035, M[2] - 0.022, z);
      const inLips = smooth(lc, lc - 0.004, s) * smooth(low - 0.0009, low + 0.0009, y) * smooth(up + 0.0009, up - 0.0009, y) * lipFront;
      c = mixc(c, lipC, inLips * (0.45 + 0.1 * noise3(x * 300, y * 2000, z * 300)));
      // Inside the mouth: dark, wet.
      const inside = smooth(M[2] - 0.006, M[2] - 0.014, z) * smooth(M[2] - 0.07, M[2] - 0.06, z) * smooth(FACE.lipCorner[0] - 0.001, FACE.lipCorner[0] - 0.006, s) * G((y - M[1]) / 0.02) * smooth(0.5, 0.0, n[2]);
      c = mixc(c, [70, 26, 28], inside);
      // The brows: a band of short hairs over each eye, arched, thinning toward the tail.
      const bx = (s - 0.008) / 0.05;
      if (bx > -0.05 && bx < 1.05 && n[2] > 0) {
        const mid = E[1] + 0.0205 + 0.006 * Math.sin(clamp(bx) * Math.PI * 0.85) - 0.004 * bx;
        const half = 0.0036 * (1 - 0.5 * bx) + 0.0008;
        const across = (y - mid) / half;
        const ends = smooth(-0.05, 0.08, bx) * smooth(1.05, 0.85, bx);
        const hairs = 0.5 + 0.5 * noise3(s * 700 + y * 500, y * 250, z * 300);
        const b = smooth(1, 0.2, Math.abs(across)) * ends * (0.4 + 0.6 * hairs) * smooth(E[2] - 0.03, E[2] - 0.01, z);
        // (Under the brows' own hairs, when he has them: in his hair's colour, softer.)
        c = mixc(c, grown ? grown.map((v) => v * 0.7) : hair, clamp(b) * (grown ? 0.4 : 0.55));
      }
      // The lash line round each eye: the lids' rims, darkest along the upper.
      const e = [E[0] * (x >= 0 ? 1 : -1), E[1], E[2]];
      const de = Math.hypot(x - e[0], y - e[1], z - e[2]);
      const rim = smooth(R + 0.0019, R + 0.0006, de) * smooth(e[2] - 0.006, e[2] + 0.002, z);
      c = mixc(c, y > e[1] ? [70, 50, 42] : mixc(base, red, 0.3), clamp(rim * (y > e[1] ? 0.4 : 0.2)));
      // The upper lid's crease, a little shadowed; under the eye, a little blue.
      c = mixc(c, [base[0] * 0.82, base[1] * 0.78, base[2] * 0.8], 0.1 * G((de - R - 0.007) / 0.002) * smooth(e[1] + 0.002, e[1] + 0.007, y) * front);
      c = mixc(c, [base[0] * 0.86, base[1] * 0.84, base[2] * 0.88], 0.1 * G((de - R - 0.008) / 0.004) * smooth(e[1] - 0.003, e[1] - 0.008, y) * front);
    } else if (zone === 'hand') {
      const m = x >= 0 ? 1 : -1;
      // Paler palms; flushed knuckles and fingertips.
      const palm = smooth(0.1, 0.6, -n[0] * m);
      c = mixc(c, pale, palm * 0.6);
      c = mixc(c, red, 0.15 * (1 - palm) * smooth(0.04, 0.0, Math.abs(y - (JOINTS.wrist[1] - 0.1))));
      for (const nail of L.nails) {
        if (nail.tip[0] * x <= 0) continue;
        const rel = [x - nail.tip[0], y - nail.tip[1], z - nail.tip[2]];
        const along = -(rel[0] * nail.dir[0] + rel[1] * nail.dir[1] + rel[2] * nail.dir[2]);
        if (along < -0.002 || along > 0.016) continue;
        const facing = n[0] * nail.back[0] + n[1] * nail.back[1] + n[2] * nail.back[2];
        const side = Math.hypot(rel[0] + nail.dir[0] * along, rel[1] + nail.dir[1] * along, rel[2] + nail.dir[2] * along);
        const plate = smooth(0.45, 0.75, facing) * smooth(0.013, 0.01, along) * smooth(0.0, 0.0015, along);
        if (plate <= 0) continue;
        const lunula = G((along - 0.0115) / 0.0015) * 0.5;
        const free = smooth(0.0022, 0.0008, along);
        c = mixc(c, mixc([238, 196, 186], [248, 236, 228], Math.max(lunula, free)), plate * 0.85 * (side < 0.02 ? 1 : 0));
        c = mixc(c, [base[0] * 0.75, base[1] * 0.6, base[2] * 0.6], 0.5 * G((along - 0.0128) / 0.0007) * smooth(0.45, 0.75, facing));
      }
    } else if (zone === 'trunk') {
      // The nipples.
      for (const m of [1, -1]) {
        const d = Math.hypot(x - 0.098 * m, (y - 1.287) * 1.1);
        if (d < 0.03 && n[2] > 0.3) c = mixc(c, [tone[0] * 0.72, tone[1] * 0.52, tone[2] * 0.52], 0.75 * smooth(0.0125, 0.0095, d) + 0.25 * smooth(0.005, 0.003, d));
      }
      // The armpits, a little darker.
      c = mixc(c, shadow, 0.2 * G((s - 0.17) / 0.03) * G((y - 1.34) / 0.04));
    } else if (zone === 'arm' || zone === 'leg') {
      // Elbows and knees, a little rough and red.
      const m = x >= 0 ? 1 : -1;
      if (zone === 'arm') c = mixc(c, red, 0.3 * G(Math.hypot(x - JOINTS.elbow[0] * m, y - JOINTS.elbow[1]) / 0.025) * smooth(0, -0.6, n[2]));
      else c = mixc(c, red, 0.25 * G(Math.hypot(x - JOINTS.knee[0] * m, y - JOINTS.knee[1] - 0.01) / 0.035) * smooth(0, 0.6, n[2]));
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

/** Pores and fine lines, as a repeating tile for the skin's bump. */
function poreTile() {
  const per = (u, v, s) => {
    const a = u * Math.PI * 2, b = v * Math.PI * 2;
    return noise3(Math.cos(a) * s, Math.sin(a) * s, Math.cos(b) * s + Math.sin(b) * s * 1.7);
  };
  return paint(256, 256, (u, v) => {
    const pores = Math.max(0, per(u, v, 34)) ** 2;
    const h = 150 - 90 * pores + 18 * per(u, v, 9) + 10 * per(u, v + 0.3, 70);
    return [h, h, h];
  });
}

/** The eye: white, veined faintly toward the edges, the iris's fibres round a black pupil. */
function eyeMap(iris) {
  const ic = hex(iris), white = hex('#e9e3dc'), pinkish = hex('#d9b2a8');
  return paint(512, 512, (u, v) => {
    const dx = u - 0.5, dy = v - 0.5;
    const r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    // The eye's UVs put the angle from its front at radius √(a/π)/2.
    const a = Math.PI * (2 * r) ** 2;
    if (a < 0.13) return [8, 6, 6];
    if (a < 0.38) {
      const t = (a - 0.13) / 0.25;
      const fibres = 0.5 + 0.5 * Math.sin(ang * 70 + noise3(Math.cos(ang) * 4, Math.sin(ang) * 4, t * 3) * 4);
      let c = mixc(ic.map((x) => x * 0.55), ic.map((x) => Math.min(255, x * 1.35)), 0.35 + 0.4 * fibres * (1 - t));
      // A golden ring round the pupil, and the dark limbal ring at the edge.
      c = mixc(c, hex('#b08a3a'), 0.35 * G((t - 0.12) / 0.1));
      c = mixc(c, [20, 16, 14], smooth(0.8, 1, t) * 0.85);
      return c;
    }
    let c = mixc(white, pinkish, smooth(0.8, 1.6, a) * 0.6);
    c = mixc(c, hex('#c86060'), 0.25 * smooth(1.0, 1.5, a) * Math.max(0, Math.sin(ang * 9 + noise3(ang, a * 6, 7) * 3)) ** 8);
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
export function humanTextures(GFX, { skin = '#c08a6c', iris = '#5a4632', size = 2048, hair: hairColour = null, style = null, beard = null } = {}) {
  if (typeof document === 'undefined') return null;
  let byGFX = cache.get(GFX);
  if (!byGFX) cache.set(GFX, (byGFX = new Map()));
  const groom = style || beard ? { hairColour, style, beard } : {};
  const key = `${skin}|${iris}|${size}|${style}|${beard}|${style || beard ? hairColour : ''}`;
  if (byGFX.has(key)) return byGFX.get(key);
  const garments = byGFX.get('garments') ?? (() => {
    const shirt = shirtMaps(), denim = denimMaps(), shoes = shoeMaps();
    const g = {
      shirt: { map: texture(GFX, shirt.map), bump: texture(GFX, shirt.bump, { color: false, repeat: [140, 140] }) },
      denim: { map: texture(GFX, denim.map), bump: texture(GFX, denim.bump, { color: false, repeat: [150, 150] }) },
      shoe: texture(GFX, shoes.upper),
      sole: texture(GFX, shoes.sole),
      pores: texture(GFX, poreTile(), { color: false, repeat: [24, 24] }),
    };
    byGFX.set('garments', g);
    return g;
  })();
  const made = {
    ...garments,
    skin: { map: texture(GFX, canvasOf(skinPixels(size, skin, groom), size)), bump: garments.pores },
    eye: texture(GFX, eyeMap(iris)),
  };
  byGFX.set(key, made);
  return made;
}
