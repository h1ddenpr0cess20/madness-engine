import { cloth, hold, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Headbanger: a black T-shirt with something on it that you would not
 * show your mother, spattered red, black jeans, boots, and a head that goes
 * round in a full circle, the hair going with it, at a speed that violates
 * several laws. About 0.95 tiles tall.
 */

const GORE = (p, n) => {
  const base = cloth('#16161a', '#0a0a0c')(p, n);
  const splat = Math.sin(p[0] * 160) * Math.sin(p[1] * 140) * Math.sin(p[2] * 120 + 1);
  return p[2] > 0.05 && splat > 0.55 ? [0.45, 0.02, 0.03] : base;
};

export default person({
  name: 'headbanger',
  scale: 1.5,
  b: 1.04,
  shape: { legs: 1.04, girth: 0.96, head: 1.0 },
  skin: '#dca888',
  look: { torso: GORE, sleeve: '#dca888', cuff: '#dca888', legs: cloth('#16161a'), boot: '#16161a', sole: '#3a3a40', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 1, blush: 0.3 },
  hair: longHair(cloth('#1c1410', '#0e0a08'), { length: 1.5, thick: 1.3 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The helicopter: the head going round in a circle, the neck and the chest carrying it.
      const a = T * 8;
      k.turn('head', 0.45 + Math.sin(a) * 0.4, Math.cos(a) * 0.3, Math.cos(a) * 0.35);
      k.turn('chest', 0.15 + Math.sin(a) * 0.15, 0, Math.cos(a) * 0.1);
      hold(k, 'armR', -0.9, 0, -0.5); hold(k, 'foreR', -1.2, 0, 0);
      hold(k, 'armL', -0.9, 0, 0.5); hold(k, 'foreL', -1.2, 0, 0);
      k.turn('thighL', -0.15, 0, 0.1); k.turn('thighR', -0.15, 0, -0.1);
    },
  },
});
