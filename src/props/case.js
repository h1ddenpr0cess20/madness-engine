import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';

/**
 * A road case: black textured laminate in an aluminium frame, an angle down
 * every edge and a chrome ball corner over every corner, the lid's joint
 * running round it in a bright extrusion; two butterfly latches on the
 * front, a recessed handle in each end; PICKS stencilled on the front in
 * white, FRAGILE in red on the lid, and a strip of gaffer tape with
 * BACKLINE written on it in marker. It holds picks. Sits on the floor
 * facing +z, half a tile across.
 */

const W = 0.24, D = 0.16, H = 0.34, JOINT = 0.255;   // half width, half depth, height, where the lid meets it
const LAM = rgb('#1c1c20'), LAM_HI = rgb('#2e2e34');
/** Laminate: a fine pebbled grain, black. */
const laminate = (p) => mix(LAM, LAM_HI, noise(p[0] * 520, p[1] * 520, p[2] * 520) * 0.8);
const ALU = rgb('#c4c8d0'), ALU_DARK = rgb('#80858e');
/** Brushed aluminium: streaked along the edge it runs down. */
const alu = (axis) => (p) => {
  const q = [p[0] * 900, p[1] * 900, p[2] * 900];
  q[axis] *= 0.02;
  return mix(ALU_DARK, ALU, 0.75 + 0.25 * noise(q[0], q[1], q[2]));
};
const chrome = (p) => mix(rgb('#9aa0aa'), rgb('#eef0f4'), 0.7 + 0.3 * noise(p[0] * 300, p[1] * 300, p[2] * 300));

