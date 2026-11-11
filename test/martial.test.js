import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createHuman, CLIPS, STANCES, MOVES, BOWS, BLADE_MOVES } from '../src/people/index.js';
import { Skeleton } from '../src/models/rig.js';
import { bones } from '../src/people/human/skeleton.js';
import { moveHuman } from '../src/people/human/motion.js';
import { BOWS as BOW_DATA, mirrorPose, STANCE_DATA } from '../src/people/human/martial.js';
import { createKrystalSword } from '../src/weapons/index.js';

const posed = (sex, state, style = {}) => {
  const k = new Skeleton(bones(sex));
  moveHuman(k, state, style);
  k.compute();
  return k;
};
/** The height of the lowest point of each foot's sole. */
const soles = (k) => ['L', 'R'].map((S) => {
  const foot = k.pivots[k.index.get(`foot${S}`)], toes = k.pivots[k.index.get(`toes${S}`)];
  return Math.min(k.point(`foot${S}`, [foot[0], 0, foot[2] - 0.05])[1], k.point(`toes${S}`, [toes[0], 0, toes[2] + 0.045])[1]);
});
const rots = (k) => k.pose.flatMap((p) => [...p.rot, ...p.move]);

test('the fighting vocabulary is listed', () => {
  assert.ok(CLIPS.includes('stance') && CLIPS.includes('bow'));
  for (const s of ['boxing', 'karate', 'horse', 'crane', 'muaythai', 'taekwondo', 'fencing', 'kendo', 'hasso', 'waki', 'gedan', 'taiji']) assert.ok(STANCES.includes(s), s);
  for (const m of ['jab', 'cross', 'hook', 'uppercut', 'elbow', 'palm', 'shuto', 'front-kick', 'roundhouse', 'side-kick', 'knee', 'back-kick', 'rising', 'sweep', 'lunge', 'parry', 'riposte', 'whirl']) assert.ok(MOVES.includes(m), m);
  assert.deepEqual([...BLADE_MOVES].sort(), ['lunge', 'parry', 'riposte', 'rising', 'sweep', 'whirl']);
  assert.deepEqual(Object.keys(BOWS), Object.keys(BOW_DATA));
});

test('every stance has its feet on the floor, for him and for her, whichever foot leads', () => {
  for (const sex of ['male', 'female']) {
    for (const stance of STANCES) {
      for (const lead of ['L', 'R']) {
        const k = posed(sex, { clip: 'stance', time: 0.7 }, { stance, lead, armed: STANCE_DATA[stance].armed ? lead : null });
        const [l, r] = soles(k);
        assert.ok(Math.abs(Math.min(l, r)) < 0.003, `${sex} ${stance} ${lead}: the lowest sole is on the floor (${Math.min(l, r)})`);
        // Both planted, except the crane's drawn-up leg.
        if (stance !== 'crane') assert.ok(Math.max(l, r) < 0.04, `${sex} ${stance} ${lead}: the other foot is down too (${Math.max(l, r)})`);
      }
    }
  }
});

test('a stance mirrored is the mirror of it', () => {
  for (const stance of ['boxing', 'karate', 'taekwondo']) {
    const a = posed('male', { clip: 'stance', time: 0 }, { stance, lead: 'L' }), b = posed('male', { clip: 'stance', time: 0 }, { stance, lead: 'R' });
    for (const [x, y] of [['handL', 'handR'], ['footL', 'footR'], ['thighL', 'thighR']]) {
      const p = a.point(x, a.pivots[a.index.get(x)]), q = b.point(y, b.pivots[b.index.get(y)]);
      assert.ok(Math.abs(p[0] + q[0]) < 0.02 && Math.abs(p[1] - q[1]) < 0.02 && Math.abs(p[2] - q[2]) < 0.02, `${stance} ${x}`);
    }
  }
  const m = mirrorPose({ armL: [1, 2, 3], '@hips': [0.1, 0.2, 0.3] });
  assert.deepEqual(m.armR, [1, -2, -3]);
  assert.deepEqual(m['@hips'], [-0.1, 0.2, 0.3]);
});

test('every move leaves from its stance and comes back to it, and the feet stay planted at both ends', () => {
  for (const move of MOVES) {
    const home = { unarmed: null };
    const style = { attack: move, armed: BLADE_MOVES.includes(move) ? 'R' : null };
    const at0 = posed('male', { clip: 'attack', t: 0, time: 0 }, style), at1 = posed('male', { clip: 'attack', t: 1, time: 0 }, style);
    // The whirl and the back kick turn right round: the same pose, a full turn on.
    const a = rots(at0), b = rots(at1);
    a.forEach((v, i) => {
      const d = Math.abs(v - b[i]);
      assert.ok(d < 1e-6 || Math.abs(d - 2 * Math.PI) < 1e-6, `${move}: bone value ${i} is the same at the end as at the start`);
    });
    for (const k of [at0, at1]) assert.ok(Math.abs(Math.min(...soles(k))) < 0.003, `${move}: planted`);
    void home;
  }
});

