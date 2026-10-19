import { coat, grainy } from '../models/skins.js';

/**
 * The furniture of the streets and yards, sculpted. Each stands on the
 * ground at y = 0, facing +z, and says what in it is solid (`colliders`:
 * `cyl: [x, z, r, y0, y1]` and `box: [x0, y0, z0, x1, y1, z1]`, in its own
 * frame) and where it gives light (`lights`: `[x, y, z, colour, reach]`).
 */

const PAINTED = { roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.2 };
const METAL = { roughness: 0.35, metalness: 0.75 };
const GLOW = (hex, k = 2) => ({ roughness: 0.3, emissive: hex, emissiveIntensity: k });
const bark = grainy('#4a3424', 0.3, 40);
const leaves = (hex) => coat({ over: hex, under: '#1e3418', vary: 0.28, freq: 6, grain: 0.15, gfreq: 30, edge: [-0.6, 0.6] });

/** A sodium street lamp: a tapered pole, an arm out over the road, a cobra head glowing orange underneath. */
export const streetlamp = {
  name: 'streetlamp', cell: 0.03, cells: { head: 0.022 },
  materials: { pole: METAL, head: { roughness: 0.4, metalness: 0.3 }, lamp: GLOW('#ffb050', 3) },
  colliders: [{ cyl: [0, 0, 0.09, 0, 3.4] }],
  lights: [[0.85, 3.25, 0, '#ffb35a', 7.5]],
  sculpt(s) {
    s.cylinder([0, 0.12, 0], 0.13, 0.12, { color: '#5a5e66', mat: 'pole', k: 0.02, round: 0.03 });
    s.limb([0, 0.2, 0], [0, 3.35, 0], 0.07, 0.045, { color: '#7a8088', mat: 'pole', k: 0.02 });
    s.limb([0, 3.3, 0], [0.55, 3.42, 0], 0.035, 0.03, { color: '#7a8088', mat: 'pole', k: 0.03 });
    s.part('head', () => {
      s.ellipsoid([0.85, 3.4, 0], [0.3, 0.07, 0.13], { color: '#3a3d44', mat: 'head', k: 0.02 });
      s.ellipsoid([0.85, 3.34, 0], [0.22, 0.03, 0.09], { color: '#ffd9a0', mat: 'lamp', k: 0.01 });
    });
  },
};

/** An e-scooter, left in the middle of everything: a deck, the stem, the bars, two small wheels, a lit display. */
export const scooter = {
  name: 'scooter', cell: 0.016,
  materials: { paint: PAINTED, rubber: { roughness: 0.9 }, metal: METAL, screen: GLOW('#9affb8', 1.4) },
  colliders: [{ box: [-0.14, 0, -0.42, 0.14, 0.95, 0.42] }],
  sculpt(s) {
    const green = grainy('#2aa84a', 0.1, 40);
    s.box([0, 0.1, 0], [0.08, 0.025, 0.3], 0.02, { color: green, mat: 'paint', k: 0.01 });
    s.limb([0, 0.12, 0.3], [0, 0.92, 0.36], 0.02, 0.018, { color: '#3a3d44', mat: 'metal', k: 0.01 });
    s.limb([-0.2, 0.92, 0.36], [0.2, 0.92, 0.36], 0.014, 0.014, { color: '#1c1c20', mat: 'rubber', k: 0.006 });
    s.box([0, 0.93, 0.33], [0.04, 0.012, 0.03], 0.006, { color: '#9affb8', mat: 'screen', k: 0.004 });
    for (const z of [-0.3, 0.34]) s.cylinder([0, 0.07, z], 0.07, 0.025, { color: '#1c1c20', mat: 'rubber', k: 0.006, round: 0.012, rot: [0, 0, Math.PI / 2] });
  },
};

