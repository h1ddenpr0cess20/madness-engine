import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createHuman, CLIPS, STANCES, MOVES, BOWS, BLADE_MOVES } from '../src/people/index.js';
import { Skeleton } from '../src/models/rig.js';
import { bones } from '../src/people/human/skeleton.js';
import { moveHuman } from '../src/people/human/motion.js';
import { BOWS as BOW_DATA, mirrorPose, STANCE_DATA } from '../src/people/human/martial.js';
import { DANCES, DANCE_DATA } from '../src/people/human/dance.js';
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
  for (const s of ['boxing', 'karate', 'horse', 'crane', 'muaythai', 'taekwondo', 'fencing', 'kendo', 'hasso', 'waki', 'gedan', 'taiji', 'tiger', 'cat', 'wingchun', 'beckon', 'seiza', 'jodan', 'iai']) assert.ok(STANCES.includes(s), s);
  for (const m of ['jab', 'cross', 'hook', 'uppercut', 'elbow', 'palm', 'shuto', 'front-kick', 'roundhouse', 'side-kick', 'knee', 'back-kick', 'rising', 'sweep', 'lunge', 'parry', 'riposte', 'whirl', 'chain-punch', 'tiger-claw', 'crane-strike', 'sweep-kick', 'high-block', 'low-block', 'nukitsuke', 'chiburi', 'noto', 'men']) assert.ok(MOVES.includes(m), m);
  assert.deepEqual([...BLADE_MOVES].sort(), ['chiburi', 'lunge', 'men', 'noto', 'nukitsuke', 'parry', 'riposte', 'rising', 'sweep', 'whirl']);
  assert.deepEqual(Object.keys(BOWS), Object.keys(BOW_DATA));
  assert.ok(BOWS.zarei, 'the kneeling bow');
});

test('every stance has its feet on the floor, for him and for her, whichever foot leads', () => {
  for (const sex of ['male', 'female']) {
    for (const stance of STANCES.filter((s) => !STANCE_DATA[s].kneeling)) {
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

test('seiza and the kneeling bow rest on the knees, with the hips down on the heels', () => {
  for (const sex of ['male', 'female']) {
    const knee = (k) => ['L', 'R'].map((S) => k.point(`shin${S}`, k.pivots[k.index.get(`shin${S}`)])[1]);
    const hips = (k) => k.point('hips', k.pivots[k.index.get('hips')])[1];
    const sit = posed(sex, { clip: 'stance', time: 0 }, { stance: 'seiza' });
    for (const y of knee(sit)) assert.ok(Math.abs(y - 0.05) < 0.003, `${sex}: a knee is on the floor (${y})`);
    assert.ok(hips(sit) < 0.35, `${sex}: sat back on the heels (hips at ${hips(sit).toFixed(2)})`);
    const down = posed(sex, { clip: 'bow', t: 0.5, bow: 'zarei' });
    for (const y of knee(down)) assert.ok(Math.abs(y - 0.05) < 0.003, `${sex}: and still on them bowing`);
    assert.ok(down.point('head', down.pivots[down.index.get('head')])[1] < sit.point('head', sit.pivots[sit.index.get('head')])[1] - 0.06, `${sex}: the head goes down`);
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
  // (The sheathing starts with the sword drawn, and ends in the stance.)
  for (const move of MOVES.filter((m) => m !== 'noto')) {
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
  for (const bow of Object.keys(BOWS)) {
    const up = head(0, bow), down = head(0.5, bow), back = head(1, bow);
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

test('no stance, move or bow puts an arm through his body, man or woman, slim or heavy', () => {
  for (const [sex, build] of [['male', 'average'], ['male', 'heavy'], ['female', 'average'], ['female', 'heavy']]) {
    const who = createHuman(GFX, { detail: 0.5, sex, glasses: null });
    who.customize({ build, weight: build === 'heavy' ? 1 : 0 });
    const check = (what, state, style) => {
      who.setStyle(style);
      who.pose(state);
      const d = who.armDepth();
      // (A couple of millimetres: the same tolerance as the other clips, a little over for the sword's second hand.)
      assert.ok(Math.max(d.L, d.R) < 0.005, `${sex} ${build} ${what}: an arm ${(Math.max(d.L, d.R) * 1000).toFixed(1)} mm in`);
    };
    for (const stance of STANCES.filter((s) => !STANCE_DATA[s].armed)) check(`stance ${stance}`, { clip: 'stance', time: 0.5 }, { stance });
    for (const move of MOVES.filter((m) => !BLADE_MOVES.includes(m))) for (const t of [0.1, 0.22, 0.34, 0.46, 0.7]) check(`${move}@${t}`, { clip: 'attack', t, time: 0 }, { attack: move });
    for (const bow of Object.keys(BOWS)) for (const t of [0.15, 0.3, 0.5, 0.7]) check(`bow ${bow}@${t}`, { clip: 'bow', t, bow }, {});
    // With a sword in the hand: the blade stances and moves, the second hand on the grip in kendo and hasso.
    who.hold(createKrystalSword(GFX));
    for (const stance of STANCES.filter((s) => STANCE_DATA[s].armed)) check(`stance ${stance}`, { clip: 'stance', time: 0.5 }, { stance });
    for (const move of BLADE_MOVES) for (const t of [0.1, 0.22, 0.34, 0.46, 0.7]) check(`${move}@${t}`, { clip: 'attack', t, time: 0 }, { attack: move });
    who.release('R');
  }
});

test('every dance loops exactly, keeps its feet down and moves', () => {
  for (const sex of ['male', 'female']) {
    for (const name of DANCES) {
      const at = (t) => posed(sex, { clip: 'dance', time: t, dance: name });
      const period = DANCE_DATA[name].period;
      for (const t of [0, 0.31, 0.77]) {
        const a = rots(at(t)), b = rots(at(t + period));
        // (To within the breathing, which has a beat of its own: the collarbones' hundredth of a radian.)
        a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 0.03, `${sex} ${name}: a whole loop on is the same pose (bone value ${i}: ${v} then ${b[i]})`));
      }
      let moved = 0;
      for (let i = 0; i < 16; i++) {
        const k = at((i / 16) * period), [l, r] = soles(k);
        assert.ok(Math.abs(Math.min(l, r)) < 0.004, `${sex} ${name}@${i}: a foot on the floor`);
        const p = k.point('handL', k.pivots[k.index.get('handL')]), q = at(0).point('handL', k.pivots[k.index.get('handL')]);
        moved = Math.max(moved, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
      }
      assert.ok(moved > 0.03, `${sex} ${name}: it moves`);
    }
  }
  // Faster is the same dance sooner.
  const slow = rots(posed('male', { clip: 'dance', time: 0.4, speed: 1, dance: 'bounce' })), fast = rots(posed('male', { clip: 'dance', time: 0.2, speed: 2, dance: 'bounce' }));
  slow.forEach((v, i) => assert.ok(Math.abs(v - fast[i]) < 0.03));
});
