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
import { createBowlingPin } from '../../../src/props/bowling-pin.js';
import { METALS as METAL_FINISHES } from '../../../src/props/metalglobe.js';
import { WOOD_FINISHES, WOOD_SPECIES } from '../../../src/textures/wood.js';
import { STAFF_TOPPERS } from '../../../src/weapons/staff.js';
import { GRANITE_CHOICES } from '../../../src/heroes/rock-granite.js';
import { JEWEL_CHOICES } from '../../../src/heroes/rock-jewel.js';
import { dress, extraItems } from './extras.js';
import { WEAPON_ASSETS, weaponShelf } from './weapon-assets.js';
import { RANGE } from '../../../src/weapons/categories.js';

const sculpted = import.meta.glob('../../../src/{characters,props,scenery}/**/*.js');
const proceduralProps = import.meta.glob(['../../../src/props/*.js', '../../../src/props/**/*.js']);
const textures = import.meta.glob('../../../src/textures/**/*.js');

// Street furniture (trees, lamps, benches) has no skeleton: it stands on one root bone.
const isDef = (v) => v && typeof v === 'object' && typeof v.sculpt === 'function' && (Array.isArray(v.bones) || v.bones === undefined);
const rooted = (def) => (def.bones ? def : { ...def, bones: [['root', null, [0, 0, 0]]] });
const where = (path) => path.replace('../../../src/', '');
const stem = (path) => where(path).split('/').pop().replace(/\.js$/, '');
const CLIPS = ['idle', 'walk', 'run', 'attack', 'cast', 'hit', 'ko', 'win', 'jump', 'leap', 'sit', 'talk'];
const CATEGORY = { characters: 'Characters', props: 'Props', scenery: 'Scenery & vehicles' };
export const METAL_CHOICES = Object.keys(METAL_FINISHES);

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


/** What was last written into the book, kept across rebuilds (a different page count makes a new book). */
let bookText = '';
const PAGE_CHOICES = Object.assign([20, 40, 80, 120, 200], { default: 80 });

/**
 * The Book of Madness, with what to try it with: open and turn it by buttons, by sliders (to see a hinge or a
 * leaf at any point of its travel), by clicking it or with the arrow keys; and its cloth, foil, emblem, trim,
 * paper, title and words to change. Everything it calls is the book's own API (props/book.js).
 */
