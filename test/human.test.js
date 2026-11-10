import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createHuman, CLIPS, GARMENTS, HAND_POSES, HUMAN_DIMENSIONS } from '../src/people/index.js';
import { bones } from '../src/people/human/skeleton.js';
import { jeansPoint, legPoint, shirtPoint, trunkPoint } from '../src/people/human/clothes.js';
import { createGreatsword, createKrystalSword } from '../src/weapons/index.js';

const man = createHuman(GFX, { detail: 0.5 });
man.dress(['briefs', 'tshirt', 'jeans', 'sneakers']);

function boundsOf(attr) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < attr.count; i++) for (let a = 0; a < 3; a++) {
    const v = attr.array[i * 3 + a];
    if (v < min[a]) min[a] = v;
    if (v > max[a]) max[a] = v;
  }
  return { min, max };
}

test('the skeleton carries the engine movement vocabulary and every moving part of a person', () => {
  const names = bones().map(([n]) => n);
  for (const n of ['root', 'hips', 'spine', 'chest', 'neck', 'head']) assert.ok(names.includes(n), n);
  for (const S of ['L', 'R']) {
    for (const n of ['arm', 'fore', 'hand', 'thigh', 'shin', 'foot', 'toes', 'clavicle', 'eye', 'lidUp', 'lidLow', 'brow', 'lipCorner']) assert.ok(names.includes(`${n}${S}`), `${n}${S}`);
    for (const f of ['thumb', 'index', 'middle', 'ring', 'pinky']) for (const k of [1, 2, 3]) assert.ok(names.includes(`${f}${k}${S}`), `${f}${k}${S}`);
  }
  assert.ok(names.includes('jaw') && names.includes('tongue'));
  // Parents come before their children.
  const seen = new Set();
  for (const [n, parent] of bones()) { if (parent) assert.ok(seen.has(parent), `${n} after ${parent}`); seen.add(n); }
});

test('he stands 1.76 m tall on y = 0, at the scale the weapons are measured in', () => {
  man.pose({ clip: 'idle', t: 0, time: 0 });
  man.dress([]);
  const { min, max } = boundsOf(man.body.geometry.attributes.position);
  assert.ok(Math.abs(max[1] - HUMAN_DIMENSIONS.height) < 0.03, `top ${max[1]}`);
  assert.ok(min[1] > -0.03 && min[1] < 0.02, `bottom ${min[1]}`);
  man.dress(['briefs', 'tshirt', 'jeans', 'sneakers']);
});

test('every vertex is fully weighted to at most four bones', () => {
  for (const mesh of [man.body, ...man.outfit.map((g) => man.garment(g))]) {
    const geometry = mesh.geometry;
    assert.ok(geometry.attributes.position.count > 0);
  }
  // The rest data is what is skinned: check its weights directly.
  const data = man.body.geometry;
  assert.ok(data.index.count > 0);
});

test('garments are separate meshes over the body, and hide what they cover', () => {
  man.dress([]);
  const bare = man.body.geometry.index.count;
  man.wear('tshirt');
  assert.ok(man.garment('tshirt'), 'the shirt is its own mesh');
  assert.notEqual(man.garment('tshirt'), man.body);
  const shirted = man.body.geometry.index.count;
  assert.ok(shirted < bare * 0.92, 'the shirt hides the trunk and upper arms');
  man.wear('jeans').wear('sneakers').wear('briefs');
  const dressed = man.body.geometry.index.count;
  assert.ok(dressed < shirted * 0.85, 'jeans and sneakers hide the legs and feet');
  // Under the shirt the jeans' waist is hidden too.
  const jeansAll = man.garment('jeans').geometry.index.count;
  man.remove('tshirt');
  assert.ok(man.garment('jeans').geometry.index.count > jeansAll, 'the jeans show more without the shirt over them');
  man.remove('jeans').remove('sneakers').remove('briefs');
  assert.equal(man.body.geometry.index.count, bare, 'undressed, all of him is drawn again');
  man.dress(['briefs', 'tshirt', 'jeans', 'sneakers']);
  assert.deepEqual(man.outfit.sort(), ['briefs', 'jeans', 'sneakers', 'tshirt']);
});

