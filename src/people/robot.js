import { createHuman } from './human.js';
import { METALS } from '../props/metalglobe.js';
import { WOOD_SPECIES, woodTexture } from '../textures/wood.js';
import { robotParts, ROBOT_BUILDS, ROBOT_MATERIALS } from './robot-build.js';
import { tag } from './human/clothes.js';

/**
 * The robot: a separate model from the man. It is built from machine
 * components (robot-build.js: smooth shells, actuators, joints, hands, feet)
 * laid out along his skeleton, with his joints, limbs and trunk as the shape
 * guide, and driven by his rig, so it moves to the same clips. His own skin
 * is not shown. A slim, sleek humanoid about 1.76 m tall, with a plain head.
 *
 * Outside resin, inside metal: the shell and trim panels are resin (any
 * color), or the shell can be any of the engine's metals, or wood; the frame
 * inside (joints, actuators, rods) is a metal of its own.
 *
 *     const bot = createRobot(GFX, { color: 'white', trim: 'grey', frame: 'titanium' });
 *     bot.setShell('resin', { color: '#c8202a' });   // glossy red resin
 *     bot.setShell('metal', { metal: 'chrome' });    // or any of the engine's METALS
 *     bot.setShell('wood', { wood: 'walnut' });      // or any WOOD_SPECIES
 *     bot.setTrim('black'); bot.setFrame('gold'); bot.setAccent('#39d0ff');
 *     bot.setBuild('heavy');                         // a stouter, armored build
 */

/** The resin colors on offer, by name (any #rrggbb works too). */
export const RESIN_COLORS = Object.freeze({
  red: '#b3202a', blue: '#1f3f9e', white: '#e9e9ec', black: '#1a1a1d', yellow: '#e2b21c', orange: '#e0621a',
  green: '#1f7a3c', teal: '#14898a', purple: '#5a2a8a', pink: '#d8507a', grey: '#7d8087', gold: '#b8923a',
});

/** What the outer shell can be made of. */
export const SHELLS = Object.freeze(['resin', 'metal', 'wood']);

/** The resin the engine casts its dice in: glossy, a clearcoat over a colored body. */
const RESIN = { roughness: 0.28, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.14 };

/** The metals that are brushed rather than polished: they carry a fine grain. */
const BRUSHED = new Set(['steel', 'titanium', 'iron', 'pewter', 'bronze', 'copper']);

