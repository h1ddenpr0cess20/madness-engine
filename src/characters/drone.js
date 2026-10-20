import { grainy } from '../models/skins.js';

/**
 * The Drone: somebody's camera drone, hired to get the crowd shot and now
 * very interested in a boulder. A white shell, four arms out to four
 * rotors in guards, landing legs, a camera on a gimbal underneath and a red
 * light that means it is recording. It hovers over the crowd, tilting into
 * the way it goes. About 0.6 tiles across; a flyer, so its origin is its
 * middle.
 */

const SHELL = grainy('#eef0f4', 0.04, 30);
const DARK = '#1c1e24';
const ARM = 0.17;

export default {
  name: 'drone',
  scale: 1.5,
  cell: 0.0055,
  cells: { rotors: 0.004, fine: 0.003 },
  budget: 18000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ...[0, 1, 2, 3].map((i) => {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      return [`rotor${i}`, 'body', [Math.cos(a) * ARM, 0.04, Math.sin(a) * ARM]];
    }),
  ],
  materials: {
    shell: { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 },
    dark: { roughness: 0.55 },
    glass: { roughness: 0.04, clearcoat: 1, metalness: 0.3 },
    blade: { roughness: 0.4, opacity: 0.7 },
    red: { roughness: 0.4, emissive: '#ff2020', emissiveIntensity: 2.2 },
    green: { roughness: 0.4, emissive: '#30ff60', emissiveIntensity: 2 },
  },
  sculpt(s) {
    const B = { bone: 'body' };
    // The shell: a rounded body, a raised spine, the battery behind.
    s.ellipsoid([0, 0, 0], [0.085, 0.045, 0.12], { ...B, color: SHELL, mat: 'shell', k: 0.02 });
    s.ellipsoid([0, 0.035, -0.01], [0.05, 0.025, 0.08], { ...B, color: SHELL, mat: 'shell', k: 0.02 });
    s.box([0, 0.01, -0.1], [0.05, 0.03, 0.04], 0.015, { ...B, color: DARK, mat: 'dark', k: 0.01 });
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const end = [Math.cos(a) * ARM, 0.02, Math.sin(a) * ARM];
      // An arm out to a motor, a guard ring round the rotor, and a leg down.
      s.limb([Math.cos(a) * 0.05, 0.005, Math.sin(a) * 0.07], end, 0.016, 0.012, { ...B, color: SHELL, mat: 'shell', k: 0.012 });
      s.cylinder(end, 0.02, 0.022, { ...B, color: DARK, mat: 'dark', k: 0.006, round: 0.006 });
      s.torus([end[0], 0.045, end[2]], 0.088, 0.006, { ...B, color: SHELL, mat: 'shell', k: 0.004 });
      s.limb(end, [end[0] * 1.05, -0.08, end[2] * 1.05], 0.006, 0.005, { ...B, color: DARK, mat: 'dark', k: 0.004 });
      s.part('rotors', () => {
        for (const t of [0, Math.PI]) {
          s.flake([end[0], 0.048, end[2]], [end[0] + Math.cos(a + t) * 0.08, 0.05, end[2] + Math.sin(a + t) * 0.08], [0, 1, 0], 0.014, 0.008, 0.18, { bone: `rotor${i}`, color: '#2a2c34', mat: 'blade', k: 0.003 });
        }
        s.sphere([end[0], 0.052, end[2]], 0.012, { bone: `rotor${i}`, color: '#c8ccd4', mat: 'shell', k: 0.002 });
      });
    }
    // The camera on its gimbal underneath, looking forward.
    s.limb([0, -0.035, 0.07], [0, -0.06, 0.08], 0.012, 0.012, { ...B, color: DARK, mat: 'dark', k: 0.006 });
    s.box([0, -0.075, 0.09], [0.03, 0.025, 0.028], 0.01, { ...B, color: DARK, mat: 'dark', k: 0.006 });
    s.part('fine', () => {
      s.cylinder([0, -0.075, 0.12], 0.016, 0.006, { ...B, color: '#203048', mat: 'glass', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      // The red light: recording.
      s.sphere([0, 0.05, 0.1], 0.011, { ...B, color: '#ff2a2a', mat: 'red', k: 0.002 });
      // A green and a red light on the front arms' motors.
      s.sphere([0.12, 0.0, 0.12], 0.008, { ...B, color: '#3aff6a', mat: 'green', k: 0.002 });
      s.sphere([-0.12, 0.0, 0.12], 0.008, { ...B, color: '#ff3a3a', mat: 'red', k: 0.002 });
    });
  },
  animate(k, { clip, time, seed = 0 }) {
    const T = time + seed;
    for (let i = 0; i < 4; i++) k.turn(`rotor${i}`, 0, T * (i % 2 ? -40 : 40), 0);
    if (clip === 'ko') {
      k.turn('body', 0.9, 0, 0.6);
      return;
    }
    // A hover that bobs, and a nose-down tilt into the way it is going.
    k.move('root', 0, Math.sin(T * 2.4) * 0.015, 0);
    k.turn('body', clip === 'walk' || clip === 'attack' ? 0.22 : Math.sin(T * 1.1) * 0.04, 0, Math.sin(T * 1.7) * 0.05);
  },
};
