import { fbm, noise, rgb } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';
import { letters } from '../models/lettering.js';

/**
 * (From Bodega.)
 *
 * A corner store's stock, one sculpt for everything the shop sells: the
 * fruit and vegetables (a pile of Gala apples, a hand of bananas, a truss
 * of tomatoes, a head of lettuce, russet potatoes, navel oranges, a bunch of
 * carrots, yellow onions, bell peppers, green grapes), the cold case (a gable
 * milk carton, a yogurt tub, a wrapped block of cheddar, butter, an open
 * carton of brown eggs, film-wrapped chicken and beef trays, a pack of deli
 * turkey, orange juice, bacon, sour cream), the bakery (a sliced loaf in its bag, twist-tied), the pantry
 * (rice, spaghetti in a box with a window, cereal, black beans in a can,
 * ground coffee, flour, sugar, oats, peanut butter), the snack aisle (a bag
 * of chips, a box of cookies, a candy bar), the drinks (a 2 L cola, a 1 L water) and the freezer (a
 * frozen pizza, a tub of vanilla ice cream), and the two things that bring
 * them in and carry them out: a shipping carton and a shopping basket.
 *
 * Each stands on y = 0 facing +z, sized a little larger than life against a
 * person (a 2 L bottle is nearly half a tile tall) so it reads from across a
 * shop. `GROCERIES` is the stock by name.
 */

const ONE = [['root', null, [0, 0, 0]]];

// ——————————————————————————————————————————————— materials

const MATERIALS = {
  plastic: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  pet: { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 },
  cap: { roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.4 },
  paper: { roughness: 0.78, sheen: 0.12, sheenColor: '#ffffff' },
  card: { roughness: 0.9 },
  foil: { roughness: 0.26, metalness: 0.9 },
  tin: { roughness: 0.34, metalness: 0.85 },
  film: { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, opacity: 0.2 },
  foam: { roughness: 0.95 },
  fresh: { roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.45 },
  skin: { roughness: 0.62, sheen: 0.25, sheenColor: '#e8d8b8', sheenRoughness: 0.7 },
  leaf: { roughness: 0.62, sheen: 0.35, sheenColor: '#d6f0a8', sheenRoughness: 0.6 },
  stalk: { roughness: 0.85 },
  meat: { roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 },
};

// ——————————————————————————————————————————————— tools

/** The radius of a profile (a list of [y, r], bottom to top) at y: smooth through its points. */
function profileOf(pts) {
  const n = pts.length;
  return (y) => {
    if (y <= pts[0][0]) return pts[0][1];
    if (y >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0;
    while (pts[i + 1][0] < y) i++;
    const [y1, r1] = pts[i], [y2, r2] = pts[i + 1];
    const h = y2 - y1, t = (y - y1) / h, t2 = t * t, t3 = t2 * t;
    const m1 = i > 0 ? (r2 - pts[i - 1][1]) / (y2 - pts[i - 1][0]) : (r2 - r1) / h;
    const m2 = i < n - 2 ? (pts[i + 2][1] - r1) / (pts[i + 2][0] - y1) : (r2 - r1) / h;
    return (2 * t3 - 3 * t2 + 1) * r1 + (t3 - 2 * t2 + t) * h * m1 + (-2 * t3 + 3 * t2) * r2 + (t3 - t2) * h * m2;
  };
}

/**
 * A solid of revolution about the vertical through `at` ([x, z]): the
 * outline `pts` ([y, r], bottom to top) turned round it, flat top and
 * bottom. A bottle, a can, a tub, a cap.
 */
function lathe(s, [cx, cz], pts, o = {}) {
  const r = profileOf(pts), y0 = pts[0][0], y1 = pts[pts.length - 1][0];
  const R = Math.max(...pts.map((q) => q[1])) + 0.004, e = 0.002;
  return s.shape((p) => {
    const rad = Math.hypot(p[0] - cx, p[2] - cz);
    const y = Math.min(Math.max(p[1], y0), y1);
    const slope = (r(y + e) - r(y - e)) / (2 * e);
    const side = (rad - r(y)) / Math.sqrt(1 + slope * slope);
    const cap = Math.max(y0 - p[1], p[1] - y1);
    return side < 0 && cap < 0 ? Math.max(side, cap) : Math.hypot(Math.max(side, 0), Math.max(cap, 0));
  }, [[cx - R, y0, cz - R], [cx + R, y1, cz + R]], { k: 0, ...o });
}

/** A convex solid from its planes ([nx, ny, nz, offset], unit normals, inside is where n·p < offset), with its edges rounded by `round`. */
function hull(s, planes, bounds, { round = 0.003, ...o } = {}) {
  return s.shape((p) => {
    let d = -Infinity;
    for (const [nx, ny, nz, off] of planes) d = Math.max(d, nx * p[0] + ny * p[1] + nz * p[2] - off + round);
    return d - round;
  }, bounds, { k: 0, ...o });
}

/** A color, as linear rgb. */
const C = rgb;
const hsv = (p, base, vary = 0.08, freq = 60) => base.map((v) => v * (1 + (noise(p[0] * freq, p[1] * freq, p[2] * freq) - 0.5) * 2 * vary));

/** Printed on a wrapper: `fn(p, n)` as it is, with the paper's fine grain. */
const printed = (fn, grain = 0.03) => (p, n) => hsv(p, fn(p, n), grain, 140);

/** The angle round the vertical through `c`, from the front (+z), a turn being 2π. */
const around = (p, c) => Math.atan2(p[0] - c[0], p[2] - c[2]);

const between = (v, a, b) => v >= a && v <= b;

/**
 * A strip of lettering on a part of its own, meshed finely: `patch` lays the
 * bit of surface the words go on (a label's color), `words` writes them.
 * Words are painted by distance from a flat plane, so they stand a little
 * proud of round things: `depth` reaches from just under the surface.
 */
function words(s, text, { at, size, color = '#ffffff', width = size * 0.13, spacing = 0.2, aspect = 0.7, depth = 0.02, right = [1, 0, 0], up = [0, 1, 0], slant = 0 }) {
  return letters(s, text, { at, right, up, size, width, color, depth, spacing, aspect, slant });
}

/** A fruit or vegetable's color: `fn` is read in its own frame, from `c`. */
const fruit = (c, fn) => (p, n) => fn([p[0] - c[0], p[1] - c[1], p[2] - c[2]], n);

// ——————————————————————————————————————————————— the drinks

const COLA = '#c8102e';
/** A 2 L cola: dark in its clear bottle, a red wrapper with a white wave and COLA across it, a red cap. */
export const cola = {
  name: 'cola',
  cell: 0.0052,
  budget: 30000,
  refine: 0.4,
  cells: { text: 0.0022, cap: 0.003 },
  bones: ONE,
  materials: { pet: MATERIALS.pet, label: MATERIALS.paper, cap: MATERIALS.cap, text: MATERIALS.paper },
  sculpt(s) {
    const liquid = (p) => {
      const y = p[1];
      const a = around(p, [0, 0]);
      if (between(y, 0.105, 0.285)) {
        const wave = 0.15 + 0.022 * Math.sin(a * 2 + 0.6);
        if (Math.abs(y - wave) < 0.0085) return C('#fbf6ec');
        if (y < 0.113 || y > 0.277) return C('#fbf6ec');
        return hsv(p, C(COLA), 0.03, 120);
      }
      return hsv(p, C('#3b190f'), 0.05, 90);
    };
    lathe(s, [0, 0], [[0, 0.05], [0.008, 0.072], [0.02, 0.083], [0.045, 0.0885], [0.285, 0.0885], [0.315, 0.084], [0.355, 0.069], [0.392, 0.043], [0.41, 0.0225], [0.418, 0.017], [0.43, 0.0165]], { color: liquid, mat: 'pet' });
    // The neck's support ring and the cap's skirt.
    s.part('cap', () => {
      lathe(s, [0, 0], [[0.43, 0.0165], [0.432, 0.0215], [0.438, 0.0215], [0.44, 0.0165], [0.452, 0.0165]], { color: '#cfe0e0', mat: 'pet' });
      lathe(s, [0, 0], [[0.428, 0.0226], [0.43, 0.0234], [0.466, 0.0234], [0.4685, 0.0215]], { color: hsv([0, 0, 0], C('#d11f2a'), 0), mat: 'cap' });
      // Grip: ribs up the cap.
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        s.limb([Math.sin(a) * 0.0236, 0.433, Math.cos(a) * 0.0236], [Math.sin(a) * 0.0236, 0.463, Math.cos(a) * 0.0236], 0.0017, 0.0017, { color: '#b9161f', mat: 'cap', k: 0 });
      }
    });
    // COLA, stood proud on the wrapper.
    s.part('text', () => {
      lathe(s, [0, 0], [[0.178, 0.0899], [0.182, 0.0899], [0.238, 0.0899], [0.242, 0.0899]], { color: COLA, mat: 'text' });
      s.box([0, 0.21, 0.09], [0.064, 0.04, 0.05], 0, { op: 'inter', k: 0 });
    });
    words(s, 'COLA', { at: [0, 0.2, 0.07], size: 0.033, aspect: 0.74, spacing: 0.18, width: 0.0043, color: '#ffffff', depth: 0.03 });
  },
};

