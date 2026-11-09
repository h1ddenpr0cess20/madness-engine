import { WOOD_FINISHES, WOOD_SPECIES } from '../textures/wood.js';
import { woodBoardMaterial } from '../props/wood-board.js';
import { createKrystalOrbPommel, createMagicEggPommel } from './common.js';

/**
 * A gnarled wizard's staff carved entirely from the library's wood textures.
 * Its head is a cradle of twisting, knotted roots that rises out of the shaft
 * and clasps the Krystal crystal orb (or, optionally, the glass egg) in a
 * ragged lip, as if the staff had grown around it. Only the grip's leather and
 * thread are not wood. All dimensions are in metres.
 */
export const STAFF_DIMENSIONS = Object.freeze({
  shaftLength: 1.6,
  shaftDiameter: 0.032,
  gripLength: 0.3,
  gripDiameter: 0.037,
  cradleDepth: 0.1,
  orbRadius: 0.045,
  // The glass egg as the pommel builds it is 54 x 80 mm; on a staff it is drawn this much larger.
  eggScale: 1.7,
  eggHalfWidth: 0.0272 * 1.7,
  eggHalfHeight: 0.04 * 1.7,
  unit: 'm',
});

export const STAFF_TOPPERS = Object.freeze(['orb', 'egg', 'none']);

