/**
 * The sea's waves, worked out the same way here as in the ocean's shaders
 * (ocean/shaders.js), so that what floats on the water rides the water you
 * see. Units are tiles, y up.
 *
 * The surface is a sum of Gerstner waves: each one lifts the water by
 * `A sin θ` and carries it `Q cos θ` along its way, so the crests sharpen
 * and the troughs flatten, and where the waves pile up the crests pinch
 * together and break (the shaders foam where they do). θ is `k (d · x) - ωt
 * + φ`, and ω goes as the square root of k, as it does on deep water, so the
 * long swell runs fast and the chop is slow.
 *
 * The shaders never see a large number: each frame the phase of every wave
 * at a point near the camera, `origin`, is worked out here in double
 * precision and handed over modulo 2π (as Neverending Tunnel III does with
 * its barrel), and the shaders measure from there. However far out you sail
 * and however long you stay, the water is as smooth as it was at the
 * start.
 */

/** As many waves as the shaders sum: four uniform matrices' worth. */
export const COUNT = 16;

/** Deep water: ω² = g k, in tiles a second squared. */
export const GRAVITY = 9.8;

const TAU = Math.PI * 2;

/**
 * Sea states: how the wind has made the sea.
 *   - `wind`: the way it blows, in radians round y from +x towards +z
 *   - `longest`, `shortest`: the waves' lengths, in tiles
 *   - `height`: how high the longest wave stands above the mean, in tiles
 *   - `growth`: how much smaller the shorter waves are (A goes as λ^growth)
 *   - `choppy`: how far the water is carried along (0 rolls, 1 is about to fold)
 *   - `spread`: how far off the wind the shortest waves run, in radians
 *   - `swell`: a long swell from elsewhere: [angle off the wind, height]
 *   - `foam`: how readily the crests break into white water
 *   - `seed`: which sea of that sort it is
 */
export const SEAS = Object.freeze({
  glass: Object.freeze({ wind: 0.6, longest: 70, shortest: 1.2, height: 0.07, growth: 1.1, choppy: 0.25, spread: 1.1, swell: [0.9, 0.16], foam: 0, seed: 3 }),
  calm: Object.freeze({ wind: 0.6, longest: 48, shortest: 1.0, height: 0.16, growth: 1.0, choppy: 0.45, spread: 1.0, swell: [0.7, 0.2], foam: 0.15, seed: 5 }),
  breeze: Object.freeze({ wind: 0.6, longest: 60, shortest: 1.0, height: 0.34, growth: 0.95, choppy: 0.62, spread: 0.9, swell: [0.6, 0.25], foam: 0.4, seed: 9 }),
  swell: Object.freeze({ wind: 0.6, longest: 150, shortest: 1.3, height: 2.6, growth: 1.25, choppy: 0.72, spread: 0.3, swell: [0.2, 1.8], foam: 0.35, seed: 11 }),
  storm: Object.freeze({ wind: 0.6, longest: 90, shortest: 1.4, height: 3.6, growth: 1.1, choppy: 0.92, spread: 0.5, swell: [-0.3, 2.2], foam: 1, seed: 17 }),
});

