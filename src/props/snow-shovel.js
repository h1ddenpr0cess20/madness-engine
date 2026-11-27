import { METALS, studioEnvironment } from './metalglobe.js';
import { diagonalWrapGeometry, leatherMaps, metalMaterial, shadeHex } from '../weapons/common.js';
import { HANDS, handlingInfo, handlingOf, reachOf } from '../weapons/categories.js';

/**
 * A metal snow shovel at real size, in meters (one engine unit is one meter): 1.5 m from butt to lip. It stands on
 * its butt at the origin with the scoop at the far end (+y). The grip is wrapped leather with a metal ferrule at each
 * end, and each part takes one of the shared twelve `METALS` finishes.
 *
 *     const shovel = createSnowShovel(GFX, { bladeMetal: 'silver', wearMetal: 'iron' });
 *     scene.add(shovel.group);
 *     robot.hold(shovel);                  // two-handed, by the leather grip, scoop first
 *
 * The scoop faces +z (its hollow is the +z side) and its width runs along x. The leather-wrapped grip sits on the
 * shaft below the D-handle, so a hand takes it as it takes a sword's (`gripBounds`).
 */
export const SNOW_SHOVEL_DIMENSIONS = Object.freeze({
  bladeWidth: 0.46,
  bladeLength: 0.36,
  /** The scoop turns up this far (its walls, at the back) and the lip is bent forward by this angle. */
  wallHeight: 0.085,
  lipBend: 0.62,
  shaftDiameter: 0.033,
  gripLength: 0.3,
  gripDiameter: 0.041,
  handleWidth: 0.2,
  thickness: 0.0022,
  unit: 'm',
});