const GRIP_Y = [0.8, 1.1];
const HEAD_Y = 1.55;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** A small seeded generator, so a staff's gnarls are repeatable and a `seed` gives another staff. */
function random(seed) {
  let a = (Math.floor(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const profile = (GFX, rows) => rows.map(([r, y]) => new GFX.Vector2(r, y));

/** Grain along a turned part: u is height, v goes round the turning. */
function turnedUV(geometry, around = 2) {
  const uv = geometry.attributes.uv;
  const p = geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getY(i), uv.getX(i) * around);
  uv.needsUpdate = true;
  return geometry;
}

/** Seamless planar grain for carved parts: u is height, v is across. */
function carvedUV(GFX, geometry, scale = 4) {
  const p = geometry.attributes.position;
  const out = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    out[2 * i] = p.getY(i);
    out[2 * i + 1] = (p.getX(i) + p.getZ(i)) * scale;
  }
  geometry.setAttribute('uv', new GFX.Float32BufferAttribute(out, 2));
  return geometry;
}

/**
 * A round tube swept along `points`; `radii` gives its radius at each point
 * (a number for a constant tube). A taper to a small radius reads as a tip.
 */
export function sweepTube(GFX, points, radii, sides = 10) {
  const n = points.length;
  const radiusAt = (i) => (Array.isArray(radii) ? radii[i] : radii);
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const t = new GFX.Vector3();
  const nrm = new GFX.Vector3();
  const bin = new GFX.Vector3();
  const ref = new GFX.Vector3(0, 1, 0);
  const alt = new GFX.Vector3(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    t.subVectors(b, a).normalize();
    nrm.crossVectors(t, Math.abs(t.y) > 0.95 ? alt : ref).normalize();
    bin.crossVectors(t, nrm).normalize();
    const r = radiusAt(i);
    for (let s = 0; s <= sides; s++) {
      const phi = (s / sides) * Math.PI * 2;
      const cx = Math.cos(phi);
      const cy = Math.sin(phi);
      const nx = nrm.x * cx + bin.x * cy;
      const ny = nrm.y * cx + bin.y * cy;
      const nz = nrm.z * cx + bin.z * cy;
      positions.push(points[i].x + nx * r, points[i].y + ny * r, points[i].z + nz * r);
      normals.push(nx, ny, nz);
      uvs.push(i / (n - 1), s / sides);
    }
  }
  const row = sides + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s < sides; s++) {
      const a = i * row + s;
      const b = a + row;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new GFX.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new GFX.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

/** The shaft: a gently tapering rod with a few knots, thicker at the grip and where the roots take over. */
function shaftProfile() {
  const rows = [[0.0, 0.0], [0.007, 0.002], [0.0115, 0.02], [0.0135, 0.07]];
  const knot = (y, r, w) => {
    rows.push([r - 0.0012, y - w], [r + 0.0025, y - w * 0.3], [r + 0.0035, y], [r + 0.0025, y + w * 0.3], [r - 0.0012, y + w]);
  };
  rows.push([0.0145, 0.2]);
  knot(0.34, 0.0148, 0.03);
  rows.push([0.0152, 0.5], [0.0158, 0.7]);
  rows.push([0.0172, GRIP_Y[0] - 0.01], [0.0178, GRIP_Y[0]], [0.0178, GRIP_Y[1]], [0.017, GRIP_Y[1] + 0.012]);
  rows.push([0.0152, 1.2]);
  knot(1.3, 0.0158, 0.028);
  rows.push([0.0165, 1.42], [0.0185, HEAD_Y - 0.02], [0.021, HEAD_Y + 0.01], [0.0, HEAD_Y + 0.01]);
  return rows;
}

export function createStaff(GFX, {
  species = 'walnut',
  finish = 'lacquered',
  gripColor = '#3a2418',
  threadColor = '#e2b857',
  topper = 'orb',
  vine = true,
  tendrils = 18,
  seed = 7,
  detail = 1,
} = {}) {
  if (!Object.hasOwn(WOOD_SPECIES, species)) throw new Error(`no wood called ${species}; choose ${Object.keys(WOOD_SPECIES).join(', ')}`);
  if (!WOOD_FINISHES.includes(finish)) throw new Error(`no wood finish called ${finish}; choose ${WOOD_FINISHES.join(', ')}`);
  if (!STAFF_TOPPERS.includes(topper)) throw new Error(`no topper called ${topper}; choose ${STAFF_TOPPERS.join(', ')}`);
  if (!Number.isInteger(tendrils) || tendrils < 8 || tendrils > 32) throw new RangeError('tendrils must be a whole number from 8 to 32');
  if (!Number.isFinite(seed)) throw new TypeError('seed must be a number');
  if (!Number.isFinite(detail) || detail <= 0) throw new RangeError('detail must be a positive number');
  for (const [name, c] of [['gripColor', gripColor], ['threadColor', threadColor]]) {
    if (!/^#[0-9a-f]{6}$/i.test(c)) throw new TypeError(`${name} must be a six-digit hex colour`);
  }

  const seg = (n) => Math.max(6, Math.round(n * detail));
  const group = new GFX.Group();
  group.name = 'wizard staff display';

  let woodSpecies = species;
  let woodFinish = finish;
  let wood = woodBoardMaterial(GFX, woodSpecies, woodFinish);
  const leather = new GFX.MeshPhysicalMaterial({
    name: 'staff leather', color: gripColor, roughness: 0.62, metalness: 0, clearcoat: 0.1,
  });
  const thread = new GFX.MeshPhysicalMaterial({
    name: 'staff thread', color: threadColor, roughness: 0.5, metalness: 0.1,
  });
  const woodParts = [];

  const add = (parent, geometry, material, name) => {
    // Wood gets its grain along its length: turned parts by their lathe, carved parts planar.
    if (material === wood) {
      if (geometry.type === 'LatheGeometry') turnedUV(geometry); else carvedUV(GFX, geometry);
    }
    const mesh = new GFX.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (material === wood) woodParts.push(mesh);
    return mesh;
  };

  const shaft = add(group, new GFX.LatheGeometry(profile(GFX, shaftProfile()), seg(48)), wood, 'turned wooden shaft');

  // Leather grip with a helix of contrasting thread.
  const gripLength = GRIP_Y[1] - GRIP_Y[0];
  const grip = add(group, new GFX.CylinderGeometry(0.0188, 0.0188, gripLength, seg(40), 1), leather, 'leather grip');
  grip.position.y = (GRIP_Y[0] + GRIP_Y[1]) / 2;
  const turns = 14;
  const helix = [];
  const steps = turns * 24;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const a = f * turns * Math.PI * 2;
    helix.push(new GFX.Vector3(Math.cos(a) * 0.0194, GRIP_Y[0] + 0.006 + f * (gripLength - 0.012), Math.sin(a) * 0.0194));
  }
  const gripThread = add(group, sweepTube(GFX, helix, 0.0016, 6), thread, 'grip thread');
  const gripThread2 = add(group, sweepTube(GFX, helix.map((p) => new GFX.Vector3(-p.x, p.y, -p.z)), 0.0016, 6), thread, 'grip thread crossing');

  // Two roots entwined up the shaft between the grip and the head, as if the staff were still growing.
  const vineGroup = new GFX.Group();
  vineGroup.name = 'entwined roots';
  group.add(vineGroup);
  if (vine) {
    const rnd = random(seed + 101);
    for (const sign of [1, -1]) {
      const pts = []; const radii = [];
      const y0 = HEAD_Y - 0.04; const y1 = GRIP_Y[1] + 0.03;
      const count = 160;
      const phase = rnd() * 6;
      for (let i = 0; i <= count; i++) {
        const f = i / count;
        const a = sign * f * 4.5 * Math.PI * 2 + (sign < 0 ? Math.PI : 0) + phase;
        const r = 0.0185 + 0.0022 * Math.sin(f * 17 + phase) + 0.002 * Math.sin(f * Math.PI);
        pts.push(new GFX.Vector3(Math.cos(a) * r, y0 - f * (y0 - y1), Math.sin(a) * r));
        radii.push(0.0036 * (0.55 + 0.45 * Math.sin(f * Math.PI)) * (1 + 0.28 * Math.sin(f * 23 + phase * 2)) + 0.0004);
      }
      add(vineGroup, sweepTube(GFX, pts, radii, 8), wood, 'entwined wooden root');
    }
  }

  // The head: a core and a thicket of roots around the topper.
  const head = new GFX.Group();
  head.name = 'staff head';
  head.position.y = HEAD_Y;
  group.add(head);
  const topperHolder = new GFX.Group();
  topperHolder.name = 'staff topper';
  head.add(topperHolder);
  const headParts = [];
  let currentTopper = null;
  let headCentre = 0;
  const toppers = {};

  const topperSpec = (kind) => (kind === 'egg'
    ? { a: STAFF_DIMENSIONS.eggHalfWidth, b: STAFF_DIMENSIONS.eggHalfHeight }
    : { a: STAFF_DIMENSIONS.orbRadius, b: STAFF_DIMENSIONS.orbRadius });

  function buildHead(kind) {
    for (const m of headParts) {
      head.remove(m);
      m.geometry?.dispose?.();
      const i = woodParts.indexOf(m);
      if (i >= 0) woodParts.splice(i, 1);
    }
    headParts.length = 0;
    const mark = (mesh) => { headParts.push(mesh); return mesh; };
    const rnd = random(seed);

    const { a, b } = topperSpec(kind === 'none' ? 'orb' : kind);
    const D = STAFF_DIMENSIONS.cradleDepth;
    const gap = 0.0025;
    const A = a + gap;
    const B = b + gap;
    // Where the roots' lip meets the topper: its seat. The topper's centre rises above it.
    const rc = Math.max(0.028, a * 0.82);
    const rimDrop = B * Math.sqrt(Math.max(0.02, 1 - (rc / A) ** 2));
    const cy = D + rimDrop;
    // The surface of the topper, for any height above the cradle.
    const surface = (h) => A * Math.sqrt(Math.max(0, 1 - ((h - cy) / B) ** 2));
    const rimR = surface(D);
    const r0 = 0.0195;
    // The cradle's outer envelope: out of the shaft in a swelling bulb to the lip.
    const envelope = (h) => {
      const t = clamp(h / D, 0, 1);
      return r0 + (rimR + 0.004 - r0) * (0.35 * t + 0.65 * t ** 2.2);
    };

    // A solid core of the cradle fills between the roots.
    const core = [[0.0, -0.02]];
    for (let k = 0; k <= 10; k++) {
      const h = (k / 10) * D;
      core.push([envelope(h) * 0.86, h]);
    }
    core.push([rimR * 0.78, D + 0.002], [rimR * 0.55, D - 0.01], [0, D - 0.016]);
    mark(add(head, new GFX.LatheGeometry(profile(GFX, core), seg(40)), wood, 'topper cup'));

    // The roots: each climbs from the shaft, twisting, and ends in a ragged lip; the tall ones clasp the topper.
    const n = tendrils;
    for (let i = 0; i < n; i++) {
      const tall = rnd() < 0.34;
      const phi0 = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const hs = -0.012 - rnd() * 0.03;
      const he = tall ? D + 0.018 + rnd() * 0.05 : D - 0.012 + rnd() * 0.02;
      const twist = (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * 1.4);
      const ph = rnd() * 6.28;
      const thick = 0.0066 + rnd() * 0.0046;
      const pts = []; const radii = [];
      const count = seg(34);
      for (let k = 0; k <= count; k++) {
        const f = k / count;
        const h = hs + (he - hs) * f;
        const phi = phi0 + twist * f + 0.32 * Math.sin(f * 5 + ph) + 0.1 * Math.sin(f * 13 + ph * 2);
        let r;
        if (h <= D) r = envelope(Math.max(h, 0)) + 0.0032 * Math.sin(f * 9 + ph) + 0.0028;
        else r = Math.max(surface(h) + 0.0014, rimR * 0.4);
        // Lips splay out as they end, like torn bark.
        if (f > 0.86) r += (f - 0.86) * (tall ? 0.01 : 0.05);
        pts.push(new GFX.Vector3(Math.cos(phi) * r, h, Math.sin(phi) * r));
        const swell = 1 + 0.4 * Math.sin(f * 6 + ph) + 0.16 * Math.sin(f * 17 + ph * 2);
        const taper = f < 0.12 ? 0.5 + f * 4 : 1 - 0.78 * clamp((f - 0.62) / 0.38, 0, 1);
        radii.push(Math.max(0.0007, thick * swell * taper));
      }
      mark(add(head, sweepTube(GFX, pts, radii, 8), wood, `root tendril ${i + 1}`));
    }

    // Bands of root wind around the cradle, binding the tendrils into a woven mass.
    for (let k = 0; k < 4; k++) {
      const pts = []; const radii = [];
      const count = seg(110);
      const hs = 0.006 + k * 0.012;
      const he = D - 0.006 - rnd() * 0.01;
      const dir = k % 2 ? -1 : 1;
      const ph = rnd() * 6.28;
      for (let i = 0; i <= count; i++) {
        const f = i / count;
        const h = hs + (he - hs) * f;
        const phi = ph + dir * f * 3.2 * Math.PI * 2;
        const r = envelope(h) + 0.005 + 0.002 * Math.sin(f * 19 + ph);
        pts.push(new GFX.Vector3(Math.cos(phi) * r, h, Math.sin(phi) * r));
        radii.push(Math.max(0.0007, 0.0048 * (1 + 0.35 * Math.sin(f * 14 + ph)) * Math.min(1, f * 10, (1 - f) * 10)));
      }
      mark(add(head, sweepTube(GFX, pts, radii, 7), wood, `root band ${k + 1}`));
    }

    // Fine roots creep down the shaft from the head's base and fade into it.
    const m = Math.max(6, Math.round(n * 0.55));
    for (let i = 0; i < m; i++) {
      const phi0 = (i / m) * Math.PI * 2 + rnd() * 0.5;
      const len = 0.08 + rnd() * 0.15;
      const twist = (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 1.6);
      const ph = rnd() * 6.28;
      const pts = []; const radii = [];
      const count = seg(26);
      for (let k = 0; k <= count; k++) {
        const f = k / count;
        const h = 0.01 - f * len;
        const phi = phi0 + twist * f;
        const r = r0 - 0.0006 + (0.0036 * (1 - f)) + 0.0014 * Math.sin(f * 9 + ph);
        pts.push(new GFX.Vector3(Math.cos(phi) * r, h, Math.sin(phi) * r));
        radii.push(Math.max(0.0006, 0.0058 * (1 - f) ** 0.8 * (1 + 0.25 * Math.sin(f * 12 + ph))));
      }
      mark(add(head, sweepTube(GFX, pts, radii, 7), wood, `shaft root ${i + 1}`));
    }

    headCentre = cy;
    return { cy };
  }

  function mountTopper(kind) {
    if (currentTopper) currentTopper.visible = false;
    currentTopper = null;
    if (kind === 'none') { buildHead('none'); return; }
    const { cy } = buildHead(kind);
    if (!toppers[kind]) {
      if (kind === 'orb') {
        const asset = createKrystalOrbPommel(GFX, STAFF_DIMENSIONS.orbRadius);
        toppers.orb = { asset, object: asset.group };
      } else {
        const asset = createMagicEggPommel(GFX, STAFF_DIMENSIONS.eggHalfHeight / STAFF_DIMENSIONS.eggScale);
        // The sword's egg hangs point-down; stand it on its broad end by turning it end over end about its centre.
        const holder = new GFX.Group();
        holder.name = 'Magic Egg staff topper';
        asset.group.position.y = -STAFF_DIMENSIONS.eggHalfHeight / STAFF_DIMENSIONS.eggScale;
        holder.add(asset.group);
        holder.rotation.z = Math.PI;
        // Enlarge the egg and the world-space volume its mist is marched through, together.
        holder.scale.setScalar(STAFF_DIMENSIONS.eggScale);
        asset.mist.material.uniforms.uShape.value.multiplyScalar(STAFF_DIMENSIONS.eggScale);
        asset.glass.material.thickness *= STAFF_DIMENSIONS.eggScale;
        asset.glass.material.attenuationDistance *= STAFF_DIMENSIONS.eggScale;
        toppers.egg = { asset, object: holder };
      }
      topperHolder.add(toppers[kind].object);
    }
    const t = toppers[kind];
    t.object.visible = true;
    // The orb group's origin is its centre, and so is the egg holder's.
    t.object.position.y = cy;
    currentTopper = t.object;
  }

  let topperKind = topper;
  mountTopper(topperKind);

  // The top of the staff: the topper's centre and its half-height.
  const dims = () => HEAD_Y + headCentre + topperSpec(topperKind === 'none' ? 'orb' : topperKind).b;

  const api = {
    group,
    shaft,
    head,
    grip,
    gripThread,
    gripThread2,
    get topper() { return topperKind; },
    get topperAsset() { return toppers[topperKind]?.asset ?? null; },
    get orb() { return toppers.orb?.asset ?? null; },
    get egg() { return toppers.egg?.asset ?? null; },
    get species() { return woodSpecies; },
    get finish() { return woodFinish; },
    get gripColor() { return `#${leather.color.getHexString()}`; },
    get threadColor() { return `#${thread.color.getHexString()}`; },
    get vine() { return vine; },
    get tendrils() { return tendrils; },
    get seed() { return seed; },
    get dimensions() {
      return Object.freeze({ ...STAFF_DIMENSIONS, overallLength: dims(), tendrils, unit: 'm' });
    },
    get info() {
      return {
        'Staff length': `${dims().toFixed(2)} m`,
        Wood: `${woodSpecies} (${woodFinish})`,
        Topper: topperKind === 'orb' ? 'Krystal crystal orb' : topperKind === 'egg' ? 'Glass egg' : 'none',
        Tendrils: String(tendrils),
        Scale: '1 world unit = 1 metre',
      };
    },
    setWood(nextSpecies = woodSpecies, nextFinish = woodFinish) {
      if (!Object.hasOwn(WOOD_SPECIES, nextSpecies)) throw new Error(`no wood called ${nextSpecies}; choose ${Object.keys(WOOD_SPECIES).join(', ')}`);
      if (!WOOD_FINISHES.includes(nextFinish)) throw new Error(`no wood finish called ${nextFinish}; choose ${WOOD_FINISHES.join(', ')}`);
      const next = woodBoardMaterial(GFX, nextSpecies, nextFinish);
      for (const mesh of woodParts) mesh.material = next;
      wood.dispose?.();
      wood = next;
      woodSpecies = nextSpecies;
      woodFinish = nextFinish;
      return api;
    },
    setGripColor(color) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');
      leather.color.set(color);
      return api;
    },
    setThreadColor(color) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('threadColor must be a six-digit hex colour');
      thread.color.set(color);
      return api;
    },
    setTopper(kind) {
      if (!STAFF_TOPPERS.includes(kind)) throw new Error(`no topper called ${kind}; choose ${STAFF_TOPPERS.join(', ')}`);
      topperKind = kind;
      mountTopper(kind);
      return api;
    },
  };
  return api;
}