async function bookItem(pages) {
  const m = await import('../../../src/props/book.js');
  const book = m.createBook(GFX, { pageCount: pages });
  let seed = 0;
  if (bookText.trim()) book.setText(bookText);
  const turned = () => book.leaves.reduce((n, l) => n + l.turn, 0);
  const named = (table) => Object.entries(table).map(([name, hex]) => [hex, name]);
  const style = (key) => ({ get: () => book.style[key], set: (v) => book.setStyle({ [key]: v }) });
  const ui = [
    { type: 'buttons', items: [
      { label: 'Open', onClick: () => book.open() }, { label: 'Close', onClick: () => book.close() },
      { label: '◀ Page', title: 'Turn back (←)', onClick: () => book.prev() }, { label: 'Page ▶', title: 'Turn on (→)', onClick: () => book.next() },
    ] },
    { type: 'range', label: 'Cover', min: 0, max: 1, step: 0.005, get: () => book.openness, set: (v) => book.pose({ open: v }) },
    { type: 'range', label: 'Leaf', min: 0, max: book.dimensions.leaves, step: 0.01, get: turned, set: (v) => book.pose({ open: 1, turn: v }) },
    { type: 'check', label: 'Autoplay', get: () => book.autoplay, set: (on) => { book.autoplay = on; } },
    { type: 'text', label: 'Title', ...style('title') },
    { type: 'text', label: 'Subtitle', ...style('subtitle') },
    { type: 'select', label: 'Cloth', options: named(m.CLOTHS), ...style('cloth') },
    { type: 'color', label: 'Any cloth', ...style('cloth') },
    { type: 'select', label: 'Foil', options: named(m.FOILS), ...style('foil') },
    { type: 'select', label: 'Emblem', options: m.EMBLEMS, ...style('emblem') },
    { type: 'select', label: 'Trim', options: m.TRIMS, ...style('trim') },
    { type: 'select', label: 'Paper', options: named(m.PAPERS), ...style('paper') },
    { type: 'check', label: 'Blood drips', ...style('drips') },
    { type: 'buttons', items: [
      { label: 'New ramblings', onClick: () => book.setPages(null, ++seed) },
      { label: 'Blank pages', onClick: () => book.setPages(() => '') },
    ] },
    { type: 'select', label: 'Writing', options: [['hand', "madman's hand"], ['print', 'plain print']], get: () => (book.style.print ? 'print' : 'hand'), set: (v) => book.setStyle({ print: v === 'print' }) },
    { type: 'textarea', label: 'Your own text: it is cut into pages as it is measured. A line is a paragraph, a blank line a gap; *stress*, ~strike~, #Heading.', apply: 'Write it in', value: bookText,
      onApply: (text) => {
        bookText = text;
        if (!text.trim()) { book.setStyle({ print: false }); book.setPages(null); return 'The madman is writing again.'; }
        const { pages: needed, fits } = book.setText(text);
        return fits ? `${needed} of ${book.pageCount} pages written.` : `That is ${needed} pages and this book has ${book.pageCount}: choose a larger Pages option (your text is kept).`;
      } },
  ];
  return {
    group: book.group,
    update: (dt) => book.update(dt),
    frame: { center: [0, 0.04, 0], radius: 0.42 },
    ui,
    click: (hit) => book.touch(book.group.worldToLocal(hit.point.clone()).x),
    key: (k) => (k === 'ArrowRight' ? (book.next(), true) : k === 'ArrowLeft' ? (book.prev(), true) : false),
    book,
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
  ['metal morningstar', ({ metal = 'steel' } = {}) => Promise.all([import('../../../src/heroes/morningstar.js'), import('../../../src/props/metalglobe.js')]).then(([h, m]) => Object.assign(
    h.createMetalMorningStar(GFX, { metal }),
    { environment: m.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null) },
  )), null, { metal: METAL_CHOICES }],
  ['rock', () => import('../../../src/heroes/rock.js').then((m) => m.createRock(GFX))],
  ['rock (granite)', ({ colour = 'grey' } = {}) => import('../../../src/heroes/rock-granite.js').then((m) => m.createGraniteRock(GFX, { colour })), null, { colour: GRANITE_CHOICES }],
  ['rock (jewel)', ({ colour = 'sapphire', mist = 'on' } = {}) => import('../../../src/heroes/rock-jewel.js').then((m) => m.createJewelRock(GFX, { colour, mist: mist === 'on' })), null, { colour: JEWEL_CHOICES, mist: ['on', 'off'] }],
  ['die (nat d20)', () => import('../../../src/heroes/nat/geometry.js').then((m) => m.createDie(GFX))],
  ['yarn ball', () => import('../../../src/heroes/yarn/model.js').then((m) => m.createYarn(GFX))],
  ['tater (debater)', () => import('../../../src/heroes/tater/index.js').then((m) => m.createPotato({ GFX }))],
  ['egg (debater)', () => import('../../../src/heroes/debater-egg/index.js').then((m) => m.createEgg({ GFX }))],
  ['metal egg (debater)', ({ metal = 'steel' } = {}) => Promise.all([import('../../../src/heroes/debater-egg/index.js'), import('../../../src/props/metalglobe.js')]).then(([h, m]) => Object.assign(
    h.createMetalEgg({ GFX, metal }),
    { environment: m.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null) },
  )), null, { metal: METAL_CHOICES }],
  ['glass egg (debater)', () => Promise.all([import('../../../src/heroes/debater-egg/index.js'), import('../../../src/props/metalglobe.js')]).then(([h, m]) => Object.assign(
    h.createGlassEgg({ GFX }),
    { environment: m.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null) },
  ))],
  ['alan', () => avatar('../../../src/heroes/alan/index.js', 'createAlan')],
  ['vibey', () => avatar('../../../src/heroes/vibey/index.js', 'createStar')],
  ['metal vibey', ({ metal = 'steel' } = {}) => avatar('../../../src/heroes/vibey/index.js', 'createMetalStar', { metal }), null, { metal: METAL_CHOICES }],
  ['slimey', () => avatar('../../../src/heroes/slimey/index.js', 'createSlimeOrb')],
  ['metal slimey', ({ metal = 'steel' } = {}) => avatar('../../../src/heroes/slimey/index.js', 'createMetalSlimeOrb', { metal }), null, { metal: METAL_CHOICES }],
  ['molten glass slimey', () => avatar('../../../src/heroes/slimey/index.js', 'createMoltenSlimeOrb')],
  ['lava slimey', () => avatar('../../../src/heroes/slimey/index.js', 'createLavaSlimeOrb')],
  // Floating at its own height, framed on the berry rather than on its halos, which spread far wider.
  ['blubber', () => import('../../../src/heroes/blubber.js').then((m) => {
    const b = m.createBlubber(GFX, { size: 1 });
    b.group.position.y = 0.75;
    return Object.assign(b, { frame: { center: [0, 0.75, 0], radius: 0.62 } });
  })],
];

/** The avatar apps' models, made on a stand-in for their stage (heroes/standin.js). */
const avatars = import.meta.glob('../../../src/heroes/{vibey,slimey,krystal,alan}/index.js');
async function avatar(path, fn, buildOptions = {}) {
  const [{ standIn }, mod] = await Promise.all([import('../../../src/heroes/standin.js'), avatars[path]()]);
  const { group, stage } = standIn(GFX, globalThis.assetViewer?.renderer ?? null);
  // Its night painted at half the width the app paints it: a quarter of the work, and still sharp behind it here.
  const made = mod[fn]({ stage, GFX, sky: 2048, ...buildOptions });
  // Shown where it lives: what it reflects is what it set for its own stage, and its sky is its backdrop's.
  let sky = null;
  stage._scene.traverse((o) => { if (o.name === 'backdrop' && o.material?.map?.image) sky = o.material.map.image; });
  return { group, made, environment: stage._scene.environment ?? null, sky };
}
/** What an avatar brings with it to be shown in: its reflections and its sky. */
const dressOf = (made) => ({ environment: made?.environment ?? null, sky: made?.sky ?? null });

/** A planet in glass, as the library makes it (props/glass-planets), at `radius` and on the frame the viewer shows it in. */
async function glassPlanet(name, radius) {
  const m = await import('../../../src/props/glass-planets.js');
  const globe = m.createGlassPlanet(GFX, name, { radius, ...(await m.loadGlassPlanetMaps(name)) });
  // The mesh, kept before `mist` below replaces it with the toggle: `get` reads the mesh, not the toggle.
  const mesh = globe.mist;
  return Object.assign(globe, { frame: { center: [0, 0, 0], radius: radius * 1.08 }, mist: { get: () => mesh.visible, set: (on) => globe.setMist({}, on) } });
}

