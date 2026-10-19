import { grainy } from '../models/skins.js';

/**
 * The traffic, sculpted: a sedan, a hatchback, a pickup, a box truck, a
 * tanker, and a rusted-out junker for the yard. Each faces +z with its
 * wheels on the ground at y = 0. The body is baked white and takes its
 * colour from its `paint` material, so one bake does every colour of car.
 */

const PAINT = { roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 };
const MATERIALS = {
  paint: PAINT,
  glass: { roughness: 0.04, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.02 },
  rubber: { roughness: 0.92 },
  chrome: { roughness: 0.14, metalness: 1 },
  alloy: { roughness: 0.32, metalness: 0.35, clearcoat: 0.6 },
  trim: { roughness: 0.55 },
  lamp: { roughness: 0.2, emissive: '#fff1c8', emissiveIntensity: 2.2 },
  tail: { roughness: 0.3, emissive: '#ff2a14', emissiveIntensity: 1.6 },
};
const WHITE = '#f4f4f4', GLASS = '#1a2230', TYRE = '#1b1b1d', CHROME = '#d8dce2', TRIM = '#26272b';

/** Four wheels: tyre, sidewall, hub and nuts, in arches cut out of the body. */
function wheels(s, at, r = 0.19, width = 0.075, cut = true) {
  for (const [x, z] of at) {
    if (cut) s.cylinder([x, r, z], r + 0.045, 0.2, { op: 'sub', k: 0.02, rot: [0, 0, Math.PI / 2] });
  }
  s.part('wheels', () => {
    for (const [x, z] of at) {
      const side = Math.sign(x);
      s.cylinder([x, r, z], r, width, { color: TYRE, mat: 'rubber', k: 0.004, round: 0.035, rot: [0, 0, Math.PI / 2] });
      s.cylinder([x + side * 0.02, r, z], r * 0.58, width, { color: CHROME, mat: 'chrome', k: 0.004, round: 0.012, rot: [0, 0, Math.PI / 2] });
      s.cylinder([x + side * 0.03, r, z], r * 0.22, width, { color: '#9aa0a8', mat: 'chrome', k: 0.004, round: 0.01, rot: [0, 0, Math.PI / 2] });
    }
  });
}

/** Head lamps and tail lamps, a grille, bumpers and a number plate. */
function ends(s, opts) {
  s.part('detail', () => endsDetail(s, opts));
}

function endsDetail(s, { hl, hw, y, front = true, back = true, grille = 0.22 }) {
  if (front) {
    s.box([0, y - 0.1, hl + 0.01], [hw * 0.98, 0.055, 0.045], 0.035, { color: CHROME, mat: 'chrome', k: 0.02 });
    s.box([0, y + 0.02, hl - 0.005], [grille, 0.055, 0.03], 0.015, { color: TRIM, mat: 'trim', k: 0.01 });
    s.mirror((m) => s.ellipsoid([m * hw * 0.68, y + 0.03, hl - 0.012], [0.09, 0.045, 0.035], { color: '#fff8e0', mat: 'lamp', k: 0.012 }));
    s.box([0, y - 0.1, hl + 0.055], [0.1, 0.03, 0.008], 0.004, { color: '#e8e6dc', mat: 'trim', k: 0.002 });
  }
  if (back) {
    s.box([0, y - 0.1, -hl - 0.01], [hw * 0.98, 0.055, 0.045], 0.035, { color: CHROME, mat: 'chrome', k: 0.02 });
    s.mirror((m) => s.box([m * hw * 0.72, y + 0.04, -hl + 0.01], [0.1, 0.04, 0.03], 0.015, { color: '#ff3a24', mat: 'tail', k: 0.01 }));
    s.box([0, y - 0.1, -hl - 0.055], [0.1, 0.03, 0.008], 0.004, { color: '#e8e6dc', mat: 'trim', k: 0.002 });
  }
}

/**
 * A shape with a side profile: the convex polygon `profile` ([z, y] points,
 * going round anticlockwise seen from +x) extruded `hw` either side of x = 0
 * and rounded by `round`. Cars are built from a few of these.
 */
function prism(s, profile, hw, round, o) {
  const edges = profile.map((a, i) => {
    const b = profile[(i + 1) % profile.length];
    const ez = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ez, ey);
    // Outward: the edge turned a quarter clockwise (the polygon goes anticlockwise).
    return { a, nz: ey / l, ny: -ez / l };
  });
  const zs = profile.map((p) => p[0]), ys = profile.map((p) => p[1]);
  const box = [[-hw - round, Math.min(...ys) - round, Math.min(...zs) - round], [hw + round, Math.max(...ys) + round, Math.max(...zs) + round]];
  return s.shape((p) => {
    let d = -Infinity;
    for (const e of edges) d = Math.max(d, (p[2] - e.a[0]) * e.nz + (p[1] - e.a[1]) * e.ny);
    const dx = Math.abs(p[0]) - (hw - round);
    const inner = Math.max(d + round, dx);
    return (inner > 0 ? Math.hypot(Math.max(d + round, 0), Math.max(dx, 0)) : inner) - round;
  }, box, o);
}

