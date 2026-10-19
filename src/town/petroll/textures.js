import { facadeTexture, floorTexture, wallTexture } from './paint.js';
import { SURFACES } from './surfaces.js';

/**
 * The materials the ground and the walls are drawn with: each surface's
 * floor texture (`paint.js`) and its bump, the colour and the night's light
 * in the vertex colours, and how it shines — oil and puddles and tar
 * glossy and reflecting the lights, the rest matte.
 */

const SHINE = {
  oil: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 1, iridescenceIOR: 1.6, bumpScale: 0.3 },
  wet: { roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.06, bumpScale: 0.6 },
  tar: { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, bumpScale: 0.4 },
};
const ROUGH = { asphalt: 0.82, plate: 0.42, grate: 0.45, pooltile: 0.3, shingles: 0.85, slabs: 0.8 };
const METAL = { plate: 0.55, grate: 0.6 };

const floors = new Map();
const walls = new Map();

/** The material for the tops of the tiles of `surface`. */
export function surfaceMaterial(GFX, surface) {
  if (floors.has(surface)) return floors.get(surface);
  const kind = SURFACES[surface] ?? SURFACES.concrete;
  const { map, bump } = floorTexture(GFX, kind.tex);
  const m = new GFX.MeshPhysicalMaterial({
    name: `floor-${surface}`, vertexColors: true, map, bumpMap: bump, bumpScale: 1.4,
    roughness: ROUGH[kind.tex] ?? 0.9, metalness: METAL[kind.tex] ?? 0,
    ...(kind.shine ? SHINE[kind.shine] : {}),
  });
  floors.set(surface, m);
  return m;
}

/** The material for walls of texture `name`. */
export function wallMaterial(GFX, name) {
  if (walls.has(name)) return walls.get(name);
  const { map, bump } = name.startsWith('facade:') ? facadeTexture(GFX, name.slice(7)) : wallTexture(GFX, name);
  const m = new GFX.MeshStandardMaterial({
    name: `wall-${name}`, vertexColors: true, map, bumpMap: bump, bumpScale: 1.6,
    roughness: name === 'hull' ? 0.45 : name.includes('office') || name.includes('shop') ? 0.35 : 0.85, metalness: name === 'hull' ? 0.5 : 0,
  });
  walls.set(name, m);
  return m;
}
