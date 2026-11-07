/**
 * A fitted kitchen counter and cabinet run: polished engine granite, finished
 * hardwood fronts, exposed raw-lumber carcass edges, and a copper inset basin.
 *
 * Coordinates are metres. The front of the run faces +z.
 */
import { createGraniteBoulder, GRANITES } from '../heroes/rock-granite.js';
import { METALS } from './metalglobe.js';
import { rawLumber, finishedWood } from '../textures/wood.js';

const WOOD_TONES = Object.freeze({
  walnut: { base: '#74452d', heart: '#3d2118', sap: '#b27a4d' },
  oak: { base: '#a8753d', heart: '#614023', sap: '#d5ad70' },
  mahogany: { base: '#713b2d', heart: '#391b18', sap: '#a96346' },
});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function box(GFX, parent, name, size, position, material, { bevel = 0 } = {}) {
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

function makeCopperBasin(GFX, parent, metal, x, y, z, width, depth) {
  const basin = new GFX.Group();
  basin.name = 'inset copper basin';
  basin.position.set(x, y, z);
  parent.add(basin);

  // A deep, open vessel, built from a rounded rectangular bowl profile.
  const hx = width / 2, hz = depth / 2;
  const rimY = 0, floorY = -0.17;
  const inset = 0.055;
  const positions = [], indices = [];
  const nx = 48, nz = 32;
  for (let j = 0; j <= nz; j++) {
    const t = j / nz;
    const ease = t * t * (3 - 2 * t);
    const sx = hx - inset * ease;
    const sz = hz - inset * ease;
    const yy = rimY + (floorY - rimY) * ease;
    for (let i = 0; i <= nx; i++) {
      const a = (i / nx) * Math.PI * 2;
      // Superellipse keeps the lip rectangular with softened corners.
      const c = Math.cos(a), s = Math.sin(a), power = 0.34;
      positions.push(sx * Math.sign(c) * Math.pow(Math.abs(c), power), yy, sz * Math.sign(s) * Math.pow(Math.abs(s), power));
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
  const bowl = new GFX.Mesh(geometry, metal);
  // The first strip is the lip; reverse the inside surface so its normals face the basin cavity.
  bowl.material = metal;
  bowl.material.side = GFX.DoubleSide;
  bowl.name = 'formed copper bowl';
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  basin.add(bowl);

  // Rolled copper rim, continuous around the sink opening.
  const outline = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a), power = 0.34;
    outline.push(new GFX.Vector3(hx * Math.sign(c) * Math.pow(Math.abs(c), power), 0.004, hz * Math.sign(s) * Math.pow(Math.abs(s), power)));
  }
  const rimCurve = new GFX.CatmullRomCurve3(outline, true, 'centripetal');
  const rim = new GFX.Mesh(new GFX.TubeGeometry(rimCurve, 256, 0.012, 10, true), metal);
  rim.name = 'rolled copper sink rim';
  rim.castShadow = true;
  basin.add(rim);

  // A copper drain flange and perforated strainer.
  const drain = new GFX.Mesh(new GFX.CylinderGeometry(0.045, 0.045, 0.009, 48), metal);
  drain.name = 'copper drain flange';
  drain.position.set(0, floorY + 0.006, 0);
  basin.add(drain);
  const strainer = new GFX.Mesh(new GFX.CylinderGeometry(0.032, 0.032, 0.004, 48), metal);
  strainer.name = 'copper drain strainer';
  strainer.position.set(0, floorY + 0.013, 0);
  basin.add(strainer);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const hole = new GFX.Mesh(new GFX.SphereGeometry(0.0022, 8, 6), new GFX.MeshBasicMaterial({ color: '#4b211a' }));
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

  const tube = (name, points, radius) => {
    const curve = new GFX.CatmullRomCurve3(points.map((p) => new GFX.Vector3(...p)));
    const mesh = new GFX.Mesh(new GFX.TubeGeometry(curve, 48, radius, 16, false), brass);
    mesh.name = name;
    mesh.castShadow = true;
    tap.add(mesh);
    return mesh;
  };
  tube('gooseneck brass spout', [
    [0, 0, 0], [0, 0.22, 0], [0, 0.37, 0], [0, 0.42, 0.11], [0, 0.42, 0.2], [0, 0.32, 0.24],
  ], 0.018);
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
  if (!['brass', 'gold', 'bronze'].includes(fixtureMetal)) throw new Error(`kitchen: invalid fixture metal "${fixtureMetal}"');
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
    const face = box(GFX, group, `finished hardwood cabinet door ${i + 1}`, [bayWidth - 0.024, cabinetHeight - plinth - 0.035, 0.038], [x, (cabinetHeight + plinth) / 2, frontZ], woodMap);
    face.material = woodMap;
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
      const drawer = box(GFX, group, `finished top drawer ${i + 1}`, [bayWidth - 0.024, 0.09, 0.028], [x, cabinetHeight - 0.065, frontZ + 0.008], woodMap);
      drawer.material = woodMap;
    }
  }

  // Granite slab: exact boulder paint, palette and real granite grain pipeline.
  const { material: graniteMaterial } = createGraniteBoulder(GFX, { colour: granite, detail: 2 });
  graniteMaterial.name = 'polished granite countertop';
  graniteMaterial.roughness = 0.16;
  graniteMaterial.metalness = 0.02;
  graniteMaterial.clearcoat = 0.75;
  graniteMaterial.clearcoatRoughness = 0.12;
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
  const frontRailDepth = basinZ + basinDepth * 0.5 - z0;
  const rearRailDepth = depth - frontRailDepth;
  box(GFX, group, 'granite countertop front rail', [basinWidth, 0.075, frontRailDepth], [basinX, topPos, z0 + frontRailDepth / 2], graniteMaterial);
  box(GFX, group, 'granite countertop rear rail', [basinWidth, 0.075, rearRailDepth], [basinX, topPos, z0 + frontRailDepth + rearRailDepth / 2], graniteMaterial);

  const basin = makeCopperBasin(GFX, group, copper, basinX, topY - 0.07, basinZ, basinWidth - 0.012, basinDepth - 0.012);
  makeFaucet(GFX, group, brass, basinX, topY + 0.01, basinZ - basinDepth / 2 - 0.07);

  // Return the substrate maps as well as the meshes so other props can use the same lumber species.
  group.userData.materials = { granite: graniteMaterial, finishedWood: woodMap, rawLumber: rawMap, brass, copper };
  group.userData.dimensions = { width, height, depth };
  group.userData.basin = basin;
  return { group, granite: graniteMaterial, finishedWood: woodMap, rawLumber: rawMap, brass, copper, basin };
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
  build({ GFX, ...options }) {
    return createGraniteKitchen(GFX, options);
  },
});