const WATER = '#1c6fb5';

/** A 1 L water: a clear bottle with a blue wrapper (snow peaks and a drop on it) and a blue cap. */
export const water = {
  name: 'water',
  cell: 0.0048,
  budget: 26000,
  refine: 0.4,
  cells: { text: 0.0022, cap: 0.003 },
  bones: ONE,
  materials: { pet: { ...MATERIALS.pet, roughness: 0.08 }, label: MATERIALS.paper, cap: MATERIALS.cap, text: MATERIALS.paper },
  sculpt(s) {
    const body = (p) => {
      const y = p[1];
      if (between(y, 0.085, 0.2)) {
        const a = around(p, [0, 0]);
        const ridge = 0.155 + 0.012 * Math.sin(a * 3.2 + 1.2);
        const peak = y - ridge;
        if (peak > -0.004 && peak < 0.045 * (0.6 + 0.4 * Math.sin(a * 1.6)) - 0.004) return C('#f4f9ff');
        if (y < 0.092 || y > 0.193) return C('#e6f3fb');
        return hsv(p, C(WATER), 0.03, 120);
      }
      return hsv(p, C('#c8e6f4'), 0.02, 100);
    };
    lathe(s, [0, 0], [[0, 0.036], [0.006, 0.05], [0.016, 0.0575], [0.03, 0.06], [0.205, 0.06], [0.235, 0.0545], [0.272, 0.04], [0.296, 0.022], [0.306, 0.0165], [0.32, 0.0165]], { color: body, mat: 'pet' });
    s.part('cap', () => {
      lathe(s, [0, 0], [[0.32, 0.0165], [0.322, 0.0215], [0.328, 0.0215], [0.33, 0.0165], [0.34, 0.0165]], { color: '#d8ecf2', mat: 'pet' });
      lathe(s, [0, 0], [[0.318, 0.0226], [0.32, 0.0234], [0.352, 0.0234], [0.3545, 0.0215]], { color: '#1a4f9c', mat: 'cap' });
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        s.limb([Math.sin(a) * 0.0236, 0.323, Math.cos(a) * 0.0236], [Math.sin(a) * 0.0236, 0.349, Math.cos(a) * 0.0236], 0.0016, 0.0016, { color: '#153f80', mat: 'cap', k: 0 });
      }
    });
    s.part('text', () => {
      lathe(s, [0, 0], [[0.12, 0.0612], [0.124, 0.0612], [0.17, 0.0612], [0.174, 0.0612]], { color: WATER, mat: 'text' });
      s.box([0, 0.147, 0.061], [0.06, 0.03, 0.05], 0, { op: 'inter', k: 0 });
    });
    words(s, 'WATER', { at: [0, 0.134, 0.045], size: 0.025, aspect: 0.74, spacing: 0.16, width: 0.0033, color: '#ffffff', depth: 0.03 });
  },
};

// ——————————————————————————————————————————————— the pantry