test('clothes are cut outside the skin they cover', () => {
  for (let y = 0.1; y < 0.98; y += 0.04) {
    for (let th = 0; th < Math.PI * 2; th += 0.2) {
      const a = legPoint(y, th, 1, { ease: 0.004 }), b = jeansPoint(y, th, 1);
      // Measured from the leg's middle line at that height.
      const ax = legPoint(y, th + Math.PI, 1);
      const mid = [(a[0] + ax[0]) / 2, (a[2] + ax[2]) / 2];
      assert.ok(Math.hypot(b[0] - mid[0], b[2] - mid[1]) >= Math.hypot(a[0] - mid[0], a[2] - mid[1]) - 1e-4, `jeans at y ${y.toFixed(2)} th ${th.toFixed(1)}`);
    }
  }
  for (let y = 1.0; y < 1.36; y += 0.03) {
    for (let th = 0; th < Math.PI * 2; th += 0.2) {
      const body = trunkPoint(y, th), shirt = shirtPoint(y, th);
      assert.ok(Math.hypot(shirt[0], shirt[2]) > Math.hypot(body[0], body[2]) - 0.004, `shirt at y ${y.toFixed(2)} th ${th.toFixed(1)}`);
    }
  }
});

test('every clip poses him without breaking the mesh', () => {
  for (const clip of CLIPS) {
    for (const t of [0, 0.25, 0.6, 1.2]) {
      man.pose({ clip, t, time: t, seed: 0, speed: 1 });
      const p = man.body.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 97) assert.ok(Number.isFinite(p[i]), `${clip} at ${t}`);
    }
  }
});

test('the face moves: the jaw opens, the lids close, the eyes turn', () => {
  man.pose({ clip: 'idle', t: 0 });
  const jaw = man.point('jaw', [0, 1.55, 0.13]);
  man.face({ jaw: 1, auto: false });
  const open = man.point('jaw', [0, 1.55, 0.13]);
  assert.ok(open[1] < jaw[1] - 0.01, 'the chin drops');
  const lid = man.point('lidUpL', [0.03, 1.668, 0.14]);
  man.face({ blink: 1 });
  assert.ok(man.point('lidUpL', [0.03, 1.668, 0.14])[1] < lid[1] - 0.005, 'the upper lid comes down');
  man.face({ jaw: 0, blink: 0, look: [0.4, 0], auto: true });
  const gaze = man.point('eyeL', [0.03, 1.66, 0.145]);
  assert.ok(gaze[0] > 0.03 + 0.003, 'the eye turns to his left');
  man.face({ look: [0, 0] });
});

test('the hands shape themselves, and a held weapon goes where the hand goes', () => {
  for (const shape of Object.keys(HAND_POSES)) man.hands(shape);
  const tip = (S) => man.point(`index3${S}`, man.skeleton.pivots[man.skeleton.index.get(`index3${S}`)]);
  man.hands('open');
  const open = tip('L');
  man.hands('fist');
  const fist = tip('L');
  assert.ok(Math.hypot(open[0] - fist[0], open[1] - fist[1], open[2] - fist[2]) > 0.02, 'a fist curls the fingers in');
  const sword = createKrystalSword(GFX);
  man.hold(sword);
  assert.equal(man.held('R'), sword);
  man.pose({ clip: 'idle', t: 0, time: 0 });
  const hand = man.point('handR', man.skeleton.pivots[man.skeleton.index.get('handR')]);
  const e = sword.group.matrix.elements;
  assert.ok(Math.hypot(e[12] - hand[0], e[13] - hand[1], e[14] - hand[2]) < 0.35, 'the sword is in the hand');
  // Its blade points up and away from him in the ready stance.
  assert.ok(e[5] > 0.2, 'the blade rises');
  assert.equal(man.release('R'), sword);
  man.hands('relaxed');
});

