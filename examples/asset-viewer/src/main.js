/**
 * The asset viewer: every character, prop, vehicle, hero, building, texture,
 * sky, room and mood in the repo, to orbit from every angle and flag when one
 * needs fixing. Flags are kept in the browser and, under `npm run dev`, in
 * `flags.json` beside this app, so they can be read back and worked through.
 *
 *     npm install && npm run dev
 *
 * `?renderer=webgl` pins WebGL 2.
 */
import * as GFX from '../../../src/gfx/index.js';
import { OrbitControls } from '../../../src/gfx/controls.js';
import { createStage } from '../../../src/stage.js';
import { texture } from '../../../src/textures/painters.js';
import { paintRoom } from '../../../src/textures/rooms/studio.js';
import { MOODS } from '../../../src/moods/index.js';
import { boundsOf, loadCatalog } from './catalog.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
};

// ———————————————————————————————————————————————— flags

const REASONS = ['Geometry', 'Colour / material', 'Animation', 'Scale / pose', 'Clipping', 'Too heavy', 'Missing', 'Other'];
const STORE = 'asset-viewer.flags';
let flags = {};
try { flags = JSON.parse(localStorage.getItem(STORE) ?? '{}'); } catch { /* private window: carry on without */ }
let serverOk = false;

async function loadServerFlags() {
  try {
    const r = await fetch('/__flags');
    if (!r.ok) return;
    const remote = await r.json();
    serverOk = true;
    // The file is the record; anything only this browser has is added to it.
    flags = { ...flags, ...remote };
  } catch { /* a built copy has no store */ }
}

let saving = null;
function saveFlags() {
  try { localStorage.setItem(STORE, JSON.stringify(flags)); } catch { /* ignore */ }
  if (!serverOk) return;
  clearTimeout(saving);
  saving = setTimeout(() => fetch('/__flags', { method: 'POST', body: JSON.stringify(flags) }).catch(() => { serverOk = false; }), 250);
}

// ———————————————————————————————————————————————— the stage

const host = $('host');
const stage = await createStage(host, { room: paintRoom(), shadowSize: 2048, fixtures: 4, label: 'asset-viewer', lights: { key: { from: new GFX.Vector3(-0.4, 1, 0.8).normalize() } } });
const { scene, camera, renderer, key, hemi, fill } = stage;
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 120 });
key.shadow.camera.updateProjectionMatrix();
const rest = {
  key: key.intensity, keyColor: `#${key.color.getHexString()}`, keyFrom: stage.keyFrom.clone(),
  hemi: hemi.intensity, sky: `#${hemi.color.getHexString()}`, ground: `#${hemi.groundColor.getHexString()}`,
  fill: fill ? fill.intensity : 0, fillOffset: fill ? new GFX.Vector3(6, 3, -5) : null,
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotateSpeed = 3;

const solid = (color) => {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, 4, 4);
  return c;
};

