import { METALS } from '../props/metalglobe.js';
import { createMarble } from '../heroes/marble.js';
import { createShell } from '../heroes/debater-egg/shell.js';
import { createBall } from '../heroes/krystal/model.js';
import { createBladeMist } from './blade-mist.js';

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

/**
 * A solid metal sphere matching the existing marble pommel's measured envelope.
 * It shares the hilt finish so one metal selector updates both.
 */
function createMetalBallPommel(GFX, radius, material) {
  const group = new GFX.Group();
  group.name = 'metal ball pommel';
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(radius, 64, 40), material);
  mesh.name = 'metal ball pommel sphere';
  mesh.position.y = radius;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return { group, mesh, radius, height: radius * 2, kind: 'metal-ball' };
}

/**
 * Krystal's actual crystal orb, scaled to the existing 54 mm pommel envelope.
 * Keep its transmissive glass and ray-marched vision mesh, but omit the brass
 * stand, lip and collar: the sword's hollow ferrule takes their place.
 */
function createKrystalOrbPommel(GFX, radius) {
  const { ball, glass, vision, visionMaterial } = createBall(GFX);
  ball.remove(glass, vision);

  const group = new GFX.Group();
  group.name = 'Krystal crystal orb pommel';
  const scale = radius / 0.8;
  group.scale.setScalar(scale);
  group.position.y = radius;
  group.add(glass, vision);

  // Scale the optical depth with the measured glass size. The shader works
  // in the orb's original local units, so its 0.95-radius vision stays intact.
  glass.material.thickness *= scale;
  glass.material.attenuationDistance *= scale;
  glass.castShadow = false;
  vision.castShadow = false;
  vision.receiveShadow = false;
  visionMaterial.uniforms.uShape.value.set(scale, scale, scale);

  const timer = new GFX.Timer();
  glass.onBeforeRender = () => {
    timer.update();
    visionMaterial.uniforms.uFlow.value += Math.min(timer.getDelta(), 0.05) * 0.18;
    vision.updateWorldMatrix?.(true, false);
    visionMaterial.uniforms.uCenter.value.setFromMatrixPosition(vision.matrixWorld);
  };

  return {
    group, glass, vision, material: visionMaterial, radius, height: radius * 2,
    kind: 'krystal-orb',
  };
}

/** Reuse Marc's actual engine Metal Egg, with its broad end against the grip. */
function createMetalEggPommel(GFX, radius, metal) {
  // Use the actual egg shell mesh, not Marc's animated character rig. The
  // lower end of the engine egg is broader; flip Y so that broad end seats
  // against the leather grip. This mesh has no animation or render callback.
  const asset = createShell(GFX, { map: null, bumpMap: null }, { appearance: 'metal', metal });
  const group = new GFX.Group();
  group.name = 'static engine metal egg pommel';
  const radialScale = 0.032;
  const verticalScale = radius / 1.03;
  asset.mesh.scale.set(radialScale, -verticalScale, radialScale);
  asset.mesh.position.y = radius + 0.0125;
  asset.mesh.castShadow = true;
  asset.mesh.receiveShadow = true;
  asset.mesh.name = 'stationary metal egg shell';
  group.add(asset.mesh);
  let selectedMetal = metal;
  return {
    group, asset, mesh: asset.mesh, radius, height: radius * 2, kind: 'metal-egg',
    get metal() { return selectedMetal; },
    setMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      asset.material.color.set(finish.color);
      asset.material.roughness = finish.roughness;
      selectedMetal = name;
      return this;
    },
  };
}

function createWeaponPommel(GFX, spec, { style = 'marble', metal, material } = {}) {
  if (style === 'marble') return { ...createWeaponPommelMarble(GFX, spec.marbleRadius), kind: 'marble' };
  if (style === 'metal-ball') return createMetalBallPommel(GFX, spec.marbleRadius, material);
  if (style === 'metal-egg') return createMetalEggPommel(GFX, spec.marbleRadius, metal);
  if (style === 'krystal') return createKrystalOrbPommel(GFX, spec.marbleRadius);
  throw new Error(`unknown weapon pommel style: ${style}`);
}