test('a two-handed weapon is swung with both hands on the grip; a one-handed one with one', () => {
  // How far the left hand's grip is from where a second hand takes the held weapon, at t in a swing.
  const gap = (weapon, attack, t) => {
    man.hold(weapon);
    man.setStyle({ attack });
    man.pose({ clip: 'attack', t, time: 0 });
    const b = weapon.gripBounds, y = Math.max((b.bottom + b.top) / 2, b.top - 0.05), second = Math.max(b.bottom + 0.03, y - 0.085);
    const e = weapon.group.matrix.elements;
    const at = [e[4] * second + e[12], e[5] * second + e[13], e[6] * second + e[14]];
    const p = man.point('handL', [0.283, 0.79, 0.04]);
    man.release('R');
    return Math.hypot(p[0] - at[0], p[1] - at[1], p[2] - at[2]);
  };
  const great = createGreatsword(GFX), sword = createKrystalSword(GFX);
  assert.equal(great.handling.hands, 'two-handed');
  // At each swing's wind-up, strike and follow-through.
  const keys = { slash: [0.24, 0.36, 0.52], chop: [0.24, 0.36, 0.52], thrust: [0.24, 0.36, 0.5], smite: [0.26, 0.38, 0.55] };
  for (const [attack, times] of Object.entries(keys)) {
    for (const t of times) assert.ok(gap(great, attack, t) < 0.06, `${attack} at ${t}: the left hand is on the greatsword's grip`);
  }
  // A one-handed sword is slashed with one hand, but chopped with two.
  assert.ok(gap(sword, 'slash', 0.36) > 0.15, 'the left hand stays off a one-handed sword');
  assert.ok(gap(sword, 'chop', 0.36) < 0.06, 'a chop takes both hands');
  man.setStyle({});
});

test('every garment in the wardrobe can be worn on its own', () => {
  for (const name of Object.keys(GARMENTS)) {
    man.dress([name]);
    assert.ok(man.garment(name).geometry.index.count > 0, name);
  }
  man.dress(['briefs', 'tshirt', 'jeans', 'sneakers']);
});

test('talking moves the mouth through its shapes, and a yell opens it wide', async () => {
  const { speech, yelling } = await import('../src/people/human.js');
  const jaws = [], shapes = new Set();
  for (let t = 0; t < 2.5; t += 0.05) {
    const s = speech(t);
    jaws.push(s.jaw);
    shapes.add(s.pucker > 0.3 ? 'round' : s.wide > 0.3 ? 'wide' : s.jaw > 0.25 ? 'open' : 'closed');
  }
  assert.ok(Math.max(...jaws) > 0.3 && Math.min(...jaws) < 0.1, 'the jaw opens and closes as he speaks');
  assert.ok(shapes.size >= 3, `the lips change shape (${[...shapes]})`);
  const shout = speech(0.5, { loud: 1 }), said = speech(0.5);
  assert.ok(shout.jaw >= said.jaw && shout.brows < 0 && shout.lipUp > 0.5, 'shouting is wider, scowling, the teeth bared');
  const y = yelling(0.8);
  assert.ok(y.jaw > 0.7 && y.brows < -0.5, 'a yell is a wide mouth and a scowl');
  assert.ok(CLIPS.includes('yell'));
  const mouth = () => { const p = man.body.geometry.attributes.position; let lo = Infinity; for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), z = p.getZ(i); if (Math.abs(x) < 0.01 && z > 0.12 && yy > 1.5 && yy < 1.6) lo = Math.min(lo, yy); } return lo; };
  man.pose({ clip: 'idle', t: 0, time: 0.8 });
  const shut = mouth();
  man.pose({ clip: 'yell', t: 0, time: 0.8 });
  assert.ok(mouth() < shut - 0.02, 'the chin drops when he yells');
  man.pose({ clip: 'idle', t: 0, time: 0 });
});

