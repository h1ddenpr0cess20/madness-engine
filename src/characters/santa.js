import { cloth, hold, person, shell, skirt, trunk } from './person.js';
import { longHair } from './metalwear.js';
import { beard, moustache } from './wardrobe.js';

/**
 * Father Christmas, cut from the Flatfoot's cloth: the same broad build and the
 * same long coat over a belt and boots, but red, with a belly to match, white
 * fur at the cuffs, the collar, down the front and round the hem, black gloves,
 * a beard to the belt over rosy cheeks, a stocking cap with a bobble, and a sack
 * of presents on a cord in his left hand. Waves with the right. About 0.95
 * tiles tall and a good deal stouter.
 */

const RED = cloth('#b4121c', '#760a12');
const FUR = cloth('#f6f4f0', '#d6d4ce');

export default person({
  name: 'santa',
  scale: 1.48,
  b: 1.28,
  shape: { legs: 0.95, girth: 1.18 },
  belly: 1.7,
  skin: '#eab69a',
  look: { torso: RED, sleeve: RED, cuff: FUR, hand: '#141418', legs: RED, boot: '#0c0c0e', belt: '#0e0e12', buckle: '#e0be50', boots: 0.17 },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a6aa8', brow: '#e8e8ee', blush: 0.9, jaw: 1.1 },
  hair: longHair(cloth('#f2f2f4', '#c4c4cc'), { length: 0.45 }),
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Ho, ho, ho: the right hand up in a wave, a shake of the head, the sack hanging from the left.
      if (clip === 'idle') {
        hold(k, 'armR', -1.25, 0, -0.55); hold(k, 'foreR', -0.75, 0, 0);
        k.turn('handR', 0, 0, Math.sin(T * 5) * 0.35);
        k.move('hips', 0, Math.abs(Math.sin(T * 2.4)) * 0.006, 0);
      }
      k.turn('head', 0.04, Math.sin(T * 0.7) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    // The coat's skirts, from the belt to the thigh, as the Flatfoot's.
    skirt(s, trunk(1.28, 1.7), { top: 0.33, hem: 0.235, flare: 1.04, color: RED, part: 'outer', b: 1.28 });
    // White fur: down the front of the coat, round its hem, and at the collar.
    const fur = { color: FUR, mat: 'cloth', part: 'outer2', thick: 0.008, lift: 0.0015, k: 0.004 };
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.02, 0.236 - p[1], p[1] - 0.545, 0.02 - p[2]), { ...fur, over: ['top', 'outer'], bone: 'chest' });
    shell(s, (p) => Math.max(0.236 - p[1], p[1] - 0.27), { ...fur, over: ['outer'], bone: 'hips' });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.536) - 0.014, -p[2] - 0.045), { ...fur, over: ['top', 'head'], bone: 'neck' });
    // The beard to the belt, and a bushy moustache over the mouth.
    beard(s, { color: '#f6f6f8', long: 1.7, thick: 0.01 });
    moustache(s, { color: '#f6f6f8', wide: 1.2, droop: 0.5 });
    // The cap: red, fitted over the head and the hair, its fur band at the brows, the point falling back over his
    // shoulder with a bobble on the end.
    shell(s, (p) => 0.73 - p[1], { color: RED, mat: 'cloth', part: 'outer', thick: 0.012, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    s.part('outer2', () => {
      const C = { color: RED, mat: 'cloth', bone: 'head', k: 0.008 };
      const pts = [[0, 0.74, -0.006], [0, 0.805, -0.024], [0, 0.86, -0.056], [0, 0.882, -0.1], [0, 0.868, -0.146]];
      const rad = [0.095, 0.08, 0.058, 0.04, 0.028];
      for (let i = 0; i < pts.length - 1; i++) s.limb(pts[i], pts[i + 1], rad[i], rad[i + 1], C);
      s.torus([0, 0.735, -0.006], 0.102, 0.0155, { color: FUR, mat: 'cloth', bone: 'head', k: 0.004 });
      s.sphere([0, 0.852, -0.172], 0.027, { color: FUR, mat: 'cloth', bone: 'head', k: 0.006 });
    });
    // The sack of presents, its neck through the left fist and the cord tied round it.
    const G = pose.grip('L'), c = G.c;
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const SACK = { color: cloth('#8a6a3c', '#5e4624'), mat: 'cloth', bone: 'handL' };
      s.limb([c[0], c[1] + 0.022, c[2]], [c[0], c[1] - 0.04, c[2]], 0.013, 0.02, { ...SACK, k: 0.008 });
      s.ellipsoid([c[0], c[1] - 0.115, c[2] - 0.004], [0.075, 0.085, 0.065], { ...SACK, k: 0.03, bump: [0.004, 30] });
      s.torus([c[0], c[1] - 0.034, c[2]], 0.017, 0.0034, { color: '#c4a030', mat: 'cloth', bone: 'handL', k: 0.002 });
    }));
  },
});
