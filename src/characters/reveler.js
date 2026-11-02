import { coat } from '../models/skins.js';
import { cloth, hold, person, shell } from './person.js';
import { cape, hood, robe } from './metalwear.js';
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
  cells: { outer: 0.0058 },
  budget: 100000,
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
    // The long black coat to the ground, the lace hood, the tabarro over the shoulders lined in red, the tricorn.
    robe(s, { color: BLACK, flare: 0.6 });
    hood(s, { color: BLACK, lining: '#050506' });
    cape(s, { color: BLACK, lining: '#a81a24', collar: false, hem: 0.06 });
    tricorn(s, { color: '#121216', trim: '#e0b44a' });
    // The bauta: a white mask over the whole face, fitted to it, square at the brow, the nose a ridge, and the chin
    // jutting out and down so the wearer can eat under it.
    const face = (p) => Math.max(0.03 - p[2], Math.hypot(p[0] / 0.07, (p[1] - 0.652) / 0.085) - 1);
    shell(s, face, { color: MASK, mat: 'plastic', part: 'fine', thick: 0.007, lift: 0.004, over: ['head'], bone: 'head', k: 0.003 });
    s.part('fine', () => {
      const M = { color: MASK, mat: 'plastic', bone: 'head' };
      s.limb([0, 0.676, 0.098], [0, 0.636, 0.118], 0.009, 0.013, { ...M, k: 0.008 });
      s.flake([0, 0.625, 0.098], [0, 0.578, 0.128], [0, 1, 0.4], 0.034, 0.014, 0.45, { ...M, k: 0.012 });
      // The eye holes, dark, ringed in gold, and a gold line along the brow.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.031, 0.668, 0.1], [0.014, 0.0075, 0.02], { op: 'sub', k: 0.003, rot: [0, 0, m * -0.15] });
        s.torus([m * 0.031, 0.668, 0.101], 0.0165, 0.0026, { ...GOLD, k: 0.001, rot: [Math.PI / 2 + 0.25, m * 0.25, m * -0.15] });
      }
    });
    // White all over the mask: none of the face's colour under it shows through.
    s.paint((p) => Math.max(0.072 - p[2], Math.hypot(p[0] / 0.075, (p[1] - 0.645) / 0.1) - 1), MASK, 0.002);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.688 + Math.abs(p[0]) * 0.15) - 0.0025, 0.08 - p[2], Math.abs(p[0]) - 0.06), '#e0b44a', 0.0015);
  },
});