/** Fine brushed grain as a bump map (browser only: under test there is no document, and none). */
function grainMap(GFX, strength) {
  if (typeof document === 'undefined' || !strength) return null;
  const size = 256, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  // Streaks along x: each row its own level, each pixel a little noise.
  for (let y = 0; y < size; y++) {
    const row = 128 + (Math.random() - 0.5) * 90 * strength;
    for (let x = 0; x < size; x++) {
      const v = Math.max(0, Math.min(255, row + (Math.random() - 0.5) * 40 * strength));
      const o = (y * size + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new GFX.CanvasTexture(c);
  t.wrapS = t.wrapT = GFX.RepeatWrapping;
  t.repeat.set(16, 16);
  return t;
}

const colorOf = (c) => RESIN_COLORS[c] ?? c;

/**
 * @param {object} GFX  the engine's gfx module
 * @param {object} [options]
 * @param {string} [options.build]  'standard' (the slim frame, default) or 'heavy' (stouter, with armor plating): `ROBOT_BUILDS`
 * @param {string} [options.shell]  what the outer shell is made of: 'resin' (default), 'metal' or 'wood'
 * @param {string} [options.color]  the resin's color: a name in `RESIN_COLORS`, or #rrggbb (default 'white')
 * @param {string} [options.metal]  for a metal shell, a finish from `METALS` (steel, chrome, gold, ...; default 'steel')
 * @param {string} [options.wood]   for a wood shell, a species from `WOOD_SPECIES` (default 'walnut')
 * @param {string} [options.trim]   the trim panels' resin color (default 'black')
 * @param {string} [options.frame]  the metal of the frame inside, from `METALS` (default 'titanium')
 * @param {string} [options.accent] the eyes' and lamps' glow
 * @param {number} [options.detail] the human guide's level of detail, as createHuman's
 */
export function createRobot(GFX, { build = 'standard', shell = 'resin', color = 'white', metal = 'steel', wood = 'walnut', trim = 'black', frame = 'titanium', accent = '#39d0ff', detail = 1 } = {}) {
  const human = createHuman(GFX, { detail, outfit: [], glasses: null, hair: null, beard: null, brows: null });
  const mats = human.materials;
  const M = (name, o) => new GFX.MeshPhysicalMaterial({ name: `robot ${name}`, vertexColors: true, ...o });
  mats.plate = M('shell', {});
  mats.trim = M('resin trim', {});
  mats.metal = M('frame metal', {});
  mats.rubber = M('rubber', { color: '#15161a', roughness: 0.85 });
  mats.glow = M('glow', { color: '#000000', roughness: 0.4 });
  mats.glass = M('glass', { color: '#04060a', roughness: 0.04, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, });
  const grains = new Map();
  const grain = (name) => {
    if (!BRUSHED.has(name)) return null;
    if (!grains.has(name)) grains.set(name, grainMap(GFX, 0.7));
    return grains.get(name);
  };
  const state = { build, shell, color, metal, wood, trim, frame, accent };

  /** A metal finish on material `m`. */
  function metalOn(m, name) {
    const k = METALS[name];
    if (!k) throw new Error(`robot: metal is one of ${Object.keys(METALS).join(', ')}, not ${name}`);
    Object.assign(m, { map: null, metalness: 1, roughness: k.roughness, clearcoat: 0.1, clearcoatRoughness: 0.2, bumpMap: grain(name), bumpScale: 0.0005 });
    m.color.set(k.color);
    m.needsUpdate = true;
  }

  /**
   * The outer shell: `'resin'` (with `color`), `'metal'` (with `metal`, one of `METALS`) or `'wood'` (with `wood`, a
   * species in `WOOD_SPECIES`, lacquered).
   */
  function setShell(kind, o = {}) {
    if (!SHELLS.includes(kind)) throw new Error(`robot: shell is one of ${SHELLS.join(', ')}, not ${kind}`);
    const m = mats.plate;
    state.shell = kind;
    if (kind === 'resin') {
      state.color = o.color ?? state.color;
      Object.assign(m, RESIN, { map: null, bumpMap: null });
      m.color.set(colorOf(state.color));
    } else if (kind === 'metal') {
      state.metal = o.metal ?? state.metal;
      metalOn(m, state.metal);
    } else {
      state.wood = o.wood ?? state.wood;
      const species = WOOD_SPECIES[state.wood];
      if (!species) throw new Error(`robot: wood is one of ${Object.keys(WOOD_SPECIES).join(', ')}, not ${state.wood}`);
      const tex = typeof document === 'undefined' ? null : woodTexture(GFX, state.wood, 'lacquered');
      Object.assign(m, { metalness: 0, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.25, map: tex?.map ?? null, bumpMap: tex?.bump ?? null, bumpScale: 0.0008 });
      m.color.set(tex ? '#ffffff' : `rgb(${species.base.join(',')})`);
    }
    m.needsUpdate = true;
    return api;
  }

  /** The trim panels' resin color. */
  function setTrim(c) {
    state.trim = c;
    Object.assign(mats.trim, RESIN);
    mats.trim.color.set(colorOf(c));
    mats.trim.needsUpdate = true;
    return api;
  }

  /** The metal of the frame inside, one of `METALS`. */
  function setFrame(name) {
    metalOn(mats.metal, name);
    state.frame = name;
    return api;
  }

  function setAccent(glow) {
    Object.assign(mats.glow, { emissive: new GFX.Color(glow), emissiveIntensity: 2.6 });
    mats.glow.needsUpdate = true;
    state.accent = glow;
    return api;
  }

  // The man is only the guide: his skin, eyes and mouth are not shown.
  human.body.visible = false;
  const garment = (name) => ({
    layer: 3,
    materials: [...ROBOT_MATERIALS],
    covers: () => false,
    build: () => tag(robotParts(name), 'robot'),
  });
  human.wear('robot', garment(build));

  /** Rebuilds the machine in build `name` (one of `ROBOT_BUILDS`), keeping its finish. */
  function setBuild(name) {
    if (!ROBOT_BUILDS[name]) throw new Error(`robot: build is one of ${Object.keys(ROBOT_BUILDS).join(', ')}, not ${name}`);
    if (name === state.build) return api;
    human.remove('robot');
    human.wear('robot', garment(name));
    state.build = name;
    return api;
  }

  const api = Object.assign(Object.create(human), {
    human,
    setBuild,
    setShell,
    setTrim,
    setFrame,
    setAccent,
    shells: SHELLS,
    builds: Object.keys(ROBOT_BUILDS),
    colors: Object.keys(RESIN_COLORS),
    metals: Object.keys(METALS),
    woods: Object.keys(WOOD_SPECIES),
  });
  // (Defined, not assigned: `Object.assign` would read the getter once and keep that.)
  Object.defineProperty(api, 'finish', { get: () => ({ ...state }), enumerable: true });
  setShell(shell);
  setTrim(trim);
  setFrame(frame);
  setAccent(accent);
  return api;
}
