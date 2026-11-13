/**
 * The electric freighter: a cab-over delivery truck with a low raked nose, a dark glass canopy, a light bar
 * across the front, a white cargo box with green leaf badges, and four axles (the two at the front steer, the two
 * at the back run on duals). It is built from plain shapes at real size, in metres, as the putter and the swords are,
 * and it drives: `update(dt, input)` is the model it was made with.
 *
 *     const freighter = createFreighter(GFX);
 *     scene.add(freighter.group);
 *     stage.run((dt) => {
 *       freighter.update(dt, { throttle: keys.up, brake: keys.down, steer: keys.left - keys.right, handbrake: keys.space });
 *     });
 *
 * It faces +z with its wheels on the ground at y = 0, as the town's vehicles (`scenery/vehicles`) do, and its origin is
 * on the ground at the back wheels, which is what it turns about. Heading 0 drives toward +z; a positive heading, and
 * a positive `steer`, turn it to the left.
 *
 * `scale` sets how big a metre is in the game's units (the traffic is about 0.4 of a tile to the metre, so a freighter
 * there is `scale: 0.41`). The driving is worked out in metres and seconds and put in the game's units on the way out:
 * its speed, its turning circle and its look are the same at any scale.
 */

/** The truck's measures, in metres. */
export const FREIGHTER = Object.freeze({
  name: 'freighter',
  /** Overall, from the rear doors' back to the bumper's front, across the mirrors, and to the top of the canopy. */
  length: 10.61,
  width: 3.0,
  height: 3.99,
  /** The cargo box and the cab are 2.5 m across. */
  bodyWidth: 2.5,
  tireRadius: 0.6,
  tireWidth: 0.345,
  /** Where the axles are along the truck, front to back, from the origin (+z is forward). */
  axles: Object.freeze([8.0, 6.55, 1.25, -0.55]),
  /** The two at the front steer; the two at the back are doubled and fixed. */
  steered: Object.freeze([0, 1]),
  unit: 'm',
});

/**
 * How it drives, in metres, seconds and radians. Speeds are m/s (22 is 79 km/h); `accel`, `brake`, `coast` and
 * `handbrake` are m/s² (the brake is also reverse); `steerLock` is the angle the wheels turn to at a standstill and
 * `steerFade` the speed at which the lock has shrunk by `steerFadeMax` of itself at most; `steerRate` is how quickly the
 * wheels follow the stick, per second.
 */
