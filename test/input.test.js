import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createInput } from '../src/input.js';
import { makePage, padWith, withPage } from './helpers/page.js';

const build = (options = {}) => {
  const page = makePage();
  const input = withPage(page, () => createInput(page.surface, { anchor: () => ({ x: 400, y: 300 }), ...options }));
  return { page, input };
};

test('keys push the stick, two at once for the diagonals, and never past 1', () => {
  const { page, input } = build();
  page.key('KeyW');
  assert.deepEqual(input.stick(), { x: 0, y: 1 });
  page.key('ArrowRight');
  const { x, y } = input.stick();
  assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-9 && x > 0 && y > 0);
  page.release('KeyW');
  page.release('ArrowRight');
  assert.deepEqual(input.stick(), { x: 0, y: 0 });
});

test('holding the pointer pushes toward it, harder the further it is', () => {
  const { page, input } = build();
  page.fire('surface', 'pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 450, clientY: 300 });
  assert.ok(input.pointing);
  const near = input.stick().x;
  page.fire('surface', 'pointermove', { pointerId: 1, clientX: 500, clientY: 300 });
  assert.ok(input.stick().x > near);
  page.fire('surface', 'pointermove', { pointerId: 1, clientX: 700, clientY: 300 });
  assert.equal(input.stick().x, 1);
  assert.deepEqual(input.take(), ['tap']);
});

test('buttons come out once each: start, pause, mute and home', () => {
  const { page, input } = build();
  page.key('Enter');
  page.key('Enter', { repeat: true });
  page.key('KeyP');
  page.key('KeyM');
  page.key('KeyC');
  assert.deepEqual(input.take(), ['start', 'pause', 'mute', 'home']);
  assert.deepEqual(input.take(), []);
});

test('without boost, Space is only the start button', () => {
  const { page, input } = build();
  page.key('Space');
  assert.deepEqual(input.take(), ['start']);
  assert.equal(input.boost(), false);
});

test('with boost, Space and Shift hold it as well as start, and the pad and the on-screen button hold it', () => {
  const { page, input } = build({ boost: { pad: [0, 2, 7], element: 'accel' } });
  page.key('ShiftLeft');
  assert.equal(input.boost(), true);
  page.release('ShiftLeft');
  assert.equal(input.boost(), false);
  page.key('Space');
  assert.equal(input.rev(), true);
  assert.deepEqual(input.take(), ['start']);
  page.release('Space');

  page.fire('button', 'pointerdown');
  assert.equal(input.boost(), true);
  page.fire('button', 'pointerleave');
  assert.equal(input.boost(), false);

  input.setRev(true);
  assert.equal(input.boost(), true);
  input.setBoost(false);

  page.pad = padWith([7]);
  input.stick();
  assert.equal(input.boost(), true);
  page.pad = padWith([6]);
  input.stick();
  assert.equal(input.boost(), false, 'button 6 is not in this game\'s list');
});

test('a game with more buttons gives its own: keys to presses (one key can make two), pad buttons to presses, and presses from elsewhere', () => {
  const { page, input } = build({
    presses: { Space: 'hop', Escape: ['pause', 'back'] },
    padPresses: (b, sx, sy) => ({ dash: b(2), down: b(13) || sy > 0.6 }),
  });
  page.key('Space');
  page.key('Escape');
  page.key('Enter');
  assert.deepEqual(input.take(), ['hop', 'pause', 'back']);

  input.press('quit');
  assert.deepEqual(input.take(), ['quit']);

  page.pad = padWith([2]);
  input.stick();
  input.stick();
  page.pad = padWith([], [0, 0.9, 0, 0]);
  input.stick();
  assert.deepEqual(input.take(), ['dash', 'down']);
});

test('the view is turned, tilted and zoomed by keys and by dragging', () => {
  const { page, input } = build();
  page.key('KeyE');
  const turned = input.view(0.5);
  assert.ok(turned.turn > 0);
  page.release('KeyE');
  page.fire('surface', 'pointerdown', { pointerId: 2, pointerType: 'mouse', button: 2, clientX: 100, clientY: 100 });
  page.fire('surface', 'pointermove', { pointerId: 2, clientX: 140, clientY: 80 });
  const dragged = input.view(0);
  assert.ok(dragged.turn < 0 && dragged.tilt < 0);
  page.fire('surface', 'wheel', { deltaY: -100, deltaMode: 0 });
  assert.ok(input.view(0).zoom < 1);
});
