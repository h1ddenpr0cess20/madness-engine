/**
 * An endless river for the ocean's water: a current running downstream
 * (+x), winding as far as `snake` says, between two banks of ground (a
 * muddy slope out of the water, then rolling grass) that are laid again
 * around whatever they follow as it goes.
 *
 *     const river = createRiver(GFX, scene, { width: 28, snake: 0.4, current: 0.6 });
 *     // every frame:
 *     river.place(ball.x);                    // the banks, around the float
 *     river.carry(ball, dt);                  // the current takes it along
 *     river.keep(ball);                       // the banks turn it back into the stream
 *     river.flow(ball.x);                     // the way the water runs there, for the sea's wind
 *
 * `width`, `snake` and `current` can be changed at any time.
 */
/**
 * The river's water, for createOcean: short ripples, all running down the
 * stream and carried by it, with no swell from elsewhere. `riverOf` makes
 * it wilder.
 */
export const RIVER_SEA = Object.freeze({ wind: 0, longest: 6, shortest: 0.5, height: 0.05, growth: 1, choppy: 0.3, spread: 0.25, swell: null, foam: 0, seed: 7 });

/** How wild each kind of river is, for `riverOf`. */
export const RIVERS = Object.freeze({ canal: 0, stream: 0.3, river: 0.55, rapids: 1 });

/**
 * A river as wild as `wild` says, from a still canal (0) to white rapids
 * (1): how wide it is, how it winds, how fast it runs, and its water.
 */
export function riverOf(wild) {
  const w = Math.min(1, Math.max(0, wild));
  return {
    width: 34 - 20 * w,
    snake: 0.05 + 0.95 * w,
    current: 0.3 + 6 * w ** 1.5,
    sea: {
      ...RIVER_SEA,
      longest: 3 + 4 * w, height: 0.02 + 0.28 * w * w, choppy: 0.2 + 0.65 * w,
      spread: 0.2 + 0.9 * w, foam: Math.max(0, w - 0.35) * 1.55,
    },
    // How far the waves run on their own through the water: hardly at all on a canal, standing and breaking in rapids.
    run: 0.15 + 0.35 * w,
  };
}

const BEND = 60, SEG = 3, ALONG = 400, ACROSS = 22, REACH = 3000;

const lump = (x, z) => Math.sin(x * 0.11 + z * 0.07) * 0.6 + Math.sin(x * 0.031 - z * 0.13) * 0.9 + Math.sin(x * 0.53 + z * 0.41) * 0.12;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createRiver(GFX, scene, { width = 28, snake = 0.4, current = 0.6 } = {}) {
  const river = { width, snake, current };
  const middle = (river.middle = (x) => river.snake * 30 * Math.sin(x / BEND));
  const slope = (x) => ((river.snake * 30) / BEND) * Math.cos(x / BEND);
  river.flow = (x) => Math.atan(slope(x));
  /** The water's own speed, [x, z], at (x, z): fastest down the middle, slower by the banks. */
  river.water = (x, z) => {
    const a = river.flow(x), off = (z - middle(x)) / (river.width / 2);
    const speed = river.current * (1 - 0.6 * Math.min(1, off * off));
    return [speed * Math.cos(a), speed * Math.sin(a)];
  };
  /** Carries what floats (`x`, `z`, `vx`, `vz`) along with the water, the more the wetter it is (`wet`, 0 to 1). */
  river.carry = (body, dt) => {
    const [ux, uz] = river.water(body.x, body.z), f = (1 - Math.exp(-1.6 * dt)) * (body.wet ?? 1);
    body.vx += (ux - body.vx) * f;
    body.vz += (uz - body.vz) * f;
  };
  river.keep = (body) => {
    const edge = river.width / 2 - (body.r ?? 0), off = body.z - middle(body.x);
    if (Math.abs(off) > edge) {
      body.z = middle(body.x) + Math.sign(off) * edge;
      // Bounced back off the bank, if it was going into it.
      if (body.vz * off > 0) body.vz *= -0.4;
    }
  };

  const material = new GFX.MeshStandardMaterial({ name: 'bank', vertexColors: true, roughness: 1, side: GFX.DoubleSide });
  const MUD = new GFX.Color('#5b4a33'), GRASS = new GFX.Color('#4d7a2e'), DRY = new GFX.Color('#7f8a3c');
  const banks = [-1, 1].map((side) => {
    const geometry = new GFX.BufferGeometry();
    const n = (ALONG + 1) * (ACROSS + 1);
    geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('color', new GFX.BufferAttribute(new Float32Array(n * 3), 3));
    const index = [];
    for (let i = 0; i < ALONG; i++) {
      for (let j = 0; j < ACROSS; j++) {
        const a = i * (ACROSS + 1) + j, b = a + ACROSS + 1;
        if (side > 0) index.push(a, b, a + 1, b, b + 1, a + 1);
        else index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    geometry.setIndex(index);
    const mesh = new GFX.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { side, geometry, mesh };
  });
  river.banks = banks.map((b) => b.mesh);

  const tint = new GFX.Color();
  let laid = null;
  river.place = (x0) => {
    const start = Math.round(x0 / SEG) * SEG;
    const key = `${start}|${river.width}|${river.snake}`;
    if (key === laid) return;
    laid = key;
    for (const { side, geometry } of banks) {
      const pos = geometry.attributes.position.array, col = geometry.attributes.color.array;
      for (let i = 0; i <= ALONG; i++) {
        // Close rows by the float, wider ones further off, out to the horizon;
        // each on a grid as fine as the rows are there, fixed to the ground,
        // so laying the banks again further on lays them where they were
        // rather than over different bumps, and the far banks don't flicker.
        const u = (i / ALONG) * 2 - 1;
        const apart = Math.max(1 / 8, ((6 * REACH) / ALONG) * u * u);
        const grid = 2 ** Math.ceil(Math.log2(apart));
        const x = Math.round((start + Math.sign(u) * REACH * Math.abs(u) ** 3) / grid) * grid, a = Math.atan(slope(x));
        const nx = -Math.sin(a) * side, nz = Math.cos(a) * side;
        for (let j = 0; j <= ACROSS; j++) {
          const d = REACH * (j / ACROSS) ** 3 - 1.5;
          const px = x + nx * (river.width / 2 + d), pz = middle(x) + nz * (river.width / 2 + d);
          const rise = clamp01((d + 1.5) / 3);
          const y = -1.4 + 3.6 * rise * rise * (3 - 2 * rise) + lump(px, pz) * 0.5 * clamp01(d / 10);
          const k = (i * (ACROSS + 1) + j) * 3;
          pos[k] = px; pos[k + 1] = y; pos[k + 2] = pz;
          tint.copy(MUD).lerp(GRASS, clamp01((d - 0.5) / 2.5)).lerp(DRY, clamp01(lump(px * 1.7, pz * 1.7) * 0.4 + 0.2));
          col[k] = tint.r; col[k + 1] = tint.g; col[k + 2] = tint.b;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  };
  return river;
}
