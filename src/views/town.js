import { defineView } from '../view.js';

/** Higher and further back: for streets, where there is more round the ball to see. */
export const { HOME, LIMITS, createView, groundAxes } = defineView({ home: { pitch: 0.92, zoom: 0.95 } });
