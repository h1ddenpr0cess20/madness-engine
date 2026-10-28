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
const stage = await createStage(host, { room: paintRoom(), shadowSize: 2048, label: 'asset-viewer', lights: { key: { from: new GFX.Vector3(-0.4, 1, 0.8).normalize() } } });
const { scene, camera, renderer, key, hemi } = stage;
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 120 });
key.shadow.camera.updateProjectionMatrix();
const baseLight = { key: key.intensity, hemi: hemi.intensity };

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
  if (view.built) scene.remove(view.built.object);
  plate.visible = false;
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
    const built = await item.build(options);
    if (token !== view.token) return;
    view.built = built;
    scene.add(built.object);
    if (item.kind === 'sky') { stage.setSky(built.canvas); stage.setRoom(built.canvas); }
    if (item.kind === 'room') stage.setRoom(built.canvas);
    if (item.kind === 'mood') stage.setMood(item.mood);
    // Models stand on y = 0; centre the thing over the origin and look at its middle.
    const b = boundsOf(built.object);
    view.center.set((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2);
    view.radius = Math.max(0.2, Math.hypot(...b.size) / 2);
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
  markSelected();
}

/** The stage back to its plain light, sky and room, before an item dresses it. */
function resetDress() {
  hemi.color.set('#cfd8ff');
  hemi.groundColor.set('#40382f');
  key.color.set('#ffffff');
  stage.setSky(solid($('bg').value));
  stage.setRoom(paintRoom());
  if (stage.lantern) stage.lantern.visible = false;
  stage.film.set(null);
  applyLight();
}

function applyLight() {
  const k = Number($('light').value);
  key.intensity = baseLight.key * k;
  hemi.intensity = baseLight.hemi * k;
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

function toggleFlag() {
  const item = view.item;
  if (!item) return;
  if (flags[item.id]) delete flags[item.id];
  else flags[item.id] = { name: item.name, category: item.category, source: item.source, reasons: [], note: '', at: new Date().toISOString() };
  saveFlags();
  renderFlag();
  applyFilter();
  if (flags[item.id]) $('note').focus();
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
$('note').oninput = () => { const f = flags[view.item?.id]; if (f) { f.note = $('note').value; saveFlags(); } };
$('turn').onclick = () => { controls.autoRotate = !controls.autoRotate; $('turn').classList.toggle('on', controls.autoRotate); };
$('sheetbtn').onclick = contactSheet;
$('gridbtn').onclick = () => { floor.visible = !floor.visible; $('gridbtn').classList.toggle('on', !floor.visible); };
$('pause').onclick = () => { view.paused = !view.paused; $('pause').classList.toggle('on', view.paused); };
$('speed').oninput = () => { view.speed = Number($('speed').value); };
$('clip').onchange = () => { view.clip = $('clip').value; view.clipStart = view.clock; };
$('detail').onchange = () => { options.detail = Number($('detail').value); show(view.item); };
$('light').oninput = applyLight;
$('bg').onchange = () => { if (view.item?.kind === 'object' || view.item?.kind === 'mood') stage.setSky(solid($('bg').value)); };

const flagged = () => Object.entries(flags);
$('copyflags').onclick = async () => {
  const lines = flagged().map(([id, f]) => `- **${f.name}** (${f.category}, \`${f.source}\`)${f.reasons.length ? ` — ${f.reasons.join(', ')}` : ''}${f.note ? `: ${f.note}` : ''}`);
  try { await navigator.clipboard.writeText(lines.join('\n') || 'Nothing flagged.'); $('copyflags').textContent = 'Copied'; } catch { $('copyflags').textContent = 'Copy failed'; }
  setTimeout(() => { $('copyflags').textContent = 'Copy list'; }, 1500);
};
$('dlflags').onclick = () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(flags, null, 2)], { type: 'application/json' })), download: 'flags.json' });
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
