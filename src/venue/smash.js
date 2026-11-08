/**
 * What happens when the hero runs into someone. There is no roll of the dice:
 * it is how fast it was going. `speed` is how fast the two were coming
 * together, in tiles a second — the hero's roll plus theirs, and a drop onto
 * them from above counts for something too.
 *
 *   crit    twice what it takes: flattened. Nothing back, double the hype.
 *   smash   fast enough: gone, with nothing back.
 *   bonk    over half what it takes: the two bounce apart, and it costs the hero
 *           some of the foe's `power` — less the closer it was to a smash.
 *   tap     barely a touch: it hurts, and doesn't move them.
 *
 * Whatever isn't a smash still wears them down: a foe has as much `hp` as it
 * has `toughness`, and a bonk takes off as much as the speed it came at. So
 * a bouncer who can't be hit hard enough can be hit twice. A boss has a
 * good deal more than that, and never goes down for nothing: a smash on
 * one still costs the hero a quarter of its power.
 */

/** Past this many times the toughness (and this fast at the least), it is a crit. */
export const CRIT = Object.freeze({ times: 1.7, least: 13 });

export function resolveImpact({ speed, foe }) {
  const { toughness, power, boss } = foe;
  const s = Math.max(0, speed);
  const floor = boss ? Math.ceil(power / 4) : 0;
  if (s >= Math.max(toughness * CRIT.times, CRIT.least)) return { grade: 'crit', damage: floor, hits: s * 1.5, hype: 2 };
  if (s >= toughness) return { grade: 'smash', damage: floor, hits: boss ? s * 1.2 : toughness, hype: 1 };
  if (s >= toughness * 0.5) {
    const damage = Math.max(1, Math.ceil(power * (1 - (0.55 * s) / toughness)));
    return { grade: 'bonk', damage: boss ? Math.ceil(damage * 1.3) : damage, hits: s, hype: 0.5 };
  }
  return { grade: 'tap', damage: boss ? Math.ceil(power * 1.2) : power, hits: s * 0.4, hype: 0.25 };
}

/** How fast the hero and a foe are coming together: along the line between them, plus the weight of a fall onto them. */
export function closingSpeed(hero, foe, foeVelocity = [0, 0, 0]) {
  const dx = foe.x - hero.x, dz = foe.z - hero.z;
  const d = Math.hypot(dx, dz) || 1;
  const nx = dx / d, nz = dz / d;
  const along = (hero.vx - foeVelocity[0]) * nx + (hero.vz - foeVelocity[2]) * nz;
  // Coming down on top of them, harder than it is rolling.
  const drop = Math.max(0, -hero.vy) * (foe.y + (foe.height ?? 0.5) < hero.y - hero.r * 0.4 ? 0.7 : 0);
  return Math.max(0, along) + drop;
}

/** What each grade is called when it lands; a game with its own voice keeps its own table, with lines to say. */
export const GRADES = Object.freeze({
  crit: { title: 'FLATTENED!' },
  smash: { title: 'SMASH!' },
  bonk: { title: 'BONK' },
  tap: { title: 'OW' },
});