/** A fire hydrant: red, a bonnet on top, two caps on chains, a pentagon nut. */
export const hydrant = {
  name: 'hydrant', cell: 0.016,
  materials: { paint: PAINTED, brass: { roughness: 0.3, metalness: 0.9 } },
  colliders: [{ cyl: [0, 0, 0.13, 0, 0.6] }],
  sculpt(s) {
    const red = grainy('#c8281c', 0.12, 60);
    s.cylinder([0, 0.04, 0], 0.13, 0.04, { color: red, mat: 'paint', k: 0.01, round: 0.015 });
    s.cylinder([0, 0.27, 0], 0.09, 0.22, { color: red, mat: 'paint', k: 0.02, round: 0.02 });
    s.torus([0, 0.46, 0], 0.095, 0.018, { color: red, mat: 'paint', k: 0.01 });
    s.sphere([0, 0.5, 0], 0.09, { color: red, mat: 'paint', k: 0.03 });
    s.cylinder([0, 0.6, 0], 0.025, 0.03, { color: '#d8b040', mat: 'brass', k: 0.01, round: 0.006 });
    s.mirror((m) => s.cylinder([m * 0.12, 0.33, 0], 0.045, 0.04, { color: '#d8b040', mat: 'brass', k: 0.012, round: 0.01, rot: [0, 0, Math.PI / 2] }));
    s.cylinder([0, 0.3, 0.12], 0.06, 0.035, { color: red, mat: 'paint', k: 0.012, round: 0.012, rot: [Math.PI / 2, 0, 0] });
  },
};

/** A mailbox on a post, the flag up. */
export const mailbox = {
  name: 'mailbox', cell: 0.018,
  materials: { wood: { roughness: 0.8 }, paint: PAINTED, flag: PAINTED },
  colliders: [{ cyl: [0, 0, 0.06, 0, 1.1] }],
  sculpt(s) {
    s.box([0, 0.45, 0], [0.04, 0.45, 0.04], 0.01, { color: bark, mat: 'wood', k: 0.01 });
    s.box([0, 0.98, 0.02], [0.11, 0.08, 0.2], 0.03, { color: '#2a3a5a', mat: 'paint', k: 0.01 });
    s.cylinder([0, 1.06, 0.02], 0.11, 0.2, { color: '#2a3a5a', mat: 'paint', k: 0.03, rot: [Math.PI / 2, 0, 0] });
    s.box([0.125, 1.1, -0.08], [0.008, 0.08, 0.025], 0.004, { color: '#d02a20', mat: 'flag', k: 0.004 });
  },
};

/** A park bench: slats on cast-iron ends. */
export const bench = {
  name: 'bench', cell: 0.022,
  materials: { wood: { roughness: 0.75 }, iron: { roughness: 0.5, metalness: 0.6 } },
  colliders: [{ box: [-0.8, 0, -0.22, 0.8, 0.5, 0.22] }],
  sculpt(s) {
    const wood = grainy('#7a5030', 0.22, 30);
    for (let i = 0; i < 3; i++) s.box([0, 0.44, -0.12 + i * 0.1], [0.78, 0.018, 0.04], 0.01, { color: wood, mat: 'wood', k: 0.004 });
    for (let i = 0; i < 2; i++) s.box([0, 0.62 + i * 0.12, 0.2], [0.78, 0.04, 0.015], 0.01, { color: wood, mat: 'wood', k: 0.004, rot: [-0.25, 0, 0] });
    s.mirror((m) => {
      s.limb([m * 0.65, 0, -0.17], [m * 0.65, 0.43, -0.1], 0.025, 0.02, { color: '#2a2c30', mat: 'iron', k: 0.01 });
      s.limb([m * 0.65, 0, 0.18], [m * 0.65, 0.85, 0.24], 0.025, 0.02, { color: '#2a2c30', mat: 'iron', k: 0.01 });
      s.limb([m * 0.65, 0.43, -0.16], [m * 0.65, 0.43, 0.2], 0.02, 0.02, { color: '#2a2c30', mat: 'iron', k: 0.01 });
    });
  },
};

