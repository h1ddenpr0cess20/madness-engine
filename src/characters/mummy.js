import { bands, grime } from '../models/skins.js';
import { cuffBand, person, strap } from './person.js';

/**
 * The Mummy: wrapped head to foot in linen gone the colour of tea, the
 * wraps going round and round, one end come loose and trailing; a dark gap
 * for the eyes with two in it, glowing a little. Arms out, stiff, slow.
 * Wrapped since Tuesday. Coming undone. About 0.95 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const wraps = grime(bands(1, 0.024, '#d8ccaa', '#b0a07c', 0.55, 0.35), 0.0, 0.25, 0.65);

export default person({
  name: 'mummy',
  scale: 1.48,
  b: 1.02,
  shape: { legs: 1.02, girth: 0.92, head: 0.96 },
  skin: wraps,
  look: { torso: wraps, sleeve: wraps, cuff: wraps, legs: wraps, boot: wraps },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'cloth', legs: 'cloth', boot: 'cloth', skin: 'cloth' },
  face: { eyeColor: '#ffd84a', brow: '#b0a07c', ears: false, mood: 1, blush: 0 },
  style: {
    attack: 'smite', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Stiff: arms out in front, straight, and a slow sway from the hips.
      k.turn('armR', -1.5, 0, 0.05);
      k.turn('armL', -1.5, 0, -0.05);
      k.turn('foreR', 0, 0, 0); k.turn('foreL', 0, 0, 0);
      k.turn('hips', 0, Math.sin(T * 0.8) * 0.06, 0);
      k.turn('head', 0, Math.sin(T * 0.5) * 0.15, 0.08);
    },
  },
  extras(s, J) {
    // The gap in the wraps for the eyes: dark, the eyes glowing in it.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.668) - 0.022, Math.abs(p[0]) - 0.075, 0.06 - p[2]), '#1a140c', 0.006);
    // Loose wraps, come undone: a band round the head askew, one round the right forearm with its end hanging,
    // one across the hips trailing down the left leg.
    const C = { color: '#d0c4a0', mat: 'cloth' };
    strap(s, [[0.1, 0.72, 0.0], [0.06, 0.73, 0.08], [-0.02, 0.705, 0.1], [-0.08, 0.68, 0.06], [-0.1, 0.665, -0.02], [-0.04, 0.68, -0.1], [0.05, 0.7, -0.09], [0.1, 0.72, 0.0]], { ...C, width: 0.014, thick: 0.004, over: ['head'], bone: 'head', closed: true });
    strap(s, [[0.095, 0.37, 0.06], [0.0, 0.33, 0.095], [-0.095, 0.3, 0.05], [-0.09, 0.3, -0.04], [0.0, 0.33, -0.085], [0.095, 0.37, -0.03], [0.095, 0.37, 0.06]], { ...C, width: 0.016, thick: 0.004, over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    s.part('outer2', () => {
      s.flake([0.098, 0.36, 0.03], [0.11, 0.2, 0.0], [1, 0, 0.2], 0.014, 0.009, 0.25, { ...C, bone: 'thighL', k: 0.003 });
      const e = J.elbowR, w = J.wristR, mid = e.map((v, i) => v + (w[i] - v) * 0.45);
      s.flake([mid[0] - 0.03, mid[1], mid[2] - 0.01], [mid[0] - 0.04, mid[1] - 0.09, mid[2] - 0.02], [-1, 0, 0], 0.012, 0.008, 0.25, { ...C, bone: 'foreR', k: 0.003 });
    });
    cuffBand(s, J.elbowR, J.wristR, 0.45, { width: 0.02, thick: 0.004, color: '#d0c4a0', mat: 'cloth', bone: 'foreR' });
  },
});