/** A can of black beans: ribbed steel, a paper wrapper with a bowl of beans on it, a ring pull on the lid. */
export const beans = {
  name: 'beans',
  cell: 0.0034,
  budget: 26000,
  refine: 0.4,
  cells: { text: 0.002, tab: 0.002 },
  bones: ONE,
  materials: { tin: MATERIALS.tin, label: MATERIALS.paper, text: MATERIALS.paper },
  sculpt(s) {
    const R = 0.051, H = 0.14;
    const wrap = (p) => {
      const y = p[1];
      const a = around(p, [0, 0]);
      if (between(y, 0.02, 0.12)) {
        if (y > 0.1 || y < 0.04) return hsv(p, C('#1c2a22'), 0.03, 120);
        // The bowl, front and centre: a cream bowl heaped with black beans.
        const bx = p[0] / 0.034, by = (y - 0.066) / 0.016;
        if (bx * bx + by * by < 1 && Math.abs(a) < 0.7) {
          const speck = noise(p[0] * 260, p[1] * 260, p[2] * 260);
          return speck > 0.5 ? C('#18181c') : C('#2c2c32');
        }
        const bowl = (p[0] / 0.04) ** 2 + ((y - 0.052) / 0.013) ** 2;
        if (bowl < 1 && Math.abs(a) < 0.9) return C('#e8dfc8');
        return hsv(p, C('#3f7d3a'), 0.03, 120);
      }
      return hsv(p, C('#a9afb4'), 0.05, 110);
    };
    lathe(s, [0, 0], [[0, 0.046], [0.004, 0.0505], [0.008, 0.0495], [0.014, 0.0495], [0.02, R], [0.12, R], [0.126, 0.0495], [0.134, 0.0495], [0.137, 0.0505], [H, 0.046]], { color: wrap, mat: 'tin' });
    // The ribs and the double seam.
    for (const y of [0.0105, 0.0125, 0.1275, 0.1295]) s.torus([0, y, 0], 0.0508, 0.0017, { color: '#9aa1a6', mat: 'tin', k: 0.001 });
    s.part('tab', () => {
      s.torus([0.01, H + 0.001, 0.012], 0.014, 0.0026, { color: '#c9ced1', mat: 'tin', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.cylinder([0, H + 0.002, 0], 0.004, 0.002, { color: '#bfc4c8', mat: 'tin', k: 0 });
      s.limb([-0.002, H + 0.003, -0.004], [0.026, H + 0.003, -0.012], 0.0028, 0.0028, { color: '#c9ced1', mat: 'tin', k: 0 });
    });
    s.part('text', () => {
      lathe(s, [0, 0], [[0.092, R + 0.0012], [0.096, R + 0.0012], [0.108, R + 0.0012], [0.112, R + 0.0012]], { color: '#1c2a22', mat: 'text' });
      s.box([0, 0.102, 0.05], [0.04, 0.0095, 0.05], 0, { op: 'inter', k: 0 });
    });
    words(s, 'BEANS', { at: [0, 0.0925, R - 0.015], size: 0.0155, aspect: 0.74, spacing: 0.2, width: 0.0019, color: '#f2ead0', depth: 0.025 });
  },
};

/** A cardboard-and-print box face: `fn(p, n)` decides each point, with the sides of a box (n.x, n.z) and its top and bottom (n.y) told apart. */
const face = (n, axis, sign) => n[axis] * sign > 0.6;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;

/** Cereal: a tall box of corn flakes: gold, a red banner across the top, a bowl heaped with flakes, a white nutrition panel down the side. */
export const cereal = {
  name: 'cereal',
  cell: 0.006,
  budget: 16000,
  bones: ONE,
  materials: { card: MATERIALS.card },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (face(n, 2, 1)) {
        if (y > 0.33) return C('#c8202a');
        if (y > 0.31) return C('#f3d27a');
        if (inEllipse(x, y, 0, 0.215, 0.075, 0.032)) return hsv(p, C('#e9b13c'), 0.18, 240);
        if (inEllipse(x, y, 0, 0.165, 0.098, 0.05)) return C('#f1e8d0');
        if (y < 0.06) return C('#b26a1c');
        return C('#e2a92f');
      }
      if (face(n, 2, -1)) return C('#d8a02c');
      if (face(n, 0, 1) || face(n, 0, -1)) return between(y, 0.07, 0.3) && Math.abs(p[2]) < 0.032 ? C('#f4f0e4') : C('#c4902a');
      return C('#c89a40');
    });
    s.box([0, 0.21, 0], [0.15, 0.21, 0.05], 0.004, { color: print, mat: 'card', k: 0 });
  },
};

/** Ground coffee: a stand-up pouch in near-black with a gold band, a cream label with a bean on it, a degassing valve and a crimped top. */
export const coffee = {
  name: 'coffee',
  cell: 0.0048,
  budget: 14000,
  bones: ONE,
  materials: { foil: { roughness: 0.34, metalness: 0.2, clearcoat: 0.5 }, valve: MATERIALS.plastic },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.3) {
        if (inEllipse(x, y, 0, 0.15, 0.036, 0.05)) return inEllipse(x, y, 0, 0.15, 0.018, 0.03) && Math.abs(x) < 0.006 + 0.01 * Math.abs(y - 0.15) / 0.03 ? C('#e8d6b4') : C('#5a3822');
        if (inEllipse(x, y, 0, 0.15, 0.054, 0.072)) return C('#efe3c4');
        if (between(y, 0.085, 0.215)) return C('#d9a948');
      }
      return C('#2a1b15');
    });
    s.box([0, 0.135, 0], [0.082, 0.125, 0.036], 0.03, { color: print, mat: 'foil', k: 0 });
    s.box([0, 0.272, 0], [0.083, 0.014, 0.012], 0.004, { color: '#2a1b15', mat: 'foil', k: 0.004 });
    s.box([0, 0.006, 0], [0.07, 0.006, 0.04], 0.004, { color: '#2a1b15', mat: 'foil', k: 0.004 });
    s.cylinder([0.045, 0.235, 0.034], 0.011, 0.004, { rot: [Math.PI / 2, 0, 0], color: '#cfd3d6', mat: 'valve', k: 0 });
  },
};

/** Rice: a two-pound pillow bag, white with a blue band and a golden grain on it, crimped top and bottom. */
export const rice = {
  name: 'rice',
  cell: 0.0048,
  budget: 12000,
  bones: ONE,
  materials: { bag: { roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 } },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.3) {
        if (inEllipse(x, y, 0, 0.125, 0.026, 0.05)) return C('#e0b040');
        if (between(y, 0.07, 0.19)) return C('#1f55a5');
        return C('#f2efe4');
      }
      return C('#eeebe0');
    });
    s.box([0, 0.12, 0], [0.085, 0.1, 0.03], 0.028, { color: print, mat: 'bag', k: 0 });
    s.box([0, 0.232, 0], [0.085, 0.014, 0.01], 0.004, { color: '#e9e6da', mat: 'bag', k: 0.01 });
    s.box([0, 0.008, 0], [0.085, 0.008, 0.01], 0.004, { color: '#e9e6da', mat: 'bag', k: 0.01 });
  },
};

/** Spaghetti: a long blue box with a window cut in its front and the dry strands showing through it. */
export const spaghetti = {
  name: 'spaghetti',
  cell: 0.0042,
  budget: 14000,
  bones: ONE,
  materials: { card: MATERIALS.card },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.5) {
        if (p[2] < 0.022 && Math.abs(x) < 0.03) return Math.sin(x * 520) > 0.1 ? C('#e6c36a') : C('#c99a46');
        if (y > 0.3) return C('#f2ead4');
        if (y < 0.05) return C('#c8202a');
        return C('#1d4ea0');
      }
      return C('#2250a0');
    });
    s.box([0, 0.17, 0], [0.046, 0.17, 0.03], 0.003, { color: print, mat: 'card', k: 0 });
    s.box([0, 0.19, 0.04], [0.032, 0.1, 0.022], 0.003, { op: 'sub', k: 0 });
  },
};

/** Frozen pizza: a flat box stood on its edge, a whole pie on the front of it, pepperoni and basil, a banner across the top. */
export const pizza = {
  name: 'pizza',
  cell: 0.0058,
  budget: 14000,
  bones: ONE,
  materials: { card: MATERIALS.card },
  sculpt(s) {
    const spots = [[0, 0.17, 0.03], [0.06, 0.2, 0.03], [-0.06, 0.2, 0.03], [0.05, 0.12, 0.03], [-0.05, 0.12, 0.03], [0, 0.23, 0.03], [0.09, 0.16, 0.03], [-0.09, 0.16, 0.03], [0, 0.1, 0.03]];
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.5) {
        const r = Math.hypot(x, y - 0.17);
        if (y > 0.325) return C('#fbf3da');
        if (r < 0.115) {
          for (const [px, py] of spots) if (Math.hypot(x - px, y - py) < 0.017) return C('#a3261f');
          if (Math.abs(x - 0.03) < 0.01 && Math.abs(y - 0.265) < 0.01) return C('#4a8a3a');
          return hsv(p, C('#ecbd50'), 0.1, 160);
        }
        if (r < 0.14) return C('#d9a458');
        return C('#b9301f');
      }
      return C('#a82a1a');
    });
    s.box([0, 0.19, 0], [0.19, 0.19, 0.0175], 0.004, { color: print, mat: 'card', k: 0 });
  },
};

