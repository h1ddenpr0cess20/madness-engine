/**
 * A kitchen, in three parts that fit together:
 *
 * - `createGraniteCounter`: a run of cabinetry under a polished granite top, any
 *   length between `MIN_LENGTH` and `MAX_LENGTH`, with the doors, drawers and
 *   pulls counted out to fit. Given a `cutout`, the top is cut round an aperture
 *   and the carcass below is open to receive a sink; without one it is a solid
 *   slab, ready for a hob or a plain run.
 * - `createKitchenSink`: a separate part, the copper basin and its brass
 *   faucet, built to sit in a cutout of the same size. Its rim is at the top
 *   of the counter, origin at the middle of the rim.
 * - `createGraniteKitchen`: the two of them, together, with the cutout cut to
 *   the sink. The asset viewer's entry.
 *
 * Coordinates are metres, from the middle of the counter on the floor. The front
 * of the run faces +z. A counter's length is its width along x, so two runs
 * laid end to end are a longer run: each keeps its own top and its own ends.
 */
import { createGraniteBoulder, GRANITES, GRANITE_TILE_SIZE } from '../heroes/rock-granite.js';
import { METALS, studioEnvironment } from './metalglobe.js';

/** Every metal finish the engine has, for the basin and the fixtures. */
export const FINISHES = Object.freeze(Object.keys(METALS));
import { rawLumber, finishedWood, WOOD_SPECIES } from '../textures/wood.js';

export const MIN_LENGTH = 1.2;
export const MAX_LENGTH = 4.8;
/** The granite top, its thickness; the top of the counter is at `height`. */
export const SLAB = 0.075;
/** The toe kick, under the cabinets. */
const PLINTH = 0.08;
/**
 * The granite top's grain, in repeats a metre: twice the boulder's grain (one
 * repeat per 0.95 m rather than per 1.9 m), so the counter's pattern reads finer.
 */
export const COUNTER_GRANITE_REPEATS_PER_METRE = 2 / GRANITE_TILE_SIZE;
/** How far below the top the carcass is open beneath a sink. */
const BOWL_DEPTH = 0.2;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inRange = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;

/**
 * Texture coordinates for a box, from where its surface is in the world: a
 * face that looks up or down takes x and z, one that looks along x takes z and
 * y, one that looks along z takes x and y. The grain runs on across the whole
 * counter, piece to piece, `scale` repeats a metre, rather than being stretched
 * once over each box.
 */
function worldUV(GFX, geometry, offset, scale) {
  const p = geometry.attributes.position, nrm = geometry.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + offset[0], y = p.getY(i) + offset[1], z = p.getZ(i) + offset[2];
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[2 * i] = u * scale;
    uv[2 * i + 1] = v * scale;
  }
  geometry.setAttribute('uv', new GFX.BufferAttribute(uv, 2));
}

