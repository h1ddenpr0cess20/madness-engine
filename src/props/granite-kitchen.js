/**
 * A fitted kitchen counter and cabinet run: polished engine granite, finished
 * hardwood fronts, exposed raw-lumber carcass edges, and a copper inset basin.
 *
 * Coordinates are metres. The front of the run faces +z.
 */
import { createGraniteBoulder, GRANITES } from '../heroes/rock-granite.js';
import { METALS, studioEnvironment } from './metalglobe.js';
import { rawLumber, finishedWood } from '../textures/wood.js';

const WOOD_TONES = Object.freeze({
  walnut: { base: '#74452d', heart: '#3d2118', sap: '#b27a4d' },
  oak: { base: '#a8753d', heart: '#614023', sap: '#d5ad70' },
  mahogany: { base: '#713b2d', heart: '#391b18', sap: '#a96346' },
});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function box(GFX, parent, name, size, position, material) {
  const geometry = new GFX.BoxGeometry(...size);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeWoodMaterial(GFX, tone, finish) {
  const painted = finish === 'finished';
  const maps = painted ? finishedWood(GFX, tone) : rawLumber(GFX, tone);
  return new GFX.MeshPhysicalMaterial({
    name: painted ? `finished ${tone} hardwood` : `raw ${tone} lumber`,
    color: '#ffffff',
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: painted ? 0.018 : 0.035,
    roughness: painted ? 0.28 : 0.82,
    metalness: 0,
    clearcoat: painted ? 0.72 : 0,
    clearcoatRoughness: painted ? 0.2 : 1,
  });
}

function makeMetalMaterial(GFX, name, envMap = null) {
  const spec = METALS[name];
  if (!spec) throw new Error(`kitchen: unknown metal "${name}"`);
  return new GFX.MeshStandardMaterial({
    name: name,
    color: spec.color,
    metalness: 1,
    roughness: spec.roughness,
    envMap,
    envMapIntensity: 1.8,
  });
}

function addPipe(GFX, parent, name, start, end, radius, material) {
  const a = new GFX.Vector3(...start);
  const b = new GFX.Vector3(...end);
  const axis = b.clone().sub(a);
  const length = axis.length();
  if (length <= 1e-6) throw new Error(`kitchen: zero-length pipe "${name}"`);
  const mesh = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, length, 24, 1), material);
  mesh.name = name;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), axis.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addJoint(GFX, parent, name, position, radius, material) {
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(radius, 20, 12), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeCopperBasin(GFX, parent, metal, x, y, z, width, depth) {
  const basin = new GFX.Group();
  basin.name = 'inset copper basin';
  basin.position.set(x, y, z);
  parent.add(basin);

  // The bowl is a smooth series of nested rounded-rectangle rings, drawn inward
  // and down so the visible normals face the water cavity.
  const hx = width / 2, hz = depth / 2;
  const rimY = 0, floorY = -0.17, inset = 0.055;
  const positions = [], indices = [];
  const nx = 64, nz = 32, power = 0.34;
  for (let j = 0; j <= nz; j++) {
    const t = j / nz;
    const ease = t * t * (3 - 2 * t);
    const sx = hx - inset * ease;
    const sz = hz - inset * ease;
    const yy = rimY + (floorY - rimY) * ease;
    for (let i = 0; i <= nx; i++) {
      const a = (i / nx) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      positions.push(sx * Math.sign(c) * Math.pow(Math.abs(c), power), yy, sz * Math.sign(sn) * Math.pow(Math.abs(sn), power));
      if (j < nz && i < nx) {
        const p = j * (nx + 1) + i;
        indices.push(p, p + nx + 1, p + 1, p + 1, p + nx + 1, p + nx + 2);
      }
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const bowlMaterial = metal.clone();
  bowlMaterial.side = GFX.DoubleSide;
  const bowl = new GFX.Mesh(geometry, bowlMaterial);
  bowl.name = 'formed copper bowl';
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  basin.add(bowl);

  const floor = new GFX.Mesh(
    new GFX.BoxGeometry(Math.max(0.08, width - inset * 2), 0.008, Math.max(0.08, depth - inset * 2)),
    bowlMaterial,
  );
  floor.name = 'copper basin floor';
  floor.position.y = floorY - 0.002;
  floor.castShadow = true;
  floor.receiveShadow = true;
  basin.add(floor);

  // Beaded rolled edge around the rounded rectangular opening. Short straight
  // lengths and polished joints avoid a dependency on a curve/tube extension.
  const r = Math.min(0.055, hx * 0.22, hz * 0.28);
  const rimPoints = [
    [-hx + r, 0.004, -hz], [hx - r, 0.004, -hz],
    [hx, 0.004, -hz + r], [hx, 0.004, hz - r],
    [hx - r, 0.004, hz], [-hx + r, 0.004, hz],
    [-hx, 0.004, hz - r], [-hx, 0.004, -hz + r],
  ];
  for (let i = 0; i < rimPoints.length; i++) {
    const a = rimPoints[i], b = rimPoints[(i + 1) % rimPoints.length];
    addPipe(GFX, basin, `rolled copper sink rim segment ${i + 1}`, a, b, 0.012, metal);
    addJoint(GFX, basin, `rolled copper sink rim corner ${i + 1}`, a, 0.012, metal);
  }

  const drain = new GFX.Mesh(new GFX.CylinderGeometry(0.045, 0.045, 0.009, 48), metal);
  drain.name = 'copper drain flange';
  drain.position.set(0, floorY + 0.006, 0);
  basin.add(drain);
  const strainer = new GFX.Mesh(new GFX.CylinderGeometry(0.032, 0.032, 0.004, 48), metal);
  strainer.name = 'copper drain strainer';
  strainer.position.set(0, floorY + 0.013, 0);
  basin.add(strainer);
  const dark = new GFX.MeshBasicMaterial({ color: '#4b211a' });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const hole = new GFX.Mesh(new GFX.SphereGeometry(0.0022, 8, 6), dark);
    hole.position.set(Math.cos(a) * 0.019, floorY + 0.016, Math.sin(a) * 0.019);
    basin.add(hole);
  }
  return basin;
}

function makeFaucet(GFX, parent, brass, x, y, z, scale = 1) {
  const tap = new GFX.Group();
  tap.name = 'solid brass kitchen faucet';
  tap.position.set(x, y, z);
  tap.scale.setScalar(scale);
  parent.add(tap);

  const riserHeight = 0.37;
  addPipe(GFX, tap, 'brass faucet riser', [0, 0.02, 0], [0, riserHeight, 0], 0.018, brass);
  addJoint(GFX, tap, 'brass faucet elbow', [0, riserHeight, 0], 0.018, brass);
  addPipe(GFX, tap, 'brass faucet reach', [0, riserHeight, 0], [0, riserHeight, 0.19], 0.018, brass);
  addJoint(GFX, tap, 'brass faucet spout turn', [0, riserHeight, 0.19], 0.018, brass);
  addPipe(GFX, tap, 'brass faucet downturned nozzle', [0, riserHeight, 0.19], [0, riserHeight - 0.075, 0.19], 0.013, brass);

  const foot = new GFX.Mesh(new GFX.CylinderGeometry(0.042, 0.049, 0.025, 32), brass);
  foot.name = 'brass faucet escutcheon';
  foot.position.y = 0.012;
  tap.add(foot);
  const lever = new GFX.Mesh(new GFX.BoxGeometry(0.09, 0.014, 0.025), brass);
  lever.name = 'brass mixer lever';
  lever.position.set(0.075, 0.055, 0);
  tap.add(lever);
  return tap;
}

/**
 * Build the kitchen asset.
 * @param {object} GFX Three-compatible graphics namespace.
 * @param {object} options Asset options.
 * @param {'grey'|'pink'|'black'|'white'|'green'} options.granite Granite colour.
 * @param {'walnut'|'oak'|'mahogany'} options.wood Hardwood species.
 * @param {'copper'|'brass'|'bronze'} options.basinMetal Basin metal finish.
 * @param {'brass'|'gold'|'bronze'} options.fixtureMetal Fixture finish.
 */
export function createGraniteKitchen(GFX, {
  granite = 'grey',
  wood = 'walnut',
  basinMetal = 'copper',
  fixtureMetal = 'brass',
  width = 2.8,
  height = 0.92,
  depth = 0.72,
  environment = null,
} = {}) {
  if (!Object.hasOwn(GRANITES, granite)) throw new Error(`kitchen: unknown granite "${granite}"`);
  if (!WOOD_TONES[wood]) throw new Error(`kitchen: unknown hardwood "${wood}"`);
  if (!['copper', 'brass', 'bronze'].includes(basinMetal)) throw new Error(`kitchen: invalid basin metal "${basinMetal}"`);
  if (!['brass', 'gold', 'bronze'].includes(fixtureMetal)) throw new Error(`kitchen: invalid fixture metal "${fixtureMetal}"`);
  if (![width, height, depth].every(Number.isFinite) || width < 1.8 || width > 4 || height < 0.7 || height > 1.2 || depth < 0.55 || depth > 1.1) {
    throw new Error('kitchen: dimensions outside supported ranges');
  }

  const group = new GFX.Group();
  group.name = 'granite countertop and finished hardwood cabinetry';
  const [woodMap, rawMap] = [
    makeWoodMaterial(GFX, wood, 'finished'),
    makeWoodMaterial(GFX, wood, 'raw'),
  ];
  const brass = makeMetalMaterial(GFX, fixtureMetal, environment);
  const copper = makeMetalMaterial(GFX, basinMetal, environment);

  const cabinetHeight = height - 0.11;
  const plinth = 0.08;
  const topY = height;
  const cabinetDepth = depth - 0.08;
  const x0 = -width / 2;
  const z0 = -depth / 2;

  // Raw lumber is the actual substrate; finished faces are laminated over it.
  box(GFX, group, 'raw lumber cabinet carcass', [width, cabinetHeight - plinth, cabinetDepth], [0, plinth + (cabinetHeight - plinth) / 2, z0 + cabinetDepth / 2], rawMap);
  box(GFX, group, 'finished hardwood toe kick', [width, plinth, cabinetDepth], [0, plinth / 2, z0 + cabinetDepth / 2], woodMap);

  // Four finished framed doors/drawer fronts with a recessed centre panel and fine reveals.
  const bayCount = Math.max(3, Math.round(width / 0.62));
  const bayWidth = width / bayCount;
  for (let i = 0; i < bayCount; i++) {
    const x = x0 + bayWidth * (i + 0.5);
    const frontZ = depth / 2 - 0.022;
      box(GFX, group, `finished hardwood cabinet door ${i + 1}`, [bayWidth - 0.024, cabinetHeight - plinth - 0.035, 0.038], [x, (cabinetHeight + plinth) / 2, frontZ], woodMap);
    // A subtle inset panel, kept flush within a solid hardwood frame.
    box(GFX, group, `raised cabinet centre panel ${i + 1}`, [bayWidth - 0.13, cabinetHeight - plinth - 0.14, 0.012], [x, (cabinetHeight + plinth) / 2, frontZ + 0.024], woodMap);
    const pull = new GFX.Mesh(new GFX.BoxGeometry(Math.min(0.18, bayWidth * 0.38), 0.018, 0.022), brass);
    pull.name = `brass cabinet pull ${i + 1}`;
    pull.position.set(x, cabinetHeight - 0.14, frontZ + 0.047);
    pull.castShadow = true;
    group.add(pull);
    const escutcheon = new GFX.Mesh(new GFX.CylinderGeometry(0.022, 0.022, 0.008, 24), brass);
    escutcheon.name = `brass pull mounts ${i + 1}`;
    escutcheon.rotation.x = Math.PI / 2;
    escutcheon.position.set(x - Math.min(0.12, bayWidth * 0.22), cabinetHeight - 0.14, frontZ + 0.047);
    group.add(escutcheon);
    if (i % 2 === 1) {
      box(GFX, group, `finished top drawer ${i + 1}`, [bayWidth - 0.024, 0.09, 0.028], [x, cabinetHeight - 0.065, frontZ + 0.008], woodMap);
    }
  }

  // Granite slab: use the exact boulder's colour and bump maps, palette and grain scale,
  // but a slab material without the boulder's per-vertex colour attribute.
  const graniteSource = createGraniteBoulder(GFX, { colour: granite, detail: 2 });
  const graniteMaterial = new GFX.MeshPhysicalMaterial({
    name: 'polished granite countertop',
    color: graniteSource.material.color,
    map: graniteSource.material.map,
    bumpMap: graniteSource.material.bumpMap,
    bumpScale: graniteSource.material.bumpScale,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
  });
  graniteSource.geometry.dispose();
  graniteSource.material.dispose();
  const slab = new GFX.Mesh(new GFX.BoxGeometry(width + 0.035, 0.075, depth + 0.035), graniteMaterial);
  slab.name = 'polished solid granite countertop';
  slab.position.set(0, topY - 0.03, z0 + depth / 2);
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  // Cut a true aperture with a segmented rim; the copper vessel sits in the cabinet top.
  const basinWidth = clamp(width * 0.27, 0.5, 0.72);
  const basinDepth = clamp(depth * 0.58, 0.36, 0.48);
  const basinX = -width * 0.22;
  const basinZ = z0 + depth * 0.48;
  // Boolean operations are intentionally not required by the engine. The slab is split into three stone pieces
  // around the aperture, preserving the continuous stone material on every exposed cut edge.
  group.remove(slab);
  slab.geometry.dispose();
  const leftW = width * 0.5 + basinX - basinWidth * 0.5;
  const rightW = width * 0.5 - (basinX + basinWidth * 0.5);
  const topPos = topY - 0.03;
  box(GFX, group, 'granite countertop left wing', [leftW, 0.075, depth + 0.035], [x0 + leftW / 2, topPos, z0 + depth / 2], graniteMaterial);
  box(GFX, group, 'granite countertop right wing', [rightW, 0.075, depth + 0.035], [basinX + basinWidth / 2 + rightW / 2, topPos, z0 + depth / 2], graniteMaterial);
  const backRailDepth = basinZ - basinDepth * 0.5 - z0;
  const frontRailDepth = depth - backRailDepth - basinDepth;
  box(GFX, group, 'granite countertop rear rail', [basinWidth, 0.075, backRailDepth], [basinX, topPos, z0 + backRailDepth / 2], graniteMaterial);
  box(GFX, group, 'granite countertop front rail', [basinWidth, 0.075, frontRailDepth], [basinX, topPos, basinZ + basinDepth * 0.5 + frontRailDepth / 2], graniteMaterial);

  const basin = makeCopperBasin(GFX, group, copper, basinX, topY - 0.07, basinZ, basinWidth - 0.012, basinDepth - 0.012);
  makeFaucet(GFX, group, brass, basinX, topY + 0.01, basinZ - basinDepth / 2 - 0.07);

  // Return the substrate maps as well as the meshes so other props can use the same lumber species.
  group.userData.materials = { granite: graniteMaterial, finishedWood: woodMap, rawLumber: rawMap, brass, copper };
  group.userData.dimensions = { width, height, depth };
  group.userData.basin = basin;
  return { group, granite: graniteMaterial, finishedWood: woodMap, rawLumber: rawMap, brass, copper, basin, environment };
}

export const assetViewer = Object.freeze({
  id: 'granite-kitchen',
  name: 'Granite kitchen counter & cabinets',
  category: 'Props',
  group: 'kitchen',
  options: {
    granite: Object.keys(GRANITES),
    wood: Object.keys(WOOD_TONES),
    basinMetal: ['copper', 'brass', 'bronze'],
    fixtureMetal: ['brass', 'gold', 'bronze'],
  },
  build({ GFX, renderer = null, ...options }) {
    const environment = studioEnvironment(GFX, renderer);
    return createGraniteKitchen(GFX, { ...options, environment });
  },
});
