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
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The pose: a knee bent, the head back, strumming at nothing at all.
      const strum = Math.sin(T * 13);
      hold(k, 'armR', -0.4, 0.8, 0.1); hold(k, 'foreR', -0.35 + strum * 0.12, 0, 0);
      hold(k, 'armL', -0.15, -0.2, -0.1); hold(k, 'foreL', -1.85, 0, 0);
      k.turn('head', -0.2 + Math.sin(T * 0.8) * 0.06, 0.2, 0);
      k.turn('thighL', -0.2, 0, 0.1); k.turn('shinL', 0.35, 0, 0);
      k.move('hips', 0, Math.abs(strum) * 0.004, 0);
    },
  },
  extras(s) {
    guitar(s, { body: '#d81c2a', style: 'strat' });
    s.part('kit', () => { chestPrint(s, 'logo', '#d8d8d0', { y: 0.46, size: 0.045 }); });
    s.part('kit', () => {
      // The price tag, hung off the sleeve by its string: white card, a red sticker.
      s.limb([0.1, 0.46, 0.0], [0.115, 0.4, 0.02], 0.002, 0.002, { color: '#d8d8d0', mat: 'cloth', bone: 'armL', k: 0.001 });
      s.box([0.118, 0.385, 0.02], [0.016, 0.022, 0.003], 0.002, { color: '#f4f2ee', mat: 'paper', bone: 'armL', k: 0.001, rot: [0, 0.3, 0.1] });
      s.paint((p) => Math.max(Math.hypot(p[0] - 0.118, p[1] - 0.388) - 0.008, Math.abs(p[2] - 0.02) - 0.006), '#e8202a', 0.002);
    });
  },
});
