import { grainy } from '../models/skins.js';

/**
 * The traffic, sculpted: a sedan, a hatchback, a pickup, a box truck, a
 * tanker, and a rusted-out junker for the yard. Each faces +z with its
 * wheels on the ground at y = 0. The body is baked white and takes its
 * colour from its `paint` material, so one bake does every colour of car.
 *
 * The wheels go round. Each definition says where its wheels are
 * (`wheels`: their hubs, how big, which steer) and which wheel it rolls on
 * (`wheel`, a definition of its own: `wheel` or `truckwheel`); its `body`
 * is the same vehicle with the wheels left off. `mountWheels` stands the
 * wheels on a body's mesh and turns them as it drives. The definition
 * itself keeps its wheels, still, for the far off and the parked.
 */

const PAINT = { roughness: 0.26, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 };
const MATERIALS = {
  paint: PAINT,
  glass: { roughness: 0.03, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.02 },
  rubber: { roughness: 0.9 },
  chrome: { roughness: 0.12, metalness: 1 },
  alloy: { roughness: 0.3, metalness: 0.6, clearcoat: 0.6 },
  trim: { roughness: 0.55 },
  lamp: { roughness: 0.15, clearcoat: 1, emissive: '#fff1c8', emissiveIntensity: 2.2 },
  tail: { roughness: 0.2, clearcoat: 1, emissive: '#ff2a14', emissiveIntensity: 1.6 },
};
const WHITE = '#f4f4f4', GLASS = '#141b26', TYRE = '#1c1c1f', CHROME = '#d8dce2', TRIM = '#202125', SHUT = '#3c3d42', BLACKOUT = '#121316';

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

// ——————————————————————————————————————— shapes

/** The distance from (u, v) to the polygon `pts` ([u, v] corners, either way round), negative inside (Inigo Quilez's). */
function sdPoly(u, v, pts) {
  let d = (u - pts[0][0]) ** 2 + (v - pts[0][1]) ** 2, s = 1;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
    const ex = pts[j][0] - pts[i][0], ey = pts[j][1] - pts[i][1];
    const wx = u - pts[i][0], wy = v - pts[i][1];
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = v >= pts[i][1], c2 = v < pts[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/** Two distances, inside both, the corner between them rounded by `r`: an extrusion's edge. */
const rounded = (a, b, r) => Math.min(Math.max(a + r, b + r), 0) + Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) - r;

/**
 * A side profile ([z, y] corners) extruded `hw` either side of x = 0, every
 * edge and corner rounded by `round`. `taper` draws the sides in as they
 * rise (the tumblehome of a glasshouse): `hw` is the width at the bottom.
 * `grow` puts the surface that much further out (a skin over it).
 */
function sideField(pts, hw, round, { taper = 0, grow = 0 } = {}) {
  const base = Math.min(...pts.map((q) => q[1])), k = 1 / Math.hypot(1, taper);
  return (p) => rounded(sdPoly(p[2], p[1], pts), (Math.abs(p[0]) - hw + taper * (p[1] - base)) * k, round) - grow;
}
const sideBox = (pts, hw, m = 0.05) => [
  [-hw - m, Math.min(...pts.map((q) => q[1])) - m, Math.min(...pts.map((q) => q[0])) - m],
  [hw + m, Math.max(...pts.map((q) => q[1])) + m, Math.max(...pts.map((q) => q[0])) + m],
];
function side(s, pts, hw, round, o, shape = {}) {
  return s.shape(sideField(pts, hw, round, shape), sideBox(pts, hw), o);
}

/** A plan ([x, z] corners) extruded from y0 to y1, rounded by `round`. */
function plan(s, pts, y0, y1, round, o) {
  const ym = (y0 + y1) / 2, hh = (y1 - y0) / 2;
  const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
  return s.shape((p) => rounded(sdPoly(p[0], p[2], pts), Math.abs(p[1] - ym) - hh, round),
    [[Math.min(...xs) - 0.05, y0 - 0.05, Math.min(...zs) - 0.05], [Math.max(...xs) + 0.05, y1 + 0.05, Math.max(...zs) + 0.05]], o);
}

/** A plan with its corners cut: `hw` across, `hl` long, the nose drawn in to `nose` of the width over `fr`, the tail to `tail` over `rr`. */
const outline = (hw, hl, { nose = 0.86, fr = 0.2, tail = 0.9, rr = 0.14 } = {}) => [
  [-hw * nose, hl], [hw * nose, hl], [hw, hl - fr], [hw, -hl + rr], [hw * tail, -hl], [-hw * tail, -hl], [-hw, -hl + rr], [-hw, hl - fr],
];

/** A cylinder across the car (its axis along x) at [z, y], radius r, out to |x| = hw, kept only above `above`. */
function across(s, z, y, r, hw, o, above = -Infinity) {
  return s.shape((p) => Math.max(Math.hypot(p[1] - y, p[2] - z) - r, Math.abs(p[0]) - hw, above - p[1]),
    [[-hw - 0.01, y - r - 0.01, z - r - 0.01], [hw + 0.01, y + r + 0.01, z + r + 0.01]], o);
}

/** A box from corner a to corner b, rounded by r. */
const slab = (s, a, b, r, o) => s.box([0, 1, 2].map((i) => (a[i] + b[i]) / 2), [0, 1, 2].map((i) => Math.abs(b[i] - a[i]) / 2), r, o);

// ——————————————————————————————————————— wheels

/**
 * A wheel round the x axis at c, its face to `side` (+1: +x): the tyre with
 * its shoulders rounded, and in it a car's alloy (five spokes, the brake
 * dark behind them, a cap and nuts) or a truck's steel wheel (a dished disc
 * with its hand holes, a big hub, a ring of nuts).
 */
function tyre(s, c, r, w, side, { steel = false } = {}) {
  const [cx, cy, cz] = c, face = cx + side * w / 2;
  const turn = { rot: [0, 0, Math.PI / 2] };
  s.cylinder(c, r, w / 2, { color: TYRE, mat: 'rubber', k: 0.004, round: w * 0.38, ...turn });
  // The sidewall, and the rim dished into it.
  s.torus([face - side * w * 0.12, cy, cz], r * 0.8, w * 0.1, { color: '#26262a', mat: 'rubber', k: 0.006, rot: [0, 0, Math.PI / 2] });
  s.cylinder([face, cy, cz], r * 0.67, w * 0.32, { op: 'sub', k: 0.006, ...turn });
  const at = (a, rr, x) => [x, cy + Math.cos(a) * rr, cz + Math.sin(a) * rr];
  if (steel) {
    const disc = face - side * w * 0.2;
    s.torus([face - side * w * 0.14, cy, cz], r * 0.64, r * 0.045, { color: '#c4c8cc', mat: 'alloy', k: 0.004, rot: [0, 0, Math.PI / 2] });
    s.cylinder([disc, cy, cz], r * 0.64, w * 0.06, { color: '#b8bcc2', mat: 'alloy', k: 0.006, ...turn });
    for (let i = 0; i < 6; i++) s.cylinder(at((i / 6) * Math.PI * 2, r * 0.44, disc), r * 0.08, w * 0.12, { op: 'sub', k: 0.004, ...turn });
    s.cylinder([disc + side * w * 0.06, cy, cz], r * 0.26, w * 0.1, { color: '#9aa0a8', mat: 'alloy', k: 0.006, round: 0.01, ...turn });
    for (let i = 0; i < 8; i++) s.sphere(at((i / 8) * Math.PI * 2, r * 0.19, disc + side * w * 0.16), r * 0.035, { color: CHROME, mat: 'chrome', k: 0.002 });
    s.cylinder([disc + side * w * 0.2, cy, cz], r * 0.1, w * 0.06, { color: CHROME, mat: 'chrome', k: 0.004, round: 0.008, ...turn });
    return;
  }
  const back = face - side * w * 0.3;
  // The brake behind the spokes, dark; the rim's lip; five spokes; the hub, its cap and nuts.
  s.cylinder([back, cy, cz], r * 0.62, w * 0.05, { color: BLACKOUT, mat: 'trim', k: 0.004, ...turn });
  s.torus([face - side * w * 0.1, cy, cz], r * 0.63, r * 0.05, { color: CHROME, mat: 'chrome', k: 0.004, rot: [0, 0, Math.PI / 2] });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    s.box(at(a, r * 0.36, face - side * w * 0.17), [w * 0.1, r * 0.27, r * 0.075], 0.006, { color: '#c8ccd2', mat: 'alloy', k: 0.006, rot: [a, 0, 0] });
  }
  s.cylinder([face - side * w * 0.16, cy, cz], r * 0.2, w * 0.13, { color: '#b8bcc4', mat: 'alloy', k: 0.006, round: 0.008, ...turn });
  for (let i = 0; i < 5; i++) s.sphere(at((i / 5) * Math.PI * 2 + 0.63, r * 0.12, face - side * w * 0.04), r * 0.028, { color: CHROME, mat: 'chrome', k: 0.002 });
  s.sphere([face - side * w * 0.06, cy, cz], r * 0.07, { color: CHROME, mat: 'chrome', k: 0.004 });
}

