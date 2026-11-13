/**
 * The electric car: the freighter's little sibling, a compact cab-forward EV hatchback drawn the same way: a white body
 * under wrap-around black glass (a steeply raked windshield, side glass broken by one white pillar, a hatch window)
 * with a white roof floating over it, a dark face with a light bar across it that turns up the corners, a lightning-bolt
 * badge, a leaf on each side, a red light bar across the tail and the freighter's wheels. It is built from plain shapes
 * at real size, in metres, and drives through the same model as the freighter (`vehicles/driving`) on numbers of its
 * own: quicker, lighter on the brakes and tighter in the turns.
 *
 *     const car = createElectricCar(GFX, { paint: '#2c5fc8' });
 *     scene.add(car.group);
 *     stage.run((dt) => {
 *       car.update(dt, { throttle: keys.up, brake: keys.down, steer: keys.left - keys.right, handbrake: keys.space });
 *     });
 *
 * It faces +z with its wheels on the ground at y = 0, and its origin is on the ground at the back wheels, which is what
 * it turns about. Heading 0 drives toward +z; a positive heading, and a positive `steer`, turn it to the left. `scale`
 * sets how big a metre is in the game's units (0.41 sits it in the town's traffic).
 */

import { arc, across as acrossOf, roundRect as roundRectOf, wheelKit } from './parts.js';
import { attachDriving } from './driving.js';

/** The car's measures, in metres. */
export const ELECTRIC_CAR = Object.freeze({
  name: 'electric-car',
  /** Overall, from the tail to the nose, across the mirrors, and to the top of the roof. */
  length: 4.11,
  width: 2.07,
  height: 1.52,
  /** The body is 1.84 m across. */
  bodyWidth: 1.84,
  tireRadius: 0.36,
  tireWidth: 0.235,
  /** Where the axles are along the car, front then back, from the origin (+z is forward). */
  axles: Object.freeze([2.65, 0]),
  /** The front two steer. */
  steered: Object.freeze([0]),
  unit: 'm',
});

/** How it drives, in metres, seconds and radians (see `vehicles/driving` for what each is). 38 m/s is 137 km/h. */
export const ELECTRIC_CAR_DRIVE = Object.freeze({
  accel: 5.0,
  brake: 9.0,
  coast: 1.8,
  handbrake: 13,
  maxForward: 38,
  maxReverse: 8,
  wheelbase: 2.65,
  steerLock: 0.6,
  steerFade: 45,
  steerFadeMax: 0.65,
  steerRate: 8,
  maxStep: 0.05,
});

/** A point on the quadratic curve from `a` through control `c` to `b`, at t. */
const bezier = (a, c, b, t) => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

/**
 * @param {object} GFX The engine's graphics API.
 * @param {object} [options]
 * @param {number} [options.scale] Game units to the metre (default 1).
 * @param {number|string} [options.paint] The body's color (default near white).
 * @param {number|string} [options.accent] The green of the leaves and the bolt.
 * @param {'treaded'|'classic'} [options.wheels] The tires: rounded and treaded (default), or the plain square-edged ones it was first drawn with. The rim is the same either way.
 * @param {number|string} [options.light] The glow of the front light bar and the lamps.
 * @returns the car: `group` to add to the scene; `update(dt, input)`; `reset()`; the state (`speed`, `kmh`, `heading`,
 *   `steerAngle`); `wheels`, `steeredWheels` and the rest of the parts by name; `materials` and `dimensions`.
 */
