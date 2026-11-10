/** The measured, display-ready weapon catalogue. All dimensions are in metres. */
export { METALS } from '../props/metalglobe.js';
export { bladeGeometry, buildWeapon, createWeaponHandleAssembly, createWeaponPommelMarble, MARBLE_POMMEL, MARBLE_POMMEL_RADIUS, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
export { BROADSWORD_DIMENSIONS, BROADSWORD_SPEC, createBroadsword } from './broadsword.js';
export { DAGGER_DIMENSIONS, DAGGER_SPEC, BANANA_DAGGER_SPEC, BANANA_BROADSWORD_SPEC, createDagger } from './dagger.js';
export { GREATSWORD_DIMENSIONS, GREATSWORD_SPEC, createGreatsword } from './greatsword.js';
export { STAFF_DIMENSIONS, STAFF_HANDLING, STAFF_TOPPERS, createStaff, sweepTube } from './staff.js';
export { HANDS, RANGE, HAND_LABELS, RANGE_LABELS, REACH_BANDS, assertHands, handlingInfo, handlingOf, reachOf, strikingRange } from './categories.js';
export { MORNINGSTAR_DIMENSIONS, MORNINGSTAR_SPEC, createMorningstar } from './morningstar.js';

export {
  createMadnessSword, createMadnessDagger, createMadnessGreatsword, createMadnessMorningstar,
  createRegularSword, createRegularDagger, createRegularGreatsword, createRegularMorningstar,
  createMarcsSword, createMarcsDagger, createMarcsGreatsword, createMarcsMorningstar,
  createKrystalSword, createKrystalDagger,
  createMagicEggSword, createMagicEggDagger, createMagicEggGreatsword,
  createBananaDagger, createBananaBroadsword,
  createGraniteSword, createGraniteDagger,
} from './variants.js';