/** Vanilla ice cream: a round tub, a cream wrapper with a purple band and a scoop of vanilla on the front, a white lid. */
export const icecream = {
  name: 'icecream',
  cell: 0.0048,
  budget: 14000,
  bones: ONE,
  materials: { tub: MATERIALS.plastic },
  sculpt(s) {
    const print = (p, n) => {
      const x = p[0], y = p[1];
      if (y > 0.121) return C('#f6f1e4');
      if (n[2] > 0.25) {
        if (Math.hypot(x, y - 0.075) < 0.027) return hsv(p, C('#f3e3a8'), 0.05, 150);
        if (y < 0.045) return C('#6a3fa0');
        if (inEllipse(x, y, 0, 0.1, 0.06, 0.012)) return C('#6a3fa0');
      }
      return y < 0.05 ? C('#6a3fa0') : C('#f4ead2');
    };
    lathe(s, [0, 0], [[0, 0.066], [0.012, 0.076], [0.12, 0.088]], { color: print, mat: 'tub' });
    lathe(s, [0, 0], [[0.119, 0.091], [0.126, 0.0925], [0.137, 0.0905]], { color: '#f6f1e4', mat: 'tub' });
  },
};

/** Yogurt: a wide white tub with a blue band and a blue foil lid. */
export const yogurt = {
  name: 'yogurt',
  cell: 0.0048,
  budget: 14000,
  bones: ONE,
  materials: { tub: MATERIALS.plastic },
  sculpt(s) {
    const print = (p, n) => {
      const y = p[1];
      if (n[2] > 0.25 && inEllipse(p[0], y, 0, 0.075, 0.04, 0.026)) return C('#f8f6ef');
      if (between(y, 0.04, 0.105)) return C('#2d6cb0');
      return C('#f2f0e6');
    };
    lathe(s, [0, 0], [[0, 0.056], [0.008, 0.062], [0.128, 0.0745]], { color: print, mat: 'tub' });
    lathe(s, [0, 0], [[0.127, 0.0775], [0.136, 0.0785], [0.141, 0.0765]], { color: '#2457a6', mat: 'tub' });
  },
};

/** Milk: a quart in a gable-topped carton, white with a blue base and blue roof, black cow patches. */
export const milk = {
  name: 'milk',
  cell: 0.0042,
  budget: 14000,
  bones: ONE,
  materials: { card: { roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4 } },
  sculpt(s) {
    const print = printed((p, n) => {
      const y = p[1];
      if (y > 0.19 || y < 0.045) return C('#2457a6');
      const blot = fbm(p[0] * 26 + 3, y * 26, p[2] * 26, 2);
      if (blot > 0.62 && Math.abs(n[1]) < 0.5) return C('#1c1c20');
      return C('#f4f2ea');
    });
    const bounds = [[-0.06, 0, -0.06], [0.06, 0.29, 0.06]];
    hull(s, [[1, 0, 0, 0.05], [-1, 0, 0, 0.05], [0, 0, 1, 0.05], [0, 0, -1, 0.05], [0, -1, 0, 0],
      [0, 0.64, 0.768, 0.16], [0, 0.64, -0.768, 0.16]], bounds, { color: print, mat: 'card', round: 0.003 });
    s.box([0, 0.262, 0], [0.05, 0.02, 0.0045], 0.002, { color: '#2457a6', mat: 'card', k: 0.004 });
  },
};

/** Cheddar: a block of orange cheese in its wrapper, a black label with a gold rule across the bottom. */
export const cheddar = {
  name: 'cheddar',
  cell: 0.0042,
  budget: 12000,
  bones: ONE,
  materials: { wrap: { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 } },
  sculpt(s) {
    const print = (p, n) => {
      if (n[2] > 0.5) {
        if (between(p[1], 0.04, 0.046)) return C('#e9b23c');
        if (p[1] < 0.04) return C('#1f1f1d');
        if (inEllipse(p[0], p[1], 0, 0.065, 0.02, 0.012)) return C('#1f1f1d');
      }
      return hsv(p, C('#eaa63a'), 0.05, 90);
    };
    s.box([0, 0.045, 0], [0.085, 0.045, 0.019], 0.005, { color: print, mat: 'wrap', k: 0 });
  },
};

/** Butter: a one-pound carton lying on its side, cream paper with a blue band. */
export const butter = {
  name: 'butter',
  cell: 0.0038,
  budget: 12000,
  bones: ONE,
  materials: { paper: MATERIALS.paper, foil: MATERIALS.foil },
  sculpt(s) {
    const print = printed((p, n) => {
      if (n[0] > 0.8 || n[0] < -0.8) return C('#d9b64a');
      if (n[2] > 0.5 || n[1] > 0.5) return between(p[0], -0.03, 0.03) ? C('#2457a6') : C('#f6e7a6');
      return C('#f1e19a');
    });
    s.box([0, 0.028, 0], [0.085, 0.028, 0.028], 0.004, { color: print, mat: 'paper', k: 0 });
  },
};

/** Eggs: a half-dozen carton open, six brown eggs in their cups and the lid laid back. */
export const eggs = {
  name: 'eggs',
  cell: 0.0036,
  budget: 18000,
  bones: ONE,
  materials: { pulp: { roughness: 0.95 }, egg: { roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5 }, paper: MATERIALS.paper },
  sculpt(s) {
    const pulp = printed((p, n) => (n[2] > 0.6 && Math.abs(p[0]) < 0.04 ? C('#f7f3e8') : C('#b9ac95')), 0.06);
    s.box([0, 0.022, 0], [0.082, 0.022, 0.056], 0.008, { color: pulp, mat: 'pulp', k: 0, bump: [0.0012, 80] });
    for (const x of [-0.05, 0, 0.05]) for (const z of [-0.027, 0.027]) {
      const speck = (p) => hsv(p, C('#b87846'), 0.1, 200);
      s.ellipsoid([x, 0.05, z], [0.021, 0.028, 0.021], { color: speck, mat: 'egg', k: 0.002, rot: [0.1 * (x > 0 ? 1 : -1), 0, 0.12 * (z > 0 ? 1 : -1)] });
    }
    s.box([0, 0.096, -0.073], [0.082, 0.0025, 0.055], 0.002, { rot: [-1.9, 0, 0], color: pulp, mat: 'pulp', k: 0 });
  },
};

// ——————————————————————————————————————————————— the cold case

const tray = (s, w, d, wall = 0.012) => {
  s.box([0, 0.015, 0], [w, 0.015, d], 0.01, { color: '#f3f0e8', mat: 'foam', k: 0 });
  s.box([0, 0.034, 0], [w - wall, 0.022, d - wall], 0.006, { op: 'sub', k: 0 });
};
const wrapFilm = (s, w, d, h) => s.part('film', () => s.box([0, h / 2 + 0.012, 0], [w + 0.002, h / 2, d + 0.002], 0.02, { color: '#ffffff', mat: 'film', k: 0 }));