/** The wheels where `wheels` says, in their own part. */
function fitWheels(s, wheels, steel) {
  s.part('wheels', () => {
    for (const { at, r, width, side: face } of wheels) tyre(s, at, r, width, face, { steel });
  });
}

/** A wheel by itself, its hub at the origin, its face to +x: for `mountWheels`. */
const wheelDef = (name, r, width, steel) => ({
  name, r, width, bones: [['root', null, [0, 0, 0]]], cell: 0.022, materials: MATERIALS,
  sculpt: (s) => tyre(s, [0, 0, 0], r, width, 1, { steel }),
});
export const wheel = wheelDef('wheel', 0.17, 0.085, false);
export const truckwheel = wheelDef('truckwheel', 0.21, 0.1, true);
const WHEELS = { wheel, truckwheel };

/**
 * Wheels that go round, on a body (the definition's `body`, baked without
 * them). `mesh` is the wheel's mesh to copy (`{ geometry, material }`,
 * baked from the definition's `wheel`); the copies go in `group`, to add to
 * the body's mesh. `drive(distance, turned)` turns them by how far the
 * vehicle went since the last call (in its own units, as sculpted) and how
 * far it turned about y while it did (radians, + to the left): they roll,
 * and the front ones steer.
 */
export function mountWheels(GFX, def, { geometry, material }) {
  const w = WHEELS[def.wheel];
  const group = new GFX.Group();
  group.name = `${def.name}-wheels`;
  const wheels = def.wheels.map(({ at, r, width, side: face, steer }) => {
    const hub = new GFX.Group();
    hub.position.set(...at);
    const spin = new GFX.Mesh(geometry, material);
    spin.castShadow = true;
    spin.scale.set(width / w.width, r / w.r, r / w.r);
    // A wheel on the left faces −x: turned round, it spins the other way about its own axis.
    const flip = new GFX.Group();
    if (face < 0) flip.rotation.y = Math.PI;
    flip.add(spin);
    hub.add(flip);
    group.add(hub);
    return { hub, spin, r, face, steer };
  });
  // The wheelbase: from the front axle to the middle of the ones behind it.
  const rear = def.wheels.filter((q) => !q.steer);
  const base = Math.max(...def.wheels.map((q) => q.at[2])) - rear.reduce((t, q) => t + q.at[2], 0) / rear.length;
  let steer = 0;
  return {
    group,
    drive(distance, turned = 0) {
      if (distance) {
        // The angle the front wheels would need to make that turn, eased toward.
        const want = clamp(Math.atan2(turned * base, Math.abs(distance)), -0.55, 0.55);
        steer += (want - steer) * 0.25;
      }
      for (const q of wheels) {
        q.spin.rotation.x += (distance / q.r) * q.face;
        if (q.steer) q.hub.rotation.y = steer;
      }
    },
  };
}

