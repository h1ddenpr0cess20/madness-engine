/**
 * Every asset in the repo, found rather than listed: the sculpted definitions
 * (characters, props, vehicles, street furniture) are whatever the modules
 * export that has a `sculpt` and `bones`, so a new file shows up by itself.
 * The rest (heroes, buildings, textures, skies, rooms, moods) have a loader each.
 *
 * An item is { id, category, group, name, source, kind, build(opts) }. `build`
 * returns { object, pose?, clips?, info } for the viewer to stand up.
 */
import * as GFX from '../../../src/gfx/index.js';
import { adopt, bake, createModel, createStatic, hasBake } from '../../../src/models/model.js';
import { createBuildings, FOOTPRINTS } from '../../../src/buildings/index.js';
import { CALIFORNIA_FOOTPRINTS } from '../../../src/buildings/california.js';
import { MOODS } from '../../../src/moods/index.js';
import { tiled } from '../../../src/textures/painters.js';
import { DICE_TYPES, createDieProp } from '../../../src/dice.js';
import { createBowlingBall } from '../../../src/props/bowling-ball.js';
import { dress, extraItems } from './extras.js';

const sculpted = import.meta.glob('../../../src/{characters,props,scenery}/**/*.js');
const textures = import.meta.glob('../../../src/textures/**/*.js');

// Street furniture (trees, lamps, benches) has no skeleton: it stands on one root bone.
const isDef = (v) => v && typeof v === 'object' && typeof v.sculpt === 'function' && (Array.isArray(v.bones) || v.bones === undefined);
const rooted = (def) => (def.bones ? def : { ...def, bones: [['root', null, [0, 0, 0]]] });
const where = (path) => path.replace('../../../src/', '');
const stem = (path) => where(path).split('/').pop().replace(/\.js$/, '');
const CLIPS = ['idle', 'walk', 'run', 'attack', 'cast', 'hit', 'ko', 'win', 'jump', 'leap', 'sit'];
const CATEGORY = { characters: 'Characters', props: 'Props', scenery: 'Scenery & vehicles' };

/** The bounding box of everything drawn in `object`, in its own units, as { min, max, size }. */
export function boundsOf(object) {
  object.updateMatrixWorld(true);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const v = new GFX.Vector3();
  object.traverse((o) => {
    const p = o.geometry?.attributes?.position;
    if (!p || o.visible === false) return;
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(o.matrixWorld);
      for (let a = 0; a < 3; a++) { const c = [v.x, v.y, v.z][a]; if (c < min[a]) min[a] = c; if (c > max[a]) max[a] = c; }
    }
  });
  if (min[0] === Infinity) return { min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5], size: [1, 1, 1] };
  return { min, max, size: max.map((c, i) => c - min[i]) };
}

function countOf(object) {
  let vertices = 0, triangles = 0;
  object.traverse((o) => {
    const g = o.geometry;
    if (!g?.attributes?.position) return;
    vertices += g.attributes.position.count;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return { vertices, triangles: Math.round(triangles) };
}

/** Which shelf a character goes on: people (on the shared body), or the animals and monsters. */
function kindOf(def) {
  const names = new Set((def.bones ?? []).map(([n]) => n));
  if (names.has('thighL') && names.has('armL') && names.has('head')) return 'people';
  return 'animals & monsters';
}

/** A painter's file as a shelf's name: `venue (rocknroller-ii)` for `textures/venue.rocknroller-ii.js`. */
const shelf = (path) => {
  const name = path.split('/').pop().replace(/\.js$/, '');
  const [base, game] = name.split('.');
  const dir = path.split('/').slice(0, -1).join('/');
  return `${dir ? `${dir} ` : ''}${base}${game ? ` (${game})` : ''}`;
};

/**
 * Bakes off the page's thread (bake.worker.js), so that a big model never freezes the page: one worker, kept, its
 * jobs taken in turn. Resolves to the mesh's arrays, to `adopt`.
 */
let baker = null, jobs = 0;
const pending = new Map();
function bakeElsewhere(job) {
  if (typeof Worker === 'undefined') return Promise.reject(new Error('no workers here'));
  if (!baker) {
    baker = new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' });
    baker.onmessage = ({ data: { id, data, error } }) => {
      const p = pending.get(id);
      pending.delete(id);
      if (error) p?.reject(new Error(error));
      else p?.resolve(data);
    };
    baker.onerror = (e) => {
      for (const p of pending.values()) p.reject(new Error(e.message || 'the bake worker failed'));
      pending.clear();
      baker = null;
    };
  }
  const id = ++jobs;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    baker.postMessage({ id, ...job });
  });
}

