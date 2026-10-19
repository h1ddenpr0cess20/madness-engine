import { bands } from '../models/skins.js';
import { cloth, person } from './person.metroll.js';
import { moustache } from './wardrobe.js';

/**
 * The Regular: a football scarf, a shirt out over his belly, a cardigan
 * with a pint's worth of the night down it, a red nose and a pint, held
 * up to toast nobody. Will explain the riff to you. Wrongly. Sways. About
 * 0.9 tiles tall.
 */

const shirt = bands(0, 0.03, '#e8dcc8', '#7a8aa0', 0.3, 0.2);

export default person({
  name: 'drunk',
  scale: 1.42,
  b: 1.1,
  shape: { legs: 0.88, girth: 1.16, head: 1.04 },
  belly: 1.1,
  skin: '#e2a084',
  look: { torso: cloth('#6a5a48', '#3a3226'), sleeve: shirt, cuff: shirt, legs: cloth('#3a4050', '#242836'), boot: '#3a2414', belt: '#2a1a10', buckle: '#a89a6a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a3a', brow: '#5a3a1e', blush: 1.0, jaw: 1.08 },
  hair: { color: cloth('#6a4a2e', '#3a2810'), locks: [[[0.08, 0.7, -0.02], [0.11, 0.64, -0.06], 0.025], [[-0.08, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.025]] },
  style: {
    attack: 'smite', heavy: 0.2,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // A sway that doesn't quite go anywhere: the hips one way, the chest another, the head catching up.
      const sway = Math.sin(T * 1.6);
      k.turn('hips', 0, 0, sway * 0.07);
      k.turn('chest', 0.05, sway * -0.18, -sway * 0.12);
      k.turn('head', 0.1 + Math.sin(T * 0.9) * 0.1, Math.sin(T * 0.8) * 0.4, -sway * 0.12);
      // The pint held up, toasting nobody.
      if (clip !== 'attack') {
        k.turn('armR', -1.0 + Math.sin(T * 2.2) * 0.12, 0, -0.15);
        k.turn('foreR', -1.0, 0, 0);
      }
    },
  },
  extras(s, J) {
    moustache(s, { color: '#6a4a2e', wide: 1.1 });
    s.sphere([0, 0.648, 0.118], 0.014, { color: '#d8504a', mat: 'skin', bone: 'head', k: 0.01 });
    s.part('kit', () => {
      // The scarf, red and white, round the neck and down one side.
      s.torus([0, 0.53, 0.0], 0.062, 0.02, { color: '#d81c2a', mat: 'cloth', bone: 'neck', k: 0.008, rot: [0.1, 0, 0] });
      s.limb([0.03, 0.52, 0.06], [0.06, 0.38, 0.08], 0.02, 0.022, { color: '#d81c2a', mat: 'cloth', bone: 'chest', k: 0.008 });
      // White bands across it: only on the scarf, round the neck and down the front.
      const onScarf = (p) => {
        const ring = Math.hypot(Math.hypot(p[0], p[2]) - 0.062, p[1] - 0.53) - 0.026;
        const t = Math.max(0, Math.min(1, ((p[0] - 0.03) * 0.03 + (p[1] - 0.52) * -0.14 + (p[2] - 0.06) * 0.02) / (0.03 * 0.03 + 0.14 * 0.14 + 0.02 * 0.02)));
        const tail = Math.hypot(p[0] - 0.03 - 0.03 * t, p[1] - 0.52 + 0.14 * t, p[2] - 0.06 - 0.02 * t) - 0.028;
        return Math.min(ring, tail);
      };
      s.paint((p) => Math.max(Math.abs(Math.sin(p[1] * 90)) - 0.5, onScarf(p)), '#f4f0e8', 0.003);
      // The pint: a glass, the beer in it, the head on it.
      const h = J.handR;
      s.cylinder([h[0], h[1] + 0.045, h[2] + 0.012], 0.024, 0.05, { color: '#d89a28', mat: 'glass', bone: 'handR', k: 0.006, round: 0.006 });
      s.cylinder([h[0], h[1] + 0.098, h[2] + 0.012], 0.025, 0.012, { color: '#f4ecd8', mat: 'cloth', bone: 'handR', k: 0.004, round: 0.006 });
    });
  },
});