export function createElectricCar(GFX, { scale = 1, paint = 0xf4f5f6, accent = 0x36a05a, light = 0x86ecff, wheels: wheelStyle = 'treaded' } = {}) {
  const M = {
    white: new GFX.MeshStandardMaterial({ name: 'body_white', color: paint, roughness: 0.30, metalness: 0.22 }),
    glass: new GFX.MeshStandardMaterial({ name: 'glass_dark', color: 0x0c1116, roughness: 0.42, metalness: 0.06 }),
    trim: new GFX.MeshStandardMaterial({ name: 'trim_charcoal', color: 0x22262a, roughness: 0.55, metalness: 0.22 }),
    tire: new GFX.MeshStandardMaterial({ name: 'tire_rubber', color: 0x18181a, roughness: 0.90, metalness: 0.04 }),
    rim: new GFX.MeshStandardMaterial({ name: 'rim_alloy', color: 0xdfe3e7, roughness: 0.26, metalness: 0.34 }),
    led: new GFX.MeshStandardMaterial({ name: 'led_light', color: 0xe8fbff, emissive: light, emissiveIntensity: 1.6, roughness: 0.2 }),
    tail: new GFX.MeshStandardMaterial({ name: 'tail_light', color: 0x2a0a0a, emissive: 0xff3b2a, emissiveIntensity: 1.4, roughness: 0.3 }),
    green: new GFX.MeshStandardMaterial({ name: 'accent_green', color: accent, roughness: 0.38, metalness: 0.08 }),
  };

  const D = ELECTRIC_CAR;
  const [FRONT, REAR] = D.axles;
  const TIRE_R = D.tireRadius, TIRE_W = D.tireWidth;
  const car = new GFX.Group();
  car.name = 'chassis';
  const parts = {};
  const add = (name, geo, mat, pos, rot) => {
    const m = new GFX.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    car.add(m);
    parts[name] = m;
    return m;
  };
  const box = (w, h, d) => new GFX.BoxGeometry(w, h, d);
  const across = (shape, width, bevel) => acrossOf(GFX, shape, width, bevel);

  const kit = wheelKit(GFX, M, { radius: TIRE_R, width: TIRE_W, style: wheelStyle });
  const WHEEL_Y = TIRE_R + kit.tread, WHEEL_X = 0.76;
  // The arch: the wheel's circle with a hand's breadth round it. (A profile is widened by its bevel when it is pushed
  // across, so it is drawn that much smaller, and its arch that much bigger.)
  const BEVEL = 0.03, ARCH = TIRE_R + kit.tread + 0.07 + BEVEL, FLOOR = 0.30 + BEVEL;
  const reach = Math.asin((FLOOR - WHEEL_Y) / ARCH);
  const BELT = 0.93;

  // ---------- body: the lower body only, up to the beltline, a short hood and a rounded nose, the arches cut out of the side ----------
  const body = new GFX.Shape();
  body.moveTo(-0.66, FLOOR);
  for (const z of [REAR, FRONT]) arc(body, z, WHEEL_Y, ARCH, Math.PI - reach, reach, { steps: 40 });
  body.lineTo(3.24, FLOOR);
  body.quadraticCurveTo(3.31, 0.33, 3.31, 0.58);
  body.lineTo(3.28, 0.70);
  body.quadraticCurveTo(3.25, 0.78, 3.12, 0.80);
  body.lineTo(2.80, 0.85);
  body.lineTo(2.58, BELT);
  body.lineTo(-0.40, BELT);
  body.quadraticCurveTo(-0.66, BELT, -0.68, 0.83);
  add('body_shell', across(body, D.bodyWidth, BEVEL), M.white);

  // ---------- the cabin: black glass wrapped round it, a white roof over it, one white pillar ----------
  // The windshield sweeps up steeply from the hood, over a rounded header and along the roof, then down the hatch.
  const W0 = [2.60, BELT], WC = [2.05, 1.07], W1 = [1.50, 1.39]; // the windshield
  const H0 = W1, HC = [1.40, 1.455], H1 = [1.20, 1.455]; // the header
  const R0 = H1, RC = [0.40, 1.48], R1 = [-0.25, 1.40]; // the roof
  const TC = [-0.52, 1.30], T1 = [-0.68, BELT]; // the hatch
  const canopy = new GFX.Shape();
  canopy.moveTo(...W0);
  canopy.quadraticCurveTo(...WC, ...W1);
  canopy.quadraticCurveTo(...HC, ...H1);
  canopy.quadraticCurveTo(...RC, ...R1);
  canopy.quadraticCurveTo(...TC, ...T1);
  add('glass_canopy', across(canopy, D.bodyWidth, 0.02), M.glass);

  // The roof panel, a white band riding the glass's top edge from the header to the hatch, a little narrower than the
  // glass so the black wraps under its edges.
  const top = [];
  for (const [a, c, b] of [[H0, HC, H1], [R0, RC, R1]]) for (let i = top.length && 1; i <= 16; i++) top.push(bezier(a, c, b, i / 16));
  const roof = new GFX.Shape();
  roof.moveTo(top[0][0], top[0][1] + 0.034);
  for (const [z, y] of top.slice(1)) roof.lineTo(z, y + 0.034);
  for (const [z, y] of [...top].reverse()) roof.lineTo(z, y - 0.018);
  add('roof_panel', across(roof, 1.72, 0.02), M.white);

  // The B pillars: a white strip down each side of the glass, a little raked.
  const pillar = new GFX.Shape();
  pillar.moveTo(1.02, BELT - 0.01); pillar.lineTo(0.90, BELT - 0.01); pillar.lineTo(0.80, 1.43); pillar.lineTo(0.94, 1.43);
  [-1, 1].forEach((s, i) => {
    const g = across(pillar, 0.026, 0);
    g.translate(s * 0.925, 0, 0);
    add(`pillar_${i ? 'r' : 'l'}`, g, M.white);
  });

  // Mirror and camera pods at the foot of the windshield.
  [-1, 1].forEach((s, i) => {
    add(`mirror_arm_${i ? 'r' : 'l'}`, new GFX.CylinderGeometry(0.014, 0.014, 0.08, 12), M.trim, [s * 0.96, 0.99, 2.46], [0, 0, Math.PI / 2]);
    add(`mirror_pod_${i ? 'r' : 'l'}`, box(0.07, 0.10, 0.15), M.trim, [s * 1.0, 1.01, 2.45]);
  });

  // ---------- the face: a dark fascia, a light bar across it, lamps, a chin, the bolt ----------
  const valance = new GFX.Shape();
  valance.moveTo(2.98, FLOOR);
  valance.lineTo(3.24, FLOOR);
  valance.quadraticCurveTo(3.31, 0.33, 3.31, 0.58);
  valance.lineTo(3.28, 0.70);
  valance.quadraticCurveTo(3.25, 0.76, 3.12, 0.78);
  valance.lineTo(2.98, 0.78);
  add('front_valance', across(valance, 1.80, 0.05), M.trim);
  const chin = across(roundRectOf(GFX, 0.07, 0.07, 0.025), 1.70, 0);
  chin.translate(0, 0.37, 3.345);
  add('bumper', chin, M.trim);

  // The light bar: a wide strip across the top of the face and segments at the corners turning up toward the glass.
  add('led_bar_centre', box(1.14, 0.08, 0.055), M.led, [0, 0.715, 3.35]);
  [-1, 1].forEach((s, i) => {
    add(`led_bar_wing_${i ? 'r' : 'l'}`, box(0.26, 0.08, 0.055), M.led, [s * 0.66, 0.74, 3.30], [0, s * 0.42, s * 0.2]);
    add(`headlamp_${i ? 'r' : 'l'}`, box(0.28, 0.06, 0.04), M.led, [s * 0.52, 0.52, 3.375]);
  });

  const bolt = new GFX.Shape();
  bolt.moveTo(0.07, 0.24); bolt.lineTo(-0.11, -0.02); bolt.lineTo(0.01, -0.02);
  bolt.lineTo(-0.06, -0.26); bolt.lineTo(0.12, 0.01); bolt.lineTo(0.00, 0.01);
  const boltGeo = new GFX.ExtrudeGeometry(bolt, { depth: 0.04, bevelEnabled: false });
  boltGeo.scale(0.5, 0.5, 1);
  add('bolt_badge', boltGeo, M.green, [0, 0.52, 3.355]);

  // ---------- the back: a light bar across the tail, a dark bumper ----------
  add('tail_bar', box(1.34, 0.06, 0.05), M.tail, [0, 0.78, -0.68]);
  add('rear_bumper', box(1.76, 0.12, 0.12), M.trim, [0, 0.43, -0.64]);

  // ---------- the sides: shut lines for the doors, handles, the leaf badges and the dark skirts ----------
  [-1, 1].forEach((s, i) => {
    const side = i ? 'r' : 'l';
    for (const z of [2.0, -0.10]) add(`door_line_${side}_${z > 1 ? 'f' : 'r'}`, box(0.012, 0.60, 0.012), M.trim, [s * 0.925, 0.63, z]);
    for (const z of [1.58, 0.34]) add(`door_handle_${side}_${z > 1 ? 'f' : 'r'}`, box(0.014, 0.026, 0.15), M.trim, [s * 0.926, 0.84, z]);
    add(`side_skirt_${side}`, box(0.05, 0.14, FRONT - REAR - 2 * (ARCH - BEVEL) - 0.04), M.trim, [s * 0.915, 0.38, (REAR + FRONT) / 2]);
  });
  const leafOf = (m) => {
    const leaf = new GFX.Shape();
    leaf.moveTo(0, 0);
    leaf.quadraticCurveTo(0.66 * m, 0.12, 0.78 * m, 0.84);
    leaf.quadraticCurveTo(0.12 * m, 0.70, 0, 0);
    const g = new GFX.ExtrudeGeometry(leaf, { depth: 0.02, bevelEnabled: false, curveSegments: 20 });
    g.scale(0.5, 0.5, 1);
    return g;
  };
  // Pushed into the body from its surface, each with its tip back and up.
  add('leaf_badge_left', leafOf(1), M.green, [-0.935, 0.42, 1.52], [0, Math.PI / 2, 0.30]);
  add('leaf_badge_right', leafOf(-1), M.green, [0.935, 0.42, 1.52], [0, -Math.PI / 2, -0.30]);
  add('battery_pack', box(1.30, 0.10, 1.9), M.trim, [0, 0.25, (REAR + FRONT) / 2]);

  // ---------- wheels: the freighter's, in a tub the arch opens onto ----------
  for (const z of D.axles) add(`wheel_tub_${z === FRONT ? 'f' : 'r'}`, box(2 * (WHEEL_X - 0.02), 0.5, 2 * (ARCH - BEVEL) + 0.04), M.trim, [0, 0.55, z]);
  const wheels = [], steeredWheels = [];
  D.axles.forEach((z, ai) => {
    [-1, 1].forEach((s) => {
      const side = s < 0 ? 'l' : 'r';
      const w = kit.make(`${ai}${side}0`, s);
      w.rotation.order = 'YXZ';
      w.position.set(s * WHEEL_X, WHEEL_Y, z);
      car.add(w);
      parts[w.name] = w;
      wheels.push(w);
      if (ai === 0) steeredWheels.push(w);
    });
  });

  const group = new GFX.Group();
  group.name = 'electric_car';
  group.add(car);
  group.scale.setScalar(scale);

  const api = {
    group, chassis: car, parts, wheels, steeredWheels, materials: M,
    dimensions: ELECTRIC_CAR, drive: ELECTRIC_CAR_DRIVE, scale,
  };
  return attachDriving(api, { group, wheels, steeredWheels, radius: TIRE_R, drive: ELECTRIC_CAR_DRIVE, scale });
}