// ——————————————————————————————————————— cars

/**
 * A car from its numbers: `L` long and `W` wide, `body` its side profile
 * up to the beltline, `cabin` the glasshouse's (drawn in by `taper` as it
 * rises), `belt` and `roof` the heights the windows run between, `pillars`
 * where the B (and any C) pillars stand, `doors` where the shut lines run,
 * the wheels at `axles` (front, back) of radius `r`; `lamps` the height of
 * the lamps, and a `bed` for a pickup.
 */
function wheelsOf({ W, axles, r, width, x }) {
  const hw = W / 2, wx = x ?? hw - width / 2 - 0.018;
  return axles.flatMap((z, i) => [1, -1].map((m) => ({ at: [m * wx, r, z], r, width, side: m, steer: i === 0 })));
}

function car(s, spec, { withWheels = true, rust = null } = {}) {
  const { L, W, body, cabin, taper, belt, roof, pillars, doors, r, lamps: ly, bed } = spec;
  const hl = L / 2, hw = W / 2;
  const paint = rust ?? WHITE;
  const o = { color: paint, mat: 'paint', k: 0.02 };
  const wheels = wheelsOf(spec);

  // The body: its profile, the corners of its plan rounded off, the glasshouse on it, the arches flared and cut.
  side(s, body, hw, 0.045, o);
  plan(s, outline(hw, hl + 0.01, spec.plan), -1, 3, 0.06, { op: 'inter', k: 0.03 });
  const cab = sideField(cabin, spec.cabinHw ?? hw - 0.025, 0.05, { taper });
  s.shape(cab, sideBox(cabin, hw), { ...o, k: 0.025 });
  for (const z of spec.axles) across(s, z, r, r + 0.07, hw + 0.012, { ...o, k: 0.02 }, r * 0.85);
  for (const z of spec.axles) across(s, z, r, r + 0.03, hw + 0.1, { op: 'sub', k: 0.015 });
  if (bed) {
    // A pickup's open bed behind the cab, its floor ribbed, the tailgate's handle.
    slab(s, [-hw + 0.075, bed.floor, -hl + 0.075], [hw - 0.075, belt + 0.2, bed.front], 0.02, { op: 'sub', k: 0.015 });
  }
  // Shut lines: the doors, the bonnet, the boot or the hatch; the fuel flap.
  const sideOnly = (p) => hw - 0.06 - Math.abs(p[0]);
  for (const [z, y0, y1] of doors) s.paint((p) => Math.max(Math.abs(p[2] - z) - 0.005, Math.abs(p[1] - (y0 + y1) / 2) - (y1 - y0) / 2, sideOnly(p)), SHUT, 0.004);
  if (spec.bonnet) s.paint((p) => Math.max(Math.abs(p[2] - spec.bonnet) - 0.005, Math.abs(p[0]) - hw + 0.05, belt - 0.12 - p[1]), SHUT, 0.004);
  if (spec.boot) s.paint((p) => Math.max(Math.abs(p[2] - spec.boot) - 0.005, Math.abs(p[0]) - hw + 0.05, belt - 0.12 - p[1]), SHUT, 0.004);
  s.paint((p) => Math.max(Math.hypot(p[1] - (belt - 0.07), p[2] - spec.fuel) - 0.03, hw - 0.03 - p[0]), SHUT, 0.004);
  // The B pillars blacked out, as a modern car's are.
  for (const z of pillars) s.paint((p) => Math.max(Math.abs(p[2] - z) - 0.028, belt + 0.01 - p[1], p[1] - roof + 0.03, 0.25 - Math.abs(p[0])), BLACKOUT, 0.004);

  // The glass: a skin over the glasshouse wherever a window is, leaving the pillars, the roof and the sills in the paint.
  const mid = (Math.max(...cabin.map((q) => q[0])) + Math.min(...cabin.map((q) => q[0]))) / 2;
  const cabTop = (p) => (spec.cabinHw ?? hw - 0.025) - taper * (p[1] - Math.min(...cabin.map((q) => q[1])));
  // (Only a shell of it: the inside of the block would be meshed for nothing.)
  const skin = (p) => Math.max(cab(p) - 0.012, -cab(p) - 0.035);
  const band = (p) => Math.max(belt + 0.035 - p[1], p[1] - roof + 0.04);
  const sideWindow = (p) => {
    let d = Math.max(sdPoly(p[2], p[1], cabin) + 0.05, band(p), 0.2 - Math.abs(p[0]));
    for (const z of pillars) d = Math.max(d, 0.03 - Math.abs(p[2] - z));
    return Math.max(skin(p), d);
  };
  const screen = (front) => (p) => Math.max(skin(p), band(p), Math.abs(p[0]) - cabTop(p) + 0.075, front ? mid + 0.04 - p[2] : p[2] - mid + 0.04);
  const box = sideBox(cabin, hw);
  s.part('glass', () => {
    for (const d of [sideWindow, screen(true), screen(false)]) s.shape(d, box, { color: GLASS, mat: 'glass', k: 0.008 });
  });

  s.part('wells', () => {
    // Dark wheel wells inside the arches, so the arches don't show the body's inside.
    for (const z of spec.axles) {
      s.shape((p) => Math.max(Math.hypot(p[1] - r, p[2] - z) - r - 0.026, Math.abs(Math.abs(p[0]) - hw + 0.08) - 0.05, r * 0.55 - p[1]),
        [[-hw, r * 0.5, z - r - 0.04], [hw, 2 * r + 0.04, z + r + 0.04]], { color: '#141416', mat: 'trim', k: 0.01 });
    }
  });

  s.part('detail', () => {
    const nose = hl + 0.005, tail = -hl - 0.005;
    // Head lamps under clear lenses at the corners of the nose, the grille between them, a chrome bar over it.
    s.mirror((m) => {
      slab(s, [m * hw * 0.47, ly - 0.036, nose - 0.07], [m * hw * 0.9, ly + 0.036, nose - 0.012], 0.02, { color: '#34363c', mat: 'chrome', k: 0.004 });
      slab(s, [m * hw * 0.51, ly - 0.025, nose - 0.05], [m * hw * 0.86, ly + 0.025, nose + 0.012], 0.016, { color: '#fff8e4', mat: 'lamp', k: 0.002 });
      slab(s, [m * hw * 0.74, ly - 0.1, nose - 0.06], [m * hw * 0.88, ly - 0.072, nose + 0.004], 0.01, { color: '#ffb040', mat: 'lamp', k: 0.004 });
    });
    slab(s, [-hw * 0.42, ly - 0.05, nose - 0.06], [hw * 0.42, ly + 0.035, nose - 0.005], 0.015, { color: TRIM, mat: 'trim', k: 0.006 });
    for (let i = 0; i < 3; i++) slab(s, [-hw * 0.4, ly - 0.035 + i * 0.03, nose - 0.02], [hw * 0.4, ly - 0.025 + i * 0.03, nose + 0.002], 0.004, { color: '#5a5e66', mat: 'chrome', k: 0.002 });
    slab(s, [-hw * 0.44, ly + 0.035, nose - 0.04], [hw * 0.44, ly + 0.05, nose + 0.004], 0.006, { color: CHROME, mat: 'chrome', k: 0.004 });
    // The lower air dam, the bumpers' black rubbing strips, round the corners.
    slab(s, [-hw * 0.7, spec.sill + 0.02, nose - 0.08], [hw * 0.7, spec.sill + 0.07, nose + 0.002], 0.02, { color: TRIM, mat: 'trim', k: 0.008 });
    for (const [z0, z1] of [[nose - 0.03, nose + 0.012], [tail - 0.012, tail + 0.03]]) slab(s, [-hw * 0.9, ly - 0.13, z0], [hw * 0.9, ly - 0.1, z1], 0.012, { color: TRIM, mat: 'trim', k: 0.006 });
    // Tail lamps round the back corners, a reversing lamp in each, a third light high in the back window.
    const ty = spec.tailY ?? ly + 0.04, th = spec.tailH ?? 0.035, tw = bed ? 0.8 : 0.58;
    s.mirror((m) => {
      slab(s, [m * hw * tw, ty - th, tail - 0.004], [m * (hw - 0.01), ty + th, tail + 0.05], 0.015, { color: '#d8241a', mat: 'tail', k: 0.006 });
      if (!bed) slab(s, [m * (hw - 0.02), ty - th + 0.005, tail + 0.04], [m * (hw + 0.004), ty + th - 0.005, tail + 0.11], 0.012, { color: '#d8241a', mat: 'tail', k: 0.006 });
      slab(s, [m * hw * (tw - 0.12), ty - th + 0.005, tail - 0.003], [m * hw * (tw - 0.02), ty - th + 0.035, tail + 0.03], 0.006, { color: '#f4f2ee', mat: 'trim', k: 0.003 });
    });
    // Number plates.
    for (const [z, out] of [[nose, 1], [tail, -1]]) slab(s, [-0.1, ly - 0.1 + (out < 0 ? 0.04 : 0), z - 0.004], [0.1, ly - 0.05 + (out < 0 ? 0.04 : 0), z + out * 0.012], 0.004, { color: '#ecebe2', mat: 'trim', k: 0.002 });
    // The exhaust, out under the back.
    s.cylinder([hw * 0.55, spec.sill + 0.04, tail + 0.02], 0.022, 0.05, { color: CHROME, mat: 'chrome', k: 0.004, round: 0.008, rot: [Math.PI / 2, 0, 0] });
    // Black sills between the arches.
    s.mirror((m) => slab(s, [m * (hw - 0.03), spec.sill, spec.axles[1] + r + 0.05], [m * (hw + 0.006), spec.sill + 0.05, spec.axles[0] - r - 0.05], 0.015, { color: TRIM, mat: 'trim', k: 0.006 }));
    // Wing mirrors on their stalks at the foot of the windscreen, door handles, the aerial.
    const mz = Math.max(...cabin.map((q) => q[0])) - 0.08;
    s.mirror((m) => {
      s.limb([m * (hw - 0.04), belt + 0.03, mz], [m * (hw + 0.02), belt + 0.045, mz - 0.025], 0.02, 0.018, { ...o, k: 0.008 });
      s.box([m * (hw + 0.04), belt + 0.055, mz - 0.035], [0.042, 0.03, 0.022], 0.016, { ...o, k: 0.008 });
      s.box([m * (hw + 0.05), belt + 0.055, mz - 0.012], [0.026, 0.02, 0.004], 0.004, { color: '#8a9aa8', mat: 'chrome', k: 0.002 });
      for (const [z] of doors.slice(1)) s.box([m * (hw + 0.004), belt - 0.05, z + 0.08], [0.008, 0.01, 0.035], 0.006, { color: CHROME, mat: 'chrome', k: 0.003 });
    });
    if (bed) {
      const z0 = -hl + 0.075, z1 = bed.front;
      // The bed's floor and its ribs, the rails along its sides, the tailgate handle.
      slab(s, [-hw + 0.08, bed.floor, z0], [hw - 0.08, bed.floor + 0.012, z1], 0.004, { color: '#2a2b30', mat: 'trim', k: 0.004 });
      for (let x = -hw + 0.14; x < hw - 0.1; x += 0.1) slab(s, [x - 0.012, bed.floor, z0 + 0.02], [x + 0.012, bed.floor + 0.024, z1 - 0.02], 0.006, { color: '#34353a', mat: 'trim', k: 0.004 });
      s.mirror((m) => slab(s, [m * (hw - 0.08), belt - 0.006, z0 - 0.02], [m * (hw - 0.005), belt + 0.016, z1], 0.008, { color: TRIM, mat: 'trim', k: 0.004 }));
      slab(s, [-0.09, belt - 0.07, tail - 0.01], [0.09, belt - 0.04, tail + 0.01], 0.008, { color: TRIM, mat: 'trim', k: 0.003 });
    }
  });
  if (withWheels) fitWheels(s, wheels, false);
}

