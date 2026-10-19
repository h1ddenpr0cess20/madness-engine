import { bands } from '../models/skins.js';
import { cloth, hold, person } from './person.js';

/**
 * The Matador: in the traje de luces, the suit of lights, a short jacket
 * of royal blue so heavy with gold it stands up on its own, the gold down
 * the sides of the breeches to the knee, pink stockings, black slippers,
 * the black montera on his head, a pigtail, and the red muleta held out on
 * its stick, swept slowly round. Thinks you are a bull. You are not a
 * bull. About 0.95 tiles tall.
 */

const BLUE = cloth('#1a3aa8', '#0e2470');
const GOLDEN = { color: '#e8c050', mat: 'metal' };
/** The jacket: blue, embroidered gold in bands that follow it round. */
const JACKET = (p, n) => {
  const b = bands(1, 0.03, '#1a3aa8', '#e8c050', 0.3, 0.2)(p, n);
  return Math.abs(p[0]) > 0.07 || p[1] < 0.42 ? b : BLUE(p, n);
};
const BREECHES = (p, n) => (Math.abs(Math.abs(p[0]) - 0.1) < 0.014 ? [0.85, 0.65, 0.2] : BLUE(p, n));

export default person({
  name: 'matador',
  scale: 1.45,
  b: 0.98,
  shape: { legs: 1.08, girth: 0.88, hips: 0.88 },
  skin: '#e0a880',
  look: { torso: JACKET, sleeve: JACKET, cuff: JACKET, legs: BREECHES, boot: '#0a0a0c', sole: '#060608' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', mood: 1, jaw: 0.98 },
  hair: { color: cloth('#14100a', '#0a0806'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'slash', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, pass = Math.sin(T * 0.8);
      // The muleta held out low to the right and swept round; the chest out, the chin up, the left hand at the hip.
      hold(k, 'armR', -0.5, pass * 0.4, -0.35);
      hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.5);
      hold(k, 'foreL', -1.3, 0.9, 0);
      k.turn('chest', -0.12, pass * 0.15, 0);
      k.turn('head', -0.15, pass * 0.2, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The montera: black, two lobes over the ears, the bobbles.
      for (const m of [1, -1]) s.ellipsoid([m * 0.05, 0.765, -0.01], [0.07, 0.05, 0.085], { color: '#121214', mat: 'cloth', bone: 'head', k: 0.02, bump: [0.002, 120] });
      s.ellipsoid([0, 0.79, -0.01], [0.06, 0.035, 0.08], { color: '#121214', mat: 'cloth', bone: 'head', k: 0.02 });
      // The pigtail, pinned on behind.
      s.sphere([0, 0.66, -0.105], 0.022, { color: '#14100a', mat: 'hair', bone: 'head', k: 0.006 });
      // The epaulettes, gold, and the tassels down off them.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.1, 0.515, 0.0], [0.045, 0.018, 0.04], { ...GOLDEN, bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0.006 });
        for (let i = 0; i < 4; i++) s.limb([m * 0.12, 0.505, -0.02 + i * 0.013], [m * 0.13, 0.475, -0.02 + i * 0.013], 0.004, 0.003, { ...GOLDEN, bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0 });
      }
      // A thin black tie, the white shirt under the jacket.
      s.box([0, 0.47, 0.068], [0.026, 0.06, 0.012], 0.006, { color: '#f6f4f0', mat: 'cloth', bone: 'chest', k: 0.004 });
      s.limb([0, 0.52, 0.078], [0, 0.42, 0.084], 0.006, 0.006, { color: '#0a0a0c', mat: 'cloth', bone: 'chest', k: 0.002 });
      // Pink stockings below the knee.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.limb([J[`knee${S}`][0], 0.16, 0.006], [J[`ankle${S}`][0], 0.06, 0], 0.035, 0.03, { color: '#f0a8b8', mat: 'cloth', bone: `shin${S}`, k: 0.008 });
      }
      // The muleta: the stick out from the hand, the red cloth hanging from it.
      const h = J.handR;
      s.limb([h[0], h[1], h[2] - 0.02], [h[0], h[1], h[2] + 0.3], 0.005, 0.005, { color: '#8a5a2a', mat: 'leather', bone: 'handR', k: 0.001 });
      s.panel([h[0], h[1] - 0.005, h[2] + 0.0], [h[0], h[1] - 0.005, h[2] + 0.3], [h[0] - 0.01, h[1] - 0.24, h[2] + 0.2], 0.008, { color: '#c8141e', mat: 'cloth', bone: 'handR', k: 0.006 });
      s.panel([h[0], h[1] - 0.005, h[2] + 0.0], [h[0] - 0.01, h[1] - 0.24, h[2] + 0.2], [h[0] - 0.005, h[1] - 0.2, h[2] - 0.02], 0.008, { color: '#c8141e', mat: 'cloth', bone: 'handR', k: 0.006 });
    });
  },
});
