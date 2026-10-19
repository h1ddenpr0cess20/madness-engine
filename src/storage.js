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

/** The settings every game has, and how they start: the music and effects levels, whether the screen may flash, and the on-screen hints for touch. */
export const SETTINGS = Object.freeze({ music: 0.8, sfx: 0.9, flashing: true, touchHints: true });

/** Of what was saved as settings, `s`, only what `defaults` has, of the same type: anything else is dropped. */
export function pickSettings(s, defaults = SETTINGS) {
  const out = {};
  for (const k of Object.keys(defaults)) if (s && typeof s[k] === typeof defaults[k]) out[k] = s[k];
  return out;
}