/** A wheelie bin. */
export const bin = {
  name: 'bin', cell: 0.03,
  materials: { plastic: { roughness: 0.6, clearcoat: 0.2 }, rubber: { roughness: 0.9 } },
  colliders: [{ box: [-0.28, 0, -0.3, 0.28, 1.0, 0.3] }],
  sculpt(s) {
    s.box([0, 0.48, 0], [0.26, 0.46, 0.28], 0.05, { color: '#2a5a3a', mat: 'plastic', k: 0.01 });
    s.box([0, 0.96, -0.01], [0.28, 0.025, 0.31], 0.02, { color: '#244e32', mat: 'plastic', k: 0.01 });
    s.mirror((m) => s.cylinder([m * 0.2, 0.08, -0.28], 0.08, 0.03, { color: '#18181a', mat: 'rubber', k: 0.006, round: 0.02, rot: [0, 0, Math.PI / 2] }));
  },
};

/** A traffic cone, with its reflective band. */
export const cone = {
  name: 'cone', cell: 0.018,
  materials: { plastic: { roughness: 0.5, clearcoat: 0.3 }, band: { roughness: 0.3, emissive: '#3a3a3a', emissiveIntensity: 1 } },
  colliders: [{ cyl: [0, 0, 0.16, 0, 0.55] }],
  sculpt(s) {
    s.box([0, 0.02, 0], [0.19, 0.02, 0.19], 0.015, { color: '#e05a1a', mat: 'plastic', k: 0.01 });
    s.cone([0, 0.56, 0], 0.15, 0.54, { color: '#f06a22', mat: 'plastic', k: 0.01 });
    s.paint((p) => Math.abs(p[1] - 0.32) - 0.05, '#f4f4f0', 0.006);
  },
};

/** A tree in a front garden: a trunk splitting into boughs, and a crown of leafy clumps. */
export const tree = {
  name: 'tree', cell: 0.055,
  materials: { bark: { roughness: 0.9 }, leaves: { roughness: 0.8, sheen: 0.6, sheenColor: '#9ac070' } },
  colliders: [{ cyl: [0, 0, 0.14, 0, 1.6] }],
  sculpt(s) {
    s.limb([0, 0, 0], [0.05, 1.3, 0], 0.13, 0.08, { color: bark, mat: 'bark', k: 0.05 });
    for (const [x, z] of [[0.45, 0.2], [-0.4, 0.25], [0.05, -0.45]]) s.limb([0.05, 1.2, 0], [x, 1.75, z], 0.06, 0.035, { color: bark, mat: 'bark', k: 0.04 });
    let r = 23;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, d = 0.25 + rnd() * 0.45, y = 1.75 + rnd() * 0.65;
      s.sphere([Math.cos(a) * d, y, Math.sin(a) * d], 0.42 + rnd() * 0.2, { color: leaves('#4f8a34'), mat: 'leaves', k: 0.18, bump: [0.06, 7] });
    }
    s.sphere([0, 2.5, 0], 0.48, { color: leaves('#5a9a3c'), mat: 'leaves', k: 0.2, bump: [0.06, 7] });
  },
};

/** A pine: a straight trunk and tiers of needles. */
export const pine = {
  name: 'pine', cell: 0.055,
  materials: tree.materials,
  colliders: [{ cyl: [0, 0, 0.12, 0, 1.6] }],
  sculpt(s) {
    s.limb([0, 0, 0], [0, 3.2, 0], 0.12, 0.04, { color: bark, mat: 'bark', k: 0.04 });
    for (let i = 0; i < 4; i++) {
      const y = 1.0 + i * 0.62, r = 1.0 - i * 0.2;
      s.cone([0, y + 0.95, 0], r, 0.95, { color: leaves('#2e5a2e'), mat: 'leaves', k: 0.08, bump: [0.05, 9] });
    }
  },
};

/** A clump of desert scrub. */
export const shrub = {
  name: 'shrub', cell: 0.045,
  materials: { leaves: { roughness: 0.85 } },
  sculpt(s) {
    for (let i = 0; i < 6; i++) {
      const a = i * 2.1;
      s.sphere([Math.cos(a) * 0.16, 0.14 + (i % 2) * 0.06, Math.sin(a) * 0.16], 0.17, { color: leaves('#7a8044'), mat: 'leaves', k: 0.08, bump: [0.04, 14] });
    }
  },
};