export const FREIGHTER_DRIVE = Object.freeze({
  accel: 6.5,
  brake: 7.5,
  coast: 2.2,
  handbrake: 12,
  maxForward: 22,
  maxReverse: 6,
  wheelbase: 7.28,
  steerLock: 0.46,
  steerFade: 26,
  steerFadeMax: 0.62,
  steerRate: 7,
  /** The longest step it will take at once, in seconds: a hitch in the frame rate doesn't throw it. */
  maxStep: 0.05,
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * @param {object} GFX The engine's graphics API.
 * @param {object} [options]
 * @param {number} [options.scale] Game units to the metre (default 1).
 * @param {number|string} [options.paint] The body's color (default near white).
 * @param {number|string} [options.accent] The green of the leaves and the bolt.
 * @param {number|string} [options.light] The glow of the light bar and the lamps.
 * @returns the freighter: `group` to add to the scene; `update(dt, input)`; `reset()`; the state (`speed`, `kmh`,
 *   `heading`, `steerAngle`); `wheels`, `steeredWheels` and the rest of the parts by name; `materials` and `dimensions`.
 */
export function createFreighter(GFX, { scale = 1, paint = 0xf4f5f6, accent = 0x36a05a, light = 0x86ecff } = {}) {
  const M = {
    white: new GFX.MeshStandardMaterial({ name: 'body_white', color: paint, roughness: 0.30, metalness: 0.22 }),
    glass: new GFX.MeshStandardMaterial({ name: 'glass_dark', color: 0x0c1116, roughness: 0.42, metalness: 0.06 }),
    trim: new GFX.MeshStandardMaterial({ name: 'trim_charcoal', color: 0x22262a, roughness: 0.55, metalness: 0.22 }),
    tire: new GFX.MeshStandardMaterial({ name: 'tire_rubber', color: 0x18181a, roughness: 0.90, metalness: 0.04 }),
    rim: new GFX.MeshStandardMaterial({ name: 'rim_alloy', color: 0xdfe3e7, roughness: 0.26, metalness: 0.34 }),
    led: new GFX.MeshStandardMaterial({ name: 'led_light', color: 0xe8fbff, emissive: light, emissiveIntensity: 1.6, roughness: 0.2 }),
    green: new GFX.MeshStandardMaterial({ name: 'accent_green', color: accent, roughness: 0.38, metalness: 0.08 }),
  };

  // The truck is drawn nose to −z, as it was made; `facing` turns it to face +z.
  const truck = new GFX.Group();
  const parts = {};
  const add = (name, geo, mat, pos, rot) => {
    const m = new GFX.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    truck.add(m);
    parts[name] = m;
    return m;
  };
  const box = (w, h, d) => new GFX.BoxGeometry(w, h, d);
  const roundRect = (w, h, r) => {
    const s = new GFX.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  /** A longitudinal side profile pushed across the width of the vehicle. `width` is the finished width: the bevel widens the profile outward by `bevel`. */
  const across = (shape, width, bevel) => {
    const depth = width - 2 * bevel;
    const g = new GFX.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel * 0.7,
      bevelSize: bevel, bevelSegments: 6, curveSegments: 32,
    });
    g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0);
    return g;
  };

  // ---------- cab: low nose, steeply raked canopy ----------
  const cab = new GFX.Shape();
  cab.moveTo(-3.48, 1.30);
  cab.lineTo(-5.62, 1.30);
  cab.quadraticCurveTo(-5.90, 1.32, -5.90, 1.72);
  cab.lineTo(-5.84, 2.22);
  cab.quadraticCurveTo(-5.68, 2.88, -5.04, 3.60);
  cab.quadraticCurveTo(-4.86, 3.62, -4.58, 3.62);
  cab.lineTo(-3.48, 3.62);
  add('cab_shell', across(cab, 2.44, 0.18), M.white);

  // Dark glass canopy: the windshield sweep, the wrapped side glass and the roof.
  const canopy = new GFX.Shape();
  canopy.moveTo(-6.00, 2.10);
  canopy.quadraticCurveTo(-5.84, 2.80, -5.16, 3.56);
  canopy.quadraticCurveTo(-4.96, 3.86, -4.58, 3.87);
  canopy.lineTo(-3.22, 3.87);
  canopy.lineTo(-3.22, 2.62);
  canopy.lineTo(-5.04, 2.62);
  const canopyGeo = across(canopy, 2.40, 0.06);
  canopyGeo.translate(0, 0, -0.055);
  add('glass_canopy', canopyGeo, M.glass);

  // Mirror and camera pods.
  [-1, 1].forEach((s, i) => {
    add(`mirror_arm_${i ? 'r' : 'l'}`, new GFX.CylinderGeometry(0.032, 0.032, 0.26, 16), M.trim, [s * 1.32, 3.05, -5.00], [0, 0, Math.PI / 2]);
    add(`mirror_pod_${i ? 'r' : 'l'}`, box(0.10, 0.30, 0.15), M.trim, [s * 1.45, 3.05, -5.00]);
  });

  // ---------- front fascia: dark valance, light bar, badge ----------
  const valance = new GFX.Shape();
  valance.moveTo(-6.00, 1.32);
  valance.quadraticCurveTo(-6.03, 1.62, -5.96, 1.96);
  valance.lineTo(-5.55, 1.96);
  valance.lineTo(-5.55, 1.32);
  add('front_valance', across(valance, 2.40, 0.12), M.trim);
  const bumperGeo = across(roundRect(0.30, 0.30, 0.11), 2.46, 0);
  bumperGeo.translate(0, 1.32, -6.16);
  add('bumper', bumperGeo, M.trim);

  // The light bar: a wide strip across the middle and segments at the corners turning up the pillars.
  add('led_bar_centre', box(1.82, 0.13, 0.10), M.led, [0, 1.86, -6.18]);
  [-1, 1].forEach((s, i) => {
    add(`led_bar_wing_${i ? 'r' : 'l'}`, box(0.30, 0.13, 0.09), M.led, [s * 1.04, 1.90, -6.10], [0, s * 0.40, s * 0.18]);
    add(`headlamp_${i ? 'r' : 'l'}`, box(0.36, 0.10, 0.08), M.led, [s * 0.84, 1.64, -6.14]);
  });

  const bolt = new GFX.Shape();
  bolt.moveTo(0.07, 0.24); bolt.lineTo(-0.11, -0.02); bolt.lineTo(0.01, -0.02);
  bolt.lineTo(-0.06, -0.26); bolt.lineTo(0.12, 0.01); bolt.lineTo(0.00, 0.01);
  add('bolt_badge', new GFX.ExtrudeGeometry(bolt, { depth: 0.04, bevelEnabled: false }), M.green, [0, 1.62, -6.18]);

  // ---------- cargo body: a rounded box ----------
  const bodyGeo = new GFX.ExtrudeGeometry(roundRect(2.50, 2.86, 0.20), {
    depth: 7.05, bevelEnabled: false, curveSegments: 20,
  });
  bodyGeo.translate(0, 0, -3.00);
  add('cargo_body', bodyGeo, M.white, [0, 2.55, 0]);
  add('body_front_wall', box(2.34, 2.50, 0.26), M.trim, [0, 2.44, -2.96]);
  add('rear_doors', box(2.36, 2.56, 0.08), M.trim, [0, 2.52, 4.07]);
  add('rear_bumper', box(2.28, 0.20, 0.26), M.trim, [0, 1.10, 4.00]);
  [-1, 1].forEach((s, i) => {
    add(`rub_rail_${i ? 'r' : 'l'}`, box(0.05, 0.09, 6.70), M.trim, [s * 1.27, 1.20, 0.52]);
  });

  const leaf = new GFX.Shape();
  leaf.moveTo(0, 0);
  leaf.quadraticCurveTo(0.66, 0.12, 0.78, 0.84);
  leaf.quadraticCurveTo(0.12, 0.70, 0, 0);
  const leafGeo = new GFX.ExtrudeGeometry(leaf, { depth: 0.02, bevelEnabled: false, curveSegments: 20 });
  add('leaf_badge_left', leafGeo, M.green, [-1.27, 2.36, -1.90], [0, -Math.PI / 2, 0.30]);
  add('leaf_badge_right', leafGeo, M.green, [1.26, 2.36, -0.30], [0, Math.PI / 2, 0.30]);

  // ---------- chassis, battery, skirts ----------
  [-1, 1].forEach((s, i) => {
    add(`frame_rail_${i ? 'r' : 'l'}`, box(0.16, 0.28, 9.95), M.trim, [s * 0.46, 0.98, -0.95]);
    add(`side_skirt_${i ? 'r' : 'l'}`, box(0.06, 0.34, 3.20), M.trim, [s * 1.21, 1.14, -1.40]);
  });
  add('battery_pack', box(1.34, 0.34, 3.20), M.trim, [0, 0.90, 0.40]);

  // ---------- wheels: alloy face, lug holes, center cap ----------
  const TIRE_R = FREIGHTER.tireRadius, TIRE_W = FREIGHTER.tireWidth;
  const tireGeo = new GFX.CylinderGeometry(TIRE_R, TIRE_R, TIRE_W, 44);
  const treadGeo = new GFX.CylinderGeometry(TIRE_R + 0.006, TIRE_R + 0.006, TIRE_W * 0.72, 44, 1, true);
  const dishGeo = new GFX.CylinderGeometry(0.445, 0.445, 0.05, 36);
  const barrelGeo = new GFX.CylinderGeometry(0.44, 0.44, TIRE_W * 0.9, 32);
  const lugGeo = new GFX.CylinderGeometry(0.052, 0.052, 0.07, 14);
  const capGeo = new GFX.CylinderGeometry(0.10, 0.085, 0.09, 20);

  /** One wheel, its axis along x; `face` is +1 when the alloy face points +x. */
  const makeWheel = (id, face) => {
    const g = new GFX.Group();
    g.name = `wheel_${id}`;
    const spin = [0, 0, Math.PI / 2];
    const mk = (n, geo, mat, x) => {
      const m = new GFX.Mesh(geo, mat);
      m.name = n; m.position.x = x; m.rotation.set(...spin); m.castShadow = true;
      g.add(m);
      return m;
    };
    mk(`tire_${id}`, tireGeo, M.tire, 0);
    mk(`tread_${id}`, treadGeo, M.tire, 0);
    mk(`barrel_${id}`, barrelGeo, M.rim, 0);
    const fx = face * (TIRE_W / 2 - 0.018);
    mk(`alloy_face_${id}`, dishGeo, M.rim, fx);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lug = new GFX.Mesh(lugGeo, M.trim);
      lug.name = `lug_${id}_${i}`;
      lug.position.set(fx + face * 0.014, Math.cos(a) * 0.285, Math.sin(a) * 0.285);
      lug.rotation.set(0, 0, Math.PI / 2);
      g.add(lug);
    }
    mk(`hub_cap_${id}`, capGeo, M.rim, fx + face * 0.055);
    return g;
  };

  // The wheel-arch lip: a ring sector round the axle, hugging the tread (the engine's Shape has no arcs, so it is drawn in short lines).
  const archShape = new GFX.Shape();
  const arc = (r, from, to, first) => {
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      if (first && i === 0) archShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else archShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  };
  arc(TIRE_R + 0.095, Math.PI * 0.07, Math.PI * 0.93, true);
  arc(TIRE_R + 0.02, Math.PI * 0.93, Math.PI * 0.07, false);

  // Axle positions as the truck was drawn (nose at −z), from the front.
  const axles = [-5.00, -3.55, 1.75, 3.55];
  const wheels = [], steeredWheels = [];
  const DUAL_IN = 0.60, DUAL_OUT = 0.60 + TIRE_W + 0.03;

  axles.forEach((z, ai) => {
    const dual = ai > 1;
    [-1, 1].forEach((s) => {
      const side = s < 0 ? 'l' : 'r';
      const xs = dual ? [DUAL_IN, DUAL_OUT] : [0.94];
      xs.forEach((ox, oi) => {
        const w = makeWheel(`${ai}${side}${oi}`, oi === xs.length - 1 ? s : -s);
        w.rotation.order = 'YXZ';
        w.position.set(s * ox, TIRE_R, z);
        truck.add(w);
        parts[w.name] = w;
        wheels.push(w);
        if (!dual) steeredWheels.push(w);
      });
      // The arch round this axle, as wide as the tires it covers.
      const cx = dual ? (DUAL_IN + DUAL_OUT) / 2 : 0.94;
      const cw = dual ? (DUAL_OUT - DUAL_IN) + TIRE_W + 0.06 : TIRE_W + 0.06;
      const arch = new GFX.Mesh(across(archShape, cw, 0.02), M.white);
      arch.name = `fender_${ai}_${side}`;
      arch.castShadow = true;
      arch.position.set(s * cx, TIRE_R, z);
      truck.add(arch);
      parts[arch.name] = arch;

      // A mudflap behind the last axle, as wide as the duals.
      if (ai === axles.length - 1) {
        const flap = new GFX.Mesh(box(cw - 0.04, 0.44, 0.035), M.trim);
        flap.name = `mudflap_${side}`;
        flap.castShadow = true;
        flap.position.set(s * cx, 0.34, z + TIRE_R + 0.13);
        truck.add(flap);
        parts[flap.name] = flap;
      }
    });
    add(`axle_beam_${ai}`, new GFX.CylinderGeometry(0.085, 0.085, 2.3, 20), M.trim, [0, TIRE_R, z], [0, 0, Math.PI / 2]);
  });

  // Stand it on the ground at y = 0, centered across, with its origin at the back wheels so it pivots like a truck; then face it +z.
  truck.updateMatrixWorld(true);
  const bb = new GFX.Box3().setFromObject(truck);
  const c = bb.getCenter(new GFX.Vector3());
  truck.name = 'chassis';
  truck.position.set(-c.x, -bb.min.y, -3.0);
  const facing = new GFX.Group();
  facing.name = 'facing';
  facing.rotation.y = Math.PI;
  facing.add(truck);
  const group = new GFX.Group();
  group.name = 'electric_freighter';
  group.add(facing);
  group.scale.setScalar(scale);

  // ---------- driving ----------
  const D = FREIGHTER_DRIVE;
  const state = { speed: 0, steer: 0, heading: 0 };

  const api = {
    group, chassis: truck, parts, wheels, steeredWheels, materials: M,
    dimensions: FREIGHTER, drive: D, scale,

    /** Metres a second, forward positive. */
    get speed() { return state.speed; },
    get kmh() { return Math.abs(state.speed) * 3.6; },
    /** The turn about y, in radians; positive is to the left. */
    get heading() { return state.heading; },
    /** The angle the front wheels are turned to. */
    get steerAngle() { return state.steer; },

    /**
     * Drives for `dt` seconds. `input` is `{ throttle, brake, steer, handbrake }`: `throttle` and `brake` 0 to 1 (the
     * brake backs it up once it is stopped), `steer` −1 to 1 with + to the left, and `handbrake`. Moves and turns
     * `group` and rolls the wheels. Returns `speed` in metres a second.
     */
    update(dt, { throttle = 0, brake = 0, steer: want = 0, handbrake = false } = {}) {
      dt = Math.min(Math.max(dt, 0), D.maxStep);
      if (throttle > 0) state.speed += D.accel * throttle * dt;
      else if (brake > 0) state.speed -= D.brake * brake * dt;
      else state.speed -= Math.sign(state.speed) * Math.min(Math.abs(state.speed), D.coast * dt);
      if (handbrake) state.speed -= Math.sign(state.speed) * Math.min(Math.abs(state.speed), D.handbrake * dt);
      state.speed = clamp(state.speed, -D.maxReverse, D.maxForward);

      // The wheels' lock shrinks as it goes faster, and they follow the stick with a lag.
      const limit = D.steerLock * (1 - Math.min(Math.abs(state.speed) / D.steerFade, D.steerFadeMax));
      state.steer += (clamp(want, -1, 1) * limit - state.steer) * Math.min(1, D.steerRate * dt);

      // The bicycle model: it turns about the back wheels by how far the front ones are turned.
      if (Math.abs(state.speed) > 0.01) {
        state.heading += (state.speed / D.wheelbase) * Math.tan(state.steer) * dt;
        group.position.x += Math.sin(state.heading) * state.speed * dt * scale;
        group.position.z += Math.cos(state.heading) * state.speed * dt * scale;
        group.rotation.y = state.heading;
      }

      const spin = (state.speed / TIRE_R) * dt;
      for (const w of wheels) w.rotation.x -= spin;
      for (const w of steeredWheels) w.rotation.y = state.steer;
      return state.speed;
    },

    /** Stops it, straightens the wheels and stands it at the origin, facing +z (or where `position` and `heading` say). */
    reset({ position = [0, 0, 0], heading = 0 } = {}) {
      state.speed = 0; state.steer = 0; state.heading = heading;
      group.position.set(...position);
      group.rotation.y = heading;
      for (const w of wheels) w.rotation.x = 0;
      for (const w of steeredWheels) w.rotation.y = 0;
    },
  };
  return api;
}