/**
 * Props that move as a part of what they are: Krystal, the crystal ball, its cloud turning and churning inside it.
 * And the debate's frying pan, which is a prop but not a sculpt.
 */
const MOVING = [
  ['book', 'Animated props', 'book of madness', ({ pages = 80 } = {}) => bookItem(pages), 'props/book', { pages: PAGE_CHOICES }],
  ['krystal', 'Animated props', 'crystal ball', () => avatar('../../../src/heroes/krystal/index.js', 'createKrystal')],
  ['glass globe', 'Animated props', 'Earth', () => glassPlanet('earth', 0.6)],
  ['glass mars', 'Animated props', 'Mars', async () => glassPlanet('mars', 0.6 * (await import('../../../src/textures/mars/map.js')).SIZE_VS_EARTH)],
  ['glass moon', 'Animated props', 'Moon', async () => glassPlanet('moon', 0.6 * (await import('../../../src/textures/moon/map.js')).SIZE_VS_EARTH)],
  // Jupiter is shown at the Earth globe's size: 11 Earths across, too big to sit beside it. Its clouds are a photograph's, laid out on the sphere.
  ['glass jupiter', 'Animated props', 'Jupiter', () => glassPlanet('jupiter', 0.6)],
  ['glass jupiter etched', 'Animated props', 'Jupiter', () => glassPlanet('jupiter-etched', 0.6)],
  // The same planets in solid metal, their relief raised; the metal is the viewer's `metal` option.
  ...[
    ['metal earth', 'Earth', () => import('../../../src/textures/earth/map.js'), 'loadEarthRelief', [40, -95], {}, { bump: -8, soften: 0.6, height: 0.022, segments: [768, 512] }],
    ['metal mars', 'Mars', () => import('../../../src/textures/mars/map.js'), 'loadMarsEtch', [-5, -90], {}, {}],
    ['metal moon', 'Moon', () => import('../../../src/textures/moon/map.js'), 'loadMoonEtch', [0, 0], {}, {}],
    ['metal jupiter', 'Jupiter', () => import('../../../src/textures/jupiter/map.js'), 'loadJupiterEtch', [-22, 0], { relief: true }, { bump: -8, soften: 0.5, height: 0.03, segments: [640, 384] }],
  ].map(([name, group, load, loader, [lat, lon], args, look]) => [name, 'Animated props', group, ({ metal = 'steel' } = {}) => Promise.all([import('../../../src/props/metalglobe.js'), load()]).then(async ([m, t]) => {
    const size = t.SIZE_VS_EARTH ?? 1;
    // True size beside the Earth globe (the Moon, Mars), but Jupiter, 11 Earths across, at the Earth's.
    const radius = 0.6 * (name === 'metal jupiter' ? 1 : size);
    const globe = m.createMetalGlobe(GFX, { radius, relief: await t[loader](args), metal, ...look });
    globe.orient(lat, lon);
    globe.spinRate = 0.12;
    return Object.assign(globe, { frame: { center: [0, 0, 0], radius: radius * 1.08 }, environment: m.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null) });
  }), 'props/metalglobe', { metal: ['steel', 'silver', 'gold', 'copper', 'bronze', 'brass', 'titanium', 'chrome', 'platinum', 'rose gold', 'iron', 'pewter'] }]),
  // And in cast resin, as the dice are: the Earth blue and green, Mars red, the Moon a warm white.
  ...[
    ['resin earth', 'Earth', () => import('../../../src/textures/earth/map.js'), 'loadEarthRelief', [40, -95], { colors: { low: '#1c5fb5', high: '#2f9a58' } }],
    ['resin mars', 'Mars', () => import('../../../src/textures/mars/map.js'), 'loadMarsEtch', [-5, -90], { color: '#b8331f' }],
    ['resin moon', 'Moon', () => import('../../../src/textures/moon/map.js'), 'loadMoonEtch', [0, 0], { color: '#f2e7d0' }],
  ].map(([name, group, load, loader, [lat, lon], paint]) => [name, 'Animated props', group, () => Promise.all([import('../../../src/props/resinglobe.js'), import('../../../src/props/metalglobe.js'), load()]).then(async ([r, m, t]) => {
    const radius = 0.6 * (t.SIZE_VS_EARTH ?? 1);
    const globe = r.createResinGlobe(GFX, { radius, relief: await t[loader](), ...paint });
    globe.orient(lat, lon);
    globe.spinRate = 0.12;
    return Object.assign(globe, { frame: { center: [0, 0, 0], radius: radius * 1.08 }, environment: m.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null) });
  }), 'props/resinglobe']),
  ['frying pan', 'Props', 'debater', () => import('../../../src/props/pan/index.js').then((m) => m.buildPan(GFX))],
];
function proceduralPropItem(def, path) {
  const source = where(path);
  const name = def.name ?? stem(path).replaceAll('-', ' ');
  const category = def.category ?? 'Animated props';
  const group = def.group ?? 'props';
  return {
    id: `props/${def.id ?? stem(path)}`,
    category,
    group,
    name,
    source,
    kind: 'object',
    options: def.options ?? null,
    async build(opts = {}) {
      const made = await def.build({ GFX, ...opts, renderer: globalThis.assetViewer?.renderer ?? null });
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      // One that offers controls of its own (the bookcase's book) is moved on by the viewer's loop with the time.
      let last = 0;
      const pose = made?.ui && typeof made.update === 'function' ? ({ time }) => { made.update(Math.max(0, time - last)); last = time; } : undefined;
      return {
        object,
        pose,
        frame: made?.frame,
        mist: made?.mist,
        ui: made?.ui,
        click: made?.click,
        key: made?.key,
        made,
        ...dressOf(made),
        info: { Source: source, ...countOf(object) },
      };
    },
  };
}

