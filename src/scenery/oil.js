import { grainy } from '../models/skins.js';

/**
 * The gas station's and the oil field's machinery, sculpted: the pumps and
 * the air pump, the pumpjack (its frame standing still, its walking beam
 * and horsehead nodding), oil drums, a wellhead, a flare vent; and the
 * seeds there are to find. Same conventions as `street.js`.
 */

const PAINT = { roughness: 0.42, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.15 };
const STEEL = { roughness: 0.4, metalness: 0.8 };
const GLOW = (hex, k = 2) => ({ roughness: 0.3, emissive: hex, emissiveIntensity: k });

/** A petrol pump: a tall cabinet, the price display lit up, a nozzle holstered each side, the hose looped down. */
export const gaspump = {
  name: 'gaspump', cell: 0.022, cells: { fine: 0.014 },
  materials: { paint: PAINT, trim: { roughness: 0.5 }, screen: GLOW('#7aff9a', 1.6), sign: GLOW('#ffffff', 1.1), rubber: { roughness: 0.85 }, chrome: { roughness: 0.15, metalness: 1 } },
  colliders: [{ box: [-0.3, 0, -0.42, 0.3, 1.5, 0.42] }],
  lights: [[0, 1.45, 0, '#ffffff', 2.2]],
  sculpt(s) {
    s.box([0, 0.06, 0], [0.3, 0.06, 0.42], 0.02, { color: '#5a5c62', mat: 'trim', k: 0.01 });
    s.box([0, 0.72, 0], [0.26, 0.62, 0.38], 0.05, { color: '#eceae4', mat: 'paint', k: 0.02 });
    s.box([0, 1.36, 0], [0.28, 0.1, 0.4], 0.04, { color: '#d8402e', mat: 'paint', k: 0.02 });
    s.mirror((m) => {
      s.box([m * 0.262, 1.0, 0], [0.006, 0.12, 0.24], 0.01, { color: '#18221a', mat: 'trim', k: 0.004 });
      s.box([m * 0.268, 1.02, 0], [0.004, 0.035, 0.18], 0.004, { color: '#9affb8', mat: 'screen', k: 0.002 });
      s.box([m * 0.285, 1.36, 0], [0.004, 0.06, 0.3], 0.01, { color: '#ffffff', mat: 'sign', k: 0.003 });
      // The nozzle in its holster, and its hose.
      s.box([m * 0.28, 0.62, 0.18], [0.03, 0.09, 0.05], 0.015, { color: '#2a2c30', mat: 'trim', k: 0.006 });
      s.part('fine', () => {
        s.limb([m * 0.3, 0.68, 0.22], [m * 0.36, 0.6, 0.28], 0.016, 0.012, { color: '#d8dce2', mat: 'chrome', k: 0.006 });
        s.chain([[m * 0.3, 0.55, 0.16], [m * 0.36, 0.25, 0.25], [m * 0.32, 0.12, 0.4], [m * 0.27, 0.35, 0.36]], [0.02, 0.02, 0.02, 0.02], { color: '#1a1a1c', mat: 'rubber', k: 0.012 });
      });
    });
  },
};