/**
 * A sculpted definition: animated if it has `animate`, a still prop if not. `job` says where it is found ({ path,
 * key, sub }), for the worker to bake it; if it can't, it is baked here.
 */
function sculptedItem(def, category, group, name, source, job = null) {
  // A person can be shown in other colours (characters/person.js `variant`): `palette` says which, and `colours` is the
  // viewer's choice of them, { skin, hair, eyes, brow, look: { torso, ... }, colors }.
  const people = typeof def.variant === 'function' && typeof def.palette === 'function';
  return {
    id: source, category, group, name, source, kind: 'object',
    palette: people ? def.palette() : null,
    async build({ detail = 1, colours = null }) {
      const shown = people && colours && Object.keys(colours).length ? def.variant(colours) : def;
      if (job && !hasBake(shown, detail)) {
        try { adopt(shown, detail, await bakeElsewhere({ ...job, detail, colours })); } catch (err) { console.warn(`${source}: baked here instead (${err.message})`); }
      }
      const data = bake(shown, { detail });
      const info = {
        Source: source,
        Vertices: data.count,
        Triangles: data.index.length / 3,
        'Vertex budget': `${shown.budget ?? 9000} (${Math.round((data.count / (shown.budget ?? 9000)) * 100)}% used)`,
        Materials: Object.keys(shown.materials).join(', '),
        Bones: shown.bones.length,
        Scale: shown.scale ?? 1,
      };
      if (typeof shown.animate === 'function') {
        const m = createModel(GFX, shown, { detail });
        const pose = (s) => m.pose(s);
        pose({ clip: 'idle', t: 0, time: 0, seed: 1, speed: 1 });
        return { object: m.group, pose, clips: CLIPS, info };
      }
      return { object: createStatic(GFX, shown, { detail }), info };
    },
  };
}

/** Heroes are made by functions; each returns something with the group to draw somewhere inside it. */
const objectOf = (r) => (r?.isObject3D ? r : r?.group ?? r?.player ?? r?.marble ?? r?.hamster ?? r?.root ?? r?.mesh ?? r);
const HEROES = [
  ['marble', () => import('../../../src/heroes/marble.js').then((m) => m.createMarble(GFX))],
  ['die (d20)', () => import('../../../src/heroes/die.js').then((m) => m.dieModel(GFX))],
  ['hamster in ball', () => import('../../../src/heroes/hamster.js').then((m) => m.createPlayer(GFX))],
  ['hamster', () => import('../../../src/heroes/hamster.js').then((m) => m.createHamster(GFX))],
  ['morningstar', () => import('../../../src/heroes/morningstar.js').then((m) => m.createMorningStar(GFX))],
  ['rock', () => import('../../../src/heroes/rock.js').then((m) => m.createRock(GFX))],
  ['die (nat d20)', () => import('../../../src/heroes/nat/geometry.js').then((m) => m.createDie(GFX))],
  ['yarn ball', () => import('../../../src/heroes/yarn/model.js').then((m) => m.createYarn(GFX))],
  ['tater (debater)', () => import('../../../src/heroes/tater/index.js').then((m) => m.createPotato({ GFX }))],
  ['egg (debater)', () => import('../../../src/heroes/debater-egg/index.js').then((m) => m.createEgg({ GFX }))],
  ['alan', () => avatar('../../../src/heroes/alan/index.js', 'createAlan')],
  ['vibey', () => avatar('../../../src/heroes/vibey/index.js', 'createStar')],
  ['slimey', () => avatar('../../../src/heroes/slimey/index.js', 'createSlimeOrb')],
  // Floating at its own height, framed on the berry rather than on its halos, which spread far wider.
  ['blubber', () => import('../../../src/heroes/blubber.js').then((m) => {
    const b = m.createBlubber(GFX, { size: 1 });
    b.group.position.y = 0.75;
    return Object.assign(b, { frame: { center: [0, 0.75, 0], radius: 0.62 } });
  })],
];

