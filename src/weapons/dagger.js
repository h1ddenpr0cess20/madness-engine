import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
import { HANDS } from './categories.js';

/**
 * A broadsword-derived dagger. Its lenticular blade keeps the exact broadsword
 * profile, fuller, point and materials; only blade length, blade width and
 * crossguard span and compact grip length differ. All dimensions are in metres.
 */
export const DAGGER_DIMENSIONS = Object.freeze({
  overallLength: 0.401,
  bladeLength: 0.24,
  bladeWidth: 0.047,
  gripLength: 0.097,
  gripDiameter: 0.034,
  marbleRadius: 0.027,
  marbleDiameter: 0.054,
  guardSpan: 0.112,
  unit: 'm',
});

export const DAGGER_SPEC = Object.freeze({
  name: 'dagger',
  hands: HANDS.ONE,
  ...DAGGER_DIMENSIONS,
  gripWrapDivisions: 9,
});

export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;

export function createDagger(GFX, options = {}) {
  return buildWeapon(GFX, DAGGER_SPEC, options);
}

/**
 * The banana dagger is a half-peeled banana: the dagger's blade, slimmed to
 * 38 mm, curved off the grip and drawn out into a talon, rising out of four
 * peel flaps (the blade's metal inside, brass outside) over a curved, ridged
 * brass grip that ends in a tip of the blade's metal. The grip is 135 mm along
 * its arc, against the dagger's 97 mm.
 */
export const BANANA_DAGGER_SPEC = Object.freeze({
  ...DAGGER_SPEC,
  name: 'banana-dagger',
  guardStyle: 'peel',
  bladeWidth: 0.038,
  gripLength: 0.135,
  gripCurve: 0.7,
  bladeCurve: 0.4,
  bladeHook: 0.4,
  bladeTalon: 0.5,
  bladeMistPalette: 'egg',
});


/**
 * Broadsword-scale banana: the same curved, hooked blade and half-peeled
 * silhouette as the banana dagger, fitted to the measured broadsword envelope.
 * The peel flaps are extended slightly to remain in proportion with the longer
 * blade. Dimensions are in metres.
 */
export const BANANA_BROADSWORD_SPEC = Object.freeze({
  ...BANANA_DAGGER_SPEC,
  name: 'banana-broadsword',
  overallLength: 0.886,
  bladeLength: 0.786,
  bladeWidth: 0.034,
  gripLength: 0.14,
  gripDiameter: 0.034,
  marbleRadius: 0.027,
  marbleDiameter: 0.054,
  guardSpan: 0.22,
  peelLengthScale: 1.15,
});