/** The air pump: a red post with a dial, a coiled hose, AIR across the top. */
export const airpump = {
  name: 'airpump', cell: 0.02,
  materials: { paint: PAINT, dial: { roughness: 0.2, clearcoat: 1 }, sign: GLOW('#fff6e0', 1.4), rubber: { roughness: 0.85 } },
  colliders: [{ box: [-0.22, 0, -0.17, 0.22, 1.25, 0.17] }],
  lights: [[0, 1.3, 0.3, '#ffe8c0', 2.5]],
  sculpt(s) {
    s.box([0, 0.6, 0], [0.2, 0.58, 0.15], 0.05, { color: '#c8302a', mat: 'paint', k: 0.02 });
    s.box([0, 1.2, 0], [0.22, 0.06, 0.17], 0.03, { color: '#eceae4', mat: 'paint', k: 0.02 });
    s.box([0, 0.95, 0.152], [0.15, 0.08, 0.008], 0.01, { color: '#fff6e0', mat: 'sign', k: 0.003 });
    s.cylinder([0, 0.7, 0.155], 0.07, 0.012, { color: '#f4f2ec', mat: 'dial', k: 0.006, round: 0.006, rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 4; i++) s.torus([0.24, 0.32 + i * 0.045, 0], 0.09, 0.016, { color: '#1a1a1c', mat: 'rubber', k: 0.004, rot: [0, 0, Math.PI / 2] });
  },
};

/** A pumpjack's frame, nodding over +x: the base skid, the Samson post's A-frame up to the bearing, the gearbox and its cranks and counterweights. The beam is `pumpbeam`. */
export const pumpframe = {
  name: 'pumpframe', cell: 0.055, cells: { fine: 0.03 },
  materials: { steel: STEEL, paint: PAINT, concrete: { roughness: 0.9 } },
  sculpt(s) {
    const yellow = grainy('#e8b020', 0.18, 12), grey = grainy('#5a6068', 0.2, 12);
    // The skid and its concrete pad.
    s.box([-1.6, 0.08, 0.5], [3.2, 0.08, 0.95], 0.03, { color: grainy('#8a867e', 0.2, 6), mat: 'concrete', k: 0.02 });
    s.mirror((m) => s.box([-1.6, 0.22, 0.5 + m * 0.42], [3.0, 0.07, 0.07], 0.02, { color: grey, mat: 'steel', k: 0.01 }));
    // The Samson post: four legs up to the bearing under the beam.
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.42, 0.42]) s.limb([-1.8 + dx, 0.25, 0.5 + dz], [-1.8, 2.25, 0.5 + dz * 0.25], 0.06, 0.05, { color: yellow, mat: 'paint', k: 0.03 });
    s.box([-1.8, 2.28, 0.5], [0.16, 0.08, 0.22], 0.03, { color: grey, mat: 'steel', k: 0.02 });
    // The gearbox, the motor, the belt guard.
    s.box([-3.5, 0.85, 0.5], [0.4, 0.55, 0.32], 0.08, { color: yellow, mat: 'paint', k: 0.03 });
    s.box([-4.3, 0.55, 0.5], [0.3, 0.25, 0.25], 0.06, { color: grey, mat: 'steel', k: 0.02 });
    s.box([-3.95, 0.7, 0.85], [0.42, 0.3, 0.05], 0.06, { color: yellow, mat: 'paint', k: 0.02 });
    // The cranks and counterweights, either side of the gearbox.
    s.mirror((m) => {
      s.box([-3.5, 0.95, 0.5 + m * 0.42], [0.15, 0.55, 0.05], 0.05, { color: grey, mat: 'steel', k: 0.02, rot: [0, 0, 0.5] });
      s.box([-3.25, 0.5, 0.5 + m * 0.44], [0.35, 0.28, 0.07], 0.1, { color: '#c8382c', mat: 'paint', k: 0.03, rot: [0, 0, 0.5] });
    });
    // The wellhead under the horsehead: a stack of flanges and a valve wheel.
    s.part('fine', () => {
      s.cylinder([0.5, 0.25, 0.5], 0.16, 0.25, { color: grey, mat: 'steel', k: 0.02, round: 0.02 });
      for (const y of [0.12, 0.3, 0.48]) s.cylinder([0.5, y, 0.5], 0.21, 0.025, { color: grey, mat: 'steel', k: 0.01, round: 0.01 });
      s.torus([0.5, 0.36, 0.8], 0.09, 0.014, { color: '#c8382c', mat: 'paint', k: 0.005, rot: [Math.PI / 2, 0, 0] });
      s.limb([0.5, 0.36, 0.5], [0.5, 0.36, 0.8], 0.02, 0.02, { color: grey, mat: 'steel', k: 0.005 });
    });
  },
};

/** The walking beam, pivoting at the origin along x: an I-beam, the horsehead curving down at +x with its bridle, the equaliser at −x. */
export const pumpbeam = {
  name: 'pumpbeam', cell: 0.045, cells: { fine: 0.022 },
  materials: { paint: PAINT, steel: STEEL, cable: { roughness: 0.4, metalness: 0.9 } },
  sculpt(s) {
    const yellow = grainy('#e8b020', 0.18, 12);
    s.box([0.1, 0, 0], [2.15, 0.12, 0.06], 0.02, { color: yellow, mat: 'paint', k: 0.01 });
    s.box([0.1, 0.11, 0], [2.15, 0.02, 0.14], 0.01, { color: yellow, mat: 'paint', k: 0.01 });
    s.box([0.1, -0.11, 0], [2.15, 0.02, 0.14], 0.01, { color: yellow, mat: 'paint', k: 0.01 });
    // The horsehead: a curved plate, wide and deep, its face an arc round the pivot.
    s.shape((p) => {
      const R = 2.3, x = p[0], y = p[1], z = Math.abs(p[2]);
      const r = Math.hypot(x, y);
      const arc = Math.max(r - R, 1.75 - r);
      const ang = Math.atan2(y, x);
      const span = Math.max(ang - 0.25, -0.5 - ang);
      return Math.max(arc, span * R, z - 0.2) - 0.02;
    }, [[1.5, -1.3, -0.25], [2.4, 0.7, 0.25]], { color: yellow, mat: 'paint', k: 0.03 });
    s.paint((p) => Math.max(Math.abs(Math.hypot(p[0], p[1]) - 2.25) - 0.06, -1), '#1d1d22', 0.02);
    // The equaliser and the pitman arms going down to the cranks.
    s.box([-2.0, -0.05, 0], [0.1, 0.12, 0.45], 0.03, { color: '#5a6068', mat: 'steel', k: 0.02 });
    s.part('fine', () => {
      // The bridle: two cables down the face of the horsehead to the carrier bar.
      for (const z of [-0.08, 0.08]) s.limb([2.3, 0.35, z], [2.33, -1.1, z], 0.012, 0.012, { color: '#c8ccd2', mat: 'cable', k: 0 });
      s.box([2.33, -1.12, 0], [0.04, 0.025, 0.14], 0.01, { color: '#5a6068', mat: 'steel', k: 0.005 });
    });
  },
};

