import { createGlassGlobe, RADIUS } from './glassglobe.js';

/**
 * The planets in glass, each with its own mist: the Earth, Mars, the Moon and
 * Jupiter, the last twice (its clouds as a colored field over the glass, or
 * etched into it). Each is `createGlassGlobe` set the way the viewer shows it,
 * and turning slowly on its own.
 *
 * Mars, the Moon and the etched Jupiter need their etching, and the Jupiter
 * field its clouds. Those are canvases, and loading them is asynchronous, so
 * load them first with `loadGlassPlanetMaps(name)`:
 *
 *     const { etchCanvas } = await loadGlassPlanetMaps('mars');
 *     const mars = createGlassPlanet(GFX, 'mars', { radius: 0.3, etchCanvas });
 *     scene.add(mars.group);
 *
 * Without its maps a planet is clear glass with its mist, not the Earth's
 * continents painted on the wrong world.
 */

/**
 * Each planet's settings. `orient` is [lat, lon] in degrees, as `orient()` takes it. `mist` is what `setMist` is
 * given (null keeps the default mist, Krystal's own blue). `earth` marks the one whose etching is the Earth's own.
 */
export const GLASS_PLANETS = Object.freeze({
  earth: {
    label: 'Earth',
    earth: true,
    orient: [40, -95],
    mist: null,
  },
  mars: {
    label: 'Mars',
    orient: [-5, -90],
    // Rust: the palette's warm end, with the blue taken out of it.
    mist: { hue: 0.04, spread: 0.1, tint: [1, 1.15, 0.18], glow: 2.1, core: 0.15 },
  },
  moon: {
    label: 'Moon',
    orient: [0, 0],
    // White: the palette's most neutral hue, with the tint balancing its three channels to gray-white.
    mist: { hue: 0.7071, spread: 0, tint: [1.761, 1, 1.76], glow: 2.1, core: 0.15 },
  },
  jupiter: {
    label: 'Jupiter',
    orient: [-22, 0],
    // White mist swirls inside, as the planet's pale zones are; the photograph's clouds drift over it as the field.
    mist: { hue: 0.7071, spread: 0, tint: [1.761, 1, 1.76], glow: 0.4, core: 0.02 },
    field: { shell: 0.9, glow: 1.3 },
  },
  'jupiter-etched': {
    label: 'Jupiter (etched)',
    orient: [-22, 0],
    // The zones and belts etched in the glass, and the mist in belts that shear sideways, in the planet's rust-red and blue-green.
    mist: { bands: 1, duo: [[1, 0.3, 0.16], [1, 0.93, 0.82], [0.02, 0.62, 0.78]], glow: 2.4, core: 0.1, swirl: 0.6 },
  },
});

/** The planets' names, in the order they are listed. */
export const GLASS_PLANET_NAMES = Object.freeze(Object.keys(GLASS_PLANETS));

/** The canvases each planet is drawn from, loaded on demand. Earth needs none: its etching is built in. */
const MAPS = Object.freeze({
  mars: async () => ({ etchCanvas: await (await import('../textures/mars/map.js')).loadMarsEtch() }),
  moon: async () => ({ etchCanvas: await (await import('../textures/moon/map.js')).loadMoonEtch() }),
  jupiter: async () => ({ fieldCanvas: await (await import('../textures/jupiter/map.js')).loadJupiterMap() }),
  'jupiter-etched': async () => ({ etchCanvas: await (await import('../textures/jupiter/map.js')).loadJupiterEtch() }),
});

/**
 * The canvases a planet is drawn from: `{ etchCanvas }` for Mars, the Moon and the etched Jupiter, `{ fieldCanvas }`
 * for the Jupiter with its clouds as a field, and `{}` for the Earth. Each is null where nothing can paint (under Node).
 * @param {string} name  one of `GLASS_PLANET_NAMES`
 */
export async function loadGlassPlanetMaps(name) {
  if (!Object.hasOwn(GLASS_PLANETS, name)) throw new Error(`no glass planet called ${name}; choose ${GLASS_PLANET_NAMES.join(', ')}`);
  return MAPS[name] ? MAPS[name]() : {};
}

/**
 * A planet in glass, with its mist, turning on its own.
 * @param {object} GFX
 * @param {string} name  one of `GLASS_PLANET_NAMES`
 * @param {object} [options]
 * @param {number} [options.radius]  the glass's radius, in the scene's units
 * @param {HTMLCanvasElement|null} [options.etchCanvas]  the planet's etching (Mars, the Moon, the etched Jupiter)
 * @param {HTMLCanvasElement|null} [options.fieldCanvas]  the Jupiter's clouds, as a colored field over the glass
 */
export function createGlassPlanet(GFX, name, { radius = RADIUS, etchCanvas = null, fieldCanvas = null } = {}) {
  const planet = GLASS_PLANETS[name];
  if (!planet) throw new Error(`no glass planet called ${name}; choose ${GLASS_PLANET_NAMES.join(', ')}`);
  // The Earth's etching is its own coastlines, so only the Earth falls back to it; any other planet without its etching is plain glass.
  const globe = createGlassGlobe(GFX, {
    radius,
    mist: true,
    animate: true,
    etch: planet.earth === true || etchCanvas != null,
    etchCanvas: etchCanvas ?? undefined,
  });
  globe.orient(...planet.orient);
  globe.spinRate = 0.12;
  if (planet.mist) globe.setMist(planet.mist);
  if (fieldCanvas && planet.field) globe.setField(fieldCanvas, planet.field).refreshField();
  globe.group.name = `glass ${name}`;
  return globe;
}
