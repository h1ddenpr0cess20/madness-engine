/**
 * The hero's integrity: how much of it is still in one piece. Every knock
 * takes some, a repair puts some back, and at nothing it is shattered —
 * unless it picked up a spare, and it gets up again (`revive`).
 */

export const MAX_INTEGRITY = 100;

/** What each way of coming to grief costs it. */
export const HARM = Object.freeze({
  fell: 8,
  zapped: 14,
  crushed: 16,
  burnt: 10,
  thud: 4,
});

export function createIntegrity() {
  return { hp: MAX_INTEGRITY, max: MAX_INTEGRITY, revives: 0 };
}

export const shattered = (hero) => hero.hp <= 0;

/** Takes `amount` off. Returns what it took. */
export function hurt(hero, amount) {
  const took = Math.min(Math.max(0, hero.hp), Math.max(0, amount));
  hero.hp -= amount;
  return took;
}

/** Tape: up to the best, no more. Returns what it put back. */
export function heal(hero, amount) {
  if (hero.hp <= 0) return 0;
  const gain = Math.min(amount, hero.max - hero.hp);
  hero.hp += gain;
  return gain;
}

/** A spare, if there is one and it is done for: back up on half its integrity. Returns whether it was used. */
export function revive(hero) {
  if (hero.hp > 0 || hero.revives < 1) return false;
  hero.revives -= 1;
  hero.hp = Math.ceil(hero.max / 2);
  return true;
}

/** How cracked it looks, 0 (whole) to 1 (about to go). */
export const cracked = (hero) => Math.max(0, Math.min(1, 1 - hero.hp / hero.max));
