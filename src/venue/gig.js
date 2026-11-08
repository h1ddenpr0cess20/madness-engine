import { createHype, earn, smashed } from './hype.js';
import { heal, hurt, createIntegrity, HARM, revive, shattered } from './integrity.js';
import { BREAK_SPEED, createBall, placeBall, PUSH, ROLL_DRAG, stepBall, TOP_SPEED } from '../physics.js';
import { BALL_RADIUS, createRoll, stepRoll } from './roll.js';
import { closingSpeed, resolveImpact } from './smash.js';
import { buildVenue, DEPTH, HEADING } from './venue.js';
import { groundAxes } from '../views/arcade.js';

/** What smashing a prop is worth. */
export const PROP_HYPE = 15;

/**
 * One venue as it is played, without anything drawn or heard: the venue, what
 * moves and lies about in it, the hero, and the rules — what costs it
 * integrity, what it smashes and what bounces it back, what it can pick up,
 * what the floor does to it, and where it goes back to after a fall. The game
 * draws it and keeps the screens; the tests drive it with an autopilot.
 * (A venue is played as a "gig": the names came from Rock 'n' Roller, where
 * they were.)
 *
 * What is the game's own is handed to `createGig`: `loadVenue` (the venues),
 * `createActors` (what moves in them) and `pickups` (what each kind of
 * pickup does).
 */

/** The physics runs at a fixed rate, whatever the frame rate. */
export const STEP = 1 / 120;

/** How hard the hero grips level ground when nothing pushes it: below `below` tiles a second, `rate` of its speed a second goes. */
export const GRIP = Object.freeze({ below: 1.4, rate: 6 });

/** Rev: hold it and it pushes harder and goes faster, as long as the meter lasts. */
export const REV = Object.freeze({ push: 1.5, topSpeed: 13, drain: 55, regen: 26, least: 15, max: 100 });

/** Sticky floor (mud, fake blood, wet paint): it pushes less well, tops out slow, and slows by itself. */
export const STICKY = Object.freeze({ push: 0.5, topSpeed: 4.2, drag: 1.8 });

/** Ice: how much of its push grips (very little), and how much of the rolling drag it takes away (most of it). */
export const ICE = Object.freeze({ push: 0.3, glide: 0.85 });

/** A belt carries whatever is on it up to this speed, as hard as this. */
export const BELT = Object.freeze({ speed: 3.4, accel: 16 });

/** A bumper throws it back at least this fast. */
export const BUMPER_SPEED = 7;

/** A push on the screen (x right, y up) as a push along the ground, for a camera turned to `yaw`. */
export function toGround({ x, y }, yaw) {
  const { right, up } = groundAxes(yaw);
  return [x * right[0] + y * up[0], x * right[1] + y * up[1]];
}

/**
 * What each kind of pickup does when it is rolled over. `score: n` is points
 * (its `amount`) and `n` toward the pickup count; `heal` puts its `amount`
 * back on the hero's integrity; `revive` is a spare, to get up again with;
 * `pass` opens the gates; `token` is a collectible, counted and worth its
 * `amount`. A game names its own kinds ('pick', 'popcorn', 'whetstone') and
 * passes the table to `createGig`.
 */
export const PICKUPS = Object.freeze({
  pick: { score: 1 },
  stash: { score: 5 },
  repair: { heal: true },
  spare: { revive: true },
  pass: { pass: true },
  token: { token: true },
});

/**
 * Starts venue `index` of the game. `loadVenue(index)` returns the Venue and
 * `createActors(GFX, venue, world, { killY })` what moves in it. `ball` and
 * `roll` are the hero's physics and turning, `pickups` the table above.
 */
export function createGig(GFX, index, { loadVenue, createActors, pickups = PICKUPS, ball = createBall({ r: BALL_RADIUS, mass: 6 }), roll = createRoll() } = {}) {
  if (typeof loadVenue !== 'function' || typeof createActors !== 'function') throw new TypeError('createGig needs the game\'s loadVenue and createActors');
  const venue = loadVenue(index);
  const built = buildVenue(venue);
  const killY = venue.lowest - DEPTH - 2;
  const actors = createActors(GFX, venue, built.world, { killY });
  const { x, z } = venue.start;
  const safe = [x + 0.5, venue.heightAt(x + 0.5, z + 0.5) + ball.r, z + 0.5];
  const gig = {
    index, venue, built, world: built.world, actors, killY, ball, roll, pickups,
    time: 0, safe, passes: 0, explored: new Uint8Array(venue.cols * venue.rows), lockedAt: -Infinity,
    hero: createIntegrity(), hype: createHype(), rev: REV.max, revving: false,
    stats: { foes: venue.foes.length, smashed: 0, pickups: 0, tokens: 0, damage: 0, falls: 0 },
  };
  actors.place(0);
  placeBall(ball, ...safe);
  explore(gig);
  return gig;
}

