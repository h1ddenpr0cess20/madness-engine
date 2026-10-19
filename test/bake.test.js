import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createBakeLibrary, createCastLibrary } from '../src/models/bake.js';

/** The kind of definition a bake takes the name of: only the library asks what is in it. */
const defs = { rat: {}, crate: {}, cat: {} };

/**
 * A stand-in for a bake worker that "bakes" by answering at once; the libraries
 * don't care what is in the answer, only that it comes back and is adopted.
 */
function fakeWorkers() {
  const made = [];
  const posted = [];
  globalThis.Worker = class {};
  globalThis.navigator ??= { hardwareConcurrency: 4 };
  const spawn = () => {
    const w = {
      terminated: false,
      postMessage({ name, detail }) { posted.push(`${name}@${detail}`); queueMicrotask(() => w.onmessage({ data: { name, detail, data: { name, detail } } })); },
      terminate() { w.terminated = true; },
    };
    made.push(w);
    return w;
  };
  return { made, spawn, posted };
}

test('the model library bakes what it is told, once, and says when each is ready', async () => {
  const { made, posted, spawn } = fakeWorkers();
  try {
    const lib = createBakeLibrary({ sculpted: defs, spawn, jobs: () => [['crate', 1], ['rat', 0.5], ['ghost', 1]], label: 'test' });
    assert.equal(lib.isBaked('rat', 0.5), false);
    const waiting = lib.ready('rat', 0.5);
    lib.preload();
    await waiting;
    await lib.readyAll([['crate', 1], ['rat', 0.5], ['ghost', 1]]);
    assert.ok(lib.isBaked('crate', 1) && lib.isBaked('rat', 0.5));
    assert.equal(lib.isBaked('ghost', 1), false, 'a name nobody sculpted is skipped');
    assert.deepEqual([...posted].sort(), ['crate@1', 'rat@0.5']);
    lib.preload();
    assert.equal(posted.length, 2, 'what is baked is not baked again');
    assert.ok(made.every((w) => w.terminated), 'workers are stopped when the queue runs out');
  } finally {
    delete globalThis.Worker;
  }
});

test('the cast library bakes names at one detail, reports progress, and stops a worker that errs when asked to', async () => {
  const { made, spawn } = fakeWorkers();
  const logged = [];
  const log = console.error;
  console.error = (...a) => logged.push(a);
  try {
    const lib = createCastLibrary({ cast: defs, spawn, detail: 0.5, names: () => Object.keys(defs), failure: 'test: somebody would not bake', terminateOnError: true });
    const progress = [];
    lib.preload();
    await lib.readyAll(['rat', 'cat', 'ghost'], 0.5, { onProgress: (p) => progress.push(p) });
    assert.ok(lib.isBaked('rat', 0.5) && lib.isBaked('cat', 0.5));
    assert.equal(progress.length, 2);
    assert.ok(progress.at(-1) <= 1 && progress.at(-1) > 0);

    lib.preload(['crate'], 0.8);
    await lib.ready('crate', 0.8);
    assert.ok(lib.isBaked('crate', 0.8));

    const w = made.at(-1);
    w.onerror('boom');
    assert.equal(w.terminated, true);
    assert.deepEqual(logged.at(-1), ['test: somebody would not bake', 'boom']);
  } finally {
    console.error = log;
    delete globalThis.Worker;
  }
});

test('with no workers (tests, scripts) nothing bakes and nothing waits', async () => {
  const lib = createBakeLibrary({ sculpted: defs, spawn: () => { throw new Error('no'); }, jobs: () => [['rat', 1]] });
  lib.preload();
  await lib.readyAll([['rat', 1]]);
  assert.equal(lib.isBaked('rat', 1), false);
  const cast = createCastLibrary({ cast: defs, spawn: () => { throw new Error('no'); }, names: () => ['rat'], failure: '' });
  cast.preload();
  await cast.readyAll(['rat'], 0.5);
});
