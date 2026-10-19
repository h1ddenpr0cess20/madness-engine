import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BREAK_SPEED, closestOnTriangle, collideBalls, createBall, FALL_LIMIT, placeBall, rollSpin, stepBall, World } from '../src/physics.js';

const STEP = 1 / 120;

/** A flat floor `size` tiles square at height `h`. */
function floor(size = 10, h = 0, options = {}) {
  const w = new World({ cols: size, rows: size, ...options });
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      w.addTriangle(x, h, z, x, h, z + 1, x + 1, h, z);
      w.addTriangle(x + 1, h, z, x, h, z + 1, x + 1, h, z + 1);
    }
  }
  return w.finish();
}

const run = (ball, world, seconds, push = [0, 0]) => {
  const results = [];
  for (let t = 0; t < seconds; t += STEP) results.push(stepBall(ball, world, push[0], push[1], STEP));
  return results;
};

test('the nearest point on a triangle: inside, past a corner, past an edge', () => {
  const tri = [0, 0, 0, 2, 0, 0, 0, 0, 2];
  const out = [0, 0, 0];
  closestOnTriangle(0.5, 3, 0.5, tri, 0, out);
  assert.deepEqual(out, [0.5, 0, 0.5]);
  closestOnTriangle(-1, 1, -1, tri, 0, out);
  assert.deepEqual(out, [0, 0, 0]);
  closestOnTriangle(1, 0, -3, tri, 0, out);
  assert.deepEqual(out, [1, 0, 0]);
});

test('a ball dropped on a floor lands on it, rests there, and is grounded', () => {
  const world = floor();
  const ball = createBall({ x: 5, y: 2, z: 5 });
  const results = run(ball, world, 3);
  assert.ok(results.some((r) => r.landed));
  assert.ok(Math.abs(ball.y - ball.r) < 0.01, `rests at ${ball.y}`);
  assert.ok(ball.grounded);
});

test('pushed, a ball rolls the way it is pushed, and not past its top speed', () => {
  const world = floor(40);
  const ball = createBall({ x: 2, y: 0.35, z: 20 });
  run(ball, world, 4, [1, 0]);
  assert.ok(ball.x > 6 && ball.vx > 0);
  assert.ok(Math.hypot(ball.vx, ball.vz) < 9.5);
});

test('a drop past the limit onto level ground lands hard enough to break', () => {
  const world = floor();
  const ball = createBall({ x: 5, y: FALL_LIMIT + 1.5, z: 5 });
  const results = run(ball, world, 3);
  assert.ok(Math.max(...results.map((r) => r.impact)) > BREAK_SPEED);
});

test('a ball is placed at rest', () => {
  const ball = createBall({ x: 1, y: 1, z: 1 });
  ball.vx = 3; ball.grounded = true;
  placeBall(ball, 4, 5, 6);
  assert.deepEqual([ball.x, ball.y, ball.z, ball.vx, ball.grounded], [4, 5, 6, 0, false]);
});

test('two balls that touch push apart, the lighter one the further', () => {
  const a = createBall({ x: 0, y: 0, z: 0, mass: 1 });
  const b = createBall({ x: 0.5, y: 0, z: 0, mass: 4 });
  a.vx = 4;
  collideBalls(a, b);
  assert.ok(a.vx < 4);
  assert.ok(b.vx > 0);
  assert.ok(Math.abs(a.vx) > Math.abs(b.vx));
});

test('a rolling ball spins about the axis across its travel', () => {
  const ball = createBall();
  ball.vx = 2;
  const w = rollSpin(ball);
  assert.ok(Math.abs(w[2]) > 0 && w[0] === 0);
});

test('a box that never moves holds a ball back, and a cylinder too', () => {
  const world = floor(12);
  world.addStatic({ min: [6, 0, 4], max: [7, 2, 8] });
  world.addCylinder({ x: 3, z: 9, r: 0.5, y0: 0, y1: 2 });
  const a = createBall({ x: 3, y: 0.35, z: 6 });
  run(a, world, 3, [1, 0]);
  assert.ok(a.x < 6, `stopped at ${a.x}`);
  const b = createBall({ x: 3, y: 0.35, z: 11 });
  run(b, world, 3, [0, -1]);
  assert.ok(b.z > 9.5, `stopped at ${b.z}`);
});

test('a box carries what stands on it', () => {
  const world = floor();
  const lift = { solid: true, min: [3, 0.5, 3], max: [7, 1, 7], vx: 0, vy: 0, vz: 0 };
  world.boxes.push(lift);
  const ball = createBall({ x: 5, y: 1.4, z: 5 });
  run(ball, world, 1);
  assert.ok(ball.on === lift);
  const before = ball.y;
  lift.vy = 1;
  for (let t = 0; t < 1; t += STEP) {
    lift.min[1] += STEP; lift.max[1] += STEP;
    stepBall(ball, world, 0, 0, STEP);
  }
  assert.ok(ball.on === lift);
  assert.ok(Math.abs(ball.y - (before + 1)) < 0.05, `rose from ${before} to ${ball.y}`);
});

test('at the edge of a box overhead, a ball is pushed down and away — or, where the world slides under, only away', () => {
  const edge = (options) => {
    const world = floor(12, 0, options);
    world.boxes.push({ solid: true, min: [4, 0.5, 4], max: [8, 1.5, 8], vx: 0, vy: 0, vz: 0 });
    // Resting on the floor with its top just under the box's underside, beside its edge.
    const ball = createBall({ x: 3.7, y: 0.35, z: 6 });
    stepBall(ball, world, 0, 0, STEP);
    return ball;
  };
  const sliding = edge({ slideUnder: true });
  const pushed = edge({});
  assert.notEqual(sliding.x, pushed.x);
  // Straight out from the edge: aside, with nothing sent down at the floor.
  assert.ok(sliding.x < pushed.x);
  assert.equal(new World({ cols: 1, rows: 1 }).slideUnder, false);
});
