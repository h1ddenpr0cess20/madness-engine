import { baseballCap } from './metalwear.js';
import { cloth, hold, person } from './person.js';

/**
 * The Street Team: a neon-yellow T-shirt that says the name of an energy
 * drink, a matching cap, cargo shorts, sunglasses on a cord, a lanyard, and
 * a stack of free stickers and flyers held out at arm's length with a
 * smile that has been on since the gates opened. Will not take no. Will
 * not take yes, either, until it has finished the sentence. About 0.95
 * tiles tall, and approaching.
 */

const TEE = cloth('#e8ff3a', '#a8c81a');

export default person({
  name: 'streetteam',
  scale: 1.48,
  b: 1.02,
  shape: { legs: 1.02, girth: 1.02 },
  skin: '#e0b090',
  look: { torso: TEE, sleeve: TEE, cuff: '#e0b090', legs: cloth('#7a7a60', '#52523e'), boot: '#f4f2ee', sole: '#c8c8cc' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a5a8a', brow: '#5a3a1a', mood: 1, blush: 0.6 },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One arm out in front with the flyers held out to whoever is passing, the other waving; a bounce, a bright nod.
      hold(k, 'armR', -1.4, -0.1, -0.15); hold(k, 'foreR', -0.15, 0, 0);
      hold(k, 'armL', -0.5, 0, 0.9 + Math.sin(T * 5) * 0.2); hold(k, 'foreL', -0.5, 0, 0);
      k.move('root', 0, Math.abs(Math.sin(T * 3)) * 0.008, 0);
      k.turn('head', -0.05, Math.sin(T * 0.8) * 0.2, 0);
    },
  },
  extras(s, J) {
    baseballCap(s, { color: '#e8ff3a' });
    s.part('kit', () => {
      // The shades on a cord round the neck, the lanyard and its badge.
      s.torus([0, 0.54, 0.006], 0.052, 0.004, { color: '#16161a', mat: 'cloth', bone: 'neck', k: 0.001 });
      s.box([0, 0.46, 0.078], [0.014, 0.02, 0.003], 0.001, { color: '#f4f2ee', mat: 'plastic', bone: 'chest', k: 0.001 });
      // The stack of flyers in the right hand: white, pink and blue sheets.
      const r = J.handR;
      for (const [i, c] of [[0, '#f4f2ee'], [1, '#ff9ac8'], [2, '#9ad8ff']]) s.box([r[0], r[1] + 0.012 + i * 0.006, r[2] + 0.03], [0.03, 0.002, 0.04], 0.001, { color: c, mat: 'paper', bone: 'handR', k: 0.0005 });
    });
  },
});