/** A continuous helical leather cord laid over the cylindrical grip. */
function diagonalWrapGeometry(GFX, {
  radius, startY, height, pitch = 0.0117, tubeRadius = 0.00105, radialSegments = 8,
} = {}) {
  const turns = height / pitch;
  const tubularSegments = Math.max(24, Math.ceil(turns * 28));
  const positions = [], indices = [];
  const angularTravel = turns * Math.PI * 2;
  const risePerRadian = height / angularTravel;
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const angle = t * angularTravel;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const center = new GFX.Vector3(radius * cos, startY + height * t, radius * sin);
    const tangent = new GFX.Vector3(-radius * sin, risePerRadian, radius * cos).normalize();
    const normal = new GFX.Vector3(cos, 0, sin);
    const binormal = tangent.clone().cross(normal).normalize();
    for (let j = 0; j < radialSegments; j++) {
      const a = j / radialSegments * Math.PI * 2;
      const point = center.clone()
        .addScaledVector(normal, Math.cos(a) * tubeRadius)
        .addScaledVector(binormal, Math.sin(a) * tubeRadius);
      positions.push(point.x, point.y, point.z);
    }
  }
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * radialSegments + j;
      const b = i * radialSegments + (j + 1) % radialSegments;
      const c = (i + 1) * radialSegments + j;
      const d = (i + 1) * radialSegments + (j + 1) % radialSegments;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Two tapered prongs curl upward and inward like devil horns. */
/**
 * Marc blade guard: the original Madness swept crossguard with its curvature
 * inverted. The same seven-point arch is retained; only the ends are extended
 * and tapered into points in place of the original rounded terminal balls.
 */
export function createDevilHornGuard(GFX, parent, material, {
  centerY, span = 0.22, thickness = 0.0136,
} = {}) {
  const halfSpan = span / 2;
  const bend = 0.012;
  const tipExtension = Math.min(0.014, Math.max(0.008, span * 0.06));
  const bodyRadius = thickness / 2;
  const oldBallRadius = 0.008 * (thickness / 0.0136);

  // The seven original Madness points, reflected vertically with a slightly
  // stronger arch. Two short extensions turn the old ball ends into points.
  const points = [
    [-halfSpan - tipExtension, centerY + 0.026, 0],
    [-halfSpan, centerY + bend, 0],
    [-halfSpan * 0.76, centerY + 0.007, 0],
    [-halfSpan * 0.42, centerY - 0.002, 0],
    [0, centerY - 0.007, 0],
    [halfSpan * 0.42, centerY - 0.002, 0],
    [halfSpan * 0.76, centerY + 0.007, 0],
    [halfSpan, centerY + bend, 0],
    [halfSpan + tipExtension, centerY + 0.026, 0],
  ];
  const radii = [
    0.00012, oldBallRadius,
    bodyRadius, bodyRadius, bodyRadius, bodyRadius, bodyRadius,
    oldBallRadius, 0.00012,
  ];

  const centres = points.map((point) => new GFX.Vector3(...point));
  const radialSegments = 20;
  const samplesPerSegment = 6;
  const sampledCentres = [];
  const sampledRadii = [];

  // Smoothly interpolate the original guard stations so the points flow out
  // of the crossguard without abrupt kinks or visible joins.
  const catmullRom = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return p1.clone().multiplyScalar(2)
      .add(p2.clone().sub(p0).multiplyScalar(t))
      .add(p0.clone().multiplyScalar(2).sub(p1.clone().multiplyScalar(5))
        .add(p2.clone().multiplyScalar(4)).sub(p3).multiplyScalar(t2))
      .add(p1.clone().multiplyScalar(3).sub(p0).sub(p2.clone().multiplyScalar(3)).add(p3)
        .multiplyScalar(t3))
      .multiplyScalar(0.5);
  };

  for (let segment = 0; segment < centres.length - 1; segment++) {
    const p0 = centres[Math.max(0, segment - 1)];
    const p1 = centres[segment];
    const p2 = centres[segment + 1];
    const p3 = centres[Math.min(centres.length - 1, segment + 2)];
    for (let step = 0; step < samplesPerSegment; step++) {
      const t = step / samplesPerSegment;
      sampledCentres.push(catmullRom(p0, p1, p2, p3, t));
      const smooth = t * t * (3 - 2 * t);
      sampledRadii.push(radii[segment] * (1 - smooth) + radii[segment + 1] * smooth);
    }
  }
  sampledCentres.push(centres.at(-1).clone());
  sampledRadii.push(radii.at(-1));

  const positions = [];
  const indices = [];
  const ringStarts = [];
  positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);

  for (let i = 1; i < sampledCentres.length - 1; i++) {
    const tangent = sampledCentres[i + 1].clone()
      .sub(sampledCentres[i - 1]).normalize();
    const normal = new GFX.Vector3(-tangent.y, tangent.x, 0).normalize();
    const binormal = new GFX.Vector3(0, 0, 1);
    ringStarts.push(positions.length / 3);
    for (let j = 0; j < radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const vertex = sampledCentres[i].clone()
        .addScaledVector(normal, Math.cos(angle) * sampledRadii[i])
        .addScaledVector(binormal, Math.sin(angle) * sampledRadii[i]);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  }

  const endTip = positions.length / 3;
  const finalPoint = sampledCentres.at(-1);
  positions.push(finalPoint.x, finalPoint.y, finalPoint.z);

  for (let j = 0; j < radialSegments; j++) {
    indices.push(0, ringStarts[0] + (j + 1) % radialSegments, ringStarts[0] + j);
  }
  for (let ring = 0; ring < ringStarts.length - 1; ring++) {
    const a0 = ringStarts[ring], b0 = ringStarts[ring + 1];
    for (let j = 0; j < radialSegments; j++) {
      const a = a0 + j;
      const b = a0 + (j + 1) % radialSegments;
      const c = b0 + j;
      const d = b0 + (j + 1) % radialSegments;
      indices.push(a, b, c, b, d, c);
    }
  }
  const finalRing = ringStarts.at(-1);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(finalRing + j, finalRing + (j + 1) % radialSegments, endTip);
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const guard = new GFX.Group();
  guard.name = 'Marc inverted Madness swept guard';
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'Madness swept guard with integrated pointed terminals';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  guard.add(mesh);
  parent.add(guard);
  return guard;
}

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