export const SNOW_SHOVEL_SPEC = Object.freeze({ name: 'snow shovel', hands: HANDS.TWO, ...SNOW_SHOVEL_DIMENSIONS });

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (value, label) => { if (!HEX.test(value)) throw new TypeError(`${label} must be a six-digit hex color`); return value; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// Where things are along the shovel, in meters from the butt.
const Y = Object.freeze({
  crossbar: 0.0225, fork: 0.222, gripBottom: 0.38, gripTop: 0.68, shaftTop: 0.2, shaftBottom: 1.1,
  socketTop: 1.045, plate: 1.16,
});

// -------------------------------------------------------------------- the pressed plate

const ROWS = 56;
const FLAT = 16, ARC = 12, WALL = 7; // samples a half-section: the floor, the rolled bend and the wall
const HALF = FLAT + ARC + WALL;
const FILLET = 0.028;

/** How tall the turned-up edge is at `v` along the plate (0 at the socket, 1 at the lip): high at the back, a low lip at the front. */
const wallAt = (v, high) => high * Math.pow(1 - v, 1.35) + 0.014;
/** The angle the plate has turned forward by `v` along it: flat at the socket, the lip bent up like a scoop. */
const turnAt = (v, bend) => bend * Math.pow(v, 1.7);

/** The plate's centerline in (y, z), integrated from its start, at each of `ROWS + 1` rows. */
function spine(length, bend) {
  const out = [];
  let y = Y.plate, z = 0;
  for (let i = 0; i <= ROWS; i++) {
    const v = i / ROWS;
    out.push({ y, z, turn: turnAt(v, bend) });
    const phi = turnAt((i + 0.5) / ROWS, bend);
    y += (length / ROWS) * Math.cos(phi);
    z += (length / ROWS) * Math.sin(phi);
  }
  return out;
}

/**
 * The plate as a grid of points: rows along it from the socket to the lip, and across it from the left wall's top, over
 * the floor, to the right wall's top. Returns the points and, for each, the way its hollow faces.
 */
function plateGrid({ width, length, wall, bend }) {
  const rows = spine(length, bend);
  const P = [], N = [], S = [];
  const half = width / 2;
  const flat = half - FILLET;
  for (let i = 0; i <= ROWS; i++) {
    const v = i / ROWS, { y, z, turn } = rows[i];
    const tall = Math.max(0, wallAt(v, wall) - FILLET);
    const sin = Math.sin(turn), cos = Math.cos(turn);
    const row = [], srow = [];
    for (let k = 0; k <= 2 * HALF; k++) {
      // One half-section: s along the floor, round the bend and up the wall, mirrored for the left.
      const side = k < HALF ? -1 : 1, m = k < HALF ? HALF - k : k - HALF;
      let x, h;
      if (m <= FLAT) { x = flat * (m / FLAT); h = 0; }
      else if (m <= FLAT + ARC) { const a = ((m - FLAT) / ARC) * Math.PI / 2; x = flat + FILLET * Math.sin(a); h = FILLET * (1 - Math.cos(a)); }
      else { x = half; h = FILLET + tall * ((m - FLAT - ARC) / WALL); }
      // The floor is a shallow trough across, with a pressed rib down its middle (to a hand's breadth from the lip) and one a side.
      const u = Math.min(1, x / flat);
      const trough = 0.011 * u * u * (1 - smooth(0.85, 1, u));
      const ribFade = smooth(0.0, 0.1, v) * (1 - smooth(0.82, 0.97, v));
      const rib = (cx, w, d) => { const t = ((x * side) - cx) / w; return d * Math.exp(-t * t); };
      const press = (rib(0, 0.024, 0.0052) + rib(0.118, 0.014, 0.0032) + rib(-0.118, 0.014, 0.0032)) * ribFade * (1 - smooth(0.7, 1, u));
      const local = h + trough - press;
      row.push([side * x, y - local * sin, z + local * cos]);
      srow.push({ x: side * x, wall: m > FLAT + ARC });
    }
    P.push(row); S.push(srow);
  }
  for (let i = 0; i <= ROWS; i++) {
    const nrow = [];
    for (let k = 0; k <= 2 * HALF; k++) {
      const a = P[Math.min(i + 1, ROWS)][k], b = P[Math.max(i - 1, 0)][k];
      const c = P[i][Math.min(k + 1, 2 * HALF)], d = P[i][Math.max(k - 1, 0)];
      // Across (+x) crossed with along (+y) is +z: the hollow side, and on the walls the way in.
      nrow.push(norm(cross(sub(c, d), sub(a, b))));
    }
    N.push(nrow);
  }
  return { P, N, S, spine: rows };
}

/** Joins geometries (indexed or not) into one, keeping position, normal and uv. */
function join(GFX, parts) {
  const pos = [], nor = [], uv = [], idx = [];
  for (const g of parts) {
    const base = pos.length / 3;
    const p = g.attributes.position, n = g.attributes.normal, t = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
      uv.push(t ? t.getX(i) : 0, t ? t.getY(i) : 0);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i));
    else for (let i = 0; i < p.count; i++) idx.push(base + i);
  }
  const out = new GFX.BufferGeometry();
  out.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  out.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
  out.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
  out.setIndex(idx);
  return out;
}

/**
 * A sheet of metal over the points `P` (each with its hollow-side normal `N`), from `off0` to `off1` along the
 * normal: a face either side and the thin edge round the border, which has its own normals so it shades flat, as cut metal does.
 * `rows` and `cols` pick the patch of the grid.
 */
