import { bands, coat } from '../../../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Camel: a dromedary that gives rides round the pyramids, tall and
 * knobbly-kneed, a hump with a striped blanket thrown over it, tassels
 * swinging, a long neck in a curve, heavy lids with long lashes, a split
 * lip, and an expression of total disdain. Spits at boulders. Has spat at
 * better. About 1.1 tiles tall to the hump.
 */

const HIDE = coat({ over: '#c8a070', under: '#e0c8a0', vary: 0.12, freq: 12 });
const BLANKET = bands(2, 0.03, '#c82a2a', '#f0c030', 0.45, 0.15);

export default quadruped({
  name: 'camel',
  scale: 1.55,
  hip: 0.44,
  len: 0.16,
  girth: [0.075, 0.085],
  stance: 0.05,
  leg: [0.034, 0.023, 0.02],
  neck: { len: 0.2, rise: 0.75, r: 0.044 },
  head: { r: 0.05, snout: 0.075, sr: 0.033, drop: 0.05 },
  tail: { len: 0.16, rise: -1.35, r: 0.01, tip: 0.008 },
  ears: { kind: 'small', size: 0.7 },
  paint: { body: HIDE, feet: '#b08a5a', nose: '#5a3a24' },
  style: { rate: 6, wag: 0.15, lift: 0.5, attack: 'spit', after(k, { clip }, T) {
    // Chewing sideways, the head high and turned away.
    if (clip === 'idle' || clip === 'walk') {
      k.turn('jaw', 0.06, Math.sin(T * 3) * 0.15, 0);
      if (clip === 'idle') k.turn('head', -0.15, Math.sin(T * 0.3) * 0.3, 0);
    }
  } },
  extras(s, P) {
    const H = { color: HIDE, mat: 'fur' };
    // The hump.
    s.ellipsoid([0, 0.55, -0.02], [0.065, 0.085, 0.1], { ...H, bone: 'trunk', k: 0.05 });
    // The knobbly knees and a pad on each foot.
    for (const n of ['FL', 'FR', 'BL', 'BR']) {
      const L = P.legs[n];
      s.sphere(L.knee, 0.026, { ...H, bone: `shin${n}`, k: 0.012 });
      s.cylinder([L.foot[0], 0.01, L.foot[2] + 0.012], 0.03, 0.01, { color: '#a07a4a', mat: 'hide', bone: `foot${n}`, k: 0.008, round: 0.008 });
    }
    // The split upper lip, hanging.
    for (const m of [1, -1]) s.ellipsoid([m * 0.012, P.S1[1] - 0.018, P.S1[2] - 0.005], [0.016, 0.018, 0.02], { ...H, bone: 'head', k: 0.008 });
    s.part('kit', () => {
      // The blanket over the hump, and the tassels round its hem.
      s.ellipsoid([0, 0.555, -0.02], [0.076, 0.09, 0.11], { color: BLANKET, mat: 'cloth', bone: 'trunk', k: 0.01 });
      s.box([0, 0.5, -0.02], [0.09, 0.06, 0.13], 0.02, { op: 'sub', k: 0.01 });
      for (let i = 0; i < 6; i++) {
        const z = -0.1 + i * 0.032;
        for (const m of [1, -1]) s.limb([m * 0.072, 0.565, z], [m * 0.08, 0.525, z], 0.006, 0.004, { color: i % 2 ? '#f0c030' : '#2a6ac8', mat: 'cloth', bone: 'trunk', k: 0.002 });
      }
      // A halter round the nose.
      s.torus([0, P.S1[1] + 0.004, P.S1[2] - 0.035], 0.034, 0.004, { color: '#c82a2a', mat: 'leather', bone: 'head', k: 0.002, rot: [Math.PI / 2 - 0.05, 0, 0] });
    });
    s.part('fine', () => {
      // Heavy lids and long lashes.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.024, P.H[1] + 0.014, P.H[2] + 0.026], [0.011, 0.005, 0.009], { ...H, bone: 'head', k: 0.002 });
        s.flake([m * 0.028, P.H[1] + 0.012, P.H[2] + 0.034], [m * 0.036, P.H[1] + 0.006, P.H[2] + 0.044], [0, 1, 0], 0.003, 0.001, 0.4, { color: '#2a1a10', mat: 'fur', bone: 'head', k: 0 });
      }
    });
  },
});
