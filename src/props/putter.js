import { METALS, studioEnvironment } from './metalglobe.js';
import { diagonalWrapGeometry, leatherMaps, metalMaterial, shadeHex } from '../weapons/common.js';

/**
 * A putter, built the way the swords are: at real size in metres (one engine unit is one metre), standing on its butt at
 * the origin with the head at the far end (+y), the same wrapped leather grip and boss cap, a plain metal cap on the butt (no
 * pommel), and the same twelve `METALS` finishes, each part chosen on its own.
 *
 *     const putter = createPutter(GFX, { head: 'mallet', headMetal: 'chrome', accentColor: '#39ff88', glow: 1 });
 *     scene.add(putter.group);
 *     putter.setHeadStyle('blade');
 *     putter.setGripColor('#ff3fa4');
 *
 * The head's face looks along +z, its toe-to-heel line is x, and its top is the side the shaft leaves from. The shaft joins
 * the head at the lie angle, so with the club upright the sole is tilted; `playRotation` is the turn about z that lays the
 * sole level and puts the head at the bottom, and `sole` is the point of the sole under the shaft, for putting it on the floor.
 */

/** Overall length is the butt to the sole under the shaft, 34 inches. */
export const PUTTER_DIMENSIONS = Object.freeze({
  overallLength: 0.864,
  gripLength: 0.27,
  gripDiameter: 0.034,
  buttCapHeight: 0.012,
  shaftRadius: 0.0065,
  hoselLength: 0.045,
  lie: 70,
  unit: 'm',
});

export const PUTTER_SPEC = Object.freeze({ name: 'putter', ...PUTTER_DIMENSIONS, gripWrapDivisions: 22 });

/** What the overall length may be set to: a short putter to a long one, in metres. */
export const PUTTER_LENGTHS = Object.freeze({ min: 0.76, max: 0.95 });
/** The lie angles allowed, in degrees from the ground to the shaft. */
export const PUTTER_LIES = Object.freeze({ min: 60, max: 75 });

/**
 * The head shapes. Each is the top view in metres (`length` toe to heel, `depth` face to back, `height` sole to top),
 * where the shaft enters (`hosel`: x and depth from the face) and how it is cut.
 */
export const PUTTER_HEADS = Object.freeze({
  /** A classic blade with a flange behind the middle and heel. */
  blade: { name: 'Blade', length: 0.125, depth: 0.05, height: 0.022, hosel: [-0.046, 0.016] },
  /** A deep mallet: a broad rounded block, shafted at the middle. */
  mallet: { name: 'Mallet', length: 0.115, depth: 0.1, height: 0.04, hosel: [0, 0.03] },
  /** A half-moon: a straight face and a round back. */
  'half-moon': { name: 'Half-moon', length: 0.12, depth: 0.06, height: 0.032, hosel: [-0.02, 0.022] },
});
export const PUTTER_HEAD_NAMES = Object.freeze(Object.keys(PUTTER_HEADS));