function sheet(GFX, { P, N }, off0, off1, rows, cols) {
  const pos = [], nor = [], uv = [], idx = [];
  const [i0, i1] = rows, [k0, k1] = cols;
  const at = (i, k, off) => [P[i][k][0] + N[i][k][0] * off, P[i][k][1] + N[i][k][1] * off, P[i][k][2] + N[i][k][2] * off];
  const push = (p, n, u, v) => { pos.push(...p); nor.push(...n); uv.push(u, v); return pos.length / 3 - 1; };
  const quad = (a, b, c, d, flip) => idx.push(...(flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
  // The two faces.
  for (const [off, sign] of [[off1, 1], [off0, -1]]) {
    const base = pos.length / 3, w = k1 - k0 + 1;
    for (let i = i0; i <= i1; i++) {
      for (let k = k0; k <= k1; k++) push(at(i, k, off), N[i][k].map((c) => c * sign), (k - k0) / (k1 - k0), (i - i0) / (i1 - i0));
    }
    for (let i = 0; i < i1 - i0; i++) {
      for (let k = 0; k < k1 - k0; k++) {
        const a = base + i * w + k, b = a + 1, c = a + w + 1, d = a + w;
        quad(a, b, c, d, sign < 0);
      }
    }
  }
  // The four edges, each its own flat strip.
  const edge = (cells, outward) => {
    const base = pos.length / 3;
    cells.forEach(([i, k], j) => {
      const n = outward(i, k);
      push(at(i, k, off1), n, j / (cells.length - 1), 1);
      push(at(i, k, off0), n, j / (cells.length - 1), 0);
    });
    // Wound so that each face looks the way its edge faces, whichever way the cells run.
    for (let j = 0; j < cells.length - 1; j++) {
      const a = base + j * 2, b = a + 1, c = a + 3, d = a + 2;
      const at3 = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
      const out = nor.slice(a * 3, a * 3 + 3);
      const g = cross(sub(at3(d), at3(a)), sub(at3(c), at3(a)));
      idx.push(...(g[0] * out[0] + g[1] * out[1] + g[2] * out[2] >= 0 ? [a, d, c, a, c, b] : [a, c, d, a, b, c]));
    }
  };
  const tangentK = (i, k) => norm(sub(P[i][Math.min(k + 1, 2 * HALF)], P[i][Math.max(k - 1, 0)]));
  const tangentI = (i, k) => norm(sub(P[Math.min(i + 1, ROWS)][k], P[Math.max(i - 1, 0)][k]));
  const range = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, j) => a + Math.sign(b - a) * j);
  const neg = (t) => [-t[0], -t[1], -t[2]];
  edge(range(i0, i1).map((i) => [i, k0]), (i, k) => neg(tangentK(i, k)));
  edge(range(i0, i1).map((i) => [i, k1]), (i, k) => tangentK(i, k));
  edge(range(k0, k1).map((k) => [i0, k]), (i, k) => neg(tangentI(i, k)));
  edge(range(k0, k1).map((k) => [i1, k]), (i, k) => tangentI(i, k));
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
}

/** A round tube swept along `points` (arrays of x, y, z), `radii` thick (a number or one for each point). */
function tube(GFX, points, radii, sides = 14) {
  const n = points.length, pos = [], nor = [], uv = [], idx = [];
  const radiusAt = (i) => (Array.isArray(radii) ? radii[i] : radii);
  let ref = [0, 0, 1];
  for (let i = 0; i < n; i++) {
    const t = norm(sub(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]));
    // Carry the frame along without it twisting: each ring's `u` is the last one's, made square to the new way.
    let u = sub(ref, t.map((c) => c * (ref[0] * t[0] + ref[1] * t[1] + ref[2] * t[2])));
    if (Math.hypot(...u) < 1e-4) u = cross(t, [1, 0, 0]);
    u = norm(u); ref = u;
    const w = cross(t, u);
    for (let s = 0; s <= sides; s++) {
      const a = (s / sides) * Math.PI * 2, c = Math.cos(a), d = Math.sin(a);
      const nn = [u[0] * c + w[0] * d, u[1] * c + w[1] * d, u[2] * c + w[2] * d];
      const r = radiusAt(i);
      pos.push(points[i][0] + nn[0] * r, points[i][1] + nn[1] * r, points[i][2] + nn[2] * r);
      nor.push(...nn);
      uv.push(i / (n - 1), s / sides);
    }
  }
  const row = sides + 1;
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) { const a = i * row + s; idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row); }
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
}

