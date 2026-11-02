import { baseballCap } from './metalwear.js';
import { bag, cloth, hold, person, plate, strap } from './person.js';
import { print } from './wardrobe.js';

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
  extras(s, J, { pose }) {
    baseballCap(s, { color: '#e8ff3a' });
    print(s, 'FREE', { y: 0.43, size: 0.03, color: '#16161a', side: 1, width: 0.004 });
    // The lanyard and its badge.
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.056, 0.53, 0.03], [0.04, 0.5, 0.07], [0.032, 0.49, 0.08], [0.02, 0.5, 0.08]], { width: 0.006, thick: 0.002, color: '#16161a', mat: 'cloth', over: ['top', 'head'], bone: 'chest' });
    bag(s, [0.045, 0.47, 0.082], { size: [0.014, 0.02, 0.0018], color: '#f4f2ee', flap: false, over: ['top'], bone: 'chest' });
    // The flyers held out: a few sheets, white, pink and blue, out of the top of the fist, a little fanned.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      [['#f4f2ee', -0.12], ['#ff9ac8', 0], ['#9ad8ff', 0.12]].forEach(([c, a], i) => {
        const dir = G.along.map((v, j) => v * Math.cos(a) - G.up[j] * Math.sin(a)), across = G.along.map((v, j) => v * Math.sin(a) + G.up[j] * Math.cos(a));
        plate(s, G.c.map((v, j) => v + dir[j] * 0.055 + G.out[j] * (0.002 * i - 0.002)), across, dir, [0.032, 0.045, 0.0012], 0.0015, { color: c, mat: 'paper', k: 0.0005 });
      });
    }));
  },
});
