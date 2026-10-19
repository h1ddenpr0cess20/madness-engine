/**
 * What the game remembers between visits: the golden seeds found, the
 * jobs done, the cash, what's been bought at the bubble shop and the ball
 * being worn, the air pump it was last at, how long it has been rolling,
 * and the best time to every golden seed. Browser storage can be
 * missing or refuse, so every touch of it is guarded and the game plays
 * the same without it.
 */

const KEY = 'petroll.v2';

const EMPTY = { found: [], done: [], cash: 0, owned: [], tint: 'tint:blue', pump: null, time: 0, best: 0 };

const strings = (v) => (Array.isArray(v) ? [...new Set(v.filter((n) => typeof n === 'string'))] : []);

export function createStorage(store = globalThis.localStorage) {
  let saved = { ...EMPTY, found: [], done: [], owned: [] };
  try {
    // (From before the jobs, the golden seeds found carry over.)
    const raw = JSON.parse(store?.getItem(KEY) ?? store?.getItem('petroll.v1') ?? 'null');
    if (raw && typeof raw === 'object') {
      saved.found = strings(raw.found);
      saved.done = strings(raw.done);
      saved.owned = strings(raw.owned);
      saved.cash = Number.isFinite(raw.cash) && raw.cash >= 0 ? Math.floor(raw.cash) : 0;
      saved.tint = typeof raw.tint === 'string' ? raw.tint : EMPTY.tint;
      saved.pump = typeof raw.pump === 'string' ? raw.pump : null;
      saved.time = Number.isFinite(raw.time) && raw.time >= 0 ? raw.time : 0;
      saved.best = Number.isFinite(raw.best) && raw.best > 0 ? raw.best : 0;
    }
  } catch {}

  const copy = () => ({ ...saved, found: [...saved.found], done: [...saved.done], owned: [...saved.owned] });
  const save = () => {
    try { store?.setItem(KEY, JSON.stringify(saved)); } catch {}
    return copy();
  };

  return {
    load: copy,
    /** Where it has got to. Any of `found`, `done`, `cash`, `owned`, `tint`, `pump`, `time`. */
    progress(next) {
      saved = { ...saved, ...next };
      saved.found = strings(saved.found);
      saved.done = strings(saved.done);
      saved.owned = strings(saved.owned);
      return save();
    },
    /** Every golden seed found in `time`: kept if it's the best. */
    finished(time) {
      saved = { ...saved, best: saved.best ? Math.min(saved.best, time) : time };
      return save();
    },
    /** Start over, keeping the best time. */
    clear() {
      saved = { ...EMPTY, found: [], done: [], owned: [], best: saved.best };
      return save();
    },
  };
}
