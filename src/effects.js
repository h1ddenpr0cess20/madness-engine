/**
 * The bits that fly, as every one of the rolling games has them: things
 * thrown out of a spot (shards, sparks, confetti, smoke, bubbles), each
 * ballistic, bouncing off the ground once or twice, turning over and
 * shrinking away; rings going out across the floor; and the weather (rain
 * and sand in streaks, snow and petals in flakes) falling round a spot that
 * moves with the player.
 *
 *     const effects = createEffects(GFX, scene, { ground: course });   // anything with heightAt(x, z)
 *     effects.burst({ at: [x, y, z], count: 34, mesh: () => new GFX.Mesh(shard, glass), speed: 4.5, up: 5 });
 *     effects.setWeather('rain');
 *     // every frame:
 *     effects.update(dt);
 *     effects.weather(dt, ball.x, ball.y, ball.z);
 */

/** Confetti and streamers: a party's colours. */
export const CONFETTI = ['#ffd23a', '#f5f0e6', '#d81c2a', '#ffb02a', '#ffffff', '#c8a050', '#2de2ff'];

/** Bright plastic: guitar picks, sweets, balloons. */
export const PICKS = ['#ff3a8a', '#2ad0ff', '#ffd23a', '#8a4be8', '#3ae88a', '#ff7a1a', '#f5f0e6'];

/** How far round the spot the weather falls, how high it starts, and how many streaks there are. */
export const RAIN = Object.freeze({ drops: 900, reach: 11, height: 9, length: 0.5, speed: 16 });

/**
 * Weather in streaks (rain, and sand blowing across) and in flakes (snow,
 * petals): colour, how see-through, which way and how fast it goes
 * ([x, y, z] tiles a second), how long a streak is along that way, or how
 * big a flake is and how much it wanders and turns, and whether it splashes.
 */
export const WEATHER = Object.freeze({
  rain: { streaks: true, color: '#c8d4e4', opacity: 0.45, velocity: [1.3, -16, 0], length: 0.5, splash: true },
  sand: { streaks: true, color: '#e0c088', opacity: 0.4, velocity: [9, -0.6, 2.5], length: 0.7, splash: false },
  snow: { flakes: 800, color: '#f0f4ff', opacity: 0.8, velocity: [0.3, -1.4, 0.1], size: 0.03, wander: 0.5, turn: 1 },
  petals: { flakes: 380, color: '#ffb8d4', opacity: 0.95, velocity: [0.6, -0.9, 0.2], size: 0.1, wander: 0.9, turn: 4 },
});

/** A thin, irregular sliver of glass or stone: four points, four faces. */
export function shardGeometry(GFX) {
  const p = [[0, 0.09, 0], [-0.07, -0.04, 0.02], [0.08, -0.05, -0.01], [0.01, -0.02, 0.05]];
  const faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
  const position = new Float32Array(faces.flatMap((f) => f.flatMap((i) => p[i])));
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(position, 3));
  g.computeVertexNormals();
  return g;
}

/** A way out from a spot: across at up to `speed`, at a random angle, and up at about `up`. */
export function outward(speed, up) {
  const a = Math.random() * Math.PI * 2;
  const s = speed * (0.4 + Math.random() * 0.6);
  return [Math.cos(a) * s, up * (0.5 + Math.random()), Math.sin(a) * s];
}

/**
 * @param options
 *   - `gravity`: tiles a second a second (18)
 *   - `ground`: what the bits land on, anything with `heightAt(x, z)` (a number, or null where there is nothing)
 */