export function shadeHex(hex, factor) {
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
/**
 * The shared weapon handle: the real glass-and-spark pommel, tapered hollow
 * metal ferrule, wrapped leather grip and fitted upper metal seat. Sword and
 * hafted weapon families use this same construction.
 */
export function createWeaponHandleAssembly(GFX, group, spec, {
  hiltMetal = 'steel',
  gripColor = '#633b2c',
  pommelStyle = spec.pommelStyle ?? 'marble',
  wrapStyle = spec.wrapStyle ?? 'banded',
} = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('createWeaponHandleAssembly requires the Madness Engine GFX module');
  }
  if (!METALS[hiltMetal]) throw new Error(`no metal called ${hiltMetal}`);
  if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');

  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const pommelAsset = createWeaponPommel(GFX, spec, {
    style: pommelStyle, metal: hiltMetal, material: hiltMaterial,
  });
  const marble = pommelAsset.kind === 'marble' ? pommelAsset : null;
  group.add(pommelAsset.group);

  const hilt = new GFX.Group();
  hilt.name = 'connected hilt assembly';
  group.add(hilt);

  // Every pommel variant preserves the same 54 mm attachment envelope.
  const radius = pommelAsset.radius;
  const gripBottom = pommelAsset.height + 0.005;
  const gripTop = gripBottom + spec.gripLength;
  // The leather grip stops at gripTop. A short metal cap overlaps its end by
  // 2 mm, and the raised boss sits above that cap to conceal the joint.

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
    new GFX.CylinderGeometry(handleRadius, handleRadius * 0.96, spec.gripLength, 48, 1),
    leatherMaterial,
  );
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;

  // Hollow, turned-metal bezel. Its lower lip seats around the pommel and
  // its upper lip overlaps the leather end with the established fitted profile.
  const bezel = new GFX.Group();
  bezel.name = pommelStyle === 'marble' ? 'marble-to-leather metal bezel' : 'pommel-to-leather metal bezel';
  // Bell-shaped ferrule: flared where it follows the marble's upper
  // shoulder, then necked down to the same diameter as the upper guard seat.
  // The opening stays clear of the spark; the upper lip slips 1.2 mm over the
  // leather so the metal-to-leather joint reads as a fitted ferrule.
  const bezelTopRadius = handleRadius * 1.08;
  const bezelBottomRadius = Math.min(radius * 0.86, handleRadius * 1.34);
  const bezelBottom = radius + Math.sqrt(radius * radius - bezelBottomRadius * bezelBottomRadius);
  const bezelTop = gripBottom + 0.0012;
  const bezelHeight = bezelTop - bezelBottom;
  const bezelSleeve = new GFX.Mesh(
    new GFX.CylinderGeometry(bezelTopRadius, bezelBottomRadius, bezelHeight, 48, 1, true),
    hiltMaterial,
  );
  bezelSleeve.name = 'pommel bezel tapered hollow sleeve';
  bezelSleeve.position.set(0, (bezelBottom + bezelTop) / 2, 0);
  bezelSleeve.castShadow = true;
  bezelSleeve.receiveShadow = true;
  bezel.add(bezelSleeve);
  for (const [name, y, rimRadius, rimThickness] of [
    ['pommel bezel lower flared rim', bezelBottom + 0.0006, bezelBottomRadius, 0.0008],
    ['pommel bezel upper handle-fit rim', bezelTop - 0.0006, bezelTopRadius, 0.00065],
  ]) {
    const rim = new GFX.Mesh(
      new GFX.TorusGeometry(rimRadius, rimThickness, 10, 48),
      hiltMaterial,
    );
    rim.name = name;
    rim.position.set(0, y, 0);
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    bezel.add(rim);
  }
  hilt.add(bezel, handle);

  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges',
    color: new GFX.Color(shadeHex(gripColor, 0.68)),
    roughness: 0.9,
    metalness: 0,
  });
  if (wrapStyle === 'diagonal') {
    const helix = new GFX.Mesh(diagonalWrapGeometry(GFX, {
      radius: handleRadius + 0.00055,
      startY: gripBottom,
      height: spec.gripLength,
      pitch: spec.diagonalWrapPitch ?? 0.0117,
    }), wrapMaterial);
    helix.name = 'diagonal leather wrap';
    helix.castShadow = true;
    helix.receiveShadow = true;
    hilt.add(helix);
  } else if (wrapStyle === 'banded') {
    const wraps = spec.gripWrapDivisions ?? 13;
    for (let i = 1; i < wraps; i++) {
      const y = gripBottom + (spec.gripLength * i) / wraps;
      const ring = new GFX.Mesh(new GFX.TorusGeometry(handleRadius * 1.005, 0.00072, 6, 40), wrapMaterial);
      ring.name = 'leather wrap ridge';
      ring.position.set(0, y, 0);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      hilt.add(ring);
    }
  } else {
    throw new Error(`unknown weapon grip wrap style: ${wrapStyle}`);
  }

  // A short metal boss-seat caps the handle end. It overlaps the leather by
  // only 2 mm, but its wider footprint covers the entire cut end. The raised
  // central boss sits on this seat and overlaps it, not the length of the grip.
  const bossSeatBottom = gripTop - 0.002;
  const bossSeatTop = gripTop + 0.004;
  const bossSeat = new GFX.Mesh(
    new GFX.CylinderGeometry(handleRadius * 1.18, handleRadius * 1.18, bossSeatTop - bossSeatBottom, 48),
    hiltMaterial,
  );
  bossSeat.name = 'guard boss lower cap';
  bossSeat.position.set(0, (bossSeatBottom + bossSeatTop) / 2, 0);
  bossSeat.castShadow = true;
  bossSeat.receiveShadow = true;
  hilt.add(bossSeat);


  return {
    marble,
    pommelAsset,
    hilt,
    hiltMaterial,
    handle,
    bezel,
    gripBottom,
    gripTop,
    gripBounds: Object.freeze({ bottom: gripBottom, top: gripTop }),
    handleBounds: Object.freeze({
      bottom: handle.position.y - spec.gripLength / 2,
      top: handle.position.y + spec.gripLength / 2,
      length: spec.gripLength,
    }),
    bezelBounds: Object.freeze({
      bottom: bezelBottom,
      top: bezelTop,
      bottomRadius: bezelBottomRadius,
      topRadius: bezelTopRadius,
      outerRadius: bezelBottomRadius,
    }),
    bossSeat,
    bossSeatBounds: Object.freeze({ bottom: bossSeatBottom, top: bossSeatTop }),
    leatherMaterial,
    wrapMaterial,
    gripColor,
  };
}