test('hair and a beard: cards where they grow, the beard moving with the jaw', () => {
  const bearded = createHuman(GFX, { detail: 0.5, beard: 'full' });
  assert.deepEqual(bearded.hair, { hair: 'sidePart', beard: 'full', brows: 'natural' });
  const mesh = (name) => bearded.group.children.find((c) => c.name === `human ${name}`);
  const beard = mesh('beard'), hair = mesh('hair');
  assert.ok(hair.geometry.attributes.position.count > 1000 && beard.geometry.attributes.position.count > 1000);
  // The hair is on the scalp, above the brows; the beard on the jaw, below the nose.
  const hb = boundsOf(hair.geometry.attributes.position), bb = boundsOf(beard.geometry.attributes.position);
  assert.ok(hb.min[1] > 1.58 && hb.max[1] < 1.85, 'the hair is on the head');
  assert.ok(bb.max[1] < 1.71 && bb.min[1] > 1.5, 'the beard is on the face');
  const at = beard.geometry.attributes.position.array.slice();
  bearded.face({ jaw: 1, auto: false });
  const moved = beard.geometry.attributes.position.array;
  let most = 0;
  for (let i = 1; i < at.length; i += 3) most = Math.max(most, at[i] - moved[i]);
  assert.ok(most > 0.01, 'the beard on the chin drops with the jaw');
  bearded.setHair({ hair: null, beard: null });
  assert.equal(mesh('hair'), undefined);
  assert.equal(mesh('beard'), undefined);
});

test('the character creator: every slot has a default, the built ones change him, the rest are kept', async () => {
  const { CUSTOMIZATION, DEFAULT_FEATURES } = await import('../src/people/index.js');
  const keys = CUSTOMIZATION.flatMap((g) => g.slots.map((s) => s.key));
  assert.equal(new Set(keys).size, keys.length, 'no slot is listed twice');
  for (const k of ['noseShape', 'eyeShape', 'mouthShape', 'earShape', 'build', 'face']) assert.ok(keys.includes(k), `${k} is offered`);
  const him = createHuman(GFX, { detail: 0.5, features: { hair: 'none', beard: 'full', noseShape: 'aquiline', skin: '#8a5a3c' } });
  assert.deepEqual(him.hair, { hair: null, beard: 'full', brows: 'natural' });
  assert.equal(him.look.skin, '#8a5a3c');
  assert.equal(him.features.noseShape, 'aquiline', 'a shape slot is kept as set');
  assert.equal(him.features.tattoo, 'none', 'a slot not built yet is kept');
  him.customize({ eyeSize: 0.4, hairColour: '#c8a060', hair: 'sidePart' });
  assert.equal(him.features.eyeSize, 0.4);
  assert.equal(him.look.hair, '#c8a060');
  assert.equal(him.hair.hair, 'sidePart');
  assert.equal(Object.keys(him.features).length, Object.keys(DEFAULT_FEATURES).length);
  assert.throws(() => him.customize({ noseShape: 'trunk' }), /noseShape is one of/);
  assert.throws(() => him.customize({ eyeSize: 3 }), /runs -1 to 1/);
  assert.throws(() => him.customize({ tail: 'long' }), /no feature called tail/);
});

test('layers: a garment is fitted over what is worn under it, and refitted when that changes', () => {
  const him = createHuman(GFX, { detail: 0.5, outfit: ['briefs', 'tshirt', 'jeans', 'jacket'], glasses: null });
  assert.deepEqual(him.outfit, ['briefs', 'jeans', 'tshirt', 'jacket'], 'put on from the inside out');
  const radius = (mesh, y0, y1) => {
    const p = mesh.geometry.attributes.position;
    let r = 0;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > y0 && p.getY(i) < y1 && Math.abs(p.getX(i) - 0.1) < 0.015 && p.getZ(i) > 0) r = Math.max(r, p.getZ(i));
    return r;
  };
  him.pose({ clip: 'idle', t: 0, time: 0 });
  const tee = radius(him.garment('tshirt'), 1.15, 1.25), jacket = radius(him.garment('jacket'), 1.15, 1.25);
  assert.ok(jacket > tee + 0.004, `the jacket stands out from the t-shirt (${jacket} over ${tee})`);
  // Take the t-shirt off and the jacket is made again for what is under it now.
  const before = him.garment('jacket');
  him.remove('tshirt');
  assert.notEqual(him.garment('jacket'), before, 'refitted');
  // One thing in each slot: zipping it up takes the place of wearing it open.
  him.wear('jacketZipped');
  assert.ok(!him.outfit.includes('jacket') && him.outfit.includes('jacketZipped'));
  // A shirt worn under it is hidden where the jacket covers it, so it never shows through.
  him.wear('tshirt');
  const shown = him.garment('tshirt').geometry.index.count;
  him.remove('jacketZipped');
  assert.ok(him.garment('tshirt').geometry.index.count > shown * 1.5, 'more of the shirt shows without the jacket');
});