/** Rings of ellipses (`rx` across, `rz` front to back, centerd `cz` off the axis) at heights `y`, skinned into one smooth form. */
function loft(GFX, rings, segs = 40) {
  const pos = [], idx = [];
  for (const { y, rx, rz, cz = 0 } of rings) {
    for (let s = 0; s < segs; s++) { const a = (s / segs) * Math.PI * 2; pos.push(rx * Math.cos(a), y, cz + rz * Math.sin(a)); }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let s = 0; s < segs; s++) {
      const a = i * segs + s, b = i * segs + (s + 1) % segs, c = a + segs, d = b + segs;
      idx.push(a, c, b, b, c, d);
    }
  }
  // Closed at both ends.
  for (const [ring, down] of [[0, true], [rings.length - 1, false]]) {
    const center = pos.length / 3;
    pos.push(0, rings[ring].y, rings[ring].cz ?? 0);
    for (let s = 0; s < segs; s++) {
      const a = ring * segs + s, b = ring * segs + (s + 1) % segs;
      idx.push(...(down ? [center, a, b] : [center, b, a]));
    }
  }
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A fine grain along the plate, as a bump map (browser only). */
function brushedMap(GFX, seed = 3) {
  if (typeof document === 'undefined') return null;
  const size = 256, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let x = 0; x < size; x++) {
    const column = 128 + (rnd() - 0.5) * 90;
    for (let y = 0; y < size; y++) {
      const v = clamp(column + (rnd() - 0.5) * 36, 0, 255), o = (y * size + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new GFX.CanvasTexture(c);
  t.wrapS = t.wrapT = GFX.RepeatWrapping;
  t.repeat.set(3, 3);
  t.anisotropy = 8;
  return t;
}

/**
 * @param {object} GFX The engine's graphics API.
 * @param {object} [options]
 * @param {string} [options.bladeMetal] The scoop's metal, from `METALS` (default 'steel').
 * @param {string} [options.shaftMetal] The shaft and the D-handle's arms (default 'titanium').
 * @param {string} [options.fittingsMetal] The ferrules, the fork and the rivets of the shaft (default 'chrome').
 * @param {string} [options.wearMetal] The wear strip on the lip and its rivets (default 'iron').
 * @param {string} [options.gripColor] The leather of the grip and the crossbar.
 * @param {string} [options.threadColor] The wrap on it (default the leather's darker shade).
 * @returns the shovel: `group`; `handle` (the leather grip) with `gripBounds`; `scoop`, `wear`, `shaftMesh`, `fittings`,
 *   `crossbar`; `handling`, `dimensions`, `info`; the `set…` methods.
 */
export function createSnowShovel(GFX, options = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('createSnowShovel requires the Madness Engine GFX module');
  }
  let {
    bladeMetal = 'steel', shaftMetal = 'titanium', fittingsMetal = 'chrome', wearMetal = 'iron',
    gripColor = '#26272b', threadColor,
  } = options;
  for (const [label, name] of [['scoop', bladeMetal], ['shaft', shaftMetal], ['fittings', fittingsMetal], ['wear strip', wearMetal]]) {
    if (!METALS[name]) throw new Error(`no metal called ${name} for the ${label}`);
  }
  hex(gripColor, 'gripColor');
  if (threadColor !== undefined) hex(threadColor, 'threadColor');

  const D = SNOW_SHOVEL_DIMENSIONS;
  const group = new GFX.Group();
  group.name = 'snow shovel display';
  const tool = new GFX.Group();
  tool.name = 'snow shovel';
  group.add(tool);

  const bladeMaterial = metalMaterial(GFX, 'scoop metal', bladeMetal);
  const shaftMaterial = metalMaterial(GFX, 'shaft metal', shaftMetal);
  const fittingsMaterial = metalMaterial(GFX, 'fittings metal', fittingsMetal);
  const wearMaterial = metalMaterial(GFX, 'wear strip metal', wearMetal);
  const maps = leatherMaps(GFX);
  const leatherMaterial = new GFX.MeshPhysicalMaterial({
    name: 'wrapped leather grip', color: new GFX.Color(gripColor), map: maps.map, bumpMap: maps.bump, bumpScale: 0.0014,
    roughness: 0.86, metalness: 0, clearcoat: 0.04, clearcoatRoughness: 0.72,
  });
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges', color: new GFX.Color(threadColor ?? shadeHex(gripColor, 0.68)), roughness: 0.9, metalness: 0,
  });
  const grain = brushedMap(GFX);
  if (grain) { bladeMaterial.bumpMap = grain; bladeMaterial.bumpScale = 0.0006; }

  const mesh = (name, geometry, material, parent = tool) => {
    const m = new GFX.Mesh(geometry, material);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---------- the scoop: a pressed plate with a rolled bead along each wall, riveted to a socket ----------
  const grid = plateGrid({ width: D.bladeWidth, length: D.bladeLength, wall: D.wallHeight, bend: D.lipBend });
  const T = D.thickness;
  const plate = sheet(GFX, grid, -T / 2, T / 2, [0, ROWS], [0, 2 * HALF]);
  // A bead rolled along the top of each wall, and a gusset strap up the back of the plate from the socket.
  const beads = [0, 2 * HALF].map((k) => tube(GFX, grid.P.map((row, i) => {
    const p = row[k], n = grid.N[i][k];
    return [p[0] + n[0] * 0.0004, p[1] + n[1] * 0.0004, p[2] + n[2] * 0.0004];
  }), 0.0042, 10));
  const socket = loft(GFX, [
    { y: Y.socketTop, rx: 0.0184, rz: 0.0184 },
    { y: Y.socketTop + 0.03, rx: 0.0225, rz: 0.0168, cz: -0.0016 },
    { y: Y.plate - 0.012, rx: 0.036, rz: 0.0112, cz: -0.0112 + 0.0004 },
    { y: Y.plate + 0.05, rx: 0.062, rz: 0.0074, cz: -0.0074 + 0.0004 },
    { y: Y.plate + 0.118, rx: 0.095, rz: 0.0046, cz: -0.0046 - 0.0006 },
  ], 44);
  const scoopGeometry = join(GFX, [plate, ...beads, socket]);
  const scoop = mesh('pressed scoop', scoopGeometry, bladeMaterial);

  // The wear strip: a thicker steel bar bolted to the back of the lip, with a rivet head each side of the middle.
  const lip = [Math.round(ROWS * 0.915), ROWS];
  const stripCols = [HALF - FLAT - ARC + 2, HALF + FLAT + ARC - 2];
  const strip = sheet(GFX, grid, -T / 2 - 0.0034, -T / 2, lip, stripCols);
  const rivetAt = (i, k, off = T / 2) => {
    const p = grid.P[i][k], n = grid.N[i][k];
    const g = new GFX.SphereGeometry(1, 14, 8);
    g.scale(0.0052, 0.0022, 0.0052);
    // Dome facing along n: turn y onto it.
    const q = new GFX.Quaternion().setFromUnitVectors(new GFX.Vector3(0, 1, 0), new GFX.Vector3(...n));
    g.applyMatrix4(new GFX.Matrix4().makeRotationFromQuaternion(q));
    g.translate(p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off);
    return g;
  };
  const rivetRow = Math.round(ROWS * 0.955);
  const rivets = [-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18].map((x) => {
    const k = Math.round(HALF + (x / (D.bladeWidth / 2 - FILLET)) * FLAT);
    return rivetAt(rivetRow, k);
  });
  const wear = mesh('wear strip', join(GFX, [strip, ...rivets]), wearMaterial);

  // ---------- the shaft ----------
  const shaftGeometry = new GFX.CylinderGeometry(D.shaftDiameter / 2, D.shaftDiameter / 2, Y.shaftBottom - Y.shaftTop, 40, 1);
  shaftGeometry.translate(0, (Y.shaftBottom + Y.shaftTop) / 2, 0);
  // The D-handle's two arms, each a tube curving out of the fork and round to the crossbar, a little thinner than the shaft.
  const armPoints = (s) => [
    [0, Y.fork, 0], [s * 0.016, Y.fork - 0.012, 0], [s * 0.05, Y.fork - 0.038, 0], [s * 0.082, Y.fork - 0.08, 0],
    [s * 0.098, Y.fork - 0.14, 0], [s * 0.1, Y.fork - 0.19, 0], [s * 0.096, Y.crossbar + 0.034, 0], [s * 0.088, Y.crossbar + 0.012, 0],
    [s * 0.082, Y.crossbar, 0],
  ];
  const arms = [-1, 1].map((s) => tube(GFX, armPoints(s), 0.0118, 14));
  const shaftMesh = mesh('shaft and D-handle arms', join(GFX, [shaftGeometry, ...arms]), shaftMaterial);

  // ---------- the grip: leather over the shaft, wrapped, with a ferrule at each end; and the crossbar ----------
  const gripLength = Y.gripTop - Y.gripBottom;
  const gripRadius = D.gripDiameter / 2;
  const gripGeometry = new GFX.CylinderGeometry(gripRadius * 0.96, gripRadius * 1.03, gripLength, 48, 1);
  gripGeometry.translate(0, (Y.gripBottom + Y.gripTop) / 2, 0);
  const crossbarRadius = 0.0192;
  const barGeometry = new GFX.CylinderGeometry(crossbarRadius, crossbarRadius, 0.17, 40, 1);
  barGeometry.rotateZ(Math.PI / 2);
  barGeometry.translate(0, Y.crossbar, 0);
  const handle = mesh('leather grip', gripGeometry, leatherMaterial);
  const crossbar = mesh('leather crossbar', barGeometry, leatherMaterial);
  const wraps = diagonalWrapGeometry(GFX, { radius: gripRadius * 1.0 + 0.0005, startY: Y.gripBottom, height: gripLength, pitch: 0.0135 });
  const barWrap = diagonalWrapGeometry(GFX, { radius: crossbarRadius + 0.0005, startY: -0.085, height: 0.17, pitch: 0.0117 });
  barWrap.rotateZ(Math.PI / 2);
  barWrap.translate(0, Y.crossbar, 0);
  const wrap = mesh('leather wrap', join(GFX, [wraps, barWrap]), wrapMaterial);

  // The ferrules: tapered sleeves a little wider than the grip, as the swords' bezel is, and the fork the arms leave the shaft from.
  const ferrule = (y, up) => {
    const g = new GFX.CylinderGeometry(up ? gripRadius * 1.04 : gripRadius * 1.28, up ? gripRadius * 1.28 : gripRadius * 1.04, 0.026, 40, 1);
    g.translate(0, y, 0);
    return g;
  };
  const rim = (y, r) => { const g = new GFX.TorusGeometry(r, 0.0016, 8, 40); g.rotateX(Math.PI / 2); g.translate(0, y, 0); return g; };
  const forkGeometry = new GFX.SphereGeometry(1, 28, 16);
  forkGeometry.scale(0.0235, 0.03, 0.0235);
  forkGeometry.translate(0, Y.fork + 0.004, 0);
  const collar = (s) => { const g = new GFX.CylinderGeometry(0.0225, 0.0225, 0.014, 32, 1); g.rotateZ(Math.PI / 2); g.translate(s * 0.0935, Y.crossbar, 0); return g; };
  const endCap = (s) => { const g = new GFX.SphereGeometry(0.0206, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateZ(-s * Math.PI / 2); g.translate(s * 0.085, Y.crossbar, 0); return g; };
  const bands = [Y.gripBottom - 0.012, Y.gripTop + 0.012].map((y, i) => ferrule(y, i === 1));
  const rimsAt = [Y.gripBottom - 0.025, Y.gripBottom, Y.gripTop, Y.gripTop + 0.025].map((y) => rim(y, gripRadius * 1.2));
  // Two bands of rivets round the shaft where the socket takes it, and the plate's collar.
  const socketBands = [Y.socketTop + 0.004, Y.socketTop + 0.034].map((y) => rim(y, 0.0188));
  const rivetsOnShaft = [Y.socketTop + 0.02, Y.socketTop + 0.05].flatMap((y) => [-1, 1].map((s) => {
    const g = new GFX.SphereGeometry(0.0054, 14, 8); g.translate(0, 0, 0); g.translate(s * 0.0225, y, 0); return g;
  }));
  const fittings = mesh('ferrules, fork and collars', join(GFX, [...bands, ...rimsAt, forkGeometry, collar(-1), collar(1), endCap(-1), endCap(1), ...socketBands, ...rivetsOnShaft]), fittingsMaterial);

  // (The origin is the butt of the D-handle, so the overall length is how high the lip stands.)
  scoop.geometry.computeBoundingBox();
  const overallLength = scoop.geometry.boundingBox.max.y;
  const gripBounds = Object.freeze({ bottom: Y.gripBottom, top: Y.gripTop });
  const handleBounds = Object.freeze({ bottom: Y.gripBottom, top: Y.gripTop, length: gripLength });
  const handling = handlingOf({ hands: HANDS.TWO, reach: reachOf({ overallLength, gripLength }) });

  const api = {
    group, tool, handle, crossbar, wrap, scoop, wear, shaftMesh, fittings, gripBounds, handleBounds,
    leatherMaterial, wrapMaterial, bladeMaterial, shaftMaterial, fittingsMaterial, wearMaterial,
    handling,
    /** Where the second hand goes (`hold` reads this): the lead hand takes the leather on the shaft, the rear hand the middle of the D-handle's crossbar, the fist closing about it across the shaft. */
    secondGrip: Object.freeze({ at: Object.freeze([0, Y.crossbar, 0]), axis: Object.freeze([1, 0, 0]) }),
    /** Where the plate's hollow is at `v` (0 at the socket, 1 the lip) across `x` (−1 the top of the left wall, 0 the middle of the floor, 1 the top of the right wall): the point, and the way the hollow faces. */
    scoopAt(v = 0.5, x = 0) {
      const i = clamp(Math.round(v * ROWS), 0, ROWS), k = clamp(Math.round(HALF + x * HALF), 0, 2 * HALF);
      return { point: [...grid.P[i][k]], normal: [...grid.N[i][k]] };
    },
    dimensions: Object.freeze({ ...D, overallLength, gripLength, unit: 'm' }),
    info: {
      'Length': `${overallLength.toFixed(3)} m`,
      ...handlingInfo(handling, reachOf({ overallLength, gripLength })),
      'Scoop': `${(D.bladeWidth * 1000).toFixed(0)} mm wide, ${(D.bladeLength * 1000).toFixed(0)} mm long, ${(D.thickness * 1000).toFixed(1)} mm plate`,
      'Shaft': `${(D.shaftDiameter * 1000).toFixed(0)} mm tube`,
      'Grip length': `${(gripLength * 1000).toFixed(0)} mm`,
      'Scale': '1 world unit = 1 meter',
    },
    get bladeMetal() { return bladeMetal; },
    get shaftMetal() { return shaftMetal; },
    get fittingsMetal() { return fittingsMetal; },
    get wearMetal() { return wearMetal; },
    get gripColor() { return gripColor; },
    get threadColor() { return `#${wrapMaterial.color.getHexString()}`; },
    setBladeMetal(name) { return setMetal(bladeMaterial, name, (n) => { bladeMetal = n; }); },
    setShaftMetal(name) { return setMetal(shaftMaterial, name, (n) => { shaftMetal = n; }); },
    setFittingsMetal(name) { return setMetal(fittingsMaterial, name, (n) => { fittingsMetal = n; }); },
    setWearMetal(name) { return setMetal(wearMaterial, name, (n) => { wearMetal = n; }); },
    setGripColor(color) {
      hex(color, 'gripColor');
      leatherMaterial.color.set(color);
      wrapMaterial.color.set(shadeHex(color, 0.68));
      gripColor = color;
      return api;
    },
    setThreadColor(color) { hex(color, 'threadColor'); wrapMaterial.color.set(color); return api; },
    /** Turns the whole tool about its shaft (the grip stays where a hand takes it), to change which way the scoop faces. */
    setTurn(radians) { tool.rotation.y = radians; return api; },
    dispose() {
      group.traverse((o) => o.geometry?.dispose?.());
      for (const m of [bladeMaterial, shaftMaterial, fittingsMaterial, wearMaterial, leatherMaterial, wrapMaterial]) m.dispose?.();
    },
  };
  function setMetal(material, name, remember) {
    const finish = METALS[name];
    if (!finish) throw new Error(`no metal called ${name}`);
    material.color.set(finish.color);
    material.roughness = finish.roughness;
    remember(name);
    return api;
  }
  return api;
}

const METAL_NAMES = Object.keys(METALS);

/** The asset viewer's entry: every choice is live. */
export const assetViewer = Object.freeze({
  id: 'snow-shovel',
  name: 'Snow shovel (metal)',
  category: 'Props',
  group: 'tools',
  options: {},
  build({ GFX, renderer = null }) {
    const shovel = createSnowShovel(GFX);
    const metal = (label, get, set) => ({ type: 'select', label, options: METAL_NAMES, get, set });
    return Object.assign(shovel, {
      environment: studioEnvironment(GFX, renderer),
      ui: [
        metal('Scoop metal', () => shovel.bladeMetal, (v) => shovel.setBladeMetal(v)),
        metal('Shaft metal', () => shovel.shaftMetal, (v) => shovel.setShaftMetal(v)),
        metal('Fittings metal', () => shovel.fittingsMetal, (v) => shovel.setFittingsMetal(v)),
        metal('Wear strip metal', () => shovel.wearMetal, (v) => shovel.setWearMetal(v)),
        { type: 'color', label: 'Grip', get: () => shovel.gripColor, set: (v) => shovel.setGripColor(v) },
        { type: 'color', label: 'Grip thread', get: () => shovel.threadColor, set: (v) => shovel.setThreadColor(v) },
      ],
    });
  },
});
