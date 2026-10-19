/** A page with just enough in it for `createInput`: events go in, and the input answers. */
export function makePage() {
  const handlers = { window: {}, surface: {}, button: {} };
  const hub = (where) => ({ addEventListener: (type, fn) => { (handlers[where][type] ??= []).push(fn); } });
  const page = {
    window: hub('window'),
    surface: { ...hub('surface'), setPointerCapture() {} },
    button: hub('button'),
    pad: null,
    fire(where, type, event = {}) {
      const e = { preventDefault() {}, stopPropagation() {}, target: {}, repeat: false, ...event };
      for (const fn of handlers[where][type] ?? []) fn(e);
    },
    key: (code, extra) => page.fire('window', 'keydown', { code, ...extra }),
    release: (code) => page.fire('window', 'keyup', { code }),
  };
  return page;
}

// What the input looks up as events come in, not only as it is built. Each test file has a process to itself.
globalThis.HTMLButtonElement = class {};
let current = null;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [current?.pad ?? null] } });

/** Runs `make` with the globals `createInput` reads as it is built, and returns what it made. */
export function withPage(page, make) {
  const saved = { addEventListener: globalThis.addEventListener, document: globalThis.document };
  globalThis.addEventListener = page.window.addEventListener;
  globalThis.document = { getElementById: (id) => (id === 'accel' ? page.button : null) };
  current = page;
  try {
    return make();
  } finally {
    Object.assign(globalThis, saved);
  }
}

export const padWith = (pressed = [], axes = [0, 0, 0, 0]) => ({
  connected: true,
  axes,
  buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })),
});