/** A rock, broken and weathered. */
export const rock = {
  name: 'rock', cell: 0.045,
  materials: { stone: { roughness: 0.9 } },
  colliders: [{ cyl: [0, 0, 0.26, 0, 0.3] }],
  sculpt(s) {
    s.box([0, 0.1, 0], [0.24, 0.16, 0.2], 0.08, { color: grainy('#8a7a68', 0.25, 12), mat: 'stone', k: 0.05, rot: [0.2, 0.6, 0.1], bump: [0.04, 8] });
    s.box([0.15, 0.05, 0.12], [0.12, 0.1, 0.1], 0.05, { color: grainy('#7a6a58', 0.25, 12), mat: 'stone', k: 0.06, rot: [0.1, 1.4, 0.3], bump: [0.03, 9] });
  },
};

/** A stack of old tyres. */
export const tyres = {
  name: 'tyres', cell: 0.03,
  materials: { rubber: { roughness: 0.9 } },
  colliders: [{ cyl: [0, 0, 0.38, 0, 1.0] }],
  sculpt(s) {
    for (let i = 0; i < 5; i++) s.torus([(i % 2) * 0.03, 0.1 + i * 0.19, (i % 3) * 0.02], 0.26, 0.095, { color: grainy('#1c1c1e', 0.2, 30), mat: 'rubber', k: 0.01, bump: [0.006, 40] });
  },
};

/** A dumpster against a wall: steel, its lid half open. */
export const dumpster = {
  name: 'dumpster', cell: 0.032,
  materials: { paint: { roughness: 0.6, metalness: 0.3 }, lid: { roughness: 0.7 }, rubber: { roughness: 0.9 } },
  colliders: [{ box: [-0.72, 0, -0.42, 0.72, 0.9, 0.42] }],
  sculpt(s) {
    const steel = grainy('#2e6a3e', 0.2, 18);
    s.box([0, 0.47, 0], [0.7, 0.4, 0.4], 0.04, { color: steel, mat: 'paint', k: 0.01 });
    s.box([0, 0.86, 0.02], [0.66, 0.04, 0.38], 0.02, { op: 'sub', k: 0.01 });
    s.box([0, 0.9, -0.08], [0.72, 0.02, 0.36], 0.015, { color: '#1c1c20', mat: 'lid', k: 0.006, rot: [0.25, 0, 0] });
    for (const x of [-0.45, 0, 0.45]) s.box([x, 0.47, 0.41], [0.03, 0.36, 0.015], 0.01, { color: steel, mat: 'paint', k: 0.006 });
    s.mirror((m) => s.cylinder([m * 0.55, 0.05, 0], 0.05, 0.03, { color: '#18181a', mat: 'rubber', k: 0.006, round: 0.01, rot: [Math.PI / 2, 0, 0] }));
  },
};

/** The statue in the plaza: a bronze paperclip, taller than a person, on a stone plinth. Somebody's idea of a warning. */
export const statue = {
  name: 'statue', cell: 0.03,
  materials: { stone: { roughness: 0.85 }, bronze: { roughness: 0.32, metalness: 0.9, clearcoat: 0.3 } },
  colliders: [{ box: [-0.6, 0, -0.6, 0.6, 1.4, 0.6] }],
  sculpt(s) {
    const stone = grainy('#b8b2a4', 0.18, 14), bronze = grainy('#8a6a32', 0.25, 20);
    s.box([0, 0.5, 0], [0.55, 0.5, 0.55], 0.04, { color: stone, mat: 'stone', k: 0.01 });
    s.box([0, 1.04, 0], [0.6, 0.05, 0.6], 0.03, { color: stone, mat: 'stone', k: 0.01 });
    // The clip: a wire folded back on itself, three loops, standing on its end.
    const wire = [[-0.08, 1.7], [-0.08, 2.15], [0, 2.3], [0.1, 2.15], [0.1, 1.4], [0, 1.24], [-0.14, 1.4], [-0.14, 2.35], [-0.04, 2.5], [0.2, 2.35], [0.2, 1.3]];
    s.chain(wire.map(([x, y]) => [x, y, 0]), wire.map(() => 0.032), { color: bronze, mat: 'bronze', k: 0.02 });
  },
};

export const STREET = { scooter, statue, streetlamp, hydrant, mailbox, bench, bin, cone, tree, pine, shrub, rock, tyres, dumpster };
