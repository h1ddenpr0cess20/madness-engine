import { coat } from '../models/skins.js';

/**
 * The Rubber Bat: from the horror picture, on a wire, mostly. A fat black
 * rubber body, big ears, red bead eyes, two white fangs, wings of black
 * oilcloth stretched over wire fingers, and the wire itself going up from
 * its back into the flies. It flaps, after a fashion. About 0.7 tiles
 * across the wings; a flyer, so its origin is its middle.
 */

const RUBBER = coat({ over: '#2a2430', under: '#14101a', vary: 0.12, freq: 16 });
const WING = '#1a161e';

export default {
  name: 'bat',
  scale: 1.5,
  cell: 0.0055,
  cells: { kit: 0.004, fine: 0.0025 },
  budget: 12000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ['head', 'body', [0, 0.03, 0.05]],
    ['wingL', 'body', [0.04, 0.02, 0]],
    ['tipL', 'wingL', [0.15, 0.03, -0.01]],
    ['wingR', 'body', [-0.04, 0.02, 0]],
    ['tipR', 'wingR', [-0.15, 0.03, -0.01]],
  ],
  materials: {
    rubber: { roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4 },
    wing: { roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 },
    eye: { roughness: 0.1, clearcoat: 1, emissive: '#ff1a1a', emissiveIntensity: 1.2 },
    tooth: { roughness: 0.3, clearcoat: 0.6 },
    wire: { roughness: 0.25, metalness: 1 },
  },
  sculpt(s) {
    const R = { color: RUBBER, mat: 'rubber' };
    // The body, a little furry-lumpy, and the head with its snout.
    s.ellipsoid([0, 0, -0.01], [0.05, 0.055, 0.07], { ...R, bone: 'body', k: 0.02, bump: [0.003, 70] });
    s.sphere([0, 0.035, 0.055], 0.042, { ...R, bone: 'head', k: 0.025 });
    s.ellipsoid([0, 0.025, 0.09], [0.022, 0.018, 0.02], { ...R, bone: 'head', k: 0.015 });
    for (const m of [1, -1]) {
      // Big ears.
      s.flake([m * 0.022, 0.06, 0.05], [m * 0.04, 0.12, 0.04], [0, 0, 1], 0.02, 0.006, 0.3, { ...R, bone: 'head', k: 0.008 });
      // Little feet, tucked up.
      s.limb([m * 0.02, -0.04, -0.05], [m * 0.02, -0.06, -0.07], 0.007, 0.005, { ...R, bone: 'body', k: 0.006 });
    }
    s.part('kit', () => {
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        // The wing: wire fingers fanning out from the wrist, oilcloth stretched between, scalloped.
        const shoulder = [m * 0.04, 0.02, 0];
        const wrist = [m * 0.15, 0.03, -0.01];
        s.limb(shoulder, wrist, 0.008, 0.006, { color: WING, mat: 'wing', bone: `wing${S}`, k: 0.004 });
        const tips = [[m * 0.33, 0.06, 0.0], [m * 0.32, -0.02, -0.06], [m * 0.24, -0.06, -0.1], [m * 0.13, -0.05, -0.1]];
        for (const t of tips) s.limb(wrist, t, 0.005, 0.003, { color: WING, mat: 'wing', bone: `tip${S}`, k: 0.003 });
        s.panel(shoulder, wrist, [m * 0.06, -0.03, -0.07], 0.009, { color: WING, mat: 'wing', bone: `wing${S}`, k: 0.003 });
        for (let i = 0; i < tips.length - 1; i++) s.panel(wrist, tips[i], tips[i + 1], 0.009, { color: WING, mat: 'wing', bone: `tip${S}`, k: 0.003 });
        s.panel(wrist, tips[3], [m * 0.06, -0.03, -0.07], 0.009, { color: WING, mat: 'wing', bone: `tip${S}`, k: 0.003 });
      }
    });
    s.part('fine', () => {
      for (const m of [1, -1]) {
        s.sphere([m * 0.018, 0.045, 0.088], 0.008, { color: '#ff2a2a', mat: 'eye', bone: 'head', k: 0 });
        s.cone([m * 0.008, 0.0, 0.098], 0.004, 0.014, { color: '#f4f2ea', mat: 'tooth', bone: 'head', k: 0, rot: [Math.PI, 0, 0] });
      }
      // The wire, up into the flies.
      s.limb([0, 0.04, -0.01], [0, 0.6, -0.01], 0.0035, 0.0035, { color: '#c8ccd4', mat: 'wire', bone: 'body', k: 0 });
    });
  },
  animate(k, { clip, t = 0, time, seed = 0 }) {
    const T = time + seed;
    if (clip === 'ko') {
      // The wire snaps: wings folded, upside down.
      k.turn('body', 0, 0, Math.PI * Math.min(1, t / 0.4));
      for (const S of ['L', 'R']) k.turn(`wing${S}`, 0, 0, (S === 'L' ? -1 : 1) * 1.0);
      return;
    }
    const rate = clip === 'attack' ? 16 : clip === 'walk' ? 12 : 9;
    const f = Math.sin(T * rate);
    // Flap: the arm up and down, the fingers lagging behind.
    k.turn('wingL', 0, 0, f * 0.7);
    k.turn('wingR', 0, 0, -f * 0.7);
    k.turn('tipL', 0, 0, Math.sin(T * rate - 0.8) * 0.4);
    k.turn('tipR', 0, 0, -Math.sin(T * rate - 0.8) * 0.4);
    k.move('root', 0, -f * 0.012, 0);
    k.turn('body', clip === 'attack' ? 0.35 : 0.1, 0, Math.sin(T * 1.3) * 0.12);
    k.turn('head', Math.sin(T * 2) * 0.1, Math.sin(T * 0.9) * 0.3, 0);
  },
};
