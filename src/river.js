/**
 * An endless river for the ocean's water: a current running downstream
 * (+x), winding as far as `snake` says, between two banks of ground (a
 * muddy slope out of the water, then rolling grass) that are laid again
 * around whatever they follow as it goes.
 *
 *     const river = createRiver(GFX, scene, { width: 28, snake: 0.4, current: 0.6 });
 *     // every frame:
 *     river.place(ball.x);                    // the banks, around the float
 *     const [cx, cz] = river.push(ball.x);    // the current, to add to what drives it
 *     river.keep(ball);                       // the banks turn it back into the stream
 *     river.flow(ball.x);                     // the way the water runs there, for the sea's wind
 *
 * `width`, `snake` and `current` can be changed at any time.
 */
const BEND = 60, SEG = 3, ALONG = 140, ACROSS = 14, REACH = 50;

const lump = (x, z) => Math.sin(x * 0.11 + z * 0.07) * 0.6 + Math.sin(x * 0.031 - z * 0.13) * 0.9 + Math.sin(x * 0.53 + z * 0.41) * 0.12;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createRiver(GFX, scene, { width = 28, snake = 0.4, current = 0.6 } = {}) {
  const river = { width, snake, current };
  const middle = (river.middle = (x) => river.snake * 30 * Math.sin(x / BEND));
  const slope = (x) => ((river.snake * 30) / BEND) * Math.cos(x / BEND);
  river.flow = (x) => Math.atan(slope(x));
  river.push = (x) => {
    const a = river.flow(x);
    return [river.current * Math.cos(a), river.current * Math.sin(a)];
  };
  river.keep = (body) => {
    const edge = river.width / 2 - (body.r ?? 0), off = body.z - middle(body.x);
    if (Math.abs(off) > edge) {
      body.z = middle(body.x) + Math.sign(off) * edge;
      body.vz *= -0.4;
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
    const start = Math.round(x0 / SEG) * SEG - (ALONG / 2) * SEG;
    const key = `${start}|${river.width}|${river.snake}`;
    if (key === laid) return;
    laid = key;
    for (const { side, geometry } of banks) {
      const pos = geometry.attributes.position.array, col = geometry.attributes.color.array;
      for (let i = 0; i <= ALONG; i++) {
        const x = start + i * SEG, a = Math.atan(slope(x));
        const nx = -Math.sin(a) * side, nz = Math.cos(a) * side;
        for (let j = 0; j <= ACROSS; j++) {
          // Close rows by the water, wider ones further out.
          const d = REACH * (j / ACROSS) ** 2 - 1.5;
          const px = x + nx * (river.width / 2 + d), pz = middle(x) + nz * (river.width / 2 + d);
          const rise = clamp01(d / 7);
          const y = -1.2 + 5 * rise * rise * (3 - 2 * rise) + lump(px, pz) * clamp01(d / 10);
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
