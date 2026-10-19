import { cloth, hold, person } from './person.js';
import { shades } from './metalwear.js';

/**
 * The A&R Man: slicked hair, shades indoors, a pastel suit with the sleeves
 * pushed up, a shirt open to the gold chain, white loafers and no socks, and
 * a car phone the size of a brick held to his ear. Will sign you. Will not pay
 * you. Lunch. About 0.95 tiles tall.
 */

const suit = cloth('#7ad8c8', '#4a9a8c');

export default person({
  name: 'promoter',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.1, girth: 0.92, head: 1.0 },
  skin: '#d6a07c',
  look: { torso: suit, sleeve: suit, cuff: '#d6a07c', legs: suit, boot: '#f4f2ee', sole: '#d8d4cc' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#101014', mood: 0, blush: 0.2 },
  hair: { color: cloth('#101014', '#08080a'), locks: [[[0, 0.78, -0.04], [0, 0.7, -0.12], 0.05, 0.5], [[0.07, 0.76, 0.0], [0.1, 0.68, -0.06], 0.035, 0.5], [[-0.07, 0.76, 0.0], [-0.1, 0.68, -0.06], 0.035, 0.5]], cap: [0.108, 0.102, 0.108] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone to his ear, the other hand making a point, the head going side to side: yes. Yes. Lunch.
      hold(k, 'armR', -2.3, 0, -0.3); hold(k, 'foreR', -1.9, 0, 0);
      hold(k, 'armL', -0.8 + Math.sin(T * 2.2) * 0.15, 0, 0.5); hold(k, 'foreL', -1.0, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.9) * 0.3, -0.15);
    },
  },
  extras(s, J) {
    shades(s);
    s.part('kit', () => {
      // The shirt open at the neck: a V of skin and a gold chain, the collar up.
      s.torus([0, 0.51, 0.045], 0.05, 0.006, { color: '#e8c040', mat: 'metal', bone: 'neck', k: 0.002, rot: [0.4, 0, 0] });
      for (const m of [1, -1]) s.flake([m * 0.03, 0.54, 0.05], [m * 0.07, 0.5, 0.075], [0, 0, 1], 0.02, 0.014, 0.25, { color: '#f4f0e8', mat: 'cloth', bone: 'chest', k: 0.004 });
      // The phone: a brick with an aerial, up at the ear.
      const h = J.handR;
      s.box([h[0] + 0.01, h[1] + 0.05, h[2]], [0.014, 0.05, 0.022], 0.005, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.limb([h[0] + 0.01, h[1] + 0.1, h[2]], [h[0] + 0.01, h[1] + 0.17, h[2]], 0.003, 0.002, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.001 });
    });
  },
});
