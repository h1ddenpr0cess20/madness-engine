import assert from 'node:assert/strict';
import { test } from 'node:test';

import { saveSlot } from '../src/storage.js';

const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
};

test('what is written is read back, and a slot with nothing in it reads null', () => {
  const store = memory();
  const slot = saveSlot('game.v1', store);
  assert.equal(slot.read(), null);
  assert.equal(slot.write({ best: 120 }), true);
  assert.deepEqual(saveSlot('game.v1', store).read(), { best: 120 });
});

test('a store that is missing, refuses, or holds rubbish does no harm', () => {
  assert.equal(saveSlot('k', null).read(), null);
  assert.equal(saveSlot('k', null).write(1), true);
  const refusing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.equal(saveSlot('k', refusing).read(), null);
  assert.equal(saveSlot('k', refusing).write(1), false);
  assert.equal(saveSlot('k', { getItem: () => '{not json', setItem() {} }).read(), null);
});
