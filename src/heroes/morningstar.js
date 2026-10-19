/**
 * The head of a morning star: a ball of dark forged steel with square spikes
 * set into it, the kind on the end of a chain in a museum. Chrome where the
 * light catches it (it takes its reflections from the stop's room, so it
 * picks up every colour of the rig), gunmetal where it doesn't, the spikes
 * brightest at the tip and darkest where they go into the ball.
 *
 * The spikes can snap: `snap(n)` breaks the first n of them off short,
 * leaving blunt stubs, and `snap(0)` mends them. Which ones go first is the
 * same every time. This is how the ball shows how much of it is left.
 *
 * In its own units the ball is `CORE` across the middle and the spike tips
 * are at `TIP`; the wrapper (mace.js) scales it to the physics.
 */

const hash = (x, y, z) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

const noise = (x, y, z) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(
    L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v),
    w) * 2 - 1;
};

/** The ball, and how far the tips of its spikes reach. */
export const CORE = 0.7;
export const SPIKE = 0.2;
export const TIP = CORE + SPIKE;

/** How many spikes it has. */
export const SPIKES = 36;

/** A spike's width where it goes into the ball, and how far it is sunk. */
const FOOT = 0.14;
const SUNK = 0.04;

/** How much of its length a snapped spike keeps. */
const STUMP = 0.38;

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** `n` directions spread over a sphere as evenly as a sunflower's seeds. */
function spread(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.399963;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
}

/** The order the spikes snap in: a fixed shuffle, so the same ones go first every time. */
function snapOrder(n) {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(hash(i, 3, 7) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function createMorningStar(GFX, { spikes = SPIKES, detail = 1 } = {}) {
  // ———————————————————————————————— the ball
  const geometry = new GFX.SphereGeometry(CORE, Math.round(56 * detail), Math.round(36 * detail));
  const p = geometry.attributes.position.array;
  const colors = new Float32Array(p.length);
  const steel = new GFX.Color('#aab2c2');
  const bright = new GFX.Color('#f6f8fc');
  const soot = new GFX.Color('#6c727e');
  const c = new GFX.Color();
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i] / CORE, y = p[i + 1] / CORE, z = p[i + 2] / CORE;
    // Forged steel: long streaks of hammer marks round the ball, a few dark scorches.
    const streak = noise(x * 2.2 + y * 9, y * 2.2 - z * 9, z * 2.2 + x * 9) * 0.5 + 0.5;
    const scorch = noise(x * 3.1 + 7, y * 3.1, z * 3.1 - 4) * 0.5 + 0.5;
    c.copy(steel).lerp(bright, Math.pow(streak, 2.2) * 0.7);
    if (scorch > 0.62) c.lerp(soot, Math.min(0.6, (scorch - 0.62) * 3.5));
    colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
  }
  geometry.setAttribute('color', new GFX.BufferAttribute(colors, 3));
  const material = new GFX.MeshStandardMaterial({ name: 'forged-steel', vertexColors: true, metalness: 0.62, roughness: 0.3 });
  material.emissive.set('#1c2028');
  material.emissiveIntensity = 0.8;
  const core = new GFX.Mesh(geometry, material);
  core.name = 'ball';

  // ———————————————————————————————— the spikes
  const dirs = spread(spikes);
  const feet = dirs.map((n, i) => {
    // Any two directions across the spike, turned a little by its own amount so no two rows of them line up.
    const helper = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(n, helper));
    const v = cross(n, u);
    const spin = hash(i, 5, 1) * Math.PI;
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const a = [u[0] * cs + v[0] * sn, u[1] * cs + v[1] * sn, u[2] * cs + v[2] * sn];
    const b = [v[0] * cs - u[0] * sn, v[1] * cs - u[1] * sn, v[2] * cs - u[2] * sn];
    return { n, a, b, length: SPIKE * (0.92 + hash(i, 9, 2) * 0.16) + SUNK };
  });
  // Eight corners and ten triangles each, flat shaded: the four sides and the small cap.
  const TRIS = [[0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7], [4, 5, 6], [4, 6, 7]];
  const position = new Float32Array(spikes * TRIS.length * 9);
  const color = new Float32Array(position.length);
  const root = new GFX.Color('#8a909c');
  const tipColour = new GFX.Color('#ffffff');
  const corner = (f, k, kept) => {
    // 0 to 3 round the foot, 4 to 7 round the top.
    const top = k >= 4;
    const w = top ? FOOT * (1 - kept) * 0.8 + 0.004 : FOOT;
    const sx = [1, -1, -1, 1][k & 3], sy = [1, 1, -1, -1][k & 3];
    const along = top ? CORE - SUNK + f.length * kept : CORE - SUNK;
    return [
      f.n[0] * along + (f.a[0] * sx + f.b[0] * sy) * w,
      f.n[1] * along + (f.a[1] * sx + f.b[1] * sy) * w,
      f.n[2] * along + (f.a[2] * sx + f.b[2] * sy) * w,
    ];
  };
  const kept = new Float32Array(spikes).fill(1);
  const build = (i) => {
    const f = feet[i];
    const cs = Array.from({ length: 8 }, (_, k) => corner(f, k, kept[i]));
    TRIS.forEach((t, ti) => {
      const o = (i * TRIS.length + ti) * 9;
      t.forEach((k, vi) => {
        position.set(cs[k], o + vi * 3);
        // Dark where it goes into the ball, bright toward the tip.
        const height = k < 4 ? 0 : kept[i] < 1 ? 0.35 : 1;
        c.copy(root).lerp(tipColour, height);
        color.set([c.r, c.g, c.b], o + vi * 3);
      });
    });
  };
  for (let i = 0; i < spikes; i++) build(i);
  const spikeGeometry = new GFX.BufferGeometry();
  spikeGeometry.setAttribute('position', new GFX.BufferAttribute(position, 3));
  spikeGeometry.setAttribute('color', new GFX.BufferAttribute(color, 3));
  spikeGeometry.computeVertexNormals();
  const spikeMaterial = new GFX.MeshStandardMaterial({ name: 'spikes', vertexColors: true, metalness: 0.72, roughness: 0.22, flatShading: true });
  spikeMaterial.emissive.set('#1c2028');
  spikeMaterial.emissiveIntensity = 0.8;
  const mesh = new GFX.Mesh(spikeGeometry, spikeMaterial);
  mesh.name = 'spikes';

  const group = new GFX.Group();
  group.name = 'morningstar';
  group.add(core, mesh);

  const order = snapOrder(spikes);
  let snapped = 0;

  return {
    group, core, mesh, material, spikeMaterial,
    get snapped() { return snapped; },

    /** The first `n` spikes (a fixed few of them, not the same ones each time round the ball) broken short; the rest whole. */
    snap(n) {
      n = Math.max(0, Math.min(spikes, Math.round(n)));
      if (n === snapped) return false;
      snapped = n;
      kept.fill(1);
      for (let k = 0; k < n; k++) kept[order[k]] = STUMP;
      for (let i = 0; i < spikes; i++) build(i);
      spikeGeometry.attributes.position.needsUpdate = true;
      spikeGeometry.attributes.color.needsUpdate = true;
      spikeGeometry.computeVertexNormals();
      return true;
    },
  };
}
