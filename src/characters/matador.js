import { bands } from '../models/skins.js';
import { cloth, hold, person, shell } from './person.js';
import { suitFront } from './wardrobe.js';

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
  look: { torso: JACKET, sleeve: JACKET, cuff: JACKET, legs: BREECHES, shin: cloth('#f2a8bc', '#d88aa0'), shorts: 0.82, boot: '#0a0a0c', sole: '#060608' },
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
  extras(s, J, { pose }) {
    // The white shirt and the thin black tie in the V of the jacket.
    suitFront(s, { shirt: '#f6f4f0', tie: '#0a0a0c', low: 0.42 });
    s.part('kit', () => {
      // The montera: black, two lobes over the ears, the bobbles.
      for (const m of [1, -1]) s.ellipsoid([m * 0.05, 0.765, -0.01], [0.07, 0.05, 0.085], { color: '#121214', mat: 'cloth', bone: 'head', k: 0.02, bump: [0.002, 120] });
      s.ellipsoid([0, 0.79, -0.01], [0.06, 0.035, 0.08], { color: '#121214', mat: 'cloth', bone: 'head', k: 0.02 });
      // The pigtail, pinned on behind.
      s.sphere([0, 0.66, -0.105], 0.022, { color: '#14100a', mat: 'hair', bone: 'head', k: 0.006 });
    });
    // The epaulettes: gold, stiff over the points of the shoulders, their fringe hanging off the outer edge.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', sh = J[`shoulder${S}`];
      shell(s, (p) => Math.max(Math.hypot((p[0] - sh[0]) * 0.9, p[2] * 0.8) - 0.042, sh[1] - 0.005 - p[1]), { ...GOLDEN, part: 'outer', thick: 0.008, lift: 0.002, over: ['top', 'sleeves'], bone: `arm${S}`, k: 0.003 });
      s.part('kit', () => {
        for (let i = 0; i < 6; i++) {
          const z = -0.03 + i * 0.012;
          s.limb([sh[0] + m * 0.035, sh[1] + 0.012, z], [sh[0] + m * 0.042, sh[1] - 0.03, z], 0.0032, 0.0028, { ...GOLDEN, bone: `arm${S}`, k: 0.0008 });
        }
      });
    }
    // The muleta: the stick out from the fist, the red cloth hanging from it.
    const G = pose.grip('R'), down = [0, -1, 0];
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const a = G.at(0.02), b = G.at(0.32);
      s.part('fine', () => s.limb(G.at(-0.03), b, 0.005, 0.005, { color: '#8a5a2a', mat: 'leather', k: 0.001 }));
      const a2 = a.map((v, i) => v + down[i] * 0.24), b2 = b.map((v, i) => v + down[i] * 0.3);
      s.panel(a, b, b2, 0.007, { color: '#c8141e', mat: 'cloth', k: 0.004 });
      s.panel(a, b2, a2, 0.007, { color: '#c8141e', mat: 'cloth', k: 0.004 });
    }));
  },
});
