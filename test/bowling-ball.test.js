import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as GFX from '../src/gfx/index.js';
import { BOWLING_BALL_DESIGNS, BOWLING_BALL_RADIUS, createBowlingBall } from '../src/props/bowling-ball.js';

test('creates a high-resolution glossy ball with three true recessed finger holes', () => {
  const ball = createBowlingBall(GFX);
  assert.equal(ball.group.name, 'bowling_ball');
  assert.equal(ball.shell.geometry.parameters.radius, BOWLING_BALL_RADIUS);
  assert.equal(ball.shell.geometry.parameters.widthSegments, 512);
  assert.equal(ball.shell.geometry.parameters.heightSegments, 384);
  assert.ok(ball.shell.geometry.getAttribute('position').count >= 196000);
  assert.equal(ball.shell.material.vertexColors, true);
  assert.equal(ball.holes.length, 3);
  assert.ok(ball.removedHoleTriangles > 0);
  assert.ok(ball.shell.geometry.getIndex().count < 512 * 384 * 6);
  assert.ok(ball.holeBoundaryEdges > 60);
  assert.ok(ball.holes.every(({ mesh, boundaryVertices }) => mesh.isMesh && boundaryVertices > 20));
  assert.ok(ball.holes.every((hole) => !('rim' in hole)));
  assert.ok(ball.holes.every((hole) => hole.mesh.geometry.getAttribute('position').count > 80));
  ball.dispose();
});

test('repaints colours in place without replacing shell geometry', () => {
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

test('all five surface designs are distinct and can be switched without replacing geometry', () => {
  const ball = createBowlingBall(GFX);
  const geometry = ball.shell.geometry;
  const initial = geometry.getAttribute('color').array.slice();
  const signatures = new Set();
  for (const design of BOWLING_BALL_DESIGNS) {
    assert.equal(ball.setDesign(design), design);
    assert.equal(ball.design, design);
    assert.equal(ball.shell.geometry, geometry);
    signatures.add(Array.from(geometry.getAttribute('color').array).filter((_, i) => i % 3 === 0 && (i / 3) % 331 === 0).join(','));
  }
  assert.equal(signatures.size, BOWLING_BALL_DESIGNS.length);
  assert.notDeepEqual(geometry.getAttribute('color').array, initial);
  assert.throws(() => ball.setDesign('polka-dot'), /unknown design/);
  ball.dispose();
});

test('supports size and colour aliases, and rejects invalid radii', () => {
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
