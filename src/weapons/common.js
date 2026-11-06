import { METALS } from '../props/metalglobe.js';
import { FLOORS } from '../textures/painters.js';

/**
 * Weapon assets use real-world proportions: one engine world unit represents
 * one metre. This keeps a family of weapons directly comparable to people and
 * to one another (a dagger is not a scaled-down broadsword; it is a 0.38 m
 * object, while a greatsword can be modelled at its actual 1.4–1.6 m length).
 */
export const WEAPON_WORLD_UNITS_PER_METRE = 1;

export const MARBLE_DISPLAY_BASE = Object.freeze({
  width: 0.48,
  depth: 0.34,
  lowerHeight: 0.062,
  upperWidth: 0.445,
  upperDepth: 0.305,
  upperHeight: 0.032,
  get height() { return this.lowerHeight + this.upperHeight; },
});

/** A polished two-tier marble display block shared by the weapon catalogue. */
export function createWeaponDisplayBase(GFX) {
  // The browser gets the full painted marble; server-side geometry tests use the neutral material fallback.
  const painted = typeof document === 'undefined' ? { map: null, bump: null } : FLOORS.marble(GFX);
  const marble = new GFX.MeshPhysicalMaterial({
    name: 'display marble',
    color: new GFX.Color('#f5f2eb'),
    map: painted.map,
    bumpMap: painted.bump,
    bumpScale: 0.0028,
    roughness: 0.27,
    metalness: 0,
    clearcoat: 0.82,
    clearcoatRoughness: 0.16,
  });
  const group = new GFX.Group();
  group.name = 'marble display base';

  const lower = new GFX.Mesh(
    new GFX.BoxGeometry(MARBLE_DISPLAY_BASE.width, MARBLE_DISPLAY_BASE.lowerHeight, MARBLE_DISPLAY_BASE.depth),
    marble,
  );
  lower.name = 'marble plinth lower';
  lower.position.y = MARBLE_DISPLAY_BASE.lowerHeight / 2;
  lower.castShadow = true;
  lower.receiveShadow = true;

  const upper = new GFX.Mesh(
    new GFX.BoxGeometry(MARBLE_DISPLAY_BASE.upperWidth, MARBLE_DISPLAY_BASE.upperHeight, MARBLE_DISPLAY_BASE.upperDepth),
    marble,
  );
  upper.name = 'marble plinth cap';
  upper.position.y = MARBLE_DISPLAY_BASE.lowerHeight + MARBLE_DISPLAY_BASE.upperHeight / 2;
  upper.castShadow = true;
  upper.receiveShadow = true;

  group.add(lower, upper);
  return { group, material: marble, height: MARBLE_DISPLAY_BASE.height };
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
  // Fine, crossing diagonal impressions suggest tight leather cord under a worn finish.
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

/** A tapered cylinder between two measured points; all lengths are in metres. */
function cylinderBetween(GFX, name, material, a, b, radiusA, radiusB, radial = 20) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const length = Math.hypot(dx, dy, dz);
  const mesh = new GFX.Mesh(new GFX.CylinderGeometry(radiusB, radiusA, length, radial, 1), material);
  mesh.name = name;
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  // CylinderGeometry's long axis is +y.
  mesh.rotation.z = Math.atan2(dx, dy);
  mesh.rotation.x = -Math.atan2(dz, Math.hypot(dx, dy));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function bladeGeometry(GFX, { rootY, length, width }) {
  const sections = 56;
  const profile = [
    [-1.00, 0.00], [-0.82, 0.52], [-0.42, 0.95], [-0.28, 0.68],
    [0.00, 0.57], [0.28, 0.68], [0.42, 0.95], [0.82, 0.52],
    [1.00, 0.00], [0.82, -0.52], [0.42, -0.95], [0.28, -0.68],
    [0.00, -0.57], [-0.28, -0.68], [-0.42, -0.95], [-0.82, -0.52],
  ];
  const positions = [], uvs = [], indices = [];
  const halfWidth = width / 2;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const broad = 1 + 0.045 * Math.sin(Math.PI * t);
    const taper = t < 0.76 ? broad : broad * Math.max(0.006, (1 - t) / 0.24);
    const w = Math.max(0.00018, halfWidth * taper);
    const halfThickness = Math.max(0.00012, 0.0047 * (1 - 0.72 * t));
    const fuller = Math.max(0, Math.min(1, (t - 0.035) / 0.12)) * (1 - Math.max(0, Math.min(1, (t - 0.58) / 0.17)));
    for (let j = 0; j < profile.length; j++) {
      const [x, z] = profile[j];
      const central = Math.max(0, 1 - Math.abs(x) / 0.34);
      const groove = fuller * central * 0.11;
      positions.push(x * w, rootY + t * length, z * halfThickness * (1 - groove));
      uvs.push(j / profile.length, t);
    }
  }
  const ring = profile.length;
  for (let i = 0; i < sections; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j;
      const b = i * ring + (j + 1) % ring;
      const c = (i + 1) * ring + j;
      const d = (i + 1) * ring + (j + 1) % ring;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Shared measured construction for one-handed swords and later weapon families.
 * Individual assets provide their physical dimensions rather than arbitrary
 * display scales.
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
  const baseTop = display.height;
  const pommelCenterY = baseTop + pommelRadius + 0.003;
  const gripBottom = pommelCenterY + pommelRadius * 0.72;
  const gripTop = gripBottom + spec.gripLength;
  const guardY = gripTop + 0.012;
  const bladeRootY = guardY + 0.014;

  // The pommel is a gently flattened, peened steel sphere with a visible end cap.
  grip.add(sphere(GFX, 'pommel', hiltMaterial, [0, pommelCenterY, 0], [pommelRadius, pommelRadius * 0.88, pommelRadius], [40, 28]));
  grip.add(new GFX.Mesh(
    new GFX.TorusGeometry(pommelRadius * 0.48, 0.0017, 8, 36),
    hiltMaterial,
  ));
  const pommelRing = grip.children[grip.children.length - 1];
  pommelRing.name = 'pommel peen ring';
  pommelRing.position.set(0, pommelCenterY + pommelRadius * 0.72, 0);
  pommelRing.rotation.x = Math.PI / 2;
  grip.add(sphere(GFX, 'pommel end cap', hiltMaterial, [0, pommelCenterY + pommelRadius * 0.84, 0], [0.006, 0.003, 0.006], [24, 16]));

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
    new GFX.CylinderGeometry(handleRadius * 0.91, handleRadius, spec.gripLength, 48, 1),
    leatherMaterial,
  );
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;
  grip.add(handle);

  // Narrow raised cords read as a tight spiral wrap under the grain.
  const wrapShade = (hex, factor = 0.68) => {
    const value = hex.slice(1);
    return `#${[0, 2, 4].map((i) => Math.round(parseInt(value.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('')}`;
  };
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges',
    color: new GFX.Color(wrapShade(gripColor)),
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

  // Metal ferrules bookend the leather and protect the ends of the wooden core.
  for (const [label, y, radius] of [
    ['lower grip ferrule', gripBottom + 0.002, handleRadius * 1.08],
    ['upper grip ferrule', gripTop - 0.002, handleRadius * 1.03],
  ]) {
    const ferrule = new GFX.Mesh(new GFX.TorusGeometry(radius, 0.0022, 8, 48), hiltMaterial);
    ferrule.name = label;
    ferrule.position.set(0, y, 0);
    ferrule.rotation.x = Math.PI / 2;
    ferrule.castShadow = true;
    grip.add(ferrule);
  }

  // A swept crossguard with tapering quillons, collars and rounded terminal lobes.
  const span = spec.guardSpan / 2;
  const guardPoints = [
    [-span, guardY - 0.014, 0],
    [-span * 0.72, guardY + 0.004, 0],
    [-span * 0.34, guardY + 0.012, 0],
    [0, guardY + 0.006, 0],
    [span * 0.34, guardY + 0.012, 0],
    [span * 0.72, guardY + 0.004, 0],
    [span, guardY - 0.014, 0],
  ];
  for (let i = 0; i < guardPoints.length - 1; i++) {
    const a = guardPoints[i], b = guardPoints[i + 1];
    const edgeTaper = i === 0 || i === guardPoints.length - 2 ? 0.0065 : 0.009;
    grip.add(cylinderBetween(GFX, 'swept crossguard quillon', hiltMaterial, a, b, edgeTaper, 0.009, 20));
  }
  for (const side of [-1, 1]) {
    grip.add(sphere(GFX, 'crossguard terminal', hiltMaterial,
      [side * (span - 0.001), guardY - 0.014, 0], [0.010, 0.010, 0.010], [24, 16]));
    const collar = new GFX.Mesh(new GFX.TorusGeometry(0.009, 0.0017, 8, 28), hiltMaterial);
    collar.name = 'quillon terminal collar';
    collar.position.set(side * (span - 0.012), guardY - 0.014, 0);
    collar.rotation.x = Math.PI / 2;
    grip.add(collar);
  }
  grip.add(sphere(GFX, 'crossguard central boss', hiltMaterial, [0, guardY + 0.005, 0],
    [0.027, 0.016, 0.019], [32, 20]));
  for (const side of [-1, 1]) {
    grip.add(sphere(GFX, 'guard face rivet', hiltMaterial, [0, guardY + 0.005, side * 0.017],
      [0.006, 0.006, 0.003], [20, 12]));
  }

  const bladeGeometryValue = bladeGeometry(GFX, {
    rootY: bladeRootY,
    length: spec.bladeLength,
    width: spec.bladeWidth,
  });
  const blade = new GFX.Mesh(bladeGeometryValue, bladeMaterial);
  blade.name = 'double-edged blade with central fuller';
  blade.castShadow = true;
  blade.receiveShadow = true;
  group.add(blade);

  // A shallow ricasso collar where the broad blade leaves the guard.
  const ricasso = new GFX.Mesh(
    new GFX.CylinderGeometry(spec.bladeWidth * 0.33, spec.bladeWidth * 0.4, 0.012, 8, 1, true),
    hiltMaterial,
  );
  ricasso.name = 'ricasso collar';
  ricasso.position.set(0, bladeRootY + 0.006, 0);
  ricasso.rotation.z = Math.PI / 2;
  grip.add(ricasso);

  const api = {
    group,
    blade,
    hilt: grip,
    displayBase: display.group,
    dimensions: Object.freeze({
      overallLength: bladeRootY + spec.bladeLength - (pommelCenterY - pommelRadius * 0.88),
      bladeLength: spec.bladeLength,
      bladeWidth: spec.bladeWidth,
      gripLength: spec.gripLength,
      guardSpan: spec.guardSpan,
      unit: 'm',
    }),
    info: {
      'Weapon length': `${(bladeRootY + spec.bladeLength - (pommelCenterY - pommelRadius * 0.88)).toFixed(3)} m`,
      'Blade length': `${spec.bladeLength.toFixed(3)} m`,
      'Blade width': `${(spec.bladeWidth * 1000).toFixed(0)} mm`,
      'Grip length': `${(spec.gripLength * 1000).toFixed(0)} mm`,
      'Guard span': `${(spec.guardSpan * 1000).toFixed(0)} mm`,
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
      leatherMaterial.color.set(color);
      wrapMaterial.color.set(wrapShade(color));
      gripColor = color;
      return api;
    },
  };
  return api;
}
