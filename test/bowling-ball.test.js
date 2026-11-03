import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { BOWLING_BALL_RADIUS, createBowlingBall } from '../src/heroes/bowling-ball.js';

test('creates a glossy marbled ball with three finger holes', () => {
  const ball = createBowlingBall(GFX);
  assert.equal(ball.group.name, 'bowling_ball');
  assert.equal(ball.shell.geometry.parameters.radius, BOWLING_BALL_RADIUS);
  assert.equal(ball.shell.geometry.parameters.widthSegments, 256);
  assert.equal(ball.shell.geometry.parameters.heightSegments, 192);
  assert.ok(ball.shell.geometry.getAttribute('position').count >= 49000, 'high-resolution marbled shell');
  assert.equal(ball.material.vertexColors, true);
  assert.equal(ball.material.clearcoat, 0.96);
  assert.equal(ball.holes.length, 3);
  assert.ok(ball.shell.geometry.getAttribute('color').count > 10000);
  assert.ok(ball.holes.every(({ mesh, rim }) => mesh.isMesh && rim.isMesh));
  ball.dispose();
});

test('repaints colors in place without replacing sphere geometry', () => {
  const ball = createBowlingBall(GFX, { colors: { base: '#182b50', swirl: '#d93b7b', accent: '#f3bc66' } });
  const geometry = ball.shell.geometry;
  const attribute = geometry.getAttribute('color');
  const initial = attribute.array.slice();
  assert.ok(new Set(Array.from(initial, (v) => Math.round(v * 1000))).size > 20);
  ball.setColors({ base: '#0d4536', swirl: '#7de0b4', accent: '#ffe18a', holes: '#05080a' });
  assert.equal(ball.shell.geometry, geometry);
  assert.notDeepEqual(attribute.array, initial);
  assert.equal(attribute.version, 2);
  assert.equal(ball.colors.base.getHexString(), '0d4536');
  assert.equal(ball.colors.holes.getHexString(), '05080a');
  ball.dispose();
});

test('supports size and color aliases, and rejects invalid radii', () => {
  const ball = createBowlingBall(GFX, {
    radius: 0.8, widthSegments: 64, heightSegments: 48,
    baseColor: '#123456', swirlColor: '#654321', accentColor: '#fedcba', holeColor: '#070809',
  });
  assert.equal(ball.shell.geometry.parameters.radius, 0.8);
  assert.equal(ball.shell.geometry.parameters.widthSegments, 64);
  assert.equal(ball.shell.geometry.parameters.heightSegments, 48);
  assert.equal(ball.colors.base.getHexString(), '123456');
  assert.equal(ball.colors.swirl.getHexString(), '654321');
  assert.equal(ball.colors.accent.getHexString(), 'fedcba');
  assert.equal(ball.colors.holes.getHexString(), '070809');
  ball.dispose();
  assert.throws(() => createBowlingBall(GFX, { radius: 0 }), /radius must be a finite positive number/);
  assert.throws(() => createBowlingBall(GFX, { radius: Infinity }), /radius must be a finite positive number/);
});
