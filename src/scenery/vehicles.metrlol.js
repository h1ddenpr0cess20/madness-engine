import { boxtruck, hatchback, junker, pickup, sedan } from './vehicles.js';

/**
 * Metrlol's traffic: a sedan, a hatchback, a pickup, a box truck, and a
 * rusted-out junker for the yard; the town's (`vehicles`) without its
 * tanker. Each faces +z with its wheels on the ground at y = 0, takes its
 * colour from its `paint` material, and has its `body` and `wheels` for
 * `mountWheels`.
 */

export { boxtruck, hatchback, junker, mountWheels, pickup, sedan, truckwheel, wheel } from './vehicles.js';

/** Which model each kind of traffic is drawn with. */
export const VEHICLES = { sedan, hatchback, pickup, junker, boxtruck };
