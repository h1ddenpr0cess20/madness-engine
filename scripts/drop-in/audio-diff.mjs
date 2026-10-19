import { pathToFileURL } from 'node:url';

import { fakeAudio, memoryStore } from '../../test/helpers/webaudio.js';

/** A seeded generator, so both copies roll the same dice. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs `go` on a page with fake Web Audio and fixed dice; returns what was built and scheduled. */
async function record(go) {
  const { FakeContext, log } = fakeAudio();
  const saved = { random: Math.random, AudioContext: globalThis.AudioContext, localStorage: globalThis.localStorage };
  Math.random = seeded(12345);
  globalThis.AudioContext = FakeContext;
  globalThis.localStorage = memoryStore();
  try {
    await go(FakeContext);
  } finally {
    Math.random = saved.random;
    globalThis.AudioContext = saved.AudioContext;
    globalThis.localStorage = saved.localStorage;
  }
  return log.map((l) => JSON.stringify(l, (_, v) => (typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v)));
}

const firstDifference = (a, b) => {
  if (a.length !== b.length) return `${a.length} calls against ${b.length}`;
  const i = a.findIndex((x, k) => x !== b[k]);
  return i < 0 ? null : `call ${i}:\n  original ${a[i]}\n  engine   ${b[i]}`;
};

/** Whether a band makes the same sounds as the game's music: every theme started, played for a while on the fake clock, and stopped. */
export async function compareMusic(originalPath, enginePath) {
  const run = (path) => record(async (FakeContext) => {
    const { createBand, THEMES } = await import(pathToFileURL(path));
    const ctx = new FakeContext();
    const out = ctx.createGain();
    const noise = ctx.createBuffer(1, 16000, 8000);
    const band = createBand(ctx, out, noise);
    for (const [name, theme] of Object.entries(THEMES)) {
      band.start(theme, theme.tempo ?? 120);
      for (let step = 0; step < 6; step++) {
        ctx.currentTime += 4 + step;
        await new Promise((r) => setTimeout(r, 260));
      }
      band.stop();
      void name;
    }
  });
  const a = await run(originalPath), b = await run(enginePath);
  const why = firstDifference(a, b);
  return why ? { ok: false, detail: why } : { ok: true, calls: a.length };
}
