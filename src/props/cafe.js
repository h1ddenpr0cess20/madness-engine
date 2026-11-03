import { rgb } from '../models/sdf.js';
import { grainy } from '../models/skins.js';

/**
 * A breakfast café's furniture, in one palette: walnut frames, a green
 * cushion and a brass trim. The dining chair (a slatted back, brass caps on
 * its posts), the pedestal table, the counter stool and the booth, a long
 * bench with a high back and a table in front of it.
 *
 * All of it faces +z as a person does, stands on y = 0, and is sized for the
 * `sit` clip like the plain `chair`: a seat's top 0.14 up. The numbers below
 * are written at the size the café was drawn at (a seat 0.36 up) and brought
 * down by `K`, so a chair here is the plain chair's height with a table 0.27
 * up beside it.
 */

const K = 0.14 / 0.36;
/** A point, and a box's half-size, from the size the café was drawn at. */
const P = (x, y, z) => [x * K, y * K, z * K];
const H = (w, h, d) => [(w * K) / 2, (h * K) / 2, (d * K) / 2];
const R = (v) => v * K;

const WALNUT = '#60432f', WALNUT_LIGHT = '#9b704b', GREEN = '#315b4c', GREEN_LIGHT = '#547564', BRASS = '#b99a61';
const MATERIALS = {
  wood: { roughness: 0.7, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  pad: { roughness: 0.88, sheen: 0.3, sheenColor: '#8fb7a0', sheenRoughness: 0.6 },
  brass: { roughness: 0.34, metalness: 0.58 },
};
const wood = (hex = WALNUT) => ({ color: grainy(hex, 0.12, 36), mat: 'wood', k: 0.003 });
const pad = (hex = GREEN) => ({ color: rgb(hex), mat: 'pad', k: 0.004 });
const brass = { color: rgb(BRASS), mat: 'brass', k: 0.003 };
const one = [['root', null, [0, 0, 0]]];

/** The cushioned bench seat every café seat shares, and the pedestal every table stands on. */
function pedestal(s, x, z, { top, base, stem }) {
  s.cylinder(P(x, 0.075, z), R(base), R(0.06), { ...wood(), round: 0.003 });
  s.limb(P(x, stem + 0.06, z), P(x, top - 0.1, z), R(stem + 0.05), R(stem), brass);
}

export const cafechair = {
  name: 'cafechair',
  cell: 0.0035,
  bones: one,
  materials: MATERIALS,
  sculpt(s) {
    const w = 0.46, d = 0.44, leg = 0.045, seat = 0.36, seatY = seat - 0.045;
    // Four legs, and the rails between them.
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      s.box(P(x * (w / 2 - leg / 2), seatY / 2, z * (d / 2 - leg / 2)), H(leg, seatY, leg), 0.003, wood());
    }
    for (const y of [0.13, 0.22]) {
      s.box(P(0, y, d / 2 - leg / 2), H(w - leg * 2, 0.025, 0.025), 0.002, wood(WALNUT_LIGHT));
      for (const x of [-1, 1]) s.box(P(x * (w / 2 - leg / 2), y, 0), H(0.025, 0.025, d - leg * 2), 0.002, wood(WALNUT_LIGHT));
    }
    // The seat: a board with a green cushion on it.
    s.box(P(0, seatY + 0.0175, 0), H(w, 0.035, d), 0.003, wood());
    s.box(P(0, seat - 0.01, 0.01), H(w - 0.06, 0.04, d - 0.06), 0.004, pad());
    // The back: two posts with brass caps, a top rail and three slats.
    const backZ = -(d / 2 - leg / 2), backH = 0.92 - seat;
    for (const x of [-1, 1]) {
      s.box(P(x * (w / 2 - leg / 2), seat + backH / 2, backZ), H(leg, backH, leg), 0.003, wood());
      s.box(P(x * (w / 2 - leg / 2), 0.93, backZ), H(leg + 0.012, 0.02, leg + 0.012), 0.002, brass);
    }
    s.box(P(0, 0.86, backZ), H(w - 0.02, 0.07, 0.03), 0.003, wood(WALNUT_LIGHT));
    for (const x of [-0.12, 0, 0.12]) s.box(P(x, 0.68, backZ), H(0.06, 0.3, 0.02), 0.002, wood());
  },
};

export const cafetable = {
  name: 'cafetable',
  cell: 0.005,
  bones: one,
  materials: MATERIALS,
  sculpt(s) {
    // A pedestal table: a walnut foot, a brass stem, a light top with a darker inlay.
    pedestal(s, 0, 0, { top: 0.7, base: 0.34, stem: 0.11 });
    s.box(P(0, 0.66, 0), H(1.35, 0.08, 0.9), 0.004, wood(WALNUT_LIGHT));
    s.box(P(0, 0.705, 0), H(1.25, 0.012, 0.8), 0.002, wood());
  },
};

export const cafestool = {
  name: 'cafestool',
  cell: 0.004,
  bones: one,
  materials: MATERIALS,
  sculpt(s) {
    // A counter stool: a green seat on a brass column, a footrest ring and a walnut foot.
    s.cylinder(P(0, 0.035, 0), R(0.25), R(0.03), { ...wood(), round: 0.003 });
    s.limb(P(0, 0.07, 0), P(0, 0.56, 0), R(0.06), R(0.045), brass);
    s.torus(P(0, 0.26, 0), R(0.21), R(0.018), brass);
    s.cylinder(P(0, 0.6, 0), R(0.26), R(0.045), { ...pad(), round: 0.006 });
  },
};

export const cafebooth = {
  name: 'cafebooth',
  cell: 0.0075,
  bones: one,
  materials: MATERIALS,
  sculpt(s) {
    // A booth two meters long: a walnut bench with a green cushion and a high back, a divider
    // at each end, and a pedestal table in front of it. The table is on +z, where the diners look.
    const length = 2.0;
    s.box(P(0, 0.15, -0.22), H(length + 0.08, 0.3, 1.05), 0.006, wood());
    s.box(P(0, 0.325, 0.08), H(length - 0.12, 0.07, 0.88), 0.008, pad(GREEN_LIGHT));
    s.box(P(0, 0.6, -0.72), H(length + 0.12, 0.8, 0.14), 0.008, pad());
    for (const x of [-1, 1]) {
      s.box(P(x * (length / 2 - 0.08), 0.4, -0.22), H(0.14, 0.44, 0.9), 0.006, wood());
      s.box(P(x * (length / 2 - 0.08), 0.65, -0.22), H(0.12, 0.07, 0.82), 0.006, pad());
    }
    pedestal(s, 0, 1.8, { top: 0.7, base: 0.3, stem: 0.11 });
    s.box(P(0, 0.66, 1.8), H(1.05, 0.08, 1.1), 0.004, wood(WALNUT_LIGHT));
    s.box(P(0, 0.705, 1.8), H(0.95, 0.012, 1.0), 0.002, wood());
  },
};

/** The café's furniture by name. */
export const CAFE = { cafechair, cafetable, cafestool, cafebooth };
