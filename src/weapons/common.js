import { METALS } from '../props/metalglobe.js';
import { createMarble, RADIUS as MARBLE_RADIUS } from '../heroes/marble.js';

/**
 * Weapons are constructed in real units, not normalized for the viewer:
 * one world unit is one metre. The catalogue keeps each form's dimensions
 * in its own specification so daggers and greatswords retain their scale.
 */
export const WEAPON_WORLD_UNITS_PER_METRE = 1;

/** The actual glass-and-spark marble hero is the display base. */
export const MARBLE_WEAPON_BASE = Object.freeze({
  radius: MARBLE_RADIUS,
  diameter: MARBLE_RADIUS * 2,
  height: MARBLE_RADIUS * 2,
});

/**
 * Place the engine's real marble hero at floor level. It is deliberately not
 * replaced with a marble-textured box or pedestal: its internal 3D spark and
 * transmissive glass remain the hero asset.
 */
export function createWeaponBase(GFX) {
  const marbleHero = createMarble(GFX);
  marbleHero.marble.name = 'marble weapon base';
  marbleHero.marble.position.set(0, MARBLE_RADIUS, 0);
  return {
    group: marbleHero.marble,
    marble: marbleHero,
    height: MARBLE_WEAPON_BASE.height,
  };
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

  // Fine diagonal impressions cross into a close, hand-wrapped leather grain.
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

/** A solid, closed lenticular blade with a shallow central fuller and a true point. */
function bladeGeometry(GFX, { rootY, length, width, thickness = 0.0068 }) {
  const sections = 64;
  // Closed perimeter in the blade's x/z cross-section. Both faces have a
  // shallow central channel, bevel shoulders and keen outer edges.
  const profile = [
    [-1.00, 0.00], [-0.88, 0.46], [-0.62, 0.78], [-0.42, 0.86],
    [-0.28, 0.72], [-0.12, 0.67], [0.00, 0.66], [0.12, 0.67],
    [0.28, 0.72], [0.42, 0.86], [0.62, 0.78], [0.88, 0.46],
    [1.00, 0.00], [0.88, -0.46], [0.62, -0.78], [0.42, -0.86],
    [0.28, -0.72], [0.12, -0.67], [0.00, -0.66], [-0.12, -0.67],
    [-0.28, -0.72], [-0.42, -0.86], [-0.62, -0.78], [-0.88, -0.46],
  ];
  const ringSize = profile.length;
  const positions = [];
  const indices = [];
  const halfWidth = width / 2;

  const widthFactor = (t) => {
    if (t < 0.14) return 0.94 + 0.06 * Math.sin((t / 0.14) * Math.PI / 2);
    if (t < 0.68) return 1.0 - 0.035 * ((t - 0.14) / 0.54);
    return Math.pow(Math.max(0, (1 - t) / 0.32), 0.92) * 0.965;
  };
  const thicknessFactor = (t) => 1 - 0.58 * t;

  // Use complete rings until the last section; the final vertex is a single
  // apex, so the cutting edges genuinely converge rather than ending bluntly.
  for (let i = 0; i < sections; i++) {
    const t = i / sections;
    const w = halfWidth * widthFactor(t);
    const halfThickness = (thickness / 2) * thicknessFactor(t);
    for (const [x, z] of profile) {
      positions.push(x * w, rootY + t * length, z * halfThickness);
    }
  }

  const rootCenter = positions.length / 3;
  positions.push(0, rootY, 0);
  const tip = positions.length / 3;
  positions.push(0, rootY + length, 0);

  // Closed sides, with outward winding, then a solid root cap and a pointed tip.
  for (let i = 0; i < sections - 1; i++) {
    for (let j = 0; j < ringSize; j++) {
      const a = i * ringSize + j;
      const b = i * ringSize + (j + 1) % ringSize;
      const c = (i + 1) * ringSize + j;
      const d = (i + 1) * ringSize + (j + 1) % ringSize;
      indices.push(a, b, c, b, d, c);
    }
  }
  const lastRing = (sections - 1) * ringSize;
  for (let j = 0; j < ringSize; j++) {
    const a = lastRing + j;
    const b = lastRing + (j + 1) % ringSize;
    indices.push(a, b, tip);
    // Root cap is wound toward -y (the pommel).
    const next = (j + 1) % ringSize;
    indices.push(rootCenter, next, j);
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A real helical leather thong, not a stack of disconnected metal-looking rings. */
function makeGripWrap(GFX, { radius, bottom, height, turns, tubeRadius }) {
  const along = turns * 48;
  const around = 7;
  const positions = [];
  const indices = [];
  const pitch = height / (turns * Math.PI * 2);

  for (let i = 0; i <= along; i++) {
    const t = i / along;
    const angle = t * turns * Math.PI * 2;
    const y = bottom + 0.002 + t * (height - 0.004);
    const r = radius * (1 - 0.035 * t);
    const radial = new GFX.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new GFX.Vector3(-r * Math.sin(angle), pitch, r * Math.cos(angle)).normalize();
    const binormal = new GFX.Vector3().crossVectors(tangent, radial).normalize();

    for (let j = 0; j < around; j++) {
      const v = (j / around) * Math.PI * 2;
      const offset = radial.clone().multiplyScalar(Math.cos(v) * tubeRadius)
        .addScaledVector(binormal, Math.sin(v) * tubeRadius);
      positions.push(
        r * Math.cos(angle) + offset.x,
        y + offset.y,
        r * Math.sin(angle) + offset.z,
      );
    }
  }
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j;
      const b = i * around + (j + 1) % around;
      const c = (i + 1) * around + j;
      const d = (i + 1) * around + (j + 1) % around;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Join a tapered solid cylinder between measured endpoints with the right local-y orientation. */
function cylinderBetween(GFX, name, material, a, b, radiusA, radiusB = radiusA, radial = 24) {
  const start = new GFX.Vector3(...a);
  const end = new GFX.Vector3(...b);
  const direction = end.clone().sub(start);
  const length = direction.length();
  if (length <= 1e-6) throw new RangeError('A crossguard segment must have non-zero length');
  const mesh = new GFX.Mesh(new GFX.CylinderGeometry(radiusB, radiusA, length, radial, 1), material);
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function shadedHex(hex, factor) {
  const value = hex.slice(1);
  return `#${[0, 2, 4].map((i) =>
    Math.round(parseInt(value.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Measured assembly shared by future sword and dagger definitions. The
 * sword's point faces up; the pommel rests against the top of the glass marble.
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

  const base = createWeaponBase(GFX);
  const group = new GFX.Group();
  group.name = `${spec.name} display`;
  group.add(base.group);

  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const bladeMaterial = metalMaterial(GFX, 'blade metal', bladeMetal);
  const hilt = new GFX.Group();
  hilt.name = 'hilt assembly';
  group.add(hilt);

  const pommelRadius = spec.pommelDiameter / 2;
  const pommelCenterY = base.height + pommelRadius * 0.88 - 0.001;
  const gripBottom = pommelCenterY + pommelRadius * 0.56;
  const gripTop = gripBottom + spec.gripLength;
  const guardY = gripTop + 0.008;
  const bladeRootY = guardY + 0.006;

  // Peened, slightly oval pommel. One shallow equatorial engraving is flush to
  // the pommel and cannot create the stray spikes visible in the previous pass.
  hilt.add(sphere(GFX, 'pommel', hiltMaterial,
    [0, pommelCenterY, 0], [pommelRadius, pommelRadius * 0.88, pommelRadius], [48, 32]));
  const pommelEngraving = new GFX.Mesh(
    new GFX.TorusGeometry(pommelRadius * 0.64, 0.0008, 6, 48),
    hiltMaterial,
  );
  pommelEngraving.name = 'pommel engraved ring';
  pommelEngraving.position.set(0, pommelCenterY - 0.002, 0);
  pommelEngraving.rotation.x = Math.PI / 2;
  hilt.add(pommelEngraving);

  // One continuous tapered leather core, with a procedural grain map and a
  // physical spiral wrap. The ferrules sit flush at both ends of the grip.
  const leather = leatherMaps(GFX);
  const gripMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather grip',
    color: new GFX.Color(gripColor),
    map: leather.map,
    bumpMap: leather.bump,
    bumpScale: 0.0012,
    roughness: 0.88,
    metalness: 0,
    clearcoat: 0.025,
    clearcoatRoughness: 0.74,
  });
  const gripRadius = spec.gripDiameter / 2;
  const handle = new GFX.Mesh(
    new GFX.CylinderGeometry(gripRadius * 0.96, gripRadius, spec.gripLength, 48, 1),
    gripMaterial,
  );
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;
  hilt.add(handle);

  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather grip wrap',
    color: new GFX.Color(shadedHex(gripColor, 0.66)),
    roughness: 0.94,
    metalness: 0,
  });
  const wrap = new GFX.Mesh(makeGripWrap(GFX, {
    radius: gripRadius * 1.002,
    bottom: gripBottom,
    height: spec.gripLength,
    turns: 7,
    tubeRadius: 0.00082,
  }), wrapMaterial);
  wrap.name = 'helical leather cord';
  wrap.castShadow = true;
  wrap.receiveShadow = true;
  hilt.add(wrap);

  for (const [label, y] of [
    ['lower grip ferrule', gripBottom + 0.0025],
    ['upper grip ferrule', gripTop - 0.0025],
  ]) {
    const ferrule = new GFX.Mesh(
      new GFX.CylinderGeometry(gripRadius * 1.045, gripRadius * 1.045, 0.004, 48),
      hiltMaterial,
    );
    ferrule.name = label;
    ferrule.position.set(0, y, 0);
    ferrule.castShadow = true;
    ferrule.receiveShadow = true;
    hilt.add(ferrule);
  }

  // A single swept crossguard: joined segments and small blended knuckles.
  // Its quillons curve down away from the blade, not up into stray metal tabs.
  const halfSpan = spec.guardSpan / 2;
  const guardPoints = [
    [-halfSpan, guardY - 0.014, 0],
    [-halfSpan * 0.72, guardY - 0.010, 0],
    [-halfSpan * 0.36, guardY + 0.004, 0],
    [0, guardY + 0.008, 0],
    [halfSpan * 0.36, guardY + 0.004, 0],
    [halfSpan * 0.72, guardY - 0.010, 0],
    [halfSpan, guardY - 0.014, 0],
  ];
  for (let i = 0; i < guardPoints.length - 1; i++) {
    const start = i === 0 ? 0.0058 : 0.0064;
    const end = i === guardPoints.length - 2 ? 0.0058 : 0.0064;
    hilt.add(cylinderBetween(GFX, 'curved crossguard', hiltMaterial,
      guardPoints[i], guardPoints[i + 1], start, end, 28));
  }
  guardPoints.forEach((point, i) => {
    const r = i === 0 || i === guardPoints.length - 1 ? 0.0061 : 0.0064;
    hilt.add(sphere(GFX, i === 0 || i === guardPoints.length - 1 ? 'rounded quillon tip' : 'crossguard blend',
      hiltMaterial, point, [r, r, r], [20, 12]));
  });
  hilt.add(sphere(GFX, 'crossguard central boss', hiltMaterial,
    [0, guardY + 0.003, 0], [0.024, 0.010, 0.014], [32, 20]));

  const blade = new GFX.Mesh(bladeGeometry(GFX, {
    rootY: bladeRootY,
    length: spec.bladeLength,
    width: spec.bladeWidth,
    thickness: spec.bladeThickness,
  }), bladeMaterial);
  blade.name = 'solid double-edged blade with central fuller';
  blade.castShadow = true;
  blade.receiveShadow = true;
  group.add(blade);

  const pommelBottom = pommelCenterY - pommelRadius * 0.88;
  const overallLength = bladeRootY + spec.bladeLength - pommelBottom;
  const api = {
    group,
    base: base.group,
    marble: base.marble,
    blade,
    hilt,
    dimensions: Object.freeze({
      overallLength,
      bladeLength: spec.bladeLength,
      bladeWidth: spec.bladeWidth,
      bladeThickness: spec.bladeThickness,
      gripLength: spec.gripLength,
      guardSpan: spec.guardSpan,
      unit: 'm',
    }),
    info: {
      'Weapon length': `${overallLength.toFixed(3)} m`,
      'Blade length': `${spec.bladeLength.toFixed(3)} m`,
      'Blade width': `${(spec.bladeWidth * 1000).toFixed(0)} mm`,
      'Blade thickness': `${(spec.bladeThickness * 1000).toFixed(1)} mm at the ricasso`,
      'Grip length': `${(spec.gripLength * 1000).toFixed(0)} mm`,
      'Guard span': `${(spec.guardSpan * 1000).toFixed(0)} mm`,
      'Base': 'Madness Engine glass marble with 3D spark',
      'Scale': '1 world unit = 1 metre',
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
      gripMaterial.color.set(color);
      wrapMaterial.color.set(shadedHex(color, 0.66));
      gripColor = color;
      return api;
    },
  };
  return api;
}
