import { METALS } from '../props/metalglobe.js';
import { createMarble } from '../heroes/marble.js';
import { createMetalEgg, createGlassEgg } from '../heroes/debater-egg/index.js';
import { createBall } from '../heroes/krystal/model.js';
import { createBladeMist, createCurvedBladeMist } from './blade-mist.js';
import { bladeCentreline } from './blade-curve.js';

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
  vision.visible = true;
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
  // Instantiate the repository's real Metal Egg asset, then take its actual
  // shell mesh out of the animated hero rig. The shell retains its original
  // geometry and material; only its display scale and orientation change.
  const asset = createMetalEgg({ GFX, metal });
  const mesh = asset.shell;
  mesh.parent?.remove(mesh);

  // The hero drives motion from this callback. Detaching the mesh from the
  // animated body and removing its render callback leaves the exact asset
  // completely stationary while keeping the hero implementation intact.
  // The renderer calls this hook unconditionally for renderable objects.
  // Keep a no-op rather than null: the detached pommel must remain stationary.
  mesh.onBeforeRender = () => {};

  const group = new GFX.Group();
  group.name = 'stationary engine Metal Egg pommel';
  const radialScale = 0.032;
  const verticalScale = radius / 1.03;
  mesh.scale.set(radialScale, -verticalScale, radialScale);
  // shapeEgg adds 0.01 to its local Y coordinate. Cancel that offset and
  // centre the 54 mm shell in the pommel envelope: narrow point outward,
  // broader shoulder toward the grip, with only the ferrule bridging the seam.
  mesh.position.y = radius + verticalScale * 0.01;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'stationary Metal Egg asset shell';
  group.add(mesh);

  let selectedMetal = metal;
  return {
    group, asset, mesh, radius, height: radius * 2, kind: 'metal-egg',
    get metal() { return selectedMetal; },
    setMetal(name) {
      asset.setMetal(name);
      selectedMetal = name;
      return this;
    },
  };
}

/**
 * The real transmissive glass egg and its white/yellow ray-marched mist,
 * detached from the hero rig and fitted into the same 54 mm pommel envelope.
 * The broad end faces the grip, matching the stationary Metal Egg orientation.
 */