/** A seeded random number in [0, 1): the same sea from the same seed. */
function random(seed) {
  let s = (seed * 2654435761) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * The waves of a sea state (SEAS, or one of your own of the same shape):
 * `COUNT` of them, from the longest to the shortest, in arrays a wave to an
 * entry: `A` (lift), `Q` (carry), `k` (wave number), `angle` (the way it
 * runs) and `phi` (where it starts); and the sea's `foam`, `wind` and
 * `choppy`. The
 * last wave is the swell, if the sea has one.
 */
export function waveSet(sea) {
  const { wind, longest, shortest, height, growth, choppy, spread, swell = null, foam = 0, seed = 1 } = sea;
  const rnd = random(seed);
  const set = { A: [], Q: [], k: [], angle: [], phi: [], foam, wind, choppy };
  const n = swell ? COUNT - 1 : COUNT;
  for (let i = 0; i < COUNT; i++) {
    const isSwell = swell && i === COUNT - 1;
    const f = i / Math.max(1, n - 1);
    // Wavelengths spaced evenly in their logarithm, each nudged off its slot so no two lock together.
    const lambda = isSwell ? longest * 1.6 : longest * Math.pow(shortest / longest, Math.min(1, f + (rnd() - 0.5) * 0.6 / n));
    const k = TAU / lambda;
    // The long waves run with the wind; the short ones wander off it.
    const off = isSwell ? swell[0] : (rnd() * 2 - 1) * spread * (0.25 + 0.75 * f);
    const a = wind + off;
    const A = isSwell ? swell[1] : height * Math.pow(lambda / longest, growth) * (0.75 + 0.5 * rnd());
    set.A.push(A);
    set.k.push(k);
    set.angle.push(a);
    set.phi.push(rnd() * TAU);
  }
  // The carry: shared out so that, all piled up, it comes to `choppy` of a fold.
  const steep = set.A.reduce((s, A, i) => s + A * set.k[i], 0);
  for (let i = 0; i < COUNT; i++) set.Q.push((set.A[i] * choppy) / Math.max(steep, 1e-6));
  return set;
}

/**
 * A sea that runs: the waves of `sea` (SEAS, or one of your own of the same
 * shape) and where each of them has got to. Rather than `k (d · x) - ωt +
 * φ`, each wave's phase is kept as it stands at a point, `anchor`, and
 * moved on by `-ω dt` every step, so that changing the sea (`to`) turns
 * each wave smoothly into one of the new sea's, its length, its way, its
 * height, without the crests racing off as they would if `k` changed under
 * a large `t`.
 *
 *     const sea = createSea(SEAS.breeze);
 *     sea.to(SEAS.storm, 6);          // over six seconds
 *     // every frame:
 *     sea.step(dt);
 *     const { height, normal } = sea.sample(ball.x, ball.z);
 */
export function createSea(start) {
  const lerpAngle = (a, b, f) => a + (Math.atan2(Math.sin(b - a), Math.cos(b - a))) * f;
  let from = waveSet(start), target = from, blend = 1, over = 1;
  const now = { A: new Float64Array(COUNT), Q: new Float64Array(COUNT), k: new Float64Array(COUNT), w: new Float64Array(COUNT), dx: new Float64Array(COUNT), dz: new Float64Array(COUNT) };
  const psi = Float64Array.from(from.phi);
  const anchor = [0, 0];
  const mix = () => {
    const f = blend * blend * (3 - 2 * blend);
    for (let i = 0; i < COUNT; i++) {
      const k = Math.exp(Math.log(from.k[i]) * (1 - f) + Math.log(target.k[i]) * f);
      const a = lerpAngle(from.angle[i], target.angle[i], f);
      now.k[i] = k;
      now.w[i] = Math.sqrt(GRAVITY * k);
      now.dx[i] = Math.cos(a);
      now.dz[i] = Math.sin(a);
      now.A[i] = from.A[i] * (1 - f) + target.A[i] * f;
      now.Q[i] = from.Q[i] * (1 - f) + target.Q[i] * f;
    }
    sea.foam = from.foam * (1 - f) + target.foam * f;
    sea.choppy = from.choppy * (1 - f) + target.choppy * f;
    sea.wind = lerpAngle(from.wind, target.wind, f);
  };
  const theta = (i, x, z) => now.k[i] * (now.dx[i] * (x - anchor[0]) + now.dz[i] * (z - anchor[1])) + psi[i];

  const sea = {
    /** The waves as they are now: arrays of `COUNT`, `A`, `Q`, `k`, `w`, `dx`, `dz`. */
    waves: now,
    /** How readily the crests break, the way the wind blows and how choppy it is: the sea's `foam`, `wind` and `choppy`. */
    foam: 0,
    wind: 0,
    choppy: 0,
    /** Seconds since it started. */
    time: 0,
    /**
     * Water that runs, as a river does: `current` ([x, z], m/s) carries every
     * wave along with it, and `run` is how far the waves still run on their
     * own through the water (1 for the sea, less for a river's ripples).
     */
    current: [0, 0],
    run: 1,
    /** How far the current has carried the water so far, [x, z]. */
    carried: [0, 0],

    /** Turns the sea into `next` over `seconds`. */
    to(next, seconds = 5) {
      from = { ...waveSet(next), A: [...now.A], Q: [...now.Q], k: [...now.k], angle: [...now.dx].map((x, i) => Math.atan2(now.dz[i], x)), foam: sea.foam, wind: sea.wind, choppy: sea.choppy };
      target = waveSet(next);
      blend = 0;
      over = Math.max(1e-3, seconds);
      mix();
    },

    /** Moves the sea on by `dt` seconds. */
    step(dt) {
      sea.time += dt;
      const [ux, uz] = sea.current;
      sea.carried[0] += ux * dt;
      sea.carried[1] += uz * dt;
      for (let i = 0; i < COUNT; i++) {
        const w = now.w[i] * sea.run + now.k[i] * (now.dx[i] * ux + now.dz[i] * uz);
        psi[i] = (((psi[i] - w * dt) % TAU) + TAU) % TAU;
      }
      if (blend < 1) {
        // Waves that change while you watch change about where you are watching: keep the anchor there.
        blend = Math.min(1, blend + dt / over);
        mix();
      }
    },

    /** Moves the point the phases are kept at, leaving the water as it is. Keep it near where things are looked at. */
    anchorAt(x, z) {
      for (let i = 0; i < COUNT; i++) psi[i] = ((theta(i, x, z) % TAU) + TAU) % TAU;
      anchor[0] = x;
      anchor[1] = z;
    },

    /** Every wave's phase at `origin` ([x, z]), in [0, 2π): what the shaders add to `k (d · (p - origin))`. */
    phases(origin, out = new Float64Array(COUNT)) {
      for (let i = 0; i < COUNT; i++) out[i] = ((theta(i, origin[0], origin[1]) % TAU) + TAU) % TAU;
      return out;
    },

    /**
     * Where the water that sat at rest at (x0, z0) is now: [x, y, z], the
     * surface's normal there, and how far the waves have squeezed it (1 at
     * rest, 0 where a crest folds over; the shaders foam below about 0.5).
     * The same sums as the shaders'. Things that drift with the water ride
     * it here.
     */
    displace(x0, z0) {
      let x = x0, y = 0, z = z0;
      let xx = 1, zz = 1, xz = 0, yx = 0, yz = 0;
      for (let i = 0; i < COUNT; i++) {
        const k = now.k[i], dx = now.dx[i], dz = now.dz[i];
        const th = theta(i, x0, z0);
        const c = Math.cos(th), s = Math.sin(th);
        const A = now.A[i], Q = now.Q[i];
        x += Q * dx * c;
        z += Q * dz * c;
        y += A * s;
        const qs = Q * k * s;
        xx -= qs * dx * dx;
        zz -= qs * dz * dz;
        xz -= qs * dx * dz;
        yx += A * k * dx * c;
        yz += A * k * dz * c;
      }
      // The surface's tangents along x0 and z0 are (xx, yx, xz) and (xz, yz, zz).
      const nx = yz * xz - yx * zz, ny = xx * zz - xz * xz, nz = yx * xz - yz * xx;
      const l = Math.hypot(nx, ny, nz) || 1;
      return { x, y, z, normal: [nx / l, ny / l, nz / l], squeeze: xx * zz - xz * xz };
    },

    /**
     * The sea at a fixed point (x, z): how high the water is there, its
     * normal, how it is squeezed, and how fast it is rising. The water at
     * (x, z) has been carried there from somewhere else, so this finds where
     * by stepping back along the carry a few times.
     */
    sample(x, z) {
      let x0 = x, z0 = z;
      let at = sea.displace(x0, z0);
      for (let step = 0; step < 5; step++) {
        x0 -= at.x - x;
        z0 -= at.z - z;
        at = sea.displace(x0, z0);
      }
      // How fast it rises, from the waves' lift alone (the carry hardly changes it).
      let rise = 0;
      for (let i = 0; i < COUNT; i++) rise -= now.A[i] * now.w[i] * Math.cos(theta(i, x0, z0));
      return { height: at.y, normal: at.normal, squeeze: at.squeeze, rise };
    },

    /** How high the water stands at (x, z): for anything with `heightAt` (effects' ground). */
    heightAt: (x, z) => sea.sample(x, z).height,
  };
  mix();
  return sea;
}