/** An oil drum: ribbed, its lid rimmed, a band of colour. */
export const drum = {
  name: 'drum', cell: 0.032,
  materials: { paint: { roughness: 0.4, metalness: 0.4, clearcoat: 0.6 }, steel: STEEL },
  sculpt(s) {
    const blue = grainy('#2a5aa8', 0.15, 20);
    s.cylinder([0, 0.44, 0], 0.3, 0.44, { color: blue, mat: 'paint', k: 0.01, round: 0.03 });
    for (const y of [0.3, 0.58]) s.torus([0, y, 0], 0.3, 0.018, { color: blue, mat: 'paint', k: 0.008 });
    for (const y of [0.0, 0.88]) s.torus([0, y, 0], 0.29, 0.02, { color: '#7a8088', mat: 'steel', k: 0.008 });
    s.paint((p) => Math.abs(p[1] - 0.44) - 0.07, '#e8e2d6', 0.008);
    s.cylinder([0.15, 0.89, 0.05], 0.035, 0.012, { color: '#7a8088', mat: 'steel', k: 0.005, round: 0.005 });
  },
};

/** A gas vent in the floor: a ring, a grate over a dark throat. The flame comes out of it. */
export const vent = {
  name: 'vent', cell: 0.022,
  materials: { steel: STEEL, brass: { roughness: 0.3, metalness: 0.9 }, throat: { roughness: 1 } },
  sculpt(s) {
    s.torus([0, 0.02, 0], 0.4, 0.04, { color: '#b08a3a', mat: 'brass', k: 0.01 });
    s.cylinder([0, 0.0, 0], 0.38, 0.015, { color: '#0a0806', mat: 'throat', k: 0.004 });
    for (const t of [-0.24, -0.08, 0.08, 0.24]) s.box([t, 0.025, 0], [0.018, 0.012, 0.36 * Math.sqrt(1 - (t / 0.38) ** 2)], 0.006, { color: '#4a4e56', mat: 'steel', k: 0.004 });
  },
};

/** A sunflower seed's shape: plump at the back, drawn to a point at the front (+z), a little flattened, its stripes running end to end. */
function sunflower(s, k, body, mat, stripe) {
  s.ellipsoid([0, 0, -0.025 * k], [0.05 * k, 0.03 * k, 0.065 * k], { color: body, mat, k: 0.03 * k });
  s.ellipsoid([0, 0, 0.04 * k], [0.03 * k, 0.02 * k, 0.05 * k], { color: body, mat, k: 0.03 * k });
  s.sphere([0, 0, 0.085 * k], 0.008 * k, { color: body, mat, k: 0.02 * k });
  s.paint((p) => Math.abs(Math.abs(p[0]) - 0.02 * k) - 0.006 * k, stripe, 0.004 * k);
}

/** A sunflower seed: grey-black with cream stripes from end to end. */
export const seed = {
  name: 'seed', cell: 0.009,
  materials: { husk: { roughness: 0.45, clearcoat: 0.5 } },
  sculpt(s) { sunflower(s, 1, '#4a423a', 'husk', '#f4ead4'); },
};

/** A golden seed: the same, big, gold and shining. */
export const goldseed = {
  name: 'goldseed', cell: 0.014,
  materials: { gold: { roughness: 0.16, metalness: 1, clearcoat: 1, emissive: '#7a4a08', emissiveIntensity: 0.6 } },
  sculpt(s) { sunflower(s, 2.6, '#f0c040', 'gold', '#fff0b0'); },
};

export const OIL = { gaspump, airpump, pumpframe, pumpbeam, drum, vent, seed, goldseed };
