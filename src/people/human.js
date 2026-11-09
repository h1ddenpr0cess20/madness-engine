import { Skeleton, skinDual } from '../models/rig.js';
import { assemble, cross, len, Part, sub } from './human/kit.js';
import { bones, FINGER_NAMES, FINGERS, HEIGHT, JOINTS, mirror, sideOf } from './human/skeleton.js';
import { buildEyes, buildMouth, withLipCorners } from './human/head.js';
import { bodyLevel } from './human/basemesh.js';
import { zoneOf } from './human/body.js';
import { BONES as BAKED_BONES } from './human/data/base.js';
import { DEFAULT_OUTFIT, GARMENTS } from './human/clothes.js';
import { humanTextures } from './human/textures.js';
import { CLIPS, moveHuman } from './human/motion.js';

/**
 * A human, at real size (1.76 m, one world unit a metre, as the weapons
 * are), built to be dressed, posed and animated.
 *
 *     import * as GFX from 'madness-engine/gfx';
 *     import { createHuman } from 'madness-engine/people/human';
 *     import { createKrystalSword } from 'madness-engine/weapons';
 *
 *     const man = createHuman(GFX);                 // briefs, t-shirt, jeans, sneakers
 *     scene.add(man.group);
 *     man.hold(createKrystalSword(GFX));            // in his right hand
 *     stage.run((dt, time) => man.pose({ clip: 'walk', t, time }));
 *
 * The base body is a mesh of its own; every garment is another, worn over
 * it. A garment hides what it covers (skin, and the garments under it), so
 * nothing shows through however he moves. `wear`, `remove` and `dress`
 * change what he has on; a garment of your own is an object shaped like
 * those in `GARMENTS`.
 *
 * Everything that moves on a person has a bone: the trunk, neck and head,
 * a collarbone over each arm, three bones a finger, the toes, the jaw and
 * tongue, each eye and its two lids, the brows and the mouth's corners. The
 * body clips (`CLIPS`) use the engine's movement vocabulary; `face` and
 * `hands` set the rest, and `pose` takes them on every frame.
 */

export { CLIPS, GARMENTS, DEFAULT_OUTFIT, HEIGHT };
export const HUMAN_DIMENSIONS = Object.freeze({ height: HEIGHT, headHeight: 0.22, shoulderWidth: 0.46, inseam: 0.8, armLength: 0.62, handLength: 0.19, footLength: 0.27, unit: 'm' });

const BODY_MATERIALS = ['skin', 'eye', 'teeth', 'gums', 'tongue', 'lash'];
const builds = new Map();
const NAMES = bones().map(([n]) => n);

/** Subdivision level for a detail: the baked quads below 0.8, smoothed once from there. */
export const levelFor = (detail) => (detail >= 0.8 ? 1 : 0);

/**
 * The skin as a part: every quad of the body at `level`, split where its
 * UVs are, its normals from the smooth surface, each vertex shaded by how
 * much of the sky it sees, weighted as MakeHuman's artists weighted it (the
 * mouth's corners given their own bones), and tagged with where on the body
 * it is.
 */
function skinPart(level) {
  const { pos, uv, faces, uvFaces, weights, occ } = bodyLevel(level);
  const n = new Float32Array(pos.length);
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const q = cross(sub(P(c), P(a)), sub(P(d), P(b)));
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  const part = new Part('body', 'skin');
  const ids = new Map();
  const corner = (v, t) => {
    const key = v * 4194304 + t;
    let id = ids.get(key);
    if (id === undefined) {
      const p = P(v);
      const named = {};
      for (const [b, w] of Object.entries(weights[v])) named[BAKED_BONES[b]] = (named[BAKED_BONES[b]] ?? 0) + w;
      const l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1;
      const ao = occ[v];
      id = part.vertex(p, [uv[t * 2], uv[t * 2 + 1]], withLipCorners(named, p), 0.3 + 0.7 * Math.pow(ao, 0.75), [n[v * 3] / l, n[v * 3 + 1] / l, n[v * 3 + 2] / l], zoneOf(weights[v], p));
      ids.set(key, id);
    }
    return id;
  };
  for (let f = 0; f < faces.length; f += 4) {
    const q = [0, 1, 2, 3].map((k) => corner(faces[f + k], uvFaces[f + k]));
    const v = [0, 1, 2, 3].map((k) => P(faces[f + k]));
    // Split each quad along its shorter diagonal.
    if (len(sub(v[0], v[2])) <= len(sub(v[1], v[3]))) part.idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    else part.idx.push(q[0], q[1], q[3], q[1], q[2], q[3]);
  }
  return part;
}

