import { cloth, hold, person, shell, skirt, trunk } from './person.js';
import { beard, moustache } from './wardrobe.js';

/**
 * Father Christmas, cut from the Flatfoot's cloth: the same broad build and the
 * same long coat over a belt and boots, but red, with a belly to match, white
 * fur at the cuffs, the collar, down the front and round the hem, black gloves,
 * a beard to the belt over rosy cheeks, a stocking cap with a bobble, and a sack
 * of presents on a cord in his left hand. About 0.95 tiles tall and a good
 * deal stouter.
 *
 * He moves like a big, happy man: a slow rolling walk with the sack swinging
 * easy at his side and the other arm swinging free; at rest a wave with the
 * right hand and, every few seconds, a belly laugh (ho, ho, ho) that bounces
 * the whole of him; arms up and laughing when he wins; a bear hug for an
 * attack. The sack stays down at his side whatever else he does.
 */

const RED = cloth('#b4121c', '#760a12');
const FUR = cloth('#f6f4f0', '#d6d4ce');
const WHITE = cloth('#f2f2f4', '#c4c4cc');

/** A laugh's weight at time `T`: a burst of three or four quick bounces every few seconds, 0 between. */
const laugh = (T) => {
  const burst = Math.max(0, Math.sin(T * 1.3 - 0.6) - 0.35) / 0.65;
  return burst * Math.abs(Math.sin(T * 12));
};

export default person({
  name: 'santa',
  scale: 1.48,
  b: 1.28,
  shape: { legs: 0.98, girth: 1.18 },
  belly: 1.7,
  skin: '#eab69a',
  look: {
    torso: RED, sleeve: RED, cuff: FUR, hand: '#141418', legs: RED, boot: '#0c0c0e', boots: 0.17,
    belt: '#0e0e12', buckle: '#e0be50', beltWide: 2.5, tuck: true,
  },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a6aa8', brow: '#e8e8ee', blush: 0.9, jaw: 1.1 },
  // Thick white hair at the sides and nape, down under the cap to the collar.
  hair: {
    color: WHITE,
    locks: [
      [[0.09, 0.72, -0.01], [0.108, 0.62, -0.05], 0.034, 0.5],
      [[-0.09, 0.72, -0.01], [-0.108, 0.62, -0.05], 0.034, 0.5],
      [[0, 0.74, -0.07], [0, 0.61, -0.12], 0.07, 0.45],
    ],
  },
  style: {
    attack: 'hug', heavy: 0.35,
    after(k, { clip, time, seed, speed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sack hangs from the left fist, the arm easy: it swings a little in a walk and is never flung up.
      const ph = T * (9 - 0.35 * 2) * Math.max(0.5, speed);
      if (clip === 'walk') {
        hold(k, 'armL', Math.sin(ph) * 0.14, 0, 0.1);
        hold(k, 'foreL', -0.2, 0, 0);
        // A big man's roll: the shoulders and hips turning against each other, a little weight onto each foot.
        k.turn('hips', 0, 0, Math.sin(ph) * 0.05);
        k.turn('chest', 0, 0, -Math.sin(ph) * 0.04);
      } else {
        hold(k, 'armL', 0.04, 0, 0.1);
        hold(k, 'foreL', -0.22, 0, 0);
      }
      if (clip === 'idle') {
        // The right arm out at the shoulder, the elbow bent and the forearm straight up, the hand waving beside his head.
        const wave = Math.sin(T * 5);
        hold(k, 'armR', -0.3, 0, -1.6 + wave * 0.1);
        hold(k, 'foreR', -1.2, -1.5, 0);
        hold(k, 'handR', 0, 0, wave * 0.3);
      }
      // Ho, ho, ho: his head back and the whole of him bouncing, in a burst every few seconds, at rest and winning.
      if (clip === 'idle' || clip === 'win') {
        const ho = laugh(T);
        k.move('hips', 0, ho * 0.007, 0);
        k.scale('chest', 1 + ho * 0.02, 1 + ho * 0.03, 1 + ho * 0.02);
        k.turn('head', -ho * 0.14, 0, 0);
      }
      k.turn('head', 0.04, Math.sin(T * 0.7) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    // The coat's skirts, from the belt to above the knee: fuller than the Flatfoot's and taking nearly all of each leg's
    // swing, so the trousers stay inside them in a stride. Their top goes up under the belt.
    skirt(s, trunk(1.28, 1.7), { top: 0.345, hem: 0.2, flare: 1.14, color: RED, part: 'outer', b: 1.28, follow: 0.95 });
    // White fur: down the front of the coat above the belt, down the skirts below it, round the hem and at the collar.
    // The skirts' fur is in two halves, one for each leg, that move as the skirt halves do (not rigid on the hips, which
    // would leave it behind when he steps).
    const fur = { color: FUR, mat: 'cloth', part: 'outer2', thick: 0.008, lift: 0.0015, k: 0.004 };
    const legs = { thighL: (p) => -p[0], thighR: (p) => p[0] };
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.02, 0.376 - p[1], p[1] - 0.545, 0.02 - p[2]), { ...fur, over: ['top', 'outer'], bone: 'chest' });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.02, 0.2 - p[1], p[1] - 0.332, 0.02 - p[2]), { ...fur, over: ['top', 'outer'], bones: legs });
    shell(s, (p) => Math.max(0.2 - p[1], p[1] - 0.236), { ...fur, over: ['outer'], bones: legs });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.536) - 0.014, -p[2] - 0.045), { ...fur, over: ['top', 'head'], bone: 'neck' });
    // The beard to the belt, its edge low on the cheeks so they show rosy, and a bushy moustache over the mouth.
    beard(s, { color: '#f6f6f8', long: 1.7, thick: 0.01, high: 0.64 });
    moustache(s, { color: '#f6f6f8', wide: 1.2, droop: 0.5 });
    // The cap: red, fitted over the head and the hair down to under its band, the point falling back over his
    // shoulder with a bobble on the end. The fur band is laid over the foot of the cap, higher at the brows than at
    // the nape, as a cap sits.
    const foot = (p) => 0.715 - 0.12 * Math.max(0, 0.05 - p[2]);
    shell(s, (p) => foot(p) + 0.012 - p[1], { color: RED, mat: 'cloth', part: 'outer', thick: 0.01, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    shell(s, (p) => Math.max(foot(p) - p[1], p[1] - foot(p) - 0.034), { color: FUR, mat: 'cloth', part: 'outer2', thick: 0.011, lift: 0.001, over: ['head', 'hair', 'outer'], bone: 'head', k: 0.005 });
    s.part('outer2', () => {
      const C = { color: RED, mat: 'cloth', bone: 'head', k: 0.008 };
      const pts = [[0, 0.74, -0.006], [0, 0.805, -0.024], [0, 0.86, -0.056], [0, 0.882, -0.1], [0, 0.868, -0.146]];
      const rad = [0.095, 0.08, 0.058, 0.04, 0.028];
      for (let i = 0; i < pts.length - 1; i++) s.limb(pts[i], pts[i + 1], rad[i], rad[i + 1], C);
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