test('socks are under the sneakers, and the shoes hide them', () => {
  const him = createHuman(GFX, { detail: 0.5, outfit: ['socks'], glasses: null });
  const bare = him.garment('socks').geometry.index.count;
  him.wear('sneakers');
  assert.ok(him.garment('socks').geometry.index.count < bare * 0.6, 'the shoes cover the feet of the socks');
  assert.ok(him.garment('socks').geometry.index.count > 0, 'their cuffs show above the shoes');
});

test('sunglasses sit on his face and move with his head', async () => {
  const { SUNGLASSES } = await import('../src/people/index.js');
  const him = createHuman(GFX, { detail: 0.5 });
  assert.equal(him.glasses, 'aviator', 'he wears aviators unless told otherwise');
  const mesh = () => him.group.children.find((c) => c.name === 'human sunglasses');
  const b = boundsOf(mesh().geometry.attributes.position);
  assert.ok(b.min[1] > 1.58 && b.max[1] < 1.72, 'at the height of his eyes');
  assert.ok(b.max[2] > 0.16 && b.max[2] < 0.2, 'just in front of his face');
  assert.ok(b.max[0] > 0.07 && b.min[0] < -0.07, 'the temples reach back past his eyes');
  for (const name of Object.keys(SUNGLASSES)) { him.setGlasses(name); assert.equal(him.glasses, name); }
  him.customize({ glasses: 'none' });
  assert.equal(mesh(), undefined);
  assert.equal(him.features.glasses, 'none');
});

test('the woman: her own figure on the same mesh, in the women\'s cut of his clothes, with long hair', async () => {
  const { DIMENSIONS, FIGURES, HAIRSTYLES } = await import('../src/people/index.js');
  const her = createHuman(GFX, { sex: 'female', detail: 0.5, glasses: null });
  assert.equal(her.sex, 'female');
  assert.equal(her.features.sex, 'female');
  assert.equal(her.dimensions, DIMENSIONS.female);
  // Long blonde hair, blue eyes, groomed brows, no beard; a sports bra under what he wears.
  assert.deepEqual(her.hair, { hair: 'long', beard: null, brows: 'fine' });
  assert.equal(her.look.iris, '#4f7fb8');
  assert.ok(HAIRSTYLES.long.skinned);
  assert.deepEqual([...her.outfit].sort(), ['bra', 'briefs', 'jacket', 'jeans', 'sneakers', 'socks', 'tshirt']);
  // His skeleton's bones, at her joints.
  assert.deepEqual(her.skeleton.names, man.skeleton.names);
  assert.ok(FIGURES.female.joints.shoulder[0] < FIGURES.male.joints.shoulder[0] - 0.03, 'narrower shoulders');
  assert.ok(FIGURES.female.joints.hip[0] > FIGURES.male.joints.hip[0], 'wider hips');
  her.pose({ clip: 'idle', t: 0, time: 0 });
  her.dress([]);
  const { min, max } = boundsOf(her.body.geometry.attributes.position);
  assert.ok(Math.abs(max[1] - 1.65) < 0.03, `she stands 1.65 m (${max[1]})`);
  assert.ok(min[1] > -0.03 && min[1] < 0.02);
  // The same skin as his, point for point: the same count, and his garments' coverage still hides it.
  assert.equal(her.body.geometry.attributes.position.count, man.body.geometry.attributes.position.count);
  const bare = her.body.geometry.index.count;
  her.dress(['bra', 'briefs', 'tshirt', 'jeans']);
  assert.ok(her.body.geometry.index.count < bare * 0.88, 'her clothes hide her skin');
  // The shirt hangs off her bust: in front of the skin at the bust, and below it, not drawn in under it.
  her.pose({ clip: 'idle', t: 0, time: 0 });
  const front = (mesh, y0, y1) => {
    const p = mesh.geometry.attributes.position;
    let z = -Infinity;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > y0 && p.getY(i) < y1 && Math.abs(p.getX(i) - 0.08) < 0.02) z = Math.max(z, p.getZ(i));
    return z;
  };
  const { bustOf } = await import('../src/people/human/fit.js');
  const shirt = her.garment('tshirt'), bust = bustOf('female')[1];
  her.remove('tshirt').remove('bra');
  const skin = front(her.body, bust - 0.09, bust - 0.06);
  assert.ok(front(shirt, bust - 0.09, bust - 0.06) > skin + 0.008, 'the shirt bridges below her bust, not drawn in under it');
  // Every clip poses her, the long hair with her.
  const hair = her.group.children.find((c) => c.name === 'human hair');
  for (const clip of CLIPS) {
    her.pose({ clip, t: 0.4, time: 0.4 });
    for (const m of [her.body, hair]) {
      const p = m.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 97) assert.ok(Number.isFinite(p[i]), `${clip}`);
    }
  }
  // Her hair falls past her shoulders, and lies on them (skinned), not inside them.
  her.pose({ clip: 'idle', t: 0, time: 0 });
  assert.ok(boundsOf(hair.geometry.attributes.position).min[1] < FIGURES.female.joints.shoulder[1] - 0.1, 'long hair');
  assert.throws(() => her.customize({ sex: 'male' }), /chosen when the human is made/);
  // Each has their own: a bra is hers, a beard his.
  assert.throws(() => her.customize({ beard: 'full' }), /male figure only/);
  assert.throws(() => her.setHair({ beard: 'full' }), /male figure only/);
  assert.throws(() => man.wear('bra'), /no garment called bra/);
  const { customizationFor, garmentsFor } = await import('../src/people/index.js');
  assert.ok(!customizationFor('female').some((g) => g.slots.some((s) => s.key === 'beard')) && customizationFor('male').some((g) => g.slots.some((s) => s.key === 'beard')));
  assert.ok('bra' in garmentsFor('female') && !('bra' in garmentsFor('male')));
  // A held weapon sits in her hand: the grip as far from her wrist as it is from his.
  const offset = (who) => {
    const sword = createKrystalSword(GFX);
    who.hold(sword);
    who.pose({ clip: 'idle', t: 0, time: 0 });
    const hand = who.point('handR', who.skeleton.pivots[who.skeleton.index.get('handR')]);
    const e = sword.group.matrix.elements;
    who.release('R');
    return Math.hypot(e[12] - hand[0], e[13] - hand[1], e[14] - hand[2]);
  };
  assert.ok(Math.abs(offset(her) - offset(man)) < 0.03, 'the weapon is in her hand');
});

