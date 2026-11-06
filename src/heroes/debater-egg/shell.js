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

export function createShell(GFX, skin, { appearance = 'original', metal = 'steel' } = {}) {
  const geometry = new GFX.SphereGeometry(1, 128, 96);
  shapeEgg(geometry.attributes.position.array);
  geometry.computeVertexNormals();

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
