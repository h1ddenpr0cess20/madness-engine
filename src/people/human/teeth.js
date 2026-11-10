import { Part, smooth } from './kit.js';
import { FACE } from './skeleton.js';

/**
 * The teeth and gums, built tooth by tooth: in each jaw two incisors, a
 * canine, two premolars and two molars a side, along an arch fitted to the
 * mouth (where MakeHuman's own block teeth were). Each crown is a rounded
 * section swept up from the gum to its edge, shaped for what it is: the
 * incisors spade-like and thin at the edge, the canines coming to a point,
 * the premolars and molars broad and capped with cusps. The gums wrap the
 * teeth's necks, dipping between them as gums do. The upper teeth follow
 * the head, the lower the jaw.
 */

const G = (t) => Math.exp(-t * t);

// The arch's outer (lip-side) line, left half: [x, z], front to back, for the upper teeth: about
// 34 mm across the canines and 28 mm deep to the first molars, as an average adult arch is.
const ARCH = [[0, 0.1435], [0.01, 0.1425], [0.018, 0.138], [0.025, 0.1305], [0.0292, 0.1215], [0.0312, 0.1105], [0.0324, 0.0985], [0.033, 0.088]];

// Each tooth, front to back: its kind, and its crown's width along the arch, depth (lip to tongue)
// and height, in millimetres: the average adult crowns of the dental anatomy tables (Wheeler's),
// taken a touch smaller (0.97) to suit his head.
const MM = 0.001 * 0.97;
const table = (rows) => rows.map(([kind, w, d, h]) => [kind, w * MM, d * MM, h * MM]);
const UPPER = table([['incisor', 8.5, 7, 10.5], ['incisor', 6.5, 6, 9], ['canine', 7.5, 8, 10], ['premolar', 7, 9, 8.5], ['premolar', 6.5, 9, 8.5], ['molar', 10, 11, 7.5], ['molar', 9, 11, 7]]);
const LOWER = table([['incisor', 5, 6, 9], ['incisor', 5.5, 6.5, 9.5], ['canine', 7, 7.5, 11], ['premolar', 7, 7.5, 8.5], ['premolar', 7, 8, 8], ['molar', 11, 10.5, 7.5], ['molar', 10.5, 10, 7]]);

/** The arch line scaled for a jaw: arc-length samples of [x, z, tangent, outward normal]. */
function archOf({ shrink, back }) {
  const pts = ARCH.map(([x, z]) => [x * shrink, z - back]);
  const out = [[pts[0][0], pts[0][1], 0]];
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    out.push([pts[i][0], pts[i][1], s]);
  }
  const at = (d) => {
    let i = 1;
    while (i < out.length - 1 && out[i][2] < d) i++;
    const p = out[i - 1], q = out[i], t = (d - p[2]) / (q[2] - p[2]);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  /** The point `d` along the arch from the middle, on side `m` (1 left, −1 right): position, tangent (back along it) and outward normal (to the lips and cheeks). */
  return (d, m) => {
    const [x, z] = at(d);
    // The tangent across a short span (the arch mirrored through the middle, so it runs square across there).
    const e = 0.004, a0 = d - e < 0 ? (([u, v]) => [-u, v])(at(e - d)) : at(d - e), a1 = at(d + e);
    const l = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) || 1, tx = (a1[0] - a0[0]) / l, tz = (a1[1] - a0[1]) / l;
    return { p: [m * x, 0, z], T: [m * tx, 0, tz], N: [m * -tz, 0, tx] };
  };
}

/**
 * A crown's half-width (along the arch) and half-depth (lip to tongue) at
 * height fraction `h` (below 0 inside the gum, 1 its edge or tip), how far
 * its middle sits back from the lip-side face, and how much its top lifts
 * there (the cusps). Each closes over its top smoothly: an incisor to a
 * straight thin edge, a canine to a point, the back teeth to a broad cap.
 */