const SEDAN = {
  L: 1.9, W: 0.95, r: 0.17, width: 0.085, axles: [0.58, -0.56], belt: 0.53, roof: 0.8, lamps: 0.37, sill: 0.13, taper: 0.22,
  body: [[-0.93, 0.13], [0.9, 0.13], [0.955, 0.2], [0.962, 0.33], [0.93, 0.42], [0.42, 0.5], [0.34, 0.52], [-0.6, 0.535], [-0.9, 0.52], [-0.955, 0.45], [-0.962, 0.24]],
  cabin: [[0.42, 0.47], [0.05, 0.785], [-0.36, 0.8], [-0.64, 0.545], [-0.68, 0.47]],
  pillars: [-0.12], doors: [[0.34, 0.15, 0.53], [-0.12, 0.15, 0.53], [-0.52, 0.38, 0.53]], bonnet: 0.36, boot: -0.66, fuel: -0.72,
};
const HATCHBACK = {
  L: 1.7, W: 0.93, r: 0.165, width: 0.082, axles: [0.53, -0.53], belt: 0.53, roof: 0.83, lamps: 0.38, sill: 0.13, taper: 0.2, tailY: 0.5,
  body: [[-0.83, 0.13], [0.8, 0.13], [0.855, 0.2], [0.862, 0.33], [0.83, 0.43], [0.34, 0.51], [0.27, 0.525], [-0.8, 0.545], [-0.85, 0.5], [-0.862, 0.24]],
  cabin: [[0.34, 0.47], [-0.02, 0.81], [-0.62, 0.83], [-0.82, 0.6], [-0.84, 0.47]],
  plan: { tail: 0.92, rr: 0.1 },
  pillars: [-0.2], doors: [[0.27, 0.15, 0.53], [-0.2, 0.15, 0.53], [-0.56, 0.38, 0.53]], bonnet: 0.28, boot: null, fuel: -0.64,
};
const PICKUP = {
  L: 2.1, W: 1.0, r: 0.19, width: 0.1, axles: [0.66, -0.64], belt: 0.6, roof: 0.9, lamps: 0.44, sill: 0.17, taper: 0.12,
  body: [[-1.03, 0.17], [1.0, 0.17], [1.055, 0.27], [1.062, 0.42], [1.03, 0.52], [0.5, 0.58], [0.42, 0.6], [-1.0, 0.6], [-1.055, 0.57], [-1.062, 0.3]],
  cabin: [[0.46, 0.56], [0.15, 0.88], [-0.2, 0.9], [-0.26, 0.86], [-0.28, 0.56]], cabinHw: 0.475,
  pillars: [], doors: [[0.4, 0.2, 0.6], [-0.26, 0.2, 0.6]], bonnet: 0.42, boot: null, fuel: -0.5, tailY: 0.46, tailH: 0.09,
  bed: { floor: 0.4, front: -0.33 },
};