test('every shape slot is baked: each recipe in features.js is in data/shapes.js, and nothing else is', async () => {
  const { shapeRecipes, SLOTS } = await import('../src/people/human/features.js');
  const { SHAPES } = await import('../src/people/human/data/shapes.js');
  const { SHAPES: HERS } = await import('../src/people/human/data/shapes-female.js');
  assert.deepEqual(Object.keys(SHAPES).sort(), Object.keys(shapeRecipes()).sort(), 'rebake with scripts/bake-human.mjs --shapes-only');
  assert.deepEqual(Object.keys(HERS).sort(), Object.keys(shapeRecipes('female')).sort(), 'rebake with scripts/bake-human.mjs --female --shapes-only');
  assert.ok(Object.keys(shapeRecipes('female')['muscle+']).every((t) => t.includes('female-young')), 'her build is made of the female targets');
  for (const k of ['height', 'muscle', 'weight', 'shoulders', 'face', 'jaw', 'eyeShape', 'eyeSize', 'noseShape', 'mouthShape', 'earShape', 'browArch']) {
    assert.ok(SLOTS[k].ready, `${k} is built`);
  }
  for (const k of ['age', 'freckles', 'scars', 'tattoo', 'moustache', 'stubble', 'lipColour']) assert.ok(!SLOTS[k].ready, `${k} is not built yet`);
});

