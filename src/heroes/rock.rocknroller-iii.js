/**
 * Rock, as Rock 'n' Roller III has him: the same boulder as `heroes/rock`, in
 * white granite.
 */
import { createGraniteBoulder, createGraniteRock } from './rock-granite.js';

export const createRock = (GFX, opts = {}) => createGraniteRock(GFX, { colour: 'white', ...opts });
export const createBoulder = (GFX, opts = {}) => createGraniteBoulder(GFX, { colour: 'white', ...opts });
