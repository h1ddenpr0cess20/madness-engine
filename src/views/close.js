import { defineView } from '../view.js';

/** The arcade's corner, a little nearer: for a small ball on a small board. */
export const { HOME, LIMITS, createView, groundAxes } = defineView({ home: { zoom: 1.12 } });