function movingItem([name, category, group, make, from = null, options = null]) {
  const source = from ?? (category === 'Props' ? 'props/pan' : `heroes/${name}`);
  return {
    id: `${category === 'Props' ? 'props' : 'animated'}/${name}`, category, group, name, source, kind: 'object', options,
    async build(opts = {}) {
      const made = await make(opts);
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      // One that offers controls of its own (the book) is moved on by the viewer's loop with the time, as a hero is;
      // the other animated props move themselves.
      let last = 0;
      const pose = made?.ui && typeof made.update === 'function' ? ({ time }) => { made.update(Math.max(0, time - last)); last = time; } : undefined;
      return { object, pose, frame: made?.frame, mist: made?.mist, ui: made?.ui, click: made?.click, key: made?.key, made, ...dressOf(made), info: { Source: source, ...countOf(object) } };
    },
  };
}

function heroItem([name, make, palette = null, options = null]) {
  return {
    id: `heroes/${name}`, category: 'Heroes', group: 'heroes', name, source: 'heroes', kind: 'object', palette, options,
    async build({ colours = {}, ...buildOptions } = {}) {
      const made = await make({ ...colours, ...buildOptions });
      // Those that are posed by how far they have come (the yarn ball, its strand laid out behind it) are shown a little way along.
      made?.pose?.(1.2);
      const object = objectOf(made);
      if (!object?.isObject3D) throw new Error(`${name} did not give an object to draw`);
      // Those moved on by the game loop with nothing but the time (Blubber) are moved on by the viewer's.
      let last = 0;
      const pose = typeof made?.update === 'function' && made.update.length === 1 ? ({ time }) => { made.update(Math.max(0, time - last)); last = time; } : undefined;
      pose?.({ time: 0.016 });
      const mist = made?.mist && typeof made.setMist === 'function'
        ? { get: () => made.mist.visible, set: (on) => made.setMist(on) }
        : made?.mist;
      return { object, pose, frame: made?.frame, mist, ui: made?.ui, click: made?.click, key: made?.key, made, ...dressOf(made), info: { Source: 'heroes', ...countOf(object) } };
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

/** A standalone premium resin bowling pin, grouped beside the bowling ball. */
function bowlingPinItems() {
  return [{
    id: 'props/bowling-pin',
    category: 'Props',
    group: 'pins',
    name: 'Bowling pin',
    source: 'props/bowling-pin',
    kind: 'object',
    palette: {
      kind: 'bowling-pin',
      design: 'classic',
      base: '#f3f0e8',
      swirl: '#d9d5cb',
      accent: '#fffdf6',
      stripe: '#c51d2c',
    },
    build({ colours = {} } = {}) {
      const made = createBowlingPin(GFX, { colors: colours, design: colours.design ?? 'classic' });
      return {
        object: made.group,
        info: { Source: 'props/bowling-pin', Design: made.design, ...countOf(made.group) },
      };
    },
  }];
}

/** The Weapons shelf's entries are in weapon-assets.js; each one is shelved by its hands, or as ranged. */
function weaponItems() {
  return WEAPON_ASSETS.map(({
    id, factory, name, set, hands, paletteKind, grip, thread, metalGrip,
    bladeMetal: bladeMetalDefault, hiltMetal: hiltMetalDefault, metal: metalDefault, granite: graniteDefault,
  }) => ({
    id,
    category: 'Weapons',
    group: weaponShelf({ hands }),
    name,
    source: 'weapons/variants',
    factory,
    kind: 'object',
    palette: {
      kind: paletteKind,
      grip: grip ?? '#633b2c',
      ...(metalGrip ? { metalGrip: true } : {}),
      ...(thread ? { thread } : {}),
      ...(bladeMetalDefault ? { bladeMetal: bladeMetalDefault } : {}),
      ...(hiltMetalDefault ? { hiltMetal: hiltMetalDefault } : {}),
      ...(metalDefault ? { metal: metalDefault } : {}),
      ...(graniteDefault ? { granite: graniteDefault, graniteChoices: GRANITE_CHOICES } : {}),
    },
    async build({
      bladeMetal = bladeMetalDefault ?? 'steel',
      hiltMetal = hiltMetalDefault ?? 'steel',
      metal = metalDefault ?? 'steel',
      colours = {},
    } = {}) {
      const [weapons, metals] = await Promise.all([
        import('../../../src/weapons/variants.js'),
        import('../../../src/props/metalglobe.js'),
      ]);
      const made = paletteKind === 'granite-weapon'
        ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
        : paletteKind === 'morningstar'
        ? weapons[factory](GFX, { metal, gripColor: colours.gripColor ?? grip ?? '#633b2c' })
        : weapons[factory](GFX, {
          bladeMetal,
          hiltMetal,
          gripColor: colours.gripColor ?? grip ?? '#633b2c',
          ...(thread ? { threadColor: colours.threadColor ?? thread } : {}),
        });
      return {
        object: made.group,
        environment: metals.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null),
        mist: made.bladeMist ? {
          get: () => made.bladeMist.visible,
          set: (on) => made.setBladeMist(on),
        } : null,
        info: { Source: `weapons/variants#${factory}`, Set: set, ...made.info, ...countOf(made.group) },
      };
    },
  }));
}

/** A staff topper's name for a menu: 'jupiter-etched' → 'Jupiter (etched)', 'orb' → 'Krystal orb'. */
const topperName = (t) => ({ orb: 'Krystal orb', egg: 'glass egg', 'jupiter-etched': 'Jupiter (etched)' }[t] ?? `${t[0].toUpperCase()}${t.slice(1)}`);

/** The staves for the human to hold: the wooden one with each topper, the metal one with the orb and the egg. */
const HUMAN_STAVES = [
  ...STAFF_TOPPERS.filter((t) => t !== 'none').map((t) => [`staff:wood:${t}`, `Wizard Staff, ${topperName(t)}`]),
  ...['orb', 'egg'].map((t) => [`staff:gold:${t}`, `Metal Wizard Staff, ${topperName(t)}`]),
];

/** The other things a human can carry: a book (open, to read), every hero (on the palm), the coins (between thumb and forefinger). */
const HUMAN_CARRIES = [
  ['book', 'Book of Madness, open'],
  ['book:shut', 'Book of Madness, shut'],
  ['bowling', 'Bowling ball'],
  ...HEROES.map(([name]) => [`hero:${name}`, `Hero: ${name}`]),
  // The planets, in glass, metal and resin.
  ...MOVING.filter(([name]) => /globe|earth|mars|moon|jupiter/.test(name)).map(([name]) => [`planet:${name}`, `Planet: ${name.replace('glass globe', 'glass earth')}`]),
  ['coin:claude', 'Coin: Claude'], ['coin:bitcoin', 'Coin: Bitcoin'], ['coin:political', 'Coin: political'],
];

/** Everything on the weapons shelf, and all else he can carry, for the human to hold. */
const HUMAN_WEAPONS = [['none', 'Nothing'], ...WEAPON_ASSETS.map((w) => [w.factory, w.name]), ...HUMAN_STAVES, ...HUMAN_CARRIES];
/** What the left hand can hold besides: a one-handed weapon (dual wielding), a hero or a coin. */
const HUMAN_LEFT = [['none', 'Nothing'], ...WEAPON_ASSETS.filter((w) => w.hands !== 'two-handed').map((w) => [w.factory, w.name]), ...HUMAN_CARRIES.filter(([v]) => v !== 'book')];

/**
 * Something for the human to carry from a `HUMAN_CARRIES` choice, at the size it is held at: { thing, how, open }.
 * A hero is a ball about 9 cm across on the palm; a coin 2.5 cm across, pinched (and flipped with the `flip`
 * clip); the book 13 cm a page, open in both hands or shut in one.
 */
async function humanCarry(choice) {
  if (choice === 'book' || choice === 'book:shut') {
    const { createBook } = await import('../../../src/props/book.js');
    return { thing: createBook(GFX, { size: 0.45, pageCount: 60 }), how: 'book', open: choice === 'book' };
  }
  // At its real size, 8.5 inches across (21.6 cm), held as a bowler holds it.
  if (choice === 'bowling') return { thing: createBowlingBall(GFX, { radius: 0.108, widthSegments: 256, heightSegments: 192 }), how: 'bowl' };
  if (choice.startsWith('coin:')) {
    const kind = choice.slice(5);
    const radius = 0.0125;
    if (kind === 'claude') {
      const [{ createCoin }, texture] = await Promise.all([import('../../../src/props/coin.js'), import('../../../src/textures/coin/logo.js')]);
      return { thing: createCoin(GFX, { radius, logo: await texture.loadCoinLogo() }), how: 'pinch' };
    }
    const mod = kind === 'bitcoin' ? await import('../../../src/props/bitcoin-coin.js') : await import('../../../src/props/political-coin.js');
    return { thing: (kind === 'bitcoin' ? mod.createBitcoinCoin : mod.createPoliticalCoin)(GFX, { radius }), how: 'pinch' };
  }
  // A hero, or a planet, on the palm, made by the same builder as on its own shelf, exactly as it is shown there,
  // and only made smaller (its mists follow its size): a ball about 9 cm across (a planet 10). Still: it does not
  // turn in his hand.
  const planet = choice.startsWith('planet:');
  const make = planet ? MOVING.find(([name]) => `planet:${name}` === choice)[3] : HEROES.find(([name]) => `hero:${name}` === choice)[1];
  const made = await make({});
  if (made && 'spinRate' in made) made.spinRate = 0;
  // An avatar (Alan) held still: it does not look about or float in his hand.
  if (made?.made && 'still' in made.made) made.made.still = true;
  made?.pose?.(0);
  // The yarn ball, wound up: in a hand there is no route for its strand to lie along, so none of it is laid out.
  if (made?.laid && made?.ball) made.laid.visible = false;
  const object = objectOf(made);
  object.position.set(0, 0, 0);
  // Sized by what of it is drawn: not the glow round it (Alan's aura and Vibey's halos are sprites several times
  // their width), nor the part of a strand not yet laid (the yarn ball's runs the whole of its route).
  const size = drawnSize(object);
  object.scale.multiplyScalar((planet ? 0.1 : 0.09) / Math.max(...size));
  return { thing: object, how: 'palm' };
}

/** How big `object` is as drawn: its visible meshes (not sprites), each only as far as its draw range goes. */
function drawnSize(object) {
  object.updateMatrixWorld(true);
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], v = new GFX.Vector3();
  object.traverseVisible((o) => {
    const g = o.geometry, p = g?.attributes?.position;
    if (!p || o.isSprite) return;
    const index = g.index?.array ?? null, { start = 0, count = Infinity } = g.drawRange ?? {};
    const to = Math.min(index ? index.length : p.count, start + count), step = Math.max(1, Math.floor((to - start) / 4000));
    for (let k = start; k < to; k += step) {
      const i = index ? index[k] : k;
      v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(o.matrixWorld);
      lo[0] = Math.min(lo[0], v.x); lo[1] = Math.min(lo[1], v.y); lo[2] = Math.min(lo[2], v.z);
      hi[0] = Math.max(hi[0], v.x); hi[1] = Math.max(hi[1], v.y); hi[2] = Math.max(hi[2], v.z);
    }
  });
  return Number.isFinite(lo[0]) ? hi.map((h, a) => h - lo[a]) : [0.1, 0.1, 0.1];
}

/** Something for a human's hand from a menu choice: a weapon, a staff, or anything carried. */
async function humanHeld(choice, weapons) {
  if (choice.startsWith('staff:')) return { thing: await humanStaff(choice), how: 'grip' };
  if (HUMAN_CARRIES.some(([v]) => v === choice)) return humanCarry(choice);
  return { thing: weapons[choice](GFX, {}), how: 'grip' };
}

/** A staff from a `staff:wood|gold:topper` choice, its planet's maps loaded first if it has one. */
async function humanStaff(choice) {
  const [, kind, topper] = choice.split(':');
  const [{ createStaff }, planets] = await Promise.all([
    import('../../../src/weapons/staff.js'),
    import('../../../src/props/glass-planets.js'),
  ]);
  const planetMaps = planets.GLASS_PLANET_NAMES.includes(topper) ? { [topper]: await planets.loadGlassPlanetMaps(topper) } : {};
  return createStaff(GFX, { ...(kind === 'gold' ? { metal: 'gold' } : {}), topper, planetMaps });
}

/** The real-size, dressable humans, a man and a woman: the wardrobe, the look, the face and hands, and a weapon from the shelf to hold. */
function humanItems() {
  return [humanItem('male'), humanItem('female')];
}

/** One figure's item: `sex` 'male' (bearded) or 'female' (long blonde hair). */
function humanItem(sex) {
  const female = sex === 'female';
  return {
    id: female ? 'people/human-female' : 'people/human',
    category: 'People',
    group: 'people',
    name: female ? 'Human, female (dressable base)' : 'Human (dressable base)',
    source: 'people/human',
    kind: 'object',
    async build() {
      const [{ createHuman, CLIPS: clips, garmentsFor, HAND_POSES, customizationFor }, { STANCES, MOVES, BOWS }, { DANCES }, weapons, metals] = await Promise.all([
        import('../../../src/people/human.js'),
        import('../../../src/people/human/martial.js'),
        import('../../../src/people/human/dance.js'),
        import('../../../src/weapons/variants.js'),
        import('../../../src/props/metalglobe.js'),
      ]);
      const man = createHuman(GFX, female ? { sex } : { beard: 'full' });
      let weapon = 'none', weaponL = 'none', attack = 'slash', handL = 'relaxed';
      let pair = man.glasses ?? 'aviator';
      const style = {};
      // (A staff, coin or hero may load first: only the latest choice for each hand is put in it.)
      const arming = { R: 0, L: 0 };
      const rearm = async (S = 'R') => {
        const mine = ++arming[S];
        const choice = S === 'R' ? weapon : weaponL;
        man.release(S);
        if (choice === 'none') return;
        const { thing, how, open = true } = await humanHeld(choice, weapons);
        if (mine !== arming[S]) return;
        // A book open takes both hands: whatever the left held is put down.
        if (how === 'book' && open) weaponL = 'none';
        man.hold(thing, { hand: S, how, open });
        // (A weapon made for two hands takes both: one in the other hand was put down.)
        if (!man.held(S === 'R' ? 'L' : 'R')) { if (S === 'R') weaponL = 'none'; else weapon = 'none'; }
      };
      const face = (key) => ({ type: 'range', label: key[0].toUpperCase() + key.slice(1), min: key === 'smile' || key === 'brows' ? -1 : 0, max: 1, step: 0.01, get: () => man.faceState[key], set: (v) => man.face({ [key]: v }) });
      const ui = [
        ...Object.keys(garmentsFor(sex)).map((g) => ({ type: 'check', label: g[0].toUpperCase() + g.slice(1), get: () => man.outfit.includes(g), set: (on) => (on ? man.wear(g) : man.remove(g)) })),
        // The sunglasses on or off at a click (which pair is chosen under Accessories, below).
        { type: 'check', label: 'Glasses', get: () => man.glasses !== null, set: (on) => { if (man.glasses) pair = man.glasses; man.customize({ glasses: on ? pair : 'none' }); } },
        { type: 'select', label: 'Holds', options: HUMAN_WEAPONS, get: () => weapon, set: (v) => { weapon = v; rearm('R'); } },
        // The left hand's own: a second weapon to wield both, a hero or a coin (not while reading a book).
        { type: 'select', label: 'Left holds', options: HUMAN_LEFT, get: () => weaponL, set: (v) => { weaponL = v; if (weapon === 'book') { weapon = 'none'; man.release('R'); } rearm('L'); } },
        { type: 'select', label: 'Attack', options: ['slash', 'chop', 'thrust', 'smite', 'punch', 'shove', ...MOVES], get: () => attack, set: (v) => { attack = v; style.attack = v; } },
        // The fighting clips: `stance` holds this form, `attack` makes the move from it, `bow` the bow.
        { type: 'select', label: 'Stance', options: ['(the move\'s own)', ...STANCES], get: () => style.stance ?? '(the move\'s own)', set: (v) => { style.stance = STANCES.includes(v) ? v : undefined; } },
        { type: 'select', label: 'Lead foot', options: ['as written', 'L', 'R'], get: () => style.lead ?? 'as written', set: (v) => { style.lead = v === 'as written' ? undefined : v; } },
        { type: 'select', label: 'Dance', options: DANCES, get: () => style.dance ?? DANCES[0], set: (v) => { style.dance = v; } },
        { type: 'select', label: 'Bow', options: Object.keys(BOWS), get: () => style.bow ?? 'rei', set: (v) => { style.bow = v; } },
        { type: 'select', label: 'Left hand', options: Object.keys(HAND_POSES), get: () => handL, set: (v) => { handL = v; man.hands(v, { hand: 'L' }); } },
        { type: 'color', label: 'T-shirt', get: () => man.look.shirt, set: (c) => man.setShirtColor(c) },
        { type: 'color', label: 'Jeans tint', get: () => man.look.denim, set: (c) => man.setJeansColor(c) },
        { type: 'color', label: 'Sneakers', get: () => man.look.shoe, set: (c) => man.setShoeColor(c) },
        face('jaw'), face('blink'), face('smile'), face('brows'),
        // The character creator, slot by slot: those not built yet are shown, kept, and greyed out.
        ...customizationFor(sex).flatMap(({ group, slots }) => [
          { type: 'heading', label: group },
          ...slots.map((s) => ({
            type: s.type === 'choice' ? 'select' : s.type, label: s.label, options: s.options, min: s.min, max: s.max, step: 0.01,
            // (The figure is chosen when the human is made: each has an item of its own.)
            disabled: !s.ready || s.key === 'sex', title: s.key === 'sex' ? 'Each figure is an item of its own' : s.ready ? '' : 'Not built yet: kept, and shown once it is',
            get: () => man.features[s.key], set: (v) => man.customize({ [s.key]: v }),
          })),
        ]),
        { type: 'range', label: 'Look', min: -0.6, max: 0.6, step: 0.01, get: () => man.faceState.look[0], set: (v) => man.face({ look: [v, man.faceState.look[1]] }) },
      ];
      // The weapon's ready stance and swing come from the style the human is posed with.
      const pose = (s) => man.pose(s);
      man.setStyle(style);
      return {
        object: man.group,
        pose,
        clips,
        ui,
        environment: metals.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null),
        info: { Source: 'people/human', Height: `${man.dimensions.height} m`, Outfit: man.outfit.join(', '), Bones: man.skeleton.names.length, ...countOf(man.group) },
      };
    },
  };
}

