import { pathToFileURL } from 'node:url';

import { controlsSource } from './games.mjs';

/** A page with just enough in it for `createInput`: events go in, and the same ones to each copy. */
function makePage() {
  const windowHandlers = {};
  const surfaceHandlers = {};
  const buttonHandlers = {};
  const hub = (handlers) => ({ addEventListener: (type, fn) => { (handlers[type] ??= []).push(fn); } });
  return {
    window: hub(windowHandlers),
    surface: { ...hub(surfaceHandlers), setPointerCapture() {} },
    button: hub(buttonHandlers),
    fire(where, type, event) {
      const handlers = { window: windowHandlers, surface: surfaceHandlers, button: buttonHandlers }[where];
      const e = { preventDefault() {}, stopPropagation() {}, target: {}, repeat: false, ...event };
      for (const fn of handlers[type] ?? []) fn(e);
    },
  };
}

class FakeButton {}

/** Builds an input from `module` on its own page. The globals it reads at construction are set around the call. */
function make(module, options, pad) {
  const page = makePage();
  const saved = { addEventListener: globalThis.addEventListener, document: globalThis.document };
  globalThis.addEventListener = page.window.addEventListener;
  globalThis.document = { getElementById: (id) => (id === 'accel-touch' ? page.button : null) };
  const input = module.createInput(page.surface, { anchor: () => ({ x: 400, y: 300 }), ...options });
  Object.assign(globalThis, saved);
  return { page, input, pad };
}

const KEYS = ['NumpadEnter', 'ArrowUp', 'KeyX', 'KeyW', 'KeyA', 'ArrowRight', 'ArrowDown', 'Space', 'ShiftLeft', 'ShiftRight', 'Enter', 'KeyP', 'Escape', 'KeyM', 'KeyC', 'KeyQ', 'KeyE', 'Equal', 'Minus', 'NumpadAdd', 'KeyX'];

function script(seed) {
  let a = seed;
  const rand = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
  const steps = [];
  const pick = (list) => list[Math.floor(rand() * list.length)];
  for (let i = 0; i < 400; i++) {
    const r = rand();
    if (r < 0.2) steps.push(['window', 'keydown', { code: pick(KEYS), repeat: rand() < 0.2, target: rand() < 0.1 ? new FakeButton() : {} }]);
    else if (r < 0.35) steps.push(['window', 'keyup', { code: pick(KEYS) }]);
    else if (r < 0.4) steps.push(['window', 'blur', {}]);
    else if (r < 0.55) steps.push(['surface', 'pointerdown', { pointerId: 1 + Math.floor(rand() * 3), pointerType: pick(['mouse', 'touch']), button: Math.floor(rand() * 3), clientX: rand() * 800, clientY: rand() * 600 }]);
    else if (r < 0.75) steps.push(['surface', 'pointermove', { pointerId: 1 + Math.floor(rand() * 3), clientX: rand() * 800, clientY: rand() * 600 }]);
    else if (r < 0.85) steps.push([pick(['surface', 'surface']), pick(['pointerup', 'pointercancel']), { pointerId: 1 + Math.floor(rand() * 3) }]);
    else if (r < 0.9) steps.push(['surface', 'wheel', { deltaY: (rand() - 0.5) * 200, deltaMode: Math.floor(rand() * 3) }]);
    else if (r < 0.93) steps.push(['api', 'press', { name: pick(['hop', 'dash', 'quit', 'start']) }]);
    else if (r < 0.96) steps.push(['pad', 'set', { buttons: Array.from({ length: 16 }, () => rand() < 0.2), axes: [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1] }]);
    else steps.push(['button', pick(['pointerdown', 'pointerup', 'pointerleave', 'pointercancel']), {}]);
    steps.push(['read', 'frame', {}]);
  }
  return steps;
}

/** What a frame of the input says, under whichever name the game asks boost by. */
function read(input, api) {
  const touched = api ? input[api]() : null;
  return JSON.stringify({ stick: input.stick(), view: input.view(1 / 60), take: input.take(), pointing: input.pointing, boost: touched });
}

/**
 * Whether `engine`'s input, given the game's `boost` options, answers every
 * frame of a long scripted session — keys, mouse, fingers, gamepad and the
 * on-screen button — as the game's own `original` does.
 */
export async function compareInput(originalPath, enginePath, { boost, api, controls }) {
  const own = controls ? await import(`data:text/javascript,${encodeURIComponent(controlsSource(controls))}`) : {};
  const original = await import(pathToFileURL(originalPath));
  const engine = await import(pathToFileURL(enginePath));
  const savedNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  globalThis.HTMLButtonElement = FakeButton;
  let frames = 0;
  try {
    for (let seed = 1; seed <= 8; seed++) {
      let current = null;
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => [current] } });
      const a = make(original, {}, null);
      const b = make(engine, { ...(boost ? { boost } : {}), ...(controls ? { presses: own.presses, padPresses: own.padPresses } : {}) }, null);
      for (const [where, type, event] of script(seed)) {
        if (where === 'pad') {
          current = { connected: true, axes: event.axes, buttons: event.buttons.map((pressed) => ({ pressed })) };
        } else if (where === 'api') {
          if (a.input.press) { a.input.press(event.name); b.input.press(event.name); }
        } else if (where === 'read') {
          const x = read(a.input, api), y = read(b.input, api);
          frames++;
          if (x !== y) return { ok: false, detail: `seed ${seed}, frame ${frames}:\n  original ${x}\n  engine   ${y}` };
        } else {
          a.page.fire(where, type, event);
          b.page.fire(where, type, event);
        }
      }
    }
  } finally {
    if (savedNavigator) Object.defineProperty(globalThis, 'navigator', savedNavigator);
    delete globalThis.HTMLButtonElement;
  }
  return { ok: true, frames };
}
