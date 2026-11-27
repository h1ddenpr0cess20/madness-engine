/**
 * How a weapon is held and how far it strikes. Every weapon carries these two
 * categories as `handling`, and the asset viewer's Weapons shelf is grouped by
 * them, so a character can be given the kind of weapon its grip was made for.
 *
 *   hands   'one-handed' or 'two-handed': how many hands hold it, by its grip.
 *   range   'short', 'medium' or 'long' for a melee weapon, by its striking
 *           reach; 'ranged' for a weapon that strikes at a distance (a bow, a
 *           throwing blade, a spell staff).
 *
 * A melee weapon's striking reach is how far its striking end reaches beyond
 * the hand: its overall length less its grip. It is measured, so its range
 * follows its geometry. A ranged weapon is declared `ranged: true` instead.
 */

/** How many hands hold the weapon. */
export const HANDS = Object.freeze({ ONE: 'one-handed', TWO: 'two-handed' });

/** How far it strikes: the three melee bands, or `ranged`. */
export const RANGE = Object.freeze({ SHORT: 'short', MEDIUM: 'medium', LONG: 'long', RANGED: 'ranged' });

/**
 * The melee bands, in meters of reach beyond the hand: under `shortBelow` is
 * short, from `longFrom` is long, and medium lies between.
 */
export const REACH_BANDS = Object.freeze({ shortBelow: 0.6, longFrom: 1.1 });

export const HAND_LABELS = Object.freeze({ [HANDS.ONE]: 'One-handed', [HANDS.TWO]: 'Two-handed' });

export const RANGE_LABELS = Object.freeze({
  [RANGE.SHORT]: 'Short',
  [RANGE.MEDIUM]: 'Medium',
  [RANGE.LONG]: 'Long',
  [RANGE.RANGED]: 'Ranged',
});

/** Throws a TypeError unless `hands` is one of HANDS. */
export function assertHands(hands) {
  if (!Object.values(HANDS).includes(hands)) {
    throw new TypeError(`hands must be one of ${Object.values(HANDS).join(', ')}, not ${String(hands)}`);
  }
}

/** A melee weapon's striking reach in meters: its overall length less its grip. */
export function reachOf({ overallLength, gripLength }) {
  return overallLength - gripLength;
}

/** The melee range band for a striking reach in meters. */
export function strikingRange(reach) {
  if (!Number.isFinite(reach) || reach <= 0) {
    throw new RangeError(`a striking reach must be a positive length in meters, not ${reach}`);
  }
  if (reach < REACH_BANDS.shortBelow) return RANGE.SHORT;
  if (reach < REACH_BANDS.longFrom) return RANGE.MEDIUM;
  return RANGE.LONG;
}

/**
 * The handling of a weapon, `{ hands, range }`. A `ranged` weapon has the range
 * 'ranged' and needs no reach; any other takes its range from `reach`.
 */
export function handlingOf({ hands, ranged = false, reach } = {}) {
  assertHands(hands);
  if (typeof ranged !== 'boolean') throw new TypeError('ranged must be true or false');
  return Object.freeze({ hands, range: ranged ? RANGE.RANGED : strikingRange(reach) });
}

/**
 * The rows the viewer's info panel shows for a weapon's handling. `reach` is
 * the melee reach in meters; a ranged weapon does not need one.
 */
export function handlingInfo({ hands, range }, reach) {
  return {
    'Hands': HAND_LABELS[hands],
    'Range': range === RANGE.RANGED ? RANGE_LABELS[range] : `${RANGE_LABELS[range]}, ${reach.toFixed(2)} m reach`,
  };
}
