import { METALS } from '../props/metalglobe.js';
import { createMarble, RADIUS as MARBLE_RADIUS } from '../heroes/marble.js';

/**
 * Weapons are authored in metres (one engine unit = one metre). A display
 * marble is the actual animated glass marble hero with its 3D spark, not a
 * substitute plinth. Weapon measurements exclude that display marble.
 */
export const WEAPON_WORLD_UNITS_PER_METRE = 1;
export const MARBLE_DISPLAY_BASE = Object.freeze({
  radius: MARBLE_RADIUS,
  diameter: MARBLE_RADIUS * 2,
  height: MARBLE_RADIUS * 2,
});

/** Place the engine's real glass-and-spark marble on the floor as the display base. */
export function createWeaponDisplayBase(GFX) {
  const asset = createMarble(GFX, { radius: MARBLE_RADIUS });
  asset.marble.position.y = MARBLE_RADIUS;
  const group = new GFX.Group();
  group.name = 'marble hero display base';
  group.add(asset.marble);
  return { group, marble: asset, radius: MARBLE_RADIUS, height: MARBLE_RADIUS * 2 };
}

/** A grayscale leather grain; the selected grip colour tints the map at runtime. */
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

/** A tapered cylinder between two measured points, aligned by a quaternion. */
function cylinderBetween(GFX, name, material, a, b, radiusA, radiusB, radial = 24) {
  const direction = new GFX.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const length = direction.length();
  if (length <= 1e-8) throw new RangeError('weapon component segment must have non-zero length');
  direction.normalize();
  const mesh = new GFX.Mesh(new GFX.CylinderGeometry(radiusB, radiusA, length, radial, 1), material);
  mesh.name = name;
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  mesh.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), direction);
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
 * A watertight, lenticular blade. Each cross-section is a closed 16-point
 * bevel profile. A root cap and a shared pointed apex make the blade a solid
 * body, not a pair of disconnected sheets. The central fuller is recessed
 * into both faces and fades to nothing at exactly 75% of blade length.
 */
