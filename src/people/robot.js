import { createHuman } from './human.js';

/**
 * The robot: a separate model from the man, made by editing him rather than
 * building anew. It is the man's mesh, rig, skin weights and clips, with his
 * proportions reworked for a heroic humanoid machine (tall, broad through the
 * chest and shoulders, narrow at the waist, long in the leg, big in the hand
 * and foot, a short thick neck), his flesh replaced by customizable resin or
 * metal, and his eyes lit. It stands about 2 m tall and moves to the same
 * clips, so a game drives it as it drives him.
 *
 *     const bot = createRobot(GFX, { finish: 'brushed steel', accent: '#39d0ff' });
 *     bot.setFinish('resin', { color: '#c8202a' });   // glossy red resin
 *     bot.setFinish('chrome');
 */

/** The man's shape sliders, reworked: the robot's proportions. Hair, brows and beard are left off. */
export const ROBOT_PROPORTIONS = Object.freeze({
  build: 'athletic',
  height: 1,
  muscle: 0.5,
  shoulders: 0.9,
  chest: 0.6,
  waist: -0.7,
  hips: -0.5,
  belly: -1,
  arms: 0.4,
  legs: 0.3,
  armLength: 0.4,
  legLength: 0.8,
  torsoLength: -0.2,
  neck: 0.3,
  neckLength: -0.5,
  hands: 0.6,
  feet: 0.4,
  hair: 'none',
  beard: 'none',
  brows: 'none',
});

/** Metals: color, roughness, and how much brushed grain they carry. */
export const METALS = Object.freeze({
  'brushed steel': { color: '#b9bec6', roughness: 0.38, grain: 1 },
  chrome: { color: '#f2f4f8', roughness: 0.04, grain: 0 },
  gunmetal: { color: '#4a4f58', roughness: 0.3, grain: 0.5 },
  titanium: { color: '#8d9099', roughness: 0.42, grain: 0.8 },
  brass: { color: '#c9a24a', roughness: 0.3, grain: 0.6 },
  copper: { color: '#c0734a', roughness: 0.28, grain: 0.6 },
  'black steel': { color: '#1c1e22', roughness: 0.34, grain: 0.7 },
});

/** The resin the engine casts its dice in: glossy, a clearcoat over a colored body. */
const RESIN = { roughness: 0.28, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.14 };

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
  t.repeat.set(24, 24);
  return t;
}

/**
 * @param {object} GFX  the engine's gfx module
 * @param {object} [options]
 * @param {string} [options.finish]  'resin' or a key of `METALS` (default 'brushed steel')
 * @param {string} [options.color]   the resin's color, or a metal's tint
 * @param {string} [options.accent]  the eyes' glow
 * @param {number} [options.detail] the body's level of detail, as createHuman's
 */
export function createRobot(GFX, { finish = 'brushed steel', color = null, accent = '#39d0ff', detail = 1 } = {}) {
  const human = createHuman(GFX, { detail, features: { ...ROBOT_PROPORTIONS }, outfit: [] });
  const mats = human.materials;
  let grain = null, finishName = finish, accentColor = accent;

  function setFinish(name, { color: tint = null, roughness = null } = {}) {
    const resin = name === 'resin';
    const metal = METALS[name];
    if (!resin && !metal) throw new Error(`robot: finish is 'resin' or one of ${Object.keys(METALS).join(', ')}, not ${name}`);
    const m = mats.skin;
    grain?.dispose?.();
    grain = resin ? null : grainMap(GFX, metal.grain);
    // The skin's own paint is left behind: the robot is one color all over, its creases kept by the vertex shading.
    Object.assign(m, {
      map: null, detailMap: null, bumpMap: grain, bumpScale: 0.0006, sheen: 0, subsurface: 0, specularIntensity: 1,
      ...(resin ? RESIN : { metalness: 1, clearcoat: 0.15, clearcoatRoughness: 0.2, roughness: metal.roughness }),
    });
    if (roughness != null) m.roughness = roughness;
    m.color.set(tint ?? (resin ? '#c8202a' : metal.color));
    m.needsUpdate = true;
    finishName = name;
    return api;
  }

  function setAccent(glow) {
    mats.eye.map = null;
    mats.eye.color.set('#000000');
    Object.assign(mats.eye, { emissive: new GFX.Color(glow), emissiveIntensity: 2.4, roughness: 0.2 });
    mats.eye.needsUpdate = true;
    accentColor = glow;
    return api;
  }

  // No mouth to speak of: the teeth, gums and tongue go dark steel, the lashes away.
  for (const n of ['teeth', 'gums', 'tongue']) Object.assign(mats[n], { map: null, metalness: 1, roughness: 0.4, clearcoat: 0 }), mats[n].color.set('#2a2d33');
  mats.lash.visible = false;

  const api = Object.assign(Object.create(human), {
    human,
    /** Resin or metal; `{ color, roughness }` to tint or adjust it. */
    setFinish,
    setAccent,
    get finish() { return finishName; },
    get accent() { return accentColor; },
    finishes: ['resin', ...Object.keys(METALS)],
  });
  setFinish(finish, { color });
  setAccent(accent);
  return api;
}
