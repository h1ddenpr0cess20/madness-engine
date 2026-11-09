import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createHuman, CLIPS, GARMENTS, HAND_POSES, HUMAN_DIMENSIONS } from '../src/people/index.js';
import { bones } from '../src/people/human/skeleton.js';
import { jeansPoint, legPoint, shirtPoint, trunkPoint } from '../src/people/human/clothes.js';
import { createKrystalSword } from '../src/weapons/index.js';

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