/**
 * A car, from the side: a body with a bonnet and a boot, a glasshouse on it
 * with a raked windscreen and rear window, the roof and the pillars in the
 * paint, wheels in their arches.
 */
function car(s, { L = 1.9, W = 0.95, roof = 0.8, belt = 0.55, front = 0.52, rear = -0.42, rake = 0.36, fall = 0.3, hatch = false, bed = false, rust = null }) {
  const hl = L / 2, hw = W / 2;
  const paint = rust ?? WHITE;
  const o = { color: paint, mat: 'paint', k: 0.03 };
  // The body: low at the nose, the bonnet rising to the scuttle, flat along the sides, the boot dropping away.
  const tail = hatch ? belt + 0.02 : belt - 0.02;
  prism(s, [[-hl, 0.17], [hl, 0.17], [hl, 0.42], [hl - 0.12, 0.49], [front, belt], [rear, belt], [-hl + 0.1, tail], [-hl, tail - 0.08]], hw, 0.07, o);
  // The glasshouse: windscreen raked back from the scuttle to the roof, rear window down to the boot.
  const g = [[rear, belt - 0.01], [front, belt - 0.01], [front - rake, roof], [rear + fall, roof]];
  if (hatch) g[0] = [-hl + 0.06, belt - 0.01], g[3] = [-hl + 0.16, roof];
  s.part('glass', () => prism(s, g, hw * 0.86, 0.05, { color: GLASS, mat: 'glass', k: 0.04 }));
  // The roof skin over it, and the pillars: A along the windscreen, B in the middle, C down the back.
  const rf = front - rake, rr = hatch ? -hl + 0.16 : rear + fall;
  s.part('glass', () => prism(s, [[rr - 0.01, roof - 0.04], [rf + 0.01, roof - 0.04], [rf, roof + 0.008], [rr, roof + 0.008]], hw * 0.87, 0.02, { ...o, k: 0.02 }));
  s.part('detail', () => s.mirror((m) => {
    const x = m * hw * 0.84;
    s.limb([x, belt, front - 0.02], [x, roof - 0.01, rf + 0.02], 0.03, 0.026, { ...o, k: 0.02 });
    s.limb([x, belt, (rf + rr) / 2 + 0.05], [x, roof - 0.01, (rf + rr) / 2 + 0.05], 0.028, 0.028, { ...o, k: 0.02 });
    s.limb([x, belt, hatch ? -hl + 0.08 : rear + 0.02], [x, roof - 0.01, rr - 0.02], 0.032, 0.028, { ...o, k: 0.02 });
    // Wing mirrors and door handles.
    s.box([m * (hw + 0.04), belt + 0.04, front - 0.08], [0.045, 0.03, 0.025], 0.015, { ...o, k: 0.01 });
    for (const z of [(rf + rr) / 2 + 0.16, rr + 0.1]) s.box([m * (hw + 0.006), belt - 0.05, z], [0.01, 0.012, 0.035], 0.006, { color: CHROME, mat: 'chrome', k: 0.004 });
  }));
  if (bed) {
    // A pickup's open bed behind the cab.
    s.box([0, 0.55, -hl * 0.5], [hw * 0.88, 0.12, hl * 0.47], 0.02, { op: 'sub', k: 0.02 });
    s.box([0, 0.44, -hl * 0.5], [hw * 0.86, 0.01, hl * 0.46], 0.005, { color: '#3a3a40', mat: 'trim', k: 0.004 });
  }
  ends(s, { hl, hw, y: 0.34 });
  wheels(s, [[-hw + 0.05, hl * 0.62], [hw - 0.05, hl * 0.62], [-hw + 0.05, -hl * 0.6], [hw - 0.05, -hl * 0.6]]);
}

const vehicle = (name, sculpt, extra = {}) => ({ name, cell: 0.045, cells: { wheels: 0.03, glass: 0.03, detail: 0.022 }, materials: MATERIALS, sculpt, ...extra });

export const sedan = vehicle('sedan', (s) => car(s, {}));
export const hatchback = vehicle('hatchback', (s) => car(s, { L: 1.7, roof: 0.84, front: 0.42, rake: 0.34, hatch: true }));
export const pickup = vehicle('pickup', (s) => car(s, { L: 2.1, W: 1.0, roof: 0.92, belt: 0.6, front: 0.62, rake: 0.3, rear: 0.0, fall: 0.06, bed: true }));
export const junker = vehicle('junker', (s) => {
  car(s, { rust: grainy('#8a4a2a', 0.35, 30) });
  // Dented, and sat low on flat tyres: the body cut into here and there.
  s.sphere([0.5, 0.5, 0.45], 0.14, { op: 'sub', k: 0.06 });
  s.sphere([-0.2, 0.92, -0.2], 0.16, { op: 'sub', k: 0.08 });
}, { materials: { ...MATERIALS, paint: { roughness: 0.85 }, glass: { roughness: 0.4, metalness: 0.2 }, lamp: { roughness: 0.6 }, tail: { roughness: 0.6 } } });

