import { cloth, hold, person } from './person.js';
import { chestPrint, guitar, longHair } from './metalwear.js';

/**
 * The Poser: a pristine black tour T-shirt (the price tag still on the
 * sleeve), jeans without a mark on them, white high-tops and a guitar he
 * knows one riff on. Strikes a pose, then another. About 0.9 tiles tall.
 */

export default person({
  name: 'poser',
  scale: 1.46,
  b: 0.95,
  shape: { legs: 1.08, girth: 0.84, head: 1.02 },
  skin: '#e8bc9c',
  look: { torso: cloth('#16161a', '#0c0c10'), sleeve: cloth('#16161a'), cuff: '#e8bc9c', legs: cloth('#26304a', '#181e30'), boot: '#f4f2ee', sole: '#d8d4cc' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#3a2a1e', mood: 0, blush: 0.15 },
  hair: longHair(cloth('#3a2818', '#241810'), { length: 0.9, fringe: true }),
  style: {
    attack: 'chop',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The pose: a knee bent, the head back, the fretting hand up the neck, strumming at nothing at all.
      const strum = Math.sin(T * 13);
      hold(k, 'armL', -0.15, -0.2, -0.1); hold(k, 'foreL', -1.85, 0, 0);
      hold(k, 'armR', -0.3, 0.3, -0.1); hold(k, 'foreR', -1.2, 0, 0);
      reach?.(k, 'R', 'spine', [-0.035, 0.35 + strum * 0.012, 0.13]);
      k.turn('head', -0.2 + Math.sin(T * 0.8) * 0.06, 0.2, 0);
      k.turn('thighL', -0.2, 0, 0.1); k.turn('shinL', 0.35, 0, 0);
      k.move('hips', 0, Math.abs(strum) * 0.004, 0);
    },
  },
  extras(s, J, { pose }) {
    chestPrint(s, 'logo', '#d8d8d0', { y: 0.46, size: 0.045 });
    guitar(s, { body: '#d81c2a', style: 'strat', pose });
  },
});
