import { rgb } from '../models/sdf.js';
import { grainy } from '../models/skins.js';

/**
 * A debating podium: a lectern with a plinth, a column, a reading surface
 * tipped towards whoever stands behind it, and a colored panel on its front,
 * which is the one place it says whose it is.
 *
 * It faces +z, as a person does, so a speaker stands behind it on the -z side
 * looking out over it, and it stands on y = 0. It is sized for the engine's
 * people (about 0.8 to 0.9 tall): the reading surface comes to a person's
 * chest, `PODIUM_TOP` up.
 *
 * `podium` is the plain one, with a grey panel. `podiumOf({ accent })` is one
 * with a panel of any color: asking twice for the same color gives the same
 * definition, so it is baked once, however many podiums are stood up.
 */

/** Where the middle of the reading surface is, up from the floor. */
export const PODIUM_TOP = 0.6;

/** How far the reading surface is turned from level, in radians: its far edge is the high one. */
export const PODIUM_TILT = 0.15;

/** The panel's color when none is asked for. */
export const PODIUM_ACCENT = '#8a8f98';

/** Everything below is drawn at the size the debate hall drew it at (a reading surface 1.22 up) and brought down by `K`. */
const K = PODIUM_TOP / 1.22;
const P = (x, y, z) => [x * K, y * K, z * K];
const H = (w, h, d) => [(w * K) / 2, (h * K) / 2, (d * K) / 2];

const TIMBER = '#2b2723', EDGE = '#3a342e';
const MATERIALS = {
  timber: { roughness: 0.72, metalness: 0.04 },
  edge: { roughness: 0.55, metalness: 0.08 },
  panel: { roughness: 0.62, metalness: 0.05 },
};
const one = [['root', null, [0, 0, 0]]];

const BASE = { w: 1.18, h: 0.14, d: 0.76 };

/** The footprint, so a scene can place it: across (x) and deep (z), at the plinth. */
export const PODIUM_SIZE = Object.freeze({ width: BASE.w * K, depth: BASE.d * K });
const COLUMN = { w: 0.86, h: 1.08, d: 0.52 };
const DESK = { w: 1.44, h: 0.1, d: 0.76 };
const FRONT = { w: 0.96, h: 0.64, d: 0.04 };

function define(accent, name) {
  const timber = { color: grainy(TIMBER, 0.1, 30), mat: 'timber', k: 0.003 };
  const edge = { color: rgb(EDGE), mat: 'edge', k: 0.003 };
  const panel = { color: rgb(accent), mat: 'panel', k: 0.002 };
  return {
    name,
    cell: 0.01,
    bones: one,
    materials: MATERIALS,
    sculpt(s) {
      s.box(P(0, BASE.h / 2, 0), H(BASE.w, BASE.h, BASE.d), 0.004, edge);
      s.box(P(0, BASE.h + COLUMN.h / 2, 0), H(COLUMN.w, COLUMN.h, COLUMN.d), 0.004, timber);
      // The reading surface, its far edge up: turned about x so that the +z side rises.
      s.box(P(0, 1.22 - DESK.h / 2, 0), H(DESK.w, DESK.h, DESK.d), 0.004, { ...edge, rot: [-PODIUM_TILT, 0, 0] });
      // The panel, a hair proud of the column's front.
      s.box(P(0, 0.66, COLUMN.d / 2 + 0.01), H(FRONT.w, FRONT.h, FRONT.d), 0.003, panel);
    },
  };
}

const made = new Map();

/**
 * A podium with a panel of `accent` (any CSS hex color). The same color
 * always gives the same definition.
 */
export function podiumOf({ accent = PODIUM_ACCENT } = {}) {
  const key = String(accent).toLowerCase();
  if (!made.has(key)) made.set(key, define(key, key === PODIUM_ACCENT ? 'podium' : `podium-${key.replace('#', '')}`));
  return made.get(key);
}

/** The plain podium, with a grey panel. */
export const podium = podiumOf();

export default podium;
