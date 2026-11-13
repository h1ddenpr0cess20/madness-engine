import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { BOUNCY_BALL_DESIGNS, BOUNCY_BALL_RADIUS, createBouncyBall } from '../src/props/bouncy-ball.js';
import { createBowlingBall } from '../src/props/bowling-ball.js';
import { createBall, RUBBER, stepBall, World } from '../src/physics.js';

function floor(size = 10) {
  const w = new World({ cols: size, rows: size });
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    w.addTriangle(x, 0, z, x, 0, z + 1, x + 1, 0, z);
    w.addTriangle(x + 1, 0, z, x, 0, z + 1, x + 1, 0, z + 1);
  }
  return w.finish();
}

/** The heights a ball dropped from `y` reaches again after each landing. */
function hops(ball) {
  const world = floor(), peaks = [];
  let up = false, top = -Infinity;
  for (let t = 0; t < 8; t += 1 / 120) {
    stepBall(ball, world, 0, 0, 1 / 120);
    if (ball.vy > 0.05) { up = true; top = Math.max(top, ball.y); } else if (up && ball.vy <= 0) { peaks.push(top - ball.r); up = false; top = -Infinity; }
  }
  return peaks;
}

test('a rubber ball dropped on the floor bounces again and again, each hop lower, and comes to rest', () => {
  const peaks = hops(createBall({ x: 5, y: 3, z: 5, ...RUBBER }));
  assert.ok(peaks.length >= 4, `${peaks.length} hops`);
  assert.ok(peaks[0] > 1.5 && peaks[0] < 2.65, `first hop ${peaks[0].toFixed(2)} m of 2.65`);
  for (let i = 1; i < peaks.length; i++) assert.ok(peaks[i] < peaks[i - 1]);
  // An ordinary ball from the same height hardly leaves the floor.
  const plain = hops(createBall({ x: 5, y: 3, z: 5 }));
  assert.ok(plain.length <= 2 && (plain[0] ?? 0) < 0.4, `plain ball: ${plain.map((p) => p.toFixed(2))}`);
});

test('every bouncy-ball design paints its own colours, without finger holes', () => {
  for (const design of BOUNCY_BALL_DESIGNS) {
    const ball = createBouncyBall(GFX, { design, colors: { base: '#e8343f', swirl: '#ffd23f', accent: '#2f6fe0' } });
    assert.equal(ball.shell.geometry.parameters.radius, BOUNCY_BALL_RADIUS);
    assert.ok(!('holes' in ball));
    const c = ball.shell.geometry.getAttribute('color').array;
    const shades = new Set(Array.from(c, (v) => Math.round(v * 50)));
    if (design === 'solid') assert.ok(shades.size < 40, `solid: ${shades.size} shades`);
    else assert.ok(shades.size > 3, `${design}: ${shades.size} shades`);
    ball.dispose();
  }
});

test('its patterns are its own, not the bowling ball\'s', () => {
  const colors = { base: '#e8343f', swirl: '#ffd23f', accent: '#2f6fe0' };
  const rubber = createBouncyBall(GFX, { design: 'marble', colors, widthSegments: 64, heightSegments: 48, radius: 1 });
  const resin = createBowlingBall(GFX, { design: 'marble', colors: { ...colors, holes: '#000000' }, widthSegments: 64, heightSegments: 48, radius: 1 });
  assert.notDeepEqual(Array.from(rubber.shell.geometry.getAttribute('color').array.slice(0, 600)), Array.from(resin.shell.geometry.getAttribute('color').array.slice(0, 600)));
});

test('it squashes along what it hit, keeping its volume, and springs back', () => {
  const ball = createBouncyBall(GFX);
  ball.squash(8, [0, 1, 0]);
  let most = 0;
  for (let k = 0; k < 6; k++) { ball.update(1 / 60); most = Math.max(most, ball.squashed); }
  assert.ok(most > 0.08, `squashed ${most}`);
  const frame = ball.group.children[0];
  assert.ok(Math.abs(frame.scale.x * frame.scale.y * frame.scale.z - 1) < 0.02 || Math.abs(frame.scale.x * frame.scale.x * frame.scale.y - 1) < 0.02);
  for (let k = 0; k < 120; k++) ball.update(1 / 60);
  assert.ok(Math.abs(ball.squashed) < 0.01);
});

test('the bowling ball comes solid too', () => {
  const ball = createBowlingBall(GFX, { design: 'solid', colors: { base: '#1a2f6a', swirl: '#ff00aa', accent: '#ffff00' }, widthSegments: 64, heightSegments: 48 });
  const c = ball.shell.geometry.getAttribute('color').array;
  let off = 0;
  for (let i = 0; i < c.length; i += 3) off = Math.max(off, Math.abs(c[i + 1] - c[1]));
  assert.ok(off < 0.05, `solid varies ${off}`);
  ball.dispose();
});