test('the creator shapes him: the skin, his joints, his eyes and all he wears follow, and he stays on the ground', () => {
  const him = createHuman(GFX, { detail: 0.5, outfit: ['briefs', 'tshirt', 'jeans', 'sneakers'], beard: 'full' });
  const mesh = (n) => him.group.children.find((m) => m.name === `human ${n}`);
  const rest = (n) => mesh(n).geometry.attributes.position.array.slice();
  const before = { body: rest('body'), tshirt: rest('tshirt'), beard: rest('beard'), hair: rest('hair') };
  const head = him.skeleton.pivots[him.skeleton.index.get('head')].slice();
  assert.equal(him.height, HUMAN_DIMENSIONS.height);

  him.customize({ height: 1 });
  assert.ok(him.height > 1.86 && him.height < 1.92, `taller: ${him.height}`);
  assert.ok(him.skeleton.pivots[him.skeleton.index.get('head')][1] > head[1] + 0.08, 'his head joint rises with him');
  assert.ok(Math.abs(boundsOf(mesh('body').geometry.attributes.position).min[1]) < 0.003, 'his soles stay on the ground');
  assert.ok(boundsOf(mesh('hair').geometry.attributes.position).min[1] > boundsOf({ array: before.hair, count: before.hair.length / 3 }).min[1] + 0.08, 'his hair rises with his head');

  // Heavier: the shirt goes out with the belly under it.
  him.customize({ height: 0, weight: 1 });
  const front = (a) => { let z = -Infinity; for (let i = 0; i < a.length; i += 3) if (a[i + 1] > 1.0 && a[i + 1] < 1.15 && Math.abs(a[i]) < 0.05) z = Math.max(z, a[i + 2]); return z; };
  assert.ok(front(rest('body')) > front(before.body) + 0.01, 'his belly comes forward');
  assert.ok(front(rest('tshirt')) > front(before.tshirt) + 0.01, 'and his shirt with it');

  // A nose shape moves the nose and nothing far from it.
  him.customize({ weight: 0, noseShape: 'hooked' });
  const body = rest('body');
  let near = 0, far = 0;
  for (let i = 0; i < body.length; i += 3) {
    const d = Math.hypot(body[i] - before.body[i], body[i + 1] - before.body[i + 1], body[i + 2] - before.body[i + 2]);
    if (before.body[i + 1] < 1.5) far = Math.max(far, d); else near = Math.max(near, d);
  }
  assert.ok(near > 0.005 && far < 1e-6, `the nose: ${near} near, ${far} below the face`);

  // Eyes further apart: the eyeballs and their bones go too.
  him.customize({ noseShape: 'straight', eyeSpacing: 1 });
  const eyeL = him.skeleton.pivots[him.skeleton.index.get('eyeL')], eyeR = him.skeleton.pivots[him.skeleton.index.get('eyeR')];
  assert.ok(eyeL[0] - eyeR[0] > 2 * 0.0298 + 0.002, 'the eyes are set wider apart');

  // Back as he was: exactly as baked.
  him.customize({ eyeSpacing: 0 });
  assert.deepEqual(rest('body'), before.body);
  assert.deepEqual(rest('beard'), before.beard);
  assert.deepEqual(him.skeleton.pivots[him.skeleton.index.get('head')], head);
});

test('a build sets the body sliders off from where they are, and a held weapon goes with his hand', () => {
  const him = createHuman(GFX, { detail: 0.5, features: { build: 'stocky' }, glasses: null });
  assert.ok(him.height < HUMAN_DIMENSIONS.height - 0.02, `a stocky build is shorter: ${him.height}`);
  const sword = createKrystalSword(GFX);
  him.hold(sword);
  him.pose({ clip: 'idle', t: 0, time: 0 });
  const at = (o) => [o.matrix.elements[12], o.matrix.elements[13], o.matrix.elements[14]];
  const low = at(sword.group ?? sword);
  him.customize({ build: 'average', height: 1 });
  const high = at(sword.group ?? sword);
  assert.ok(high[1] - low[1] > 0.04, `the grip rises with the hand: ${low[1]} to ${high[1]}`);
});

test('the woman is shaped by her own shapes, in her pose and at her size', () => {
  const her = createHuman(GFX, { detail: 0.5, sex: 'female', glasses: null });
  const body = () => her.group.children.find((m) => m.name === 'human body').geometry.attributes.position;
  const before = body().array.slice();
  assert.equal(her.height, 1.65);
  her.customize({ height: 1, build: 'athletic', noseShape: 'button' });
  assert.ok(her.height > 1.72 && her.height < 1.8, `taller: ${her.height}`);
  assert.ok(Math.abs(boundsOf(body()).min[1]) < 0.003, 'her soles stay on the ground');
  her.customize({ height: 0, build: 'average', noseShape: 'straight' });
  assert.deepEqual(body().array.slice(), before, 'back as she was');
});

