import { cloth, hold, person } from './person.js';
import { headband, longHair } from './metalwear.js';

/**
 * The Candle Kid: a tie-dye T-shirt in a colour that does not exist, a
 * peace-sign necklace, a headband, hair to the shoulders, bare feet in the
 * dust, and a candle held up in both hands in the dark, tenderly, with
 * an expression of deep peace. It is a vigil. There are two hundred of
 * them. Within the hour it will be a bonfire. About 0.9 tiles tall, and
 * entirely sincere.
 */

const TIEDYE = (p) => {
  const a = Math.atan2(p[1] - 0.45, p[0]) * 3 + Math.hypot(p[0], p[1] - 0.45) * 60;
  const t = 0.5 + 0.5 * Math.sin(a);
  return [0.9 - t * 0.5, 0.25 + t * 0.4, 0.4 + t * 0.55];
};

export default person({
  name: 'candlekid',
  scale: 1.42,
  b: 0.98,
  shape: { legs: 1.0, girth: 0.92 },
  skin: '#e8c0a0',
  look: { torso: TIEDYE, sleeve: TIEDYE, cuff: '#e8c0a0', legs: cloth('#7a8aa8', '#4a5a78'), boot: '#e8c0a0', sole: '#8a6a4a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'skin' },
  face: { eyeColor: '#4a8a6a', brow: '#8a6a38', mood: 1, blush: 0.9 },
  hair: longHair(cloth('#a8884a', '#7a5e30'), { length: 0.9, fringe: true }),
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Both hands up in front holding the candle, the face tilted to it, a slow sway, eyes closed in spirit.
      hold(k, 'armR', -1.0, 0, -0.15); hold(k, 'foreR', -1.4, 0.9, 0);
      hold(k, 'armL', -1.0, 0, 0.15); hold(k, 'foreL', -1.4, -0.9, 0);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.05);
      k.turn('head', 0.18, Math.sin(T * 0.5) * 0.1, Math.sin(T * 0.8) * 0.05);
    },
  },
  extras(s) {
    headband(s, { color: '#e8a020' });
    s.part('kit', () => {
      // The peace sign on a thong, and the candle between the hands, and its flame.
      s.limb([0.0, 0.56, 0.06], [0, 0.46, 0.085], 0.003, 0.003, { color: '#6a4a2a', mat: 'leather', bone: 'chest', k: 0.001 });
      s.torus([0, 0.45, 0.09], 0.016, 0.003, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
      s.cylinder([0, 0.53, 0.168], 0.013, 0.05, { color: '#f4ecd0', mat: 'cloth', bone: 'chest', k: 0.003, round: 0.003 });
      s.limb([0, 0.585, 0.168], [0, 0.615, 0.168], 0.01, 0.002, { color: '#ffb02a', mat: 'glow', bone: 'chest', k: 0.002 });
    });
  },
});
