import { createMace } from './mace.js';

/**
 * The player: Metroll's spiked ball, the head of a morning star with no
 * morning star attached (`morningstar.js`, `mace.js`, as they are in
 * Metroll), turned as the physics rolls it and squashed on landing. Its
 * spikes snap off as it is knocked about — `mace.hurtTo(spikes / 100)` — and
 * come back on a whetstone.
 */

/** In tiles: a ball a little under three-quarters of a tile across. */
export const RADIUS = 0.36;

/** `group` goes in the scene; `mace.update(dt, { q, position })` turns and places it. */
export function createPlayer(GFX, { radius = RADIUS } = {}) {
  const mace = createMace(GFX, { radius });
  return { player: mace.group, mace };
}
