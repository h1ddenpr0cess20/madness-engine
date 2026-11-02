import { cloth, hold, person, strap } from './person.js';
import { guitar, longHair } from './metalwear.js';
import { bandana } from './wardrobe.js';

/**
 * The Shredder: a bandana, a mane, a bare chest with one gold chain, tiger-
 * stripe spandex, high-tops, and a flying V in banana yellow. Plays a hundred
 * notes a second. Not one of them for you. About 0.95 tiles tall.
 */

const TIGER = (p) => (Math.sin(p[1] * 120 + Math.sin(p[0] * 70) * 1.5) > 0.35 ? [0.02, 0.02, 0.02] : [0.9, 0.2, 0.55]);

export default person({
  name: 'shredder',
  scale: 1.46,
  b: 0.96,
  shape: { legs: 1.12, girth: 0.86, head: 1.0 },
  skin: '#d8a07c',
  look: { torso: '#d8a07c', sleeve: '#d8a07c', cuff: '#d8a07c', legs: TIGER, boot: '#f4f2ee', sole: '#2a2a30' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 1, blush: 0.2 },
  hair: longHair(cloth('#1c1410', '#0e0a08'), { length: 1.1, thick: 1.15 }),
  style: {
    attack: 'chop',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Soloing: the left hand racing up the neck, the right a blur over the strings, the head thrown back.
      hold(k, 'armL', -0.15 + Math.sin(T * 3) * 0.06, -0.2, -0.1); hold(k, 'foreL', -1.85, 0, 0);
      hold(k, 'armR', -0.3, 0.3, -0.1); hold(k, 'foreR', -1.2, 0, 0);
      reach?.(k, 'R', 'spine', [-0.035 + Math.sin(T * 18) * 0.006, 0.345, 0.13]);
      k.turn('head', -0.35 + Math.sin(T * 1.7) * 0.1, 0.2, 0);
      k.turn('thighL', -0.4, 0, 0.12); k.turn('shinL', 0.5, 0, 0);
      k.turn('chest', -0.12, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    bandana(s, { color: '#ffd23a' });
    guitar(s, { body: '#f0d020', style: 'v', neck: '#2a1c12', pose });
    // One gold chain, lying round the neck and down on the chest.
    strap(s, [[0, 0.556, -0.032], [0.034, 0.552, -0.012], [0.05, 0.53, 0.035], [0.03, 0.49, 0.072], [0, 0.478, 0.08], [-0.03, 0.49, 0.072], [-0.05, 0.53, 0.035], [-0.034, 0.552, -0.012]],
      { round: true, closed: true, thick: 0.0045, lift: 0.0006, color: '#e8c040', mat: 'metal', over: ['body', 'head'] });
  },
});