/** The hero back on the last safe ground it rolled over. */
export function putBack(gig) {
  placeBall(gig.ball, ...gig.safe);
  gig.ball.vx = gig.ball.vy = gig.ball.vz = 0;
}

/** Marks the tiles round the hero as seen, for the map. */
function explore(gig) {
  const { venue, ball, explored } = gig;
  const cx = Math.floor(ball.x), cz = Math.floor(ball.z), r = 6;
  for (let j = cz - r; j < cz + r + 1; j++) {
    for (let i = cx - r; i < cx + r + 1; i++) {
      if (i < 0 || j < 0 || i >= venue.cols || j >= venue.rows) continue;
      if ((i - cx) ** 2 + (j - cz) ** 2 <= r * r) explored[j * venue.cols + i] = 1;
    }
  }
}

/** The unit vector from (ax, az) to (bx, bz), or `fallback` if they are one and the same. */
const unit = (ax, az, bx, bz, fallback = [0, 1]) => {
  const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz);
  return d < 1e-6 ? fallback : [dx / d, dz / d];
};

/** Takes `how` off the hero's integrity, and notes it. Returns what it took. */
function harm(gig, amount) {
  const took = hurt(gig.hero, amount);
  gig.stats.damage += took;
  return took;
}

/**
 * One step of everything. `push` is along the ground ([x, z]). While `live`,
 * the rules apply and the foes give chase; while `moving` is false, the hero
 * stays where it is (zapped, or smashed). `rev` is whether the rev button
 * is held.
 *
 * Returns what happened:
 *   `impact`   how hard it hit anything.
 *   `outcome`  null, 'exit', how it was lost ('fell', 'zapped', 'crushed'),
 *              or 'shattered' (no integrity, and no spare to save it).
 *   `hurt`     { how, amount } for harm that doesn't lose it (pyro, a
 *              hard landing), and for losing it too.
 *   `hits`     every foe it ran into: { foe, grade, speed, damage, gain,
 *              multiplier, combo, down, dir } — `down` if they went.
 *   `picked`   whatever it picked up.
 *   `door`     'opened', 'locked' or 'sturdy' (a breakaway too strong for the speed).
 *   `broke`    the breakaways it broke.
 *   `smashed`  the props it smashed.
 *   `bumped`   the bumpers it bounced off.
 *   `revived`  true if a spare brought it back.
 *   `events`   something dropped, or an effect fired: { type, x, y, z }.
 */