/** The avatar apps' models, made on a stand-in for their stage (heroes/standin.js). */
const avatars = import.meta.glob('../../../src/heroes/{vibey,slimey,krystal,alan}/index.js');
async function avatar(path, fn) {
  const [{ standIn }, mod] = await Promise.all([import('../../../src/heroes/standin.js'), avatars[path]()]);
  const { group, stage } = standIn(GFX, globalThis.assetViewer?.renderer ?? null);
  // Its night painted at half the width the app paints it: a quarter of the work, and still sharp behind it here.
  const made = mod[fn]({ stage, GFX, sky: 2048 });
  // Shown where it lives: what it reflects is what it set for its own stage, and its sky is its backdrop's.
  let sky = null;
  stage._scene.traverse((o) => { if (o.name === 'backdrop' && o.material?.map?.image) sky = o.material.map.image; });
  return { group, made, environment: stage._scene.environment ?? null, sky };
}
/** What an avatar brings with it to be shown in: its reflections and its sky. */
const dressOf = (made) => ({ environment: made?.environment ?? null, sky: made?.sky ?? null });

/**
 * Props that move as a part of what they are: Krystal, the crystal ball, its cloud turning and churning inside it.
 * And the debate's frying pan, which is a prop but not a sculpt.
 */
const MOVING = [
  ['krystal', 'Animated props', 'crystal ball', () => avatar('../../../src/heroes/krystal/index.js', 'createKrystal')],
  ['frying pan', 'Props', 'debater', () => import('../../../src/props/pan/index.js').then((m) => m.buildPan(GFX))],
];
function movingItem([name, category, group, make]) {
  return {
    id: `${category === 'Props' ? 'props' : 'animated'}/${name}`, category, group, name, source: category === 'Props' ? 'props/pan' : `heroes/${name}`, kind: 'object',
    async build() {
      const made = await make();
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      return { object, ...dressOf(made), info: { Source: category === 'Props' ? 'props/pan' : `heroes/${name}`, ...countOf(object) } };
    },
  };
}

function heroItem([name, make, palette = null]) {
  return {
    id: `heroes/${name}`, category: 'Heroes', group: 'heroes', name, source: 'heroes', kind: 'object', palette,
    async build({ colours = {} } = {}) {
      const made = await make(colours);
      // Those that are posed by how far they have come (the yarn ball, its strand laid out behind it) are shown a little way along.
      made?.pose?.(1.2);
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      // Those moved on by the game loop with nothing but the time (Blubber) are moved on by the viewer's.
      let last = 0;
      const pose = typeof made?.update === 'function' && made.update.length === 1 ? ({ time }) => { made.update(Math.max(0, time - last)); last = time; } : undefined;
      pose?.({ time: 0.016 });
      return { object, pose, frame: made?.frame, ...dressOf(made), info: { Source: 'heroes', ...countOf(object) } };
    },
  };
}