/** Chicken: two breasts on a foam tray, under film, a white price label. */
export const chicken = {
  name: 'chicken',
  cell: 0.0044,
  budget: 18000,
  bones: ONE,
  materials: { foam: MATERIALS.foam, meat: MATERIALS.meat, film: MATERIALS.film, paper: MATERIALS.paper },
  sculpt(s) {
    tray(s, 0.115, 0.085);
    const flesh = (p) => hsv(p, C('#e8a58f'), 0.1, 80);
    s.ellipsoid([-0.035, 0.036, -0.005], [0.06, 0.022, 0.04], { color: flesh, mat: 'meat', k: 0.004, rot: [0, 0.35, 0.05], bump: [0.002, 55] });
    s.ellipsoid([0.04, 0.034, 0.02], [0.055, 0.02, 0.038], { color: flesh, mat: 'meat', k: 0.004, rot: [0, -0.25, -0.04], bump: [0.002, 55] });
    s.part('film', () => {});
    wrapFilm(s, 0.115, 0.085, 0.045);
    s.box([0.07, 0.019, 0.074], [0.03, 0.003, 0.009], 0.001, { color: '#f7f4ea', mat: 'paper', k: 0 });
  },
};

/** Ground beef: a mound of it on a foam tray, under film, a red price label. */
export const beef = {
  name: 'beef',
  cell: 0.0046,
  budget: 18000,
  bones: ONE,
  materials: { foam: MATERIALS.foam, meat: MATERIALS.meat, film: MATERIALS.film, paper: MATERIALS.paper },
  sculpt(s) {
    tray(s, 0.115, 0.085);
    const mince = (p) => (noise(p[0] * 120, p[1] * 120, p[2] * 120) > 0.7 ? C('#e6c9b8') : hsv(p, C('#a03226'), 0.12, 90));
    s.ellipsoid([0, 0.04, 0], [0.095, 0.026, 0.068], { color: mince, mat: 'meat', k: 0.004, bump: [0.004, 85] });
    wrapFilm(s, 0.115, 0.085, 0.05);
    s.box([-0.07, 0.019, 0.074], [0.03, 0.003, 0.009], 0.001, { color: '#d94a3a', mat: 'paper', k: 0 });
  },
};

/** Deli turkey: three folded stacks of sliced turkey in a sealed tray, a green label. */
export const turkey = {
  name: 'turkey',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { foam: MATERIALS.foam, meat: MATERIALS.meat, film: MATERIALS.film, paper: MATERIALS.paper },
  sculpt(s) {
    tray(s, 0.1, 0.07);
    const slice = (p) => hsv(p, C('#e9bda6'), 0.06, 100);
    for (let i = 0; i < 3; i++) s.ellipsoid([-0.03 + i * 0.03, 0.04 + i * 0.012, 0.005 * (i - 1)], [0.058, 0.016, 0.04], { color: slice, mat: 'meat', k: 0.006, rot: [0, 0.2 * (i - 1), 0.08 * (1 - i)] });
    wrapFilm(s, 0.1, 0.07, 0.05);
    s.box([0, 0.019, 0.063], [0.05, 0.003, 0.008], 0.001, { color: '#3c8a4a', mat: 'paper', k: 0 });
  },
};

// ——————————————————————————————————————————————— the bakery

/** Bread: a sandwich loaf in a printed bag, the cut end showing through, gathered and twist-tied at the other. */
export const bread = {
  name: 'bread',
  cell: 0.0048,
  budget: 18000,
  bones: ONE,
  materials: { bag: { roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 }, tie: MATERIALS.plastic },
  sculpt(s) {
    const print = printed((p, n) => {
      if (p[0] < -0.03) return between(p[1], 0.04, 0.1) ? C('#c8202a') : C('#f3d78c');
      return n[1] > 0.4 ? C('#b87a3a') : C('#d49a58');
    });
    s.box([0, 0.065, 0], [0.145, 0.062, 0.068], 0.04, { color: print, mat: 'bag', k: 0 });
    s.ellipsoid([0.01, 0.105, 0], [0.13, 0.042, 0.062], { color: print, mat: 'bag', k: 0.03 });
    s.limb([0.12, 0.07, 0], [0.205, 0.075, 0], 0.05, 0.011, { color: '#e8d6a8', mat: 'bag', k: 0.04 });
    s.torus([0.19, 0.074, 0], 0.014, 0.004, { rot: [0, 0, Math.PI / 2], color: '#d03030', mat: 'tie', k: 0.002 });
  },
};

// ——————————————————————————————————————————————— fresh

const apple = (s, c, r, seed) => {
  const tone = fruit(c, (q) => {
    const streak = fbm(Math.atan2(q[0], q[2]) * 5 + seed, q[1] * 14, seed, 3) + 0.25 * (q[1] / r);
    return mix(C('#b3231f'), C('#e3a93a'), smooth(0.7, 1.0, streak));
  });
  s.ellipsoid(c, [r, r * 0.92, r], { color: tone, mat: 'skin', k: 0 });
  s.sphere([c[0], c[1] + r * 0.9, c[2]], r * 0.22, { op: 'sub', k: 0.01 });
  s.limb([c[0], c[1] + r * 0.62, c[2]], [c[0] + 0.004, c[1] + r * 1.12, c[2]], 0.0035, 0.003, { color: '#6a4a2a', mat: 'stalk', k: 0.004 });
};

/** Gala apples: four in a pile, streaked red over yellow, each with its stalk. */
export const apples = {
  name: 'apples',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.fresh, stalk: MATERIALS.stalk },
  sculpt(s) {
    const r = 0.052;
    apple(s, [-0.052, r * 0.92, -0.03], r, 1);
    apple(s, [0.052, r * 0.92, -0.03], r, 2);
    apple(s, [0, r * 0.92, 0.058], r, 3);
    apple(s, [0, r * 0.92 + 0.078, 0.006], r, 4);
  },
};

/** Bananas: a hand of five, green at the crown, brown at the tips, curling up from the stem. */
export const bananas = {
  name: 'bananas',
  cell: 0.0044,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.fresh, stalk: MATERIALS.stalk },
  sculpt(s) {
    const tone = (p) => (p[0] < -0.1 ? C('#9aa83a') : p[0] > 0.135 ? C('#4a3a1c') : hsv(p, C('#e8c63a'), 0.06, 70));
    for (let i = 0; i < 5; i++) {
      const z = (i - 2) * 0.03, lift = i % 2 ? 0.02 : 0, fan = (i - 2) * 0.012;
      const pts = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => [-0.12 + 0.27 * t, 0.026 + lift + 0.075 * t * t, z + fan * t * 2]);
      s.chain(pts, [0.011, 0.019, 0.0225, 0.0215, 0.016, 0.007], { color: tone, mat: 'skin', k: 0.01 });
    }
    s.limb([-0.12, 0.032, 0], [-0.17, 0.05, 0], 0.02, 0.014, { color: '#7a7a2a', mat: 'stalk', k: 0.012 });
  },
};