export function stepGig(gig, push, dt = STEP, { live = true, moving = true, rev = false } = {}) {
  const ball = gig.ball;
  const venue = gig.venue;
  gig.time += dt;
  gig.actors.place(gig.time, dt);
  const touched = gig.actors.step(dt, gig.time, live && moving ? ball : null);
  const out = { impact: 0, outcome: null, hurt: null, hits: [], picked: [], door: null, broke: [], smashed: [], bumped: [], revived: false, events: gig.actors.drain() };
  if (!moving) return out;

  const cx0 = Math.floor(ball.x), cz0 = Math.floor(ball.z);
  const under = venue.cell(cx0, cz0);

  // Rev: the meter drains while it is held and there is some left, and fills when it isn't.
  const wasRevving = gig.revving;
  gig.revving = live && rev && (gig.rev > 0) && (wasRevving || gig.rev >= REV.least);
  gig.rev = Math.max(0, Math.min(REV.max, gig.rev + (gig.revving ? -REV.drain : REV.regen * (ball.grounded ? 1 : 0.5)) * dt));
  const options = gig.revving ? { push: PUSH * REV.push, topSpeed: REV.topSpeed } : {};

  const onFloor0 = ball.grounded && !ball.on && under;
  if (onFloor0 && under.fx === 'sticky') {
    options.push = (options.push ?? PUSH) * STICKY.push;
    options.topSpeed = Math.min(options.topSpeed ?? TOP_SPEED, gig.revving ? 6 : STICKY.topSpeed);
    const k = Math.max(0, 1 - STICKY.drag * dt);
    ball.vx *= k; ball.vz *= k;
  } else if (onFloor0 && under.fx === 'ice') {
    options.push = (options.push ?? PUSH) * ICE.push;
    // The rolling drag the physics will take off, nearly all of it given back: it slides.
    const k = 1 + ROLL_DRAG * ICE.glide * dt;
    ball.vx *= k; ball.vz *= k;
  } else if (onFloor0 && under.fx === 'belt') {
    const [dx, dz] = HEADING[under.heading ?? '+x'];
    if (ball.vx * dx + ball.vz * dz < BELT.speed) {
      ball.vx += dx * BELT.accel * dt;
      ball.vz += dz * BELT.accel * dt;
    }
  }

  // Breakaways: fast enough and they are gone before it reaches them; not fast enough and they hold.
  const speed0 = Math.hypot(ball.vx, ball.vz);
  // Props, the same: a camera, a table, a row of seats, gone if it comes at it fast enough.
  for (const p of gig.actors.props) {
    if (p.broken >= 0) continue;
    const reach = ball.r + 0.1 + speed0 * dt * 2;
    const qx = Math.max(p.box.min[0], Math.min(ball.x, p.box.max[0]));
    const qy = Math.max(p.box.min[1], Math.min(ball.y, p.box.max[1]));
    const qz = Math.max(p.box.min[2], Math.min(ball.z, p.box.max[2]));
    const ex = qx - ball.x, ez = qz - ball.z;
    if (Math.hypot(ex, qy - ball.y, ez) > reach) continue;
    const toward = speed0 > 0 ? (ball.vx * ex + ball.vz * ez) / (speed0 * (Math.hypot(ex, ez) || 1)) : 0;
    if (toward < 0.3 || speed0 < p.breakAt) continue;
    gig.actors.smashProp(p, gig.time);
    out.smashed.push(p);
    earn(gig.hype, PROP_HYPE);
    ball.vx *= 0.9; ball.vz *= 0.9;
  }
  for (const g of gig.actors.doors) {
    if (g.kind !== 'panel' || !g.box.solid || g.broken >= 0) continue;
    const reach = ball.r + 0.12 + speed0 * dt * 2;
    const qx = Math.max(g.box.min[0], Math.min(ball.x, g.box.max[0]));
    const qy = Math.max(g.box.min[1], Math.min(ball.y, g.box.max[1]));
    const qz = Math.max(g.box.min[2], Math.min(ball.z, g.box.max[2]));
    const ex = qx - ball.x, ez = qz - ball.z;
    if (Math.hypot(ex, qy - ball.y, ez) > reach) continue;
    // Going at it, not just brushing past.
    const toward = speed0 > 0 ? (ball.vx * ex + ball.vz * ez) / (speed0 * (Math.hypot(ex, ez) || 1)) : 0;
    if (toward < 0.35) continue;
    if (speed0 >= g.breakAt) {
      gig.actors.breakDoor(g, gig.time);
      g.box.solid = false;
      out.broke.push(g);
      ball.vx *= 0.88; ball.vz *= 0.88;
    } else if (gig.time - gig.lockedAt > 1.5) {
      gig.lockedAt = gig.time;
      out.door = 'sturdy';
    }
  }

  const result = stepBall(ball, gig.world, push[0], push[1], dt, options);
  // A boulder doesn't coast like a marble. Let go of it on level ground and it soon stops.
  if (ball.grounded && !ball.on && Math.hypot(push[0], push[1]) < 0.05 && ball.ny > 0.97 && !(under?.fx === 'belt')) {
    const speed = Math.hypot(ball.vx, ball.vz);
    if (speed < GRIP.below) {
      const k = Math.max(0, 1 - GRIP.rate * dt);
      ball.vx *= k;
      ball.vz *= k;
    }
  }
  stepRoll(gig.roll, ball, dt);
  out.impact = result.impact;
  if (!live) return out;

  const cx = Math.floor(ball.x), cz = Math.floor(ball.z);
  const cell = venue.cell(cx, cz);
  const onFloor = ball.grounded && !ball.on && cell && ball.y - ball.r - venue.heightAt(ball.x, ball.z) < 0.2;

  const lose = (how) => {
    const amount = HARM[how];
    harm(gig, amount);
    gig.stats.falls += 1;
    out.hurt = { how, amount };
    out.outcome = how;
  };
  if (result.crushed) { lose('crushed'); return finish(gig, out); }
  if (onFloor && cell.kind === 'zap') { lose('zapped'); return finish(gig, out); }
  if (ball.y < gig.killY) { lose('fell'); return finish(gig, out); }
  if (result.landed && result.impact > BREAK_SPEED) {
    harm(gig, HARM.thud);
    out.hurt = { how: 'thud', amount: HARM.thud };
  }

  for (const s of gig.actors.spikes) {
    if (s.out < 0.5 || !onFloor) continue;
    if (cx < s.x || cz < s.z || cx >= s.x + s.w || cz >= s.z + s.d) continue;
    const cycle = Math.floor((gig.time + s.phase) / s.period);
    if (s.struck === cycle) continue;
    s.struck = cycle;
    harm(gig, HARM.burnt);
    out.hurt = { how: 'burnt', amount: HARM.burnt };
    ball.vy = 7;
    ball.grounded = false;
  }

  if (touched) hit(gig, touched, out);

  for (const b of gig.actors.bumpers) {
    const dx = ball.x - b.x, dz = ball.z - b.z, d = Math.hypot(dx, dz);
    if (d >= b.radius + ball.r || Math.abs(ball.y - ball.r - b.y) > 0.6) continue;
    const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
    ball.x = b.x + nx * (b.radius + ball.r);
    ball.z = b.z + nz * (b.radius + ball.r);
    const vn = ball.vx * nx + ball.vz * nz;
    if (vn < BUMPER_SPEED) {
      ball.vx += nx * (BUMPER_SPEED - vn);
      ball.vz += nz * (BUMPER_SPEED - vn);
    }
    b.hit = gig.time;
    out.bumped.push(b);
  }

  for (const p of gig.actors.pickups) {
    if (p.taken) continue;
    if (Math.hypot(p.x - ball.x, p.z - ball.z) < 0.6 && Math.abs(ball.y - ball.r - p.y) < 0.8) {
      p.taken = true;
      collect(gig, p);
      out.picked.push(p);
    }
  }

  for (const g of gig.actors.doors) {
    if (g.kind !== 'gate' || !g.box.solid || g.opening >= 0) continue;
    const qx = Math.max(g.box.min[0], Math.min(ball.x, g.box.max[0]));
    const qy = Math.max(g.box.min[1], Math.min(ball.y, g.box.max[1]));
    const qz = Math.max(g.box.min[2], Math.min(ball.z, g.box.max[2]));
    if (Math.hypot(ball.x - qx, ball.y - qy, ball.z - qz) > ball.r + 0.08) continue;
    if (gig.passes > 0) {
      gig.passes--;
      gig.actors.open(g, gig.time);
      out.door = 'opened';
    } else if (gig.time - gig.lockedAt > 2) {
      gig.lockedAt = gig.time;
      out.door = 'locked';
    }
  }

  if (ball.grounded && !ball.on && cell) {
    if (cell.kind === 'exit') out.outcome = 'exit';
    else if (venue.isSafe(cx, cz)) gig.safe = [cx + 0.5, cell.h[0] + ball.r, cz + 0.5];
  }
  explore(gig);
  return finish(gig, out);
}