export function createEffects(GFX, scene, { gravity = 18, ground = null } = {}) {
  const group = new GFX.Group();
  group.name = 'effects';
  scene.add(group);
  const bits = [];
  const rings = [];
  const height = (x, z) => ground?.heightAt(x, z) ?? null;

  /**
   * Throws `mesh` from (x, y, z) at (vx, vy, vz), for `life` seconds. `spin`
   * is how fast it tumbles, `drag` how much the air slows it, `floaty` how
   * much gravity it feels (negative rises), `bounce` how much it keeps of
   * its speed off the ground (0 settles where it lands), `grow` how much
   * bigger it is by the end (smoke).
   */
  function spawn(mesh, { x, y, z, vx = 0, vy = 0, vz = 0, life = 1, spin = 6, drag = 0, floaty = 1, bounce = 0.35, grow = 0 }) {
    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    group.add(mesh);
    bits.push({
      mesh, vx, vy, vz, life, age: 0, drag, floaty, bounce, grow,
      spin: [(Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin],
      scale: mesh.scale.x,
    });
    return mesh;
  }

  // The weather: one set of line segments for streaks, one mesh of little quads for flakes.
  let kind = null, seeded = false, time = 0;
  const rain = (() => {
    const positions = new Float32Array(RAIN.drops * 6);
    const geometry = new GFX.BufferGeometry();
    const attribute = new GFX.BufferAttribute(positions, 3);
    geometry.setAttribute('position', attribute);
    const material = new GFX.LineBasicMaterial({ name: 'rain', color: new GFX.Color('#c8d4e4'), transparent: true, opacity: 0.45, depthWrite: false });
    const lines = new GFX.LineSegments(geometry, material);
    lines.frustumCulled = false;
    lines.visible = false;
    group.add(lines);
    return { lines, material, positions, attribute, drops: Array.from({ length: RAIN.drops }, () => ({ x: 0, y: 0, z: 0 })) };
  })();
  const flakes = (() => {
    const most = Math.max(...Object.values(WEATHER).map((w) => w.flakes ?? 0));
    const positions = new Float32Array(most * 18);
    const geometry = new GFX.BufferGeometry();
    const attribute = new GFX.BufferAttribute(positions, 3);
    geometry.setAttribute('position', attribute);
    const material = new GFX.MeshBasicMaterial({ name: 'flakes', color: new GFX.Color('#ffffff'), transparent: true, opacity: 0.9, side: GFX.DoubleSide, depthWrite: false, toneMapped: false });
    const mesh = new GFX.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    group.add(mesh);
    return { mesh, material, positions, attribute, list: Array.from({ length: most }, () => ({ x: 0, y: 0, z: 0, p: Math.random() * 7 })), n: 0 };
  })();
  // Splashes: rings opening on the ground where drops land, every one drawn in a single call.
  const SPLASHES = 40;
  const splashes = [];
  const splashGeometry = new GFX.TorusGeometry(1, 0.04, 4, 16).rotateX(-Math.PI / 2);
  const splashMaterial = new GFX.MeshBasicMaterial({ name: 'splash', color: new GFX.Color('#d0dce8'), transparent: true, opacity: 0.5, depthWrite: false });
  const splashMesh = new GFX.InstancedMesh(splashGeometry, splashMaterial, SPLASHES);
  splashMesh.frustumCulled = false;
  group.add(splashMesh);

  /** A fresh drop somewhere round (x, z), `up` of the way up its fall. */
  const reseed = (d, x, y, z, up = Math.random()) => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * RAIN.reach;
    d.x = x + Math.cos(a) * r;
    d.z = z + Math.sin(a) * r;
    d.y = y + up * RAIN.height;
  };

  function drift(dt, x, y, z) {
    const { list, positions, n } = flakes;
    time += dt;
    const [vx, vy, vz] = kind.velocity;
    if (!seeded) {
      for (let i = 0; i < n; i++) reseed(list[i], x, y - 2, z);
      seeded = true;
    }
    for (let i = 0; i < n; i++) {
      const f = list[i];
      f.x += (vx + Math.sin(time * 0.9 + f.p) * kind.wander) * dt;
      f.y += vy * dt;
      f.z += (vz + Math.cos(time * 0.7 + f.p * 1.3) * kind.wander) * dt;
      if (f.y < (height(f.x, f.z) ?? y - 8)) reseed(f, x, y - 2, z, 1);
      if (Math.abs(f.x - x) > RAIN.reach || Math.abs(f.z - z) > RAIN.reach) reseed(f, x, y - 2, z);
      // A little square, turned over about two axes as it goes.
      const a = time * kind.turn + f.p, b = time * kind.turn * 0.7 + f.p * 2;
      const s = kind.size * (0.7 + (f.p % 1) * 0.6);
      const ux = Math.cos(a) * s, uy = Math.sin(a) * Math.sin(b) * s, uz = Math.sin(a) * Math.cos(b) * s;
      const wx = -Math.sin(b) * s * 0.3, wy = Math.cos(b) * s, wz = Math.sin(b) * s * 0.7;
      const k = i * 18;
      const put = (o, px, py, pz) => { positions[k + o] = px; positions[k + o + 1] = py; positions[k + o + 2] = pz; };
      put(0, f.x - ux - wx, f.y - uy - wy, f.z - uz - wz);
      put(3, f.x + ux - wx, f.y + uy - wy, f.z + uz - wz);
      put(6, f.x + ux + wx, f.y + uy + wy, f.z + uz + wz);
      put(9, f.x - ux - wx, f.y - uy - wy, f.z - uz - wz);
      put(12, f.x + ux + wx, f.y + uy + wy, f.z + uz + wz);
      put(15, f.x - ux + wx, f.y - uy + wy, f.z - uz + wz);
    }
    flakes.attribute.needsUpdate = true;
  }

  function fall(dt, x, y, z) {
    const { drops, positions } = rain;
    const { velocity: [vx, vy, vz], length, splash } = kind;
    const speed = Math.hypot(vx, vy, vz);
    const [lx, ly, lz] = [-vx / speed * length, -vy / speed * length, -vz / speed * length];
    if (!seeded) {
      for (const d of drops) reseed(d, x, y - 2, z);
      seeded = true;
    }
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.x += vx * dt;
      d.y += vy * dt;
      d.z += vz * dt;
      const floor = height(d.x, d.z);
      if (d.y < (floor ?? y - 8)) {
        if (splash && floor !== null && splashes.length < SPLASHES && Math.abs(d.x - x) < 7 && Math.abs(d.z - z) < 7 && Math.random() < 0.25) {
          splashes.push({ x: d.x, y: floor + 0.02, z: d.z, age: 0 });
        }
        reseed(d, x, y - 2, z, 1);
      }
      // Too far behind as the spot moves on: round in front of it again.
      if (Math.abs(d.x - x) > RAIN.reach || Math.abs(d.z - z) > RAIN.reach) reseed(d, x, y - 2, z);
      const k = i * 6;
      positions[k] = d.x; positions[k + 1] = d.y; positions[k + 2] = d.z;
      positions[k + 3] = d.x + lx; positions[k + 4] = d.y + ly; positions[k + 5] = d.z + lz;
    }
    rain.attribute.needsUpdate = true;
  }

  const effects = {
    group,
    spawn,
    outward,

    /** What the bits land on, and the weather stops at: anything with `heightAt(x, z)`. */
    setGround(g) { ground = g; },

    /**
     * `count` bits out of `at` ([x, y, z]): `mesh(i)` makes each one, thrown
     * `outward(speed, up)` plus `carry` ([vx, vz], what it was moving with),
     * living `life` seconds and a random part of `lifeSpread` more. The rest
     * goes to `spawn` as it is.
     */
    burst({ at: [x, y, z], count = 20, mesh, speed = 3, up = 4, carry = [0, 0], life = 1, lifeSpread = 0.5, scale = [1, 1], ...rest }) {
      for (let i = 0; i < count; i++) {
        const m = mesh(i);
        m.scale.setScalar(scale[0] + Math.random() * (scale[1] - scale[0]));
        const [ox, oy, oz] = outward(speed, up);
        spawn(m, { x, y, z, vx: ox + carry[0], vy: oy, vz: oz + carry[1], life: life + Math.random() * lifeSpread, ...rest });
      }
    },

    /** A ring going out across the floor at (x, y, z): `reach` tiles in `life` seconds, fading as it goes. */
    ring(x, y, z, { colour = '#ffffff', reach = 2, life = 0.5 } = {}) {
      const mesh = new GFX.Mesh(
        new GFX.TorusGeometry(1, 0.035, 6, 44),
        new GFX.MeshBasicMaterial({ name: 'ring', color: new GFX.Color(colour), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, blending: GFX.AdditiveBlending }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, (height(x, z) ?? y) + 0.05, z);
      mesh.frustumCulled = false;
      group.add(mesh);
      rings.push({ mesh, reach, life, age: 0 });
      return mesh;
    },

    /** The weather: a name in WEATHER, one of your own like them, or null for none. */
    setWeather(w) {
      kind = typeof w === 'string' ? WEATHER[w] ?? null : w;
      seeded = false;
      rain.lines.visible = Boolean(kind?.streaks);
      flakes.mesh.visible = Boolean(kind?.flakes);
      if (kind?.streaks) { rain.material.color.set(kind.color); rain.material.opacity = kind.opacity; }
      if (kind?.flakes) {
        flakes.n = Math.min(kind.flakes, flakes.list.length);
        flakes.material.color.set(kind.color);
        flakes.material.opacity = kind.opacity;
        // Nothing drawn past the flakes this weather has.
        flakes.positions.fill(0);
        flakes.mesh.geometry.setDrawRange?.(0, flakes.n * 6);
      }
    },

    /** The weather, once a frame, round (x, y, z): falling past it to the ground, or on down into the dark. */
    weather(dt, x, y, z) {
      if (kind?.flakes) drift(dt, x, y, z);
      if (kind?.streaks) fall(dt, x, y, z);
      for (let i = splashes.length - 1; i >= 0; i--) {
        splashes[i].age += dt;
        if (splashes[i].age > 0.35) splashes.splice(i, 1);
      }
      splashes.forEach((sp, i) => splashMesh.setInstance(i, sp.x, sp.y, sp.z, 0, 0.04 + sp.age * 0.6));
      splashMesh.count = splashes.length;
      splashMesh.instancePlace.needsUpdate = true;
      splashMesh.instanceLook.needsUpdate = true;
    },

    /** Everything flying, gone (a new level). The weather stays. */
    clear() {
      for (const list of [bits, rings]) {
        for (const b of list) group.remove(b.mesh);
        list.length = 0;
      }
      splashes.length = 0;
      splashMesh.count = 0;
    },

    /** How many bits are flying. */
    get count() { return bits.length; },

    update(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.age += dt;
        const u = r.age / r.life;
        if (u >= 1) { group.remove(r.mesh); rings.splice(i, 1); continue; }
        r.mesh.scale.setScalar(0.2 + r.reach * (1 - (1 - u) ** 2));
        r.mesh.material.opacity = 0.9 * (1 - u);
      }
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.age += dt;
        if (b.age >= b.life) {
          group.remove(b.mesh);
          bits.splice(i, 1);
          continue;
        }
        const m = b.mesh;
        b.vy -= gravity * b.floaty * dt;
        const k = Math.max(0, 1 - b.drag * dt);
        b.vx *= k; b.vy *= b.drag ? Math.max(0, 1 - b.drag * 0.5 * dt) : 1; b.vz *= k;
        m.position.x += b.vx * dt;
        m.position.y += b.vy * dt;
        m.position.z += b.vz * dt;
        const floor = height(m.position.x, m.position.z);
        if (floor !== null && b.bounce > 0 && m.position.y < floor + 0.03 && m.position.y > floor - 0.4 && b.vy < 0) {
          m.position.y = floor + 0.03;
          b.vy *= -b.bounce;
          b.vx *= 0.55; b.vz *= 0.55;
          b.spin = b.spin.map((s) => s * 0.5);
        } else if (floor !== null && b.bounce === 0 && m.position.y < floor + 0.02 && m.position.y > floor - 0.4) {
          m.position.y = floor + 0.02;
          b.vx = b.vy = b.vz = 0;
          b.spin = [0, 0, 0];
        }
        m.rotation.x += b.spin[0] * dt;
        m.rotation.y += b.spin[1] * dt;
        m.rotation.z += b.spin[2] * dt;
        const fade = Math.min(1, (b.life - b.age) / 0.4);
        m.scale.setScalar(b.scale * fade * (1 + b.grow * (b.age / b.life)));
      }
    },
  };
  return effects;
}