/** The sight lines on top of the head. */
export const PUTTER_SIGHTS = Object.freeze(['line', 'tee', 'none']);

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (value, label) => { if (!HEX.test(value)) throw new TypeError(`${label} must be a six-digit hex colour`); return value; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** The outline of a head seen from above: x across (toe + to heel −), y back from the face. */
function outlineOf(GFX, name, { length: L, depth: D }) {
  const shape = new GFX.Shape();
  const h = L / 2, r = 0.006;
  if (name === 'blade') {
    // A straight face; the back steps out into a flange across the middle and heel.
    const toeBack = D * 0.52, flange = D;
    shape.moveTo(-h + r, 0);
    shape.lineTo(h - r, 0);
    shape.quadraticCurveTo(h, 0, h, r);
    shape.lineTo(h, toeBack - r);
    shape.quadraticCurveTo(h, toeBack, h - r, toeBack);
    shape.lineTo(h * 0.22, toeBack);
    shape.quadraticCurveTo(h * 0.1, toeBack, h * 0.08, toeBack + 0.012);
    shape.lineTo(h * 0.02, flange - 0.01);
    shape.quadraticCurveTo(h * 0.0, flange, -h * 0.06, flange);
    shape.lineTo(-h * 0.56, flange);
    shape.quadraticCurveTo(-h * 0.7, flange, -h * 0.74, flange - 0.014);
    shape.lineTo(-h * 0.84, toeBack + 0.004);
    shape.quadraticCurveTo(-h, toeBack, -h, toeBack - r);
    shape.lineTo(-h, r);
    shape.quadraticCurveTo(-h, 0, -h + r, 0);
  } else if (name === 'mallet') {
    // A broad block with a squared face and rounded back corners.
    const c = 0.03;
    shape.moveTo(-h + r, 0);
    shape.lineTo(h - r, 0);
    shape.quadraticCurveTo(h, 0, h, r);
    shape.lineTo(h, D - c);
    shape.quadraticCurveTo(h, D, h - c, D);
    shape.lineTo(-h + c, D);
    shape.quadraticCurveTo(-h, D, -h, D - c);
    shape.lineTo(-h, r);
    shape.quadraticCurveTo(-h, 0, -h + r, 0);
  } else {
    // Half-moon: the straight face and a half-ellipse behind it.
    shape.moveTo(-h + r, 0);
    shape.lineTo(h - r, 0);
    shape.quadraticCurveTo(h, 0, h, r);
    const steps = 18;
    for (let i = 1; i < steps; i++) {
      const a = (i / steps) * Math.PI;
      shape.lineTo(h * Math.cos(a), r + (D - r) * Math.sin(a));
    }
    shape.lineTo(-h, r);
    shape.quadraticCurveTo(-h, 0, -h + r, 0);
  }
  return shape;
}

/** The head's solid body: the outline stood up from the sole, the face at z = 0 looking along +z. */
function headGeometry(GFX, name, spec) {
  const geometry = new GFX.ExtrudeGeometry(outlineOf(GFX, name, spec), {
    depth: spec.height, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0018, bevelSegments: 2, curveSegments: 10,
  });
  // The outline was drawn in x, y with the extrusion along z: turn it so the extrusion is up and the back is −z.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals?.();
  return geometry;
}

const sightGeometries = (GFX, style, spec, top, front) => {
  const w = 0.0032, lift = 0.0006;
  const parts = [];
  const { length: L, depth: D } = spec;
  const bar = (x, z0, z1, width = w) => {
    const g = new GFX.BoxGeometry(width, 0.0012, z1 - z0);
    g.translate(x, top + lift, (z0 + z1) / -2 + front);
    return g;
  };
  // z runs back from the face: a sight line from just behind the face to near the back.
  const x0 = 0;
  parts.push(bar(x0, 0.01, Math.max(0.02, D - 0.008)));
  if (style === 'tee') parts.push(bar(x0, D * 0.62, D * 0.62 + w, L * 0.55));
  return parts;
};

export function createPutter(GFX, options = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('createPutter requires the Madness Engine GFX module');
  }
  let {
    head = 'blade', headMetal = 'steel', shaftMetal = 'steel', hiltMetal = 'steel', gripColor = '#1f1f24', threadColor,
    faceColor = '#1c1c22', accentColor = '#f2f2f2', glow = 0, sight = 'line', wrapStyle = 'banded',
    length = PUTTER_SPEC.overallLength, lie = PUTTER_SPEC.lie,
  } = options;
  if (!PUTTER_HEADS[head]) throw new Error(`no putter head called ${head}; choose ${PUTTER_HEAD_NAMES.join(', ')}`);
  for (const [label, name] of [['head', headMetal], ['shaft', shaftMetal], ['hilt', hiltMetal]]) {
    if (!METALS[name]) throw new Error(`no metal called ${name} for the ${label}`);
  }
  hex(gripColor, 'gripColor'); hex(faceColor, 'faceColor'); hex(accentColor, 'accentColor');
  if (threadColor !== undefined) hex(threadColor, 'threadColor');
  if (!PUTTER_SIGHTS.includes(sight)) throw new Error(`no sight called ${sight}; choose ${PUTTER_SIGHTS.join(', ')}`);
  if (!['banded', 'diagonal'].includes(wrapStyle)) throw new Error(`no putter grip wrap called ${wrapStyle}; choose banded, diagonal`);
  if (!(glow >= 0 && glow <= 1)) throw new RangeError('glow is from 0 (none) to 1 (full)');
  length = clamp(length, PUTTER_LENGTHS.min, PUTTER_LENGTHS.max);
  lie = clamp(lie, PUTTER_LIES.min, PUTTER_LIES.max);

  const spec = { ...PUTTER_SPEC, overallLength: length };
  const group = new GFX.Group();
  group.name = 'putter display';

  // The grip: a butt cap in the fittings' metal, the wrapped leather over its length, and a boss cap where the shaft leaves it.
  const hiltMaterial = metalMaterial(GFX, 'hilt metal', hiltMetal);
  const radius = spec.gripDiameter / 2;
  const capTop = spec.buttCapHeight;
  const gripBottom = capTop - 0.001, gripTop = gripBottom + spec.gripLength;
  const maps = leatherMaps(GFX);
  const leatherMaterial = new GFX.MeshPhysicalMaterial({
    name: 'wrapped leather grip', color: new GFX.Color(gripColor), map: maps.map, bumpMap: maps.bump, bumpScale: 0.0014,
    roughness: 0.86, metalness: 0, clearcoat: 0.04, clearcoatRoughness: 0.72,
  });
  const handle = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.92, radius * 1.04, spec.gripLength, 48, 1), leatherMaterial);
  handle.name = 'leather grip';
  handle.position.set(0, (gripBottom + gripTop) / 2, 0);
  handle.castShadow = true;
  handle.receiveShadow = true;
  const wrapMaterial = new GFX.MeshPhysicalMaterial({
    name: 'leather wrap ridges', color: new GFX.Color(threadColor ?? shadeHex(gripColor, 0.68)), roughness: 0.9, metalness: 0,
  });
  const hilt = new GFX.Group();
  hilt.name = 'connected hilt assembly';
  hilt.add(handle);
  if (wrapStyle === 'diagonal') {
    const helix = new GFX.Mesh(diagonalWrapGeometry(GFX, { radius: radius * 0.98 + 0.00055, startY: gripBottom, height: spec.gripLength, pitch: 0.0117 }), wrapMaterial);
    helix.name = 'diagonal leather wrap';
    helix.castShadow = true;
    hilt.add(helix);
  } else {
    // Rings of leather cord, each sat on the grip's taper where it is.
    const wraps = spec.gripWrapDivisions;
    for (let i = 1; i < wraps; i++) {
      const t = i / wraps;
      const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * (1.04 - 0.12 * t) * 1.005, 0.00072, 6, 40), wrapMaterial);
      ring.name = 'leather wrap ridge';
      ring.position.set(0, gripBottom + spec.gripLength * t, 0);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      hilt.add(ring);
    }
  }
  // The butt cap: a short, rounded metal plug, flat underneath so the putter stands on it, a little wider than the grip.
  const buttCap = new GFX.Mesh(new GFX.CylinderGeometry(radius * 1.1, radius * 1.16, capTop, 48, 1), hiltMaterial);
  buttCap.name = 'butt cap';
  buttCap.position.set(0, capTop / 2, 0);
  buttCap.castShadow = true;
  buttCap.receiveShadow = true;
  const buttRim = new GFX.Mesh(new GFX.TorusGeometry(radius * 1.13, 0.0012, 8, 48), hiltMaterial);
  buttRim.name = 'butt cap rim';
  buttRim.rotation.x = Math.PI / 2;
  buttRim.position.set(0, capTop - 0.0006, 0);
  buttRim.castShadow = true;
  // The boss cap where the shaft leaves the grip: it overlaps the leather by 2 mm and covers the cut end.
  const bossSeatBounds = Object.freeze({ bottom: gripTop - 0.002, top: gripTop + 0.004 });
  const bossSeat = new GFX.Mesh(new GFX.CylinderGeometry(radius * 1.04, radius * 1.1, bossSeatBounds.top - bossSeatBounds.bottom, 48), hiltMaterial);
  bossSeat.name = 'guard boss lower cap';
  bossSeat.position.set(0, (bossSeatBounds.bottom + bossSeatBounds.top) / 2, 0);
  bossSeat.castShadow = true;
  bossSeat.receiveShadow = true;
  hilt.add(buttCap, buttRim, bossSeat);
  group.add(hilt);
  const gripBounds = Object.freeze({ bottom: gripBottom, top: gripTop });
  const handleBounds = Object.freeze({ bottom: gripBottom, top: gripTop, length: spec.gripLength });

  const headMaterial = metalMaterial(GFX, 'head metal', headMetal);
  const shaftMaterial = metalMaterial(GFX, 'shaft metal', shaftMetal);
  const faceMaterial = new GFX.MeshPhysicalMaterial({
    name: 'face insert', color: new GFX.Color(faceColor), roughness: 0.42, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.3,
  });
  const accentMaterial = new GFX.MeshStandardMaterial({
    name: 'sight line', color: new GFX.Color(accentColor), roughness: 0.4, metalness: 0,
    emissive: new GFX.Color(accentColor), emissiveIntensity: glow * 2.2,
  });

  const headGroup = new GFX.Group();
  headGroup.name = 'putter head';
  group.add(headGroup);
  const shaft = new GFX.Mesh(new GFX.CylinderGeometry(1, 1, 1, 24, 1), shaftMaterial);
  shaft.name = 'tapered steel shaft';
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  const state = { body: null, face: null, sights: [], hosel: null, sole: [0, 0, 0], rotation: 0 };
  const dispose = (mesh) => mesh?.geometry?.dispose?.();

  /** Builds the head for the current style and sets it on the shaft's end at the lie angle; also (re)cuts the shaft to fit. */
  function layout() {
    for (const mesh of [state.body, state.face, state.hosel, ...state.sights]) {
      if (!mesh) continue;
      headGroup.remove(mesh);
      dispose(mesh);
    }
    const spec2 = PUTTER_HEADS[head];
    const { height: H, hosel: [hx, hd] } = spec2;
    state.body = new GFX.Mesh(headGeometry(GFX, head, spec2), headMaterial);
    state.body.name = `${head} putter head`;
    state.body.castShadow = true;
    state.body.receiveShadow = true;
    const box = state.body.geometry.boundingBox;
    // The face insert, standing a hair proud of the face (the bevel's front is box.max.z).
    const insert = new GFX.BoxGeometry(spec2.length * 0.74, H * 0.62, 0.004);
    insert.translate(0, H * 0.5, box.max.z + 0.0016);
    state.face = new GFX.Mesh(insert, faceMaterial);
    state.face.name = 'face insert';
    state.face.castShadow = true;
    // The sight line on top, taken back from the face.
    state.sights = sightGeometries(GFX, sight, spec2, box.max.y, 0).map((g) => {
      const mesh = new GFX.Mesh(g, accentMaterial);
      mesh.name = 'sight line';
      mesh.visible = sight !== 'none';
      return mesh;
    });
    // The hosel: a short stem up from the head's top at the shaft's lean, ending on the shaft's axis.
    const lean = (90 - lie) * Math.PI / 180;
    const stem = new GFX.CylinderGeometry(0.0072, 0.0092, PUTTER_SPEC.hoselLength, 20, 1);
    stem.translate(0, PUTTER_SPEC.hoselLength / 2, 0);
    stem.rotateZ(lean);
    stem.translate(hx, box.max.y - 0.002, -hd);
    state.hosel = new GFX.Mesh(stem, headMaterial);
    state.hosel.name = 'hosel';
    state.hosel.castShadow = true;
    headGroup.add(state.body, state.face, state.hosel, ...state.sights);

    // The head frame has its sole at y = 0, the shaft leaning toward the heel by `lean` as it rises. In the club's frame the shaft is
    // straight along y with the head at the far end, so the head is turned half a turn and a lie: the shaft then runs back down −y.
    const psi = Math.PI / 2 + (lie * Math.PI) / 180;
    headGroup.rotation.set(0, 0, psi);
    // The attach point (the stem's foot) goes onto the shaft's axis, a hoselLength down it from the shaft's end; the sole under it
    // is `overallLength` from the butt.
    const A = [hx, box.max.y, -hd];
    const turn = (p) => [p[0] * Math.cos(psi) - p[1] * Math.sin(psi), p[0] * Math.sin(psi) + p[1] * Math.cos(psi), p[2]];
    const under = [hx, 0, -hd];
    const dy = turn(under)[1] - turn(A)[1];
    const yA = length - dy;
    const rotA = turn(A);
    headGroup.position.set(-rotA[0], yA - rotA[1], -rotA[2]);
    const soleAt = turn(under);
    state.sole = [headGroup.position.x + soleAt[0], headGroup.position.y + soleAt[1], headGroup.position.z + soleAt[2]];
    state.rotation = -psi;

    // The shaft: from the boss cap up to where the hosel ends, thinner toward the head.
    const y0 = bossSeatBounds.top - 0.001;
    const y1 = yA - PUTTER_SPEC.hoselLength * Math.cos(lean) + 0.004;
    const shaftLength = y1 - y0;
    const tip = 0.0048, butt = PUTTER_SPEC.shaftRadius;
    dispose(shaft);
    shaft.geometry = new GFX.CylinderGeometry(tip, butt, shaftLength, 24, 1);
    shaft.position.set(0, (y0 + y1) / 2, 0);
    shaft.userData.length = shaftLength;
  }
  layout();

  const api = {
    group, hilt, handle, shaft, headGroup, buttCap, bossSeat, gripBounds, handleBounds, bossSeatBounds,
    leatherMaterial, wrapMaterial,
    headMaterial, shaftMaterial, hiltMaterial, faceMaterial, accentMaterial,
    get body() { return state.body; },
    get face() { return state.face; },
    get hosel() { return state.hosel; },
    get sights() { return state.sights; },
    get head() { return head; },
    get sight() { return sight; },
    get headMetal() { return headMetal; },
    get shaftMetal() { return shaftMetal; },
    get hiltMetal() { return hiltMetal; },
    get gripColor() { return gripColor; },
    get threadColor() { return `#${wrapMaterial.color.getHexString()}`; },
    get faceColor() { return faceColor; },
    get accentColor() { return accentColor; },
    get glow() { return glow; },
    get length() { return length; },
    get lie() { return lie; },
    /** The point of the sole under the shaft, in the club's frame, and the turn about z that lays the club for putting (head down, sole level). */
    get sole() { return state.sole.slice(); },
    get playRotation() { return state.rotation; },
    get dimensions() {
      return Object.freeze({
        overallLength: length, gripLength: PUTTER_SPEC.gripLength, gripDiameter: PUTTER_SPEC.gripDiameter,
        shaftLength: shaft.userData.length, lie, head: { ...PUTTER_HEADS[head] },
        buttCapHeight: spec.buttCapHeight, unit: 'm',
      });
    },
    get info() {
      const h = PUTTER_HEADS[head];
      return {
        'Putter length': `${length.toFixed(3)} m (${(length / 0.0254).toFixed(1)} in)`,
        'Head': `${h.name}, ${(h.length * 1000).toFixed(0)} × ${(h.depth * 1000).toFixed(0)} mm`,
        'Lie angle': `${lie}°`,
        'Grip length': `${(PUTTER_SPEC.gripLength * 1000).toFixed(0)} mm`,
        'Shaft length': `${(shaft.userData.length * 1000).toFixed(0)} mm`,
        'Scale': '1 world unit = 1 metre',
        'Butt': 'Plain metal cap',
      };
    },
    setHeadStyle(name) {
      if (!PUTTER_HEADS[name]) throw new Error(`no putter head called ${name}; choose ${PUTTER_HEAD_NAMES.join(', ')}`);
      head = name;
      layout();
      return api;
    },
    setLength(metres) { length = clamp(metres, PUTTER_LENGTHS.min, PUTTER_LENGTHS.max); layout(); return api; },
    setLie(degrees) { lie = clamp(degrees, PUTTER_LIES.min, PUTTER_LIES.max); layout(); return api; },
    setSight(name) {
      if (!PUTTER_SIGHTS.includes(name)) throw new Error(`no sight called ${name}; choose ${PUTTER_SIGHTS.join(', ')}`);
      sight = name;
      layout();
      return api;
    },
    setHeadMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      headMaterial.color.set(finish.color);
      headMaterial.roughness = finish.roughness;
      headMetal = name;
      return api;
    },
    setShaftMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      shaftMaterial.color.set(finish.color);
      shaftMaterial.roughness = finish.roughness;
      shaftMetal = name;
      return api;
    },
    /** The fittings: the cap on the butt and the cap where the shaft leaves the grip. */
    setHiltMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      hiltMaterial.color.set(finish.color);
      hiltMaterial.roughness = finish.roughness;
      hiltMetal = name;
      return api;
    },
    setGripColor(color) {
      hex(color, 'gripColor');
      leatherMaterial.color.set(color);
      if (!threadColor) wrapMaterial.color.set(shadeHex(color, 0.68));
      gripColor = color;
      return api;
    },
    setThreadColor(color) {
      hex(color, 'threadColor');
      wrapMaterial.color.set(color);
      threadColor = color;
      return api;
    },
    setFaceColor(color) { hex(color, 'faceColor'); faceMaterial.color.set(color); faceColor = color; return api; },
    /** The sight line's colour; it glows in this colour when `glow` is up. */
    setAccentColor(color) {
      hex(color, 'accentColor');
      accentMaterial.color.set(color);
      accentMaterial.emissive.set(color);
      accentColor = color;
      return api;
    },
    /** How brightly the sight line (and, when the grip thread is its colour, the thread) shines: 0 to 1. */
    setGlow(value) {
      if (!(value >= 0 && value <= 1)) throw new RangeError('glow is from 0 (none) to 1 (full)');
      glow = value;
      accentMaterial.emissiveIntensity = value * 2.2;
      return api;
    },
    dispose() {
      group.traverse?.((o) => { o.geometry?.dispose?.(); });
      for (const m of [headMaterial, shaftMaterial, faceMaterial, accentMaterial]) m.dispose?.();
    },
  };
  return api;
}

