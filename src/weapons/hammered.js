/**
 * A hand-hammered finish for a grip: shallow round dimples pressed all over it,
 * as if struck with a small round-faced tool. Seeded, so the same weapon is
 * hammered the same way every time.
 *
 * `depthAt(s, a, radius)` is how far in (metres) a point on the grip is pressed.
 * `s` runs 0..1 along the grip, `a` is the angle round it, `radius` its radius there.
 */
const TAU = Math.PI * 2;
const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (i, j, salt, seed) => {
  let h = Math.imul(i * 374761393 + j * 668265263 + salt * 2147483647 + seed * 1274126177, 1103515245) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function hammeredFinish({ length, cols = 17, cell = 0.0062, depth = 0.0006, seed = 7 }) {
  // Where in its cell each dimple sits (0..1, a little jittered), how wide it is and how deep.
  const dimple = (i, j) => ({
    ox: 0.5 + (hash(i, j, 1, seed) - 0.5) * 0.4,
    oy: 0.5 + (hash(i, j, 2, seed) - 0.5) * 0.4,
    r: 0.58 + 0.1 * hash(i, j, 3, seed),
    d: 0.75 + 0.25 * hash(i, j, 4, seed),
  });
  // Both ends stay smooth, so the grip joins the neck and the tip cleanly.
  const edge = (s) => smooth(0.03, 0.1, s) * (1 - smooth(0.9, 0.985, s));
  return {
    depthAt(s, a, radius) {
      const along = (s * length) / cell, around = (a / TAU) * cols;
      const cellAround = (TAU * radius) / cols;
      let best = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const i = Math.floor(around) + di, j = Math.floor(along) + dj;
          // Hash on the wrapped column so the dimples meet round the back of the grip.
          const m = dimple(((i % cols) + cols) % cols, j);
          const dist = Math.hypot((around - i - m.ox) * cellAround, (along - j - m.oy) * cell) / (m.r * cell);
          if (dist < 1) best = Math.max(best, m.d * (1 - dist * dist));
        }
      }
      return best * depth * edge(s);
    },
  };
}
