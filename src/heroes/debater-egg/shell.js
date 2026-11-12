import { METALS } from '../../props/metalglobe.js';
import { WOOD_LOOKS } from '../../props/wood-board.js';
import { CHOCOLATES, chocolateTexture } from '../../textures/chocolate.js';
import { WOOD_FINISHES, WOOD_SPECIES, woodTexture } from '../../textures/wood.js';

export function shapeEgg(positions) {
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const taper = 1 - 0.075 * y - 0.055 * y * y;
    positions[i] *= 0.84 * taper;
    positions[i + 2] *= 0.84 * taper;
    positions[i + 1] = y * 1.03 + 0.01;
  }
  return positions;
}

export function smoothEggSeams(geometry) {
  const uv = geometry.attributes.uv;
  const position = geometry.attributes.position;
  if (!uv || !position) {
    geometry.computeVertexNormals();
    return geometry;
  }

  const starts = new Map();
  const ends = new Map();
  const poles = [[], []];
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (u <= 1e-6) starts.set(Math.round(v * 1e6), i);
    else if (u >= 1 - 1e-6) ends.set(Math.round(v * 1e6), i);
    if (v >= 1 - 1e-6) poles[0].push(i);
    else if (v <= 1e-6) poles[1].push(i);
  }

  const pairs = [];
  for (const [row, a] of starts) {
    const b = ends.get(row);
    if (b === undefined) continue;
    const x = (position.getX(a) + position.getX(b)) * 0.5;
    const y = (position.getY(a) + position.getY(b)) * 0.5;
    const z = (position.getZ(a) + position.getZ(b)) * 0.5;
    position.setXYZ(a, x, y, z);
    position.setXYZ(b, x, y, z);
    pairs.push([a, b]);
  }

  // Every UV triangle fan at a sphere pole shares the same physical vertex.
  for (const group of poles) {
    if (group.length < 2) continue;
    let x = 0, y = 0, z = 0;
    for (const i of group) {
      x += position.getX(i);
      y += position.getY(i);
      z += position.getZ(i);
    }
    x /= group.length; y /= group.length; z /= group.length;
    for (const i of group) position.setXYZ(i, x, y, z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const normal = geometry.attributes.normal;
  if (normal) {
    const shareNormal = (indices) => {
      let x = 0, y = 0, z = 0;
      for (const i of indices) {
        x += normal.getX(i); y += normal.getY(i); z += normal.getZ(i);
      }
      const length = Math.hypot(x, y, z) || 1;
      x /= length; y /= length; z /= length;
      for (const i of indices) normal.setXYZ(i, x, y, z);
    };
    for (const [a, b] of pairs) shareNormal([a, b]);
    for (const group of poles) if (group.length > 1) shareNormal(group);
    normal.needsUpdate = true;
  }
  return geometry;
}

/**
 * Turns the egg's texture coordinates a quarter: u runs pole to pole and v round. The wood maps have their grain
 * along u, so on the egg it runs from tip to tip, as it does on a turned egg, and closes up toward both ends.
 */
function grainAlongEgg(GFX, geometry) {
  const uv = geometry.attributes.uv;
  const turned = new Float32Array(uv.count * 2);
  for (let i = 0; i < uv.count; i++) {
    turned[i * 2] = 1 - uv.getY(i);
    turned[i * 2 + 1] = uv.getX(i);
  }
  geometry.setAttribute('uv', new GFX.BufferAttribute(turned, 2));
  return geometry;
}

const hex = ([r, g, b]) => `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;

/** Dresses `material` in `species` in `finish` (see `textures/wood`). The grain is slow to read on a curve, so the bump is a little stronger than a board's. */
export function dressInWood(GFX, material, species, finish) {
  if (!Object.hasOwn(WOOD_SPECIES, species)) throw new Error(`no wood called ${species}`);
  if (!WOOD_FINISHES.includes(finish)) throw new Error(`no wood finish called ${finish}`);
  const { map, bump } = woodTexture(GFX, species, finish);
  const look = WOOD_LOOKS[finish];
  material.map = map;
  material.bumpMap = bump;
  // Without a canvas (the tests) there is no grain to paint: the species' own color stands in.
  material.color.set(map ? '#ffffff' : hex(WOOD_SPECIES[species].base));
  material.metalness = 0;
  material.roughness = look.roughness;
  material.clearcoat = look.clearcoat;
  material.clearcoatRoughness = look.clearcoatRoughness;
  material.bumpScale = look.bumpScale * 2;
  material.needsUpdate = true;
  return material;
}

/** Dresses `material` in molded chocolate of `kind` (see `textures/chocolate`). */
export function dressInChocolate(GFX, material, kind) {
  const look = CHOCOLATES[kind];
  if (!look) throw new Error(`no chocolate called ${kind}`);
  const { map, bump } = chocolateTexture(GFX, kind);
  material.map = map;
  material.bumpMap = bump;
  material.color.set(map ? '#ffffff' : look.color);
  material.metalness = 0;
  material.roughness = 0.5 - look.gloss * 0.3;
  material.clearcoat = look.gloss;
  material.clearcoatRoughness = 0.5 - look.gloss * 0.42;
  material.bumpScale = 0.5;
  material.needsUpdate = true;
  return material;
}

/** The varieties of the original egg: Marc's speckled cream, and the plain white and brown ones. */
export const EGG_VARIETIES = Object.freeze({
  speckled: { color: '#f0e3cd' },
  white: { color: '#f7f4ee' },
  brown: { color: '#a56f45' },
});

/** Dresses `material` as `variety`. `skin` is the speckled skin (see `skin.js`), needed only for that one: the plain ones are a color. */
export function dressInVariety(material, variety, skin) {
  const look = EGG_VARIETIES[variety];
  if (!look) throw new Error(`no egg variety called ${variety}`);
  const speckled = variety === 'speckled' && skin?.map;
  material.map = speckled ? skin.map : null;
  material.bumpMap = speckled ? skin.bumpMap : null;
  material.color.set(speckled ? '#ffffff' : look.color);
  material.needsUpdate = true;
  return material;
}

export function createShell(GFX, skin, { appearance = 'original', metal = 'steel', species = 'walnut', finish = 'lacquered', chocolate = 'milk', variety = 'speckled' } = {}) {
  const geometry = new GFX.SphereGeometry(1, 128, 96);
  shapeEgg(geometry.attributes.position.array);
  smoothEggSeams(geometry);
  if (appearance === 'wood') grainAlongEgg(GFX, geometry);

  let material;
  if (appearance === 'metal') {
    const finish = METALS[metal];
    if (!finish) throw new Error(`no metal called ${metal}`);
    material = new GFX.MeshPhysicalMaterial({
      name: 'metal-eggshell',
      color: new GFX.Color(finish.color),
      metalness: 1,
      roughness: finish.roughness,
      envMapIntensity: 3,
    });
  } else if (appearance === 'glass') {
    material = new GFX.MeshPhysicalMaterial({
      name: 'glass-eggshell',
      color: new GFX.Color('#ffffff'),
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 0.6,
      ior: 1.5,
      attenuationColor: new GFX.Color('#ffffff'),
      attenuationDistance: 8,
      clearcoat: 0.6,
      clearcoatRoughness: 0.02,
      specularIntensity: 1,
      depthWrite: false,
    });
  } else if (appearance === 'wood') {
    material = new GFX.MeshPhysicalMaterial({ name: 'wooden-eggshell', color: new GFX.Color('#ffffff') });
    dressInWood(GFX, material, species, finish);
  } else if (appearance === 'chocolate') {
    material = new GFX.MeshPhysicalMaterial({
      name: 'chocolate-eggshell',
      color: new GFX.Color('#ffffff'),
      envMapIntensity: 1.1,
    });
    dressInChocolate(GFX, material, chocolate);
  } else if (appearance === 'original') {
    if (!EGG_VARIETIES[variety]) throw new Error(`no egg variety called ${variety}`);
    material = new GFX.MeshPhysicalMaterial({
      name: 'eggshell',
      color: new GFX.Color('#ffffff'),
      bumpScale: 0.7,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.6,
      sheen: 0.4,
      sheenColor: new GFX.Color('#fff2dd'),
    });
    dressInVariety(material, variety, skin);
  } else {
    throw new Error(`unknown egg appearance: ${appearance}`);
  }

  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'shell';

  return { mesh, geometry, material };
}