function section(kind, w, d, h, u = 0, v = 0) {
  const H = Math.max(0, h);
  // How far the top has closed in (1 below the cap, 0 at the very top).
  const capFrom = kind === 'incisor' ? 0.82 : kind === 'canine' ? 0.6 : 0.78;
  const c = h <= capFrom ? 1 : Math.sqrt(Math.max(0, 1 - ((h - capFrom) / (1 - capFrom)) ** 2));
  // A little narrower at the neck than across the crown.
  const neck = 0.82 + 0.18 * Math.sin(Math.min(1, H / 0.55) * Math.PI * 0.5);
  switch (kind) {
    case 'incisor': {
      const b = (d / 2) * (1 - 0.68 * H ** 1.2);
      // Its width kept right to the top, so the edge runs straight with only its corners rounded.
      return { a: (w / 2) * neck * Math.max(0.82, Math.pow(c, 0.18)), b: b * Math.pow(c, 0.7), back: (d / 2) - b, lift: 0 };
    }
    case 'canine': {
      const b = (d / 2) * (1 - 0.35 * H);
      return { a: (w / 2) * neck * c, b: b * c, back: (d / 2) - b, lift: 0 };
    }
    case 'premolar':
      return { a: (w / 2) * neck * Math.pow(c, 0.45), b: (d / 2) * neck * Math.pow(c, 0.45), back: 0, lift: 0.08 * (G((v - 0.4) / 0.4) + 0.8 * G((v + 0.4) / 0.4)) * (1 - c) };
    default:
      return { a: (w / 2) * neck * Math.pow(c, 0.4), b: (d / 2) * neck * Math.pow(c, 0.4), back: 0, lift: 0.06 * (G((u - 0.45) / 0.4) + G((u + 0.45) / 0.4)) * (G((v - 0.45) / 0.4) + G((v + 0.45) / 0.4)) * (1 - c) };
  }
}


/** One tooth into `part`: its middle `c` on the arch, with frame T (along) and N (out); `up` +1 for a lower tooth (its crown rising), −1 for an upper. */
function tooth(part, { kind, w, d, height }, c, T, N, up, edgeY, weights, shade, [UP, AROUND]) {
  // No two teeth quite the same shade; the canines the yellowest, as they are.
  const hue = 0.955 + 0.045 * Math.sin(c[0] * 4100 + c[2] * 2300 + up);
  const warm = kind === 'canine' ? [1, 0.975, 0.9] : [1, 0.99, 0.95];
  part.grid(UP, AROUND, (i, j) => {
    const h = -0.22 + (1.22 * i) / UP;
    const th = (j / AROUND) * Math.PI * 2;
    const cs = Math.cos(th), sn = Math.sin(th);
    // A rounded rectangle, squarer for the back teeth.
    const e = kind === 'molar' || kind === 'premolar' ? 0.6 : 0.85;
    const u = Math.sign(cs) * Math.abs(cs) ** e, v = Math.sign(sn) * Math.abs(sn) ** e;
    const s = section(kind, w, d, h, u, v);
    // Lip-side face kept where it is, the thinning taken off the tongue side.
    const x = u * s.a, z = v * s.b + s.back;
    const y = edgeY - up * height * (1 - Math.min(1, h)) + up * s.lift * height;
    const p = [c[0] + T[0] * x + N[0] * z, y, c[2] + T[2] * x + N[2] * z];
    // Enamel is thin at the neck, where the yellow dentine shows through it, and thick and whiter over
    // the crown; an incisor's edge is enamel alone, a little grey-blue and clear. The fissures between
    // the back teeth's cusps are stained darker.
    const k = shade(p) * hue;
    const neck = smooth(0.45, 0, h), edge = (kind === 'incisor' ? 1 : kind === 'canine' ? 0.5 : 0) * smooth(0.82, 0.97, h) * smooth(1.06, 0.99, h);
    const pit = kind === 'molar' || kind === 'premolar' ? smooth(0.9, 1.05, h) * (1 - Math.min(1, s.lift / 0.05)) * 0.3 : 0;
    const tint = [
      k * (1 - 0.1 * neck - 0.1 * edge - pit) * warm[0],
      k * (1 - 0.16 * neck - 0.07 * edge - pit) * warm[1],
      k * (1 - 0.3 * neck - 0.02 * edge - pit * 1.2) * warm[2],
    ];
    return { p, w: weights, tint, uv: [0, 0] };
  }, { flip: up < 0 });
}