function buildingItems() {
  const buildings = createBuildings();
  const sizes = { ...FOOTPRINTS, ...CALIFORNIA_FOOTPRINTS };
  return buildings.types().map((type) => ({
    id: `buildings/${type}`, category: 'Buildings', group: type in CALIFORNIA_FOOTPRINTS ? 'california' : 'medieval town', name: type, source: 'buildings', kind: 'object',
    options: { level: [1, 2, 3], variant: [0, 1, 2, 3, 4, 5, 6, 7], construction: [0, 0.25, 0.5, 0.75] },
    build({ level = 1, variant = 0, construction = 0, lights = [] }) {
      const model = buildings.modelFor(type, construction ? { level, variant, building: true, progress: construction } : { level, variant });
      const group = new GFX.Group();
      for (const [mat, p] of Object.entries(model.parts)) {
        const g = new GFX.BufferGeometry();
        g.setAttribute('position', new GFX.BufferAttribute(p.pos, 3));
        g.setAttribute('normal', new GFX.BufferAttribute(p.nor, 3));
        g.setAttribute('color', new GFX.BufferAttribute(p.col, 3));
        const m = new GFX.Mesh(g, new GFX.MeshStandardMaterial({ name: mat, vertexColors: true, roughness: 0.85 }));
        m.castShadow = m.receiveShadow = true;
        group.add(m);
      }
      const [w, d] = sizes[type] ?? [1, 1];
      return {
        object: group,
        pose: dress(model, group, lights),
        info: { Source: 'buildings', Footprint: `${w} × ${d} tiles`, Materials: Object.keys(model.parts).join(', '), ...countOf(group), Lights: model.lights.length, 'Moving parts': model.anim.length, Smokes: model.smoke.length },
        footprint: [w, d],
      };
    },
  }));
}

/** A painter's result ({ map, bump }) laid on a slab, repeated so the tiling shows. */
function textureItem(id, name, source, make) {
  return {
    id, category: 'Textures', group: shelf(source.replace(/^textures\//, '')), name, source, kind: 'object',
    async build() {
      const t = await make();
      const map = t?.map ?? (t?.isTexture ? t : null);
      if (!map) throw new Error('This painter did not give a map');
      const repeat = (x) => (x ? tiled(GFX, x, 2, 2) : null);
      const mesh = new GFX.Mesh(new GFX.BoxGeometry(2, 0.1, 2), new GFX.MeshStandardMaterial({ map: repeat(map), bumpMap: repeat(t.bump), bumpScale: 0.6, roughness: 0.8 }));
      mesh.position.y = 0.05;
      mesh.castShadow = mesh.receiveShadow = true;
      const size = map.image ? `${map.image.width} × ${map.image.height}` : '?';
      return { object: mesh, info: { Source: source, Size: size, Bump: t.bump ? 'yes' : 'no' }, flat: true };
    },
  };
}

/** A painted canvas (sky or room): worn as the backdrop and the reflections of a chrome ball. */
function paintedItem(category, id, name, source, paint) {
  return {
    id, category, group: category === 'Skies' ? 'backdrops' : 'rooms', name, source, kind: category === 'Skies' ? 'sky' : 'room',
    async build() {
      const canvas = await paint();
      if (!canvas) throw new Error('No canvas came back');
      const ball = new GFX.Mesh(new GFX.SphereGeometry(0.6, 64, 32), new GFX.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.05 }));
      ball.position.y = 0.6;
      return { object: ball, canvas, info: { Source: source, Size: `${canvas.width} × ${canvas.height}` } };
    },
  };
}

/** The light fixtures of scenery/lightshow.js: each alone over a flat floor, lit and moving on the beat like in a set. */
const FIXTURES = [
  ['bulb', 'Caged bulb'], ['par', 'PAR can'], ['spot', 'Moving head spotlight'], ['strobe', 'Strobe'], ['ball', 'Mirror ball'],
  ['laser', 'Laser'], ['chandelier', 'Chandelier'], ['festoon', 'Festoon lights'], ['neon', 'Neon sign'], ['klieg', 'Searchlight'],
  ['blinds', 'Venetian blind light'], ['marquee', 'Marquee'], ['streetlamp', 'Street lamp'],
];

