/**
 * Rock, in jewel: the granite stone's shape, exactly (`createGraniteStone`), but
 * cut from a translucent gem rather than granite. It is clear glass tinted all
 * through by its color, the way a gem takes its color from the light it passes
 * through. The granite's grain is there as inclusions: the feldspar and quartz
 * as paler clouds, the mica and pits as dark flecks. They are sampled in three
 * dimensions at each vertex, so there is no picture laid on the stone and no
 * seams where one would meet itself. Inside is a mist of the same color,
 * Krystal's, drawn in the glass as her visions are.
 *
 * `createJewelRock(GFX, { colour })` gives the same handle as `createRock`, so
 * it rolls, squashes and turns as the granite does; `createJewelBoulder` the
 * stone alone. The colors are the `JEWELS` below, by name (`JEWEL_CHOICES`), or
 * any six-digit hex as `color`.
 */
import { createRock, noise } from './rock.js';
import { createGraniteStone, GRANITE_DETAIL } from './rock-granite.js';
import { createVisionMaterial } from './krystal/vision.js';

/**
 * The gems' colors (sRGB hex): the major colored gems, and amber. Each is the color the stone is tinted by, and its mist's.
 */
export const JEWELS = Object.freeze({
  sapphire: '#2a5bd7',
  ruby: '#d1203f',
  emerald: '#18a35f',
  amber: '#e8a33d',
  amethyst: '#8e52d8',
  topaz: '#f2a13a',
  aquamarine: '#72d6e2',
  garnet: '#8c1832',
  peridot: '#a6c63a',
  tourmaline: '#e0699b',
});
export const JEWEL_CHOICES = Object.keys(JEWELS);

/** The mist's sphere, inside the stone, in the stone's own units (the stone is at least 0.75 from its middle). */
export const MIST_RADIUS = 0.62;
/** How fast the mist flows: the vision's own pace, as the glass globe's mood gives it. */
const MIST_SPEED = 0.22;
/** Faces meeting at an angle sharper than 30 degrees keep a hard edge, so the cut planes stay crisp; flatter ones blend. */
const CREASE_COS = Math.cos(Math.PI / 6);

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ramp = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** The color `colour` names, or `color` as given; a bad hex is refused. */
export function jewelHex(colour = 'sapphire', color = null) {
  if (color !== null) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError(`jewel color must be a six-digit hex color, got ${color}`);
    return color.toLowerCase();
  }
  if (!Object.hasOwn(JEWELS, colour)) throw new Error(`rock-jewel: no jewel called ${colour}; there is ${JEWEL_CHOICES.join(', ')}`);
  return JEWELS[colour];
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const mixWhite = (c, t) => c.map((x) => x + (1 - x) * t);

/** A field in 0 to 1 from the stone's own 3D noise: two octaves, so the grain has a large part and a small one. */
const field = (x, y, z, s) => {
  const a = noise(x * s, y * s, z * s);
  const b = noise(x * s * 2.3 + 7, y * s * 2.3, z * s * 2.3);
  return clamp01(0.5 + 0.5 * (a * 0.65 + b * 0.35));
};

/**
 * The grain's fields at each vertex of `geometry`: the tone, the feldspar and quartz clouds, the mica and the pits.
 * Sampled once per stone; a new color is worked from them, with no new sampling.
 */
function grainFields(geometry) {
  const p = geometry.attributes.position.array;
  const n = p.length / 3;
  const out = {
    tone: new Float32Array(n), feld: new Float32Array(n), quartz: new Float32Array(n),
    mica: new Float32Array(n), pit: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
    out.tone[i] = field(x, y, z, 2.5);
    out.feld[i] = field(x, y, z, 9);
    out.quartz[i] = field(x, y, z, 14);
    out.mica[i] = field(x, y, z, 24);
    out.pit[i] = field(x, y, z, 12);
  }
  return out;
}

/** The vertex colors of the stone in `hex`, worked from its grain fields. */
function inclusionColours(fields, hex) {
  const { tone, feld, quartz, mica, pit } = fields;
  const base = rgb(hex);
  const n = tone.length;
  const colours = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const b = tone[i] - 0.5;
    const f = ramp(0.56, 0.62, feld[i]) * 0.15;
    const q = ramp(0.6, 0.66, quartz[i]) * 0.1;
    const k = 1 - ramp(0.63, 0.7, mica[i]) * 0.45 - ramp(0.6, 0.8, pit[i]) * 0.15;
    for (let c = 0; c < 3; c++) {
      let x = base[c] * (1 + b * 0.5);
      x += (1 - x) * f;
      x += (1 - x) * q;
      colours[3 * i + c] = clamp01(x * k);
    }
  }
  return colours;
}

/**
 * Smooth normals across faces that meet at a gentle angle, and hard ones where they meet at a sharp one, so the cut
 * planes stay crisp while the curved parts shade smoothly. The geometry is non-indexed: each vertex is one corner of
 * one face, and corners at the same point are averaged only with the faces close in direction to their own.
 */
