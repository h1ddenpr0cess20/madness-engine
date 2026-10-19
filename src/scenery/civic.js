import { grainy } from '../models/skins.js';

/**
 * The machinery of the city, sculpted (same conventions as `street.js`):
 * the charging posts on the Brussels forecourt, the rubber stamps of the
 * stamping hall (their gantry standing still, the stamp itself coming
 * down), the cable reels of the compute farm, which roll after the ball,
 * and the vents the hot takes come up out of.
 */

const PAINT = { roughness: 0.42, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.15 };
const STEEL = { roughness: 0.4, metalness: 0.8 };
const GLOW = (hex, k = 2) => ({ roughness: 0.3, emissive: hex, emissiveIntensity: k });

/** A charging post: a slim cabinet, a screen lit up with the price (plus VAT), a cable coiled on a hook each side, a lit band round the top. */
export const charger = {
  name: 'charger', cell: 0.02, cells: { fine: 0.014 },
  materials: { paint: PAINT, trim: { roughness: 0.5 }, screen: GLOW('#7ad8ff', 1.6), band: GLOW('#9ad0ff', 1.3), rubber: { roughness: 0.85 } },
  colliders: [{ box: [-0.28, 0, -0.36, 0.28, 1.6, 0.36] }],
  lights: [[0, 1.5, 0, '#cfe8ff', 2.2]],
  sculpt(s) {
    s.box([0, 0.05, 0], [0.28, 0.05, 0.36], 0.02, { color: '#5a5c62', mat: 'trim', k: 0.01 });
    s.box([0, 0.78, 0], [0.22, 0.72, 0.3], 0.06, { color: '#eceae4', mat: 'paint', k: 0.03 });
    s.box([0, 1.48, 0], [0.24, 0.05, 0.32], 0.03, { color: '#9ad0ff', mat: 'band', k: 0.01 });
    s.mirror((m) => {
      s.box([m * 0.222, 1.1, 0], [0.006, 0.14, 0.2], 0.01, { color: '#101a22', mat: 'trim', k: 0.004 });
      s.box([m * 0.228, 1.12, 0], [0.004, 0.08, 0.15], 0.004, { color: '#aee6ff', mat: 'screen', k: 0.002 });
      // The plug in its holster, and its cable, looped down and back.
      s.box([m * 0.25, 0.72, 0.16], [0.03, 0.08, 0.05], 0.015, { color: '#1a3aa0', mat: 'paint', k: 0.006 });
      s.part('fine', () => {
        s.chain([[m * 0.25, 0.62, 0.2], [m * 0.36, 0.3, 0.26], [m * 0.32, 0.1, 0.12], [m * 0.27, 0.4, -0.12], [m * 0.24, 0.9, -0.2]], [0.024, 0.024, 0.024, 0.024, 0.024], { color: '#1a1a1c', mat: 'rubber', k: 0.012 });
      });
    });
  },
};

/** A stamp's gantry, standing over the tile at the origin with the stamp coming down between its legs: two posts along ±z, a beam across the top and the ram's cylinder on it. The stamp is `stamphead`. */
export const stampframe = {
  name: 'stampframe', cell: 0.05, cells: { fine: 0.03 },
  materials: { paint: PAINT, steel: STEEL },
  sculpt(s) {
    const blue = grainy('#1a3aa0', 0.15, 10), steel = grainy('#7a8088', 0.18, 12);
    s.mirror((m) => {
      s.box([0, 1.6, m * 0.72], [0.12, 1.6, 0.1], 0.03, { color: blue, mat: 'paint', k: 0.02 });
      s.box([0, 0.06, m * 0.72], [0.24, 0.06, 0.18], 0.02, { color: steel, mat: 'steel', k: 0.01 });
    });
    s.box([0, 3.25, 0], [0.18, 0.14, 0.86], 0.04, { color: blue, mat: 'paint', k: 0.02 });
    // The ram's cylinder, and a ring of gold stars painted on the beam.
    s.cylinder([0, 3.5, 0], 0.2, 0.32, { color: steel, mat: 'steel', k: 0.02, round: 0.03 });
    s.part('fine', () => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        s.sphere([0.185, 3.25 + Math.sin(a) * 0.09, Math.cos(a) * 0.09], 0.016, { color: '#f4d020', mat: 'paint', k: 0.004 });
      }
    });
  },
};

/** The stamp: a rubber pad, red with ink, on a wooden block, the ram's rod going up out of it. Its bottom is at the origin. */
export const stamphead = {
  name: 'stamphead', cell: 0.035, cells: { fine: 0.02 },
  materials: { paint: PAINT, wood: { roughness: 0.7 }, rubber: { roughness: 0.6, clearcoat: 0.6 }, steel: { roughness: 0.2, metalness: 1 } },
  sculpt(s) {
    s.box([0, 0.06, 0], [0.4, 0.06, 0.35], 0.02, { color: '#c8182a', mat: 'rubber', k: 0.01 });
    s.box([0, 0.38, 0], [0.38, 0.26, 0.33], 0.05, { color: grainy('#8a5a30', 0.2, 14), mat: 'wood', k: 0.02 });
    s.box([0, 0.7, 0], [0.16, 0.06, 0.16], 0.03, { color: '#5a6068', mat: 'steel', k: 0.01 });
    s.limb([0, 0.7, 0], [0, 3.1, 0], 0.07, 0.07, { color: '#c8ccd2', mat: 'steel', k: 0.01 });
    s.part('fine', () => s.paint((p) => Math.abs(p[1] - 0.42) - 0.04, '#f4d020', 0.008));
  },
};

/** A cable reel on its end: two wooden flanges, the drum between them wound with cable. It rolls on its flanges. */
export const reel = {
  name: 'reel', cell: 0.03,
  materials: { wood: { roughness: 0.8 }, cable: { roughness: 0.5, clearcoat: 0.4 }, steel: STEEL },
  sculpt(s) {
    const wood = grainy('#a87a48', 0.22, 18);
    for (const y of [0.05, 0.83]) s.cylinder([0, y, 0], 0.34, 0.05, { color: wood, mat: 'wood', k: 0.01, round: 0.015 });
    s.cylinder([0, 0.44, 0], 0.27, 0.36, { color: '#e07a2a', mat: 'cable', k: 0.01, round: 0.01 });
    for (let y = 0.12; y < 0.8; y += 0.06) s.torus([0, y, 0], 0.27, 0.022, { color: '#c8661e', mat: 'cable', k: 0.006 });
    s.cylinder([0, 0.44, 0], 0.06, 0.46, { color: '#5a6068', mat: 'steel', k: 0.01, round: 0.01 });
  },
};

/** A vent in the floor: a ring, a grate over a dark throat. The hot take comes out of it. */
export const vent = {
  name: 'vent', cell: 0.022,
  materials: { steel: STEEL, brass: { roughness: 0.3, metalness: 0.9 }, throat: { roughness: 1 } },
  sculpt(s) {
    s.torus([0, 0.02, 0], 0.4, 0.04, { color: '#b08a3a', mat: 'brass', k: 0.01 });
    s.cylinder([0, 0.0, 0], 0.38, 0.015, { color: '#0a0806', mat: 'throat', k: 0.004 });
    for (const t of [-0.24, -0.08, 0.08, 0.24]) s.box([t, 0.025, 0], [0.018, 0.012, 0.36 * Math.sqrt(1 - (t / 0.38) ** 2)], 0.006, { color: '#4a4e56', mat: 'steel', k: 0.004 });
  },
};

export const CIVIC = { charger, stampframe, stamphead, reel, vent };