export function buildWeapon(GFX, spec, {
  bladeMetal = 'steel',
  hiltMetal = 'steel',
  gripColor = '#633b2c',
  bladeMist: withBladeMist = false,
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

  const bladeMaterial = metalMaterial(GFX, 'blade metal', bladeMetal);
  const {
    marble, hiltMaterial, hilt, handle, bezel, gripBounds, handleBounds,
    bezelBounds, bossSeat, bossSeatBounds, leatherMaterial, wrapMaterial, pommelAsset,
  } = createWeaponHandleAssembly(GFX, group, spec, {
    hiltMetal, gripColor,
    pommelStyle: spec.pommelStyle ?? 'marble',
    wrapStyle: spec.wrapStyle ?? 'banded',
  });

  // The boss and guard sit above the shared handle's fitted metal seat.
  const guardY = gripBounds.top + 0.012;
  const bladeRootY = guardY - 0.007;

  let guard;
  let guardBoss;
  const guardThickness = spec.guardThickness ?? 0.0136;
  const span = spec.guardSpan / 2;
  if ((spec.guardStyle ?? 'swept') === 'horns') {
    guard = createDevilHornGuard(GFX, hilt, hiltMaterial, {
      centerY: guardY, span: spec.guardSpan, thickness: guardThickness,
    });
    guardBoss = guard.children[0];
  } else if (spec.guardStyle === undefined || spec.guardStyle === 'swept') {
    guardBoss = sphere(GFX, 'guard central boss', hiltMaterial,
      [0, guardY, 0], [0.026, 0.015, 0.016], [32, 20]);
    hilt.add(guardBoss);
    const guardRadius = guardThickness / 2;
    const guardTerminalRadius = 0.008 * (guardThickness / 0.0136);
    const guardPoints = [
      [-span, guardY - 0.011, 0],
      [-span * 0.76, guardY - 0.006, 0],
      [-span * 0.42, guardY + 0.002, 0],
      [0, guardY + 0.006, 0],
      [span * 0.42, guardY + 0.002, 0],
      [span * 0.76, guardY - 0.006, 0],
      [span, guardY - 0.011, 0],
    ];
    guard = new GFX.Mesh(sweptGuardGeometry(GFX, guardPoints, guardRadius, 14), hiltMaterial);
    guard.name = 'continuous swept crossguard';
    guard.castShadow = true;
    guard.receiveShadow = true;
    hilt.add(guard);
    for (const side of [-1, 1]) {
      hilt.add(sphere(GFX, 'quillon rounded terminal', hiltMaterial,
        [side * span, guardY - 0.011, 0],
        [guardTerminalRadius, guardTerminalRadius, guardTerminalRadius], [24, 16]));
    }
  } else {
    throw new Error(`unknown weapon guard style: ${spec.guardStyle}`);
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

  // Krystal's variants add a separate, hidden-by-default mist volume that
  // follows the exact blade dimensions without changing the steel geometry.
  const bladeMistLayer = withBladeMist
    ? createBladeMist(GFX, group, {
      rootY: bladeRootY,
      length: spec.bladeLength,
      width: spec.bladeWidth,
    })
    : null;

  const api = {
    group,
    blade,
    bladeMist: bladeMistLayer?.mesh ?? null,
    hilt,
    handle,
    guard,
    bezel,
    marble,
    pommelAsset,
    pommel: pommelAsset.group,
    gripBounds,
    handleBounds,
    bezelBounds,
    guardY,
    bossSeat,
    bossSeatBounds,
    guardBoss,
    dimensions: Object.freeze({
      overallLength: bladeRootY + spec.bladeLength,
      bladeLength: spec.bladeLength,
      bladeWidth: spec.bladeWidth,
      gripLength: spec.gripLength,
      guardSpan: spec.guardSpan,
      guardThickness,
      fullerLength: spec.bladeLength * 0.75,
      marbleDiameter: marble ? marble.radius * 2 : null,
      pommelDiameter: pommelAsset.radius * 2,
      pommelStyle: pommelAsset.kind,
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
      'Pommel': pommelAsset.kind === 'marble' ? 'Glass marble with 3D spark'
        : pommelAsset.kind === 'metal-ball' ? 'Solid metal ball'
          : pommelAsset.kind === 'metal-egg' ? 'Engine metal egg' : 'Krystal glass orb with animated mist',
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
      pommelAsset.setMetal?.(name);
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
    setBladeMist(show = true) {
      if (bladeMistLayer) bladeMistLayer.mesh.visible = Boolean(show);
      return api;
    },
  };
  return api;
}