test('the brows stay on the brow, however often either figure is reshaped', async () => {
  const { FIGURES } = await import('../src/people/index.js');
  for (const sex of ['male', 'female']) {
    const who = createHuman(GFX, { detail: 0.5, sex, glasses: null });
    const brows = () => boundsOf(who.group.children.find((m) => m.name === 'human brows').geometry.attributes.position);
    const eye = (s) => FIGURES[sex].eye.center[1] + (s - FIGURES[sex].height);
    for (const height of [1, 0.5, 1, -1, 1]) who.customize({ height, build: 'heavy' });
    who.pose({ clip: 'idle', t: 0, time: 0 });
    const b = brows();
    assert.ok(b.min[1] > eye(who.height) - 0.005 && b.max[1] < eye(who.height) + 0.05, `${sex}: brows over the eyes (${b.min[1].toFixed(3)}..${b.max[1].toFixed(3)}, eye ${eye(who.height).toFixed(3)})`);
    // And anyone made after carries none of it.
    const fresh = createHuman(GFX, { detail: 0.5, sex, glasses: null });
    const f = boundsOf(fresh.group.children.find((m) => m.name === 'human brows').geometry.attributes.position);
    assert.ok(f.min[1] > FIGURES[sex].eye.center[1] - 0.005 && f.max[1] < FIGURES[sex].eye.center[1] + 0.05, `${sex}: a fresh one's brows are where they belong`);
  }
});

test('arms never pass into the body, man or woman, slim or heavy, in any clip; and the idle stays smooth', () => {
  for (const sex of ['male', 'female']) {
    const who = createHuman(GFX, { detail: 0.5, sex, glasses: null });
    for (const f of [{}, { build: 'heavy', weight: 1 }, { build: 'slim' }]) {
      who.customize({ build: 'average', weight: 0, ...f });
      for (const clip of CLIPS) for (let i = 0; i < 12; i++) {
        const t = i / 12;
        who.pose({ clip, t, time: t * 2 });
        const d = who.armDepth();
        // (One exception, kept to: a heavy woman's follow-through, where the upper arm is against her side and
        // turning it out or forward cannot take it all the way clear without flinging it.)
        const most = sex === 'female' && f.build === 'heavy' && clip === 'attack' ? 0.015 : 0.0025;
        assert.ok(Math.max(d.L, d.R) < most, `${sex} ${JSON.stringify(f)} ${clip}@${t.toFixed(2)}: an arm ${(Math.max(d.L, d.R) * 1000).toFixed(1)} mm in`);
      }
      // Kept clear without a jolt: at 60 frames a second the idle's hands never lurch (second difference under 1 mm).
      const hands = [];
      for (let i = 0; i < 120; i++) {
        who.pose({ clip: 'idle', t: i / 60, time: i / 60 });
        hands.push(who.point('handL', who.skeleton.pivots[who.skeleton.index.get('handL')]));
      }
      for (let i = 2; i < hands.length; i++) {
        const jolt = Math.hypot(...[0, 1, 2].map((a) => hands[i][a] - 2 * hands[i - 1][a] + hands[i - 2][a]));
        assert.ok(jolt < 0.001, `${sex} ${JSON.stringify(f)} idle: the hand lurches ${(jolt * 1000).toFixed(2)} mm at frame ${i}`);
      }
    }
  }
});

test('a shape that moves only the legs lifts all of him with it, the eyes too', () => {
  const him = createHuman(GFX, { detail: 0.5, glasses: null });
  const eye = () => him.skeleton.pivots[him.skeleton.index.get('eyeL')][1];
  const before = eye();
  him.customize({ legLength: 1 });
  const grew = him.height - HUMAN_DIMENSIONS.height;
  assert.ok(grew > 0.02, `longer legs make him taller: ${grew}`);
  assert.ok(Math.abs(eye() - before - grew) < 0.005, 'his eyes rise as much as he does');
});
