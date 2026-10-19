import { adopt, bake } from './model.js';

const ARRAYS = ['position', 'normal', 'color', 'skinIndex', 'skinWeight', 'index'];

/**
 * The body of a bake worker: bakes models off the main thread. `sculpted` is
 * every definition by name; { name, detail } comes in, and the mesh's arrays
 * go out (handed over, not copied). A game's `bake.worker.js` is:
 *
 *     import { serveBakes } from 'madness-engine/models/bake';
 *     serveBakes({ ...CAST, ...PROPS });
 */
export function serveBakes(sculpted) {
  self.onmessage = ({ data: { name, detail } }) => {
    const data = { ...bake(sculpted[name], { detail }) };
    for (const k of ARRAYS) data[k] = data[k].slice();
    self.postMessage({ name, detail, data }, ARRAYS.map((k) => data[k].buffer));
  };
}

/**
 * What both libraries share: what has been baked, who is waiting for it, and
 * the workers that share out the jobs ([name, detail] pairs), first come
 * first served. `spawn()` makes a worker running `serveBakes`: the game
 * makes it, as `new Worker(new URL('./bake.worker.js', import.meta.url),
 * { type: 'module' })`, so that its bundler can find the worker.
 */
function createBaker({ sculpted, spawn, failure, terminateOnError }) {
  const done = new Map();
  const waiting = new Map();
  const key = (name, detail) => `${name}@${detail}`;

  /** Whether `name` at `detail` is ready to use. */
  const isBaked = (name, detail) => done.has(key(name, detail));

  /** Resolves once `name` at `detail` is baked. */
  function ready(name, detail) {
    const k = key(name, detail);
    if (done.has(k)) return Promise.resolve();
    if (!waiting.has(k)) {
      let resolve;
      const p = new Promise((r) => { resolve = r; });
      waiting.set(k, { p, resolve });
    }
    return waiting.get(k).p;
  }

  /** Starts baking `jobs` ([name, detail] pairs) that aren't baked already. */
  function start(jobs) {
    if (typeof Worker === 'undefined') return;
    const queue = jobs.filter(([n, d]) => sculpted[n] && !done.has(key(n, d)));
    const count = Math.max(1, Math.min(queue.length, (navigator.hardwareConcurrency || 4) - 1, 4));
    for (let i = 0; i < count; i++) {
      const worker = spawn();
      const next = () => {
        const job = queue.shift();
        if (!job) { worker.terminate(); return; }
        worker.postMessage({ name: job[0], detail: job[1] });
      };
      worker.onmessage = ({ data: { name, detail, data } }) => {
        adopt(sculpted[name], detail, data);
        const k = key(name, detail);
        done.set(k, true);
        waiting.get(k)?.resolve();
        next();
      };
      worker.onerror = (e) => {
        console.error(failure, e);
        if (terminateOnError) worker.terminate();
      };
      next();
    }
  }

  return { isBaked, ready, start };
}

/**
 * A library of models of every sort, baked at the detail each is wanted at
 * (the props small and everywhere, the creatures as the board wants them).
 *
 * - `sculpted`: every definition by name, the same as the worker's.
 * - `spawn()`: a new worker running `serveBakes`.
 * - `jobs()`: what `preload()` bakes if it isn't told: [name, detail] pairs.
 * - `label`: whose error it is, if a bake goes wrong.
 *
 * Returns `{ isBaked, readyAll, ready, preload }`.
 */
export function createBakeLibrary({ sculpted, spawn, jobs, label = 'madness-engine' }) {
  const baker = createBaker({ sculpted, spawn, failure: `${label}: a model would not bake`, terminateOnError: false });

  /**
   * Resolves once every one of `list` ([name, detail] pairs) is baked (or
   * after 20 seconds whatever happens); at once where nothing bakes in the
   * background (no workers: tests, scripts).
   */
  function readyAll(list) {
    if (typeof Worker === 'undefined') return Promise.resolve();
    const all = Promise.all(list.filter(([n]) => sculpted[n]).map(([n, d]) => baker.ready(n, d)));
    // Not forever, though: if a bake has gone wrong, better to play without it.
    return Promise.race([all, new Promise((r) => setTimeout(r, 20000))]);
  }

  return { isBaked: baker.isBaked, readyAll, ready: baker.ready, preload: (list = jobs()) => baker.start(list) };
}

/**
 * A library of one cast, all baked at one detail (the townsfolk).
 *
 * - `cast`: the definitions by name, the same as the worker's.
 * - `spawn()`: a new worker running `serveBakes`.
 * - `detail`: how finely `preload()` bakes them if it isn't told.
 * - `names()`: whom `preload()` bakes if it isn't told. Left out, `preload`
 *   must be told.
 * - `failure`: what is logged if a bake goes wrong.
 * - `terminateOnError`: whether a worker that errs is stopped.
 *
 * Returns `{ isBaked, readyAll, ready, preload }`.
 */
export function createCastLibrary({ cast, spawn, detail: defaultDetail = 0.5, names, failure, terminateOnError = false }) {
  const baker = createBaker({ sculpted: cast, spawn, failure, terminateOnError });

  /**
   * Resolves once all of `list` at `detail` are baked, or after `wait`
   * seconds whatever happens; at once with no workers. `onProgress` hears
   * how much of it is done, from 0 to 1.
   */
  function readyAll(list, detail, { wait = 25, onProgress = () => {} } = {}) {
    if (typeof Worker === 'undefined') return Promise.resolve();
    let n = 0;
    const all = Promise.all(list.filter((m) => cast[m]).map((m) => baker.ready(m, detail).then(() => onProgress(++n / list.length))));
    return Promise.race([all, new Promise((r) => setTimeout(r, wait * 1000))]);
  }

  return {
    isBaked: baker.isBaked,
    readyAll,
    ready: baker.ready,
    preload: (list = names(), detail = defaultDetail) => baker.start(list.map((n) => [n, detail])),
  };
}
