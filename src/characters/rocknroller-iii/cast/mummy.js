import { bands, grime } from '../../../models/skins.js';
import { person } from './person.js';

/**
 * The Mummy: wrapped head to foot in linen gone the colour of tea, the
 * wraps going round and round, one end come loose and trailing; a dark gap
 * for the eyes with two in it, glowing a little. Arms out, stiff, slow.
 * Wrapped since Tuesday. Coming undone. About 0.95 tiles tall.
 */

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
    s.part('kit', () => {
      // Loose wraps: an end hanging off an arm, another trailing from the waist, a band slipped down a leg.
      const C = { color: '#d0c4a0', mat: 'cloth', k: 0.004 };
      s.flake([-0.13, 0.42, 0.0], [-0.15, 0.3, -0.04], [-1, 0, 0], 0.014, 0.01, 0.15, { ...C, bone: 'armR' });
      s.flake([0.06, 0.33, -0.06], [0.1, 0.12, -0.14], [0, 0, -1], 0.016, 0.012, 0.15, { ...C, bone: 'hips' });
      s.torus([J.kneeL[0], 0.12, 0.004], 0.04, 0.008, { ...C, bone: 'shinL', rot: [0.3, 0, 0.2] });
      s.torus([0, 0.64, 0.004], 0.1, 0.008, { ...C, bone: 'head', rot: [0.3, 0, -0.2] });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) s.sphere([m * 0.041, 0.668, 0.103], 0.008, { color: '#ffd84a', mat: 'glow', bone: 'head', k: 0.002 });
    });
  },
});
