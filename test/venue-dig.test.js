import assert from 'node:assert/strict';
import { test } from 'node:test';

import { digger } from '../src/venue/dig.js';
import { Venue } from '../src/venue/venue.js';

const make = () => new Venue({ name: 't', cols: 40, rows: 40, palette: { tiles: ['#808080'] } });

test('a piece knows its tiles by where they are along it and across it, whichever way it heads', () => {
  for (const heading of ['+x', '-x', '+z', '-z']) {
    const c = make();
    const d = digger(c, { x: 20, z: 20, h: 5, heading });
    const p = d.hall(4, { width: 3 });
    assert.deepEqual(p.tile(0, 0), [20, 20]);
    assert.equal(p.w * p.d, 12);
    const [x, z] = p.tile(3, 0);
    assert.equal(Math.abs(x - 20) + Math.abs(z - 20), 3);
    for (let a = 0; a < 4; a++) for (let b = -1; b <= 1; b++) assert.equal(c.cell(...p.tile(a, b))?.kind, 'floor', `${heading} ${a},${b}`);
    // The cursor has moved on to just past the end.
    const at = d.at;
    assert.equal(Math.abs(at.x - 20) + Math.abs(at.z - 20), 4);
  }
});

test('the pieces always meet: halls, turns, stairs and rooms make one floor from end to end', () => {
  const c = make();
  const d = digger(c, { x: 2, z: 3, h: 10, heading: '+x' });
  d.hall(5);
  d.turn('+z');
  d.stairs(4, 2);
  d.room(5, 5);
  d.turn('+x');
  d.bridge(3);
  d.turn('-z', { width: 1 });
  d.hall(2, { width: 1 });
  const end = d.at;
  // Walk the floor from the start: everything dug is reached, the last tile too.
  const seen = new Set(['2,3']);
  const queue = [[2, 3]];
  while (queue.length) {
    const [x, z] = queue.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = c.cell(x + dx, z + dz);
      const k = `${x + dx},${z + dz}`;
      if (!n || n.kind === 'wall' || seen.has(k)) continue;
      seen.add(k);
      queue.push([x + dx, z + dz]);
    }
  }
  const [lx, lz] = [end.x, end.z + 1];
  assert.ok(seen.has(`${lx},${lz}`), `the end of the last hall, ${lx},${lz}`);
  assert.equal(d.h, 8);
});

test('a ferry leaves its gap clear and its platform crosses it', () => {
  const c = make();
  const d = digger(c, { x: 2, z: 10, h: 4, heading: '+x' });
  d.hall(3);
  const gap = d.ferry(8, { size: 3 });
  d.room(4, 5);
  for (let a = 0; a < 8; a++) assert.equal(c.cell(...gap.tile(a, 0)), null);
  const [lift] = c.lifts;
  assert.deepEqual(lift.to, [5, 0, 0]);
  assert.equal(lift.x, 5);
});

test('a shaft sinks the way on by its drop', () => {
  const c = make();
  const d = digger(c, { x: 2, z: 2, h: 9, heading: '+z' });
  d.hall(3);
  d.shaft(4);
  const after = d.hall(2);
  assert.equal(c.cell(...after.tile(0, 0)).h[0], 5);
  assert.deepEqual(c.lifts[0].to, [0, -4, 0]);
});
