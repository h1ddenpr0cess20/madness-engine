/**
 * The electric car: the freighter's little sibling, a compact EV drawn the same way: a low nose under a steeply raked
 * dark glass canopy that wraps the cabin, a dark valance and bumper, a light bar across the front with corners that turn
 * up the pillars, a lightning-bolt badge, a leaf on each side, a red light bar across the back and the freighter's alloy
 * wheels. It is built from plain shapes at real size, in metres, and drives through the same model as the freighter
 * (`vehicles/driving`) on numbers of its own: quicker, lighter on the brakes and tighter in the turns.
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
  /** Overall, from the tail to the nose, across the mirrors, and to the top of the canopy. */
  length: 4.53,
  width: 2.12,
  height: 1.57,
  /** The body is 1.84 m across. */
  bodyWidth: 1.84,
  tireRadius: 0.34,
  tireWidth: 0.235,
  /** Where the axles are along the car, front then back, from the origin (+z is forward). */
  axles: Object.freeze([2.8, 0]),
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
  wheelbase: 2.8,
  steerLock: 0.6,
  steerFade: 45,
  steerFadeMax: 0.65,
  steerRate: 8,
  maxStep: 0.05,
});

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
  const BEVEL = 0.05, ARCH = TIRE_R + kit.tread + 0.07 + BEVEL, FLOOR = 0.30 + BEVEL;
  const reach = Math.asin((FLOOR - WHEEL_Y) / ARCH);

  // ---------- body: a low nose, the wheel arches cut out of the side, up to the beltline; the glass canopy is the cabin above it ----------
  const body = new GFX.Shape();
  body.moveTo(-0.80, FLOOR);
  for (const z of [REAR, FRONT]) arc(body, z, WHEEL_Y, ARCH, Math.PI - reach, reach, { steps: 40 });
  body.lineTo(3.46, FLOOR);
  body.quadraticCurveTo(3.53, 0.36, 3.53, 0.62);
  body.lineTo(3.50, 0.77);
  body.quadraticCurveTo(3.45, 0.93, 3.05, 0.97);
  body.lineTo(2.55, 1.00);
  body.lineTo(2.40, 1.00);
  body.lineTo(-0.35, 1.00);
  body.quadraticCurveTo(-0.76, 1.00, -0.80, 0.90);
  add('body_shell', across(body, D.bodyWidth, BEVEL), M.white);

  // Dark glass canopy: the windshield sweep, the wrapped side glass, the roof and the back window.
  const canopy = new GFX.Shape();
  canopy.moveTo(2.58, 1.02);
  canopy.quadraticCurveTo(1.98, 1.10, 1.43, 1.46);
  canopy.quadraticCurveTo(1.31, 1.535, 1.10, 1.535);
  canopy.lineTo(-0.05, 1.515);
  canopy.quadraticCurveTo(-0.74, 1.42, -0.84, 1.02);
  add('glass_canopy', across(canopy, 1.78, 0.03), M.glass);

  // Mirror and camera pods.
  [-1, 1].forEach((s, i) => {
    add(`mirror_arm_${i ? 'r' : 'l'}`, new GFX.CylinderGeometry(0.016, 0.016, 0.13, 12), M.trim, [s * 0.97, 1.07, 2.02], [0, 0, Math.PI / 2]);
    add(`mirror_pod_${i ? 'r' : 'l'}`, box(0.06, 0.11, 0.13), M.trim, [s * 1.03, 1.07, 2.02]);
  });

  // ---------- front fascia: dark valance, bumper, light bar, badge ----------
  const valance = new GFX.Shape();
  valance.moveTo(3.20, FLOOR);
  valance.lineTo(3.46, FLOOR);
  valance.quadraticCurveTo(3.53, 0.36, 3.53, 0.62);
  valance.lineTo(3.50, 0.77);
  valance.quadraticCurveTo(3.46, 0.88, 3.30, 0.90);
  valance.lineTo(3.20, 0.90);
  add('front_valance', across(valance, 1.80, 0.06), M.trim);
  const bumperGeo = across(roundRectOf(GFX, 0.16, 0.17, 0.06), 1.88, 0);
  bumperGeo.translate(0, 0.43, 3.56);
  add('bumper', bumperGeo, M.trim);

  // The light bar: a wide strip across the middle and segments at the corners turning up the pillars.
  add('led_bar_centre', box(1.18, 0.065, 0.06), M.led, [0, 0.84, 3.56]);
  [-1, 1].forEach((s, i) => {
    add(`led_bar_wing_${i ? 'r' : 'l'}`, box(0.2, 0.065, 0.06), M.led, [s * 0.69, 0.865, 3.50], [0, s * 0.40, s * 0.18]);
    add(`headlamp_${i ? 'r' : 'l'}`, box(0.24, 0.06, 0.05), M.led, [s * 0.5, 0.66, 3.60]);
  });

  const bolt = new GFX.Shape();
  bolt.moveTo(0.07, 0.24); bolt.lineTo(-0.11, -0.02); bolt.lineTo(0.01, -0.02);
  bolt.lineTo(-0.06, -0.26); bolt.lineTo(0.12, 0.01); bolt.lineTo(0.00, 0.01);
  const boltGeo = new GFX.ExtrudeGeometry(bolt, { depth: 0.04, bevelEnabled: false });
  boltGeo.scale(0.6, 0.6, 1);
  add('bolt_badge', boltGeo, M.green, [0, 0.50, 3.575]);

  // ---------- the back: a light bar across the tail, a dark bumper ----------
  add('tail_bar', box(1.30, 0.055, 0.05), M.tail, [0, 1.02, -0.85]);
  add('rear_bumper', box(1.78, 0.14, 0.14), M.trim, [0, 0.45, -0.82]);

  // ---------- sides: the leaf badges and the dark skirts ----------
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
  add('leaf_badge_left', leafOf(1), M.green, [-0.935, 0.50, 1.35], [0, Math.PI / 2, 0.30]);
  add('leaf_badge_right', leafOf(-1), M.green, [0.935, 0.50, 1.35], [0, -Math.PI / 2, -0.30]);
  [-1, 1].forEach((s, i) => {
    add(`side_skirt_${i ? 'r' : 'l'}`, box(0.05, 0.14, 1.78), M.trim, [s * 0.915, 0.38, (REAR + FRONT) / 2]);
  });
  add('battery_pack', box(1.30, 0.10, 2.0), M.trim, [0, 0.25, (REAR + FRONT) / 2]);

  // ---------- wheels: the freighter's alloy face and lug holes, in a tub the arch opens onto ----------
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
