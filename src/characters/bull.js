import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Bull: a fighting bull of the Pamplona run, black, all shoulder, a
 * great hump of muscle over the neck, a short neck that is mostly hump, the
 * horns out wide and forward with their pale points, a ring in the nose,
 * the breeder's ribbons on the shoulder, a tail with a tassel to it. Has
 * been running with the runners since seven this morning. It is now
 * running at a boulder. About 0.85 tiles tall to the hump.
 */

const BLACK = coat({ over: '#1e1a1a', under: '#100c0c', vary: 0.1, freq: 12, grain: 0.06 });
const HORN = (p) => {
  // Pale at the root, darker to the point.
  const t = Math.min(1, Math.abs(p[0]) / 0.14);
  return [0.8 - t * 0.7, 0.75 - t * 0.66, 0.62 - t * 0.55];
};

export default quadruped({
  name: 'bull',
  scale: 1.55,
  hip: 0.31,
  len: 0.18,
  girth: [0.11, 0.12],
  stance: 0.07,
  leg: [0.05, 0.034, 0.028],
  neck: { len: 0.055, rise: 0.15, r: 0.095 },
  head: { r: 0.068, snout: 0.05, sr: 0.046, drop: 0.75 },
  tail: { len: 0.22, rise: -1.3, r: 0.012, tip: 0.008 },
  ears: { kind: 'small', size: 0.9 },
  feet: 'hoof',
  paint: { body: BLACK, feet: '#1a1410', nose: '#2a2424', eye: '#2a0a08' },
  materials: { fur: { roughness: 0.55, sheen: 0.6, sheenColor: '#6a5040' } },
  style: { rate: 8, wag: 0.25, attack: 'charge', after(k, { clip }, T) {
    // Pawing the ground, the head low, swinging.
    if (clip === 'idle') {
      const paw = Math.max(0, Math.sin(T * 2.2));
      k.turn('thighFR', -0.5 * paw, 0, 0);
      k.turn('shinFR', 0.8 * paw, 0, 0);
      k.turn('neck', 0.25, Math.sin(T * 0.9) * 0.2, 0);
    }
  } },
  extras(s, P, { Hd }) {
    // The hump of muscle over the shoulders, and the dewlap under the neck.
    s.ellipsoid([0, 0.43, 0.13], [0.085, 0.07, 0.11], { color: BLACK, mat: 'fur', bone: 'front', k: 0.05 });
    s.ellipsoid([0, 0.22, 0.25], [0.05, 0.08, 0.05], { color: BLACK, mat: 'fur', bone: 'neck', k: 0.04 });
    // The tassel on the tail.
    s.ellipsoid(P.T2, [0.016, 0.03, 0.016], { color: '#0a0808', mat: 'fur', bone: 'tail2', k: 0.006, bump: [0.002, 120] });
    s.part('kit', () => {
      // The horns: out wide from the poll, then forward and up to the points.
      for (const m of [1, -1]) {
        const root = [m * Hd.r * 0.6, P.H[1] + Hd.r * 0.55, P.H[2]];
        const mid = [m * (Hd.r + 0.06), root[1] + 0.02, root[2] + 0.01];
        const tip = [m * (Hd.r + 0.08), root[1] + 0.07, root[2] + 0.06];
        s.limb(root, mid, 0.02, 0.014, { color: HORN, mat: 'horn', bone: 'head', k: 0.006 });
        s.limb(mid, tip, 0.014, 0.003, { color: HORN, mat: 'horn', bone: 'head', k: 0.004 });
      }
      // The ring through the nose.
      s.torus([0, P.S1[1] - Hd.sr * 0.25, P.S1[2] + Hd.sr * 0.55], 0.018, 0.004, { color: '#d8b040', mat: 'gold', bone: 'head', k: 0.001, rot: [0.4, 0, 0] });
      // The breeder's colours, pinned on the hump: green and white ribbons.
      for (const [c, dx] of [['#1a8a3a', -0.012], ['#f4f2ec', 0.012]]) s.flake([dx, 0.5, 0.12], [dx * 3, 0.44, 0.06], [0, 0.3, 1], 0.008, 0.01, 0.3, { color: c, mat: 'cloth', bone: 'front', k: 0.002 });
    });
  },
});