/** The base body's mesh data at `detail`, made once and shared. */
function bodyData(detail) {
  const level = levelFor(detail);
  const key = `body@${level}`;
  if (!builds.has(key)) {
    const parts = [skinPart(level), buildEyes(detail), ...buildMouth(detail)];
    builds.set(key, { data: assemble(parts, NAMES, BODY_MATERIALS) });
  }
  return builds.get(key);
}

/** A garment's mesh data at `detail`, made once and shared. */
function garmentData(name, garment, detail) {
  const key = garment === GARMENTS[name] ? `${name}@${detail}` : null;
  if (key && builds.has(key)) return builds.get(key);
  const data = assemble(garment.build(detail), NAMES, garment.materials);
  if (key) builds.set(key, data);
  return data;
}

const DEFAULT_LOOK = Object.freeze({
  skin: '#b98a70', iris: '#5a4632',
  shirt: '#8f9399', denim: '#ffffff', shoe: '#2c2c30', sole: '#efece6', briefs: '#2a2b30',
});

/** The materials, by name, for a look. Textures where there is a document to paint them on. */
function makeMaterials(GFX, look, tex) {
  const M = (name, o) => new GFX.MeshPhysicalMaterial({ name: `human ${name}`, vertexColors: true, ...o });
  const mats = {
    skin: M('skin', {
      color: tex ? '#ffffff' : look.skin, map: tex?.skin.map ?? null, bumpMap: tex?.skin.bump ?? null, bumpScale: 0.00035, roughness: 0.5,
      // Light scattered back out of the skin, warm and soft at the edges.
      sheen: 0.3, sheenColor: new GFX.Color('#e8a090'), sheenRoughness: 0.4, clearcoat: 0.06, clearcoatRoughness: 0.45,
    }),
    eye: M('eyes', { color: '#ffffff', map: tex?.eye ?? null, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    teeth: M('teeth', { color: '#e8dfcb', roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15, sheen: 0.25, sheenColor: new GFX.Color('#fff8ea') }),
    gums: M('gums', { color: '#c8706c', roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.2 }),
    tongue: M('tongue', { color: '#94504f', roughness: 0.45, clearcoat: 0.25 }),
    lash: M('lashes', { color: '#1a1412', roughness: 0.7, side: GFX.DoubleSide }),
    briefs: M('briefs', { color: look.briefs, roughness: 0.8, sheen: 0.5, sheenColor: new GFX.Color('#9aa0aa'), sheenRoughness: 0.5 }),
    shirt: M('t-shirt', { color: look.shirt, map: tex?.shirt.map ?? null, bumpMap: tex?.shirt.bump ?? null, bumpScale: 0.0003, roughness: 0.9, sheen: 0.7, sheenColor: new GFX.Color('#ffffff'), sheenRoughness: 0.55, side: GFX.DoubleSide }),
    denim: M('denim', { color: tex ? look.denim : '#2c4a78', map: tex?.denim.map ?? null, bumpMap: tex?.denim.bump ?? null, bumpScale: 0.0004, roughness: 0.86, sheen: 0.35, sheenColor: new GFX.Color('#9db4d8'), sheenRoughness: 0.6, side: GFX.DoubleSide }),
    shoe: M('sneakers', { color: look.shoe, map: tex?.shoe ?? null, roughness: 0.62, clearcoat: 0.04 }),
    sole: M('soles', { color: look.sole, map: tex?.sole ?? null, roughness: 0.65 }),
  };
  return mats;
}

/** A skinned mesh over `data`, drawn in `materials` (one per draw group). */
function skinnedMesh(GFX, data, materials, name) {
  const geometry = new GFX.BufferGeometry();
  const position = new GFX.BufferAttribute(data.position.slice(), 3);
  const normal = new GFX.BufferAttribute(data.normal.slice(), 3);
  geometry.setAttribute('position', position);
  geometry.setAttribute('normal', normal);
  geometry.setAttribute('uv', new GFX.BufferAttribute(data.uv, 2));
  geometry.setAttribute('color', new GFX.BufferAttribute(data.color, 3));
  geometry.setIndex(new GFX.BufferAttribute(data.index.slice(), 1));
  for (const g of data.groups) geometry.addGroup(g.start, g.count, g.materialIndex);
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius *= 1.6;
  const mesh = new GFX.Mesh(geometry, materials);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, geometry, position, normal, data };
}

/**
 * Hand shapes: how far each finger curls at its three joints (0 straight,
 * 1 fully), how the thumb lies, and the fingers' spread.
 */
export const HAND_POSES = Object.freeze({
  relaxed: { curl: [0.22, 0.3, 0.2], thumb: 0.15, spread: 0.1 },
  open: { curl: [0, 0.04, 0.02], thumb: 0, spread: 0.6 },
  grip: { curl: [0.75, 0.95, 0.6], thumb: 0.85, spread: 0 },
  fist: { curl: [1.0, 1.0, 0.4], thumb: 1, spread: 0 },
  point: { curl: [1.0, 1.0, 0.4], thumb: 0.9, spread: 0, straight: ['index'] },
});

/** Euler angles (for Rz·Ry·Rx, as the rig turns) of the turn by `angle` about unit `axis`. */
function eulerOf(R) {
  return [Math.atan2(R[2][1], R[2][2]), Math.asin(Math.max(-1, Math.min(1, -R[2][0]))), Math.atan2(R[1][0], R[0][0])];
}
function axisTurn(axis, angle) {
  const [x, y, z] = axis, c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}
const mul3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
/** A rest-frame axis of the left hand, for side `m` (a turn's axis mirrors as (x, −y, −z)). */
const sideAxis = (a, m) => (m > 0 ? a : [a[0], -a[1], -a[2]]);

// For each finger: its curl axis, and the axis that spreads it away from the middle finger.
const HAND_AXES = Object.fromEntries(FINGER_NAMES.map((name) => {
  const f = FINGERS[name];
  const dir = sub(f.joints[3], f.joints[0]);
  const away = sub(f.joints[0], FINGERS.middle.joints[0]);
  const spread = name === 'middle' || name === 'thumb' ? [0, 0, 1] : cross(dir, away);
  const l = len(spread) || 1;
  return [name, { curl: f.curl, spread: spread.map((v) => v / l) }];
}));

// The swings made with both hands on the grip.
const TWO_HANDED = new Set(['chop']);

// Where a held grip's middle sits in the (left) hand at rest, and how its axis tilts.
const GRIP_AT = [0.283, 0.79, 0.04], GRIP_TILT = -0.05;

// The axis the thumb's root turns about to come across the palm (left hand).
const THUMB_IN = [-0.225, 0.03, 0.974];

/**
 * The shoulders follow the arms, as the collarbone and shoulder blade do: as
 * an arm goes up past level the collarbone lifts, and as it reaches forward
 * it comes forward, so the shoulder keeps its shape instead of folding. The
 * arm is turned back by as much, so the hand stays where it was put.
 */
function shrug(k) {
  for (const [S, m] of [['L', 1], ['R', -1]]) {
    const r = k.bone(`arm${S}`).rot;
    const rest = sub(mirror(JOINTS.elbow, m), mirror(JOINTS.shoulder, m));
    const l = len(rest);
    // R = Rz·Ry·Rx applied to the rest direction.
    let [x, y, z] = [rest[0] / l, rest[1] / l, rest[2] / l];
    const cx = Math.cos(r[0]), sx = Math.sin(r[0]), cy = Math.cos(r[1]), sy = Math.sin(r[1]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    y = x * sz + y * cz;
    const up = Math.acos(Math.max(-1, Math.min(1, -y)));
    const lift = 0.5 * Math.max(0, Math.min(1, (up - 1.0) / 1.9));
    const reach = 0.22 * Math.max(0, z) * Math.max(0, Math.min(1, up / 1.2));
    k.turn(`clavicle${S}`, 0, -m * reach, m * lift);
    k.turn(`arm${S}`, 0, m * reach, -m * lift);
  }
}

/** Bends side `S`'s hand into `shape` ({ curl, thumb, spread, straight }), `k` of the way (0..1). */
function poseHand(k, S, shape, amount = 1) {
  const m = S === 'L' ? 1 : -1;
  const bend = [1.45, 1.6, 1.1];
  const spreads = { index: 0.14, middle: 0.0, ring: 0.1, pinky: 0.24 };
  const set = (bone, R) => { const r = k.bone(bone).rot; const e = eulerOf(R); r[0] += e[0]; r[1] += e[1]; r[2] += e[2]; };
  for (const name of FINGER_NAMES) {
    if (name === 'thumb') continue;
    const ax = HAND_AXES[name];
    const straight = shape.straight?.includes(name) ? 0.08 : 1;
    // The little fingers curl a touch more than the index, as a hand does.
    const extra = name === 'pinky' ? 1.08 : name === 'ring' ? 1.04 : 1;
    shape.curl.forEach((c, i) => {
      let R = axisTurn(sideAxis(ax.curl, m), c * bend[i] * straight * extra * amount);
      if (i === 0) R = mul3(axisTurn(sideAxis(ax.spread, m), (spreads[name] * shape.spread - 0.05 * c) * amount), R);
      set(`${name}${i + 1}${S}`, R);
    });
  }
  // The thumb swings in at its root and folds over the index and middle fingers.
  const t = shape.thumb * amount;
  const thumb = sideAxis(HAND_AXES.thumb.curl, m);
  set(`thumb1${S}`, axisTurn(sideAxis(THUMB_IN, m), 0.21 * t));
  set(`thumb2${S}`, axisTurn(thumb, 1.08 * t));
  set(`thumb3${S}`, axisTurn(thumb, 0.69 * t));
}

/**
 * The face, set by `face(...)` and held until changed: `jaw` 0 shut to 1
 * wide open, `blink` (or `blinkL`, `blinkR`) 0 open to 1 shut, `look`
 * [yaw, pitch] in radians (+yaw to his left, +pitch up), `smile` −1..1,
 * `brows` −1 (a frown) .. 1 (raised), `tongue` 0..1 out, and the lips:
 * `lipUp` (the upper lifted off the teeth), `lipDown` (the lower pulled
 * down), `pucker` (rounded and pushed out, as for "oo"), `wide` (stretched,
 * as for "ee"), each 0..1. With `auto` (the default) he blinks on his own
 * and his eyes wander a little.
 */
const FACE_DEFAULT = Object.freeze({ jaw: 0, blink: 0, blinkL: null, blinkR: null, look: [0, 0], smile: 0, brows: 0, tongue: 0, lipUp: 0, lipDown: 0, pucker: 0, wide: 0, auto: true });

const hash = (n, k) => { const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const ease01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** The mouth's shapes for the sounds of speech: open vowels, spread, rounded, and closed lips. */
const SOUNDS = [
  { jaw: 0.45, wide: 0.15 }, // "ah"
  { jaw: 0.2, wide: 0.6, lipUp: 0.15 }, // "ee"
  { jaw: 0.25, pucker: 0.85 }, // "oo"
  { jaw: 0.3, wide: 0.3 }, // "eh"
  { jaw: 0.02, pucker: 0.15 }, // "m", "b", "p"
  { jaw: 0.12, lipUp: 0.25, lipDown: 0.2 }, // "f", "s", "t"
];

/**
 * What speech does to the face at `time`: syllables at a talking pace, each
 * a sound from SOUNDS, run into one another, in phrases with breaths between,
 * and the brows lifting on the stressed ones. `loud` (0..1) shouts it: the
 * mouth opened wide and squared, the lips off the teeth, the brows down.
 */
export function speech(time, { amount = 1, loud = 0 } = {}) {
  const rate = 4.4 + loud * 0.6;
  const phrase = 3.1, gap = 0.45 + loud * 0.15;
  const into = ((time % phrase) + phrase) % phrase;
  const on = ease01(into / 0.12) * ease01((phrase - gap - into) / 0.15);
  const x = time * rate, n = Math.floor(x), f = x - n;
  const shape = (i) => SOUNDS[Math.floor(hash(i, 1) * SOUNDS.length)];
  const a = shape(n), b = shape(n + 1);
  // Into the next sound over the last third of this one.
  const blend = ease01((f - 0.66) / 0.34);
  const size = (i) => 0.7 + 0.6 * hash(i, 2);
  const open = 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, f * 1.15));
  const out = {};
  for (const key of ['jaw', 'wide', 'pucker', 'lipUp', 'lipDown']) {
    const v = (a[key] ?? 0) * size(n) * (1 - blend) + (b[key] ?? 0) * size(n + 1) * blend;
    out[key] = v * (key === 'jaw' ? open : 1) * on * amount;
  }
  const stress = hash(n, 3) > 0.78 ? Math.sin(Math.PI * f) : 0;
  out.brows = 0.35 * stress * on * amount;
  if (loud > 0) {
    out.jaw = Math.min(1, out.jaw * (1 + 1.1 * loud) + 0.25 * loud * on);
    out.lipUp = Math.min(1, out.lipUp + 0.85 * loud * on);
    out.lipDown = Math.min(1, out.lipDown + 0.7 * loud * on);
    out.wide = Math.min(1, out.wide + 0.45 * loud * on);
    out.pucker *= 1 - 0.6 * loud;
    out.brows = out.brows * (1 - loud) - 0.85 * loud;
    out.smile = -0.25 * loud * on;
  }
  return out;
}

/** A sustained shout at `time`: the mouth wide and squared, shaking with it, in breaths. */
export function yelling(time) {
  const cycle = 2.2, into = ((time % cycle) + cycle) % cycle;
  const on = ease01(into / 0.15) * ease01((cycle - 0.45 - into) / 0.2);
  const shake = 0.05 * Math.sin(time * 31) + 0.03 * Math.sin(time * 47 + 1);
  return { jaw: (0.82 + shake) * on, lipUp: on, lipDown: 0.9 * on, wide: 0.55 * on, brows: -0.95, smile: -0.3 * on, pucker: 0 };
}

function poseFace(k, f, time, said = null) {
  if (said) {
    f = { ...f };
    for (const [key, v] of Object.entries(said)) f[key] = key === 'brows' || key === 'smile' ? f[key] + v : Math.max(f[key], v);
  }
  let blink = f.blink;
  let look = f.look;
  if (f.auto && time !== undefined) {
    // A blink every few seconds, a tenth of a second long; the eyes settling on a new spot now and then.
    const cycle = 3.7, ph = (time % cycle) / cycle;
    blink = Math.max(blink, Math.max(0, 1 - Math.abs(ph - 0.5) * 2 * cycle / 0.12));
    const step = Math.floor(time / 1.9);
    const r = (n) => Math.sin(step * 12.9898 + n * 78.233) * 43758.5453 % 1;
    look = [look[0] + r(1) * 0.12, look[1] + r(2) * 0.05];
  }
  // Scowling, the eyes open wider; the lids follow.
  const glare = Math.max(0, -f.brows) * Math.max(0, f.jaw - 0.3);
  for (const S of ['L', 'R']) {
    const b = f[`blink${S}`] ?? blink;
    // At rest the upper lids are lifted a little off the iris: awake, not drowsy.
    k.turn(`lidUp${S}`, 0.62 * b - (0.1 + 0.08 * f.brows + 0.12 * glare) * (1 - b), 0, 0);
    k.turn(`lidLow${S}`, -0.18 * b - 0.04 * Math.max(0, f.smile), 0, 0);
    k.turn(`eye${S}`, -look[1], look[0], 0);
    const m = S === 'L' ? 1 : -1;
    k.move(`brow${S}`, 0, 0.004 * f.brows, 0.001 * Math.max(0, f.brows));
    // Frowning, they knit: drawn in and down, the inner ends lowest.
    if (f.brows < 0) { k.move(`brow${S}`, m * 0.0035 * f.brows, 0.0025 * f.brows, 0); k.turn(`brow${S}`, 0, 0, -m * 0.45 * f.brows); }
    k.move(`lipCorner${S}`, m * (0.0035 * f.smile + 0.0055 * f.wide - 0.0045 * f.pucker), 0.004 * f.smile - 0.004 * f.wide * f.lipDown, -0.002 * Math.abs(f.smile) + 0.0025 * f.pucker - 0.0015 * f.wide);
  }
  k.move('lipUpper', 0, 0.0065 * f.lipUp, 0.0018 * f.lipUp + 0.0035 * f.pucker);
  k.turn('lipUpper', -0.18 * f.lipUp, 0, 0);
  k.move('lipLower', 0, -0.0045 * f.lipDown, 0.0012 * f.lipDown + 0.0035 * f.pucker);
  k.turn('lipLower', 0.18 * f.lipDown, 0, 0);
  k.turn('jaw', 0.36 * f.jaw, 0, 0);
  k.move('tongue', 0, 0, 0.03 * f.tongue);
}

export function createHuman(GFX, options = {}) {
  const { detail = 1, outfit = DEFAULT_OUTFIT, look: lookIn = {} } = options;
  const look = { ...DEFAULT_LOOK, ...lookIn };
  const group = new GFX.Group();
  group.name = 'human';
  const { data: base } = bodyData(detail);
  let tex = humanTextures(GFX, { skin: look.skin, iris: look.iris, size: levelFor(detail) ? 2048 : 1024 });
  let mats = makeMaterials(GFX, look, tex);
  const skeleton = new Skeleton(bones());
  const body = skinnedMesh(GFX, base, BODY_MATERIALS.map((n) => mats[n]), 'human body');
  group.add(body.mesh);

  // What he has on, by name: { garment, mesh, layer }.
  const worn = new Map();
  const custom = new Map();
  const coverage = new WeakMap();

  /** Which of `data`'s vertices `garment` covers, worked out once. */
  function covered(data, garment) {
    let byGarment = coverage.get(data);
    if (!byGarment) coverage.set(data, (byGarment = new Map()));
    if (!byGarment.has(garment)) byGarment.set(garment, Uint8Array.from(data.zones, (z) => (garment.covers(z) ? 1 : 0)));
    return byGarment.get(garment);
  }

  /** Rebuilds each mesh's triangles: those every one of whose corners is covered by something worn over it are left out. */
  function refit() {
    const meshes = [{ m: body, layer: 0 }, ...[...worn.values()].map((w) => ({ m: w.mesh, layer: w.garment.layer }))];
    for (const { m, layer } of meshes) {
      const over = [...worn.values()].filter((w) => w.garment.layer > layer).map((w) => covered(m.data, w.garment));
      const out = [];
      const groups = [];
      m.data.triangles.forEach((tris, materialIndex) => {
        const start = out.length;
        for (let t = 0; t < tris.length; t += 3) {
          const a = tris[t], b = tris[t + 1], c = tris[t + 2];
          if (over.some((cv) => cv[a] && cv[b] && cv[c])) continue;
          out.push(a, b, c);
        }
        if (out.length > start) groups.push({ start, count: out.length - start, materialIndex });
      });
      m.geometry.setIndex(new GFX.BufferAttribute(Uint32Array.from(out), 1));
      m.geometry.clearGroups?.();
      if (!m.geometry.clearGroups) m.geometry.groups = [];
      for (const g of groups) m.geometry.addGroup(g.start, g.count, g.materialIndex);
    }
  }

  function wear(nameOrGarment, garment = null) {
    const name = typeof nameOrGarment === 'string' ? nameOrGarment : nameOrGarment.name;
    const g = garment ?? (typeof nameOrGarment === 'object' ? nameOrGarment : GARMENTS[name] ?? custom.get(name));
    if (!g) throw new Error(`human: no garment called ${name}; choose ${Object.keys(GARMENTS).join(', ')} or pass one of your own`);
    if (worn.has(name)) return api;
    if (g !== GARMENTS[name]) custom.set(name, g);
    const data = garmentData(name, g, detail);
    const materials = g.materials.map((n) => mats[n] ?? g.materialFor?.(GFX, n) ?? mats.shirt);
    const m = skinnedMesh(GFX, data, materials, `human ${name}`);
    group.add(m.mesh);
    worn.set(name, { garment: g, mesh: m });
    refit();
    return api;
  }

  function remove(name) {
    const w = worn.get(name);
    if (!w) return api;
    group.remove(w.mesh.mesh);
    w.mesh.geometry.dispose?.();
    worn.delete(name);
    refit();
    return api;
  }

  let face = { ...FACE_DEFAULT };
  let style = { ...(options.style ?? {}) };
  const hands = { L: { shape: 'relaxed', amount: 1 }, R: { shape: 'relaxed', amount: 1 } };
  const held = { L: null, R: null };
  let last = null;
  const M4 = new GFX.Matrix4();

  /** Puts a held thing where its hand is now. */
  function placeHeld() {
    for (const S of ['L', 'R']) {
      const h = held[S];
      if (!h) continue;
      const o = skeleton.index.get(`hand${S}`) * 12, B = skeleton.matrices;
      M4.set(B[o], B[o + 1], B[o + 2], B[o + 3], B[o + 4], B[o + 5], B[o + 6], B[o + 7], B[o + 8], B[o + 9], B[o + 10], B[o + 11], 0, 0, 0, 1);
      h.object.matrix.multiplyMatrices(M4, h.rest);
      h.object.matrixWorldNeedsUpdate = true;
    }
  }

  /** How much the left hand takes the right's weapon too, in `state`: for the swings made with both hands. */
  function twoHanded(state) {
    if (state.clip !== 'attack' || !TWO_HANDED.has(style.attack)) return 0;
    const t = state.t ?? 0;
    return Math.min(1, Math.max(0, (t - 0.04) / 0.12)) * Math.min(1, Math.max(0, (0.88 - t) / 0.12));
  }

  /**
   * Turns the left arm, forearm and hand (on from the clip's pose, `amount`
   * of the way) so the left hand closes on the right hand's weapon below
   * it, along the grip, its knuckles the same way as the right's.
   */
  function bothHands(amount) {
    const h = held.R;
    skeleton.compute();
    const o = skeleton.index.get('handR') * 12, B = skeleton.matrices;
    M4.set(B[o], B[o + 1], B[o + 2], B[o + 3], B[o + 4], B[o + 5], B[o + 6], B[o + 7], B[o + 8], B[o + 9], B[o + 10], B[o + 11], 0, 0, 0, 1);
    const world = new GFX.Matrix4().multiplyMatrices(M4, h.rest);
    const target = new GFX.Vector3(0, h.second, 0).applyMatrix4(world);
    const axis = new GFX.Vector3(0, 1, 0).transformDirection(world);
    // The right hand's back (rest −x for the right hand): the left's (rest +x) goes the same way.
    const back = new GFX.Vector3(B[o] * -1, B[o + 4] * -1, B[o + 8] * -1).normalize();
    const grip = mirror(GRIP_AT, 1), along = [0, GRIP_TILT, 1];
    const bonesL = ['armL', 'foreL', 'handL'];
    const start = bonesL.map((b) => skeleton.bone(b).rot.slice());
    const dirOf = (name, d) => {
      const q = skeleton.index.get(name) * 12, M = skeleton.matrices;
      return new GFX.Vector3(M[q] * d[0] + M[q + 1] * d[1] + M[q + 2] * d[2], M[q + 4] * d[0] + M[q + 5] * d[1] + M[q + 6] * d[2], M[q + 8] * d[0] + M[q + 9] * d[1] + M[q + 10] * d[2]).normalize();
    };
    const cost = () => {
      skeleton.compute();
      const p = skeleton.point('handL', grip);
      const dp = (p[0] - target.x) ** 2 + (p[1] - target.y) ** 2 + (p[2] - target.z) ** 2;
      const da = 1 - dirOf('handL', along).dot(axis), db = 1 - dirOf('handL', [1, 0, 0]).dot(back);
      return dp + 0.004 * da + 0.0015 * db;
    };
    let best = cost(), step = 0.25;
    for (let it = 0; it < 40 && step > 0.004; it++) {
      let moved = false;
      for (const b of bonesL) {
        const r = skeleton.bone(b).rot;
        for (let a = 0; a < 3; a++) {
          for (const d of [step, -step]) {
            r[a] += d;
            const c = cost();
            if (c < best) { best = c; moved = true; break; }
            r[a] -= d;
          }
        }
      }
      if (!moved) step *= 0.5;
    }
    // Only `amount` of the way from the clip's pose.
    bonesL.forEach((b, i) => {
      const r = skeleton.bone(b).rot;
      for (let a = 0; a < 3; a++) r[a] = start[i][a] + (r[a] - start[i][a]) * amount;
    });
  }

  function pose(state = {}) {
    last = state;
    skeleton.reset();
    const armed = held.R ? 'R' : null;
    moveHuman(skeleton, state, { ...style, armed, heavy: style.heavy ?? 0 });
    shrug(skeleton);
    const both = held.R && !held.L ? twoHanded(state) : 0;
    if (both) bothHands(both);
    for (const S of ['L', 'R']) {
      const want = hands[S].shape;
      const shape = held[S] || (S === 'L' && both > 0.5) ? HAND_POSES.grip : state.clip === 'yell' ? HAND_POSES.fist : typeof want === 'object' ? want : HAND_POSES[want] ?? HAND_POSES.relaxed;
      poseHand(skeleton, S, shape, held[S] ? 1 : hands[S].amount);
    }
    // Speech, when he is talking (or shouting) and his face has not been told otherwise.
    const said = state.clip === 'yell' ? yelling(state.time ?? 0)
      : state.clip === 'talk' || state.speaking ? speech(state.time ?? 0, { amount: state.talk ?? 1, loud: state.yell ? 1 : state.loud ?? 0 })
      : null;
    poseFace(skeleton, face, state.time, said);
    skeleton.compute();
    skinDual(body.data, skeleton, body.position.array, body.normal.array);
    body.position.needsUpdate = true;
    body.normal.needsUpdate = true;
    for (const { mesh: m } of worn.values()) {
      skinDual(m.data, skeleton, m.position.array, m.normal.array);
      m.position.needsUpdate = true;
      m.normal.needsUpdate = true;
    }
    placeHeld();
    return api;
  }

  /**
   * Puts `thing` (a weapon from madness-engine/weapons, or any object) in
   * a hand ('R' by default). A weapon is taken by its grip, just under the
   * guard; anything else at `grip` along its own y. Its own +y points the
   * way the thumb does out of the fist.
   */
  function hold(thing, { hand = 'R', grip = null } = {}) {
    const S = hand === 'L' || hand === 'left' ? 'L' : 'R';
    release(S);
    const object = thing.group ?? thing;
    const bounds = thing.gripBounds;
    const y = grip ?? (bounds ? Math.max((bounds.bottom + bounds.top) / 2, bounds.top - 0.05) : 0);
    const m = S === 'L' ? 1 : -1;
    // The grip's middle, at rest: across the roots of the fingers, in front of the palm, where they close round it; its axis runs forward along them.
    const wrist = mirror(JOINTS.wrist, m), elbow = mirror(JOINTS.elbow, m);
    const down = new GFX.Vector3(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]).normalize();
    const centre = new GFX.Vector3(...mirror(GRIP_AT, m));
    // The object's +y along the grip; its +x (a blade's width) in the plane the wrist bends in, edge leading.
    const along = new GFX.Vector3(0, GRIP_TILT, 1).normalize();
    const side = new GFX.Vector3().crossVectors(along, down).normalize();
    const width = new GFX.Vector3().crossVectors(side, along).normalize();
    const rest = new GFX.Matrix4().makeBasis(width, along, side.negate());
    rest.setPosition(centre);
    rest.multiply(new GFX.Matrix4().makeTranslation(0, -y, 0));
    object.matrixAutoUpdate = false;
    group.add(object);
    // Where a second hand takes it, below the first (toward the pommel), as far down the grip as there is.
    const second = bounds ? Math.max(bounds.bottom + 0.03, y - 0.085) : y - 0.085;
    held[S] = { thing, object, rest, second };
    if (last) pose(last);
    return api;
  }

  function release(hand = 'R') {
    const S = hand === 'L' || hand === 'left' ? 'L' : 'R';
    const h = held[S];
    if (!h) return null;
    group.remove(h.object);
    h.object.matrixAutoUpdate = true;
    held[S] = null;
    return h.thing;
  }

  function setLook(change) {
    Object.assign(look, change);
    if (change.skin || change.iris) {
      tex = humanTextures(GFX, { skin: look.skin, iris: look.iris, size: levelFor(detail) ? 2048 : 1024 });
      const next = makeMaterials(GFX, look, tex);
      for (const n of ['skin', 'eye']) Object.assign(mats[n], { map: next[n].map, bumpMap: next[n].bumpMap }), mats[n].color.copy(next[n].color), mats[n].needsUpdate = true;
    }
    for (const n of ['shirt', 'shoe', 'sole', 'briefs']) if (change[n]) mats[n].color.set(change[n]);
    if (change.denim) mats.denim.color.set(change.denim);
    return api;
  }

  const api = {
    group,
    body: body.mesh,
    skeleton,
    materials: mats,
    clips: CLIPS,
    dimensions: HUMAN_DIMENSIONS,
    get outfit() { return [...worn.keys()]; },
    garment: (name) => worn.get(name)?.mesh.mesh ?? null,
    wear,
    remove,
    /** Puts on exactly these (by name), taking off the rest. */
    dress(names) {
      for (const n of [...worn.keys()]) if (!names.includes(n)) remove(n);
      for (const n of names) wear(n);
      return api;
    },
    pose,
    /** How he moves: { attack: 'slash' | 'chop' | 'thrust' | 'smite' | 'punch' | 'shove', heavy: 0..1, after(skeleton, state) }. */
    setStyle(next) { style = next; return api; },
    face(change) { face = { ...face, ...change }; if (last) pose(last); return api; },
    get faceState() { return { ...face }; },
    /** Shapes a hand ('L', 'R' or 'both') as one of `HAND_POSES` (or a shape of your own), `amount` of the way. */
    hands(shape, { hand = 'both', amount = 1 } = {}) {
      for (const S of hand === 'both' ? ['L', 'R'] : [hand === 'left' ? 'L' : hand === 'right' ? 'R' : hand]) hands[S] = { shape, amount };
      if (last) pose(last);
      return api;
    },
    hold,
    release,
    held: (hand = 'R') => held[hand === 'L' || hand === 'left' ? 'L' : 'R']?.thing ?? null,
    setLook,
    get look() { return { ...look }; },
    setShirtColor: (c) => setLook({ shirt: c }),
    setJeansColor: (c) => setLook({ denim: c }),
    setShoeColor: (c) => setLook({ shoe: c }),
    setSkin: (c) => setLook({ skin: c }),
    setEyeColor: (c) => setLook({ iris: c }),
    /** Where bone `name` takes the rest-pose point `p` now (after `pose`). */
    point: (name, p) => skeleton.point(name, p),
  };
  for (const name of outfit) wear(name);
  pose({ clip: 'idle', t: 0, time: 0 });
  return api;
}

export { sideOf };
