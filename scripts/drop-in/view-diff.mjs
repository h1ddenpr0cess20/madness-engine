import { pathToFileURL } from 'node:url';

/** Whether the view `defineView` makes for `home` moves, resets and aims exactly as the game's own did. */
export async function compareView(originalPath, enginePath, { home }) {
  const original = await import(pathToFileURL(originalPath));
  const engine = await import(pathToFileURL(enginePath));
  const mine = engine.defineView({ home });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(original.HOME, mine.HOME)) return { ok: false, detail: `HOME: ${JSON.stringify(original.HOME)} vs ${JSON.stringify(mine.HOME)}` };
  if (!same(original.LIMITS, mine.LIMITS)) return { ok: false, detail: 'LIMITS differ' };
  for (const yaw of [undefined, 0, 1, -2.5, 7]) {
    if (!same(original.groundAxes(yaw), mine.groundAxes(yaw))) return { ok: false, detail: `groundAxes(${yaw})` };
  }
  let a = original.createView(), b = mine.createView();
  let seed = 7;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let ops = 0;
  for (let i = 0; i < 3000; i++) {
    const r = rand();
    if (r < 0.3) { const y = (rand() - 0.5) * 3, p = (rand() - 0.5) * 1.5; a.turn(y, p); b.turn(y, p); }
    else if (r < 0.5) { const f = Math.exp((rand() - 0.5) * 1.5); a.zoomBy(f); b.zoomBy(f); }
    else if (r < 0.55) { a.reset(); b.reset(); }
    else if (r < 0.6) { a = original.createView(); b = mine.createView(); }
    else { const dt = rand() / 30, jump = rand() < 0.05; a.step(dt, jump); b.step(dt, jump); }
    ops++;
    if (!same(a, b) || !same(a.direction(), b.direction())) return { ok: false, detail: `op ${i}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}` };
  }
  return { ok: true, ops };
}
