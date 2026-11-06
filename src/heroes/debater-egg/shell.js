import { METALS } from '../../props/metalglobe.js';

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

export function createShell(GFX, skin, { appearance = 'original', metal = 'steel' } = {}) {
  const geometry = new GFX.SphereGeometry(1, 128, 96);
  shapeEgg(geometry.attributes.position.array);
  smoothEggSeams(geometry);

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
  } else if (appearance === 'original') {
    material = new GFX.MeshPhysicalMaterial({
      name: 'eggshell',
      color: new GFX.Color(skin.map ? '#ffffff' : '#f0e3cd'),
      map: skin.map,
      bumpMap: skin.bumpMap,
      bumpScale: 0.7,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.6,
      sheen: 0.4,
      sheenColor: new GFX.Color('#fff2dd'),
    });
  } else {
    throw new Error(`unknown egg appearance: ${appearance}`);
  }

  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'shell';

  return { mesh, geometry, material };
}