/** The full vehicle and its `body` without the wheels. */
function vehicle(name, sculpt, spec, extra = {}) {
  const def = {
    name, bones: [['root', null, [0, 0, 0]]], cell: 0.045, cells: { wheels: 0.026, glass: 0.024, detail: 0.022, wells: 0.04, fittings: 0.032 }, materials: MATERIALS,
    wheels: wheelsOf(spec), wheel: spec.wheel ?? 'wheel',
    sculpt: (s) => sculpt(s, { withWheels: true }), ...extra,
  };
  def.body = { ...def, name: `${name}-body`, sculpt: (s) => sculpt(s, { withWheels: false }) };
  return def;
}

export const sedan = vehicle('sedan', (s, o) => car(s, SEDAN, o), SEDAN);
export const hatchback = vehicle('hatchback', (s, o) => car(s, HATCHBACK, o), HATCHBACK);
export const pickup = vehicle('pickup', (s, o) => car(s, PICKUP, o), PICKUP);
export const junker = vehicle('junker', (s, o) => {
  car(s, SEDAN, { ...o, rust: grainy('#8a4a2a', 0.35, 30) });
  // Dented: a crumpled wing, a stoved-in roof, a door caved in.
  s.sphere([0.5, 0.52, 0.62], 0.13, { op: 'sub', k: 0.06 });
  s.sphere([-0.15, 0.95, -0.2], 0.2, { op: 'sub', k: 0.08 });
  s.sphere([-0.62, 0.32, 0.1], 0.18, { op: 'sub', k: 0.08 });
  // Primer on the bonnet.
  s.paint((p) => Math.max(p[2] - 0.95, 0.36 - p[2], 0.45 - p[1]), '#6a6e70', 0.02);
}, SEDAN, { materials: { ...MATERIALS, paint: { roughness: 0.85 }, glass: { roughness: 0.4, metalness: 0.2 }, lamp: { roughness: 0.6 }, tail: { roughness: 0.6 } } });

