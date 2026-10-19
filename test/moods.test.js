import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { WEATHER } from '../src/effects.js';
import { createFilm, DANCE, GRAIN } from '../src/film.js';
import { GRADES } from '../src/moods/grades.js';
import { MOODS } from '../src/moods/index.js';

const src = join(dirname(fileURLToPath(import.meta.url)), '../src');
const HEX = /^#[0-9a-f]{6}$/i;
const FILTER = /^(?:(?:grayscale|sepia|saturate|contrast|brightness|hue-rotate)\(-?[\d.]+(?:deg)?\)\s*)+$/;

test('every mood in the library is in MOODS, and nothing else is', () => {
  const files = readdirSync(join(src, 'moods')).filter((f) => !['index.js', 'grades.js'].includes(f)).map((f) => f.replace(/\.js$/, ''));
  assert.deepEqual(Object.keys(MOODS).sort(), files.sort());
  assert.ok(files.length >= 42, `${files.length} moods`);
});

test('the noir is black and white, grainier, darker at the edges, on the noir\'s stock, in the rain, to the noir', () => {
  const { film, weather, music } = MOODS.noir;
  assert.equal(film.grade, 'noir');
  assert.match(film.filter, /grayscale\(1\)/);
  assert.ok(film.grain > GRADES.sepia.grain, 'grainier than the other sets of its game');
  assert.notEqual(film.vignette, GRADES.sepia.vignette);
  assert.match(film.ui, /grayscale\(1\)/);
  assert.equal(weather, 'rain');
  assert.deepEqual(music, { band: 'music/band.rocknroller-ii', theme: 'noir', tempo: 84 });
});

for (const [name, mood] of Object.entries(MOODS)) {
  test(`moods/${name}: a whole mood, its grade, weather and theme all there to be had`, async () => {
    const { hemisphere, key, lantern } = mood.light;
    for (const hex of [hemisphere.sky, hemisphere.ground, key.color, lantern.color]) assert.match(hex, HEX);
    assert.ok(hemisphere.intensity > 0 && key.intensity > 0 && lantern.intensity > 0 && lantern.distance > 0 && lantern.height > 0);
    assert.ok(mood.sky.sky.length >= 2 && mood.sky.sky.every((c) => HEX.test(c)));
    assert.ok(mood.room.colors.length >= 1);
    assert.equal(typeof mood.paintSky, 'function');
    assert.equal(typeof mood.paintRoom, 'function');
    if (mood.weather !== null) assert.ok(mood.weather in WEATHER, `weather ${mood.weather}`);
    if (mood.film) {
      if (mood.film.filter) assert.match(mood.film.filter, FILTER);
      if (mood.film.ui) assert.match(mood.film.ui, FILTER);
      if (mood.film.grain !== null) assert.ok(mood.film.grain > 0 && mood.film.grain < 1);
      // The grade is in GRADES, at its name or, where another game's has the name, beside it.
      if (mood.film.grade) {
        const graded = Object.entries(GRADES).filter(([k]) => k === mood.film.grade || k.startsWith(`${mood.film.grade}.`));
        assert.ok(graded.some(([, g]) => g.filter === mood.film.filter), `the ${mood.film.grade} grade`);
      }
    }
    const { THEMES } = await import(pathToFileURL(join(src, `${mood.music.band}.js`)).href);
    assert.ok(mood.music.theme in THEMES, `${mood.music.band} plays ${mood.music.theme}`);
    assert.ok(mood.music.tempo > 0);
  });
}

/** A page with just enough in it for the painters and the film: elements with styles, and canvases that take any drawing. */
function fakePage() {
  const anything = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : anything), apply: () => anything, set: () => true });
  const element = (tag) => {
    const el = {
      tagName: tag, style: {}, children: [], attributes: {}, animations: [],
      setAttribute(k, v) { el.attributes[k] = v; },
      appendChild(c) { el.children.push(c); c.parentNode = el; return c; },
      querySelector: (sel) => (sel === 'canvas' ? el.children.find((c) => c.tagName === 'canvas') ?? null : null),
      animate(keyframes, options) {
        const a = { keyframes, options, cancelled: false, cancel() { a.cancelled = true; } };
        el.animations.push(a);
        return a;
      },
      getContext: () => anything,
    };
    return el;
  };
  const document = { createElement: element };
  const host = element('div');
  host.ownerDocument = document;
  host.appendChild(element('canvas'));
  return { document, host };
}

