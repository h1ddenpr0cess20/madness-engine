import { bands } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';
import { beret } from './wardrobe.js';

/**
 * The Mime: on the steps of the Sacré-Cœur, the face painted white, the
 * lips red, a black tear under one eye, a black-and-white striped top, red
 * braces, black trousers, white gloves and a beret. Trapped in an
 * invisible box, the palms flat on its walls, feeling for the way out.
 * Wants you in it too. Says nothing about it. About 0.9 tiles tall.
 */

const STRIPES = bands(1, 0.03, '#f4f2ec', '#14141a', 0.45, 0.1);
const BLACK = cloth('#16161c', '#0a0a0e');

export default person({
  name: 'mime',
  scale: 1.42,
  b: 0.94,
  shape: { legs: 1.04, girth: 0.86, head: 1.02 },
  skin: '#f4f0ea',
  look: { torso: STRIPES, sleeve: STRIPES, cuff: STRIPES, hand: '#fbfbf8', legs: BLACK, boot: '#0a0a0c', sole: '#060608' },
  mats: { hand: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a3a4a', brow: '#14141a', blush: 0, jaw: 0.94 },
  hair: { color: cloth('#1a1a1a', '#0a0a0a'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The box: both palms out flat on its wall, one sliding along, then the other, the head tilted.
      const slide = Math.sin(T * 1.4);
      hold(k, 'armL', -1.3 + slide * 0.15, 0, 0.25 + slide * 0.1);
      hold(k, 'foreL', -0.3, 0, 0);
      hold(k, 'handL', 0.9, 0, 0);
      hold(k, 'armR', -1.3 - slide * 0.15, 0, -0.25 + slide * 0.1);
      hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'handR', 0.9, 0, 0);
      k.turn('head', 0.05, 0, Math.sin(T * 0.7) * 0.15);
    },
  },
  extras(s) {
    beret(s, { color: '#14141a' });
    s.part('kit', () => {
      // Red braces over the stripes.
      for (const m of [1, -1]) {
        s.limb([m * 0.045, 0.52, 0.04], [m * 0.04, 0.35, 0.075], 0.008, 0.008, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.003 });
        s.limb([m * 0.045, 0.52, -0.04], [m * 0.04, 0.35, -0.07], 0.008, 0.008, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.003 });
      }
    });
    s.part('fine', () => {
      // The red lips and the black tear.
      s.ellipsoid([0, 0.612, 0.1], [0.018, 0.006, 0.006], { color: '#c81c24', mat: 'skin', bone: 'head', k: 0.002 });
      s.limb([0.042, 0.645, 0.098], [0.044, 0.625, 0.096], 0.004, 0.002, { color: '#0a0a0c', mat: 'skin', bone: 'head', k: 0.001 });
    });
  },
});