function creaseNormals(GFX, geometry) {
  const p = geometry.attributes.position.array;
  geometry.computeVertexNormals();
  // Non-indexed and computed flat, so every corner of a face carries that face's normal: read it from the first.
  const flat = geometry.attributes.normal.array;
  const faceNormal = (f) => [flat[9 * f], flat[9 * f + 1], flat[9 * f + 2]];
  const keyOf = (i) => `${p[i].toFixed(5)},${p[i + 1].toFixed(5)},${p[i + 2].toFixed(5)}`;
  const corners = new Map();
  for (let i = 0; i < p.length; i += 3) {
    const k = keyOf(i);
    let list = corners.get(k);
    if (!list) corners.set(k, list = []);
    list.push(i / 9 | 0);
  }
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    const [nx, ny, nz] = faceNormal(i / 9 | 0);
    let sx = 0, sy = 0, sz = 0;
    for (const g of corners.get(keyOf(i))) {
      const [mx, my, mz] = faceNormal(g);
      if (nx * mx + ny * my + nz * mz >= CREASE_COS) { sx += mx; sy += my; sz += mz; }
    }
    const l = Math.hypot(sx, sy, sz) || 1;
    out[i] = sx / l; out[i + 1] = sy / l; out[i + 2] = sz / l;
  }
  geometry.setAttribute('normal', new GFX.BufferAttribute(out, 3));
}

/**
 * The jewel stone alone: `{ mesh, geometry, material, glass, mist, setColour, setMist }`. `mesh` is a group of the glass
 * and its mist, and both move together, so the stone is drawn at whatever scale its parent gives it.
 */
export function createJewelBoulder(GFX, { colour = 'sapphire', color = null, mist = true, detail = GRANITE_DETAIL } = {}) {
  let hex = jewelHex(colour, color);
  const geometry = createGraniteStone(GFX, { detail });
  // No uv: the granite's projected uvs seam along the cut planes, and a clear gem shows the seams as lines.
  geometry.deleteAttribute('uv');
  const fields = grainFields(geometry);
  geometry.setAttribute('color', new GFX.BufferAttribute(inclusionColours(fields, hex), 3));
  creaseNormals(GFX, geometry);

  const material = new GFX.MeshPhysicalMaterial({
    name: 'jewel',
    color: new GFX.Color('#ffffff'),
    vertexColors: true,
    metalness: 0,
    roughness: 0.04,
    transmission: 1,
    thickness: 0.9,
    ior: 1.76,
    attenuationColor: new GFX.Color(hex),
    attenuationDistance: 0.9,
    // Off, as the orb's glass is: the glass must not hide the mist inside it.
    depthWrite: false,
    // A gem lit from within: a faint glow in its own color, as the orb's mist gives, so it reads against a dark room.
    emissive: new GFX.Color(hex),
    emissiveIntensity: 0.07,
    clearcoat: 0.8,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
  });
  const glass = new GFX.Mesh(geometry, material);
  glass.name = 'jewel glass';
  glass.castShadow = true;
  glass.receiveShadow = true;

  // The mist: Krystal's vision, in the stone's own color. Its sphere is inside the stone, and its flow runs
  // on its own, as the orb's does.
  const vision = createVisionMaterial(GFX);
  const U = vision.uniforms;
  U.uRadius.value = 1;
  U.uGlow.value = 2.2;
  U.uCore.value = 0.1;
  U.uSwirl.value = 1.4;
  U.uChurn.value = 0.5;
  U.uSpread.value = 0;
  U.uTint.value.set(1, 1, 1);
  U.uDuo.value = 1;
  const mistMesh = new GFX.Mesh(new GFX.SphereGeometry(MIST_RADIUS, 48, 32), vision);
  mistMesh.name = 'jewel mist';
  mistMesh.renderOrder = 1;
  mistMesh.castShadow = false;
  mistMesh.receiveShadow = false;
  mistMesh.visible = Boolean(mist);
  const timer = new GFX.Timer();
  let flow = 0;
  mistMesh.onBeforeRender = () => {
    timer.update();
    flow += Math.min(timer.getDelta(), 0.05) * MIST_SPEED;
    U.uFlow.value = flow;
    // The shader marches in world space, so the mist's sphere is taken from the stone's world scale each frame.
    mistMesh.updateWorldMatrix(true, false);
    U.uCenter.value.setFromMatrixPosition(mistMesh.matrixWorld);
    U.uShape.value.setFromMatrixScale(mistMesh.matrixWorld).multiplyScalar(MIST_RADIUS);
  };
  const setDuo = (h) => {
    const c = rgb(h);
    U.uDuoA.value.set(...c);
    U.uDuoB.value.set(...mixWhite(c, 0.6));
    U.uDuoC.value.set(...mixWhite(c, 0.3));
  };
  setDuo(hex);

  const group = new GFX.Group();
  group.name = 'jewel';
  group.add(glass, mistMesh);

  return {
    mesh: group, geometry, material, glass, mist: mistMesh, mistMaterial: vision,
    get colour() { return hex; },
    /** Tints the stone and its mist: a `JEWELS` name, or any six-digit hex as `color`. */
    setColour(name, color = null) {
      hex = jewelHex(name, color);
      material.attenuationColor.set(hex);
      material.emissive.set(hex);
      geometry.setAttribute('color', new GFX.BufferAttribute(inclusionColours(fields, hex), 3));
      setDuo(hex);
      return this;
    },
    setMist(show = true) {
      mistMesh.visible = Boolean(show);
      return this;
    },
  };
}

/** A jewel rock: `createRock`, with the jewel stone in the color asked for and its mist. `colour` is a `JEWELS` name. */
export function createJewelRock(GFX, { colour = 'sapphire', color = null, mist = true, ...opts } = {}) {
  let asset = null;
  const rock = createRock(GFX, {
    ...opts,
    boulder: (G) => (asset = createJewelBoulder(G, { colour, color, mist })),
  });
  // A getter, defined as one: Object.assign would copy its value once, and the color would stop following the stone.
  Object.defineProperty(rock, 'colour', { get: () => asset.colour, enumerable: true });
  rock.setColour = (name, hex = null) => { asset.setColour(name, hex); return rock; };
  rock.setMist = (show = true) => { asset.setMist(show); return rock; };
  return rock;
}