/** If it has no integrity left: a revive if it has a spare, or it is shattered. */
function finish(gig, out) {
  if (shattered(gig.hero)) {
    if (revive(gig.hero)) out.revived = true;
    else out.outcome = 'shattered';
  }
  return out;
}

/** The hero runs into `foe`: it is how fast it was going. */
function hit(gig, foe, out) {
  const ball = gig.ball;
  const velocity = gig.actors.velocityOf(foe);
  const speed = closingSpeed(ball, { x: foe.x, y: foe.y, z: foe.z, height: foe.stats.radius * 2 }, velocity);
  const result = resolveImpact({ speed, foe: foe.stats });
  const dir = unit(ball.x, ball.z, foe.x, foe.z, unit(0, 0, ball.vx, ball.vz));
  const left = gig.actors.hurt(foe, result.hits, dir, speed);
  const took = result.damage > 0 ? harm(gig, result.damage) : 0;
  const record = { foe, grade: result.grade, speed, damage: took, gain: 0, multiplier: 1, combo: 0, down: left === 0, dir };
  if (left === 0) {
    // Gone: crits count double, and one that had to be worn down counts half.
    const worn = result.grade === 'bonk' || result.grade === 'tap';
    const s = smashed(gig.hype, foe.stats.hype, gig.time, result.grade === 'crit' ? 2 : worn ? 0.5 : 1);
    Object.assign(record, s);
    gig.stats.smashed += 1;
    // Through them, a little slower.
    ball.vx *= 0.86; ball.vz *= 0.86;
  } else {
    // Bounced off: back the way it came, as hard as it came, less a little.
    const away = Math.min(7, Math.max(2.5, speed * 0.6));
    ball.vx = -dir[0] * away; ball.vz = -dir[1] * away;
    if (ball.grounded) ball.vy = Math.max(ball.vy, 1.5);
    ball.grounded = false;
  }
  out.hits.push(record);
  if (took > 0) out.hurt = out.hurt ?? { how: 'foe', amount: took };
}

function collect(gig, p) {
  const what = gig.pickups[p.kind];
  if (!what) return;
  if (what.score) {
    earn(gig.hype, p.amount);
    gig.hype.pickups += what.score;
    gig.stats.pickups += what.score;
  } else if (what.heal) heal(gig.hero, p.amount);
  else if (what.revive) gig.hero.revives += 1;
  else if (what.pass) gig.passes += 1;
  else if (what.token) {
    gig.stats.tokens += 1;
    earn(gig.hype, p.amount);
  }
}

/** The rating inputs for this venue as it stands. */
export const resultOf = (gig) => ({ smashed: gig.stats.smashed, foes: gig.stats.foes, tokens: gig.stats.tokens });
