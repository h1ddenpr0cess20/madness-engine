import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
import { HANDS } from './categories.js';

/**
 * A broadsword-derived greatsword. It preserves the broadsword's blade profile,
 * fuller, pommel and construction. Only blade length, blade width, grip length and
 * guard-bar thickness differ. All dimensions are in metres.
 */
export const GREATSWORD_DIMENSIONS = Object.freeze({
  overallLength: 1.524,
  bladeLength: 1.18,
  bladeWidth: 0.088,
  gripLength: 0.28,
  gripDiameter: 0.034,
  marbleRadius: 0.027,
  marbleDiameter: 0.054,
  guardSpan: 0.22,
  guardThickness: 0.0184,
  unit: 'm',
});

export const GREATSWORD_SPEC = Object.freeze({
  name: 'greatsword',
  hands: HANDS.TWO,
  ...GREATSWORD_DIMENSIONS,
});

export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;

export function createGreatsword(GFX, options = {}) {
  return buildWeapon(GFX, GREATSWORD_SPEC, options);
}
