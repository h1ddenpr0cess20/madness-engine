/**
 * How the engine's drivable vehicles drive, once: a vehicle brings its numbers (`drive`, as `FREIGHTER_DRIVE` is)
 * and its wheels, and gets `update(dt, input)`, `reset()` and its state. Everything is worked out in metres, seconds
 * and radians, and put in the game's units (`scale` to the metre) on the way out.
 *
 * The numbers: speeds are m/s; `accel`, `brake`, `coast` and `handbrake` m/s² (the brake is also reverse);
 * `steerLock` is the angle the front wheels turn to at a standstill, `steerFade` the speed at which that lock has
 * shrunk by `steerFadeMax` of itself at most, `steerRate` how quickly the wheels follow the stick (per second),
 * `wheelbase` what it turns about (front to back wheels, in metres), and `maxStep` the longest step it takes at once.
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Gives `api` the driving: `speed`, `kmh`, `heading` and `steerAngle` (getters), `update(dt, input)` and `reset()`.
 * `group` is what moves and turns, `wheels` roll and `steeredWheels` also steer (each wheel group's x is its roll, its
 * y its steer, in 'YXZ' order), `radius` is the wheels' radius.
 */
export function attachDriving(api, { group, wheels, steeredWheels, radius, drive: D, scale = 1 }) {
  const state = { speed: 0, steer: 0, heading: 0 };

  Object.defineProperties(api, {
    /** Metres a second, forward positive. */
    speed: { get: () => state.speed, enumerable: true },
    kmh: { get: () => Math.abs(state.speed) * 3.6, enumerable: true },
    /** The turn about y, in radians; positive is to the left. */
    heading: { get: () => state.heading, enumerable: true },
    /** The angle the front wheels are turned to. */
    steerAngle: { get: () => state.steer, enumerable: true },
  });

  /**
   * Drives for `dt` seconds. `input` is `{ throttle, brake, steer, handbrake }`: `throttle` and `brake` 0 to 1 (the
   * brake backs it up once it is stopped), `steer` −1 to 1 with + to the left, and `handbrake`. Moves and turns
   * `group` and rolls the wheels. Returns `speed` in metres a second.
   */
  api.update = (dt, { throttle = 0, brake = 0, steer: want = 0, handbrake = false } = {}) => {
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

    const spin = (state.speed / radius) * dt;
    for (const w of wheels) w.rotation.x -= spin;
    for (const w of steeredWheels) w.rotation.y = state.steer;
    return state.speed;
  };

  /** Stops it, straightens the wheels and stands it at the origin, facing +z (or where `position` and `heading` say). */
  api.reset = ({ position = [0, 0, 0], heading = 0 } = {}) => {
    state.speed = 0; state.steer = 0; state.heading = heading;
    group.position.set(...position);
    group.rotation.y = heading;
    for (const w of wheels) w.rotation.x = 0;
    for (const w of steeredWheels) w.rotation.y = 0;
  };

  return api;
}
