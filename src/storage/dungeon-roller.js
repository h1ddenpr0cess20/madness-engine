/**
 * What the game remembers between visits: the most gold a party has come
 * out with, and the deepest level reached (any level down to it can be
 * started from the title). Browser storage can be missing or refuse, so
 * every touch of it is guarded and the game plays the same without it.
 */

const KEY = 'dungeon-roller.v1';

export function createStorage(store = globalThis.localStorage) {
  let saved = { best: 0, reached: 0 };
  try {
    const raw = JSON.parse(store?.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      saved.best = Number.isFinite(raw.best) ? raw.best : 0;
      saved.reached = Number.isInteger(raw.reached) ? raw.reached : 0;
    }
  } catch {}

  const save = () => {
    try { store?.setItem(KEY, JSON.stringify(saved)); } catch {}
    return { ...saved };
  };

  return {
    load: () => ({ ...saved }),
    reached(index) {
      saved = { ...saved, reached: Math.max(saved.reached, index) };
      return save();
    },
    record(score) {
      saved = { ...saved, best: Math.max(saved.best, score), last: score };
      return save();
    },
  };
}