/** The robot: a slim humanoid machine on the human's rig, its shell resin, metal or wood and its frame metal; each chosen live. */
function robotItem() {
  return {
    id: 'people/robot',
    category: 'People',
    group: 'people',
    name: 'Robot (resin, metal or wood)',
    source: 'people/robot',
    kind: 'object',
    async build() {
      const [{ createRobot, RESIN_COLORS, SHELLS }, { CLIPS: clips }, { STANCES, MOVES }, weapons, metals, { WOOD_SPECIES }] = await Promise.all([
        import('../../../src/people/robot.js'),
        import('../../../src/people/human.js'),
        import('../../../src/people/human/martial.js'),
        import('../../../src/weapons/variants.js'),
        import('../../../src/props/metalglobe.js'),
        import('../../../src/textures/wood.js'),
      ]);
      const bot = createRobot(GFX, {});
      const style = {};
      let weapon = 'none', attack = 'slash';
      let arming = 0;
      const rearm = async () => {
        const mine = ++arming;
        bot.release('R');
        if (weapon === 'none') return;
        const { thing, how, open = true } = await humanHeld(weapon, weapons);
        if (mine === arming) bot.hold(thing, { hand: 'R', how, open });
      };
      const ui = [
        { type: 'select', label: 'Shell', options: SHELLS, get: () => bot.finish.shell, set: (v) => bot.setShell(v) },
        { type: 'select', label: 'Resin color', options: Object.keys(RESIN_COLORS), get: () => (RESIN_COLORS[bot.finish.color] ? bot.finish.color : Object.keys(RESIN_COLORS)[0]), set: (v) => bot.setShell('resin', { color: v }) },
        { type: 'color', label: 'Resin (custom)', get: () => RESIN_COLORS[bot.finish.color] ?? bot.finish.color, set: (c) => bot.setShell('resin', { color: c }) },
        { type: 'select', label: 'Shell metal', options: Object.keys(metals.METALS), get: () => bot.finish.metal, set: (v) => bot.setShell('metal', { metal: v }) },
        { type: 'select', label: 'Shell wood', options: Object.keys(WOOD_SPECIES), get: () => bot.finish.wood, set: (v) => bot.setShell('wood', { wood: v }) },
        { type: 'select', label: 'Trim (resin)', options: Object.keys(RESIN_COLORS), get: () => (RESIN_COLORS[bot.finish.trim] ? bot.finish.trim : 'blue'), set: (v) => bot.setTrim(v) },
        { type: 'select', label: 'Frame metal', options: Object.keys(metals.METALS), get: () => bot.finish.frame, set: (v) => bot.setFrame(v) },
        { type: 'color', label: 'Light', get: () => bot.finish.accent, set: (c) => bot.setAccent(c) },
        { type: 'select', label: 'Holds', options: HUMAN_WEAPONS, get: () => weapon, set: (v) => { weapon = v; rearm(); } },
        { type: 'select', label: 'Attack', options: ['slash', 'chop', 'thrust', 'smite', 'punch', 'shove', ...MOVES], get: () => attack, set: (v) => { attack = v; style.attack = v; } },
        { type: 'select', label: 'Stance', options: ['(the move\'s own)', ...STANCES], get: () => style.stance ?? '(the move\'s own)', set: (v) => { style.stance = STANCES.includes(v) ? v : undefined; } },
      ];
      bot.setStyle(style);
      return {
        object: bot.group,
        pose: (s) => bot.pose(s),
        clips,
        ui,
        environment: metals.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null),
        info: { Source: 'people/robot', Height: `${bot.dimensions.height} m`, Bones: bot.skeleton.names.length, ...countOf(bot.group) },
      };
    },
  };
}

