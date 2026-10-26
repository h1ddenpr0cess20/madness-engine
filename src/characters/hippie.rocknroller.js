import { bands } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';
import { band } from './metalwear.js';

/**
 * The Drum Circle: a tie-dye shirt in every colour there is, a headband,
 * bare feet, long hair, and a pair of bongos he plays whether you want him
 * to or not. There is no leader. He is the leader. About 0.9 tiles tall.
 */

const dye = bands(1, 0.11, '#ff4a8a', '#3ad0ff', 0.5, 0.45);

export default person({
  name: 'hippie',
  scale: 1.42,
  b: 1.15,
  shape: { legs: 1.04, girth: 0.92, head: 1.02 },
  skin: '#d9a07a',
  look: { torso: dye, sleeve: dye, cuff: '#d9a07a', legs: cloth('#5a7a4a'), boot: '#d9a07a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'skin' },
  face: { eyeColor: '#4a7a3a', brow: '#6a4a22', mood: 0 },
  style: {
    attack: 'flail', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 11;
      // Hands flying over the drums at his hips.
      k.turn('armR', -0.6, 0, -0.1);
      k.turn('foreR', -1.1 + Math.sin(T) * 0.35, 0, 0);
      k.turn('armL', -0.6, 0, 0.1);
      k.turn('foreL', -1.1 + Math.sin(T + 1.6) * 0.35, 0, 0);
      k.turn('head', Math.sin(T * 0.25) * 0.2, 0, Math.sin(T * 0.12) * 0.1);
    },
  },
  extras(s) {
    s.part('hair', () => {
      const H = { color: cloth('#8a5a2a', '#4a2a10'), mat: 'hair', bone: 'head', k: 0.02 };
      s.ellipsoid([0, 0.7, -0.012], [0.114, 0.1, 0.114], H);
      s.flake([0.085, 0.68, -0.02], [0.11, 0.5, -0.07], [1, 0, 0], 0.04, 0.05, 0.3, H);
      s.flake([-0.085, 0.68, -0.02], [-0.11, 0.5, -0.07], [-1, 0, 0], 0.04, 0.05, 0.3, H);
      s.flake([0, 0.72, -0.1], [0, 0.5, -0.12], [0, 0, -1], 0.08, 0.08, 0.3, H);
    });
    s.part('kit', () => {
      band(s, 0.728, 0.1, 0.01, { color: '#ffd23a', mat: 'cloth', bone: 'head' });
      // Two bongos, joined, in front of the hips.
      for (const m of [1, -1]) {
        s.cylinder([m * 0.06, 0.3, 0.12], 0.05, 0.075, { color: '#b8682a', mat: 'leather', bone: 'hips', k: 0.004, round: 0.006 });
        s.cylinder([m * 0.06, 0.38, 0.12], 0.046, 0.004, { color: '#f0e8d0', mat: 'cloth', bone: 'hips', k: 0.002 });
        s.torus([m * 0.06, 0.38, 0.12], 0.05, 0.007, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0.002 });
      }
    });
  },
});
