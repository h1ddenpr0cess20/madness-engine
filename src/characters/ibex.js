import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Ibex: the wild goat of the Alps, at home on a cliff a chamois would
 * think twice about. Grey-brown, a pale belly, dark down the front of the
 * legs, a little beard, and the horns: great ridged scimitars sweeping up
 * and back, a ring for every year. It has seen rocks come down the
 * mountain before, and it has opinions. About 0.75 tiles tall to the horns.
 */

const HIDE = coat({ over: '#8a7258', under: '#e0d4c0', vary: 0.12, freq: 14, edge: [-0.3, 0.1] });
const DARK = coat({ over: '#4a3a2a', under: '#3a2a1e', vary: 0.1, freq: 18 });
const HORN = { color: coat({ over: '#5a4a3a', under: '#3a3026', vary: 0.15, freq: 30 }), mat: 'horn', bone: 'head' };

export default quadruped({
  name: 'ibex',
  scale: 1.5,
  hip: 0.29,
  len: 0.14,
  girth: [0.07, 0.08],
  stance: 0.044,
  leg: [0.032, 0.02, 0.016],
  neck: { len: 0.1, rise: 1.0, r: 0.042 },
  head: { r: 0.042, snout: 0.05, sr: 0.022, drop: 0.55 },
  tail: { len: 0.045, rise: 0.9, r: 0.013, tip: 0.008 },
  ears: { kind: 'small', size: 0.9 },
  feet: 'hoof',
  paint: { body: HIDE, head: HIDE, snout: HIDE, legs: DARK, feet: '#2a2018', tail: DARK, ears: HIDE, nose: '#2a2018' },
  style: { rate: 10, wag: 0.3, attack: 'butt', after(k, { clip }, T) {
    // Chewing, always.
    if (clip === 'idle' || clip === 'walk') k.turn('jaw', Math.max(0, Math.sin(T * 6)) * 0.12, 0, 0);
  } },
  extras(s, P, { Hd }) {
    // The beard, under the chin.
    s.cone([0, P.S1[1] - 0.085, P.S1[2] - 0.035], 0.012, 0.045, { color: DARK, mat: 'fur', bone: 'jaw', k: 0.008, rot: [Math.PI, 0, 0] });
    // A dark stripe down the spine.
    s.limb([0, 0.37, 0.12], [0, 0.37, -0.15], 0.012, 0.01, { color: DARK, mat: 'fur', bone: 'trunk', k: 0.03 });
    s.part('kit', () => {
      // The horns: up from the brow and round backward, thinning, with a ridge for every year.
      for (const m of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * 2.3;
          pts.push([m * (Hd.r * 0.35 + i * 0.004), P.H[1] + Hd.r * 0.5 + Math.sin(a) * 0.1, P.H[2] + Hd.r * 0.15 - (1 - Math.cos(a)) * 0.07]);
        }
        for (let i = 0; i < 8; i++) s.limb(pts[i], pts[i + 1], 0.017 - i * 0.0016, 0.017 - (i + 1) * 0.0016, { ...HORN, k: 0.004 });
        for (let i = 1; i < 8; i++) s.sphere(pts[i], 0.019 - i * 0.0018, { ...HORN, k: 0.003 });
      }
    });
  },
});