/**
 * Stands a staff up from the viewer's choices. `wood` is `{ species, finish }` for the wooden staff or `{ metal }` for
 * the metal one, passed on its own: the viewer hands every item all the options, and the other kind's must not leak in.
 * A planet topper is given its maps first.
 */
async function buildStaff(wood, { topper = 'orb', vine = 'roots', wrap = 'on', colours = {} } = {}) {
  const [{ createStaff }, metals, planets] = await Promise.all([
    import('../../../src/weapons/staff.js'),
    import('../../../src/props/metalglobe.js'),
    import('../../../src/props/glass-planets.js'),
  ]);
  const planetMaps = planets.GLASS_PLANET_NAMES.includes(topper)
    ? { [topper]: await planets.loadGlassPlanetMaps(topper) }
    : {};
  const made = createStaff(GFX, { ...wood, topper, planetMaps, vine: vine === 'roots', wrap: wrap === 'on',
    gripColor: colours.gripColor ?? '#3a2418', threadColor: colours.threadColor ?? '#e2b857' });
  return {
    object: made.group,
    environment: metals.studioEnvironment(GFX, globalThis.assetViewer?.renderer ?? null),
    info: { Source: 'weapons/staff#createStaff', Set: 'Staff Set', ...made.info, ...countOf(made.group) },
  };
}