/** The gum of one jaw along the whole arch: a band over the teeth's necks from the lip side to the tongue side, arching over each tooth and down between them. */
function gum(part, arch, teeth, up, lineY, weights, shade, [STEPS, ACROSS]) {
  const centres = [];
  let at = 0;
  for (const t of teeth) { centres.push([at + t.w / 2, t]); at += t.w; }
  // The teeth's depth and height, eased from one tooth's middle to the next.
  const eased = (d, key) => {
    if (d <= centres[0][0]) return centres[0][1][key];
    for (let i = 1; i < centres.length; i++) {
      if (d <= centres[i][0]) {
        const f = smooth(centres[i - 1][0], centres[i][0], d);
        return centres[i - 1][1][key] * (1 - f) + centres[i][1][key] * f;
      }
    }
    return centres[centres.length - 1][1][key];
  };
  part.grid(STEPS, ACROSS, (i, j) => {
    const sd = -at + (2 * at * i) / STEPS;
    const m = sd < 0 ? -1 : 1, d = Math.abs(sd);
    const depth = eased(d, 'd'), height = eased(d, 'height');
    const { p, N } = arch(d, m, depth);
    let near = centres[0];
    for (const c of centres) if (Math.abs(c[0] - d) < Math.abs(near[0] - d)) near = c;
    // 0 over a tooth's middle, 1 where two meet: there the gum comes down between them.
    const off = Math.min(1, Math.abs(near[0] - d) / (near[1].w / 2));
    const margin = lineY - up * height * (0.8 - (up > 0 ? 0.06 : 0.12) * off ** 2.5);
    // Across: the lip side (j 0) up over the ridge and down the tongue side (j ACROSS), a little proud of the teeth.
    const a = (j / ACROSS) * Math.PI;
    const n = Math.cos(a) * (depth / 2 + 0.0012);
    // Closed off at the back of the arch.
    const end = smooth(at - 0.004, at, d);
    const y = margin - up * 0.0062 * Math.sin(a) ** 0.6 * (1 - 0.6 * end);
    const q = [p[0] + N[0] * n * (1 - end * 0.9), y, p[2] + N[2] * n * (1 - end * 0.9)];
    // Paler and pinker along the margin where it is tight to the teeth, redder and darker away up the jaw; stippled faintly.
    const g = (0.8 + 0.2 * Math.sin(a)) * shade(q) * (0.96 + 0.04 * Math.sin(q[0] * 5200) * Math.sin(q[2] * 4700 + q[1] * 3900));
    const tight = Math.sin(a) ** 2;
    return { p: q, w: weights, tint: [g * (0.9 + 0.1 * tight), g * (0.78 + 0.22 * tight), g * (0.8 + 0.2 * tight)], uv: [0, 0] };
  }, { flip: up > 0 });
}

/** The upper and lower teeth (in the 'teeth' material) and gums ('gums'), darker toward the back of the mouth, finer at `detail` 0.8 and up. */
export function buildTeeth(detail = 1) {
  // Rows up each crown and points round it; steps along the gums and across them.
  const fine = detail >= 0.8, crown = fine ? [12, 20] : [7, 12], band = fine ? [110, 9] : [56, 6];
  const mouth = FACE.mouth;
  const shade = (p) => 0.5 + 0.5 * smooth(mouth[2] - 0.06, mouth[2] - 0.022, p[2]);
  const teeth = new Part('teeth', 'teeth'), gums = new Part('gums', 'gums');
  const jaws = [
    { list: UPPER, up: -1, edge: mouth[1] - 0.0034, arch: archOf({ shrink: 1, back: -0.0015 }), w: { head: 1 }, inset: 0.0034 },
    { list: LOWER, up: 1, edge: mouth[1] - 0.0014, arch: archOf({ shrink: 0.93, back: 0.0013 }), w: { jaw: 1 }, inset: 0.003 },
  ];
  for (const { list, up, edge, arch, w, inset } of jaws) {
    const specs = list.map(([kind, width, depth, height]) => ({ kind, w: width, d: depth, height }));
    let at = 0;
    for (const t of specs) {
      const mid = at + t.w / 2;
      at += t.w;
      for (const m of [1, -1]) {
        const { p, T, N } = arch(mid, m);
        // Set in from the arch's outer line by the tooth's own half-depth; the back teeth a touch higher (the bite curves).
        const c = [p[0] - N[0] * (t.d / 2 + inset - 0.0026), 0, p[2] - N[2] * (t.d / 2 + inset - 0.0026)];
        const curve = 0.0016 * smooth(0.014, 0.045, mid);
        // Each a hair narrower than its room: they meet at their widest, with the gaps between them closing toward the edge.
        tooth(teeth, { ...t, w: t.w * 0.985 }, c, T, N, up, edge - up * curve, w, shade, crown);
      }
    }
    gum(gums, (d, m, depth) => {
      const r = arch(d, m), k = depth / 2 + inset - 0.0026;
      return { ...r, p: [r.p[0] - r.N[0] * k, 0, r.p[2] - r.N[2] * k] };
    }, specs, up, edge, w, shade, band);
  }
  return [teeth, gums];
}
