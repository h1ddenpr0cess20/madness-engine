import { rollSpin, turn } from '../physics.js';

/**
 * How the ball is turned as it rolls: a ball, rolling without slipping, so the
 * spin follows from how fast it goes and which way. Everything is plain
 * arrays at the physics rate, so the tests turn it the same as the screen.
 */

/** The ball the physics pushes about, in tiles. */
export const BALL_RADIUS = 0.45;

/** The turn: which way up it is, and how fast it spins. */
export function createRoll() {
  return { q: [0, 0, 0, 1], spin: [0, 0, 0] };
}

/** One step of the turning, after the ball has moved: rolling along the ground, tumbling in the air. */
export function stepRoll(roll, ball, dt) {
  if (ball.grounded) rollSpin(ball, roll.spin);
  else for (let i = 0; i < 3; i++) roll.spin[i] *= Math.max(0, 1 - 0.25 * dt);
  turn(roll.q, roll.spin, dt);
  return roll;
}
