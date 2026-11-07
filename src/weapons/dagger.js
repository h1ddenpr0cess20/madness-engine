import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';

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
 * peel flaps (chrome inside, brass outside) over a curved, ridged brass grip
 * that ends in a chrome tip. The grip is 135 mm along its arc, against the
 * dagger's 97 mm. The last 14% of the blade is chrome, like the fruit's dark end.
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
  bladeTip: true,
});