function createMagicEggPommel(GFX, radius) {
  const asset = createGlassEgg({ GFX, mist: true });
  const glass = asset.glass;
  const mist = asset.mist;
  // createGlassEgg's shell callback drives the original hero rig's wobble.
  // The pommel is a stationary detached asset, like the Metal Egg pommel:
  // replace only the shell callback, while retaining mist.onBeforeRender so
  // the white/yellow vision continues to flow inside the glass.
  glass.onBeforeRender = () => {};
  glass.parent?.remove(glass);
  mist.parent?.remove(mist);

  const group = new GFX.Group();
  group.name = 'Magic Egg glass pommel';
  const radialScale = 0.032;
  const verticalScale = radius / 1.03;
  const eggPositionY = radius + verticalScale * 0.01;
  for (const mesh of [glass, mist]) {
    mesh.scale.set(radialScale, -verticalScale, radialScale);
    mesh.position.y = eggPositionY;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  glass.material.thickness *= radialScale;
  glass.material.attenuationDistance *= radialScale;
  // The vision shader marches through a world-space ellipsoid. Once the
  // original hero egg is fitted into the pommel, its default unit-sphere axes
  // are no longer valid: describe the actual transformed egg volume here.
  // shapeEgg narrows the horizontal radius to about 0.84 and stretches y 1.03.
  mist.material.uniforms.uShape.value.set(
    radialScale * 0.84,
    verticalScale * 1.03,
    radialScale * 0.84,
  );
  mist.material.uniforms.uRadius.value = 1.02;
  mist.material.uniforms.uGlow.value = 1.15;
  mist.material.uniforms.uDuoA.value.set(0.96, 0.98, 1.0);
  mist.material.uniforms.uDuoB.value.set(1.0, 0.985, 0.94);
  mist.material.uniforms.uDuoC.value.set(1.0, 0.82, 0.38);
  mist.visible = true;
  mist.renderOrder = 1;

  return {
    group, asset, glass, mist, material: mist.material, radius,
    height: radius * 2, kind: 'magic-egg',
    setMist(show = true) {
      asset.setMist(show);
      return this;
    },
  };
}

function createWeaponPommel(GFX, spec, { style = 'marble', metal, material } = {}) {
  if (style === 'marble') return { ...createWeaponPommelMarble(GFX, spec.marbleRadius), kind: 'marble' };
  if (style === 'metal-ball') return createMetalBallPommel(GFX, spec.marbleRadius, material);
  if (style === 'metal-egg') return createMetalEggPommel(GFX, spec.marbleRadius, metal);
  if (style === 'krystal') return createKrystalOrbPommel(GFX, spec.marbleRadius);
  if (style === 'magic-egg') return createMagicEggPommel(GFX, spec.marbleRadius);
  throw new Error(`unknown weapon pommel style: ${style}`);
}

/** A continuous helical leather cord laid over the cylindrical grip. */
function diagonalWrapGeometry(GFX, {
  radius, startY, height, pitch = 0.0117, tubeRadius = 0.00105, radialSegments = 8,
  direction = 1, phase = 0,
} = {}) {
  const turns = height / pitch;
  const tubularSegments = Math.max(24, Math.ceil(turns * 28));
  const positions = [], indices = [];
  const angularTravel = turns * Math.PI * 2 * Math.sign(direction || 1);
  const risePerRadian = height / (turns * Math.PI * 2);
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const angle = phase + t * angularTravel;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const center = new GFX.Vector3(radius * cos, startY + height * t, radius * sin);
    const tangent = new GFX.Vector3(
      -radius * sin * Math.sign(direction || 1),
      risePerRadian,
      radius * cos * Math.sign(direction || 1),
    ).normalize();
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

/**
 * A single, mirrored lightning-bolt crossguard. Each arm has three deliberate
 * bends and sweeps upward at a shallow angle. The root is reinforced and the
 * outer terminals taper continuously into sharp points.
 */
function createLightningGuard(GFX, parent, material, {
  centerY, span = 0.22, thickness = 0.016, invert = false,
} = {}) {
  if (!GFX?.Vector3 || !GFX?.BufferGeometry || !GFX?.BufferAttribute) {
    throw new TypeError('createLightningGuard requires the Madness Engine GFX module');
  }
  if (!Number.isFinite(centerY) || !Number.isFinite(span) || span <= 0
    || !Number.isFinite(thickness) || thickness <= 0) {
    throw new TypeError('lightning guard requires a finite centre, positive span and thickness');
  }

  const halfSpan = span / 2;
  const vertical = invert ? -1 : 1;
  const tipExtension = Math.min(0.014, Math.max(0.008, span * 0.06));
  // Three changes of direction on each arm: outward/up, shallow return, then
  // outward/up again. The final point continues on a restrained ~20 degree rise.
  const stations = [
    [-halfSpan - tipExtension, centerY + vertical * 0.030, 0],
    [-halfSpan * 0.88, centerY + vertical * 0.023, 0],
    [-halfSpan * 0.68, centerY + vertical * 0.009, 0],
    [-halfSpan * 0.47, centerY + vertical * 0.021, 0],
    [-halfSpan * 0.25, centerY + vertical * 0.006, 0],
    [0, centerY + vertical * 0.004, 0],
    [halfSpan * 0.25, centerY + vertical * 0.006, 0],
    [halfSpan * 0.47, centerY + vertical * 0.021, 0],
    [halfSpan * 0.68, centerY + vertical * 0.009, 0],
    [halfSpan * 0.88, centerY + vertical * 0.023, 0],
    [halfSpan + tipExtension, centerY + vertical * 0.030, 0],
  ];
  // The 20.5 mm centre-root diameter gives the quillons extra visual weight;
  // the 15 mm shaft eases into fine, fully integrated terminals.
  const radii = [
    0.00010,
    thickness * 0.22,
    thickness * 0.39,
    thickness * 0.48,
    thickness * 0.57,
    thickness * 0.64,
    thickness * 0.57,
    thickness * 0.48,
    thickness * 0.39,
    thickness * 0.22,
    0.00010,
  ];

  const centres = stations.map((point) => new GFX.Vector3(...point));
  const radialSegments = 24;
  const samplesPerSegment = 8;
  const sampledCentres = [];
  const sampledRadii = [];
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
  guard.name = invert ? 'inverted lightning swept crossguard' : 'lightning swept crossguard';
  guard.userData.lightningProfile = Object.freeze({
    orientation: invert ? 'inverted' : 'upright',
    bendsPerArm: 3,
    baseDiameter: radii[5] * 2,
    shaftDiameter: thickness * 0.96,
    tipRadius: radii[0],
    tipExtension,
  });
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'three-bend lightning quillons with tapered points';
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

export function metalMaterial(GFX, name, metal) {
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
    // Preserve the cutting width for most of the blade. The final ~16% forms
    // a shorter, sturdier point, with a substantial terminal section before
    // the apex rather than a long taper that reads as a needle.
    const shoulder = 0.94 + 0.06 * smoothstep(0, 0.11, t);
    const taper = shoulder * (1 - 0.06 * t - 0.94 * smoothstep(0.84, 1.0, t));
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
  geometry.pointProfile = Object.freeze({
    pointStart: 0.84,
    pointEnd: 1.0,
    terminalWidthRatio: 0.026,
  });
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
/**
 * An open, egg-following ferrule sleeve. The Magic Egg and Metal Egg share
 * the same sculpted shell profile and scale; following that profile keeps the
 * metal bezel outside the shell instead of letting a straight frustum pass
 * through the egg's broad shoulder.
 */
function createEggFittedBezelGeometry(GFX, {
  bottom, top, centerY, pommelRadius, topRadius,
  radialScale = 0.032, clearance = 0.0008,
  radialSegments = 64, axialSegments = 32,
} = {}) {
  const positions = [];
  const indices = [];
  const centerOffset = (bottom + top) / 2;
  const shellRadiusAt = (worldY) => {
    const y = (centerY - worldY) / pommelRadius;
    if (Math.abs(y) >= 1) return 0;
    const taper = 1 - 0.075 * y - 0.055 * y * y;
    return radialScale * 0.84 * taper * Math.sqrt(1 - y * y);
  };
  const outerRadiusAt = (worldY) => {
    const t = Math.max(0, Math.min(1, (worldY - bottom) / (top - bottom)));
    const eased = t * t * (3 - 2 * t);
    const shellBase = shellRadiusAt(bottom) + clearance;
    const transition = shellBase + (topRadius - shellBase) * eased;
    return Math.max(shellRadiusAt(worldY) + clearance, transition);
  };

  for (let row = 0; row <= axialSegments; row++) {
    const t = row / axialSegments;
    const worldY = bottom + (top - bottom) * t;
    const r = outerRadiusAt(worldY);
    const localY = worldY - centerOffset;
    for (let segment = 0; segment < radialSegments; segment++) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      positions.push(Math.cos(angle) * r, localY, Math.sin(angle) * r);
    }
  }

  for (let row = 0; row < axialSegments; row++) {
    for (let segment = 0; segment < radialSegments; segment++) {
      const a = row * radialSegments + segment;
      const b = row * radialSegments + (segment + 1) % radialSegments;
      const d = (row + 1) * radialSegments + segment;
      const e = (row + 1) * radialSegments + (segment + 1) % radialSegments;
      indices.push(a, d, b, b, d, e);
    }
  }

  const geometry = new GFX.BufferGeometry();
  geometry.type = 'EggFittedBezelGeometry';
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.clearance = clearance;
  geometry.radialSegments = radialSegments;
  geometry.axialSegments = axialSegments;
  geometry.centerOffset = centerOffset;
  geometry.shellRadiusAt = shellRadiusAt;
  geometry.outerRadiusAt = outerRadiusAt;
  return geometry;
}

const smooth01 = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * A banana for a grip: a ridged tube bowed along a circular arc in the blade's
 * plane. It starts at `top` pointing the way the blade does, is fullest near
 * the top and tapers to a narrow, blunt end after `bend` radians.
 */
export function bentGripGeometry(GFX, {
  top, length, bend, radius, tipRadius,
  ridges = 5, ridgeDepth = 0.06, sections = 56, radialSegments = 40,
}) {
  const R = length / bend;
  const positions = [], indices = [];
  for (let i = 0; i <= sections; i++) {
    const s = i / sections;
    const phi = -s * bend;
    const cos = Math.cos(phi), sin = Math.sin(phi);
    const cx = top.x - R + R * cos;
    const cy = top.y + R * sin;
    const body = tipRadius + (radius - tipRadius) * (1 - smooth01(0.2, 1, s))
      + 0.0012 * Math.sin(Math.PI * Math.min(1, s * 1.1));
    for (let k = 0; k < radialSegments; k++) {
      const a = (k / radialSegments) * Math.PI * 2;
      // The ridges fade in below the top, so the grip arrives round and flush with the peel.
      const lobe = body * (1 + ridgeDepth * (1 - 0.6 * s) * smooth01(0, 0.15, s) * Math.cos(ridges * a));
      positions.push(cx + lobe * cos * Math.cos(a), cy + lobe * sin * Math.cos(a), lobe * Math.sin(a));
    }
  }
  for (let i = 0; i < sections; i++) {
    for (let k = 0; k < radialSegments; k++) {
      const a = i * radialSegments + k;
      const b = i * radialSegments + (k + 1) % radialSegments;
      const c = (i + 1) * radialSegments + k;
      const d = (i + 1) * radialSegments + (k + 1) % radialSegments;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return {
    geometry,
    end: Object.freeze({ x: top.x - R + R * Math.cos(bend), y: top.y - R * Math.sin(bend) }),
    /** The direction the grip is heading as it ends (unit, in the blade's plane). */
    heading: Object.freeze({ x: -Math.sin(bend), y: -Math.cos(bend) }),
  };
}

/** Catmull-Rom through 2D points, `steps + 1` samples. */
function sampleCurve(points, steps) {
  const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
  const out = [];
  for (let n = 0; n <= steps; n++) {
    const f = (n / steps) * (points.length - 1);
    const i = Math.min(points.length - 2, Math.floor(f)), t = f - i;
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    out.push([0, 1].map((k) => 0.5 * (
      2 * p1[k] + (-p0[k] + p2[k]) * t
      + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t
      + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)));
  }
  return out;
}

/**
 * The banana's peel: the grip's own skin, split into four flaps. Each flap
 * starts flush with the top of the grip as a quarter of its surface, rises
 * around the blade root, then folds back outward over the top and hangs
 * down around the hand like a cup guard, kept small enough to sheathe. Being
 * slices of one cup-shaped surface, the flaps curve round the hand and meet
 * the grip with no step. The skin (brass) is the face toward the hand once
 * folded; the pale inside of the peel is an inlay of the blade's metal set into the face
 * looking out, with a thin rim of the brass left showing all round it.
 *
 * Returns `top`, the inlay, and `bottom`, the brass body of the flaps
 * (both faces, so the rim shows). The seams between flaps sit on the blade's
 * flat and edge directions, so the blade comes out through them.
 */
export function peelFlapGeometries(GFX, {
  centerY, count = 4, phase = Math.PI / 4, steps = 56, across = 13, inlaySteps = 40,
  thickness = 0.0045, baseHalfAngle = 0.59,
  rim = 0.002, inlayFrom = 0.2, inlayTo = 0.94, lift = 0.0005,
} = {}) {
  // The mid-surface of the cup in (radius, height) from the grip top; it starts inside the grip
  // and the brass skin, half a thickness outside it, comes out just proud of the neck.
  const path = sampleCurve([
    [0.0165, -0.010], [0.0165, -0.004], [0.0166, 0.004], [0.0168, 0.012], [0.0225, 0.0195],
    [0.031, 0.0215], [0.039, 0.0155], [0.0435, 0.004], [0.0460, -0.010],
    [0.0480, -0.024], [0.0525, -0.034],
  ], steps);
  // N is the flap's inside-up normal: toward the axis as it rises, out as it hangs.
  const frames = path.map(([r, y], i) => {
    const prev = path[Math.max(0, i - 1)], next = path[Math.min(steps, i + 1)];
    const dr = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dr, dy);
    return { r, y, nr: -dy / len, ny: dr / len };
  });
  const at = (t, key) => {
    const f = t * steps, k = Math.min(steps - 1, Math.floor(f)), w = f - k;
    return frames[k][key] + (frames[k + 1][key] - frames[k][key]) * w;
  };
  // A slice of the cup: wide at the grip, narrowing to a rounded tip.
  const half = (t) => baseHalfAngle * (1 - 0.45 * smooth01(0.15, 0.8, t)) * Math.sqrt(Math.max(0, 1 - t ** 5));
  // Thin where it starts inside the grip, so the skin grows out of the grip surface with no edge.
  const thick = (t) => thickness * smooth01(0, 0.12, t) * (1 - t ** 6);

  const brass = { positions: [], indices: [] }, chrome = { positions: [], indices: [] };
  const grid = (face, rows, columns, point, flip) => {
    const base = face.positions.length / 3;
    for (let i = 0; i <= rows; i++) for (let j = 0; j < columns; j++) face.positions.push(...point(i / rows, (j / (columns - 1)) * 2 - 1));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns - 1; j++) {
        const a = base + i * columns + j, b = a + 1, c = a + columns, d = c + 1;
        if (flip) face.indices.push(a, c, b, b, c, d);
        else face.indices.push(a, b, c, b, d, c);
      }
    }
  };
  const place = (theta, t, angle, off) => {
    const r = at(t, 'r') + at(t, 'nr') * off;
    return [r * Math.cos(theta + angle), centerY + at(t, 'y') + at(t, 'ny') * off, r * Math.sin(theta + angle)];
  };
  for (let f = 0; f < count; f++) {
    const theta = phase + (f / count) * Math.PI * 2;
    // The whole flap, both faces, in brass: the outline the rim belongs to.
    for (const sign of [1, -1]) {
      grid(brass, steps, across, (t, u) => place(theta, t, u * half(t), sign * 0.5 * thick(t) * (1 - u ** 4)), sign < 0);
    }
    // The chrome inlay: inset from the edge all round, rounded at both ends, a hair proud.
    grid(chrome, inlaySteps, across, (s, u) => {
      const t = inlayFrom + s * (inlayTo - inlayFrom);
      const close = Math.sqrt(Math.max(0, 1 - (2 * s - 1) ** 6));
      const inner = Math.max(0, half(t) - rim / at(t, 'r')) * close;
      const along = half(t) > 0 ? (u * inner) / half(t) : 0;
      return place(theta, t, u * inner, 0.5 * thick(t) * (1 - along ** 4) + lift);
    }, false);
  }
  const make = ({ positions, indices }) => {
    const geometry = new GFX.BufferGeometry();
    geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };
  return { top: make(chrome), bottom: make(brass) };
}

/**
 * Curve a blade in its own plane, toward -x as it rises, so it carries on the
 * grip's banana curve and ends in a talon. The root stays upright, so the
 * blade leaves the grip tangent to it. Its heading turns by `bend` radians
 * evenly along the length, and by `hook` more that is saved for the last of
 * it, so the curve tightens into the point like a claw. Past 40% of the
 * length the blade also narrows by `talon`, drawing the point out.
 *
 * Each vertex keeps its distance across the blade, measured along the normal to
 * the curve, so the cutting edges, the fuller and the thickness all follow the
 * curve instead of being sheared. Returns how far the point stands above the root.
 */
function curveBlade(geometry, { rootY, length, bend, hook = 0, talon = 0 }) {
  const line = bladeCentreline({ length, bend, hook, talon });
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = clamp01((position.getY(i) - rootY) / length);
    const { x, y, phi } = line.at(u);
    const across = position.getX(i) * line.taper(u);
    position.setXYZ(i, x + across * Math.cos(phi), rootY + y + across * Math.sin(phi), position.getZ(i));
  }
  position.needsUpdate = true;
  return line.reach;
}

/**
 * The banana handle: the bottom of a half-peeled banana. A brass, ridged,
 * curved grip ends in a small tip of the blade's metal (no pommel ball), and under the
 * boss seat the peel splits into flaps (see `peelFlapGeometries`).
 */
function createCurvedHandleAssembly(GFX, group, spec, { hiltMetal, accentMaterial, gripColor, threadColor }) {
  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  // The tip of the grip is the blade's metal, not the hilt's: it is handed in, so it is the same material.
  if (!accentMaterial) throw new TypeError('a curved handle needs the blade material for its tip');

  const hilt = new GFX.Group();
  hilt.name = 'banana hilt assembly';
  group.add(hilt);

  const gripTop = spec.gripLength + 0.045;
  const handleRadius = spec.gripDiameter / 2;
  const tipRadius = handleRadius * 0.5;
  const { geometry, end, heading } = bentGripGeometry(GFX, {
    top: { x: 0, y: gripTop },
    length: spec.gripLength,
    bend: spec.gripCurve,
    radius: handleRadius * 1.07,
    tipRadius,
  });
  const handle = new GFX.Mesh(geometry, hiltMaterial);
  handle.name = 'banana grip';
  handle.castShadow = true;
  handle.receiveShadow = true;
  hilt.add(handle);

  // The dark end of the banana, in the blade's metal, continues the grip's heading.
  const tipLength = 0.0125;
  const tipCentre = { x: end.x + heading.x * 0.004, y: end.y + heading.y * 0.004 };
  const tip = sphere(GFX, 'banana tip', accentMaterial,
    [tipCentre.x, tipCentre.y, 0], [tipRadius * 1.02, tipLength, tipRadius * 1.02], [32, 20]);
  tip.rotation.z = -spec.gripCurve;
  hilt.add(tip);
  const tipDrop = Math.hypot(tipLength * Math.cos(spec.gripCurve), tipRadius * Math.sin(spec.gripCurve));

  // The grip carries on up as a short round neck, which the blade comes out of and the peel
  // folds away from: one brass surface from the grip to the fold, with no collar or ledge.
  const neckRadius = handleRadius * 1.07 - 0.0001;
  const bossSeatBottom = gripTop - 0.004;
  const bossSeatTop = gripTop + 0.012;
  const bossSeat = new GFX.Mesh(
    new GFX.CylinderGeometry(neckRadius, neckRadius, bossSeatTop - bossSeatBottom, 48),
    hiltMaterial,
  );
  bossSeat.name = 'banana neck';
  bossSeat.position.set(0, (bossSeatBottom + bossSeatTop) / 2, 0);
  bossSeat.castShadow = true;
  bossSeat.receiveShadow = true;
  hilt.add(bossSeat);

  const bezel = new GFX.Group();
  bezel.name = 'banana grip has no bezel';
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'grip fluting',
    color: new GFX.Color(threadColor ?? gripColor),
    roughness: 0.9,
    metalness: 0,
  });
  const pommelAsset = {
    group: tip, radius: tipRadius, height: tipLength * 2, kind: 'banana-tip',
    setMetal() {},
  };

  return {
    marble: null,
    pommelAsset,
    hilt,
    hiltMaterial,
    accentMaterial,
    handle,
    bezel,
    gripBottom: end.y,
    gripTop,
    gripBounds: Object.freeze({ bottom: end.y, top: gripTop }),
    handleBounds: Object.freeze({ bottom: end.y, top: gripTop, length: spec.gripLength }),
    bezelBounds: Object.freeze({ bottom: end.y, top: end.y, bottomRadius: tipRadius, topRadius: handleRadius, outerRadius: tipRadius }),
    bossSeat,
    bossSeatBounds: Object.freeze({ bottom: bossSeatBottom, top: bossSeatTop }),
    leatherMaterial: null,
    wrapMaterial,
    gripColor,
    lowestY: Math.min(end.y - tipRadius, tipCentre.y - tipDrop),
  };
}

