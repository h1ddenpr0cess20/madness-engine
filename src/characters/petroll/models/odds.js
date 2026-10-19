import { grainy } from '../../../models/skins.js';

/**
 * Odds and ends for the jobs and for knocking flying: lawn flamingos,
 * yard signs, crates, survey flags, and the things a job has the hamster
 * carry (a jar of pickled eggs, dynamite, a film reel). Same conventions as
 * `street.js`; none of them is solid (the rules decide what's touched).
 */

const wood = grainy('#9a7448', 0.25, 26);

/** A pink plastic flamingo on wire legs, stuck in a lawn. */
export const flamingo = {
  name: 'flamingo', cell: 0.014,
  materials: { plastic: { roughness: 0.35, clearcoat: 0.6 }, wire: { roughness: 0.4, metalness: 0.8 } },
  sculpt(s) {
    const pink = '#f27aa8';
    for (const x of [-0.03, 0.03]) s.limb([x, 0, 0], [x * 0.5, 0.36, -0.02], 0.006, 0.006, { color: '#8a8f9a', mat: 'wire', k: 0.003 });
    s.ellipsoid([0, 0.42, -0.02], [0.08, 0.075, 0.14], { color: pink, mat: 'plastic', k: 0.02 });
    s.ellipsoid([0, 0.45, -0.15], [0.05, 0.035, 0.07], { color: '#e8608e', mat: 'plastic', k: 0.02 });
    s.chain([[0, 0.45, 0.09], [0, 0.56, 0.1], [0, 0.66, 0.06], [0, 0.71, 0.1]], [0.025, 0.02, 0.022, 0.03], { color: pink, mat: 'plastic', k: 0.012 });
    s.limb([0, 0.71, 0.12], [0, 0.67, 0.19], 0.014, 0.008, { color: '#1c1b1a', mat: 'plastic', k: 0.006 });
    s.paint((p) => Math.hypot(p[0], p[1] - 0.715, p[2] - 0.11) - 0.009, '#1c1b1a', 0.002);
  },
};

/** A yard sign on a stake: red, a white band across it. VOTE GRUBB, it says, though only to those who can read it. */
export const yardsign = {
  name: 'yardsign', cell: 0.012,
  materials: { board: { roughness: 0.6 }, wood: { roughness: 0.8 } },
  sculpt(s) {
    for (const x of [-0.16, 0.16]) s.box([x, 0.22, 0], [0.012, 0.22, 0.008], 0.004, { color: wood, mat: 'wood', k: 0.004 });
    s.box([0, 0.46, 0], [0.24, 0.15, 0.012], 0.006, { color: '#2a4aa8', mat: 'board', k: 0.004 });
    s.paint((p) => Math.abs(p[1] - 0.46) - 0.045, '#f4f1ea', 0.004);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.46) - 0.02, Math.abs(p[0]) - 0.15), '#c8382c', 0.003);
  },
};

/** A wooden crate, nailed together. */
export const crate = {
  name: 'crate', cell: 0.016,
  materials: { wood: { roughness: 0.85 } },
  sculpt(s) {
    s.box([0, 0.22, 0], [0.22, 0.22, 0.22], 0.012, { color: wood, mat: 'wood', k: 0.004 });
    for (const y of [0.04, 0.4]) s.box([0, y, 0], [0.235, 0.025, 0.235], 0.006, { color: '#7a5434', mat: 'wood', k: 0.003 });
    s.mirror((m) => s.box([m * 0.235, 0.22, 0], [0.012, 0.2, 0.03], 0.004, { color: '#7a5434', mat: 'wood', k: 0.003 }));
  },
};

/** A surveyor's flag: a thin stake, an orange flag, a stripe of tape. */
export const flag = {
  name: 'flag', cell: 0.012,
  materials: { stake: { roughness: 0.6, metalness: 0.5 }, cloth: { roughness: 0.7, emissive: '#5a1a00', emissiveIntensity: 0.5 } },
  sculpt(s) {
    s.limb([0, 0, 0], [0, 0.72, 0], 0.008, 0.006, { color: '#c8ccd2', mat: 'stake', k: 0.004 });
    s.box([0.1, 0.62, 0], [0.1, 0.07, 0.006], 0.004, { color: '#ff6a1a', mat: 'cloth', k: 0.004 });
    s.paint((p) => Math.abs(p[1] - 0.62) - 0.015, '#fff4d0', 0.003);
  },
};

/** A big jar of pickled eggs, its lid screwed down. */
export const jar = {
  name: 'jar', cell: 0.008,
  materials: { glass: { roughness: 0.05, clearcoat: 1, transmission: 0.2 }, lid: { roughness: 0.3, metalness: 0.8 }, egg: { roughness: 0.6 } },
  sculpt(s) {
    s.cylinder([0, 0.09, 0], 0.07, 0.09, { color: '#d8e8c0', mat: 'glass', k: 0.01, round: 0.03 });
    s.cylinder([0, 0.19, 0], 0.06, 0.018, { color: '#c8382c', mat: 'lid', k: 0.004, round: 0.006 });
    s.paint((p) => Math.abs(p[1] - 0.09) - 0.03, '#f4e6b0', 0.004);
  },
};

/** Three sticks of dynamite taped together, a fuse out of the top. */
export const dynamite = {
  name: 'dynamite', cell: 0.007,
  materials: { paper: { roughness: 0.7 }, tape: { roughness: 0.5 }, fuse: { roughness: 0.9 } },
  sculpt(s) {
    for (const [x, z] of [[-0.025, 0], [0.025, 0], [0, 0.04]]) s.cylinder([x, 0.1, z], 0.024, 0.1, { color: '#c8302a', mat: 'paper', k: 0.004, round: 0.006 });
    for (const y of [0.05, 0.15]) s.torus([0, y, 0.013], 0.045, 0.006, { color: '#2a2a2e', mat: 'tape', k: 0.004 });
    s.chain([[0, 0.2, 0.013], [0.01, 0.24, 0.02], [0.03, 0.26, 0.01]], [0.004, 0.004, 0.004], { color: '#d8c8a0', mat: 'fuse', k: 0.002 });
  },
};

/** A reel of film. */
export const reel = {
  name: 'reel', cell: 0.008,
  materials: { metal: { roughness: 0.3, metalness: 0.85 }, film: { roughness: 0.3, clearcoat: 0.6 } },
  sculpt(s) {
    s.cylinder([0, 0.1, 0], 0.1, 0.03, { color: '#3a2a20', mat: 'film', k: 0.004, rot: [Math.PI / 2, 0, 0] });
    for (const z of [-0.034, 0.034]) s.cylinder([0, 0.1, z], 0.11, 0.004, { color: '#b8bec6', mat: 'metal', k: 0.003, rot: [Math.PI / 2, 0, 0] });
    for (const z of [-0.04, 0.04]) for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      s.cylinder([Math.cos(a) * 0.055, 0.1 + Math.sin(a) * 0.055, z], 0.025, 0.006, { op: 'sub', k: 0.003, rot: [Math.PI / 2, 0, 0] });
    }
  },
};

export const ODDS = { flamingo, yardsign, crate, flag, jar, dynamite, reel };
