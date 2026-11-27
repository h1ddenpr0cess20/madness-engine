/**
 * Hype: the score. Pickups are worth a few points a
 * time; smashing foes is worth more, and smashing them one after another is
 * worth a lot more: each smash within a few seconds of the last one adds to
 * the combo, and the combo multiplies what the smash is worth, up to five
 * times.
 */

/** How long, in seconds, a combo is kept going by the next smash. */
export const COMBO_WINDOW = 3.5;
export const MAX_MULTIPLIER = 5;

export function createHype() {
  return { score: 0, combo: 0, since: -Infinity, best: 0, smashes: 0, pickups: 0 };
}

/** What the combo is at `time`: dropped, if the window has run out. */
export function comboAt(hype, time) {
  return time - hype.since > COMBO_WINDOW ? 0 : hype.combo;
}

/** How much of the window is left at `time`, 1 to 0. */
export function windowLeft(hype, time) {
  return comboAt(hype, time) ? Math.max(0, 1 - (time - hype.since) / COMBO_WINDOW) : 0;
}

/**
 * A foe worth `base` smashed at `time`, `scale` times as much for a crit (or
 * half for one worn down). Returns what it earned and what the combo was.
 */
export function smashed(hype, base, time, scale = 1) {
  hype.combo = comboAt(hype, time) + 1;
  hype.since = time;
  hype.best = Math.max(hype.best, hype.combo);
  const multiplier = Math.min(MAX_MULTIPLIER, hype.combo);
  const gain = Math.round(base * scale * multiplier);
  hype.score += gain;
  hype.smashes += 1;
  return { gain, multiplier, combo: hype.combo };
}

/** Points that don't count toward the combo: pickups, tokens, the end-of-level bonus. */
export function earn(hype, amount) {
  hype.score += amount;
  return amount;
}