/** The wizard staff: wood, topper and wrap are chosen from the viewer's option menus. */
function staffItem() {
  return {
    id: 'weapons/wizard-staff',
    category: 'Weapons',
    group: weaponShelf({ range: RANGE.RANGED }),
    name: 'Wizard Staff',
    source: 'weapons/staff',
    kind: 'object',
    palette: { kind: 'staff', grip: '#3a2418', thread: '#e2b857' },
    options: {
      topper: [...STAFF_TOPPERS],
      species: ['walnut', ...Object.keys(WOOD_SPECIES).filter((k) => k !== 'walnut')],
      finish: ['lacquered', ...WOOD_FINISHES.filter((k) => k !== 'lacquered')],
      wrap: ['on', 'off'],
      vine: ['roots', 'none'],
    },
    build({ species = 'walnut', finish = 'lacquered', ...rest } = {}) {
      return buildStaff({ species, finish }, rest);
    },
  };
}

/** The same staff in metal: its wooden parts (shaft, roots and head) take one of the metal finishes. */
function metalStaffItem() {
  return {
    id: 'weapons/metal-wizard-staff',
    category: 'Weapons',
    group: weaponShelf({ range: RANGE.RANGED }),
    name: 'Metal Wizard Staff',
    source: 'weapons/staff',
    kind: 'object',
    palette: { kind: 'staff', grip: '#3a2418', thread: '#e2b857', metal: true },
    options: {
      topper: [...STAFF_TOPPERS],
      metal: METAL_CHOICES,
      wrap: ['on', 'off'],
      vine: ['roots', 'none'],
    },
    build({ metal = 'steel', ...rest } = {}) {
      return buildStaff({ metal }, rest);
    },
  };
}

