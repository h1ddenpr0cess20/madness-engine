import { Skeleton, skinDual } from '../models/rig.js';
import { assemble, cross, len, Part, sub } from './human/kit.js';
import { bones, figureOf, FIGURES, FINGER_NAMES, HEIGHT, mirror, sideOf } from './human/skeleton.js';
import { fitData, fitPoint, hang, wrap } from './human/fit.js';
import { buildEyes, buildMouth, withLipCorners } from './human/head.js';
import { bodyLevel } from './human/basemesh.js';
import { zoneOf } from './human/body.js';
import { BONES as BAKED_BONES } from './human/data/base.js';
import { DEFAULT_OUTFIT, GARMENTS, GARMENTS_FEMALE, garmentsFor } from './human/clothes.js';
import { humanTextures } from './human/textures.js';
import { CLIPS, moveHuman } from './human/motion.js';
import { BUILDS, checkFeatures, CUSTOMIZATION, customizationFor, DEFAULT_FEATURES } from './human/features.js';
import { BEARDS, BROWS, buildBeard, buildBrows, buildHair, hairTexture, HAIRSTYLES } from './human/hair.js';
import { armDepth, clearArms, measure } from './human/clearance.js';
import { apply as applyAt, bookPlace, boneAt, cross as crossV, handFrame, norm as normV, reach, sub as subV, turn as turnBy } from './human/carry.js';
import { carried, levelOffsets, massOf, placeEyes, SHAPE_KEYS, shapeFor, thickenBrows } from './human/shape.js';
import { buildGlasses, SUNGLASSES } from './human/glasses.js';

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

export { CLIPS, GARMENTS, GARMENTS_FEMALE, garmentsFor, DEFAULT_OUTFIT, HEIGHT, HAIRSTYLES, BEARDS, BROWS, SUNGLASSES, CUSTOMIZATION, customizationFor, DEFAULT_FEATURES, FIGURES, BUILDS };
export const HUMAN_DIMENSIONS = Object.freeze({ height: HEIGHT, headHeight: 0.22, shoulderWidth: 0.46, inseam: 0.8, armLength: 0.62, handLength: 0.19, footLength: 0.27, unit: 'm' });
/** Each figure's measures (metres), as HUMAN_DIMENSIONS gives the man's. */
export const DIMENSIONS = Object.freeze({
  male: HUMAN_DIMENSIONS,
  female: Object.freeze({ height: FIGURES.female.height, headHeight: 0.21, shoulderWidth: 0.37, inseam: 0.76, armLength: 0.56, handLength: 0.175, footLength: 0.245, unit: 'm' }),
});
/** The woman's outfit, unless told otherwise: the man's, with a sports bra under the t-shirt. */
export const DEFAULT_OUTFIT_FEMALE = Object.freeze(['bra', ...DEFAULT_OUTFIT]);

/**
 * The vertices of `geometry` it draws (as many as 4000 of them, spread through it): only those its draw
 * range takes in, so a strand drawn only as far as it has been laid (the yarn ball's) is not measured whole.
 */
function* drawnVertices(geometry) {
  const count = geometry.attributes.position.count, index = geometry.index?.array ?? null;
  const { start = 0, count: n = Infinity } = geometry.drawRange ?? {};
  const from = Math.max(0, start), to = Math.min(index ? index.length : count, from + n);
  const step = Math.max(1, Math.floor((to - from) / 4000));
  for (let k = from; k < to; k += step) yield index ? index[k] : k;
}