test('a kick lifts the foot and keeps the other planted, and a punch reaches', () => {
  const mid = (move, t) => posed('male', { clip: 'attack', t, time: 0 }, { attack: move });
  for (const [move, t] of [['front-kick', 0.44], ['roundhouse', 0.46], ['side-kick', 0.46], ['knee', 0.44]]) {
    const k = mid(move, t), s = soles(k);
    assert.ok(Math.abs(Math.min(...s)) < 0.003, `${move}: one foot on the floor`);
    assert.ok(Math.max(...s) > 0.35, `${move}: the other is well off it (${Math.max(...s).toFixed(2)})`);
  }
  for (const [move, t, hand] of [['jab', 0.34, 'handL'], ['cross', 0.38, 'handR']]) {
    const k = mid(move, t), p = k.point(hand, k.pivots[k.index.get(hand)]), r = k.point(hand, k.pivots[k.index.get(hand)]);
    assert.ok(p[2] > 0.45 && r[1] > 1.1 && r[1] < 1.6, `${move}: the fist is out at shoulder height (${p.map((v) => v.toFixed(2))})`);
  }
});

test('the bow folds from the hips and comes back up', () => {
  const head = (t, bow) => { const k = posed('male', { clip: 'bow', t, bow }); return k.point('head', k.pivots[k.index.get('head')]); };
  const up = head(0, 'rei');
  for (const bow of Object.keys(BOWS)) {
    const down = head(0.5, bow), back = head(1, bow);
    assert.ok(down[1] < up[1] - 0.01 && down[2] > up[2] + 0.03, `${bow}: the head goes down and forward`);
    assert.ok(Math.hypot(back[0] - up[0], back[1] - up[1], back[2] - up[2]) < 0.005, `${bow}: and back up`);
  }
  assert.ok(head(0.5, 'deep')[1] < head(0.5, 'rei')[1] - 0.04, 'the formal bow is lower');
  const k = posed('male', { clip: 'bow', t: 0.5, bow: 'rei' });
  assert.ok(Math.abs(Math.min(...soles(k))) < 0.003, 'his feet stay on the floor');
});

test('he fights in his body: stances, moves and a bow pose the mesh, a blade held with both hands in kendo', () => {
  const man = createHuman(GFX, { detail: 0.5 });
  const finite = () => { const p = man.body.geometry.attributes.position.array; for (let i = 0; i < p.length; i += 97) assert.ok(Number.isFinite(p[i])); };
  for (const stance of ['boxing', 'horse', 'crane']) { man.setStyle({ stance }); man.pose({ clip: 'stance', time: 0.3 }); finite(); }
  man.setStyle({ stance: 'boxing' });
  assert.ok(man.hands, 'hands can be shaped');
  for (const move of MOVES.filter((m) => !BLADE_MOVES.includes(m))) { man.setStyle({ attack: move }); for (const t of [0.2, 0.4, 0.8]) { man.pose({ clip: 'attack', t, time: 0 }); finite(); } }
  man.pose({ clip: 'bow', t: 0.5, bow: 'deep' });
  finite();
  const sword = createKrystalSword(GFX);
  man.hold(sword);
  man.setStyle({ stance: 'kendo' });
  man.pose({ clip: 'stance', time: 0 });
  const b = sword.gripBounds, y = Math.max((b.bottom + b.top) / 2, b.top - 0.05), second = Math.max(b.bottom + 0.03, y - 0.085);
  const e = sword.group.matrix.elements, at = [e[4] * second + e[12], e[5] * second + e[13], e[6] * second + e[14]];
  const p = man.point('handL', [0.283, 0.79, 0.04]);
  assert.ok(Math.hypot(p[0] - at[0], p[1] - at[1], p[2] - at[2]) < 0.06, 'the left hand is on the sword in kendo\'s middle guard');
  for (const move of BLADE_MOVES) { man.setStyle({ attack: move, stance: undefined }); for (const t of [0.2, 0.45, 0.8]) { man.pose({ clip: 'attack', t, time: 0 }); finite(); } }
  man.release('R');
  man.setStyle({});
});
