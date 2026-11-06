import { METALS } from '../props/metalglobe.js';
import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';

/**
 * A one-handed, double-edged medieval broadsword with a broad lenticular blade,
 * a real central fuller, a swept crossguard, the glass-and-spark marble as its pommel and a wrapped
 * leather grip. It is built at measured real-world scale, in metres, and
 * displayed point-up with the engine's marble hero replacing the pommel.
 *
 *     const sword = createBroadsword(GFX, { bladeMetal: 'steel', hiltMetal: 'silver' });
 *     scene.add(sword.group);
 *     sword.setGripColor('#6b3f2c');
 *
 * Weapon dimensions exclude the separate display plinth.
 */
export const BROADSWORD_DIMENSIONS = Object.freeze({
  overallLength: 0.99,
  bladeLength: 0.81,
  bladeWidth: 0.052,
  gripLength: 0.14,
  gripDiameter: 0.034,
  marbleRadius: 0.036,
  marbleDiameter: 0.054,
  guardSpan: 0.22,
  unit: 'm',
});

export const BROADSWORD_SPEC = Object.freeze({
  name: 'broadsword',
  ...BROADSWORD_DIMENSIONS,
});

export const BROADSWORD_METALS = METALS;
export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;

export function createBroadsword(GFX, options = {}) {
  return buildWeapon(GFX, BROADSWORD_SPEC, options);
}