/** Each figure's weight as baked, worked out when first asked for. */
const baseMass = {};
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
function skinPart(level, sex = 'male') {
  // Where each point is on him says what zone it is in and how the mouth weights it; on her, it is drawn where hers is.
  const { pos: his, uv, faces, uvFaces, weights } = bodyLevel(level);
  const { pos, occ } = bodyLevel(level, sex);
  const H = (i) => [his[i * 3], his[i * 3 + 1], his[i * 3 + 2]];
  const n = new Float32Array(pos.length);
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  for (let f = 0; f < faces.length; f += 4) {
    const [a, b, c, d] = [faces[f], faces[f + 1], faces[f + 2], faces[f + 3]];
    const q = cross(sub(P(c), P(a)), sub(P(d), P(b)));
    for (const v of [a, b, c, d]) { n[v * 3] += q[0]; n[v * 3 + 1] += q[1]; n[v * 3 + 2] += q[2]; }
  }
  const part = new Part('body', 'skin');
  const ids = new Map();
  // Which of the level's vertices each of the part's is (a vertex is split where its UVs are).
  const src = [];
  const corner = (v, t) => {
    const key = v * 4194304 + t;
    let id = ids.get(key);
    if (id === undefined) {
      const p = P(v), h = H(v);
      const named = {};
      for (const [b, w] of Object.entries(weights[v])) named[BAKED_BONES[b]] = (named[BAKED_BONES[b]] ?? 0) + w;
      const l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1;
      const ao = occ[v];
      id = part.vertex(p, [uv[t * 2], uv[t * 2 + 1]], withLipCorners(named, h), 0.3 + 0.7 * Math.pow(ao, 0.75), [n[v * 3] / l, n[v * 3 + 1] / l, n[v * 3 + 2] / l], zoneOf(weights[v], h));
      ids.set(key, id);
      src.push(v);
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
  part.src = Uint32Array.from(src);
  return part;
}

/** The skin's normals at `level` (of the figure `sex`) with its vertices at `pos`, as skinPart works them out: one a vertex of the level. */
function levelNormals(level, pos, sex) {
  const { faces } = bodyLevel(level, sex);
  const n = new Float32Array(pos.length);
  for (let f = 0; f < faces.length; f += 4) {
    const a = faces[f] * 3, b = faces[f + 1] * 3, c = faces[f + 2] * 3, d = faces[f + 3] * 3;
    const ux = pos[c] - pos[a], uy = pos[c + 1] - pos[a + 1], uz = pos[c + 2] - pos[a + 2];
    const vx = pos[d] - pos[b], vy = pos[d + 1] - pos[b + 1], vz = pos[d + 2] - pos[b + 2];
    const qx = uy * vz - uz * vy, qy = uz * vx - ux * vz, qz = ux * vy - uy * vx;
    for (const o of [a, b, c, d]) { n[o] += qx; n[o + 1] += qy; n[o + 2] += qz; }
  }
  return n;
}

/**
 * The base body's mesh data at `detail` for the figure `sex`, made once and
 * shared. Her skin is her own; her eyes, teeth and tongue are his, carried
 * onto her (fit.js).
 */
function bodyData(detail, sex = 'male') {
  const level = levelFor(detail);
  const key = `body:${sex}@${level}`;
  if (!builds.has(key)) {
    const part = skinPart(level, sex), eyes = buildEyes(detail);
    const skin = assemble([part], NAMES, BODY_MATERIALS);
    const rest = fitData(assemble([eyes, ...buildMouth(detail)], NAMES, BODY_MATERIALS), sex);
    const data = joinData(skin, rest, BODY_MATERIALS.length);
    // Where each of its parts is, for reshaping: the skin (and which vertex of the level each of its
    // vertices is), the eyes, and the mouth's teeth, gums and tongue.
    const e = skin.count + eyes.count;
    data.skin = { src: part.src, level, eyes: [skin.count, e], mouth: [e, data.count] };
    builds.set(key, { data });
  }
  return builds.get(key);
}

/** Two sets of mesh data (in the same materials) as one: `a`'s vertices first. */
function joinData(a, b, materials) {
  const cat = (x, y) => { const out = new x.constructor(x.length + y.length); out.set(x); out.set(y, x.length); return out; };
  const shift = (t) => Uint32Array.from(t, (i) => i + a.count);
  const triangles = Array.from({ length: materials }, (_, m) => cat(a.triangles[m] ?? new Uint32Array(0), shift(b.triangles[m] ?? [])));
  const index = new Uint32Array(triangles.reduce((s, t) => s + t.length, 0));
  const groups = [];
  let start = 0;
  triangles.forEach((t, materialIndex) => {
    if (!t.length) return;
    index.set(t, start);
    groups.push({ start, count: t.length, materialIndex });
    start += t.length;
  });
  return {
    position: cat(a.position, b.position), normal: cat(a.normal, b.normal), uv: cat(a.uv, b.uv), color: cat(a.color, b.color),
    skinIndex: cat(a.skinIndex, b.skinIndex), skinWeight: cat(a.skinWeight, b.skinWeight),
    index, groups, triangles, zones: a.zones.concat(b.zones), count: a.count + b.count,
  };
}

/** A haircut's or a beard's mesh data at `detail`, made once and shared (made on him, and carried onto her). */
function hairData(kind, name, detail, sex = 'male') {
  const key = `${kind}:${name}@${levelFor(detail)}`;
  const build = { hair: buildHair, beard: buildBeard, brows: buildBrows }[kind];
  if (!builds.has(key)) builds.set(key, assemble([build(name, detail)], NAMES, ['hair']));
  return fitted(key, sex, () => fitData(builds.get(key), sex));
}

/** A pair of sunglasses' mesh data at `detail`, made once and shared. */
function glassesData(name, detail, sex = 'male') {
  const key = `glasses:${name}@${levelFor(detail)}`;
  if (!builds.has(key)) builds.set(key, assemble(buildGlasses(name, detail), NAMES, ['lens', 'frameMetal', 'frameAcetate']));
  return fitted(key, sex, () => fitData(builds.get(key), sex));
}

/**
 * Keeping a tail over the seat (clearTails): once a thigh is turned this far
 * (radians) from standing, the cloth from `below` under the hips to `above`
 * over them (at rest), each kept as far outside the cloth under it (within
 * `reach`) as it is at rest, at least `gap` and at most `most` (only what
 * has come through is pushed, not all that has come nearer), and by no more
 * than `push` (over cloth facing within `facing`, a cosine, the same way); the push spread over
 * `spread` rings of the cloth round it, and eased over as many more.
 */
const TAIL = Object.freeze({ bend: 0.45, below: 0.2, above: 0.2, gap: 0.002, most: 0.005, push: 0.03, facing: 0.7, reach: 0.06, spread: 2 });

/** What was made on him under `key`, as it is on the figure `sex`: made once. */
function fitted(key, sex, make) {
  if (sex === 'male') return builds.get(key);
  const k = `${key}~${sex}`;
  if (!builds.has(k)) builds.set(k, make());
  return builds.get(k);
}

/** The garments worn on the trunk, which hang off a bust: how freely each does (the bra, close, is wrapped over it instead: see wrap). */
// (Her t-shirt and bomber are fitted: under the bust they come back in to her waist, bridging only just below it;
// the bomber never comes in faster than the shirt under it.)
const HANGS = {
  bra: { ball: 0.05, hem: 0.015 },
  tshirt: { down: 0.35, across: 0.35, up: 1.4 },
  jacket: { down: 0.35, across: 0.3, up: 1.2 },
  jacketZipped: { down: 0.35, across: 0.3, up: 1.2 },
};

/**
 * A garment's mesh data at `detail`, made once and shared. One that is
 * fitted over what is under it (`fits`) is made for each set of garments
 * under it: `below` is those, as { names, lift }.
 */
function garmentData(name, garment, detail, below, sex = 'male') {
  const over = garment.fits && below.names.length;
  const key = garment === garmentsFor(sex)[name] ? `${name}:${sex}@${detail}${over ? `/${below.names.join('+')}` : ''}` : null;
  if (key && builds.has(key)) return builds.get(key);
  const parts = garment.build(detail, { under: over ? below.lift : null, sex });
  let data = assemble(parts, NAMES, garment.materials);
  // Made on him, worn by her: carried onto her, and hung from her bust.
  if (sex !== 'male') {
    data = fitData(data, sex, { surface: true });
    const h = garment.hang ?? HANGS[name];
    if (h) data = h.ball ? wrap(data, sex, h) : hang(data, sex, h);
  }
  // How far off the skin it stands, by skin vertex, for what goes over it.
  for (const part of parts) {
    if (!part.lift) continue;
    data.lift ??= new Float32Array(part.lift.length);
    for (let v = 0; v < part.lift.length; v++) data.lift[v] = Math.max(data.lift[v], part.lift[v]);
  }
  if (key) builds.set(key, data);
  return data;
}

/** What a woman starts with, where it differs from a man: long blonde hair, blue eyes, groomed brows, no beard. */
export const FEMALE_FEATURES = Object.freeze({ beard: 'none', hair: 'long', hairColour: '#d6b57c', iris: '#4f7fb8', brows: 'fine', lipColour: '#b0626a' });

const DEFAULT_LOOK = Object.freeze({
  skin: '#b98a70', iris: '#5a4632', hair: '#3b2a1f',
  shirt: '#8f9399', denim: '#ffffff', shoe: '#2c2c30', sole: '#efece6', briefs: '#2a2b30',
  socks: '#e9e7e1', jacket: '#3a2a22', rib: '#232224',
});

/** The hair's sheen: its own colour, a third of the way to white. */
function sheenOf(GFX, colour) {
  const c = new GFX.Color(colour);
  c.r += (1 - c.r) * 0.35; c.g += (1 - c.g) * 0.35; c.b += (1 - c.b) * 0.35;
  return c;
}

/** What the hair's two materials share. */
function hairLook(GFX, look, tex, more) {
  return {
    color: look.hair, map: tex ? hairTexture(GFX) : null, side: GFX.DoubleSide, roughness: 0.6, strands: true,
    specularIntensity: 0.15, sheen: 0.15, sheenColor: sheenOf(GFX, look.hair), sheenRoughness: 0.5, ...more,
  };
}

/** What the jacket's two leathers share. */
function leather(GFX, look, tex, more) {
  return {
    color: look.jacket, bumpMap: tex?.leather.bump ?? null, bumpScale: 0.0012, roughness: 0.58, clearcoat: 0.22, clearcoatRoughness: 0.5,
    sheen: 0.25, sheenColor: new GFX.Color('#8a7a70'), sheenRoughness: 0.5, side: GFX.DoubleSide, ...more,
  };
}

/** The materials, by name, for a look. Textures where there is a document to paint them on. */
function makeMaterials(GFX, look, tex) {
  const M = (name, o) => new GFX.MeshPhysicalMaterial({ name: `human ${name}`, vertexColors: true, ...o });
  const mats = {
    skin: M('skin', {
      color: tex ? '#ffffff' : look.skin, map: tex?.skin.map ?? null, bumpMap: tex?.skin.bump ?? null, bumpScale: 0.00016, roughness: 0.52,
      // Its detail: creases and folds, where it is glossier or rougher, where its pores are open.
      detailMap: tex?.skin.detail ?? null, detailScale: 0.0011,
      // Light carried under the skin and back out: red furthest, so the edge of every shadow warms.
      subsurface: 1, subsurfaceColor: new GFX.Color().setRGB(0.42, 0.16, 0.09),
      // The oil on it: a second, thin shine over the skin's own broad one; and the soft light off its down at the edges.
      sheen: 0.22, sheenColor: new GFX.Color('#e8a090'), sheenRoughness: 0.4, clearcoat: 0.1, clearcoatRoughness: 0.3, specularIntensity: 0.8,
    }),
    // The eye: wet and mirror-smooth over a soft white that light sinks into.
    eye: M('eyes', { color: '#ffffff', map: tex?.eye ?? null, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.02, subsurface: 0.7, subsurfaceColor: new GFX.Color().setRGB(0.4, 0.3, 0.26) }),
    // Enamel: glossy, wet, a little light let into it. The gums and tongue wet too, and soft with blood.
    teeth: M('teeth', { color: '#efe7d6', roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1, sheen: 0.25, sheenColor: new GFX.Color('#fff8ea'), subsurface: 0.6, subsurfaceColor: new GFX.Color().setRGB(0.3, 0.26, 0.2) }),
    gums: M('gums', { color: '#cf7a78', roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.14, subsurface: 0.8, subsurfaceColor: new GFX.Color().setRGB(0.45, 0.15, 0.1) }),
    tongue: M('tongue', { color: '#a35a5a', roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.25, subsurface: 0.8, subsurfaceColor: new GFX.Color().setRGB(0.45, 0.15, 0.1) }),
    // Hair: the strand texture's gaps cut out; a soft sheen along it, as light runs down a strand.
    // Hair, in two passes: its strands solid where the texture is (writing depth), then their soft edges
    // blended over. Its highlights run across the strands (`strands`), the way hair's do.
    hair: M('hair', hairLook(GFX, look, tex, { alphaTest: 0.5 })),
    hairEdge: M('hair edges', hairLook(GFX, look, tex, { alphaTest: 0.04, transparent: true, depthWrite: false })),
    lash: M('lashes', { color: '#1a1412', roughness: 0.7, side: GFX.DoubleSide }),
    briefs: M('briefs', { color: look.briefs, roughness: 0.8, sheen: 0.5, sheenColor: new GFX.Color('#9aa0aa'), sheenRoughness: 0.5 }),
    shirt: M('t-shirt', { color: look.shirt, map: tex?.shirt.map ?? null, bumpMap: tex?.shirt.bump ?? null, bumpScale: 0.0003, roughness: 0.9, sheen: 0.7, sheenColor: new GFX.Color('#ffffff'), sheenRoughness: 0.55, side: GFX.DoubleSide }),
    denim: M('denim', { color: tex ? look.denim : '#2c4a78', map: tex?.denim.map ?? null, bumpMap: tex?.denim.bump ?? null, bumpScale: 0.0004, roughness: 0.86, sheen: 0.35, sheenColor: new GFX.Color('#9db4d8'), sheenRoughness: 0.6, side: GFX.DoubleSide }),
    shoe: M('sneakers', { color: look.shoe, map: tex?.shoe ?? null, roughness: 0.62, clearcoat: 0.04 }),
    sole: M('soles', { color: look.sole, map: tex?.sole ?? null, roughness: 0.65 }),
    sock: M('socks', { color: look.socks, map: tex?.sock.map ?? null, bumpMap: tex?.sock.bump ?? null, bumpScale: 0.0004, roughness: 0.95, sheen: 0.8, sheenColor: new GFX.Color('#ffffff'), sheenRoughness: 0.6, side: GFX.DoubleSide }),
    // Leather: dark, a soft gloss worn into it, its grain in the bump; the trims the same hide without the panels' seams.
    leather: M('leather', leather(GFX, look, tex, { map: tex?.leather.map ?? null })),
    leatherTrim: M('leather trims', leather(GFX, look, tex, {})),
    // The knit rib of the collar, cuffs and waistband: matte, a soft sheen across its ribs.
    rib: M('rib knit', { color: look.rib, map: tex?.rib.map ?? null, roughness: 0.92, sheen: 0.6, sheenColor: new GFX.Color('#8a8a90'), sheenRoughness: 0.6, side: GFX.DoubleSide }),
    ribTrim: M('rib knit collar', { color: look.rib, map: tex?.rib.tile ?? null, roughness: 0.92, sheen: 0.6, sheenColor: new GFX.Color('#8a8a90'), sheenRoughness: 0.6, side: GFX.DoubleSide }),
    // Sunglasses: the lenses dark and mirror-smooth, seen through dimly; a gold wire frame or a glossy black one.
    lens: M('lenses', { color: '#1b2026', roughness: 0.03, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, transparent: true, opacity: 0.86, depthWrite: false, side: GFX.DoubleSide }),
    frameMetal: M('frame', { color: '#cfae63', metalness: 1, roughness: 0.22 }),
    frameAcetate: M('frame', { color: '#121214', roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
    metal: M('hardware', { color: '#c4c6ca', metalness: 1, roughness: 0.26, clearcoat: 0.2 }),
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
  loose: { curl: [0.55, 0.75, 0.45], thumb: 0.45, spread: 0 },
  fist: { curl: [1.0, 1.0, 0.4], thumb: 1, spread: 0 },
  point: { curl: [1.0, 1.0, 0.4], thumb: 0.9, spread: 0, straight: ['index'] },
  // A ball on the palm: the fingers round under it.
  cup: { curl: [0.38, 0.45, 0.3], thumb: 0.35, spread: 0.3 },
  // A coin between the thumb and forefinger: the others tucked out of the way.
  pinch: { curl: [0.85, 0.95, 0.5], thumb: 0.62, spread: 0, each: { index: [0.42, 0.55, 0.3] } },
  // A book's edge: the fingers under its board, the thumb over the page.
  book: { curl: [0, 0.02, 0.02], thumb: 0, spread: 0.12 },
  // A bowling ball: the middle and ring fingers and the thumb a little way into its holes, the hand spread under it.
  bowl: { curl: [0.2, 0.28, 0.18], thumb: 0.25, spread: 0.45 },
  // A shut book by its edge: the fingers over one board, the thumb on the other.
  tome: { curl: [0.42, 0.35, 0.2], thumb: 0.55, spread: 0.05 },
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

// For each finger of a figure's hand: its curl axis, and the axis that spreads it away from the middle finger.
const handAxes = (FINGERS) => Object.fromEntries(FINGER_NAMES.map((name) => {
  const f = FINGERS[name];
  const dir = sub(f.joints[3], f.joints[0]);
  const away = sub(f.joints[0], FINGERS.middle.joints[0]);
  const spread = name === 'middle' || name === 'thumb' ? [0, 0, 1] : cross(dir, away);
  const l = len(spread) || 1;
  return [name, { curl: f.curl, spread: spread.map((v) => v / l) }];
}));
const HAND_AXES = Object.fromEntries(Object.entries(FIGURES).map(([sex, f]) => [sex, handAxes(f.fingers)]));
const handAxesMale = HAND_AXES.male;

// The swings made with both hands on the grip, whatever the weapon; and the swings a two-handed weapon
// (its `handling.hands`, see weapons/categories) is always swung with both.
const TWO_HANDED = new Set(['chop']);
const WEAPON_SWINGS = new Set(['slash', 'chop', 'thrust', 'smite']), UNARMED = new Set(['punch', 'shove']);

// Where a held grip's middle sits in the (left) hand at rest, and how its axis tilts: his, and hers (the same place in her hand).
const GRIP_AT = [0.283, 0.79, 0.04], GRIP_TILT = -0.05;
const grips = new Map();
const gripOf = (sex) => {
  if (!grips.has(sex)) grips.set(sex, sex === 'male' ? GRIP_AT : fitPoint(GRIP_AT, sex, 'handL'));
  return grips.get(sex);
};

// The axis the thumb's root turns about to come across the palm (left hand).
const THUMB_IN = [-0.225, 0.03, 0.974];

/**
 * The shoulders follow the arms, as the collarbone and shoulder blade do: as
 * an arm goes up past level the collarbone lifts, and as it reaches forward
 * it comes forward, so the shoulder keeps its shape instead of folding. The
 * arm is turned back by as much, so the hand stays where it was put.
 */
function shrug(k, JOINTS) {
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
function poseHand(k, S, shape, amount = 1, HAND_AXES = handAxesMale) {
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
    (shape.each?.[name] ?? shape.curl).forEach((c, i) => {
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
    // Raised, they lift well up, the inner ends a little more (surprise, worry).
    if (f.brows > 0) { k.move(`brow${S}`, 0, 0.0045 * f.brows, 0.0008 * f.brows); k.turn(`brow${S}`, 0, 0, m * 0.18 * f.brows); }
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
  // The character creator's choices (features.js): those the human shows yet set his look and
  // grooming, the rest are kept for when they are built. `look`, `hair`, `beard` and `brows`, given
  // as well, win. `sex` (or the feature of that name) picks the figure: 'male' or 'female'.
  const sex = options.sex ?? options.features?.sex ?? 'male';
  const figure = figureOf(sex);
  const { detail = 1, outfit = sex === 'female' ? DEFAULT_OUTFIT_FEMALE : DEFAULT_OUTFIT, look: lookIn = {} } = options;
  const features = { ...DEFAULT_FEATURES, ...(sex === 'female' ? FEMALE_FEATURES : {}), ...checkFeatures({ ...options.features }, sex), sex };
  // (A beard is his: she has none.)
  if (sex !== 'male' && options.beard) throw new Error('human: a beard is for the male figure only');
  const none = (v) => (v === 'none' ? null : v);
  const look = { ...DEFAULT_LOOK, skin: features.skin, iris: features.iris, hair: features.hairColour, ...lookIn };
  let grooming = {
    hair: options.hair === undefined ? none(features.hair) : options.hair,
    beard: options.beard === undefined ? none(features.beard) : options.beard,
    brows: options.brows === undefined ? none(features.brows) : options.brows,
  };
  const group = new GFX.Group();
  group.name = 'human';
  const { data: base } = bodyData(detail, sex);
  const paintFor = () => ({ skin: look.skin, iris: look.iris, hair: look.hair, style: grooming.hair, beard: grooming.beard, sex, size: levelFor(detail) ? 2048 : 1024 });
  let tex = humanTextures(GFX, paintFor());
  let mats = makeMaterials(GFX, look, tex);
  const skeleton = new Skeleton(bones(sex));
  // His wardrobe, or hers (the women's cut of the t-shirt, jeans and bomber).
  const wardrobe = garmentsFor(sex);
  const JOINTS = figure.joints;
  const body = skinnedMesh(GFX, base, BODY_MATERIALS.map((n) => mats[n]), 'human body');
  group.add(body.mesh);

  // His shape, from the creator's choices (shape.js): null while he is as baked. Every mesh keeps the
  // data it was made from (`source`, shared with everyone made the same) and is moved on from that.
  let shape = shapeFor(features);
  const restPivots = skeleton.pivots.map((p) => p.slice());

  /** The skin, eyes and mouth as `shape` has them. */
  function bodyRest(src) {
    const { skin } = src;
    const level = levelOffsets(shape.delta, skin.level);
    const position = src.position.slice(), normal = src.normal.slice();
    const at = bodyLevel(skin.level, sex).pos.slice();
    for (let i = 0; i < at.length; i++) at[i] += level[i];
    const n = levelNormals(skin.level, at, sex);
    for (let i = 0; i < skin.src.length; i++) {
      const v = skin.src[i] * 3, o = i * 3;
      position[o] += level[v]; position[o + 1] += level[v + 1]; position[o + 2] += level[v + 2];
      const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1;
      normal[o] = n[v] / l; normal[o + 1] = n[v + 1] / l; normal[o + 2] = n[v + 2] / l;
    }
    placeEyes(position, skin.eyes[0], skin.eyes[1], shape);
    carried(src, shape.delta, { k: 8, from: skin.mouth[0], to: skin.mouth[1], into: position, sex });
    return { position, normal };
  }

  /**
   * Puts mesh `m` (`kind`: 'body', 'hair', 'beard', 'brows', 'glasses' or a garment) in his shape: its
   * rest data moved on from what it was made as, and its buffers set to that until he is posed.
   */
  function fit(m, kind) {
    m.source ??= m.data;
    const src = m.source;
    if (!shape) m.data = src;
    else if (kind === 'body') m.data = { ...src, ...bodyRest(src) };
    else {
      const start = kind === 'brows' ? thickenBrows(src.position, shape.browThickness) : src.position.slice();
      const k = kind === 'glasses' ? 24 : kind === 'hair' ? 6 : 4;
      m.data = { ...src, position: carried(src, shape.delta, { k, into: start, sex, trunk: kind === 'hair' }) };
    }
    m.position.array.set(m.data.position);
    m.normal.array.set(m.data.normal);
    m.position.needsUpdate = m.normal.needsUpdate = true;
    return m;
  }

  /** His joints where his shape has them. */
  function placeJoints() {
    skeleton.pivots = restPivots.map((p, b) => {
      const d = shape?.pivots[skeleton.names[b]];
      return d ? [p[0] + d[0], p[1] + d[1], p[2] + d[2]] : p;
    });
  }
  placeJoints();
  fit(body, 'body');

  // His hair, beard and brows: the hair rides the head bone as a whole; the beard and brows are skinned,
  // so they move with the jaw, the lips and the brows.
  const groomed = { hair: null, beard: null, brows: null };
  function groom(next) {
    for (const kind of ['hair', 'beard', 'brows']) {
      const name = next[kind] ?? null;
      if (groomed[kind]?.name === name) continue;
      if (groomed[kind]) group.remove(groomed[kind].mesh.mesh, groomed[kind].edges);
      groomed[kind] = null;
      if (!name) continue;
      const m = fit(skinnedMesh(GFX, hairData(kind, name, detail, sex), [mats.hair], `human ${kind}`), kind);
      // Its soft edges: the same cards, blended over, drawn after everything solid.
      const edges = new GFX.Mesh(m.geometry, [mats.hairEdge]);
      edges.name = `human ${kind} edges`;
      // The cards cast no shadow of their own: they would cast their whole quads.
      m.mesh.castShadow = edges.castShadow = false;
      edges.receiveShadow = true;
      // Short hair is carried whole by the head; long hair lies on the shoulders and back, and is skinned to them.
      const rigid = kind === 'hair' && !HAIRSTYLES[name]?.skinned;
      if (rigid) m.mesh.matrixAutoUpdate = edges.matrixAutoUpdate = false;
      group.add(m.mesh, edges);
      groomed[kind] = { name, mesh: m, edges, rigid };
    }
    grooming = { hair: groomed.hair?.name ?? null, beard: groomed.beard?.name ?? null, brows: groomed.brows?.name ?? null };
  }
  groom(grooming);

  // His sunglasses, carried by the head as the hair is.
  let glasses = null;
  function wearGlasses(name) {
    if ((glasses?.name ?? null) === (name ?? null)) return;
    if (glasses) group.remove(glasses.mesh.mesh);
    glasses = null;
    if (!name) return;
    const m = fit(skinnedMesh(GFX, glassesData(name, detail, sex), [mats.lens, mats.frameMetal, mats.frameAcetate], 'human sunglasses'), 'glasses');
    m.mesh.matrixAutoUpdate = false;
    m.mesh.receiveShadow = true;
    group.add(m.mesh);
    glasses = { name, mesh: m };
  }
  wearGlasses(options.glasses === undefined ? none(features.glasses) : options.glasses);

  // What he has on, by name: { garment, mesh, layer }.
  const worn = new Map();
  const custom = new Map();
  const coverage = new WeakMap();

  /** Which of `data`'s vertices `garment` covers, worked out once. */
  function covered(data, garment) {
    // By its zones, which a reshaped copy of the data shares.
    let byGarment = coverage.get(data.zones);
    if (!byGarment) coverage.set(data.zones, (byGarment = new Map()));
    if (!byGarment.has(garment)) byGarment.set(garment, Uint8Array.from(data.zones, (z) => (garment.covers(z) ? 1 : 0)));
    return byGarment.get(garment);
  }

  /** Rebuilds each mesh's triangles: those every one of whose corners is covered by something worn over it are left out. */
  function refit() {
    clearance = null;
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

  /** What is worn under layer `layer`: their names, and how far off the skin the outermost of them stands at each skin vertex. */
  function below(layer) {
    const under = [...worn].filter(([, w]) => w.garment.layer < layer && w.mesh.data.lift).sort(([a], [b]) => (a < b ? -1 : 1));
    let lift = null;
    for (const [, w] of under) {
      lift ??= new Float32Array(w.mesh.data.lift.length);
      const l = w.mesh.data.lift;
      for (let v = 0; v < l.length; v++) if (l[v] > lift[v]) lift[v] = l[v];
    }
    return { names: under.map(([n]) => n), lift };
  }

  /** Makes the mesh for garment `g` as it fits over what he has on under it. */
  function make(name, g, data = garmentData(name, g, detail, below(g.layer), sex)) {
    const materials = g.materials.map((n) => mats[n] ?? g.materialFor?.(GFX, n) ?? mats.shirt);
    const m = fit(skinnedMesh(GFX, data, materials, `human ${name}`), name);
    group.add(m.mesh);
    return m;
  }

  /** Takes a garment's mesh off him. */
  function drop(m) {
    group.remove(m.mesh);
    m.geometry.dispose?.();
  }

  /** Remakes each fitted garment over layer `layer`, outward, so each fits what is now under it. */
  function refitOver(layer) {
    const over = [...worn].filter(([, w]) => w.garment.fits && w.garment.layer > layer).sort(([, a], [, b]) => a.garment.layer - b.garment.layer);
    for (const [name, w] of over) {
      const data = garmentData(name, w.garment, detail, below(w.garment.layer), sex);
      if (data === (w.mesh.source ?? w.mesh.data)) continue;
      drop(w.mesh);
      w.mesh = make(name, w.garment, data);
    }
  }

  function wear(nameOrGarment, garment = null) {
    const name = typeof nameOrGarment === 'string' ? nameOrGarment : nameOrGarment.name;
    const g = garment ?? (typeof nameOrGarment === 'object' ? nameOrGarment : wardrobe[name] ?? custom.get(name));
    if (!g) throw new Error(`human: no garment called ${name}; choose ${Object.keys(wardrobe).join(', ')} or pass one of your own`);
    if (worn.has(name)) return api;
    if (g !== wardrobe[name]) custom.set(name, g);
    // One thing in each slot: a jacket worn open takes the place of one worn closed.
    if (g.slot) for (const [other, w] of [...worn]) if (w.garment.slot === g.slot) unwear(other);
    worn.set(name, { garment: g, mesh: make(name, g) });
    refitOver(g.layer);
    refit();
    if (last) pose(last);
    return api;
  }

  function unwear(name) {
    const w = worn.get(name);
    if (!w) return false;
    drop(w.mesh);
    worn.delete(name);
    refitOver(w.garment.layer);
    return true;
  }

  /** Gives him the shape his features now ask for: the skin, his joints, and all he wears and grows over it. */
  function reshape() {
    clearance = null;
    shape = shapeFor(features);
    placeJoints();
    fit(body, 'body');
    for (const kind of ['hair', 'beard', 'brows']) if (groomed[kind]) fit(groomed[kind].mesh, kind);
    if (glasses) fit(glasses.mesh, 'glasses');
    for (const [name, w] of worn) fit(w.mesh, name);
    if (last) pose(last);
  }

  function remove(name) {
    if (!unwear(name)) return api;
    refit();
    if (last) pose(last);
    return api;
  }

  let face = { ...FACE_DEFAULT };
  let style = { ...(options.style ?? {}) };
  const hands = { L: { shape: 'relaxed', amount: 1 }, R: { shape: 'relaxed', amount: 1 } };
  const held = { L: null, R: null };
  let last = null;
  // What his arms must keep out of (clearance.js), measured when first needed after he is shaped or dressed.
  let clearance = null;
  const M4 = new GFX.Matrix4();

  /** Where his shape has moved hand `S` to, at rest: a held grip goes with it. */
  const handShift = (S) => shape?.pivots[`hand${S}`] ?? [0, 0, 0];
  /** A held thing's rest matrix, in the hand where his shape has it. */
  function restOf(h, S) {
    const [x, y, z] = handShift(S);
    return new GFX.Matrix4().makeTranslation(x, y, z).multiply(h.rest);
  }

  /** Puts a held thing where its hand is now. */
  function placeHeld() {
    for (const S of ['L', 'R']) {
      const h = held[S];
      if (!h || h.how !== 'grip') continue;
      const o = skeleton.index.get(`hand${S}`) * 12, B = skeleton.matrices;
      M4.set(B[o], B[o + 1], B[o + 2], B[o + 3], B[o + 4], B[o + 5], B[o + 6], B[o + 7], B[o + 8], B[o + 9], B[o + 10], B[o + 11], 0, 0, 0, 1);
      h.object.matrix.multiplyMatrices(M4, shape ? restOf(h, S) : h.rest);
      h.object.matrixWorldNeedsUpdate = true;
    }
  }

  /**
   * How much the left hand takes the right's weapon too, in `state`: in the swings made with both hands,
   * and in every weapon swing of a weapon made for two.
   */
  function twoHanded(state) {
    if (state.clip !== 'attack') return 0;
    // As the motion does: a swing it does not know is a slash.
    const swing = WEAPON_SWINGS.has(style.attack) || UNARMED.has(style.attack) ? style.attack : 'slash';
    if (!(TWO_HANDED.has(swing) || (WEAPON_SWINGS.has(swing) && held.R?.hands === 'two-handed'))) return 0;
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
    const world = new GFX.Matrix4().multiplyMatrices(M4, shape ? restOf(h, 'R') : h.rest);
    const target = new GFX.Vector3(0, h.second, 0).applyMatrix4(world);
    const axis = new GFX.Vector3(0, 1, 0).transformDirection(world);
    // The right hand's back (rest −x for the right hand): the left's (rest +x) goes the same way.
    const back = new GFX.Vector3(B[o] * -1, B[o + 4] * -1, B[o + 8] * -1).normalize();
    const grip = mirror(gripOf(sex), 1).map((v, a) => v + handShift('L')[a]), along = [0, GRIP_TILT, 1];
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

  /** The pose a crossfade starts from: every bone's turn, move and scale. */
  const fromPose = new Float64Array(skeleton.pose.length * 9);

  /** The clip `state` names, posed; `mix` of the way on from the clip in `state.from`, if it has one. */
  function moveBlended(state, moveStyle) {
    const mix = state.from ? Math.min(1, Math.max(0, state.mix ?? 1)) : 1;
    if (mix < 1) {
      moveHuman(skeleton, state.from, moveStyle);
      skeleton.pose.forEach((p, b) => { fromPose.set(p.rot, b * 9); fromPose.set(p.move, b * 9 + 3); fromPose.set(p.scale, b * 9 + 6); });
      skeleton.reset();
    }
    moveHuman(skeleton, state, moveStyle);
    if (mix >= 1) return;
    skeleton.pose.forEach((p, b) => {
      const o = b * 9;
      for (let a = 0; a < 3; a++) {
        p.rot[a] = fromPose[o + a] + (p.rot[a] - fromPose[o + a]) * mix;
        p.move[a] = fromPose[o + 3 + a] + (p.move[a] - fromPose[o + 3 + a]) * mix;
        p.scale[a] = fromPose[o + 6 + a] + (p.scale[a] - fromPose[o + 6 + a]) * mix;
      }
    });
  }

  /** The vertices of `m` its triangles use (those left showing under what is worn), or null for all of them. */
  function drawn(m) {
    const index = m.geometry.index;
    if (drawnOf.has(index)) return drawnOf.get(index);
    const used = new Uint8Array(m.data.count);
    let n = 0;
    for (const v of index.array) if (!used[v]) { used[v] = 1; n++; }
    let list = null;
    if (n < m.data.count) {
      list = new Uint32Array(n);
      for (let v = 0, j = 0; v < used.length; v++) if (used[v]) list[j++] = v;
    }
    drawnOf.set(index, list);
    return list;
  }
  const drawnOf = new WeakMap();

  /**
   * What is worn over his seat kept outside what is under it. A shirt's or a
   * jacket's tail hangs from his hips (clothes.js: hangFromHips), but as he
   * sits, or lifts a knee high, the seat and the tops of his thighs swell out
   * under it: each tail's cloth there that would be under the cloth beneath
   * it is pushed back out over it, by as little as it takes.
   */
  function clearTails() {
    const bend = Math.max(...['thighL', 'thighR'].map((n) => Math.abs(skeleton.pose[skeleton.index.get(n)].rot[0])));
    if (bend < TAIL.bend) return;
    // (The skin first, where it shows: between a waistband and a hem.)
    const layers = [{ mesh: body, garment: null }, ...[...worn.values()].filter((w) => w.garment.fits).sort((a, b) => a.garment.layer - b.garment.layer)];
    const under = [], cells = new Map();
    for (const w of layers) {
      const m = w.mesh, P = m.position.array, N = m.normal.array, list = tailOf(m);
      if (tails.has(w.garment) && under.length) {
        const outermost = w === layers[layers.length - 1];
        const stand = standOf(m, list, under);
        const L = under.length, best = new Float64Array(L), at = new Int32Array(L);
        const Ps = under.map((u) => u.position.array), Ns = under.map((u) => u.normal.array);
        const D = new Float32Array(list.length * 3);
        let moved = false;
        list.forEach((v, n) => {
          nearestEach(cells, Ps, Ns, P, N, v, best, at);
          // Out over each, from the innermost, to stand off it at least as far as it does at rest.
          let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
          for (let l = 0; l < L; l++) {
            const u = at[l];
            if (u < 0) continue;
            const Q = Ps[l], M = Ns[l];
            const nx = M[u * 3], ny = M[u * 3 + 1], nz = M[u * 3 + 2];
            const h = (x - Q[u * 3]) * nx + (y - Q[u * 3 + 1]) * ny + (z - Q[u * 3 + 2]) * nz;
            const want = stand[n * L + l];
            if (h >= want) continue;
            const push = Math.min(want - h, TAIL.push);
            x += nx * push; y += ny * push; z += nz * push;
            moved = true;
          }
          D[n * 3] = x - P[v * 3]; D[n * 3 + 1] = y - P[v * 3 + 1]; D[n * 3 + 2] = z - P[v * 3 + 2];
        });
        if (moved) {
          // Spread over the cloth round it, so it moves out in one piece (the inside of a turned edge with the outside,
          // a knit band whole), never pulled into points:
          const { start, ring } = ringsOf(m, list);
          // First each takes the most any of its ring is pushed (the outermost, which nothing must come through,
          // from further round), so all of an edge, inside and out, goes out together; then the push is eased over
          // the cloth round it.
          const own = D.slice();
          const grows = outermost ? TAIL.spread : 1;
          for (let pass = 0; pass < grows + TAIL.spread; pass++) {
            const E = D.slice(), grow = pass < grows;
            for (let n = 0; n < list.length; n++) {
              if (start[n + 1] === start[n]) continue;
              if (grow) {
                let most = Math.hypot(E[n * 3], E[n * 3 + 1], E[n * 3 + 2]);
                for (let r = start[n]; r < start[n + 1]; r++) {
                  const o = ring[r] * 3, h = Math.hypot(E[o], E[o + 1], E[o + 2]);
                  if (h > most) { most = h; D[n * 3] = E[o]; D[n * 3 + 1] = E[o + 1]; D[n * 3 + 2] = E[o + 2]; }
                }
              } else {
                let sx = E[n * 3], sy = E[n * 3 + 1], sz = E[n * 3 + 2];
                for (let r = start[n]; r < start[n + 1]; r++) { const o = ring[r] * 3; sx += E[o]; sy += E[o + 1]; sz += E[o + 2]; }
                const k = start[n + 1] - start[n] + 1;
                D[n * 3] = sx / k; D[n * 3 + 1] = sy / k; D[n * 3 + 2] = sz / k;
              }
            }
          }
          // (None ends nearer in than its own push put it.)
          for (let n = 0; n < list.length; n++) {
            if (Math.hypot(own[n * 3], own[n * 3 + 1], own[n * 3 + 2]) > Math.hypot(D[n * 3], D[n * 3 + 1], D[n * 3 + 2])) { D[n * 3] = own[n * 3]; D[n * 3 + 1] = own[n * 3 + 1]; D[n * 3 + 2] = own[n * 3 + 2]; }
          }
          list.forEach((v, n) => { P[v * 3] += D[n * 3]; P[v * 3 + 1] += D[n * 3 + 1]; P[v * 3 + 2] += D[n * 3 + 2]; });
        }
        if (moved) m.position.needsUpdate = true;
      }
      // What it is, as it is now, for those over it.
      under.push(m);
      fileUnder(cells, under.length - 1, P, list);
    }
  }
  const tails = new Set(['tshirt', 'jacket', 'jacketZipped'].map((n) => wardrobe[n]).filter(Boolean));
  const cellOf = (x, y, z) => ((Math.floor(x / TAIL.reach) * 73856093) ^ (Math.floor(y / TAIL.reach) * 19349663) ^ (Math.floor(z / TAIL.reach) * 83492791)) | 0;
  /** Files vertices `list` (at `P`) of the `l`th layer under in `cells`. */
  function fileUnder(cells, l, P, list) {
    for (const v of list) {
      const k = cellOf(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
      let near = cells.get(k);
      if (!near) cells.set(k, (near = []));
      near.push(l, v);
    }
  }
  /**
   * For vertex `v` (at `P`, facing `N`), the nearest vertex of each layer in `cells` within reach facing
   * the same way out (cloth turned across it is at a fold or an edge, not under it): into `at` (−1 none).
   */
  function nearestEach(cells, Ps, Ns, P, N, v, best, at) {
    best.fill(TAIL.reach); at.fill(-1);
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], H = TAIL.reach;
    const cx = Math.floor(x / H), cy = Math.floor(y / H), cz = Math.floor(z / H);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const near = cells.get(((cx + i) * 73856093 ^ (cy + j) * 19349663 ^ (cz + k) * 83492791) | 0);
      if (!near) continue;
      for (let e = 0; e < near.length; e += 2) {
        const l = near[e], u = near[e + 1], Q = Ps[l], M = Ns[l];
        const d = Math.hypot(x - Q[u * 3], y - Q[u * 3 + 1], z - Q[u * 3 + 2]);
        if (d < best[l] && M[u * 3] * N[v * 3] + M[u * 3 + 1] * N[v * 3 + 1] + M[u * 3 + 2] * N[v * 3 + 2] > TAIL.facing) { best[l] = d; at[l] = u; }
      }
    }
  }
  /** The vertices of mesh `m` that it draws about his seat (by where they are at rest), worked out once a cut. */
  function tailOf(m) {
    const index = m.geometry.index;
    const key = tailsOf.get(index);
    if (key?.data === m.data) return key.list;
    const hip = JOINTS.hip, P = m.data.position, Z = m.data.zones, list = [];
    for (const v of drawn(m) ?? Array.from({ length: m.data.count }, (_, i) => i)) {
      const y = P[v * 3 + 1] - hip[1], on = Z?.[v]?.on ?? Z?.[v]?.zone;
      // (Not the arms, hanging by the hips at rest.)
      if (y > -TAIL.below && y < TAIL.above && on !== 'arm' && on !== 'hand') list.push(v);
    }
    tailsOf.set(index, { data: m.data, list });
    return list;
  }
  const tailsOf = new WeakMap();
  /**
   * How far each of tail mesh `m`'s vertices `list` stands off each layer `under` it at rest (as far as
   * it is kept off it as he moves; between TAIL.gap and TAIL.most): worked out once a cut.
   */
  function standOf(m, list, under) {
    const key = standsOf.get(list);
    if (key && key.data === m.data && key.under.length === under.length && key.under.every((u, l) => u.data === under[l].data && tailOf(u) === key.lists[l])) return key.stand;
    const L = under.length, cells = new Map(), stand = new Float32Array(list.length * L);
    under.forEach((u, l) => fileUnder(cells, l, u.data.position, tailOf(u)));
    const Ps = under.map((u) => u.data.position), Ns = under.map((u) => u.data.normal);
    const P = m.data.position, N = m.data.normal, best = new Float64Array(L), at = new Int32Array(L);
    list.forEach((v, n) => {
      nearestEach(cells, Ps, Ns, P, N, v, best, at);
      for (let l = 0; l < L; l++) {
        const u = at[l];
        if (u < 0) { stand[n * L + l] = -Infinity; continue; }
        const h = (P[v * 3] - Ps[l][u * 3]) * Ns[l][u * 3] + (P[v * 3 + 1] - Ps[l][u * 3 + 1]) * Ns[l][u * 3 + 1] + (P[v * 3 + 2] - Ps[l][u * 3 + 2]) * Ns[l][u * 3 + 2];
        stand[n * L + l] = Math.min(Math.max(h, TAIL.gap), TAIL.most);
      }
    });
    standsOf.set(list, { data: m.data, under: under.slice(), lists: under.map((u) => tailOf(u)), stand });
    return stand;
  }
  const standsOf = new WeakMap();
  /** Each of tail vertices `list`'s neighbours among them (by mesh `m`'s triangles, and where a seam splits a vertex), as rings: worked out once a cut. */
  function ringsOf(m, list) {
    const got = ringsFor.get(list);
    if (got && got.data === m.data) return got;
    const at = new Map(list.map((v, n) => [v, n])), sets = list.map(() => new Set());
    const tri = m.geometry.index.array;
    for (let t = 0; t < tri.length; t += 3) {
      for (let a = 0; a < 3; a++) {
        const i = at.get(tri[t + a]), j = at.get(tri[t + ((a + 1) % 3)]);
        if (i === undefined || j === undefined) continue;
        sets[i].add(j); sets[j].add(i);
      }
    }
    const P = m.data.position, same = new Map();
    list.forEach((v, n) => {
      const key = `${Math.round(P[v * 3] * 1e4)},${Math.round(P[v * 3 + 1] * 1e4)},${Math.round(P[v * 3 + 2] * 1e4)}`;
      const o = same.get(key);
      if (o === undefined) same.set(key, n);
      else { sets[n].add(o); sets[o].add(n); }
    });
    const start = new Int32Array(list.length + 1);
    sets.forEach((r, n) => { start[n + 1] = start[n] + r.size; });
    const ring = new Int32Array(start[list.length]);
    sets.forEach((r, n) => { let k = start[n]; for (const j of r) ring[k++] = j; });
    const out = { data: m.data, start, ring };
    ringsFor.set(list, out);
    return out;
  }
  const ringsFor = new WeakMap();

  /**
   * Poses him: `{ clip, t, time, speed, seed, speaking, yell, talk, loud }`.
   * To crossfade, `from` is the state he is coming from and `mix` (0..1)
   * how far on from it he is.
   */
  function pose(state = {}) {
    last = state;
    skeleton.reset();
    // Only a weapon held by its grip puts him in a fighting stance; one in each hand, he wields both.
    const gripR = held.R?.how === 'grip', gripL = held.L?.how === 'grip';
    const armed = gripR && gripL ? 'both' : gripR ? 'R' : gripL ? 'L' : null;
    // A weapon made for two hands is swung with both.
    const both = armed && !held.L && held.R.hands === 'two-handed';
    moveBlended(state, { ...style, armed, both, heavy: style.heavy ?? 0 });
    shrug(skeleton, JOINTS);
    const grip = held.R?.how === 'grip' && !held.L ? twoHanded(state) : 0;
    // Reading: the head bowed to the page.
    const reading = held.R?.how === 'book';
    if (reading) { skeleton.turn('neck', 0.12, 0, 0); skeleton.turn('head', 0.26, 0, 0); }
    // Flipping a coin, the head goes up after it and down again.
    const flight = flipping(state) ? coinFlight(state.t ?? 0) : null;
    if (flight) skeleton.turn('head', 0.18 - 0.9 * flight.up, 0, 0);
    carryPose(state);
    clearance ??= measure([body.data, ...[...worn.values()].map((w) => w.mesh.data)], skeleton.names, skeleton.pivots);
    if (grip) {
      // The swinging arm kept out of his body first, then the left hand put on the grip where that leaves it.
      skeleton.compute();
      if (clearArms(skeleton, clearance, skeleton.pivots, ['R'])) skeleton.compute();
      bothHands(grip);
    }
    for (const S of ['L', 'R']) {
      const want = hands[S].shape;
      const how = held.R?.how === 'book' ? 'book' : held[S]?.how;
      const shape = how && how !== 'grip' ? HAND_POSES[{ palm: 'cup', pinch: 'pinch', book: 'book', tome: 'tome', bowl: 'bowl' }[how]]
        : held[S] || (S === 'L' && grip > 0.5) ? HAND_POSES.grip : state.clip === 'yell' ? HAND_POSES.fist
        // Running, a hand that was left easy closes loosely.
        : state.clip === 'run' && want === 'relaxed' ? HAND_POSES.loose
        : typeof want === 'object' ? want : HAND_POSES[want] ?? HAND_POSES.relaxed;
      poseHand(skeleton, S, shape, held[S] || how ? 1 : hands[S].amount, HAND_AXES[sex]);
    }
    // Speech, when he is talking (or shouting) and his face has not been told otherwise.
    const said = state.clip === 'yell' ? yelling(state.time ?? 0)
      : state.clip === 'talk' || state.speaking ? speech(state.time ?? 0, { amount: state.talk ?? 1, loud: state.yell ? 1 : state.loud ?? 0 })
      : null;
    // Reading, the eyes are down on the page.
    const lookDown = reading ? 0.32 : flight ? 0.3 - 1.2 * flight.up : 0;
    poseFace(skeleton, lookDown ? { ...face, look: [face.look[0], face.look[1] - lookDown] } : face, state.time, said);
    skeleton.compute();
    // His arms kept out of his body (and what he wears), however he is shaped: those that would pass
    // into it swung out from the shoulder just enough, eased in so it never jolts (with both hands on a
    // grip, done above, before the left takes it).
    // (Not an arm carrying something: it is where it carries it.)
    // (An arm carrying on its own hand is kept clear too; only the hands on an open book stay where it is.)
    const free = ['L', 'R'].filter((S) => !carrying(S) || (held.R?.how !== 'book' && held[S]?.how !== 'book'));
    if (!grip && free.length && clearArms(skeleton, clearance, skeleton.pivots, free)) skeleton.compute();
    // Only what shows is moved: the skin under his clothes is left where it was.
    skinDual(body.data, skeleton, body.position.array, body.normal.array, drawn(body));
    body.position.needsUpdate = true;
    body.normal.needsUpdate = true;
    for (const { mesh: m } of worn.values()) {
      skinDual(m.data, skeleton, m.position.array, m.normal.array, drawn(m));
      m.position.needsUpdate = true;
      m.normal.needsUpdate = true;
    }
    clearTails();
    for (const kind of ['hair', 'beard', 'brows']) {
      if (!groomed[kind] || groomed[kind].rigid) continue;
      const m = groomed[kind].mesh;
      skinDual(m.data, skeleton, m.position.array, m.normal.array);
      m.position.needsUpdate = true;
      m.normal.needsUpdate = true;
    }
    const rigidHair = groomed.hair?.rigid ? groomed.hair : null;
    if (rigidHair || glasses) {
      const o = skeleton.index.get('head') * 12, B = skeleton.matrices;
      for (const mesh of [rigidHair?.mesh.mesh, rigidHair?.edges, glasses?.mesh.mesh].filter(Boolean)) {
        mesh.matrix.set(B[o], B[o + 1], B[o + 2], B[o + 3], B[o + 4], B[o + 5], B[o + 6], B[o + 7], B[o + 8], B[o + 9], B[o + 10], B[o + 11], 0, 0, 0, 1);
        mesh.matrixWorldNeedsUpdate = true;
      }
    }
    placeHeld();
    placeCarried();
    return api;
  }

  /**
   * Puts `thing` (a weapon from madness-engine/weapons, or any object) in
   * a hand ('R' by default). A weapon is taken by its grip, just under the
   * guard; anything else at `grip` along its own y. Its own +y points the
   * way the thumb does out of the fist.
   */
  function hold(thing, { hand = 'R', grip = null, how = null, open = true } = {}) {
    const S = hand === 'L' || hand === 'left' ? 'L' : 'R';
    const object = thing.group ?? thing;
    // How it is held: by its grip (a weapon), on the palm (a ball), between thumb and forefinger (a coin), or
    // open in both hands (a book). Said, or told by what it is.
    const kind = how ?? thing.holdAs ?? (typeof thing.turnTo === 'function' ? 'book' : thing.handling || thing.gripBounds ? 'grip' : 'palm');
    if (!['grip', 'palm', 'pinch', 'book', 'bowl'].includes(kind)) throw new Error(`human: hold how ${kind}? choose grip, palm, pinch, book or bowl`);
    // A book shut is carried in one hand at his side; open, it is read in both.
    if (kind === 'book' && !open) return carry(thing, object, 'tome', S);
    if (kind !== 'grip') return carry(thing, object, kind, S);
    release(S);
    const bounds = thing.gripBounds;
    const y = grip ?? (bounds ? Math.max((bounds.bottom + bounds.top) / 2, bounds.top - 0.05) : 0);
    const m = S === 'L' ? 1 : -1;
    // The grip's middle, at rest: across the roots of the fingers, in front of the palm, where they close round it; its axis runs forward along them.
    const wrist = mirror(JOINTS.wrist, m), elbow = mirror(JOINTS.elbow, m);
    const down = new GFX.Vector3(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]).normalize();
    const centre = new GFX.Vector3(...mirror(gripOf(sex), m));
    // The object's +y along the grip; its +x (a blade's width) in the plane the wrist bends in, edge leading.
    const along = new GFX.Vector3(0, GRIP_TILT, 1).normalize();
    const side = new GFX.Vector3().crossVectors(along, down).normalize();
    const width = new GFX.Vector3().crossVectors(side, along).normalize();
    const rest = new GFX.Matrix4().makeBasis(width, along, side.negate());
    rest.setPosition(centre);
    rest.multiply(new GFX.Matrix4().makeTranslation(0, -y, 0));
    // At its own size (a weapon is made at real size; anything else may have been scaled to be held).
    rest.multiply(new GFX.Matrix4().makeScale(object.scale.x, object.scale.y, object.scale.z));
    object.matrixAutoUpdate = false;
    group.add(object);
    // Where a second hand takes it, below the first (toward the pommel), as far down the grip as there is.
    const second = bounds ? Math.max(bounds.bottom + 0.03, y - 0.085) : y - 0.085;
    // How many hands it is made for (a weapon's `handling`); anything else is taken as one-handed.
    const hands = thing.handling?.hands ?? 'one-handed';
    held[S] = { thing, object, rest, second, hands, how: 'grip' };
    if (last) pose(last);
    return api;
  }

  /**
   * Takes `thing` (its `object`) to carry `how`: on the palm of hand `S`, between its thumb and forefinger, or
   * (a book) open in both hands. It keeps the size it was given; where it is is worked out every frame.
   */
  function carry(thing, object, how, S) {
    if (how === 'book') { release('L'); release('R'); S = 'R'; } else release(S);
    if (held.R?.how === 'book') release('R');
    // Held still: a globe or a coin that turns on its own (its `spinRate`) does not turn in his hand.
    if (typeof thing.spinRate === 'number') thing.spinRate = 0;
    // Shut before it is measured, if it is to be carried shut; opened at its middle, to be read.
    if (how === 'tome') thing.pose?.({ open: 0, turn: 0 });
    // How big it is, and where its middle is from its origin, at the size it was given.
    object.updateMatrixWorld(true);
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], v = new GFX.Vector3();
    const inv = new GFX.Matrix4().copy(object.matrixWorld).invert();
    const own = new GFX.Matrix4().makeScale(object.scale.x, object.scale.y, object.scale.z);
    object.traverseVisible((o) => {
      const p = o.geometry?.attributes?.position;
      // (Not a glow round it: a sprite is drawn to face the camera, not as big as its quad.)
      if (!p || o.isSprite) return;
      const to = new GFX.Matrix4().multiplyMatrices(inv, o.matrixWorld).premultiply(own);
      for (const i of drawnVertices(o.geometry)) {
        v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(to);
        lo[0] = Math.min(lo[0], v.x); lo[1] = Math.min(lo[1], v.y); lo[2] = Math.min(lo[2], v.z);
        hi[0] = Math.max(hi[0], v.x); hi[1] = Math.max(hi[1], v.y); hi[2] = Math.max(hi[2], v.z);
      }
    });
    const middle = Number.isFinite(lo[0]) ? lo.map((l, a) => (l + hi[a]) / 2) : [0, 0, 0];
    const radius = Number.isFinite(lo[0]) ? Math.max(...hi.map((h, a) => h - lo[a])) / 2 : 0.05;
    const size = Number.isFinite(lo[0]) ? hi.map((h, a) => h - lo[a]) : [0.1, 0.1, 0.1];
    // A book opens at its middle, to be read.
    if (how === 'book') thing.pose?.({ open: 1, turn: Math.floor((thing.dimensions?.leaves ?? 2) / 2) });
    object.matrixAutoUpdate = false;
    group.add(object);
    held[S] = { thing, object, how, hands: 'none', middle, radius, size, scale: object.scale.clone(), solved: {} };
    if (last) pose(last);
    return api;
  }

  /**
   * A coin flipped (the `flip` clip, `t` 0..1): flicked up off the thumb, turning over and over, caught again
   * and held up. How high above the hand it is (metres) and how far it has turned (radians).
   */
  const FLIP = { from: 0.2, to: 0.68, height: 0.45, turns: 6 };
  function coinFlight(t) {
    const s = (t - FLIP.from) / (FLIP.to - FLIP.from);
    if (!(s > 0 && s < 1)) return { up: 0, turn: 0, flying: false };
    return { up: FLIP.height * 4 * s * (1 - s), turn: s * FLIP.turns * Math.PI * 2, flying: true };
  }
  /** Which hand has a coin being flipped, in `state`, or null. */
  const flipping = (state) => (state?.clip === 'flip' ? ['R', 'L'].find((S) => held[S]?.how === 'pinch') ?? null : null);

  /** Whether hand `S` is carrying something, not holding it by a grip (a book takes both). */
  const carrying = (S) => (held[S] && held[S].how !== 'grip') || held.R?.how === 'book';

  /** Where a book is held, this frame: { middle, across, face, up }, or null. */
  let bookAt = null;

  /** The eyes' middle, at rest and now. */
  const eyesRest = () => [0, figure.eye.center[1], figure.eye.center[2]];

  /**
   * Brings the carrying hands where they carry what they hold, after the clip has posed him: a ball out in
   * front on the upturned palm, a coin raised between thumb and forefinger, a book open before the eyes.
   */
  function carryPose(state) {
    if (!carrying('L') && !carrying('R')) { bookAt = null; return; }
    skeleton.compute();
    const C = boneAt(skeleton, 'chest');
    const J = JOINTS;
    const book = held.R?.how === 'book' ? held.R : null;
    if (book) {
      const eyes = applyAt(boneAt(skeleton, 'head'), eyesRest());
      bookAt = bookPlace(C, eyesRest(), eyes, state.clip === 'read' ? { ahead: 0.3, below: 0.34 } : { ahead: 0.32, below: 0.3 });
    } else bookAt = null;
    for (const [S, m] of [['L', 1], ['R', -1]]) {
      if (!carrying(S) || (held[S]?.how === 'tome' && held.R?.how !== 'book')) continue;
      const f = handFrame(J, figure.fingers, m);
      const h = book ?? held[S];
      let aim;
      if (h.how === 'book') {
        const { middle, across, face, up } = bookAt;
        const w = (h.thing.dimensions?.width ?? 0.3) * h.scale.x * 0.92, ht = (h.thing.dimensions?.height ?? 0.42) * h.scale.x;
        // Each hand under its own edge, low on the page, flat under the board (its fingers kept out of the pages).
        const to = [0, 1, 2].map((a) => middle[a] + across[a] * m * w - up[a] * ht * 0.18 - face[a] * 0.03);
        aim = { point: f.centre, to, dirs: [[f.palm, face, 0.012], [f.along, across.map((v) => -m * v), 0.008]] };
      } else if (h.how === 'palm' || h.how === 'bowl') {
        // (A bowling ball, heavier and bigger, a little lower and nearer the body's side.)
        const big = h.how === 'bowl';
        const to = applyAt(C, [m * J.shoulder[0] * (big ? 0.9 : 0.78), J.elbow[1] + (big ? -0.02 : 0.03), J.elbow[2] + (big ? 0.26 : 0.3)]);
        aim = { point: f.centre, to, dirs: [[f.palm, [0, 1, 0], 0.02], [f.along, normV(turnBy(C, [0, 0, 1])), 0.008]] };
      } else if (flipping(state) === S) {
        // Flipping it: the hand out in front at the waist, palm up, a little flick up as it lets go and a
        // reach up to take it back, then raised to look at it.
        const t = state.t ?? 0, flick = Math.exp(-(((t - FLIP.from) / 0.05) ** 2)), take = Math.exp(-(((t - FLIP.to) / 0.06) ** 2));
        const show = Math.min(1, Math.max(0, (t - FLIP.to - 0.05) / 0.2));
        const low = [m * 0.13, J.elbow[1] + 0.08 + 0.04 * flick + 0.05 * take, J.elbow[2] + 0.3];
        const high = [m * 0.15, J.shoulder[1] - 0.06, J.shoulder[2] + 0.3];
        const to = applyAt(C, low.map((v, a) => v + (high[a] - v) * show));
        const point = [0, 1, 2].map((a) => f.centre[a] + f.along[a] * 0.075);
        aim = { point, to, dirs: [[f.palm, [0, 1, 0], 0.02 * (1 - show)], [f.along, normV(turnBy(C, [0, 0.2 + 0.65 * show, 1])), 0.01]] };
      } else {
        const to = applyAt(C, [m * 0.15, J.shoulder[1] - 0.06, J.shoulder[2] + 0.3]);
        const point = [0, 1, 2].map((a) => f.centre[a] + f.along[a] * 0.075);
        aim = { point, to, dirs: [[f.along, normV(turnBy(C, [0, 0.85, 0.35])), 0.01], [f.palm, normV(turnBy(C, [-m, 0, -0.2])), 0.008]] };
      }
      h.solved[S] = reach(skeleton, S, aim, h.solved[S]?.clip === state.clip ? h.solved[S].rots : null);
      h.solved[S] = { rots: h.solved[S], clip: state.clip };
    }
  }

  /** Every joint and tip of the fingers and thumb of hand `S`, where they are now. */
  function fingerPoints(S) {
    const m = S === 'L' ? 1 : -1, out = [];
    for (const name of FINGER_NAMES) {
      const j = figure.fingers[name].joints.map((p) => mirror(p, m));
      out.push(skeleton.point(`${name}1${S}`, j[0]), skeleton.point(`${name}2${S}`, j[1]), skeleton.point(`${name}3${S}`, j[2]), skeleton.point(`${name}3${S}`, j[3]));
      // Half way along each bone too: a finger lying across the board touches it there as well.
      for (let b = 0; b < 3; b++) out.push(skeleton.point(`${name}${b + 1}${S}`, j[b].map((v, a) => (v + j[b + 1][a]) / 2)));
    }
    return out;
  }

  /**
   * How far a slab (a book: `size` across, through and up its axes `x`, `y`, `z`, centred on `at`) must move along
   * its `y` so that none of `points` is inside it: they all on its −y side, `room` clear of it.
   */
  function pushClear(points, at, [x, y, z], size, room = 0.004) {
    let push = 0;
    for (const p of points) {
      const d = [p[0] - at[0], p[1] - at[1], p[2] - at[2]];
      const u = d[0] * x[0] + d[1] * x[1] + d[2] * x[2], v = d[0] * y[0] + d[1] * y[1] + d[2] * y[2], w = d[0] * z[0] + d[1] * z[1] + d[2] * z[2];
      if (Math.abs(u) > size[0] / 2 || Math.abs(w) > size[2] / 2) continue;
      push = Math.max(push, v + size[1] / 2 + room);
    }
    return Math.min(push, 0.08);
  }

  /** Puts what is carried where the hands carrying it have it now. */
  function placeCarried() {
    for (const S of ['L', 'R']) {
      const h = held[S];
      if (!h || h.how === 'grip') continue;
      const m = S === 'L' ? 1 : -1;
      const M = h.object.matrix;
      const scale = new GFX.Matrix4().makeScale(h.scale.x, h.scale.y, h.scale.z);
      if (h.how === 'book') {
        const { across, face, up } = bookAt;
        // Clear of every finger of both hands holding it: moved toward him (along its face) just as far as
        // keeps them all behind its boards. (Its box: its middle, from its origin at the spine, turned as it is.)
        const fingers = [...fingerPoints('L'), ...fingerPoints('R')];
        const centre = bookAt.middle.map((v, a) => v - across[a] * h.middle[0] + face[a] * h.middle[1] - up[a] * h.middle[2]);
        const push = pushClear(fingers, centre, [across, face, up], h.size);
        const middle = bookAt.middle.map((v, a) => v + face[a] * push);
        // (Turned half round in its own plane: the book's pages run head-first along its −z, so its +z goes
        // toward him, the first page on his left.)
        M.makeBasis(new GFX.Vector3(...across.map((v) => -v)), new GFX.Vector3(...face), new GFX.Vector3(...up.map((v) => -v))).setPosition(new GFX.Vector3(...middle)).multiply(scale);
      } else if (h.how === 'tome') {
        // Shut, between the thumb and the fingers, its boards against them: its spine in the palm's heel and
        // its fore-edge out past the fingertips, hanging along his side.
        const f = handFrame(JOINTS, figure.fingers, m), H = boneAt(skeleton, `hand${S}`);
        const across = normV(turnBy(H, f.along)), face = normV(turnBy(H, f.palm));
        const up = normV(crossV(across, face));
        let at = applyAt(H, f.centre).map((v, a) => v + face[a] * (h.size[1] / 2 + 0.004) + across[a] * (h.size[0] / 2 - 0.06));
        // Clear of the fingers and thumb: off the hand (along its face) just as far as keeps them all out of it.
        const push = pushClear(fingerPoints(S), at, [across, face, up], h.size);
        at = at.map((v, a) => v + face[a] * push);
        M.makeBasis(new GFX.Vector3(...across), new GFX.Vector3(...face), new GFX.Vector3(...up)).setPosition(new GFX.Vector3(...at)).multiply(scale);
      } else if (h.how === 'bowl') {
        // On the hand, its holes turned into it: its +z (the holes' middle) to the palm, its +y (the two finger
        // holes, the thumb's on the −y side) toward the fingertips; sunk a centimetre onto the fingers in them.
        const f = handFrame(JOINTS, figure.fingers, m), H = boneAt(skeleton, `hand${S}`);
        const up = normV(turnBy(H, f.palm)), fwd0 = normV(turnBy(H, f.along));
        const z = up.map((v) => -v), d = fwd0[0] * z[0] + fwd0[1] * z[1] + fwd0[2] * z[2];
        const y = normV(fwd0.map((v, i) => v - z[i] * d)), x = crossV(y, z);
        const at = applyAt(H, f.centre).map((v, a) => v + up[a] * (h.radius - 0.01));
        M.makeBasis(new GFX.Vector3(...x), new GFX.Vector3(...y), new GFX.Vector3(...z)).setPosition(new GFX.Vector3(...at)).multiply(scale);
      } else if (h.how === 'palm') {
        const f = handFrame(JOINTS, figure.fingers, m), H = boneAt(skeleton, `hand${S}`);
        const up = normV(turnBy(H, f.palm)), fwd0 = normV(turnBy(H, f.along));
        const side = normV(crossV(up, fwd0)), fwd = crossV(side, up);
        const at = applyAt(H, f.centre).map((v, a) => v + up[a] * (h.radius + 0.004));
        M.makeBasis(new GFX.Vector3(...side), new GFX.Vector3(...up), new GFX.Vector3(...fwd)).setPosition(new GFX.Vector3(...at)).multiply(scale);
      } else {
        // Between the tips of the thumb and forefinger, its faces against them, standing out past them.
        const f = handFrame(JOINTS, figure.fingers, m);
        const a = skeleton.point(`index3${S}`, f.indexTip), b = skeleton.point(`thumb3${S}`, f.thumbTip);
        const z = normV(subV(b, a)), H = boneAt(skeleton, `hand${S}`);
        let y = normV(turnBy(H, f.along));
        const yz = y[0] * z[0] + y[1] * z[1] + y[2] * z[2];
        y = normV(y.map((v, i) => v - z[i] * yz));
        const x = crossV(y, z);
        const at = [0, 1, 2].map((i) => (a[i] + b[i]) / 2 + y[i] * h.radius * 0.55);
        M.makeBasis(new GFX.Vector3(...x), new GFX.Vector3(...y), new GFX.Vector3(...z)).setPosition(new GFX.Vector3(...at));
        // Flipped, it goes up off the thumb and comes down again, turning over and over about its width.
        const flight = flipping(last) === S ? coinFlight(last.t ?? 0) : null;
        if (flight?.flying) {
          M.setPosition(new GFX.Vector3(at[0], at[1] + flight.up, at[2]));
          M.multiply(new GFX.Matrix4().makeRotationX(flight.turn));
        }
        M.multiply(scale);
      }
      // (Its middle where it is put, not its origin: a hero's origin may be anywhere in it.)
      if (h.how !== 'book') M.multiply(new GFX.Matrix4().makeTranslation(-h.middle[0] / h.scale.x, -h.middle[1] / h.scale.y, -h.middle[2] / h.scale.z));
      h.object.matrixWorldNeedsUpdate = true;
    }
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
    if (change.skin || change.iris || change.hair) {
      tex = humanTextures(GFX, paintFor());
      const next = makeMaterials(GFX, look, tex);
      for (const n of ['skin', 'eye']) Object.assign(mats[n], { map: next[n].map, bumpMap: next[n].bumpMap, detailMap: next[n].detailMap }), mats[n].color.copy(next[n].color), mats[n].needsUpdate = true;
    }
    for (const n of ['shirt', 'shoe', 'sole', 'briefs']) if (change[n]) mats[n].color.set(change[n]);
    if (change.socks) mats.sock.color.set(change.socks);
    if (change.jacket) for (const n of ['leather', 'leatherTrim']) mats[n].color.set(change.jacket);
    if (change.rib) for (const n of ['rib', 'ribTrim']) mats[n].color.set(change.rib);
    if (change.denim) mats.denim.color.set(change.denim);
    if (change.hair) {
      for (const m of [mats.hair, mats.hairEdge]) {
        m.color.set(change.hair);
        m.sheenColor.copy(sheenOf(GFX, change.hair));
      }
    }
    return api;
  }

  /** Gives him the haircut `hair` (one of `HAIRSTYLES`, or null for none), the beard `beard` (one of `BEARDS`, or null) and the brows `brows` (one of `BROWS`); any left out stays. */
  function setHair(next = {}) {
    if (sex !== 'male' && next.beard) throw new Error('human: a beard is for the male figure only');
    groom({ ...grooming, ...next });
    tex = humanTextures(GFX, paintFor());
    if (tex) Object.assign(mats.skin, { map: tex.skin.map }), mats.skin.needsUpdate = true;
    if (last) pose(last);
    return api;
  }

  const api = {
    group,
    body: body.mesh,
    skeleton,
    materials: mats,
    clips: CLIPS,
    /** The figure: 'male' or 'female'. */
    sex,
    dimensions: DIMENSIONS[sex],
    get outfit() { return [...worn.keys()]; },
    garment: (name) => worn.get(name)?.mesh.mesh ?? null,
    wear,
    remove,
    /** Puts on exactly these (by name), taking off the rest. */
    dress(names) {
      for (const n of [...worn.keys()]) if (!names.includes(n)) remove(n);
      for (const n of [...names].sort((a, b) => layerOf(a) - layerOf(b))) wear(n);
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
    setHair,
    get hair() { return { ...grooming }; },
    /** Puts on the sunglasses `name` (one of `SUNGLASSES`), or takes them off (null). */
    setGlasses(name) { wearGlasses(name); if (last) pose(last); return api; },
    get glasses() { return glasses?.name ?? null; },
    /**
     * The character creator's choices (see `CUSTOMIZATION`): every slot, those he shows yet read
     * from him as he is (his colours, his hair), the rest as they were last set.
     */
    get features() {
      return {
        ...features, skin: look.skin, iris: look.iris, hairColour: look.hair,
        hair: grooming.hair ?? 'none', beard: grooming.beard ?? 'none', brows: grooming.brows ?? 'none', glasses: glasses?.name ?? 'none',
      };
    },
    /** Sets any of the creator's choices: `{ noseShape: 'aquiline', hair: 'sidePart', eyeSize: 0.3 }`. */
    customize(change) {
      checkFeatures(change, sex);
      if ('sex' in change && change.sex !== sex) throw new Error('human: the figure is chosen when the human is made: createHuman(GFX, { sex })');
      Object.assign(features, change);
      const colours = {};
      if (change.skin) colours.skin = change.skin;
      if (change.iris) colours.iris = change.iris;
      if (change.hairColour) colours.hair = change.hairColour;
      if (Object.keys(colours).length) setLook(colours);
      const groom = {};
      for (const k of ['hair', 'beard', 'brows']) if (k in change) groom[k] = none(change[k]);
      if (Object.keys(groom).length) setHair(groom);
      if ('glasses' in change) api.setGlasses(none(change.glasses));
      if (SHAPE_KEYS.some((k) => k in change)) reshape();
      return api;
    },
    /** How far each arm is inside his body (or what he wears) as he is posed now, by side, in metres: 0 when clear. */
    armDepth: (o) => armDepth(skeleton, clearance ??= measure([body.data, ...[...worn.values()].map((w) => w.mesh.data)], skeleton.names, skeleton.pivots), o),
    /** About how much he weighs, in kilograms, in the shape he has been given (from the volume his skin closes round). */
    get weight() { return shape?.mass ?? (baseMass[sex] ??= massOf(sex)); },
    /** How tall he stands, in metres, in the shape he has been given. */
    get height() { return shape?.height ?? figureOf(sex).height; },
    setHairColor: (c) => setLook({ hair: c }),
    setShirtColor: (c) => setLook({ shirt: c }),
    setJeansColor: (c) => setLook({ denim: c }),
    setShoeColor: (c) => setLook({ shoe: c }),
    setSockColor: (c) => setLook({ socks: c }),
    setJacketColor: (c) => setLook({ jacket: c }),
    setSkin: (c) => setLook({ skin: c }),
    setEyeColor: (c) => setLook({ iris: c }),
    /** Where bone `name` takes the rest-pose point `p` now (after `pose`). */
    point: (name, p) => skeleton.point(name, p),
  };
  // Put on from the inside out, so nothing is fitted twice.
  const layerOf = (n) => (wardrobe[n]?.layer ?? 0);
  for (const name of [...outfit].sort((a, b) => layerOf(a) - layerOf(b))) wear(name);
  pose({ clip: 'idle', t: 0, time: 0 });
  return api;
}

export { sideOf };
