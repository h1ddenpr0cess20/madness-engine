import { pathToFileURL } from 'node:url';

/** A small seeded generator, so both sides see the same world. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 20;

/**
 * One world, from a seed: a floor of tiles with random corner heights and some
 * wall-high ones, and boxes that hover, climb, fall and wait — over the floor
 * and across the balls' paths. `statics` adds the posts and tanks only the
 * town games have.
 */
function build(P, seed, { slideUnder, statics }) {
  const rand = rng(seed);
  const world = new P.World({ cols: SIZE, rows: SIZE, ...(slideUnder === undefined ? {} : { slideUnder }) });
  const h = Array.from({ length: SIZE + 1 }, () => Array.from({ length: SIZE + 1 }, () => (rand() < 0.15 ? rand() * 2.5 : rand() * 0.4)));
  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      const a = h[z][x], b = h[z][x + 1], c = h[z + 1][x], d = h[z + 1][x + 1];
      world.addTriangle(x, a, z, x, c, z + 1, x + 1, b, z);
      world.addTriangle(x + 1, b, z, x, c, z + 1, x + 1, d, z + 1);
    }
  }
  world.finish();
  const boxes = [];
  for (let i = 0; i < 9; i++) {
    const cx = 2 + rand() * (SIZE - 4), cz = 2 + rand() * (SIZE - 4);
    const hw = 0.5 + rand() * 1.4, hd = 0.5 + rand() * 1.4, hh = 0.15 + rand() * 0.3;
    const base = 0.55 + rand() * 0.9;
    const kind = ['still', 'hammer', 'lift', 'slide'][i % 4];
    boxes.push({ solid: true, cx, cz, hw, hd, hh, base, kind, phase: rand() * 6.28, amp: 0.3 + rand() * 1.2, min: [0, 0, 0], max: [0, 0, 0], vx: 0, vy: 0, vz: 0 });
  }
  world.boxes = boxes;
  if (statics) {
    for (let i = 0; i < 6; i++) {
      const x = 2 + rand() * (SIZE - 4), z = 2 + rand() * (SIZE - 4);
      world.addStatic({ min: [x, 0, z], max: [x + 0.4 + rand(), 1 + rand() * 2, z + 0.4 + rand()] });
    }
    for (let i = 0; i < 4; i++) {
      world.addCylinder({ x: 2 + rand() * (SIZE - 4), z: 2 + rand() * (SIZE - 4), r: 0.3 + rand() * 0.6, y0: 0, y1: 0.8 + rand() * 2 });
    }
  }
  return world;
}

/** Moves the boxes to time `t`, setting their speeds to match. */
function moveBoxes(world, t) {
  for (const b of world.boxes) {
    const w = 1.3, s = Math.sin(t * w + b.phase), c = Math.cos(t * w + b.phase);
    let dx = 0, dy = 0, dz = 0;
    if (b.kind === 'hammer') dy = b.amp * s, b.vy = b.amp * w * c;
    else if (b.kind === 'lift') dy = b.amp * Math.max(0, s), b.vy = s > 0 ? b.amp * w * c : 0;
    else if (b.kind === 'slide') dx = b.amp * s, b.vx = b.amp * w * c, b.vy = 0;
    else b.vy = 0;
    if (b.kind !== 'slide') b.vx = 0;
    b.vz = 0;
    const y = b.base + dy;
    b.min = [b.cx + dx - b.hw, y - b.hh, b.cz + dz - b.hd];
    b.max = [b.cx + dx + b.hw, y + b.hh, b.cz + dz + b.hd];
  }
}

const fields = ['x', 'y', 'z', 'vx', 'vy', 'vz', 'grounded', 'nx', 'ny', 'nz', 'peak'];

function snapshot(balls, results, world) {
  const idx = (b) => (b ? world.boxes.indexOf(b) : -1);
  return JSON.stringify(balls.map((b, i) => [
    fields.map((f) => b[f]), idx(b.on),
    results[i] && [results[i].impact, results[i].landed, results[i].drop, results[i].crushed, idx(results[i].squeezedFrom)],
  ]), (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v));
}

/** Runs the scenario; returns the state of every ball after every step. */
function run(P, seed, options) {
  const rand = rng(seed ^ 0x9e3779b9);
  const world = build(P, seed, options);
  const balls = [0, 1, 2].map((i) => P.createBall({ x: 3 + i * 5 + rand(), y: 3, z: 3 + rand() * 12, r: i === 2 ? 0.5 : 0.35 }));
  const push = balls.map(() => [0, 0]);
  const states = [];
  const dt = 1 / 120;
  for (let step = 0; step < 4800; step++) {
    // Every so often each ball sets off at a box, so that they go under overhangs and edges.
    if (step % 40 === 0) {
      balls.forEach((b, i) => {
        const to = world.boxes[Math.floor(rand() * world.boxes.length)];
        if (rand() < 0.6) {
          const dx = to.cx - b.x, dz = to.cz - b.z, d = Math.hypot(dx, dz) || 1;
          push[i][0] = dx / d; push[i][1] = dz / d;
        } else {
          push[i][0] = rand() * 2 - 1; push[i][1] = rand() * 2 - 1;
        }
      });
    }
    moveBoxes(world, step * dt);
    const results = balls.map((b, i) => P.stepBall(b, world, push[i][0], push[i][1], dt, i === 1 && step % 3 === 0 ? { topSpeed: 14, push: 25 } : undefined));
    P.collideBalls(balls[0], balls[1]);
    P.collideBalls(balls[1], balls[2], 0.5);
    for (const b of balls) { P.rollSpin(b); }
    states.push(snapshot(balls, results, world));
  }
  return states;
}

/**
 * Whether `engine` steps balls exactly as `original` does, over `seeds`
 * worlds, bit for bit: every ball's every field after every step.
 */
export async function comparePhysics(originalPath, enginePath, { slide, statics = slide, seeds = 6 }) {
  const original = await import(pathToFileURL(originalPath));
  const engine = await import(pathToFileURL(enginePath));
  let steps = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const options = { statics };
    const a = run(original, seed, options);
    const b = run(engine, seed, { ...options, slideUnder: slide });
    steps += a.length;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return { ok: false, detail: `seed ${seed}, step ${i}:\n  original ${a[i]}\n  engine   ${b[i]}` };
    }
  }
  // The scenario has to reach the code that differs, or agreeing proves nothing.
  let reaches = false;
  for (let seed = 1; seed <= seeds && !reaches; seed++) {
    const off = run(engine, seed, { statics, slideUnder: false });
    const on = run(engine, seed, { statics, slideUnder: true });
    reaches = off.some((s, i) => s !== on[i]);
  }
  return { ok: true, steps, reaches };
}