/** A box at `position` in `parent`, textured in the world by its material's `uvScale`. */
function box(GFX, parent, name, size, position, material) {
  const geometry = new GFX.BoxGeometry(...size);
  if (material.userData.uvScale) worldUV(GFX, geometry, position, material.userData.uvScale);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Hardwood. Raw lumber is the carcass, bare. The finished boards are lacquered:
 * a sealed, satin-gloss clearcoat over the sanded wood, the way a kitchen's
 * doors are finished, so the grain shows through a clear surface.
 */
function makeWoodMaterial(GFX, species, finish) {
  const lacquered = finish === 'finished';
  const maps = lacquered ? finishedWood(GFX, species) : rawLumber(GFX, species);
  const material = new GFX.MeshPhysicalMaterial({
    name: lacquered ? `finished ${species} hardwood` : `raw ${species} lumber`,
    color: '#ffffff',
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: lacquered ? 0.012 : 0.035,
    roughness: lacquered ? 0.34 : 0.82,
    metalness: 0,
    clearcoat: lacquered ? 1 : 0,
    clearcoatRoughness: lacquered ? 0.06 : 1,
  });
  // One repeat of the wood's map is a metre of board.
  material.userData.uvScale = 1;
  return material;
}

function makeMetalMaterial(GFX, name, envMap = null) {
  const spec = METALS[name];
  if (!spec) throw new Error(`kitchen: unknown metal "${name}"`);
  return new GFX.MeshStandardMaterial({
    name,
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

/** Signed distance from (px, pz) to a rounded rectangle of half sizes (bx + rr, bz + rr) with corner radius rr; negative inside. */
export function sdRoundRect(px, pz, bx, bz, rr) {
  const qx = Math.abs(px) - bx, qz = Math.abs(pz) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rr;
}

/** The distance from the middle of a rounded rectangle (half sizes sx, sz; corner radius rr) to its edge, along the direction (c, s). */
export function radialOnRect(c, s, sx, sz, rr) {
  const bx = sx - rr, bz = sz - rr;
  let lo = 0, hi = Math.hypot(sx, sz) + 1e-6;
  for (let k = 0; k < 48; k++) {
    const m = (lo + hi) / 2;
    if (sdRoundRect(m * c, m * s, bx, bz, rr) < 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * The formed basin: a smooth bowl of nested rounded-rectangle rings, drawn in
 * and down so its visible faces look into the water. Its rim is at y = 0.
 */
function makeCopperBasin(GFX, parent, metal, width, depth) {
  const basin = new GFX.Group();
  basin.name = 'inset copper basin';
  parent.add(basin);

  const hx = width / 2, hz = depth / 2;
  const rimY = 0, floorY = -0.17, inset = 0.055;
  // The corner radius of the rim: the bowl's outline runs out to the same rounded rectangle.
  const rimR = Math.min(0.015, hx * 0.22, hz * 0.28);
  const positions = [], indices = [];
  const nx = 64, nz = 32;
  for (let j = 0; j <= nz; j++) {
    const t = j / nz;
    const ease = t * t * (3 - 2 * t);
    const sx = hx - inset * ease;
    const sz = hz - inset * ease;
    const rr = Math.max(0.004, rimR - inset * ease);
    const yy = rimY + (floorY - rimY) * ease;
    for (let i = 0; i <= nx; i++) {
      const a = (i / nx) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      const d = radialOnRect(c, sn, sx, sz, rr);
      positions.push(d * c, yy, d * sn);
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
  const bowlMaterial = new GFX.MeshStandardMaterial({
    name: 'copper basin interior',
    color: metal.color,
    metalness: metal.metalness,
    roughness: metal.roughness,
    envMap: metal.envMap,
    envMapIntensity: metal.envMapIntensity,
    side: GFX.DoubleSide,
  });
  const bowl = new GFX.Mesh(geometry, bowlMaterial);
  bowl.name = 'formed copper bowl';
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  basin.add(bowl);

  const floor = new GFX.Mesh(new GFX.BoxGeometry(Math.max(0.08, width - inset * 2), 0.008, Math.max(0.08, depth - inset * 2)), bowlMaterial);
  floor.name = 'copper basin floor';
  floor.position.y = floorY - 0.002;
  floor.castShadow = true;
  floor.receiveShadow = true;
  basin.add(floor);

  // The beaded, rolled rim round the opening, in straight lengths with polished joints.
  // A tight corner radius: the rim fills the cutout's corners instead of leaving notches beside them.
  const r = Math.min(0.015, hx * 0.22, hz * 0.28);
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

/** A solid brass kitchen faucet, standing on its escutcheon at (x, y, z), its spout reaching toward +z. */
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
  lever.position.set(0.05, 0.055, 0);   // through the riser
  tap.add(lever);
  return tap;
}

/**
 * The counter: cabinetry and a granite top, `length` long, `depth` deep and
 * `height` to the top of the stone. `cutout` = { x, z, width, depth } is an
 * aperture for a sink, its middle at (x, z) from the middle of the counter; the
 * top is cut round it, and the carcass below is open to `BOWL_DEPTH` under the
 * top, so the sink's bowl sits in it.
 */
export function createGraniteCounter(GFX, {
  length = 2.8,
  depth = 0.72,
  height = 0.92,
  granite = 'grey',
  wood = 'walnut',
  hardwareMetal = 'brass',
  environment = null,
  cutout = null,
} = {}) {
  if (!Object.hasOwn(GRANITES, granite)) throw new Error(`kitchen: unknown granite "${granite}"`);
  if (!Object.hasOwn(WOOD_SPECIES, wood)) throw new Error(`kitchen: unknown hardwood "${wood}"`);
  if (!FINISHES.includes(hardwareMetal)) throw new Error(`kitchen: invalid hardware metal "${hardwareMetal}"`);
  if (!inRange(length, MIN_LENGTH, MAX_LENGTH) || !inRange(depth, 0.55, 1.1) || !inRange(height, 0.7, 1.2)) {
    throw new Error('kitchen: dimensions outside supported ranges');
  }
  const x0 = -length / 2, x1 = length / 2, z0 = -depth / 2, z1 = depth / 2;
  if (cutout) {
    const { x, z, width: cw, depth: cd } = cutout;
    if (![x, z, cw, cd].every(Number.isFinite) || cw <= 0 || cd <= 0
      || x - cw / 2 < x0 + 0.1 || x + cw / 2 > x1 - 0.1 || z - cd / 2 < z0 + 0.06 || z + cd / 2 > z1 - 0.06) {
      throw new Error('kitchen: cutout does not fit the counter');
    }
  }

  const counter = new GFX.Group();
  counter.name = 'granite kitchen counter';

  const finishedMat = makeWoodMaterial(GFX, wood, 'finished');
  const rawMat = makeWoodMaterial(GFX, wood, 'raw');
  // The pulls and their mounts, in their own finish, separate from the faucet.
  const hardware = makeMetalMaterial(GFX, hardwareMetal, environment);

  // The granite: the boulder's own colour and bump maps, at the boulder's grain scale.
  const source = createGraniteBoulder(GFX, { colour: granite, detail: 2 });
  const graniteMat = new GFX.MeshPhysicalMaterial({
    name: 'polished granite countertop',
    color: source.material.color,
    map: source.material.map,
    bumpMap: source.material.bumpMap,
    bumpScale: source.material.bumpScale,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
  });
  graniteMat.userData.uvScale = COUNTER_GRANITE_REPEATS_PER_METRE;
  source.geometry.dispose();
  source.material.dispose();

  const cabinetTop = height - SLAB;
  const topY = height;
  const DOOR = 0.038;                                     // the doors' thickness
  const frontZ = depth / 2 - 0.022;                       // the middle of a door
  const cabinetDepth = frontZ - DOOR / 2 - z0;            // the carcass runs up to the back of the doors
  const back = z0, front = z0 + cabinetDepth;
  const toeDepth = cabinetDepth - 0.04;                   // the toe kick is set back under the doors

  // The carcass: raw lumber, cut round the aperture when there is one, so the sink's bowl has room.
  const carcass = (name, xa, xb, ya, yb, za, zb) => {
    if (xb - xa < 1e-4 || zb - za < 1e-4 || yb - ya < 1e-4) return;
    box(GFX, counter, name, [xb - xa, yb - ya, zb - za], [(xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2], rawMat);
  };
  if (cutout) {
    const cx0 = cutout.x - cutout.width / 2, cx1 = cutout.x + cutout.width / 2;
    const cz0 = cutout.z - cutout.depth / 2, cz1 = cutout.z + cutout.depth / 2;
    const floorY = topY - BOWL_DEPTH;
    carcass('raw lumber carcass, left', x0, cx0, PLINTH, cabinetTop, back, front);
    carcass('raw lumber carcass, right', cx1, x1, PLINTH, cabinetTop, back, front);
    carcass('raw lumber carcass, behind the sink', cx0, cx1, PLINTH, cabinetTop, back, cz0);
    carcass('raw lumber carcass, in front of the sink', cx0, cx1, PLINTH, cabinetTop, cz1, front);
    carcass('raw lumber carcass, under the sink', cx0, cx1, PLINTH, floorY, cz0, cz1);
  } else {
    carcass('raw lumber cabinet carcass', x0, x1, PLINTH, cabinetTop, back, front);
  }
  box(GFX, counter, 'finished hardwood toe kick', [length, PLINTH, toeDepth], [0, PLINTH / 2, back + toeDepth / 2], finishedMat);

  // Doors and drawers: about one to every 0.62 m of run, counted to the length; every other bay has a drawer on top.
  const bays = Math.max(2, Math.round(length / 0.62));
  const bayW = length / bays;
  for (let i = 0; i < bays; i++) {
    const x = x0 + bayW * (i + 0.5);
    const doorH = cabinetTop - PLINTH - 0.035;
    box(GFX, counter, `finished hardwood cabinet door ${i + 1}`, [bayW - 0.024, doorH, DOOR], [x, (cabinetTop + PLINTH) / 2, frontZ], finishedMat);
    box(GFX, counter, `raised cabinet centre panel ${i + 1}`, [bayW - 0.13, cabinetTop - PLINTH - 0.14, 0.012], [x, (cabinetTop + PLINTH) / 2, frontZ + 0.024], finishedMat);
    const pull = new GFX.Mesh(new GFX.BoxGeometry(Math.min(0.18, bayW * 0.38), 0.018, 0.022), hardware);
    pull.name = `brass cabinet pull ${i + 1}`;
    pull.position.set(x, cabinetTop - 0.14, frontZ + 0.041);   // 4 mm into the panel face
    pull.castShadow = true;
    counter.add(pull);
    const mount = new GFX.Mesh(new GFX.CylinderGeometry(0.022, 0.022, 0.008, 24), hardware);
    mount.name = `brass pull mounts ${i + 1}`;
    mount.rotation.x = Math.PI / 2;
    mount.position.set(x - Math.min(0.12, bayW * 0.22), cabinetTop - 0.14, frontZ + 0.034);
    counter.add(mount);
    if (i % 2 === 1) {
      box(GFX, counter, `finished top drawer ${i + 1}`, [bayW - 0.024, 0.09, 0.028], [x, cabinetTop - 0.065, frontZ + 0.008], finishedMat);
    }
  }

  // The granite top: one slab, or, with an aperture, four pieces meeting at its edges so the stone runs on across every cut.
  const topPos = topY - SLAB / 2;
  const overhang = 0.035;
  if (cutout) {
    const cx0 = cutout.x - cutout.width / 2, cx1 = cutout.x + cutout.width / 2;
    const cz0 = cutout.z - cutout.depth / 2, cz1 = cutout.z + cutout.depth / 2;
    const wingL = [x0 - overhang / 2, cx0], wingR = [cx1, x1 + overhang / 2];
    box(GFX, counter, 'granite countertop left wing', [wingL[1] - wingL[0], SLAB, depth + overhang], [(wingL[0] + wingL[1]) / 2, topPos, 0], graniteMat);
    box(GFX, counter, 'granite countertop right wing', [wingR[1] - wingR[0], SLAB, depth + overhang], [(wingR[0] + wingR[1]) / 2, topPos, 0], graniteMat);
    const rearA = z0 - overhang / 2;
    box(GFX, counter, 'granite countertop rear rail', [cutout.width, SLAB, cz0 - rearA], [cutout.x, topPos, (rearA + cz0) / 2], graniteMat);
    box(GFX, counter, 'granite countertop front rail', [cutout.width, SLAB, z1 + overhang / 2 - cz1], [cutout.x, topPos, (cz1 + z1 + overhang / 2) / 2], graniteMat);
  } else {
    box(GFX, counter, 'polished solid granite countertop', [length + overhang, SLAB, depth + overhang], [0, topPos, 0], graniteMat);
  }

  counter.userData.materials = { granite: graniteMat, finishedWood: finishedMat, rawLumber: rawMat, hardware };
  counter.userData.dimensions = { length, height, depth };
  counter.userData.cutout = cutout ? { ...cutout } : null;
  return { group: counter, granite: graniteMat, finishedWood: finishedMat, rawLumber: rawMat, hardware, environment };
}

/**
 * The sink: a copper basin and its brass faucet, as one part. It is built for a
 * cutout of `width` by `depth`, and its origin is at the middle of the rim, which
 * sits flush with the counter. Place it at its cutout's (x, height, z).
 */
export function createKitchenSink(GFX, {
  width = 0.6,
  depth = 0.42,
  basinMetal = 'copper',
  fixtureMetal = 'brass',
  environment = null,
} = {}) {
  if (!FINISHES.includes(basinMetal)) throw new Error(`kitchen: invalid basin metal "${basinMetal}"`);
  if (!FINISHES.includes(fixtureMetal)) throw new Error(`kitchen: invalid fixture metal "${fixtureMetal}"`);
  if (!inRange(width, 0.4, 0.9) || !inRange(depth, 0.3, 0.6)) throw new Error('kitchen: sink dimensions outside supported ranges');

  const sink = new GFX.Group();
  sink.name = 'copper kitchen sink';
  const copper = makeMetalMaterial(GFX, basinMetal, environment);
  const brass = makeMetalMaterial(GFX, fixtureMetal, environment);

  // The bowl sits inside the rim; the faucet stands on the counter behind it.
  // The rim's tube is 12mm across and sits on the cutout's edge: the basin's outline is the cutout less that.
  const basin = makeCopperBasin(GFX, sink, copper, width - 0.024, depth - 0.024);
  basin.position.set(0, -0.002, 0);
  makeFaucet(GFX, sink, brass, 0, 0, -depth / 2 - 0.07);

  sink.userData.materials = { brass, copper };
  sink.userData.dimensions = { width, depth };
  return { group: sink, basin, brass, copper, environment };
}

/**
 * The asset: a counter with a sink in it, both as the parts above. `length`
 * sets the run; the sink sits a little left of centre, toward the back, as is
 * usual. Returns the counter and sink groups, and the group with both in it.
 */
export function createGraniteKitchen(GFX, {
  granite = 'grey',
  wood = 'walnut',
  basinMetal = 'copper',
  fixtureMetal = 'brass',
  hardwareMetal = 'brass',
  length = 2.8,
  height = 0.92,
  depth = 0.72,
  environment = null,
} = {}) {
  if (!Object.hasOwn(GRANITES, granite)) throw new Error(`kitchen: unknown granite "${granite}"`);
  if (!Object.hasOwn(WOOD_SPECIES, wood)) throw new Error(`kitchen: unknown hardwood "${wood}"`);
  const sinkWidth = clamp(length * 0.27, 0.5, 0.72);
  const sinkDepth = clamp(depth * 0.58, 0.36, 0.48);
  const cutout = { x: -length * 0.22, z: -depth * 0.02, width: sinkWidth, depth: sinkDepth };

  const counter = createGraniteCounter(GFX, { length, depth, height, granite, wood, hardwareMetal, environment, cutout });
  const sink = createKitchenSink(GFX, { width: sinkWidth, depth: sinkDepth, basinMetal, fixtureMetal, environment });
  sink.group.position.set(cutout.x, height, cutout.z);

  const group = new GFX.Group();
  group.name = 'granite kitchen counter with a copper sink';
  group.add(counter.group, sink.group);
  group.userData.counter = counter.group;
  group.userData.sink = sink.group;
  group.userData.materials = { ...counter.group.userData.materials, ...sink.group.userData.materials };
  group.userData.dimensions = { length, height, depth };
  return {
    group,
    counter: counter.group,
    sink: sink.group,
    granite: counter.granite,
    finishedWood: counter.finishedWood,
    rawLumber: counter.rawLumber,
    hardware: counter.hardware,
    faucet: sink.brass,
    copper: sink.copper,
    basin: sink.basin,
    environment,
  };
}

export const assetViewer = Object.freeze({
  id: 'granite-kitchen',
  name: 'Granite kitchen counter & sink',
  category: 'Props',
  group: 'kitchen',
  options: {
    granite: Object.keys(GRANITES),
    wood: Object.keys(WOOD_SPECIES),
    basinMetal: FINISHES,
    fixtureMetal: FINISHES,
    hardwareMetal: FINISHES,
  },
  build({ GFX, renderer = null, ...options }) {
    const environment = studioEnvironment(GFX, renderer);
    return createGraniteKitchen(GFX, { ...options, environment });
  },
});
