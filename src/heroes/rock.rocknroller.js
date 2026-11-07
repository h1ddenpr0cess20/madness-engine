/**
 * Rock, as Rock 'n' Roller has him: the same boulder as `heroes/rock`, in
 * black granite.
 */
import { createGraniteBoulder, createGraniteRock } from './rock-granite.js';

export const createRock = (GFX, opts = {}) => createGraniteRock(GFX, { colour: 'black', ...opts });
export const createBoulder = (GFX, opts = {}) => createGraniteBoulder(GFX, { colour: 'black', ...opts });