/** Tomatoes: a truss of four on the vine, each with its green star at the top. */
export const tomatoes = {
  name: 'tomatoes',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.fresh, leaf: MATERIALS.leaf, stalk: MATERIALS.stalk },
  sculpt(s) {
    const spots = [[-0.058, -0.035], [0.056, -0.04], [-0.042, 0.058], [0.062, 0.05]];
    spots.forEach(([x, z]) => {
      const c = [x, 0.042, z];
      s.ellipsoid(c, [0.047, 0.039, 0.047], { color: fruit(c, (q) => mix(C('#c9281c'), C('#e8501f'), smooth(-0.03, 0.04, q[1]))), mat: 'skin', k: 0 });
      s.ellipsoid([x, 0.079, z], [0.02, 0.005, 0.02], { color: '#4f8a3a', mat: 'leaf', k: 0.004 });
      s.limb([x, 0.08, z], [x * 0.3, 0.1, z * 0.3], 0.0035, 0.003, { color: '#5a8a3a', mat: 'stalk', k: 0.003 });
    });
    s.chain([[-0.1, 0.075, 0.0], [-0.03, 0.098, 0.0], [0.04, 0.1, 0.0], [0.1, 0.082, 0.02]], [0.005, 0.0055, 0.0055, 0.004], { color: '#5a8a3a', mat: 'stalk', k: 0.003 });
  },
};

/** Lettuce: a head of green leaf lettuce, ruffled leaves round a pale heart. */
export const lettuce = {
  name: 'lettuce',
  cell: 0.0065,
  budget: 16000,
  bones: ONE,
  materials: { leaf: MATERIALS.leaf },
  sculpt(s) {
    const tone = (p) => {
      const d = Math.hypot(p[0], p[2]);
      return mix(C('#e9efb0'), C('#4f8a2e'), smooth(0.02, 0.1, d) * 0.85 + 0.1 * noise(p[0] * 40, p[1] * 40, p[2] * 40));
    };
    s.ellipsoid([0, 0.07, 0], [0.05, 0.05, 0.05], { color: tone, mat: 'leaf', k: 0.02 });
    for (const [n, tilt, len, wid, off] of [[5, 1.1, 0.065, 0.03, 0], [6, 0.7, 0.078, 0.038, 0.3], [6, 0.3, 0.088, 0.042, 0.1], [5, 0.05, 0.086, 0.044, 0.5]]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + off;
        const dir = [Math.sin(a) * Math.cos(tilt), Math.sin(tilt), Math.cos(a) * Math.cos(tilt)];
        const base = [Math.sin(a) * 0.03, 0.025 + tilt * 0.02, Math.cos(a) * 0.03];
        s.flake(base, [base[0] + dir[0] * len, base[1] + dir[1] * len, base[2] + dir[2] * len], [0, 1, 0], 0.012, wid, 0.34, { color: tone, mat: 'leaf', k: 0.014 });
      }
    }
    s.box([0, -0.2, 0], [0.4, 0.2, 0.4], 0, { op: 'sub', k: 0.01 });
  },
};

/** Potatoes: three russets, brown and lumpy, dark eyes dotted over them. */
export const potatoes = {
  name: 'potatoes',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.skin },
  sculpt(s) {
    const tone = (p) => (noise(p[0] * 190, p[1] * 190, p[2] * 190) > 0.86 ? C('#3a2616') : hsv(p, C('#8d6a46'), 0.08, 90));
    s.ellipsoid([-0.055, 0.04, -0.02], [0.075, 0.042, 0.052], { color: tone, mat: 'skin', k: 0, rot: [0, 0.4, 0], bump: [0.005, 40] });
    s.ellipsoid([0.06, 0.038, -0.01], [0.065, 0.04, 0.05], { color: tone, mat: 'skin', k: 0, rot: [0, -0.5, 0], bump: [0.005, 40] });
    s.ellipsoid([0.0, 0.04, 0.06], [0.07, 0.04, 0.05], { color: tone, mat: 'skin', k: 0, rot: [0, 0.1, 0], bump: [0.005, 40] });
  },
};

// ——————————————————————————————————————————————— more fresh

/** Oranges: three navel oranges in a pile, dimpled peel and a pale navel at the top. */
export const oranges = {
  name: 'oranges',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.fresh },
  sculpt(s) {
    const r = 0.056;
    const orange = (c, seed) => {
      const tone = fruit(c, (q) => mix(C('#e8780f'), C('#f4a21e'), smooth(0.3, 0.9, fbm(q[0] * 18 + seed, q[1] * 18, q[2] * 18, 2))));
      s.ellipsoid(c, [r, r * 0.95, r], { color: tone, mat: 'skin', k: 0, bump: [0.0012, 140] });
      s.sphere([c[0], c[1] + r * 0.92, c[2]], r * 0.16, { color: '#c9610c', mat: 'skin', k: 0.004 });
    };
    orange([-0.05, r * 0.95, -0.025], 1);
    orange([0.052, r * 0.95, -0.025], 2);
    orange([0, r * 0.95 + 0.006, 0.055], 3);
  },
};

/** Carrots: a bunch of four, orange and ringed, tapering to a point, with the green tops still on. */
export const carrots = {
  name: 'carrots',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { root: MATERIALS.skin, leaf: MATERIALS.leaf },
  sculpt(s) {
    const tone = (p) => {
      const ring = Math.sin(p[0] * 520 + p[2] * 90) > 0.82 ? 0.88 : 1;
      return hsv(p, C('#e3761a').map((v) => v * ring), 0.06, 80);
    };
    for (let i = 0; i < 4; i++) {
      const z = (i - 1.5) * 0.026, lift = 0.021 + (i % 2) * 0.016;
      s.chain([[-0.13, lift, z * 0.5], [-0.05, lift, z * 0.9], [0.05, lift - 0.002, z * 1.15], [0.14, lift - 0.004, z * 1.3]], [0.019, 0.0185, 0.0125, 0.003], { color: tone, mat: 'root', k: 0.004, bump: [0.0012, 90] });
      for (const dz of [-0.01, 0, 0.01]) s.limb([-0.13, lift, z * 0.5], [-0.21, lift + 0.03 + dz * 2, z * 0.5 + dz * 3], 0.006, 0.003, { color: '#4a8a2e', mat: 'leaf', k: 0.004 });
    }
  },
};

/** Onions: three yellow onions, papery and tapered to a dry tip, a tuft of roots underneath. */
export const onions = {
  name: 'onions',
  cell: 0.0042,
  budget: 18000,
  bones: ONE,
  materials: { skin: MATERIALS.skin, root: MATERIALS.stalk },
  sculpt(s) {
    const tone = (p) => hsv(p, mix(C('#c98a2e'), C('#8a5420'), smooth(0.2, 0.8, noise(p[0] * 60, p[1] * 18, p[2] * 60))), 0.05, 80);
    for (const [x, z, r] of [[-0.052, -0.02, 0.05], [0.055, -0.015, 0.047], [0.0, 0.055, 0.05]]) {
      s.ellipsoid([x, r * 0.88, z], [r, r * 0.88, r], { color: tone, mat: 'skin', k: 0, bump: [0.0012, 60] });
      s.cone([x, r * 1.95, z], r * 0.28, r * 0.55, { color: tone, mat: 'skin', k: 0.012 });
      s.limb([x, 0.004, z], [x + 0.006, 0.0, z + 0.006], 0.008, 0.003, { color: '#d8c8a0', mat: 'root', k: 0.004 });
    }
  },
};

