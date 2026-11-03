import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHARACTERS } from '../src/characters/index.js';
import { joints } from '../src/characters/humanoid.js';
import { Skeleton } from '../src/models/rig.js';

/** A person's pose at time `t` in `clip`. */
const pose = (name, clip, t, speed = 1) => {
  const def = CHARACTERS[name], k = new Skeleton(def.bones);
  def.animate(k, { clip, t, time: t, seed: 0, speed });
  k.compute();
  return { def, k };
};

/** The most a bone is turned about x over a second of `clip`, forward (negative) and back. */
const swing = (name, clip, bone) => {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 120; i++) {
    const r = pose(name, clip, i / 100).k.bone(bone).rot[0];
    lo = Math.min(lo, r); hi = Math.max(hi, r);
  }
  return { lo, hi };
};

/** How many times a bone's x turn crosses its middle in a second: the cadence. */
const crossings = (name, clip, bone) => {
  let n = 0, was = null;
  const mid = (swing(name, clip, bone).lo + swing(name, clip, bone).hi) / 2;
  for (let i = 0; i <= 400; i++) {
    const above = pose(name, clip, (i / 400) * 2).k.bone(bone).rot[0] > mid;
    if (was !== null && above !== was) n++;
    was = above;
  }
  return n / 2;
};

/** The lowest the soles go (heel and toe of each foot, as built) at time `t` of `clip`. */
const sole = (name, clip, t) => {
  const { def, k } = pose(name, clip, t), J = joints(def.b ?? 1);
  let low = Infinity;
  for (const S of ['L', 'R']) {
    const a = J[`ankle${S}`];
    for (const dz of [-0.025, 0.09]) low = Math.min(low, k.point(`foot${S}`, def.warp.to([a[0], 0, a[2] + dz]))[1]);
  }
  return low;
};

test('a run is a quicker, longer stride than a walk, leaning in, with the arms bent and pumping', () => {
  for (const name of ['officeguy', 'beauty', 'fatman', 'teenboy']) {
    const walk = swing(name, 'walk', 'thighL'), run = swing(name, 'run', 'thighL');
    assert.ok(run.hi - run.lo > (walk.hi - walk.lo) * 1.4, `${name}'s legs swing further`);
    assert.ok(crossings(name, 'run', 'thighL') > crossings(name, 'walk', 'thighL') * 1.4, `${name} takes quicker steps`);
    // The knee of the swinging leg is driven up, and the elbows are bent to near a right angle.
    assert.ok(swing(name, 'run', 'shinL').hi > 1.6, `${name}'s knees come up`);
    assert.ok(swing(name, 'run', 'foreL').lo < -1.1 && swing(name, 'run', 'foreR').lo < -1.1, `${name}'s elbows are bent`);
    // Leaning forward into it.
    assert.ok(swing(name, 'run', 'spine').lo > 0.1, `${name} leans in`);
    // The arms swing against the legs.
    const t = 0.1, L = pose(name, 'run', t).k, a = L.bone('thighL').rot[0], b = L.bone('armL').rot[0];
    assert.ok(a * b < 0, `${name}'s left arm swings against the left leg`);
  }
});

test('a run keeps the feet near the floor, however long the legs', () => {
  for (const name of ['officeguy', 'fatman', 'preteengirl', 'babyboy']) {
    const rest = sole(name, 'idle', 0);
    let low = Infinity;
    for (let i = 0; i <= 120; i++) low = Math.min(low, sole(name, 'run', i / 100));
    assert.ok(low > rest - 0.025, `${name}: ${low} against ${rest}`);
  }
});

test('a jump crouches, leaves the ground, and lands and stands again; a leap does the same from a run', () => {
  for (const name of ['officeguy', 'beauty', 'babygirl', 'fatwoman']) {
    for (const clip of ['jump', 'leap']) {
      const rest = sole(name, 'idle', 0), root = (t) => pose(name, clip, t).k.bone('root').move[1];
      // In the air at the top of it, the hips and feet well up; on the ground at the start and (after it) again at the end.
      let top = 0, ttop = 0;
      for (let i = 0; i <= 120; i++) if (root(i / 100) > top) { top = root(i / 100); ttop = i / 100; }
      assert.ok(top > 0.05, `${name} ${clip} leaves the ground`);
      assert.ok(sole(name, clip, ttop) > rest + 0.05, `${name}'s feet are off the floor at the top of a ${clip}`);
      assert.ok(Math.abs(root(0)) < 1e-9 && Math.abs(root(1.5)) < 1e-9, `${name} ${clip} starts and ends on the ground`);
      // Crouched before it: the hips lower and the knees bent, but the feet not through the floor.
      const crouch = pose(name, clip, 0.2).k;
      assert.ok(crouch.bone('hips').move[1] < -0.03 && crouch.bone('thighL').rot[0] < -0.7, `${name} crouches for a ${clip}`);
      for (let i = 0; i <= 150; i += 5) assert.ok(sole(name, clip, i / 100) > rest - 0.04, `${name}'s feet stay out of the floor in a ${clip} at ${i / 100}`);
      // Stood up again after it, as at rest.
      assert.ok(Math.abs(pose(name, clip, 1.5).k.bone('hips').move[1]) < 1e-9, `${name} stands after a ${clip}`);
    }
  }
});

test('the character hooks that treat a walk specially treat a run the same, and none hands back a broken pose', () => {
  for (const name of ['santa', 'babyboy', 'ninja', 'guardsman', 'gatekeeper', 'motherstroller']) {
    for (const clip of ['run', 'jump', 'leap']) {
      const { k } = pose(name, clip, 0.3);
      for (const p of k.pose) assert.ok([...p.rot, ...p.move, ...p.scale].every(Number.isFinite), `${name} ${clip}`);
    }
  }
});
