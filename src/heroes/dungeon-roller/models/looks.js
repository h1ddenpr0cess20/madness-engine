import { CAST } from '../../../characters/dungeon-roller/cast/index.js';
import { createModel } from '../../../models/model.js';
import { createBoulder } from './boulder.js';
import { createEgg } from './egg.js';
import { createSlime } from './slime.js';

/**
 * Every creature, by name, ready to stand up in a scene: the sculpted ones
 * (cast/, baked from their definitions) and the ones ported whole from
 * their own projects, built from their own geometry (`BUILT`). Either way
 * it comes back as { group, pose(state) }.
 */
export const BUILT = {
  slime: createSlime,
  rock: createBoulder,
  egg: createEgg,
};

/** Whether there is a look for `name`. */
export const hasLook = (name) => Boolean(BUILT[name] || CAST[name]);

/** One `name`, at `detail` (1 close up, lower on the board); `o` goes to a built one (hue, seed...). */
export function standUp(GFX, name, { detail = 1, ...o } = {}) {
  if (BUILT[name]) return BUILT[name](GFX, { detail, ...o });
  return createModel(GFX, CAST[name], { detail });
}