test('every mood\'s sky and reflections paint', () => {
  const { document } = fakePage();
  globalThis.document = document;
  try {
    for (const [name, mood] of Object.entries(MOODS)) {
      assert.ok(mood.paintSky({ width: 64 }), `${name}: its sky`);
      assert.ok(mood.paintRoom({ width: 64 }), `${name}: its reflections`);
    }
  } finally {
    delete globalThis.document;
  }
});

test('film: the grade goes on the picture, the vignette and the grain over it, the interface on the same stock', () => {
  const { host } = fakePage();
  const [canvas] = host.children;
  const hud = { style: {} };
  const film = createFilm(host, { ui: [hud] });

  film.set(null);
  assert.equal(canvas.style.filter, '');
  assert.equal(host.children.length, 1, 'nothing over the picture until a film wants it');

  film.set(MOODS.noir.film);
  assert.equal(canvas.style.filter, MOODS.noir.film.filter);
  assert.equal(hud.style.filter, MOODS.noir.film.ui);
  const [, vignette, frame] = host.children;
  const [grain] = frame.children;
  assert.equal(vignette.style.background, MOODS.noir.film.vignette);
  assert.equal(vignette.style.display, '');
  assert.equal(frame.style.display, '');
  assert.equal(grain.style.opacity, String(MOODS.noir.film.grain));
  assert.equal(grain.style.backgroundImage, GRAIN);
  assert.equal(grain.animations.length, 1, 'the grain dances');
  assert.equal(grain.animations[0].keyframes.length, DANCE.places.length);
  assert.equal(vignette.attributes['aria-hidden'], 'true');

  // London: graded, a vignette, no grain, the interface as it is.
  film.set(MOODS.london.film);
  assert.equal(canvas.style.filter, MOODS.london.film.filter);
  assert.equal(hud.style.filter, '');
  assert.equal(frame.style.display, 'none');
  assert.ok(grain.animations[0].cancelled, 'the grain stops dancing when it goes');
  assert.equal(vignette.style.display, '');

  // A sandstorm's haze, in place of the vignette.
  film.set(MOODS.egypt.film);
  assert.equal(vignette.style.background, MOODS.egypt.film.vignette);
  assert.notEqual(MOODS.egypt.film.vignette, MOODS.spain.film.vignette);

  film.set(MOODS.garage.film);
  assert.equal(MOODS.garage.film, null, 'the first rock game has no film');
  assert.equal(canvas.style.filter, '');
  assert.equal(vignette.style.display, 'none');
  assert.equal(host.children.length, 3, 'the layers are made once');
  assert.equal(film.current, null);
});

test('film: a grain that holds still for those who want less motion', () => {
  const { host } = fakePage();
  globalThis.matchMedia = (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' });
  try {
    createFilm(host).set(GRADES.noir);
    const [grain] = host.children[2].children;
    assert.equal(grain.animations.length, 0);
    assert.equal(grain.style.opacity, String(GRADES.noir.grain));
  } finally {
    delete globalThis.matchMedia;
  }
});

test('GRADES: every grade, on its game\'s film', () => {
  for (const [name, grade] of Object.entries(GRADES)) {
    assert.equal(grade.grade, name.split('.')[0]);
    assert.match(grade.filter, FILTER, name);
  }
  for (const name of ['noir', 'sepia', 'technicolor', 'horror', 'scifi', 'fog', 'dusk', 'alpine', 'warm', 'neon', 'tropical', 'steel', 'storm']) assert.ok(name in GRADES, name);
  // Two games have a neon, and they differ: the newer game's at the name, the other beside it.
  assert.notEqual(GRADES.neon.filter, GRADES['neon.rocknroller-iii'].filter);
  assert.equal(MOODS.tokyo.film.filter, GRADES['neon.rocknroller-iii'].filter);
  assert.equal(MOODS.strip.film.filter, GRADES.neon.filter);
});
