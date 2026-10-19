/**
 * One saved slot in browser storage. It can be missing or refuse (private
 * windows, full disks, blocked cookies), so every touch of it is guarded and
 * the game plays the same without it. What goes in the slot, and how it is
 * checked on the way out, is the game's own.
 *
 *     const slot = saveSlot('my-game.v1');
 *     const raw = slot.read();   // whatever was saved, or null
 *     slot.write({ best: 120 });
 */
export function saveSlot(key, store = globalThis.localStorage) {
  return {
    /** What was saved, parsed; null if nothing was, or it can't be read. */
    read() {
      try {
        return JSON.parse(store?.getItem(key) ?? 'null');
      } catch {
        return null;
      }
    },

    /** Saves `value`; false if the store would not take it. */
    write(value) {
      try {
        store?.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };
}