export function createWeaponHandleAssembly(GFX, group, spec, {
  hiltMetal = 'steel',
  gripColor = '#633b2c',
  threadColor,
  pommelStyle = spec.pommelStyle ?? 'marble',
  wrapStyle = spec.wrapStyle ?? 'banded',
  accentMaterial,
} = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('createWeaponHandleAssembly requires the Madness Engine GFX module');
  }
  if (!METALS[hiltMetal]) throw new Error(`no metal called ${hiltMetal}`);
  if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');
  if (threadColor !== undefined && !/^#[0-9a-f]{6}$/i.test(threadColor)) {
    throw new TypeError('threadColor must be a six-digit hex colour');
  }

  if (spec.gripCurve) {
    return createCurvedHandleAssembly(GFX, group, spec, { hiltMetal, accentMaterial, gripColor, threadColor });
  }

  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const pommelAsset = createWeaponPommel(GFX, spec, {
    style: pommelStyle, metal: hiltMetal, material: hiltMaterial,
  });
  const marble = pommelAsset.kind === 'marble' ? pommelAsset : null;
  group.add(pommelAsset.group);

  const hilt = new GFX.Group();
  hilt.name = 'connected hilt assembly';
  group.add(hilt);

  // Egg pommels occupy the full 54 mm envelope with their broad shoulder
  // meeting the grip. Seat the leather 1 mm over that shoulder; marble and
  // metal-ball pommels retain the original 5 mm stand-off.
  const radius = pommelAsset.radius;
  const isEggPommel = pommelAsset.kind === 'metal-egg' || pommelAsset.kind === 'magic-egg';
  const gripBottom = pommelAsset.height - (isEggPommel ? 0.001 : -0.005);
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
  const eggCenterY = radius;
  const bezelTop = gripBottom + 0.0012;
  const bezelBottomRadius = Math.min(radius * 0.86, handleRadius * 1.34);
  // The marble keeps its bell-shaped frustum. Egg pommels use a short,
  // flared ferrule around the upper shoulder, not a band across the equator.
  const bezelBottom = isEggPommel
    ? gripBottom - 0.0153
    : radius + Math.sqrt(radius * radius - bezelBottomRadius * bezelBottomRadius);
  const eggRadiusAt = (worldY) => {
    const y = (eggCenterY - worldY) / radius;
    if (Math.abs(y) >= 1) return 0;
    return 0.032 * 0.84 * (1 - 0.075 * y - 0.055 * y * y) * Math.sqrt(1 - y * y);
  };
  const eggClearance = 0.0008;
  const eggBaseRadius = eggRadiusAt(bezelBottom) + eggClearance;
  const eggFittedRadiusAt = (worldY) => {
    const t = Math.max(0, Math.min(1, (worldY - bezelBottom) / (bezelTop - bezelBottom)));
    const eased = t * t * (3 - 2 * t);
    return Math.max(
      eggRadiusAt(worldY) + eggClearance,
      eggBaseRadius + (bezelTopRadius - eggBaseRadius) * eased,
    );
  };
  const eggLowerRimY = bezelBottom + 0.0006;
  const fittedBottomRadius = isEggPommel
    ? eggFittedRadiusAt(eggLowerRimY)
    : bezelBottomRadius;
  const fittedTopRadius = isEggPommel
    ? eggFittedRadiusAt(bezelTop - 0.0006)
    : bezelTopRadius;
  const bezelHeight = bezelTop - bezelBottom;
  const bezelGeometry = isEggPommel
    ? createEggFittedBezelGeometry(GFX, {
      bottom: bezelBottom,
      top: bezelTop,
      centerY: eggCenterY,
      pommelRadius: radius,
      topRadius: bezelTopRadius,
      radialScale: 0.032,
      clearance: eggClearance,
    })
    : new GFX.CylinderGeometry(bezelTopRadius, bezelBottomRadius, bezelHeight, 48, 1, true);
  const bezelSleeve = new GFX.Mesh(bezelGeometry, hiltMaterial);
  bezelSleeve.name = 'pommel bezel tapered hollow sleeve';
  bezelSleeve.position.set(0, isEggPommel ? bezelGeometry.centerOffset : (bezelBottom + bezelTop) / 2, 0);
  bezelSleeve.castShadow = true;
  bezelSleeve.receiveShadow = true;
  bezel.add(bezelSleeve);
  for (const [name, y, rimRadius, rimThickness] of [
    ['pommel bezel lower flared rim', eggLowerRimY, fittedBottomRadius, 0.0008],
    ['pommel bezel upper handle-fit rim', bezelTop - 0.0006, fittedTopRadius, 0.00065],
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

  const initialThreadColor = threadColor ?? shadeHex(gripColor, 0.68);
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: wrapStyle === 'diamond' ? 'contrasting leather grip thread' : 'leather wrap ridges',
    color: new GFX.Color(initialThreadColor),
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
  } else if (wrapStyle === 'diamond') {
    const pitch = spec.diamondWrapPitch ?? 0.019;
    for (const [label, direction] of [['rising', 1], ['falling', -1]]) {
      const lace = new GFX.Mesh(diagonalWrapGeometry(GFX, {
        radius: handleRadius + 0.00072,
        startY: gripBottom,
        height: spec.gripLength,
        pitch,
        tubeRadius: 0.00058,
        radialSegments: 8,
        direction,
      }), wrapMaterial);
      lace.name = `diamond leather stitch ${label}`;
      lace.castShadow = true;
      lace.receiveShadow = true;
      hilt.add(lace);
    }
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
      bottomRadius: fittedBottomRadius,
      topRadius: bezelTopRadius,
      outerRadius: fittedBottomRadius,
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
  threadColor,
  bladeMist: withBladeMist = false,
} = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('buildWeapon requires the Madness Engine GFX module');
  }
  for (const name of [bladeMetal, hiltMetal]) {
    if (!METALS[name]) throw new Error(`no metal called ${name}`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');
  if (threadColor !== undefined && !/^#[0-9a-f]{6}$/i.test(threadColor)) {
    throw new TypeError('threadColor must be a six-digit hex colour');
  }

  const group = new GFX.Group();
  group.name = `${spec.name} display`;

  const bladeMaterial = metalMaterial(GFX, 'blade metal', bladeMetal);
  let threadColorExplicit = threadColor !== undefined;
  const {
    marble, hiltMaterial, hilt, handle, bezel, gripBounds, handleBounds,
    bezelBounds, bossSeat, bossSeatBounds, leatherMaterial, wrapMaterial, pommelAsset,
    accentMaterial, lowestY = 0,
  } = createWeaponHandleAssembly(GFX, group, spec, {
    hiltMetal, gripColor, threadColor,
    // The banana's petal tops and tips are the blade's metal, so they share its material.
    accentMaterial: bladeMaterial,
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
  if (spec.guardStyle === 'peel') {
    // No bar and no bobbles: the guard is the peel, split into flaps below the blade.
    const flaps = peelFlapGeometries(GFX, { centerY: gripBounds.top });
    guard = new GFX.Group();
    guard.name = 'peel flaps, blade metal inside and brass outside';
    for (const [name, geometry, material] of [
      ['peel flaps inside', flaps.top, accentMaterial],
      ['peel flaps outside', flaps.bottom, hiltMaterial],
    ]) {
      const mesh = new GFX.Mesh(geometry, material);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      guard.add(mesh);
    }
    hilt.add(guard);
    guardBoss = bossSeat;
  } else if (spec.guardStyle === 'lightning') {
    const guardDirection = spec.guardInverted ? -1 : 1;
    guardBoss = sphere(GFX, 'lightning guard reinforced central boss', hiltMaterial,
      [0, guardY + guardDirection * 0.003, 0], [0.028, 0.017, 0.018], [40, 24]);
    hilt.add(guardBoss);
    guard = createLightningGuard(GFX, hilt, hiltMaterial, {
      centerY: guardY,
      span: spec.guardSpan,
      thickness: guardThickness,
      invert: spec.guardInverted === true,
    });
  } else if ((spec.guardStyle ?? 'swept') === 'horns') {
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
  const fullBlade = bladeGeometry(GFX, {
    rootY: bladeRootY,
    length: spec.bladeLength,
    width: spec.bladeWidth,
  });
  // How far the point stands above the root: less than the length when the blade curves.
  let bladeReach = spec.bladeLength;
  if (spec.bladeCurve) {
    bladeReach = curveBlade(fullBlade, {
      rootY: bladeRootY, length: spec.bladeLength,
      bend: spec.bladeCurve, hook: spec.bladeHook, talon: spec.bladeTalon,
    });
    fullBlade.computeVertexNormals();
  }
  const blade = new GFX.Mesh(fullBlade, bladeMaterial);
  blade.name = 'solid double-edged blade with 75% fuller';
  blade.castShadow = true;
  blade.receiveShadow = true;
  group.add(blade);

  // Krystal's variants add a separate, hidden-by-default mist volume that
  // follows the exact blade dimensions without changing the steel geometry.
  // A curved blade carries its mist along its curve in a chain of short pieces.
  const mistOptions = {
    rootY: bladeRootY,
    length: spec.bladeLength,
    width: spec.bladeWidth,
    palette: spec.bladeMistPalette ?? 'krystal',
  };
  let bladeMistLayer = null;
  if (withBladeMist) {
    bladeMistLayer = spec.bladeCurve
      ? createCurvedBladeMist(GFX, group, {
        ...mistOptions, bend: spec.bladeCurve, hook: spec.bladeHook, talon: spec.bladeTalon,
      })
      : createBladeMist(GFX, group, mistOptions);
  }

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
      overallLength: bladeRootY + bladeReach - lowestY,
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
      'Weapon length': `${(bladeRootY + bladeReach - lowestY).toFixed(3)} m`,
      'Blade length': `${spec.bladeLength.toFixed(3)} m`,
      'Blade width': `${(spec.bladeWidth * 1000).toFixed(0)} mm`,
      'Grip length': `${(spec.gripLength * 1000).toFixed(0)} mm`,
      'Guard span': `${(spec.guardSpan * 1000).toFixed(0)} mm`,
      'Fuller length': `${(spec.bladeLength * 750).toFixed(0)} mm (75%)`,
      'Scale': '1 world unit = 1 metre',
      'Pommel': pommelAsset.kind === 'banana-tip' ? 'Chrome banana tip on the grip'
        : pommelAsset.kind === 'marble' ? 'Glass marble with 3D spark'
        : pommelAsset.kind === 'metal-ball' ? 'Solid metal ball'
          : pommelAsset.kind === 'metal-egg' ? 'Engine metal egg'
          : pommelAsset.kind === 'magic-egg' ? 'Glass egg with white/yellow animated mist'
            : 'Krystal glass orb with animated mist',
    },
    get bladeMetal() { return bladeMetal; },
    get hiltMetal() { return hiltMetal; },
    get gripColor() { return gripColor; },
    get threadColor() { return `#${wrapMaterial.color.getHexString()}`; },
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
      // A metal grip has no leather to dye: the colour is kept but not drawn.
      leatherMaterial?.color.set(color);
      if (!threadColorExplicit && spec.wrapStyle !== 'diamond') {
        wrapMaterial.color.set(shadeHex(color, 0.68));
      }
      gripColor = color;
      return api;
    },
    setThreadColor(color) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('threadColor must be a six-digit hex colour');
      wrapMaterial.color.set(color);
      threadColorExplicit = true;
      return api;
    },
    setBladeMist(show = true) {
      if (bladeMistLayer) bladeMistLayer.mesh.visible = Boolean(show);
      return api;
    },
  };
  return api;
}