/** Walks the library and returns every item, in category order. */
export async function loadCatalog(onProgress = () => {}) {
  const items = [];
  const seen = new Set();
  let n = 0;
  const total = Object.keys(sculpted).length + Object.keys(proceduralProps).length + Object.keys(textures).length;

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
  // Root and nested factory props self-register separately from sculpted definitions.
  for (const [path, load] of Object.entries(proceduralProps)) {
    onProgress(++n / total);
    let mod;
    try { mod = await load(); } catch (err) { console.warn(`${where(path)}: ${err.message}`); continue; }
    if (mod.assetViewer) items.push(proceduralPropItem(mod.assetViewer, path));
  }

  items.push(...HEROES.map(heroItem), ...MOVING.map(movingItem));
  items.push(...diceItems(), ...bowlingBallItems(), ...bowlingPinItems());
  items.push(...weaponItems(), staffItem(), metalStaffItem());
  items.push(...humanItems(), robotItem());
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
  const order = ['People', 'Characters', 'Props', 'Weapons', 'Animated props', 'Stage gear', 'Scenery & vehicles', 'Heroes', 'Lights', 'Flora', 'Water', 'Effects', 'Dungeon', 'Buildings', 'Textures', 'Skies', 'Rooms', 'Moods'];
  // By category, and within one by shelf, so that each shelf's things are together under its heading.
  return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
}