export function bladeGeometry(GFX, { rootY, length, width }) {
  const sections = 64;
  const profile = [
    [-1.00, 0.00], [-0.82, 0.48], [-0.48, 0.86], [-0.30, 0.72],
    [0.00, 0.56], [0.30, 0.72], [0.48, 0.86], [0.82, 0.48],
    [1.00, 0.00], [0.82, -0.48], [0.48, -0.86], [0.30, -0.72],
    [0.00, -0.56], [-0.30, -0.72], [-0.48, -0.86], [-0.82, -0.48],
  ];
  const ringSize = profile.length;
  const positions = [], uvs = [], indices = [];
  const halfWidth = width / 2;

  for (let i = 0; i < sections; i++) {
    const t = i / sections;
    // Retain broad parallel shoulders, then carry a continuous distal taper
    // to the point rather than abruptly pinching the final quarter.
    const taper = 1 - 0.30 * t - 0.70 * smoothstep(0.70, 1, t);
    const w = halfWidth * Math.max(0.002, taper);
    // A sword blade is thin at the forte and becomes thinner toward its tip.
    const halfThickness = Math.max(0.00055, 0.0031 * (1 - 0.56 * t));
    // Fuller starts a short distance below the guard and ends at 3/4 length.
    const along = smoothstep(0.025, 0.14, t) * (1 - smoothstep(0.69, 0.75, t));
    for (let j = 0; j < ringSize; j++) {
      const [x, z] = profile[j];
      const across = Math.exp(-((x / 0.37) ** 2));
      const groove = 0.42 * along * across;
      positions.push(x * w, rootY + t * length, z * halfThickness * (1 - groove));
      uvs.push(j / ringSize, t);
    }
  }

  // The distal point is one shared vertex: this closes the blade and avoids a
  // flat, clipped end or a set of overlapping sliver faces.
  const tip = positions.length / 3;
  positions.push(0, rootY + length, 0);
  uvs.push(0.5, 1);

  // Root end cap: its outward normal faces down the hilt.
  const rootCenter = positions.length / 3;
  positions.push(0, rootY, 0);
  uvs.push(0.5, 0);
  for (let j = 0; j < ringSize; j++) {
    const next = (j + 1) % ringSize;
    indices.push(rootCenter, next, j);
  }

  for (let i = 0; i < sections - 1; i++) {
    for (let j = 0; j < ringSize; j++) {
      const a = i * ringSize + j;
      const b = i * ringSize + (j + 1) % ringSize;
      const c = (i + 1) * ringSize + j;
      const d = (i + 1) * ringSize + (j + 1) % ringSize;
      indices.push(a, c, b, b, c, d);
    }
  }
  const lastRing = (sections - 1) * ringSize;
  for (let j = 0; j < ringSize; j++) {
    const a = lastRing + j;
    const b = lastRing + (j + 1) % ringSize;
    indices.push(a, tip, b);
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
 * Shared measured construction for one-handed swords and later weapon families.
 * Individual assets provide their physical dimensions rather than arbitrary
 * display scales. The hilt is one coherent assembly; all guard segments are
 * aligned along their actual 3D direction.
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

  const display = createWeaponDisplayBase(GFX);
  const group = new GFX.Group();
  group.name = `${spec.name} display`;
  group.add(display.group);

  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const bladeMaterial = metalMaterial(GFX, 'blade metal', bladeMetal);
  const grip = new GFX.Group();
  grip.name = 'leather grip assembly';
  group.add(grip);

  const pommelRadius = spec.pommelDiameter / 2;
  // Seat the pommel just into the top of the actual marble, so the sword reads
  // as resting on the hero asset instead of floating above a display pedestal.
  const pommelCenterY = display.height + pommelRadius * 0.66;
  const gripBottom = pommelCenterY + pommelRadius * 0.72;
  const gripTop = gripBottom + spec.gripLength;
  const guardY = gripTop + 0.012;
  const bladeRootY = guardY + 0.006;

  grip.add(sphere(GFX, 'pommel', hiltMaterial,
    [0, pommelCenterY, 0], [pommelRadius, pommelRadius * 0.88, pommelRadius], [40, 28]));
  const pommelRing = new GFX.Mesh(
    new GFX.TorusGeometry(pommelRadius * 0.48, 0.0017, 8, 36),
    hiltMaterial,
  );
  pommelRing.name = 'pommel peen ring';
  pommelRing.position.set(0, pommelCenterY + pommelRadius * 0.72, 0);
  pommelRing.rotation.x = Math.PI / 2;
  grip.add(pommelRing);
  grip.add(sphere(GFX, 'pommel end cap', hiltMaterial,
    [0, pommelCenterY + pommelRadius * 0.84, 0], [0.006, 0.003, 0.006], [24, 16]));

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
    new GFX.CylinderGeometry(handleRadius * 0.94, handleRadius, spec.gripLength, 48, 1),
    leatherMaterial,
  );
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;
  grip.add(handle);

  // Closely spaced cord ridges add real relief over the fine leather grain.
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges',
    color: new GFX.Color(shadeHex(gripColor, 0.68)),
    roughness: 0.9,
    metalness: 0,
  });
  const wraps = 13;
  for (let i = 1; i < wraps; i++) {
    const y = gripBottom + (spec.gripLength * i) / wraps;
    const radius = handleRadius * (1 - 0.045 * (i / wraps));
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius, 0.00072, 6, 40), wrapMaterial);
    ring.name = 'leather wrap ridge';
    ring.position.set(0, y, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    grip.add(ring);
  }

  for (const [label, y, radius] of [
    ['lower grip ferrule', gripBottom + 0.002, handleRadius * 1.08],
    ['upper grip ferrule', gripTop - 0.002, handleRadius * 1.03],
  ]) {
    const ferrule = new GFX.Mesh(new GFX.TorusGeometry(radius, 0.0014, 8, 48), hiltMaterial);
    ferrule.name = label;
    ferrule.position.set(0, y, 0);
    ferrule.rotation.x = Math.PI / 2;
    ferrule.castShadow = true;
    grip.add(ferrule);
  }

  // A gently swept, continuous crossguard: each quillon segment follows the
  // path in the hilt's x/y plane, with no spurious vertical metal prongs.
  const span = spec.guardSpan / 2;
  const guardPoints = [
    [-span, guardY - 0.016, 0],
    [-span * 0.72, guardY - 0.010, 0],
    [-span * 0.36, guardY + 0.002, 0],
    [0, guardY + 0.009, 0],
    [span * 0.36, guardY + 0.002, 0],
    [span * 0.72, guardY - 0.010, 0],
    [span, guardY - 0.016, 0],
  ];
  for (let i = 0; i < guardPoints.length - 1; i++) {
    grip.add(cylinderBetween(GFX, 'swept crossguard quillon', hiltMaterial,
      guardPoints[i], guardPoints[i + 1], 0.0068, 0.0068, 24));
  }
  for (const side of [-1, 1]) {
    grip.add(sphere(GFX, 'crossguard terminal', hiltMaterial,
      [side * (span - 0.001), guardY - 0.016, 0], [0.0085, 0.0085, 0.0085], [24, 16]));
    const collar = new GFX.Mesh(new GFX.TorusGeometry(0.0072, 0.0011, 8, 28), hiltMaterial);
    collar.name = 'quillon terminal collar';
    collar.position.set(side * (span - 0.012), guardY - 0.016, 0);
    collar.rotation.x = Math.PI / 2;
    grip.add(collar);
  }
  grip.add(sphere(GFX, 'crossguard central boss', hiltMaterial,
    [0, guardY + 0.006, 0], [0.022, 0.012, 0.014], [32, 20]));
  for (const side of [-1, 1]) {
    grip.add(sphere(GFX, 'guard face rivet', hiltMaterial,
      [0, guardY + 0.006, side * 0.013], [0.004, 0.004, 0.002], [20, 12]));
  }

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
    hilt: grip,
    displayBase: display.group,
    marble: display.marble,
    dimensions: Object.freeze({
      overallLength: bladeRootY + spec.bladeLength - (pommelCenterY - pommelRadius * 0.88),
      bladeLength: spec.bladeLength,
      bladeWidth: spec.bladeWidth,
      gripLength: spec.gripLength,
      guardSpan: spec.guardSpan,
      fullerLength: spec.bladeLength * 0.75,
      unit: 'm',
    }),
    info: {
      'Weapon length': `${(bladeRootY + spec.bladeLength - (pommelCenterY - pommelRadius * 0.88)).toFixed(3)} m`,
      'Blade length': `${spec.bladeLength.toFixed(3)} m`,
      'Blade width': `${(spec.bladeWidth * 1000).toFixed(0)} mm`,
      'Grip length': `${(spec.gripLength * 1000).toFixed(0)} mm`,
      'Guard span': `${(spec.guardSpan * 1000).toFixed(0)} mm`,
      'Fuller length': `${(spec.bladeLength * 750).toFixed(0)} mm (75%)`,
      'Scale': '1 world unit = 1 metre',
      'Display base': 'Glass marble with 3D spark',
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