/** Peppers: a red, a yellow and a green bell pepper, glossy and lobed, each with its green stem. */
export const peppers = {
  name: 'peppers',
  cell: 0.0042,
  budget: 20000,
  bones: ONE,
  materials: { skin: { roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.25 }, stalk: MATERIALS.stalk },
  sculpt(s) {
    const pepper = (x, z, base, tilt) => {
      const c = [x, 0.047, z];
      const tone = fruit(c, (q) => mix(C(base[0]), C(base[1]), smooth(-0.04, 0.05, q[1])));
      for (const a of [0, 2.1, 4.2]) {
        s.ellipsoid([x + Math.sin(a) * 0.014, 0.046, z + Math.cos(a) * 0.014], [0.03, 0.046, 0.03], { color: tone, mat: 'skin', k: 0.012, rot: [0, 0, tilt] });
      }
      s.limb([x, 0.088, z], [x + 0.004, 0.108, z], 0.007, 0.0055, { color: '#4f7a2a', mat: 'stalk', k: 0.004 });
    };
    pepper(-0.06, -0.015, ['#b3151c', '#d9281e'], 0.05);
    pepper(0.06, -0.02, ['#e0b012', '#f2cf2e'], -0.05);
    pepper(0.0, 0.06, ['#2f7a2a', '#4f9a3a'], 0.03);
  },
};

/** Grapes: a bunch of green grapes hanging from a woody stem, each with a bloom of white. */
export const grapes = {
  name: 'grapes',
  cell: 0.0036,
  budget: 22000,
  bones: ONE,
  materials: { fruit: { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3 }, stalk: MATERIALS.stalk },
  sculpt(s) {
    const tone = (p) => mix(C('#9cc24a'), C('#c9dd78'), smooth(0.2, 0.8, noise(p[0] * 70, p[1] * 70, p[2] * 70)));
    const rows = [[0.1, 5, 0.04], [0.078, 4, 0.034], [0.056, 3, 0.026], [0.036, 2, 0.016], [0.02, 1, 0]];
    for (const [y, n, ring] of rows) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + y * 9;
        s.sphere([Math.sin(a) * ring, y, Math.cos(a) * ring], 0.0215, { color: tone, mat: 'fruit', k: 0.002 });
      }
    }
    s.limb([0, 0.1, 0], [0.012, 0.15, 0.004], 0.006, 0.005, { color: '#6a5230', mat: 'stalk', k: 0.004 });
    s.limb([0.012, 0.15, 0.004], [0.04, 0.162, 0.004], 0.005, 0.004, { color: '#6a5230', mat: 'stalk', k: 0.004 });
  },
};

// ——————————————————————————————————————————————— more pantry

/** Flour: a five-pound paper sack, plain white with a red band and a golden ear of wheat, the top folded over and glued. */
export const flour = {
  name: 'flour',
  cell: 0.0052,
  budget: 14000,
  bones: ONE,
  materials: { paper: MATERIALS.paper },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.3) {
        if (y > 0.27) return C('#e6e0d0');
        if (inEllipse(x, y, 0, 0.17, 0.018, 0.05)) return C('#d9a83a');
        if (between(y, 0.1, 0.24)) return C('#b3261e');
        return C('#f4f1e8');
      }
      return C('#efebe0');
    });
    s.box([0, 0.14, 0], [0.085, 0.14, 0.04], 0.006, { color: print, mat: 'paper', k: 0 });
    s.box([0, 0.288, 0], [0.085, 0.01, 0.036], 0.002, { color: '#dcd5c2', mat: 'paper', k: 0 });
  },
};

/** Sugar: a four-pound paper bag, white with a sky blue band and a cube of sugar on the front, folded and glued across the top. */
export const sugar = {
  name: 'sugar',
  cell: 0.0048,
  budget: 14000,
  bones: ONE,
  materials: { paper: MATERIALS.paper },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.3) {
        if (Math.abs(x) < 0.026 && between(y, 0.1, 0.152)) return C('#ffffff');
        if (between(y, 0.07, 0.19)) return C('#4a9ad4');
        if (y > 0.235) return C('#e6e2d6');
        return C('#f6f3ea');
      }
      return C('#f0ede2');
    });
    s.box([0, 0.12, 0], [0.075, 0.12, 0.035], 0.006, { color: print, mat: 'paper', k: 0 });
    s.box([0, 0.244, 0], [0.075, 0.008, 0.032], 0.002, { color: '#dedacb', mat: 'paper', k: 0 });
  },
};

/** Oats: a round cardboard canister, a blue label with a bowl of rolled oats on it and a plastic lid. */
export const oats = {
  name: 'oats',
  cell: 0.0048,
  budget: 14000,
  bones: ONE,
  materials: { card: MATERIALS.card, lid: MATERIALS.plastic },
  sculpt(s) {
    const print = (p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.25) {
        if (inEllipse(x, y, 0, 0.115, 0.045, 0.03)) return hsv(p, C('#ddb878'), 0.12, 200);
        if (inEllipse(x, y, 0, 0.1, 0.055, 0.02)) return C('#f1e8d0');
        if (y > 0.2) return C('#f2ead4');
      }
      return y < 0.032 ? C('#a8b8c8') : C('#2d5da6');
    };
    lathe(s, [0, 0], [[0, 0.05], [0.004, 0.0545], [0.2, 0.0545], [0.203, 0.052]], { color: print, mat: 'card' });
    lathe(s, [0, 0], [[0.2, 0.056], [0.206, 0.0575], [0.222, 0.0575], [0.226, 0.0545]], { color: '#c8302a', mat: 'lid' });
  },
};

/** Peanut butter: a squat plastic jar, a brown label with a peanut on it and a red screw lid. */
export const peanutbutter = {
  name: 'peanutbutter',
  cell: 0.0042,
  budget: 14000,
  bones: ONE,
  materials: { jar: MATERIALS.pet, cap: MATERIALS.cap },
  sculpt(s) {
    const print = (p, n) => {
      const x = p[0], y = p[1];
      if (between(y, 0.035, 0.1)) {
        if (n[2] > 0.25 && inEllipse(x, y, 0, 0.068, 0.024, 0.017)) return C('#d9a85a');
        return C('#7a4a22');
      }
      return hsv(p, C('#c8883a'), 0.04, 100);
    };
    lathe(s, [0, 0], [[0, 0.04], [0.006, 0.048], [0.02, 0.0505], [0.105, 0.0505], [0.115, 0.046], [0.123, 0.04]], { color: print, mat: 'jar' });
    s.part('cap', () => {
      lathe(s, [0, 0], [[0.122, 0.0455], [0.125, 0.0495], [0.152, 0.0495], [0.155, 0.047]], { color: '#c8302a', mat: 'cap' });
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        s.limb([Math.sin(a) * 0.05, 0.127, Math.cos(a) * 0.05], [Math.sin(a) * 0.05, 0.15, Math.cos(a) * 0.05], 0.0013, 0.0013, { color: '#a82020', mat: 'cap', k: 0 });
      }
    });
  },
};

// ——————————————————————————————————————————————— more of the cold case