/** Lights that would point straight down are turned to throw across the floor, as the house lights in a set are. */
const AIM = { par: { aim: [2.4, 1.2] }, spot: { aim: [2.4, 1.2] } };

function fixtureItem([kind, name]) {
  return {
    id: `lights/${kind}`, category: 'Lights', group: 'lights', name, source: 'scenery/lightshow.js', kind: 'object',
    async build({ lights = [] } = {}) {
      const { createLightshow } = await import('../../../src/scenery/lightshow.js');
      const tempo = 120;
      const venue = {
        name: 'viewer', tempo, lowest: 0, palette: {}, look: {}, lamps: [],
        heightAt: () => 0,
        cell: () => ({ kind: 'floor', h: [0, 0, 0, 0] }),
        fixtures: [{ kind, x: 0, z: 0, ...AIM[kind] }],
      };
      const show = createLightshow(GFX, venue);
      const pose = ({ time }) => show.update({ time, beat: (time * tempo) / 60, troll: [0, 0, 0], lights, flashing: true });
      pose({ time: 0 });
      return { object: show.group, pose, dark: true, info: { Source: 'scenery/lightshow.js', Kind: kind, 'Real lights': lights.length, Tempo: `${tempo} bpm` } };
    },
  };
}

function moodItem([name, mood]) {
  return {
    id: `moods/${name}`, category: 'Moods', group: mood.game ?? 'moods', name: `${name} — ${mood.name ?? ''}`, source: 'moods', kind: 'mood', mood,
    async build() {
      const { default: punk } = await import('../../../src/characters/punk.js');
      const m = createModel(GFX, punk, { detail: 0.5 });
      m.pose({ clip: 'idle', t: 0, time: 0, seed: 1, speed: 1 });
      return { object: m.group, pose: (s) => m.pose(s), clips: CLIPS, info: { Source: 'moods', Game: mood.game ?? '?', Weather: mood.weather ?? 'none', Music: mood.music?.theme ?? 'none', Film: mood.film?.grade ?? mood.film?.filter ?? 'none' } };
    },
  };
}


/** The RPG dice are still props, but use their own faceted geometry rather than the sculpt baker. */
function diceItems() {
  return DICE_TYPES.map(({ id, label, faceCount, range }) => ({
    id: 'props/dice/' + id,
    category: 'Props',
    group: 'dice',
    name: label + ' — RPG die',
    source: 'props/dice',
    kind: 'object',
    dieType: id,
    palette: {
      kind: 'dice',
      color: '#3a3350',
      markingColor: '#e7e0f7',
      ...(id === 'd20' ? { highlightColor: '#ffd479' } : {}),
    },
    build({ colours = {} } = {}) {
      const made = createDieProp(GFX, id, colours);
      return {
        object: made.group,
        info: { Source: 'props/dice', Shape: label, Faces: faceCount, Values: range, Material: 'resin' },
      };
    },
  }));
}

/** A standalone resin bowling ball, kept on the Props shelf beside the dice. */
function bowlingBallItems() {
  return [{
    id: 'props/bowling-ball',
    category: 'Props',
    group: 'balls',
    name: 'Bowling ball',
    source: 'props/bowling-ball',
    kind: 'object',
    palette: {
      kind: 'bowling-ball',
      design: 'marble',
      base: '#192d59',
      swirl: '#d83b7c',
      accent: '#f2ba64',
      holes: '#090d18',
    },
    build({ colours = {} } = {}) {
      const made = createBowlingBall(GFX, { colors: colours, design: colours.design ?? 'marble' });
      return {
        object: made.group,
        info: { Source: 'props/bowling-ball', Design: made.design, ...countOf(made.group) },
      };
    },
  }];
}

