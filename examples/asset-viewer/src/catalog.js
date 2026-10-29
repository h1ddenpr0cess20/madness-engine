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
import { bake, createModel, createStatic } from '../../../src/models/model.js';
import { createBuildings, FOOTPRINTS } from '../../../src/buildings/index.js';
import { CALIFORNIA_FOOTPRINTS } from '../../../src/buildings/california.js';
import { MOODS } from '../../../src/moods/index.js';
import { tiled } from '../../../src/textures/painters.js';
import { dress, extraItems } from './extras.js';

const sculpted = import.meta.glob('../../../src/{characters,props,scenery}/**/*.js');
const textures = import.meta.glob('../../../src/textures/**/*.js');

const isDef = (v) => v && typeof v === 'object' && typeof v.sculpt === 'function' && Array.isArray(v.bones);
const where = (path) => path.replace('../../../src/', '');
const stem = (path) => where(path).split('/').pop().replace(/\.js$/, '');
const CLIPS = ['idle', 'walk', 'attack', 'cast', 'hit', 'ko', 'win'];
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

/** A sculpted definition: animated if it has `animate`, a still prop if not. */
function sculptedItem(def, category, group, name, source) {
  return {
    id: source, category, group, name, source, kind: 'object',
    build({ detail = 1 }) {
      const data = bake(def, { detail });
      const info = {
        Source: source,
        Vertices: data.count,
        Triangles: data.index.length / 3,
        'Vertex budget': `${def.budget ?? 9000} (${Math.round((data.count / (def.budget ?? 9000)) * 100)}% used)`,
        Materials: Object.keys(def.materials).join(', '),
        Bones: def.bones.length,
        Scale: def.scale ?? 1,
      };
      if (typeof def.animate === 'function') {
        const m = createModel(GFX, def, { detail });
        const pose = (s) => m.pose(s);
        pose({ clip: 'idle', t: 0, time: 0, seed: 1, speed: 1 });
        return { object: m.group, pose, clips: CLIPS, info };
      }
      return { object: createStatic(GFX, def, { detail }), info };
    },
  };
}

/** Heroes are made by functions; each returns something with the group to draw somewhere inside it. */
const objectOf = (r) => (r?.isObject3D ? r : r?.group ?? r?.player ?? r?.marble ?? r?.hamster ?? r?.mesh ?? r);
const HEROES = [
  ['marble', () => import('../../../src/heroes/marble.js').then((m) => m.createMarble(GFX))],
  ['die (d20)', () => import('../../../src/heroes/die.js').then((m) => m.dieModel(GFX))],
  ['hamster in ball', () => import('../../../src/heroes/hamster.js').then((m) => m.createPlayer(GFX))],
  ['hamster', () => import('../../../src/heroes/hamster.js').then((m) => m.createHamster(GFX))],
  ['mace', () => import('../../../src/heroes/mace.js').then((m) => m.createMace(GFX))],
  ['morningstar', () => import('../../../src/heroes/morningstar.js').then((m) => m.createMorningStar(GFX))],
  ['rock', () => import('../../../src/heroes/rock.js').then((m) => m.createRock(GFX))],
  ['boulder', () => import('../../../src/heroes/boulder.js').then((m) => m.createRock(GFX))],
  ['ball (mace player)', () => import('../../../src/heroes/ball.js').then((m) => m.createPlayer(GFX))],
  ['die (nat d20)', () => import('../../../src/heroes/nat/geometry.js').then((m) => m.createDie(GFX))],
  ['yarn ball', () => import('../../../src/heroes/yarn/model.js').then((m) => m.createYarn(GFX))],
];

function heroItem([name, make]) {
  return {
    id: `heroes/${name}`, category: 'Heroes', group: 'heroes', name, source: 'heroes', kind: 'object',
    async build() {
      const made = await make();
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      return { object, info: { Source: 'heroes', ...countOf(object) } };
    },
  };
}

function buildingItems() {
  const buildings = createBuildings();
  const sizes = { ...FOOTPRINTS, ...CALIFORNIA_FOOTPRINTS };
  return buildings.types().map((type) => ({
    id: `buildings/${type}`, category: 'Buildings', group: 'buildings', name: type, source: 'buildings', kind: 'object',
    options: { level: [1, 2, 3], variant: [0, 1, 2, 3, 4, 5, 6, 7], construction: [0, 0.25, 0.5, 0.75] },
    build({ level = 1, variant = 0, construction = 0, lights = [] }) {
      const model = buildings.modelFor(type, construction ? { level, variant, building: true, progress: construction } : { level, variant });
      const group = new GFX.Group();
      for (const [mat, p] of Object.entries(model.parts)) {
        const g = new GFX.BufferGeometry();
        g.setAttribute('position', new GFX.BufferAttribute(p.pos, 3));
        g.setAttribute('normal', new GFX.BufferAttribute(p.nor, 3));
        g.setAttribute('color', new GFX.BufferAttribute(p.col, 3));
        const m = new GFX.Mesh(g, new GFX.MeshStandardMaterial({ name: mat, vertexColors: true, roughness: 0.85, side: GFX.DoubleSide }));
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
    id, category: 'Textures', group: source, name, source, kind: 'object',
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
    id, category, group: source, name, source, kind: category === 'Skies' ? 'sky' : 'room',
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

/** Walks the library and returns every item, in category order. */
export async function loadCatalog(onProgress = () => {}) {
  const items = [];
  const seen = new Set();
  let n = 0;
  const total = Object.keys(sculpted).length + Object.keys(textures).length;

  for (const [path, load] of Object.entries(sculpted)) {
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
        const label = direct && key === 'default' ? file : direct ? (file.startsWith(key) || key === def.name ? file : `${file} · ${key}`) : `${file} · ${k}`;
        const source = `${where(path)}${direct && key === 'default' ? '' : `#${direct ? key : `${key}.${k}`}`}`;
        items.push(sculptedItem(def, CATEGORY[folder], group, folder === 'scenery' ? `${file}${direct && key !== 'default' ? ` · ${key}` : direct ? '' : ` · ${k}`}` : label, source));
      }
    }
  }
  items.push(...HEROES.map(heroItem));
  items.push(...buildingItems());

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
        if (typeof fn !== 'function') continue;
        items.push(textureItem(`textures/${file}#${key}.${k}`, `${k} (${key.toLowerCase()})`, where(path), () => fn(GFX)));
      }
    }
  }

  items.push(...FIXTURES.map(fixtureItem), ...extraItems());
  items.push(...Object.entries(MOODS).map(moodItem));
  const order = ['Characters', 'Props', 'Scenery & vehicles', 'Heroes', 'Lights', 'Flora', 'Water', 'Effects', 'Dungeon', 'Buildings', 'Textures', 'Skies', 'Rooms', 'Moods'];
  return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}
