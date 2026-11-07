/**
 * Rock, as Rock 'n' Roller II has him: the same boulder as `heroes/rock`, in
 * grey granite.
 */
import { createGraniteBoulder, createGraniteRock } from './rock-granite.js';

export const createRock = (GFX, opts = {}) => createGraniteRock(GFX, { colour: 'grey', ...opts });
export const createBoulder = (GFX, opts = {}) => createGraniteBoulder(GFX, { colour: 'grey', ...opts });