/** Walks the library and returns every item, in category order. */
export async function loadCatalog(onProgress = () => {}) {
  const items = [];
  const seen = new Set();
  let n = 0;
  const total = Object.keys(sculpted).length + Object.keys(textures).length;

  // Defaults before their versions: where a version is only the default under another name (rat.dungeon-roller), the
  // one model is listed once, under its own name.
  const isVersion = (path) => stem(path).includes('.');
  const files = Object.entries(sculpted).sort(([a], [b]) => isVersion(a) - isVersion(b));
  for (const [path, load] of files) {
    onProgress(++n / total);
    const file = stem(path);
    if (file === 'index') continue;
    let mod;
    try { mod = await load(); } catch (err) { console.warn(`${where(path)}: ${err.message}`); continue; }
    const folder = where(path).split('/')[0];
    const group = folder === 'scenery' ? file.split('.')[0] : folder;
    for (const [key, value] of Object.entries(mod)) {
      const defs = isDef(value) ? [[key, value]] : value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).filter(([, v]) => isDef(v)) : [];
      for (const [k, def] of defs) {
        if (seen.has(def)) continue;
        seen.add(def);
        const direct = value === def;
        // Its own name: the file's, for a file of one thing (or its default); the export's, for one of several
        // things in a file (halloween.js has a haybale, a scarecrow, a coffin...), with the file's name only where
        // the export's is no name of its own.
        const own = (name) => (name === def.name || file === name || file.startsWith(`${name}.`) ? (file.startsWith(`${name}.`) ? file : name) : `${file} · ${name}`);
        const label = direct && key === 'default' ? file : own(direct ? key : k);
        const source = `${where(path)}${direct && key === 'default' ? '' : `#${direct ? key : `${key}.${k}`}`}`;
        items.push(sculptedItem(rooted(def), CATEGORY[folder], folder === 'characters' ? kindOf(def) : group, folder === 'scenery' ? `${file}${direct && key !== 'default' ? ` · ${key}` : direct ? '' : ` · ${k}`}` : label, source, { path, key, sub: direct ? null : k }));
      }
    }
  }
  items.push(...HEROES.map(heroItem), ...MOVING.map(movingItem));
  items.push(...diceItems(), ...bowlingBallItems());
  items.push(...buildingItems());

  // A painter re-exported from another file (venue.js passes the floors and walls of painters.js on) is listed once.
  const painted = new Set();
  for (const [path, load] of Object.entries(textures)) {
    onProgress(++n / total);
    let mod;
    try { mod = await load(); } catch (err) { console.warn(`${where(path)}: ${err.message}`); continue; }
    const file = where(path).replace(/^textures\//, '').replace(/\.js$/, '');
    if (typeof mod.paintSky === 'function' && path.includes('/skies/')) items.push(paintedItem('Skies', `skies/${file}`, file.replace(/^skies\//, ''), where(path), () => mod.paintSky()));
    if (typeof mod.paintRoom === 'function' && path.includes('/rooms/')) items.push(paintedItem('Rooms', `rooms/${file}`, file.replace(/^rooms\//, ''), where(path), () => mod.paintRoom()));
    for (const [key, value] of Object.entries(mod)) {
      if (!/^[A-Z_]+$/.test(key) || !value || typeof value !== 'object') continue;
      for (const [k, fn] of Object.entries(value)) {
        if (typeof fn !== 'function' || painted.has(fn)) continue;
        painted.add(fn);
        items.push(textureItem(`textures/${file}#${key}.${k}`, `${k} (${key.toLowerCase()})`, where(path), () => fn(GFX)));
      }
    }
  }

  items.push(...FIXTURES.map(fixtureItem), ...extraItems());
  items.push(...Object.entries(MOODS).map(moodItem));
  const order = ['Characters', 'Props', 'Animated props', 'Stage gear', 'Scenery & vehicles', 'Heroes', 'Lights', 'Flora', 'Water', 'Effects', 'Dungeon', 'Buildings', 'Textures', 'Skies', 'Rooms', 'Moods'];
  // By category, and within one by shelf, so that each shelf's things are together under its heading.
  return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
}