/** A floor with a line to the tile, so size is plain to see. */
const gridTexture = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#2b3040';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#4a5270';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 128, 128);
  g.strokeStyle = '#3a4158';
  g.lineWidth = 1;
  g.strokeRect(64, 0, 0, 128);
  g.strokeRect(0, 64, 128, 0);
  return texture(GFX, c, { wrap: true });
})();
gridTexture.repeat.set(24, 24);
const floor = new GFX.Mesh(new GFX.PlaneGeometry(24, 24), new GFX.MeshStandardMaterial({ map: gridTexture, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const plate = new GFX.Mesh(new GFX.BoxGeometry(1, 0.02, 1), new GFX.MeshBasicMaterial({ color: '#7aa7ff', transparent: true, opacity: 0.25 }));
plate.visible = false;
scene.add(plate);

// ———————————————————————————————————————————————— the viewer's state

const view = { item: null, built: null, radius: 1, center: new GFX.Vector3(), clip: 'idle', speed: 1, paused: false, clock: 0, clipStart: 0, token: 0 };
const options = { level: 1, variant: 0, construction: 0, detail: 1 };

const VIEWS = [
  ['Front', 0, 0.15], ['¾ Left', 0.7, 0.35], ['Left', 1.57, 0.1], ['Back', 3.14, 0.15],
  ['Right', -1.57, 0.1], ['¾ Right', -0.7, 0.35], ['Top', 0, 1.5], ['Bottom', 0, -1.2],
];

/** Put the camera `azimuth` round (0 = in front, since the models face +z) and `elevation` up, far enough to hold the whole thing. */
function frame(azimuth, elevation, { fit = true } = {}) {
  const aspect = camera.aspect || 1;
  const half = (camera.fov * Math.PI) / 360;
  const reach = Math.atan(Math.tan(half) * Math.min(1, aspect));
  const distance = fit ? (view.radius / Math.sin(reach)) * 1.05 : camera.position.distanceTo(controls.target);
  const d = new GFX.Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
  controls.target.copy(view.center);
  camera.position.copy(view.center).addScaledVector(d, distance);
  camera.up.set(0, 1, 0);
  camera.lookAt(view.center);
  controls.update();
}

function sizeCamera() {
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function clearStage() {
  for (const l of stage.fixtureLights) l.intensity = 0;
  if (view.built) scene.remove(view.built.object);
  plate.visible = false;
  markGroup.clear();
}

async function show(item) {
  const token = ++view.token;
  view.item = item;
  $('busy').style.display = 'grid';
  $('err').textContent = '';
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  if (token !== view.token) return;
  clearStage();
  resetDress();
  $('title').replaceChildren(el('b', {}, item.name), el('br'), el('span', {}, `${item.category} · ${item.source}`));
  history.replaceState(null, '', `#${encodeURIComponent(item.id)}`);
  try {
    const built = await item.build({ ...options, lights: stage.fixtureLights, stage });
    if (token !== view.token) return;
    view.built = built;
    scene.add(built.object);
    if (built.dark) {
      // A light wants a dark room to show in; the Lighting panel can bring it back.
      key.intensity = rest.key * 0.06;
      hemi.intensity = rest.hemi * 0.15;
      if (fill) fill.intensity = 0;
      syncLights();
    }
    if (item.kind === 'sky') { stage.setSky(built.canvas); stage.setRoom(built.canvas); }
    if (item.kind === 'room') stage.setRoom(built.canvas);
    if (item.kind === 'mood') { stage.setMood(item.mood); syncLights(); }
    $('moodrow').style.display = item.kind === 'object' ? '' : 'none';
    // Models stand on y = 0; centre the thing over the origin and look at its middle.
    const b = built.frame ? { min: built.frame.center.map((c) => c - built.frame.radius), max: built.frame.center.map((c) => c + built.frame.radius), size: [2, 2, 2].map((v) => v * built.frame.radius) } : boundsOf(built.object);
    floor.visible = !built.noFloor && !$('gridbtn').classList.contains('on');
    view.center.set((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2);
    view.radius = Math.max(0.2, Math.hypot(...b.size) / 2);
    view.bounds = b;
    if (built.footprint) {
      plate.scale.set(built.footprint[0], 1, built.footprint[1]);
      plate.position.set(0, 0.01, 0);
      plate.visible = true;
    }
    stats(item, built, b);
    view.clock = 0;
    view.clipStart = 0;
    animGroup(built);
    frame(0.7, 0.3);
  } catch (err) {
    console.error(err);
    view.built = null;
    $('err').textContent = `Could not build it:\n${err.message}`;
    $('stats').replaceChildren();
  } finally {
    if (token === view.token) $('busy').style.display = 'none';
  }
  renderFlag();
  drawMarks();
  markSelected();
}

/** The stage back to its plain light, sky and room, before an item dresses it. */
function resetDress() {
  hemi.color.set(rest.sky);
  hemi.groundColor.set(rest.ground);
  key.color.set(rest.keyColor);
  key.intensity = rest.key;
  hemi.intensity = rest.hemi;
  stage.keyFrom.copy(rest.keyFrom);
  if (fill) { fill.visible = true; fill.intensity = rest.fill; }
  stage.setSky(solid($('bg').value));
  stage.setRoom(paintRoom());
  if (stage.lantern) stage.lantern.visible = false;
  stage.film.set(null);
  $('mood').value = '';
  syncLights();
}

/** The lighting controls, set to what the stage is lit by now. */
function syncLights() {
  $('keyi').value = key.intensity;
  $('keyc').value = `#${key.color.getHexString()}`;
  $('ambi').value = hemi.intensity;
  $('filli').value = fill?.visible ? fill.intensity : 0;
  const d = stage.keyFrom;
  $('keyaz').value = Math.round((Math.atan2(d.x, d.z) * 180) / Math.PI);
  $('keyel').value = Math.round((Math.asin(d.y / d.length()) * 180) / Math.PI);
  $('shadows').checked = key.castShadow;
}

/** The stage lit as the controls say. */
function applyLights() {
  key.intensity = Number($('keyi').value);
  key.color.set($('keyc').value);
  hemi.intensity = Number($('ambi').value);
  if (fill) { fill.visible = true; fill.intensity = Number($('filli').value); }
  const az = (Number($('keyaz').value) * Math.PI) / 180, el_ = (Number($('keyel').value) * Math.PI) / 180;
  stage.keyFrom.set(Math.sin(az) * Math.cos(el_), Math.sin(el_), Math.cos(az) * Math.cos(el_));
  key.castShadow = $('shadows').checked;
}

function stats(item, built, b) {
  const rows = { ...built.info };
  delete rows.warn;
  rows.Size = `${b.size.map((v) => v.toFixed(2)).join(' × ')} tiles`;
  const dl = $('stats');
  dl.replaceChildren();
  for (const [k, v] of Object.entries(rows)) dl.append(el('dt', {}, k), el('dd', { className: String(v).includes('OVER') ? 'warn' : '' }, String(v)));
  if (built.info.warn) dl.append(el('dt', { className: 'warn' }, '⚠'), el('dd', { className: 'warn' }, built.info.warn));
}

function animGroup(built) {
  $('animgroup').style.display = built.pose || view.item.options || view.item.build.length ? '' : 'none';
  const clip = $('clip');
  clip.style.display = built.clips ? '' : 'none';
  $('pause').style.display = built.pose ? '' : 'none';
  $('speed').parentElement.style.display = built.pose ? '' : 'none';
  if (built.clips) {
    clip.replaceChildren(...built.clips.map((c) => el('option', { value: c }, c)));
    clip.value = view.clip = built.clips.includes(view.clip) ? view.clip : built.clips[0];
  }
  // Extra per-item options (a building's level, variant, how far built).
  document.querySelectorAll('.opt').forEach((n) => n.remove());
  for (const [name, values] of Object.entries(view.item.options ?? {})) {
    const select = el('select', { className: 'opt' }, ...values.map((v) => el('option', { value: v }, String(v))));
    select.value = options[name];
    select.onchange = () => { options[name] = Number(select.value); show(view.item); };
    $('detail').parentElement.after(el('div', { className: 'line opt' }, el('label', {}, name), select));
  }
}

// ———————————————————————————————————————————————— marked areas

const markGroup = new GFX.Group();
const raycaster = new GFX.Raycaster();
let marking = false;
const MARK = '#ff3b30';

/** The red balls over what is wrong, drawn on top so they show from every side. */
function drawMarks() {
  markGroup.clear();
  const flag = flags[view.item?.id];
  if (!flag?.marks || !view.built) return;
  flag.marks.forEach((m, i) => {
    const ball = new GFX.Mesh(new GFX.SphereGeometry(m.radius, 24, 16), new GFX.MeshBasicMaterial({ color: MARK, transparent: true, opacity: 0.42, depthTest: false, depthWrite: false }));
    ball.position.fromArray(m.position);
    ball.renderOrder = 10 + i;
    markGroup.add(ball);
  });
  view.built.object.add(markGroup);
}

/** Where a mark is, in words: how high up it is, and which side. Models face +z, and their left is +x. */
function describe(position) {
  const b = view.bounds;
  if (!b) return '';
  const frac = (v, a) => (b.size[a] ? (v - b.min[a]) / b.size[a] : 0.5);
  const h = Math.round(frac(position[1], 1) * 100);
  const x = frac(position[0], 0), z = frac(position[2], 2);
  const side = x > 0.62 ? 'left side' : x < 0.38 ? 'right side' : 'middle';
  const depth = z > 0.62 ? 'front' : z < 0.38 ? 'back' : 'centre';
  return `${h}% up, ${side}, ${depth}`;
}

function renderMarks() {
  const flag = flags[view.item?.id];
  const box = $('marks');
  box.replaceChildren();
  (flag?.marks ?? []).forEach((m, i) => {
    const input = el('input', { value: m.label ?? '', placeholder: 'what is wrong here?' });
    input.oninput = () => { m.label = input.value; saveFlags(); };
    const remove = el('button', { title: 'Remove', onclick: () => { flag.marks.splice(i, 1); saveFlags(); drawMarks(); renderMarks(); } }, '✕');
    box.append(el('div', { className: 'line' }, el('b', { style: `color:${MARK}` }, String(i + 1)), input, remove));
  });
  $('markhint').textContent = marking ? 'Click the model to mark a spot. Marks stay where they were put.' : 'Turn on Mark areas (M), then click the model.';
}

function setMarking(on) {
  marking = on;
  $('markbtn').classList.toggle('on', on);
  renderer.domElement.style.cursor = on ? 'crosshair' : '';
  // A moving model would slide out from under its marks.
  if (on && view.built?.pose && !view.paused) $('pause').click();
  renderMarks();
}

/** A click (not a drag) on the model drops a mark at the point it hit. */
function addMark(event) {
  if (!marking || !view.built || !view.item) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const at = new GFX.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  camera.updateMatrixWorld();
  raycaster.setFromCamera(at, camera);
  const hit = raycaster.intersectObject(view.built.object, true).find((h) => h.object.visible && h.object.parent !== markGroup);
  if (!hit) return;
  if (!flags[view.item.id]) toggleFlag();
  const flag = flags[view.item.id];
  const radius = Math.round(Number($('marksize').value) * Math.max(0.3, view.radius) * 1000) / 1000;
  const position = view.built.object.worldToLocal(hit.point.clone()).toArray().map((v) => Math.round(v * 1000) / 1000);
  (flag.marks ??= []).push({ position, radius, where: describe(position), label: '', pose: view.built.pose ? { clip: view.clip, t: Math.round((view.clock - view.clipStart) * 100) / 100 } : undefined });
  flag.context = contextOf();
  saveFlags();
  drawMarks();
  renderMarks();
  applyFilter();
}

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (downAt && e.button === 0 && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 4) addMark(e);
  downAt = null;
});

// ———————————————————————————————————————————————— the loop

let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
  last = now;
  sizeCamera();
  if (view.built?.pose && !view.paused) {
    view.clock += dt * view.speed;
    const t = view.clock - view.clipStart;
    // The one-shot clips loop, so there is always something to see.
    view.built.pose({ clip: view.clip, t: view.clip === 'idle' || view.clip === 'walk' ? t : t % 1.6, time: view.clock, seed: 1, speed: 1 });
  }
  controls.update();
  key.position.copy(controls.target).addScaledVector(stage.keyFrom, 40);
  key.target.position.copy(controls.target);
  key.target.updateMatrixWorld();
  if (fill) {
    fill.position.copy(controls.target).add(rest.fillOffset);
    fill.target.position.copy(controls.target);
    fill.target.updateMatrixWorld();
  }
  stage.render();
});

// ———————————————————————————————————————————————— the list

const catalog = await (async () => {
  $('busy').style.display = 'grid';
  const items = await loadCatalog((p) => { $('busy').textContent = `Reading the library… ${Math.round(p * 100)}%`; });
  $('busy').textContent = 'Baking…';
  return items;
})();
await loadServerFlags();

const categories = ['All', ...new Set(catalog.map((i) => i.category))];
$('category').replaceChildren(...categories.map((c) => el('option', { value: c }, c === 'All' ? `All (${catalog.length})` : `${c} (${catalog.filter((i) => i.category === c).length})`)));

let filtered = [];
function applyFilter() {
  const q = $('search').value.trim().toLowerCase();
  const cat = $('category').value;
  const only = $('onlyflagged').checked;
  filtered = catalog.filter((i) => (cat === 'All' || i.category === cat) && (!only || flags[i.id]) && (!q || `${i.name} ${i.source} ${i.group}`.toLowerCase().includes(q)));
  const list = $('list');
  list.replaceChildren();
  let group = null;
  for (const item of filtered) {
    const g = item.group === item.category.toLowerCase() ? item.category : `${item.category} › ${item.group}`;
    if (g !== group) { group = g; list.append(el('h4', {}, g)); }
    const row = el('div', { className: 'row', title: item.source }, el('span', {}, item.name), el('span', { className: 'flagmark' }, flags[item.id] ? '⚑' : ''));
    row.dataset.id = item.id;
    row.onclick = () => show(item);
    list.append(row);
  }
  $('count').textContent = `${filtered.length} shown · ${Object.keys(flags).length} flagged`;
  markSelected();
}

function markSelected() {
  document.querySelectorAll('#list .row').forEach((r) => r.classList.toggle('sel', r.dataset.id === view.item?.id));
  document.querySelector('#list .row.sel')?.scrollIntoView({ block: 'nearest' });
}

function step(by) {
  if (!filtered.length) return;
  const i = filtered.indexOf(view.item);
  show(filtered[(i + by + filtered.length) % filtered.length] ?? filtered[0]);
}

// ———————————————————————————————————————————————— flagging

function renderFlag() {
  const flag = flags[view.item?.id];
  $('flagbtn').classList.toggle('on', Boolean(flag));
  $('flagbtn').textContent = flag ? '⚑ Flagged — click to clear (F)' : '⚑ Flag for fixing (F)';
  $('flagform').style.display = flag ? '' : 'none';
  $('note').value = flag?.note ?? '';
  renderMarks();
  $('pin').textContent = flag?.angle ? `Pin this angle (now ${flag.angle.azimuth}°, ${flag.angle.elevation}°)` : 'Pin this angle';
  $('reasons').replaceChildren(...REASONS.map((r) => {
    const b = el('button', { className: flag?.reasons.includes(r) ? 'on' : '' }, r);
    b.onclick = () => {
      const f = flags[view.item.id];
      f.reasons = f.reasons.includes(r) ? f.reasons.filter((x) => x !== r) : [...f.reasons, r];
      saveFlags();
      renderFlag();
    };
    return b;
  }));
  const n = Object.keys(flags).length;
  $('flagsummary').textContent = n ? `${n} flagged${serverOk ? ' · saved to flags.json' : ' · saved in this browser'}` : serverOk ? 'None yet. Saved to flags.json.' : 'None yet. Saved in this browser.';
}

/** What the viewer was set to, so whoever fixes it can see what you saw. */
function contextOf() {
  const c = { detail: options.detail };
  if (view.built?.clips) c.clip = view.clip;
  if (view.item?.options) Object.assign(c, { level: options.level, variant: options.variant, construction: options.construction });
  return c;
}

/** Where the camera is round the thing: degrees round from the front (+z), and up. */
function angleOf() {
  const d = camera.position.clone().sub(controls.target);
  const round = (v) => Math.round(v * 10) / 10;
  return { azimuth: round((Math.atan2(d.x, d.z) * 180) / Math.PI), elevation: round((Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI) };
}

/** The flags as a file to hand to Claude: what to do, then each asset, where its code is and what is wrong. */
function exportFor() {
  const file = (source) => {
    const [path, name] = source.split('#');
    return { file: `src/${path}`, ...(name ? { export: name } : {}) };
  };
  return {
    for: 'Claude',
    repo: 'h1ddenpr0cess20/madness-engine',
    exportedAt: new Date().toISOString(),
    instructions: 'These assets were flagged in the asset viewer (examples/asset-viewer) as needing fixes. For each: open its source file, read the note, and fix what it describes. `angle` is where the camera was when it was flagged (degrees round from the front, which is +z, and up); `context` is what the viewer was set to. `marks` are spots on the model the person circled: `position` is in the model’s own space (tiles, y up, the front toward +z, its left toward +x), `radius` how big an area, `where` the same in words, `label` what is wrong there, and `pose` the clip and time it was posed at. Models are sculpted with the kit in src/models; keep each asset in its own file and keep to its vertex budget. Re-open it in the viewer afterwards to check.',
    count: Object.keys(flags).length,
    flagged: Object.entries(flags).map(([id, f]) => ({ id, name: f.name, category: f.category, ...file(f.source), reasons: f.reasons, note: f.note, context: f.context, angle: f.angle, ...(f.marks?.length ? { marks: f.marks } : {}) })),
  };
}

function toggleFlag() {
  const item = view.item;
  if (!item) return;
  if (flags[item.id]) delete flags[item.id];
  else flags[item.id] = { name: item.name, category: item.category, source: item.source, reasons: [], note: '', at: new Date().toISOString(), context: contextOf(), angle: angleOf() };
  saveFlags();
  renderFlag();
  drawMarks();
  applyFilter();
  if (flags[item.id] && !marking) $('note').focus();
}

// ———————————————————————————————————————————————— all angles

/** Shoots the thing from eight sides, and lays the pictures out. */
function contactSheet() {
  const sheet = $('sheet');
  if (!view.built) return;
  const was = { pos: camera.position.clone(), target: controls.target.clone() };
  const spin = controls.autoRotate;
  controls.autoRotate = false;
  const grid = el('div', { className: 'grid' });
  for (const [name, az, el_] of VIEWS) {
    frame(az, el_);
    controls.update();
    stage.render();
    // Read the picture in the same task it was drawn in.
    const tile = el('canvas');
    tile.width = tile.height = 512;
    const g = tile.getContext('2d');
    const src = renderer.domElement;
    const side = Math.min(src.width, src.height);
    g.drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, 512, 512);
    const fig = el('figure', {}, tile, el('figcaption', {}, name));
    fig.onclick = () => { closeSheet(); frame(az, el_); };
    grid.append(fig);
  }
  camera.position.copy(was.pos);
  controls.target.copy(was.target);
  controls.autoRotate = spin;
  controls.update();
  sheet.replaceChildren(el('div', { className: 'line', style: 'margin-bottom:10px' }, el('b', {}, `${view.item.name} — all angles`), el('button', { onclick: closeSheet }, 'Close (Esc)')), grid);
  sheet.style.display = 'block';
}
const closeSheet = () => { $('sheet').style.display = 'none'; };

// ———————————————————————————————————————————————— wiring

$('views').replaceChildren(...VIEWS.map(([name, az, elev], i) => el('button', { title: `${i + 1}`, onclick: () => frame(az, elev) }, name)));
$('search').oninput = applyFilter;
$('category').onchange = applyFilter;
$('onlyflagged').onchange = applyFilter;
$('flagbtn').onclick = toggleFlag;
$('markbtn').onclick = () => setMarking(!marking);
$('pin').onclick = () => { const f = flags[view.item?.id]; if (f) { f.angle = angleOf(); f.context = contextOf(); saveFlags(); renderFlag(); } };
$('note').oninput = () => { const f = flags[view.item?.id]; if (f) { f.note = $('note').value; saveFlags(); } };
$('turn').onclick = () => { controls.autoRotate = !controls.autoRotate; $('turn').classList.toggle('on', controls.autoRotate); };
$('sheetbtn').onclick = contactSheet;
$('gridbtn').onclick = () => { floor.visible = !floor.visible; $('gridbtn').classList.toggle('on', !floor.visible); };
$('pause').onclick = () => { view.paused = !view.paused; $('pause').classList.toggle('on', view.paused); };
$('speed').oninput = () => { view.speed = Number($('speed').value); };
$('clip').onchange = () => { view.clip = $('clip').value; view.clipStart = view.clock; };
$('detail').onchange = () => { options.detail = Number($('detail').value); show(view.item); };
for (const id of ['keyi', 'keyc', 'ambi', 'filli', 'keyaz', 'keyel', 'shadows']) $(id).oninput = applyLights;
$('mood').replaceChildren(el('option', { value: '' }, 'None'), ...Object.keys(MOODS).map((n) => el('option', { value: n }, n)));
$('mood').onchange = () => {
  const name = $('mood').value;
  resetDress();
  $('mood').value = name;
  if (name) { stage.setMood(MOODS[name]); syncLights(); }
};
$('lightreset').onclick = resetDress;
$('bg').onchange = () => { if (view.item?.kind === 'object' || view.item?.kind === 'mood') stage.setSky(solid($('bg').value)); };

const flash = (button, text) => { const was = button.dataset.was ?? button.textContent; button.dataset.was = was; button.textContent = text; setTimeout(() => { button.textContent = was; }, 1500); };
$('copyflags').onclick = async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(exportFor(), null, 2)); flash($('copyflags'), 'Copied'); } catch { flash($('copyflags'), 'Copy failed'); }
};
$('dlflags').onclick = () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(exportFor(), null, 2)], { type: 'application/json' })), download: 'asset-flags-for-claude.json' });
  a.click();
  URL.revokeObjectURL(a.href);
};

addEventListener('keydown', (e) => {
  if (e.target.matches?.('input, textarea, select') && e.key !== 'Escape') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeSheet(); document.activeElement?.blur?.(); }
  else if (k === 'j' || k === 'arrowdown') { e.preventDefault(); step(1); }
  else if (k === 'k' || k === 'arrowup') { e.preventDefault(); step(-1); }
  else if (k === 'f') { e.preventDefault(); toggleFlag(); }
  else if (k === 't') $('turn').click();
  else if (k === 'm') setMarking(!marking);
  else if (k === 'c') contactSheet();
  else if (k === 'g') $('gridbtn').click();
  else if (k === ' ') { e.preventDefault(); $('pause').click(); }
  else if (k === '/') { e.preventDefault(); $('search').focus(); }
  else if (/^[1-8]$/.test(k)) frame(VIEWS[k - 1][1], VIEWS[k - 1][2]);
});

window.assetViewer = { catalog, show, options };
applyFilter();
const start = catalog.find((i) => i.id === decodeURIComponent(location.hash.slice(1))) ?? filtered[0];
if (start) show(start);
