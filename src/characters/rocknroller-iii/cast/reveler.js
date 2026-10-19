import { coat } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';
import { tricorn } from './wardrobe.js';

/**
 * The Carnival Mask: somebody at the Carnevale in the full bauta, the
 * white mask that covers the whole face and juts out at the chin so its
 * wearer can eat and drink and never be known, gold round the eyes; a
 * black tricorn trimmed in gold, a black lace hood under it, and the long
 * black tabarro cloak to the ground, lined in red. Bows, very low, with a
 * flourish. Nobody knows who is under there. Nobody has asked. About 1.0
 * tiles tall.
 */

const BLACK = cloth('#121216', '#08080a');
const MASK = coat({ over: '#f6f2e8', under: '#e0d8c8', vary: 0.04, freq: 20, grain: 0.02 });
const GOLD = { color: '#e0b44a', mat: 'metal', bone: 'head' };

export default person({
  name: 'reveler',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.04, girth: 0.94 },
  skin: '#e8c0a0',
  look: { torso: BLACK, sleeve: BLACK, cuff: BLACK, hand: '#f4f2ec', legs: BLACK, boot: '#0a0a0c', sole: '#060608' },
  mats: { hand: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a2a3a', brow: '#14141a', ears: false },
  style: {
    attack: 'slash', twist: -0.6,
    after(k, { clip, time, seed }) {
      if (clip !== 'idle') return;
      const T = time + seed, bow = Math.max(0, Math.sin(T * 0.8)) ** 2;
      // The bow: down from the waist, one arm sweeping out, the other across.
      k.turn('spine', 0.5 * bow, 0, 0);
      k.turn('chest', 0.3 * bow, 0, 0);
      hold(k, 'armR', -0.4 - bow * 0.6, 0, -0.5 - bow * 0.6);
      hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'armL', -0.3 * bow, 0, 0.1);
      hold(k, 'foreL', -1.6 * bow, 0.4, 0);
    },
  },
  extras(s) {
    tricorn(s, { color: '#121216', trim: '#e0b44a' });
    s.part('kit', () => {
      // The bauta: over the whole face, out at the chin, gold round the eyes and along the brow.
      s.ellipsoid([0, 0.665, 0.07], [0.09, 0.1, 0.05], { color: MASK, mat: 'plastic', bone: 'head', k: 0.02 });
      s.ellipsoid([0, 0.6, 0.1], [0.06, 0.04, 0.05], { color: MASK, mat: 'plastic', bone: 'head', k: 0.03 });
      s.limb([0, 0.64, 0.12], [0, 0.6, 0.15], 0.03, 0.02, { color: MASK, mat: 'plastic', bone: 'head', k: 0.02 });
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.035, 0.675, 0.112], [0.018, 0.01, 0.01], { op: 'sub', k: 0.004 });
        s.torus([m * 0.035, 0.675, 0.108], 0.02, 0.004, { ...GOLD, k: 0.002, rot: [Math.PI / 2 - 0.2, m * 0.3, 0] });
      }
      s.limb([-0.06, 0.71, 0.1], [0.06, 0.71, 0.1], 0.004, 0.004, { ...GOLD, k: 0.002 });
      // The lace hood under the hat, down over the shoulders.
      s.ellipsoid([0, 0.66, -0.02], [0.112, 0.12, 0.1], { color: BLACK, mat: 'cloth', bone: 'head', k: 0.02 });
      // The tabarro: a long cape from the shoulders to the ankles, a short cape over it, red inside.
      s.cone([0, 0.62, -0.01], 0.18, 0.58, { color: BLACK, mat: 'cloth', bone: 'chest', k: 0.02 });
      s.box([0, 0.3, 0.16], [0.07, 0.3, 0.08], 0.01, { op: 'sub', k: 0.02 });
      s.cone([0, 0.6, 0.0], 0.15, 0.17, { color: BLACK, mat: 'cloth', bone: 'chest', k: 0.01 });
      for (const m of [1, -1]) s.limb([m * 0.06, 0.52, 0.09], [m * 0.075, 0.08, 0.11], 0.006, 0.01, { color: '#a81a24', mat: 'cloth', bone: 'chest', k: 0.004 });
    });
  },
});
