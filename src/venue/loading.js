/** How long a loading screen waits with no model coming in before it plays without the rest (a bake gone wrong). */
const WAIT = 20000;

/**
 * The loading screen: over the whole page while models bake in the
 * background, with how much of the bake is done. `library` is the game's own
 * (`models/library.js`): `isBaked(name, detail)`, `ready(name, detail)` and
 * `SCULPTED`, the models it has. Several
 * bakes can be waited on at once (the start of the game, then each venue); the
 * screen stays up until all of them are in, and does not show at all when
 * there is nothing left to bake.
 */
export function createLoading(root, label, { isBaked, ready, SCULPTED }) {
  const box = document.createElement('div');
  box.id = 'loading';
  box.hidden = true;
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  box.innerHTML = `
    <div class="loading-card">
      <p class="loading-title display">${label}</p>
      <div class="loading-bar"><i></i></div>
      <p class="loading-count"></p>
    </div>`;
  root.appendChild(box);
  const bar = box.querySelector('.loading-bar i');
  const count = box.querySelector('.loading-count');

  const waiting = new Set(); // "name@detail" still to come in
  let total = 0; // how many there were, since the screen last emptied

  function refresh() {
    if (waiting.size === 0) {
      box.hidden = true;
      total = 0;
      return;
    }
    const progress = (total - waiting.size) / total;
    box.hidden = false;
    bar.style.transform = `scaleX(${progress})`;
    count.textContent = `${Math.floor(progress * 100)}%`;
  }

  function arrived(key) {
    if (waiting.delete(key)) refresh();
  }

  return {
    /**
     * Bakes `list` ([name, detail] pairs): shows the screen until those not
     * yet baked are in, and resolves then (or once nothing has come in for
     * WAIT). Resolves at once when they are all baked already.
     */
    bake(list) {
      const pending = list.filter(([n, d]) => SCULPTED[n] && !isBaked(n, d));
      if (typeof Worker === 'undefined' || pending.length === 0) return Promise.resolve();
      for (const [n, d] of pending) {
        const key = `${n}@${d}`;
        if (!waiting.has(key)) {
          waiting.add(key);
          total++;
        }
      }
      refresh();
      return new Promise((resolve) => {
        let left = pending.length;
        let last = Date.now(); // when a model last came in
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          clearInterval(watch);
          for (const [n, d] of pending) arrived(`${n}@${d}`);
          resolve();
        };
        // Keep waiting while models keep coming in; give up after WAIT with none (a bake gone wrong).
        const watch = setInterval(() => {
          if (Date.now() - last > WAIT) finish();
        }, 1000);
        for (const [n, d] of pending) {
          ready(n, d).then(() => {
            last = Date.now();
            arrived(`${n}@${d}`);
            if (--left === 0) finish();
          });
        }
      });
    },
  };
}