/** A cab-over truck: the cab at the front, the chassis rails, and behind it a box or a tank. */
function truck(s, { L, tank }) {
  const hl = L / 2, hw = 0.55;
  const cab = 1.0;
  // The cab: tall and blunt, glass across the front and down the doors.
  s.box([0, 0.78, hl - cab / 2], [hw, 0.5, cab / 2], 0.12, { color: WHITE, mat: 'paint', k: 0.03 });
  s.part('glass', () => {
    s.box([0, 1.0, hl - 0.005], [hw * 0.86, 0.17, 0.03], 0.04, { color: GLASS, mat: 'glass', k: 0.01 });
    s.mirror((m) => s.box([m * (hw + 0.002), 1.0, hl - cab * 0.33], [0.025, 0.16, cab * 0.24], 0.035, { color: GLASS, mat: 'glass', k: 0.01 }));
  });
  // A sun visor over the windscreen, marker lamps along it.
  s.box([0, 1.22, hl + 0.03], [hw * 0.9, 0.025, 0.06], 0.015, { color: WHITE, mat: 'paint', k: 0.01 });
  for (let i = -2; i <= 2; i++) s.sphere([i * 0.16, 1.27, hl + 0.02], 0.022, { color: '#ffb040', mat: 'lamp', k: 0.004 });
  s.box([0, 1.32, hl - cab / 2 - 0.05], [hw * 0.92, 0.06, cab * 0.4], 0.05, { color: WHITE, mat: 'paint', k: 0.04 });
  // Chassis rails, fuel tanks, mudguards.
  s.mirror((m) => {
    s.box([m * 0.32, 0.3, -cab / 2], [0.05, 0.06, hl - cab / 2], 0.02, { color: TRIM, mat: 'trim', k: 0.01 });
    s.cylinder([m * 0.44, 0.34, hl - cab - 0.35], 0.12, 0.25, { color: CHROME, mat: 'chrome', k: 0.01, round: 0.03, rot: [Math.PI / 2, 0, 0] });
  });
  ends(s, { hl, hw, y: 0.48, back: false, grille: 0.35 });
  if (tank) {
    // A polished tank on its cradles, a catwalk along the top, the hose cabinet.
    const tl = L - cab - 0.15;
    s.limb([0, 0.98, -hl + 0.2], [0, 0.98, -hl + 0.2 + tl - 0.4], 0.52, 0.52, { color: '#dfe3e8', mat: 'alloy', k: 0.02 });
    for (let z = -hl + 0.5; z < hl - cab - 0.3; z += 0.9) s.torus([0, 0.98, z], 0.53, 0.025, { color: '#9aa0a8', mat: 'alloy', k: 0.006, rot: [Math.PI / 2, 0, 0] });
    s.box([0, 1.52, -hl + tl / 2], [0.12, 0.02, tl / 2 - 0.3], 0.01, { color: '#8a8f96', mat: 'trim', k: 0.006 });
    s.box([0, 0.55, -hl + tl * 0.45], [hw * 0.95, 0.12, 0.35], 0.04, { color: '#c8382c', mat: 'paint', k: 0.02 });
    s.paint((p) => Math.max(Math.abs(p[1] - 0.98) - 0.1, p[2] - (hl - cab - 0.1)), '#c8382c', 0.01);
  } else {
    // A box body, ribbed, with a roller door at the back.
    const bl = L - cab - 0.08;
    s.box([0, 1.05, -hl + bl / 2], [hw + 0.02, 0.62, bl / 2], 0.04, { color: '#eceae4', mat: 'trim', k: 0.02 });
    s.part('detail', () => {
      s.mirror((m) => {
        for (let z = -hl + 0.2; z < -hl + bl; z += 0.32) s.box([m * (hw + 0.03), 1.05, z], [0.015, 0.6, 0.02], 0.008, { color: '#d0cec8', mat: 'trim', k: 0.004 });
      });
      for (let y = 0.55; y < 1.65; y += 0.15) s.box([0, y, -hl - 0.01], [hw * 0.92, 0.015, 0.015], 0.008, { color: '#b8b6b0', mat: 'trim', k: 0.003 });
    });
    s.mirror((m) => s.box([m * hw * 0.8, 0.52, -hl + 0.005], [0.08, 0.035, 0.02], 0.01, { color: '#ff3a24', mat: 'tail', k: 0.006 }));
  }
  const back = -hl + 0.55;
  wheels(s, [[-hw + 0.04, hl - 0.55], [hw - 0.04, hl - 0.55], [-hw + 0.04, back], [hw - 0.04, back], [-hw + 0.04, back + 0.5], [hw - 0.04, back + 0.5]], 0.22, 0.08, false);
}

export const boxtruck = vehicle('boxtruck', (s) => truck(s, { L: 2.7 }), { cell: 0.05 });
export const tanker = vehicle('tanker', (s) => truck(s, { L: 4.2, tank: true }), { cell: 0.055 });

/** Which model each kind of traffic is drawn with. */
export const VEHICLES = { sedan, hatchback, pickup, junker, boxtruck, tanker };