// ——————————————————————————————————————— trucks

/**
 * A cab-over truck: the cab at the front over the front wheels, the
 * chassis behind it on dual wheels, and on that a box with a roller door
 * or a fuel tank with a catwalk along its top.
 */
function truck(s, spec, { withWheels = true } = {}) {
  const { L, tank } = spec;
  const hl = L / 2, hw = spec.W / 2, cab = 0.95, front = hl, back = hl - cab;
  const o = { color: WHITE, mat: 'paint', k: 0.02 };
  const wheels = truckWheels(spec);
  const cabProfile = [[back, 0.3], [front - 0.03, 0.3], [front + 0.005, 0.4], [front + 0.005, 0.74], [front - 0.05, 1.3], [front - 0.14, 1.38], [back, 1.38]];
  const cabField = sideField(cabProfile, hw, 0.08, { taper: 0.03 });
  s.shape(cabField, sideBox(cabProfile, hw), o);
  plan(s, outline(hw, hl + 0.01, { nose: 0.9, fr: 0.12, tail: 1, rr: 0.01 }), 0.2, 1.5, 0.05, { op: 'inter', k: 0.02 });
  across(s, spec.axles[0], spec.r, spec.r + 0.04, hw + 0.1, { op: 'sub', k: 0.015 });
  // The door shut lines, the grille's panel.
  for (const z of [front - 0.1, front - 0.62]) s.paint((p) => Math.max(Math.abs(p[2] - z) - 0.005, 0.48 - p[1], p[1] - 1.3, hw - 0.05 - Math.abs(p[0])), SHUT, 0.004);
  // The glass: the windscreen across the front, the door windows, a small one behind each door.
  const skin = (p) => Math.max(cabField(p) - 0.012, -cabField(p) - 0.04);
  const screen = (p) => Math.max(skin(p), Math.abs(p[0]) - hw + 0.08, 0.86 - p[1], p[1] - 1.27, front - 0.2 - p[2]);
  const doorGlass = (p) => Math.max(skin(p), hw - 0.12 - Math.abs(p[0]), 0.86 - p[1], p[1] - 1.24, Math.abs(p[2] - (front - 0.36)) - 0.2);
  s.part('glass', () => {
    for (const d of [screen, doorGlass]) s.shape(d, sideBox(cabProfile, hw), { color: GLASS, mat: 'glass', k: 0.008 });
  });
  s.part('wells', () => s.shape((p) => Math.max(Math.hypot(p[1] - spec.r, p[2] - spec.axles[0]) - spec.r - 0.035, Math.abs(Math.abs(p[0]) - hw + 0.09) - 0.06, spec.r * 0.6 - p[1]),
    [[-hw, spec.r * 0.5, spec.axles[0] - spec.r - 0.05], [hw, 2 * spec.r + 0.05, spec.axles[0] + spec.r + 0.05]], { color: '#141416', mat: 'trim', k: 0.01 }));

  s.part('detail', () => {
    // The grille and its bars, the lamps either side, the steel bumper, the steps under the doors.
    slab(s, [-hw * 0.6, 0.48, front - 0.02], [hw * 0.6, 0.76, front + 0.02], 0.02, { color: TRIM, mat: 'trim', k: 0.006 });
    for (let y = 0.52; y < 0.74; y += 0.05) slab(s, [-hw * 0.56, y, front + 0.005], [hw * 0.56, y + 0.018, front + 0.03], 0.006, { color: CHROME, mat: 'chrome', k: 0.003 });
    s.mirror((m) => {
      slab(s, [m * hw * 0.66, 0.5, front - 0.01], [m * (hw - 0.03), 0.62, front + 0.025], 0.02, { color: '#fff8e4', mat: 'lamp', k: 0.006 });
      slab(s, [m * hw * 0.68, 0.65, front - 0.01], [m * (hw - 0.05), 0.7, front + 0.02], 0.012, { color: '#ffb040', mat: 'lamp', k: 0.004 });
      // Steps up to the door, and a grab handle.
      for (const y of [0.24, 0.4]) slab(s, [m * (hw - 0.08), y, back + 0.01], [m * (hw + 0.005), y + 0.03, back + 0.17], 0.008, { color: '#5a5e66', mat: 'alloy', k: 0.004 });
      s.limb([m * (hw + 0.02), 0.78, back + 0.14], [m * (hw + 0.02), 1.15, back + 0.14], 0.012, 0.012, { color: CHROME, mat: 'chrome', k: 0.004 });
      // The big mirrors on their arms.
      s.limb([m * (hw - 0.02), 1.0, front - 0.12], [m * (hw + 0.12), 1.02, front - 0.16], 0.012, 0.012, { color: TRIM, mat: 'trim', k: 0.004 });
      s.limb([m * (hw - 0.02), 1.22, front - 0.12], [m * (hw + 0.12), 1.2, front - 0.16], 0.012, 0.012, { color: TRIM, mat: 'trim', k: 0.004 });
      s.box([m * (hw + 0.14), 1.11, front - 0.17], [0.02, 0.12, 0.04], 0.012, { color: TRIM, mat: 'trim', k: 0.004 });
      s.box([m * (hw + 0.14), 1.11, front - 0.135], [0.016, 0.105, 0.004], 0.004, { color: '#8a9aa8', mat: 'chrome', k: 0.002 });
    });
    slab(s, [-hw - 0.01, 0.3, front - 0.02], [hw + 0.01, 0.43, front + 0.05], 0.03, { color: '#6a6e76', mat: 'alloy', k: 0.008 });
    slab(s, [-0.12, 0.33, front + 0.04], [0.12, 0.4, front + 0.06], 0.004, { color: '#ecebe2', mat: 'trim', k: 0.002 });
    // A sun visor over the windscreen, marker lamps along the roof.
    slab(s, [-hw * 0.9, 1.29, front - 0.08], [hw * 0.9, 1.32, front + 0.04], 0.012, { ...o, k: 0.006 });
    for (let i = -2; i <= 2; i++) s.ellipsoid([i * 0.14, 1.335, front - 0.02], [0.03, 0.016, 0.016], { color: '#ffb040', mat: 'lamp', k: 0.004 });
    tailEnd(s, -hl, hw, 0.42);
  });
  // The chassis and what it carries: the bigger fittings, on a coarser grid than the lamps'.
  s.part('fittings', () => {
    // The chassis rails behind the cab, the fuel tank, the battery box, the exhaust stack up the back of the cab.
    s.mirror((m) => slab(s, [m * 0.24, 0.28, -hl + 0.02], [m * 0.34, 0.4, back], 0.01, { color: TRIM, mat: 'trim', k: 0.006 }));
    s.cylinder([hw - 0.12, 0.3, back - 0.3], 0.1, 0.22, { color: CHROME, mat: 'chrome', k: 0.006, round: 0.03, rot: [Math.PI / 2, 0, 0] });
    for (const z of [back - 0.46, back - 0.14]) s.torus([hw - 0.12, 0.3, z], 0.102, 0.008, { color: '#5a5e66', mat: 'trim', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    slab(s, [-hw + 0.03, 0.3, back - 0.5], [-hw + 0.24, 0.48, back - 0.16], 0.02, { color: '#34363c', mat: 'trim', k: 0.006 });
    s.cylinder([-hw + 0.12, 1.1, back - 0.06], 0.035, 0.42, { color: CHROME, mat: 'chrome', k: 0.006, round: 0.01 });
    s.cylinder([-hw + 0.12, 1.53, back - 0.06], 0.04, 0.02, { color: '#2a2b30', mat: 'trim', k: 0.004 });
    // Mud flaps behind the back wheels.
    s.mirror((m) => slab(s, [m * (hw - 0.22), 0.06, spec.axles.at(-1) - spec.r - 0.1], [m * (hw - 0.02), 0.42, spec.axles.at(-1) - spec.r - 0.08], 0.006, { color: '#1a1a1c', mat: 'rubber', k: 0.004 }));

    if (tank) {
      // An elliptical tank on its cradles, banded; the manlids along the top, the catwalk and its rail, the hose cabinet.
      const t0 = -hl + 0.1, t1 = back - 0.1, ty = 0.98, sq = 0.82;
      s.part('cargo', () => s.shape((p) => {
        const z = clamp(p[2], t0 + 0.42, t1 - 0.42);
        const dz = p[2] - z;
        return (Math.hypot(p[0], (p[1] - ty) / sq, dz) - 0.52) * sq;
      }, [[-0.6, ty - 0.5, t0 - 0.1], [0.6, ty + 0.5, t1 + 0.1]], { color: '#e4e7ec', mat: 'alloy', k: 0.01 }));
      for (let z = t0 + 0.4; z < t1 - 0.3; z += 0.7) s.shape((p) => Math.max(Math.abs(Math.hypot(p[0], (p[1] - ty) / sq) - 0.53) - 0.02, Math.abs(p[2] - z) - 0.032), [[-0.6, ty - 0.5, z - 0.05], [0.6, ty + 0.5, z + 0.05]], { color: '#9aa0a8', mat: 'alloy', k: 0.004 });
      for (let z = t0 + 0.55; z < t1 - 0.3; z += 0.7) s.cylinder([0, ty + 0.43, z], 0.09, 0.03, { color: '#b8bcc2', mat: 'alloy', k: 0.006, round: 0.01 });
      slab(s, [-0.12, ty + 0.47, t0 + 0.3], [0.12, ty + 0.49, t1 - 0.2], 0.006, { color: '#7a8088', mat: 'trim', k: 0.004 });
      s.part('detail', () => s.mirror((m) => {
        for (let z = t0 + 0.3; z <= t1 - 0.2; z += 0.6) s.limb([m * 0.14, ty + 0.48, z], [m * 0.14, ty + 0.62, z], 0.013, 0.013, { color: '#e8b020', mat: 'trim', k: 0.003 });
        s.limb([m * 0.14, ty + 0.62, t0 + 0.3], [m * 0.14, ty + 0.62, t1 - 0.2], 0.013, 0.013, { color: '#e8b020', mat: 'trim', k: 0.003 });
        s.box([m * 0.52, ty - 0.18, t0 + 0.6], [0.02, 0.07, 0.07], 0.006, { color: '#e07a2a', mat: 'trim', k: 0.004, rot: [Math.PI / 4, 0, 0] });
      }));
      s.mirror((m) => slab(s, [m * 0.18, 0.4, t0 + 1.4], [m * (hw - 0.02), 0.62, t0 + 2.0], 0.02, { color: '#c8382c', mat: 'trim', k: 0.006 }));
      s.mirror((m) => slab(s, [m * (hw - 0.03), 0.58, t0 + 1.45], [m * (hw - 0.012), 0.6, t0 + 1.95], 0.004, { color: '#8a2a20', mat: 'trim', k: 0.002 }));
      // The red band along the tank, the hazard placards.
      s.paint((p) => Math.max(Math.abs(p[1] - ty) - 0.05, p[2] - t1 + 0.05, 0.3 - Math.abs(p[0])), '#c8382c', 0.008);
      s.part('detail', () => s.box([0, ty - 0.12, t0 - 0.105], [0.07, 0.07, 0.015], 0.006, { color: '#e07a2a', mat: 'trim', k: 0.004, rot: [0, 0, Math.PI / 4] }));
      // The cradles.
      for (const z of [t0 + 0.5, t1 - 0.4]) slab(s, [-0.4, 0.4, z - 0.06], [0.4, 0.62, z + 0.06], 0.02, { color: TRIM, mat: 'trim', k: 0.006 });
    } else {
      // A box body on the chassis: its corner posts and rails in aluminium, ribbed along the sides, a roller door at the back.
      const b0 = -hl + 0.01, b1 = back - 0.06, y0 = 0.44, y1 = 1.62, bw = hw + 0.02;
      s.part('cargo', () => slab(s, [-bw + 0.01, y0, b0 + 0.01], [bw - 0.01, y1, b1], 0.03, { color: '#eceae4', mat: 'trim', k: 0.01 }));
      for (const [x, z] of [[1, b0], [-1, b0], [1, b1], [-1, b1]]) slab(s, [x * bw - 0.03, y0, z - 0.02], [x * bw + 0.012 * x, y1 + 0.01, z + 0.03], 0.01, { color: '#b8bcc2', mat: 'alloy', k: 0.004 });
      for (const y of [y0, y1]) slab(s, [-bw - 0.01, y - 0.03, b0], [bw + 0.01, y + 0.03, b1], 0.012, { color: '#b8bcc2', mat: 'alloy', k: 0.004 });
      s.mirror((m) => {
        for (let z = b0 + 0.24; z < b1 - 0.1; z += 0.24) slab(s, [m * (bw - 0.01), y0 + 0.03, z - 0.012], [m * (bw + 0.012), y1 - 0.03, z + 0.012], 0.006, { color: '#d6d4ce', mat: 'trim', k: 0.003 });
        s.ellipsoid([m * (bw + 0.012), y0 + 0.08, (b0 + b1) / 2], [0.01, 0.018, 0.03], { color: '#ffb040', mat: 'lamp', k: 0.002 });
      });
      for (let y = y0 + 0.06; y < y1 - 0.04; y += 0.08) slab(s, [-bw + 0.05, y, b0 - 0.012], [bw - 0.05, y + 0.02, b0 + 0.02], 0.008, { color: '#cfcdc6', mat: 'trim', k: 0.003 });
      slab(s, [-0.06, y0 + 0.04, b0 - 0.03], [0.06, y0 + 0.08, b0], 0.006, { color: TRIM, mat: 'trim', k: 0.003 });
      // The wind deflector over the cab, up to the box's height.
      s.part('cargo', () => side(s, [[back + 0.02, 1.36], [back + 0.4, 1.36], [back + 0.04, y1 - 0.02]], hw * 0.82, 0.03, { color: '#eceae4', mat: 'trim', k: 0.01 }));
    }
  });
  if (withWheels) fitWheels(s, wheels, true);
}

/** The back of a truck: the underride bar, the lamps on it, the plate. */
function tailEnd(s, z, hw, y) {
  slab(s, [-hw + 0.04, y - 0.18, z - 0.02], [hw - 0.04, y - 0.12, z + 0.04], 0.01, { color: '#e8b020', mat: 'trim', k: 0.004 });
  s.mirror((m) => s.limb([m * 0.3, y - 0.15, z + 0.01], [m * 0.3, y, z + 0.05], 0.014, 0.014, { color: TRIM, mat: 'trim', k: 0.004 }));
  s.mirror((m) => {
    slab(s, [m * (hw - 0.2), y - 0.04, z - 0.015], [m * (hw - 0.04), y + 0.03, z + 0.03], 0.012, { color: '#d8241a', mat: 'tail', k: 0.004 });
    slab(s, [m * (hw - 0.27), y - 0.035, z - 0.012], [m * (hw - 0.21), y + 0.025, z + 0.03], 0.008, { color: '#ffb040', mat: 'lamp', k: 0.004 });
  });
  slab(s, [-0.1, y - 0.07, z - 0.01], [0.1, y - 0.02, z + 0.02], 0.004, { color: '#ecebe2', mat: 'trim', k: 0.002 });
}

const BOXTRUCK = { L: 2.7, W: 1.1, r: 0.21, width: 0.1, wheel: 'truckwheel', axles: [0.8, -0.62] };
const TANKER = { L: 4.2, W: 1.1, r: 0.21, width: 0.1, wheel: 'truckwheel', axles: [1.55, -1.12, -1.6], tank: true };

/** A truck's wheels: one at each end of the front axle; two side by side at each end of the others. */
function truckWheels(spec) {
  const hw = spec.W / 2, outer = hw - spec.width / 2 - 0.02, inner = outer - spec.width - 0.012;
  return spec.axles.flatMap((z, i) => [1, -1].flatMap((m) => (i === 0 ? [outer] : [outer, inner]).map((x, j) => ({
    at: [m * x, spec.r, z], r: spec.r, width: spec.width, side: m, steer: i === 0 && j === 0,
  }))));
}

function truckDef(name, spec, extra) {
  const def = vehicle(name, (s, o) => truck(s, spec, o), spec, extra);
  def.wheels = def.body.wheels = truckWheels(spec);
  return def;
}
const TRUCK_CELLS = { wheels: 0.03, glass: 0.03, detail: 0.024, wells: 0.04, fittings: 0.034 };
export const boxtruck = truckDef('boxtruck', BOXTRUCK, { cell: 0.05, cells: TRUCK_CELLS });
export const tanker = truckDef('tanker', TANKER, { cell: 0.055, cells: TRUCK_CELLS });

/** Which model each kind of traffic is drawn with. */
export const VEHICLES = { sedan, hatchback, pickup, junker, boxtruck, tanker };
