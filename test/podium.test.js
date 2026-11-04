import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bake } from '../src/models/model.js';
import { PROPS } from '../src/props/index.js';
import podium, { PODIUM_ACCENT, PODIUM_SIZE, PODIUM_TILT, PODIUM_TOP, podiumOf } from '../src/props/podium.js';

const baked = (def) => bake(def, { detail: 0.5 });
const extent = (m) => {
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.position.length; i += 3) for (let a = 0; a < 3; a++) {
    low[a] = Math.min(low[a], m.position[i + a]);
    high[a] = Math.max(high[a], m.position[i + a]);
  }
  return { low, high };
};

test('the podium is in the prop library', () => {
  assert.equal(PROPS.podium, podium);
  assert.equal(podium.name, 'podium');
});

test('it stands on the floor, within its budget, and comes to a person\'s chest', () => {
  const m = baked(podium);
  const { low, high } = extent(m);
  assert.ok(m.count > 100 && m.count <= (podium.budget ?? 9000), `${m.count} vertices`);
  assert.ok(Math.abs(low[1]) < 0.01, `stands at y = ${low[1]}`);
  // The reading surface is the highest thing on it, a little over its middle height.
  assert.ok(high[1] > PODIUM_TOP && high[1] < PODIUM_TOP * 1.15, `tops out at ${high[1]}`);
  // The footprint is the plinth.
  assert.ok(high[0] - low[0] >= PODIUM_SIZE.width - 0.02, 'wide enough for its plinth');
  assert.ok(high[2] - low[2] >= PODIUM_SIZE.depth - 0.02, 'deep enough for its plinth');
});

test('the reading surface rises towards the far (+z) edge, so it faces the speaker behind it', () => {
  const m = baked(podium);
  // The highest vertices of the desk are at the audience side, the lowest of the desk at the speaker's.
  const top = [];
  for (let i = 0; i < m.position.length; i += 3) if (m.position[i + 1] > PODIUM_TOP * 0.9) top.push(m.position[i + 2]);
  assert.ok(top.length > 20);
  const nearest = Math.min(...top), farthest = Math.max(...top);
  const rises = [];
  for (let i = 0; i < m.position.length; i += 3) {
    if (m.position[i + 1] > PODIUM_TOP * 0.9) rises.push([m.position[i + 2], m.position[i + 1]]);
  }
  const heightNear = Math.max(...rises.filter(([z]) => z < nearest + 0.03).map(([, y]) => y));
  const heightFar = Math.max(...rises.filter(([z]) => z > farthest - 0.03).map(([, y]) => y));
  assert.ok(heightFar > heightNear, `far edge ${heightFar} vs near edge ${heightNear}`);
  assert.ok(heightFar - heightNear < Math.tan(PODIUM_TILT) * 0.34, 'and not by more than the tilt allows');
});

test('podiumOf gives one definition per colour, and a different panel for each', () => {
  assert.equal(podiumOf(), podium);
  assert.equal(podiumOf({ accent: PODIUM_ACCENT }), podium);
  const red = podiumOf({ accent: '#8e3232' });
  assert.equal(podiumOf({ accent: '#8E3232' }), red);
  assert.notEqual(red, podium);
  const blue = podiumOf({ accent: '#2f5d92' });
  assert.notEqual(blue, red);

  const sums = (def) => {
    const m = baked(def);
    let r = 0, b = 0;
    for (let i = 0; i < m.color.length; i += 3) { r += m.color[i]; b += m.color[i + 2]; }
    return { r, b };
  };
  const a = sums(red), c = sums(blue);
  assert.ok(a.r > c.r, 'the red one is redder');
  assert.ok(c.b > a.b, 'the blue one is bluer');
});