/** Orange juice: a half-gallon gable carton, orange with a big slice of orange on the front and a screw cap. */
export const orangejuice = {
  name: 'orangejuice',
  cell: 0.0046,
  budget: 16000,
  bones: ONE,
  materials: { card: { roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.35 }, cap: MATERIALS.cap },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (y > 0.235 || y < 0.04) return C('#e8780f');
      if (n[2] > 0.5) {
        const r = Math.hypot(x, y - 0.14);
        if (r < 0.026) return Math.sin(Math.atan2(y - 0.14, x) * 4) > 0.5 ? C('#fff1c4') : C('#f6a41e');
        if (r < 0.032) return C('#fff6d8');
      }
      return C('#f5a21e');
    });
    const bounds = [[-0.07, 0, -0.07], [0.07, 0.34, 0.07]];
    hull(s, [[1, 0, 0, 0.0575], [-1, 0, 0, 0.0575], [0, 0, 1, 0.0575], [0, 0, -1, 0.0575], [0, -1, 0, 0],
      [0, 0.64, 0.768, 0.19], [0, 0.64, -0.768, 0.19]], bounds, { color: print, mat: 'card', round: 0.003 });
    s.part('cap', () => s.cylinder([0, 0.311, 0.0], 0.012, 0.01, { color: '#3a8a2a', mat: 'cap', k: 0 }));
  },
};

/** Bacon: a vacuum pack of streaky bacon, the red-and-pink strips showing through a window in the card sleeve. */
export const bacon = {
  name: 'bacon',
  cell: 0.0038,
  budget: 14000,
  bones: ONE,
  materials: { pack: { roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 }, meat: MATERIALS.meat },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], z = p[2];
      if (n[1] > 0.5) {
        if (Math.abs(x) < 0.062 && Math.abs(z) < 0.027) {
          return Math.sin(z * 520 + noise(x * 40, 0, z * 40) * 3) > 0.15 ? C('#f0c8b8') : C('#b0382c');
        }
        return C('#a8231c');
      }
      return C('#9c1e18');
    });
    s.box([0, 0.016, 0], [0.095, 0.016, 0.045], 0.012, { color: print, mat: 'pack', k: 0 });
    s.box([0, 0.0155, 0], [0.098, 0.0165, 0.012], 0.002, { color: '#f4f0e4', mat: 'pack', k: 0.004 });
  },
};

/** Sour cream: a round tub, white with a green band and a green foil lid. */
export const sourcream = {
  name: 'sourcream',
  cell: 0.0044,
  budget: 14000,
  bones: ONE,
  materials: { tub: MATERIALS.plastic },
  sculpt(s) {
    const print = (p, n) => {
      const y = p[1];
      if (n[2] > 0.25 && inEllipse(p[0], y, 0, 0.058, 0.036, 0.022)) return C('#f8f6ef');
      if (between(y, 0.03, 0.082)) return C('#3a8a3a');
      return C('#f3f1e6');
    };
    lathe(s, [0, 0], [[0, 0.05], [0.006, 0.056], [0.104, 0.066]], { color: print, mat: 'tub' });
    lathe(s, [0, 0], [[0.103, 0.0685], [0.11, 0.0695], [0.115, 0.0675]], { color: '#2f7a30', mat: 'tub' });
  },
};

// ——————————————————————————————————————————————— the snack aisle

/** Chips: a pillow bag of potato chips, bright yellow with a red banner and a chip on the front, crimped at both ends. */
export const chips = {
  name: 'chips',
  cell: 0.0054,
  budget: 14000,
  bones: ONE,
  materials: { bag: { roughness: 0.22, metalness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 } },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.3) {
        if (inEllipse(x, y, 0, 0.17, 0.045, 0.034)) return hsv(p, C('#e9b43c'), 0.1, 160);
        if (between(y, 0.095, 0.115) || between(y, 0.23, 0.25)) return C('#c8202a');
        if (between(y, 0.115, 0.23)) return C('#f4cf2a');
        return C('#c8202a');
      }
      return C('#b81e24');
    });
    s.box([0, 0.17, 0], [0.095, 0.145, 0.032], 0.03, { color: print, mat: 'bag', k: 0 });
    s.box([0, 0.322, 0], [0.095, 0.012, 0.01], 0.004, { color: '#b81e24', mat: 'bag', k: 0.01 });
    s.box([0, 0.012, 0], [0.095, 0.01, 0.01], 0.004, { color: '#b81e24', mat: 'bag', k: 0.01 });
  },
};

/** Cookies: a tall box of chocolate chip cookies, a dark blue box with a round cookie on the front, studded with chips. */
export const cookies = {
  name: 'cookies',
  cell: 0.0044,
  budget: 14000,
  bones: ONE,
  materials: { card: MATERIALS.card },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0], y = p[1];
      if (n[2] > 0.5) {
        const r = Math.hypot(x, y - 0.1);
        if (r < 0.04) {
          const chip = noise(x * 280, y * 280, 7) > 0.78;
          return chip ? C('#3a2112') : hsv(p, C('#c8903f'), 0.1, 140);
        }
        if (y > 0.17) return C('#e8d6a0');
        return C('#1f3f7c');
      }
      return C('#1f3f7c');
    });
    s.box([0, 0.1, 0], [0.065, 0.1, 0.03], 0.003, { color: print, mat: 'card', k: 0 });
  },
};

/** A candy bar: a chocolate bar in a brown wrapper with a gold stripe, the wrapper crimped at each end. */
export const candybar = {
  name: 'candybar',
  cell: 0.0034,
  budget: 12000,
  bones: ONE,
  materials: { wrap: { roughness: 0.25, metalness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.15 } },
  sculpt(s) {
    const print = printed((p, n) => {
      const x = p[0];
      if (n[1] > 0.5) {
        if (Math.abs(x) > 0.078) return C('#d8c08a');
        if (Math.abs(p[2]) < 0.008) return C('#e0b040');
        return C('#5a2e18');
      }
      return C('#4a2412');
    });
    s.box([0, 0.02, 0], [0.09, 0.019, 0.03], 0.01, { color: print, mat: 'wrap', k: 0 });
    for (const sx of [-1, 1]) s.box([sx * 0.104, 0.02, 0], [0.014, 0.009, 0.03], 0.002, { color: '#d8c08a', mat: 'wrap', k: 0.004 });
  },
};

// ——————————————————————————————————————————————— deliveries

/** A shipping carton: kraft cardboard taped shut with a white label on its front. */
export const carton = {
  name: 'carton',
  cell: 0.0072,
  budget: 12000,
  bones: ONE,
  materials: { card: MATERIALS.card, label: MATERIALS.paper },
  sculpt(s) {
    const print = printed((p, n) => {
      if (n[2] > 0.5 && inEllipse(p[0], p[1], 0.03, 0.12, 0.07, 0.045)) return C('#f4f1ea');
      if (n[1] > 0.5 && Math.abs(p[0]) < 0.02) return C('#cfa96e');
      return hsv(p, C('#b88a56'), 0.05, 40);
    });
    s.box([0, 0.11, 0], [0.15, 0.11, 0.11], 0.004, { color: print, mat: 'card', k: 0 });
  },
};

/** The whole stock, by name. */
export const GROCERIES = {
  apples, bananas, tomatoes, lettuce, potatoes, oranges, carrots, onions, peppers, grapes,
  milk, yogurt, cheddar, butter, eggs, chicken, beef, turkey, orangejuice, bacon, sourcream,
  bread,
  rice, spaghetti, cereal, beans, coffee, flour, sugar, oats, peanutbutter,
  chips, cookies, candybar,
  cola, water,
  pizza, icecream,
  carton,
};