const METAL_NAMES = Object.keys(METALS);

/** The asset viewer's entry: every choice is live, so the putter is built up and changed on the stage. */
export const assetViewer = Object.freeze({
  id: 'putter',
  name: 'Putter (customizable)',
  category: 'Props',
  group: 'sports',
  options: {},
  build({ GFX, renderer = null }) {
    const putter = createPutter(GFX, { head: 'blade', headMetal: 'chrome', shaftMetal: 'steel', hiltMetal: 'chrome', gripColor: '#1f1f24', accentColor: '#39ff88', glow: 0.6 });
    const metal = (label, get, set) => ({ type: 'select', label, options: METAL_NAMES, get, set });
    return Object.assign(putter, {
      environment: studioEnvironment(GFX, renderer),
      ui: [
        { type: 'select', label: 'Head', options: PUTTER_HEAD_NAMES, get: () => putter.head, set: (v) => putter.setHeadStyle(v) },
        metal('Head metal', () => putter.headMetal, (v) => putter.setHeadMetal(v)),
        metal('Shaft metal', () => putter.shaftMetal, (v) => putter.setShaftMetal(v)),
        metal('Fittings metal', () => putter.hiltMetal, (v) => putter.setHiltMetal(v)),
        { type: 'color', label: 'Grip', get: () => putter.gripColor, set: (v) => putter.setGripColor(v) },
        { type: 'color', label: 'Grip thread', get: () => putter.threadColor, set: (v) => putter.setThreadColor(v) },
        { type: 'color', label: 'Face insert', get: () => putter.faceColor, set: (v) => putter.setFaceColor(v) },
        { type: 'color', label: 'Sight line', get: () => putter.accentColor, set: (v) => putter.setAccentColor(v) },
        { type: 'range', label: 'Glow', min: 0, max: 1, step: 0.05, get: () => putter.glow, set: (v) => putter.setGlow(v) },
        { type: 'select', label: 'Sight', options: PUTTER_SIGHTS, get: () => putter.sight, set: (v) => putter.setSight(v) },
        { type: 'range', label: 'Length (m)', min: PUTTER_LENGTHS.min, max: PUTTER_LENGTHS.max, step: 0.01, get: () => putter.length, set: (v) => putter.setLength(v) },
        { type: 'range', label: 'Lie (°)', min: PUTTER_LIES.min, max: PUTTER_LIES.max, step: 1, get: () => putter.lie, set: (v) => putter.setLie(v) },
      ],
    });
  },
});
