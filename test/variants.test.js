import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHARACTERS } from '../src/characters/index.js';
import { diverse, EYE_COLORS, HAIR_COLORS, SKIN_TONES, swatch, toHex } from '../src/characters/person.js';
import { Sculpt } from '../src/models/sdf.js';

const { cop, punk, viking } = CHARACTERS;

/** Whether every colour in `set` is within a few steps of `hex` (cloth is mottled, skin rosier toward the front). */
const near = (set, hex, tol = 6) => [...set].every((c) => [1, 3, 5].every((i) => Math.abs(parseInt(c.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)) <= tol));

/** The colours (as hex) each part/material is made in, read off a sculpt. */
function coloursOf(def) {
  const s = new Sculpt();
  def.sculpt(s);
  const out = {};
  for (const sh of s.shapes) {
    if (sh.op !== 'add') continue;
    const c = typeof sh.color === 'function' ? sh.color([0, 0.5, 0.05], [0, 1, 0]) : sh.color;
    (out[`${sh.part}/${sh.mat}`] ??= new Set()).add(toHex(c));
  }
  return out;
}

test('a character reports what can be recoloured, and what colour it is now', () => {
  const p = cop.palette();
  assert.equal(p.eyes, '#3a5a8a');
  assert.match(p.skin, /^#[0-9a-f]{6}$/);
  assert.deepEqual(Object.keys(p.look), ['torso', 'sleeve', 'cuff', 'legs', 'boot', 'belt', 'buckle']);
  // The coat is one colour: its parts are best changed together.
  assert.deepEqual(p.groups[0], ['torso', 'sleeve', 'cuff', 'legs']);
  // What is not a colour (how high a boot is) is not offered.
  assert.ok(!('boots' in punk.palette().look));
  // A bare arm has no colour of its own.
  assert.ok(!('sleeve' in viking.palette().look));
});

test('a variant is a definition of its own, and the character it came from is as it was', () => {
  const before = JSON.stringify(punk.palette());
  const v = punk.variant({ skin: '#8d5524', look: { legs: '#224466' } });
  assert.notEqual(v, punk);
  assert.equal(v.name, punk.name);
  assert.equal(v.palette().skin, '#8d5524');
  assert.equal(v.palette().look.legs, '#224466');
  assert.equal(v.palette().look.torso, punk.palette().look.torso);
  assert.equal(JSON.stringify(punk.palette()), before);
  // Asked for again, the same definition, so it is baked once; and it can be varied again.
  assert.equal(punk.variant({ skin: '#8d5524', look: { legs: '#224466' } }), v);
  assert.equal(v.variant({ eyes: '#6a4a22' }).palette().look.legs, '#224466');
  assert.equal(v.variant({ eyes: '#6a4a22' }).palette().eyes, '#6a4a22');
});

test('what a variant cannot change is left alone: parts the character does not have, and bare skin', () => {
  const v = viking.variant({ look: { sleeve: '#ff0000', belt: '#00ff00', boots: '#0000ff', skin: '#fff' } });
  assert.deepEqual(v.palette().look, viking.palette().look);
  assert.equal(v.palette().skin, viking.palette().skin);
});

test('three-digit hex colours mean what they say', () => {
  assert.equal(punk.variant({ look: { boot: '#fff' } }).palette().look.boot, '#ffffff');
  assert.equal(swatch('#abc'), '#aabbcc');
});

test('a coat recoloured brings its skirts with it, a hat is recoloured by its colour, and the rest is as it was', () => {
  const was = coloursOf(cop);
  const red = '#7a1020';
  const now = coloursOf(cop.variant({
    skin: '#533018', eyes: '#2a1a10', hair: '#e0c070',
    look: { torso: red, sleeve: red, cuff: red, legs: red }, colors: { '#1e2a4e': '#102a6a' },
  }));
  const same = (part) => [...now[part]].join() === [...was[part]].join();
  assert.ok(near(now['outer/cloth'], red), 'the coat skirts go with the coat');
  assert.ok(near(now['kit/cloth'], '#102a6a'), 'the cap');
  assert.ok(near(now['top/cloth'], red) && near(now['bottoms/cloth'], red));
  assert.ok(near(now['irises/eye'], '#2a1a10'));
  assert.ok(near(now['head/skin'], '#533018'));
  assert.ok(!same('brows/hair'), 'the moustache and brows');
  // The belt, the boots and everything else are as they were.
  for (const part of ['shoes/leather', 'belt/leather', 'eyes/eye', 'pupils/eye']) assert.ok(same(part), part);
});

test('a hair colour reaches the hair, the beard and the crest; fur worn over the shoulders is not hair', () => {
  const was = coloursOf(viking), now = coloursOf(viking.variant({ hair: '#b0502a' }));
  for (const part of ['hair/hair', 'fine/hair', 'brows/hair']) assert.notDeepEqual([...now[part]], [...was[part]], part);
  assert.deepEqual([...now['outer/hair']], [...was['outer/hair']]);
});

test('a skin tone reaches bare arms drawn in a colour of their own', () => {
  const now = coloursOf(viking.variant({ skin: '#6f4120' }));
  assert.ok(near(now['head/skin'], '#6f4120'));
  assert.ok(near(now['hands/skin'], '#6f4120'), [...now['hands/skin']].join());
});

test('a crowd is drawn from the palettes, the same way every time', () => {
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const d = diverse(i);
    assert.deepEqual(d, diverse(i));
    assert.ok(SKIN_TONES.includes(d.skin) && HAIR_COLORS.includes(d.hair) && EYE_COLORS.includes(d.eyes));
    seen.add(d.skin);
  }
  assert.ok(seen.size > 6, `${seen.size} skin tones in sixty people`);
});
