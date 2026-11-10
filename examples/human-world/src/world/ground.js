import * as GFX from 'madness-engine/gfx';
import { linearRGB } from 'madness-engine/color';

/**
 * The ground: one flat sheet of tiles, each given a surface by `surfaceAt`,
 * drawn as one mesh per surface (each with its own painted texture) and
 * tinted at its corners so that no two stones are alike and everything
 * darkens toward the edge of the map, where the fog is meant to be.
 */

const hash = (x, z, s = 0) => { const v = Math.sin(x * 127.1 + z * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };

/** Smooth value noise, 0..1. */
export function noise(x, z, s = 0) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi, s), b = hash(xi + 1, zi, s), c = hash(xi, zi + 1, s), d = hash(xi + 1, zi + 1, s);
  return a + (b - a) * u + (c - a + (a - b - c + d) * u) * v;
}

/** The colour each surface is tinted, before the noise: the horror's drained green-grey. */
const TINT = {
  cobble: '#7c8080', flags: '#8a8c88', dirt: '#6e6a5e', mud: '#4a463c', grass: '#4c5a40', planks: '#7a6a58', marble: '#9a9c9a', scree: '#6a6c68',
};

/** How big each surface's texture is on the ground: repeats a tile. */
const REPEAT = { cobble: 0.7, flags: 0.5, dirt: 0.35, mud: 0.3, grass: 0.5, planks: 0.5, marble: 0.4, scree: 0.4 };

/**
 * @param materials  `createGround(GFX)`
 * @param surfaceAt  (x, z) → surface name
 * @param bounds     { x0, z0, x1, z1 } what to cover, in whole tiles
 * @param center     [x, z] the middle of the town, where the ground is lightest
 */
export function buildGround(materials, surfaceAt, { x0, z0, x1, z1 }, center = [40, 45], reach = 62) {
  const by = new Map();
  const corner = (x, z) => {
    // Darker at the far edges; mottled with two scales of noise.
    const d = Math.hypot(x - center[0], z - center[1]);
    const fade = 1 - Math.min(1, Math.max(0, (d - 22) / (reach - 22))) * 0.88;
    const mottle = 0.62 + noise(x * 0.25, z * 0.25, 3) * 0.5 + (noise(x * 1.3, z * 1.3, 9) - 0.5) * 0.28;
    return fade * mottle;
  };
  for (let z = z0; z < z1; z++) {
    for (let x = x0; x < x1; x++) {
      const surface = surfaceAt(x + 0.5, z + 0.5);
      if (!by.has(surface)) by.set(surface, { pos: [], nor: [], uv: [], col: [] });
      const g = by.get(surface);
      const tint = linearRGB(TINT[surface] ?? '#777777');
      const r = REPEAT[surface] ?? 0.5;
      const pts = [[x, z], [x, z + 1], [x + 1, z + 1], [x + 1, z]];
      const k = pts.map(([px, pz]) => corner(px, pz));
      const push = (i) => {
        const [px, pz] = pts[i];
        g.pos.push(px, 0, pz);
        g.nor.push(0, 1, 0);
        g.uv.push(px * r, pz * r);
        g.col.push(tint[0] * k[i], tint[1] * k[i], tint[2] * k[i]);
      };
      for (const i of [0, 1, 2, 0, 2, 3]) push(i);
    }
  }
  const group = new GFX.Group();
  group.name = 'ground';
  for (const [surface, g] of by) {
    const geometry = new GFX.BufferGeometry();
    geometry.setAttribute('position', new GFX.BufferAttribute(Float32Array.from(g.pos), 3));
    geometry.setAttribute('normal', new GFX.BufferAttribute(Float32Array.from(g.nor), 3));
    geometry.setAttribute('uv', new GFX.BufferAttribute(Float32Array.from(g.uv), 2));
    geometry.setAttribute('color', new GFX.BufferAttribute(Float32Array.from(g.col), 3));
    geometry.computeBoundingSphere();
    const mesh = new GFX.Mesh(geometry, materials[surface]);
    mesh.receiveShadow = true;
    mesh.name = `ground:${surface}`;
    group.add(mesh);
  }
  return group;
}
