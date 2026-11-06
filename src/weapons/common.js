import { METALS } from '../props/metalglobe.js';
import { createMarble } from '../heroes/marble.js';

/** Weapon geometry is expressed in metres: one engine unit equals one metre. */
export const WEAPON_WORLD_UNITS_PER_METRE = 1;
export const MARBLE_POMMEL_RADIUS = 0.027;
export const MARBLE_POMMEL = Object.freeze({
  radius: MARBLE_POMMEL_RADIUS,
  diameter: MARBLE_POMMEL_RADIUS * 2,
});

/** The engine's actual glass marble and 3D spark, used as the sword's pommel. */
export function createWeaponPommelMarble(GFX, radius = MARBLE_POMMEL_RADIUS) {
  const asset = createMarble(GFX, { radius });
  asset.marble.position.y = radius;
  return { group: asset.marble, asset, radius, height: radius * 2 };
}

/** A grayscale crosshatched leather-grain texture, tinted by gripColor. */
function leatherMaps(GFX) {
  if (typeof document === 'undefined') return { map: null, bump: null };
  const width = 512, height = 256;
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = width;
  mapCanvas.height = height;
  const ctx = mapCanvas.getContext('2d');
  ctx.fillStyle = '#c7c7c7';
  ctx.fillRect(0, 0, width, height);
  for (let x = -height; x < width + height; x += 10) {
    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
    ctx.strokeStyle = '#e4e4e4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, 0);
    ctx.lineTo(x + height + 4, height);
    ctx.stroke();
  }
  for (let x = -height; x < width + height; x += 10) {
    ctx.strokeStyle = '#858585';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d');
  bumpCtx.fillStyle = '#777777';
  bumpCtx.fillRect(0, 0, width, height);
  bumpCtx.drawImage(mapCanvas, 0, 0);
  const map = new GFX.CanvasTexture(mapCanvas);
  map.colorSpace = GFX.SRGBColorSpace;
  map.anisotropy = 8;
  const bump = new GFX.CanvasTexture(bumpCanvas);
  bump.anisotropy = 8;
  return { map, bump };
}

function metalMaterial(GFX, name, metal) {
  const finish = METALS[metal];
  if (!finish) throw new Error(`no metal called ${metal}`);
  return new GFX.MeshPhysicalMaterial({
    name,
    color: new GFX.Color(finish.color),
    metalness: 1,
    roughness: finish.roughness,
    envMapIntensity: 3,
    clearcoat: 0.12,
    clearcoatRoughness: 0.22,
  });
}

function sphere(GFX, name, material, position, scale, detail = [32, 20]) {
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(1, ...detail), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Closed, lenticular blade geometry. It has a complete root cap and a shared
 * pointed apex, so it is a solid steel body, not an open pair of face sheets.
 * The shallow central fuller is a depression in both faces; it fades out at
 * 75% of blade length, leaving an uninterrupted, full-thickness point section.
 */
export function bladeGeometry(GFX, { rootY, length, width }) {
  const sections = 64;
  const profile = [
    [-1.00, 0.00], [-0.84, 0.44], [-0.54, 0.78], [-0.34, 0.70],
    [-0.20, 0.61], [0.00, 0.58], [0.20, 0.61], [0.34, 0.70],
    [0.54, 0.78], [0.84, 0.44], [1.00, 0.00],
    [0.84, -0.44], [0.54, -0.78], [0.34, -0.70],
    [0.20, -0.61], [0.00, -0.58], [-0.20, -0.61], [-0.34, -0.70],
    [-0.54, -0.78], [-0.84, -0.44],
  ];
  const ringSize = profile.length;
  const positions = [], uvs = [], indices = [];
  const halfWidth = width / 2;

  for (let i = 0; i < sections; i++) {
    const t = i / sections;
    // The blade holds its width through the forte before a long, steady taper.
    const shoulder = 0.94 + 0.06 * smoothstep(0, 0.11, t);
    const taper = shoulder * (1 - 0.12 * t - 0.88 * smoothstep(0.68, 1, t));
    const w = halfWidth * Math.max(0.002, taper);
    const halfThickness = Math.max(0.00055, 0.0032 * (1 - 0.48 * t));
    const fullerStart = smoothstep(0.025, 0.09, t);
    const fullerEnd = 1 - smoothstep(0.69, 0.75, t);
    const fuller = fullerStart * fullerEnd;
    for (let j = 0; j < ringSize; j++) {
      const [x, z] = profile[j];
      // A broad, shallow groove: never cut through the centre of the steel.
      const across = Math.exp(-((x / 0.38) ** 2));
      const groove = 0.14 * fuller * across;
      positions.push(x * w, rootY + t * length, z * halfThickness * (1 - groove));
      uvs.push((x + 1) / 2, t);
    }
  }

  const tip = positions.length / 3;
  positions.push(0, rootY + length, 0);
  uvs.push(0.5, 1);
  const rootCenter = positions.length / 3;
  positions.push(0, rootY, 0);
  uvs.push(0.5, 0);

  // Closed root face.
  for (let j = 0; j < ringSize; j++) {
    const next = (j + 1) % ringSize;
    indices.push(rootCenter, next, j);
  }
  // Closed perimeter.
  for (let i = 0; i < sections - 1; i++) {
    for (let j = 0; j < ringSize; j++) {
      const a = i * ringSize + j;
      const b = i * ringSize + (j + 1) % ringSize;
      const c = (i + 1) * ringSize + j;
      const d = (i + 1) * ringSize + (j + 1) % ringSize;
      indices.push(a, b, c, b, d, c);
    }
  }
  // Single solid point closes the distal end.
  const lastRing = (sections - 1) * ringSize;
  for (let j = 0; j < ringSize; j++) {
    const a = lastRing + j;
    const b = lastRing + (j + 1) % ringSize;
    indices.push(a, b, tip);
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function shadeHex(hex, factor) {
  const value = hex.slice(1);
  return `#${[0, 2, 4].map((i) => Math.round(parseInt(value.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Sweep a rounded bar along a continuous polyline. This avoids the broken
 * capped-cylinder joints and misaligned protruding strips of the old guard.
 */
function sweptGuardGeometry(GFX, points, radius, radialSegments = 12) {
  const centres = points.map((p) => new GFX.Vector3(...p));
  const positions = [], indices = [];
  for (let i = 0; i < centres.length; i++) {
    const tangent = centres[Math.min(i + 1, centres.length - 1)].clone()
      .sub(centres[Math.max(i - 1, 0)]).normalize();
    const normal = new GFX.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new GFX.Vector3(0, 0, 1);
    for (let j = 0; j < radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2;
      const point = centres[i].clone()
        .addScaledVector(normal, Math.cos(a) * radius)
        .addScaledVector(binormal, Math.sin(a) * radius);
      positions.push(point.x, point.y, point.z);
    }
  }
  for (let i = 0; i < centres.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * radialSegments + j;
      const b = i * radialSegments + (j + 1) % radialSegments;
      const c = (i + 1) * radialSegments + j;
      const d = (i + 1) * radialSegments + (j + 1) % radialSegments;
      indices.push(a, b, c, b, d, c);
    }
  }
  const start = positions.length / 3;
  positions.push(centres[0].x, centres[0].y, centres[0].z);
  const end = positions.length / 3;
  positions.push(centres.at(-1).x, centres.at(-1).y, centres.at(-1).z);
  for (let j = 0; j < radialSegments; j++) {
    const next = (j + 1) % radialSegments;
    indices.push(start, next, j);
    const a = (centres.length - 1) * radialSegments + j;
    const b = (centres.length - 1) * radialSegments + next;
    indices.push(end, a, b);
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Shared measured construction. The glass marble with the 3D spark replaces
 * the metal pommel at the bottom of the leather handle; it is not a stand.
 */
export function buildWeapon(GFX, spec, {
  bladeMetal = 'steel',
  hiltMetal = 'steel',
  gripColor = '#633b2c',
} = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('buildWeapon requires the Madness Engine GFX module');
  }
  for (const name of [bladeMetal, hiltMetal]) {
    if (!METALS[name]) throw new Error(`no metal called ${name}`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');

  const group = new GFX.Group();
  group.name = `${spec.name} display`;

  const marble = createWeaponPommelMarble(GFX, spec.marbleRadius);
  group.add(marble.group);

  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const bladeMaterial = metalMaterial(GFX, 'blade metal', bladeMetal);
  const hilt = new GFX.Group();
  hilt.name = 'connected hilt assembly';
  group.add(hilt);

  // Grip overlaps the marble at its base and the guard/boss at its upper end.
  const radius = marble.radius;
  const gripBottom = radius * 1.55;
  const gripTop = gripBottom + spec.gripLength;
  const guardY = gripTop + 0.006;
  const bladeRootY = guardY - 0.007;

  const leatherMapsResult = leatherMaps(GFX);
  const leatherMaterial = new GFX.MeshPhysicalMaterial({
    name: 'wrapped leather grip',
    color: new GFX.Color(gripColor),
    map: leatherMapsResult.map,
    bumpMap: leatherMapsResult.bump,
    bumpScale: 0.0014,
    roughness: 0.86,
    metalness: 0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.72,
  });
  const handleRadius = spec.gripDiameter / 2;
  const handle = new GFX.Mesh(
    new GFX.CylinderGeometry(handleRadius, handleRadius * 0.96, spec.gripLength + 0.012, 48, 1),
    leatherMaterial,
  );
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;
  hilt.add(handle);

  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges',
    color: new GFX.Color(shadeHex(gripColor, 0.68)),
    roughness: 0.9,
    metalness: 0,
  });
  const wraps = 13;
  for (let i = 1; i < wraps; i++) {
    const y = gripBottom + (spec.gripLength * i) / wraps;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(handleRadius * 1.005, 0.00072, 6, 40), wrapMaterial);
    ring.name = 'leather wrap ridge';
    ring.position.set(0, y, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    hilt.add(ring);
  }

  // A small central boss physically intersects both the leather handle and
  // the blade root, making the grip/guard/blade one visually continuous hilt.
  hilt.add(sphere(GFX, 'guard central boss', hiltMaterial,
    [0, guardY, 0], [0.026, 0.012, 0.016], [32, 20]));

  const span = spec.guardSpan / 2;
  const guardPoints = [
    [-span, guardY - 0.011, 0],
    [-span * 0.76, guardY - 0.006, 0],
    [-span * 0.42, guardY + 0.002, 0],
    [0, guardY + 0.006, 0],
    [span * 0.42, guardY + 0.002, 0],
    [span * 0.76, guardY - 0.006, 0],
    [span, guardY - 0.011, 0],
  ];
  const guard = new GFX.Mesh(sweptGuardGeometry(GFX, guardPoints, 0.0068, 14), hiltMaterial);
  guard.name = 'continuous swept crossguard';
  guard.castShadow = true;
  guard.receiveShadow = true;
  hilt.add(guard);
  for (const side of [-1, 1]) {
    hilt.add(sphere(GFX, 'quillon rounded terminal', hiltMaterial,
      [side * span, guardY - 0.011, 0], [0.008, 0.008, 0.008], [24, 16]));
  }

  // The tang/blade begins inside the guard boss and overlaps it by 7 mm.
  const blade = new GFX.Mesh(bladeGeometry(GFX, {
    rootY: bladeRootY,
    length: spec.bladeLength,
    width: spec.bladeWidth,
  }), bladeMaterial);
  blade.name = 'solid double-edged blade with 75% fuller';
  blade.castShadow = true;
  blade.receiveShadow = true;
  group.add(blade);

  const api = {
    group,
    blade,
    hilt,
    handle,
    marble,
    pommel: marble.group,
    dimensions: Object.freeze({
      overallLength: bladeRootY + spec.bladeLength,
      bladeLength: spec.bladeLength,
      bladeWidth: spec.bladeWidth,
      gripLength: spec.gripLength,
      guardSpan: spec.guardSpan,
      fullerLength: spec.bladeLength * 0.75,
      marbleDiameter: marble.radius * 2,
      unit: 'm',
    }),
    info: {
      'Weapon length': `${(bladeRootY + spec.bladeLength).toFixed(3)} m`,
      'Blade length': `${spec.bladeLength.toFixed(3)} m`,
      'Blade width': `${(spec.bladeWidth * 1000).toFixed(0)} mm`,
      'Grip length': `${(spec.gripLength * 1000).toFixed(0)} mm`,
      'Guard span': `${(spec.guardSpan * 1000).toFixed(0)} mm`,
      'Fuller length': `${(spec.bladeLength * 750).toFixed(0)} mm (75%)`,
      'Scale': '1 world unit = 1 metre',
      'Pommel': 'Glass marble with 3D spark',
    },
    get bladeMetal() { return bladeMetal; },
    get hiltMetal() { return hiltMetal; },
    get gripColor() { return gripColor; },
    setBladeMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      bladeMaterial.color.set(finish.color);
      bladeMaterial.roughness = finish.roughness;
      bladeMetal = name;
      return api;
    },
    setHiltMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      hiltMaterial.color.set(finish.color);
      hiltMaterial.roughness = finish.roughness;
      hiltMetal = name;
      return api;
    },
    setGripColor(color) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');
      leatherMaterial.color.set(color);
      wrapMaterial.color.set(shadeHex(color, 0.68));
      gripColor = color;
      return api;
    },
  };
  return api;
}
