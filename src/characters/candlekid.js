import { cloth, person, strap } from './person.js';
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
    after(k, { clip, time, seed, reach, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The candle held up in front in the right hand, upright; the left cupped round its flame; a slow sway, eyes closed in spirit.
      reach?.(k, 'R', 'chest', [-0.012, 0.455, 0.135]);
      aim?.(k, 'R', 'chest', [-0.01, 2.0, 0.16]);
      reach?.(k, 'L', 'chest', [0.03, 0.47, 0.14]);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.05);
      k.turn('head', 0.18, Math.sin(T * 0.5) * 0.1, Math.sin(T * 0.8) * 0.05);
    },
  },
  extras(s, J, { pose }) {
    headband(s, { color: '#e8a020' });
    // The peace sign on a leather thong round the neck.
    strap(s, [[0.032, 0.553, -0.03], [0.045, 0.53, 0.035], [0, 0.485, 0.08], [-0.045, 0.53, 0.035], [-0.032, 0.553, -0.03], [0, 0.556, -0.04]], { round: true, closed: true, thick: 0.003, color: '#6a4a2a', mat: 'leather', over: ['top', 'head'] });
    s.part('kit', () => {
      s.torus([0, 0.47, 0.088], 0.014, 0.0028, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.limb([0, 0.484, 0.088], [0, 0.456, 0.088], 0.0022, 0.0022, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
      for (const m of [1, -1]) s.limb([0, 0.468, 0.088], [m * 0.0095, 0.459, 0.088], 0.0022, 0.0022, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
    });
    // The candle, upright in the fist, and its flame.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.03), G.at(0.08), 0.0115, 0.0112, { color: '#f4ecd0', mat: 'cloth', k: 0.002 });
        s.limb(G.at(0.08), G.at(0.088), 0.0018, 0.0016, { color: '#1a1a1a', mat: 'cloth', k: 0.001 });
      });
      s.part('fine', () => s.limb(G.at(0.088), G.at(0.115), 0.0062, 0.0012, { color: '#ffb02a', mat: 'glow', k: 0.002 }));
    });
  },
});
