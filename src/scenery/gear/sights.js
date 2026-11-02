import { SIGHTS as TOUR, SIGHTS_FACING as TOUR_FACING } from './tour.js';
import { SIGHTS as COMPILATION, SIGHTS_FACING as COMPILATION_FACING } from './compilation.js';

/**
 * The furniture of the places the games go, joining decor.js's: the world
 * tour's (Rock 'n' Roller III: a London phone box, a Paris café, Venice's
 * well, the Alps' ski rack...) and the compilation's (Metroll: an anvil, a
 * pink limo, a hot tub, a churchyard's tombs...). `SIGHTS_FACING`: the ones
 * with a front, turned to face the open floor.
 */
export const SIGHTS = { ...TOUR, ...COMPILATION };
export const SIGHTS_FACING = [...TOUR_FACING, ...COMPILATION_FACING];