export default {
  name: 'case',
  scale: 1.3,
  cell: 0.0068,
  budget: 104000,
  refine: 0.5,
  cells: { frame: 0.005, corners: 0.0032, hardware: 0.002, tape: 0.0022 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    laminate: { roughness: 0.62 },
    alu: { roughness: 0.32, metalness: 0.95 },
    chrome: { roughness: 0.14, metalness: 1 },
    rubber: { roughness: 0.85 },
    tape: { roughness: 0.45, metalness: 0.6 },
  },
  sculpt(s) {
    // The box: laminate over ply, its edges hidden under the frame.
    s.box([0, H / 2, 0], [W, H / 2, D], 0.004, { color: laminate, mat: 'laminate', k: 0 });

    // The stencils: PICKS across the front, FRAGILE on the lid's front, STAGE LEFT down one end.
    letters(s, 'PICKS', { at: [0, 0.1, D - 0.002], size: 0.06, width: 0.0062, color: '#ece8dc', depth: 0.006, spacing: 0.3 });
    letters(s, 'FRAGILE', { at: [-0.045, JOINT + 0.03, D - 0.002], size: 0.03, width: 0.0038, color: '#d82a2a', depth: 0.006, spacing: 0.28, aspect: 0.64 });
    letters(s, 'STAGE LEFT', { at: [W - 0.002, 0.12, 0], right: [0, 0, -1], up: [0, 1, 0], size: 0.026, width: 0.0034, color: '#ece8dc', depth: 0.006, spacing: 0.26, aspect: 0.62 });

    s.part('frame', () => {
      // Aluminium angle down every edge, a little proud of the faces.
      const E = 0.0115, T = 0.0028;
      for (const x of [-1, 1]) for (const z of [-1, 1]) s.box([x * W, H / 2, z * D], [E, H / 2, E], 0.002, { color: alu(1), mat: 'alu', k: 0 });
      for (const y of [0, H]) {
        for (const z of [-1, 1]) s.box([0, y, z * D], [W, E, E], 0.002, { color: alu(0), mat: 'alu', k: 0 });
        for (const x of [-1, 1]) s.box([x * W, y, 0], [E, E, D], 0.002, { color: alu(2), mat: 'alu', k: 0 });
      }
      // The lid joint: a band of extrusion round it, a dark seam along its middle.
      s.box([0, JOINT, 0], [W + T, 0.011, D + T], 0.002, { color: alu(0), mat: 'alu', k: 0 });
      s.box([0, JOINT, 0], [W + T + 0.002, 0.0012, D + T + 0.002], 0, { op: 'sub', k: 0 });
      // Hollow: only what shows outside the box is aluminium.
      s.box([0, H / 2, 0], [W - 0.004, H / 2 - 0.004, D - 0.004], 0, { op: 'sub', k: 0 });
    });
    const C = { color: chrome, mat: 'chrome', k: 0.001 };
    s.part('corners', () => {
      // Ball corners: a chrome cap pressed over each corner, hollow where the box is.
      for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) {
        s.box([x * (W + 0.002), y * H + (y ? 0.002 : -0.002), z * (D + 0.002)], [0.024, 0.024, 0.024], 0.015, C);
      }
      s.box([0, H / 2, 0], [W - 0.004, H / 2 - 0.004, D - 0.004], 0, { op: 'sub', k: 0 });
    });

    s.part('hardware', () => {
      // Rivets up the corner angles, on both faces.
      for (const x of [-1, 1]) for (const z of [-1, 1]) for (let y = 0.05; y < H - 0.03; y += 0.06) {
        if (Math.abs(y - JOINT) < 0.02) continue;
        s.sphere([x * (W + 0.0028), y, z * (D - 0.006)], 0.0022, C);
        s.sphere([x * (W - 0.006), y, z * (D + 0.0028)], 0.0022, C);
      }
      // Butterfly latches: a dished plate, the wings folded flat in it, the catch up onto the lid's keeper.
      for (const x of [-0.13, 0.13]) {
        const c = [x, JOINT - 0.028, D + 0.003];
        s.box(c, [0.03, 0.026, 0.003], 0.006, C);
        s.torus([x, c[1], D + 0.005], 0.017, 0.0022, { ...C, rot: [Math.PI / 2, 0, 0] });
        s.ellipsoid([x, c[1], D + 0.004], [0.015, 0.015, 0.002], { op: 'sub', k: 0.002 });
        // The wings: a bow, two lobes on a boss.
        for (const m of [-1, 1]) s.ellipsoid([x + m * 0.008, c[1], D + 0.005], [0.0085, 0.0055, 0.0018], { ...C, rot: [0, 0, m * 0.2] });
        s.cylinder([x, c[1], D + 0.006], 0.0035, 0.0015, { ...C, rot: [Math.PI / 2, 0, 0] });
        // The catch, and the keeper on the lid it hooks over.
        s.box([x, JOINT - 0.002, D + 0.0045], [0.006, 0.009, 0.0015], 0.0012, C);
        s.box([x, JOINT + 0.014, D + 0.003], [0.013, 0.007, 0.003], 0.003, C);
        s.box([x, JOINT + 0.01, D + 0.0065], [0.007, 0.0018, 0.002], 0.001, C);
      }
      // The handles, sunk in each end: a dish, and a bar lying in it.
      for (const m of [-1, 1]) {
        const c = [m * (W + 0.002), 0.2, 0];
        s.box(c, [0.004, 0.036, 0.075], 0.008, C);
        s.box([m * (W + 0.006), 0.2, 0], [0.004, 0.028, 0.066], 0.01, { op: 'sub', k: 0.002 });
        s.box([m * (W + 0.002), 0.2, 0], [0.0045, 0.009, 0.055], 0.0045, { color: '#1a1a1c', mat: 'rubber', k: 0.001 });
        for (const z of [-0.058, 0.058]) s.box([m * (W + 0.0015), 0.2, z], [0.004, 0.008, 0.006], 0.002, C);
      }
    });

    s.part('tape', () => {
      // A strip of gaffer tape across the lid's front, torn at both ends, with what's in it in marker.
      const y = JOINT + 0.056, x0 = 0.03, x1 = 0.205;
      s.shape((p) => {
        const tear = 0.002 * Math.sin(p[1] * 900) + 0.0015 * Math.sin(p[1] * 2300);
        const dx = Math.max(x0 + tear - p[0], p[0] - x1 - tear), dy = Math.abs(p[1] - y) - 0.016, dz = Math.abs(p[2] - D) - 0.0016;
        return Math.min(Math.max(dx, dy, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
      }, [[x0 - 0.01, y - 0.02, D - 0.004], [x1 + 0.01, y + 0.02, D + 0.004]], { color: (p) => mix(rgb('#8a8e96'), rgb('#b4b8c0'), noise(p[0] * 700, p[1] * 120, 0)), mat: 'tape', k: 0 });
      letters(s, 'BACKLINE', { at: [(x0 + x1) / 2, y - 0.008, D], size: 0.016, width: 0.0018, color: '#101014', depth: 0.004, spacing: 0.22, aspect: 0.62, slant: 0.18, wobble: 0.06 });
    });
  },
};
